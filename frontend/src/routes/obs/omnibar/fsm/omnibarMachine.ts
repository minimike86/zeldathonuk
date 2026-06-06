import type { OmnibarOverride, ScheduleEntry } from '@/lib/obsApi';

/**
 * Top-level omnibar FSM. One of four modes at any time; both lanes
 * receive coordination signals based on the active mode.
 *
 *   normal       — lanes run their own rotations
 *   urgent       — an override has taken over; both lanes dim/suspend
 *                  and the override banner takes the bottom lane
 *   celebrating  — a milestone or major event fired; both lanes
 *                  coordinate a brief celebration
 *   breaking     — playthrough is in `break`; bar mood shifts
 *
 * Transitions are explicit (one switch over s.kind × a.type). The
 * compiler enforces exhaustiveness so new states/events surface as
 * type errors at the call site.
 */

export type OmnibarState =
  | { kind: 'normal' }
  | { kind: 'urgent'; override: OmnibarOverride }
  | { kind: 'celebrating'; reason: CelebrationReason }
  | { kind: 'breaking'; entry: ScheduleEntry };

export type CelebrationReason = {
  kind: string; // 'milestone' | 'incentive-unlocked' | 'setpiece-celebrating' | ...
  payload?: Record<string, unknown>;
};

export type OmnibarAction =
  | { type: 'OVERRIDE_ARRIVED'; override: OmnibarOverride }
  | { type: 'OVERRIDE_EXPIRED' }
  | { type: 'CELEBRATE'; reason: CelebrationReason }
  | { type: 'CELEBRATION_DONE' }
  | { type: 'BREAK_STARTED'; entry: ScheduleEntry }
  | { type: 'BREAK_ENDED' };

export const INITIAL: OmnibarState = { kind: 'normal' };

export function omnibarReducer(s: OmnibarState, a: OmnibarAction): OmnibarState {
  switch (a.type) {
    case 'OVERRIDE_ARRIVED':
      // Urgent always wins over everything except a higher-priority
      // override (priority comparison is done by the caller before
      // dispatching, so by the time we get here it's authoritative).
      return { kind: 'urgent', override: a.override };
    case 'OVERRIDE_EXPIRED':
      // Drop back to normal — if a break is in progress, the playthrough
      // hook will re-dispatch BREAK_STARTED on the next tick.
      if (s.kind === 'urgent') return { kind: 'normal' };
      return s;
    case 'CELEBRATE':
      // Celebrations preempt normal/breaking but not urgent.
      if (s.kind === 'urgent') return s;
      return { kind: 'celebrating', reason: a.reason };
    case 'CELEBRATION_DONE':
      if (s.kind === 'celebrating') return { kind: 'normal' };
      return s;
    case 'BREAK_STARTED':
      // Breaking only takes effect from normal — urgent and celebrating
      // outrank it.
      if (s.kind === 'normal') return { kind: 'breaking', entry: a.entry };
      return s;
    case 'BREAK_ENDED':
      if (s.kind === 'breaking') return { kind: 'normal' };
      return s;
  }
}
