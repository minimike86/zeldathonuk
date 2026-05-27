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
  const { data: replay } = usePolledQuery(obsApi.ttsReplay, 2000);

  // seenIds is every donation id we've ever observed (whether we spoke
  // it or not). Cold-boot seeds this so the announcer doesn't replay
  // historical donations.
  const seenIdsRef = useRef<Set<number>>(new Set());
  const initialisedRef = useRef(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [now, setNow] = useState<QueueItem | null>(null);
  const speakingRef = useRef(false);

  // Chrome's autoplay policy gates speechSynthesis.speak() behind a
  // user gesture — without it, utterances are silently swallowed even
  // though `onend` may still fire after a tick. OBS browser sources
  // ship audio enabled by default and report a distinctive UA, so we
  // auto-start there. Anywhere else (a tab opened by the operator for
  // monitoring) shows a one-time click-to-enable overlay.
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (/OBS\//i.test(navigator.userAgent)) setStarted(true);
  }, []);
  const handleStart = () => {
    // Speaking a one-character utterance during the click event is the
    // canonical "unlock" trick — it counts as the gesture-tied first
    // speak so every subsequent speak() inherits the permission.
    if ('speechSynthesis' in window) {
      const unlock = new SpeechSynthesisUtterance(' ');
      unlock.volume = 0;
      window.speechSynthesis.speak(unlock);
    }
    setStarted(true);
  };

  // Replay watcher — when /api/tts/replay/ reports a `requested_at`
  // newer than the value we last saw, enqueue the referenced donation
  // regardless of the seen-id guard. Cold-boot snapshots the current
  // timestamp so we don't replay the last-ever replay request every
  // time the overlay reconnects.
  const lastReplayAtRef = useRef<string | null>(null);
  useEffect(() => {
    if (!replay) return;
    if (lastReplayAtRef.current === null) {
      lastReplayAtRef.current = replay.requested_at;
      return;
    }
    if (replay.requested_at === lastReplayAtRef.current) return;
    lastReplayAtRef.current = replay.requested_at;
    if (replay.donation_id == null || !donations) return;
    const d = donations.find((x) => x.id === replay.donation_id);
    if (!d) return;
    // Mute beats Replay — if an operator clicks Replay on a muted row,
    // honour the mute. The /control/donations UI already disables the
    // Replay button on muted rows; this guard is defence-in-depth in
    // case the click sneaks through (race between mute + replay).
    if (d.is_muted) return;
    // Replays jump the queue — push to the FRONT so the operator sees
    // their replay request take effect within one tick rather than
    // waiting behind any naturally-arriving donations.
    setQueue((prev) => [toQueueItem(d), ...prev]);
  }, [replay, donations]);

  // Enqueue fresh donations as the poll observes them.
  useEffect(() => {
    if (!donations) return;
    if (!initialisedRef.current) {
      donations.forEach((d) => seenIdsRef.current.add(d.id));
      initialisedRef.current = true;
      return;
    }
    const fresh = donations.filter(
      (d) =>
        !seenIdsRef.current.has(d.id) &&
        d.message &&
        d.message.trim().length > 0 &&
        // Skip muted donations entirely. They're not added to seenIds
        // either (since they didn't pass the filter), so unmuting one
        // later will flow it through normally without the operator
        // having to also click Replay.
        !d.is_muted,
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
  // a queued item AND we're not mid-speech AND we've cleared the audio
  // gate, pop the head and announce it. The utterance's onend /
  // onerror (and a safety timeout) clears `now`, which retriggers
  // this effect.
  useEffect(() => {
    if (!started || now || speakingRef.current || queue.length === 0) return;
    const [head, ...rest] = queue;
    setQueue(rest);
    setNow(head);
    // Mirror "now reading" to the backend so /control/donations can
    // highlight the live row. Best-effort fire-and-forget.
    void obsApi.setTtsNowReading(head.id).catch(() => {});
    speak(head, () => {
      speakingRef.current = false;
      void obsApi.setTtsNowReading(null).catch(() => {});
      // Brief hold after the utterance ends so viewers can read the
      // card before it vanishes — only matters when the queue is empty;
      // otherwise the next iteration replaces it immediately.
      window.setTimeout(() => setNow((curr) => (curr?.id === head.id ? null : curr)), HOLD_AFTER_END_MS);
    });
  }, [started, now, queue]);

  // Mute mid-utterance — if the operator mutes the currently-speaking
  // donation in /control/donations, the next poll will mark it muted.
  // Cancel speech immediately, skip the hold, free `speakingRef` so the
  // drain effect picks the next queued donation on the very next render.
  useEffect(() => {
    if (!now || !donations) return;
    const current = donations.find((d) => d.id === now.id);
    if (!current?.is_muted) return;
    console.debug(`[tts] utterance #${now.id} cancelled — donation muted`);
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignored — see speak()'s rationale */
    }
    speakingRef.current = false;
    void obsApi.setTtsNowReading(null).catch(() => {});
    setNow(null);
  }, [now, donations]);

  // Clear the now-reading mirror on unmount so /control/donations
  // doesn't show a stale highlight after the overlay closes.
  useEffect(() => {
    return () => {
      void obsApi.setTtsNowReading(null).catch(() => {});
    };
  }, []);

  return (
    <div className="tts-stage">
      {!started && (
        /* Audio-unlock overlay shown in regular browsers (not OBS).
         * speechSynthesis is gated behind a user gesture, so we need
         * one click before the announcer can speak. OBS auto-starts. */
        <button
          type="button"
          className="tts-start-gesture"
          onClick={handleStart}
        >
          <span className="tts-start-icon">🔊</span>
          <span className="tts-start-label">Click to enable TTS</span>
          <span className="tts-start-hint">
            Browsers require a user gesture before audio can play.
            OBS browser sources auto-enable.
          </span>
        </button>
      )}
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

    // Chromium has a long-standing bug where the speak queue can wedge
    // after a `cancel()` mid-utterance or after a tab regains focus —
    // subsequent speak() calls enqueue silently and never fire `onend`.
    // Always cancel + resume first so the synth starts from a known
    // state, then queue the new utterance.
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch {
      /* some browsers throw on cancel() with no active utterance — ignore */
    }

    const u = new SpeechSynthesisUtterance(
      `${item.donor} donated £${item.amount}. ${item.message}`.trim(),
    );
    u.rate = 1;
    u.pitch = 1;
    u.volume = 1;

    let settled = false;
    const finish = (why: string) => {
      if (settled) return;
      settled = true;
      // Log so an operator opening DevTools can see whether TTS is
      // actually firing or just timing out — silent failures are by
      // far the most common TTS bug.
      console.debug(`[tts] utterance #${item.id} ${why}`);
      onDone();
    };
    u.onend = () => finish('ended');
    u.onerror = (e) => finish(`error: ${e.error ?? 'unknown'}`);
    // Some browsers (Chrome on Linux notably) drop `onend` after long
    // utterances or when the tab loses focus. Cap each utterance to a
    // sensible upper bound so a swallowed event doesn't freeze the queue.
    window.setTimeout(() => finish('timeout'), MAX_UTTERANCE_HOLD_MS);

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
