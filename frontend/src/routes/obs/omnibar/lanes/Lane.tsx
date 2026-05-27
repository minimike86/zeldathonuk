import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
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
 *
 * Transitions: rather than remount the panel synchronously when the
 * tick advances, the lane keeps TWO `.ob-slot` DOM positions side-by-
 * side. At any moment one slot is "active" (renders the currently-
 * targeted panel, resolving fresh data from `live` / `takeoverChild`
 * on every render so per-second updates like LocalTimePanel keep
 * flowing) and the other is either empty or holds the just-departed
 * panel with `.is-leaving` for `SLOT_EXIT_MS` while CSS plays the
 * exit animation (tag slide-out + body fade-up).
 *
 * Storing only the panel *identity* in state (not a captured JSX
 * element) preserves data freshness for the leaving slot too — the
 * lookup goes through current `live` on every render. For takeovers
 * the JSX element IS captured in the ident, because once a takeover
 * dismisses its `takeoverChild` prop is gone and there's nothing to
 * resolve against.
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

// Outgoing-slot hold time. Slightly longer than the longest exit
// animation (tag/body slide-out-right @ 480ms in omnibar.css) so
// the slot isn't unmounted mid-transition.
const SLOT_EXIT_MS = 520;

type ActiveIdent =
  | { kind: 'rotating'; panelId: string; rotKey: string }
  | { kind: 'pinned'; panelId: string }
  | { kind: 'takeover'; takeoverKey: string; element: ReactNode }
  | { kind: 'empty' };

function identKey(i: ActiveIdent): string {
  switch (i.kind) {
    case 'empty':
      return 'empty';
    case 'rotating':
      return `rot:${i.rotKey}`;
    case 'pinned':
      return `pin:${i.panelId}`;
    case 'takeover':
      return `takeover:${i.takeoverKey}`;
  }
}

