import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFloppyDisk,
  faRotateLeft,
  faPlay,
  faClone,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
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
import { SoundLibrarySection } from './SoundLibrarySection';
import type {
  Game,
  Runner,
  ScheduleEntry,
  ScheduleEntrySoundTrigger,
  EventModel,
  SlotType,
  SoundAsset,
  TriggerAnchor,
} from '@/lib/obsApi';
import { api } from '@/lib/api';

interface SlotMeta {
  label: string;
  icon: string;
  defaultMinutes: number;
}

const SLOT_META: Record<Exclude<SlotType, 'game'>, SlotMeta> = {
  start: { label: 'Stream start', icon: '🎬', defaultMinutes: 15 },
  meal: { label: 'Meal break', icon: '🍽', defaultMinutes: 30 },
  sleep: { label: 'Sleep break', icon: '💤', defaultMinutes: 480 },
  break: { label: 'Break', icon: '☕', defaultMinutes: 15 },
  end: { label: 'Stream end', icon: '🏁', defaultMinutes: 15 },
  other: { label: 'Other', icon: '⭐', defaultMinutes: 0 },
};

const slotTypeLabel = (t: SlotType): string =>
  t === 'game' ? 'Game' : SLOT_META[t].label;

function ScheduleKpis({
  allEntries,
  totalMinutes,
  eventStart,
  eventEnd,
}: {
  allEntries: ScheduleEntry[];
  totalMinutes: number;
  eventStart: Date;
  eventEnd: Date;
}) {
  const games = allEntries.filter((e) => e.slot_type === 'game');
  const gamesRemaining = games.filter((g) => !g.is_completed).length;
  const gamesTotal = games.length;
  const breakMinutes = allEntries
    .filter((e) => e.slot_type !== 'game')
    .reduce((sum, e) => sum + e.effective_minutes, 0);
  const playMinutes = totalMinutes - breakMinutes;
  // "Days to play" — calendar days the event spans (inclusive count).
  const startDay = new Date(
    eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate(),
  ).getTime();
  const endDay = new Date(
    eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate(),
  ).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const calendarDays = Math.max(1, Math.round((endDay - startDay) / dayMs) + 1);
  const totalDaysDecimal = totalMinutes / (24 * 60);

  return (
    <div className="row g-2 mt-3">
      <KpiCard label="Games" value={String(gamesRemaining)} sub={`of ${gamesTotal} remaining`} />
      <KpiCard
        label="Days to play"
        value={totalDaysDecimal.toFixed(1)}
        sub={`spans ${calendarDays} calendar day${calendarDays === 1 ? '' : 's'}`}
      />
      <KpiCard
        label="Play time"
        value={fmtDuration(playMinutes)}
        sub={`${games.length} game${games.length === 1 ? '' : 's'}`}
      />
      <KpiCard
        label="Break time"
        value={fmtDuration(breakMinutes)}
        sub={`${allEntries.length - games.length} break${
          allEntries.length - games.length === 1 ? '' : 's'
        }`}
      />
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="col-6 col-md-3">
      <div
        style={{
          background: 'rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          padding: '10px 14px',
          height: '100%',
        }}
      >
        <div className="small text-white-50 text-uppercase" style={{ letterSpacing: 0.5 }}>
          {label}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
        {sub && <div className="small text-white-50 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

// Pointer-first collision detection. `nest-<gameId>` (Game cell of a row) and
// `nest-sibling-<childId>` (ChildBreakRow body) are both "nest" droppables;
// when the cursor is inside one we return only that hit so the reorder path
// doesn't compete with the nest path.
const isNestId = (id: unknown): boolean =>
  typeof id === 'string' && id.startsWith('nest-');

const scheduleCollision: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  const nestHit = pointerHits.find((h) => isNestId(h.id));
  if (nestHit) return [nestHit];
  if (pointerHits.length > 0) {
    const rowHits = pointerHits.filter((h) => !isNestId(h.id));
    if (rowHits.length) return rowHits;
  }
  const rectHits = rectIntersection(args).filter((h) => !isNestId(h.id));
  if (rectHits.length) return rectHits;
  return closestCenter(args).filter((h) => !isNestId(h.id));
};

/**
 * Schedule control with drag-drop reordering via @dnd-kit/sortable.
 */
export function ScheduleControl() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000);
  const { data: scheduleData } = usePolledQuery(
    () => (event ? obsApi.schedule(event.id) : Promise.resolve([] as ScheduleEntry[])),
    2000,
    [event?.id],
  );
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, 2000);
  const { data: games } = usePolledQuery(obsApi.games, 30_000);
  const { data: runners } = usePolledQuery(() => api<Runner[]>('/api/runners/'), 30_000);

  const [localOrder, setLocalOrder] = useState<ScheduleEntry[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [showBreaks, setShowBreaks] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pushingTwitch, setPushingTwitch] = useState(false);
  const [twitchMsg, setTwitchMsg] = useState<string | null>(null);

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

  // Clear a game's DONE flag — `reopen_timer` clears is_completed +
  // finished_at while keeping accumulated timer seconds intact, so a
  // mistaken Finish is one click away from being undone. Surfaced in
  // the entry's Edit panel rather than as a row action so the action
  // sits with the rest of the entry's settings. For a full clock wipe
  // the operator can hit Reset on the timer afterwards.
  const clearCompleted = async (entryId: number) => {
    if (!confirm('Mark this entry as not completed? It moves back to queued; the timer reading is preserved.')) return;
    setBusy(true);
    setErr(null);
    try {
      await obsApi.reopenTimer(entryId);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const detachChild = async (entryId: number) => {
    setBusy(true);
    setErr(null);
    try {
      await api(`/api/schedule/${entryId}/`, {
        method: 'PATCH',
        body: { parent_entry: null },
      });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onDragEnd = async (e: DragEndEvent) => {
    if (!e.over || !localOrder) return;
    const activeEntry = localOrder.find((x) => x.id === Number(e.active.id));
    if (!activeEntry) return;

    // Dropped on a nest zone — attach as child. Two kinds:
    //   `nest-<gameId>`           → child of that game, offset starts at 0
    //   `nest-sibling-<childId>`  → child of the sibling's parent game, with
    //                                offset = sibling.offset + sibling.duration
    // Only break slots can be nested; games dropped here fall through.
    if (typeof e.over.id === 'string' && e.over.id.startsWith('nest-')) {
      if (activeEntry.slot_type === 'game') return;
      let parentId: number | null = null;
      let offset = 0;
      if (e.over.id.startsWith('nest-sibling-')) {
        const siblingId = Number(e.over.id.slice('nest-sibling-'.length));
        const sibling = localOrder.find((x) => x.id === siblingId);
        if (sibling && sibling.parent_entry != null && sibling.id !== activeEntry.id) {
          parentId = sibling.parent_entry;
          offset = sibling.start_offset_minutes + sibling.effective_minutes;
        }
      } else {
        const gameId = Number(e.over.id.slice('nest-'.length));
        if (Number.isFinite(gameId) && activeEntry.id !== gameId) {
          parentId = gameId;
          offset = 0;
        }
      }
      if (parentId !== null) {
        setBusy(true);
        try {
          await api(`/api/schedule/${activeEntry.id}/`, {
            method: 'PATCH',
            body: { parent_entry: parentId, start_offset_minutes: offset },
          });
        } catch (err) {
          setErr((err as Error).message);
        } finally {
          setBusy(false);
        }
      }
      return;
    }

    // Otherwise: sibling reorder.
    const overEntry = localOrder.find((x) => x.id === Number(e.over!.id));
    if (!overEntry) return;
    if (e.active.id === e.over.id) return;
    const oldIdx = localOrder.findIndex((x) => x.id === activeEntry.id);
    const newIdx = localOrder.findIndex((x) => x.id === overEntry.id);
    const reordered = arrayMove(localOrder, oldIdx, newIdx);
    setLocalOrder(reordered);
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

  // Compute cumulative start time per entry. Breaks with parent_entry are
  // nested under their parent and contribute their minutes to the parent's
  // total wall-clock span — they don't displace later top-level entries.
  const eventStart = new Date(event.start_time);
  const allEntries = localOrder ?? [];
  const topLevel = allEntries.filter((e) => e.parent_entry == null);
  const childrenByParent = new Map<number, ScheduleEntry[]>();
  for (const e of allEntries) {
    if (e.parent_entry != null) {
      const arr = childrenByParent.get(e.parent_entry) ?? [];
      arr.push(e);
      childrenByParent.set(e.parent_entry, arr);
    }
  }
  // Sort each parent's children by their start offset so they appear in
  // wall-clock order under their parent.
  for (const arr of childrenByParent.values()) {
    arr.sort((a, b) => a.start_offset_minutes - b.start_offset_minutes);
  }
  const startTimes = new Map<number, Date>();
  {
    let cursor = eventStart.getTime();
    for (const e of topLevel) {
      startTimes.set(e.id, new Date(cursor));
      const childMinutes = (childrenByParent.get(e.id) ?? []).reduce(
        (sum, c) => sum + c.effective_minutes,
        0,
      );
      cursor += (e.effective_minutes + childMinutes) * 60_000;
    }
  }
  const totalMinutes = allEntries.reduce((sum, e) => sum + e.effective_minutes, 0);
  const eventEnd = new Date(eventStart.getTime() + totalMinutes * 60_000);

  return (
    <div className="control-card">
      <header className="d-flex justify-content-between align-items-baseline flex-wrap gap-2">
        <h2 className="m-0">Schedule</h2>
        <div className="small text-white-50">
          Event: <strong>{event.name}</strong> · {fmtDateTime(eventStart)} →{' '}
          {fmtDateTime(eventEnd)} · {fmtDuration(totalMinutes)} total
        </div>
      </header>

      <div className="mt-2 control-btn-row align-items-center">
        <button
          className="btn btn-sm btn-outline-light"
          onClick={pushToTwitch}
          disabled={pushingTwitch}
        >
          {pushingTwitch ? 'Pushing…' : 'Push to Twitch schedule'}
        </button>
        {twitchMsg && <span className="small text-white-50">{twitchMsg}</span>}
        <div className="form-check form-switch ms-auto m-0">
          <input
            id="schedule-show-breaks"
            type="checkbox"
            className="form-check-input"
            checked={showBreaks}
            onChange={(e) => setShowBreaks(e.target.checked)}
          />
          <label
            htmlFor="schedule-show-breaks"
            className="form-check-label small text-white-50"
          >
            Show breaks
          </label>
        </div>
      </div>
      <ScheduleKpis
        allEntries={allEntries}
        totalMinutes={totalMinutes}
        eventStart={eventStart}
        eventEnd={eventEnd}
      />

      <div className="small text-white-50 mt-2">
        Drag to reorder. Drop a break onto a game's row to attach it; drop
        onto an existing child break to add another one right after it.
        Use the Detach button to move a child back out.
      </div>

      {err && <p className="text-danger mt-2">{err}</p>}

      <DndContext sensors={sensors} collisionDetection={scheduleCollision} onDragEnd={onDragEnd}>
        <SortableContext
          items={topLevel.map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <table className="control-table mt-3">
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th style={{ width: 130 }}>When</th>
                <th>Game</th>
                <th>Runners</th>
                <th style={{ width: 90 }}>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {topLevel
                .filter(
                  (entry) =>
                    showBreaks ||
                    entry.slot_type === 'game' ||
                    entry.slot_type === 'start' ||
                    entry.slot_type === 'end',
                )
                .flatMap((entry, idx) => {
                const allChildren = childrenByParent.get(entry.id) ?? [];
                const children = showBreaks ? allChildren : [];
                const parentStart = startTimes.get(entry.id) ?? eventStart;
                // Wall-clock span of this slot includes any attached breaks
                // — even when breaks are hidden from view — so the parent's
                // end time still reflects them.
                const totalWallClockMinutes =
                  entry.effective_minutes +
                  allChildren.reduce((sum, c) => sum + c.effective_minutes, 0);
                const editingThis = editingId === entry.id;
                const rows: React.ReactNode[] = [];
                if (editingThis) {
                  rows.push(
                    <tr key={entry.id}>
                      <td colSpan={6}>
                        <EntryForm
                          event={event}
                          games={games ?? []}
                          runners={runners ?? []}
                          allEntries={allEntries}
                          startTimes={startTimes}
                          entry={entry}
                          onCancel={() => setEditingId(null)}
                          onSaved={() => setEditingId(null)}
                          onClearCompleted={clearCompleted}
                        />
                      </td>
                    </tr>,
                  );
                } else {
                  rows.push(
                    <SortableRow
                      key={entry.id}
                      entry={entry}
                      index={idx + 1}
                      startTime={parentStart}
                      totalWallClockMinutes={totalWallClockMinutes}
                      isCurrent={cp?.schedule_entry === entry.id}
                      busy={busy}
                      onSetCurrent={setCurrent}
                      onRemove={remove}
                      onEdit={() => setEditingId(entry.id)}
                    />,
                  );
                }
                // Children render after the parent. Their wall-clock start is
                // parent_start + start_offset_minutes (where the user dropped
                // the break inside the parent's runtime).
                for (const child of children) {
                  const childStart = new Date(
                    parentStart.getTime() + child.start_offset_minutes * 60_000,
                  );
                  if (editingId === child.id) {
                    rows.push(
                      <tr key={child.id}>
                        <td colSpan={6}>
                          <EntryForm
                            event={event}
                            games={games ?? []}
                            runners={runners ?? []}
                            allEntries={allEntries}
                            startTimes={startTimes}
                            entry={child}
                            onCancel={() => setEditingId(null)}
                            onSaved={() => setEditingId(null)}
                          />
                        </td>
                      </tr>,
                    );
                  } else {
                    rows.push(
                      <ChildBreakRow
                        key={child.id}
                        entry={child}
                        parentLabel={entry.display_title}
                        startTime={childStart}
                        busy={busy}
                        onRemove={remove}
                        onEdit={() => setEditingId(child.id)}
                        onDetach={() => detachChild(child.id)}
                      />,
                    );
                  }
                }
                return rows;
              })}
              {allEntries.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-white-50 text-center py-4">
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
          <EntryForm
            event={event}
            games={games ?? []}
            runners={runners ?? []}
            allEntries={allEntries}
            startTimes={startTimes}
            onCancel={() => setAdding(false)}
            onSaved={() => setAdding(false)}
          />
        ) : (
          <button className="btn btn-bloodmoon" onClick={() => setAdding(true)}>
            + Add game or break
          </button>
        )}
      </div>

      <div className="mt-4">
        {/* Same shared component used by /control/omnibar — edits
          * here propagate to the global library, so triggers wired
          * from the entry editor above pick up renamed sounds on
          * the next poll. */}
        <SoundLibrarySection />
      </div>
    </div>
  );
}

function SortableRow({
  entry,
  index,
  startTime,
  totalWallClockMinutes,
  isCurrent,
  busy,
  onSetCurrent,
  onRemove,
  onEdit,
}: {
  entry: ScheduleEntry;
  index: number;
  startTime: Date;
  totalWallClockMinutes: number;
  isCurrent: boolean;
  busy: boolean;
  onSetCurrent: (id: number | null) => void;
  onRemove: (id: number) => void;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.id });
  // Inner drop zone — only games accept nest drops.
  const nestDroppable = useDroppable({
    id: `nest-${entry.id}`,
    disabled: entry.slot_type !== 'game',
  });

  const endTime = new Date(startTime.getTime() + totalWallClockMinutes * 60_000);
  const hasAttachedBreaks = totalWallClockMinutes > entry.effective_minutes;
  const isCompleted = entry.is_completed;

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: isDragging
      ? 'rgba(231,19,71,0.4)'
      : isCurrent
        ? 'rgba(231,19,71,0.22)'
        : undefined,
    cursor: isDragging ? 'grabbing' : undefined,
    opacity: isCompleted && !isCurrent ? 0.5 : 1,
    boxShadow: isCurrent ? 'inset 4px 0 0 0 #e71347' : undefined,
  };
  const nestStyle: React.CSSProperties = nestDroppable.isOver
    ? {
        outline: '2px dashed #e71347',
        outlineOffset: -3,
        borderRadius: 4,
      }
    : {};

  return (
    <tr ref={setNodeRef} style={style}>
      <td style={{ cursor: 'grab' }} {...attributes} {...listeners}>
        <div>☰</div>
        <div className="small text-white-50 text-center">{index}</div>
      </td>
      <td>
        <div className="small text-white-50">{fmtDate(startTime)}</div>
        <div className="small">
          {fmtTime(startTime)} → {fmtTime(endTime)}
        </div>
        <div className="small text-white-50">
          {fmtDuration(entry.effective_minutes)}
          {hasAttachedBreaks && (
            <>
              {' '}+ breaks ={' '}
              <strong className="text-white-50">
                {fmtDuration(totalWallClockMinutes)}
              </strong>
            </>
          )}
        </div>
      </td>
      <td ref={nestDroppable.setNodeRef} style={nestStyle}>
        <div className="d-flex align-items-center gap-2">
          {entry.game ? (
            <BoxArt game={entry.game} />
          ) : (
            <BreakIcon slotType={entry.slot_type} />
          )}
          <div style={{ minWidth: 0 }}>
            <strong
              style={{
                textDecoration: isCompleted ? 'line-through' : undefined,
              }}
            >
              {entry.display_title}
            </strong>
            <div className="small text-white-50">
              {entry.game ? (
                <>
                  {entry.game.platform} · {entry.game.layout_type}
                  {entry.game.objectives.length > 0 && (
                    <>
                      {' '}·{' '}
                      <Link
                        to={`/control/objectives?game=${entry.game.id}`}
                        className="text-info"
                        title="Open this game's objective library"
                      >
                        {entry.game.objectives.length} objective{entry.game.objectives.length === 1 ? '' : 's'}
                      </Link>
                    </>
                  )}
                </>
              ) : (
                slotTypeLabel(entry.slot_type)
              )}
              {nestDroppable.isOver && (
                <span className="text-warning ms-2">↳ Drop to nest here</span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td>
        <RunnerAvatars runners={entry.runners} />
      </td>
      <td>
        {isCurrent && <span className="badge bg-warning text-dark">● LIVE</span>}
        {!isCurrent && isCompleted && <span className="badge bg-success">DONE</span>}
        {!isCurrent && !isCompleted && <span className="text-white-50 small">queued</span>}
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
            className="btn btn-sm btn-outline-light"
            disabled={busy}
            onClick={onEdit}
          >
            Edit
          </button>
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

function ChildBreakRow({
  entry,
  parentLabel,
  startTime,
  busy,
  onRemove,
  onEdit,
  onDetach,
}: {
  entry: ScheduleEntry;
  parentLabel: string;
  startTime: Date;
  busy: boolean;
  onRemove: (id: number) => void;
  onEdit: () => void;
  onDetach: () => void;
}) {
  const endTime = new Date(startTime.getTime() + entry.effective_minutes * 60_000);
  const nestDroppable = useDroppable({ id: `nest-sibling-${entry.id}` });
  const nestStyle: React.CSSProperties = nestDroppable.isOver
    ? {
        outline: '2px dashed #e71347',
        outlineOffset: -3,
        borderRadius: 4,
      }
    : {};
  return (
    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
      <td style={{ paddingLeft: 18, color: 'rgba(255,255,255,0.4)' }}>↳</td>
      <td>
        <div className="small text-white-50">{fmtDate(startTime)}</div>
        <div className="small">
          {fmtTime(startTime)} → {fmtTime(endTime)}
        </div>
        <div className="small text-white-50">{fmtDuration(entry.effective_minutes)}</div>
      </td>
      <td ref={nestDroppable.setNodeRef} style={nestStyle}>
        <div className="d-flex align-items-center gap-2">
          <BreakIcon slotType={entry.slot_type} />
          <div style={{ minWidth: 0 }}>
            <strong>{entry.display_title}</strong>
            <div className="small text-white-50">
              during <em>{parentLabel}</em>
              {nestDroppable.isOver && (
                <span className="text-warning ms-2">
                  ↳ Drop to add a break after this one
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="text-white-50 small">—</td>
      <td>
        <span className="text-white-50 small">attached</span>
      </td>
      <td>
        <div className="control-btn-row">
          <button
            className="btn btn-sm btn-outline-light"
            disabled={busy}
            onClick={onDetach}
            title="Move this break back to the top level (between games)"
          >
            Detach
          </button>
          <button
            className="btn btn-sm btn-outline-light"
            disabled={busy}
            onClick={onEdit}
          >
            Edit
          </button>
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

function BreakIcon({ slotType }: { slotType: SlotType }) {
  const icon = slotType === 'game' ? '?' : SLOT_META[slotType].icon;
  return (
    <div
      aria-hidden
      style={{
        width: 36,
        height: 48,
        borderRadius: 3,
        background: 'rgba(231,19,71,0.18)',
        border: '1px dashed rgba(231,19,71,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 20,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
  );
}

function BoxArt({ game }: { game: Game }) {
  const fallback = (
    <div
      aria-hidden
      style={{
        width: 36,
        height: 48,
        borderRadius: 3,
        background: 'rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        color: 'rgba(255,255,255,0.4)',
        flexShrink: 0,
      }}
    >
      {game.title.charAt(0).toUpperCase()}
    </div>
  );
  if (!game.box_art_url) return fallback;
  return (
    <img
      src={game.box_art_url}
      alt=""
      style={{
        width: 36,
        height: 48,
        objectFit: 'cover',
        borderRadius: 3,
        flexShrink: 0,
      }}
    />
  );
}

function RunnerAvatars({ runners }: { runners: Runner[] }) {
  if (runners.length === 0) {
    return <span className="text-white-50">—</span>;
  }
  return (
    <div className="d-flex align-items-center" style={{ gap: 4 }}>
      {runners.map((r) => (
        <span
          key={r.id}
          title={r.name}
          className="d-inline-flex align-items-center"
          style={{ gap: 6 }}
        >
          {r.profile_image_url ? (
            <img
              src={r.profile_image_url}
              alt=""
              width={24}
              height={24}
              style={{ borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <span
              aria-hidden
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              {r.name.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="small">{r.name}</span>
        </span>
      ))}
    </div>
  );
}

function EntryForm({
  event,
  games,
  runners,
  allEntries,
  startTimes,
  entry,
  onCancel,
  onSaved,
  onClearCompleted,
}: {
  event: EventModel;
  games: Game[];
  runners: Runner[];
  allEntries: ScheduleEntry[];
  startTimes: Map<number, Date>;
  entry?: ScheduleEntry;
  onCancel: () => void;
  onSaved: () => void;
  // Optional — only the top-level game-row EntryForm wires this in.
  // Child (break) EntryForms never need it since breaks don't carry
  // a completion flag.
  onClearCompleted?: (id: number) => void;
}) {
  const isEdit = entry !== undefined;
  const [slotType, setSlotType] = useState<SlotType>(entry?.slot_type ?? 'game');
  const [gameId, setGameId] = useState<number | ''>(entry?.game?.id ?? '');
  const [title, setTitle] = useState<string>(entry?.title ?? '');
  const [parentEntryId, setParentEntryId] = useState<number | ''>(
    entry?.parent_entry ?? '',
  );
  const [startOffsetMinutes, setStartOffsetMinutes] = useState<string>(
    entry && entry.parent_entry != null
      ? String(entry.start_offset_minutes)
      : '',
  );
  const [runnerIds, setRunnerIds] = useState<number[]>(
    entry?.runners.map((r) => r.id) ?? [],
  );
  const [plannedMinutes, setPlannedMinutes] = useState<string>(
    entry?.planned_minutes != null ? String(entry.planned_minutes) : '',
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isGame = slotType === 'game';
  const candidateParents = allEntries.filter(
    (e) =>
      e.slot_type === 'game' &&
      e.parent_entry == null &&
      (!entry || e.id !== entry.id),
  );

  useEffect(() => {
    if (!isEdit && isGame && gameId === '' && games.length > 0) setGameId(games[0].id);
  }, [games, gameId, isEdit, isGame]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGame && gameId === '') return;
    setErr(null);
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        event: event.id,
        slot_type: slotType,
        planned_minutes: plannedMinutes ? Number(plannedMinutes) : null,
      };
      if (isGame) {
        body.game_id = gameId;
        body.runner_ids = runnerIds;
        body.title = title;
        body.parent_entry = null;
        body.start_offset_minutes = 0;
      } else {
        body.game_id = null;
        body.runner_ids = [];
        body.title = title;
        body.parent_entry = parentEntryId === '' ? null : parentEntryId;
        body.start_offset_minutes =
          parentEntryId === '' || startOffsetMinutes === ''
            ? 0
            : Number(startOffsetMinutes);
      }
      if (isEdit) {
        await api(`/api/schedule/${entry.id}/`, { method: 'PATCH', body });
      } else {
        await api('/api/schedule/', { method: 'POST', body });
      }
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!isEdit && isGame && games.length === 0) {
    return (
      <div className="schedule-form">
        <p className="text-warning m-0">
          No games yet — seed defaults with{' '}
          <code>docker compose exec backend python manage.py populate_zelda_data</code>{' '}
          or add via{' '}
          <a className="text-warning" href="/control/games">
            /control/games
          </a>
          .
        </p>
        <button className="btn btn-outline-light mt-3" onClick={onCancel}>
          Cancel
        </button>
      </div>
    );
  }

  const selectedGame = games.find((g) => g.id === gameId);
  const toggleRunner = (id: number) => {
    setRunnerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const slotTypes: SlotType[] = ['game', 'start', 'meal', 'sleep', 'break', 'end', 'other'];
  const breakDefault = !isGame ? SLOT_META[slotType].defaultMinutes : 0;

  return (
    <form onSubmit={submit} className="schedule-form">
      <header className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <strong>{isEdit ? 'Edit schedule entry' : 'Add to schedule'}</strong>
        {isGame && selectedGame && (
          <span className="small text-white-50">
            Default: {fmtDuration(selectedGame.default_play_minutes)} ({selectedGame.default_play_minutes}m) · {selectedGame.platform}
          </span>
        )}
      </header>

      <div className="mb-3 d-flex flex-wrap gap-2">
        {slotTypes.map((t) => {
          const selected = slotType === t;
          const label = t === 'game' ? '🎮 Game' : `${SLOT_META[t].icon} ${SLOT_META[t].label}`;
          return (
            <button
              type="button"
              key={t}
              onClick={() => setSlotType(t)}
              style={{
                padding: '4px 12px',
                borderRadius: 999,
                border: selected
                  ? '1px solid #e71347'
                  : '1px solid rgba(255,255,255,0.15)',
                background: selected
                  ? 'rgba(231,19,71,0.25)'
                  : 'rgba(255,255,255,0.04)',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {isGame ? (
        <div className="row g-3">
          <div className="col-md-5">
            <label className="form-label small text-white-50 mb-1">Game</label>
            <select
              className="form-select"
              value={gameId}
              onChange={(e) => setGameId(Number(e.target.value))}
            >
              {games.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.platform})
                </option>
              ))}
            </select>

            {selectedGame && (
              <div
                className="d-flex gap-3 mt-3 p-2"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  borderRadius: 6,
                }}
              >
                <BoxArt game={selectedGame} />
                <div style={{ minWidth: 0 }}>
                  <div>
                    <strong>{selectedGame.title}</strong>
                    {selectedGame.release_year && (
                      <span className="text-white-50 small ms-1">
                        ({selectedGame.release_year})
                      </span>
                    )}
                  </div>
                  <div className="small text-white-50">
                    {selectedGame.platform} · {selectedGame.layout_type}
                  </div>
                </div>
              </div>
            )}

            <label className="form-label small text-white-50 mt-3 mb-1">
              Planned minutes
            </label>
            <input
              type="number"
              min={1}
              className="form-control"
              value={plannedMinutes}
              onChange={(e) => setPlannedMinutes(e.target.value)}
              placeholder={
                selectedGame
                  ? `default ${selectedGame.default_play_minutes}m (${fmtDuration(selectedGame.default_play_minutes)})`
                  : 'from game default'
              }
            />
          </div>

          <div className="col-md-7">
            <label className="form-label small text-white-50 mb-1 d-flex justify-content-between">
              <span>Runners</span>
              <span>
                {runnerIds.length > 0 ? `${runnerIds.length} selected` : 'none selected'}
              </span>
            </label>
            {runners.length === 0 ? (
              <p className="text-white-50 small m-0">
                No runners yet —{' '}
                <a className="text-warning" href="/control/runners">
                  add one
                </a>
                .
              </p>
            ) : (
              <div className="d-flex flex-wrap gap-2">
                {runners.map((r) => {
                  const selected = runnerIds.includes(r.id);
                  return (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => toggleRunner(r.id)}
                      className="d-inline-flex align-items-center gap-2"
                      style={{
                        padding: '4px 10px 4px 4px',
                        borderRadius: 999,
                        border: selected
                          ? '1px solid #e71347'
                          : '1px solid rgba(255,255,255,0.15)',
                        background: selected
                          ? 'rgba(231,19,71,0.25)'
                          : 'rgba(255,255,255,0.04)',
                        color: 'inherit',
                        cursor: 'pointer',
                        transition: 'background 0.12s, border-color 0.12s',
                      }}
                    >
                      {r.profile_image_url ? (
                        <img
                          src={r.profile_image_url}
                          alt=""
                          width={26}
                          height={26}
                          style={{ borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span
                          aria-hidden
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            color: 'rgba(255,255,255,0.6)',
                          }}
                        >
                          {r.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="small">{r.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label small text-white-50 mb-1">
              Label (optional)
            </label>
            <input
              type="text"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={SLOT_META[slotType].label}
              maxLength={120}
            />
            <div className="small text-white-50 mt-1">
              Leave blank to show "{SLOT_META[slotType].label}".
            </div>
          </div>
          <div className="col-md-6">
            <label className="form-label small text-white-50 mb-1">
              Planned minutes
            </label>
            <input
              type="number"
              min={0}
              className="form-control"
              value={plannedMinutes}
              onChange={(e) => setPlannedMinutes(e.target.value)}
              placeholder={`default ${breakDefault}m (${fmtDuration(breakDefault)})`}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label small text-white-50 mb-1">
              Attach to game (optional)
            </label>
            <select
              className="form-select"
              value={parentEntryId}
              onChange={(e) =>
                setParentEntryId(e.target.value === '' ? '' : Number(e.target.value))
              }
            >
              <option value="">— Standalone (between games)</option>
              {candidateParents.map((p) => (
                <option key={p.id} value={p.id}>
                  during: {p.display_title}
                </option>
              ))}
            </select>
            <div className="small text-white-50 mt-1">
              Attached breaks overlap the chosen game's runtime — later entries
              still start after the game finishes, just pushed by the break's duration.
            </div>
          </div>
          {parentEntryId !== '' && (
            <div className="col-md-6">
              <label className="form-label small text-white-50 mb-1">
                Start at (minutes into the game)
              </label>
              <input
                type="number"
                min={0}
                className="form-control"
                value={startOffsetMinutes}
                onChange={(e) => setStartOffsetMinutes(e.target.value)}
                placeholder="0 = the moment the game starts"
              />
              <div className="small text-white-50 mt-1">
                {(() => {
                  const parent = candidateParents.find((p) => p.id === parentEntryId);
                  if (!parent) return null;
                  const offset = Number(startOffsetMinutes || 0);
                  const parentStart = startTimes.get(parent.id);
                  const breakStart = parentStart
                    ? new Date(parentStart.getTime() + offset * 60_000)
                    : null;
                  return (
                    <>
                      <code>{fmtDuration(offset)}</code> after the game starts (
                      {parent.display_title} runs{' '}
                      {fmtDuration(parent.effective_minutes)}).
                      {breakStart && (
                        <>
                          {' '}
                          Begins{' '}
                          <strong className="text-warning">
                            {fmtDateTime(breakStart)}
                          </strong>
                          .
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="d-flex gap-2 mt-4 flex-wrap">
        {isEdit && entry && entry.is_completed && onClearCompleted && (
          <button
            type="button"
            className="btn btn-outline-warning"
            disabled={busy}
            onClick={() => onClearCompleted(entry.id)}
            title="Clear the DONE flag so this entry returns to queued. The timer reading is preserved."
          >
            Mark as not completed
          </button>
        )}
        <button
          type="submit"
          className="btn btn-bloodmoon ms-auto"
          disabled={busy}
        >
          {busy ? 'Saving…' : isEdit ? 'Update' : 'Add to schedule'}
        </button>
        <button type="button" className="btn btn-outline-light" onClick={onCancel}>
          Cancel
        </button>
      </div>
      {err && <div className="text-danger mt-2">{err}</div>}

      {/* Sound triggers panel — edit-only. Lets the operator wire
        * one-shot audio cues to this entry's start / end ETA without
        * leaving the schedule editor. The same list is also visible
        * from /control/omnibar grouped across all entries. */}
      {isEdit && entry && <EntrySoundTriggers entry={entry} />}
    </form>
  );
}

// ── Sound triggers for a single schedule entry ──────────────────────────
//
// Embedded at the bottom of the EntryForm when editing an existing
// entry. Renders the entry's existing triggers, lets the operator add
// new ones (picking a sound from the global library), and exposes the
// same per-row controls as /control/omnibar's flat trigger list. The
// shared editor live in two places by design — the schedule view is
// the natural place to think "this break needs three warning bells",
// while /control/omnibar is where you scan all triggers across the
// event at once. Both write to the same `/api/schedule-entry-sound-
// triggers/` endpoint so state stays in sync.

const ANCHOR_OPTIONS: { value: TriggerAnchor; label: string }[] = [
  { value: 'start', label: 'Entry start' },
  { value: 'end',   label: 'Entry end' },
];

function EntrySoundTriggers({ entry }: { entry: ScheduleEntry }) {
  const { data: triggers } = usePolledQuery(
    () => obsApi.scheduleEntrySoundTriggers({ scheduleEntryId: entry.id }),
    3000,
    [entry.id],
  );
  const { data: assets } = usePolledQuery(obsApi.soundAssets, 10_000);
  const [busy, setBusy] = useState(false);
  const [draftSoundId, setDraftSoundId] = useState<number | ''>('');

  const sounds = assets ?? [];
  const list = (triggers ?? [])
    .slice()
    .sort((a, b) => {
      if (a.anchor !== b.anchor) return a.anchor === 'start' ? -1 : 1;
      return a.offset_seconds - b.offset_seconds;
    });

  const add = async () => {
    if (!draftSoundId) return;
    setBusy(true);
    try {
      await obsApi.createScheduleEntrySoundTrigger({
        schedule_entry: entry.id,
        sound: Number(draftSoundId),
        anchor: 'start',
        offset_seconds: 0,
        message: '',
        priority: 5,
        duration_seconds: 6,
        show_banner: true,
        is_active: true,
      });
      setDraftSoundId('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <header className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
        <strong>Sound triggers</strong>
        <small className="text-white-50">
          Anchor + signed offset (s) relative to this entry's start / end ETA.
          Manage the sound library in <a className="text-warning" href="/control/omnibar">/control/omnibar</a>.
        </small>
      </header>

      {sounds.length === 0 ? (
        <p className="text-warning small m-0">
          No sound assets yet — add some in{' '}
          <a className="text-warning" href="/control/omnibar">/control/omnibar</a>{' '}
          first, then return here to wire them up.
        </p>
      ) : (
        <>
          <div className="control-btn-row" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <label className="d-flex flex-column">
              <small className="text-white-50">Add trigger — sound</small>
              <select
                disabled={busy}
                value={draftSoundId}
                onChange={(e) => setDraftSoundId(e.target.value ? Number(e.target.value) : '')}
                style={{ minWidth: 200 }}
              >
                <option value="">Pick a sound…</option>
                {sounds.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn btn-sm btn-bloodmoon"
              disabled={busy || !draftSoundId}
              onClick={add}
            >
              Add trigger
            </button>
          </div>

          {list.length === 0 ? (
            <p className="text-white-50 small mt-2 mb-0">No triggers on this entry yet.</p>
          ) : (
            // Fitted table: with 12 columns + icon-only action cluster
            // it fits the container width without horizontal scroll.
            <div className="mt-2">
              <table
                className="control-table trigger-table"
                style={{ fontSize: '0.8em', width: '100%', tableLayout: 'fixed' }}
              >
                <colgroup>
                  <col style={{ width: 84 }} />
                  <col style={{ width: 64 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 56 }} />
                  <col style={{ width: 130 }} />
                  <col />
                  <col />
                  <col style={{ width: 52 }} />
                  <col style={{ width: 52 }} />
                  <col style={{ width: 48 }} />
                  <col style={{ width: 70 }} />
                  <col style={{ width: 162 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Anchor</th>
                    <th title="Offset in seconds — signed">Off (s)</th>
                    <th>Sound</th>
                    <th title="Show banner">Bnr</th>
                    <th>Tag</th>
                    <th>Message</th>
                    <th>Subhead</th>
                    <th title="Priority">Pri</th>
                    <th title="Duration in seconds">Dur</th>
                    <th title="Active">On</th>
                    <th>Fired</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((t) => (
                    <EntryTriggerRow key={t.id} trigger={t} sounds={sounds} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Editable subset of a trigger row — every field the operator can
// stage locally before hitting Save. `last_fired_at` is read-only,
// managed by the SSE evaluator on the backend.
interface TriggerDraft {
  anchor: TriggerAnchor;
  sound: number;
  offset_seconds: string;
  show_banner: boolean;
  tag: string;
  message: string;
  subhead: string;
  priority: string;
  duration_seconds: string;
  is_active: boolean;
}

function draftFromTrigger(t: ScheduleEntrySoundTrigger): TriggerDraft {
  return {
    anchor: t.anchor,
    sound: t.sound,
    offset_seconds: String(t.offset_seconds),
    show_banner: t.show_banner,
    tag: t.tag,
    message: t.message,
    subhead: t.subhead,
    priority: String(t.priority),
    duration_seconds: String(t.duration_seconds),
    is_active: t.is_active,
  };
}

function EntryTriggerRow({
  trigger,
  sounds,
}: {
  trigger: ScheduleEntrySoundTrigger;
  sounds: SoundAsset[];
}) {
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<TriggerDraft>(() => draftFromTrigger(trigger));
  const [dirty, setDirty] = useState(false);

  // Re-seed from the canonical trigger on every poll — but only when
  // the row is CLEAN. Pending edits aren't wiped by the 3s background
  // refresh.
  useEffect(() => {
    if (dirty) return;
    setDraft(draftFromTrigger(trigger));
  }, [trigger, dirty]);

  const patch = <K extends keyof TriggerDraft>(key: K, value: TriggerDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  const clampInt = (s: string, lo: number, hi: number, fallback: number) => {
    const n = Number(s);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(lo, Math.min(hi, Math.round(n)));
  };

  const save = async () => {
    setBusy(true);
    try {
      await obsApi.updateScheduleEntrySoundTrigger(trigger.id, {
        anchor: draft.anchor,
        sound: draft.sound,
        offset_seconds: clampInt(draft.offset_seconds, -3600, 3600, trigger.offset_seconds),
        show_banner: draft.show_banner,
        tag: draft.tag,
        message: draft.message,
        subhead: draft.subhead,
        priority: clampInt(draft.priority, 0, 100, trigger.priority),
        duration_seconds: clampInt(draft.duration_seconds, 1, 120, trigger.duration_seconds),
        is_active: draft.is_active,
      });
      setDirty(false);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setDraft(draftFromTrigger(trigger));
    setDirty(false);
  };

  const remove = async () => {
    if (!confirm('Delete this trigger?')) return;
    setBusy(true);
    try {
      await obsApi.deleteScheduleEntrySoundTrigger(trigger.id);
    } finally {
      setBusy(false);
    }
  };
  const duplicate = async () => {
    setBusy(true);
    try {
      // Clone every config field from the canonical row (NOT the
      // dirty draft — duplicating an unsaved row would be
      // confusing). `last_fired_at` is intentionally not copied so
      // the new row starts eligible to fire.
      await obsApi.createScheduleEntrySoundTrigger({
        schedule_entry: trigger.schedule_entry,
        sound: trigger.sound,
        anchor: trigger.anchor,
        offset_seconds: trigger.offset_seconds,
        tag: trigger.tag,
        message: trigger.message,
        priority: trigger.priority,
        duration_seconds: trigger.duration_seconds,
        show_banner: trigger.show_banner,
        is_active: trigger.is_active,
      });
    } finally {
      setBusy(false);
    }
  };
  const test = () => {
    // Audition the currently-selected sound (use the draft so a
    // pending sound swap is reflected before the operator saves).
    const asset = sounds.find((s) => s.id === draft.sound);
    if (!asset?.url) return;
    try {
      const audio = new Audio(asset.url);
      audio.volume = Math.max(0, Math.min(1, asset.volume));
      audio.play().catch(() => {});
    } catch { /* ignore */ }
  };

  // Visual dim when show_banner is off (Message / Priority /
  // Duration are still editable but no longer affect the live show).
  const dimWhenSilent = !draft.show_banner ? { opacity: 0.55 as const } : undefined;
  // Subtle gold tint on dirty rows so the operator can see at a
  // glance which rows have unsaved edits.
  const rowStyle = dirty ? { background: 'rgba(255, 210, 58, 0.06)' } : undefined;
  const inputFill: CSSProperties = { width: '100%', boxSizing: 'border-box', minWidth: 0 };
  return (
    <tr style={rowStyle}>
      <td>
        <select
          disabled={busy}
          value={draft.anchor}
          onChange={(e) => patch('anchor', e.target.value as TriggerAnchor)}
          style={inputFill}
        >
          {ANCHOR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </td>
      <td>
        <input
          type="number"
          disabled={busy}
          min={-3600}
          max={3600}
          step={5}
          value={draft.offset_seconds}
          onChange={(e) => patch('offset_seconds', e.target.value)}
          style={inputFill}
        />
      </td>
      <td>
        <select
          disabled={busy}
          value={draft.sound}
          onChange={(e) => patch('sound', Number(e.target.value))}
          style={inputFill}
        >
          {sounds.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </td>
      <td style={{ textAlign: 'center' }}>
        <input
          type="checkbox"
          disabled={busy}
          checked={draft.show_banner}
          onChange={(e) => patch('show_banner', e.target.checked)}
        />
      </td>
      <td style={dimWhenSilent}>
        <input
          type="text"
          disabled={busy}
          value={draft.tag}
          onChange={(e) => patch('tag', e.target.value)}
          placeholder="NOW PLAYING"
          maxLength={64}
          style={inputFill}
        />
      </td>
      <td style={dimWhenSilent}>
        <input
          type="text"
          disabled={busy}
          value={draft.message}
          onChange={(e) => patch('message', e.target.value)}
          placeholder="Banner headline"
          style={inputFill}
        />
      </td>
      <td style={dimWhenSilent}>
        <input
          type="text"
          disabled={busy}
          value={draft.subhead}
          onChange={(e) => patch('subhead', e.target.value)}
          placeholder="Optional subline"
          style={inputFill}
        />
      </td>
      <td style={dimWhenSilent}>
        <input
          type="number"
          disabled={busy}
          min={0}
          max={100}
          step={1}
          value={draft.priority}
          onChange={(e) => patch('priority', e.target.value)}
          style={inputFill}
        />
      </td>
      <td style={dimWhenSilent}>
        <input
          type="number"
          disabled={busy}
          min={1}
          max={120}
          step={1}
          value={draft.duration_seconds}
          onChange={(e) => patch('duration_seconds', e.target.value)}
          style={inputFill}
        />
      </td>
      <td style={{ textAlign: 'center' }}>
        <input
          type="checkbox"
          disabled={busy}
          checked={draft.is_active}
          onChange={(e) => patch('is_active', e.target.checked)}
        />
      </td>
      <td className="text-white-50" style={{ fontSize: '0.85em' }}>
        {trigger.last_fired_at
          ? new Date(trigger.last_fired_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          : '—'}
      </td>
      <td style={{ whiteSpace: 'nowrap', padding: '0.25rem' }}>
        {/* Icon-only cluster — all five buttons stay on one line and
          * the cell fits inside the trigger-table's 162px action column
          * without forcing a horizontal scroll. */}
        <div style={{ display: 'inline-flex', gap: '0.2rem', flexWrap: 'nowrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-sm btn-bloodmoon trigger-icon-btn"
            disabled={!dirty || busy}
            onClick={save}
            title={dirty ? 'Save pending edits' : 'No changes'}
            aria-label="Save"
          >
            <FontAwesomeIcon icon={faFloppyDisk} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-light trigger-icon-btn"
            disabled={!dirty || busy}
            onClick={reset}
            title="Discard pending edits"
            aria-label="Reset"
          >
            <FontAwesomeIcon icon={faRotateLeft} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-light trigger-icon-btn"
            disabled={busy}
            onClick={test}
            title="Play the currently-selected sound locally"
            aria-label="Test sound"
          >
            <FontAwesomeIcon icon={faPlay} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-light trigger-icon-btn"
            disabled={busy}
            onClick={duplicate}
            title="Duplicate trigger on the same entry — handy for -30/-20/-10s bells"
            aria-label="Duplicate"
          >
            <FontAwesomeIcon icon={faClone} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger trigger-icon-btn"
            disabled={busy}
            onClick={remove}
            title="Delete trigger"
            aria-label="Delete"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

function fmtDateTime(d: Date): string {
  return d.toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
