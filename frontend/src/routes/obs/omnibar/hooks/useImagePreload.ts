import { useEffect, useRef } from 'react';

/**
 * Force-load a set of image URLs into the browser cache before the
 * panels that render them ever mount.
 *
 * Why: the objective-checklist panel (and the items panel) build their
 * tile strip from the active game's `objective.image_url` /
 * `item.image_url` lists. Those panels can rotate into the lane
 * abruptly — e.g. as soon as the operator marks the first objective
 * obtained — and the browser would otherwise fetch each sprite at
 * paint time. On a stream that produces a brief blank/flash as each
 * icon swaps in.
 *
 * Strategy: every time the URL set changes, kick a fresh `new Image()`
 * for any URL we haven't seen before. The browser parses + decodes the
 * response and parks it in the HTTP cache; the eventual `<img src>` on
 * the panel then renders synchronously from the cached blob with no
 * network hit.
 *
 * The preload set is held in a `useRef` so URLs aren't re-fetched on
 * every re-render. Stale URLs (sprite removed from the game) stay in
 * the set forever — no harm, just a small memory cost; they'll
 * disappear when the omnibar source reloads.
 *
 * Empty / non-string URLs are skipped silently so callers don't need
 * to filter before passing the list in.
 */
export function useImagePreload(urls: ReadonlyArray<string | null | undefined>): void {
  // Set of URLs already kicked off — preserved across renders. We
  // don't read it during render, only inside the effect.
  const preloadedRef = useRef<Set<string>>(new Set());

  // Join the de-duped, sorted URL list into a single key so the effect
  // re-runs only when the SET changes — not when the array order
  // changes or React hands us a fresh array reference with identical
  // contents.
  const key = urls
    .filter((u): u is string => typeof u === 'string' && u.length > 0)
    .slice()
    .sort()
    .join('|');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = preloadedRef.current;
    for (const url of key.split('|')) {
      if (!url) continue;
      if (seen.has(url)) continue;
      seen.add(url);
      // Fire-and-forget. The Image object goes out of scope after the
      // browser has parsed/decoded the response into the cache; we
      // never need to keep a reference. `decoding="async"` keeps the
      // decode off the main thread so a burst of preloads doesn't
      // cost any visible frames.
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
    }
  }, [key]);
}
