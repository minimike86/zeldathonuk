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

// SpecialEffect's wordmark used in place of the text headline so
// the charity is identified at a glance — viewers don't need to
// read "SpecialEffect" to recognise the brand. SVG so it scales
// crisply at any DPR.
const CHARITY_LOGO_URL = '/assets/img/specialeffect-logo.svg';
const CHARITY_LABEL = 'SpecialEffect';

function Panel({ data }: PanelProps<Data>) {
  return (
    <PanelRow tag="BENEFITTING">
      <img
        src={CHARITY_LOGO_URL}
        alt={CHARITY_LABEL}
        // Sized to the lane's body content height so the logo sits
        // alongside the blurb without overflowing the 48px half-lane.
        // `filter: drop-shadow` echoes the brand chevron + tag pill
        // styling so the logo doesn't look pasted-on.
        style={{
          height: '1.7rem',
          width: 'auto',
          display: 'inline-block',
          verticalAlign: 'middle',
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45))',
          flexShrink: 0,
        }}
      />
      <span
        className="ob-text-muted"
        style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
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
