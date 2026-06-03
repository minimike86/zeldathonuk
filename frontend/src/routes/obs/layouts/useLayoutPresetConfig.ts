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
  // Fundraising
  'total-raised',
  'donation-reel',
  'incentives',
  'milestones',
  'raffle',
  // Run / stream info
  'schedule-next',
  'custom-objective',
  'setpiece',
  'local-time',
  'total-playtime',
  // Media / misc
  'pre-stream',
  'event-info',
  'bid-war',
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
  // Fundraising
  'total-raised': { label: 'Total raised', hint: 'The running fundraising total + donation count for the active event.' },
  'donation-reel': { label: 'Donation reel', hint: 'A short list of the most recent donors + amounts. Hidden when there are no donations.' },
  'incentives': { label: 'Incentives', hint: 'Open donation goals with progress bars. Hidden when none are active.' },
  'milestones': { label: 'Milestones', hint: 'The next un-reached fundraising milestone + progress toward it.' },
  'raffle': { label: 'Raffle', hint: 'Active raffle name + entrant count. Hidden when no raffle is open.' },
  // Run / stream info
  'schedule-next': { label: 'Up next', hint: 'The next scheduled game after the current one. Hidden once the lineup is empty.' },
  'custom-objective': { label: 'Custom objective', hint: 'The operator\'s free-text "current objective" from the live entry. Hidden when blank.' },
  'setpiece': { label: 'Setpiece', hint: 'Current boss / dungeon setpiece banner. Hidden unless one is in progress.' },
  'local-time': { label: 'Local time', hint: 'Wall-clock time — always shown.' },
  'total-playtime': { label: 'Total play time', hint: 'Cumulative time since the event start.' },
  // Media / misc
  'pre-stream': { label: 'Pre-stream countdown', hint: 'Counts down to the event start; auto-hides once a game is live.' },
  'event-info': { label: 'Event info', hint: 'Event name + day counter for the active event.' },
  'bid-war': { label: 'Bid war', hint: 'Bid-war option stack. Hidden unless an incentive carries ≥2 options.' },
};

// ── Region width bounds (px) ────────────────────────────────────────────────
export const REGION_MIN_WIDTH = 200;
export const REGION_MAX_WIDTH = 1000;
// The captures must keep at least this much room after zones are carved, so a
// zone can never starve the screens off the stage.
const CAPTURE_MIN_WIDTH = 400;
const CAPTURE_MIN_HEIGHT = 260;

// Region widths that let a true 4:3 capture reach the full 984px stage height:
//   single side  → 1920 − 608 = 1312 wide → 1312 × 3/4 = 984 tall (full height)
//   two sides    → 1920 − 304×2 = 1312 wide → 984 tall (full height)
// Operators can still widen a region (capture then letterboxes vertically) —
// these are just the sensible full-height starting points. Declared up here so
// the capture-builder factories below can reference them at module-init time.
export const STANDARD_REGION_WIDTH_SINGLE = 608;
export const STANDARD_REGION_WIDTH_DUAL = 304;

export interface RegionConfig {
  widthPx: number;
  elements: ElementId[];
}

// ── Variants (arrangements) ──────────────────────────────────────────────────
// Each variant is a distinct ARRANGEMENT (its own preset — no in-preset variant
// dropdown). It declares the element ZONES carved off the stage edges (the free
// space around the screens) and a builder that places the transparent
// game-capture window(s) — aspect-correct — in whatever space is left.

export type RegionEdge = 'left' | 'right' | 'top' | 'bottom';

export interface RegionSlot {
  id: string;
  edge: RegionEdge;
  resizable: boolean;
  /** Default size along the zone's axis: width for left/right, height for top/bottom. */
  defaultSize: number;
}

/** One screen's spec for the stack/row builders. */
interface ScreenSpec {
  aspect: number;
  label: string;
  /** Relative share of the band when several screens stack (default 1). */
  weight?: number;
}

