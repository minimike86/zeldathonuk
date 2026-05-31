/**
 * Shared layout primitives used by every /obs/layout/* page.
 *
 * Visual treatment follows the legacy Angular widescreen layout:
 *   - Game frame and camera frame are TRANSPARENT (OBS sources sit
 *     behind them).
 *   - Runner-timer and game-description blocks use the bloodmoon radial
 *     gradient with the Hylian-symbol watermark.
 *   - All sub-blocks are absolutely positioned inside an .obs-stage
 *     1920×(1080 − omnibar) frame.
 */
import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitch, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { Runner, ScheduleEntry, TimerRun } from '@/lib/obsApi';
import { onEventChanged } from '@/lib/eventBus';
// Stage / GameFrame / camera / ad / card styles live in obs.css. Import
// it here (rather than only in the /obs index page) so direct navigation
// to /obs/layout/<key> actually loads the stylesheet — otherwise every
// layout primitive renders as an unstyled, zero-size div.
import '../obs.css';

export function Stage({
  children,
  variant,
}: {
  children: React.ReactNode;
  /** Optional layout-specific modifier — e.g. "3ds" re-skins the
   *  shared bloodmoon-pink cards to the legacy darkgoldenrod theme. */
  variant?: '3ds';
}) {
  const className = variant ? `obs-stage layout-${variant}` : 'obs-stage';
  return <div className={className}>{children}</div>;
}

/** Transparent rectangle that reserves space for the OBS game-capture
 * source positioned underneath this browser source. */
export function GameFrame({
  style,
  src,
}: {
  style: React.CSSProperties;
  src?: string | null;
}) {
  return (
    <div className="game-frame" style={style}>
      {src ? (
        <iframe
          src={src}
          title="game capture"
          style={{ width: '100%', height: '100%', border: 0, background: 'transparent' }}
          allowFullScreen
        />
      ) : null}
    </div>
  );
}

/** Transparent camera reservation — only the side accent bars render. */
export function CameraFrame({ style }: { style: React.CSSProperties }) {
  return <div className="obs-camera-frame" style={style} />;
}

/** SpecialEffect's logo is constant; the GameBlast brand rebrands each
 *  year, so the second slot pulls from `Event.gameblast_logo_url`
 *  (editable in /control/events). The hardcoded URL here is only used
 *  as a fallback when no active event has set one yet. */
const SPONSOR_SPECIALEFFECT_LOGO = '/assets/img/charity/specialeffect/specialeffect-logo.svg';
const SPONSOR_GAMEBLAST_FALLBACK = '/assets/img/GB22_Logo_Linear_DarkBGs_Small.png';

/** Rotating background images that sit behind the charity logo — Zelda
 * artwork, ZeldathonUK team photos, SpecialEffect campaign photos. Same
 * three pools the legacy ad-panel pulled from. */
const SPONSOR_BG_IMAGES = [
  '/assets/img/obs-team/304033_174345772646092_2089677901_n.jpg',
  '/assets/img/obs-team/470559_287752961305372_1293519474_o.jpg',
  '/assets/img/obs-team/901591_455444951202838_207106665_o.jpg',
  '/assets/img/obs-team/903837_455445134536153_340454438_o.jpg',
  '/assets/img/obs-team/15940510_1232235973523728_1243498660112768403_n.png',
  '/assets/img/obs-team/20190122_023316.jpg',
  '/assets/img/obs-team/52797088_2087154738031843_4432511626494607360_o.jpg',
  '/assets/img/obs-team/D0N20WEWkAIoQR9.jpg',
  '/assets/img/obs-team/MikeWarnerjpggallery.jpg',
  '/assets/img/obs-bg/Links_Artwork.png',
  '/assets/img/obs-bg/Zelda-DLC-header.jpg',
  '/assets/img/obs-bg/Zelda-header.jpg',
  '/assets/img/obs-bg/EQFV1P4U4AEMBhG.jpg',
  '/assets/img/obs-bg/EQFV2QoU8AAsiGM.jpg',
  '/assets/img/obs-bg/EQFVz-PVUAEGpUM.jpg',
  '/assets/img/obs-bg/HEvAqqv.png',
  '/assets/img/obs-bg/EsHr6JBXMAE9sxV.jpg',
  '/assets/img/obs-bg/EtpZSlGUcAMyNSC.jpg',
  '/assets/img/obs-specialeffect/5hfgyufk8.jpg',
  '/assets/img/obs-specialeffect/1310-1024x576.jpg',
  '/assets/img/obs-specialeffect/20170930_STP003_0.jpg',
  '/assets/img/obs-specialeffect/ajaygameblast.jpg',
  '/assets/img/obs-specialeffect/disabled_gamers_1550906990.jpg',
  '/assets/img/obs-specialeffect/DzIZDVaX4AQXHMn.jpg',
  '/assets/img/obs-specialeffect/DzIZEwXWsAAxCQW.jpg',
  '/assets/img/obs-specialeffect/specialeffect_picjpeg.jpg',
  '/assets/img/obs-specialeffect/specialeffectcontr_610.jpg',
  '/assets/img/obs-specialeffect/Xbox-Adaptive-Controller-Microsoft-experimenta-4-800x675.jpg',
  '/assets/img/obs-specialeffect/zephyrus3.jpg',
];

