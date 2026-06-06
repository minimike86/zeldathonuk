import type { ComponentType } from 'react';
import type { ExternalEvent, PlaythroughEvent } from '@/lib/obsApi';

/**
 * Self-registering event-handler descriptor. A handler is "what the
 * omnibar does when an event of this kind arrives" — usually a lane
 * takeover panel + a mood + a hold duration.
 *
 * Routing:
 *   external-event   → match on event.kind  (e.g. 'twitch-follow')
 *   playthrough-event → match on event.kind  (e.g. 'boss-defeated')
 *
 * Unknown kinds fall through to whatever fallback the caller picks
 * (see `getEventHandler`). The registry is open: a new event kind
 * needs only a new handler registration — no orchestrator change.
 */

export interface EventHandlerData {
  // Either flavour of inbound event can drive a takeover. The
  // component reads the union shape and narrows as needed.
  event: ExternalEvent | PlaythroughEvent;
}

export interface EventHandlerDescriptor {
  kind: string;
  /** Lane takeover panel rendered while this event is the active
   *  takeover. The component owns its own dismissal timer (via
   *  setTimeout + onComplete) so different event kinds can hold for
   *  different lengths. */
  component: ComponentType<{ data: EventHandlerData; onComplete?: () => void }>;
  /** Optional mood class to apply to the omnibar root while this
   *  event is active. Looked up against the mood registry. */
  flashMood?: string;
  /** Default hold duration (component may override). Surfaced so the
   *  rotator can dedupe / queue bursts without re-querying the
   *  component. */
  durationMs?: number;
}

const REGISTRY = new Map<string, EventHandlerDescriptor>();

export function registerEventHandler(desc: EventHandlerDescriptor): void {
  REGISTRY.set(desc.kind, desc);
}

export function getEventHandler(
  kind: string,
): EventHandlerDescriptor | undefined {
  return REGISTRY.get(kind);
}

export function listEventHandlers(): EventHandlerDescriptor[] {
  return Array.from(REGISTRY.values());
}
