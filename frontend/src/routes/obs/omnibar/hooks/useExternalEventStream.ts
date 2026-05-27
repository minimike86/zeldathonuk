import { useEffect, useRef } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import { useBusEmit } from '../bus/EventBus';
import { seenExternalIds } from './eventDedupe';

/**
 * Polls /api/external-events/?source=twitch&since=…&unconsumed=true
 * and emits `external-event` for every previously-unseen row, then
 * marks them consumed so subsequent polls don't return them again.
 *
 * On first mount we seed the `since` cursor to "now" so an OBS source
 * coming online mid-stream doesn't replay every Twitch event from the
 * past hour.
 */
const POLL_MS = 1500;

export function useExternalEventStream(source: string = 'twitch') {
  const emit = useBusEmit();
  const sinceRef = useRef<string>(new Date().toISOString());

  const { data } = usePolledQuery(
    () =>
      obsApi.externalEvents({ source, since: sinceRef.current, unconsumed: true }),
    POLL_MS,
    [source],
  );

  useEffect(() => {
    if (!data || data.length === 0) return;
    let maxTs = sinceRef.current;
    for (const ev of data) {
      if (seenExternalIds.has(ev.id)) continue;
      seenExternalIds.add(ev.id);
      emit({ kind: 'external-event', event: ev });
      // Mark consumed so we don't pull the same row next tick.
      // Fire-and-forget; failure is non-fatal — dedupe via seenExternalIds
      // also covers it.
      void obsApi.consumeExternalEvent(ev.id).catch(() => {});
      if (ev.occurred_at > maxTs) maxTs = ev.occurred_at;
    }
    sinceRef.current = maxTs;
  }, [data, emit]);
}
