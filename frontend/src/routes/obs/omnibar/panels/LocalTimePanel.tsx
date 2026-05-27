import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';

/**
 * Wall-clock time + total event elapsed. Useful on long marathons so
 * the chat / runner can see "yep, we've been at this for 18 hours, no
 * wonder I'm seeing through walls". Updates every second via the feed's
 * `now`.
 */
interface Data {
  localTime: string;
  eventElapsedH: string | null;
}

function Panel({ data }: PanelProps<Data>) {
  return (
    <PanelRow tag="LOCAL TIME">
      <span className="ob-text-strong" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {data.localTime}
      </span>
      {data.eventElapsedH != null && (
        <>
          <span className="ob-text-muted">·</span>
          <span className="ob-text-muted">{data.eventElapsedH} into the stream</span>
        </>
      )}
    </PanelRow>
  );
}

registerPanel<Data>({
  id: 'local-time',
  component: Panel,
  selectData: (feed) => {
    const localTime = feed.now.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
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
    return { localTime, eventElapsedH };
  },
  minDurationMs: 5000,
});
