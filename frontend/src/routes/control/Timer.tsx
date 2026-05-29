import { Fragment, useEffect, useMemo, useState } from 'react';
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
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, 1500);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Re-render every 500ms so the running clock advances (time is server-side).
  const [, setTick] = useState(0);
  // Optimistic per-objective status overlay so Split/Skip/Undo feel instant.
  // Pruned once the 1.5s poll reports the same value (see effect below).
  const [overlay, setOverlay] = useState<Record<number, ObjectiveStatus>>({});
  const [editingRoute, setEditingRoute] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 500);
    return () => window.clearInterval(id);
  }, []);

  const entry = cp?.schedule_entry_detail ?? null;

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

  const run = async (fn: () => Promise<unknown>) => {
    setErr(null);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
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
  const displaySeconds = computeTimerSeconds(t);

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
          fontFamily: "'VT323', monospace",
          fontSize: '6rem',
          textAlign: 'center',
          lineHeight: 1,
          color: t?.is_running ? '#7fff7f' : t?.is_paused ? '#ffcc00' : '#fff',
          textShadow: '0 0 20px rgba(231, 19, 71, 0.6)',
          margin: '1.5rem 0 0.5rem',
        }}
      >
        {formatHms(displaySeconds)}
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

      <SplitsPanel entry={entry} overlay={overlay} setOverlay={setOverlay} run={run} busy={busy} />

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
  run,
  busy,
}: {
  entry: ScheduleEntry;
  overlay: Record<number, ObjectiveStatus>;
  setOverlay: Dispatch<SetStateAction<Record<number, ObjectiveStatus>>>;
  run: (fn: () => Promise<unknown>) => Promise<void>;
  busy: boolean;
}) {
  const route = useMemo(() => routeObjectives(entry), [entry]);
  const srvObt = useMemo(() => new Set(entry.obtained_objective_ids), [entry]);
  const srvSkp = useMemo(() => new Set(entry.skipped_objective_ids), [entry]);

  const statusOf = (id: number): ObjectiveStatus =>
    overlay[id] ?? (srvObt.has(id) ? 'obtained' : srvSkp.has(id) ? 'skipped' : 'outstanding');

  const active = route.find((o) => statusOf(o.id) === 'outstanding') ?? null;
  const obtainedCount = route.filter((o) => statusOf(o.id) === 'obtained').length;
  const activeTotal = route.filter((o) => statusOf(o.id) !== 'skipped').length;

  const running = entry.timer?.is_running ?? false;

  // Mark `obj` with `status`, advance the omnibar "current objective" text to
  // whatever the next outstanding split is (or `nextName` when given).
  const setStatus = (objId: number, status: ObjectiveStatus, nextName: string) =>
    run(async () => {
      setOverlay((prev) => ({ ...prev, [objId]: status }));
      await obsApi.setObjectiveStatus(entry.id, objId, status);
      await obsApi.updateScheduleEntry(entry.id, { current_objective: nextName });
    });

  const nextOutstandingName = (excludeId: number): string =>
    route.find((o) => o.id !== excludeId && statusOf(o.id) === 'outstanding')?.name ?? '';

  const split = () => {
    if (!active || busy) return;
    setStatus(active.id, 'obtained', nextOutstandingName(active.id));
  };
  const skip = () => {
    if (!active || busy) return;
    setStatus(active.id, 'skipped', nextOutstandingName(active.id));
  };
  const undo = () => {
    if (busy) return;
    const last = [...route].reverse().find((o) => statusOf(o.id) === 'obtained');
    if (!last) return;
    // Reverting makes `last` the active split again.
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
          return (
            <Fragment key={o.id}>
              {group && group !== prevGroup && (
                <li className="split-group-head">{group}</li>
              )}
              <li className="split-row" data-status={status} data-active={isActive}>
                <span className="split-icon">
                  {o.image_url ? (
                    <img src={o.image_url} alt="" />
                  ) : (
                    <span className="split-placeholder">{o.name.slice(0, 2)}</span>
                  )}
                </span>
                <span className="split-name">{o.name}</span>
                <span className="split-mark">
                  {status === 'obtained' ? '✓' : status === 'skipped' ? '⏭' : isActive ? '▶' : ''}
                </span>
              </li>
            </Fragment>
          );
        })}
      </ol>

      <div className="control-btn-row" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          className="btn btn-primary"
          disabled={busy || !running || !active}
          onClick={split}
          title="Mark the active split done and advance (Space)"
        >
          ⏱ Split
        </button>
        <button
          className="btn btn-outline-light btn-sm"
          disabled={busy || !running || !active}
          onClick={skip}
          title="Skip the active split (not needed this run)"
        >
          ⏭ Skip
        </button>
        <button
          className="btn btn-outline-light btn-sm"
          disabled={busy || obtainedCount === 0}
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
          border-color: #e71347;
          box-shadow: 0 0 12px rgba(231,19,71,0.45);
          background: rgba(231,19,71,0.12);
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

function computeTimerSeconds(timer: ScheduleEntry['timer']): number {
  if (!timer) return 0;
  if (timer.is_running && timer.started_at) {
    const startedMs = Date.parse(timer.started_at);
    return (
      timer.accumulated_seconds +
      Math.max(0, Math.floor((Date.now() - startedMs) / 1000))
    );
  }
  return timer.accumulated_seconds;
}

function formatHms(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
