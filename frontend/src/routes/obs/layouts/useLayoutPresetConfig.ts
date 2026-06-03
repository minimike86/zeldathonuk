/**
 * Reads a `LayoutPreset.config` JSON blob and produces a validated, stage-safe
 * arrangement for an OBS game layout. Mirrors the omnibar's
 * `useLayoutConfig` philosophy: unknown ids are dropped, missing fields fall
 * back to a per-layout default, and — crucially here — every box is clamped to
 * the **1920×984** stage so a hand-edited preset can never push the game
 * capture or a content region off-screen.
 *
 * Config shape (owned here, stored opaquely by the backend):
 *   {
 *     "variant": "game-center",
 *     "regions": {
 *       "left":  { "widthPx": 397, "elements": ["runners", "timer"] },
 *       "right": { "widthPx": 397, "elements": ["items-collected"] }
 *     }
 *   }
 *
 * The game capture is NOT a region element — it is positioned by the variant
 * and sized to fill the gap the regions leave, preserving its aspect ratio.
 */
import { useMemo } from 'react';
import type { LayoutKey, LayoutPreset } from '@/lib/obsApi';

// ── Stage geometry (hard limit) ─────────────────────────────────────────────
export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 984;

// ── Element palette ─────────────────────────────────────────────────────────
// Ids placeable into a layout region. The capture itself is implicit (driven
// by the variant), so it is not in this list.
export const ELEMENT_IDS = [
  'game-info',
  'runners',
  'timer',
  'items-collected',
  'objective-checklist',
  'next-objective',
  'death-count',
  'camera',
  'charity-ad',
] as const;
export type ElementId = (typeof ELEMENT_IDS)[number];

const KNOWN_ELEMENTS = new Set<string>(ELEMENT_IDS);

/** Legacy element ids folded into the combined `game-info` card. Translated on
 *  read so presets authored before the merge keep working — and a region that
 *  listed all three collapses to a single `game-info` (see the de-dupe in
 *  `parsePresetConfig`). Mirrors the omnibar's `objective → custom-objective`
 *  rename in `useLayoutConfig.ts`. */
const LEGACY_ELEMENT_ALIASES: Record<string, ElementId> = {
  'game-title': 'game-info',
  'cover-art': 'game-info',
  'game-meta': 'game-info',
};

/** Operator-facing label + hint for each element, surfaced in the
 *  /control/layouts editor (mirrors the omnibar's PANEL_DESCRIPTIONS). */
export const ELEMENT_META: Record<ElementId, { label: string; hint: string }> = {
  'game-info': { label: 'Game info', hint: 'Stylised card: cover art dimmed behind the title with a compact platform · year · ETA line. Adapts to the region width.' },
  'runners': { label: 'Runner(s)', hint: 'Runner names with their platform icon. Shows a dash when none are set.' },
  'timer': { label: 'Run timer', hint: 'Live play time for the current run (HH:MM:SS).' },
  'items-collected': { label: 'Items collected', hint: 'Sprite grid of the game items; collected ones glow. Hidden when the game has no items.' },
  'objective-checklist': { label: 'Objective checklist', hint: 'The current run section\'s objectives (obtained vs outstanding). Hidden when the game has no objectives.' },
  'next-objective': { label: 'Next objective', hint: 'The next outstanding objective in list order. Hidden when all are done.' },
  'death-count': { label: 'Death count', hint: 'Deaths for the current game (bumped from the Stream Deck).' },
  'camera': { label: 'Camera', hint: 'Transparent webcam reservation frame — an OBS camera source sits behind it.' },
  'charity-ad': { label: 'Charity / sponsor', hint: 'Rotating SpecialEffect / GameBlast logo over charity imagery.' },
};

// ── Variants ────────────────────────────────────────────────────────────────
// A variant fixes where the capture sits and which side regions exist. Only
// 4x3 is fully wired today; other layout types expose a single passthrough
// variant so the editor still works and they can adopt regions incrementally.

export type CapturePosition = 'left' | 'center' | 'right' | 'full';
export type RegionId = 'left' | 'right';

export interface VariantDef {
  id: string;
  label: string;
  capture: CapturePosition;
  /** Side regions this variant exposes, in visual order. */
  regions: RegionId[];
}

export const LAYOUT_VARIANTS: Record<LayoutKey, VariantDef[]> = {
  '4x3': [
    { id: 'game-left', label: 'Capture left', capture: 'left', regions: ['right'] },
    { id: 'game-center', label: 'Capture middle', capture: 'center', regions: ['left', 'right'] },
    { id: 'game-right', label: 'Capture right', capture: 'right', regions: ['left'] },
  ],
  // Not yet wired into the OBS renderer — a single passthrough variant keeps
  // the editor functional until each adopts the region framework.
  '16x9': [{ id: 'default', label: 'Default', capture: 'full', regions: [] }],
  '3ds': [{ id: 'default', label: 'Default', capture: 'full', regions: [] }],
  'ds-top': [{ id: 'default', label: 'Default', capture: 'full', regions: [] }],
  'ds-both': [{ id: 'default', label: 'Default', capture: 'full', regions: [] }],
  'fsa-split': [{ id: 'default', label: 'Default', capture: 'full', regions: [] }],
};

