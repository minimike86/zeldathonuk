/**
 * Cross-tab notification when a game's item *definitions* change (a
 * GameItem created, edited, or deleted on /control/items). Mirrors
 * `raffleBus.ts` / `themeBus.ts` / `eventBus.ts`.
 *
 * Subscribers: the omnibar feed's currently-playing poll (so the ITEMS
 * card picks up a freshly-added item without waiting on the 3s tick).
 * Publishers: the GameItem create/update/delete surfaces in `obsApi.ts`.
 *
 * This only collapses latency between tabs of the same browser; cross-device
 * propagation still rides the subscriber's poll cadence.
 */

const CHANNEL_NAME = 'zeldathon-items';
const STORAGE_KEY = 'zeldathon-items-bump';

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

/** Fire-and-forget: tell every other tab a game's item list changed. */
export function notifyItemsChanged(): void {
  channel?.postMessage('items-changed');
  try {
    window.localStorage?.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Private/incognito modes may block writes — BroadcastChannel covers it.
  }
}

/** Subscribe to item-definition-changed notifications. Returns unsubscribe. */
export function onItemsChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
