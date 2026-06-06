import { useEffect } from 'react';
import { WaveText } from '@/components/WaveText';
import { PanelRow } from './_shared/Row';
import { registerEventHandler, type EventHandlerData } from '../events/registry';
import type { PanelProps } from './registry';
import type { PlaythroughEvent } from '@/lib/obsApi';

interface Data {
  event: PlaythroughEvent;
}

const FLASH_HOLD_MS = 3500;

/**
 * Brief celebration panel shown when a playthrough event arrives.
 * Used both as a direct bottom-lane takeover (Omnibar.tsx routes
 * unknown playthrough kinds here) AND via the event-handler registry
 * for known kinds with kind-specific mood/duration tuning.
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

// Adapter for the EventHandler API (which has a union event type).
function EventFlashAdapter({ data, onComplete }: { data: EventHandlerData; onComplete?: () => void }) {
  return <EventFlashPanel data={{ event: data.event as PlaythroughEvent }} onComplete={onComplete} />;
}

// Register the known playthrough-event kinds. Mood mapping is
// celebratory by default; deaths get nothing so the bar mutes rather
// than parties. Unknown kinds fall back via Omnibar.tsx's getEventHandler
// → EventFlashPanel path.
registerEventHandler({ kind: 'boss-defeated', component: EventFlashAdapter, flashMood: 'celebrate', durationMs: FLASH_HOLD_MS });
registerEventHandler({ kind: 'shrine-cleared', component: EventFlashAdapter, flashMood: 'celebrate', durationMs: FLASH_HOLD_MS });
registerEventHandler({ kind: 'dungeon-complete', component: EventFlashAdapter, flashMood: 'celebrate', durationMs: FLASH_HOLD_MS });
registerEventHandler({ kind: 'item-collected', component: EventFlashAdapter, durationMs: FLASH_HOLD_MS });
// 'player-death' has its own richer takeover — see DeathFlashPanel.tsx.
registerEventHandler({ kind: 'segment-complete', component: EventFlashAdapter, flashMood: 'celebrate', durationMs: FLASH_HOLD_MS });
registerEventHandler({ kind: 'runner-swap', component: EventFlashAdapter, durationMs: FLASH_HOLD_MS });
registerEventHandler({ kind: 'setpiece-cleared', component: EventFlashAdapter, flashMood: 'celebrate', durationMs: FLASH_HOLD_MS });

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