// ── Region width bounds (px) ────────────────────────────────────────────────
export const REGION_MIN_WIDTH = 200;
export const REGION_MAX_WIDTH = 1000;
// The capture must keep at least this much width so it never collapses; its
// height is separately clamped to STAGE_HEIGHT in computeGeometry.
const CAPTURE_MIN_WIDTH = 400;

export interface RegionConfig {
  widthPx: number;
  elements: ElementId[];
}

export interface PresetConfig {
  variant: VariantDef;
  regions: Record<RegionId, RegionConfig>;
}

// ── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_NARROW_LEFT: ElementId[] = ['game-info', 'runners', 'timer'];
const DEFAULT_NARROW_RIGHT: ElementId[] = ['items-collected', 'next-objective', 'death-count'];

// Region widths that let a true 4:3 capture reach the full 984px stage height:
//   single side  → 1920 − 608 = 1312 wide → 1312 × 3/4 = 984 tall (full height)
//   two sides    → 1920 − 304×2 = 1312 wide → 984 tall (full height)
// Operators can still widen a region (capture then letterboxes vertically) —
// these are just the sensible full-height starting points.
export const STANDARD_REGION_WIDTH_SINGLE = 608;
export const STANDARD_REGION_WIDTH_DUAL = 304;

/** Default region width for a variant, sized so the capture fills full height:
 *  narrower when two regions flank the capture, wider for a single side. */
export function defaultRegionWidth(regionCount: number): number {
  return regionCount >= 2 ? STANDARD_REGION_WIDTH_DUAL : STANDARD_REGION_WIDTH_SINGLE;
}

/** Per-layout fallback used when a preset is missing/blank/corrupt, so the
 *  stage never renders empty. Keyed by layout; the 4x3 default is the
 *  capture-centre arrangement. */
export function defaultPresetConfig(layoutType: LayoutKey): PresetConfig {
  const variants = LAYOUT_VARIANTS[layoutType] ?? LAYOUT_VARIANTS['4x3'];
  if (layoutType === '4x3') {
    const variant = variants.find((v) => v.id === 'game-center') ?? variants[0];
    return {
      variant,
      regions: {
        left: { widthPx: STANDARD_REGION_WIDTH_DUAL, elements: DEFAULT_NARROW_LEFT },
        right: { widthPx: STANDARD_REGION_WIDTH_DUAL, elements: DEFAULT_NARROW_RIGHT },
      },
    };
  }
  return { variant: variants[0], regions: { left: emptyRegion(), right: emptyRegion() } };
}

