import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';
import type { ScheduleEntry } from '@/lib/obsApi';

/** Top-lane status: current game + platform/year + runners. Plain text
 *  reveal — wave effect is reserved for attention-grabbing panels
 *  (donations, urgent overrides, event flashes). */
interface Data {
  entry: ScheduleEntry;
}

function Panel({ data }: PanelProps<Data>) {
  const { entry } = data;
  const game = entry.game;
  const runners = entry.runners.map((r) => r.name).join(', ');
  return (
    <PanelRow tag="NOW PLAYING" arrow>
      <span className="ob-text-strong">{entry.display_title}</span>
      {game && (
        <span className="ob-meta-chip">
          {game.platform}
          {game.release_year ? ` · ${game.release_year}` : ''}
        </span>
      )}
      {runners && <span className="ob-text-muted">with {runners}</span>}
    </PanelRow>
  );
}

registerPanel<Data>({
  id: 'current-game',
  component: Panel,
  selectData: (feed) => {
    const entry = feed.currentlyPlaying?.schedule_entry_detail;
    if (!entry) return null;
    return { entry };
  },
  minDurationMs: 8000,
});
