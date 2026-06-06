/**
 * Module-level dedupe sets shared between the SSE hook and the
 * polling-fallback hooks. Each push stream (override, playthrough,
 * external) has its own set keyed by row id; whichever stream sees a
 * row first wins and the other(s) skip it.
 *
 * Module-level state is correct here because the omnibar mounts as a
 * singleton at /obs/omnibar (and inside /obs/full). Tests / Storybook
 * can call `resetEventDedupe()` to clear between runs.
 */

export const seenOverrideIds = new Set<number>();
export const seenPlaythroughIds = new Set<number>();
export const seenExternalIds = new Set<number>();

export function resetEventDedupe(): void {
  seenOverrideIds.clear();
  seenPlaythroughIds.clear();
  seenExternalIds.clear();
}
