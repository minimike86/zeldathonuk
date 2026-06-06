/**
 * Cross-tab notification when a layout preset changes (created, edited,
 * activated, deleted). Same rationale + mechanism as themeBus: /obs/full
 * polls /api/layout-presets/ on a fixed interval, so without a push signal an
 * open browser source can sit on the old arrangement for up to one poll cycle
 * after the operator flips the active preset. A BroadcastChannel lets every
 * open tab in the same browser re-fetch the moment a mutation succeeds, so a
 * live capture-position swap lands in roughly one render frame.
 *
 * Across *different* browsers/devices we still depend on the poll cadence
 * (2s on /obs/full), which keeps the staleness upper bound to a couple of
 * seconds.
 */

const CHANNEL_NAME = 'zeldathon-layout';
const STORAGE_KEY = 'zeldathon-layout-bump';

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

/** Fire-and-forget: tell every other tab a layout preset changed. */
export function notifyLayoutChanged(): void {
  channel?.postMessage('layout-changed');
  try {
    window.localStorage?.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Private/incognito modes may block localStorage; BroadcastChannel covers
    // every reasonable case anyway.
  }
}

/** Subscribe to layout-changed events from other tabs. Returns unsubscribe. */
export function onLayoutChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