function emptyRegion(): RegionConfig {
  return { widthPx: STANDARD_REGION_WIDTH_DUAL, elements: [] };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Translate legacy element ids to their current id, drop unknowns, and
 *  de-dupe (preserving first-seen order) — so a region that listed the old
 *  game-title + cover-art + game-meta collapses to a single `game-info`. */
function normaliseElements(raw: unknown[]): ElementId[] {
  const out: ElementId[] = [];
  for (const e of raw) {
    if (typeof e !== 'string') continue;
    const id = (LEGACY_ELEMENT_ALIASES[e] ?? e) as ElementId;
    if (KNOWN_ELEMENTS.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

// ── Parser ──────────────────────────────────────────────────────────────────
/**
 * Validate a raw `LayoutPreset.config` into a `PresetConfig`. Falls back to the
 * per-layout default when the variant is unknown; per region, drops unknown
 * element ids and clamps the width to [REGION_MIN_WIDTH, REGION_MAX_WIDTH].
 * Side regions not present in the chosen variant are ignored.
 */
export function parsePresetConfig(raw: unknown, layoutType: LayoutKey): PresetConfig {
  const fallback = defaultPresetConfig(layoutType);
  if (!raw || typeof raw !== 'object') return fallback;
  const obj = raw as { variant?: unknown; regions?: unknown };

  const variants = LAYOUT_VARIANTS[layoutType] ?? LAYOUT_VARIANTS['4x3'];
  const variant =
    (typeof obj.variant === 'string' && variants.find((v) => v.id === obj.variant)) ||
    fallback.variant;

  const rawRegions =
    obj.regions && typeof obj.regions === 'object'
      ? (obj.regions as Record<string, unknown>)
      : {};

  const regions = { left: emptyRegion(), right: emptyRegion() } as Record<RegionId, RegionConfig>;
  for (const rid of variant.regions) {
    const fallbackRegion = fallback.regions[rid] ?? emptyRegion();
    const rawRegion = rawRegions[rid];
    if (!rawRegion || typeof rawRegion !== 'object') {
      regions[rid] = fallbackRegion;
      continue;
    }
    const rr = rawRegion as { widthPx?: unknown; elements?: unknown };
    const widthPx =
      typeof rr.widthPx === 'number' && Number.isFinite(rr.widthPx)
        ? clamp(Math.round(rr.widthPx), REGION_MIN_WIDTH, REGION_MAX_WIDTH)
        : fallbackRegion.widthPx;
    const elements = Array.isArray(rr.elements)
      ? normaliseElements(rr.elements)
      : fallbackRegion.elements;
    regions[rid] = { widthPx, elements };
  }
  return { variant, regions };
}

// ── Geometry ────────────────────────────────────────────────────────────────
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface LayoutGeometry {
  /** The game-capture rectangle (transparent; OBS source sits behind it). */
  capture: Box;
  /** Positioned content regions, keyed by region id. */
  regions: Partial<Record<RegionId, Box>>;
}

// Capture aspect ratio per layout. Only 4x3 is geometry-wired today.
const CAPTURE_ASPECT: Partial<Record<LayoutKey, number>> = {
  '4x3': 4 / 3,
};

/**
 * Turn a parsed config into absolute pixel boxes that always fit the
 * 1920×984 stage. Regions take their configured widths (already clamped);
 * the capture fills the remaining horizontal gap but preserves its aspect
 * ratio, so its height never exceeds STAGE_HEIGHT. The capture is centred
 * within its gap both ways. If the regions are wide enough to starve the
 * capture below CAPTURE_MIN_WIDTH, region widths are scaled down to give it
 * room — content shrinks, but nothing leaves the stage.
 */
export function computeGeometry(config: PresetConfig, layoutType: LayoutKey): LayoutGeometry {
  const aspect = CAPTURE_ASPECT[layoutType] ?? 4 / 3;
  const present = config.variant.regions;

  let totalRegionWidth = present.reduce((sum, rid) => sum + config.regions[rid].widthPx, 0);
  // Guarantee the capture keeps a minimum width.
  const maxRegionTotal = STAGE_WIDTH - CAPTURE_MIN_WIDTH;
  let scale = 1;
  if (totalRegionWidth > maxRegionTotal && totalRegionWidth > 0) {
    scale = maxRegionTotal / totalRegionWidth;
    totalRegionWidth = maxRegionTotal;
  }

  const widths: Record<string, number> = {};
  for (const rid of present) widths[rid] = Math.floor(config.regions[rid].widthPx * scale);

  const gapWidth = STAGE_WIDTH - present.reduce((s, rid) => s + widths[rid], 0);
  // Fit a capture of the layout's aspect ratio inside (gapWidth × STAGE_HEIGHT).
  let captureWidth = gapWidth;
  let captureHeight = captureWidth / aspect;
  if (captureHeight > STAGE_HEIGHT) {
    captureHeight = STAGE_HEIGHT;
    captureWidth = captureHeight * aspect;
  }

  // Horizontal slot for the capture depends on which side(s) hold regions.
  const leftRegionW = present.includes('left') ? widths['left'] : 0;
  const gapLeft = leftRegionW; // capture gap starts after any left region
  const captureLeft = gapLeft + (gapWidth - captureWidth) / 2;
  const captureTop = (STAGE_HEIGHT - captureHeight) / 2;

  const regions: Partial<Record<RegionId, Box>> = {};
  if (present.includes('left')) {
    regions.left = { left: 0, top: 0, width: widths['left'], height: STAGE_HEIGHT };
  }
  if (present.includes('right')) {
    regions.right = {
      left: STAGE_WIDTH - widths['right'],
      top: 0,
      width: widths['right'],
      height: STAGE_HEIGHT,
    };
  }

  return {
    capture: {
      left: Math.round(captureLeft),
      top: Math.round(captureTop),
      width: Math.round(captureWidth),
      height: Math.round(captureHeight),
    },
    regions,
  };
}

/**
 * Resolve the active preset for a layout type from a polled preset list and
 * return its parsed config + computed geometry. Memoised on the inputs so the
 * 2s poll doesn't churn the layout when nothing changed.
 */
export function useLayoutPresetConfig(
  presets: LayoutPreset[] | null | undefined,
  layoutType: LayoutKey,
): { config: PresetConfig; geometry: LayoutGeometry; activeName: string | null } {
  return useMemo(() => {
    const active = (presets ?? []).find(
      (p) => p.layout_type === layoutType && p.is_active,
    );
    const config = parsePresetConfig(active?.config, layoutType);
    return {
      config,
      geometry: computeGeometry(config, layoutType),
      activeName: active?.name ?? null,
    };
  }, [presets, layoutType]);
}
