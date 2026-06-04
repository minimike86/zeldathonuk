import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { LayoutKey } from '@/lib/obsApi';
import { Widescreen } from './layouts/Widescreen';
import { Standard } from './layouts/Standard';
import { ThreeDs } from './layouts/ThreeDs';
import { DsTop } from './layouts/DsTop';
import { DsBoth } from './layouts/DsBoth';
import { FsaSplit } from './layouts/FsaSplit';
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

const REGISTRY: Record<LayoutKey, ComponentType> = {
  '16x9': Widescreen,
  '4x3': Standard,
  '3ds': ThreeDs,
  'ds-top': DsTop,
  'ds-both': DsBoth,
  'fsa-split': FsaSplit,
};

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

export function UnifiedLayout() {
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, 2000);
  const currentLayout = cp?.schedule_entry_detail?.game?.layout_type;
  const layoutKey: LayoutKey =
    currentLayout && REGISTRY[currentLayout] ? currentLayout : FALLBACK;

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

  const Component = REGISTRY[renderedKey] ?? Widescreen;

  // The game whose layout drove the pick — shown as context on the badge so
  // the operator can tie the layout back to the entry on screen.
  const gameTitle = cp?.schedule_entry_detail?.game?.title;
  // Distinguish an explicit per-game layout from the safety fallback.
  const isFallback = !(currentLayout && REGISTRY[currentLayout]);

  return (
    <div className="obs-unified" aria-hidden>
      <div className="obs-unified-stage" key={`${renderedKey}-${tick}`}>
        <Component />
      </div>
      <div className="obs-unified-layout-badge">
        <span className="obs-unified-layout-tag">
          Layout{isFallback ? ' · Default' : ''}
        </span>
        <span className="obs-unified-layout-name">{LAYOUT_LABELS[renderedKey]}</span>
        {gameTitle && <span className="obs-unified-layout-game">{gameTitle}</span>}
      </div>
      <div className="obs-unified-omnibar">
        <Omnibar />
      </div>
    </div>
  );
}
