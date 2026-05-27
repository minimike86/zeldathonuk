import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './marquee.css';

/**
 * Horizontal marquee for text that may or may not fit its container.
 *
 *  - If the content's natural width is ≤ the container's width, the text
 *    is rendered static, left-aligned, and `onComplete` fires after
 *    `minHoldMs` so a short message still gets a baseline read time.
 *  - Otherwise the text scrolls right→left at a constant pixel/second
 *    rate. It starts at `translateX(containerWidth)` (left edge of text
 *    at the container's right edge) and ends at `translateX(-contentWidth)`
 *    (right edge of text at the container's left edge), travelling
 *    `containerWidth + contentWidth` pixels in a single linear pass.
 *
 * `onComplete` fires once the marquee finishes plus a small breathing
 * pause, so the omnibar queue can advance only after the whole message
 * has been read. Pair it with the TTS promise: whichever finishes later
 * is the real "message consumed" signal.
 */
export function MarqueeText({
  children,
  pxPerSecond = 110,
  minHoldMs = 400,
  startDelayMs = 0,
  onComplete,
  className,
}: {
  children: React.ReactNode;
  pxPerSecond?: number;
  minHoldMs?: number;
  /** Wait this long before starting the scroll. The onComplete timer is
   *  also extended by the same amount so viewers see the whole message. */
  startDelayMs?: number;
  onComplete?: () => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLSpanElement | null>(null);
  const [animation, setAnimation] = useState<{
    durationMs: number;
    startPx: number;
    endPx: number;
  } | null>(null);

  // Measure on mount and whenever the container resizes. If the content
  // overflows we want a constant pixel/second rate regardless of how
  // long the message is, so duration scales with total travel distance.
  useLayoutEffect(() => {
    if (!containerRef.current || !contentRef.current) return;
    const measure = () => {
      const container = containerRef.current!;
      const content = contentRef.current!;
      const cw = container.clientWidth;
      const tw = content.scrollWidth;
      if (tw <= cw) {
        setAnimation(null);
        return;
      }
      const distance = cw + tw;
      const durationMs = (distance / pxPerSecond) * 1000;
      setAnimation({ durationMs, startPx: cw, endPx: -tw });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [pxPerSecond, children]);

  // Fire onComplete after the marquee animation finishes (with a tiny
  // breathing pause) or — when no marquee is needed — after the static
  // hold time. Cleanup ensures we never stack timers across remounts.
  useEffect(() => {
    if (!onComplete) return;
    // Hold = startDelay + (scroll duration | static hold) + breathing
    // tail. When the omnibar starts the marquee delayed by the tag
    // slide-in, this keeps the advance tied to the *visible* end of
    // the message rather than the animation's actual start time.
    const hold = startDelayMs + (animation ? animation.durationMs + 250 : minHoldMs);
    const id = window.setTimeout(() => onComplete(), hold);
    return () => window.clearTimeout(id);
  }, [animation, onComplete, minHoldMs, startDelayMs]);

  return (
    <div ref={containerRef} className={`ob-marquee${className ? ` ${className}` : ''}`}>
      <span
        ref={contentRef}
        className={`ob-marquee-text${animation ? ' is-scrolling' : ''}`}
        style={
          animation
            ? ({
                animationDuration: `${animation.durationMs}ms`,
                animationDelay: `${startDelayMs}ms`,
                ['--marquee-start' as string]: `${animation.startPx}px`,
                ['--marquee-end' as string]: `${animation.endPx}px`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {children}
      </span>
    </div>
  );
}
