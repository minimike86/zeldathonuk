import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';
import type { ScheduleEntry } from '@/lib/obsApi';

interface Data {
  next: ScheduleEntry;
  /** Tag-pill label, contextualised by the next entry's position in
   *  the schedule. See `selectData` for the rules. */
  tag: string;
}

function Panel({ data }: PanelProps<Data>) {
  const { next, tag } = data;
  const runners = next.runners.map((r) => r.name).join(', ');
  return (
    <PanelRow tag={tag} arrow>
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

    // All top-level entries (sub-entries excluded via parent_entry),
    // ordered as they'll play.
    const allEntries = feed.schedule
      .filter((s) => s.parent_entry == null)
      .sort((a, b) => a.order - b.order);

    // Games specifically — both the full list (for "is last?" checks
    // by order) and just the upcoming non-completed ones (for the
    // "next to play" selection).
    const allGames = allEntries.filter((s) => s.slot_type === 'game');
    const upcomingGames = allGames.filter((s) => !s.is_completed);

    // BIG FINALE: currently playing the last game, and the next
    // entry overall is a stream-ending slot ('end'). Surface the end
    // entry itself as the "next" with a finale-flavoured tag.
    if (current && current.slot_type === 'game' && allGames.length > 0) {
      const lastGame = allGames[allGames.length - 1];
      if (lastGame.id === current.id) {
        const nextEntry = allEntries.find((s) => s.order > current.order) ?? null;
        if (nextEntry && nextEntry.slot_type === 'end') {
          return { next: nextEntry, tag: 'BIG FINALE' };
        }
      }
    }

    // Otherwise pick the next game.
    const next = current
      ? upcomingGames.find((s) => s.order > current.order) ?? null
      : upcomingGames[0] ?? null;
    if (!next) return null;

    // Contextual tag for the next game:
    //   UP FIRST       — nothing is playing yet AND this is the first
    //                    game in the whole schedule.
    //   BEST FOR LAST  — this is the final game in the schedule.
    //   UP NEXT        — anywhere else in the middle.
    let tag = 'UP NEXT';
    if (!current && allGames[0]?.id === next.id) {
      tag = 'UP FIRST';
    } else if (allGames[allGames.length - 1]?.id === next.id) {
      tag = 'BEST FOR LAST';
    }

    return { next, tag };
  },
  minDurationMs: 5500,
});
