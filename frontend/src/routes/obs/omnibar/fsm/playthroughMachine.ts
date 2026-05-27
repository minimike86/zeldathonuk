import type { CurrentlyPlaying, ScheduleEntry } from '@/lib/obsApi';
import type { PlaythroughPhase } from '../bus/types';

/**
 * Playthrough FSM — derived (read-only) from existing backend fields,
 * no new state stored client-side. Called every poll tick to compute
 * the current phase from CurrentlyPlaying + the schedule list.
 *
 * Rules (in priority order):
 *   - is_completed → completed (or skipped if was_skipped)
 *   - active child break (started_at, !finished) → break
 *   - timer paused_at set → paused
 *   - timer.started_at set → live
 *   - currentlyPlaying points here, no timer started → preroll
 *   - otherwise → queued
 *
 * Sub-states for `live` are not yet derived from data (they require
 * an explicit operator flag — added later). Defaults to `nominal`.
 */
export function derivePlaythroughPhase(
  cp: CurrentlyPlaying | null,
  schedule: ScheduleEntry[],
): PlaythroughPhase {
  const active = cp?.schedule_entry_detail ?? null;
  if (!active) return { state: 'queued' };

  if (active.is_completed) {
    if (active.was_skipped) return { state: 'skipped', entry: active };
    return { state: 'completed', entry: active };
  }

  // Find any active child break (a child entry with started_at + no
  // finished_at). The schedule list is the source of truth.
  const activeBreak = schedule.find(
    (s) =>
      s.parent_entry === active.id &&
      s.started_at !== null &&
      s.finished_at === null,
  );
  if (activeBreak) {
    return { state: 'break', entry: active, child: activeBreak };
  }

  const timer = active.timer;
  if (timer) {
    if (timer.paused_at !== null) return { state: 'paused', entry: active };
    if (timer.started_at !== null && timer.ended_at === null) {
      return { state: 'live', entry: active, sub: { kind: 'nominal' } };
    }
  }

  // Pointed at by currently-playing but timer not yet started.
  return { state: 'preroll', entry: active };
}

/** Stable string identity for a phase — useful as a useEffect dep so
 *  consumers re-run only on actual phase change, not on every poll. */
export function phaseKey(p: PlaythroughPhase): string {
  switch (p.state) {
    case 'queued': return 'queued';
    case 'preroll': return `preroll:${p.entry.id}`;
    case 'live': return `live:${p.entry.id}:${p.sub.kind}`;
    case 'paused': return `paused:${p.entry.id}`;
    case 'break': return `break:${p.entry.id}:${p.child.id}`;
    case 'completed': return `completed:${p.entry.id}`;
    case 'skipped': return `skipped:${p.entry.id}`;
  }
}
