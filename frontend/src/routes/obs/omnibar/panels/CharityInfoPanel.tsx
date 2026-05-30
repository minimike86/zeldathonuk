import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { Charity } from '@/lib/obsApi';
import { formatTierAmount } from '@/lib/currency';
import { MarqueeText } from '../../MarqueeText';
import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';

/**
 * Rotating charity context — built entirely from the active event's
 * linked charities (`Event.event_charities[].charity_detail`) so the
 * panel reflects whoever the event is actually fundraising for rather
 * than hardcoded copy.
 *
 * Each charity contributes a mix of slide kinds:
 *   - impact  — one per impact tier: an amount pill (£10) + the short
 *               benefit label ("Joystick Extensions").
 *   - cta     — the help / donate CTA *headlines* (short by design).
 *   - mission — the (long) mission statement.
 *
 * Every slide's body is rendered through <MarqueeText>, which keeps
 * text static when it fits and scrolls it when it overflows — so the
 * single-line lane never truncates regardless of how long the copy is.
 * The marquee's onComplete drives the advance to the next slide, which
 * also gives scrolling slides the time they need to finish while
 * static slides advance after a fixed read hold.
 *
 * `selectData` returns null when the event has no charities (or none
 * with anything to say), so the lane skips this panel in rotation
 * instead of parking on a blank card.
 */

// Static read time for a slide whose text fits without scrolling. Also
// the floor that MarqueeText uses before firing onComplete.
const STATIC_HOLD_MS = 4500;
// Scroll speed for overflowing slides. Matches the calmer end of the
// LiveDonationPanel marquee — fast enough not to drag, slow enough to
// read mission copy.
const SCROLL_PX_PER_SEC = 90;

type SlideKind = 'impact' | 'cta' | 'mission';

interface Slide {
  kind: SlideKind;
  /** Charity logo (absolute or site-relative). Empty → no logo shown. */
  logoUrl: string;
  /** Charity name used as the logo's alt text. */
  label: string;
  /** Tag-pill copy for this slide (amount for impact, action for cta). */
  tag: string;
  /** Body copy — marquees when it overflows the lane. */
  text: string;
}

/** Flatten one charity into its slides, in reading order: impact
 *  ladder → CTA headlines → mission. Empty fields contribute nothing. */
function charitySlides(c: Charity): Slide[] {
  const logoUrl = c.logo_url || c.logo_thumbnail_url || '';
  const label = c.short_name || c.name;
  const out: Slide[] = [];

  const tiers = [...(c.impact_tiers ?? [])].sort((a, b) => a.order - b.order);
  for (const t of tiers) {
    const text = (t.alt_text || t.description || '').trim();
    if (!text) continue;
    out.push({
      kind: 'impact',
      logoUrl,
      label,
      tag: `HOW ${formatTierAmount(t.amount, t.currency)} HELPS`,
      text,
    });
  }

  if (c.help_cta_headline.trim()) {
    out.push({ kind: 'cta', logoUrl, label, tag: 'GET SUPPORT', text: c.help_cta_headline.trim() });
  }
  if (c.donate_cta_headline.trim()) {
    out.push({ kind: 'cta', logoUrl, label, tag: 'DONATE', text: c.donate_cta_headline.trim() });
  }

  // Prefer the operator's condensed one-liner for the ticker; fall back to the
  // full mission statement when no tagline is set.
  const mission = c.mission_tagline.trim() || c.mission_statement.trim();
  if (mission) {
    out.push({ kind: 'mission', logoUrl, label, tag: 'BENEFITTING', text: mission });
  }

  return out;
}

interface Data {
  slides: Slide[];
}

/** sRGB relative luminance (0 = black, 1 = white) of an [r,g,b] 0–255 triple. */
function relLuminance(r: number, g: number, b: number): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Redraw a logo with only its near-white, low-saturation pixels inverted —
 *  i.e. white/light-grey "text" flips to dark while coloured artwork (an
 *  orange mark, etc.) is left exactly as-is. Returns a PNG data URL, or null
 *  when the canvas is tainted (cross-origin without CORS) so the caller falls
 *  back to the untouched original. */
