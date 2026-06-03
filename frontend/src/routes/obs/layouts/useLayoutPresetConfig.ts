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

// ── Capture alignment + gap zones ───────────────────────────────────────────
// A fit capture touches its available box on one axis and leaves slack on the
// other. The operator can push the capture to an edge/corner (instead of the
// default centre); the freed slack tiles into up to four GAP zones around the
// capture(s) — clean rectangles, no L-shape — which can hold panels just like
// the carved edge zones.
export type AlignX = 'left' | 'center' | 'right';
export type AlignY = 'top' | 'center' | 'bottom';
export interface CaptureAlign {
  x: AlignX;
  y: AlignY;
}
export const DEFAULT_CAPTURE_ALIGN: CaptureAlign = { x: 'center', y: 'center' };

/** Gap-zone ids, by the side of the capture they occupy. Stored in
 *  `config.regions` (elements only — geometry is derived from the capture fit). */
export const GAP_IDS = ['gap-left', 'gap-right', 'gap-top', 'gap-bottom'] as const;
export type GapId = (typeof GAP_IDS)[number];
/** A gap must be at least this big along its axis to be worth offering. */
const GAP_MIN = 200;

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

/** Four Swords tuning — how the TV (4:3) and the four GBA screens (3:2) relate.
 *  `tvScale` is the TV's share of the layout's primary axis (height for the
 *  row arrangement, width for the column ones). `gbaGap` is the spacing between
 *  the TV and the GBA cluster (and between the GBAs). `gbaSpread` lifts the
 *  "fit the GBAs to the TV's span" restriction so they use the full available
 *  span instead. */
export interface FsaParams {
  tvScale: number;
  gbaGap: number;
  gbaSpread: boolean;
}
export const DEFAULT_FSA_PARAMS: FsaParams = { tvScale: 0.62, gbaGap: 16, gbaSpread: false };
export const FSA_TV_SCALE_MIN = 0.3;
export const FSA_TV_SCALE_MAX = 0.85;
export const FSA_GAP_MAX = 240;

/** Console-shell image fine-tuning. The geometry derives a base box from the
 *  capture bounding box; `scale` zooms it (about its centre) and `offsetX/Y`
 *  nudge it (stage px) so the operator can line the PNG's transparent screen
 *  holes up with the capture boxes. */
export interface ShellTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}
export const DEFAULT_SHELL_TRANSFORM: ShellTransform = { scale: 1, offsetX: 0, offsetY: 0 };
export const SHELL_SCALE_MIN = 0.3;
// Headroom: a full console PNG's screen holes are a fraction of the image, so
// aligning them to the capture bbox often needs a big zoom-up.
export const SHELL_SCALE_MAX = 5;
export const SHELL_OFFSET_MAX = 1920;

/** Per-screen size/position override for the multi-screen layouts (3DS / DS),
 *  so each screen capture can be nudged + resized to line up with the shell
 *  image's holes — or placed arbitrarily. `scale` zooms uniformly (aspect kept);
 *  `offsetX/Y` nudge it (stage px). The result is always clamped to the free
 *  (non-panel) area, so a screen can never stray into a panel zone or off-stage. */
export interface ScreenAdjust {
  scale: number;
  offsetX: number;
  offsetY: number;
}
export const DEFAULT_SCREEN_ADJUST: ScreenAdjust = { scale: 1, offsetX: 0, offsetY: 0 };
export const SCREEN_SCALE_MIN = 0.3;
export const SCREEN_SCALE_MAX = 3;
export const SCREEN_OFFSET_MAX = 1920;

/** Extra inputs passed to a variant's capture builder at geometry time. */
interface CaptureOpts {
  fsa: FsaParams;
}

