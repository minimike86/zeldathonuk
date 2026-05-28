import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';
import type { Raffle } from '@/lib/obsApi';

interface Data {
  raffle: Raffle;
  symbol: string;
}

function Panel({ data }: PanelProps<Data>) {
  const r = data.raffle;
  return (
    <PanelRow tag="RAFFLE">
      <span className="ob-text-strong">{r.name}</span>
      <span className="ob-text-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {r.entrant_count} {r.entrant_count === 1 ? 'entry' : 'entries'} · donate to enter
      </span>
    </PanelRow>
  );
}

registerPanel<Data>({
  id: 'raffle',
  component: Panel,
  selectData: (feed) => {
    // Only surface raffles whose entry window is currently open. Prefer one
    // bound to the active playthrough's schedule entry (a "while this game is
    // playing" raffle), else the first open one by order.
    const active = feed.currentlyPlaying?.schedule_entry_detail;
    const open = feed.raffles
      .filter((r) => r.is_active && r.is_open && r.status !== 'drawn')
      .sort((a, b) => a.order - b.order);
    const scoped = active
      ? open.find((r) => r.schedule_entry === active.id)
      : null;
    const pick = scoped ?? open[0];
    if (!pick) return null;
    return { raffle: pick, symbol: feed.event?.currency_symbol ?? '£' };
  },
  minDurationMs: 6500,
});
