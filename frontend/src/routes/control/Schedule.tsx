import { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { Game, Runner, ScheduleEntry, EventModel } from '@/lib/obsApi';
import { api } from '@/lib/api';

/**
 * Schedule control with drag-drop reordering via @dnd-kit/sortable.
 */
export function ScheduleControl() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000);
  const { data: scheduleData } = usePolledQuery(
    () => (event ? obsApi.schedule(event.id) : Promise.resolve([] as ScheduleEntry[])),
    2000,
  );
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, 2000);
  const { data: games } = usePolledQuery(obsApi.games, 30_000);
  const { data: runners } = usePolledQuery(() => api<Runner[]>('/api/runners/'), 30_000);

  const [localOrder, setLocalOrder] = useState<ScheduleEntry[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pushingTwitch, setPushingTwitch] = useState(false);
  const [twitchMsg, setTwitchMsg] = useState<string | null>(null);

  // Keep local state in sync with the server when we're not mid-drag.
  useEffect(() => {
    if (scheduleData) {
      setLocalOrder([...scheduleData].sort((a, b) => a.order - b.order));
    }
  }, [scheduleData]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (!event) {
    return (
      <div className="control-card">
        <h2>Schedule</h2>
        <p className="text-warning">
          No active event. Create one in{' '}
          <a className="text-warning" href="/admin/api/event/" target="_blank" rel="noreferrer">
            /admin/api/event/
          </a>{' '}
          and tick "is active".
        </p>
      </div>
    );
  }

  const setCurrent = async (entryId: number | null) => {
    setBusy(true);
    setErr(null);
    try {
      await obsApi.setCurrentlyPlaying(entryId);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (entryId: number) => {
    if (!confirm('Delete this schedule entry?')) return;
    setBusy(true);
    setErr(null);
    try {
      await api(`/api/schedule/${entryId}/`, { method: 'DELETE' });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id || !localOrder) return;
    const oldIdx = localOrder.findIndex((x) => x.id === Number(e.active.id));
    const newIdx = localOrder.findIndex((x) => x.id === Number(e.over!.id));
    const reordered = arrayMove(localOrder, oldIdx, newIdx);
    setLocalOrder(reordered);
    // Persist by writing the new order index to each entry. Use offset to dodge
    // unique_together collisions, then snap to final indices.
    setBusy(true);
    try {
      const SENTINEL = 100_000;
      for (let i = 0; i < reordered.length; i++) {
        await api(`/api/schedule/${reordered[i].id}/`, {
          method: 'PATCH',
          body: { order: SENTINEL + i },
        });
      }
      for (let i = 0; i < reordered.length; i++) {
        await api(`/api/schedule/${reordered[i].id}/`, {
          method: 'PATCH',
          body: { order: i + 1 },
        });
      }
    } catch (err) {
      setErr((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const pushToTwitch = async () => {
    setPushingTwitch(true);
    setTwitchMsg(null);
    try {
      const res = await api<{ segment_count: number }>('/api/twitch/push-schedule/', {
        method: 'POST',
      });
      setTwitchMsg(`Pushed ${res.segment_count} segments to Twitch.`);
    } catch (e) {
      setTwitchMsg(`Failed: ${(e as Error).message}`);
    } finally {
      setPushingTwitch(false);
    }
  };

  return (
    <div className="control-card">
      <header className="d-flex justify-content-between align-items-baseline flex-wrap gap-2">
        <h2 className="m-0">Schedule</h2>
        <div className="small text-white-50">
          Event: <strong>{event.name}</strong> · Starts{' '}
          {new Date(event.start_time).toLocaleString('en-GB')}
        </div>
      </header>

      <div className="mt-2 control-btn-row">
        <button
          className="btn btn-sm btn-outline-light"
          onClick={pushToTwitch}
          disabled={pushingTwitch}
        >
          {pushingTwitch ? 'Pushing…' : 'Push to Twitch schedule'}
        </button>
        {twitchMsg && <span className="small text-white-50">{twitchMsg}</span>}
      </div>

      {err && <p className="text-danger mt-2">{err}</p>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext
          items={(localOrder ?? []).map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <table className="control-table mt-3">
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th style={{ width: 30 }}>#</th>
                <th>Game</th>
                <th>Runners</th>
                <th>Mins</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(localOrder ?? []).map((entry, idx) => (
                <SortableRow
                  key={entry.id}
                  entry={entry}
                  index={idx + 1}
                  isCurrent={cp?.schedule_entry === entry.id}
                  busy={busy}
                  onSetCurrent={setCurrent}
                  onRemove={remove}
                />
              ))}
              {localOrder?.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-white-50 text-center py-4">
                    No games scheduled. Add one below.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </SortableContext>
      </DndContext>

      <div className="mt-4">
        {adding ? (
          <AddEntryForm
            event={event}
            games={games ?? []}
            runners={runners ?? []}
            nextOrder={(localOrder?.length ?? 0) + 1}
            onCancel={() => setAdding(false)}
            onAdded={() => setAdding(false)}
          />
        ) : (
          <button className="btn btn-bloodmoon" onClick={() => setAdding(true)}>
            + Add game
          </button>
        )}
      </div>
    </div>
  );
}

function SortableRow({
  entry,
  index,
  isCurrent,
  busy,
  onSetCurrent,
  onRemove,
}: {
  entry: ScheduleEntry;
  index: number;
  isCurrent: boolean;
  busy: boolean;
  onSetCurrent: (id: number | null) => void;
  onRemove: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: isDragging
      ? 'rgba(231,19,71,0.4)'
      : isCurrent
        ? 'rgba(231,19,71,0.25)'
        : undefined,
    cursor: isDragging ? 'grabbing' : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td style={{ cursor: 'grab' }} {...attributes} {...listeners}>
        ☰
      </td>
      <td>{index}</td>
      <td>
        <strong>{entry.game.title}</strong>
        <div className="small text-white-50">
          {entry.game.platform} · {entry.game.layout_type}
        </div>
      </td>
      <td>{entry.runners.map((r) => r.name).join(', ') || '—'}</td>
      <td>{entry.effective_minutes}</td>
      <td>
        {isCurrent && <span className="badge bg-warning text-dark me-1">LIVE</span>}
        {entry.is_completed && <span className="badge bg-success">DONE</span>}
        {!isCurrent && !entry.is_completed && <span className="text-white-50">queued</span>}
      </td>
      <td>
        <div className="control-btn-row">
          {!isCurrent && (
            <button
              className="btn btn-sm btn-bloodmoon"
              disabled={busy}
              onClick={() => onSetCurrent(entry.id)}
            >
              Make current
            </button>
          )}
          {isCurrent && (
            <button
              className="btn btn-sm btn-outline-light"
              disabled={busy}
              onClick={() => onSetCurrent(null)}
            >
              Clear current
            </button>
          )}
          <button
            className="btn btn-sm btn-outline-danger"
            disabled={busy}
            onClick={() => onRemove(entry.id)}
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
  );
}

function AddEntryForm({
  event,
  games,
  runners,
  nextOrder,
  onCancel,
  onAdded,
}: {
  event: EventModel;
  games: Game[];
  runners: Runner[];
  nextOrder: number;
  onCancel: () => void;
  onAdded: () => void;
}) {
  const [gameId, setGameId] = useState<number | ''>('');
  const [runnerIds, setRunnerIds] = useState<number[]>([]);
  const [plannedMinutes, setPlannedMinutes] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (gameId === '' && games.length > 0) setGameId(games[0].id);
  }, [games, gameId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gameId === '') return;
    setErr(null);
    setBusy(true);
    try {
      await api('/api/schedule/', {
        method: 'POST',
        body: {
          event: event.id,
          game_id: gameId,
          runner_ids: runnerIds,
          order: nextOrder,
          planned_minutes: plannedMinutes ? Number(plannedMinutes) : null,
        },
      });
      onAdded();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (games.length === 0) {
    return (
      <div>
        <p className="text-warning">
          No games yet — seed defaults with{' '}
          <code>docker compose exec backend python manage.py populate_zelda_data</code>{' '}
          or add via{' '}
          <a className="text-warning" href="/control/games">
            /control/games
          </a>
          .
        </p>
        <button className="btn btn-outline-light" onClick={onCancel}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="d-flex gap-2 flex-wrap align-items-end">
      <div>
        <label className="d-block small text-white-50">Game</label>
        <select
          className="form-select form-select-sm"
          value={gameId}
          onChange={(e) => setGameId(Number(e.target.value))}
        >
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title} ({g.platform})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="d-block small text-white-50">Planned min (optional)</label>
        <input
          type="number"
          min={1}
          className="form-control form-control-sm"
          value={plannedMinutes}
          onChange={(e) => setPlannedMinutes(e.target.value)}
          placeholder="from game default"
          style={{ width: 160 }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 240 }}>
        <label className="d-block small text-white-50">Runners</label>
        <select
          multiple
          className="form-select form-select-sm"
          value={runnerIds.map(String)}
          onChange={(e) =>
            setRunnerIds(Array.from(e.target.selectedOptions, (o) => Number(o.value)))
          }
          size={Math.min(4, Math.max(2, runners.length))}
        >
          {runners.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-bloodmoon" disabled={busy}>
        Add
      </button>
      <button type="button" className="btn btn-outline-light" onClick={onCancel}>
        Cancel
      </button>
      {err && <div className="text-danger w-100 mt-2">{err}</div>}
    </form>
  );
}
