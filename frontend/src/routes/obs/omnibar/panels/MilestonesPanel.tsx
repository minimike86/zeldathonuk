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
      <span
        className="ob-text-muted"
        // 8-bit pixel mono ("Press Start 2P") so the amount aligns
        // with the rest of the omnibar's HUD numerals (countdown +
        // local time). Dropped a touch in size and nudged down on
        // the baseline to match the surrounding Bungee copy — see
        // the same translate trick in PreStreamPanel / LocalTimePanel.
        style={{
          fontFamily: '"Press Start 2P", ui-monospace, monospace',
          fontSize: '0.78rem',
          letterSpacing: '0.04em',
          lineHeight: 1,
          display: 'inline-block',
          transform: 'translateY(0.15em)',
        }}
      >
        {data.symbol}
        {data.current.toFixed(2)}/{data.symbol}
        {data.milestone.threshold_amount}
      </span>
      {/* Donate call-to-action — sits at the tail of the row so the
        * milestone name + progress are read first; the URL is the
        * action the viewer should take once they've absorbed how
        * close the goal is. Non-interactive (the omnibar is a
        * broadcast layer); the viewer types the URL manually. */}
      <span className="ob-text-muted">·</span>
      <span className="ob-donate-cta">
        Make a donation at{' '}
        <span className="ob-donate-cta-url">zeldathon.co.uk/donate</span>
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
