import { GameChip } from './_shared/GameChip';
import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';

/**
 * Top-lane death tracker: deaths for the current game (beside its game
 * chip) plus a running event total summed across every schedule entry.
 * Counts are bumped from the Stream Deck via the timer-hotkey
 * death-inc/death-dec actions (an increment also fires the "KO" flash).
 * Hidden until an entry is currently-playing, like the current-game panel.
 */
interface Data {
  gameTitle: string;
  boxArtUrl: string;
  thisGame: number;
  eventTotal: number;
}

function Panel({ data }: PanelProps<Data>) {
  return (
    <PanelRow tag="DEATHS" arrow>
      <GameChip title={data.gameTitle} boxArtUrl={data.boxArtUrl} />
      <span className="ob-text-muted">this game</span>
      <span className="ob-text-strong">×{data.thisGame}</span>
      <span className="ob-text-muted">event total</span>
      <span className="ob-text-strong">×{data.eventTotal}</span>
    </PanelRow>
  );
}

registerPanel<Data>({
  id: 'death-count',
  component: Panel,
  selectData: (feed) => {
    const entry = feed.currentlyPlaying?.schedule_entry_detail;
    if (!entry || !entry.game) return null;
    // Event total includes the current game (schedule[] carries every entry).
    const eventTotal = feed.schedule.reduce((sum, e) => sum + (e.death_count ?? 0), 0);
    return {
      gameTitle: entry.display_title,
      boxArtUrl: entry.game.box_art_url,
      thisGame: entry.death_count,
      eventTotal,
    };
  },
  minDurationMs: 7000,
});
