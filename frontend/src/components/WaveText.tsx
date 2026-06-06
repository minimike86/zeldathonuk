import { useEffect, useRef, useState } from 'react';
import './WaveText.css';

/**
 * Per-character drop-and-bounce wave. Each letter falls in with a small
 * stagger so the wave propagates left→right. Used on the home page's
 * rotating Up Next header and the OBS omnibar slots.
 *
 * Animation replays whenever `text` changes: a version counter bumps,
 * which changes the per-char span keys and forces React to remount.
 *
 * Each character's CSS animation-delay = `startDelayMs + i * staggerMs`.
 * Pass `startDelayMs` when the wave needs to wait for an outer entrance
 * (e.g. the omnibar's tag pill slide-in lands before its body waves in).
 * The keyframe uses `animation-fill-mode: both` so characters hold the
 * pre-animation state during the delay rather than flashing on screen.
 *
 * Words are grouped into nowrap spans so a line break can only land at a
 * space, never mid-word: each letter is its own inline-block, and without
 * grouping the browser is free to break between any two of them (printing
 * e.g. "MAGIC POW" / "DER"). The stagger index runs across the whole string
 * so the wave stays continuous through the word groups.
 */
export function WaveText({
  text,
  staggerMs = 45,
  startDelayMs = 0,
}: {
  text: string;
  staggerMs?: number;
  startDelayMs?: number;
}) {
  const [version, setVersion] = useState(0);
  const lastTextRef = useRef(text);
  useEffect(() => {
    if (lastTextRef.current !== text) {
      lastTextRef.current = text;
      setVersion((v) => v + 1);
    }
  }, [text]);

  // Tokenise into words and the whitespace between them. Whitespace renders as
  // plain text (the only soft-wrap opportunity); each word is a nowrap group.
  const tokens = text.match(/\s+|\S+/g) ?? [];
  let charIndex = 0;
  return (
    <span className="wave-text">
      {tokens.map((token, ti) => {
        if (/\s/.test(token)) {
          charIndex += token.length;
          return ' ';
        }
        const startIndex = charIndex;
        charIndex += token.length;
        return (
          <span className="wave-word" key={`${version}-w${ti}`}>
            {Array.from(token).map((ch, ci) => (
              <span
                key={ci}
                style={{ animationDelay: `${startDelayMs + (startIndex + ci) * staggerMs}ms` }}
              >
                {ch}
              </span>
            ))}
          </span>
        );
      })}
    </span>
  );
}
