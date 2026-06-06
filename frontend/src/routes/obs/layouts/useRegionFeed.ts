/**
 * Shared event-level data feed for the layout region elements. Fetched ONCE in
 * Standard and threaded down (like `entry`), so the new fundraising / schedule
 * elements don't each poll their own endpoint — which would re-create the
 * per-element polling flood we removed earlier.
 *
 * Only the sources the active preset actually uses are polled: an items-only
 * preset makes no fundraising calls (the unused queries resolve to null with no
 * network request).
 */
import { useMemo } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type {
  Donation,
  DonationTotals,
  EventModel,
  Incentive,
  Milestone,
  Raffle,
  ScheduleEntry,
} from '@/lib/obsApi';
import type { ElementId } from './useLayoutPresetConfig';

export type RegionFeedSource =
  | 'event'
  | 'totals'
  | 'donations'
  | 'incentives'
  | 'milestones'
  | 'raffles'
  | 'schedule';

export interface RegionFeed {
  event: EventModel | null;
  totals: DonationTotals | null;
  donations: Donation[] | null;
  incentives: Incentive[] | null;
  milestones: Milestone[] | null;
  raffles: Raffle[] | null;
  schedule: ScheduleEntry[] | null;
}

/** Which feed sources each element needs. Elements not listed (custom-objective,
 *  setpiece, local-time) run off `entry` or a local clock — no feed. Every entry
 *  includes `event` since the others are event-scoped. */
const ELEMENT_SOURCES: Partial<Record<ElementId, RegionFeedSource[]>> = {
  'total-raised': ['event', 'totals'],
  'donation-reel': ['event', 'donations'],
  incentives: ['event', 'incentives'],
  milestones: ['event', 'milestones', 'totals'],
  raffle: ['event', 'raffles'],
  'schedule-next': ['event', 'schedule'],
  'total-playtime': ['event'],
  'pre-stream': ['event', 'schedule'],
  'event-info': ['event'],
  'bid-war': ['event', 'incentives'],
};

/** Union of feed sources needed by a set of element ids. */
export function neededSources(elements: Iterable<ElementId>): Set<RegionFeedSource> {
  const out = new Set<RegionFeedSource>();
  for (const e of elements) for (const s of ELEMENT_SOURCES[e] ?? []) out.add(s);
  return out;
}

export function useRegionFeed(needed: Set<RegionFeedSource>): RegionFeed {
  const wantEvent = needed.has('event');
  const { data: event } = usePolledQuery(
    () => (wantEvent ? obsApi.activeEvent() : Promise.resolve(null)),
    10000,
    [wantEvent],
  );
  const eid = event?.id;

  const wantTotals = needed.has('totals');
  const { data: totals } = usePolledQuery(
    () => (wantTotals && eid ? obsApi.donationTotals(eid) : Promise.resolve(null)),
    5000,
    [wantTotals, eid],
  );

  const wantDonations = needed.has('donations');
  const { data: donations } = usePolledQuery(
    () => (wantDonations && eid ? obsApi.donations(eid) : Promise.resolve(null)),
    5000,
    [wantDonations, eid],
  );

  const wantIncentives = needed.has('incentives');
  const { data: incentives } = usePolledQuery(
    () =>
      wantIncentives && eid
        ? obsApi.incentives({ eventId: eid, activeOnly: true })
        : Promise.resolve(null),
    8000,
    [wantIncentives, eid],
  );

  const wantMilestones = needed.has('milestones');
  const { data: milestones } = usePolledQuery(
    () => (wantMilestones && eid ? obsApi.milestones({ eventId: eid }) : Promise.resolve(null)),
    8000,
    [wantMilestones, eid],
  );

  const wantRaffles = needed.has('raffles');
  const { data: raffles } = usePolledQuery(
    () =>
      wantRaffles && eid
        ? obsApi.raffles({ eventId: eid, activeOnly: true })
        : Promise.resolve(null),
    8000,
    [wantRaffles, eid],
  );

  const wantSchedule = needed.has('schedule');
  const { data: schedule } = usePolledQuery(
    () => (wantSchedule && eid ? obsApi.schedule(eid, { compact: true }) : Promise.resolve(null)),
    10000,
    [wantSchedule, eid],
  );

  return useMemo(
    () => ({
      event: event ?? null,
      totals: totals ?? null,
      donations: donations ?? null,
      incentives: incentives ?? null,
      milestones: milestones ?? null,
      raffles: raffles ?? null,
      schedule: schedule ?? null,
    }),
    [event, totals, donations, incentives, milestones, raffles, schedule],
  );
}
