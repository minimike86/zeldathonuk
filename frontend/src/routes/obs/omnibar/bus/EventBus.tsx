import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type { ReactNode } from 'react';
import type { OmnibarBusEvent } from './types';

/**
 * Tiny pub/sub for omnibar events. Subscribers register by `kind`; the
 * bus invokes their handlers synchronously when an event is emitted.
 * No external dep, no rendering — all delivery happens via refs so
 * subscriptions don't churn on every render.
 *
 * Usage:
 *   const emit = useBusEmit();
 *   emit({ kind: 'donation-arrived', donation });
 *
 *   useBusSubscription('donation-arrived', (e) => { ... });
 */

type Handler<K extends OmnibarBusEvent['kind']> = (
  event: Extract<OmnibarBusEvent, { kind: K }>,
) => void;

type AnyHandler = (event: OmnibarBusEvent) => void;

interface BusApi {
  emit: (event: OmnibarBusEvent) => void;
  subscribe: <K extends OmnibarBusEvent['kind']>(
    kind: K,
    handler: Handler<K>,
  ) => () => void;
}

const EventBusContext = createContext<BusApi | null>(null);

export function EventBusProvider({ children }: { children: ReactNode }) {
  // Set of handlers per event kind. Stored in a ref so emit/subscribe
  // never re-create on render — preserves identity for memoisation.
  const handlersRef = useRef<Map<string, Set<AnyHandler>>>(new Map());

  const subscribe = useCallback(
    <K extends OmnibarBusEvent['kind']>(kind: K, handler: Handler<K>) => {
      const bucket = handlersRef.current.get(kind) ?? new Set<AnyHandler>();
      bucket.add(handler as AnyHandler);
      handlersRef.current.set(kind, bucket);
      return () => {
        bucket.delete(handler as AnyHandler);
        if (bucket.size === 0) handlersRef.current.delete(kind);
      };
    },
    [],
  );

  const emit = useCallback((event: OmnibarBusEvent) => {
    const bucket = handlersRef.current.get(event.kind);
    if (!bucket) return;
    // Iterate over a snapshot so a handler that unsubscribes during
    // dispatch doesn't disturb the iteration.
    for (const h of Array.from(bucket)) {
      try { h(event); } catch (err) { console.error('[EventBus]', err); }
    }
  }, []);

  const api = useMemo<BusApi>(() => ({ emit, subscribe }), [emit, subscribe]);
  return <EventBusContext.Provider value={api}>{children}</EventBusContext.Provider>;
}

export function useBusEmit() {
  const ctx = useContext(EventBusContext);
  if (!ctx) throw new Error('useBusEmit must be inside <EventBusProvider>');
  return ctx.emit;
}

export function useBusSubscription<K extends OmnibarBusEvent['kind']>(
  kind: K,
  handler: Handler<K>,
) {
  const ctx = useContext(EventBusContext);
  if (!ctx) throw new Error('useBusSubscription must be inside <EventBusProvider>');
  // Stash the handler in a ref so the subscription doesn't churn each
  // render when callers pass an inline closure.
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    return ctx.subscribe(kind, (e) => handlerRef.current(e));
  }, [ctx, kind]);
}
