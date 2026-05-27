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
import { Lane } from './lanes/Lane';
import { LiveDonationPanel } from './panels/LiveDonationPanel';
import { UrgentBannerPanel } from './panels/UrgentBannerPanel';
import { EventFlashPanel } from './panels/EventFlashPanel';
import { TwitchGenericToast } from './panels/TwitchPanels';
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

  // Track donations we've already announced so reloading mid-stream
  // doesn't replay history.
  const seenDonationIdsRef = useRef<Set<number>>(new Set());
  const donationsInitialisedRef = useRef(false);

  useEffect(() => {
    const ds = feed.donations;
    if (!donationsInitialisedRef.current) {
      ds.forEach((d) => seenDonationIdsRef.current.add(d.id));
      donationsInitialisedRef.current = true;
      return;
    }
    // Skip muted donations entirely — no card. They're not added to
    // seenDonationIds either, so unmuting one later (via the toggle in
    // /control/donations) flows it through naturally on the next poll.
    const fresh = ds.find(
      (d) => !seenDonationIdsRef.current.has(d.id) && !d.is_muted,
    );
    if (!fresh) return;
    seenDonationIdsRef.current.add(fresh.id);
    // Queue: if a donation is already showing, hold the new one until
    // the current finishes. Simple FIFO via a ref-backed queue.
    pushDonationToQueue(fresh);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feed.donations]);

  const donationQueueRef = useRef<Donation[]>([]);
  const pushDonationToQueue = useCallback((d: Donation) => {
    if (activeDonation) {
      donationQueueRef.current.push(d);
    } else {
      setActiveDonation(d);
    }
  }, [activeDonation]);
  const onDonationComplete = useCallback(() => {
    const next = donationQueueRef.current.shift();
    setActiveDonation(next ?? null);
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
    // Optional fanfare audio per milestone — fire-and-forget; failure
    // (autoplay blocked, missing file) is silent, the visual
    // celebration still runs.
    if (e.milestone.audio_url) {
      const audio = new Audio(e.milestone.audio_url);
      audio.volume = 0.85;
      audio.play().catch(() => {});
    }
    window.setTimeout(() => dispatch({ type: 'CELEBRATION_DONE' }), 5000);
  });
  useBusSubscription('incentive-unlocked', (e) => {
    const reason: CelebrationReason = {
      kind: 'incentive-unlocked',
      payload: { incentive: e.incentive },
    };
    dispatch({ type: 'CELEBRATE', reason });
    window.setTimeout(() => dispatch({ type: 'CELEBRATION_DONE' }), 5000);
  });

  // Override stream → urgent mode. The highest-priority active override
  // drives the FSM; expiry returns it to normal.
  useBusSubscription('override-arrived', (e) => {
    dispatch({ type: 'OVERRIDE_ARRIVED', override: e.override });
  });
  useBusSubscription('override-expired', () => {
    dispatch({ type: 'OVERRIDE_EXPIRED' });
  });

  // Watch for incentives crossing into reached state — fire the event.
  // (The /contribute/ endpoint also reports `newly_reached` in its
  // response; this hook covers the path where the row is updated via
  // admin/direct DB without a contribute call.)
  const reachedIdsRef = useRef<Set<number>>(new Set());
  const emit = useBusEmit();
  useEffect(() => {
    for (const i of feed.incentives) {
      if (i.is_reached && !reachedIdsRef.current.has(i.id)) {
        reachedIdsRef.current.add(i.id);
        // Skip the first pass — we don't want to fanfare incentives
        // that were already reached before the omnibar mounted.
        if (donationsInitialisedRef.current) {
          emit({ kind: 'incentive-unlocked', incentive: i });
        }
      }
    }
    // Same for milestones.
    for (const m of feed.milestones) {
      if (m.is_reached && !reachedIdsRef.current.has(-m.id)) {
        reachedIdsRef.current.add(-m.id);
        if (donationsInitialisedRef.current) {
          emit({ kind: 'milestone-reached', milestone: m });
        }
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
  const twitchTakeover = activeTwitchEvent ? (() => {
    const desc = getEventHandler(activeTwitchEvent.kind);
    const Cmp = desc?.component ?? TwitchGenericToast;
    return (
      <Cmp
        data={{ event: activeTwitchEvent }}
        onComplete={onTwitchEventComplete}
      />
    );
  })() : null;
  const flashTakeover = activeFlash ? (() => {
    const desc = getEventHandler(activeFlash.kind);
    if (desc) {
      const Cmp = desc.component;
      return <Cmp data={{ event: activeFlash }} onComplete={onFlashComplete} />;
    }
    return <EventFlashPanel data={{ event: activeFlash }} onComplete={onFlashComplete} />;
  })() : null;
  const bottomTakeover = urgentBottom ?? (activeDonation ? (
    <LiveDonationPanel
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
      }${isBothLane ? ' is-fullbar' : ''}${mood ? ` ${mood}` : ''}`}
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
        ) : (
          <>
            <Lane
              config={layout.top}
              feed={feed}
              suspended={topSuspended}
              takeoverChild={urgentTop ?? undefined}
            />
            <Lane
              config={layout.bottom}
              feed={feed}
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
  return (
    <div className={`ob-total${hasPending ? ' is-pending' : ''}`}>
      <div className="ob-total-amount-wrap">
        <span className="ob-total-currency">{symbol}</span>
        <span className="ob-total-amount">
          {total.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  );
}
