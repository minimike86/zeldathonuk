import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react';

/**
 * Generic data table for the control panel sections.
 *
 * Behaviours:
 *  - Click a column header to sort by that column. Repeat clicks
 *    toggle asc → desc → off.
 *  - The top filter input does a case-insensitive substring match
 *    against each column's `filterValue` (falls back to `sortValue`
 *    or the rendered cell stringified).
 *  - Drag the small handle on the right edge of any header to resize
 *    that column. Widths persist to localStorage keyed by
 *    `storageKey` so the layout survives page reloads.
 *
 * Rows render arbitrary JSX via `column.render` — drafts, inputs,
 * action button rows etc. are all the row's responsibility, this
 * component just owns sort / filter / resize plumbing.
 */

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  /** Value used for comparisons when this column is the active sort
   *  key. Numbers sort numerically, everything else compares as a
   *  case-insensitive string. Return `null` / `undefined` to push
   *  the row to the bottom on asc and the top on desc. */
  sortValue?: (row: T) => string | number | null | undefined;
  /** Override the text used by the filter input. Defaults to the
   *  sort value (or empty string if neither is set). */
  filterValue?: (row: T) => string;
  /** Initial width in px. The user can drag-resize from here; the
   *  current width is persisted via `storageKey`. */
  initialWidth?: number;
  /** Minimum width in px when resizing. Default 60. */
  minWidth?: number;
  /** Set false on action / button columns where sorting makes no sense. */
  sortable?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  rowStyle?: (row: T) => CSSProperties | undefined;
  filterPlaceholder?: string;
  emptyMessage?: ReactNode;
  initialSort?: { columnId: string; direction: 'asc' | 'desc' };
  /** localStorage key for persisting column widths + sort state.
   *  Recommended: one per consumer e.g. `control:milestones-v1`. */
  storageKey?: string;
  className?: string;
  /** Optional min-width applied to the inner table — useful when the
   *  table is wider than its container and should scroll. */
  minWidthPx?: number;
}

type SortState = { columnId: string; direction: 'asc' | 'desc' } | null;

interface PersistedTableState {
  widths?: Record<string, number>;
  sort?: { columnId: string; direction: 'asc' | 'desc' } | null;
  filter?: string;
}

function readPersisted(key: string | undefined): PersistedTableState {
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

function writePersisted(key: string | undefined, value: PersistedTableState) {
  if (!key || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / disabled storage — ignore */
  }
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowStyle,
  filterPlaceholder = 'Filter…',
  emptyMessage = 'No rows.',
  initialSort,
  storageKey,
  className,
  minWidthPx,
}: DataTableProps<T>) {
  const persisted = useMemo(() => readPersisted(storageKey), [storageKey]);

  const [sort, setSort] = useState<SortState>(
    () => persisted.sort ?? initialSort ?? null,
  );
  const [filter, setFilter] = useState<string>(persisted.filter ?? '');
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    const base: Record<string, number> = {};
    for (const col of columns) {
      const w = persisted.widths?.[col.id] ?? col.initialWidth;
      if (w != null) base[col.id] = w;
    }
    return base;
  });

  // Persist changes to localStorage when any tracked state shifts.
  useEffect(() => {
    writePersisted(storageKey, { widths, sort, filter });
  }, [storageKey, widths, sort, filter]);

  // Cycle a column through asc → desc → off on each header click.
  const toggleSort = (col: DataTableColumn<T>) => {
    if (col.sortable === false) return;
    setSort((cur) => {
      if (!cur || cur.columnId !== col.id) {
        return { columnId: col.id, direction: 'asc' };
      }
      if (cur.direction === 'asc') return { columnId: col.id, direction: 'desc' };
      return null;
    });
  };

  // Filtered + sorted rows. Filter first (cheaper), then sort.
  const visibleRows = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    const filtered = needle
      ? rows.filter((row) =>
          columns.some((col) => {
            const text = col.filterValue
              ? col.filterValue(row)
              : col.sortValue != null
                ? String(col.sortValue(row) ?? '')
                : '';
            return text.toLowerCase().includes(needle);
          }),
        )
      : rows;
    if (!sort) return filtered;
    const col = columns.find((c) => c.id === sort.columnId);
    if (!col || !col.sortValue) return filtered;
    const direction = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      const aMissing = av == null || av === '';
      const bMissing = bv == null || bv === '';
      // Push missing values to the bottom on asc, top on desc.
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * direction;
      }
      return String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' }) * direction;
    });
  }, [columns, rows, filter, sort]);

  // Column resize via pointer drag on the right edge of each header.
  // We track the dragging column + its starting width + the pointer's
  // starting clientX in a ref, attach window listeners, and clean up
  // on pointerup.
  const resizeStateRef = useRef<{
    columnId: string;
    startX: number;
    startWidth: number;
    minWidth: number;
  } | null>(null);

  const onResizeStart = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>, col: DataTableColumn<T>) => {
      e.preventDefault();
      e.stopPropagation();
      const th = (e.currentTarget.parentElement as HTMLElement | null);
      const startWidth = widths[col.id] ?? th?.getBoundingClientRect().width ?? 120;
      resizeStateRef.current = {
        columnId: col.id,
        startX: e.clientX,
        startWidth,
        minWidth: col.minWidth ?? 60,
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
      // Prevent text selection while dragging.
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    },
    [widths],
  );

  const tableStyle: CSSProperties = useMemo(
    () => ({ minWidth: minWidthPx, tableLayout: 'fixed' as const }),
    [minWidthPx],
  );

  return (
    <div className={className} style={{ overflowX: 'auto' }}>
      <div className="mb-2">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={filterPlaceholder}
          className="form-control form-control-sm"
          style={{ maxWidth: 320 }}
        />
      </div>
      <table className="control-table" style={tableStyle}>
        <colgroup>
          {columns.map((col) => (
            <col
              key={col.id}
              style={widths[col.id] != null ? { width: widths[col.id] } : undefined}
            />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((col) => {
              const isSorted = sort?.columnId === col.id;
              const arrow = isSorted ? (sort!.direction === 'asc' ? ' ▲' : ' ▼') : '';
              const sortable = col.sortable !== false && col.sortValue != null;
              return (
                <th
                  key={col.id}
                  style={{
                    position: 'relative',
                    userSelect: 'none',
                    cursor: sortable ? 'pointer' : 'default',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => sortable && toggleSort(col)}
                >
                  {col.header}
                  {sortable && (
                    <span style={{ opacity: isSorted ? 1 : 0.35, marginLeft: 4 }}>
                      {arrow || '↕'}
                    </span>
                  )}
                  <div
                    role="separator"
                    aria-orientation="vertical"
                    onPointerDown={(e) => onResizeStart(e, col)}
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
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {visibleRows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-white-50">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            visibleRows.map((row) => (
              <tr key={rowKey(row)} style={rowStyle?.(row)}>
                {columns.map((col) => (
                  <td key={col.id}>{col.render(row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
