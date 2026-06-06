/**
 * Cross-tab notification when an Event row changes (logo, GameBlast
 * logo, banner, currency, active flag…). Mirrors `themeBus.ts` exactly
 * — there's no shared abstraction yet because two channels is too few
 * to abstract over, and conflating them would mean every event poll
 * also fires on theme changes (and vice versa).
 *
 * Subscribers: <Omnibar> (right-side charity carousel + CTA event
 * name), <AdPanel> (carousel logo). Publishers: every /api/events/
 * mutation surface (POST/PATCH/DELETE in `routes/control/Events.tsx`).
 *
 * Cross-browser / cross-device propagation still rides each
 * subscriber's poll cadence — this only collapses latency between
 * tabs of the same browser to roughly one render frame.
 */

const CHANNEL_NAME = 'zeldathon-event';
const STORAGE_KEY = 'zeldathon-event-bump';

type Listener = () => void;
const listeners = new Set<Listener>();

const channel: BroadcastChannel | null =
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;

if (channel) {
  channel.onmessage = () => listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) listeners.forEach((l) => l());
  });
}

/** Fire-and-forget: tell this tab AND every other tab an Event row changed.
 *  BroadcastChannel/`storage` events never fire in the tab that triggered them,
 *  so we also notify local subscribers directly — otherwise the page that made
 *  the mutation (e.g. /control/events) wouldn't refresh until its next poll. */
export function notifyEventChanged(): void {
  listeners.forEach((l) => l());
  channel?.postMessage('event-changed');
  try {
    window.localStorage?.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Private/incognito modes may block writes — BroadcastChannel covers it.
  }
}

/** Subscribe to event-changed notifications. Returns unsubscribe. */
export function onEventChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
