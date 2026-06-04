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
  FSA_TV_SCALE_MIN,
  FSA_TV_SCALE_MAX,
  FSA_GAP_MAX,
  SHELL_SCALE_MIN,
  SHELL_SCALE_MAX,
  SHELL_OFFSET_MAX,
  SHELL_HUE_MAX,
  SCREEN_SCALE_MIN,
  SCREEN_SCALE_MAX,
  SCREEN_OFFSET_MAX,
  DEFAULT_SCREEN_ADJUST,
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
  type FsaParams,
  type ShellTransform,
  type ScreenAdjust,
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

  // Which aspect ratio /obs/full renders. Empty = auto (follow the playing
  // game's layout_type); a LayoutKey forces that type regardless of what's live.
  const forcedType: LayoutKey | '' = guide?.forced_layout_type ?? '';
  const setForced = async (type: LayoutKey | '') => {
    setBusy(true);
    try {
      await obsApi.setForcedLayoutType(type);
      refresh();
    } finally {
      setBusy(false);
    }
  };
  const selectedLabel =
    LAYOUT_TYPE_OPTIONS.find((t) => t.value === selectedType)?.label ?? selectedType;
  const forcedLabel = forcedType
    ? LAYOUT_TYPE_OPTIONS.find((t) => t.value === forcedType)?.label ?? forcedType
    : '';

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

        <nav className="layouts-type-tabs" aria-label="Layout type">
          {LAYOUT_TYPE_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              className={`btn btn-sm ${t.value === selectedType ? 'btn-bloodmoon' : 'btn-outline-light'}`}
              onClick={() => setSelectedType(t.value)}
            >
              {t.label}
              {t.value === forcedType && (
                <span className="layouts-tab-live" title="Forced on /obs/full"> ● live</span>
              )}
            </button>
          ))}
        </nav>

        <div className="layouts-obsfull-row">
          <div className="layouts-obsfull-status">
            <small className="text-white-50">/obs/full is showing:</small>{' '}
            {forcedType ? (
              <strong>Forced — {forcedLabel}</strong>
            ) : (
              <strong>Auto (follows the playing game)</strong>
            )}
          </div>
          <div className="control-btn-row">
            <button
              type="button"
              className="btn btn-sm btn-outline-success"
              disabled={busy || forcedType === selectedType}
              title={`Make /obs/full render the ${selectedLabel} layout regardless of the playing game`}
              onClick={() => setForced(selectedType)}
            >
              Use {selectedLabel} on /obs/full
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              disabled={busy || !forcedType}
              title="Let /obs/full follow the currently-playing game's layout_type"
              onClick={() => setForced('')}
            >
              Back to auto
            </button>
          </div>
          <small className="text-white-50">
            Auto picks the aspect ratio from the live game. Force a type to preview
            or lock <code>/obs/full</code> to it; the active preset for that type
            (below) is what renders.
          </small>
        </div>

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
  fsa: FsaParams;
  shellImageUrl: string;
  shellTransform: ShellTransform;
  screens: Record<string, ScreenAdjust>;
}

