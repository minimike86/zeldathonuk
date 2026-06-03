import { useEffect, useMemo, useState } from 'react';
import { obsApi, usePolledQuery, type LayoutKey, type LayoutPreset } from '@/lib/obsApi';
import {
  LAYOUT_VARIANTS,
  ELEMENT_IDS,
  ELEMENT_META,
  REGION_MIN_WIDTH,
  REGION_MAX_WIDTH,
  STAGE_WIDTH,
  STAGE_HEIGHT,
  computeGeometry,
  defaultConfigForVariant,
  parsePresetConfig,
  regionAxis,
  type ElementId,
  type RegionSlot,
  type VariantDef,
  type CaptureAlign,
  type AlignX,
  type AlignY,
  type GapSlot,
  type PresetConfig,
  type LayoutGeometry,
} from '@/routes/obs/layouts/useLayoutPresetConfig';
import './layouts.css';

/**
 * /control/layouts — the OBS layout-preset editor.
 *
 * /control/games assigns each game its aspect ratio (layout_type). This page
 * manages a *library* of presets per aspect ratio: where the game capture sits
 * and which elements show in the freed regions. Exactly one preset is active
 * per layout type; /obs/full renders the active one and re-renders live (~2s)
 * when you activate a different preset. Today only 4x3 is wired into the OBS
 * renderer — the other types are editable but won't change /obs/full yet.
 */

const LAYOUT_TYPE_OPTIONS: { value: LayoutKey; label: string }[] = [
  { value: '4x3', label: '4:3 standard' },
  { value: '16x9', label: '16:9 widescreen' },
  { value: '3ds', label: 'Nintendo 3DS' },
  { value: 'ds-top', label: 'DS — top screen' },
  { value: 'ds-both', label: 'DS — both screens' },
  { value: 'fsa-split', label: 'Four Swords split' },
];

