import { describe, it, expect } from 'vitest';
import { ITEM_CATEGORIES, groupLabelOf, orderGroupLabels } from './itemGrouping';

describe('itemGrouping', () => {
  it('exposes the canonical category list', () => {
    expect(ITEM_CATEGORIES.find(([v]) => v === 'weapon')?.[1]).toBe('Weapon');
  });

  it('prefers an explicit group label', () => {
    expect(groupLabelOf('Equipment', 'weapon')).toBe('Equipment');
    expect(groupLabelOf('  Bottles  ', 'other')).toBe('Bottles');
  });

  it('falls back to the category display label, then raw, then Other', () => {
    expect(groupLabelOf('', 'weapon')).toBe('Weapon');
    expect(groupLabelOf('', 'made-up')).toBe('made-up');
    expect(groupLabelOf('', '')).toBe('Other');
  });

  it('orders labels by the configured group order, rest in appearance order', () => {
    const labels = ['Songs', 'Weapons', 'Bottles'];
    const order = ['Weapons', 'Songs'];
    expect(orderGroupLabels(labels, order)).toEqual(['Weapons', 'Songs', 'Bottles']);
  });

  it('is stable when no order is given', () => {
    const labels = ['B', 'A', 'C'];
    expect(orderGroupLabels(labels, [])).toEqual(['B', 'A', 'C']);
  });
});
