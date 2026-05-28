import { useCallback, useEffect, useRef } from 'react';
import { WaveText } from '@/components/WaveText';
import { MarqueeText } from '../../MarqueeText';
import { useTTS } from '@/lib/useTTS';
import { cleanForDisplay, cleanForTTS } from '@/lib/profanity';
import { PanelRow } from './_shared/Row';
import type { PanelProps } from './registry';
import type { Donation } from '@/lib/obsApi';

const BODY_REVEAL_DELAY_MS = 520;
const MAX_HOLD_MS = 25_000;
// Played in place of the TTS "Thank you!" suffix when a donation has
// no message — short Wind Waker Beedle "thank you" sting.
const THANK_YOU_SFX_URL = '/assets/audio/ww_beedle_thankyou.mp3';
// Safety cap on how long we'll wait for the SFX to report `ended`
// before advancing the donation queue — covers the case where the
// browser blocks autoplay and the audio never starts.
const THANK_YOU_SFX_MAX_MS = 4000;

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
  // The legacy "Thank you!" suffix is dropped from the no-message
  // utterance — instead we play the Beedle "thank you" SFX after the
  // donation announcement (see below).
  const utterance = hasMessage && spokenMessage
    ? `${displayName} just donated ${amountStr} and says: ${spokenMessage}`
    : `${displayName} just donated ${amountStr}.`;

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
    speak(utterance).then(async (res) => {
      if (cancelled) return;
      ttsDoneRef.current = true;
      // For donations without a written message we used to TTS
      // "Thank you!" — that's replaced by the Beedle SFX. The SFX's
      // own duration (~2s) acts as the post-announcement hold, so
      // we don't need the previous NO_MESSAGE_HOLD_MS branch.
      if (!hasMessage) {
        await playThankYouSfx();
        if (cancelled) return;
      } else if (!res.spoken) {
        // Message present but TTS didn't actually speak (autoplay
        // blocked etc.) — the marquee is the remaining gate.
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

/** Play the Beedle "thank you" sting and resolve when it ends (or
 *  when the safety timeout trips). Errors and autoplay blocks are
 *  swallowed so a missing/blocked audio file can't lock the donation
 *  queue — the safety timeout guarantees the promise resolves. */
function playThankYouSfx(): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve();
    };
    try {
      const audio = new Audio(THANK_YOU_SFX_URL);
      audio.volume = 0.85;
      audio.addEventListener('ended', finish, { once: true });
      audio.addEventListener('error', finish, { once: true });
      audio.play().catch(finish);
    } catch {
      finish();
    }
    window.setTimeout(finish, THANK_YOU_SFX_MAX_MS);
  });
}