function seedDraft(preset: LayoutPreset): Draft {
  const parsed = parsePresetConfig(preset.config, preset.layout_type);
  const regions: Record<string, RegionDraft> = {};
  for (const [rid, r] of Object.entries(parsed.regions)) regions[rid] = { ...r };
  const screens: Record<string, ScreenAdjust> = {};
  for (const [k, s] of Object.entries(parsed.screens)) screens[k] = { ...s };
  return {
    name: preset.name,
    variantId: parsed.variant.id,
    regions,
    captureAlign: { ...parsed.capture },
    fsa: { ...parsed.fsa },
    shellImageUrl: parsed.shellImageUrl,
    shellTransform: { ...parsed.shellTransform },
    screens,
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

  const setFsa = (mut: Partial<FsaParams>) =>
    edit((d) => ({ ...d, fsa: { ...d.fsa, ...mut } }));

  const setShell = (mut: Partial<ShellTransform>) =>
    edit((d) => ({ ...d, shellTransform: { ...d.shellTransform, ...mut } }));

  const setScreen = (i: number, mut: Partial<ScreenAdjust>) =>
    edit((d) => {
      const key = String(i);
      d.screens[key] = { ...DEFAULT_SCREEN_ADJUST, ...d.screens[key], ...mut };
      return d;
    });

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
      fsa: draft.fsa,
      shellImageUrl: draft.shellImageUrl,
      shellTransform: draft.shellTransform,
      screens: draft.screens,
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
        <div className="layouts-controls">
          {/* Arrangement caption sits above the masonry so it doesn't flow in
              as a column item. */}
          <div className="layouts-arrangement-bar">
            Arrangement:{' '}
            <strong className="layouts-arrangement-name">{variant.label}</strong>
          </div>

          <div className="layouts-controls-grid">
            {variant.hasShell && (
              <ShellControls
                url={draft.shellImageUrl}
                transform={draft.shellTransform}
                onUrl={(url) => edit((d) => ({ ...d, shellImageUrl: url }))}
                onTransform={setShell}
              />
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

            {variant.usesFsaParams && <FsaControls fsa={draft.fsa} onChange={setFsa} />}

            {variant.usesScreenAdjust &&
              geometry.captures.map((cap, i) => (
                <ScreenAdjustControls
                  key={i}
                  label={cap.label ?? `Screen ${i + 1}`}
                  adjust={draft.screens[String(i)] ?? DEFAULT_SCREEN_ADJUST}
                  onChange={(mut) => setScreen(i, mut)}
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
        // Compact add-control: one dropdown instead of a wall of ~22 buttons.
        // Resets to the placeholder after each pick (value stays "").
        <select
          className="form-select form-select-sm layouts-add-select"
          value=""
          aria-label="Add element"
          onChange={(e) => {
            const id = e.target.value as ElementId;
            if (id) onToggle(id);
          }}
        >
          <option value="">+ Add element…</option>
          {unselected.map((id) => (
            <option key={id} value={id} title={ELEMENT_META[id].hint}>
              {ELEMENT_META[id].label}
            </option>
          ))}
        </select>
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

/** Console shell image: URL + zoom/nudge so the operator can line the PNG's
 *  screen holes up with the capture boxes (rendered live in the preview). */
function ShellControls({
  url,
  transform,
  onUrl,
  onTransform,
}: {
  url: string;
  transform: ShellTransform;
  onUrl: (url: string) => void;
  onTransform: (mut: Partial<ShellTransform>) => void;
}) {
  return (
    <div className="layouts-region">
      <div className="layouts-region-head">
        <h3>Console shell image</h3>
      </div>
      <label className="layouts-field">
        <small>Image URL (optional)</small>
        <input
          type="text"
          value={url}
          placeholder="https://…/3ds-shell.png"
          onChange={(e) => onUrl(e.target.value)}
        />
        <small className="text-white-50">
          A transparent-screen console PNG drawn around the captures. Use the zoom +
          nudge below to line its screen holes up with the capture boxes in the
          preview.
        </small>
      </label>

      {url && (
        <>
          <TransformControls
            value={transform}
            onChange={onTransform}
            scaleMin={SHELL_SCALE_MIN}
            scaleMax={SHELL_SCALE_MAX}
            offsetMax={SHELL_OFFSET_MAX}
          />
          {/* Colour: hue-rotate the shell PNG on the fly (shell-only; the
              captures are transparent OBS windows). */}
          <label className="layouts-field">
            <small>Hue — {Math.round(transform.hue)}°</small>
            <input
              type="range"
              min={0}
              max={SHELL_HUE_MAX}
              step={1}
              value={transform.hue}
              onChange={(e) => onTransform({ hue: Number(e.target.value) })}
            />
          </label>
        </>
      )}
    </div>
  );
}

interface XformValue {
  scale: number;
  offsetX: number;
  offsetY: number;
}

/** Shared zoom slider + offset inputs + nudge/reset row — used by the shell
 *  image and per-screen controls. */
function TransformControls({
  value,
  onChange,
  scaleMin,
  scaleMax,
  offsetMax,
}: {
  value: XformValue;
  onChange: (mut: Partial<XformValue>) => void;
  scaleMin: number;
  scaleMax: number;
  offsetMax: number;
}) {
  const NUDGE = 10;
  return (
    <>
      <label className="layouts-field">
        <small>Zoom — {Math.round(value.scale * 100)}%</small>
        <input
          type="range"
          min={scaleMin}
          max={scaleMax}
          step={0.01}
          value={value.scale}
          onChange={(e) => onChange({ scale: Number(e.target.value) })}
        />
      </label>
      <div className="layouts-add-row" style={{ marginBottom: '0.6rem' }}>
        <label className="layouts-field layouts-field--inline">
          <small>Offset X (px)</small>
          <input
            type="number"
            min={-offsetMax}
            max={offsetMax}
            value={value.offsetX}
            onChange={(e) => onChange({ offsetX: Number(e.target.value) })}
            style={{ width: 90 }}
          />
        </label>
        <label className="layouts-field layouts-field--inline">
          <small>Offset Y (px)</small>
          <input
            type="number"
            min={-offsetMax}
            max={offsetMax}
            value={value.offsetY}
            onChange={(e) => onChange({ offsetY: Number(e.target.value) })}
            style={{ width: 90 }}
          />
        </label>
      </div>
      <div className="layouts-add-row">
        <small className="text-white-50 align-self-center">Nudge:</small>
        <button type="button" className="btn btn-sm btn-outline-light" onClick={() => onChange({ offsetX: value.offsetX - NUDGE })} aria-label="Nudge left">←</button>
        <button type="button" className="btn btn-sm btn-outline-light" onClick={() => onChange({ offsetX: value.offsetX + NUDGE })} aria-label="Nudge right">→</button>
        <button type="button" className="btn btn-sm btn-outline-light" onClick={() => onChange({ offsetY: value.offsetY - NUDGE })} aria-label="Nudge up">↑</button>
        <button type="button" className="btn btn-sm btn-outline-light" onClick={() => onChange({ offsetY: value.offsetY + NUDGE })} aria-label="Nudge down">↓</button>
        <button type="button" className="btn btn-sm btn-outline-light" onClick={() => onChange({ scale: 1, offsetX: 0, offsetY: 0 })}>Reset</button>
      </div>
    </>
  );
}

/** Per-screen size/position control (3DS / DS top+bottom screens), one per
 *  capture. Moves/zooms the screen within the free (non-panel) area to align it
 *  with the shell image's holes. */
function ScreenAdjustControls({
  label,
  adjust,
  onChange,
}: {
  label: string;
  adjust: ScreenAdjust;
  onChange: (mut: Partial<ScreenAdjust>) => void;
}) {
  return (
    <div className="layouts-region">
      <div className="layouts-region-head">
        <h3>{label}</h3>
        <small className="text-white-50">position &amp; size</small>
      </div>
      <TransformControls
        value={adjust}
        onChange={onChange}
        scaleMin={SCREEN_SCALE_MIN}
        scaleMax={SCREEN_SCALE_MAX}
        offsetMax={SCREEN_OFFSET_MAX}
      />
    </div>
  );
}

/** Four Swords tuning: TV size, TV↔GBA gap, and whether the GBAs are
 *  constrained to the TV's span or spread across the full available space. */
function FsaControls({
  fsa,
  onChange,
}: {
  fsa: FsaParams;
  onChange: (mut: Partial<FsaParams>) => void;
}) {
  return (
    <div className="layouts-region">
      <div className="layouts-region-head">
        <h3>TV &amp; GBA screens</h3>
      </div>
      <label className="layouts-field">
        <small>TV size — {Math.round(fsa.tvScale * 100)}%</small>
        <input
          type="range"
          min={FSA_TV_SCALE_MIN}
          max={FSA_TV_SCALE_MAX}
          step={0.01}
          value={fsa.tvScale}
          onChange={(e) => onChange({ tvScale: Number(e.target.value) })}
        />
      </label>
      <label className="layouts-field layouts-field--inline" style={{ marginBottom: '0.85rem' }}>
        <small>TV ↔ GBA gap (px)</small>
        <input
          type="number"
          min={0}
          max={FSA_GAP_MAX}
          value={fsa.gbaGap}
          onChange={(e) => onChange({ gbaGap: Number(e.target.value) })}
          style={{ width: 90 }}
        />
      </label>
      <label className="layouts-field layouts-field--inline" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.4rem' }}>
        <input
          type="checkbox"
          checked={fsa.gbaSpread}
          onChange={(e) => onChange({ gbaSpread: e.target.checked })}
        />
        <small>Spread GBAs to full space (don't constrain to the TV)</small>
      </label>
    </div>
  );
}

/** Scaled schematic of the stage so the operator can see where the capture and
 *  regions land before activating. Driven by the same `computeGeometry` the OBS
 *  renderer uses, so the preview can't drift from reality. Empty gap zones show
 *  as faint dashed placeholders the operator can fill. */
function PresetPreview({ config, geometry }: { config: PresetConfig; geometry: LayoutGeometry }) {
  const PREVIEW_W = 460;
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
          // Clip the shell to the free capture area, mirroring the OBS render so
          // the operator sees exactly where a zoomed/nudged shell gets cropped
          // at a panel boundary.
          <div
            className="layouts-preview-shell-clip"
            style={{ left: px(geometry.captureArea.left), top: px(geometry.captureArea.top), width: px(geometry.captureArea.width), height: px(geometry.captureArea.height) }}
          >
            <div
              className="layouts-preview-shell"
              style={{ left: px(geometry.shell.left - geometry.captureArea.left), top: px(geometry.shell.top - geometry.captureArea.top), width: px(geometry.shell.width), height: px(geometry.shell.height) }}
            >
              {config.shellImageUrl && (
                <img
                  className="layouts-preview-shell-img"
                  src={config.shellImageUrl}
                  alt=""
                  style={
                    config.shellTransform.hue
                      ? { filter: `hue-rotate(${config.shellTransform.hue}deg)` }
                      : undefined
                  }
                />
              )}
            </div>
          </div>
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
