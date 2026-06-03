/**
 * Builds the clustered, de-redundant item view for the /obs/full items element.
 *
 * Rules (see the layout items plan):
 *  - Cluster items by their item SET (Pendants, Bottles, Medallions…), mirroring
 *    how /control/items groups them, so related items appear together.
 *  - Sets flagged `show_in_overlay === false` are omitted; an item whose ONLY
 *    sets are hidden is dropped entirely (this hides bottle contents).
 *  - Ordered sets (`upgrade`/`trade`) collapse to a SINGLE slot = the current
 *    (highest-collected) tier, so lower tiers don't pile up. For capacity chains
 *    (`"40 to 45 Arrows"`) the number is parsed from the name and surfaced as a
 *    badge, since those tiers all share one icon.
 *  - Unordered sets + loose (set-less) items render one slot per member, greyed
 *    when uncollected, with a ×N badge for countable items (keys/maps).
 */
import type { Game, GameItem, GameItemSet } from '@/lib/obsApi';

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
  /** Set or group name shown as the cluster label. */
  label: string;
  slots: ItemSlot[];
  /** Sort key — the min item order in the cluster. */
  order: number;
}

const isOrdered = (kind: string) => kind === 'upgrade' || kind === 'trade';

/** Largest integer embedded in an item name, or undefined when it has none. */
function parseCapacity(name: string): number | undefined {
  const nums = name.match(/\d+/g);
  return nums ? Math.max(...nums.map(Number)) : undefined;
}

const bySetOrder = (a: GameItemSet, b: GameItemSet) =>
  a.order - b.order || a.name.localeCompare(b.name);
const byItemOrder = (a: GameItem, b: GameItem) =>
  a.order - b.order || a.name.localeCompare(b.name);

export function buildItemClusters(
  game: Pick<Game, 'items' | 'item_sets'>,
  collected: Set<number>,
  counts: Record<string, number>,
): ItemCluster[] {
  const items = game.items ?? [];
  const visibleSets = (game.item_sets ?? [])
    .filter((s) => s.show_in_overlay !== false)
    .sort(bySetOrder);

  // First visible set per item (by set order) — dedupes items that belong to
  // several visible sets into a single cluster.
  const firstVisibleSet = new Map<number, number>();
  for (const set of visibleSets) {
    for (const it of items) {
      if (it.set_ids.includes(set.id) && !firstVisibleSet.has(it.id)) {
        firstVisibleSet.set(it.id, set.id);
      }
    }
  }

  const slotForItem = (it: GameItem): ItemSlot => ({
    key: `item-${it.id}`,
    name: it.name,
    imageUrl: it.image_url,
    collected: collected.has(it.id),
    count: it.countable ? counts[String(it.id)] ?? 0 : undefined,
  });

  const clusters: ItemCluster[] = [];

  // One cluster per visible set.
  for (const set of visibleSets) {
    const members = items
      .filter((it) => firstVisibleSet.get(it.id) === set.id)
      .sort(byItemOrder);
    if (members.length === 0) continue;
    const order = Math.min(...members.map((m) => m.order));

    if (isOrdered(set.kind)) {
      // Collapse to the current (highest-collected) tier, else the base tier.
      const collectedMembers = members.filter((m) => collected.has(m.id));
      const current = collectedMembers.length
        ? collectedMembers[collectedMembers.length - 1]
        : members[0];
      const capacity = parseCapacity(current.name);
      clusters.push({
        label: set.name,
        order,
        slots: [
          {
            key: `set-${set.id}`,
            // Numeric chains label by set name (+ capacity badge); named chains
            // (Sword → Master Sword) label by the current tier's name.
            name: capacity != null ? set.name : current.name,
            imageUrl: current.image_url,
            collected: collectedMembers.length > 0,
            capacity,
          },
        ],
      });
    } else {
      clusters.push({ label: set.name, order, slots: members.map(slotForItem) });
    }
  }

  // Loose items: no sets at all → grouped by `group`/`category`. Items that have
  // sets but all of them hidden are intentionally dropped (not loose).
  const looseGroups = new Map<string, GameItem[]>();
  for (const it of items) {
    if (it.set_ids.length > 0) continue;
    const key = it.group?.trim() || it.category?.trim() || 'Items';
    const arr = looseGroups.get(key);
    if (arr) arr.push(it);
    else looseGroups.set(key, [it]);
  }
  for (const [label, members] of looseGroups) {
    members.sort(byItemOrder);
    clusters.push({
      label,
      order: Math.min(...members.map((m) => m.order)),
      slots: members.map(slotForItem),
    });
  }

  return clusters.sort((a, b) => a.order - b.order);
}
