import { useState } from 'react';

/**
 * Returns a stable, per-mount-shuffled array of accent indices (0–3) of
 * length `count`. Index 0 = primary, 1/2/3 = the optional accent slots
 * from the theme. The component reading this assigns one index to each
 * sibling (typically via `data-accent={deck[i]}`) and CSS resolves the
 * index to the matching CSS var.
 *
 * Properties of the deck:
 *
 *   • Adjacent items never share an accent — so two side-by-side
 *     buttons / nav items don't visually merge into a single coloured
 *     bar.
 *   • When `count` ≤ 4, the deck contains four distinct colours so
 *     four-button rows on the homepage paint all four PAL face colours.
 *   • When `count` > 4, indices cycle through fresh shuffles so the
 *     order keeps changing rather than repeating a fixed 0–1–2–3
 *     pattern (which would otherwise turn into recognisable stripes).
 *
 * Re-rolls only on mount, so the same render session is stable (a
 * theme refetch via the bus doesn't re-shuffle and re-paint the bar).
 */
export function useAccentDeck(count: number): number[] {
  const [deck] = useState(() => buildDeck(count));
  return deck;
}

function buildDeck(count: number): number[] {
  const result: number[] = [];
  // Re-shuffle a fresh 4-colour deck for every 4 items so consecutive
  // groups don't share the same order. The boundary swap below keeps
  // adjacency-distinct across deck reshuffles too.
  while (result.length < count) {
    const shuffled = shuffle([0, 1, 2, 3]);
    for (const idx of shuffled) {
      if (result.length >= count) break;
      if (result.length > 0 && result[result.length - 1] === idx) {
        // Adjacent collision at deck boundary — defer this colour by
        // skipping it; we'll pick it up on the next iteration of the
        // outer while loop after a new shuffle.
        continue;
      }
      result.push(idx);
    }
    // If the shuffle yielded a result shorter than expected (because
    // every remaining colour matched the previous), force-progress by
    // pushing any non-matching index.
    if (result.length < count) {
      const last = result[result.length - 1];
      const alt = (last + 1) % 4;
      if (result[result.length - 1] !== alt) result.push(alt);
    }
  }
  return result;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
