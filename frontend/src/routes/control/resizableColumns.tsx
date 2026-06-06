/**
 * Drag-to-resize column primitives shared between control-panel tables.
 *
 * `useResizableColumns(storageKey, defaults)` returns the current pixel
 * widths for each column key plus a `startResize(key, e)` handler that
 * the per-`<th>` `<ResizeHandle>` wires into `onMouseDown`. Widths are
 * persisted in `localStorage` under `storageKey` so the operator's
 * drags survive a reload. Refs are used inside the listeners so the
 * mouse-move closure always sees the latest widths without re-binding
 * on every drag pixel.
 *
 * Originally lived inline in `/control/donations`; pulled out here so
 * `/control/chest-announcer`'s Sound triggers table can share the same
 * behaviour and styling (the `.control-table-resize-handle` rule in
 * `control.css`).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/** Floor for any single column width, enforced both during a drag and
 *  when hydrating from localStorage. Keeps the smallest column above
 *  the "completely illegible" threshold even if the operator yanks the
 *  handle hard. */
export const COLUMN_MIN_PX = 60;

export function useResizableColumns<K extends string>(
  storageKey: string,
  defaults: Record<K, number>,
): {
  widths: Record<K, number>;
  startResize: (key: K, e: React.MouseEvent) => void;
} {
  const [widths, setWidths] = useState<Record<K, number>>(() => {
    try {
      const raw = window.localStorage?.getItem(storageKey);
      if (!raw) return { ...defaults };
      const parsed = JSON.parse(raw) as Partial<Record<K, number>>;
      const merged = { ...defaults };
      for (const k of Object.keys(defaults) as K[]) {
        const v = parsed[k];
        if (typeof v === 'number' && Number.isFinite(v) && v >= COLUMN_MIN_PX) {
          merged[k] = v;
        }
      }
      return merged;
    } catch {
      return { ...defaults };
    }
  });

  const widthsRef = useRef(widths);
  widthsRef.current = widths;

  const startResize = useCallback(
    (key: K, e: React.MouseEvent) => {
      // Don't trigger any header onClick (e.g. sort) or kick off a
      // browser text-selection while dragging.
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startW = widthsRef.current[key] ?? defaults[key];
      const onMove = (ev: MouseEvent) => {
        const next = Math.max(COLUMN_MIN_PX, startW + (ev.clientX - startX));
        setWidths((prev) => ({ ...prev, [key]: next }));
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        try {
          window.localStorage?.setItem(
            storageKey,
            JSON.stringify(widthsRef.current),
          );
        } catch {
          /* private-mode storage block — drag still works, just no persist */
        }
      };
      // While dragging, force col-resize cursor + no-select on the
      // whole document so the cursor doesn't change mid-drag if it
      // strays off the handle.
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [defaults, storageKey],
  );

  // Defensive: detach any leaked global styles if the component
  // unmounts mid-drag (cursor / userSelect would otherwise stick).
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  return { widths, startResize };
}

/** Drag-handle pinned to the right edge of a resizable `<th>`. Stops
 *  click propagation so clicking it doesn't also fire the th's own
 *  onClick (e.g. a sort toggle). Lives inside a `position: relative`
 *  th; styling comes from `.control-table-resize-handle` in
 *  `control.css`. */
export function ResizeHandle({
  onMouseDown,
}: {
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <span
      className="control-table-resize-handle"
      onMouseDown={onMouseDown}
      onClick={(e) => e.stopPropagation()}
      role="separator"
      aria-orientation="vertical"
      title="Drag to resize column"
    />
  );
}
