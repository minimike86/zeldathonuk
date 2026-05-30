import { useEffect, useState } from 'react';
import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';

/** Card choreography — the .ob-upcoming-card keyframes do all three
 *  phases (enter from below → dwell → exit upward) in a single
 *  animation, and CARD_CYCLE_MS is the JS-side interval that
 *  remounts the next card. A brief gap (`CARD_GAP_MS`) sits between
 *  the previous card's exit completing and the next card's enter
 *  starting, so transitions don't feel like a crossfade. */
const CARD_ANIM_MS = 5500;
const CARD_GAP_MS = 220;
const CARD_CYCLE_MS = CARD_ANIM_MS + CARD_GAP_MS;

/** One card's worth of data per upcoming game — pre-projected by
 *  `selectData` so the render path stays cheap (no JSX-side reaches
 *  into ScheduleEntry / Game). */
interface UpcomingCard {
  /** Stable id for React keys + uniqueness across remounts. */
  id: number;
  /** Position in the lineup, 1-indexed (1 = "Up first"). */
  position: number;
  /** Game title — falls back to entry.title when display_title is blank. */
  title: string;
  /** Estimated playtime in minutes — used by `formatDuration` below. */
  minutes: number;
  /** Console / handheld badge, e.g. "SNES", "Switch". Empty when the
   *  entry isn't bound to a Game (shouldn't happen for game slots but
   *  guarded for safety). */
  platform: string;
  /** Box-art URL, may be empty — the card renders a platform-coloured
   *  placeholder block in that case so the layout stays consistent. */
  boxArtUrl: string;
}

/**
 * Top-lane fallback shown when nothing else has activity to report —
 * pre-stream (event configured but not started yet) and the brief
 * gaps between games (operator hasn't set the next currently-playing
 * entry yet). Once a schedule entry IS marked currently-playing and
 * its timer starts, this panel's `selectData` returns null so the
 * lane returns to the regular status rotation (current-game,
 * playtime, objective, etc.).
 *
 * Two display modes inside the panel:
 *
 *   • "Starts in 2h 14m"  — when event.start_time is in the future.
 *     Counts down via `feed.now` so the timer updates every second.
 *
 *   • "Setting up next game" — when start_time has passed but no
 *     entry is currently playing. The brief between-games window.
 *
 * Event name + next scheduled game (if any) are surfaced as
 * supporting text so viewers landing pre-stream have context.
 */

interface Data {
  /** Seconds until event.start_time, positive only. Null = stream is
   *  past its start; the panel renders the "setting up" copy
   *  instead of a countdown. */
  secondsUntilStart: number | null;
  /** Every still-upcoming top-level game entry, in play order. Each
   *  card surfaces cover art + title + position + estimated play time
   *  + platform badge so the marquee carries real lineup detail
   *  instead of a bare title strip. */
  upcoming: UpcomingCard[];
}

// Each d/h/m/s column gets its own theme colour so the countdown reads as a
// little palette that recolours per theme, instead of a flat white. Each pulls
// from a different slot of the theme's accent/primary/secondary set, with a
// fallback chain ending in a fixed default so an unset var never blanks a
// digit. Unit labels use a translucent mix of their column's colour.
const UNIT_COLOR: Record<'d' | 'h' | 'm' | 's', string> = {
  h: 'var(--obs-accent, var(--theme-primary-bright, #3848a5))',
  d: 'var(--theme-accent-1, var(--theme-primary, #3d7d3d))',
  m: 'var(--theme-accent-2, var(--theme-secondary, #ddc24d))',
  s: 'var(--theme-accent-3, var(--theme-primary-bright, #b1322c))',
};
const unitMuted = (color: string) => `color-mix(in srgb, ${color} 60%, transparent)`;

