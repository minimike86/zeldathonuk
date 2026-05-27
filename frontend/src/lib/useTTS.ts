import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Wrapper around window.speechSynthesis with two affordances the raw API
 * lacks:
 *
 *  1. `speak(text)` returns a promise that resolves on the utterance's
 *     onend OR oncanceled OR onerror. The omnibar queue uses this to
 *     hold a donation card on screen until the TTS playback finishes.
 *
 *  2. Voice-list-loading is asynchronous on Chrome — the first call to
 *     getVoices() typically returns []. We re-poll on the voiceschanged
 *     event and pick a UK English voice when one becomes available.
 *
 * `cancel()` aborts the current utterance and any queued ones, and the
 * outstanding promise resolves immediately (with `cancelled: true`).
 *
 * If the browser doesn't have speechSynthesis (rare; mainly headless or
 * very old environments) `supported` is false and `speak()` resolves
 * immediately. Callers should not rely on TTS being audible — for the
 * omnibar that means falling back to a minimum visual hold time.
 */
export interface SpeakResult {
  spoken: boolean;
  cancelled: boolean;
  durationMs: number;
}

interface UseTTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  // Substring matched against voice.lang and voice.name in priority order
  preferredVoices?: string[];
}

const DEFAULTS: Required<UseTTSOptions> = {
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  preferredVoices: ['en-GB', 'en_GB', 'British', 'UK English', 'en-US'],
};

export function useTTS(options: UseTTSOptions = {}) {
  const opts: Required<UseTTSOptions> = { ...DEFAULTS, ...options };
  const supported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // Resolver kept on a ref so cancel() and the utterance event handlers
  // can both call it without stale-closure issues.
  const resolverRef = useRef<((r: SpeakResult) => void) | null>(null);

  // Pick the best voice we can find from the (possibly-async) voice list.
  // The "first match wins" loop matches in user-supplied priority order.
  useEffect(() => {
    if (!supported) return;
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      for (const needle of opts.preferredVoices) {
        const hit = voices.find(
          (v) =>
            v.lang.toLowerCase().includes(needle.toLowerCase()) ||
            v.name.toLowerCase().includes(needle.toLowerCase()),
        );
        if (hit) {
          setVoice(hit);
          return;
        }
      }
      setVoice(voices[0]);
    };
    pick();
    window.speechSynthesis.addEventListener('voiceschanged', pick);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', pick);
    };
    // preferredVoices is an array literal — use stable JSON key so the
    // effect doesn't re-run on every render when the caller passes a
    // new array each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, opts.preferredVoices.join('|')]);

  const cancel = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    if (resolverRef.current) {
      resolverRef.current({ spoken: false, cancelled: true, durationMs: 0 });
      resolverRef.current = null;
    }
  }, [supported]);

  const speak = useCallback(
    (text: string): Promise<SpeakResult> => {
      if (!supported || !text.trim()) {
        return Promise.resolve({ spoken: false, cancelled: false, durationMs: 0 });
      }
      // Cancel anything mid-flight so we don't queue indefinitely.
      cancel();

      return new Promise<SpeakResult>((resolve) => {
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = opts.rate;
        utt.pitch = opts.pitch;
        utt.volume = opts.volume;
        if (voice) utt.voice = voice;

        const startedAt = performance.now();
        const finish = (cancelled: boolean) => {
          if (resolverRef.current !== resolve) return; // superseded
          resolverRef.current = null;
          resolve({
            spoken: !cancelled,
            cancelled,
            durationMs: performance.now() - startedAt,
          });
        };
        utt.onend = () => finish(false);
        utt.onerror = () => finish(true);

        utteranceRef.current = utt;
        resolverRef.current = resolve;
        window.speechSynthesis.speak(utt);
      });
    },
    [supported, voice, cancel, opts.rate, opts.pitch, opts.volume],
  );

  // On unmount, abort any in-flight utterance so a stale handler doesn't
  // try to setState on an unmounted component.
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
      resolverRef.current = null;
    };
  }, [supported]);

  return { speak, cancel, supported, voice };
}
