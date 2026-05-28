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

// ── Donation reel ──────────────────────────────────────────────────────
//
// Configuration for the DonationReelPanel — how it cycles between the
// most-recent N donors and how the transition between them is animated.
// Stored on `Event.omnibar_layout.donationReel`; an event without the
// key falls back to `DEFAULT_DONATION_REEL`.

export type DonationReelDirection = 'up' | 'down' | 'left' | 'right' | 'fade';

export interface DonationReelConfig {
  /** Direction the donor row enters from (it exits in the matching
   *  opposite direction; e.g. `up` = enter from below, exit upward). */
  direction: DonationReelDirection;
  /** Duration of the row's enter animation, in ms. */
  enterMs: number;
  /** Duration of the row's exit animation, in ms. */
  exitMs: number;
  /** Gap between the previous donor's exit completing and the next
   *  donor's enter starting, in ms. The reel is empty during this
   *  window so the two donors never overlap on-screen. */
  leadInMs: number;
  /** Time the row sits fully landed between enter and exit, in ms. */
  dwellMs: number;
  /** How many donors are kept in the reel. */
  reelLength: number;
}

export const DEFAULT_DONATION_REEL: DonationReelConfig = {
  direction: 'up',
  enterMs: 320,
  exitMs: 320,
  leadInMs: 80,
  dwellMs: 2000,
  reelLength: 5,
};

const REEL_DIRECTIONS: DonationReelDirection[] = ['up', 'down', 'left', 'right', 'fade'];

// Bounds the control-panel editor also pins to.
export const REEL_ANIM_MIN_MS = 100;
export const REEL_ANIM_MAX_MS = 1500;
export const REEL_LEAD_IN_MIN_MS = 0;
export const REEL_LEAD_IN_MAX_MS = 2000;
export const REEL_DWELL_MIN_MS = 100;
export const REEL_DWELL_MAX_MS = 10000;
export const REEL_LENGTH_MIN = 1;
export const REEL_LENGTH_MAX = 10;

export function readDonationReelConfig(layout: unknown): DonationReelConfig {
  if (!layout || typeof layout !== 'object') return DEFAULT_DONATION_REEL;
  const raw = (layout as { donationReel?: unknown }).donationReel;
  if (!raw || typeof raw !== 'object') return DEFAULT_DONATION_REEL;
  const v = raw as Record<string, unknown>;
  const direction =
    typeof v.direction === 'string' &&
    REEL_DIRECTIONS.includes(v.direction as DonationReelDirection)
      ? (v.direction as DonationReelDirection)
      : DEFAULT_DONATION_REEL.direction;
  // Backward-compat: the previous shape had `switchMs` shared by both
  // enter and exit. Fall back to it when the split fields are absent.
  const switchFallback =
    typeof v.switchMs === 'number'
      ? clamp(Math.round(v.switchMs), REEL_ANIM_MIN_MS, REEL_ANIM_MAX_MS)
      : null;
  const enterMs =
    typeof v.enterMs === 'number'
      ? clamp(Math.round(v.enterMs), REEL_ANIM_MIN_MS, REEL_ANIM_MAX_MS)
      : switchFallback ?? DEFAULT_DONATION_REEL.enterMs;
  const exitMs =
    typeof v.exitMs === 'number'
      ? clamp(Math.round(v.exitMs), REEL_ANIM_MIN_MS, REEL_ANIM_MAX_MS)
      : switchFallback ?? DEFAULT_DONATION_REEL.exitMs;
  const leadInMs =
    typeof v.leadInMs === 'number'
      ? clamp(Math.round(v.leadInMs), REEL_LEAD_IN_MIN_MS, REEL_LEAD_IN_MAX_MS)
      : DEFAULT_DONATION_REEL.leadInMs;
  // Backward-compat: previous shape had `cycleMs` = interval between
  // switches starting. We translate that to a dwell of (cycle - one
  // switch) when the new field is absent, so existing saved configs
  // still pace correctly.
  const dwellFallback =
    typeof v.cycleMs === 'number'
      ? clamp(
          Math.round(v.cycleMs - (switchFallback ?? DEFAULT_DONATION_REEL.enterMs)),
          REEL_DWELL_MIN_MS,
          REEL_DWELL_MAX_MS,
        )
      : null;
  const dwellMs =
    typeof v.dwellMs === 'number'
      ? clamp(Math.round(v.dwellMs), REEL_DWELL_MIN_MS, REEL_DWELL_MAX_MS)
      : dwellFallback ?? DEFAULT_DONATION_REEL.dwellMs;
  const reelLength =
    typeof v.reelLength === 'number'
      ? clamp(Math.round(v.reelLength), REEL_LENGTH_MIN, REEL_LENGTH_MAX)
      : DEFAULT_DONATION_REEL.reelLength;
  return { direction, enterMs, exitMs, leadInMs, dwellMs, reelLength };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

interface RawLane {
  id?: string;
  mode?: string;
  // `intervalMs` was the lane-level "rotate every" speed; it's now
  // vestigial (per-panel dwell drives rotation cadence) but legacy
  // saved layouts may still carry the key. Accept it in the raw
  // type so destructure-style reads don't fight TypeScript even
  // though we no longer act on it.
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
  // Filter out unknown panel ids so a stale layout doesn't crash —
  // panels we don't have a registered handler for are silently dropped.
  const panels = Array.isArray(lane.panels)
    ? lane.panels.filter(
        (p): p is string => typeof p === 'string' && KNOWN_IDS.has(p),
      )
    : [];
  if (panels.length === 0) return null;
  // `lane.intervalMs` is intentionally ignored — rotation cadence
  // is now driven by per-panel transitions config (dwell + delays).
  return { id, mode, panels };
}
