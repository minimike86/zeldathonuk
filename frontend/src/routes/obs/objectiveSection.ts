/**
 * Shared "current objective section" selector. Both the omnibar
 * ObjectiveChecklistPanel and the layout ObjectiveChecklistElement use this so
 * they always agree on which section is live.
 *
 * The current section is the group (`group`, falling back to `category`, then a
 * shared '' cohort) that contains the next still-outstanding, non-tally
 * objective — so it auto-advances as a run progresses. Once everything is done
 * it falls back to the last section so consumers can still render a 100% strip.
 */
import type { GameObjective, ScheduleEntry } from '@/lib/obsApi';

export interface ObjectiveRow {
  objective: GameObjective;
  obtained: boolean;
  /** Per-dungeon tally for link_mode=tally objectives (e.g. small keys); null
   *  for normal single objectives. */
  count: number | null;
  /** Convenience: collected this run (tally>0 for tallies, else obtained). */
  done: boolean;
}

export interface ObjectiveSection {
  /** Section label (group/category), or null when the objectives are ungrouped. */
  sectionLabel: string | null;
  /** The current section's objectives, in list order. */
  rows: ObjectiveRow[];
  /** Counted (non-tally) objectives obtained in this section. */
  obtainedCount: number;
  /** Counted (non-tally) objectives in this section. */
  total: number;
}

const isTally = (o: GameObjective): boolean => o.link_mode === 'tally';

const groupKey = (o: GameObjective): string =>
  o.group?.trim() || o.category?.trim() || '';

/** Compute the live objective section for an entry, or null when there's no
 *  game / no objectives. Mirrors the omnibar's ObjectiveChecklistPanel. */
export function selectObjectiveSection(
  entry: ScheduleEntry | null | undefined,
): ObjectiveSection | null {
  if (!entry || !entry.game) return null;
  const all = entry.game.objectives ?? [];
  if (all.length === 0) return null;
  const obtained = new Set(entry.obtained_objective_ids);
  const skipped = new Set(entry.skipped_objective_ids);
  const counts = entry.objective_counts ?? {};

  // Drop skipped objectives; they're not in play this run.
  const active = all
    .filter((o) => !skipped.has(o.id))
    .slice()
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  if (active.length === 0) return null;

  // Section = the group containing the next outstanding (non-tally) objective;
  // fall back to the last section once the whole run is complete.
  const nextUp = active.find((o) => !obtained.has(o.id) && !isTally(o));
  const targetGroup = nextUp ? groupKey(nextUp) : groupKey(active[active.length - 1]);
  const sectionObjectives = active.filter((o) => groupKey(o) === targetGroup);

  const rows: ObjectiveRow[] = sectionObjectives.map((objective) => {
    const count = isTally(objective) ? counts[String(objective.id)] ?? 0 : null;
    const obtainedFlag = obtained.has(objective.id);
    return { objective, obtained: obtainedFlag, count, done: count != null ? count > 0 : obtainedFlag };
  });

  // Tally objectives don't count toward the "N of M done" tally.
  const counted = sectionObjectives.filter((o) => !isTally(o));
  return {
    sectionLabel: targetGroup || null,
    rows,
    obtainedCount: counted.filter((o) => obtained.has(o.id)).length,
    total: counted.length,
  };
}
