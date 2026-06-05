import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAccentDeck } from './accentDeck';

describe('useAccentDeck', () => {
  it('returns a deck of the requested length', () => {
    for (const count of [0, 1, 3, 4, 7, 12]) {
      const { result } = renderHook(() => useAccentDeck(count));
      expect(result.current).toHaveLength(count);
      for (const i of result.current) {
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThanOrEqual(3);
      }
    }
  });

  it('never repeats an accent in adjacent slots', () => {
    const { result } = renderHook(() => useAccentDeck(16));
    for (let i = 1; i < result.current.length; i++) {
      expect(result.current[i]).not.toBe(result.current[i - 1]);
    }
  });

  it('is stable across re-renders', () => {
    const { result, rerender } = renderHook(() => useAccentDeck(8));
    const first = [...result.current];
    rerender();
    expect(result.current).toEqual(first);
  });
});
