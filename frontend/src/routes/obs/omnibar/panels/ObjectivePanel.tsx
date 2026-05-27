import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';

/**
 * What the runner is trying to do RIGHT NOW. Operator-set free text on
 * the active ScheduleEntry.current_objective field. Returns null when
 * the field is blank so the panel drops out of rotation entirely
 * instead of parking on an empty "objective: …" card.
 */
interface Data {
  objective: string;
  gameTitle: string;
}

function Panel({ data }: PanelProps<Data>) {
  return (
    <PanelRow tag="OBJECTIVE" arrow>
      <span className="ob-text-strong">{data.objective}</span>
      <span className="ob-text-muted">in {data.gameTitle}</span>
    </PanelRow>
  );
}

registerPanel<Data>({
  id: 'objective',
  component: Panel,
  selectData: (feed) => {
    const entry = feed.currentlyPlaying?.schedule_entry_detail;
    if (!entry) return null;
    const objective = entry.current_objective?.trim();
    if (!objective) return null;
    return { objective, gameTitle: entry.display_title };
  },
  minDurationMs: 7000,
});
