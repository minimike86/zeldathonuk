import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { laneReducer, type LaneAction, type LaneState } from '../fsm/laneMachine';
import { getPanel } from '../panels/registry';
import type { OmnibarFeed } from '../hooks/useOmnibarFeed';
import type { OmnibarTransitions, PanelTransition } from '../hooks/useTransitionsConfig';

/**
 * A single lane in the omnibar. Holds its own LaneFSM + rotation timer.
 *
 * Rotation strategy: filter the configured panel ids down to those
 * whose `selectData` returns non-null + whose `enabledWhen` gate
 * passes. Tick on the lane's interval; index wraps modulo the live
 * list size so an incentive expiring mid-rotation gracefully
 * shortens the cycle instead of stalling on a blank.
 *
 * The takeover slot (rendered by `takeoverChild`) overrides the
 * rotation entirely — used for urgent overrides and event flashes.
 *
 * Transitions: rather than remount the panel synchronously when the
 * tick advances, the lane keeps TWO `.ob-slot` DOM positions side-by-
 * side. A transition runs in three phases:
 *
 *   1. EXIT — the just-departed panel sits in its old slot with
 *      `.is-leaving` + `data-exit="<dir>"` while the directional
 *      exit CSS plays for the panel's configured `exitMs`. The
 *      other slot is empty.
 *   2. DELAY — the leaving slot has been unmounted; both slots are
 *      empty for the new panel's configured `delayMs`.
 *   3. ENTER — the new panel mounts in the other slot with its
 *      configured `data-enter="<dir>"` and runs the enter CSS for
 *      `enterMs`.
 *
 * Per-panel direction + durations + delay come from `transitions`
 * (see useTransitionsConfig). The slot wrapper carries:
 *   data-enter / data-exit — directional keyframe selector
 *   --ob-slot-enter-ms / --ob-slot-exit-ms — duration CSS vars
 *
 * Force-finish on rapid re-tick: if a new transition fires mid-EXIT
 * or mid-DELAY, the in-flight timers are cancelled and the new
 * transition starts from whatever's currently on screen (the
 * outgoing panel cuts short rather than ghosting through a second
 * transition).
 */
export interface LaneConfig {
  id: 'top' | 'bottom';
  mode: 'rotating' | 'pinned';
  panels: string[];
}

interface Props {
  config: LaneConfig;
  feed: OmnibarFeed;
  transitions: OmnibarTransitions;
  suspended?: boolean;
  takeoverChild?: ReactNode;
}

// Small grace period past the configured exit duration before
// unmounting the leaving slot — keeps the very last frame of the
// CSS animation on screen rather than clipping it mid-decay.
const EXIT_UNMOUNT_BUFFER_MS = 40;

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

function transitionFor(
  ident: ActiveIdent,
  t: OmnibarTransitions,
): PanelTransition {
  if (ident.kind === 'rotating' || ident.kind === 'pinned') {
    return t.forPanel(ident.panelId);
  }
  // Takeovers + empty fall back to the lane's default transition.
  return t.default;
}

