import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  obsApi,
  usePolledQuery,
  type Game,
  type GameItem,
  type GameItemAsset,
  type GameObjective,
  type ObjectiveStatus,
  type ScheduleEntry,
} from '@/lib/obsApi';
import { onObjectivesChanged } from '@/lib/objectiveBus';

/** A drop-zone wrapper so a tile can be dropped into a section even when the
 *  pointer is over empty space within it. */
function DroppableContainer({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`drop-container${className ? ` ${className}` : ''}`}
      data-over={isOver || undefined}
    >
      {children}
    </div>
  );
}

/** A draggable wrapper around an objective tile — a grip handle starts the drag
 *  so clicking the tile itself still toggles status / opens the editor. */
function SortableTile({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      className="sortable-tile"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 20 : undefined,
      }}
    >
      <span className="drag-grip" title="Drag to reorder" {...attributes} {...listeners}>
        ⠿
      </span>
      {children}
    </div>
  );
}

/**
 * Objective library editor. Per-game objectives are the run milestones used as
 * the timer's splits (`/control/timer`) and shown on the omnibar's
 * `objective-checklist` panel. Pick any game to curate its library; when the
 * picked game is the live ("Currently Playing") one, you can also mark its
 * objectives obtained/skipped for the run from here.
 *
 * The free-text "current objective" overlay control still lives in
 * `/control/omnibar`.
 */
export function ObjectivesControl() {
  // Bumped after any edit (and on cross-tab bus pings) to force an immediate
  // re-poll of the *selected* game, so a change shows instantly.
  const [refreshTick, setRefreshTick] = useState(0);
  const bump = useCallback(() => setRefreshTick((t) => t + 1), []);
  // The picker list only needs id/title; it rarely changes and is heavy
  // (whole catalog), so poll it slowly and NOT on every edit.
  const { data: games } = usePolledQuery(obsApi.games, 30000);
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, 5000, [refreshTick]);
  const liveEntry = cp?.schedule_entry_detail ?? null;
  const liveGameId = liveEntry?.game?.id ?? null;

  // Edits from other tabs / the timer broadcast over the bus; refresh on those
  // too (the bus never notifies the originating tab — `bump` covers local ones).
  useEffect(() => onObjectivesChanged(bump), [bump]);

  // Optional `?game=<id>` deep-link, used by e.g. /control/schedule's
  // objective-count link so picking the count from the schedule lands
  // on that game directly. Takes precedence over the live-game default
  // until the operator changes the picker; we strip it from the URL on
  // first apply so subsequent navigation doesn't get stuck on the
  // original target.
  const [searchParams, setSearchParams] = useSearchParams();
  const queryGameId = (() => {
    const raw = searchParams.get('game');
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  })();

  const [selectedId, setSelectedId] = useState<number | null>(queryGameId);

  // Default to the live game once data lands; the operator can switch to any
  // other game from the picker. A `?game=<id>` query param wins over the
  // live default — apply once, then drop the param.
  useEffect(() => {
    if (queryGameId != null) {
      setSelectedId(queryGameId);
      // Strip the param after applying so future picker changes aren't
      // overridden if the user reloads / shares the cleaned-up URL.
      const next = new URLSearchParams(searchParams);
      next.delete('game');
      setSearchParams(next, { replace: true });
      return;
    }
    if (selectedId != null) return;
    if (liveGameId != null) setSelectedId(liveGameId);
    else if (games && games.length) setSelectedId(games[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryGameId, selectedId, liveGameId, games]);

  // Only the *selected* game's detail is polled on edit — one game is ~30ms vs
  // ~250ms+ for the whole catalog, so edits stay snappy regardless of catalog
  // size.
  const { data: game } = usePolledQuery(
    () => (selectedId != null ? obsApi.game(selectedId) : Promise.resolve(null)),
    15000,
    [selectedId, refreshTick],
  );
  // Per-run status marking only applies when the selected game is the live one.
  const entry = game && liveGameId === game.id ? liveEntry : null;

  return (
    <div className="control-card">
      <h2>Objective library</h2>
      <p className="text-white-50">
        Per-game run milestones (e.g. "Reach first dungeon", "Climb Death Mountain", "Beat
        Ganon"). Used as the timer's splits in{' '}
        <a className="text-info" href="/control/timer">
          Timer
        </a>{' '}
        and shown on the omnibar's <code>objective-checklist</code> panel.
        {entry && ' This game is live — clicking a tile marks it obtained for the run.'}
      </p>

      <label className="d-flex flex-column mb-3" style={{ maxWidth: 420 }}>
        <small className="text-white-50">Game</small>
        <select
          className="form-select"
          value={selectedId ?? ''}
          onChange={(e) => setSelectedId(Number(e.target.value))}
        >
          {!games && <option value="">Loading…</option>}
          {games?.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
              {g.id === liveGameId ? ' — LIVE' : ''}
            </option>
          ))}
        </select>
      </label>

      {game ? (
        <ObjectiveLibrary game={game} entry={entry} onChanged={bump} />
      ) : (
        <p className="text-white-50">
          No games yet. Add one in{' '}
          <a className="text-info" href="/control/games">
            Games
          </a>
          .
        </p>
      )}
    </div>
  );
}

