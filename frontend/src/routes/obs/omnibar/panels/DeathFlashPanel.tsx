import { useEffect } from 'react';
import { WaveText } from '@/components/WaveText';
import { PanelRow } from './_shared/Row';
import { playRandomDeathSound } from './deathSounds';
import { registerEventHandler, type EventHandlerData } from '../events/registry';
import type { PlaythroughEvent } from '@/lib/obsApi';
import type { PlaybackHandle } from '../../fanfare';

/**
 * Dedicated takeover for `player-death` events — a livelier beat than the
 * generic EventFlashPanel "KO" wave. A jittering skull, the running
 * per-game death tally ("DEATH #N", read off the event payload), and a
 * count-aware quip, wrapped in a short shake + red glow so a death reads
 * as a distinct "ouch" moment without going full game-over.
 *
 * The death count is stamped on the event payload by the backend
 * (timer_hotkey death-inc → PlaythroughEvent payload `{count}`). Falls
 * back gracefully to a bare "KO!" when the count is missing.
 */
const DEATH_HOLD_MS = 3500;

export function DeathFlashPanel({
  data,
  onComplete,
}: {
  data: { event: PlaythroughEvent };
  onComplete?: () => void;
}) {
  const raw = (data.event.payload as { count?: unknown } | null)?.count;
  const count = typeof raw === 'number' && raw > 0 ? raw : null;

  useEffect(() => {
    const id = window.setTimeout(() => onComplete?.(), DEATH_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [onComplete]);

  // Play a random death sting from the Sound library, in sync with the
  // flash. Mounts once per event (the panel is keyed by event id), so the
  // sound fires exactly once. Cancelled if the panel unmounts early.
  useEffect(() => {
    let handle: PlaybackHandle | null = null;
    let cancelled = false;
    void playRandomDeathSound().then((h) => {
      if (cancelled) {
        h?.cancel();
        return;
      }
      handle = h;
    });
    return () => {
      cancelled = true;
      handle?.cancel();
    };
  }, []);

  const headline = count != null ? `DEATH #${count}` : 'KO!';
  return (
    <PanelRow tag="K.O." arrow flash>
      <span className="ob-death">
        <span className="ob-death-skull" aria-hidden>💀</span>
        <span className="ob-death-stack">
          <span className="ob-text-strong ob-death-headline">
            <WaveText text={headline} staggerMs={28} startDelayMs={420} />
          </span>
          <span className="ob-death-sub">{deathQuip(count)}</span>
        </span>
      </span>
    </PanelRow>
  );
}

/** Count-aware flavour line. Deterministic on the count so a given death
 *  always reads the same (the panel mounts once per event). Zelda-tinted. */
function deathQuip(n: number | null): string {
  if (n == null) return 'The hero falls…';
  if (n === 1) return 'First blood.';
  if (n % 10 === 0) return `${n} deaths… it is dangerous to go alone.`;
  const quips = [
    'Try again!',
    'So close!',
    'Dust yourself off.',
    'The hero falls…',
    'Press on!',
    'Link down!',
  ];
  return quips[n % quips.length];
}

// Adapter for the EventHandler union shape (mirrors EventFlashPanel's).
function DeathFlashAdapter({
  data,
  onComplete,
}: {
  data: EventHandlerData;
  onComplete?: () => void;
}) {
  return (
    <DeathFlashPanel
      data={{ event: data.event as PlaythroughEvent }}
      onComplete={onComplete}
    />
  );
}

registerEventHandler({
  kind: 'player-death',
  component: DeathFlashAdapter,
  durationMs: DEATH_HOLD_MS,
});
