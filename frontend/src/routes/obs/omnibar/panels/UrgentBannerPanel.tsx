import { WaveText } from '@/components/WaveText';
import { PanelRow } from './_shared/Row';
import type { PanelProps } from './registry';
import type { OmnibarOverride } from '@/lib/obsApi';

interface Data {
  override: OmnibarOverride;
}

/** Full-width takeover panel shown while OmnibarFSM is in `urgent`. */
export function UrgentBannerPanel({ data }: PanelProps<Data>) {
  const o = data.override;
  const message = String(o.payload?.message ?? humanizeKind(o.kind));
  return (
    <PanelRow tag={o.kind.toUpperCase()} arrow flash>
      <span className="ob-text-strong">
        <WaveText text={message} staggerMs={22} startDelayMs={520} />
      </span>
    </PanelRow>
  );
}

function humanizeKind(kind: string): string {
  return kind.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
}
