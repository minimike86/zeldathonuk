import { useEffect, useState } from 'react';
import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';
import type { GameItem } from '@/lib/obsApi';

/**
 * Carousel of items the runner has collected so far in this playthrough.
 * Drawn from CollectedItem (referenced via ScheduleEntry.collected_item_ids)
 * + the active game's GameItem list. Hidden when nothing has been
 * collected yet so a fresh playthrough doesn't park on an empty card.
 */
const CYCLE_MS = 1800;

interface Data {
  items: GameItem[];
  totalCount: number;
  collectedCount: number;
}

function Panel({ data }: PanelProps<Data>) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (data.items.length <= 1) return;
    const id = window.setInterval(
      () => setIdx((i) => (i + 1) % data.items.length),
      CYCLE_MS,
    );
    return () => window.clearInterval(id);
  }, [data.items.length]);
  const item = data.items[idx] ?? data.items[0];
  return (
    <PanelRow tag="ITEMS">
      {item.image_url && (
        // Wrap the image in a sized container — the generic
        // .omnibar--v2 img rule in omnibar.css will then shrink-to-fit
        // this box no matter how big the source asset is.
        <span className="ob-item-icon" aria-hidden>
          <img src={item.image_url} alt="" />
        </span>
      )}
      <span className="ob-text-strong">{item.name}</span>
      <span className="ob-text-muted">
        {data.collectedCount} / {data.totalCount} collected
      </span>
    </PanelRow>
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
    };
  },
  minDurationMs: 7000,
});
