import type {
  Donation,
  ExternalEvent,
  Incentive,
  Milestone,
  OmnibarOverride,
  PlaythroughEvent,
  ScheduleEntry,
} from '@/lib/obsApi';

/** What the omnibar event bus broadcasts. Discriminated by `kind`.
 *
 * New event kinds = new variant here + a registered handler. Unknown
 * kinds (delivered via a `playthrough-event` or `external-event`
 * passthrough) fall through to a generic toast handler. */
export type OmnibarBusEvent =
  | { kind: 'override-arrived'; override: OmnibarOverride }
  | { kind: 'override-expired'; id: number }
  | { kind: 'playthrough-phase-changed'; phase: PlaythroughPhase }
  | { kind: 'donation-arrived'; donation: Donation }
  | { kind: 'milestone-reached'; milestone: Milestone }
  | { kind: 'incentive-unlocked'; incentive: Incentive }
  | { kind: 'playthrough-event'; event: PlaythroughEvent }
  | { kind: 'external-event'; event: ExternalEvent }
  | { kind: 'panel-complete'; panelId: string }
  | { kind: 'lane-suspend' }
  | { kind: 'lane-resume' };

export type PlaythroughPhase =
  | { state: 'queued' }
  | { state: 'preroll'; entry: ScheduleEntry }
  | { state: 'live'; entry: ScheduleEntry; sub: LiveSubState }
  | { state: 'paused'; entry: ScheduleEntry }
  | { state: 'break'; entry: ScheduleEntry; child: ScheduleEntry }
  | { state: 'completed'; entry: ScheduleEntry }
  | { state: 'skipped'; entry: ScheduleEntry };

export type LiveSubState =
  | { kind: 'nominal' }
  | { kind: 'setpiece-imminent'; setpiece: SetPiece }
  | { kind: 'setpiece-active'; setpiece: SetPiece }
  | { kind: 'celebrating'; setpiece: SetPiece };

export interface SetPiece {
  kind: string; // open string — 'boss', 'shrine', 'dungeon', anything operator declares
  name: string;
  payload?: Record<string, unknown>;
}
