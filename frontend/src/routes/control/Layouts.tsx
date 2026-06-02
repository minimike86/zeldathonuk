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
  defaultRegionWidth,
  parsePresetConfig,
  type ElementId,
  type RegionId,
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

const LAYOUT_TYPE_OPTIONS: { value: LayoutKey; label: string; wired: boolean }[] = [
  { value: '4x3', label: '4:3 standard', wired: true },
  { value: '16x9', label: '16:9 widescreen', wired: false },
  { value: '3ds', label: 'Nintendo 3DS', wired: false },
  { value: 'ds-top', label: 'DS — top screen', wired: false },
  { value: 'ds-both', label: 'DS — both screens', wired: false },
  { value: 'fsa-split', label: 'Four Swords split', wired: false },
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

  const typeMeta = LAYOUT_TYPE_OPTIONS.find((t) => t.value === selectedType);

  const createPreset = async () => {
    setBusy(true);
    try {
      const variant = LAYOUT_VARIANTS[selectedType][0];
      const width = defaultRegionWidth(variant.regions.length);
      const regions: Record<string, { widthPx: number; elements: ElementId[] }> = {};
      for (const rid of variant.regions) regions[rid] = { widthPx: width, elements: [] };
      await obsApi.createLayoutPreset({
        name: 'New preset',
        layout_type: selectedType,
        config: { variant: variant.id, regions },
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
              {!t.wired && <span className="layouts-soon" title="Not yet wired into /obs/full"> · soon</span>}
            </button>
          ))}
        </nav>

        {typeMeta && !typeMeta.wired && (
          <p className="text-warning" style={{ marginTop: '0.75rem' }}>
            Heads up: the <strong>{typeMeta.label}</strong> renderer isn't wired into{' '}
            <code>/obs/full</code> yet — you can author presets here, but they won't
            change the live overlay until the renderer adopts this layout.
          </p>
        )}

        <div className="control-btn-row" style={{ marginTop: '1rem' }}>
          <button className="btn btn-bloodmoon" disabled={busy} onClick={createPreset}>
            New {typeMeta?.label} preset
          </button>
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
  regions: Record<RegionId, RegionDraft>;
}

function seedDraft(preset: LayoutPreset): Draft {
  const parsed = parsePresetConfig(preset.config, preset.layout_type);
  return {
    name: preset.name,
    variantId: parsed.variant.id,
    regions: {
      left: { ...parsed.regions.left },
      right: { ...parsed.regions.right },
    },
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

  const setRegionWidth = (rid: RegionId, widthPx: number) =>
    edit((d) => {
      d.regions[rid].widthPx = widthPx;
      return d;
    });

  const toggleElement = (rid: RegionId, id: ElementId) =>
    edit((d) => {
      const els = d.regions[rid].elements;
      d.regions[rid].elements = els.includes(id)
        ? els.filter((e) => e !== id)
        : [...els, id];
      return d;
    });

  const moveElement = (rid: RegionId, id: ElementId, dir: -1 | 1) =>
    edit((d) => {
      const els = d.regions[rid].elements;
      const i = els.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= els.length) return d;
      [els[i], els[j]] = [els[j], els[i]];
      return d;
    });

  const draftToConfig = () => {
    const regions: Record<string, RegionDraft> = {};
    for (const rid of variant.regions) regions[rid] = draft.regions[rid];
    return { variant: variant.id, regions };
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
          <label className="layouts-field">
            <small>Capture position</small>
            <select
              value={variant.id}
              onChange={(e) => edit((d) => ({ ...d, variantId: e.target.value }))}
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </label>

          {variant.regions.length === 0 && (
            <p className="text-white-50">This layout has no editable regions yet.</p>
          )}

          {variant.regions.map((rid) => (
            <RegionEditor
              key={rid}
              rid={rid}
              region={draft.regions[rid]}
              onWidth={(w) => setRegionWidth(rid, w)}
              onToggle={(id) => toggleElement(rid, id)}
              onMove={(id, dir) => moveElement(rid, id, dir)}
            />
          ))}
        </div>

        <PresetPreview
          layoutType={preset.layout_type}
          configJson={draftToConfig()}
        />
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

function RegionEditor({
  rid,
  region,
  onWidth,
  onToggle,
  onMove,
}: {
  rid: RegionId;
  region: RegionDraft;
  onWidth: (w: number) => void;
  onToggle: (id: ElementId) => void;
  onMove: (id: ElementId, dir: -1 | 1) => void;
}) {
  const selected = region.elements;
  const unselected = ELEMENT_IDS.filter((e) => !selected.includes(e));
  return (
    <div className="layouts-region">
      <div className="layouts-region-head">
        <h3>{rid === 'left' ? 'Left region' : 'Right region'}</h3>
        <label className="layouts-field layouts-field--inline">
          <small>Width (px)</small>
          <input
            type="number"
            min={REGION_MIN_WIDTH}
            max={REGION_MAX_WIDTH}
            value={region.widthPx}
            onChange={(e) => onWidth(Number(e.target.value))}
            style={{ width: 90 }}
          />
        </label>
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
  const geo = computeGeometry(config, layoutType);
  const px = (n: number) => `${n * scale}px`;

  return (
    <div className="layouts-preview">
      <div
        className="layouts-preview-stage"
        style={{ width: PREVIEW_W, height: STAGE_HEIGHT * scale }}
      >
        <div
          className="layouts-preview-capture"
          style={{ left: px(geo.capture.left), top: px(geo.capture.top), width: px(geo.capture.width), height: px(geo.capture.height) }}
        >
          CAPTURE
        </div>
        {config.variant.regions.map((rid) => {
          const box = geo.regions[rid];
          if (!box) return null;
          return (
            <div
              key={rid}
              className="layouts-preview-region"
              style={{ left: px(box.left), top: px(box.top), width: px(box.width), height: px(box.height) }}
            >
              <span>{rid}</span>
              <small>{config.regions[rid].elements.length} elem</small>
            </div>
          );
        })}
      </div>
      <small className="text-white-50">Stage {STAGE_WIDTH}×{STAGE_HEIGHT} (to scale)</small>
    </div>
  );
}
