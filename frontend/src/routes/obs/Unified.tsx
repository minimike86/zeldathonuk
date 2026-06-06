import { useEffect, useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { LayoutKey } from '@/lib/obsApi';
import { PresetLayout } from './layouts/PresetLayout';
import { Omnibar } from './omnibar/Omnibar';
import './unified.css';

/**
 * Single OBS browser source that combines the game-layout view (chosen
 * automatically from the currently-playing entry's `layout_type`) with
 * the omnibar pinned to the bottom strip.
 *
 * Layout stack:
 *   ┌────────────────────────────────┐
 *   │ Auto-picked layout 1920×984    │  (uses .obs-stage)
 *   ├────────────────────────────────┤
 *   │ Omnibar v2 1920×96             │  (uses .omnibar--v2)
 *   └────────────────────────────────┘
 *
 * Streamers can drop ONE source pointing at /obs/full and the scene
 * follows the schedule automatically as games swap.
 */

/** Human-readable names for each layout key, surfaced on the corner badge so
 *  operators can see at a glance which game layout the scene auto-picked. */
const LAYOUT_LABELS: Record<LayoutKey, string> = {
  '16x9': 'Widescreen 16:9',
  '4x3': 'Standard 4:3',
  '3ds': 'Nintendo 3DS',
  'ds-top': 'DS · Top Screen',
  'ds-both': 'DS · Both Screens',
  'fsa-split': 'Four Swords Split',
};

const FALLBACK: LayoutKey = '16x9';

/** The badge parks itself in each corner in turn so an operator can see what
 *  sits behind it — useful when tuning the underlying layouts. Order walks the
 *  perimeter clockwise from the top-left. */
const CORNERS = ['tl', 'tr', 'br', 'bl'] as const;
/** Seconds the badge dwells in each corner before hopping to the next. */
const CORNER_DWELL_MS = 30000;

export function UnifiedLayout() {
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, 2000);
  // Operator override (set in /control/layouts). When a valid layout type is
  // forced, it wins over the playing game's layout_type; blank = follow the
  // schedule. Polled here so /obs/full switches type the moment it's set.
  const { data: guide } = usePolledQuery(() => obsApi.layoutGuide(), 2000);
  const forced = guide?.forced_layout_type;
  const isForced = !!(forced && LAYOUT_LABELS[forced]);

  const currentLayout = cp?.schedule_entry_detail?.game?.layout_type;
  const autoLayout: LayoutKey =
    currentLayout && LAYOUT_LABELS[currentLayout] ? currentLayout : FALLBACK;
  const layoutKey: LayoutKey = isForced ? forced : autoLayout;

  // Crossfade on layout change — give the wrapper a `key` that swaps so
  // React unmounts the old layout and CSS fade-in plays on mount.
  const [renderedKey, setRenderedKey] = useState<LayoutKey>(layoutKey);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (layoutKey !== renderedKey) {
      setRenderedKey(layoutKey);
      setTick((t) => t + 1);
    }
  }, [layoutKey, renderedKey]);

  // Walk the badge around the four corners on a timer so each corner of the
  // broadcast is briefly unobscured for layout tuning.
  const [cornerIndex, setCornerIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setCornerIndex((i) => (i + 1) % CORNERS.length);
    }, CORNER_DWELL_MS);
    return () => clearInterval(id);
  }, []);
  const corner = CORNERS[cornerIndex];

  // The game whose layout drove the pick — shown as context on the badge so
  // the operator can tie the layout back to the entry on screen.
  const gameTitle = cp?.schedule_entry_detail?.game?.title;
  // Distinguish an operator-forced layout, an explicit per-game layout, and the
  // safety fallback — only "auto with no game layout" counts as a fallback.
  const isFallback = !isForced && !(currentLayout && LAYOUT_LABELS[currentLayout]);
  const tagSuffix = isForced ? ' · Forced' : isFallback ? ' · Default' : '';

  // Name the LIVE resolved layout (not the crossfade-delayed `renderedKey`), so
  // the debug badge updates the instant the playing game's layout_type changes
  // rather than waiting on the fade. Show the raw key + the game's stored
  // layout_type too, so it's unambiguous what the auto-pick actually read.
  const rawLayout = currentLayout ?? '—';

  return (
    <div className="obs-unified" aria-hidden>
      <div className="obs-unified-stage" key={`${renderedKey}-${tick}`}>
        <PresetLayout layoutType={renderedKey} />
      </div>
      <div className={`obs-unified-layout-badge obs-unified-layout-badge--${corner}`}>
        <span className="obs-unified-layout-tag">
          Layout{tagSuffix}
        </span>
        <span className="obs-unified-layout-name">{LAYOUT_LABELS[layoutKey]}</span>
        <span className="obs-unified-layout-key">
          {layoutKey}
          {isForced || isFallback ? ` · game: ${rawLayout}` : ''}
        </span>
        {gameTitle && <span className="obs-unified-layout-game">{gameTitle}</span>}
      </div>
      <div className="obs-unified-omnibar">
        <Omnibar />
      </div>
    </div>
  );
}
