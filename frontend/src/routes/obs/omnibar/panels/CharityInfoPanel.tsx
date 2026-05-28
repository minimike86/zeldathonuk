import { useEffect, useState } from 'react';
import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';

/**
 * Rotating SpecialEffect blurbs — context for why the donations matter.
 * Pulls from a short curated list; cycles internally so a single
 * rotation slot can show multiple lines over time.
 */
const BLURBS = [
  'SpecialEffect helps disabled gamers play to the very best of their abilities.',
  'Donations fund custom controllers for people who couldn\'t otherwise play.',
  'They build bespoke setups so disability doesn\'t mean the end of gaming.',
  '100% of donations to GameBlast go directly to SpecialEffect.',
  'Every pound raised helps level the playing field.',
];
const CYCLE_MS = 4500;

interface Data {
  blurb: string;
}

function Panel({ data }: PanelProps<Data>) {
  return (
    <PanelRow tag="BENEFITTING">
      <span className="ob-text-strong">SpecialEffect</span>
      <span className="ob-text-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.blurb}
      </span>
    </PanelRow>
  );
}

function CyclingPanel({ data }: PanelProps<Data>) {
  // Even though the descriptor's selectData always returns the same
  // first blurb, we cycle in-component so each rotation slot rotates
  // through more than one line.
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = window.setInterval(
      () => setIdx((i) => (i + 1) % BLURBS.length),
      CYCLE_MS,
    );
    return () => window.clearInterval(id);
  }, []);
  return <Panel data={{ blurb: BLURBS[idx] ?? data.blurb }} />;
}

registerPanel<Data>({
  id: 'charity-info',
  component: CyclingPanel,
  selectData: () => ({ blurb: BLURBS[0] }),
  minDurationMs: 9000, // longer to give the cycle room
});
