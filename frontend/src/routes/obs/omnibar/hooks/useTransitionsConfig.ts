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
  /** Direction the tag pill enters from. */
  tagEnter: AnimDirection;
  /** Direction the tag pill exits to. */
  tagExit: AnimDirection;
  /** Direction the body row enters from. Independent of the tag. */
  bodyEnter: AnimDirection;
  /** Direction the body row exits to. Independent of the tag. */
  bodyExit: AnimDirection;
  /** Duration of the tag's enter animation, in ms. */
  tagEnterMs: number;
  /** Duration of the tag's exit animation, in ms. */
  tagExitMs: number;
  /** Duration of the body's enter animation, in ms. */
  bodyEnterMs: number;
  /** Duration of the body's exit animation, in ms. */
  bodyExitMs: number;
  /** Pause between the PREVIOUS panel's exit completing and THIS
   *  panel's enter starting, in ms. First event in this panel's
   *  rotation cycle. */
  leadInMs: number;
  /** Time the panel sits fully landed on-screen between its enter
   *  finishing and its exit starting, in ms. The rotation cadence
   *  is the sum of (leadIn + enter + dwell + exit) across all live
   *  panels — there is no separate lane-level interval. */
  dwellMs: number;
  /** Gap between the tag finishing its enter and the body starting
   *  its enter, in ms. 0 = body enters the moment the tag lands. */
  bodyEnterDelayMs: number;
  /** Gap between the body finishing its exit and the tag starting
   *  its exit, in ms. 0 = tag starts retreating the moment the body
   *  finishes leaving. */
  bodyExitDelayMs: number;
}

export const DEFAULT_TRANSITION: PanelTransition = {
  tagEnter: 'left',
  tagExit: 'left',
  bodyEnter: 'left',
  bodyExit: 'left',
  tagEnterMs: 520,
  tagExitMs: 480,
  bodyEnterMs: 520,
  bodyExitMs: 480,
  leadInMs: 0,
  dwellMs: 4000,
  bodyEnterDelayMs: 0,
  bodyExitDelayMs: 0,
};

const DIRECTIONS: AnimDirection[] = ['left', 'right', 'top', 'bottom', 'fade'];

// Bounds the control-panel sliders also pin to. Picked wide enough to
// allow comically slow rehearsals (2s) but narrow enough that an
// accidental zero doesn't ship a no-animation rotation to broadcast.
export const DURATION_MIN_MS = 100;
export const DURATION_MAX_MS = 2000;
export const DELAY_MIN_MS = 0;
export const DELAY_MAX_MS = 2000;
// Dwell is the longest natural value in a panel cycle (the active
// display time between enter and exit), so it gets a much wider
// range than the inter-element delays.
export const DWELL_MIN_MS = 0;
export const DWELL_MAX_MS = 60000;

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
        tagEnter: ov.tagEnter ?? parsed.default.tagEnter,
        tagExit: ov.tagExit ?? parsed.default.tagExit,
        bodyEnter: ov.bodyEnter ?? parsed.default.bodyEnter,
        bodyExit: ov.bodyExit ?? parsed.default.bodyExit,
        tagEnterMs: ov.tagEnterMs ?? parsed.default.tagEnterMs,
        tagExitMs: ov.tagExitMs ?? parsed.default.tagExitMs,
        bodyEnterMs: ov.bodyEnterMs ?? parsed.default.bodyEnterMs,
        bodyExitMs: ov.bodyExitMs ?? parsed.default.bodyExitMs,
        leadInMs: ov.leadInMs ?? parsed.default.leadInMs,
        dwellMs: ov.dwellMs ?? parsed.default.dwellMs,
        bodyEnterDelayMs: ov.bodyEnterDelayMs ?? parsed.default.bodyEnterDelayMs,
        bodyExitDelayMs: ov.bodyExitDelayMs ?? parsed.default.bodyExitDelayMs,
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
    tagEnter: partial.tagEnter ?? base.tagEnter,
    tagExit: partial.tagExit ?? base.tagExit,
    bodyEnter: partial.bodyEnter ?? base.bodyEnter,
    bodyExit: partial.bodyExit ?? base.bodyExit,
    tagEnterMs: partial.tagEnterMs ?? base.tagEnterMs,
    tagExitMs: partial.tagExitMs ?? base.tagExitMs,
    bodyEnterMs: partial.bodyEnterMs ?? base.bodyEnterMs,
    bodyExitMs: partial.bodyExitMs ?? base.bodyExitMs,
    leadInMs: partial.leadInMs ?? base.leadInMs,
    dwellMs: partial.dwellMs ?? base.dwellMs,
    bodyEnterDelayMs: partial.bodyEnterDelayMs ?? base.bodyEnterDelayMs,
    bodyExitDelayMs: partial.bodyExitDelayMs ?? base.bodyExitDelayMs,
  };
}

function parsePartial(raw: unknown): Partial<PanelTransition> | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  const out: Partial<PanelTransition> = {};
  if (typeof v.tagEnter === 'string' && DIRECTIONS.includes(v.tagEnter as AnimDirection)) {
    out.tagEnter = v.tagEnter as AnimDirection;
  }
  if (typeof v.tagExit === 'string' && DIRECTIONS.includes(v.tagExit as AnimDirection)) {
    out.tagExit = v.tagExit as AnimDirection;
  }
  if (typeof v.bodyEnter === 'string' && DIRECTIONS.includes(v.bodyEnter as AnimDirection)) {
    out.bodyEnter = v.bodyEnter as AnimDirection;
  }
  if (typeof v.bodyExit === 'string' && DIRECTIONS.includes(v.bodyExit as AnimDirection)) {
    out.bodyExit = v.bodyExit as AnimDirection;
  }
  if (typeof v.tagEnterMs === 'number') {
    out.tagEnterMs = clamp(v.tagEnterMs, DURATION_MIN_MS, DURATION_MAX_MS);
  }
  if (typeof v.tagExitMs === 'number') {
    out.tagExitMs = clamp(v.tagExitMs, DURATION_MIN_MS, DURATION_MAX_MS);
  }
  if (typeof v.bodyEnterMs === 'number') {
    out.bodyEnterMs = clamp(v.bodyEnterMs, DURATION_MIN_MS, DURATION_MAX_MS);
  }
  if (typeof v.bodyExitMs === 'number') {
    out.bodyExitMs = clamp(v.bodyExitMs, DURATION_MIN_MS, DURATION_MAX_MS);
  }
  if (typeof v.leadInMs === 'number') {
    out.leadInMs = clamp(v.leadInMs, DELAY_MIN_MS, DELAY_MAX_MS);
  } else if (typeof v.delayMs === 'number') {
    // Backward-compat: the field was renamed from `delayMs`. Read
    // the old key when the new one isn't present so saved configs
    // don't lose their lead-in value.
    out.leadInMs = clamp(v.delayMs, DELAY_MIN_MS, DELAY_MAX_MS);
  }
  if (typeof v.dwellMs === 'number') {
    out.dwellMs = clamp(v.dwellMs, DWELL_MIN_MS, DWELL_MAX_MS);
  }
  if (typeof v.bodyEnterDelayMs === 'number') {
    out.bodyEnterDelayMs = clamp(v.bodyEnterDelayMs, DELAY_MIN_MS, DELAY_MAX_MS);
  }
  if (typeof v.bodyExitDelayMs === 'number') {
    out.bodyExitDelayMs = clamp(v.bodyExitDelayMs, DELAY_MIN_MS, DELAY_MAX_MS);
  }
  return Object.keys(out).length > 0 ? out : null;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
