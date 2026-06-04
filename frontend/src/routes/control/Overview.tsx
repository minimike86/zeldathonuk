import { useState } from 'react';
import { Link } from 'react-router';
import { obsApi, usePolledQuery, type LayoutKey } from '@/lib/obsApi';

export function ControlOverview() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 5000);
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, 2000);
  const { data: totals } = usePolledQuery(
    () =>
      event
        ? obsApi.donationTotals(event.id)
        : Promise.resolve({ by_platform: [], grand_total: '0', donation_count: 0 }),
    5000,
  );
  const { data: brb } = usePolledQuery(obsApi.currentBrb, 2000);

  const entry = cp?.schedule_entry_detail ?? null;
  const currentTitle = entry?.game?.title ?? entry?.display_title ?? entry?.title ?? '—';
  const currentSub = entry
    ? entry.game
      ? `${entry.game.platform} · ${entry.runners.map((r) => r.name).join(', ') || '—'}`
      : `${entry.slot_type} slot`
    : 'nothing selected';

  return (
    <>
      <div className="control-card">
        <h2>Now</h2>
        <div className="d-flex flex-wrap gap-4">
          <Tile label="Active event" value={event?.name ?? '—'} sub={event ? new Date(event.start_time).toLocaleString('en-GB') : 'no active event'} />
          <Tile
            label="Currently playing"
            value={currentTitle}
            sub={currentSub}
          />
          <Tile
            label="BRB"
            value={brb ? `until ${new Date(brb.target_time).toLocaleTimeString('en-GB')}` : 'off'}
            sub={brb?.message ?? ''}
          />
          <Tile
            label="Raised so far"
            value={`£${totals?.grand_total ?? '0.00'}`}
            sub={`${totals?.donation_count ?? 0} donations`}
          />
        </div>
      </div>

      <LayoutQuickSwitch gameLayoutType={entry?.game?.layout_type ?? null} />

      <div className="control-card">
        <h2>OBS browser sources</h2>
        <p>
          Drop these URLs into OBS Browser sources. They poll for updates every 2 seconds.
        </p>
        <ul style={{ columnCount: 2, columnGap: '2rem' }}>
          {[
            // Recommended single source — picks the right layout from the
            // currently-playing game and pins the omnibar to the bottom
            // strip. Use this instead of pairing a layout + omnibar source
            // by hand. Listed first so it's the obvious default.
            {
              path: '/obs/full',
              label: 'Unified (auto layout + omnibar)',
              highlight: true,
            },
            { path: '/obs/layout/16x9', label: '16:9 layout' },
            { path: '/obs/layout/4x3', label: '4:3 layout' },
            { path: '/obs/layout/3ds', label: '3DS layout' },
            { path: '/obs/layout/ds-top', label: 'DS top only' },
            { path: '/obs/layout/ds-both', label: 'DS both screens' },
            { path: '/obs/layout/fsa-split', label: 'FSA split' },
            { path: '/obs/audio-countdown', label: 'Pre-stream countdown' },
            { path: '/obs/brb', label: 'BRB' },
            { path: '/obs/tts', label: 'TTS' },
            { path: '/obs/omnibar', label: 'Omnibar' },
            { path: '/obs/chest-announcer', label: 'Chest announcer' },
          ].map((s) => (
            <li key={s.path}>
              <Link
                to={s.path}
                className={s.highlight ? 'text-warning fw-bold' : 'text-warning'}
              >
                {s.label}
              </Link>{' '}
              <code className="small text-white-50">{s.path}</code>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/** Compact aspect-ratio labels for the override chips. */
const LAYOUT_TYPE_CHIPS: { value: LayoutKey; label: string }[] = [
  { value: '4x3', label: '4:3' },
  { value: '16x9', label: '16:9' },
  { value: '3ds', label: '3DS' },
  { value: 'ds-top', label: 'DS top' },
  { value: 'ds-both', label: 'DS both' },
  { value: 'fsa-split', label: 'FSA' },
];

/**
 * Live layout control for /obs/full. Two levels:
 *   1. Aspect-ratio TYPE — Auto (follow the on-screen game) or a forced type
 *      that overrides it (LayoutGuideSettings.forced_layout_type).
 *   2. The active PRESET within whatever type is actually live, so the operator
 *      can flip the capture position mid-game with one click.
 * Both drive /obs/full within ~2s. Full authoring lives in /control/layouts.
 */
function LayoutQuickSwitch({ gameLayoutType }: { gameLayoutType: LayoutKey | null }) {
  const [bump, setBump] = useState(0);
  const { data: guide } = usePolledQuery(() => obsApi.layoutGuide(), 3000, [bump]);
  const [busy, setBusy] = useState(false);

  const forced: LayoutKey | '' = guide?.forced_layout_type ?? '';
  const guideOn = guide?.show_guide ?? false;
  // What /obs/full actually renders: the forced type wins, else the on-screen
  // game's type. The preset list is scoped to this so it always matches screen.
  const effectiveType: LayoutKey | null = forced || gameLayoutType;

  const { data: presets } = usePolledQuery(
    () => (effectiveType ? obsApi.layoutPresets(effectiveType) : Promise.resolve([])),
    3000,
    [bump, effectiveType],
  );
  const list = (presets ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));

  const setForced = async (type: LayoutKey | '') => {
    setBusy(true);
    try {
      await obsApi.setForcedLayoutType(type);
      setBump((b) => b + 1);
    } finally {
      setBusy(false);
    }
  };

  const activate = async (id: number) => {
    setBusy(true);
    try {
      await obsApi.activateLayoutPreset(id);
      setBump((b) => b + 1);
    } finally {
      setBusy(false);
    }
  };

  const toggleGuide = async () => {
    setBusy(true);
    try {
      await obsApi.setLayoutGuide(!guideOn);
      setBump((b) => b + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="control-card">
      <h2>Layout</h2>

      {/* Aspect-ratio override: Auto follows the on-screen game; a forced type
          overrides it on /obs/full regardless of what's playing. */}
      <p className="text-white-50 mb-1">
        Aspect ratio on <code>/obs/full</code> — <strong>Auto</strong> follows the
        on-screen game; force one to override it.
      </p>
      <div className="control-btn-row" style={{ flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${!forced ? 'btn-bloodmoon' : 'btn-outline-light'}`}
          disabled={busy || !forced}
          onClick={() => setForced('')}
          aria-current={!forced ? 'true' : undefined}
        >
          Auto{!forced && gameLayoutType ? ` (${gameLayoutType})` : ''}
          {!forced && ' ✓'}
        </button>
        {LAYOUT_TYPE_CHIPS.map((t) => (
          <button
            key={t.value}
            className={`btn btn-sm ${forced === t.value ? 'btn-bloodmoon' : 'btn-outline-light'}`}
            disabled={busy || forced === t.value}
            onClick={() => setForced(t.value)}
            aria-current={forced === t.value ? 'true' : undefined}
          >
            {t.label}
            {forced === t.value && ' ✓'}
          </button>
        ))}
      </div>
      {forced && forced !== gameLayoutType && (
        <p className="small text-warning mt-1 mb-0">
          Forcing <code>{forced}</code> — on-screen game is{' '}
          <code>{gameLayoutType ?? 'none'}</code>.
        </p>
      )}

      {/* Preset switcher, scoped to whatever type is actually live. */}
      <h3 style={{ marginTop: '1rem' }}>Preset</h3>
      {!effectiveType ? (
        <p className="text-white-50 mb-0">
          No game on screen and no forced type — pick an aspect ratio above or set a
          currently-playing game. Manage presets in{' '}
          <Link to="/control/layouts" className="text-warning">Layouts</Link>.
        </p>
      ) : list.length === 0 ? (
        <p className="text-white-50 mb-0">
          No presets for the <code>{effectiveType}</code> layout.{' '}
          <Link to="/control/layouts" className="text-warning">Create one</Link>.
        </p>
      ) : (
        <>
          <p className="text-white-50">
            Active arrangement for the live <code>{effectiveType}</code> layout —
            switches <code>/obs/full</code> live. Edit in{' '}
            <Link to="/control/layouts" className="text-warning">Layouts</Link>.
          </p>
          <div className="control-btn-row" style={{ flexWrap: 'wrap' }}>
            {list.map((p) => (
              <button
                key={p.id}
                className={`btn btn-sm ${p.is_active ? 'btn-bloodmoon' : 'btn-outline-light'}`}
                disabled={busy || p.is_active}
                onClick={() => activate(p.id)}
                aria-current={p.is_active ? 'true' : undefined}
              >
                {p.name}
                {p.is_active && ' ✓'}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Capture-alignment guides for OBS — global toggle that affects every
          layout page. Lives here so the operator can flip it from the dashboard. */}
      <h3 style={{ marginTop: '1rem' }}>Capture guides</h3>
      <div className="d-flex flex-wrap align-items-center gap-3">
        <button
          type="button"
          className={`btn btn-sm ${guideOn ? 'btn-bloodmoon' : 'btn-outline-light'}`}
          disabled={busy}
          aria-pressed={guideOn}
          onClick={toggleGuide}
        >
          Capture guides: {guideOn ? 'On' : 'Off'}
        </button>
        <small className="text-white-50" style={{ flex: 1, minWidth: 220 }}>
          Draws a hashed border + device label on each capture box in the OBS
          layout pages so you can align the OBS capture sources. Turn off for the
          live scene. Applies to <code>/obs/full</code> and{' '}
          <code>/obs/layout/&lt;type&gt;</code>.
        </small>
      </div>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div
      style={{
        flex: '1 1 200px',
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid rgba(185,39,83,0.4)',
        borderRadius: 6,
        padding: '0.75rem 1rem',
      }}
    >
      <div className="small text-white-50">{label}</div>
      <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '1.4rem', lineHeight: 1.2 }}>
        {value}
      </div>
      {sub && <div className="small text-white-50 mt-1">{sub}</div>}
    </div>
  );
}
