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
  return (
    <span className="wave-text">
      {Array.from(text).map((ch, i) => (
        <span
          key={`${version}-${i}`}
          style={{ animationDelay: `${startDelayMs + i * staggerMs}ms` }}
        >
          {/* Use a non-breaking space — a literal space inside an
              inline-block span often collapses to zero width when the
              parent allows white-space normalisation, which made the
              omnibar render "Cadence of Hyrule" as "CADENCEOFHYRULE". */}
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}