function Panel({ data }: PanelProps<Data>) {
  const countdownParts = data.secondsUntilStart != null
    ? formatCountdown(data.secondsUntilStart)
    : null;
  return (
    <PanelRow tag="THE BIG EVENT" arrow>
      {/* Static lead-in: event name + countdown (or "setting up…") +
        * the · separator. These never marquee — only the trailing
        * game-name title scrolls when it can't fit, so the countdown
        * stays anchored where viewers expect to read it. */}
      <span className="ob-text-strong">Starts in</span>
      {countdownParts ? (
        <span className="ob-text-muted" style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.6rem' }}>
          <span>:</span>
          <span
            // 8-bit pixel mono ("Press Start 2P") so the countdown
            // reads like an old-school Zelda menu timer. The font's
            // metrics put its baseline noticeably higher than the
            // surrounding Bungee/Open Sans copy, so we nudge the
            // whole block down a few pixels to sit on the same
            // visual baseline as "starts in".
            style={{
              fontFamily: '"Press Start 2P", ui-monospace, monospace',
              fontSize: '0.78rem',
              letterSpacing: '0.04em',
              lineHeight: 1,
              fontWeight: 400,
              textShadow: '0 1px 0 rgba(0, 0, 0, 0.45)',
              display: 'inline-block',
              transform: 'translateY(0.15em)',
            }}
          >
            {countdownParts.map((part, i) => {
              const color = UNIT_COLOR[part.unit];
              return (
                <span key={part.unit}>
                  <span style={{ color }}>{part.value}</span>
                  <span style={{ color: unitMuted(color) }}>{part.unit}</span>
                  {i < countdownParts.length - 1 ? ' ' : ''}
                </span>
              );
            })}
          </span>
        </span>
      ) : (
        <span className="ob-text-muted">setting up next game…</span>
      )}
      {data.upcoming.length > 0 && (
        <>
          <span className="ob-text-muted">·</span>
          {/* One upcoming card visible at a time — the panel cycles
            * the visible index every CARD_DWELL_MS so each game gets
            * the full body width (titles, durations, art read
            * cleanly). The wrapper claims the remaining flex space
            * so the card can fill it; a keyed remount on each
            * transition triggers a fade-in animation in CSS. */}
          <div style={{ flex: '1 1 0', minWidth: 0 }}>
            <UpcomingCarousel cards={data.upcoming} />
          </div>
        </>
      )}
    </PanelRow>
  );
}

/**
 * Cycles through the upcoming-game cards one at a time. Each card
 * gets the full body width so titles + durations are legible (the
 * previous marquee shrank everything to fit). Advances on a fixed
 * interval; a keyed remount on the visible card triggers the CSS
 * fade-in animation. Resets to 0 when the lineup changes (e.g. the
 * operator adds / removes an entry) so the cycle never points at a
 * stale id.
 */
function UpcomingCarousel({ cards }: { cards: UpcomingCard[] }) {
  const [index, setIndex] = useState(0);
  // Stable key for the lineup — if the order or membership changes,
  // resetting the index drops back to the first card so the cycle
  // doesn't land on a gone-missing entry.
  const lineupKey = cards.map((c) => c.id).join('|');
  useEffect(() => {
    setIndex(0);
  }, [lineupKey]);
  useEffect(() => {
    if (cards.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % cards.length);
    }, CARD_CYCLE_MS);
    return () => window.clearInterval(t);
  }, [cards.length]);
  const safeIndex = Math.min(index, cards.length - 1);
  const card = cards[safeIndex];
  if (!card) return null;
  return (
    <UpcomingGameCard
      // `card.id` in the key forces a remount on every cycle, so the
      // CSS choreography (enter from below → dwell → exit upward)
      // replays cleanly per advance.
      key={`upcoming-${card.id}-${safeIndex}`}
      card={card}
      isFirst={safeIndex === 0}
      // Single-card lineups switch to a static enter-only animation
      // so the lone game doesn't slide off-screen after one cycle.
      isStatic={cards.length <= 1}
    />
  );
}

/**
 * One upcoming-game card rendered inside the pre-stream marquee.
 *
 * Layout (horizontal, fits within the 48px half-lane):
 *
 *   ┌──────┬─────────────────────────────────┐
 *   │ cov  │ #N · Up first        SNES       │
 *   │ ART  │ Game Title (clipped if long)    │
 *   │      │ ⏱ 1h 20m                        │
 *   └──────┴─────────────────────────────────┘
 *
 * The "Up first" eyebrow on the leading card replaces the ordinal
 * tag so viewers immediately see which game opens the run. Subsequent
 * cards just show #N. Cover art falls back to a platform initial
 * tile when `boxArtUrl` is empty.
 */
