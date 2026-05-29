import type { CSSProperties } from 'react';
import { MarqueeOnOverflow } from './_shared/MarqueeOnOverflow';
import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';
import type { GameObjective } from '@/lib/obsApi';

/**
 * Live objectives checklist for the current game: the full per-game
 * objective library rendered as an icon strip — coloured when obtained,
 * greyed when still outstanding. Skipped objectives (operator marked "not
 * needed this run") are dropped entirely and excluded from the count.
 *
 * Reads `entry.game.objectives` + the entry's obtained/skipped id-sets from
 * the feed. Hidden when the game has no objectives. The game name + strip
 * scroll via MarqueeOnOverflow when they overflow the rail.
 */
interface Row {
  objective: GameObjective;
  obtained: boolean;
}

interface Data {
  gameTitle: string;
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
          {data.rows.map(({ objective, obtained }) => (
            <span key={objective.id} style={tileStyle(obtained)} title={objective.name}>
              {objective.image_url ? (
                <span className="ob-item-icon" aria-hidden>
                  <img src={objective.image_url} alt="" />
                </span>
              ) : (
                <span className="ob-text-strong">{objective.name}</span>
              )}
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
    // Drop skipped objectives; they're not in play this run.
    const active = all
      .filter((o) => !skipped.has(o.id))
      .slice()
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    if (active.length === 0) return null;
    const rows = active.map((objective) => ({
      objective,
      obtained: obtained.has(objective.id),
    }));
    return {
      gameTitle: entry.display_title,
      rows,
      obtainedCount: rows.filter((r) => r.obtained).length,
      total: active.length,
    };
  },
  minDurationMs: 7000,
});
