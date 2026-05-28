import { useMemo } from 'react';
import type { EventModel } from '@/lib/obsApi';
import { ALL_PANEL_IDS, type PanelId } from './useLayoutConfig';

/**
 * Reads `Event.omnibar_transitions` JSON and produces a per-panel
 * transition resolver. Each panel can declare its own enter direction
 * + exit direction + enter/exit durations + a delay (the gap after
 * the previous panel's exit before this panel's enter starts). Missing
 * fields fall back to the per-event default, which falls back to
 * `DEFAULT_TRANSITION` below.
 *
 * Expected JSON shape on Event.omnibar_transitions:
 *   {
 *     "default": {
 *       "enter": "left",   "exit": "left",
 *       "enterMs": 520,    "exitMs": 480,
 *       "delayMs": 0
 *     },
 *     "panels": {
 *       "current-game":  { "enter": "top",    "exit": "bottom" },
 *       "schedule-next": { "enter": "right",  "enterMs": 700  }
 *     }
 *   }
 *
 * Unknown directions / out-of-range numbers are silently clamped to
 * sensible defaults so a stale JSON can't break the bar.
 */

export type AnimDirection = 'left' | 'right' | 'top' | 'bottom' | 'fade';

export interface PanelTransition {
  enter: AnimDirection;
  exit: AnimDirection;
  /** Duration of the slot's enter animation, in ms. */
  enterMs: number;
  /** Duration of the slot's exit animation, in ms. */
  exitMs: number;
  /** Gap between the previous panel's exit completing and THIS
   *  panel's enter starting, in ms. 0 = enter starts as soon as the
   *  outgoing panel finishes its exit. */
  delayMs: number;
}

export const DEFAULT_TRANSITION: PanelTransition = {
  enter: 'left',
  exit: 'left',
  enterMs: 520,
  exitMs: 480,
  delayMs: 0,
};

const DIRECTIONS: AnimDirection[] = ['left', 'right', 'top', 'bottom', 'fade'];

// Bounds the control-panel sliders also pin to. Picked wide enough to
// allow comically slow rehearsals (2s) but narrow enough that an
// accidental zero doesn't ship a no-animation rotation to broadcast.
export const DURATION_MIN_MS = 100;
export const DURATION_MAX_MS = 2000;
export const DELAY_MIN_MS = 0;
export const DELAY_MAX_MS = 2000;

export interface OmnibarTransitions {
  /** Lookup by panel id. */
  forPanel(panelId: string): PanelTransition;
  /** Default applied when a panel has no override. */
  default: PanelTransition;
  /** Per-panel overrides as stored (used by the editor UI). */
  overrides: Partial<Record<PanelId, Partial<PanelTransition>>>;
}

export function useTransitionsConfig(event: EventModel | null): OmnibarTransitions {
  return useMemo(() => parseTransitions(event?.omnibar_transitions), [
    event?.omnibar_transitions,
  ]);
}

/** Exported so the control-panel editor can round-trip JSON without
 *  hitting the hook (it operates on a draft, not a live Event). */
export function parseTransitions(raw: unknown): OmnibarTransitions {
  const parsed = parseTransitionsRaw(raw);
  return {
    default: parsed.default,
    overrides: parsed.overrides,
    forPanel(panelId: string): PanelTransition {
      const ov = parsed.overrides[panelId as PanelId];
      if (!ov) return parsed.default;
      return {
        enter: ov.enter ?? parsed.default.enter,
        exit: ov.exit ?? parsed.default.exit,
        enterMs: ov.enterMs ?? parsed.default.enterMs,
        exitMs: ov.exitMs ?? parsed.default.exitMs,
        delayMs: ov.delayMs ?? parsed.default.delayMs,
      };
    },
  };
}

interface ParsedTransitions {
  default: PanelTransition;
  overrides: Partial<Record<PanelId, Partial<PanelTransition>>>;
}

function parseTransitionsRaw(raw: unknown): ParsedTransitions {
  if (!raw || typeof raw !== 'object') {
    return { default: DEFAULT_TRANSITION, overrides: {} };
  }
  const obj = raw as { default?: unknown; panels?: unknown };
  const defaults = mergeTransition(DEFAULT_TRANSITION, obj.default);
  const overrides: Partial<Record<PanelId, Partial<PanelTransition>>> = {};
  if (obj.panels && typeof obj.panels === 'object') {
    const panels = obj.panels as Record<string, unknown>;
    for (const id of ALL_PANEL_IDS) {
      const v = panels[id];
      const partial = parsePartial(v);
      if (partial) overrides[id] = partial;
    }
  }
  return { default: defaults, overrides };
}

function mergeTransition(base: PanelTransition, raw: unknown): PanelTransition {
  const partial = parsePartial(raw);
  if (!partial) return base;
  return {
    enter: partial.enter ?? base.enter,
    exit: partial.exit ?? base.exit,
    enterMs: partial.enterMs ?? base.enterMs,
    exitMs: partial.exitMs ?? base.exitMs,
    delayMs: partial.delayMs ?? base.delayMs,
  };
}

function parsePartial(raw: unknown): Partial<PanelTransition> | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  const out: Partial<PanelTransition> = {};
  if (typeof v.enter === 'string' && DIRECTIONS.includes(v.enter as AnimDirection)) {
    out.enter = v.enter as AnimDirection;
  }
  if (typeof v.exit === 'string' && DIRECTIONS.includes(v.exit as AnimDirection)) {
    out.exit = v.exit as AnimDirection;
  }
  if (typeof v.enterMs === 'number') {
    out.enterMs = clamp(v.enterMs, DURATION_MIN_MS, DURATION_MAX_MS);
  }
  if (typeof v.exitMs === 'number') {
    out.exitMs = clamp(v.exitMs, DURATION_MIN_MS, DURATION_MAX_MS);
  }
  if (typeof v.delayMs === 'number') {
    out.delayMs = clamp(v.delayMs, DELAY_MIN_MS, DELAY_MAX_MS);
  }
  return Object.keys(out).length > 0 ? out : null;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
