/**
 * Canonical item-grouping rules shared by the /control/items grid and the
 * /obs/full items overlay, so the two organise items identically (the control
 * grid is the source of truth the overlay mirrors).
 */

/** Category value → display label. The control grid's category dropdown and
 *  the group-label fallback both read this. */
export const ITEM_CATEGORIES: readonly (readonly [string, string])[] = [
  ['weapon', 'Weapon'],
  ['song', 'Song'],
  ['heart-piece', 'Heart piece'],
  ['key-item', 'Key item'],
  ['dungeon-item', 'Dungeon item'],
  ['other', 'Other'],
];

/** Section label for an item: its `group`, else the category's display label,
 *  else the raw category, else 'Other'. */
export function groupLabelOf(group: string, category: string): string {
  const g = (group ?? '').trim();
  if (g) return g;
  const cat = ITEM_CATEGORIES.find(([v]) => v === category)?.[1];
  return cat || category || 'Other';
}

/** Order group labels by a per-game `item_group_order`: listed labels first in
 *  that order, the rest after in their given (appearance) order. Stable. */
export function orderGroupLabels(labels: string[], groupOrder: string[]): string[] {
  const idx = new Map(groupOrder.map((l, i) => [l, i] as const));
  return labels
    .map((label, i) => ({ label, i }))
    .sort((a, b) => {
      const ia = idx.has(a.label) ? (idx.get(a.label) as number) : Infinity;
      const ib = idx.has(b.label) ? (idx.get(b.label) as number) : Infinity;
      return ia - ib || a.i - b.i; // unlisted keep appearance order
    })
    .map((x) => x.label);
}
