import { useEffect, useMemo, useReducer } from 'react';
import {
  obsApi,
  usePolledQuery,
  type CurrentlyPlaying,
  type Donation,
  type DonationTotals,
  type EventModel,
  type Incentive,
  type Milestone,
  type Raffle,
  type ScheduleEntry,
  type ThemeSettings,
} from '@/lib/obsApi';
import { onEventChanged } from '@/lib/eventBus';
import { onThemeChanged } from '@/lib/themeBus';
import { derivePlaythroughPhase } from '../fsm/playthroughMachine';
import type { PlaythroughPhase } from '../bus/types';

/**
 * Aggregates everything the omnibar's panels read into one object so
 * each panel's `selectData` is a pure function over a single feed
 * value. Cuts down on prop drilling and lets us add new panels without
 * touching the root component.
 */
export interface OmnibarFeed {
  event: EventModel | null;
  currentlyPlaying: CurrentlyPlaying | null;
  schedule: ScheduleEntry[];
  donations: Donation[];
  totals: DonationTotals | null;
  incentives: Incentive[];
  /** True once the incentives poll has returned its first response.
   *  Consumers that fire side-effects on `is_reached` transitions
   *  rely on this to distinguish "no data yet" (default `[]` before
   *  any poll completes) from "API returned empty list", which look
   *  identical otherwise. */
  incentivesLoaded: boolean;
  milestones: Milestone[];
  /** Same idea — has the milestones poll returned its first
   *  response yet. Without this, a hard-reload could double-fire
   *  the celebration for an already-reached milestone if the
   *  milestones poll happens to resolve after some other gating
   *  poll the consumer was waiting on. */
  milestonesLoaded: boolean;
  raffles: Raffle[];
  theme: ThemeSettings | null;
  phase: PlaythroughPhase;
  now: Date;
}

const POLL_CURRENT_MS = 3000;
// Active-event poll. Short cadence because lane layout / splash mode
// / GameBlast logo all live on this row and operators expect changes
// to land in seconds. Same-browser updates are instant via
// eventBus broadcast (see lib/eventBus.ts); this is the floor for
// cross-device updates.
const POLL_EVENT_MS = 5_000;
const POLL_SCHEDULE_MS = 8000;
const POLL_DONATIONS_MS = 3000;
const POLL_INCENTIVES_MS = 5000;
// Theme poll. Floor for cross-browser refresh — OBS browser sources
// don't share BroadcastChannel with /control/theme so the poll cadence
// is the only thing that catches them up. 3s matches <ThemeProvider>,
// keeping the omnibar's feed.theme (used for the wordmark logo) in
// sync with the CSS-var apply path within a few seconds of activation.
// Same-browser tabs additionally hop the queue via themeBus below.
const POLL_THEME_MS = 3000;

export function useOmnibarFeed(now: Date): OmnibarFeed {
  // Cross-tab event-row push: when another tab (notably /control/omnibar)
  // PATCHes the active event, eventBus broadcasts and bumps this
  // counter. Adding it to the polled query's deps cancels the in-flight
  // tick and re-fetches immediately, so layout edits land in roughly
  // one render frame instead of waiting up to POLL_EVENT_MS.
  const [eventBump, dispatchBump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => onEventChanged(dispatchBump), []);
  // Same pattern for theme: same-browser tabs (e.g. /control/theme)
  // postMessage via themeBus when the active theme changes, which
  // bumps this counter and cancels the in-flight 3s tick so the
  // wordmark logo + currency symbol land in roughly one render frame.
  const [themeBump, dispatchThemeBump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => onThemeChanged(dispatchThemeBump), []);
  const { data: event } = usePolledQuery(obsApi.activeEvent, POLL_EVENT_MS, [eventBump]);
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, POLL_CURRENT_MS);
  const { data: schedule } = usePolledQuery(
    () => (event ? obsApi.schedule(event.id) : Promise.resolve([])),
    POLL_SCHEDULE_MS,
    [event?.id],
  );
  const { data: donations } = usePolledQuery(
    () => (event ? obsApi.donations(event.id) : Promise.resolve([])),
    POLL_DONATIONS_MS,
    [event?.id],
  );
  const { data: totals } = usePolledQuery(
    () =>
      event
        ? obsApi.donationTotals(event.id)
        : Promise.resolve({
            by_platform: [],
            grand_total: '0',
            donation_count: 0,
          } as DonationTotals),
    POLL_DONATIONS_MS,
    [event?.id],
  );
  const { data: incentives } = usePolledQuery(
    () =>
      event
        ? obsApi.incentives({ eventId: event.id, activeOnly: true })
        : Promise.resolve([] as Incentive[]),
    POLL_INCENTIVES_MS,
    [event?.id],
  );
  const { data: milestones } = usePolledQuery(
    () =>
      event
        ? obsApi.milestones({ eventId: event.id })
        : Promise.resolve([] as Milestone[]),
    POLL_INCENTIVES_MS,
    [event?.id],
  );
  const { data: raffles } = usePolledQuery(
    () =>
      event
        ? obsApi.raffles({ eventId: event.id, activeOnly: true })
        : Promise.resolve([] as Raffle[]),
    POLL_INCENTIVES_MS,
    [event?.id],
  );
  const { data: theme } = usePolledQuery(obsApi.themeSettings, POLL_THEME_MS, [themeBump]);

  return useMemo<OmnibarFeed>(() => {
    const sched = schedule ?? [];
    return {
      event: event ?? null,
      currentlyPlaying: cp ?? null,
      schedule: sched,
      donations: donations ?? [],
      totals: totals ?? null,
      incentives: incentives ?? [],
      // `usePolledQuery` returns `null` until the first response
      // resolves, then the array. Surfacing that distinction lets
      // the reach detector skip its initial-snapshot seed until the
      // collection has ACTUALLY loaded (rather than racing some
      // other poll).
      incentivesLoaded: incentives !== null,
      milestones: milestones ?? [],
      milestonesLoaded: milestones !== null,
      raffles: raffles ?? [],
      theme: theme ?? null,
      phase: derivePlaythroughPhase(cp ?? null, sched),
      now,
    };
  }, [event, cp, schedule, donations, totals, incentives, milestones, raffles, theme, now]);
}