export interface VariantDef {
  id: string;
  label: string;
  /** When true, the editor exposes a shell-image URL field; the renderer draws
   *  the operator's console image at `geometry.shell`. */
  hasShell?: boolean;
  /** Element zones, carved off the stage edges IN ORDER (see computeGeometry). */
  regions: RegionSlot[];
  /** Places the screen capture(s) (+ optional shell) in the space left after
   *  the zones are carved off the stage. */
  buildCaptures: (remaining: Box) => { captures: CaptureBox[]; shell?: Box };
}

/** Axis a zone resizes along, derived from its edge. */
export const regionAxis = (edge: RegionEdge): 'width' | 'height' =>
  edge === 'left' || edge === 'right' ? 'width' : 'height';

// ── Capture builders ────────────────────────────────────────────────────────
const singleScreen = (aspect: number, shell: boolean) => (rem: Box) => {
  const cap = round(fitBox(rem, aspect));
  const out: { captures: CaptureBox[]; shell?: Box } = { captures: [cap] };
  if (shell) out.shell = round(inflate(cap, cap.width * 0.12, cap.height * 0.16));
  return out;
};

/** Screens stacked vertically (each fills a height band, centred). */
const stackV = (items: ScreenSpec[], shell: boolean) => (rem: Box) => {
  const gap = 24;
  const wsum = items.reduce((a, s) => a + (s.weight ?? 1), 0);
  const avail = rem.height - gap * (items.length - 1);
  let y = rem.top;
  const captures: CaptureBox[] = items.map((s) => {
    const bandH = (avail * (s.weight ?? 1)) / wsum;
    const cap = round(fitBox({ left: rem.left, top: y, width: rem.width, height: bandH }, s.aspect));
    y += bandH + gap;
    return { ...cap, label: s.label };
  });
  const out: { captures: CaptureBox[]; shell?: Box } = { captures };
  if (shell) out.shell = round(inflate(bbox(captures), 30, 24));
  return out;
};

/** Screens side-by-side (each fills a width band, centred). */
const stackH = (items: ScreenSpec[], shell: boolean) => (rem: Box) => {
  const gap = 24;
  const wsum = items.reduce((a, s) => a + (s.weight ?? 1), 0);
  const avail = rem.width - gap * (items.length - 1);
  let x = rem.left;
  const captures: CaptureBox[] = items.map((s) => {
    const bandW = (avail * (s.weight ?? 1)) / wsum;
    const cap = round(fitBox({ left: x, top: rem.top, width: bandW, height: rem.height }, s.aspect));
    x += bandW + gap;
    return { ...cap, label: s.label };
  });
  const out: { captures: CaptureBox[]; shell?: Box } = { captures };
  if (shell) out.shell = round(inflate(bbox(captures), 30, 24));
  return out;
};

/** FSA: TV (4:3) on top, four GBA (3:2) in a row spanning the TV's width. */
const tvWithGbaRow = () => (rem: Box) => {
  const gap = 16;
  const tvH = rem.height * 0.62;
  const tv = round(fitBox({ ...rem, height: tvH }, 4 / 3));
  const bandTop = rem.top + tvH + gap;
  const bandH = rem.height - tvH - gap;
  const cellW = (tv.width - gap * 3) / 4;
  const gbas: CaptureBox[] = [];
  for (let i = 0; i < 4; i++) {
    const cell: Box = { left: tv.left + i * (cellW + gap), top: bandTop, width: cellW, height: bandH };
    gbas.push({ ...round(fitBox(cell, 3 / 2)), label: `GBA ${i + 1}` });
  }
  return { captures: [{ ...tv, label: 'TV' }, ...gbas] };
};

