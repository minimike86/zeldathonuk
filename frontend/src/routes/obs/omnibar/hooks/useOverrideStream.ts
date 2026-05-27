import { useEffect, useRef } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import { useBusEmit } from '../bus/EventBus';
import { seenOverrideIds } from './eventDedupe';

/**
 * Polls /api/overrides/active/ as a fallback for the SSE stream. When
 * SSE delivered an override first it's already in `seenOverrideIds`
 * (shared module-level set) and we skip the duplicate emit. The poll
 * still owns *expiry* detection — SSE only emits new rows, so when an
 * override drops out of the active set we still need to dispatch
 * `override-expired` from here.
 */
const POLL_MS = 1500;

export function useOverrideStream() {
  const emit = useBusEmit();
  // Local active set for expiry diff. Distinct from seenOverrideIds —
  // we want to know "what's active right NOW" not "what have we ever
  // seen", because an override can be deactivated and reactivated.
  const activeIdsRef = useRef<Set<number>>(new Set());
  const { data: active } = usePolledQuery(obsApi.overridesActive, POLL_MS);

  useEffect(() => {
    if (!active) return;
    const next = new Set(active.map((o) => o.id));
    // Emit arrivals — only if SSE didn't beat us to it.
    for (const o of active) {
      if (seenOverrideIds.has(o.id)) continue;
      seenOverrideIds.add(o.id);
      emit({ kind: 'override-arrived', override: o });
    }
    // Emit expiries (always — SSE doesn't push these).
    for (const id of activeIdsRef.current) {
      if (!next.has(id)) {
        emit({ kind: 'override-expired', id });
        // Allow the same override id to re-arrive later if reactivated.
        seenOverrideIds.delete(id);
      }
    }
    activeIdsRef.current = next;
  }, [active, emit]);

  return active ?? [];
}
