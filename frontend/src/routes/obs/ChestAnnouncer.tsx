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
import { playFanfare, warmUpFanfare, type PlaybackHandle } from './fanfare';
import { pickTrigger, playSound } from './chestSoundTriggers';
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
// Audio toggle lives on the backend — re-poll often enough that a flip
// in /control/chest-announcer takes effect on the next reveal without
// the streamer having to refresh the OBS browser source.
const SETTINGS_POLL_MS = 5000;
// Triggers change rarely (operator edits them once between runs). 30s
// is plenty fast for "I just added a new trigger, fire a test donation".
const TRIGGERS_POLL_MS = 30_000;
// Current-game id used for `game`-kind triggers. Same 3s cadence as the
// omnibar so a game change is reflected before the next donation lands.
const CURRENT_GAME_POLL_MS = 3000;
const WALK_MS = 3000;
const AT_CHEST_SETTLE_MS = 200;
const CHEST_OPEN_MS = 600;
const PULL_MS = 500;
// Default min/max card-hold times, used when the settings poll hasn't
// returned yet. Live values are configured in /control/chest-announcer
// and pulled into refs below.
const DEFAULT_CARD_MIN_HOLD_MS = 2800;
const DEFAULT_CARD_MAX_HOLD_MS = 20_000;
// Client-side clamp ranges so a bad value can't freeze the queue.
const MIN_HOLD_RANGE: [number, number] = [500, 60_000];
const MAX_HOLD_RANGE: [number, number] = [500, 300_000];
const CONFETTI_MS = 900;

// ── Walk path anchors (percentage of container width) ─────────────────
//
// The hero stops at the horizontal centre of the container, with the
// chest to their right. This keeps the donation card — which floats
// directly above the hero — perfectly centred in whatever OBS capture
// rect the streamer assigns, even though the hero's stance is to the
// left of the chest visually.
const X_OFFSCREEN_LEFT = -20;
const X_OFFSCREEN_RIGHT = 120;
const X_AT_CHEST = 50;    // hero stops dead centre
const X_CHEST = 62;       // chest sits slightly right of centre

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
  // Brief idle pause at the chest between cards when the queue still
  // has more donations to read. Configurable via the operator's
  // `between_cards_ms` setting so streamers can tune the rhythm of
  // multi-donation bursts to match their stream's pacing.
  | 'between_cards'
  | 'walking_out';

interface ActiveCard {
  uid: string;
  /** Backend donation id, used by the live-mute watcher to detect
   *  when the operator mutes the donation currently on screen. */
  donationId: number;
  donor: string;
  amount: string;
  currency: string;
}

/**
 * Outer gate: the chest-announcer content (polling, animation, audio)
 * only mounts after the operator clicks once. This satisfies Chrome's
 * autoplay policy ("AudioContext was not allowed to start — must be
 * resumed after a user gesture") in *every* environment — OBS browser
 * source, a plain browser preview tab, or an embedded iframe — without
 * having to detect or special-case any of them.
 *
 * The click also warms up the shared AudioContext so the very first
 * donation reveal can play its fanfare cleanly. Polling/state-machine
 * logic doesn't begin until the inner scene mounts, so cold-boot
 * suppression starts fresh from the moment the operator pressed Start.
 *
 * In OBS specifically the streamer right-clicks the browser source →
 * **Interact**, clicks the start gate once, then closes the Interact
 * window. After that the source runs unattended for the whole stream.
 */
export function ChestAnnouncer() {
  const [started, setStarted] = useState(false);
  if (!started) return <StartGate onStart={() => setStarted(true)} />;
  return <ChestAnnouncerScene />;
}

function StartGate({ onStart }: { onStart: () => void }) {
  const [busy, setBusy] = useState(false);
  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    // Warm up the AudioContext while we still hold the user-gesture
    // permission. Even if audio is disabled in /control settings, we
    // do this so flipping it on later doesn't require another click.
    await warmUpFanfare();
    onStart();
  };
  return (
    <div className="ca-root">
      <button
        type="button"
        className="ca-start-gate"
        onClick={() => void handleClick()}
        disabled={busy}
      >
        <span className="ca-start-title">Chest Announcer</span>
        <span className="ca-start-hint">Click to start</span>
      </button>
    </div>
  );
}

