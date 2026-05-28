import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';
import {
  readDonationReelConfig,
  type DonationReelConfig,
} from '../hooks/useLayoutConfig';
import { cleanForDisplay } from '@/lib/profanity';
import type { Donation } from '@/lib/obsApi';

/**
 * Steady-state cycling reel of the last few donors. Distinct from the
 * LiveDonationPanel takeover — this is just an "ICYMI" recap that
 * shares the bottom-lane rotation slot.
 *
 * Visual elements per donor:
 *   [#N rank chip]  Donor name  £Amount  [👑 if top donor]  "msg…"  Xm ago
 *
 * Cycle direction / duration / cadence / reel length are all driven
 * by `Event.omnibar_layout.donationReel` — set in /control/omnibar.
 *
 * Switching is a two-row ping-pong: the outgoing row keeps painting
 * (with `.is-cycling-out`) for the configured `switchMs` while the
 * incoming row mounts behind it with `.is-cycling-in`. Both rows are
 * absolutely positioned inside `.ob-donor-reel` so they overlap and
 * the slide motion reads as a clean cross-fade.
 *
 * Returns null when there are no donations so the panel falls out of
 * rotation entirely (no "no donors yet" dead card).
 */

const MESSAGE_MAX_CHARS = 50;
// Small buffer beyond the configured switchMs before unmounting the
// outgoing row, so its CSS animation has a frame to settle at the
// final state before React removes the node.
const SWITCH_UNMOUNT_BUFFER_MS = 40;

interface Data {
  donations: Donation[];
  fallbackCurrency: string;
  cycle: DonationReelConfig;
  /** From `feed.now` so the relative-time chip ticks every second
   *  without remounting the panel. */
  now: Date;
}

function Panel({ data }: PanelProps<Data>) {
  const { donations, fallbackCurrency, cycle, now } = data;
  const total = donations.length;

  // Index of the currently-shown donor in `donations`. State, not ref,
  // so the row re-renders when it advances.
  const [idx, setIdx] = useState(0);
  // Snapshot of the previously-shown index while its exit animation
  // is playing. Cleared once the switch window elapses.
  const [leavingIdx, setLeavingIdx] = useState<number | null>(null);
  const switchTimerRef = useRef<number | null>(null);

  // Keep `idx` valid when the donation list shrinks (e.g. reelLength
  // dropped via control panel).
  useEffect(() => {
    if (idx >= total && total > 0) setIdx(0);
  }, [total, idx]);

  // Cycle timer. Skips when only one donor is in the reel.
  useEffect(() => {
    if (total <= 1) return;
    const id = window.setInterval(() => {
      setIdx((i) => {
        const next = (i + 1) % total;
        setLeavingIdx(i);
        if (switchTimerRef.current !== null) {
          window.clearTimeout(switchTimerRef.current);
        }
        const t = window.setTimeout(() => {
          if (switchTimerRef.current !== t) return;
          switchTimerRef.current = null;
          setLeavingIdx(null);
        }, cycle.switchMs + SWITCH_UNMOUNT_BUFFER_MS);
        switchTimerRef.current = t;
        return next;
      });
    }, cycle.cycleMs);
    return () => {
      window.clearInterval(id);
      if (switchTimerRef.current !== null) {
        window.clearTimeout(switchTimerRef.current);
        switchTimerRef.current = null;
      }
    };
  }, [total, cycle.cycleMs, cycle.switchMs]);

  if (total === 0) return null;

  // Top donor by amount across the WHOLE visible reel (not just the
  // current donor) — the crown follows the same donor through every
  // cycle so viewers learn who the big tipper is.
  const topAmount = Math.max(...donations.map((d) => Number(d.amount) || 0));
  const topDonationId = donations.find((d) => Number(d.amount) === topAmount)?.id;

  const label = total === 1 ? 'RECENT DONOR' : `RECENT ${total} DONORS`;

  const rowStyle: CSSProperties = {
    ['--ob-cycle-ms' as keyof CSSProperties]: `${cycle.switchMs}ms` as never,
  };

  const renderRow = (i: number, role: 'in' | 'out' | 'static') => {
    const d = donations[i];
    if (!d) return null;
    const symbol = currencySymbol(d.currency, fallbackCurrency);
    const amountStr = `${symbol}${Number(d.amount).toFixed(2)}`;
    const isTop = d.id === topDonationId && total > 1;
    const hasMessage = Boolean(d.message && d.message.trim());
    const displayMessage = hasMessage
      ? truncate(cleanForDisplay(d.message), MESSAGE_MAX_CHARS)
      : '';
    const cls =
      'ob-donor-row' +
      (role === 'in' ? ' is-cycling-in' : '') +
      (role === 'out' ? ' is-cycling-out' : '');
    return (
      <div
        key={`${role}:${d.id}`}
        className={cls}
        data-cycle-dir={cycle.direction}
        style={rowStyle}
      >
        <span className={`ob-donor-rank${isTop ? ' is-top' : ''}`}>#{i + 1}</span>
        <span className="ob-donor-name">{d.donor_name?.trim() || 'Anonymous'}</span>
        <span className="ob-donor-amount">{amountStr}</span>
        {isTop && (
          <span className="ob-donor-crown" aria-label="Top donor">👑</span>
        )}
        {displayMessage && (
          <span className="ob-donor-message">“{displayMessage}”</span>
        )}
        <span className="ob-donor-age">{formatRelativeTime(d.donated_at, now)}</span>
      </div>
    );
  };

  return (
    <PanelRow tag={label}>
      <div className="ob-donor-reel">
        {/* Render leaving FIRST so it sits behind the incoming row in
          * the stacking order — slide animations cross visually,
          * but the new content is what the viewer ends up reading. */}
        {leavingIdx !== null && leavingIdx !== idx
          ? renderRow(leavingIdx, 'out')
          : null}
        {renderRow(idx, leavingIdx !== null ? 'in' : 'static')}
      </div>
    </PanelRow>
  );
}

function currencySymbol(code: string, fallback: string) {
  switch (code) {
    case 'GBP': return '£';
    case 'USD': return '$';
    case 'EUR': return '€';
    default: return fallback;
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

function formatRelativeTime(iso: string, now: Date): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.floor((now.getTime() - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

registerPanel<Data>({
  id: 'donation-reel',
  component: Panel,
  selectData: (feed) => {
    if (feed.donations.length === 0) return null;
    const cycle = readDonationReelConfig(feed.event?.omnibar_layout);
    return {
      donations: feed.donations.slice(0, cycle.reelLength),
      fallbackCurrency: feed.event?.currency_symbol ?? '£',
      cycle,
      now: feed.now,
    };
  },
  minDurationMs: 8000,
});
