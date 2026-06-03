import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  obsApi,
  usePolledQuery,
  type GameItem,
  type GameItemAsset,
  type GameItemSet,
  type ItemSetKind,
} from '@/lib/obsApi';

// Same set of ids regardless of order.
const sameIds = (a: number[], b: number[]) =>
  a.length === b.length && [...a].sort().join(',') === [...b].sort().join(',');

// Drag collisions. A set-cluster drag only targets other clusters; an item
// drag targets other items AND container drop-zones (so it can land in an
// empty cluster/standalone area).
const itemsCollision: CollisionDetection = (args) => {
  const allow = String(args.active.id).startsWith('setc:')
    ? ['setc:']
    : ['item:', 'cont:'];
  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter((c) =>
      allow.some((p) => String(c.id).startsWith(p)),
    ),
  });
};

/** A drop-zone wrapper so an item can be dropped into a container (cluster
 *  body or standalone area) even when it's empty. */
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

/** A draggable wrapper around an item tile — grip handle starts the drag so
 *  clicking the tile still toggles collection. */
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

/** A draggable wrapper around a whole set cluster (drag via the grip). */
function SortableCluster({
  id,
  kind,
  children,
}: {
  id: string;
  kind: ItemSetKind;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      className="link-cluster"
      data-kind={kind}
      style={{
        // Translate only — clusters vary in width, and CSS.Transform would
        // scale (stretch) the dragged cluster to the target slot's size.
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 15 : undefined,
      }}
    >
      <span className="drag-grip cluster-grip" title="Drag to reorder set" {...attributes} {...listeners}>
        ⠿
      </span>
      {children}
    </div>
  );
}

const CATEGORIES = [
  ['weapon', 'Weapon'],
  ['song', 'Song'],
  ['heart-piece', 'Heart piece'],
  ['key-item', 'Key item'],
  ['dungeon-item', 'Dungeon item'],
  ['other', 'Other'],
] as const;

const SET_KINDS: readonly (readonly [ItemSetKind, string])[] = [
  ['set', 'Related set'],
  ['upgrade', 'Upgrade chain'],
  ['trade', 'Trade sequence'],
] as const;

