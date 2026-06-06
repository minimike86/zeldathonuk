/**
 * Cross-tab notification when a game's objective *definitions* or a
 * playthrough's objective *statuses* change (on /control/omnibar#objective).
 * Mirrors `itemsBus.ts` / `raffleBus.ts` / `themeBus.ts`.
 *
 * Subscribers: the omnibar feed's currently-playing poll (so the objective
 * checklist + pickup celebration react without waiting on the 3s tick).
 * Publishers: the GameObjective create/update/delete + set-objective-status
 * surfaces in `obsApi.ts`.
 *
 * This only collapses latency between tabs of the same browser; cross-device
 * propagation still rides the subscriber's poll cadence.
 */

const CHANNEL_NAME = 'zeldathon-objectives';
const STORAGE_KEY = 'zeldathon-objectives-bump';

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

/** Fire-and-forget: tell every other tab a game's objectives changed. */
export function notifyObjectivesChanged(): void {
  channel?.postMessage('objectives-changed');
  try {
    window.localStorage?.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Private/incognito modes may block writes — BroadcastChannel covers it.
  }
}

/** Subscribe to objective-changed notifications. Returns unsubscribe. */
export function onObjectivesChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
