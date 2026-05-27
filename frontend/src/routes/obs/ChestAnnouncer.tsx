import { useCallback, useEffect, useRef, useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { Donation } from '@/lib/obsApi';
import { cleanForDisplay } from '@/lib/profanity';
import {
  HERO_WALK_SRC,
  HERO_IDLE_SRC,
  HERO_REACH_SRC,
  HERO_HOLD_SRC,
  CHEST_SRC,
} from './chest-placeholders';
import './chest-announcer.css';

/**
 * /obs/chest-announcer — silent visual companion to the omnibar's TTS
 * donation announcer. A pixel hero walks in from off-screen, opens a
 * chest, and holds each incoming donation overhead as a card (donor +
 * amount). Card confettis, hero pulls next donation if more are queued,
 * walks off when the queue is empty.
 *
 *   off ──▶ walk_in ──▶ at_chest ──▶ opening ──▶ pulling ──▶ showing
 *                                                              │
 *                                                              ▼
 *                            confetti ──(queue empty)──▶ walking_out ──▶ off
 *                                ▲                           │
 *                                └───(queue has more)        └─(new donation: reverse)
 *
 * Polls /api/donations/ every 3s. On cold boot the existing donations
 * are marked "already seen" so a reload mid-stream doesn't replay
 * history — same idiom as Omnibar.tsx:148-171.
 *
 * Sized via container queries; the streamer sets the OBS browser source
 * dimensions and the scene scales accordingly. Works from 554×204 over a
 * single 3DS ad-panel all the way up to the full 1920×1080 stage.
 *
 * TTS is intentionally NOT used — Omnibar.tsx already speaks each
 * donation. This route is purely visual.
 */

// Hero sprite sheets are populated by `frontend/tools/build-chest-sprites.py
// --with-hero` from the streamer's own sprite repo (see that script + the
// chest-announcer README for the contract). Until that's been run, the
// inline SVG placeholders ship the route end-to-end. Flip to `true` after
// running the build with --with-hero.
const USE_REAL_HERO_SPRITES = false;

// chest.png is generated procedurally by the build script (no IP) and
// committed as the default chest sprite — so it's always real.
const SPRITE_SRC = {
  chest: '/assets/img/chest-announcer/chest.png',
  ...(USE_REAL_HERO_SPRITES
    ? {
        heroWalk: '/assets/img/chest-announcer/hero-walk.png',
        heroIdle: '/assets/img/chest-announcer/hero-idle.png',
        heroReach: '/assets/img/chest-announcer/hero-reach.png',
        heroHold: '/assets/img/chest-announcer/hero-hold.png',
      }
    : {
        heroWalk: HERO_WALK_SRC,
        heroIdle: HERO_IDLE_SRC,
        heroReach: HERO_REACH_SRC,
        heroHold: HERO_HOLD_SRC,
      }),
};

// ── Timing constants ──────────────────────────────────────────────────
const POLL_MS = 3000;
const WALK_MS = 3000;
const AT_CHEST_SETTLE_MS = 200;
const CHEST_OPEN_MS = 600;
const PULL_MS = 500;
const CARD_HOLD_MS = 2800;
const CONFETTI_MS = 900;

// ── Walk path anchors (percentage of container width) ─────────────────
const X_OFFSCREEN_LEFT = -20;
const X_OFFSCREEN_RIGHT = 120;
const X_AT_CHEST = 38;    // hero stands slightly left of the chest
const X_CHEST = 50;

// Confetti palette — accents + rupee gold for a touch of variety.
const PARTICLE_COLOURS = [
  'var(--obs-accent, #e71347)',
  'var(--obs-accent-bright, #ffd166)',
  'var(--obs-accent-muted, rgba(231, 19, 71, 0.5))',
  '#ffd76a',
];
const PARTICLE_COUNT = 18;

type Phase =
  | 'offscreen'
  | 'walking_in'
  | 'at_chest'
  | 'chest_opening'
  | 'pulling_item'
  | 'showing_card'
  | 'confetti'
  | 'walking_out';

interface ActiveCard {
  uid: string;
  donor: string;
  amount: string;
  currency: string;
}

export function ChestAnnouncer() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 15_000);
  const { data: donations } = usePolledQuery(
    () => (event ? obsApi.donations(event.id) : Promise.resolve([])),
    POLL_MS,
    [event?.id],
  );

  // ── Donation queue (mirrors Omnibar cold-boot pattern) ────────────
  const seenIdsRef = useRef<Set<number>>(new Set());
  const initialisedRef = useRef(false);
  const queueRef = useRef<Donation[]>([]);
  const [queueLen, setQueueLen] = useState(0);

  useEffect(() => {
    if (!donations) return;
    if (!initialisedRef.current) {
      donations.forEach((d) => seenIdsRef.current.add(d.id));
      initialisedRef.current = true;
      return;
    }
    const fresh = donations
      .filter((d) => !seenIdsRef.current.has(d.id))
      .sort(
        (a, b) =>
          new Date(a.donated_at).getTime() - new Date(b.donated_at).getTime(),
      );
    if (fresh.length === 0) return;
    fresh.forEach((d) => seenIdsRef.current.add(d.id));
    queueRef.current.push(...fresh);
    setQueueLen(queueRef.current.length);
  }, [donations]);

  // ── State machine ───────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>('offscreen');
  const [heroX, setHeroX] = useState(X_OFFSCREEN_LEFT);
  const [heroDir, setHeroDir] = useState<1 | -1>(1);
  const [walkMs, setWalkMs] = useState(WALK_MS);
  const [card, setCard] = useState<ActiveCard | null>(null);
  const [cardPhase, setCardPhase] = useState<'enter' | 'hold' | 'burst' | null>(null);
  const [chestState, setChestState] = useState<
    'closed' | 'opening' | 'open' | 'closing'
  >('closed');

  // Pending timers — cleared on every phase change so cancelling
  // walk-out (or any phase) doesn't leak a setTimeout that pulls us
  // into the wrong next state.
  const timersRef = useRef<number[]>([]);
  const scheduleTimer = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);
  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const popNext = useCallback((): Donation | null => {
    const next = queueRef.current.shift() ?? null;
    setQueueLen(queueRef.current.length);
    return next;
  }, []);

  // ── Phase transitions ───────────────────────────────────────────────
  // Each entry schedules the next transition; phase changes clear pending
  // timers first to keep cancellation safe.
  useEffect(() => {
    clearTimers();

    if (phase === 'walking_in') {
      setHeroDir(1);
      setWalkMs(WALK_MS);
      // Defer one frame so the transition picks up the new --ca-hero-x.
      requestAnimationFrame(() => setHeroX(X_AT_CHEST));
      scheduleTimer(() => setPhase('at_chest'), WALK_MS);
    } else if (phase === 'at_chest') {
      scheduleTimer(() => setPhase('chest_opening'), AT_CHEST_SETTLE_MS);
    } else if (phase === 'chest_opening') {
      setChestState('opening');
      scheduleTimer(() => {
        setChestState('open');
        setPhase('pulling_item');
      }, CHEST_OPEN_MS);
    } else if (phase === 'pulling_item') {
      const donation = popNext();
      if (!donation) {
        // Defensive — should always have one when we reach this phase.
        setPhase('walking_out');
        return;
      }
      const next: ActiveCard = {
        uid: `card-${donation.id}`,
        donor: cleanForDisplay(donation.donor_name || 'Anonymous'),
        amount: Number(donation.amount).toFixed(2),
        currency: currencySymbol(donation.currency, event?.currency_symbol ?? '£'),
      };
      scheduleTimer(() => {
        setCard(next);
        setCardPhase('enter');
        setPhase('showing_card');
      }, PULL_MS);
    } else if (phase === 'showing_card') {
      // Card mounted with phase=enter; promote to hold once the pop
      // animation finishes (~260ms) so the float bob kicks in.
      scheduleTimer(() => setCardPhase('hold'), 260);
      scheduleTimer(() => setPhase('confetti'), CARD_HOLD_MS);
    } else if (phase === 'confetti') {
      setCardPhase('burst');
      scheduleTimer(() => {
        setCard(null);
        setCardPhase(null);
        if (queueRef.current.length > 0) {
          setPhase('pulling_item');
        } else {
          setPhase('walking_out');
        }
      }, CONFETTI_MS);
    } else if (phase === 'walking_out') {
      setChestState('closing');
      setHeroDir(-1);
      setWalkMs(WALK_MS);
      requestAnimationFrame(() => setHeroX(X_OFFSCREEN_RIGHT));
      scheduleTimer(() => {
        setChestState('closed');
        setPhase('offscreen');
      }, WALK_MS);
    } else if (phase === 'offscreen') {
      setHeroX(X_OFFSCREEN_LEFT);
      setChestState('closed');
      setCard(null);
      setCardPhase(null);
    }

    return clearTimers;
  }, [phase, clearTimers, scheduleTimer, popNext, event?.currency_symbol]);

  // ── Kickoff / walk-out cancel ───────────────────────────────────────
  // Boot: when offscreen and queue non-empty, start the walk-in.
  // Cancel: if a donation arrives mid-walk-out, snapshot the hero's
  // current rendered position and reverse course toward the chest. Chest
  // re-opens. The CSS transition automatically interpolates from the
  // currently-rendered position to the new target, so the reverse-walk
  // feels continuous.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (queueLen === 0) return;
    if (phase === 'offscreen') {
      setPhase('walking_in');
    } else if (phase === 'walking_out') {
      // Snapshot the hero's *actual* rendered centre as a percentage of
      // the container width — not via getComputedStyle on the CSS var
      // (which returns whatever React last set, not the interpolated
      // transition value). Setting the snapshot stops the outbound walk
      // at the visible position before the walking_in transition pulls
      // them back toward the chest.
      const root = rootRef.current;
      const hero = heroRef.current;
      if (root && hero) {
        const rRect = root.getBoundingClientRect();
        const hRect = hero.getBoundingClientRect();
        if (rRect.width > 0) {
          const centre = hRect.left + hRect.width / 2 - rRect.left;
          const pct = (centre / rRect.width) * 100;
          if (Number.isFinite(pct)) setHeroX(pct);
        }
      }
      setChestState('open');
      setPhase('walking_in');
    }
  }, [queueLen, phase]);

  // ── ResizeObserver fallback ─────────────────────────────────────────
  // Some engines don't honour `100cqh` on a fixed/inset element. Mirror
  // the observed height into a px-based --ca-h so the sizing still works.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h) el.style.setProperty('--ca-h', `${h}px`);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Render ──────────────────────────────────────────────────────────
  const heroAnim: 'walk' | 'idle' | 'reach' | 'hold' =
    phase === 'walking_in' || phase === 'walking_out'
      ? 'walk'
      : phase === 'pulling_item'
        ? 'reach'
        : phase === 'showing_card' || phase === 'confetti'
          ? 'hold'
          : 'idle';

  const heroVisible = phase !== 'offscreen';
  const chestVisible = phase !== 'offscreen';
  const glowVisible = chestState === 'open';

  return (
    <div
      className="ca-root"
      ref={rootRef}
      style={
        {
          '--ca-hero-x': `${heroX}%`,
          '--ca-hero-dir': heroDir,
          '--ca-walk-ms': `${walkMs}ms`,
          '--ca-chest-x': `${X_CHEST}%`,
          '--ca-card-x': `${heroX}%`,
          '--ca-hero-walk-src': `url("${SPRITE_SRC.heroWalk}")`,
          '--ca-hero-idle-src': `url("${SPRITE_SRC.heroIdle}")`,
          '--ca-hero-reach-src': `url("${SPRITE_SRC.heroReach}")`,
          '--ca-hero-hold-src': `url("${SPRITE_SRC.heroHold}")`,
          '--ca-chest-src': `url("${SPRITE_SRC.chest}")`,
        } as React.CSSProperties
      }
    >
      <div className="ca-ground" />

      {chestVisible && (
        <>
          <div className="ca-chest ca-sprite" data-state={chestState} />
          <div className="ca-chest-glow" data-visible={glowVisible} />
        </>
      )}

      {heroVisible && (
        <div className="ca-hero ca-sprite" data-anim={heroAnim} ref={heroRef} />
      )}

      {card && cardPhase && (
        <div className="ca-card-wrap" key={card.uid}>
          <div className="ca-card" data-phase={cardPhase}>
            <div className="ca-card-donor">{card.donor}</div>
            <div className="ca-card-amount">
              {card.currency}
              {card.amount}
            </div>
          </div>
          {cardPhase === 'burst' && (
            <div className="ca-confetti" aria-hidden>
              {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
                <span
                  key={i}
                  className="ca-particle"
                  style={
                    {
                      '--i': i,
                      '--c': PARTICLE_COLOURS[i % PARTICLE_COLOURS.length],
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function currencySymbol(code: string, fallback: string): string {
  switch (code) {
    case 'GBP':
      return '£';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    default:
      return fallback;
  }
}
