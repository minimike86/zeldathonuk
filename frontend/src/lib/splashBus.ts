/**
 * Cross-tab "test splash" trigger for /control/omnibar → /obs/omnibar.
 *
 * The Donation splash overlay normally fires off the `donation-arrived`
 * bus event, which itself is emitted by the donation poll. For visual
 * QA the operator wants to spawn splashes without creating real
 * donation rows (which would bump the running total + show up in
 * history forever). This module is the side-channel.
 *
 * `triggerTestSplash({ amount, currency })` posts on a BroadcastChannel
 * (with a localStorage `storage` event as fallback) so any open
 * /obs/omnibar tab in the same browser receives it instantly. The
 * splash overlay subscribes via `onTestSplash`.
 *
 * Cross-device note: this is intentionally same-browser only. For a
 * cross-machine test (e.g. operator on PC A, OBS source on PC B), use
 * the existing Sandbox section's "Fire fake donation" button which
 * goes through the real `/api/sandbox/donation/` pipeline.
 */

const CHANNEL_NAME = 'zeldathon-test-splash';
const STORAGE_KEY = 'zeldathon-test-splash-payload';

export interface TestSplashPayload {
  amount: number;
  currency: string;
}

type Listener = (payload: TestSplashPayload) => void;
const listeners = new Set<Listener>();

const channel: BroadcastChannel | null =
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;

if (channel) {
  channel.onmessage = (e) => {
    const payload = parse(e.data);
    if (payload) listeners.forEach((l) => l(payload));
  };
}

// Storage-event fallback only when BroadcastChannel isn't available.
// Previously we wired BOTH paths in parallel, and on any modern
// browser the receiver got TWO events per trigger (channel.onmessage
// + storage), spawning a duplicate splash per test fire. The other
// *Bus modules (theme, charity) didn't manifest this because their
// listeners just re-fetch idempotent data.
const useStorageFallback = channel === null;

if (useStorageFallback && typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    const payload = parse(safeJsonParse(e.newValue));
    if (payload) listeners.forEach((l) => l(payload));
  });
}

export function triggerTestSplash(payload: TestSplashPayload): void {
  if (channel) {
    // Primary path. BroadcastChannel delivers to every OTHER same-
    // origin context (not the sender), exactly once.
    channel.postMessage(payload);
    return;
  }
  // Fallback only — older Safari, weird embedded WebViews, etc.
  // Same per-trigger guarantee via `storage` event on other tabs.
  try {
    const stamped = { ...payload, _ts: Date.now() };
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(stamped));
  } catch {
    // Private mode might block localStorage; nothing to do.
  }
}

export function onTestSplash(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function parse(raw: unknown): TestSplashPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const amount = Number((raw as { amount?: unknown }).amount);
  const currency = String((raw as { currency?: unknown }).currency ?? 'GBP');
  if (!Number.isFinite(amount)) return null;
  return { amount, currency };
}

function safeJsonParse(raw: string): unknown {
  try { return JSON.parse(raw); } catch { return null; }
}
