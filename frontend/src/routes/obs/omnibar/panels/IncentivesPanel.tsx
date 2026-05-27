import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';
import type { Incentive } from '@/lib/obsApi';

interface Data {
  incentive: Incentive;
  symbol: string;
}

function Panel({ data }: PanelProps<Data>) {
  const i = data.incentive;
  const pct = Math.min(100, i.progress_pct);
  return (
    <PanelRow tag="INCENTIVE">
      <span className="ob-text-strong">{i.name}</span>
      <span
        className="ob-incentive-bar"
        aria-hidden
        style={
          {
            // CSS reads --pct to render the progress fill width.
            ['--pct' as string]: `${pct}%`,
          } as React.CSSProperties
        }
      />
      <span className="ob-text-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {data.symbol}
        {i.current_amount} / {data.symbol}
        {i.goal_amount}
      </span>
    </PanelRow>
  );
}

registerPanel<Data>({
  id: 'incentives',
  component: Panel,
  selectData: (feed) => {
    // Prefer one bound to the active playthrough; fall back to the
    // first active event-wide one. Returning null when nothing's set
    // hides the panel from rotation entirely.
    const active = feed.currentlyPlaying?.schedule_entry_detail;
    const sorted = feed.incentives
      .filter((i) => i.is_active && !i.is_reached)
      .sort((a, b) => a.order - b.order);
    const scoped = active
      ? sorted.find((i) => i.schedule_entry === active.id)
      : null;
    const pick = scoped ?? sorted[0];
    if (!pick) return null;
    return {
      incentive: pick,
      symbol: feed.event?.currency_symbol ?? '£',
    };
  },
  minDurationMs: 6500,
});
