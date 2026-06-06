import { useEffect, useRef } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import { useBusEmit } from '../bus/EventBus';
import { seenPlaythroughIds } from './eventDedupe';

/**
 * Polls /api/playthrough-events/?schedule_entry=…&since=… and emits a
 * `playthrough-event` for every previously-unseen row. On first mount
 * the `since` cursor is set to "now" so we don't replay history when
 * the OBS browser source comes online mid-stream.
 */
const POLL_MS = 1500;

export function usePlaythroughEventStream(scheduleEntryId: number | null) {
  const emit = useBusEmit();
  const sinceRef = useRef<string>(new Date().toISOString());

  // Reset cursor whenever the active entry changes so a new playthrough
  // doesn't inherit dedup cursor from the previous one. The shared
  // seenPlaythroughIds set persists across entries so a row that
  // arrived via SSE then re-appears in a poll doesn't double-fire.
  useEffect(() => {
    sinceRef.current = new Date().toISOString();
  }, [scheduleEntryId]);

  const { data } = usePolledQuery(
    () =>
      scheduleEntryId
        ? obsApi.playthroughEvents({
            scheduleEntryId,
            since: sinceRef.current,
          })
        : Promise.resolve([]),
    POLL_MS,
    [scheduleEntryId],
  );

  useEffect(() => {
    if (!data || data.length === 0) return;
    let maxTs = sinceRef.current;
    for (const ev of data) {
      if (seenPlaythroughIds.has(ev.id)) continue;
      seenPlaythroughIds.add(ev.id);
      emit({ kind: 'playthrough-event', event: ev });
      if (ev.created_at > maxTs) maxTs = ev.created_at;
    }
    sinceRef.current = maxTs;
  }, [data, emit]);
}
