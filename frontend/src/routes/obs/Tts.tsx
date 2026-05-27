import { useEffect, useRef, useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { Donation } from '@/lib/obsApi';
import './tts.css';

/**
 * TTS overlay — reads incoming donation messages aloud via the browser's
 * Web Speech API and displays a card for each one.
 *
 * Queue model:
 *   - Poll /api/donations/ every 3s. On the first poll, snapshot every
 *     existing donation as "seen" so reloading mid-stream doesn't
 *     TTS-spam the entire donation history.
 *   - On subsequent polls, fresh donations (unseen + has a message)
 *     get enqueued in arrival order.
 *   - One card is on screen at a time. When the utterance fires `onend`
 *     (or onerror, or a max-hold timeout for browsers that swallow
 *     events), the next queued donation is dequeued and announced.
 *   - When the queue empties, the card fades out after a short hold.
 *
 * The previous implementation just did `setNow(fresh[last])` on every
 * poll — so when two donations landed in the same 3s window, the first
 * one's card was overwritten silently and only the second got read.
 */

const HOLD_AFTER_END_MS = 4000;
const MAX_UTTERANCE_HOLD_MS = 25_000;

interface QueueItem {
  id: number;
  donor: string;
  amount: string;
  message: string;
}

export function Tts() {
  const { data: donations } = usePolledQuery(obsApi.donations, 3000);

  // seenIds is every donation id we've ever observed (whether we spoke
  // it or not). Cold-boot seeds this so the announcer doesn't replay
  // historical donations.
  const seenIdsRef = useRef<Set<number>>(new Set());
  const initialisedRef = useRef(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [now, setNow] = useState<QueueItem | null>(null);
  const speakingRef = useRef(false);

  // Enqueue fresh donations as the poll observes them.
  useEffect(() => {
    if (!donations) return;
    if (!initialisedRef.current) {
      donations.forEach((d) => seenIdsRef.current.add(d.id));
      initialisedRef.current = true;
      return;
    }
    const fresh = donations.filter(
      (d) => !seenIdsRef.current.has(d.id) && d.message && d.message.trim().length > 0,
    );
    if (fresh.length === 0) return;
    fresh.forEach((d) => seenIdsRef.current.add(d.id));
    // Oldest first — donations come back newest-first from the API.
    const ordered = [...fresh].sort(
      (a, b) => Date.parse(a.donated_at) - Date.parse(b.donated_at),
    );
    setQueue((prev) => [...prev, ...ordered.map(toQueueItem)]);
  }, [donations]);

  // Drain the queue one item at a time. When `now` is null and there's
  // a queued item AND we're not mid-speech, pop the head and announce
  // it. The utterance's onend / onerror (and a safety timeout) clears
  // `now`, which retriggers this effect.
  useEffect(() => {
    if (now || speakingRef.current || queue.length === 0) return;
    const [head, ...rest] = queue;
    setQueue(rest);
    setNow(head);
    speak(head, () => {
      speakingRef.current = false;
      // Brief hold after the utterance ends so viewers can read the
      // card before it vanishes — only matters when the queue is empty;
      // otherwise the next iteration replaces it immediately.
      window.setTimeout(() => setNow((curr) => (curr?.id === head.id ? null : curr)), HOLD_AFTER_END_MS);
    });
  }, [now, queue]);

  return (
    <div className="tts-stage">
      {now && (
        <div key={now.id} className="tts-card">
          <div className="tts-donor">{now.donor}</div>
          <div className="tts-amount">£{now.amount}</div>
          <div className="tts-message">&ldquo;{now.message}&rdquo;</div>
          {queue.length > 0 && (
            /* Tiny pip in the bottom-right showing how many more
             * donations are waiting their turn. Keeps the operator
             * (and viewers, if the source is visible) aware that the
             * backlog is moving rather than wondering if TTS hung. */
            <div className="tts-queue-pip" aria-hidden>
              +{queue.length} more
            </div>
          )}
        </div>
      )}
    </div>
  );

  function speak(item: QueueItem, onDone: () => void) {
    if (!('speechSynthesis' in window)) {
      // No Web Speech API — still show the card, advance after the
      // safety timeout so the queue keeps moving.
      window.setTimeout(onDone, MAX_UTTERANCE_HOLD_MS / 2);
      return;
    }
    speakingRef.current = true;
    const u = new SpeechSynthesisUtterance(
      `${item.donor} donated £${item.amount}. ${item.message}`,
    );

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      onDone();
    };
    u.onend = finish;
    u.onerror = finish;
    // Some browsers (Chrome on Linux notably) drop `onend` after long
    // utterances or when the tab loses focus. Cap each utterance to a
    // sensible upper bound so a swallowed event doesn't freeze the queue.
    window.setTimeout(finish, MAX_UTTERANCE_HOLD_MS);

    window.speechSynthesis.speak(u);
  }
}

function toQueueItem(d: Donation): QueueItem {
  return {
    id: d.id,
    donor: d.donor_name || 'Anonymous',
    amount: d.amount,
    message: d.message,
  };
}
