import { useEffect, useRef } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import { useBusEmit } from '../bus/EventBus';

/**
 * Polls /api/overrides/active/ once a second and emits override-arrived
 * for each newly-seen override id, override-expired for any that have
 * dropped out of the active set since the last poll. Returns the
 * current active list so the omnibar can read the highest-priority
 * one when transitioning to urgent.
 */
const POLL_MS = 1000;

export function useOverrideStream() {
  const emit = useBusEmit();
  const knownIdsRef = useRef<Set<number>>(new Set());
  const { data: active } = usePolledQuery(obsApi.overridesActive, POLL_MS);

  useEffect(() => {
    if (!active) return;
    const next = new Set(active.map((o) => o.id));
    // Emit arrivals.
    for (const o of active) {
      if (!knownIdsRef.current.has(o.id)) {
        emit({ kind: 'override-arrived', override: o });
      }
    }
    // Emit expiries.
    for (const id of knownIdsRef.current) {
      if (!next.has(id)) emit({ kind: 'override-expired', id });
    }
    knownIdsRef.current = next;
  }, [active, emit]);

  return active ?? [];
}
