import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';
import type { Milestone } from '@/lib/obsApi';

/**
 * Shows the next un-reached milestone with a progress bar driven by
 * current total raised vs the threshold. Hidden when no milestones
 * exist OR every milestone has been reached.
 */
interface Data {
  milestone: Milestone;
  current: number;
  symbol: string;
  pct: number;
}

function Panel({ data }: PanelProps<Data>) {
  return (
    <PanelRow tag="NEXT MILESTONE">
      <span className="ob-text-strong">{data.milestone.name}</span>
      <span
        className="ob-incentive-bar"
        aria-hidden
        style={{ ['--pct' as string]: `${data.pct}%` } as React.CSSProperties}
      />
      <span className="ob-text-muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {data.symbol}
        {data.current.toFixed(2)} / {data.symbol}
        {data.milestone.threshold_amount}
      </span>
    </PanelRow>
  );
}

registerPanel<Data>({
  id: 'milestones',
  component: Panel,
  selectData: (feed) => {
    // Pick the lowest-threshold un-reached milestone — that's the one
    // the donor base is closest to hitting.
    const open = feed.milestones
      .filter((m) => !m.is_reached)
      .sort((a, b) => Number(a.threshold_amount) - Number(b.threshold_amount));
    const next = open[0];
    if (!next) return null;
    const current = Number(feed.totals?.grand_total ?? 0);
    const threshold = Number(next.threshold_amount);
    const pct = threshold > 0 ? Math.min(100, (current / threshold) * 100) : 0;
    return {
      milestone: next,
      current,
      symbol: feed.event?.currency_symbol ?? '£',
      pct,
    };
  },
  minDurationMs: 7000,
});
