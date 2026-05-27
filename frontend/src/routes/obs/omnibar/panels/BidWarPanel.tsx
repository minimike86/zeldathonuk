import { useEffect, useState } from 'react';
import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';
import type { Incentive } from '@/lib/obsApi';

/**
 * Multi-option voting panel — distinct from IncentivesPanel which
 * shows a single-goal progress bar. Render as a slim horizontal stack
 * of option bars, leading option highlighted. Cycles through showing
 * each option's name briefly in the header tag.
 *
 * Incentive payload shape consumed:
 *   { "options": [{ "id": "a", "name": "Option A", "votes": 12.5,
 *                   "image_url"?: "..." }, ...] }
 */
interface BidWarOption {
  id: string;
  name: string;
  votes: number;
  image_url?: string;
}

interface Data {
  incentive: Incentive;
  options: BidWarOption[];
  total: number;
  leadingIdx: number;
  symbol: string;
}

function Panel({ data }: PanelProps<Data>) {
  // Cycle the header tag through option names so each one gets a moment
  // even when the rotation slot's `minDurationMs` is short.
  const [idx, setIdx] = useState(data.leadingIdx);
  useEffect(() => {
    if (data.options.length <= 1) return;
    const id = window.setInterval(
      () => setIdx((i) => (i + 1) % data.options.length),
      2200,
    );
    return () => window.clearInterval(id);
  }, [data.options.length]);
  const featured = data.options[idx] ?? data.options[0];
  return (
    <PanelRow tag="BID WAR" arrow flash>
      <span className="ob-text-strong">{data.incentive.name}</span>
      <span className="ob-text-muted">{featured.name}</span>
      <div className="ob-bidwar-bars" aria-hidden>
        {data.options.map((o, i) => {
          const pct = data.total > 0 ? (o.votes / data.total) * 100 : 0;
          return (
            <span
              key={o.id}
              className={`ob-bidwar-bar${i === data.leadingIdx ? ' is-leading' : ''}`}
              data-name={o.name}
              style={{ ['--pct' as string]: `${pct}%` } as React.CSSProperties}
            >
              <span className="ob-bidwar-bar-label">{o.name}</span>
              <span className="ob-bidwar-bar-amount" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {data.symbol}
                {o.votes.toFixed(2)}
              </span>
            </span>
          );
        })}
      </div>
    </PanelRow>
  );
}

registerPanel<Data>({
  id: 'bid-war',
  component: Panel,
  selectData: (feed) => {
    // First active incentive whose payload describes a bid war.
    const candidate = feed.incentives.find((i) => {
      if (!i.is_active || i.is_reached) return false;
      const opts = (i.payload as { options?: unknown }).options;
      return Array.isArray(opts) && opts.length >= 2;
    });
    if (!candidate) return null;
    const opts = ((candidate.payload as { options: unknown[] }).options ?? []) as Partial<BidWarOption>[];
    const options: BidWarOption[] = opts
      .filter((o): o is BidWarOption => !!o && typeof o.id === 'string' && typeof o.name === 'string')
      .map((o) => ({
        id: o.id,
        name: o.name,
        votes: typeof o.votes === 'number' ? o.votes : Number(o.votes) || 0,
        image_url: o.image_url,
      }));
    if (options.length < 2) return null;
    const total = options.reduce((sum, o) => sum + o.votes, 0);
    let leadingIdx = 0;
    for (let i = 1; i < options.length; i++) {
      if (options[i].votes > options[leadingIdx].votes) leadingIdx = i;
    }
    return {
      incentive: candidate,
      options,
      total,
      leadingIdx,
      symbol: feed.event?.currency_symbol ?? '£',
    };
  },
  minDurationMs: 9000,
});
