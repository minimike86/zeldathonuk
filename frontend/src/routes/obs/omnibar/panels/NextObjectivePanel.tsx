import { MarqueeOnOverflow } from './_shared/MarqueeOnOverflow';
import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';
import type { GameObjective } from '@/lib/obsApi';

/**
 * "Next up" lane panel — surfaces the very next outstanding objective
 * for the currently-playing game, in list order (sort by
 * `objective.order` then `name`).
 *
 * Distinct from:
 *   • custom-objective (CustomObjectivePanel) — operator-set free text on
 *     ScheduleEntry.current_objective, shown verbatim.
 *   • objective-checklist (ObjectiveChecklistPanel) — full icon strip
 *     of every active objective with obtained / outstanding state.
 *
 * This panel deliberately focuses on JUST the next one — operator
 * doesn't need to type anything, the panel computes which objective
 * is up next from the per-game library + per-run obtained/skipped sets.
 * Hidden when:
 *   • There's no currently-playing entry, OR
 *   • The active game has no objectives, OR
 *   • Every active objective is already obtained (nothing "next").
 *
 * The narrow rail can clip long objective names, so the body sits
 * inside MarqueeOnOverflow — it scrolls only when the measured width
 * exceeds the rail (same treatment as CustomObjectivePanel + PreStream).
 */

interface Data {
  /** The objective to highlight as "up next". */
  objective: GameObjective;
  /** Position in the run, 1-indexed (1 = first remaining). Useful for
   *  framing as "#3 of 12" so viewers see how far through the run
   *  the runner is. */
  position: number;
  /** Total number of still-outstanding active objectives, including
   *  this one. `position` is always ≤ `remaining`. */
  remaining: number;
}

function Panel({ data }: PanelProps<Data>) {
  const { objective, position, remaining } = data;
  return (
    <PanelRow tag="NEXT UP" arrow>
      <div style={{ flex: '1 1 0', minWidth: 0 }}>
        <MarqueeOnOverflow>
          {objective.image_url && (
            <span className="ob-item-icon" aria-hidden>
              <img src={objective.image_url} alt="" />
            </span>
          )}
          <span className="ob-text-strong">{objective.name}</span>
          <span className="ob-text-muted">
            #{position} of {remaining}
          </span>
        </MarqueeOnOverflow>
      </div>
    </PanelRow>
  );
}

registerPanel<Data>({
  id: 'next-objective',
  component: Panel,
  selectData: (feed) => {
    const entry = feed.currentlyPlaying?.schedule_entry_detail;
    if (!entry || !entry.game) return null;
    const all = entry.game.objectives ?? [];
    if (all.length === 0) return null;
    const obtained = new Set(entry.obtained_objective_ids);
    const skipped = new Set(entry.skipped_objective_ids);
    // Sort the library into list order — same sort the checklist
    // panel uses — then walk it for the first still-outstanding
    // entry. Skipped objectives are dropped entirely; obtained ones
    // count toward `position` so the "#N of M" feels like progress.
    const active = all
      .filter((o) => !skipped.has(o.id))
      .slice()
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    if (active.length === 0) return null;
    const remainingList = active.filter((o) => !obtained.has(o.id));
    if (remainingList.length === 0) return null;
    const objective = remainingList[0];
    // Position = index of the next-up entry within the full active
    // list (1-indexed). For a fresh game that's 1; once the first
    // is obtained it becomes 2; etc.
    const position = active.findIndex((o) => o.id === objective.id) + 1;
    return {
      objective,
      position,
      remaining: active.length,
    };
  },
  minDurationMs: 6500,
});
