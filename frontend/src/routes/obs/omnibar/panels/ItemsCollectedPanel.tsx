import { useEffect, useState } from 'react';
import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';
import type { GameItem } from '@/lib/obsApi';

/**
 * Paged showcase of items the runner has collected so far in this
 * playthrough. Drawn from CollectedItem (referenced via
 * ScheduleEntry.collected_item_ids) + the active game's GameItem list.
 * Hidden when nothing has been collected yet so a fresh playthrough
 * doesn't park on an empty card.
 *
 * Layout: the lane fills with a row of styled item boxes (a "page"),
 * each box popping in left→right in a staggered cascade. The running
 * "N / M collected" tally is pinned hard-right and stays static so it
 * reads as a fixed counter rather than animating per box.
 *
 * Paging cadence: the panel shows exactly ONE page per on-screen visit
 * and advances to the next batch on the NEXT visit. The lane owns exit
 * timing (its per-panel `dwellMs`), independent of this panel, so an
 * in-visit flip would race the exit and leave the fresh page on screen
 * for only a sliver before the panel transitions out. Showing one page
 * per visit instead gives every batch the panel's full dwell, and the
 * cascade replays cleanly on each entry. The page cursor persists in a
 * module-level map keyed by the collected set so successive visits step
 * through the batches in order.
 */

/** Boxes shown at once. Tuned to fill the half-lane width without the
 *  labels clipping; the row flexes so fewer-than-PER_PAGE final pages
 *  still look balanced. */
const PER_PAGE = 5;

/** Per-collected-set page cursor, surviving the panel's unmount between
 *  rotation visits so each appearance advances to the next batch. Keyed
 *  by the item-id signature so a different game / changed set restarts
 *  from page 0 rather than inheriting a stale index. */
const pageCursors = new Map<string, number>();

interface Data {
  items: GameItem[];
  totalCount: number;
  collectedCount: number;
  /** Tally per item id (for countable items like keys/maps). */
  counts: Record<string, number>;
}

function Panel({ data }: PanelProps<Data>) {
  return (
    <PanelRow tag="ITEMS" arrow>
      {/* Cycling area claims the remaining flex space; the counter
        * below sits to its right and gets pushed hard-right. */}
      <div style={{ flex: '1 1 0', minWidth: 0 }}>
        <ItemPager items={data.items} counts={data.counts} />
      </div>
      <span className="ob-text-muted ob-items-count">
        {data.collectedCount} / {data.totalCount} collected
      </span>
    </PanelRow>
  );
}

/**
 * Renders one batch of collected items for this visit. The page shown
 * is read from the persisted cursor at mount, then the cursor is
 * advanced so the NEXT visit steps to the following batch. The per-box
 * cascade (driven entirely in CSS off `--i`) replays on every mount, so
 * each appearance animates in fresh without any in-visit flipping.
 */
function ItemPager({
  items,
  counts,
}: {
  items: GameItem[];
  counts: Record<string, number>;
}) {
  const pageCount = Math.max(1, Math.ceil(items.length / PER_PAGE));
  // Stable signature for the collected set — a changed set restarts the
  // cursor rather than indexing into a stale layout.
  const itemsKey = items.map((i) => i.id).join('|');
  // Pick this visit's page from the persisted cursor (clamped to the
  // current page count). Read once at mount so the page can't shift
  // mid-visit; the lane holds it on screen for the panel's full dwell.
  const [page] = useState(() => (pageCursors.get(itemsKey) ?? 0) % pageCount);
  // Advance the cursor after committing so the next visit shows the
  // next batch.
  useEffect(() => {
    pageCursors.set(itemsKey, (page + 1) % pageCount);
  }, [itemsKey, page, pageCount]);
  const start = page * PER_PAGE;
  const pageItems = items.slice(start, start + PER_PAGE);
  return (
    <div className="ob-item-page">
      {pageItems.map((item, idx) => {
        const count = counts[String(item.id)] ?? 0;
        return (
          <span
            key={item.id}
            className="ob-item-box"
            style={{ ['--i' as string]: idx } as React.CSSProperties}
            title={item.name}
          >
            {item.image_url ? (
              <span className="ob-item-box-art" aria-hidden>
                <img src={item.image_url} alt="" />
              </span>
            ) : (
              <span
                className="ob-item-box-art ob-item-box-art--placeholder"
                aria-hidden
              >
                ?
              </span>
            )}
            <span className="ob-item-box-name">{item.name}</span>
            {/* Countable items (keys, maps, …) show their tally inside
              * the same box so it animates as one unit with the name. */}
            {item.countable && count > 0 && (
              <span className="ob-item-box-count">×{count}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

registerPanel<Data>({
  id: 'items-collected',
  component: Panel,
  selectData: (feed) => {
    const entry = feed.currentlyPlaying?.schedule_entry_detail;
    if (!entry || !entry.game) return null;
    const all = entry.game.items ?? [];
    if (all.length === 0) return null;
    const collected = new Set(entry.collected_item_ids);
    const collectedItems = all.filter((i) => collected.has(i.id));
    if (collectedItems.length === 0) return null;
    return {
      items: collectedItems,
      totalCount: all.length,
      collectedCount: collectedItems.length,
      counts: entry.collected_item_counts ?? {},
    };
  },
  minDurationMs: 7000,
});