/** FSA: TV (4:3) with four GBA (3:2) stacked in a column on `side`. */
const tvWithGbaColumn = (side: 'left' | 'right') => (rem: Box) => {
  const gap = 16;
  const cellH = (rem.height - gap * 3) / 4;
  const colW = cellH * (3 / 2);
  const colLeft = side === 'left' ? rem.left : rem.left + rem.width - colW;
  const gbas: CaptureBox[] = [];
  for (let i = 0; i < 4; i++) {
    const cell: Box = { left: colLeft, top: rem.top + i * (cellH + gap), width: colW, height: cellH };
    gbas.push({ ...round(fitBox(cell, 3 / 2)), label: `GBA ${i + 1}` });
  }
  const tvRem: Box =
    side === 'left'
      ? { left: rem.left + colW + gap, top: rem.top, width: rem.width - colW - gap, height: rem.height }
      : { left: rem.left, top: rem.top, width: rem.width - colW - gap, height: rem.height };
  const tv = round(fitBox(tvRem, 4 / 3));
  return { captures: [{ ...tv, label: 'TV' }, ...gbas] };
};

// ── Zone slot helpers ─────────────────────────────────────────────────────────
const col = (id: string, edge: 'left' | 'right', size: number): RegionSlot => ({
  id,
  edge,
  resizable: true,
  defaultSize: size,
});
const strip = (id: string, edge: 'top' | 'bottom', size = 220): RegionSlot => ({
  id,
  edge,
  resizable: true,
  defaultSize: size,
});

/** Single-capture arrangements (capture left/middle/right + screen top/mid/bottom).
 *  Variant ids stay `game-*` / `screen-*` so existing 4x3 presets keep working. */
const singleCaptureVariants = (aspect: number, shell: boolean): VariantDef[] => [
  { id: 'game-left', label: 'Capture left', hasShell: shell, regions: [col('right', 'right', STANDARD_REGION_WIDTH_SINGLE)], buildCaptures: singleScreen(aspect, shell) },
  { id: 'game-center', label: 'Capture middle', hasShell: shell, regions: [col('left', 'left', STANDARD_REGION_WIDTH_DUAL), col('right', 'right', STANDARD_REGION_WIDTH_DUAL)], buildCaptures: singleScreen(aspect, shell) },
  { id: 'game-right', label: 'Capture right', hasShell: shell, regions: [col('left', 'left', STANDARD_REGION_WIDTH_SINGLE)], buildCaptures: singleScreen(aspect, shell) },
  { id: 'screen-top', label: 'Screen top', hasShell: shell, regions: [strip('bottom', 'bottom')], buildCaptures: singleScreen(aspect, shell) },
  { id: 'screen-middle', label: 'Screen middle', hasShell: shell, regions: [strip('top', 'top'), strip('bottom', 'bottom')], buildCaptures: singleScreen(aspect, shell) },
  { id: 'screen-bottom', label: 'Screen bottom', hasShell: shell, regions: [strip('top', 'top')], buildCaptures: singleScreen(aspect, shell) },
];

const DS_SCREENS: ScreenSpec[] = [
  { aspect: 4 / 3, label: 'Top screen' },
  { aspect: 4 / 3, label: 'Bottom screen' },
];
const THREE_DS_SCREENS: ScreenSpec[] = [
  { aspect: 5 / 3, label: 'Top screen', weight: 0.62 },
  { aspect: 4 / 3, label: 'Bottom screen', weight: 0.38 },
];

/** Dual-screen arrangements: screens stacked (column zone) or side-by-side
 *  (strip zone), on either side / top-bottom. */
const dualScreenVariants = (screens: ScreenSpec[]): VariantDef[] => [
  { id: 'stacked-left', label: 'Stacked, panels right', hasShell: true, regions: [col('right', 'right', 760)], buildCaptures: stackV(screens, true) },
  { id: 'stacked-right', label: 'Stacked, panels left', hasShell: true, regions: [col('left', 'left', 760)], buildCaptures: stackV(screens, true) },
  { id: 'sidebyside-top', label: 'Side by side, panels below', hasShell: true, regions: [strip('bottom', 'bottom', 260)], buildCaptures: stackH(screens, true) },
  { id: 'sidebyside-bottom', label: 'Side by side, panels above', hasShell: true, regions: [strip('top', 'top', 260)], buildCaptures: stackH(screens, true) },
];

