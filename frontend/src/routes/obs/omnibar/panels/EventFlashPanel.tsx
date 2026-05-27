import { useEffect } from 'react';
import { WaveText } from '@/components/WaveText';
import { PanelRow } from './_shared/Row';
import type { PanelProps } from './registry';
import type { PlaythroughEvent } from '@/lib/obsApi';

interface Data {
  event: PlaythroughEvent;
}

const FLASH_HOLD_MS = 3500;

/**
 * Brief celebration panel shown when a playthrough event arrives.
 * Mounted by Omnibar.tsx as a lane takeover, calls onComplete after
 * FLASH_HOLD_MS so the lane returns to its rotation. Not registered
 * — driven by the bus, not by selectData.
 */
export function EventFlashPanel({ data, onComplete }: PanelProps<Data>) {
  const { event } = data;
  const label = (event.payload?.name as string | undefined) || prettyKind(event.kind);
  const tagLabel = tagFor(event.kind);

  useEffect(() => {
    const id = window.setTimeout(() => onComplete?.(), FLASH_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [onComplete]);

  return (
    <PanelRow tag={tagLabel} arrow flash>
      <span className="ob-text-strong">
        <WaveText text={label} staggerMs={26} startDelayMs={520} />
      </span>
    </PanelRow>
  );
}

function tagFor(kind: string): string {
  // Convention map; fall back to humanised kind. Unknown kinds still
  // render meaningfully — registry-driven kinds get nicer labels via
  // their own registered handler (see plan: registerEventHandler).
  switch (kind) {
    case 'boss-defeated': return 'BOSS DEFEATED';
    case 'shrine-cleared': return 'SHRINE CLEARED';
    case 'dungeon-complete': return 'DUNGEON CLEARED';
    case 'item-collected': return 'ITEM GET';
    case 'player-death': return 'KO';
    case 'segment-complete': return 'SPLIT';
    case 'runner-swap': return 'RUNNER SWAP';
    default: return kind.replace(/-/g, ' ').toUpperCase();
  }
}

function prettyKind(kind: string): string {
  return kind.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
}