export function Lane({ config, feed, transitions, suspended, takeoverChild }: Props) {
  const panelsKey = config.panels.join('|');

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

  const [state, dispatchRaw] = useReducer(
    (s: LaneState, a: LaneAction) => laneReducer(s, a, { rotationLength: live.length }),
    initial,
  );
  const dispatch = dispatchRaw;

  useEffect(() => {
    if (suspended) dispatch({ type: 'SUSPEND' });
    else dispatch({ type: 'RESUME', mode: config.mode, panelId: config.panels[0] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suspended, config.mode, panelsKey]);

  // Rotation cadence is no longer fixed at the lane level — there's
  // no `setInterval` here. Instead a `dwellTimer` effect further
  // below schedules the next TICK based on the currently-active
  // panel's own enter + dwell durations, so each panel controls how
  // long it sits on-screen.

  // The lane's currently-targeted identity (computed fresh each render
  // from FSM state + props). The transition effect commits this to
  // `activeIdent` state.
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

  // Committed state.
  const [activeIdent, setActiveIdent] = useState<ActiveIdent>({ kind: 'empty' });
  const [activeSlot, setActiveSlot] = useState<'a' | 'b'>('a');
  const [leavingIdent, setLeavingIdent] = useState<
    { slot: 'a' | 'b'; ident: ActiveIdent } | null
  >(null);

  const exitTimerRef = useRef<number | null>(null);
  const enterTimerRef = useRef<number | null>(null);
  const dwellTimerRef = useRef<number | null>(null);
  const activeSlotRef = useRef(activeSlot);
  const activeIdentRef = useRef(activeIdent);
  const targetRef = useRef(target);
  const transitionsRef = useRef(transitions);
  activeSlotRef.current = activeSlot;
  activeIdentRef.current = activeIdent;
  targetRef.current = target;
  transitionsRef.current = transitions;

  const targetKey = identKey(target);

  // Transition detector. Fires when the target ident's key changes.
  useEffect(() => {
    const currentActive = activeIdentRef.current;
    const targetCaptured = targetRef.current;
    const t = transitionsRef.current;

    if (identKey(targetCaptured) === identKey(currentActive)) return;

    // Force-finish any in-flight timers from a prior transition.
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    if (enterTimerRef.current !== null) {
      window.clearTimeout(enterTimerRef.current);
      enterTimerRef.current = null;
    }

    const departing = currentActive;
    const departingSlot = activeSlotRef.current;

    // Case A: nothing currently active (cold mount, post-empty, or
    // we're in the middle of a prior transition's delay phase where
    // the active slot was emptied). Jump straight into the enter.
    if (departing.kind === 'empty') {
      setLeavingIdent(null);
      setActiveIdent(targetCaptured);
      return;
    }

    const exitCfg = transitionFor(departing, t);
    const enterCfg = transitionFor(targetCaptured, t);

    // 1) Snapshot the departing into the leaving slot. The active
    //    slot is emptied — the new content lands AFTER exit + delay.
    setLeavingIdent({ slot: departingSlot, ident: departing });
    setActiveSlot(departingSlot === 'a' ? 'b' : 'a');
    setActiveIdent({ kind: 'empty' });

    // 2) Unmount the leaving slot once its exit animation completes.
    //    Exit ordering: body retreats first (bodyExitMs), then
    //    bodyExitDelayMs gap, then the tag retreats (tagExitMs).
    //    Slot must stay mounted until the tag's exit lands.
    const fullExitMs =
      exitCfg.bodyExitMs + exitCfg.bodyExitDelayMs + exitCfg.tagExitMs;
    const exitWindow = fullExitMs + EXIT_UNMOUNT_BUFFER_MS;
    const xT = window.setTimeout(() => {
      if (exitTimerRef.current !== xT) return;
      exitTimerRef.current = null;
      setLeavingIdent(null);
    }, exitWindow);
    exitTimerRef.current = xT;

    // 3) Mount the new active after the FULL exit (tag + body) plus
    //    the incoming panel's lead-in.
    const enterAt = fullExitMs + enterCfg.leadInMs;
    const nT = window.setTimeout(() => {
      if (enterTimerRef.current !== nT) return;
      enterTimerRef.current = null;
      setActiveIdent(targetCaptured);
    }, enterAt);
    enterTimerRef.current = nT;
  }, [targetKey]);

  // Dwell timer — schedules the next TICK once the active panel has
  // fully entered and held for its configured `dwellMs`.
  //
  // CRITICAL: this effect's deps must be primitive values, not the
  // `transitions` object. The active event polls every 10s and each
  // poll produces a fresh `omnibar_transitions` reference, which
  // makes `transitions` a new object even when nothing changed.
  // If `transitions` is in the deps, the effect re-runs on every
  // poll → cancels the pending TICK timer → schedules a fresh one →
  // and if polls fire faster than `dwellWindowMs`, the timer NEVER
  // fires and the lane gets stuck on its current panel. Reduce the
  // dependency to the computed number so re-renders with identical
  // config don't restart the clock.
  const activeCfg =
    activeIdent.kind === 'rotating'
      ? transitionFor(activeIdent, transitions)
      : null;
  const dwellWindowMs = activeCfg
    ? activeCfg.tagEnterMs +
      activeCfg.bodyEnterDelayMs +
      activeCfg.bodyEnterMs +
      activeCfg.dwellMs
    : 0;

  useEffect(() => {
    if (dwellTimerRef.current !== null) {
      window.clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
    if (suspended || takeoverChild) return;
    if (activeIdent.kind !== 'rotating') return;
    if (live.length <= 1) return;
    if (dwellWindowMs <= 0) return;

    const t = window.setTimeout(() => {
      if (dwellTimerRef.current !== t) return;
      dwellTimerRef.current = null;
      dispatch({ type: 'TICK' });
    }, dwellWindowMs);
    dwellTimerRef.current = t;
    return () => {
      if (dwellTimerRef.current === t) {
        window.clearTimeout(t);
        dwellTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdent, suspended, takeoverChild, live.length, dwellWindowMs]);

  // Cleanup pending timers on unmount.
  useEffect(() => {
    return () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      if (enterTimerRef.current !== null) {
        window.clearTimeout(enterTimerRef.current);
        enterTimerRef.current = null;
      }
      if (dwellTimerRef.current !== null) {
        window.clearTimeout(dwellTimerRef.current);
        dwellTimerRef.current = null;
      }
    };
  }, []);

  // Resolve an ident to JSX using CURRENT props. For panel idents
  // (rotating/pinned) this re-looks up `live` each render, so a
  // panel whose data updates per-second (LocalTimePanel) refreshes
  // smoothly even while it's the leaving slot. For takeover idents
  // the element is carried by the ident itself.
  const renderIdent = (ident: ActiveIdent): ReactNode => {
    if (ident.kind === 'empty') return null;
    if (ident.kind === 'takeover') return ident.element;
    const found = live.find((s) => s.id === ident.panelId);
    if (!found) return null;
    return <found.desc.component data={found.data} />;
  };

  const renderSlot = (which: 'a' | 'b') => {
    const isLive = activeSlot === which && activeIdent.kind !== 'empty';
    const leavingHere =
      !isLive && leavingIdent && leavingIdent.slot === which
        ? leavingIdent
        : null;
    const ident: ActiveIdent | null = isLive
      ? activeIdent
      : leavingHere
        ? leavingHere.ident
        : null;
    const node = ident ? renderIdent(ident) : null;

    // Pull the relevant transition config so the slot wrapper can
    // carry its direction + duration as DOM attributes / CSS vars.
    // Tag and body have independent directions, hence four data
    // attributes instead of one each for enter/exit.
    let dataTagEnter: string | undefined;
    let dataBodyEnter: string | undefined;
    let dataTagExit: string | undefined;
    let dataBodyExit: string | undefined;
    const style: CSSProperties = {};
    if (isLive) {
      const cfg = transitionFor(activeIdent, transitions);
      dataTagEnter = cfg.tagEnter;
      dataBodyEnter = cfg.bodyEnter;
      style['--ob-tag-enter-ms' as keyof CSSProperties] = `${cfg.tagEnterMs}ms` as never;
      style['--ob-body-enter-ms' as keyof CSSProperties] = `${cfg.bodyEnterMs}ms` as never;
      style['--ob-body-enter-delay-ms' as keyof CSSProperties] =
        `${cfg.bodyEnterDelayMs}ms` as never;
    }
    if (leavingHere) {
      const cfg = transitionFor(leavingHere.ident, transitions);
      dataTagExit = cfg.tagExit;
      dataBodyExit = cfg.bodyExit;
      style['--ob-tag-exit-ms' as keyof CSSProperties] = `${cfg.tagExitMs}ms` as never;
      style['--ob-body-exit-ms' as keyof CSSProperties] = `${cfg.bodyExitMs}ms` as never;
      style['--ob-body-exit-delay-ms' as keyof CSSProperties] =
        `${cfg.bodyExitDelayMs}ms` as never;
    }

    const cls =
      'ob-slot' +
      (leavingHere ? ' is-leaving' : '') +
      (!node ? ' is-empty' : '');
    return (
      <div
        className={cls}
        data-tag-enter={dataTagEnter}
        data-body-enter={dataBodyEnter}
        data-tag-exit={dataTagExit}
        data-body-exit={dataBodyExit}
        style={style}
      >
        {node}
      </div>
    );
  };

  return (
    <div className={`ob-lane ob-lane--${config.id}${suspended ? ' is-suspended' : ''}`}>
      {renderSlot('a')}
      {renderSlot('b')}
    </div>
  );
}
