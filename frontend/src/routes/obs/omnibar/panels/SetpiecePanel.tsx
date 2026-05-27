import { useEffect, useState } from 'react';
import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';

/**
 * Shows the active setpiece (boss / shrine / dungeon / …) while the
 * playthrough's live sub-state is set. `imminent` reads as a build-up
 * tag ("COMING UP"); `active` reads as in-progress ("FIGHT"). Once
 * cleared, the omnibar fires a separate celebration (handled via the
 * PlaythroughEvent stream) and this panel drops out of rotation.
 */
interface Data {
  kind: string;
  name: string;
  stage: 'imminent' | 'active';
  startedAt: number | null;
}

function Panel({ data }: PanelProps<Data>) {
  const tag = tagFor(data.kind, data.stage);
  return (
    <PanelRow tag={tag} arrow flash={data.stage === 'active'}>
      <span className="ob-text-strong">{data.name || titleize(data.kind)}</span>
      {data.stage === 'active' && data.startedAt && (
        <ElapsedChip startedAt={data.startedAt} />
      )}
    </PanelRow>
  );
}

function ElapsedChip({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const s = Math.max(0, Math.floor((now - startedAt) / 1000));
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return (
    <span className="ob-meta-chip" style={{ fontVariantNumeric: 'tabular-nums' }}>
      {String(m).padStart(2, '0')}:{String(ss).padStart(2, '0')}
    </span>
  );
}

function tagFor(kind: string, stage: 'imminent' | 'active'): string {
  const k = kind.toUpperCase();
  if (stage === 'imminent') return `${k} COMING UP`;
  return `${k} IN PROGRESS`;
}

function titleize(s: string): string {
  return s.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

registerPanel<Data>({
  id: 'setpiece',
  component: Panel,
  selectData: (feed) => {
    const entry = feed.currentlyPlaying?.schedule_entry_detail;
    if (!entry) return null;
    const stage = entry.setpiece_stage;
    if (stage !== 'imminent' && stage !== 'active') return null;
    if (!entry.setpiece_kind) return null;
    return {
      kind: entry.setpiece_kind,
      name: entry.setpiece_name,
      stage,
      startedAt: entry.setpiece_started_at
        ? new Date(entry.setpiece_started_at).getTime()
        : null,
    };
  },
  minDurationMs: 6000,
});
