/**
 * Builds the /obs/full items view, mirroring the /control/items grid exactly:
 * group SECTIONS (ordered by the game's item_group_order, else first-appearance)
 * → set CLUSTERS (by set.order) + a standalone bucket → item slots.
 *
 *  - Sections + labels come from the shared `itemGrouping` rules so the overlay
 *    and the control grid can't drift.
 *  - Sets flagged `show_in_overlay === false` are omitted; an item whose ONLY
 *    sets are hidden is dropped (hides bottle contents).
 *  - Ordered sets (`upgrade`/`trade`) collapse to a single slot = the current
 *    (highest-collected) tier, with the parsed capacity number for numeric
 *    chains whose icons are otherwise identical.
 */
import type { Game, GameItem, GameItemSet } from '@/lib/obsApi';
import { groupLabelOf, orderGroupLabels } from '@/lib/itemGrouping';

export interface ItemSlot {
  key: string;
  /** Item / tier / set name — used for the tooltip. */
  name: string;
  imageUrl: string;
  collected: boolean;
  /** ×N tally for countable items (keys, maps). Absent for non-countable. */
  count?: number;
  /** Parsed capacity for a collapsed numeric upgrade chain (e.g. 45). */
  capacity?: number;
}

export interface ItemCluster {
  /** Set name, or null for the section's standalone (set-less) items. */
  label: string | null;
  slots: ItemSlot[];
}

export interface ItemSection {
  /** Group label (the /control/items section header). */
  label: string;
  clusters: ItemCluster[];
}

const isOrdered = (kind: string) => kind === 'upgrade' || kind === 'trade';

/** Largest integer embedded in an item name, or undefined when it has none. */
function parseCapacity(name: string): number | undefined {
  const nums = name.match(/\d+/g);
  return nums ? Math.max(...nums.map(Number)) : undefined;
}

const byItemOrder = (a: GameItem, b: GameItem) =>
  a.order - b.order || a.name.localeCompare(b.name);

export function buildItemSections(
  game: Pick<Game, 'items' | 'item_sets' | 'item_group_order'>,
  collected: Set<number>,
  counts: Record<string, number>,
): ItemSection[] {
  const allItems = (game.items ?? []).slice().sort(byItemOrder);
  const sets = game.item_sets ?? [];
  const setById = new Map<number, GameItemSet>(sets.map((s) => [s.id, s]));
  const isVisible = (s: GameItemSet) => s.show_in_overlay !== false;

  // Primary VISIBLE set of an item = lowest-order visible set it belongs to
  // (tie-broken by id). Mirrors the control grid's primarySetOf, but only over
  // sets the overlay shows.
  const primaryVisibleSet = (it: GameItem): GameItemSet | null => {
    let best: GameItemSet | null = null;
    for (const sid of it.set_ids) {
      const s = setById.get(sid);
      if (!s || !isVisible(s)) continue;
      if (!best || s.order < best.order || (s.order === best.order && s.id < best.id)) {
        best = s;
      }
    }
    return best;
  };

  const slotForItem = (it: GameItem): ItemSlot => ({
    key: `item-${it.id}`,
    name: it.name,
    imageUrl: it.image_url,
    collected: collected.has(it.id),
    count: it.countable ? counts[String(it.id)] ?? 0 : undefined,
  });

  // Group items into sections (first-appearance order), then bucket each
  // section's items by primary visible set / standalone.
  interface Bucket {
    sets: Map<number, GameItem[]>;
    standalone: GameItem[];
  }
  const sections = new Map<string, Bucket>();
  for (const it of allItems) {
    const ps = primaryVisibleSet(it);
    // Item with set(s) but none visible → dropped (e.g. bottle contents).
    if (!ps && it.set_ids.some((sid) => setById.has(sid))) continue;
    const label = groupLabelOf(it.group, it.category);
    let bucket = sections.get(label);
    if (!bucket) {
      bucket = { sets: new Map(), standalone: [] };
      sections.set(label, bucket);
    }
    if (ps) {
      const arr = bucket.sets.get(ps.id);
      if (arr) arr.push(it);
      else bucket.sets.set(ps.id, [it]);
    } else {
      bucket.standalone.push(it);
    }
  }

  const orderedLabels = orderGroupLabels([...sections.keys()], game.item_group_order ?? []);

  const result: ItemSection[] = [];
  for (const label of orderedLabels) {
    const bucket = sections.get(label);
    if (!bucket) continue;
    // Set clusters by set.order, then the standalone bucket last.
    const setIds = [...bucket.sets.keys()].sort((a, b) => {
      const sa = setById.get(a);
      const sb = setById.get(b);
      return (sa?.order ?? 0) - (sb?.order ?? 0) || (sa?.name ?? '').localeCompare(sb?.name ?? '');
    });
    const clusters: ItemCluster[] = [];
    for (const sid of setIds) {
      const set = setById.get(sid);
      if (!set) continue;
      const members = (bucket.sets.get(sid) ?? []).slice().sort(byItemOrder);
      if (isOrdered(set.kind)) {
        const collectedMembers = members.filter((m) => collected.has(m.id));
        const current = collectedMembers.length
          ? collectedMembers[collectedMembers.length - 1]
          : members[0];
        const capacity = parseCapacity(current.name);
        clusters.push({
          label: set.name,
          slots: [
            {
              key: `set-${set.id}`,
              name: capacity != null ? set.name : current.name,
              imageUrl: current.image_url,
              collected: collectedMembers.length > 0,
              capacity,
            },
          ],
        });
      } else {
        clusters.push({ label: set.name, slots: members.map(slotForItem) });
      }
    }
    if (bucket.standalone.length > 0) {
      clusters.push({ label: null, slots: bucket.standalone.map(slotForItem) });
    }
    if (clusters.length > 0) result.push({ label, clusters });
  }
  return result;
}