function UpcomingGameCard({
  card,
  isFirst,
  isStatic,
}: {
  card: UpcomingCard;
  isFirst: boolean;
  isStatic: boolean;
}) {
  return (
    <span
      className={`ob-upcoming-card${isStatic ? ' ob-upcoming-card--static' : ''}`}
    >
      {card.boxArtUrl ? (
        <span className="ob-upcoming-card-art" aria-hidden>
          <img src={card.boxArtUrl} alt="" />
        </span>
      ) : (
        <span
          className="ob-upcoming-card-art ob-upcoming-card-art--placeholder"
          aria-hidden
        >
          {card.platform.slice(0, 2) || '?'}
        </span>
      )}
      <span className="ob-upcoming-card-body">
        <span className="ob-upcoming-card-eyebrow">
          <span className="ob-upcoming-card-position">#{card.position}</span>
          {isFirst && <span className="ob-upcoming-card-up-first">Up first</span>}
          {card.platform && (
            <span className="ob-upcoming-card-platform">{card.platform}</span>
          )}
        </span>
        <span className="ob-upcoming-card-title">{card.title}</span>
      </span>
      <span className="ob-upcoming-card-duration">
        <span className="ob-upcoming-card-duration-label">Time to beat</span>
        <span className="ob-upcoming-card-duration-value">
          {formatDuration(card.minutes)}
        </span>
      </span>
    </span>
  );
}

/** Format an integer minutes count as "1h 20m" / "45m" / "—" — same
 *  shape as the public schedule page uses for game durations so the
 *  pre-stream marquee reads consistently with elsewhere. */
function formatDuration(minutes: number): string {
  if (!minutes || minutes < 1) return '—';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours <= 0) return `${mins}m`;
  if (mins <= 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/** Returns the countdown as `{value, unit}` segments so the caller
 *  can colour digits and unit labels independently. Always includes
 *  seconds so viewers see the tick. Higher units are added when the
 *  remaining time is large enough that they're non-zero. Minutes
 *  and seconds are zero-padded once a higher unit is in play so the
 *  layout doesn't jump as digits roll over. */
interface CountdownPart {
  value: string;
  unit: 'd' | 'h' | 'm' | 's';
}
function formatCountdown(secondsTotal: number): CountdownPart[] {
  const s = Math.max(0, Math.floor(secondsTotal));
  const days = Math.floor(s / 86_400);
  const hours = Math.floor((s % 86_400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const ss = String(seconds).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const hh = String(hours).padStart(2, '0');
  if (days > 0) {
    return [
      { value: String(days), unit: 'd' },
      { value: hh,           unit: 'h' },
      { value: mm,           unit: 'm' },
      { value: ss,           unit: 's' },
    ];
  }
  if (hours > 0) {
    return [
      { value: String(hours), unit: 'h' },
      { value: mm,            unit: 'm' },
      { value: ss,            unit: 's' },
    ];
  }
  return [
    { value: String(minutes), unit: 'm' },
    { value: ss,              unit: 's' },
  ];
}

registerPanel<Data>({
  id: 'pre-stream',
  component: Panel,
  selectData: (feed) => {
    // No event → nothing to anchor pre-stream copy on; let other
    // panels (or LocalTime) carry the lane.
    if (!feed.event) return null;
    // Stream is live — a schedule entry is set as currently-playing.
    // Hand the lane back to the rotation (current-game, playtime,
    // objective, …). The panel's whole purpose is filling the GAP
    // when no entry is live; once one is, get out of the way.
    if (feed.currentlyPlaying?.schedule_entry_detail) return null;

    const startMs = new Date(feed.event.start_time).getTime();
    const deltaMs = startMs - feed.now.getTime();
    const secondsUntilStart = deltaMs > 0 ? Math.ceil(deltaMs / 1000) : null;

    // Every still-pending top-level game slot, in play order. Skips
    // break slots and child entries so the marquee lineup reads as
    // "what's coming up gameplay-wise". Each entry is projected into
    // an `UpcomingCard` so the render path doesn't need to reach into
    // ScheduleEntry / Game shapes — and so the per-frame work the
    // marquee does (measuring, repeating) is cheap.
    const upcoming: UpcomingCard[] = feed.schedule
      .filter(
        (e) =>
          e.parent_entry == null && e.slot_type === 'game' && !e.is_completed,
      )
      .sort((a, b) => a.order - b.order)
      .map((e, idx) => ({
        id: e.id,
        position: idx + 1,
        title: e.display_title || e.title,
        minutes: e.effective_minutes,
        platform: e.game?.platform ?? '',
        boxArtUrl: e.game?.box_art_url ?? '',
      }))
      .filter((c) => c.title.length > 0);

    return {
      secondsUntilStart,
      upcoming,
    };
  },
  // Long-ish minimum so the countdown updates feel calm rather than
  // jittering in/out of the rotation. The panel is the only viable
  // top-lane candidate pre-stream, so `live.length <= 1` keeps it
  // pinned anyway; this only matters during between-games gaps with
  // other panels also live.
  minDurationMs: 8000,
});