export function Lane({ config, feed, suspended, takeoverChild }: Props) {
  // Content-based key for the panels array. The active-event poll
  // returns a fresh JSON object every 15s, which cascades to a fresh
  // `config.panels` array reference even when the operator hasn't
  // changed anything. Hashing the panel ids into a string lets us
  // depend on CONTENT, so the effects below don't re-fire (and
  // dispatch state-resetting actions) on every poll.
  const panelsKey = config.panels.join('|');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelsKey, feed]);

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

  // Apply external suspend/resume from the parent. Deps are
  // content-based so an event poll that produces a fresh-but-
  // equivalent layout JSON doesn't dispatch RESUME and reset the
  // rotation. (The reducer also no-ops RESUME when already rotating
  // — belt-and-braces — see laneMachine.ts.)
  useEffect(() => {
    if (suspended) dispatch({ type: 'SUSPEND' });
    else dispatch({ type: 'RESUME', mode: config.mode, panelId: config.panels[0] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suspended, config.mode, panelsKey]);

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

  // The lane's currently-targeted identity (computed fresh each render
  // from FSM state + props). The `useEffect` below commits this to
  // `activeIdent` state when it differs, kicking off a transition.
  const target = useMemo<ActiveIdent>(() => {
    if (takeoverChild) {
      const tkey = (takeoverChild as ReactElement | null)?.key;
      return {
        kind: 'takeover',
        takeoverKey: String(tkey ?? 'fixed'),
        element: takeoverChild,
      };
    }
    if (state.kind === 'suspended') return { kind: 'empty' };
    if (live.length === 0) return { kind: 'empty' };
    if (state.kind === 'pinned') {
      const slot = live.find((s) => s.id === state.panelId) ?? live[0];
      return { kind: 'pinned', panelId: slot.id };
    }
    if (state.kind === 'rotating') {
      const slot = live[state.index % live.length];
      return {
        kind: 'rotating',
        panelId: slot.id,
        rotKey: `${state.index}:${slot.id}`,
      };
    }
    return { kind: 'empty' };
  }, [takeoverChild, state, live]);

  // Committed state. `activeIdent` lags one effect behind `target`;
  // when target changes the effect snapshots the previously-active
  // ident as `leavingIdent` and flips `activeSlot` so the new panel
  // mounts in the OTHER `.ob-slot` div (running its entrance
  // animation) while the prior one stays in place with `.is-leaving`
  // running the exit.
  const [activeIdent, setActiveIdent] = useState<ActiveIdent>({ kind: 'empty' });
  const [activeSlot, setActiveSlot] = useState<'a' | 'b'>('a');
  const [leavingIdent, setLeavingIdent] = useState<
    { slot: 'a' | 'b'; ident: ActiveIdent } | null
  >(null);

  const leavingTimerRef = useRef<number | null>(null);
  const activeSlotRef = useRef(activeSlot);
  const activeIdentRef = useRef(activeIdent);
  activeSlotRef.current = activeSlot;
  activeIdentRef.current = activeIdent;

  const targetKey = identKey(target);

  // Transition detector. Fires when the *key* of the target ident
  // changes. Comparing keys rather than ident references means a
  // fresh React element passed via `takeoverChild` each render with
  // the same key won't trigger a spurious transition.
  useEffect(() => {
    const currentActive = activeIdentRef.current;
    if (targetKey === identKey(currentActive)) return;

    // Force-finish any prior in-flight exit before starting a new
    // transition. Without this, a rapid back-to-back transition
    // (e.g. two donations within 400ms) would leave `.is-leaving`
    // applied to a slot whose role is about to flip again.
    if (leavingTimerRef.current !== null) {
      window.clearTimeout(leavingTimerRef.current);
      leavingTimerRef.current = null;
    }

    const departingIdent = currentActive;
    const departingSlot = activeSlotRef.current;

    // Coming back from empty (or first mount) — no exit needed.
    // Land the new content in the current active slot so its
    // entrance animation plays in place.
    if (departingIdent.kind === 'empty') {
      setLeavingIdent(null);
      setActiveIdent(target);
      return;
    }

    setLeavingIdent({ slot: departingSlot, ident: departingIdent });
    setActiveSlot(departingSlot === 'a' ? 'b' : 'a');
    setActiveIdent(target);

    const t = window.setTimeout(() => {
      // Only clear if we're still the active timer — a subsequent
      // transition may have cleared us via the force-finish path
      // above.
      if (leavingTimerRef.current !== t) return;
      leavingTimerRef.current = null;
      setLeavingIdent(null);
    }, SLOT_EXIT_MS);
    leavingTimerRef.current = t;
    // `target` is read but only its identity key drives transitions;
    // when the key is unchanged the closure'd target object's other
    // fields (e.g. updated `live` lookup for a same-panel re-entry)
    // are already covered by the per-render renderIdent resolve.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey]);

  // Cleanup any pending exit timer on unmount so we don't write to
  // state after the component is gone.
  useEffect(() => {
    return () => {
      if (leavingTimerRef.current !== null) {
        window.clearTimeout(leavingTimerRef.current);
        leavingTimerRef.current = null;
      }
    };
  }, []);

  // Resolve an ident to JSX using CURRENT props. For panel idents
  // (rotating/pinned) this re-looks up `live` each render, so a
  // panel whose data updates per-second (LocalTimePanel) refreshes
  // smoothly even while it's the leaving slot. For takeover idents
  // the element is carried by the ident itself, because once the
  // takeover dismisses there's no `takeoverChild` prop left to
  // resolve against.
  const renderIdent = (ident: ActiveIdent): ReactNode => {
    if (ident.kind === 'empty') return null;
    if (ident.kind === 'takeover') return ident.element;
    const found = live.find((s) => s.id === ident.panelId);
    if (!found) return null;
    return <found.desc.component data={found.data} />;
  };

  const renderSlot = (which: 'a' | 'b') => {
    const isLive = activeSlot === which;
    const leavingHere = !isLive && leavingIdent && leavingIdent.slot === which
      ? leavingIdent
      : null;
    const ident: ActiveIdent | null = isLive
      ? activeIdent
      : leavingHere
        ? leavingHere.ident
        : null;
    const node = ident ? renderIdent(ident) : null;
    const cls =
      'ob-slot' +
      (leavingHere ? ' is-leaving' : '') +
      (!node ? ' is-empty' : '');
    return <div className={cls}>{node}</div>;
  };

  return (
    <div className={`ob-lane ob-lane--${config.id}${suspended ? ' is-suspended' : ''}`}>
      {renderSlot('a')}
      {renderSlot('b')}
    </div>
  );
}
