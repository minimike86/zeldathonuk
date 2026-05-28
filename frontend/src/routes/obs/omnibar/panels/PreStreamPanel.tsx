import { MarqueeOnOverflow } from './_shared/MarqueeOnOverflow';
import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';

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
  eventName: string;
  /** Seconds until event.start_time, positive only. Null = stream is
   *  past its start; the panel renders the "setting up" copy
   *  instead of a countdown. */
  secondsUntilStart: number | null;
  /** Titles of every still-upcoming top-level game entry, in play
   *  order. Rendered in the marquee as "First game: A · B · C …" so
   *  viewers landing pre-stream see the whole lineup scroll past. */
  upcomingTitles: string[];
}

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
      <span className="ob-text-strong">{data.eventName}</span>
      {countdownParts ? (
        <span className="ob-text-muted" style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.6rem' }}>
          <span>in</span>
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
            {countdownParts.map((part, i) => (
              <span key={part.unit}>
                <span style={{ color: '#fff' }}>{part.value}</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.55)' }}>
                  {part.unit}
                </span>
                {i < countdownParts.length - 1 ? ' ' : ''}
              </span>
            ))}
          </span>
        </span>
      ) : (
        <span className="ob-text-muted">setting up next game…</span>
      )}
      {data.upcomingTitles.length > 0 && (
        <>
          <span className="ob-text-muted">·</span>
          {/* The full upcoming-games lineup marquees as a single
            * labelled list: "First game: A · B · C · D · …". The
            * "First game:" prefix anchors the meaning so viewers know
            * what the scrolling names represent; subsequent titles
            * follow separated by bullets and cycle continuously as
            * the marquee loops. The wrapper claims the remaining flex
            * space so the marquee's overflow detection has a defined
            * width to compare against. */}
          <div style={{ flex: '1 1 0', minWidth: 0 }}>
            <MarqueeOnOverflow>
              {data.upcomingTitles.map((title, i) => (
                <span
                  key={`${i}-${title}`}
                  style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.85rem' }}
                >
                  {/* First slot gets the explicit "First game:"
                    * anchor; subsequent slots get an ordinal prefix
                    * (2nd, 3rd, 4th…) so each scrolling title is
                    * paired with its play-order. */}
                  <span className="ob-text-muted">
                    {i === 0 ? 'First game:' : `${ordinal(i + 1)}:`}
                  </span>
                  <span className="ob-text-strong">{title}</span>
                  {i < data.upcomingTitles.length - 1 && (
                    <span className="ob-text-muted">·</span>
                  )}
                </span>
              ))}
            </MarqueeOnOverflow>
          </div>
        </>
      )}
    </PanelRow>
  );
}

/** English ordinal suffix for the marquee's game-number prefixes —
 *  "2nd", "3rd", "4th"… "21st", "22nd"… etc. The teens always take
 *  "th" regardless of their final digit. */
function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
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
    // "what's coming up gameplay-wise". The first becomes the
    // "First game:" anchor; the rest cycle past via the marquee loop.
    const upcomingTitles = feed.schedule
      .filter(
        (e) =>
          e.parent_entry == null && e.slot_type === 'game' && !e.is_completed,
      )
      .sort((a, b) => a.order - b.order)
      .map((e) => e.display_title || e.title)
      .filter((t) => t.length > 0);

    return {
      eventName: feed.event.name,
      secondsUntilStart,
      upcomingTitles,
    };
  },
  // Long-ish minimum so the countdown updates feel calm rather than
  // jittering in/out of the rotation. The panel is the only viable
  // top-lane candidate pre-stream, so `live.length <= 1` keeps it
  // pinned anyway; this only matters during between-games gaps with
  // other panels also live.
  minDurationMs: 8000,
});
