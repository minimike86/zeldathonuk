/**
 * Cross-tab notification when a Raffle changes (opened, closed, drawn,
 * reset, created, edited, deleted). Mirrors `themeBus.ts` / `eventBus.ts`.
 *
 * Subscribers: the public <Incentives> page (raffle cards — "Enter now"
 * gating + LIVE badge). Publishers: every /api/raffles/ mutation surface
 * (open/close/draw/reset/POST/PATCH/DELETE), wired in `obsApi.ts`.
 *
 * Cross-browser / cross-device propagation still rides the subscriber's
 * poll cadence; this only collapses latency between tabs of the same
 * browser (e.g. /control/raffles next to /incentives) to ~one render frame.
 */

const CHANNEL_NAME = 'zeldathon-raffle';
const STORAGE_KEY = 'zeldathon-raffle-bump';

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

/** Fire-and-forget: tell every other tab a Raffle changed. */
export function notifyRafflesChanged(): void {
  channel?.postMessage('raffles-changed');
  try {
    window.localStorage?.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Private/incognito modes may block writes — BroadcastChannel covers it.
  }
}

/** Subscribe to raffle-changed notifications. Returns unsubscribe. */
export function onRafflesChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
