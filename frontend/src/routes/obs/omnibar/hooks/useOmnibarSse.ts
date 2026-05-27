import { useEffect, useState } from 'react';
import { useBusEmit } from '../bus/EventBus';
import {
  seenExternalIds,
  seenOverrideIds,
  seenPlaythroughIds,
} from './eventDedupe';
import { env } from '@/lib/env';
import type {
  ExternalEvent,
  OmnibarOverride,
  PlaythroughEvent,
} from '@/lib/obsApi';

// EventSource doesn't pass through the Vite dev proxy by default
// (no /api/* proxy entry, and SSE streams trip http-proxy's default
// buffering anyway). Resolve to the full backend URL like the rest
// of the API client does. In prod the same VITE_API_URL points at the
// reverse-proxied origin.
const STREAM_URL = new URL('/api/stream/omnibar/', env.VITE_API_URL).toString();

/**
 * Subscribe to /api/stream/omnibar/ (Server-Sent Events) and pump the
 * three push streams (overrides, playthrough events, external events)
 * into the bus. Returns `connected` so the polling hooks can dial back
 * — when SSE is live, the polled cursors stay at "now" and the polls
 * just confirm nothing's missing; when SSE drops, polling takes over
 * within ~1.5s.
 *
 * The browser's EventSource transparently reconnects when the server
 * closes a stream, so MAX_STREAM_SECONDS on the backend cycles
 * connections without disrupting delivery — handy for keeping memory
 * stable across long event runs.
 */
export function useOmnibarSse(): { connected: boolean } {
  const emit = useBusEmit();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (typeof EventSource === 'undefined') return;
    let es: EventSource | null = null;
    let cancelled = false;
    const connect = () => {
      if (cancelled) return;
      es = new EventSource(STREAM_URL);
      es.addEventListener('hello', () => setConnected(true));
      es.addEventListener('override', (e) => {
        const data = parse<OmnibarOverride>(e);
        if (!data || seenOverrideIds.has(data.id)) return;
        seenOverrideIds.add(data.id);
        emit({ kind: 'override-arrived', override: data });
      });
      es.addEventListener('playthrough-event', (e) => {
        const data = parse<PlaythroughEvent>(e);
        if (!data || seenPlaythroughIds.has(data.id)) return;
        seenPlaythroughIds.add(data.id);
        emit({ kind: 'playthrough-event', event: data });
      });
      es.addEventListener('external-event', (e) => {
        const data = parse<ExternalEvent>(e);
        if (!data || seenExternalIds.has(data.id)) return;
        seenExternalIds.add(data.id);
        emit({ kind: 'external-event', event: data });
      });
      es.onerror = () => {
        setConnected(false);
        es?.close();
        // EventSource auto-reconnects but on hard failures (server
        // gone) it backs off briefly; manually reconnect in 3s so we
        // always come back up.
        window.setTimeout(connect, 3000);
      };
    };
    connect();
    return () => {
      cancelled = true;
      es?.close();
    };
  }, [emit]);

  return { connected };
}

function parse<T>(event: MessageEvent): T | null {
  try {
    return JSON.parse(event.data) as T;
  } catch {
    return null;
  }
}
