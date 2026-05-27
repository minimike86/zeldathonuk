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
  /** Display title of the next upcoming schedule entry, if any. Used
   *  as supporting text so viewers know what's next without waiting
   *  for the bottom-lane SchedulePanel to cycle around. */
  nextEntryTitle: string | null;
}

function Panel({ data }: PanelProps<Data>) {
  return (
    <PanelRow tag="UP NEXT" arrow>
      <span className="ob-text-strong">{data.eventName}</span>
      {data.secondsUntilStart != null ? (
        <span className="ob-text-muted">
          starts in{' '}
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatCountdown(data.secondsUntilStart)}
          </span>
        </span>
      ) : (
        <span className="ob-text-muted">setting up next game…</span>
      )}
      {data.nextEntryTitle && (
        <>
          <span className="ob-text-muted">·</span>
          <span className="ob-text-muted">{data.nextEntryTitle}</span>
        </>
      )}
    </PanelRow>
  );
}

/** Compact "Hh Mm" / "Mm Ss" countdown that picks the appropriate
 *  resolution: hours+minutes when >= 1h, minutes+seconds otherwise.
 *  Avoids the visual noise of always rendering seconds during a
 *  multi-day countdown while still ticking visibly in the final hour. */
function formatCountdown(secondsTotal: number): string {
  const s = Math.max(0, Math.floor(secondsTotal));
  const days = Math.floor(s / 86_400);
  const hours = Math.floor((s % 86_400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
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

    // Find the next still-pending top-level game slot. Skips break
    // slots and child entries so the supporting text actually reads
    // as "what's coming up gameplay-wise".
    const nextEntry = feed.schedule
      .filter(
        (e) =>
          e.parent_entry == null && e.slot_type === 'game' && !e.is_completed,
      )
      .sort((a, b) => a.order - b.order)[0];

    return {
      eventName: feed.event.name,
      secondsUntilStart,
      nextEntryTitle: nextEntry?.display_title ?? null,
    };
  },
  // Long-ish minimum so the countdown updates feel calm rather than
  // jittering in/out of the rotation. The panel is the only viable
  // top-lane candidate pre-stream, so `live.length <= 1` keeps it
  // pinned anyway; this only matters during between-games gaps with
  // other panels also live.
  minDurationMs: 8000,
});
