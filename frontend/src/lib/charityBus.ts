/**
 * Cross-tab notification when the charity slide list changes.
 *
 * Mirrors `themeBus.ts`. /control/omnibar saves go through the
 * `obsApi.{create,update,delete}CharitySlide` helpers; each of those
 * fires `notifyCharitySlidesChanged()` so any open /obs/omnibar tab in
 * the same browser re-fetches the slide list within one render frame
 * instead of waiting on the poll interval.
 *
 * Cross-device / cross-browser updates still depend on the polled
 * cadence in `<CharityCluster>` — kept short enough that operators
 * editing on one machine see their changes propagate to the OBS
 * source on another within a few seconds.
 */

const CHANNEL_NAME = 'zeldathon-charity-slides';
const STORAGE_KEY = 'zeldathon-charity-slides-bump';

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

/** Fire-and-forget: tell every other tab the charity slide list changed. */
export function notifyCharitySlidesChanged(): void {
  channel?.postMessage('charity-changed');
  try {
    window.localStorage?.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Private mode might block localStorage; BroadcastChannel covers
    // every reasonable case.
  }
}

/** Subscribe to charity-changed events from other tabs. Returns unsubscribe. */
export function onCharitySlidesChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
