import { useCallback, useEffect, useRef } from 'react';
import { WaveText } from '@/components/WaveText';
import { MarqueeText } from '../../MarqueeText';
import { useTTS } from '@/lib/useTTS';
import { cleanForDisplay, cleanForTTS } from '@/lib/profanity';
import { PanelRow } from './_shared/Row';
import type { PanelProps } from './registry';
import type { Donation } from '@/lib/obsApi';

const BODY_REVEAL_DELAY_MS = 520;
const NO_MESSAGE_HOLD_MS = 4500;
const MAX_HOLD_MS = 25_000;

interface Data {
  donation: Donation;
  fallbackCurrency: string;
}

/**
 * Live donation card — waits on BOTH the TTS utterance and the marquee
 * pass before calling onComplete. Falls back to a min hold if TTS isn't
 * supported; safety-net timeout guarantees the queue can never lock up.
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
  const spokenMessage = hasMessage ? cleanForTTS(donation.message) : '';
  const utterance = hasMessage && spokenMessage
    ? `${displayName} just donated ${amountStr} and says: ${spokenMessage}`
    : `${displayName} just donated ${amountStr}. Thank you!`;

  const { speak } = useTTS();
  const ttsDoneRef = useRef(false);
  const marqueeDoneRef = useRef(!hasMessage);
  const advancedRef = useRef(false);

  const maybeAdvance = useCallback(() => {
    if (advancedRef.current) return;
    if (ttsDoneRef.current && marqueeDoneRef.current) {
      advancedRef.current = true;
      onComplete?.();
    }
  }, [onComplete]);

  useEffect(() => {
    let cancelled = false;
    speak(utterance).then((res) => {
      if (cancelled) return;
      ttsDoneRef.current = true;
      if (!res.spoken && !hasMessage) {
        window.setTimeout(maybeAdvance, NO_MESSAGE_HOLD_MS);
        return;
      }
      maybeAdvance();
    });
    return () => { cancelled = true; };
    // donation.id is stable for a mounted instance — empty deps is safe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safety net so the queue never locks up.
  useEffect(() => {
    const id = window.setTimeout(() => {
      ttsDoneRef.current = true;
      marqueeDoneRef.current = true;
      maybeAdvance();
    }, MAX_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [maybeAdvance]);

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
            onComplete={() => {
              marqueeDoneRef.current = true;
              maybeAdvance();
            }}
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
