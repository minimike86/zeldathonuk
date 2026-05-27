import { useMemo } from 'react';
import {
  obsApi,
  usePolledQuery,
  type CurrentlyPlaying,
  type Donation,
  type DonationTotals,
  type EventModel,
  type Incentive,
  type Milestone,
  type ScheduleEntry,
  type ThemeSettings,
} from '@/lib/obsApi';
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
  milestones: Milestone[];
  theme: ThemeSettings | null;
  phase: PlaythroughPhase;
  now: Date;
}

const POLL_CURRENT_MS = 3000;
const POLL_EVENT_MS = 15_000;
const POLL_SCHEDULE_MS = 8000;
const POLL_DONATIONS_MS = 3000;
const POLL_INCENTIVES_MS = 5000;
const POLL_THEME_MS = 60_000;

export function useOmnibarFeed(now: Date): OmnibarFeed {
  const { data: event } = usePolledQuery(obsApi.activeEvent, POLL_EVENT_MS);
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
  const { data: theme } = usePolledQuery(obsApi.themeSettings, POLL_THEME_MS);

  return useMemo<OmnibarFeed>(() => {
    const sched = schedule ?? [];
    return {
      event: event ?? null,
      currentlyPlaying: cp ?? null,
      schedule: sched,
      donations: donations ?? [],
      totals: totals ?? null,
      incentives: incentives ?? [],
      milestones: milestones ?? [],
      theme: theme ?? null,
      phase: derivePlaythroughPhase(cp ?? null, sched),
      now,
    };
  }, [event, cp, schedule, donations, totals, incentives, milestones, theme, now]);
}
