import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';
import type { ScheduleEntry } from '@/lib/obsApi';

interface Data {
  next: ScheduleEntry;
}

function Panel({ data }: PanelProps<Data>) {
  const { next } = data;
  const runners = next.runners.map((r) => r.name).join(', ');
  return (
    <PanelRow tag="UP NEXT" arrow>
      <span className="ob-text-strong">{next.display_title}</span>
      {next.game && (
        <span className="ob-meta-chip">
          {next.game.platform}
          {next.game.release_year ? ` · ${next.game.release_year}` : ''}
        </span>
      )}
      {runners && <span className="ob-text-muted">with {runners}</span>}
    </PanelRow>
  );
}

registerPanel<Data>({
  id: 'schedule-next',
  component: Panel,
  selectData: (feed) => {
    const current = feed.currentlyPlaying?.schedule_entry_detail ?? null;
    const upcoming = feed.schedule
      .filter(
        (s) =>
          s.parent_entry == null &&
          s.slot_type === 'game' &&
          !s.is_completed,
      )
      .sort((a, b) => a.order - b.order);
    const next = current
      ? upcoming.find((s) => s.order > current.order) ?? null
      : upcoming[0] ?? null;
    return next ? { next } : null;
  },
  minDurationMs: 5500,
});
