import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';

/**
 * Wall-clock time + total event elapsed. Useful on long marathons so
 * the chat / runner can see "yep, we've been at this for 18 hours, no
 * wonder I'm seeing through walls". Updates every second via the feed's
 * `now`.
 */
interface Data {
  /** Time-of-day portion without AM/PM (e.g. "02:34:56"). */
  localTime: string;
  /** Day period suffix when the locale uses 12h ("AM" / "PM").
   *  Empty when the locale renders 24h. */
  localPeriod: string;
  eventElapsedH: string | null;
}

// 8-bit pixel mono ("Press Start 2P") so the wall clock reads like
// an old-school Zelda menu HUD. The font's baseline sits higher
// than the surrounding Bungee, so we drop the block ~0.15em via
// a transform to land it on the same visual baseline as the
// "into the stream" suffix.
const MONO_STYLE = {
  fontFamily: '"Press Start 2P", ui-monospace, monospace',
  fontSize: '0.82rem',
  letterSpacing: '0.04em',
  lineHeight: 1,
  display: 'inline-block',
  transform: 'translateY(0.15em)',
} as const;

function Panel({ data }: PanelProps<Data>) {
  return (
    <PanelRow tag="LOCAL TIME">
      <span className="ob-text-strong" style={MONO_STYLE}>
        {data.localTime}
        {data.localPeriod && (
          <span style={{ color: 'rgba(255, 255, 255, 0.55)', marginLeft: '0.4em' }}>
            {data.localPeriod}
          </span>
        )}
      </span>
      {data.eventElapsedH != null && (
        <>
          <span className="ob-text-muted">·</span>
          <span className="ob-text-muted" style={MONO_STYLE}>
            {data.eventElapsedH}
          </span>
          <span className="ob-text-muted">into the stream</span>
        </>
      )}
    </PanelRow>
  );
}

registerPanel<Data>({
  id: 'local-time',
  component: Panel,
  selectData: (feed) => {
    // formatToParts lets us split the locale-formatted time into
    // the digit segments and the AM/PM `dayPeriod` so they can be
    // styled independently (period is rendered greyed-out to match
    // the unit letters in the countdown panel).
    const fmt = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const parts = fmt.formatToParts(feed.now);
    const localTime = parts
      .filter((p) => p.type !== 'dayPeriod' && !(p.type === 'literal' && p.value.trim() === ''))
      .map((p) => p.value)
      .join('')
      .trim();
    const localPeriod = parts.find((p) => p.type === 'dayPeriod')?.value ?? '';

    let eventElapsedH: string | null = null;
    if (feed.event?.start_time) {
      const elapsedMs = feed.now.getTime() - new Date(feed.event.start_time).getTime();
      if (elapsedMs > 0) {
        const hours = elapsedMs / 1000 / 3600;
        eventElapsedH = hours < 1
          ? `${Math.round(hours * 60)}m`
          : `${hours.toFixed(1)}h`;
      }
    }
    return { localTime, localPeriod, eventElapsedH };
  },
  minDurationMs: 5000,
});
