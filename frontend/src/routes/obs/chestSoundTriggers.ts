/**
 * Match each donation against the configured ChestAnnouncerSoundTrigger
 * rules and play the winning sound (falls back to the procedural
 * fanfare on no match).
 *
 * Triggers are ordered by `priority` (lowest number = highest priority).
 * Three kinds of match:
 *
 *   game     — the currently-playing schedule entry's game id equals
 *              `trigger.game`.
 *   amount   — `trigger.match` is compiled as a JavaScript RegExp and
 *              tested against the donation's amount string (e.g.
 *              "69.00", "0.69", "23.69"). Currency symbols (£/$/€)
 *              are stripped from the operator's pattern before
 *              compilation so a pattern like `^£69\.00$` still works
 *              the same as `^69\.00$`. Examples:
 *                `69`         → any amount containing "69" anywhere
 *                `^69\.00$`   → exactly 69.00 and nothing else
 *                `\.69$`      → anything ending in 69 pence
 *   keyword  — any of `trigger.match` split on commas (lowercased,
 *              trimmed) appears as a case-insensitive substring of
 *              `donation.message`.
 *
 * Audio playback uses a fresh `Audio` element per call so overlapping
 * stings don't cancel each other (the streamer pre-vetted the audio so
 * they get what they configured). On error the promise resolves with
 * null and the caller falls back to the fanfare.
 */

import type { ChestAnnouncerSoundTrigger, Donation } from '@/lib/obsApi';
import type { PlaybackHandle } from './fanfare';

export interface TriggerMatch {
  sound_url: string;
  volume: number;
  trigger: ChestAnnouncerSoundTrigger;
}

export function pickTrigger(
  donation: Donation,
  triggers: readonly ChestAnnouncerSoundTrigger[],
  currentGameId: number | null,
): TriggerMatch | null {
  // Defensive sort — backend already orders by priority but a stale or
  // mid-fetch list could be unordered.
  const ordered = triggers
    .filter((t) => t.is_active)
    .slice()
    .sort((a, b) => a.priority - b.priority);
  for (const t of ordered) {
    if (matchesTrigger(t, donation, currentGameId)) {
      return { sound_url: t.sound_url, volume: t.volume, trigger: t };
    }
  }
  return null;
}

// Currency symbols stripped from the operator's pattern before
// compilation. Lets a pattern like `^£69\.00$` keep working without
// the matcher having to know which symbol the active event uses, and
// avoids the operator having to escape currency glyphs when copying
// patterns from one event to another with a different symbol.
const CURRENCY_SYMBOLS_RE = /[£$€¥]/g;

function matchesTrigger(
  trigger: ChestAnnouncerSoundTrigger,
  donation: Donation,
  currentGameId: number | null,
): boolean {
  switch (trigger.kind) {
    case 'game':
      return trigger.game !== null && currentGameId === trigger.game;
    case 'amount': {
      // Strip any currency glyphs from the pattern, compile as a JS
      // regex, and test against the bare amount string ("69.00", etc).
      // Bad regex → silent skip; empty pattern never matches.
      if (!trigger.match) return false;
      const cleaned = trigger.match.replace(CURRENCY_SYMBOLS_RE, '');
      if (!cleaned) return false;
      let re: RegExp;
      try {
        re = new RegExp(cleaned);
      } catch {
        return false;
      }
      return re.test(donation.amount);
    }
    case 'keyword': {
      const msg = (donation.message || '').toLowerCase();
      if (!msg) return false;
      const keywords = trigger.match
        .toLowerCase()
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      if (keywords.length === 0) return false;
      return keywords.some((k) => msg.includes(k));
    }
    default:
      return false;
  }
}

/**
 * Play an audio file and return a handle the caller can wait on. The
 * `ended` Promise resolves once playback completes naturally, errors
 * out, or `cancel()` is called — never rejects. Returns null when the
 * browser refuses to even start playback (autoplay policy, missing
 * URL, decode error before play()).
 */
export function playSound(
  url: string,
  volume = 0.6,
): Promise<PlaybackHandle | null> {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    let audio: HTMLAudioElement;
    try {
      audio = new Audio(url);
    } catch {
      resolve(null);
      return;
    }
    audio.volume = Math.max(0, Math.min(1, volume));

    let endResolve: (() => void) | null = null;
    const ended = new Promise<void>((r) => {
      endResolve = r;
    });
    const finish = () => {
      if (endResolve) {
        endResolve();
        endResolve = null;
      }
    };
    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', finish, { once: true });

    let cancelled = false;
    const cancel = () => {
      if (cancelled) return;
      cancelled = true;
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        /* element already detached or paused */
      }
      finish();
    };

    audio
      .play()
      .then(() => resolve({ ended, cancel }))
      .catch(() => {
        finish();
        resolve(null);
      });
  });
}
