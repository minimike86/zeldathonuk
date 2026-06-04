import { useCallback, useEffect, useRef } from 'react';
import { WaveText } from '@/components/WaveText';
import { MarqueeText } from '../../MarqueeText';
import { cleanForDisplay } from '@/lib/profanity';
import { PanelRow } from './_shared/Row';
import type { PanelProps } from './registry';
import type { Donation } from '@/lib/obsApi';

const BODY_REVEAL_DELAY_MS = 520;
const MAX_HOLD_MS = 25_000;
// How long a no-message donation card holds before advancing. The
// readout (TTS) lives on the Chest Announcer now, so this panel is a
// purely visual takeover — a no-message card has no marquee to gate on,
// so it dwells for a fixed beat instead.
const NO_MESSAGE_HOLD_MS = 4000;

interface Data {
  donation: Donation;
  fallbackCurrency: string;
}

/**
 * Live donation card — a silent visual takeover. The spoken donation
 * readout was moved to the Chest Announcer (/obs/chest-announcer), which
 * holds the donor's card up and reads it aloud; this panel just flashes
 * the donation in the omnibar's bottom lane with no audio.
 *
 * Completion gating (no audio to wait on):
 *   - message present → advance when the marquee finishes its pass.
 *   - no message      → advance after NO_MESSAGE_HOLD_MS.
 * A MAX_HOLD_MS safety net guarantees the queue can never lock up.
 *
 * Not registered with the panel registry — driven directly by the
 * donation interrupt code in Omnibar.tsx since its lifecycle is
 * different from rotation panels (it's a takeover that ends itself).
 */
export function LiveDonationPanel({ data, onComplete }: PanelProps<Data>) {
  const { donation } = data;
  const symbol = currencySymbol(donation.currency, data.fallbackCurrency);
  const displayName = donation.donor_name?.trim() || 'An anonymous donor';
  const amountStr = `${symbol}${Number(donation.amount).toFixed(2)}`;
  const hasMessage = Boolean(donation.message && donation.message.trim());
  const displayMessage = hasMessage ? cleanForDisplay(donation.message) : '';

  const advancedRef = useRef(false);
  const advance = useCallback(() => {
    if (advancedRef.current) return;
    advancedRef.current = true;
    onComplete?.();
  }, [onComplete]);

  // No-message cards have no marquee to gate on, so dwell for a fixed
  // beat then advance. (Cards with a message advance on the marquee's
  // onComplete below.)
  useEffect(() => {
    if (hasMessage) return;
    const id = window.setTimeout(advance, NO_MESSAGE_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [hasMessage, advance]);

  // Safety net so the queue never locks up.
  useEffect(() => {
    const id = window.setTimeout(advance, MAX_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [advance]);

  return (
    <PanelRow tag="DONATION!" arrow flash>
      <div className="ob-live-donation">
        <div className="ob-live-headline">
          <WaveText text={displayName} staggerMs={26} startDelayMs={BODY_REVEAL_DELAY_MS} />
          <span className="ob-live-amount">{amountStr}</span>
        </div>
        {hasMessage ? (
          <MarqueeText
            className="ob-live-message"
            pxPerSecond={110}
            minHoldMs={2500}
            startDelayMs={BODY_REVEAL_DELAY_MS}
            onComplete={advance}
          >
            “{displayMessage}”
          </MarqueeText>
        ) : (
          <span className="ob-text-muted">Thank you!</span>
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
