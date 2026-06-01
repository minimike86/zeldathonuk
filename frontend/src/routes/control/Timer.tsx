import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { GameObjective, ObjectiveStatus, ScheduleEntry } from '@/lib/obsApi';

/**
 * Playthrough timer — LiveSplit-style. Targets the schedule entry that's
 * currently set as "Currently Playing".
 *
 * The overall run clock sits above a list of *splits*: the per-game objectives
 * (GameObjective) chosen into this run's route. Hitting Split marks the active
 * objective obtained (which fires the omnibar pickup celebration + syncs the
 * OBS checklist) and advances to the next one, auto-setting the omnibar's
 * "current objective" text. Iteration 1 tracks only the overall completion
 * time — per-split timing is intentionally out of scope.
 */
export function TimerControl() {
  // Bumping `refreshKey` re-runs the poll immediately, so a timer action's
  // result shows the instant the request resolves instead of waiting out the
  // 1.5s interval (which made Start/Pause/Resume feel laggy).
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, 1500, [refreshKey]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Re-render every 500ms so the running clock advances (time is server-side).
  const [, setTick] = useState(0);
  // Optimistic per-objective status overlay so Split/Skip/Undo feel instant.
  // Pruned once the 1.5s poll reports the same value (see effect below).
  const [overlay, setOverlay] = useState<Record<number, ObjectiveStatus>>({});
  // Optimistic frozen split times (objId → ms) so a just-split row shows its
  // time instantly; pruned once the server reports the same split.
  const [splitOverlay, setSplitOverlay] = useState<Record<number, number>>({});
  const [editingRoute, setEditingRoute] = useState(false);

  const entry = cp?.schedule_entry_detail ?? null;
  const running = entry?.timer?.is_running ?? false;

  // Re-render ~60fps while the clock runs so the centiseconds advance
  // smoothly. Idle when stopped/paused — the 1.5s poll covers state changes.
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const loop = () => {
      setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  // Drop optimistic overlay entries once the server agrees with them.
  useEffect(() => {
    if (!entry) return;
    const srvObt = new Set(entry.obtained_objective_ids);
    const srvSkp = new Set(entry.skipped_objective_ids);
    setOverlay((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [k, v] of Object.entries(prev)) {
        const id = Number(k);
        const srv: ObjectiveStatus = srvObt.has(id)
          ? 'obtained'
          : srvSkp.has(id)
            ? 'skipped'
            : 'outstanding';
        if (srv === v) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [entry]);

  // Drop optimistic split times once the server reports a split for that id.
  useEffect(() => {
    if (!entry) return;
    const srv = entry.objective_split_ms;
    setSplitOverlay((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const k of Object.keys(prev)) {
        if (srv[k] != null) {
          delete next[Number(k)];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [entry]);

  const run = async (fn: () => Promise<unknown>) => {
    setErr(null);
    setBusy(true);
    try {
      await fn();
      // Pull fresh state right away rather than waiting for the next poll tick.
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Objective splits update the overlay synchronously (so the buttons respond
  // instantly) and run their network calls in a serialized background queue —
  // never blocking the UI on `busy`. A LiveSplit timer needs Space/Undo to
  // fire back-to-back; the queue keeps requests in order, errors surface, and
  // the poll reconciles. Distinct from `run`, which blocks the timer-control
  // buttons where a brief lock is fine.
  const objectiveChain = useRef<Promise<unknown>>(Promise.resolve());
  const enqueue = (fn: () => Promise<unknown>) => {
    setErr(null);
    objectiveChain.current = objectiveChain.current
      .then(fn)
      .then(() => setRefreshKey((k) => k + 1))
      .catch((e) => setErr((e as Error).message));
  };

  if (!entry) {
    return (
      <div className="control-card">
        <h2>Timer</h2>
        <p className="text-warning">
          No game is currently set as "Currently Playing". Pick one in{' '}
          <a className="text-warning" href="/control/schedule">
            Schedule
          </a>{' '}
          first.
        </p>
      </div>
    );
  }

  const t = entry.timer;
  const displayMs = computeTimerMs(t);

  return (
    <div className="control-card">
      <h2>Timer</h2>
      <p>
        Tracking: <strong>{entry.game?.title ?? entry.display_title}</strong>{' '}
        {entry.game && (
          <span className="text-white-50">
            ({entry.game.platform}
            {entry.game.release_year ? ` · ${entry.game.release_year}` : ''})
          </span>
        )}
      </p>

      <div
        style={{
          fontFamily: '"Share Tech Mono", ui-monospace, monospace',
          fontSize: '6rem',
          textAlign: 'center',
          lineHeight: 1,
          color: '#fff',
          fontVariantNumeric: 'tabular-nums',
          margin: '1.5rem 0 0.5rem',
        }}
      >
        {formatHmsCs(displayMs)}
      </div>
      <p className="text-center text-white-50 small mb-3">
        {t?.is_running
          ? 'Running'
          : t?.is_paused
            ? 'Paused'
            : entry.is_completed
              ? 'Finished'
              : 'Ready'}
        {entry.is_completed && (
          <span className="badge bg-success ms-2">COMPLETED</span>
        )}
      </p>

      <SplitsPanel
        entry={entry}
        overlay={overlay}
        setOverlay={setOverlay}
        splitOverlay={splitOverlay}
        setSplitOverlay={setSplitOverlay}
        enqueue={enqueue}
      />

      <div className="control-btn-row mt-3" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
        {t?.is_running ? (
          <button
            className="btn btn-warning"
            disabled={busy}
            onClick={() => run(() => obsApi.pauseTimer(entry.id))}
          >
            ⏸ Pause
          </button>
        ) : (
          <button
            className="btn btn-success"
            disabled={busy || entry.is_completed}
            onClick={() => run(() => obsApi.startTimer(entry.id))}
          >
            ▶ {t?.is_paused ? 'Resume' : 'Start'}
          </button>
        )}

        {!entry.is_completed && (
          <button
            className="btn btn-danger"
            disabled={busy}
            onClick={() => {
              if (!confirm('Finish the run? This banks the final time and marks the game completed. You can Reopen afterwards.')) return;
              void run(() => obsApi.stopTimer(entry.id));
            }}
          >
            🏁 Finish
          </button>
        )}
        {entry.is_completed && (
          <button
            className="btn btn-success"
            disabled={busy}
            onClick={() => run(() => obsApi.reopenTimer(entry.id))}
          >
            ↩ Reopen
          </button>
        )}

        <button
          className="btn btn-secondary"
          disabled={busy}
          onClick={() => {
            if (!confirm('Reset the run? Clears the clock to 00:00:00 and resets all splits.')) return;
            setOverlay({});
            setSplitOverlay({});
            void run(() => resetRun(entry));
          }}
        >
          ⟲ Reset
        </button>
      </div>

      {err && <p className="text-danger mt-3 mb-0">{err}</p>}

      <div className="mt-4 d-flex justify-content-between align-items-baseline">
        <span className="small text-white-50">
          Estimated run time: <strong>{entry.effective_minutes} min</strong>
        </span>
        <button
          className="btn btn-link btn-sm p-0 text-info"
          onClick={() => setEditingRoute((v) => !v)}
        >
          {editingRoute ? 'Close route editor' : 'Configure splits…'}
        </button>
      </div>

      {editingRoute && (
        <RouteEditor entry={entry} onClose={() => setEditingRoute(false)} />
      )}
    </div>
  );
}

/** Sorted objective library for the entry's game (order, then name). */
function gameObjectives(entry: ScheduleEntry): GameObjective[] {
  return [...(entry.game?.objectives ?? [])].sort(
    (a, b) => a.order - b.order || a.name.localeCompare(b.name),
  );
}

/** The ordered route objectives. Falls back to all objectives when no custom
 *  route is configured (empty timer_segment_ids). */
function routeObjectives(entry: ScheduleEntry): GameObjective[] {
  const objs = gameObjectives(entry);
  if (!entry.timer_segment_ids.length) return objs;
  return entry.timer_segment_ids
    .map((id) => objs.find((o) => o.id === id))
    .filter((o): o is GameObjective => Boolean(o));
}

function SplitsPanel({
  entry,
  overlay,
  setOverlay,
  splitOverlay,
  setSplitOverlay,
  enqueue,
}: {
  entry: ScheduleEntry;
  overlay: Record<number, ObjectiveStatus>;
  setOverlay: Dispatch<SetStateAction<Record<number, ObjectiveStatus>>>;
  splitOverlay: Record<number, number>;
  setSplitOverlay: Dispatch<SetStateAction<Record<number, number>>>;
  enqueue: (fn: () => Promise<unknown>) => void;
}) {
  const route = useMemo(() => routeObjectives(entry), [entry]);
  const srvObt = useMemo(() => new Set(entry.obtained_objective_ids), [entry]);
  const srvSkp = useMemo(() => new Set(entry.skipped_objective_ids), [entry]);

  const statusOf = (id: number): ObjectiveStatus =>
    overlay[id] ?? (srvObt.has(id) ? 'obtained' : srvSkp.has(id) ? 'skipped' : 'outstanding');

  // Frozen split time for an obtained objective (server value, or the
  // optimistic overlay set the instant we split).
  const splitOf = (id: number): number | undefined =>
    entry.objective_split_ms[String(id)] ?? splitOverlay[id];

  // The dungeon whose setpiece is currently `active` — its run-section group is
  // where shared dungeon items (Map/Compass/Key) attribute. Within this group
  // the item splits are click-driven so they can be hit in any order.
  const activeDungeonGroup = useMemo(() => {
    const sp = (entry.setpieces ?? []).find(
      (s) => s.kind === 'dungeon' && s.stage === 'active',
    );
    if (!sp) return null;
    const enter = gameObjectives(entry).find(
      (o) => o.setpiece_role === 'dungeon-enter' && o.setpiece_name === sp.name,
    );
    return enter ? enter.group.trim() : null;
  }, [entry]);

  // Item ids linked by more than one objective — the shared dungeon staples
  // (Map/Compass/Key) attributed per active dungeon. Mirrors the backend gate
  // so the timer treats exactly the same set as click-driven sub-splits.
  const multiLinkedItemIds = useMemo(() => {
    const counts = new Map<number, number>();
    for (const o of gameObjectives(entry)) {
      if (o.linked_item != null) {
        counts.set(o.linked_item, (counts.get(o.linked_item) ?? 0) + 1);
      }
    }
    return new Set([...counts].filter(([, n]) => n > 1).map(([id]) => id));
  }, [entry]);

  // A dungeon-item objective = a shared (multi-linked) staple inside the active
  // dungeon group. `single` ones become reorderable click-to-split rows; `tally`
  // ones (small keys) get +/- count controls. Single-linked rewards (e.g. the
  // Pendant that clears the dungeon) stay on the normal Space-split spine.
  const isDungeonItem = (o: GameObjective): boolean =>
    activeDungeonGroup != null &&
    o.linked_item != null &&
    multiLinkedItemIds.has(o.linked_item) &&
    o.group.trim() === activeDungeonGroup;

  const isTally = (o: GameObjective): boolean => o.link_mode === 'tally';
  // Spine splits = the linear Space-driven sequence: everything except tally
  // objectives and the click-driven dungeon staples.
  const isSpine = (o: GameObjective): boolean => !isTally(o) && !isDungeonItem(o);

  const active = route.find((o) => isSpine(o) && statusOf(o.id) === 'outstanding') ?? null;
  // Tally objectives never count toward "done / total"; they're informational.
  const counted = route.filter((o) => !isTally(o));
  const obtainedCount = counted.filter((o) => statusOf(o.id) === 'obtained').length;
  const skippedCount = counted.filter((o) => statusOf(o.id) === 'skipped').length;
  const activeTotal = counted.filter((o) => statusOf(o.id) !== 'skipped').length;

  // Optimistic per-objective tally overlay so +/- feels instant; pruned once
  // the poll reports the same count.
  const [countOverlay, setCountOverlay] = useState<Record<number, number>>({});
  useEffect(() => {
    const srv = entry.objective_counts;
    setCountOverlay((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const k of Object.keys(prev)) {
        if ((srv[k] ?? 0) === prev[Number(k)]) {
          delete next[Number(k)];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [entry]);
  const countOf = (id: number): number =>
    countOverlay[id] ?? entry.objective_counts[String(id)] ?? 0;

  // Click a single dungeon-item split directly (out of order). Marks it
  // obtained + stamps the current clock. Never finishes the run — dungeon
  // staples aren't the end of the route; only the main spine Split does that.
  const splitOne = (o: GameObjective) => {
    if (statusOf(o.id) !== 'outstanding') return;
    const ms = computeTimerMs(entry.timer);
    setStatus(o.id, 'obtained', nextOutstandingName(o.id), ms);
  };

  // Adjust a tally dungeon-item count (small keys). Optimistic overlay + queued
  // network call; stamps the latest split on increment.
  const adjustCount = (o: GameObjective, delta: number) => {
    const nextVal = Math.max(0, countOf(o.id) + delta);
    setCountOverlay((prev) => ({ ...prev, [o.id]: nextVal }));
    const ms = delta > 0 ? computeTimerMs(entry.timer) : undefined;
    enqueue(() => obsApi.adjustObjectiveCount(entry.id, o.id, delta, ms));
  };

  const running = entry.timer?.is_running ?? false;

  // Mark `obj` with `status`, advance the omnibar "current objective" text to
  // `nextName`. The overlay updates synchronously here so the row + buttons
  // react instantly; the network calls run in the background queue. `splitMs`
  // (obtain only) freezes the split time; `finish` stops the timer (used when
  // the final split completes the run).
  const setStatus = (
    objId: number,
    status: ObjectiveStatus,
    nextName: string,
    splitMs?: number,
    finish?: boolean,
  ) => {
    setOverlay((prev) => ({ ...prev, [objId]: status }));
    setSplitOverlay((prev) => {
      const next = { ...prev };
      if (status === 'obtained' && splitMs != null) next[objId] = splitMs;
      else delete next[objId];
      return next;
    });
    enqueue(async () => {
      await obsApi.setObjectiveStatus(entry.id, objId, status, splitMs);
      await obsApi.updateScheduleEntry(entry.id, { current_objective: nextName });
      if (finish) await obsApi.stopTimer(entry.id);
    });
  };

  // Next spine objective to surface as the omnibar "current objective" — skips
  // tally + click-driven dungeon staples so the text tracks the linear route.
  const nextOutstandingName = (excludeId: number): string =>
    route.find(
      (o) => o.id !== excludeId && isSpine(o) && statusOf(o.id) === 'outstanding',
    )?.name ?? '';

  const split = () => {
    if (!active) return;
    // Freeze the split at exactly what's on the clock; if no outstanding
    // objectives remain after this one, this split finishes the run.
    const ms = computeTimerMs(entry.timer);
    const nextName = nextOutstandingName(active.id);
    const isFinal = nextName === '';
    setStatus(active.id, 'obtained', nextName, ms, isFinal);
  };
  const skip = () => {
    if (!active) return;
    setStatus(active.id, 'skipped', nextOutstandingName(active.id));
  };
  const undo = () => {
    // Reverse the last SPINE split only — tally counts and click-driven dungeon
    // staples are managed by their own +/- and row clicks.
    const last = [...route]
      .reverse()
      .find((o) => isSpine(o) && statusOf(o.id) === 'obtained');
    if (!last) return;
    // Reverting makes `last` the active split again (clears its frozen time).
    setStatus(last.id, 'outstanding', last.name);
  };

  // LiveSplit-feel keyboard: Space = split, Backspace = undo. Ignore when the
  // operator is typing in a field, and only while the clock is running.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (el?.isContentEditable) return;
      if (!running) return;
      if (e.code === 'Space') {
        e.preventDefault();
        split();
      } else if (e.code === 'Backspace') {
        e.preventDefault();
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  if (route.length === 0) {
    return (
      <p className="text-white-50 small text-center mb-0">
        No splits yet. Add objectives for this game in{' '}
        <a className="text-info" href="/control/omnibar">
          Omnibar
        </a>
        , then optionally pick a route below.
      </p>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-baseline mb-1">
        <span className="small text-white-50">Splits</span>
        <span className="small text-white-50">
          {obtainedCount} / {activeTotal} done
          {skippedCount > 0 && ` · ${skippedCount} skipped`}
        </span>
      </div>

      <ol className="splits-list">
        {route.map((o, i) => {
          const status = statusOf(o.id);
          const isActive = active?.id === o.id;
          // Section header whenever the group changes down the route. Blank
          // groups render no header (the splits just follow on).
          const group = o.group.trim();
          const prevGroup = i > 0 ? route[i - 1].group.trim() : '';
          // Split time: frozen value for obtained rows; the live running clock
          // for the active row; blank otherwise.
          let splitText = '';
          if (status === 'obtained') {
            const ms = splitOf(o.id);
            if (ms != null) splitText = formatSplit(ms);
          } else if (isActive && (running || entry.timer?.is_paused)) {
            // Show the live clock while running, and the held time while paused
            // (computeTimerMs returns the banked ms when not running).
            splitText = formatSplit(computeTimerMs(entry.timer));
          }
          // Dungeon-item rows in the active dungeon are interactive out of order:
          // single → click to split; tally → +/- count (small keys).
          const dungeon = isDungeonItem(o);
          const tally = dungeon && o.link_mode === 'tally';
          const count = countOf(o.id);
          const clickToSplit = dungeon && !tally && status === 'outstanding' && running;
          return (
            <Fragment key={o.id}>
              {group && group !== prevGroup && (
                <li className="split-group-head">{group}</li>
              )}
              <li
                className="split-row"
                data-status={status}
                data-active={isActive || clickToSplit}
                data-clickable={clickToSplit || undefined}
                onClick={clickToSplit ? () => splitOne(o) : undefined}
                title={clickToSplit ? 'Collect this dungeon item (any order)' : undefined}
              >
                <span className="split-icon">
                  {o.image_url ? (
                    <img src={o.image_url} alt="" />
                  ) : (
                    <span className="split-placeholder">{o.name.slice(0, 2)}</span>
                  )}
                </span>
                <span className="split-name">
                  {o.name}
                  {tally && count > 0 && <span className="split-count"> ×{count}</span>}
                </span>
                <span className="split-time" data-active={isActive}>{splitText}</span>
                {tally ? (
                  <span className="split-tally" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn btn-outline-light btn-sm"
                      disabled={count === 0}
                      onClick={() => adjustCount(o, -1)}
                      title="One fewer (e.g. used a small key)"
                    >
                      −
                    </button>
                    <span className="split-count-num">{count}</span>
                    <button
                      type="button"
                      className="btn btn-outline-light btn-sm"
                      disabled={!running}
                      onClick={() => adjustCount(o, 1)}
                      title="Collected one (e.g. a small key)"
                    >
                      +
                    </button>
                  </span>
                ) : (
                  <span className="split-mark">
                    {status === 'obtained' ? '✓' : status === 'skipped' ? '⏭' : isActive ? '▶' : ''}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>

      <div className="control-btn-row" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          className="btn btn-primary"
          disabled={!running || !active}
          onClick={split}
          title="Mark the active split done and advance (Space)"
        >
          ⏱ Split
        </button>
        <button
          className="btn btn-outline-light btn-sm"
          disabled={!running || !active}
          onClick={skip}
          title="Skip the active split (not needed this run)"
        >
          ⏭ Skip
        </button>
        <button
          className="btn btn-outline-light btn-sm"
          disabled={obtainedCount === 0}
          onClick={undo}
          title="Undo the last split (Backspace)"
        >
          ↶ Undo
        </button>
      </div>

      <style>{`
        .splits-list {
          list-style: none;
          margin: 0 0 0.75rem;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
          max-height: 22rem;
          overflow-y: auto;
        }
        .split-group-head {
          list-style: none;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #ffcc00;
          margin-top: 0.5rem;
          padding: 0.1rem 0.2rem;
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }
        .split-group-head:first-child { margin-top: 0; }
        .split-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.35rem 0.6rem;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 5px;
          background: rgba(0,0,0,0.25);
          color: #fff;
          transition: all 0.15s;
        }
        .split-row[data-status="outstanding"] { opacity: 0.6; }
        .split-row[data-status="obtained"] {
          background: linear-gradient(90deg, rgba(20,80,30,0.45), rgba(40,120,50,0.25));
          border-color: rgba(127,255,127,0.5);
        }
        .split-row[data-status="skipped"] {
          opacity: 0.4;
          border-style: dashed;
          text-decoration: line-through;
        }
        .split-row[data-active="true"] {
          opacity: 1;
          border-color: rgba(255,255,255,0.55);
          border-left: 3px solid #e71347;
          background: rgba(255,255,255,0.06);
        }
        .split-icon {
          width: 28px;
          height: 28px;
          flex: 0 0 28px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .split-icon img { max-width: 28px; max-height: 28px; object-fit: contain; }
        .split-placeholder {
          font-size: 0.7rem;
          opacity: 0.7;
          text-transform: uppercase;
        }
        .split-name { flex: 1 1 auto; }
        .split-time {
          flex: 0 0 auto;
          font-family: "Share Tech Mono", ui-monospace, monospace;
          font-size: 1.05rem;
          line-height: 1;
          min-width: 5rem;
          text-align: right;
          opacity: 0.7;
          font-variant-numeric: tabular-nums;
        }
        .split-time[data-active="true"] { opacity: 1; }
        .split-mark { flex: 0 0 auto; font-size: 1.1rem; min-width: 1.2rem; text-align: center; }
      `}</style>
    </div>
  );
}

/** Pick & order which objectives act as this run's splits. Empty route = use
 *  all objectives in library order (the default). */
function RouteEditor({ entry, onClose }: { entry: ScheduleEntry; onClose: () => void }) {
  const objs = useMemo(() => gameObjectives(entry), [entry]);
  const [draft, setDraft] = useState<number[]>(() =>
    entry.timer_segment_ids.length ? [...entry.timer_segment_ids] : objs.map((o) => o.id),
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const byId = (id: number) => objs.find((o) => o.id === id);
  const inRoute = draft.map(byId).filter((o): o is GameObjective => Boolean(o));
  const available = objs.filter((o) => !draft.includes(o.id));

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= draft.length) return;
    const next = [...draft];
    [next[idx], next[j]] = [next[j], next[idx]];
    setDraft(next);
  };

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      await obsApi.updateScheduleEntry(entry.id, { timer_segment_ids: draft });
      onClose();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (objs.length === 0) {
    return (
      <p className="text-white-50 small mt-2">
        This game has no objectives. Add some in the Omnibar tab first.
      </p>
    );
  }

  return (
    <div className="mt-2 p-3 rounded" style={{ background: 'rgba(0,0,0,0.25)' }}>
      <p className="small text-white-50 mb-2">
        Pick & order the objectives that act as splits for this run. Leave empty to use all
        objectives in library order.
      </p>

      {inRoute.length === 0 ? (
        <p className="small text-white-50">No splits selected — add some below.</p>
      ) : (
        <ol className="ps-3 mb-2">
          {inRoute.map((o, idx) => (
            <li key={o.id} className="d-flex align-items-center gap-2 mb-1">
              <span className="flex-grow-1">{o.name}</span>
              <button className="btn btn-sm btn-outline-light py-0" disabled={idx === 0} onClick={() => move(idx, -1)} title="Move up">↑</button>
              <button className="btn btn-sm btn-outline-light py-0" disabled={idx === inRoute.length - 1} onClick={() => move(idx, 1)} title="Move down">↓</button>
              <button className="btn btn-sm btn-outline-danger py-0" onClick={() => setDraft(draft.filter((id) => id !== o.id))} title="Remove">✕</button>
            </li>
          ))}
        </ol>
      )}

      {available.length > 0 && (
        <div className="mb-2">
          <span className="small text-white-50 d-block mb-1">Add:</span>
          <div className="d-flex flex-wrap gap-1">
            {available.map((o) => (
              <button key={o.id} className="btn btn-sm btn-outline-info py-0" onClick={() => setDraft([...draft, o.id])}>
                + {o.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {err && <p className="text-danger small">{err}</p>}

      <div className="d-flex gap-2 mt-2">
        <button className="btn btn-sm btn-success" disabled={busy} onClick={save}>Save route</button>
        <button className="btn btn-sm btn-outline-light" disabled={busy} onClick={() => setDraft(objs.map((o) => o.id))}>Add all</button>
        <button className="btn btn-sm btn-outline-light" disabled={busy} onClick={() => setDraft([])}>Clear</button>
        <button className="btn btn-sm btn-link text-white-50" disabled={busy} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

/** Reset the clock AND the run's splits, then clear the current-objective text.
 *  resetTimer also reopens completion server-side. */
async function resetRun(entry: ScheduleEntry): Promise<void> {
  await obsApi.resetTimer(entry.id);
  const route = routeObjectives(entry);
  const obtained = new Set(entry.obtained_objective_ids);
  const skipped = new Set(entry.skipped_objective_ids);
  for (const o of route) {
    if (obtained.has(o.id) || skipped.has(o.id)) {
      await obsApi.setObjectiveStatus(entry.id, o.id, 'outstanding');
    }
  }
  await obsApi.updateScheduleEntry(entry.id, { current_objective: '' });
}

/** Total elapsed run time in milliseconds. The live segment is read at ms
 *  precision from the wall clock; the banked portion (accumulated_seconds) is
 *  whole seconds, so resumed-after-pause runs lose sub-second precision only in
 *  the banked part — fine for split display. */
function computeTimerMs(timer: ScheduleEntry['timer']): number {
  if (!timer) return 0;
  if (timer.is_running && timer.started_at) {
    const startedMs = Date.parse(timer.started_at);
    return timer.accumulated_ms + Math.max(0, Date.now() - startedMs);
  }
  // Paused / stopped: show the banked ms exactly (centiseconds preserved).
  return timer.accumulated_ms;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** HH:MM:SS.cc (centiseconds) — the big clock. */
function formatHmsCs(totalMs: number): string {
  const totalSeconds = Math.floor(totalMs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const cs = Math.floor((totalMs % 1000) / 10);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}.${pad2(cs)}`;
}

/** Compact split time — drops the hours field until it's needed. */
function formatSplit(totalMs: number): string {
  const totalSeconds = Math.floor(totalMs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const cs = Math.floor((totalMs % 1000) / 10);
  return h > 0
    ? `${h}:${pad2(m)}:${pad2(s)}.${pad2(cs)}`
    : `${pad2(m)}:${pad2(s)}.${pad2(cs)}`;
}
