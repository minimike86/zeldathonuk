import type { CSSProperties } from 'react';
import { MarqueeOnOverflow } from './_shared/MarqueeOnOverflow';
import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';
import type { GameObjective } from '@/lib/obsApi';

/**
 * Live objectives checklist for the current game, scoped to the
 * **current run-section** so the rail isn't trying to scroll through
 * a 30-objective library at once. The "current section" is the group
 * containing the next still-outstanding objective; once every
 * objective in that group is obtained, the panel automatically
 * advances to the next group with outstanding work. Skipped
 * objectives (operator marked "not needed this run") are dropped
 * entirely and excluded from the count.
 *
 * Falls back to `category` when `group` is blank — matches the
 * fallback convention documented on GameObjective.group. Hidden
 * when the game has no objectives. Game name + section label +
 * tile strip scroll via MarqueeOnOverflow when they overflow the
 * rail.
 */
interface Row {
  objective: GameObjective;
  obtained: boolean;
  /** Per-dungeon tally for link_mode=tally objectives (e.g. small keys);
   *  null for normal single objectives. Rendered as ×N on the tile. */
  count: number | null;
}

interface Data {
  gameTitle: string;
  /** Current run-section label (e.g. "Prologue", "Endgame"). Null
   *  when the active objectives have no group/category set, in which
   *  case the panel renders without a section chip. */
  sectionLabel: string | null;
  rows: Row[];
  obtainedCount: number;
  total: number;
}

const tileStyle = (obtained: boolean): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  opacity: obtained ? 1 : 0.4,
  filter: obtained ? 'none' : 'grayscale(85%)',
  transition: 'opacity 0.2s ease, filter 0.2s ease',
});

function Panel({ data }: PanelProps<Data>) {
  return (
    <PanelRow tag="OBJECTIVES" arrow>
      <div style={{ flex: '1 1 0', minWidth: 0 }}>
        <MarqueeOnOverflow>
          <span className="ob-text-strong">{data.gameTitle}</span>
          {data.sectionLabel && (
            <span className="ob-text-muted">· {data.sectionLabel}</span>
          )}
          {data.rows.map(({ objective, obtained, count }) => (
            <span
              key={objective.id}
              style={tileStyle(count != null ? count > 0 : obtained)}
              title={objective.name}
            >
              {objective.image_url ? (
                <span className="ob-item-icon" aria-hidden>
                  <img src={objective.image_url} alt="" />
                </span>
              ) : (
                <span className="ob-text-strong">{objective.name}</span>
              )}
              {count != null && <span className="ob-text-strong">×{count}</span>}
            </span>
          ))}
          <span className="ob-text-muted">
            {data.obtainedCount} / {data.total} done
          </span>
        </MarqueeOnOverflow>
      </div>
    </PanelRow>
  );
}

registerPanel<Data>({
  id: 'objective-checklist',
  component: Panel,
  selectData: (feed) => {
    const entry = feed.currentlyPlaying?.schedule_entry_detail;
    if (!entry || !entry.game) return null;
    const all = entry.game.objectives ?? [];
    if (all.length === 0) return null;
    const obtained = new Set(entry.obtained_objective_ids);
    const skipped = new Set(entry.skipped_objective_ids);
    const counts = entry.objective_counts ?? {};
    const isTally = (o: GameObjective) => o.link_mode === 'tally';
    // Drop skipped objectives; they're not in play this run.
    const active = all
      .filter((o) => !skipped.has(o.id))
      .slice()
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    if (active.length === 0) return null;
    // Group key: `group` is the primary section label; `category`
    // is the documented fallback when group is blank; '' (empty
    // string) groups all label-less objectives together so they at
    // least render as one cohort instead of one-per-tile.
    const groupKey = (o: GameObjective): string =>
      o.group?.trim() || o.category?.trim() || '';
    // Pick the section to show: the one containing the next
    // outstanding objective. Once that section is done the runner
    // has rolled into the next section automatically. If the whole
    // run is complete, fall back to the last section so the panel
    // still renders a 100%-green strip rather than disappearing.
    // Tally objectives (small keys) stay outstanding by nature, so they must
    // not anchor the "next section" — skip them when picking the target group.
    const nextUp = active.find((o) => !obtained.has(o.id) && !isTally(o));
    const targetGroup = nextUp ? groupKey(nextUp) : groupKey(active[active.length - 1]);
    const sectionObjectives = active.filter((o) => groupKey(o) === targetGroup);
    const rows = sectionObjectives.map((objective) => ({
      objective,
      obtained: obtained.has(objective.id),
      count: isTally(objective) ? counts[String(objective.id)] ?? 0 : null,
    }));
    // Tally objectives don't count toward the "N of M done" tally.
    const counted = sectionObjectives.filter((o) => !isTally(o));
    return {
      gameTitle: entry.display_title,
      sectionLabel: targetGroup || null,
      rows,
      obtainedCount: counted.filter((o) => obtained.has(o.id)).length,
      total: counted.length,
    };
  },
  minDurationMs: 7000,
});
