import { useEffect, useRef } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import { useBusEmit } from '../bus/EventBus';

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
  const seenIdsRef = useRef<Set<number>>(new Set());

  // Reset cursor + seen-set whenever the active entry changes so a new
  // playthrough doesn't inherit dedup state from the previous one.
  useEffect(() => {
    sinceRef.current = new Date().toISOString();
    seenIdsRef.current = new Set();
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
      if (seenIdsRef.current.has(ev.id)) continue;
      seenIdsRef.current.add(ev.id);
      emit({ kind: 'playthrough-event', event: ev });
      if (ev.created_at > maxTs) maxTs = ev.created_at;
    }
    // Advance the cursor past the newest row so subsequent polls
    // return only newer events.
    sinceRef.current = maxTs;
  }, [data, emit]);
}