export const LAYOUT_VARIANTS: Record<LayoutKey, VariantDef[]> = {
  '4x3': singleCaptureVariants(4 / 3, false).slice(0, 3),
  '16x9': singleCaptureVariants(16 / 9, false),
  'ds-top': singleCaptureVariants(4 / 3, true),
  '3ds': dualScreenVariants(THREE_DS_SCREENS),
  'ds-both': dualScreenVariants(DS_SCREENS),
  'fsa-split': [
    { id: 'gbas-under', label: 'GBAs under TV', regions: [col('right', 'right', 420)], buildCaptures: tvWithGbaRow() },
    { id: 'gbas-left', label: 'GBAs left of TV', regions: [strip('bottom', 'bottom', 200)], buildCaptures: tvWithGbaColumn('left') },
    { id: 'gbas-right', label: 'GBAs right of TV', regions: [strip('bottom', 'bottom', 200)], buildCaptures: tvWithGbaColumn('right') },
  ],
};

// ── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_NARROW_LEFT: ElementId[] = ['game-info', 'runners', 'timer'];
const DEFAULT_NARROW_RIGHT: ElementId[] = ['items-collected', 'next-objective', 'death-count'];
const DEFAULT_SIDE: ElementId[] = ['game-info', 'runners', 'timer', 'items-collected'];

/** Default region width for a variant, sized so the capture fills full height:
 *  narrower when two regions flank the capture, wider for a single side. */
export function defaultRegionWidth(regionCount: number): number {
  return regionCount >= 2 ? STANDARD_REGION_WIDTH_DUAL : STANDARD_REGION_WIDTH_SINGLE;
}

export interface PresetConfig {
  variant: VariantDef;
  regions: Record<string, RegionConfig>;
  /** Operator-supplied console shell image (DS/3DS variants). Empty = none. */
  shellImageUrl: string;
}

/** Build a default JSON config for a specific arrangement — used by the seed
 *  + the editor's "New preset" picker so a fresh preset starts populated. */
export function defaultConfigForVariant(
  variant: VariantDef,
): { variant: string; regions: Record<string, RegionConfig>; shellImageUrl: string } {
  const regions: Record<string, RegionConfig> = {};
  const two = variant.regions.length === 2;
  variant.regions.forEach((slot, i) => {
    regions[slot.id] = {
      widthPx: slot.defaultSize,
      elements: two
        ? i === 0
          ? [...DEFAULT_NARROW_LEFT]
          : [...DEFAULT_NARROW_RIGHT]
        : [...DEFAULT_SIDE],
    };
  });
  return { variant: variant.id, regions, shellImageUrl: '' };
}

/** Per-layout fallback used when a preset is missing/blank/corrupt, so the
 *  stage never renders empty. */
