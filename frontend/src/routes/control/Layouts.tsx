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
  const refresh = () => setBump((b) => b + 1);

  const [selectedType, setSelectedType] = useState<LayoutKey>('4x3');
  const [busy, setBusy] = useState(false);

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

  const draftToConfig = () => {
    const regions: Record<string, RegionDraft> = {};
    for (const slot of variant.regions) {
      regions[slot.id] = draft.regions[slot.id] ?? {
        widthPx: slot.defaultSize,
        elements: [],
      };
    }
    return { variant: variant.id, regions, shellImageUrl: draft.shellImageUrl };
  };

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
        </div>

        <PresetPreview layoutType={preset.layout_type} configJson={draftToConfig()} />
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
};

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
  const selected = region.elements;
  const unselected = ELEMENT_IDS.filter((e) => !selected.includes(e));
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
    </div>
  );
}

/** Scaled schematic of the stage so the operator can see where the capture and
 *  regions land before activating. Uses the same `computeGeometry` the OBS
 *  renderer uses, so the preview can't drift from reality. */
function PresetPreview({
  layoutType,
  configJson,
}: {
  layoutType: LayoutKey;
  configJson: { variant: string; regions: Record<string, RegionDraft> };
}) {
  const PREVIEW_W = 380;
  const scale = PREVIEW_W / STAGE_WIDTH;
  const config = parsePresetConfig(configJson, layoutType);
  const geo = computeGeometry(config);
  const px = (n: number) => `${n * scale}px`;

  return (
    <div className="layouts-preview">
      <div
        className="layouts-preview-stage"
        style={{ width: PREVIEW_W, height: STAGE_HEIGHT * scale }}
      >
        {geo.shell && (
          <div
            className="layouts-preview-shell"
            style={{ left: px(geo.shell.left), top: px(geo.shell.top), width: px(geo.shell.width), height: px(geo.shell.height) }}
          />
        )}
        {geo.captures.map((cap, i) => (
          <div
            key={i}
            className="layouts-preview-capture"
            style={{ left: px(cap.left), top: px(cap.top), width: px(cap.width), height: px(cap.height) }}
          >
            {cap.label ?? 'CAPTURE'}
          </div>
        ))}
        {config.variant.regions.map((slot) => {
          const box = geo.regions[slot.id];
          if (!box) return null;
          return (
            <div
              key={slot.id}
              className="layouts-preview-region"
              style={{ left: px(box.left), top: px(box.top), width: px(box.width), height: px(box.height) }}
            >
              <span>{slot.id}</span>
              <small>{config.regions[slot.id]?.elements.length ?? 0} elem</small>
            </div>
          );
        })}
      </div>
      <small className="text-white-50">Stage {STAGE_WIDTH}×{STAGE_HEIGHT} (to scale)</small>
    </div>
  );
}
