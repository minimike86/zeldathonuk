import { useMemo } from 'react';
import type { EventModel, Game } from '@/lib/obsApi';
import type { LaneConfig } from '../lanes/Lane';

/**
 * Reads `Event.omnibar_layout` JSON and produces a validated pair of
 * lane configs. Unknown panel ids are filtered out so a backend that
 * advertises a panel the client doesn't ship yet doesn't crash the bar.
 * Empty / missing layout falls back to the default below.
 *
 * Expected JSON shape:
 *   {
 *     "lanes": [
 *       { "id": "top",    "mode": "rotating", "intervalMs": 8000,
 *         "panels": ["current-game", "playtime", "objective"] },
 *       { "id": "bottom", "mode": "rotating", "intervalMs": 5000,
 *         "panels": ["schedule-next", "donation-reel", ...] }
 *     ]
 *   }
 */

export interface OmnibarLayoutConfig {
  top: LaneConfig;
  bottom: LaneConfig;
}

const DEFAULT_TOP: LaneConfig = {
  id: 'top',
  mode: 'rotating',
  intervalMs: 8000,
  // `pre-stream` last in the list as the pre-show / between-games
  // fallback. Its `selectData` returns null the moment a schedule
  // entry is set as currently-playing, so it doesn't compete with
  // current-game / playtime / objective during a live segment —
  // it only activates when the lane would otherwise be empty
  // (pre-event countdown, or the gap while the operator picks the
  // next game). Without a fallback like this, the top lane sits
  // blank pre-stream because every other panel returns null.
  panels: ['current-game', 'playtime', 'objective', 'setpiece', 'items-collected', 'pre-stream'],
};

const DEFAULT_BOTTOM: LaneConfig = {
  id: 'bottom',
  mode: 'rotating',
  intervalMs: 5000,
  panels: [
    'schedule-next',
    'donation-reel',
    'incentives',
    'bid-war',
    'milestones',
    'total-raised',
    'charity-info',
    'local-time',
  ],
};

export const DEFAULT_LAYOUT: OmnibarLayoutConfig = {
  top: DEFAULT_TOP,
  bottom: DEFAULT_BOTTOM,
};

export const ALL_PANEL_IDS = [
  // Status / top-lane affinity
  'current-game', 'playtime', 'objective', 'setpiece', 'items-collected',
  'pre-stream',
  // Ticker / bottom-lane affinity
  'schedule-next', 'donation-reel', 'incentives', 'bid-war', 'milestones',
  'total-raised', 'charity-info', 'local-time',
] as const;
export type PanelId = (typeof ALL_PANEL_IDS)[number];

const KNOWN_IDS = new Set<string>(ALL_PANEL_IDS);

interface RawLane {
  id?: string;
  mode?: string;
  intervalMs?: number;
  panels?: unknown[];
}

interface RawLayout {
  lanes?: RawLane[];
}

export function useLayoutConfig(
  event: EventModel | null,
  activeGame?: Game | null,
): OmnibarLayoutConfig {
  return useMemo(() => {
    // Resolution: game > event > defaults. Game is queried per-lane,
    // so a game can override just the top lane and inherit the event's
    // bottom lane.
    const gameParsed = parseLayoutRaw(activeGame?.omnibar_layout);
    const eventParsed = parseLayoutRaw(event?.omnibar_layout);
    return {
      top: gameParsed.top ?? eventParsed.top ?? DEFAULT_TOP,
      bottom: gameParsed.bottom ?? eventParsed.bottom ?? DEFAULT_BOTTOM,
    };
  }, [event?.omnibar_layout, activeGame?.omnibar_layout]);
}

/** Exported so the editor UI can round-trip without re-parsing JSON. */
export function parseLayout(raw: unknown): OmnibarLayoutConfig {
  const parsed = parseLayoutRaw(raw);
  return {
    top: parsed.top ?? DEFAULT_TOP,
    bottom: parsed.bottom ?? DEFAULT_BOTTOM,
  };
}

interface PartialLayout {
  top: LaneConfig | null;
  bottom: LaneConfig | null;
}

function parseLayoutRaw(raw: unknown): PartialLayout {
  if (!raw || typeof raw !== 'object') return { top: null, bottom: null };
  const layout = raw as RawLayout;
  if (!Array.isArray(layout.lanes)) return { top: null, bottom: null };
  return {
    top: pickLane(layout.lanes, 'top'),
    bottom: pickLane(layout.lanes, 'bottom'),
  };
}

function pickLane(lanes: RawLane[], id: 'top' | 'bottom'): LaneConfig | null {
  const lane = lanes.find((l) => l && l.id === id);
  if (!lane) return null;
  const mode = lane.mode === 'pinned' ? 'pinned' : 'rotating';
  const intervalMs =
    typeof lane.intervalMs === 'number' && lane.intervalMs >= 1000
      ? lane.intervalMs
      : id === 'top' ? 8000 : 5000;
  // Filter out unknown panel ids so a stale layout doesn't crash —
  // panels we don't have a registered handler for are silently dropped.
  const panels = Array.isArray(lane.panels)
    ? lane.panels.filter(
        (p): p is string => typeof p === 'string' && KNOWN_IDS.has(p),
      )
    : [];
  if (panels.length === 0) return null;
  return { id, mode, intervalMs, panels };
}