function ChestAnnouncerScene() {
  // Audio toggle is configured in /control/chest-announcer and stored
  // on the backend singleton ChestAnnouncerSettings model. Polled here
  // so the streamer can flip it mid-stream without refreshing the OBS
  // browser source. Default false → silent, omnibar handles TTS.
  const { data: settings } = usePolledQuery(
    obsApi.chestAnnouncerSettings,
    SETTINGS_POLL_MS,
  );
  const audioEnabledRef = useRef(false);
  audioEnabledRef.current = settings?.audio_enabled === true;
  // Clamp the inter-card delay to a sane range — server validates with
  // PositiveIntegerField but accidentally setting 10 minutes shouldn't
  // freeze the queue.
  const betweenCardsMsRef = useRef(1500);
  betweenCardsMsRef.current = Math.max(
    0,
    Math.min(10_000, settings?.between_cards_ms ?? 1500),
  );
  // Min/max card hold also come from settings, with the same clamping
  // story. The showing_card phase reads these refs each time, so a
  // live edit in /control takes effect on the next reveal.
  const cardMinHoldMsRef = useRef(DEFAULT_CARD_MIN_HOLD_MS);
  cardMinHoldMsRef.current = Math.max(
    MIN_HOLD_RANGE[0],
    Math.min(
      MIN_HOLD_RANGE[1],
      settings?.card_min_hold_ms ?? DEFAULT_CARD_MIN_HOLD_MS,
    ),
  );
  const cardMaxHoldMsRef = useRef(DEFAULT_CARD_MAX_HOLD_MS);
  // Max gets clamped to be at least min so a bad config can't end up
  // shorter than the minimum (which would make min unreachable).
  cardMaxHoldMsRef.current = Math.max(
    cardMinHoldMsRef.current,
    Math.min(
      MAX_HOLD_RANGE[1],
      settings?.card_max_hold_ms ?? DEFAULT_CARD_MAX_HOLD_MS,
    ),
  );

  // Sound triggers — per-rule audio overrides keyed on game / amount /
  // keyword. Refreshed on a slow poll because operators edit these
  // between runs, not per-donation. Stored in a ref so the scheduled
  // reveal callback (which fires inside a setTimeout) sees the latest
  // list without becoming a dep of the phase effect.
  const { data: triggers } = usePolledQuery(
    obsApi.chestAnnouncerSoundTriggers,
    TRIGGERS_POLL_MS,
  );
  const triggersRef = useRef<typeof triggers>([]);
  triggersRef.current = triggers ?? [];

  // Currently-playing game — drives `game` kind trigger matching. Don't
  // need the full schedule entry, just the game id.
  const { data: currentlyPlaying } = usePolledQuery(
    obsApi.currentlyPlaying,
    CURRENT_GAME_POLL_MS,
  );
  const currentGameIdRef = useRef<number | null>(null);
  currentGameIdRef.current =
    currentlyPlaying?.schedule_entry_detail?.game?.id ?? null;

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
      // Skip muted donations entirely. `is_muted` is the operator's
      // signal that this donation has already been handled on stream
      // (read aloud, name shouted out, etc.) and shouldn't replay —
      // the omnibar/TTS already respect it, and pulling a redundant
      // card here would feel out of sync with the rest of the scene.
      // Note we don't add muted donations to seenIds, so unmuting one
      // later in /control/donations flows it through normally on the
      // next poll cycle.
      .filter((d) => !seenIdsRef.current.has(d.id) && !d.is_muted)
      .sort(
        (a, b) =>
          new Date(a.donated_at).getTime() - new Date(b.donated_at).getTime(),
      );
    if (fresh.length === 0) return;
    fresh.forEach((d) => seenIdsRef.current.add(d.id));
    queueRef.current.push(...fresh);
    setQueueLen(queueRef.current.length);
  }, [donations]);

  // Operator-triggered replay. Polls /api/chest-announcer/replay/
  // and re-enqueues the linked donation whenever `requested_at`
  // advances past the value we last saw. Cold-boot snapshots the
  // current timestamp so a stale request from before the overlay
  // mounted doesn't fire on first paint. Bypasses the seen-id guard
  // so the same donation can be re-fired any number of times.
  const { data: replay } = usePolledQuery(obsApi.chestReplay, 2000);
  const lastReplayAtRef = useRef<string | null>(null);
  useEffect(() => {
    if (!replay) return;
    if (lastReplayAtRef.current === null) {
      lastReplayAtRef.current = replay.requested_at;
      return;
    }
    if (replay.requested_at === lastReplayAtRef.current) return;
    lastReplayAtRef.current = replay.requested_at;
    if (replay.donation_id == null || !donations) return;
    const d = donations.find((x) => x.id === replay.donation_id);
    if (!d) return;
    // Replay jumps the FRONT of the queue so the operator's click
    // takes effect on the next phase boundary rather than waiting
    // behind any naturally-arrived donations.
    queueRef.current.unshift(d);
    setQueueLen(queueRef.current.length);
  }, [replay, donations]);

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
  // "+N more" pip count. Captured once per reveal cycle (entry to
  // chest_opening or between_cards) from queueRef.length - 1 — i.e.
  // donations queued *behind* the imminent reveal. Deriving from
  // queueLen on every render gave a one-frame pulse: between
  // pulling_item commit and popNext's setQueueLen, queueLen still
  // held the pre-pop value so the formula briefly jumped up by one.
  // Tying the display value to a discrete cycle moment avoids that
  // race entirely.
  const [revealQueueDepth, setRevealQueueDepth] = useState(0);

  // In-flight audio (fanfare or trigger sound). Captured at the moment
  // the card-pop fires; the showing_card phase waits on its `ended`
  // Promise before transitioning to confetti so the card stays on
  // screen until the audio is fully done. Replaced/cancelled when a
  // fresh donation starts playing its own sound.
  const currentPlaybackRef = useRef<PlaybackHandle | null>(null);

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
    // Per-phase cancellation flag. Promise-based advancements
    // (e.g. waiting on PlaybackHandle.ended) check this before calling
    // setPhase so a phase change tearing down the effect doesn't fire
    // a stale advancement against the new phase.
    let cancelled = false;

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
      // Lock in the pip count for this reveal cycle. queueRef is the
      // source of truth here (state may lag); subtract one for the
      // imminent reveal so the pip reads "queued behind this one".
      setRevealQueueDepth(Math.max(0, queueRef.current.length - 1));
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
        donationId: donation.id,
        donor: cleanForDisplay(donation.donor_name || 'Anonymous'),
        amount: Number(donation.amount).toFixed(2),
        currency: currencySymbol(donation.currency, event?.currency_symbol ?? '£'),
      };
      scheduleTimer(() => {
        // Start audio *before* transitioning to showing_card so the
        // PlaybackHandle is captured in the ref before the phase
        // effect reads it. Previously we kicked off the playback
        // Promise *after* setPhase, which meant the `.then()` callback
        // assigning the ref raced the synchronous effect — by the
        // time showing_card read `currentPlaybackRef.current` it was
        // still null, `soundEnded` initialised as true, and the card
        // advanced to confetti as soon as the min-hold elapsed,
        // chopping the audio off mid-play.
        //
        // Resolution order for the audio:
        //   1. Configured sound trigger matches (keyword / amount /
        //      game) → play the trigger's `sound_url` at its volume.
        //   2. No trigger match → procedural fanfare fallback.
        //
        // Cancel any previous in-flight sound from a prior donation
        // before starting the new one so they don't overlap.
        currentPlaybackRef.current?.cancel();
        currentPlaybackRef.current = null;
        const startReveal = (handle: PlaybackHandle | null) => {
          currentPlaybackRef.current = handle;
          setCard(next);
          setCardPhase('enter');
          setPhase('showing_card');
        };
        if (audioEnabledRef.current) {
          const match = pickTrigger(
            donation,
            triggersRef.current ?? [],
            currentGameIdRef.current,
          );
          const playback = match
            ? playSound(match.sound_url, match.volume)
            : playFanfare();
          // Await playback start — typically 10–200 ms — then reveal
          // the card. The hero is still in `reach` pose during this
          // gap, which reads as the character pulling the donation
          // out, so the latency is invisible.
          void playback.then((handle) => startReveal(handle ?? null));
        } else {
          startReveal(null);
        }
      }, PULL_MS);
    } else if (phase === 'showing_card') {
      // Card mounted with phase=enter; promote to hold once the pop
      // animation finishes (~260ms) so the float bob kicks in.
      scheduleTimer(() => setCardPhase('hold'), 260);

      // Advance to confetti only after BOTH:
      //   1. CARD_HOLD_MS minimum elapsed — the card always gets a
      //      readable beat on screen, even for ultra-short sounds.
      //   2. The currently-playing sound's `ended` Promise resolves —
      //      so a long sting plays out fully before the next donation.
      // Capped at MAX_CARD_HOLD_MS so a runaway upload can't freeze
      // the queue.
      let minHoldElapsed = false;
      let soundEnded = currentPlaybackRef.current === null;
      const tryAdvance = () => {
        if (cancelled) return;
        if (minHoldElapsed && soundEnded) setPhase('confetti');
      };
      scheduleTimer(() => {
        minHoldElapsed = true;
        tryAdvance();
      }, cardMinHoldMsRef.current);
      const playback = currentPlaybackRef.current;
      if (playback) {
        void playback.ended.then(() => {
          soundEnded = true;
          tryAdvance();
        });
      }
      // Safety cap regardless of audio state.
      scheduleTimer(() => {
        if (!cancelled) setPhase('confetti');
      }, cardMaxHoldMsRef.current);
    } else if (phase === 'confetti') {
      setCardPhase('burst');
      scheduleTimer(() => {
        setCard(null);
        setCardPhase(null);
        if (queueRef.current.length > 0) {
          // Brief idle pause before the next reveal so consecutive
          // donations don't smash into each other visually. Hero stays
          // by the open chest, no animation interrupt.
          setPhase('between_cards');
        } else {
          setPhase('walking_out');
        }
      }, CONFETTI_MS);
    } else if (phase === 'between_cards') {
      // Refresh the pip count for the next reveal cycle. queueRef has
      // already been popped for the previous donation, so its length
      // minus one is "donations behind the next imminent reveal".
      setRevealQueueDepth(Math.max(0, queueRef.current.length - 1));
      // Idle gap between consecutive donations. Length is the
      // operator's `between_cards_ms` setting; 0 effectively skips the
      // pause and goes straight back to pulling_item.
      scheduleTimer(() => setPhase('pulling_item'), betweenCardsMsRef.current);
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

    return () => {
      cancelled = true;
      clearTimers();
    };
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
      // Don't touch chestState here — let the closing animation finish
      // naturally while the hero walks back. The chest_opening phase
      // that fires when they arrive (~3 s later, well after the 500 ms
      // closing animation completes) will re-open it properly. Forcing
      // 'open' here caused a visible "chest pops open with nobody
      // there" pulse, then a second open from chest_opening once the
      // hero arrived.
      setPhase('walking_in');
    }
  }, [queueLen, phase]);

  // ── Live-mute abort ─────────────────────────────────────────────────
  // If the operator mutes the donation currently on screen (or about
  // to come on, mid pulling_item), cut everything immediately: stop
  // the audio, drop the card, and skip straight to the next reveal
  // (or walk-out if the queue is empty). Confetti is skipped — there's
  // nothing to celebrate when the donation has been recalled.
  useEffect(() => {
    if (!card || !donations) return;
    if (phase !== 'showing_card' && phase !== 'confetti') return;
    const live = donations.find((d) => d.id === card.donationId);
    if (!live || !live.is_muted) return;
    currentPlaybackRef.current?.cancel();
    currentPlaybackRef.current = null;
    setCard(null);
    setCardPhase(null);
    if (queueRef.current.length > 0) {
      setPhase('between_cards');
    } else {
      setPhase('walking_out');
    }
  }, [donations, card, phase]);

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
  // Queue depth indicator. The displayed count is `revealQueueDepth`,
  // which is captured into state at the entry to each reveal cycle
  // (chest_opening / between_cards branches above) so the pip reads a
  // single stable number across the whole cycle — no popNext-induced
  // pulse mid-pulling_item.
  const blipVisible =
    revealQueueDepth > 0 &&
    (phase === 'chest_opening' ||
      phase === 'pulling_item' ||
      phase === 'between_cards');

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

      {blipVisible && (
        // key on the count so React unmounts/remounts the node when N
        // changes, replaying the ca-pip-in pop-in keyframe — gives the
        // operator a visible bounce every time the queue ticks (only
        // ever at the start of a new reveal cycle now, since the
        // value is captured once per cycle).
        <div className="ca-queue-pip" key={revealQueueDepth} aria-hidden>
          +{revealQueueDepth} more
        </div>
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
