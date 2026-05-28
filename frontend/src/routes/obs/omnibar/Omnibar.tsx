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
} from './fsm/omnibarMachine';
import { useOmnibarFeed, type OmnibarFeed } from './hooks/useOmnibarFeed';
import { useOverrideStream } from './hooks/useOverrideStream';
import { usePlaythroughEventStream } from './hooks/usePlaythroughEventStream';
import { useExternalEventStream } from './hooks/useExternalEventStream';
import { useOmnibarSse } from './hooks/useOmnibarSse';
import { useLayoutConfig } from './hooks/useLayoutConfig';
import { useTransitionsConfig } from './hooks/useTransitionsConfig';
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
import './panels/ObjectivePanel';
import './panels/SetpiecePanel';
import './panels/TotalRaisedPanel';
import './panels/SchedulePanel';
import './panels/IncentivesPanel';
import './panels/MilestonesPanel';
import './panels/BidWarPanel';
import './panels/DonationReelPanel';
import './panels/CharityInfoPanel';
import './panels/LocalTimePanel';
import './panels/ItemsCollectedPanel';
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
// declared in hooks/useLayoutConfig.ts. The fallbacks match what
// used to be hardcoded here, so behaviour is unchanged when the
// event ships no layout.

const EVENT_FLASH_MS = 3500;

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
    const reason: CelebrationReason = {
      kind: 'milestone-reached',
      payload: { milestone: e.milestone },
    };
    dispatch({ type: 'CELEBRATE', reason });
    setCelebrateNonce((n) => n + 1);
    // Optional fanfare audio per milestone — fire-and-forget; failure
    // (autoplay blocked, missing file) is silent, the visual
    // celebration still runs.
    if (e.milestone.audio_url) {
      const audio = new Audio(e.milestone.audio_url);
      audio.volume = 0.85;
      audio.play().catch(() => {});
    }
    window.setTimeout(() => dispatch({ type: 'CELEBRATION_DONE' }), 6200);
  });
  useBusSubscription('incentive-unlocked', (e) => {
    const reason: CelebrationReason = {
      kind: 'incentive-unlocked',
      payload: { incentive: e.incentive },
    };
    dispatch({ type: 'CELEBRATE', reason });
    setCelebrateNonce((n) => n + 1);
    window.setTimeout(() => dispatch({ type: 'CELEBRATION_DONE' }), 6200);
  });

  // Override stream → urgent mode. The highest-priority active override
  // drives the FSM; expiry returns it to normal.
  useBusSubscription('override-arrived', (e) => {
    dispatch({ type: 'OVERRIDE_ARRIVED', override: e.override });
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
  // Milestones use negative keys in the same set so their ids can't
  // collide with incentive ids.
  const reachedIdsRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    for (const i of feed.incentives) {
      if (i.is_reached) {
        if (!reachedIdsRef.current.has(i.id)) {
          reachedIdsRef.current.add(i.id);
          // Skip the first pass — we don't want to fanfare incentives
          // that were already reached before the omnibar mounted.
          if (donationsInitialisedRef.current) {
            emit({ kind: 'incentive-unlocked', incentive: i });
          }
        }
      } else {
        // Not reached (possibly post-reset) — clear any prior mark so
        // the next reach fires the celebration.
        reachedIdsRef.current.delete(i.id);
      }
    }
    // Same for milestones (negative keys so they can't collide with
    // incentive ids in the shared set).
    for (const m of feed.milestones) {
      if (m.is_reached) {
        if (!reachedIdsRef.current.has(-m.id)) {
          reachedIdsRef.current.add(-m.id);
          if (donationsInitialisedRef.current) {
            emit({ kind: 'milestone-reached', milestone: m });
          }
        }
      } else {
        reachedIdsRef.current.delete(-m.id);
      }
    }
  }, [feed.incentives, feed.milestones, emit]);

  const isUrgent = omnibarState.kind === 'urgent';
  const isCelebrating = omnibarState.kind === 'celebrating';

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
  const logo = feed.theme?.logo_url || '/assets/img/Zeldathon-Logo-WW-white.svg';
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