export function defaultPresetConfig(layoutType: LayoutKey): PresetConfig {
  const variants = LAYOUT_VARIANTS[layoutType] ?? LAYOUT_VARIANTS['4x3'];
  const variant = variants.find((v) => v.id === 'game-center') ?? variants[0];
  const cfg = defaultConfigForVariant(variant);
  return { variant, regions: cfg.regions, shellImageUrl: cfg.shellImageUrl };
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

  const regions: Record<string, RegionConfig> = {};
  for (const slot of variant.regions) {
    const rid = slot.id;
    const fallbackRegion = fallback.regions[rid] ?? { widthPx: slot.defaultSize, elements: [] };
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
  const shellImageUrl =
    typeof (obj as { shellImageUrl?: unknown }).shellImageUrl === 'string'
      ? ((obj as { shellImageUrl: string }).shellImageUrl)
      : fallback.shellImageUrl;
  return { variant, regions, shellImageUrl };
}

// ── Geometry ────────────────────────────────────────────────────────────────
export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CaptureBox extends Box {
  /** Optional label shown in the editor preview (e.g. "Top screen"). */
  label?: string;
}

export interface LayoutGeometry {
  /** Transparent game-capture window(s); OBS sources sit behind them. */
  captures: CaptureBox[];
  /** Positioned content regions, keyed by region id. */
  regions: Record<string, Box>;
  /** Console-shell image box (DS/3DS), when the variant frames the screens. */
  shell?: Box;
}

function round(b: Box): Box {
  return {
    left: Math.round(b.left),
    top: Math.round(b.top),
    width: Math.round(b.width),
    height: Math.round(b.height),
  };
}

/** Largest box of `aspect` (w/h) fitting inside `outer`, centred. */
function fitBox(outer: Box, aspect: number): Box {
  let width = outer.width;
  let height = width / aspect;
  if (height > outer.height) {
    height = outer.height;
    width = height * aspect;
  }
  return {
    left: outer.left + (outer.width - width) / 2,
    top: outer.top + (outer.height - height) / 2,
    width,
    height,
  };
}

/** Bounding box of several boxes. */
function bbox(boxes: Box[]): Box {
  const l = Math.min(...boxes.map((b) => b.left));
  const t = Math.min(...boxes.map((b) => b.top));
  const r = Math.max(...boxes.map((b) => b.left + b.width));
  const bot = Math.max(...boxes.map((b) => b.top + b.height));
  return { left: l, top: t, width: r - l, height: bot - t };
}

/** Grow a box by padX/padY each side, clamped to the stage. */
function inflate(b: Box, padX: number, padY: number): Box {
  const left = Math.max(0, b.left - padX);
  const top = Math.max(0, b.top - padY);
  const right = Math.min(STAGE_WIDTH, b.left + b.width + padX);
  const bot = Math.min(STAGE_HEIGHT, b.top + b.height + padY);
  return { left, top, width: right - left, height: bot - top };
}

/**
 * Edge-carving geometry: starting from the full 1920×984 stage, carve each zone
 * off its edge (a strip of the configured size — width for left/right, height for
 * top/bottom), clamped so the screens always keep room; then the variant's
 * builder fits the capture(s) (+ shell) into what's left.
 */
export function computeGeometry(config: PresetConfig): LayoutGeometry {
  let remaining: Box = { left: 0, top: 0, width: STAGE_WIDTH, height: STAGE_HEIGHT };
  const regions: Record<string, Box> = {};

  for (const slot of config.variant.regions) {
    const want = slot.resizable
      ? config.regions[slot.id]?.widthPx ?? slot.defaultSize
      : slot.defaultSize;
    if (slot.edge === 'left' || slot.edge === 'right') {
      const size = Math.max(0, Math.min(clamp(Math.round(want), REGION_MIN_WIDTH, REGION_MAX_WIDTH), remaining.width - CAPTURE_MIN_WIDTH));
      if (slot.edge === 'left') {
        regions[slot.id] = { left: remaining.left, top: remaining.top, width: size, height: remaining.height };
        remaining = { left: remaining.left + size, top: remaining.top, width: remaining.width - size, height: remaining.height };
      } else {
        regions[slot.id] = { left: remaining.left + remaining.width - size, top: remaining.top, width: size, height: remaining.height };
        remaining = { ...remaining, width: remaining.width - size };
      }
    } else {
      const size = Math.max(0, Math.min(clamp(Math.round(want), REGION_MIN_WIDTH, REGION_MAX_WIDTH), remaining.height - CAPTURE_MIN_HEIGHT));
      if (slot.edge === 'top') {
        regions[slot.id] = { left: remaining.left, top: remaining.top, width: remaining.width, height: size };
        remaining = { left: remaining.left, top: remaining.top + size, width: remaining.width, height: remaining.height - size };
      } else {
        regions[slot.id] = { left: remaining.left, top: remaining.top + remaining.height - size, width: remaining.width, height: size };
        remaining = { ...remaining, height: remaining.height - size };
      }
    }
  }

  const built = config.variant.buildCaptures(remaining);
  return { captures: built.captures, shell: built.shell, regions };
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
      geometry: computeGeometry(config),
      activeName: active?.name ?? null,
    };
  }, [presets, layoutType]);
}
