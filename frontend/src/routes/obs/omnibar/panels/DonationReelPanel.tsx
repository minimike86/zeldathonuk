import { useEffect, useState } from 'react';
import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';
import type { Donation } from '@/lib/obsApi';

/**
 * Steady-state cycling reel of the last few donors. Distinct from the
 * LiveDonationPanel takeover — this is just an "ICYMI" recap that
 * shares the bottom-lane rotation slot. Cycles internally every
 * ~2.5s so multiple donors get airtime within one rotation slot.
 *
 * Returns null when there are no donations so the panel falls out of
 * rotation entirely (no "no donors yet" dead card).
 */
const DONOR_CYCLE_MS = 2500;
const REEL_LENGTH = 5;

interface Data {
  donations: Donation[];
  fallbackCurrency: string;
}

function Panel({ data }: PanelProps<Data>) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (data.donations.length <= 1) return;
    const id = window.setInterval(
      () => setIdx((i) => (i + 1) % data.donations.length),
      DONOR_CYCLE_MS,
    );
    return () => window.clearInterval(id);
  }, [data.donations.length]);

  const d = data.donations[idx] ?? data.donations[0];
  const symbol = currencySymbol(d.currency, data.fallbackCurrency);
  const label =
    data.donations.length === 1 ? 'RECENT DONOR' : `RECENT ${data.donations.length} DONORS`;

  return (
    <PanelRow tag={label}>
      <span className="ob-text-strong">{d.donor_name?.trim() || 'Anonymous'}</span>
      <span className="ob-donor-amount" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {symbol}
        {Number(d.amount).toFixed(2)}
      </span>
      {data.donations.length > 1 && (
        <span className="ob-donor-dots-inline" aria-hidden>
          {data.donations.map((_, i) => (
            <span key={i} data-active={i === idx} />
          ))}
        </span>
      )}
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

registerPanel<Data>({
  id: 'donation-reel',
  component: Panel,
  selectData: (feed) => {
    if (feed.donations.length === 0) return null;
    return {
      donations: feed.donations.slice(0, REEL_LENGTH),
      fallbackCurrency: feed.event?.currency_symbol ?? '£',
    };
  },
  minDurationMs: 8000,
});