export interface VariantDef {
  id: string;
  label: string;
  /** When true, the editor exposes a shell-image URL field; the renderer draws
   *  the operator's console image at `geometry.shell`. */
  hasShell?: boolean;
  /** When true, the editor exposes the Four Swords TV/GBA tuning controls. */
  usesFsaParams?: boolean;
  /** When true, the editor exposes per-screen size/position controls (3DS / DS),
   *  one per capture. */
  usesScreenAdjust?: boolean;
  /** Element zones, carved off the stage edges IN ORDER (see computeGeometry). */
  regions: RegionSlot[];
  /** Places the screen capture(s) (+ optional shell) in the space left after
   *  the zones are carved off the stage. */
  buildCaptures: (remaining: Box, opts: CaptureOpts) => { captures: CaptureBox[]; shell?: Box };
}

/** Axis a zone resizes along, derived from its edge. */
export const regionAxis = (edge: RegionEdge): 'width' | 'height' =>
  edge === 'left' || edge === 'right' ? 'width' : 'height';

// ── Capture builders ────────────────────────────────────────────────────────
const singleScreen = (aspect: number, shell: boolean) => (rem: Box, _opts: CaptureOpts) => {
  const cap = round(fitBox(rem, aspect));
  const out: { captures: CaptureBox[]; shell?: Box } = { captures: [cap] };
  if (shell) out.shell = round(inflate(cap, cap.width * 0.12, cap.height * 0.16));
  return out;
};