const SPONSOR_SWAP_MS = 15_000;

/**
 * Ad / sponsor block — randomised background image behind the active
 * charity logo. Both swap every 15s (logo flips between SpecialEffect
 * and the current GameBlast brand; background is picked at random from
 * the pool). Mirrors the legacy `Ds3AdPanelComponent` exactly so the
 * panel doesn't render as an empty gold rectangle.
 */
export function AdPanel({ style }: { style: React.CSSProperties }) {
  // Push from /control/events: bump on broadcast so the carousel logo
  // updates in the next render rather than after the next 10s poll.
  const [eventBump, setEventBump] = useState(0);
  useEffect(() => onEventChanged(() => setEventBump((b) => b + 1)), []);
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000, [eventBump]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), SPONSOR_SWAP_MS);
    return () => window.clearInterval(id);
  }, []);
  // Two-logo carousel: SpecialEffect (constant) alternates with the
  // active event's GameBlast logo (refreshed each campaign year via the
  // /control/events form). Memoised so a re-render that doesn't touch
  // the event's logo doesn't reshuffle the rotation.
  const logos = useMemo(
    () => [
      SPONSOR_SPECIALEFFECT_LOGO,
      event?.gameblast_logo_url || SPONSOR_GAMEBLAST_FALLBACK,
    ],
    [event?.gameblast_logo_url],
  );
  const logoSrc = logos[tick % logos.length];
  // Re-pick a random background each time the logo swaps. Seed off `tick`
  // so the choice is stable across renders within a swap window.
  const bgIndex = useMemo(
    () => Math.floor(Math.random() * SPONSOR_BG_IMAGES.length),
    [tick],
  );
  const bgSrc = SPONSOR_BG_IMAGES[bgIndex];

  return (
    <div className="obs-ad-panel" style={style}>
      <div
        className="obs-ad-panel-bg"
        style={{ backgroundImage: `url("${bgSrc}")` }}
      />
      <div className="obs-ad-panel-logo">
        <img src={logoSrc} alt="Charity" />
      </div>
    </div>
  );
}

function useCurrentEntry() {
  const { data } = usePolledQuery(obsApi.currentlyPlaying, 2000);
  return data?.schedule_entry_detail ?? null;
}

function useNow(intervalMs: number = 250): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Runner names + play time + alternating local/total time, all in one
 * bloodmoon card. */