const OBJECTIVE_CATEGORIES = [
  ['story', 'Story'],
  ['dungeon', 'Dungeon'],
  ['boss', 'Boss'],
  ['item-get', 'Item get'],
  ['side-quest', 'Side quest'],
  ['100%', '100%'],
  ['other', 'Other'],
] as const;

const categoryLabel = (cat: string): string =>
  OBJECTIVE_CATEGORIES.find(([v]) => v === cat)?.[1] || cat || 'Other';

/** Per-game objective library + (when live) per-run status grid. Tiles are
 *  coloured when obtained, greyed when outstanding, dimmed/struck when skipped.
 *  With a live `entry`, clicking a tile toggles obtained↔outstanding and a ⏭
 *  hover-action toggles skipped; without one, clicking opens the editor. ✎/⧉/✕
 *  manage the library definition itself. */
function ObjectiveLibrary({
  game,
  entry,
  onChanged,
}: {
  game: Game;
  entry: ScheduleEntry | null;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<GameObjective | null>(null);
  // Section label currently being renamed (+ its draft text).
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  // Optimistic overrides so a drag (reorder, or move to another section) shows
  // instantly; each entry is dropped once the server reports that value.
  const [orderOverrides, setOrderOverrides] = useState<Record<number, number>>({});
  const [fieldOverrides, setFieldOverrides] = useState<{
    group: Record<number, string>;
    category: Record<number, string>;
  }>({ group: {}, category: {} });
  // Live working arrangement during a drag: containerKey -> ordered ids.
  const [working, setWorking] = useState<Map<string, number[]> | null>(null);
  const workingRef = useRef<Map<string, number[]> | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Clear overrides the server has caught up to (leave pending ones, so an
  // in-flight poll with the old value can't revert the optimistic move).
  useEffect(() => {
    const objs = game.objectives;
    setOrderOverrides((prev) => {
      if (!Object.keys(prev).length) return prev;
      const next = { ...prev };
      let changed = false;
      for (const o of objs) if (next[o.id] === o.order) { delete next[o.id]; changed = true; }
      return changed ? next : prev;
    });
    setFieldOverrides((prev) => {
      if (!Object.keys(prev.group).length && !Object.keys(prev.category).length) return prev;
      const group = { ...prev.group };
      const category = { ...prev.category };
      let changed = false;
      for (const o of objs) {
        if (group[o.id] === o.group) { delete group[o.id]; changed = true; }
        if (category[o.id] === o.category) { delete category[o.id]; changed = true; }
      }
      return changed ? { group, category } : prev;
    });
  }, [game]);

  const objOrder = (o: GameObjective) => orderOverrides[o.id] ?? o.order;
  const effGroup = (o: GameObjective) => fieldOverrides.group[o.id] ?? o.group;
  const effCat = (o: GameObjective) => fieldOverrides.category[o.id] ?? o.category;

  const objectives = game.objectives
    .slice()
    .sort((a, b) => objOrder(a) - objOrder(b) || a.name.localeCompare(b.name));
  const obtainedIds = new Set(entry?.obtained_objective_ids ?? []);
  const skippedIds = new Set(entry?.skipped_objective_ids ?? []);
  const nextOrder = objectives.reduce((max, o) => Math.max(max, objOrder(o)), -1) + 1;
  const obtainedCount = objectives.filter((o) => obtainedIds.has(o.id)).length;
  const activeCount = objectives.filter((o) => !skippedIds.has(o.id)).length;

  // Cluster into run-sections by effective `group`, falling back to the
  // category label when blank. Insertion order follows objective order, so
  // sections appear in the order their first objective does.
  const groupLabel = (o: GameObjective) => effGroup(o).trim() || categoryLabel(effCat(o));
  const sections: { idx: number; label: string; items: GameObjective[] }[] = [];
  const byLabel = new Map<string, GameObjective[]>();
  for (const o of objectives) {
    const key = groupLabel(o);
    let bucket = byLabel.get(key);
    if (!bucket) {
      bucket = [];
      byLabel.set(key, bucket);
      sections.push({ idx: sections.length, label: key, items: bucket });
    }
    bucket.push(o);
  }
  // Distinct existing group names for the form's autocomplete.
  const existingGroups = Array.from(
    new Set(objectives.map((o) => effGroup(o).trim()).filter(Boolean)),
  );

  // What to set on an objective to make it land in a given section: a real
  // group section assigns that group; a category-fallback section clears the
  // group and sets the category.
  const computeAssign = (
    label: string,
    secItems: GameObjective[],
  ): { group?: string; category?: string } => {
    const catEntry = OBJECTIVE_CATEGORIES.find(([, lbl]) => lbl === label);
    const hasGroup = secItems.some((o) => effGroup(o).trim() !== '');
    if (catEntry && !hasGroup) return { group: '', category: catEntry[0] };
    return { group: label };
  };

  const idToObj = new Map<number, GameObjective>(objectives.map((o) => [o.id, o]));
  const activeObj =
    activeDragId && activeDragId.startsWith('obj:')
      ? idToObj.get(Number(activeDragId.slice(4))) ?? null
      : null;

  // Server-derived container -> ordered ids; `containers` is the working (drag)
  // copy mid-drag, else this base arrangement.
  const baseContainers = new Map<string, number[]>();
  sections.forEach((sec) => baseContainers.set(`cont:${sec.idx}`, sec.items.map((o) => o.id)));
  const containers = working ?? baseContainers;

  const statusOf = (id: number): ObjectiveStatus =>
    obtainedIds.has(id) ? 'obtained' : skippedIds.has(id) ? 'skipped' : 'outstanding';

  const setStatus = async (objectiveId: number, status: ObjectiveStatus) => {
    if (!entry) return;
    setBusy(true);
    setErr(null);
    try {
      await obsApi.setObjectiveStatus(entry.id, objectiveId, status);
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (o: GameObjective) => {
    if (!confirm(`Delete "${o.name}" from ${game.title}? This also clears it from any run.`)) {
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await obsApi.deleteObjective(o.id);
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Clone an objective server-side (all fields, unique "(copy)" name) and open
  // the edit form on the copy so the operator can tweak it.
  const duplicate = async (o: GameObjective) => {
    setBusy(true);
    setErr(null);
    try {
      const copy = await obsApi.duplicateObjective(o.id);
      setAdding(false);
      setEditing(copy);
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Run persistence calls, surface errors, and refresh once they land.
  const runOps = async (ops: Promise<unknown>[]) => {
    if (ops.length === 0) return;
    setBusy(true);
    setErr(null);
    try {
      await Promise.all(ops);
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Renumber a reordered list to a contiguous run from its min order; optimistic
  // override first, then persist only the rows that actually changed.
  const applyObjectiveOrder = (reordered: GameObjective[]) => {
    if (reordered.length === 0) return;
    const base = Math.min(...reordered.map((o) => objOrder(o)));
    const overrides: Record<number, number> = {};
    const ops: Promise<unknown>[] = [];
    reordered.forEach((o, p) => {
      overrides[o.id] = base + p;
      if (objOrder(o) !== base + p) ops.push(obsApi.updateObjective(o.id, { order: base + p }));
    });
    setOrderOverrides((prev) => ({ ...prev, ...overrides }));
    if (ops.length) void runOps(ops);
  };

  // Move an objective into another section (optimistic, then persisted).
  const applyFieldChange = (objId: number, assign: { group?: string; category?: string }) => {
    const patch: { group?: string; category?: string } = {};
    if (assign.group !== undefined) patch.group = assign.group;
    if (assign.category !== undefined) patch.category = assign.category;
    if (!Object.keys(patch).length) return;
    setFieldOverrides((prev) => ({
      group: assign.group !== undefined ? { ...prev.group, [objId]: assign.group } : prev.group,
      category:
        assign.category !== undefined
          ? { ...prev.category, [objId]: assign.category }
          : prev.category,
    }));
    void runOps([obsApi.updateObjective(objId, patch)]);
  };

  const onDragStart = (e: DragStartEvent) => {
    setActiveDragId(String(e.active.id));
    workingRef.current = null;
    setWorking(null);
  };

  const onDragCancel = () => {
    workingRef.current = null;
    setWorking(null);
    setActiveDragId(null);
  };

  // Live reparent while dragging, so the hovered section opens a gap.
  const onDragOver = (e: DragOverEvent) => {
    const a = String(e.active.id);
    if (!e.over || !a.startsWith('obj:')) return;
    const aid = Number(a.slice(4));
    const o = String(e.over.id);
    const prev = workingRef.current ?? baseContainers;
    const w = new Map<string, number[]>();
    prev.forEach((v, k) => w.set(k, v.slice()));
    let aKey: string | null = null;
    for (const [k, list] of w) if (list.includes(aid)) { aKey = k; break; }
    if (!aKey) return;
    let oKey: string | null = null;
    let overIndex = -1;
    if (o.startsWith('obj:')) {
      const oid = Number(o.slice(4));
      for (const [k, list] of w) {
        const i = list.indexOf(oid);
        if (i >= 0) { oKey = k; overIndex = i; break; }
      }
    } else if (o.startsWith('cont:')) {
      oKey = o;
      overIndex = w.get(o)?.length ?? 0;
    }
    if (!oKey) return;
    const aList = w.get(aKey)!;
    const from = aList.indexOf(aid);
    if (aKey === oKey) {
      const to = overIndex < 0 ? aList.length - 1 : overIndex;
      if (from !== to) { aList.splice(from, 1); aList.splice(to, 0, aid); }
    } else {
      aList.splice(from, 1);
      const oList = w.get(oKey)!;
      oList.splice(overIndex < 0 ? oList.length : overIndex, 0, aid);
    }
    workingRef.current = w;
    setWorking(w);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const a = String(e.active.id);
    const w = workingRef.current;
    workingRef.current = null;
    setWorking(null);
    setActiveDragId(null);
    if (!a.startsWith('obj:') || !w) return;
    const aid = Number(a.slice(4));
    let finalKey: string | null = null;
    for (const [k, list] of w) if (list.includes(aid)) { finalKey = k; break; }
    if (!finalKey) return;
    const sec = sections[Number(finalKey.slice('cont:'.length))];
    if (!sec) return;
    const orderedItems = (w.get(finalKey) ?? [])
      .map((id) => idToObj.get(id))
      .filter((x): x is GameObjective => Boolean(x));
    // Persist the final placement: section (group/category) then order within
    // the target section.
    applyFieldChange(aid, computeAssign(sec.label, sec.items));
    applyObjectiveOrder(orderedItems);
  };

  // Rename a group section: set the new group name on every objective in it
  // (optimistic, then persisted). Only offered for real group sections — not
  // the category-fallback buckets.
  const renameGroup = (sec: { label: string; items: GameObjective[] }, raw: string) => {
    const name = raw.trim();
    setRenaming(null);
    if (!name || name === sec.label) return;
    const overrides: Record<number, string> = {};
    const ops: Promise<unknown>[] = [];
    for (const o of sec.items) {
      overrides[o.id] = name;
      if (effGroup(o) !== name) ops.push(obsApi.updateObjective(o.id, { group: name }));
    }
    if (!ops.length) return;
    setFieldOverrides((prev) => ({ ...prev, group: { ...prev.group, ...overrides } }));
    void runOps(ops);
  };

  const renderTile = (o: GameObjective) => {
    const status = statusOf(o.id);
    return (
      <div key={o.id} className="obj-cell">
        <button
          disabled={busy}
          onClick={() =>
            entry
              ? setStatus(o.id, status === 'obtained' ? 'outstanding' : 'obtained')
              : setEditing(o)
          }
          className="obj-tile"
          data-status={status}
          title={
            entry
              ? `${o.name} — click to ${status === 'obtained' ? 'clear' : 'mark obtained'}`
              : `${o.name} — click to edit`
          }
        >
          {o.image_url ? (
            <img src={o.image_url} alt={o.name} />
          ) : (
            <div className="obj-placeholder">{o.name.slice(0, 3)}</div>
          )}
          <div className="obj-name">
            {o.linked_item ? '🔗 ' : ''}
            {o.name}
          </div>
        </button>
        <div className="obj-actions">
          {entry && (
            <button
              type="button"
              className="obj-action"
              title={status === 'skipped' ? 'Un-skip' : 'Skip this run'}
              disabled={busy}
              onClick={() => setStatus(o.id, status === 'skipped' ? 'outstanding' : 'skipped')}
            >
              ⏭
            </button>
          )}
          <button
            type="button"
            className="obj-action"
            title="Edit objective"
            onClick={() => {
              setAdding(false);
              setEditing(o);
            }}
          >
            ✎
          </button>
          <button
            type="button"
            className="obj-action"
            title="Duplicate objective"
            disabled={busy}
            onClick={() => duplicate(o)}
          >
            ⧉
          </button>
          <button
            type="button"
            className="obj-action"
            title="Delete objective"
            disabled={busy}
            onClick={() => remove(o)}
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <header className="d-flex justify-content-between align-items-baseline">
        <h3 className="m-0 fs-6">
          {game.title}{' '}
          <span className="text-white-50">
            {entry
              ? `(${obtainedCount} / ${activeCount} obtained)`
              : `(${objectives.length} objective${objectives.length === 1 ? '' : 's'})`}
          </span>
        </h3>
        {!adding && !editing && (
          <button className="btn btn-bloodmoon btn-sm" onClick={() => setAdding(true)}>
            + Add objective
          </button>
        )}
      </header>
      <p className="text-white-50 small mt-1 mb-2">
        {entry
          ? 'Click a tile to mark it obtained (fires a pickup celebration); use ⏭ to skip one that isn’t needed this run.'
          : 'This game isn’t live — editing the library only. Mark objectives obtained/skipped from the Timer or when the game is Currently Playing.'}
      </p>

      {(adding || editing) && (
        <div className="obj-modal-backdrop">
          <div className="obj-modal" role="dialog" aria-modal="true">
            <div className="obj-modal-head">
              <strong>{editing ? `Edit — ${editing.name}` : 'Add objective'}</strong>
              <button
                type="button"
                className="obj-action"
                title="Close"
                onClick={() => {
                  setAdding(false);
                  setEditing(null);
                }}
              >
                ✕
              </button>
            </div>
            <ObjectiveForm
              gameId={game.id}
              nextOrder={nextOrder}
              groups={existingGroups}
              items={game.items}
              initial={editing}
              onCancel={() => {
                setAdding(false);
                setEditing(null);
              }}
              onDone={() => {
                setAdding(false);
                setEditing(null);
                onChanged();
              }}
            />
          </div>
        </div>
      )}

      {err && <p className="text-danger small mt-2">{err}</p>}

      {objectives.length === 0 ? (
        <p className="text-white-50 small mt-2">
          No objectives defined for this game yet — add one above.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragCancel={onDragCancel}
          onDragEnd={handleDragEnd}
        >
          {sections.map((sec) => {
            const ids = containers.get(`cont:${sec.idx}`) ?? [];
            const tiles = ids
              .map((id) => idToObj.get(id))
              .filter((x): x is GameObjective => Boolean(x));
            // A "real" group (renameable) vs a category-fallback bucket.
            const isGroup = sec.items.some((o) => effGroup(o).trim() !== '');
            return (
              <section key={sec.idx} className="obj-section">
                <h4 className="obj-section-head d-flex align-items-center gap-2">
                  {renaming === sec.label ? (
                    <>
                      <input
                        className="form-control form-control-sm"
                        style={{ maxWidth: 220, textTransform: 'none' }}
                        autoFocus
                        value={renameDraft}
                        onChange={(e) => setRenameDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') renameGroup(sec, renameDraft);
                          else if (e.key === 'Escape') setRenaming(null);
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-bloodmoon py-0"
                        onClick={() => renameGroup(sec, renameDraft)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-white-50 py-0"
                        onClick={() => setRenaming(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span>{sec.label}</span>
                      <span className="text-white-50"> · {tiles.length}</span>
                      {isGroup && (
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-info py-0 px-1"
                          title="Rename this group"
                          onClick={() => {
                            setRenameDraft(sec.label);
                            setRenaming(sec.label);
                          }}
                        >
                          ✎
                        </button>
                      )}
                    </>
                  )}
                </h4>
                <DroppableContainer id={`cont:${sec.idx}`} className="obj-grid">
                  <SortableContext
                    items={ids.map((id) => `obj:${id}`)}
                    strategy={rectSortingStrategy}
                  >
                    {tiles.map((o) => (
                      <SortableTile key={o.id} id={`obj:${o.id}`}>
                        {renderTile(o)}
                      </SortableTile>
                    ))}
                  </SortableContext>
                </DroppableContainer>
              </section>
            );
          })}
          <DragOverlay dropAnimation={null}>
            {activeObj ? (
              <div className="obj-cell drag-overlay" style={{ width: 110 }}>
                <div className="obj-tile" data-status={statusOf(activeObj.id)}>
                  {activeObj.image_url ? (
                    <img src={activeObj.image_url} alt={activeObj.name} />
                  ) : (
                    <div className="obj-placeholder">{activeObj.name.slice(0, 3)}</div>
                  )}
                  <div className="obj-name">
                    {activeObj.linked_item ? '🔗 ' : ''}
                    {activeObj.name}
                  </div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <style>{`
        .obj-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1050;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 5vh 1rem 2rem;
          overflow-y: auto;
        }
        .obj-modal {
          width: 100%;
          max-width: min(720px, 94vw);
          background: #15171c;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 10px;
          box-shadow: 0 16px 50px rgba(0,0,0,0.55);
        }
        .obj-modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.6rem 0.9rem 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }
        .obj-modal form { margin-top: 0 !important; }
        .sortable-tile { position: relative; }
        .drag-grip {
          position: absolute;
          top: 2px;
          left: 2px;
          z-index: 4;
          cursor: grab;
          opacity: 0;
          transition: opacity 0.15s;
          font-size: 0.8rem;
          line-height: 1;
          padding: 1px 3px;
          background: rgba(0,0,0,0.65);
          border-radius: 4px;
          color: #fff;
        }
        .drag-grip:active { cursor: grabbing; }
        .sortable-tile:hover > .drag-grip { opacity: 1; }
        .drop-container[data-over] {
          outline: 2px dashed rgba(127,180,255,0.7);
          outline-offset: 2px;
          border-radius: 6px;
        }
        .obj-section { margin-top: 0.75rem; }
        .obj-section-head {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #ffcc00;
          margin: 0 0 0.25rem;
          padding-bottom: 0.2rem;
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }
        .obj-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .obj-cell { position: relative; }
        .obj-tile {
          width: 100%;
          background: rgba(0,0,0,0.3);
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          padding: 0.5rem;
          color: #fff;
          cursor: pointer;
          transition: all 0.15s;
        }
        .obj-tile:hover { border-color: rgba(255,255,255,0.4); }
        .obj-tile[data-status="obtained"] {
          background: linear-gradient(45deg, rgba(20, 80, 30, 0.5), rgba(40, 120, 50, 0.5));
          border-color: #7fff7f;
          box-shadow: 0 0 12px rgba(127,255,127,0.3);
        }
        .obj-tile[data-status="outstanding"] {
          opacity: 0.45;
          filter: grayscale(80%);
        }
        .obj-tile[data-status="skipped"] {
          opacity: 0.3;
          border-style: dashed;
        }
        .obj-tile[data-status="skipped"] .obj-name {
          text-decoration: line-through;
        }
        .obj-tile img, .obj-placeholder {
          width: 100%;
          aspect-ratio: 1;
          object-fit: contain;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Bungee', sans-serif;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }
        .obj-name { font-size: 0.75rem; text-align: center; margin-top: 0.25rem; line-height: 1.1; }
        .obj-actions {
          position: absolute;
          top: 2px;
          right: 2px;
          display: flex;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .obj-cell:hover .obj-actions { opacity: 1; }
        .obj-action {
          width: 22px;
          height: 22px;
          line-height: 1;
          padding: 0;
          border: none;
          border-radius: 4px;
          background: rgba(0,0,0,0.65);
          color: #fff;
          cursor: pointer;
          font-size: 0.8rem;
        }
        .obj-action:hover { background: rgba(180,30,30,0.9); }
        .obj-asset-picker {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
          gap: 0.35rem;
          max-height: 220px;
          overflow-y: auto;
          padding: 0.4rem;
          background: rgba(0,0,0,0.25);
          border-radius: 6px;
          margin-top: 0.25rem;
        }
        .obj-asset-swatch {
          background: rgba(255,255,255,0.05);
          border: 2px solid transparent;
          border-radius: 4px;
          padding: 2px;
          cursor: pointer;
        }
        .obj-asset-swatch[data-selected="true"] { border-color: #7fff7f; }
        .obj-asset-swatch img { width: 100%; aspect-ratio: 1; object-fit: contain; }
      `}</style>
    </div>
  );
}

function ObjectiveForm({
  gameId,
  nextOrder,
  groups,
  items,
  initial,
  onCancel,
  onDone,
}: {
  gameId: number;
  nextOrder: number;
  groups: string[];
  items: GameItem[];
  initial: GameObjective | null;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '');
  const [category, setCategory] = useState(initial?.category || 'story');
  const [group, setGroup] = useState(initial?.group ?? '');
  const [linkedItem, setLinkedItem] = useState<number | null>(initial?.linked_item ?? null);
  const [assets, setAssets] = useState<GameItemAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    obsApi
      .objectiveAssets(gameId)
      .then((res) => {
        if (!cancelled) setAssets(res.images);
      })
      .catch(() => {
        /* picker is optional — the free-text URL field still works */
      });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      // Only "item get" objectives carry a linked item; clear it otherwise.
      const linked = category === 'item-get' ? linkedItem : null;
      if (initial) {
        await obsApi.updateObjective(initial.id, {
          name: name.trim(),
          image_url: imageUrl.trim(),
          category,
          group: group.trim(),
          linked_item: linked,
        });
      } else {
        await obsApi.createObjective({
          game: gameId,
          name: name.trim(),
          image_url: imageUrl.trim(),
          category,
          group: group.trim(),
          linked_item: linked,
          order: nextOrder,
        });
      }
      onDone();
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-2 p-3" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
      <div className="d-flex gap-2 flex-wrap align-items-end">
        <div style={{ minWidth: 200, flex: 1 }}>
          <label className="d-block small text-white-50">Objective</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Collect all heart pieces"
            className="form-control form-control-sm"
          />
        </div>
        <div style={{ minWidth: 260, flex: 1 }}>
          <label className="d-block small text-white-50">Image URL (optional)</label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="/assets/img/game-franchise/legend-of-zelda/…"
            className="form-control form-control-sm"
          />
        </div>
        <div>
          <label className="d-block small text-white-50">Category</label>
          <select
            className="form-select form-select-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {OBJECTIVE_CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="d-block small text-white-50">Group (section)</label>
          <input
            list="objective-group-options"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="e.g. The Dark World"
            className="form-control form-control-sm"
          />
          <datalist id="objective-group-options">
            {groups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>
        {category === 'item-get' && (
          <div style={{ minWidth: 220 }}>
            <label className="d-block small text-white-50">Linked item</label>
            <select
              className="form-select form-select-sm"
              value={linkedItem ?? ''}
              onChange={(e) => setLinkedItem(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— none —</option>
              {items
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
            </select>
          </div>
        )}
        <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
          {initial ? 'Save' : 'Add objective'}
        </button>
        <button type="button" className="btn btn-outline-light btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>

      {err && <p className="text-danger small mt-2 mb-0">{err}</p>}

      {assets.length > 0 && (
        <div className="mt-2">
          <label className="d-block small text-white-50">
            Pick a bundled sprite ({assets.length} available)
          </label>
          <div className="obj-asset-picker">
            {assets.map((a) => (
              <button
                type="button"
                key={a.url}
                className="obj-asset-swatch"
                data-selected={a.url === imageUrl}
                title={a.filename}
                onClick={() => setImageUrl(a.url)}
              >
                <img src={a.url} alt={a.filename} />
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
