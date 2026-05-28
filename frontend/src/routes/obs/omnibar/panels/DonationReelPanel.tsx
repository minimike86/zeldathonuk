import { useEffect, useState } from 'react';
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
 * Layout per donor row:
 *   [#N rank chip]  Donor name  £Amount  [👑 if top donor]  "msg…"  Xm ago
 *
 * Cycle is a 4-phase state machine, mirroring the lane-level panel
 * timing model (enter → dwell → exit → lead-in):
 *
 *      enterMs    dwellMs    exitMs    leadInMs
 *   ───────────┬───────────┬──────────┬──────────┐
 *     enter   │   rest    │   exit   │   gap    │  (empty reel)
 *   ───────────┴───────────┴──────────┴──────────┘
 *
 * Only ONE donor row is rendered at a time — the outgoing donor
 * fully exits before the next enters, with `leadInMs` of empty reel
 * between them so the two rows never overlap visually. Direction,
 * durations and dwell are all driven by
 * `Event.omnibar_layout.donationReel` (set in /control/omnibar).
 *
 * `selectData` returns null when there are no donations so the panel
 * falls out of rotation entirely.
 */

const MESSAGE_MAX_CHARS = 50;

type CyclePhase = 'enter' | 'rest' | 'exit' | 'gap';

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

  // Current donor in the reel.
  const [idx, setIdx] = useState(0);
  // Phase of the current donor's lifecycle (see diagram in the
  // module docstring above).
  const [phase, setPhase] = useState<CyclePhase>('enter');

  // Keep `idx` valid when the donation list shrinks (e.g. reelLength
  // dropped via control panel). Reset phase to `enter` so the new
  // first donor plays its entrance.
  useEffect(() => {
    if (total === 0) return;
    if (idx >= total) {
      setIdx(0);
      setPhase('enter');
    }
  }, [total, idx]);

  // Phase scheduler. Each phase has its own duration; when it
  // elapses we step to the next phase, advancing `idx` when we wrap
  // from `gap` back to `enter`. Single timer per phase keeps the
  // state simple and lets the cleanup unconditionally cancel.
  useEffect(() => {
    if (total <= 1) return;
    let nextPhase: CyclePhase;
    let nextMs: number;
    let advance = false;
    switch (phase) {
      case 'enter':
        nextPhase = 'rest';
        nextMs = cycle.enterMs;
        break;
      case 'rest':
        nextPhase = 'exit';
        nextMs = cycle.dwellMs;
        break;
      case 'exit':
        nextPhase = 'gap';
        nextMs = cycle.exitMs;
        break;
      case 'gap':
        nextPhase = 'enter';
        nextMs = cycle.leadInMs;
        advance = true;
        break;
    }
    const t = window.setTimeout(() => {
      if (advance) setIdx((i) => (i + 1) % total);
      setPhase(nextPhase);
    }, nextMs);
    return () => window.clearTimeout(t);
  }, [phase, idx, total, cycle.enterMs, cycle.dwellMs, cycle.exitMs, cycle.leadInMs]);

  if (total === 0) return null;

  // Crown follows the highest-amount donor across the visible slice
  // (not just the most recent), so viewers learn who the big tipper
  // is even as the reel cycles.
  const topAmount = Math.max(...donations.map((d) => Number(d.amount) || 0));
  const topDonationId = donations.find((d) => Number(d.amount) === topAmount)?.id;

  const label = total === 1 ? 'RECENT DONOR' : `RECENT ${total} DONORS`;

  const d = donations[Math.min(idx, total - 1)];
  if (!d) return null;
  const symbol = currencySymbol(d.currency, fallbackCurrency);
  const amountStr = `${symbol}${Number(d.amount).toFixed(2)}`;
  const isTop = d.id === topDonationId && total > 1;
  const hasMessage = Boolean(d.message && d.message.trim());
  const displayMessage = hasMessage
    ? truncate(cleanForDisplay(d.message), MESSAGE_MAX_CHARS)
    : '';

  const rowStyle: CSSProperties = {
    ['--ob-donor-enter-ms' as keyof CSSProperties]: `${cycle.enterMs}ms` as never,
    ['--ob-donor-exit-ms' as keyof CSSProperties]: `${cycle.exitMs}ms` as never,
  };

  return (
    <PanelRow tag={label}>
      <div className="ob-donor-reel">
        {/* `gap` phase renders nothing — that's the empty-reel pause
          * between donors. `key={idx}` keeps the row mounted across
          * enter → rest → exit on the same donor, so changing the
          * data-phase attribute is enough to re-trigger CSS animation
          * rules. Bumping idx on the gap → enter transition mounts a
          * fresh row, which kicks off the enter keyframe from t=0. */}
        {phase !== 'gap' && (
          <div
            key={idx}
            className="ob-donor-row"
            data-phase={phase}
            data-cycle-dir={cycle.direction}
            style={rowStyle}
          >
            <span className={`ob-donor-rank${isTop ? ' is-top' : ''}`}>#{idx + 1}</span>
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
        )}
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
