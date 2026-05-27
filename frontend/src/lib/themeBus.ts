/**
 * Cross-tab notification when the active theme changes.
 *
 * Why this exists: <ThemeProvider> polls /api/theme/ on a fixed
 * interval, so without a push signal an open tab can sit on the old
 * theme for up to one poll cycle after another tab swaps it. A
 * BroadcastChannel lets every open tab in the same browser hear about
 * theme mutations the moment they succeed, so the apply happens in
 * roughly one render frame.
 *
 * Across *different* browsers or devices we still depend on the
 * provider's poll cadence (intentionally shortened so the upper bound
 * on staleness is a few seconds, not a minute). True cross-device push
 * would need an SSE / WebSocket pipeline on the backend.
 */

const CHANNEL_NAME = 'zeldathon-theme';
const STORAGE_KEY = 'zeldathon-theme-bump';

type Listener = () => void;
const listeners = new Set<Listener>();

// BroadcastChannel is available in every browser the OBS sources care
// about (Chromium-based browser sources, modern Firefox, Safari 15.4+).
// Guard the construction so SSR-style imports don't crash if `window`
// or `BroadcastChannel` is missing.
const channel: BroadcastChannel | null =
  typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel(CHANNEL_NAME)
    : null;

if (channel) {
  channel.onmessage = () => listeners.forEach((l) => l());
}

// `storage` is a same-origin fallback for the (rare) environment where
// BroadcastChannel isn't available — writing any value triggers the
// event on other tabs.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) listeners.forEach((l) => l());
  });
}

/** Fire-and-forget: tell every other tab the active theme changed. */
export function notifyThemeChanged(): void {
  channel?.postMessage('theme-changed');
  try {
    // Touch localStorage so the `storage` fallback fires too. The value
    // doesn't matter — only the event does — but vary it so successive
    // calls always look like a real change.
    window.localStorage?.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Some private/incognito modes block localStorage writes; that's
    // fine, BroadcastChannel will have covered every reasonable case.
  }
}

/** Subscribe to theme-changed events from other tabs. Returns unsubscribe. */
export function onThemeChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