export function ItemsControl() {
  // Bumping this forces an immediate re-poll of currently-playing, so a
  // collect/clear/reset shows instantly instead of waiting up to 2s.
  const [refreshTick, setRefreshTick] = useState(0);
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, 2000, [refreshTick]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<GameItem | null>(null);
  // Optimistic order overrides: a drag/reorder applies here immediately so the
  // UI doesn't flash back to the server order before the persisted change is
  // polled back. Each entry is dropped once the server confirms that value.
  const [orderOverrides, setOrderOverrides] = useState<{
    items: Record<number, number>;
    sets: Record<number, number>;
  }>({ items: {}, sets: {} });
  // Optimistic group/category overrides — dragging an item to another section
  // updates these immediately so it doesn't flash back before the poll lands.
  const [fieldOverrides, setFieldOverrides] = useState<{
    group: Record<number, string>;
    category: Record<number, string>;
    setIds: Record<number, number[]>;
  }>({ group: {}, category: {}, setIds: {} });
  // Live working arrangement during a drag: containerKey -> ordered item ids.
  // Null except mid-drag; drives the make-way animation across containers.
  const [working, setWorking] = useState<Map<string, number[]> | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  // The item currently being dragged, rendered as a cursor-following ghost.
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  // Mirror of `working` for synchronous reads in drag handlers (state is async).
  const workingRef = useRef<Map<string, number[]> | null>(null);

  // Clear overrides the server has caught up to (leave pending ones, so an
  // in-flight poll with the old order can't revert the optimistic move).
  useEffect(() => {
    const se = cp?.schedule_entry_detail;
    const gameItems = se?.game?.items ?? [];
    const gameSets = se?.game?.item_sets ?? [];
    setOrderOverrides((prev) => {
      if (!Object.keys(prev.items).length && !Object.keys(prev.sets).length) return prev;
      const items = { ...prev.items };
      const sets = { ...prev.sets };
      let changed = false;
      for (const it of gameItems) if (items[it.id] === it.order) { delete items[it.id]; changed = true; }
      for (const s of gameSets) if (sets[s.id] === s.order) { delete sets[s.id]; changed = true; }
      return changed ? { items, sets } : prev;
    });
    setFieldOverrides((prev) => {
      if (
        !Object.keys(prev.group).length &&
        !Object.keys(prev.category).length &&
        !Object.keys(prev.setIds).length
      ) {
        return prev;
      }
      const group = { ...prev.group };
      const category = { ...prev.category };
      const setIds = { ...prev.setIds };
      let changed = false;
      for (const it of gameItems) {
        if (group[it.id] === it.group) { delete group[it.id]; changed = true; }
        if (category[it.id] === it.category) { delete category[it.id]; changed = true; }
        if (setIds[it.id] && sameIds(setIds[it.id], it.set_ids)) { delete setIds[it.id]; changed = true; }
      }
      return changed ? { group, category, setIds } : prev;
    });
  }, [cp]);

  const entry = cp?.schedule_entry_detail ?? null;

  if (!entry) {
    return (
      <div className="control-card">
        <h2>Items collected</h2>
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

  const game = entry.game;
  if (!game) {
    return (
      <div className="control-card">
        <h2>Items collected</h2>
        <p className="text-warning">
          The current schedule entry has no game attached, so it has no item checklist.
        </p>
      </div>
    );
  }

  // Effective order = optimistic override if present, else the server value.
  const itemOrder = (i: GameItem) => orderOverrides.items[i.id] ?? i.order;
  const setOrderOf = (s: GameItemSet) => orderOverrides.sets[s.id] ?? s.order;

  const items = game.items
    .slice()
    .sort((a, b) => itemOrder(a) - itemOrder(b) || a.name.localeCompare(b.name));
  const collectedIds = new Set(entry.collected_item_ids);
  const collectedCounts = entry.collected_item_counts ?? {};
  const nextOrder = items.reduce((max, i) => Math.max(max, i.order), -1) + 1;

  // Cluster items into sections: by their `group` label, falling back to the
  // category label when blank. Map insertion order follows item.order, so
  // groups appear in the order their first item was added/imported.
  const effGroup = (i: GameItem) => fieldOverrides.group[i.id] ?? i.group;
  const effCat = (i: GameItem) => fieldOverrides.category[i.id] ?? i.category;
  const effSetIds = (i: GameItem) => fieldOverrides.setIds[i.id] ?? i.set_ids;
  const groupLabel = (i: GameItem) =>
    effGroup(i).trim() ||
    CATEGORIES.find(([v]) => v === effCat(i))?.[1] ||
    effCat(i) ||
    'Other';
  const groups: { label: string; items: GameItem[] }[] = [];
  const byLabel = new Map<string, GameItem[]>();
  for (const it of items) {
    const key = groupLabel(it);
    let bucket = byLabel.get(key);
    if (!bucket) {
      bucket = [];
      byLabel.set(key, bucket);
      groups.push({ label: key, items: bucket });
    }
    bucket.push(it);
  }
  // Distinct existing group (section) names for the form's autocomplete.
  const existingGroups = Array.from(
    new Set(items.map((i) => i.group.trim()).filter(Boolean)),
  );
  // The game's item-set library, in display order — items cluster into these.
  const itemSets = (game.item_sets ?? [])
    .slice()
    .sort((a, b) => setOrderOf(a) - setOrderOf(b) || a.name.localeCompare(b.name));
  // Item name lookup, for naming "unlocks together with" partners on tiles.
  const itemNameById = new Map(items.map((i) => [i.id, i.name]));

  const toggle = async (itemId: number) => {
    setBusy(true);
    setErr(null);
    try {
      await obsApi.toggleCollected(entry.id, itemId);
      setRefreshTick((n) => n + 1);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const adjust = async (itemId: number, delta: number) => {
    setBusy(true);
    setErr(null);
    try {
      await obsApi.adjustCollected(entry.id, itemId, delta);
      setRefreshTick((n) => n + 1);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: GameItem) => {
    if (!confirm(`Delete "${item.name}" from ${game.title}? This also clears it from any run.`)) return;
    setBusy(true);
    setErr(null);
    try {
      await obsApi.deleteGameItem(item.id);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Clone an item server-side (all fields, under a unique "(copy)" name) and
  // immediately open the edit form on the new copy so the operator can tweak it.
  const duplicate = async (item: GameItem) => {
    setBusy(true);
    setErr(null);
    try {
      const copy = await obsApi.duplicateGameItem(item.id);
      setAdding(false);
      setEditing(copy);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const renameSet = async (set: GameItemSet, name: string, kind: ItemSetKind) => {
    const nm = name.trim();
    if (!nm || (nm === set.name && kind === set.kind)) return;
    setBusy(true);
    setErr(null);
    try {
      await obsApi.updateItemSet(set.id, { name: nm, kind });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const toggleSetOverlay = async (set: GameItemSet) => {
    setBusy(true);
    setErr(null);
    try {
      await obsApi.updateItemSet(set.id, { show_in_overlay: !set.show_in_overlay });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const removeSet = async (set: GameItemSet) => {
    if (
      !confirm(
        `Delete the "${set.name}" set? Items stay, but lose this grouping.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await obsApi.deleteItemSet(set.id);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Renumber a reordered list to a contiguous run: set optimistic overrides so
  // the UI updates instantly (no flash back to server order), then persist the
  // rows that actually changed. Shared by the ◀▶ buttons and drag-drop.
  const applyItemOrder = (reordered: GameItem[]) => {
    const base = Math.min(...reordered.map((m) => m.order));
    const overrides: Record<number, number> = {};
    const ops: Promise<unknown>[] = [];
    reordered.forEach((m, p) => {
      overrides[m.id] = base + p;
      if (m.order !== base + p) ops.push(obsApi.updateGameItem(m.id, { order: base + p }));
    });
    if (ops.length === 0) return;
    setOrderOverrides((prev) => ({ ...prev, items: { ...prev.items, ...overrides } }));
    void runOps(ops);
  };

  const applySetOrder = (reordered: GameItemSet[]) => {
    const base = Math.min(...reordered.map((s) => s.order));
    const overrides: Record<number, number> = {};
    const ops: Promise<unknown>[] = [];
    reordered.forEach((s, p) => {
      overrides[s.id] = base + p;
      if (s.order !== base + p) ops.push(obsApi.updateItemSet(s.id, { order: base + p }));
    });
    if (ops.length === 0) return;
    setOrderOverrides((prev) => ({ ...prev, sets: { ...prev.sets, ...overrides } }));
    void runOps(ops);
  };

  // Move an item into another section by setting its group/category to match
  // the target section (optimistic, then persisted).
  const applyFieldChange = (
    itemId: number,
    assign: { group?: string; category?: string },
  ) => {
    const patch: { group?: string; category?: string } = {};
    if (assign.group !== undefined) patch.group = assign.group;
    if (assign.category !== undefined) patch.category = assign.category;
    if (Object.keys(patch).length === 0) return;
    setFieldOverrides((prev) => ({
      group:
        assign.group !== undefined ? { ...prev.group, [itemId]: assign.group } : prev.group,
      category:
        assign.category !== undefined
          ? { ...prev.category, [itemId]: assign.category }
          : prev.category,
      setIds: prev.setIds,
    }));
    void runOps([obsApi.updateGameItem(itemId, patch)]);
  };

  // Move one member of a cluster one slot earlier/later (◀▶ fallback).
  const moveInChain = (members: GameItem[], index: number, dir: number) => {
    const target = index + dir;
    if (target < 0 || target >= members.length) return;
    const reordered = members.slice();
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    applyItemOrder(reordered);
  };

  // Reorder a set relative to the other sets shown in the same section.
  const moveSet = (sectionSets: GameItemSet[], set: GameItemSet, dir: number) => {
    const idx = sectionSets.findIndex((s) => s.id === set.id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= sectionSets.length) return;
    const reordered = sectionSets.slice();
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(target, 0, moved);
    applySetOrder(reordered);
  };

  // Clear every collected item for this run, then re-apply the game's
  // starting items (server-side, via reset_collected).
  const resetToStart = async () => {
    if (!confirm('Clear all collected items for this run and re-apply the starting items?')) return;
    setBusy(true);
    setErr(null);
    try {
      await obsApi.resetCollected(entry.id);
      setRefreshTick((n) => n + 1);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Run a batch of persistence calls, surfacing errors and forcing a refresh.
  const runOps = async (ops: Promise<unknown>[]) => {
    if (ops.length === 0) return;
    setBusy(true);
    setErr(null);
    try {
      await Promise.all(ops);
      setRefreshTick((n) => n + 1);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const renderTile = (
    item: GameItem,
    reorder?: { canPrev: boolean; canNext: boolean; onPrev: () => void; onNext: () => void },
  ) => {
    const count = collectedCounts[String(item.id)] ?? 0;
    const collected = item.countable ? count > 0 : collectedIds.has(item.id);
    // Names of items this one is collected together with (unlocks_with).
    const tiedNames = (item.unlocks_with_ids ?? [])
      .map((id) => itemNameById.get(id))
      .filter((n): n is string => Boolean(n));
    return (
      <div key={item.id} className="item-cell">
        <button
          disabled={busy}
          onClick={() => (item.countable ? adjust(item.id, 1) : toggle(item.id))}
          className="item-tile"
          data-collected={collected}
          title={
            item.countable
              ? `${item.name} — click to add one (×${count})`
              : `${item.name} — click to toggle collected`
          }
        >
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} />
          ) : (
            <div className="item-placeholder">{item.name.slice(0, 3)}</div>
          )}
          <div className="item-name">{item.name}</div>
          {item.countable && count > 0 && <div className="item-count">×{count}</div>}
          {tiedNames.length > 0 && (
            <span
              className="item-link-badge"
              title={`Collected together with: ${tiedNames.join(', ')}`}
            >
              ⇄
            </span>
          )}
        </button>
        <div className="item-actions">
          {reorder && (
            <>
              <button
                type="button"
                className="item-action"
                title="Move earlier in chain"
                disabled={busy || !reorder.canPrev}
                onClick={reorder.onPrev}
              >
                ◀
              </button>
              <button
                type="button"
                className="item-action"
                title="Move later in chain"
                disabled={busy || !reorder.canNext}
                onClick={reorder.onNext}
              >
                ▶
              </button>
            </>
          )}
          {item.countable && (
            <button
              type="button"
              className="item-action"
              title="Remove one"
              disabled={busy || count === 0}
              onClick={() => adjust(item.id, -1)}
            >
              −
            </button>
          )}
          <button
            type="button"
            className="item-action"
            title="Edit item"
            onClick={() => {
              setAdding(false);
              setEditing(item);
            }}
          >
            ✎
          </button>
          <button
            type="button"
            className="item-action"
            title="Duplicate item"
            disabled={busy}
            onClick={() => duplicate(item)}
          >
            ⧉
          </button>
          <button
            type="button"
            className="item-action"
            title="Delete item"
            disabled={busy}
            onClick={() => remove(item)}
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  // What to set on an item to make it land in a given section: a real group
  // section assigns that group; a category-fallback section clears group and
  // sets the category.
  const computeAssign = (label: string, secItems: GameItem[]): { group?: string; category?: string } => {
    const catEntry = CATEGORIES.find(([, lbl]) => lbl === label);
    const hasGroup = secItems.some((it) => effGroup(it).trim() !== '');
    if (catEntry && !hasGroup) return { group: '', category: catEntry[0] };
    return { group: label };
  };

  // Precomputed per-section model shared by the render + the drag handler.
  const setById = new Map<number, GameItemSet>(itemSets.map((s) => [s.id, s]));
  // Each item lands in exactly ONE container so its sortable id is unique
  // within the single DndContext: its primary (lowest-order) set's cluster,
  // else standalone. (Multi-set items show only in their primary set.)
  const primarySetOf = (it: GameItem): GameItemSet | null => {
    let best: GameItemSet | null = null;
    for (const sid of effSetIds(it)) {
      const s = setById.get(sid);
      if (!s) continue;
      if (!best || setOrderOf(s) < setOrderOf(best) || (setOrderOf(s) === setOrderOf(best) && s.id < best.id)) {
        best = s;
      }
    }
    return best;
  };
  const sections = groups.map((g, idx) => {
    const memberLists = new Map<string, GameItem[]>();
    const standalone: GameItem[] = [];
    const usedSets = new Map<number, GameItemSet>();
    for (const it of g.items) {
      const ps = primarySetOf(it);
      if (ps) {
        usedSets.set(ps.id, ps);
        const key = `set:${ps.id}`;
        const arr = memberLists.get(key) ?? [];
        arr.push(it);
        memberLists.set(key, arr);
      } else {
        standalone.push(it);
      }
    }
    const byOrder = (a: GameItem, b: GameItem) =>
      itemOrder(a) - itemOrder(b) || a.name.localeCompare(b.name);
    memberLists.forEach((arr) => arr.sort(byOrder));
    standalone.sort(byOrder);
    memberLists.set('standalone', standalone);
    const sectionSets = Array.from(usedSets.values()).sort(
      (a, b) => setOrderOf(a) - setOrderOf(b) || a.name.localeCompare(b.name),
    );
    return {
      idx,
      label: g.label,
      items: g.items,
      sectionSets,
      standalone,
      memberLists,
      assign: computeAssign(g.label, g.items),
    };
  });
  const idToItem = new Map<number, GameItem>(items.map((i) => [i.id, i]));
  const activeItem =
    activeDragId && activeDragId.startsWith('item:')
      ? idToItem.get(Number(activeDragId.slice(5))) ?? null
      : null;

  // Server-derived container → ordered item ids. `containers` is the working
  // (drag) copy when a drag is in progress, else this base arrangement.
  const baseContainers = new Map<string, number[]>();
  sections.forEach((sec) => {
    sec.sectionSets.forEach((s) =>
      baseContainers.set(
        `cont:${sec.idx}|set:${s.id}`,
        (sec.memberLists.get(`set:${s.id}`) ?? []).map((m) => m.id),
      ),
    );
    baseContainers.set(`cont:${sec.idx}|standalone`, sec.standalone.map((m) => m.id));
  });
  const containers = working ?? baseContainers;

  const parseContainer = (key: string) => {
    const [secStr, sub] = key.slice('cont:'.length).split('|');
    return {
      secIdx: Number(secStr),
      setId: sub.startsWith('set:') ? Number(sub.slice(4)) : null,
    };
  };

  // Optimistic set-membership change (drag between clusters / to standalone).
  const applySetMembership = (itemId: number, setIds: number[]) => {
    setFieldOverrides((prev) => ({ ...prev, setIds: { ...prev.setIds, [itemId]: setIds } }));
    void runOps([obsApi.updateGameItem(itemId, { set_ids: setIds })]);
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

  // Live reparent while dragging an item, so the hovered container opens a gap.
  const onDragOver = (e: DragOverEvent) => {
    const a = String(e.active.id);
    if (!e.over || !a.startsWith('item:')) return;
    const aid = Number(a.slice(5));
    const o = String(e.over.id);
    const prev = workingRef.current ?? baseContainers;
    const w = new Map<string, number[]>();
    prev.forEach((v, k) => w.set(k, v.slice()));
    let aKey: string | null = null;
    for (const [k, list] of w) if (list.includes(aid)) { aKey = k; break; }
    if (!aKey) return;
    let oKey: string | null = null;
    let overIndex = -1;
    if (o.startsWith('item:')) {
      const oid = Number(o.slice(5));
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
      if (from !== to) {
        aList.splice(from, 1);
        aList.splice(to, 0, aid);
      }
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

    // Cluster reorder uses the drop target directly (not the working map).
    if (a.startsWith('setc:')) {
      const o = e.over ? String(e.over.id) : '';
      if (!o.startsWith('setc:')) return;
      const [, aSec, aSet] = a.split(':');
      const [, oSec, oSet] = o.split(':');
      if (aSec !== oSec) return;
      const sec = sections[Number(aSec)];
      if (!sec) return;
      const from = sec.sectionSets.findIndex((s) => s.id === Number(aSet));
      const to = sec.sectionSets.findIndex((s) => s.id === Number(oSet));
      if (from < 0 || to < 0 || from === to) return;
      applySetOrder(arrayMove(sec.sectionSets, from, to));
      return;
    }
    if (!a.startsWith('item:') || !w) return;
    const aid = Number(a.slice(5));
    let finalKey: string | null = null;
    for (const [k, list] of w) if (list.includes(aid)) { finalKey = k; break; }
    if (!finalKey) return;
    const { secIdx, setId } = parseContainer(finalKey);
    const sec = sections[secIdx];
    if (!sec) return;
    const orderedItems = (w.get(finalKey) ?? [])
      .map((id) => idToItem.get(id))
      .filter((x): x is GameItem => Boolean(x));
    // Persist the final placement: section (group/category), set membership,
    // and order within the target container. Each sets an optimistic override
    // so nothing flashes back before the poll lands.
    applyFieldChange(aid, sec.assign);
    applySetMembership(aid, setId !== null ? [setId] : []);
    applyItemOrder(orderedItems);
  };

  return (
    <div className="control-card">
      <header className="d-flex justify-content-between align-items-baseline">
        <h2 className="m-0">
          Items — {game.title}{' '}
          <span className="text-white-50 fs-6">
            ({collectedIds.size} / {items.length} collected)
          </span>
        </h2>
        {!adding && !editing && (
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-light btn-sm"
              disabled={busy}
              title="Clear all collected items, then re-apply the game's starting items"
              onClick={resetToStart}
            >
              Reset to start
            </button>
            <button className="btn btn-bloodmoon btn-sm" onClick={() => setAdding(true)}>
              + Add item
            </button>
          </div>
        )}
      </header>

      {(adding || editing) && (
        <div className="item-modal-backdrop">
          <div className="item-modal" role="dialog" aria-modal="true">
            <div className="item-modal-head">
              <strong>{editing ? `Edit — ${editing.name}` : 'Add item'}</strong>
              <button
                type="button"
                className="item-action"
                title="Close"
                onClick={() => {
                  setAdding(false);
                  setEditing(null);
                }}
              >
                ✕
              </button>
            </div>
            <ItemForm
              gameId={game.id}
              nextOrder={nextOrder}
              initial={editing}
              groups={existingGroups}
              sets={itemSets}
              allItems={items}
              onCancel={() => {
                setAdding(false);
                setEditing(null);
              }}
              onDone={() => {
                setAdding(false);
                setEditing(null);
              }}
            />
          </div>
        </div>
      )}

      {err && <p className="text-danger mt-2">{err}</p>}

      {items.length === 0 ? (
        <p className="text-white-50 mt-3">
          No items defined for this game yet — add some above, or run{' '}
          <code>python manage.py import_zelda_items</code> to import a checklist.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={itemsCollision}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragCancel={onDragCancel}
          onDragEnd={handleDragEnd}
        >
          {sections.map((sec) => {
            const got = sec.items.filter((i) => collectedIds.has(i.id)).length;
            return (
              <section key={sec.label} className="item-group">
                <h3 className="item-group-head">
                  {sec.label}{' '}
                  <span className="text-white-50">
                    ({got}/{sec.items.length})
                  </span>
                </h3>
                <div className="items-flow">
                  <SortableContext
                    items={sec.sectionSets.map((s) => `setc:${sec.idx}:${s.id}`)}
                    strategy={rectSortingStrategy}
                  >
                    {sec.sectionSets.map((set) => {
                      const contKey = `cont:${sec.idx}|set:${set.id}`;
                      const memberIds = containers.get(contKey) ?? [];
                      const members = memberIds
                        .map((id) => idToItem.get(id))
                        .filter((x): x is GameItem => Boolean(x));
                      const ordered = set.kind === 'upgrade' || set.kind === 'trade';
                      const setIdx = sec.sectionSets.findIndex((s) => s.id === set.id);
                      return (
                        <SortableCluster
                          key={set.id}
                          id={`setc:${sec.idx}:${set.id}`}
                          kind={set.kind}
                        >
                          <SetClusterHead
                            set={set}
                            busy={busy}
                            canMovePrev={setIdx > 0}
                            canMoveNext={setIdx < sec.sectionSets.length - 1}
                            onMovePrev={() => moveSet(sec.sectionSets, set, -1)}
                            onMoveNext={() => moveSet(sec.sectionSets, set, 1)}
                            onRename={renameSet}
                            onRemove={removeSet}
                            onToggleOverlay={toggleSetOverlay}
                          />
                          <DroppableContainer id={contKey}>
                            <div className="link-cluster-body">
                              <SortableContext
                                items={memberIds.map((id) => `item:${id}`)}
                                strategy={rectSortingStrategy}
                              >
                                {members.map((m, idx) => (
                                  <Fragment key={m.id}>
                                    {ordered && idx > 0 && (
                                      <span className="link-arrow" aria-hidden>
                                        →
                                      </span>
                                    )}
                                    <SortableTile id={`item:${m.id}`}>
                                      {renderTile(m, {
                                        canPrev: idx > 0,
                                        canNext: idx < members.length - 1,
                                        onPrev: () => moveInChain(members, idx, -1),
                                        onNext: () => moveInChain(members, idx, 1),
                                      })}
                                    </SortableTile>
                                  </Fragment>
                                ))}
                              </SortableContext>
                            </div>
                          </DroppableContainer>
                        </SortableCluster>
                      );
                    })}
                  </SortableContext>
                  {(() => {
                    const standKey = `cont:${sec.idx}|standalone`;
                    const standIds = containers.get(standKey) ?? [];
                    const standItems = standIds
                      .map((id) => idToItem.get(id))
                      .filter((x): x is GameItem => Boolean(x));
                    return (
                      <DroppableContainer id={standKey} className="standalone-flow">
                        <SortableContext
                          items={standIds.map((id) => `item:${id}`)}
                          strategy={rectSortingStrategy}
                        >
                          {standItems.map((item, idx) => (
                            <SortableTile key={item.id} id={`item:${item.id}`}>
                              {renderTile(item, {
                                canPrev: idx > 0,
                                canNext: idx < standItems.length - 1,
                                onPrev: () => moveInChain(standItems, idx, -1),
                                onNext: () => moveInChain(standItems, idx, 1),
                              })}
                            </SortableTile>
                          ))}
                        </SortableContext>
                      </DroppableContainer>
                    );
                  })()}
                </div>
              </section>
            );
          })}
          <DragOverlay dropAnimation={null}>
            {activeItem ? (
              <div className="item-cell drag-overlay" style={{ width: 110 }}>
                <div
                  className="item-tile"
                  data-collected={
                    activeItem.countable
                      ? (collectedCounts[String(activeItem.id)] ?? 0) > 0
                      : collectedIds.has(activeItem.id)
                  }
                >
                  {activeItem.image_url ? (
                    <img src={activeItem.image_url} alt={activeItem.name} />
                  ) : (
                    <div className="item-placeholder">{activeItem.name.slice(0, 3)}</div>
                  )}
                  <div className="item-name">{activeItem.name}</div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <style>{`
        .item-group {
          margin-top: 1.25rem;
        }
        .item-group-head {
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 0.25rem;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }
        .items-flow {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .item-cell {
          position: relative;
          width: 110px;
        }
        .link-cluster {
          position: relative;
          border: 1px dashed rgba(255,255,255,0.25);
          border-radius: 8px;
          padding: 0.35rem 0.5rem 0.5rem;
        }
        .sortable-tile {
          position: relative;
        }
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
          border-radius: 4px;
          background: rgba(0,0,0,0.65);
          color: #fff;
          touch-action: none;
        }
        .drag-grip:active {
          cursor: grabbing;
        }
        .sortable-tile:hover > .drag-grip,
        .link-cluster:hover > .cluster-grip {
          opacity: 1;
        }
        .cluster-grip {
          top: 4px;
          left: 4px;
        }
        .drop-container[data-over] {
          outline: 2px dashed rgba(127,180,255,0.7);
          outline-offset: 2px;
          border-radius: 6px;
        }
        .standalone-flow {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .standalone-flow:empty {
          min-width: 70px;
          min-height: 70px;
        }
        .drag-overlay {
          cursor: grabbing;
          pointer-events: none;
        }
        .drag-overlay .item-tile {
          box-shadow: 0 10px 28px rgba(0,0,0,0.55);
          transform: scale(1.04);
        }
        .link-cluster[data-kind="upgrade"] { border-color: rgba(127,180,255,0.55); }
        .link-cluster[data-kind="trade"] { border-color: rgba(255,200,120,0.55); }
        .link-cluster[data-kind="set"] { border-color: rgba(200,150,255,0.55); }
        .link-cluster-head {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.4rem;
          min-height: 1.4rem;
        }
        .link-cluster-head--editing {
          gap: 0.3rem;
        }
        .set-head-actions {
          display: inline-flex;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .link-cluster:hover .set-head-actions {
          opacity: 1;
        }
        .set-head-action {
          border: none;
          background: rgba(0,0,0,0.5);
          color: #fff;
          border-radius: 4px;
          width: 20px;
          height: 20px;
          line-height: 1;
          padding: 0;
          font-size: 0.7rem;
          cursor: pointer;
        }
        .set-head-action:hover {
          background: rgba(180,30,30,0.9);
        }
        .link-cluster-body {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem;
        }
        .link-arrow {
          color: rgba(255,255,255,0.55);
          font-size: 1.1rem;
          line-height: 1;
        }
        .item-tile {
          width: 100%;
          background: rgba(0,0,0,0.3);
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          padding: 0.5rem;
          color: #fff;
          cursor: pointer;
          transition: all 0.15s;
        }
        .item-tile:hover {
          border-color: rgba(255,255,255,0.4);
        }
        .item-tile[data-collected="true"] {
          background: linear-gradient(45deg, rgba(20, 80, 30, 0.5), rgba(40, 120, 50, 0.5));
          border-color: #7fff7f;
          box-shadow: 0 0 12px rgba(127,255,127,0.3);
        }
        .item-tile[data-collected="false"] {
          opacity: 0.4;
          filter: grayscale(100%) brightness(0.8);
        }
        .item-tile img,
        .item-placeholder {
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
        .item-name {
          font-size: 0.75rem;
          text-align: center;
          margin-top: 0.25rem;
          line-height: 1.1;
        }
        .item-count {
          position: absolute;
          bottom: 4px;
          left: 4px;
          min-width: 22px;
          padding: 0 5px;
          border-radius: 11px;
          background: #7fff7f;
          color: #04210a;
          font-family: 'Bungee', sans-serif;
          font-size: 0.8rem;
          line-height: 1.4;
          text-align: center;
        }
        .item-link-badge {
          position: absolute;
          top: 4px;
          left: 4px;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(127,180,255,0.85);
          color: #04122a;
          font-size: 0.7rem;
          line-height: 1;
        }
        .item-actions {
          position: absolute;
          top: 2px;
          right: 2px;
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          max-width: calc(100% - 4px);
          gap: 2px;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .item-cell:hover .item-actions {
          opacity: 1;
        }
        .item-action {
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
        .item-action:hover {
          background: rgba(180,30,30,0.9);
        }
        .item-modal-backdrop {
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
        .item-modal {
          width: 100%;
          /* Roomier on large screens, still fits small ones. */
          max-width: min(1100px, 94vw);
          background: #15171c;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 10px;
          box-shadow: 0 16px 50px rgba(0,0,0,0.55);
        }
        .item-modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.6rem 0.9rem 0.5rem;
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }
        .item-modal form {
          margin-top: 0 !important;
        }
        .asset-picker {
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
        .asset-swatch {
          background: rgba(255,255,255,0.05);
          border: 2px solid transparent;
          border-radius: 4px;
          padding: 2px;
          cursor: pointer;
        }
        .asset-swatch[data-selected="true"] {
          border-color: #7fff7f;
        }
        .asset-swatch img {
          width: 100%;
          aspect-ratio: 1;
          object-fit: contain;
        }
        .item-set-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          font-size: 0.8rem;
          cursor: pointer;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.18);
          color: #fff;
          user-select: none;
        }
        .item-set-chip[data-on="true"] {
          background: linear-gradient(45deg, rgba(120,60,180,0.45), rgba(160,90,220,0.45));
          border-color: rgba(200,150,255,0.8);
        }
        .item-set-chip input { margin: 0; }
        .item-set-chip-kind {
          font-size: 0.6rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}

/** Header for a set cluster — shows the set name + kind, and on hover exposes
 *  inline rename (name + kind) and delete of the set definition. */
function SetClusterHead({
  set,
  busy,
  onRename,
  onRemove,
  onToggleOverlay,
  canMovePrev,
  canMoveNext,
  onMovePrev,
  onMoveNext,
}: {
  set: GameItemSet;
  busy: boolean;
  onRename: (set: GameItemSet, name: string, kind: ItemSetKind) => void | Promise<void>;
  onRemove: (set: GameItemSet) => void | Promise<void>;
  onToggleOverlay: (set: GameItemSet) => void | Promise<void>;
  canMovePrev: boolean;
  canMoveNext: boolean;
  onMovePrev: () => void;
  onMoveNext: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(set.name);
  const [kind, setKind] = useState<ItemSetKind>(set.kind);

  // Re-sync when the set identity / values change from a poll while not editing.
  useEffect(() => {
    if (!editing) {
      setName(set.name);
      setKind(set.kind);
    }
  }, [editing, set.name, set.kind]);

  const save = async () => {
    await onRename(set, name, kind);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="link-cluster-head link-cluster-head--editing">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void save();
            } else if (e.key === 'Escape') {
              setEditing(false);
            }
          }}
          className="form-control form-control-sm"
          style={{ width: 130 }}
          autoFocus
        />
        <select
          className="form-select form-select-sm"
          value={kind}
          onChange={(e) => setKind(e.target.value as ItemSetKind)}
          style={{ width: 'auto' }}
        >
          {SET_KINDS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button type="button" className="set-head-action" title="Save" disabled={busy} onClick={() => void save()}>
          ✓
        </button>
        <button type="button" className="set-head-action" title="Cancel" onClick={() => setEditing(false)}>
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="link-cluster-head">
      <span className="link-cluster-name">
        {set.name}
        {set.kind === 'set' ? ' · set' : ''}
      </span>
      <span className="set-head-actions">
        <button
          type="button"
          className="set-head-action"
          title="Move set earlier"
          disabled={busy || !canMovePrev}
          onClick={onMovePrev}
        >
          ◀
        </button>
        <button
          type="button"
          className="set-head-action"
          title="Move set later"
          disabled={busy || !canMoveNext}
          onClick={onMoveNext}
        >
          ▶
        </button>
        <button type="button" className="set-head-action" title="Rename set" onClick={() => setEditing(true)}>
          ✎
        </button>
        <button
          type="button"
          className="set-head-action"
          title={set.show_in_overlay ? 'Shown in /obs overlay — click to hide' : 'Hidden from /obs overlay — click to show'}
          aria-pressed={set.show_in_overlay}
          disabled={busy}
          onClick={() => void onToggleOverlay(set)}
          style={{ opacity: set.show_in_overlay ? 1 : 0.4 }}
        >
          {set.show_in_overlay ? '👁' : '🚫'}
        </button>
        <button
          type="button"
          className="set-head-action"
          title="Delete set"
          disabled={busy}
          onClick={() => void onRemove(set)}
        >
          🗑
        </button>
      </span>
    </div>
  );
}

function ItemForm({
  gameId,
  nextOrder,
  initial,
  groups,
  sets,
  allItems,
  onCancel,
  onDone,
}: {
  gameId: number;
  nextOrder: number;
  initial: GameItem | null;
  groups: string[];
  sets: GameItemSet[];
  allItems: GameItem[];
  onCancel: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '');
  const [category, setCategory] = useState(initial?.category || 'key-item');
  const [group, setGroup] = useState(initial?.group ?? '');
  const [setIds, setSetIds] = useState<number[]>(initial?.set_ids ?? []);
  // Sets created inline here, before the parent poll re-fetches the game —
  // merged with the prop list so the new chip shows + stays checked.
  const [extraSets, setExtraSets] = useState<GameItemSet[]>([]);
  const [newSetName, setNewSetName] = useState('');
  const [newSetKind, setNewSetKind] = useState<ItemSetKind>('set');
  const [countable, setCountable] = useState(initial?.countable ?? false);
  const [startsCollected, setStartsCollected] = useState(initial?.starts_collected ?? false);
  const [unlocksWithIds, setUnlocksWithIds] = useState<number[]>(initial?.unlocks_with_ids ?? []);
  const [assets, setAssets] = useState<GameItemAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const toggleUnlockWith = (id: number) =>
    setUnlocksWithIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const allSets = [...sets, ...extraSets.filter((e) => !sets.some((s) => s.id === e.id))];

  useEffect(() => {
    let cancelled = false;
    obsApi
      .itemAssets(gameId)
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

  const toggleSet = (id: number) =>
    setSetIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const addNewSet = async () => {
    const nm = newSetName.trim();
    if (!nm) return;
    setBusy(true);
    setErr(null);
    try {
      const created = await obsApi.createItemSet({
        game: gameId,
        name: nm,
        kind: newSetKind,
        order: allSets.length,
      });
      setExtraSets((prev) => [...prev, created]);
      setSetIds((prev) => [...prev, created.id]);
      setNewSetName('');
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      // Drop ids whose set/item was deleted while this form was open, so a
      // stale selection doesn't 400 ("Invalid pk … object does not exist").
      const validSetIds = setIds.filter((id) => allSets.some((s) => s.id === id));
      const validUnlockIds = unlocksWithIds.filter((id) => allItems.some((it) => it.id === id));
      if (initial) {
        await obsApi.updateGameItem(initial.id, {
          name: name.trim(),
          image_url: imageUrl.trim(),
          category,
          group: group.trim(),
          set_ids: validSetIds,
          unlocks_with_ids: validUnlockIds,
          countable,
          starts_collected: startsCollected,
        });
      } else {
        await obsApi.createGameItem({
          game: gameId,
          name: name.trim(),
          image_url: imageUrl.trim(),
          category,
          group: group.trim(),
          set_ids: validSetIds,
          unlocks_with_ids: validUnlockIds,
          countable,
          starts_collected: startsCollected,
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
    <form onSubmit={submit} className="mt-3 p-3" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
      <div className="d-flex gap-2 flex-wrap align-items-end">
        <div style={{ minWidth: 200 }}>
          <label className="d-block small text-white-50">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-control form-control-sm"
          />
        </div>
        <div style={{ minWidth: 280, flex: 1 }}>
          <label className="d-block small text-white-50">Image URL</label>
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
            {CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: 160 }}>
          <label className="d-block small text-white-50">Group</label>
          <input
            list="item-group-options"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="e.g. Equipment"
            className="form-control form-control-sm"
          />
          <datalist id="item-group-options">
            {groups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>
        <div className="form-check align-self-center mt-3" title="Track as an up/down tally (keys, maps, compasses)">
          <input
            id="item-countable"
            type="checkbox"
            className="form-check-input"
            checked={countable}
            onChange={(e) => setCountable(e.target.checked)}
          />
          <label className="form-check-label small text-white-50" htmlFor="item-countable">
            Countable (tally)
          </label>
        </div>
        <div className="form-check align-self-center mt-3" title="Player begins the game holding this item (re-applied by Reset to start)">
          <input
            id="item-starts-collected"
            type="checkbox"
            className="form-check-input"
            checked={startsCollected}
            onChange={(e) => setStartsCollected(e.target.checked)}
          />
          <label className="form-check-label small text-white-50" htmlFor="item-starts-collected">
            Starts collected
          </label>
        </div>
        <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
          {initial ? 'Save' : 'Add item'}
        </button>
        <button type="button" className="btn btn-outline-light btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>

      {/* Set membership — an item can belong to several (e.g. a medallion is
        * in both "Medallions" and "Magic Items"). */}
      <div className="mt-3">
        <label className="d-block small text-white-50">Sets (choose any)</label>
        <div className="d-flex flex-wrap gap-2 align-items-center mt-1">
          {allSets.length === 0 && (
            <span className="small text-white-50">No sets yet — add one below.</span>
          )}
          {allSets.map((s) => (
            <label key={s.id} className="item-set-chip" data-on={setIds.includes(s.id)}>
              <input
                type="checkbox"
                checked={setIds.includes(s.id)}
                onChange={() => toggleSet(s.id)}
              />
              {s.name}
              <span className="item-set-chip-kind">{s.kind}</span>
            </label>
          ))}
        </div>
        <div className="d-flex gap-2 align-items-end mt-2" style={{ flexWrap: 'wrap' }}>
          <div style={{ minWidth: 160 }}>
            <label className="d-block small text-white-50">New set</label>
            <input
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void addNewSet();
                }
              }}
              placeholder="e.g. Medallions"
              className="form-control form-control-sm"
            />
          </div>
          <div>
            <label className="d-block small text-white-50">Kind</label>
            <select
              className="form-select form-select-sm"
              value={newSetKind}
              onChange={(e) => setNewSetKind(e.target.value as ItemSetKind)}
            >
              {SET_KINDS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn-outline-light btn-sm"
            disabled={busy || !newSetName.trim()}
            onClick={() => void addNewSet()}
          >
            + Add set
          </button>
        </div>
      </div>

      {/* Simultaneous unlocks — collecting/clearing this item cascades to these
        * (e.g. Bow ⇄ Quiver). Symmetric, so it doesn't matter which you tie. */}
      <div className="mt-3">
        <label className="d-block small text-white-50">
          Unlocks together with (collected/cleared as a group)
        </label>
        <div className="d-flex flex-wrap gap-2 align-items-center mt-1">
          {allItems.filter((it) => it.id !== initial?.id).length === 0 && (
            <span className="small text-white-50">No other items in this game yet.</span>
          )}
          {allItems
            .filter((it) => it.id !== initial?.id)
            .map((it) => (
              <label key={it.id} className="item-set-chip" data-on={unlocksWithIds.includes(it.id)}>
                <input
                  type="checkbox"
                  checked={unlocksWithIds.includes(it.id)}
                  onChange={() => toggleUnlockWith(it.id)}
                />
                {it.name}
              </label>
            ))}
        </div>
      </div>

      {err && <p className="text-danger small mt-2 mb-0">{err}</p>}

      {assets.length > 0 && (
        <div className="mt-2">
          <label className="d-block small text-white-50">
            Pick a bundled sprite ({assets.length} available)
          </label>
          <div className="asset-picker">
            {assets.map((a) => (
              <button
                type="button"
                key={a.url}
                className="asset-swatch"
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