/** Screens stacked vertically (each fills a height band, centred). */
const stackV = (items: ScreenSpec[], shell: boolean) => (rem: Box, _opts: CaptureOpts) => {
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
const stackH = (items: ScreenSpec[], shell: boolean) => (rem: Box, _opts: CaptureOpts) => {
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

/** FSA: TV (4:3) on top, four GBA (3:2) in a row beneath. The GBA band is sized
 *  to the GBAs' actual height (no wasted vertical strip), and the whole cluster
 *  is centred in `rem`. `tvScale` sets the TV's height share; `gbaGap` the
 *  spacing; `gbaSpread` lets the GBAs use the full width instead of the TV's. */
const tvWithGbaRow = () => (rem: Box, { fsa }: CaptureOpts) => {
  const gap = clamp(fsa.gbaGap, 0, FSA_GAP_MAX);
  const tvScale = clamp(fsa.tvScale, FSA_TV_SCALE_MIN, FSA_TV_SCALE_MAX);

  let tvH = rem.height * tvScale;
  let tvW = (tvH * 4) / 3;
  if (tvW > rem.width) {
    tvW = rem.width;
    tvH = (tvW * 3) / 4;
  }
  const spanW = fsa.gbaSpread ? rem.width : tvW;
  const cellW = (spanW - gap * 3) / 4;
  const gbaH = (cellW * 2) / 3; // 3:2 → height = width × 2/3

  const clusterH = Math.min(rem.height, tvH + gap + gbaH);
  const clusterTop = rem.top + (rem.height - clusterH) / 2;
  const tvLeft = rem.left + (rem.width - tvW) / 2;
  const tv: CaptureBox = { left: tvLeft, top: clusterTop, width: tvW, height: tvH, label: 'TV' };

  const gbaRowW = cellW * 4 + gap * 3;
  const gbaLeft = rem.left + (rem.width - gbaRowW) / 2;
  const bandTop = clusterTop + tvH + gap;
  const gbas: CaptureBox[] = [];
  for (let i = 0; i < 4; i++) {
    gbas.push(round({ left: gbaLeft + i * (cellW + gap), top: bandTop, width: cellW, height: gbaH }));
    gbas[i].label = `GBA ${i + 1}`;
  }
  return { captures: [round(tv), ...gbas] };
};

/** FSA: TV (4:3) beside a column of four GBA (3:2) on `side`. The column is
 *  sized to the GBAs' actual width, and the TV + column cluster is centred.
 *  `tvScale` sets the TV's width share; `gbaGap` the spacing; `gbaSpread` lets
 *  the GBA column span the full height instead of just the TV's. */
const tvWithGbaColumn = (side: 'left' | 'right') => (rem: Box, { fsa }: CaptureOpts) => {
  const gap = clamp(fsa.gbaGap, 0, FSA_GAP_MAX);
  const tvScale = clamp(fsa.tvScale, FSA_TV_SCALE_MIN, FSA_TV_SCALE_MAX);

  let tvW = rem.width * tvScale;
  let tvH = (tvW * 3) / 4;
  if (tvH > rem.height) {
    tvH = rem.height;
    tvW = (tvH * 4) / 3;
  }
  const spanH = fsa.gbaSpread ? rem.height : tvH;
  const cellH = (spanH - gap * 3) / 4;
  const colW = (cellH * 3) / 2; // 3:2 → width = height × 3/2

  const clusterW = Math.min(rem.width, tvW + gap + colW);
  const clusterLeft = rem.left + (rem.width - clusterW) / 2;
  const tvLeft = side === 'left' ? clusterLeft + colW + gap : clusterLeft;
  const colLeft = side === 'left' ? clusterLeft : clusterLeft + tvW + gap;
  const tvTop = rem.top + (rem.height - tvH) / 2;
  const tv: CaptureBox = { left: tvLeft, top: tvTop, width: tvW, height: tvH, label: 'TV' };

  const colH = cellH * 4 + gap * 3;
  const colTop = rem.top + (rem.height - colH) / 2;
  const gbas: CaptureBox[] = [];
  for (let i = 0; i < 4; i++) {
    gbas.push(round({ left: colLeft, top: colTop + i * (cellH + gap), width: colW, height: cellH }));
    gbas[i].label = `GBA ${i + 1}`;
  }
  return { captures: [round(tv), ...gbas] };
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
  { id: 'stacked-left', label: 'Stacked, panels right', hasShell: true, usesScreenAdjust: true, regions: [col('right', 'right', 760)], buildCaptures: stackV(screens, true) },
  { id: 'stacked-right', label: 'Stacked, panels left', hasShell: true, usesScreenAdjust: true, regions: [col('left', 'left', 760)], buildCaptures: stackV(screens, true) },
  { id: 'sidebyside-top', label: 'Side by side, panels below', hasShell: true, usesScreenAdjust: true, regions: [strip('bottom', 'bottom', 260)], buildCaptures: stackH(screens, true) },
  { id: 'sidebyside-bottom', label: 'Side by side, panels above', hasShell: true, usesScreenAdjust: true, regions: [strip('top', 'top', 260)], buildCaptures: stackH(screens, true) },
];

export const LAYOUT_VARIANTS: Record<LayoutKey, VariantDef[]> = {
  '4x3': singleCaptureVariants(4 / 3, false).slice(0, 3),
  '16x9': singleCaptureVariants(16 / 9, false),
  'ds-top': singleCaptureVariants(4 / 3, true),
  '3ds': dualScreenVariants(THREE_DS_SCREENS),
  'ds-both': dualScreenVariants(DS_SCREENS),
  'fsa-split': [
    { id: 'gbas-under', label: 'GBAs under TV', usesFsaParams: true, regions: [col('right', 'right', 420)], buildCaptures: tvWithGbaRow() },
    { id: 'gbas-left', label: 'GBAs left of TV', usesFsaParams: true, regions: [strip('bottom', 'bottom', 200)], buildCaptures: tvWithGbaColumn('left') },
    { id: 'gbas-right', label: 'GBAs right of TV', usesFsaParams: true, regions: [strip('bottom', 'bottom', 200)], buildCaptures: tvWithGbaColumn('right') },
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
  /** Where the capture(s) sit within their available space — the freed slack
   *  becomes gap zones (see computeGeometry). */
  capture: CaptureAlign;
  /** Four Swords TV/GBA tuning (only meaningful for usesFsaParams variants). */
  fsa: FsaParams;
  /** Operator-supplied console shell image (DS/3DS variants). Empty = none. */
  shellImageUrl: string;
  /** Zoom + nudge for the shell image so its screen holes align to the captures. */
  shellTransform: ShellTransform;
  /** Per-screen size/position overrides, keyed by capture index ("0", "1", …).
   *  Only meaningful for usesScreenAdjust variants. */
  screens: Record<string, ScreenAdjust>;
}

// A `type` (not interface) so it carries an implicit index signature and is
// assignable to the API's `Record<string, unknown>` config field.
export type PresetConfigJson = {
  variant: string;
  regions: Record<string, RegionConfig>;
  capture: CaptureAlign;
  fsa: FsaParams;
  shellImageUrl: string;
  shellTransform: ShellTransform;
  screens: Record<string, ScreenAdjust>;
};

/** Build a default JSON config for a specific arrangement — used by the seed
 *  + the editor's "New preset" picker so a fresh preset starts populated. */
export function defaultConfigForVariant(variant: VariantDef): PresetConfigJson {
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
  return {
    variant: variant.id,
    regions,
    capture: { ...DEFAULT_CAPTURE_ALIGN },
    fsa: { ...DEFAULT_FSA_PARAMS },
    shellImageUrl: '',
    shellTransform: { ...DEFAULT_SHELL_TRANSFORM },
    screens: {},
  };
}

/** Per-layout fallback used when a preset is missing/blank/corrupt, so the
 *  stage never renders empty. */
export function defaultPresetConfig(layoutType: LayoutKey): PresetConfig {
  const variants = LAYOUT_VARIANTS[layoutType] ?? LAYOUT_VARIANTS['4x3'];
  const variant = variants.find((v) => v.id === 'game-center') ?? variants[0];
  const cfg = defaultConfigForVariant(variant);
  return {
    variant,
    regions: cfg.regions,
    capture: cfg.capture,
    fsa: cfg.fsa,
    shellImageUrl: cfg.shellImageUrl,
    shellTransform: cfg.shellTransform,
    screens: cfg.screens,
  };
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

  // Gap zones (elements only — geometry is derived from the capture fit). Kept
  // even though they aren't in `variant.regions`; computeGeometry only surfaces
  // the ones that actually fit, but we never want to silently drop the
  // operator's element choices for a gap that's momentarily too small.
  for (const gid of GAP_IDS) {
    const rawRegion = rawRegions[gid];
    if (!rawRegion || typeof rawRegion !== 'object') continue;
    const els = (rawRegion as { elements?: unknown }).elements;
    if (Array.isArray(els)) regions[gid] = { widthPx: 0, elements: normaliseElements(els) };
  }

  const rawCapture = (obj as { capture?: unknown }).capture;
  const capture = parseAlign(rawCapture);
  const fsa = parseFsa((obj as { fsa?: unknown }).fsa);
  const shellTransform = parseShellTransform((obj as { shellTransform?: unknown }).shellTransform);
  const screens = parseScreens((obj as { screens?: unknown }).screens);
  const shellImageUrl =
    typeof (obj as { shellImageUrl?: unknown }).shellImageUrl === 'string'
      ? ((obj as { shellImageUrl: string }).shellImageUrl)
      : fallback.shellImageUrl;
  return { variant, regions, capture, fsa, shellImageUrl, shellTransform, screens };
}

/** Validate stored per-screen overrides, clamping each. Keyed by capture index. */
function parseScreens(raw: unknown): Record<string, ScreenAdjust> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, ScreenAdjust> = {};
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    if (!val || typeof val !== 'object') continue;
    const r = val as { scale?: unknown; offsetX?: unknown; offsetY?: unknown };
    const num = (v: unknown, fb: number, lo: number, hi: number) =>
      typeof v === 'number' && Number.isFinite(v) ? clamp(v, lo, hi) : fb;
    out[key] = {
      scale: num(r.scale, DEFAULT_SCREEN_ADJUST.scale, SCREEN_SCALE_MIN, SCREEN_SCALE_MAX),
      offsetX: num(r.offsetX, 0, -SCREEN_OFFSET_MAX, SCREEN_OFFSET_MAX),
      offsetY: num(r.offsetY, 0, -SCREEN_OFFSET_MAX, SCREEN_OFFSET_MAX),
    };
  }
  return out;
}

/** Validate a stored shell-transform blob, clamping + defaulting each field. */
function parseShellTransform(raw: unknown): ShellTransform {
  const r = (raw ?? {}) as { scale?: unknown; offsetX?: unknown; offsetY?: unknown };
  const num = (v: unknown, fallback: number, lo: number, hi: number) =>
    typeof v === 'number' && Number.isFinite(v) ? clamp(v, lo, hi) : fallback;
  return {
    scale: num(r.scale, DEFAULT_SHELL_TRANSFORM.scale, SHELL_SCALE_MIN, SHELL_SCALE_MAX),
    offsetX: num(r.offsetX, 0, -SHELL_OFFSET_MAX, SHELL_OFFSET_MAX),
    offsetY: num(r.offsetY, 0, -SHELL_OFFSET_MAX, SHELL_OFFSET_MAX),
  };
}

/** Validate a stored Four Swords tuning blob, clamping + defaulting each field. */
function parseFsa(raw: unknown): FsaParams {
  const r = (raw ?? {}) as { tvScale?: unknown; gbaGap?: unknown; gbaSpread?: unknown };
  const tvScale =
    typeof r.tvScale === 'number' && Number.isFinite(r.tvScale)
      ? clamp(r.tvScale, FSA_TV_SCALE_MIN, FSA_TV_SCALE_MAX)
      : DEFAULT_FSA_PARAMS.tvScale;
  const gbaGap =
    typeof r.gbaGap === 'number' && Number.isFinite(r.gbaGap)
      ? clamp(Math.round(r.gbaGap), 0, FSA_GAP_MAX)
      : DEFAULT_FSA_PARAMS.gbaGap;
  const gbaSpread = typeof r.gbaSpread === 'boolean' ? r.gbaSpread : DEFAULT_FSA_PARAMS.gbaSpread;
  return { tvScale, gbaGap, gbaSpread };
}

/** Validate a stored capture-alignment blob, defaulting unknown values to centre. */
function parseAlign(raw: unknown): CaptureAlign {
  const r = (raw ?? {}) as { x?: unknown; y?: unknown };
  const x: AlignX = r.x === 'left' || r.x === 'right' ? r.x : 'center';
  const y: AlignY = r.y === 'top' || r.y === 'bottom' ? r.y : 'center';
  return { x, y };
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

/** A gap zone left around the capture(s) after alignment — offered in the
 *  editor as a place to add panels, whether or not it currently holds any. */
export interface GapSlot {
  id: GapId;
  edge: RegionEdge;
  box: Box;
}

export interface LayoutGeometry {
  /** Transparent game-capture window(s); OBS sources sit behind them. */
  captures: CaptureBox[];
  /** Positioned content regions (carved edge zones + filled gap zones), keyed
   *  by region id. */
  regions: Record<string, Box>;
  /** Console-shell image box (DS/3DS), when the variant frames the screens. */
  shell?: Box;
  /** Gap zones available around the capture(s), per the current alignment. */
  gaps: GapSlot[];
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

/** Translate a box by (dx, dy). */
function shift(b: Box, dx: number, dy: number): Box {
  return { left: b.left + dx, top: b.top + dy, width: b.width, height: b.height };
}

/** Zoom (about centre) + nudge a box per a shell transform. */
function transformShell(b: Box, t: ShellTransform): Box {
  const w = b.width * t.scale;
  const h = b.height * t.scale;
  return {
    left: b.left + t.offsetX - (w - b.width) / 2,
    top: b.top + t.offsetY - (h - b.height) / 2,
    width: w,
    height: h,
  };
}

/** Apply a per-screen override to a capture box: zoom uniformly (aspect kept,
 *  capped so it still fits `bounds`) about its centre, nudge, then clamp the
 *  position so the box stays entirely inside `bounds` (the free, non-panel area). */
function adjustScreen(base: Box, adj: ScreenAdjust, bounds: Box): Box {
  const maxScale = Math.min(bounds.width / base.width, bounds.height / base.height);
  const scale = clamp(adj.scale, SCREEN_SCALE_MIN, Math.max(SCREEN_SCALE_MIN, maxScale));
  const w = base.width * scale;
  const h = base.height * scale;
  let left = base.left + (base.width - w) / 2 + adj.offsetX;
  let top = base.top + (base.height - h) / 2 + adj.offsetY;
  left = clamp(left, bounds.left, bounds.left + bounds.width - w);
  top = clamp(top, bounds.top, bounds.top + bounds.height - h);
  return { left, top, width: w, height: h };
}

/** Offset to move a box of `size` within `slack` per a 3-way alignment. */
function alignOffset(slack: number, align: 'left' | 'center' | 'right' | 'top' | 'bottom'): number {
  if (slack <= 0) return 0;
  if (align === 'left' || align === 'top') return -slack / 2; // builders centre, so undo half then go to start
  if (align === 'right' || align === 'bottom') return slack / 2;
  return 0; // center — already centred by the builders
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

  const built = config.variant.buildCaptures(remaining, { fsa: config.fsa });

  // The builders centre the capture(s) in `remaining`. Re-position per the
  // operator's alignment, then tile the freed slack into gap zones around them.
  const cb = bbox(built.captures);
  const slackX = remaining.width - cb.width;
  const slackY = remaining.height - cb.height;
  const dx = alignOffset(slackX, config.capture.x);
  const dy = alignOffset(slackY, config.capture.y);

  // Shift each capture by the cluster alignment, then apply any per-screen
  // override (zoom + nudge), clamped to the free area so a screen can't slip
  // into a panel zone or off-stage.
  const captures = built.captures.map((c, i) => {
    const shifted = shift(c, dx, dy);
    const adj = config.screens[String(i)];
    const box = adj ? adjustScreen(shifted, adj, remaining) : shifted;
    return { ...round(box), label: c.label };
  });
  // Shell follows the capture shift, then the operator's zoom + nudge so the
  // PNG's screen holes can be lined up with the capture boxes.
  const shell = built.shell
    ? round(transformShell(shift(built.shell, dx, dy), config.shellTransform))
    : undefined;

  // Tile the leftover around the (shifted) capture bounding box. Side gaps own
  // the full-height outer columns; top/bottom gaps own the vertical slack inside
  // the capture's column — so the four never overlap, even when both axes have
  // slack (e.g. FSA's TV+GBA column).
  const c2 = bbox(captures);
  const left = remaining.left;
  const top = remaining.top;
  const right = remaining.left + remaining.width;
  const bottom = remaining.top + remaining.height;
  const candidates: GapSlot[] = [
    { id: 'gap-left', edge: 'left', box: round({ left, top, width: c2.left - left, height: remaining.height }) },
    { id: 'gap-right', edge: 'right', box: round({ left: c2.left + c2.width, top, width: right - (c2.left + c2.width), height: remaining.height }) },
    { id: 'gap-top', edge: 'top', box: round({ left: c2.left, top, width: c2.width, height: c2.top - top }) },
    { id: 'gap-bottom', edge: 'bottom', box: round({ left: c2.left, top: c2.top + c2.height, width: c2.width, height: bottom - (c2.top + c2.height) }) },
  ];
  const axisSize = (g: GapSlot) => (g.edge === 'left' || g.edge === 'right' ? g.box.width : g.box.height);
  const gaps = candidates.filter((g) => axisSize(g) >= GAP_MIN);

  // Surface gap zones that the operator has actually filled as live regions.
  for (const g of gaps) {
    if ((config.regions[g.id]?.elements.length ?? 0) > 0) regions[g.id] = g.box;
  }

  return { captures, shell, regions, gaps };
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