function invertWhiteParts(img: HTMLImageElement): string | null {
  // Cap the working resolution so an oversized SVG doesn't make a huge canvas,
  // but keep enough detail for the small lane logo to stay crisp.
  const natW = img.naturalWidth || 128;
  const natH = img.naturalHeight || 128;
  const scale = Math.min(1, 256 / Math.max(natW, natH));
  const w = Math.max(1, Math.round(natW * scale));
  const h = Math.max(1, Math.round(natH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  try {
    ctx.drawImage(img, 0, 0, w, h);
    const image = ctx.getImageData(0, 0, w, h);
    const { data } = image;
    let changed = false;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue; // skip fully transparent
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const chroma = Math.max(r, g, b) - Math.min(r, g, b); // ~saturation
      const lum = (r + g + b) / 3;
      // Near-greyscale AND light → the white text. Invert it; leave coloured
      // (high-chroma) and already-dark pixels alone.
      if (chroma < 40 && lum > 150) {
        data[i] = 255 - r;
        data[i + 1] = 255 - g;
        data[i + 2] = 255 - b;
        changed = true;
      }
    }
    if (!changed) return null; // nothing white to flip → keep the original
    ctx.putImageData(image, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return null; // tainted canvas
  }
}

/** Luminance of an element's resolved (inherited) text colour. The omnibar
 *  lane sets a body text colour that themes pair with the lane background —
 *  dark text ⟹ light lane — so this proxies the background's lightness. */
function elementTextLuminance(el: HTMLElement | null): number | null {
  if (!el) return null;
  const m = getComputedStyle(el).color.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const [r, g, b] = m[1].split(',').map((s) => parseFloat(s));
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return relLuminance(r, g, b);
}

/** Returns the image source to display for `src`: the original normally, or a
 *  processed copy with only its white text inverted when the lane is light
 *  (where white-on-transparent would otherwise vanish). The lane's lightness
 *  is read from `hostRef`'s inherited text colour (themes pair dark text with
 *  light lanes). Probes a CORS copy for pixel access; a tainted/blocked sample
 *  or a logo with no white parts falls back to the original `src` untouched. */
function useAdaptiveLogoSrc(src: string, hostRef: RefObject<HTMLElement | null>): string {
  const [resolved, setResolved] = useState(src);
  useEffect(() => {
    setResolved(src); // reset to original whenever the logo changes
    if (!src) return;
    const textLum = elementTextLuminance(hostRef.current);
    // Only intervene on a light lane; on a dark lane white text reads fine.
    if (textLum == null || textLum >= 0.5) return;
    let cancelled = false;
    const probe = new Image();
    probe.crossOrigin = 'anonymous';
    probe.onload = () => {
      if (cancelled) return;
      const processed = invertWhiteParts(probe);
      if (processed) setResolved(processed);
    };
    probe.src = src;
    return () => {
      cancelled = true;
    };
  }, [src, hostRef]);
  return resolved;
}

function Panel({ data }: PanelProps<Data>) {
  const { slides } = data;
  // `idx` grows unbounded; we modulo at read time. This keeps `advance`
  // dependency-free (stable identity) so it can be passed to
  // MarqueeText's onComplete without resetting the marquee's hold timer
  // on every parent re-render — the lane re-renders this panel each
  // second as the feed's `now` ticks, and a fresh onComplete identity
  // would otherwise restart the timer before it ever fires.
  const [idx, setIdx] = useState(0);
  const advance = useCallback(() => setIdx((i) => i + 1), []);

  // On a light lane, a white-on-transparent logo's text would vanish. This
  // returns a processed source with only the white text inverted (coloured
  // artwork left intact). Keyed off the rendered <img> so it can read the
  // lane's inherited text colour as a background-lightness proxy.
  const logoRef = useRef<HTMLImageElement | null>(null);
  const slide = slides[idx % slides.length] ?? slides[0];
  const logoSrc = useAdaptiveLogoSrc(slide?.logoUrl ?? '', logoRef);
  if (!slide) return null;

  // A single slide just holds — advancing it would only remount the
  // same content. With more than one, each slide's marquee onComplete
  // (after its scroll OR the static hold) advances to the next.
  const onComplete = slides.length > 1 ? advance : undefined;

  return (
    <PanelRow tag={slide.tag}>
      {slide.logoUrl && (
        <img
          ref={logoRef}
          src={logoSrc}
          alt={slide.label}
          // Sized to the lane's body content height so the logo sits
          // alongside the text without overflowing the 48px half-lane.
          // `filter: drop-shadow` echoes the brand chevron + tag pill
          // styling so the logo doesn't look pasted-on. White-text
          // recolouring (for light lanes) happens in `logoSrc`, not here.
          style={{
            height: '1.7rem',
            width: 'auto',
            display: 'inline-block',
            verticalAlign: 'middle',
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45))',
            flexShrink: 0,
          }}
        />
      )}
      <MarqueeText
        // Remount per slide so the marquee re-measures + restarts its
        // scroll (and its onComplete timer) for the new text.
        key={idx}
        className="ob-charity-info-marquee ob-text-muted"
        pxPerSecond={SCROLL_PX_PER_SEC}
        minHoldMs={STATIC_HOLD_MS}
        // Start the text next to the charity logo and scroll it off left,
        // rather than entering from the far right across empty lane space.
        enterFrom="right"
        onComplete={onComplete}
      >
        {slide.text}
      </MarqueeText>
    </PanelRow>
  );
}

registerPanel<Data>({
  id: 'charity-info',
  component: Panel,
  selectData: (feed) => {
    const slides = (feed.event?.event_charities ?? [])
      .map((link) => link.charity_detail)
      .filter((c): c is Charity => Boolean(c))
      .flatMap(charitySlides);
    return slides.length > 0 ? { slides } : null;
  },
  minDurationMs: 10000, // lane-rotation floor; internal cycling is independent
});
