import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import '../../../marquee.css';

/**
 * Drop-in flex container that renders its children inline-flex. When
 * their natural width fits the container, it behaves like a static
 * row. When the children overflow, the row continuously scrolls
 * right→left at `pxPerSecond`, with a `gapPx` breathing space before
 * the looped duplicate appears from the right edge.
 *
 * Used by status panels (e.g. PreStreamPanel) where the trailing
 * "· {next game title}" hint would otherwise get clipped on narrow
 * scenes. The marquee only engages when overflow is measured, so a
 * short event name + countdown stays still and reads cleanly.
 */
export function MarqueeOnOverflow({
  children,
  pxPerSecond = 50,
  gapPx = 60,
  gap = '0.85rem',
  className,
}: {
  children: ReactNode;
  /** Scroll speed when overflowing, in pixels per second. */
  pxPerSecond?: number;
  /** Visual breathing space between the loop's tail and the next head. */
  gapPx?: number;
  /** Flex gap between children inside the row. Matches `.ob-row-body`'s
   *  `0.85rem` so the layout is identical to the un-wrapped version. */
  gap?: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scroll, setScroll] = useState<{
    durationMs: number;
    distancePx: number;
  } | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;
    const measure = () => {
      const cw = container.clientWidth;
      const tw = content.scrollWidth;
      // Functional updater compares the new measurement to the existing
      // state and returns the previous object identity unchanged when
      // nothing moved. Without this the CSS animation would restart on
      // every parent render — the countdown re-renders the panel each
      // second, which would otherwise reset the marquee position.
      if (tw <= cw) {
        setScroll((prev) => (prev === null ? prev : null));
        return;
      }
      const distance = tw + gapPx;
      const durationMs = (distance / pxPerSecond) * 1000;
      setScroll((prev) =>
        prev && prev.distancePx === distance && prev.durationMs === durationMs
          ? prev
          : { durationMs, distancePx: distance },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    ro.observe(content);
    return () => ro.disconnect();
  }, [pxPerSecond, gapPx]);

  const trackStyle: CSSProperties | undefined = scroll
    ? ({
        animationDuration: `${scroll.durationMs}ms`,
        gap: `${gapPx}px`,
        ['--auto-marquee-distance' as string]: `-${scroll.distancePx}px`,
      } as CSSProperties)
    : undefined;

  return (
    <div
      ref={containerRef}
      className={`ob-auto-marquee${className ? ` ${className}` : ''}`}
    >
      <div
        className={`ob-auto-marquee-track${scroll ? ' is-scrolling' : ''}`}
        style={trackStyle}
      >
        <div ref={contentRef} className="ob-auto-marquee-group" style={{ gap }}>
          {children}
        </div>
        {scroll && (
          <div className="ob-auto-marquee-group" style={{ gap }} aria-hidden="true">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