export function LayoutsControl() {
  const [bump, setBump] = useState(0);
  const { data: presets } = usePolledQuery(() => obsApi.layoutPresets(), 5000, [bump]);
  const { data: guide } = usePolledQuery(() => obsApi.layoutGuide(), 5000, [bump]);
  const refresh = () => setBump((b) => b + 1);

  const [selectedType, setSelectedType] = useState<LayoutKey>('4x3');
  const [busy, setBusy] = useState(false);

  const guideOn = guide?.show_guide ?? false;
  const toggleGuide = async () => {
    setBusy(true);
    try {
      await obsApi.setLayoutGuide(!guideOn);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const forType = useMemo(
    () =>
      (presets ?? [])
        .filter((p) => p.layout_type === selectedType)
        .sort((a, b) => Number(b.is_active) - Number(a.is_active) || a.name.localeCompare(b.name)),
    [presets, selectedType],
  );

  // Each arrangement is its own preset — creating one seeds a populated default
  // config for that arrangement (no in-preset variant dropdown). Switch
  // arrangements by activating a different preset.
  const createPreset = async (variant: VariantDef) => {
    setBusy(true);
    try {
      await obsApi.createLayoutPreset({
        name: variant.label,
        layout_type: selectedType,
        config: defaultConfigForVariant(variant),
      });
      refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="control-stack" style={{ display: 'grid', gap: '1.5rem' }}>
      <section className="control-card">
        <h2>Layouts</h2>
        <p className="text-white-50">
          Presets for each OBS game-layout aspect ratio: where the capture sits
          and which elements appear in the freed regions. One preset is{' '}
          <strong>active</strong> per layout type — <code>/obs/full</code> renders
          it for games of that aspect ratio and updates within ~2s when you
          activate another. Games keep their aspect ratio in{' '}
          <code>/control/games</code>.
        </p>

        <div className="layouts-guide-row">
          <button
            type="button"
            className={`btn btn-sm ${guideOn ? 'btn-bloodmoon' : 'btn-outline-light'}`}
            disabled={busy}
            aria-pressed={guideOn}
            onClick={toggleGuide}
          >
            Capture guides: {guideOn ? 'On' : 'Off'}
          </button>
          <small className="text-white-50">
            Draws a hashed border + device label on each capture box in the OBS
            layout pages so you can align the OBS capture sources. Turn off for the
            live scene. Applies to <code>/obs/full</code> and{' '}
            <code>/obs/layout/&lt;type&gt;</code>.
          </small>
        </div>

        <nav className="layouts-type-tabs" aria-label="Layout type">
          {LAYOUT_TYPE_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`btn btn-sm ${t.value === selectedType ? 'btn-bloodmoon' : 'btn-outline-light'}`}
              onClick={() => setSelectedType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="layouts-add-row" style={{ marginTop: '1rem' }}>
          <small className="text-white-50 align-self-center">New preset:</small>
          {LAYOUT_VARIANTS[selectedType].map((v) => (
            <button
              key={v.id}
              className="btn btn-sm btn-bloodmoon"
              disabled={busy}
              onClick={() => createPreset(v)}
            >
              + {v.label}
            </button>
          ))}
        </div>
      </section>

      {forType.length === 0 ? (
        <section className="control-card">
          <p className="text-white-50">No presets for this layout type yet. Create one above.</p>
        </section>
      ) : (
        forType.map((p) => <PresetEditor key={p.id} preset={p} onChanged={refresh} />)
      )}
    </div>
  );
}

// ── Per-preset editor ───────────────────────────────────────────────────────

interface RegionDraft {
  widthPx: number;
  elements: ElementId[];
}
interface Draft {
  name: string;
  variantId: string;
  regions: Record<string, RegionDraft>;
  captureAlign: CaptureAlign;
  shellImageUrl: string;
}

function seedDraft(preset: LayoutPreset): Draft {
  const parsed = parsePresetConfig(preset.config, preset.layout_type);
  const regions: Record<string, RegionDraft> = {};
  for (const [rid, r] of Object.entries(parsed.regions)) regions[rid] = { ...r };
  return {
    name: preset.name,
    variantId: parsed.variant.id,
    regions,
    captureAlign: { ...parsed.capture },
    shellImageUrl: parsed.shellImageUrl,
  };
}

function PresetEditor({ preset, onChanged }: { preset: LayoutPreset; onChanged: () => void }) {
  const [draft, setDraft] = useState<Draft>(() => seedDraft(preset));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);

  // Re-sync from the server when the row changes externally, but never clobber
  // an in-progress edit (mirrors CharitySlideRow).
  useEffect(() => {
    if (dirty) return;
    setDraft(seedDraft(preset));
  }, [preset, dirty]);

  const variants = LAYOUT_VARIANTS[preset.layout_type];
  const variant = variants.find((v) => v.id === draft.variantId) ?? variants[0];

  const edit = (mut: (d: Draft) => Draft) => {
    setDraft((d) => mut(structuredClone(d)));
    setDirty(true);
  };

  // Ensure a draft region entry exists, seeded at the slot's default size.
  const ensureRegion = (d: Draft, rid: string): RegionDraft => {
    if (!d.regions[rid]) {
      const slot = variant.regions.find((s) => s.id === rid);
      d.regions[rid] = { widthPx: slot?.defaultSize ?? REGION_MIN_WIDTH, elements: [] };
    }
    return d.regions[rid];
  };

  const setRegionWidth = (rid: string, widthPx: number) =>
    edit((d) => {
      ensureRegion(d, rid).widthPx = widthPx;
      return d;
    });

  const toggleElement = (rid: string, id: ElementId) =>
    edit((d) => {
      const reg = ensureRegion(d, rid);
      reg.elements = reg.elements.includes(id)
        ? reg.elements.filter((e) => e !== id)
        : [...reg.elements, id];
      return d;
    });

  const moveElement = (rid: string, id: ElementId, dir: -1 | 1) =>
    edit((d) => {
      const els = ensureRegion(d, rid).elements;
      const i = els.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= els.length) return d;
      [els[i], els[j]] = [els[j], els[i]];
      return d;
    });

  const setCaptureAlign = (mut: Partial<CaptureAlign>) =>
    edit((d) => ({ ...d, captureAlign: { ...d.captureAlign, ...mut } }));

  const draftToConfig = () => {
    const regions: Record<string, RegionDraft> = {};
    for (const slot of variant.regions) {
      regions[slot.id] = draft.regions[slot.id] ?? {
        widthPx: slot.defaultSize,
        elements: [],
      };
    }
    // Persist gap zones the operator filled (keyed gap-*). Geometry for them is
    // derived from the capture fit, so only the elements matter.
    for (const [rid, r] of Object.entries(draft.regions)) {
      if (rid.startsWith('gap-') && r.elements.length > 0) {
        regions[rid] = { widthPx: 0, elements: r.elements };
      }
    }
    return {
      variant: variant.id,
      regions,
      capture: draft.captureAlign,
      shellImageUrl: draft.shellImageUrl,
    };
  };

  // Resolve geometry once for both the gap editors and the preview, so the
  // editor's gap list can't drift from what the renderer will produce.
  const parsedConfig = parsePresetConfig(draftToConfig(), preset.layout_type);
  const geometry = computeGeometry(parsedConfig);

  const save = async () => {
    setBusy(true);
    try {
      await obsApi.updateLayoutPreset(preset.id, {
        name: draft.name.trim() || 'Untitled',
        config: draftToConfig(),
      });
      setDirty(false);
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const revert = () => {
    setDraft(seedDraft(preset));
    setDirty(false);
  };

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`control-card layouts-preset${preset.is_active ? ' is-active' : ''}`}>
      <div className="layouts-preset-head">
        <input
          className="layouts-name-input"
          value={draft.name}
          onChange={(e) => edit((d) => ({ ...d, name: e.target.value }))}
          aria-label="Preset name"
        />
        {preset.is_active ? (
          <span className="layouts-active-pill">Active</span>
        ) : (
          <button
            className="btn btn-sm btn-outline-success"
            disabled={busy}
            onClick={() => run(() => obsApi.activateLayoutPreset(preset.id))}
          >
            Activate
          </button>
        )}
        <span style={{ flex: 1 }} />
        <button
          className="btn btn-sm btn-outline-light"
          disabled={busy}
          onClick={() => run(() => obsApi.duplicateLayoutPreset(preset.id))}
        >
          Duplicate
        </button>
        <button
          className="btn btn-sm btn-outline-danger"
          disabled={busy || preset.is_active}
          title={preset.is_active ? 'Activate another preset before deleting this one' : undefined}
          onClick={() => run(() => obsApi.deleteLayoutPreset(preset.id))}
        >
          Delete
        </button>
      </div>

      <div className="layouts-editor-grid">
        <div>
          <div className="layouts-field">
            <small>Arrangement</small>
            <span className="layouts-arrangement-name">{variant.label}</span>
          </div>

          {variant.hasShell && (
            <label className="layouts-field">
              <small>Console shell image URL (optional)</small>
              <input
                type="text"
                value={draft.shellImageUrl}
                placeholder="/assets/img/obs-shells/ds.png"
                onChange={(e) => edit((d) => ({ ...d, shellImageUrl: e.target.value }))}
              />
              <small className="text-white-50">
                A transparent-screen console PNG drawn around the captures. Align its
                screen holes to the capture boxes in the preview.
              </small>
            </label>
          )}

          {variant.regions.length === 0 && (
            <p className="text-white-50">This variant has no editable regions.</p>
          )}

          {variant.regions.map((slot) => (
            <RegionEditor
              key={slot.id}
              slot={slot}
              region={draft.regions[slot.id] ?? { widthPx: slot.defaultSize, elements: [] }}
              onWidth={(w) => setRegionWidth(slot.id, w)}
              onToggle={(id) => toggleElement(slot.id, id)}
              onMove={(id, dir) => moveElement(slot.id, id, dir)}
            />
          ))}

          <CapturePosition align={draft.captureAlign} onChange={setCaptureAlign} />

          {geometry.gaps.map((gap) => (
            <GapEditor
              key={gap.id}
              gap={gap}
              elements={draft.regions[gap.id]?.elements ?? []}
              onToggle={(id) => toggleElement(gap.id, id)}
              onMove={(id, dir) => moveElement(gap.id, id, dir)}
            />
          ))}
        </div>

        <PresetPreview config={parsedConfig} geometry={geometry} />
      </div>

      <div className="control-btn-row" style={{ marginTop: '1rem' }}>
        <button className="btn btn-bloodmoon" disabled={busy || !dirty} onClick={save}>
          Save changes
        </button>
        <button className="btn btn-outline-light" disabled={busy || !dirty} onClick={revert}>
          Revert
        </button>
        {dirty && <small className="text-warning align-self-center">Unsaved changes</small>}
      </div>
    </section>
  );
}

const REGION_LABELS: Record<string, string> = {
  left: 'Left panel',
  right: 'Right panel',
  top: 'Top panel',
  bottom: 'Bottom panel',
  'gap-left': 'Left gap',
  'gap-right': 'Right gap',
  'gap-top': 'Top gap',
  'gap-bottom': 'Bottom gap',
};

/** The selected-element list + an "add" palette — shared by carved-zone and
 *  gap editors. */
function ElementList({
  selected,
  onToggle,
  onMove,
}: {
  selected: ElementId[];
  onToggle: (id: ElementId) => void;
  onMove: (id: ElementId, dir: -1 | 1) => void;
}) {
  const unselected = ELEMENT_IDS.filter((e) => !selected.includes(e));
  return (
    <>
      <ol className="layouts-element-list">
        {selected.length === 0 && (
          <li className="text-white-50" style={{ listStyle: 'none' }}>No elements — add some below.</li>
        )}
        {selected.map((id, i) => (
          <li key={id} className="layouts-element-row">
            <span className="layouts-element-name" title={ELEMENT_META[id].hint}>
              {ELEMENT_META[id].label}
            </span>
            <span className="control-btn-row">
              <button className="btn btn-sm btn-outline-light" disabled={i === 0} onClick={() => onMove(id, -1)} aria-label="Move up">↑</button>
              <button className="btn btn-sm btn-outline-light" disabled={i === selected.length - 1} onClick={() => onMove(id, 1)} aria-label="Move down">↓</button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => onToggle(id)} aria-label="Remove">✕</button>
            </span>
          </li>
        ))}
      </ol>

      {unselected.length > 0 && (
        <div className="layouts-add-row">
          <small className="text-white-50">Add:</small>
          {unselected.map((id) => (
            <button
              key={id}
              className="btn btn-sm btn-outline-light"
              title={ELEMENT_META[id].hint}
              onClick={() => onToggle(id)}
            >
              + {ELEMENT_META[id].label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function RegionEditor({
  slot,
  region,
  onWidth,
  onToggle,
  onMove,
}: {
  slot: RegionSlot;
  region: RegionDraft;
  onWidth: (w: number) => void;
  onToggle: (id: ElementId) => void;
  onMove: (id: ElementId, dir: -1 | 1) => void;
}) {
  // Side panels (left/right) resize by width; top/bottom strips by height.
  const sizeLabel = regionAxis(slot.edge) === 'width' ? 'Width (px)' : 'Height (px)';
  return (
    <div className="layouts-region">
      <div className="layouts-region-head">
        <h3>{REGION_LABELS[slot.id] ?? `${slot.id} panel`}</h3>
        {slot.resizable && (
          <label className="layouts-field layouts-field--inline">
            <small>{sizeLabel}</small>
            <input
              type="number"
              min={REGION_MIN_WIDTH}
              max={REGION_MAX_WIDTH}
              value={region.widthPx}
              onChange={(e) => onWidth(Number(e.target.value))}
              style={{ width: 90 }}
            />
          </label>
        )}
      </div>
      <ElementList selected={region.elements} onToggle={onToggle} onMove={onMove} />
    </div>
  );
}

/** Editor for a whitespace gap left around the capture(s). Its size is derived
 *  from the capture fit (shown read-only), so there's no size input. */
function GapEditor({
  gap,
  elements,
  onToggle,
  onMove,
}: {
  gap: GapSlot;
  elements: ElementId[];
  onToggle: (id: ElementId) => void;
  onMove: (id: ElementId, dir: -1 | 1) => void;
}) {
  return (
    <div className="layouts-region layouts-region--gap">
      <div className="layouts-region-head">
        <h3>{REGION_LABELS[gap.id] ?? 'Gap'}</h3>
        <small className="text-white-50">{gap.box.width}×{gap.box.height}px free</small>
      </div>
      <ElementList selected={elements} onToggle={onToggle} onMove={onMove} />
    </div>
  );
}

const ALIGN_XS: AlignX[] = ['left', 'center', 'right'];
const ALIGN_YS: AlignY[] = ['top', 'center', 'bottom'];

/** 3×3 grid to position the capture within its available space. Pushing it to
 *  an edge/corner frees whitespace that becomes a gap panel zone. */
function CapturePosition({
  align,
  onChange,
}: {
  align: CaptureAlign;
  onChange: (mut: Partial<CaptureAlign>) => void;
}) {
  return (
    <div className="layouts-region">
      <div className="layouts-region-head">
        <h3>Capture position</h3>
        <small className="text-white-50">Push the capture to free space for panels</small>
      </div>
      <div className="layouts-align-grid" role="group" aria-label="Capture position">
        {ALIGN_YS.map((y) =>
          ALIGN_XS.map((x) => {
            const on = align.x === x && align.y === y;
            return (
              <button
                key={`${x}-${y}`}
                type="button"
                className={`layouts-align-cell${on ? ' is-active' : ''}`}
                aria-label={`${y} ${x}`}
                aria-pressed={on}
                onClick={() => onChange({ x, y })}
              />
            );
          }),
        )}
      </div>
    </div>
  );
}

/** Scaled schematic of the stage so the operator can see where the capture and
 *  regions land before activating. Driven by the same `computeGeometry` the OBS
 *  renderer uses, so the preview can't drift from reality. Empty gap zones show
 *  as faint dashed placeholders the operator can fill. */
function PresetPreview({ config, geometry }: { config: PresetConfig; geometry: LayoutGeometry }) {
  const PREVIEW_W = 380;
  const scale = PREVIEW_W / STAGE_WIDTH;
  const px = (n: number) => `${n * scale}px`;
  const filled = new Set(Object.keys(geometry.regions));

  return (
    <div className="layouts-preview">
      <div
        className="layouts-preview-stage"
        style={{ width: PREVIEW_W, height: STAGE_HEIGHT * scale }}
      >
        {geometry.shell && (
          <div
            className="layouts-preview-shell"
            style={{ left: px(geometry.shell.left), top: px(geometry.shell.top), width: px(geometry.shell.width), height: px(geometry.shell.height) }}
          />
        )}
        {geometry.captures.map((cap, i) => (
          <div
            key={i}
            className="layouts-preview-capture"
            style={{ left: px(cap.left), top: px(cap.top), width: px(cap.width), height: px(cap.height) }}
          >
            {cap.label ?? 'CAPTURE'}
          </div>
        ))}
        {Object.entries(geometry.regions).map(([rid, box]) => (
          <div
            key={rid}
            className="layouts-preview-region"
            style={{ left: px(box.left), top: px(box.top), width: px(box.width), height: px(box.height) }}
          >
            <span>{REGION_LABELS[rid] ?? rid}</span>
            <small>{config.regions[rid]?.elements.length ?? 0} elem</small>
          </div>
        ))}
        {geometry.gaps
          .filter((g) => !filled.has(g.id))
          .map((g) => (
            <div
              key={g.id}
              className="layouts-preview-region layouts-preview-gap"
              style={{ left: px(g.box.left), top: px(g.box.top), width: px(g.box.width), height: px(g.box.height) }}
            >
              <span>gap</span>
              <small>add panels</small>
            </div>
          ))}
      </div>
      <small className="text-white-50">Stage {STAGE_WIDTH}×{STAGE_HEIGHT} (to scale)</small>
    </div>
  );
}
