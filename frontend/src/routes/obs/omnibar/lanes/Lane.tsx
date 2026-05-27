import { useEffect, useMemo, useReducer } from 'react';
import type { ReactNode } from 'react';
import { laneReducer, type LaneAction, type LaneState } from '../fsm/laneMachine';
import { getPanel } from '../panels/registry';
import type { OmnibarFeed } from '../hooks/useOmnibarFeed';

/**
 * A single lane in the omnibar. Holds its own LaneFSM + rotation timer.
 *
 * Rotation strategy: filter the configured panel ids down to those
 * whose `selectData` returns non-null (i.e. they have something to
 * show right now) + whose `enabledWhen` gate, if present, passes.
 * Tick on the lane's interval; index wraps modulo the live list size
 * so an incentive expiring mid-rotation gracefully shortens the
 * cycle instead of stalling on a blank.
 *
 * The takeover slot (rendered by `takeoverChild`) overrides the
 * rotation entirely — used for urgent overrides and event flashes.
 */
export interface LaneConfig {
  id: 'top' | 'bottom';
  mode: 'rotating' | 'pinned';
  intervalMs: number;
  panels: string[];
}

interface Props {
  config: LaneConfig;
  feed: OmnibarFeed;
  suspended?: boolean;
  takeoverChild?: ReactNode;
}

export function Lane({ config, feed, suspended, takeoverChild }: Props) {
  // Resolve which panels are actually showable on this tick.
  const live = useMemo(() => {
    return config.panels
      .map((id) => {
        const desc = getPanel(id);
        if (!desc) return null;
        if (desc.enabledWhen && !desc.enabledWhen(feed)) return null;
        const data = desc.selectData(feed);
        if (data == null) return null;
        return { id, desc, data };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [config.panels, feed]);

  const initial: LaneState =
    config.mode === 'pinned'
      ? { kind: 'pinned', panelId: config.panels[0] ?? '' }
      : { kind: 'rotating', index: 0 };

  // Reducer wrapper that captures the current rotation length.
  const [state, dispatchRaw] = useReducer(
    (s: LaneState, a: LaneAction) => laneReducer(s, a, { rotationLength: live.length }),
    initial,
  );
  const dispatch = dispatchRaw;

  // Apply external suspend/resume from the parent.
  useEffect(() => {
    if (suspended) dispatch({ type: 'SUSPEND' });
    else dispatch({ type: 'RESUME', mode: config.mode, panelId: config.panels[0] });
  }, [suspended, config.mode, config.panels]);

  // Rotation timer. Only ticks when rotating + not suspended + we have
  // more than one live panel to choose from.
  useEffect(() => {
    if (suspended || takeoverChild) return;
    if (state.kind !== 'rotating') return;
    if (live.length <= 1) return;
    const id = window.setInterval(
      () => dispatch({ type: 'TICK' }),
      config.intervalMs,
    );
    return () => window.clearInterval(id);
  }, [suspended, takeoverChild, state.kind, live.length, config.intervalMs]);

  // Pick the currently-visible panel.
  const renderContent = () => {
    if (takeoverChild) return takeoverChild;
    if (state.kind === 'suspended') return null;
    if (live.length === 0) return null;
    if (state.kind === 'pinned') {
      const slot = live.find((s) => s.id === state.panelId) ?? live[0];
      return <slot.desc.component data={slot.data} />;
    }
    if (state.kind === 'rotating') {
      const slot = live[state.index % live.length];
      return <slot.desc.component data={slot.data} />;
    }
    return null;
  };

  const slotKey = takeoverChild
    ? 'takeover'
    : state.kind === 'rotating'
      ? `${state.index}:${live[state.index % Math.max(1, live.length)]?.id ?? 'empty'}`
      : state.kind === 'pinned'
        ? `pin:${state.panelId}`
        : 'empty';

  return (
    <div className={`ob-lane ob-lane--${config.id}${suspended ? ' is-suspended' : ''}`}>
      <div key={slotKey} className="ob-slot">
        {renderContent()}
      </div>
    </div>
  );
}
