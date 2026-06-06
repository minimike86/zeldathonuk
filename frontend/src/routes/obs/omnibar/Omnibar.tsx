import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  EventBusProvider,
  useBusEmit,
  useBusSubscription,
} from './bus/EventBus';
import {
  INITIAL,
  omnibarReducer,
  type CelebrationReason,
  type OmnibarState,
} from './fsm/omnibarMachine';
import { useOmnibarFeed, type OmnibarFeed } from './hooks/useOmnibarFeed';
import { useOverrideStream } from './hooks/useOverrideStream';
import { usePlaythroughEventStream } from './hooks/usePlaythroughEventStream';
import { useExternalEventStream } from './hooks/useExternalEventStream';
import { useOmnibarSse } from './hooks/useOmnibarSse';
import { useLayoutConfig } from './hooks/useLayoutConfig';
import { useTransitionsConfig } from './hooks/useTransitionsConfig';
import { useImagePreload } from './hooks/useImagePreload';
import { objectiveImageUrl } from '@/routes/obs/objectiveSection';
import { Lane } from './lanes/Lane';
import { LiveDonationPanel } from './panels/LiveDonationPanel';
import { UrgentBannerPanel } from './panels/UrgentBannerPanel';
import { EventFlashPanel } from './panels/EventFlashPanel';
import { TwitchGenericToast } from './panels/TwitchPanels';
import { CharityCluster } from './panels/CharityCluster';
import { DonationSplash, type SplashColorMode } from './panels/DonationSplash';
import { SlotReel } from './panels/SlotReel';
import { CelebrationBanner } from './panels/CelebrationBanner';
import { getEventHandler } from './events/registry';
import { obsApi } from '@/lib/obsApi';
import type {
  Donation,
  ExternalEvent,
  OmnibarOverride,
  PlaythroughEvent,
} from '@/lib/obsApi';

// Pull every registered panel side-effect import in one place so the
// registry is fully populated before <Lane> resolves panel ids.
import './panels/CurrentGamePanel';
import './panels/PlaytimePanel';
import './panels/PreStreamPanel';
import './panels/CustomObjectivePanel';
import './panels/NextObjectivePanel';
import './panels/ObjectiveChecklistPanel';
import './panels/SetpiecePanel';
import './panels/TotalRaisedPanel';
import './panels/SchedulePanel';
import './panels/IncentivesPanel';
import './panels/MilestonesPanel';
import './panels/RafflePanel';
import './panels/BidWarPanel';
import './panels/DonationReelPanel';
import './panels/CharityInfoPanel';
import './panels/LocalTimePanel';
import './panels/ItemsCollectedPanel';
import './panels/DeathCountPanel';
import './panels/DeathFlashPanel';
import './motion/moods';
import './motion/moods.css';
import './omnibar.css';

/**
 * Omnibar v2 — three-tier nested FSM (omnibar → lanes → panels) on a
 * 96px two-lane canvas. The top lane is pinned to status info
 * (current game, total raised); the bottom lane rotates the ticker
 * (next game, incentives, …). An override stream feeds the OmnibarFSM
 * into `urgent` mode; the playthrough event stream pumps brief
 * lane takeovers (boss-defeated flashes, etc.); fresh donations
 * preempt the bottom lane with a TTS-narrated card.
 */

// Lane configs come from `useLayoutConfig(event)` — driven by
// `Event.omnibar_layout` JSON if set, falling back to defaults
// declared in hooks/useLayoutConfig.ts.

// Base length of one celebration's enter→hold→exit choreography (kept in
// sync with omnibar.css). A celebration can extend its hold via
// `--ob-celebrate-hold-ms` (schedule-entry-sound overrides); milestones and
// incentives use the base length.
const CELEBRATION_BASE_MS = 6200;

// Pause between consecutive queued celebrations (e.g. one donation crossing
// several milestones), so each banner reads as its own moment. Bumped from
// 350ms to 1.1s — a single donation can fire three or four milestones at
// once, and the previous 350ms beat ran them together as one continuous
// flash. Just over a second of empty lane between banners gives viewers
// time to register the previous achievement before the next enters.
const CELEBRATION_GAP_MS = 1100;

// Extra hold added on top of CELEBRATION_BASE_MS for milestone celebrations
// specifically. Milestones tend to carry long event-defined headlines
// ("£25,000 Milestone — Halfway to the moon!") whose WaveText reveal can
// still be unwrapping when the default 6.2s choreography starts its exit.
// 2.5s of extra dwell lets the headline + subhead settle and gives
// viewers time to actually read them before the bar resets.
const MILESTONE_CELEBRATION_HOLD_MS = 2500;

/** A queued celebration takeover.
 *
 *  `holdMs`         — extra hold beyond the base choreography.
 *  `audioUrl`       — fanfare to play when the banner mounts.
 *  `audioVolume`    — playback gain (default 0.85).
 *  `audioDelayMs`   — defer audio play by this many ms after the
 *                     banner enters. Default 0 keeps the legacy
 *                     "play on enter" behaviour; milestones pass a
 *                     non-zero value so the fanfare lands with the
 *                     headline WaveText reveal rather than during
 *                     the tag pill's slide-in.
 */
