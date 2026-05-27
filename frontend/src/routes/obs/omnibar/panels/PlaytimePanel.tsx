import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';

/**
 * Top-lane status companion: how long the current game has been running
 * AND how long the event has been live. Two values, tabular-nums, no
 * wave — purely informational so it doesn't grab attention.
 */
interface Data {
  gameElapsedS: number | null;
  eventElapsedS: number | null;
}

function Panel({ data }: PanelProps<Data>) {
  const game = data.gameElapsedS != null ? formatHms(data.gameElapsedS) : '—';
  const event = data.eventElapsedS != null ? formatHms(data.eventElapsedS) : '—';
  return (
    <PanelRow tag="PLAYTIME">
      <span className="ob-text-strong" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {game}
      </span>
      <span className="ob-text-muted">game</span>
      <span
        className="ob-text-strong"
        style={{ fontVariantNumeric: 'tabular-nums', marginLeft: '0.75rem' }}
      >
        {event}
      </span>
      <span className="ob-text-muted">event</span>
    </PanelRow>
  );
}

function formatHms(totalSeconds: number): string {
  const t = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

registerPanel<Data>({
  id: 'playtime',
  component: Panel,
  selectData: (feed) => {
    const timer = feed.currentlyPlaying?.schedule_entry_detail?.timer ?? null;
    const rawGameS = timer ? timer.total_seconds : null;
    const eventStart = feed.event?.start_time
      ? new Date(feed.event.start_time).getTime()
      : null;
    const rawEventS =
      eventStart != null
        ? Math.floor((feed.now.getTime() - eventStart) / 1000)
        : null;
    // Treat each timer as "live" only when it's actually running and
    // positive. Pre-stream (start_time in the future) the event clock
    // computes negative; clamping to null hides the "0:00:00 event"
    // dead text instead of displaying it as a meaningless zero.
    const gameElapsedS = rawGameS != null && rawGameS > 0 ? rawGameS : null;
    const eventElapsedS = rawEventS != null && rawEventS > 0 ? rawEventS : null;
    // If NEITHER timer is running, hide the panel — otherwise it
    // sticks the top lane on "PLAYTIME · 00:00:00 game · 00:00:00
    // event" because it's the only panel whose selectData still
    // returns data, and `Lane.tsx` only ticks the rotation timer
    // when `live.length > 1`. With both timers stopped the lane
    // gracefully shows whichever other panel has data (or sits
    // empty pre-stream — correct, since nothing's happening yet).
    if (gameElapsedS == null && eventElapsedS == null) return null;
    return { gameElapsedS, eventElapsedS };
  },
  minDurationMs: 6000,
});