export function RunnerTimerCard({ style }: { style: React.CSSProperties }) {
  const entry = useCurrentEntry();
  const now = useNow(250);
  const runners = entry?.runners ?? [];
  const seconds = computeTimerSeconds(entry?.timer ?? null, now);
  // Alternate between local clock and total stream time on a 30s cadence,
  // matching the legacy timer's behaviour.
  const showTotal = Math.floor(now / 30000) % 2 === 0;
  const localTime = fmtClock(new Date(now));
  // Approximate total event time using the active event's start time.
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000);
  const eventStartMs = event ? Date.parse(event.start_time) : 0;
  const totalSeconds = event
    ? Math.max(0, Math.floor((now - eventStartMs) / 1000))
    : 0;

  return (
    <div className="obs-runner-timer-card" style={style}>
      <div className="obs-rt-row">
        <span className="obs-rt-label">Runner:</span>
        <div className="obs-rt-runners">
          {runners.length === 0 ? (
            <span className="obs-rt-runner-name">—</span>
          ) : (
            runners.map((r) => <RunnerChip key={r.id} runner={r} />)
          )}
        </div>
      </div>
      <div className="obs-rt-row">
        <span className="obs-rt-label">Play&nbsp;Time:</span>
        <div className="obs-rt-timer">{formatHms(seconds)}</div>
        <div className="obs-rt-side">
          {showTotal ? (
            <>
              <span className="obs-rt-side-label">Total Play Time:</span>
              <span className="obs-rt-side-value">{formatHms(totalSeconds)}</span>
            </>
          ) : (
            <>
              <span className="obs-rt-side-label">Local Time:</span>
              <span className="obs-rt-side-value">{localTime}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RunnerChip({ runner }: { runner: Runner }) {
  const url = runner.channel_url.toLowerCase();
  const icon = url.includes('twitch')
    ? faTwitch
    : url.includes('youtube')
      ? faYoutube
      : null;
  return (
    <span className="obs-rt-runner-name">
      {icon && <FontAwesomeIcon icon={icon} className="me-2" />}
      {runner.name}
    </span>
  );
}

/** Game description: split title, badges (playthrough type from notes), and
 * a row of platform · release year · ETA. */
export function GameDescCard({ style }: { style: React.CSSProperties }) {
  const entry = useCurrentEntry();
  if (!entry) {
    return (
      <div className="obs-game-desc-card" style={style}>
        <div className="obs-gd-empty">No game selected.</div>
      </div>
    );
  }
  const game = entry.game;
  const title = entry.display_title || game?.title || '—';
  const [titleA, titleB] = splitOnColon(title);
  // Playthrough badges come from the entry's `notes` (comma-separated)
  // since DonationPage badges aren't a thing on a schedule entry. e.g.
  //   notes = "100%, Glitchless"   →   two pills.
  const badges = parseBadges(entry.notes);
  return (
    <div className="obs-game-desc-card" style={style}>
      {game?.box_art_url && (
        <img
          className="obs-gd-art"
          src={game.box_art_url}
          alt=""
          aria-hidden
        />
      )}
      <div className="obs-gd-body">
        <div className="obs-gd-title">
          <div className="obs-gd-title-line">{titleA}</div>
          {titleB && <div className="obs-gd-title-line">{titleB}</div>}
        </div>
        {badges.length > 0 && (
          <div className="obs-gd-badges">
            {badges.map((b) => (
              <span key={b} className="obs-gd-badge">
                {b}
              </span>
            ))}
          </div>
        )}
        <div className="obs-gd-meta">
          <div className="obs-gd-meta-cell obs-gd-meta-cell--left">
            <div className="obs-gd-meta-value">
              {game?.platform.replace('Nintendo', '').trim() || '—'}
            </div>
            <div className="obs-gd-meta-label">Platform</div>
          </div>
          <div className="obs-gd-meta-cell obs-gd-meta-cell--mid">
            <div className="obs-gd-meta-value">
              {game?.release_year ?? '—'}
            </div>
            <div className="obs-gd-meta-label">Release Year</div>
          </div>
          <div className="obs-gd-meta-cell obs-gd-meta-cell--right">
            <div className="obs-gd-meta-value">
              {fmtEta(entry.effective_minutes)}
            </div>
            <div className="obs-gd-meta-label">ETA to complete</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Legacy primitives kept for the non-widescreen layouts (Standard,
 * ThreeDs, DsBoth, DsTop, FsaSplit). They use the older side-panel
 * structure with stacked blocks; the new RunnerTimerCard / GameDescCard
 * are used by the bespoke Widescreen layout. */

export function SidePanel({
  position,
}: {
  position: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    width: string;
    height?: string;
  };
}) {
  const entry = useCurrentEntry();
  return (
    <aside className="side-panel" style={position}>
      <GameDescription entry={entry} />
      <RunnerNames entry={entry} />
      <Camera />
      <Timer entry={entry} />
      <ItemsGrid entry={entry} />
    </aside>
  );
}

function GameDescription({ entry }: { entry: ScheduleEntry | null }) {
  if (!entry) {
    return (
      <div className="panel-block">
        <div className="panel-block-title">Currently playing</div>
        <div className="text-white-50">No game selected.</div>
      </div>
    );
  }
  const game = entry.game;
  return (
    <div className="panel-block">
      <div className="panel-block-title">Currently playing</div>
      <div className="d-flex gap-2 align-items-center">
        {game?.box_art_url && (
          <img
            src={game.box_art_url}
            alt={game.title}
            style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4 }}
          />
        )}
        <div>
          <div style={{ fontWeight: 600 }}>
            {entry.display_title || game?.title || '—'}
          </div>
          <div className="small text-white-50">
            {game ? (
              <>
                {game.platform}
                {game.release_year ? ` · ${game.release_year}` : ''}
              </>
            ) : entry.slot_type !== 'game' ? (
              'Break'
            ) : (
              ''
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RunnerNames({ entry }: { entry: ScheduleEntry | null }) {
  if (!entry || entry.runners.length === 0) {
    return (
      <div className="panel-block">
        <div className="panel-block-title">Runners</div>
        <div className="text-white-50">—</div>
      </div>
    );
  }
  return (
    <div className="panel-block">
      <div className="panel-block-title">Runners</div>
      <div className="panel-runners">
        {entry.runners.map((r) => r.name).join(' · ')}
      </div>
    </div>
  );
}

function Camera() {
  return (
    <div className="panel-block">
      <div className="panel-block-title">Camera</div>
      <div className="panel-camera">CAMERA</div>
    </div>
  );
}

function Timer({ entry }: { entry: ScheduleEntry | null }) {
  const now = useNow(250);
  const seconds = computeTimerSeconds(entry?.timer ?? null, now);
  return (
    <div className="panel-block">
      <div className="panel-block-title">Run time</div>
      <div className="panel-timer">{formatHms(seconds)}</div>
    </div>
  );
}

/**
 * Per-game item checklist. Collected items glow, uncollected items show
 * grayed/faded. Mirrors the toggle state from /control/items so OBS viewers
 * see progress live.
 */
export function ItemsGrid({ entry }: { entry: ScheduleEntry | null }) {
  if (!entry || !entry.game) return null;
  const items = entry.game.items
    .slice()
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  if (items.length === 0) return null;
  const collected = new Set(entry.collected_item_ids);
  return (
    <div className="panel-block">
      <div className="panel-block-title">Items</div>
      <div className="obs-items-grid">
        {items.map((it) => (
          <div
            key={it.id}
            className="obs-item"
            data-collected={collected.has(it.id)}
            title={it.name}
          >
            {it.image_url ? (
              <img src={it.image_url} alt={it.name} />
            ) : (
              <span className="obs-item-fallback">{it.name.slice(0, 2)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── helpers ───────────────────────────────────────────────────────────── */

function computeTimerSeconds(timer: TimerRun | null, now: number): number {
  if (!timer) return 0;
  if (timer.is_running && timer.started_at) {
    const startedMs = Date.parse(timer.started_at);
    return timer.accumulated_seconds + Math.max(0, Math.floor((now - startedMs) / 1000));
  }
  return timer.accumulated_seconds;
}

function formatHms(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function fmtClock(d: Date): string {
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function splitOnColon(title: string): [string, string?] {
  const idx = title.indexOf(':');
  if (idx < 0) return [title];
  return [title.slice(0, idx + 1), title.slice(idx + 1).trim()];
}

function parseBadges(notes: string): string[] {
  if (!notes) return [];
  return notes
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function fmtEta(minutes: number): string {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
