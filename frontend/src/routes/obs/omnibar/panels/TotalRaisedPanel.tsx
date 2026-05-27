import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';

interface Data {
  total: number;
  symbol: string;
  count: number;
}

function Panel({ data }: PanelProps<Data>) {
  return (
    <PanelRow tag="RAISED">
      <span className="ob-text-strong">
        {data.symbol}
        {formatMoney(data.total)}
      </span>
      <span className="ob-text-muted">from {data.count} donations</span>
    </PanelRow>
  );
}

function formatMoney(n: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

registerPanel<Data>({
  id: 'total-raised',
  component: Panel,
  selectData: (feed) => {
    if (!feed.totals) return null;
    return {
      total: Number(feed.totals.grand_total) || 0,
      symbol: feed.event?.currency_symbol ?? '£',
      count: feed.totals.donation_count,
    };
  },
  minDurationMs: 6000,
});
