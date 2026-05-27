import { useEffect } from 'react';
import { WaveText } from '@/components/WaveText';
import { PanelRow } from './_shared/Row';
import { registerEventHandler, type EventHandlerData } from '../events/registry';
import type { ExternalEvent } from '@/lib/obsApi';

type TwitchPanelProps = { data: EventHandlerData; onComplete?: () => void };

// Type-asserter — narrows the union to ExternalEvent at the panel
// callsites since Twitch handlers only ever receive that flavour.
function asExternal(e: EventHandlerData['event']): ExternalEvent {
  return e as ExternalEvent;
}

/**
 * Twitch event takeover panels. Not registered with the panel registry
 * because they're driven by the external-event stream (lane takeovers)
 * rather than rotation. The omnibar root renders one of these as
 * `bottomTakeover` when a `twitch-*` ExternalEvent arrives.
 *
 * Twitch's payload shape varies per event kind. We narrow safely at
 * each callsite; unknown shapes degrade to a generic label.
 */

const HOLD_MS = 5000;

export function TwitchFollowPanel({ data, onComplete }: TwitchPanelProps) {
  useExpiry(onComplete);
  const event = asExternal(data.event);
  const userName = pickString(event.payload, ['user_name', 'user_login']) || 'Someone';
  return (
    <PanelRow tag="NEW FOLLOWER" arrow flash>
      <span className="ob-text-strong">
        <WaveText text={userName} staggerMs={24} startDelayMs={520} />
      </span>
      <span className="ob-text-muted">just followed</span>
    </PanelRow>
  );
}

export function TwitchSubPanel({ data, onComplete }: TwitchPanelProps) {
  useExpiry(onComplete);
  const event = asExternal(data.event);
  const p = event.payload;
  const userName = pickString(p, ['user_name', 'user_login']) || 'Someone';
  const tier = pickString(p, ['tier']);
  const isGift = pickBoolean(p, ['is_gift']);
  const months = pickNumber(p, ['cumulative_months', 'streak_months']);
  const tag = isGift ? 'GIFT SUB' : months && months > 1 ? `RESUB · ${months}M` : 'NEW SUB';
  const tierLabel = tier ? ` · T${tier.slice(-1)}` : '';
  return (
    <PanelRow tag={tag} arrow flash>
      <span className="ob-text-strong">
        <WaveText text={userName} staggerMs={24} startDelayMs={520} />
      </span>
      <span className="ob-text-muted">subscribed{tierLabel}</span>
    </PanelRow>
  );
}

export function TwitchRaidPanel({ data, onComplete }: TwitchPanelProps) {
  useExpiry(onComplete);
  const event = asExternal(data.event);
  const p = event.payload;
  const from = pickString(p, ['from_broadcaster_user_name', 'from_broadcaster_user_login']) || 'Another channel';
  const viewers = pickNumber(p, ['viewers']);
  return (
    <PanelRow tag="RAID INCOMING" arrow flash>
      <span className="ob-text-strong">
        <WaveText text={from} staggerMs={24} startDelayMs={520} />
      </span>
      {viewers != null && (
        <span className="ob-text-muted">
          with {viewers.toLocaleString()} viewers!
        </span>
      )}
    </PanelRow>
  );
}

export function TwitchBitsPanel({ data, onComplete }: TwitchPanelProps) {
  useExpiry(onComplete);
  const event = asExternal(data.event);
  const p = event.payload;
  const userName = pickString(p, ['user_name', 'user_login']) || 'Someone';
  const bits = pickNumber(p, ['bits']);
  return (
    <PanelRow tag="BITS" arrow flash>
      <span className="ob-text-strong">
        <WaveText text={userName} staggerMs={24} startDelayMs={520} />
      </span>
      {bits != null && (
        <span className="ob-text-muted">
          cheered {bits.toLocaleString()} bits
        </span>
      )}
    </PanelRow>
  );
}

/** Generic fallback for any twitch:* event we haven't built UI for. */
export function TwitchGenericToast({ data, onComplete }: TwitchPanelProps) {
  useExpiry(onComplete);
  const event = asExternal(data.event);
  const userName = pickString(event.payload, ['user_name', 'user_login']);
  return (
    <PanelRow tag={event.kind.toUpperCase()} arrow flash>
      <span className="ob-text-strong">
        <WaveText
          text={userName || prettyKind(event.kind)}
          staggerMs={24}
          startDelayMs={520}
        />
      </span>
    </PanelRow>
  );
}

// ── Registration ────────────────────────────────────────────────────

registerEventHandler({ kind: 'twitch-follow', component: TwitchFollowPanel,
  flashMood: 'cheer', durationMs: HOLD_MS });
registerEventHandler({ kind: 'twitch-sub', component: TwitchSubPanel,
  flashMood: 'cheer', durationMs: HOLD_MS });
registerEventHandler({ kind: 'twitch-sub-gift', component: TwitchSubPanel,
  flashMood: 'cheer', durationMs: HOLD_MS });
registerEventHandler({ kind: 'twitch-resub', component: TwitchSubPanel,
  flashMood: 'cheer', durationMs: HOLD_MS });
registerEventHandler({ kind: 'twitch-raid', component: TwitchRaidPanel,
  flashMood: 'celebrate', durationMs: HOLD_MS });
registerEventHandler({ kind: 'twitch-bits', component: TwitchBitsPanel,
  flashMood: 'cheer', durationMs: HOLD_MS });

// ── helpers ─────────────────────────────────────────────────────────

function useExpiry(onComplete?: () => void) {
  useEffect(() => {
    if (!onComplete) return;
    const id = window.setTimeout(onComplete, HOLD_MS);
    return () => window.clearTimeout(id);
  }, [onComplete]);
}

function pickString(p: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = p[k];
    if (typeof v === 'string' && v) return v;
  }
  return '';
}

function pickNumber(p: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = p[k];
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}

function pickBoolean(p: Record<string, unknown>, keys: string[]): boolean {
  for (const k of keys) {
    const v = p[k];
    if (typeof v === 'boolean') return v;
  }
  return false;
}

function prettyKind(kind: string): string {
  return kind.replace(/^twitch[-:]?/, '').replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

