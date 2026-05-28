import { useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';

/**
 * Adds filter + sort + column-resize behaviour to an existing
 * table without forcing a full migration to <DataTable />. Each
 * section keeps its bespoke <Row /> components and just sprinkles
 * a few hook outputs into its existing <thead> + filter slot.
 *
 * Usage:
 *   const { rows, FilterInput, headerProps, colStyle, resizeHandle }
 *     = useTableControls(myRows, columns, 'control:my-table');
 *   return (
 *     <>
 *       <FilterInput />
 *       <table>
 *         <colgroup>{columns.map(c => <col style={colStyle(c.id)}/>)}</colgroup>
 *         <thead><tr>
 *           {columns.map(c => (
 *             <th {...headerProps(c.id)}>{c.header}{resizeHandle(c.id)}</th>
 *           ))}
 *         </tr></thead>
 *         <tbody>{rows.map(...)}</tbody>
 *       </table>
 *     </>
 *   );
 */

export interface TableColumn<T> {
  id: string;
  header: ReactNode;
  /** Returns a value used for comparisons when this column is the
   *  active sort key. Omit on action / button columns. */
  sortValue?: (row: T) => string | number | null | undefined;
  /** Returns text used by the filter input. Falls back to the
   *  stringified sort value. */
  filterValue?: (row: T) => string;
  /** Starting width in px. */
  initialWidth?: number;
  /** Minimum width during resize. Default 60. */
  minWidth?: number;
}

interface SortState {
  columnId: string;
  direction: 'asc' | 'desc';
}

interface Persisted {
  sort?: SortState | null;
  filter?: string;
  widths?: Record<string, number>;
}

function readPersisted(key: string | undefined): Persisted {
  if (!key || typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writePersisted(key: string | undefined, value: Persisted) {
  if (!key || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch { /* storage disabled */ }
}

export function useTableControls<T>(
  inputRows: T[],
  columns: TableColumn<T>[],
  storageKey?: string,
) {
  const persisted = useMemo(() => readPersisted(storageKey), [storageKey]);
  const [sort, setSort] = useState<SortState | null>(persisted.sort ?? null);
  const [filter, setFilter] = useState<string>(persisted.filter ?? '');
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    const base: Record<string, number> = {};
    for (const col of columns) {
      const w = persisted.widths?.[col.id] ?? col.initialWidth;
      if (w != null) base[col.id] = w;
    }
    return base;
  });

  // Persist when anything changes.
  useMemo(() => {
    writePersisted(storageKey, { sort, filter, widths });
  }, [storageKey, sort, filter, widths]);

  const rows = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const filtered = needle
      ? inputRows.filter((row) =>
          columns.some((col) => {
            const text = col.filterValue
              ? col.filterValue(row)
              : col.sortValue != null ? String(col.sortValue(row) ?? '') : '';
            return text.toLowerCase().includes(needle);
          }),
        )
      : inputRows;
    if (!sort) return filtered;
    const col = columns.find((c) => c.id === sort.columnId);
    if (!col?.sortValue) return filtered;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      const aMissing = av == null || av === '';
      const bMissing = bv == null || bv === '';
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' }) * dir;
    });
  }, [inputRows, columns, filter, sort]);

  const toggleSort = (columnId: string) => {
    setSort((cur) => {
      const col = columns.find((c) => c.id === columnId);
      if (!col?.sortValue) return cur;
      if (!cur || cur.columnId !== columnId) return { columnId, direction: 'asc' };
      if (cur.direction === 'asc') return { columnId, direction: 'desc' };
      return null;
    });
  };

  const headerProps = (columnId: string) => {
    const col = columns.find((c) => c.id === columnId);
    const sortable = !!col?.sortValue;
    const active = sort?.columnId === columnId;
    const ariaSort: 'ascending' | 'descending' | 'none' | undefined = active
      ? sort!.direction === 'asc' ? 'ascending' : 'descending'
      : sortable ? 'none' : undefined;
    return {
      onClick: () => { if (sortable) toggleSort(columnId); },
      style: {
        cursor: sortable ? 'pointer' : 'default',
        userSelect: 'none' as const,
        whiteSpace: 'nowrap' as const,
        position: 'relative' as const,
      } satisfies CSSProperties,
      'aria-sort': ariaSort,
    };
  };

  const sortIndicator = (columnId: string) => {
    const col = columns.find((c) => c.id === columnId);
    if (!col?.sortValue) return null;
    const active = sort?.columnId === columnId;
    const arrow = active ? (sort!.direction === 'asc' ? ' ▲' : ' ▼') : ' ↕';
    return (
      <span style={{ marginLeft: 4, opacity: active ? 1 : 0.35 }}>{arrow}</span>
    );
  };

  // Resize handle factory.
  const resizeStateRef = useRef<{
    columnId: string;
    startX: number;
    startWidth: number;
    minWidth: number;
  } | null>(null);

  const onResizePointerDown = (e: ReactPointerEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const col = columns.find((c) => c.id === columnId);
    const th = (e.currentTarget.parentElement as HTMLElement | null);
    const startWidth = widths[columnId] ?? th?.getBoundingClientRect().width ?? 120;
    resizeStateRef.current = {
      columnId,
      startX: e.clientX,
      startWidth,
      minWidth: col?.minWidth ?? 60,
    };
    const move = (ev: PointerEvent) => {
      const state = resizeStateRef.current;
      if (!state) return;
      const next = Math.max(state.minWidth, state.startWidth + (ev.clientX - state.startX));
      setWidths((w) => ({ ...w, [state.columnId]: next }));
    };
    const up = () => {
      resizeStateRef.current = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  const resizeHandle = (columnId: string) => (
    <div
      role="separator"
      aria-orientation="vertical"
      onPointerDown={(e) => onResizePointerDown(e, columnId)}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 6,
        height: '100%',
        cursor: 'col-resize',
        userSelect: 'none',
      }}
    />
  );

  const colStyle = (columnId: string): CSSProperties | undefined => {
    const w = widths[columnId];
    return w != null ? { width: w } : undefined;
  };

  const FilterInput = ({ placeholder = 'Filter…' }: { placeholder?: string }) => (
    <input
      type="text"
      value={filter}
      onChange={(e) => setFilter(e.target.value)}
      placeholder={placeholder}
      className="form-control form-control-sm mb-2"
      style={{ maxWidth: 320 }}
    />
  );

  return {
    rows,
    FilterInput,
    headerProps,
    sortIndicator,
    resizeHandle,
    colStyle,
  };
}
