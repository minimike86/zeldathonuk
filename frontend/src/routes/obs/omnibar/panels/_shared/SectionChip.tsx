import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

/**
 * Fixed card for the current run-section label (e.g.
 * "Chapter 2.1 – Lost Woods and Kakariko Village"), styled to match the
 * game chip so it reads as part of the same set. The label is split on
 * its first dash into a small eyebrow ("Chapter 2.1") over the location
 * name on its own line, mirroring the game chip's series-over-title
 * stack. The card width is constrained, so a long location name
 * ping-pongs left↔right within it (via `BounceText`) instead of being
 * truncated or scrolling the objective tiles along with it.
 *
 * Labels without a dash (e.g. "Prologue") render as a single static
 * line with no eyebrow.
 */
function splitSectionLabel(label: string): {
  eyebrow: string | null;
  name: string;
} {
  // Non-greedy lead so we split on the FIRST dash (en/em/hyphen); the
  // chapter ref becomes the eyebrow, everything after is the name.
  const m = label.match(/^(.*?)\s*[–—-]\s*(.+)$/);
  if (m && m[1].trim() && m[2].trim()) {
    return { eyebrow: m[1].trim(), name: m[2].trim() };
  }
  return { eyebrow: null, name: label };
}

export function SectionChip({ label }: { label: string }) {
  const { eyebrow, name } = splitSectionLabel(label);
  return (
    <span className="ob-section-chip" title={label}>
      {eyebrow && <span className="ob-section-chip-eyebrow">{eyebrow}</span>}
      <BounceText className="ob-section-chip-title">{name}</BounceText>
    </span>
  );
}

/**
 * Single-line text that ping-pongs (left→right, right→left) within its
 * box when it overflows, pausing briefly at each end so it stays
 * readable. Measures overflow via ResizeObserver; when the content
 * fits, it renders static. The actual back-and-forth motion is the
 * `ob-bounce-x` keyframe (CSS, `alternate infinite`) driven off the
 * measured `--bounce-distance`.
 */
function BounceText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const viewportRef = useRef<HTMLSpanElement | null>(null);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const [distance, setDistance] = useState(0);

  useLayoutEffect(() => {
    const vp = viewportRef.current;
    const tx = textRef.current;
    if (!vp || !tx) return;
    const measure = () => {
      const overflow = tx.scrollWidth - vp.clientWidth;
      const next = overflow > 1 ? overflow : 0;
      // Identity-stable update so a parent re-render doesn't restart the
      // animation when nothing actually changed.
      setDistance((prev) => (prev === next ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    ro.observe(tx);
    return () => ro.disconnect();
  }, [children]);

  // ~36px/s travel, with a floor so short overflows still feel calm.
  const durationMs = Math.max(2600, Math.round((distance / 36) * 1000) * 2);
  const style: CSSProperties | undefined =
    distance > 0
      ? ({
          ['--bounce-distance' as string]: `-${distance}px`,
          animationDuration: `${durationMs}ms`,
        } as CSSProperties)
      : undefined;

  return (
    <span ref={viewportRef} className={`ob-bounce${className ? ` ${className}` : ''}`}>
      <span
        ref={textRef}
        className={`ob-bounce-text${distance > 0 ? ' is-bouncing' : ''}`}
        style={style}
      >
        {children}
      </span>
    </span>
  );
}
