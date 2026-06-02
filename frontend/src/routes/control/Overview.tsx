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

      <LayoutQuickSwitch layoutType={entry?.game?.layout_type ?? null} />

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

/**
 * Compact live switcher for the active layout preset. Scoped to the
 * currently-playing game's aspect ratio (the only one on screen), so the
 * operator can flip the capture position mid-game with one click — /obs/full
 * follows within ~2s. Full authoring lives in /control/layouts.
 */
function LayoutQuickSwitch({ layoutType }: { layoutType: LayoutKey | null }) {
  const [bump, setBump] = useState(0);
  const { data: presets } = usePolledQuery(
    () => (layoutType ? obsApi.layoutPresets(layoutType) : Promise.resolve([])),
    3000,
    [bump, layoutType],
  );
  const [busy, setBusy] = useState(false);

  const list = (presets ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));

  const activate = async (id: number) => {
    setBusy(true);
    try {
      await obsApi.activateLayoutPreset(id);
      setBump((b) => b + 1);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="control-card">
      <h2>Layout preset</h2>
      {!layoutType ? (
        <p className="text-white-50">
          No game on screen — set a currently-playing game to switch its layout.
          Manage presets in <Link to="/control/layouts" className="text-warning">Layouts</Link>.
        </p>
      ) : list.length === 0 ? (
        <p className="text-white-50">
          No presets for the <code>{layoutType}</code> layout.{' '}
          <Link to="/control/layouts" className="text-warning">Create one</Link>.
        </p>
      ) : (
        <>
          <p className="text-white-50">
            Active arrangement for the on-screen <code>{layoutType}</code> game —
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
