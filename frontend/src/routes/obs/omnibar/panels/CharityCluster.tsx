import { useEffect, useMemo, useReducer, useState } from 'react';
import { obsApi, usePolledQuery, type CharitySlide } from '@/lib/obsApi';
import { onCharitySlidesChanged } from '@/lib/charityBus';

/**
 * Right-cluster companion to the running donation total. Cycles
 * through operator-managed slides (logos + blurbs) so the cluster does
 * double duty as branding AND context for why donations matter.
 *
 * Data source: `/api/charity-slides/?active=true`. Empty list falls
 * back to the FALLBACK_SLIDES below so a fresh install still shows
 * something meaningful. Operators manage the slide list via
 * `/control/omnibar` → "Charity cluster" section.
 *
 * Layout: stacked crossfade — every slide stays mounted at all times
 * but only `data-visible=true` is opacity 1, so the transition is
 * smooth without re-decoding the logo on each cycle.
 */

const CYCLE_MS = 8_000;
// Shorter poll than themes/donations: charity slide edits are rare
// per-show but should propagate fast when they happen. Same-browser
// edits hit instantly via the charityBus broadcast; this is the
// upper bound for cross-device / cross-browser propagation.
const POLL_MS = 5_000;

// Fallback list used when the backend has no active slides — kept to
// just the identity logos (SpecialEffect always; GameBlast appended
// from props when the active event has a gameblast_logo_url). All
// other slides (blurbs, sponsor logos, etc.) live in CharitySlide
// rows so operators manage them via /control/omnibar.
//
// A data migration seeds the four canonical "what they do / how to
// help" blurbs into CharitySlide on a fresh DB — see
// backend/api/migrations/seed_charity_blurbs. Once seeded, those
// slides appear here via the configured path, not the fallback.
const FALLBACK_SLIDES: Array<Omit<CharitySlide, 'id' | 'created_at' | 'updated_at'>> = [
  {
    kind: 'logo',
    image_url: '/assets/img/specialeffect-logo.svg',
    alt_text: 'SpecialEffect',
    title: '',
    body: '',
    order: 0,
    is_active: true,
  },
];

export function CharityCluster({
  gameblastLogoUrl,
}: {
  /** Per-event GameBlast logo from Event.gameblast_logo_url. Empty
   *  string is treated as "no GameBlast slide"; null hides it too.
   *  Appended as an additional slide after whatever the operator
   *  configures so the year-specific logo always rides along. */
  gameblastLogoUrl?: string | null;
}) {
  // `bump` increments whenever the charity bus broadcasts a change.
  // Adding it to `usePolledQuery`'s deps array cancels the in-flight
  // tick and re-fetches immediately, so a save in /control/omnibar
  // lands on this tab in roughly one render frame instead of waiting
  // up to POLL_MS for the next poll.
  const [bump, dispatchBump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => onCharitySlidesChanged(dispatchBump), []);
  const { data: configured } = usePolledQuery(
    () => obsApi.charitySlides({ activeOnly: true }),
    POLL_MS,
    [bump],
  );

  const slides = useMemo<Slide[]>(() => {
    const base: Slide[] =
      configured && configured.length > 0
        ? configured.map(toSlide)
        : FALLBACK_SLIDES.map(toSlide);
    if (gameblastLogoUrl) {
      base.push({ kind: 'logo', src: gameblastLogoUrl, alt: 'GameBlast' });
    }
    return base;
  }, [configured, gameblastLogoUrl]);

  const [idx, setIdx] = useState(0);
  // Clamp index if the list shrinks between polls.
  useEffect(() => {
    if (idx >= slides.length) setIdx(0);
  }, [idx, slides.length]);
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = window.setInterval(
      () => setIdx((i) => (i + 1) % slides.length),
      CYCLE_MS,
    );
    return () => window.clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="ob-charity-cluster" aria-hidden>
      {slides.map((slide, i) => (
        <div
          key={slideKey(slide, i)}
          className={`ob-charity-slide ob-charity-slide--${slide.kind}`}
          data-visible={i === idx}
        >
          {slide.kind === 'logo' ? (
            <img src={slide.src} alt={slide.alt} className="ob-charity-logo" />
          ) : (
            <div className="ob-charity-blurb">
              {slide.title && (
                <span className="ob-charity-blurb-title">{slide.title}</span>
              )}
              <span className="ob-charity-blurb-body">{slide.body}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Internal slide normalisation ──────────────────────────────────

type Slide =
  | { kind: 'logo'; src: string; alt: string }
  | { kind: 'blurb'; title: string; body: string };

function toSlide(s: Omit<CharitySlide, 'id' | 'created_at' | 'updated_at'> & { id?: number }): Slide {
  if (s.kind === 'logo') {
    return { kind: 'logo', src: s.image_url, alt: s.alt_text };
  }
  return { kind: 'blurb', title: s.title, body: s.body };
}

function slideKey(slide: Slide, index: number): string {
  if (slide.kind === 'logo') return `logo:${slide.src}:${index}`;
  return `blurb:${slide.title}:${index}`;
}
