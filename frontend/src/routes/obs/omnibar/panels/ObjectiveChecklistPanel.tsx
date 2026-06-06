import type { CSSProperties } from 'react';
import { GameChip } from './_shared/GameChip';
import { MarqueeOnOverflow } from './_shared/MarqueeOnOverflow';
import { SectionChip } from './_shared/SectionChip';
import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';
import type { GameObjective } from '@/lib/obsApi';
import { objectiveImageUrl, selectObjectiveSection } from '@/routes/obs/objectiveSection';

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
  /** Current game's box art (may be empty → chip shows a placeholder). */
  boxArtUrl: string;
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
      {/* Game identity + section label stay fixed at the left as cards;
        * only the tile strip scrolls when it overflows the rail. The
        * count sits outside the marquee, pinned hard-right. */}
      <GameChip title={data.gameTitle} boxArtUrl={data.boxArtUrl} />
      {data.sectionLabel && <SectionChip label={data.sectionLabel} />}
      <div style={{ flex: '1 1 0', minWidth: 0 }}>
        <MarqueeOnOverflow>
          {data.rows.map(({ objective, obtained, count }) => {
            const img = objectiveImageUrl(objective);
            return (
            <span
              key={objective.id}
              style={tileStyle(count != null ? count > 0 : obtained)}
              title={objective.name}
            >
              {img ? (
                <span className="ob-item-icon" aria-hidden>
                  <img src={img} alt="" />
                </span>
              ) : (
                <span className="ob-text-strong">{objective.name}</span>
              )}
              {count != null && <span className="ob-text-strong">×{count}</span>}
            </span>
            );
          })}
        </MarqueeOnOverflow>
      </div>
      <span className="ob-text-muted ob-items-count">
        {data.obtainedCount} / {data.total} done
      </span>
    </PanelRow>
  );
}

registerPanel<Data>({
  id: 'objective-checklist',
  component: Panel,
  selectData: (feed) => {
    const entry = feed.currentlyPlaying?.schedule_entry_detail;
    if (!entry || !entry.game) return null;
    // Section selection (group scoping + tally handling) is shared with the
    // layout objective-checklist so the two never drift — see objectiveSection.
    const section = selectObjectiveSection(entry);
    if (!section) return null;
    return {
      gameTitle: entry.display_title,
      boxArtUrl: entry.game.box_art_url,
      ...section,
    };
  },
  minDurationMs: 7000,
});