interface CelebrationItem {
  reason: CelebrationReason;
  holdMs: number;
  audioUrl?: string;
  audioVolume?: number;
  audioDelayMs?: number;
}

/** When the milestone (or any) audio should kick in relative to the
 *  banner mounting. Matches the WaveText `startDelayMs` in
 *  CelebrationBanner — tag arrow lands at t≈2400ms, headline reveal
 *  starts at t≈2500ms, so the fanfare lands with the headline rather
 *  than during the silent tag slide-in. */
const CELEBRATION_AUDIO_WAVE_DELAY_MS = 2500;

export function Omnibar() {
  return (
    <EventBusProvider>
      <OmnibarInner />
    </EventBusProvider>
  );
}

function OmnibarInner() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const feed = useOmnibarFeed(now);
  // Game-level layout (when set) overrides the event-level layout for
  // each lane individually — see useLayoutConfig for the merge rules.
  const layout = useLayoutConfig(
    feed.event,
    feed.currentlyPlaying?.schedule_entry_detail?.game ?? null,
  );
  const transitions = useTransitionsConfig(feed.event);

  // Warm the browser cache with every objective + item sprite for the
  // currently-playing game so the ObjectiveChecklistPanel and
  // ItemsCollectedPanel render synchronously off cache the moment they
  // first rotate into a lane. Without this each new sprite would be
  // fetched at paint time and the lane could briefly show a blank tile
  // as the network round-trip completes.
  const playingGame = feed.currentlyPlaying?.schedule_entry_detail?.game ?? null;
  useImagePreload([
    ...(playingGame?.objectives ?? []).map((o) => objectiveImageUrl(o)),
    ...(playingGame?.items ?? []).map((i) => i.image_url),
  ]);

  const [omnibarState, dispatch] = useReducer(omnibarReducer, INITIAL);

  // SSE-first: subscribe to /api/stream/omnibar/ for low-latency push
  // of overrides + playthrough + external events. Polling stays on as
  // a fallback — when SSE is connected the polls just confirm nothing's
  // missed; when SSE drops, polling fills the gap within 1.5s. Both
  // streams share per-id dedupe so duplicates never reach the bus.
  useOmnibarSse();
  useOverrideStream();
  usePlaythroughEventStream(
    feed.currentlyPlaying?.schedule_entry_detail?.id ?? null,
  );
  useExternalEventStream('twitch');

  // Bottom-lane takeover state — donation card OR event flash OR
  // Twitch event. Priority resolved in `bottomTakeover` below.
  const [activeDonation, setActiveDonation] = useState<Donation | null>(null);
  const [activeFlash, setActiveFlash] = useState<PlaythroughEvent | null>(null);
  const [activeTwitchEvent, setActiveTwitchEvent] = useState<ExternalEvent | null>(null);
  // Bumps on each CELEBRATE dispatch. Used as the celebrate fullbar's
  // `key` so the element is freshly remounted every time a new
  // celebration starts — guaranteeing the entrance CSS animations
  // restart, even back-to-back celebrations or in dev mode where HMR
  // / StrictMode can interfere with animation lifecycle on long-lived
  // pseudo-elements.
  const [celebrateNonce, setCelebrateNonce] = useState(0);
  // Extra hold in ms applied to the celebration banner's exit timings
  // (see omnibar.css `--ob-celebrate-hold-ms`). Used by schedule-
  // entry-sound overrides that configure a longer Duration than the
  // default 6.2s celebration choreography. Milestone / incentive
  // celebrations leave this at 0.
  const [celebrateHoldMs, setCelebrateHoldMs] = useState(0);

  // Celebration queue. A single event (e.g. a £10 donation crossing the
  // £1/£5/£10 milestones at once) can fire several celebrations in the same
  // tick; without a queue each `CELEBRATE` dispatch overwrote the last and
  // only the final banner showed. Items play one-by-one — each gets its own
  // flash + banner + fanfare via a fresh `celebrateNonce` remount, separated
  // by a short gap — and the bar only returns to normal (`CELEBRATION_DONE`)
  // once the queue drains.
  const celebrationQueueRef = useRef<CelebrationItem[]>([]);
  const celebratingActiveRef = useRef(false);
  const celebrationTimerRef = useRef<number | null>(null);
  // Separate timer for the deferred fanfare play (when audioDelayMs > 0)
  // so we can cancel a queued play if the celebration is interrupted
  // before the delay elapses — without it, the audio would still kick
  // in even after the banner has been torn down.
  const celebrationAudioTimerRef = useRef<number | null>(null);
  const advanceCelebrationRef = useRef<() => void>(() => {});

  const startCelebration = useCallback(
    (item: CelebrationItem) => {
      celebratingActiveRef.current = true;
      setCelebrateHoldMs(item.holdMs);
      dispatch({ type: 'CELEBRATE', reason: item.reason });
      // Bump the nonce so the celebrate fullbar remounts and the flash +
      // banner entrance animations restart for this item.
      setCelebrateNonce((n) => n + 1);
      // Clear any stale deferred-audio timer from a previous item so a
      // back-to-back celebration doesn't fire the prior item's fanfare
      // late.
      if (celebrationAudioTimerRef.current !== null) {
        window.clearTimeout(celebrationAudioTimerRef.current);
        celebrationAudioTimerRef.current = null;
      }
      if (item.audioUrl) {
        const playFanfare = () => {
          const audio = new Audio(item.audioUrl);
          audio.volume = item.audioVolume ?? 0.85;
          audio.play().catch(() => {});
        };
        const delay = item.audioDelayMs ?? 0;
        if (delay > 0) {
          // Delay the fanfare so it lands at the same moment the
          // WaveText reveal kicks off — the tag arrow's slide-in is
          // visual-only; pairing audio with the reveal gives viewers
          // a sound cue for the headline they're about to read.
          celebrationAudioTimerRef.current = window.setTimeout(() => {
            celebrationAudioTimerRef.current = null;
            playFanfare();
          }, delay);
        } else {
          playFanfare();
        }
      }
      // After this item's choreography, advance to the next (or finish).
      celebrationTimerRef.current = window.setTimeout(
        () => advanceCelebrationRef.current(),
        CELEBRATION_BASE_MS + item.holdMs,
      );
    },
    [dispatch],
  );

  const advanceCelebration = useCallback(() => {
    const next = celebrationQueueRef.current.shift();
    if (!next) {
      // Queue drained — drop the celebration takeover.
      celebratingActiveRef.current = false;
      dispatch({ type: 'CELEBRATION_DONE' });
      return;
    }
    // Short beat between banners. We stay in `celebrating` through the gap
    // (no CELEBRATION_DONE) so the rotating ticker doesn't pop back in — the
    // celebrate bar just sits empty for the pause before the next enters.
    celebrationTimerRef.current = window.setTimeout(
      () => startCelebration(next),
      CELEBRATION_GAP_MS,
    );
  }, [dispatch, startCelebration]);
  advanceCelebrationRef.current = advanceCelebration;

  // Enqueue a celebration. Starts immediately if nothing is celebrating,
  // otherwise it plays after the in-flight queue (with the inter-item gap).
  const enqueueCelebration = useCallback(
    (item: CelebrationItem) => {
      celebrationQueueRef.current.push(item);
      if (!celebratingActiveRef.current) {
        const next = celebrationQueueRef.current.shift();
        if (next) startCelebration(next);
      }
    },
    [startCelebration],
  );

  useEffect(
    () => () => {
      if (celebrationTimerRef.current !== null) {
        window.clearTimeout(celebrationTimerRef.current);
      }
      if (celebrationAudioTimerRef.current !== null) {
        window.clearTimeout(celebrationAudioTimerRef.current);
      }
    },
    [],
  );

  const emit = useBusEmit();

  // Track donations we've already announced so reloading mid-stream
  // doesn't replay history. `activeDonationRef` mirrors the state
  // value so the donation-detection effect can decide queue-vs-show
  // without recapturing a useCallback on every state change.
  const seenDonationIdsRef = useRef<Set<number>>(new Set());
  const donationsInitialisedRef = useRef(false);
  const donationQueueRef = useRef<Donation[]>([]);
  const activeDonationRef = useRef<Donation | null>(null);
  activeDonationRef.current = activeDonation;

  useEffect(() => {
    const ds = feed.donations;
    if (!donationsInitialisedRef.current) {
      // Seed seenIds with every donation present on first load so a
      // browser source coming online mid-stream doesn't replay the
      // entire donor history.
      ds.forEach((d) => seenDonationIdsRef.current.add(d.id));
      donationsInitialisedRef.current = true;
      return;
    }
    // Find EVERY un-seen, un-muted donation this tick and queue them
    // chronologically (oldest-first so they play in donation order).
    // Previously the code only picked the first un-seen per tick,
    // which meant a burst of donations between polls would only
    // surface one at a time across many ticks — and any slip in the
    // useEffect chain dropped the rest entirely.
    //
    // Muted donations are deliberately NOT added to seenDonationIds so
    // un-muting one later (via the donations control) flows it through
    // on the next poll instead of being permanently suppressed.
    const fresh = ds
      .filter((d) => !seenDonationIdsRef.current.has(d.id) && !d.is_muted)
      .slice()
      .sort((a, b) =>
        new Date(a.donated_at).getTime() - new Date(b.donated_at).getTime(),
      );
    if (fresh.length === 0) return;
    for (const d of fresh) {
      seenDonationIdsRef.current.add(d.id);
      // Emit on the bus so the DonationSplash overlay can paint a
      // "+£N" badge over the right-cluster total. Fired for every
      // fresh donation, including muted ones we *would* skip — but
      // muted ones are filtered out above, so they don't trigger the
      // splash either (intentional: a muted donation shouldn't draw
      // attention).
      emit({ kind: 'donation-arrived', donation: d });
      // Read activeDonation through the ref so the queue/active
      // decision always sees the latest committed state — not the
      // value captured when this effect was scheduled.
      if (activeDonationRef.current || donationQueueRef.current.length > 0) {
        donationQueueRef.current.push(d);
      } else {
        // First freshly-arrived donation in this tick goes straight on
        // screen; any remaining queue up behind it. activeDonationRef
        // updates on the next render but we capture the in-flight
        // commitment locally by treating the queue as the source of
        // truth for "already taken" for the rest of the loop.
        activeDonationRef.current = d;
        setActiveDonation(d);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed.donations]);

  const onDonationComplete = useCallback(() => {
    const next = donationQueueRef.current.shift() ?? null;
    activeDonationRef.current = next;
    setActiveDonation(next);
  }, []);

  // External (Twitch) events → bottom-lane takeover. Drop the event
  // if a higher-priority takeover is already on screen — donation,
  // override, etc. Since these are non-essential broadcast moments,
  // dropping a clash is preferable to queueing indefinitely.
  useBusSubscription('external-event', (e) => {
    if (omnibarState.kind === 'urgent') return;
    if (activeDonation) return;
    setActiveTwitchEvent(e.event);
  });
  const onTwitchEventComplete = useCallback(() => setActiveTwitchEvent(null), []);

  // Playthrough events → bottom-lane flash. Donations + overrides
  // outrank flashes; we skip the flash if either is active.
  useBusSubscription('playthrough-event', (e) => {
    if (omnibarState.kind === 'urgent') return;
    if (activeDonation) return;
    setActiveFlash(e.event);
  });
  const onFlashComplete = useCallback(() => setActiveFlash(null), []);

  // Promote `incentive-unlocked` + `milestone-reached` to celebrations.
  useBusSubscription('milestone-reached', (e) => {
    // Queue it — a single donation can cross several milestones at once, and
    // each should get its own flash + banner + fanfare in sequence. The
    // optional per-milestone fanfare audio plays as that banner enters.
    //
    // Per-milestone colour overrides ride alongside the milestone object
    // on the payload. CelebrationBanner reads `payload.tag_color_from`
    // / `_to`, `payload.heading_color`, `payload.sub_color`; the
    // `flash_color` is read by the wrapper in Omnibar that sets the
    // `--ob-celebrate-flash-color` CSS var. Empty strings are
    // intentionally NOT spread so the banner's fallback chain
    // (payload → theme default → baked-in gold) still kicks in.
    const m = e.milestone;
    const colourPayload: Record<string, string> = {};
    if (m.tag_color_from) colourPayload.tag_color_from = m.tag_color_from;
    if (m.tag_color_to) colourPayload.tag_color_to = m.tag_color_to;
    if (m.heading_color) colourPayload.heading_color = m.heading_color;
    if (m.sub_color) colourPayload.sub_color = m.sub_color;
    if (m.flash_color) colourPayload.flash_color = m.flash_color;
    enqueueCelebration({
      reason: {
        kind: 'milestone-reached',
        payload: { milestone: m, ...colourPayload },
      },
      // Hold past the default 6.2s choreography so the WaveText reveal
      // on long milestone titles + the subhead get a clean read window
      // before the body wipes out (see MILESTONE_CELEBRATION_HOLD_MS).
      holdMs: MILESTONE_CELEBRATION_HOLD_MS,
      audioUrl: e.milestone.audio_url || undefined,
      // Defer the fanfare until the tag arrow has slid in and the
      // headline WaveText is about to start. Without this delay the
      // sound plays during the silent tag entrance, so viewers hear
      // the celebration before they can read what it's celebrating.
      audioDelayMs: CELEBRATION_AUDIO_WAVE_DELAY_MS,
    });
  });
  useBusSubscription('incentive-unlocked', (e) => {
    enqueueCelebration({
      reason: { kind: 'incentive-unlocked', payload: { incentive: e.incentive } },
      holdMs: 0,
    });
  });
  useBusSubscription('objective-obtained', (e) => {
    // Objective names are often long. The headline waves in at
    // 2500 + i*WAVE_STAGGER_MS (CelebrationBanner) and the stack wipes out at
    // 4200ms + hold; without extra hold a long name is still dropping in when
    // it exits. Extend the dwell so the last character is legible (+ a beat to
    // read) before the wipe-out. Short names (≲22 chars) need no extra hold.
    const WAVE_STAGGER_MS = 32; // keep in sync with CelebrationBanner's WaveText
    const len = (e.objective.name ?? '').length;
    const lastCharLegibleMs = 2830 + Math.max(0, len - 1) * WAVE_STAGGER_MS;
    const holdMs = Math.min(4000, Math.max(0, lastCharLegibleMs + 700 - 4200));
    enqueueCelebration({
      reason: { kind: 'objective-obtained', payload: { objective: e.objective } },
      holdMs,
    });
  });

  // Override stream → urgent mode (or celebration, for the special
  // `schedule-entry-sound` kind). The highest-priority active override
  // drives the FSM; expiry returns it to normal.
  useBusSubscription('override-arrived', (e) => {
    const ov = e.override;
    if (ov.kind === 'schedule-entry-sound') {
      // Schedule-entry sound triggers take their own branch: ALWAYS
      // play the audio; conditionally surface the celebration banner.
      // They do NOT enter `urgent` mode so the rotation lane keeps
      // running underneath an audio-only cue.
      const payload = (ov.payload ?? {}) as {
        sound_url?: string;
        volume?: number;
        tag?: string;
        message?: string;
        show_banner?: boolean;
        duration_seconds?: number;
      };
      if (payload.sound_url) {
        const audio = new Audio(payload.sound_url);
        audio.volume = typeof payload.volume === 'number' ? payload.volume : 0.85;
        audio.play().catch(() => {});
      }
      if (payload.show_banner !== false) {
        // Configured trigger duration in ms. Prefer the payload value
        // (server-authoritative); fall back to expires_at - now if the
        // backend didn't include it. Floor at the default celebration
        // choreography length — anything longer becomes "extra hold" via
        // the --ob-celebrate-hold-ms CSS var, which pushes the exit
        // animations back in lockstep.
        const desiredMs =
          typeof payload.duration_seconds === 'number'
            ? payload.duration_seconds * 1000
            : new Date(ov.expires_at).getTime() - Date.now();
        const holdMs = Math.max(CELEBRATION_BASE_MS, Math.min(120_000, desiredMs));
        // Audio already played immediately above (always), so don't pass an
        // audioUrl here — the queue would otherwise re-play it on enter.
        enqueueCelebration({
          reason: {
            kind: 'schedule-entry-sound',
            payload: payload as Record<string, unknown>,
          },
          holdMs: holdMs - CELEBRATION_BASE_MS,
        });
      }
      return;
    }
    dispatch({ type: 'OVERRIDE_ARRIVED', override: ov });
  });
  useBusSubscription('override-expired', () => {
    dispatch({ type: 'OVERRIDE_EXPIRED' });
  });

  // Watch for incentives + milestones crossing into reached state and
  // fire the celebration event. Tracks already-celebrated ids in
  // `reachedIdsRef` so a single goal-crossing only fanfares once,
  // even though `feed.incentives` updates every poll.
  //
  // Reset support: when an entry transitions BACK to not-reached
  // (operator clicked ⟲ Reset in /control/omnibar, clearing
  // `reached_at` on the backend), drop its id from the set so a
  // future re-reach can fanfare again. Without this the same
  // incentive can only be celebrated once per browser-source lifetime.
  //
  // First-load suppression: on a hard reload an already-reached
  // milestone / incentive should NOT re-celebrate. Each collection
  // gets its own "have I seen the first poll's response yet" ref;
  // until that flips, we seed `reachedIdsRef` from the snapshot
  // without emitting. Per-collection (not a shared `donationsInitialised`
  // flag) so the milestones poll resolving slightly later than donations
  // can't sneak a stale-reached fanfare through.
  //
  // Milestones use negative keys in the same set so their ids can't
  // collide with incentive ids.
  const reachedIdsRef = useRef<Set<number>>(new Set());
  const incentivesInitialisedRef = useRef(false);
  useEffect(() => {
    if (feed.incentivesLoaded) {
      if (!incentivesInitialisedRef.current) {
        // Seed from the initial snapshot — anything reached at this
        // moment was already reached before the omnibar mounted, so
        // it shouldn't fanfare.
        for (const i of feed.incentives) {
          if (i.is_reached) reachedIdsRef.current.add(i.id);
        }
        incentivesInitialisedRef.current = true;
      } else {
        for (const i of feed.incentives) {
          if (i.is_reached) {
            if (!reachedIdsRef.current.has(i.id)) {
              reachedIdsRef.current.add(i.id);
              emit({ kind: 'incentive-unlocked', incentive: i });
            }
          } else {
            // Not reached (possibly post-reset) — clear any prior mark
            // so the next reach fires the celebration.
            reachedIdsRef.current.delete(i.id);
          }
        }
      }
    }
    if (feed.milestonesLoaded) {
      // Milestones carry a PERSISTENT `announced` flag (set via the
      // backend once the omnibar plays the celebration), so — unlike
      // incentives — we don't seed from a first-load snapshot. `announced`
      // is the durable "already played" signal: it survives remounts and
      // is shared across every browser source, so a reached-but-unannounced
      // milestone celebrates exactly once and an already-announced one
      // never replays. The in-session ref only debounces the gap between
      // emitting and the `announced=true` flag landing on the next poll.
      for (const m of feed.milestones) {
        if (m.is_reached && !m.announced) {
          if (!reachedIdsRef.current.has(-m.id)) {
            reachedIdsRef.current.add(-m.id);
            emit({ kind: 'milestone-reached', milestone: m });
            // Persist — next poll flips `announced` true so no source
            // (this one included, post-reload) replays the celebration.
            void obsApi.markMilestoneAnnounced(m.id);
          }
        } else {
          // Not reached, or already announced — drop any in-session mark
          // so an operator Reset (clears reached_at + announced) re-arms
          // the celebration for a future re-cross.
          reachedIdsRef.current.delete(-m.id);
        }
      }
    }
  }, [
    feed.incentives,
    feed.milestones,
    feed.incentivesLoaded,
    feed.milestonesLoaded,
    emit,
  ]);

  // Watch the currently-playing entry's obtained objectives and fire the
  // pickup celebration when one newly flips obtained. Objectives are
  // per-entry (unlike event-global incentives/milestones), so we reseed the
  // tracking set whenever the currently-playing entry changes — that way
  // switching games doesn't re-celebrate objectives obtained in a prior run,
  // and a fresh mount on an in-progress run doesn't replay history. Un-
  // obtaining (operator cleared it) drops the id so it can celebrate again.
  const obtainedObjectiveIdsRef = useRef<Set<number>>(new Set());
  const objectivesEntryIdRef = useRef<number | null>(null);
  useEffect(() => {
    const entry = feed.currentlyPlaying?.schedule_entry_detail ?? null;
    if (!entry) {
      objectivesEntryIdRef.current = null;
      obtainedObjectiveIdsRef.current = new Set();
      return;
    }
    const obtained = new Set(entry.obtained_objective_ids ?? []);
    if (objectivesEntryIdRef.current !== entry.id) {
      // New (or first) entry — seed without emitting.
      objectivesEntryIdRef.current = entry.id;
      obtainedObjectiveIdsRef.current = obtained;
      return;
    }
    const library = entry.game?.objectives ?? [];
    for (const id of obtained) {
      if (!obtainedObjectiveIdsRef.current.has(id)) {
        obtainedObjectiveIdsRef.current.add(id);
        const objective = library.find((o) => o.id === id);
        // Setpiece-role objectives (enter dungeon / enter boss arena / defeat
        // boss) drive the setpiece panel — and boss-defeat fires its own
        // celebration server-side — so skip the generic pickup alert for them.
        if (objective && !objective.setpiece_role) {
          emit({ kind: 'objective-obtained', objective });
        }
      }
    }
    for (const id of [...obtainedObjectiveIdsRef.current]) {
      if (!obtained.has(id)) obtainedObjectiveIdsRef.current.delete(id);
    }
  }, [feed.currentlyPlaying, emit]);

  const isUrgent = omnibarState.kind === 'urgent';
  const isCelebrating = omnibarState.kind === 'celebrating';
  // Pulled here (not inline in the JSX) so the conditional spread on
  // the wrapper's style stays a single expression — the helper returns
  // null when not celebrating or when the trigger payload has no
  // `flash_color`, in which case the CSS fallback chain takes over.
  const celebrateFlashColor = readCelebrateFlashColor(omnibarState);

  // Where the urgent banner lands. Each override carries its own
  // `target_lane` so operators can put announcements in the status
  // zone (top), the ticker zone (bottom), or take over BOTH lanes
  // as a single full-bar banner.
  const urgentOverride = isUrgent ? (omnibarState.override as OmnibarOverride) : null;
  const isBothLane = urgentOverride?.target_lane === 'both';
  const urgentBanner = urgentOverride ? (
    <UrgentBannerPanel data={{ override: urgentOverride }} />
  ) : null;
  const urgentTop =
    urgentOverride && urgentOverride.target_lane === 'top' ? urgentBanner : null;

  // Bottom-lane takeover priority: urgent (when targeted bottom) >
  // donation > event flash. Donations / flashes always go to the
  // bottom lane (top is reserved for status + urgent overrides).
  const urgentBottom =
    urgentOverride && urgentOverride.target_lane === 'bottom' ? urgentBanner : null;
  // Priority: urgent override → donation card → Twitch takeover →
  // playthrough event flash → nothing (lane runs its rotation).
  // Twitch + playthrough events both look up the right component via
  // the event-handler registry — unknown kinds fall back to a generic
  // toast so a brand-new event source doesn't crash.
  // `key` ensures each new takeover event remounts its panel — every
  // takeover panel (LiveDonation, Twitch, EventFlash) runs its
  // dismissal timer in a mount-time effect, so without a key the
  // second event would inherit the first's already-fired timer and
  // either dismiss too early or never dismiss at all.
  const twitchTakeover = activeTwitchEvent ? (() => {
    const desc = getEventHandler(activeTwitchEvent.kind);
    const Cmp = desc?.component ?? TwitchGenericToast;
    return (
      <Cmp
        key={activeTwitchEvent.id}
        data={{ event: activeTwitchEvent }}
        onComplete={onTwitchEventComplete}
      />
    );
  })() : null;
  const flashTakeover = activeFlash ? (() => {
    const desc = getEventHandler(activeFlash.kind);
    if (desc) {
      const Cmp = desc.component;
      return (
        <Cmp
          key={activeFlash.id}
          data={{ event: activeFlash }}
          onComplete={onFlashComplete}
        />
      );
    }
    return (
      <EventFlashPanel
        key={activeFlash.id}
        data={{ event: activeFlash }}
        onComplete={onFlashComplete}
      />
    );
  })() : null;
  const bottomTakeover = urgentBottom ?? (activeDonation ? (
    // `key` forces a fresh LiveDonationPanel instance per donation —
    // its TTS / marquee / advancedRef lifecycle all live in mount-
    // time effects. Without this, every donation after the first
    // would inherit the first's already-resolved advancedRef and
    // the lane would silently get stuck.
    <LiveDonationPanel
      key={activeDonation.id}
      data={{ donation: activeDonation, fallbackCurrency: feed.event?.currency_symbol ?? '£' }}
      onComplete={onDonationComplete}
    />
  ) : twitchTakeover ?? flashTakeover ?? undefined);

  // Single-lane dim when an URGENT override targets the OTHER lane —
  // top-targeted dims the bottom and vice versa. The "both" case
  // bypasses lane rendering entirely (see fullbar branch below).
  const topSuspended = isUrgent && urgentOverride?.target_lane === 'bottom';
  const bottomSuspended = isUrgent && urgentOverride?.target_lane === 'top';

  // Mood class is derived from the highest-priority signal:
  //   urgent override → 'urgent'
  //   celebrating     → 'celebrate'
  //   incoming twitch → 'cheer'
  //   setpiece imminent → 'ominous'
  //   otherwise        → no mood class
  const setpieceImminent =
    feed.phase.state === 'live' && feed.phase.sub.kind === 'setpiece-imminent';
  const mood = isUrgent
    ? 'mood--urgent'
    : isCelebrating
      ? 'mood--celebrate'
      : activeTwitchEvent
        ? 'mood--cheer'
        : setpieceImminent
          ? 'mood--ominous'
          : '';

  return (
    <div
      className={`omnibar omnibar--v2 mode--${omnibarState.kind}${
        isCelebrating ? ' is-celebrating' : ''
      }${(isBothLane || isCelebrating) ? ' is-fullbar' : ''}${mood ? ` ${mood}` : ''}`}
      aria-hidden
    >
      <Brand feed={feed} />
      <div className="ob-lanes">
        {isBothLane && urgentBanner ? (
          /* Both lanes collapse into a single full-height takeover.
           * The two-lane DOM is replaced so the banner gets the full
           * 96px and reads as one big moment instead of a duplicated
           * banner stacked on itself. */
          <div className="ob-fullbar">{urgentBanner}</div>
        ) : isCelebrating ? (
          /* Milestone / incentive-unlocked celebration. Mirrors the
           * urgent-fullbar treatment so the achievement message takes
           * over the entire bar for the celebration window (~5s) and
           * viewers see WHAT was achieved, not just the gold flash.
           *
           * `key` is the celebrate nonce so back-to-back celebrations
           * remount this subtree, guaranteeing entrance animations on
           * the flash overlay and tag pill restart for each event
           * instead of holding their post-fill state from the prior
           * celebration. */
          <div
            key={`celebrate-${celebrateNonce}`}
            className="ob-fullbar ob-fullbar--celebrate"
            style={{
              // `--ob-celebrate-hold-ms` extends the celebration's
              // exit-animation delays by this much (see omnibar.css).
              // Schedule-entry-sound overrides set this from their
              // configured Duration so the banner stays visible for
              // longer than the default 6.2s choreography. 0 for
              // milestone / incentive celebrations.
              ['--ob-celebrate-hold-ms' as string]: `${celebrateHoldMs}ms`,
              // Per-fire flash colour override — the trigger payload can
              // ship a `flash_color` field which then drives the top-
              // anchored flash gradient via `--ob-celebrate-flash-color`
              // in omnibar.css. The helper returns null when unset, in
              // which case the CSS fallback chain (theme default →
              // baked-in gold) wins.
              ...(celebrateFlashColor && {
                ['--ob-celebrate-flash-color' as string]: celebrateFlashColor,
              }),
            } as React.CSSProperties}
          >
            {/* Soft gold flash overlay — a real DOM element (rather
              * than a ::before pseudo) so its entrance animation
              * fires reliably on each fresh mount. Sits behind the
              * banner content via source order (it precedes the
              * CelebrationBanner row) so the tag + headline appear
              * on top of the illumination rather than being tinted
              * by it. */}
            <div className="ob-celebrate-flash" aria-hidden />
            <CelebrationBanner
              reason={
                omnibarState.kind === 'celebrating'
                  ? omnibarState.reason
                  : { kind: 'achievement', payload: {} }
              }
              currencySymbol={feed.event?.currency_symbol ?? '£'}
            />
          </div>
        ) : (
          <>
            <Lane
              config={layout.top}
              feed={feed}
              transitions={transitions}
              suspended={topSuspended}
              takeoverChild={urgentTop ?? undefined}
            />
            <Lane
              config={layout.bottom}
              feed={feed}
              transitions={transitions}
              suspended={bottomSuspended}
              takeoverChild={bottomTakeover}
            />
          </>
        )}
      </div>
      <RightCluster
        feed={feed}
        hasPending={Boolean(activeDonation || bottomTakeover || urgentTop || isBothLane)}
      />
    </div>
  );
}

function Brand({ feed }: { feed: OmnibarFeed }) {
  // omnibar_logo_url lets the broadcast layer carry a different mark
  // from the site hero (e.g. a wordmark variant tuned to whichever
  // brand-pill gradient the theme uses). Falls back to the global
  // logo_url, then the bundled SVG so the pill is never bare.
  const logo =
    feed.theme?.omnibar_logo_url ||
    feed.theme?.logo_url ||
    '/assets/img/brand/logo/Zeldathon-Logo-WW-white.svg';
  return (
    <div className="ob-brand">
      <img src={logo} alt="" />
    </div>
  );
}

function RightCluster({
  feed,
  hasPending,
}: {
  feed: OmnibarFeed;
  hasPending: boolean;
}) {
  const total = Number(feed.totals?.grand_total ?? 0);
  const symbol = feed.event?.currency_symbol ?? '£';
  // Smooth tween between the previous total and the new one. The
  // tween's real-number output drives each digit reel's vertical
  // position, so a £10 donation visibly rolls the digits forward
  // over ~900ms rather than snapping to the new value.
  const tweened = useTweenedNumber(total, TOTAL_TWEEN_MS);
  const splashColorMode = readSplashColorMode(feed.event?.omnibar_layout);
  return (
    <div className={`ob-total${hasPending ? ' is-pending' : ''}`}>
      <div className="ob-total-amount-wrap">
        {/* Splash overlay sits over JUST the amount block (currency +
          * reels) so the "+£N" badges can't drift across the charity
          * cluster. Subscribes to donation-arrived bus events; props
          * just configure the colour mode. */}
        <DonationSplash colorMode={splashColorMode} />
        <span className="ob-total-currency">{symbol}</span>
        <span className="ob-total-amount">
          <SlotReel value={tweened} />
        </span>
      </div>
      <CharityCluster gameblastLogoUrl={feed.event?.gameblast_logo_url ?? null} />
    </div>
  );
}

/** Pull `splash.color_mode` out of the per-event omnibar_layout JSON.
 *  Falls back to 'theme' when the field is unset or malformed. */
function readSplashColorMode(layout: unknown): SplashColorMode {
  if (!layout || typeof layout !== 'object') return 'theme';
  const splash = (layout as { splash?: unknown }).splash;
  if (!splash || typeof splash !== 'object') return 'theme';
  const mode = (splash as { color_mode?: unknown }).color_mode;
  if (mode === 'gold' || mode === 'rainbow' || mode === 'theme') return mode;
  return 'theme';
}

/** Pull `flash_color` off a celebrating omnibar state's reason payload.
 *  Used to set --ob-celebrate-flash-color on the celebration wrapper so
 *  a schedule-entry sound trigger can override the gold flash colour
 *  per-fire. Returns null when not celebrating or no payload value. */
function readCelebrateFlashColor(state: OmnibarState): string | null {
  if (state.kind !== 'celebrating') return null;
  const payload = (state.reason.payload ?? {}) as Record<string, unknown>;
  const v = payload.flash_color;
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

// Upper bound on tween duration. The hook scales the actual run-
// time with the size of the delta (see useTweenedNumber below) so a
// £5 donation gets a punchy ~1.2s roll while a £1000 donation gets
// the full slow-windup-fast-middle-slow-finish over close to this
// ceiling. Cap keeps an enormous incoming sum from dragging
// indefinitely.
const TOTAL_TWEEN_MS = 3200;

/**
 * easeOutCubic tween toward `target`. New targets restart the tween
 * from whatever value is on screen now (so donations arriving
 * mid-tween smoothly redirect instead of snapping). Cold-boot is
 * special-cased: jumping FROM zero snaps to the current total so a
 * page reload doesn't roll up the whole campaign from £0.
 */
function useTweenedNumber(target: number, maxDurationMs: number) {
  const [value, setValue] = useState(target);
  const currentRef = useRef(target);
  currentRef.current = value;
  useEffect(() => {
    const from = currentRef.current;
    if (from === target) return;
    if (from === 0) {
      setValue(target);
      return;
    }
    // Scale duration logarithmically with the delta size: a small
    // donation (£5) gets a snappy ~1.2s roll, a medium one (£50)
    // ~1.8s, and only a large delta (£500+) approaches the cap. The
    // base 800ms keeps even £1 from feeling rushed.
    //
    //   £1   → ~980ms
    //   £5   → ~1267ms
    //   £10  → ~1425ms
    //   £50  → ~1823ms
    //   £100 → ~2003ms
    //   £500 → ~2412ms
    //   £1k+ → capped at maxDurationMs
    const delta = Math.abs(target - from);
    const durationMs = Math.min(
      maxDurationMs,
      800 + 600 * Math.log10(1 + delta),
    );
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      // easeInOutCubic — slow start, fast middle, slow finish. This
      // is the slot-machine feel the omnibar wants: the reels accel-
      // erate up, blur through the middle of the range, then decel-
      // erate into their final digits.
      const eased = p < 0.5
        ? 4 * p * p * p
        : 1 - Math.pow(-2 * p + 2, 3) / 2;
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, maxDurationMs]);
  return value;
}
