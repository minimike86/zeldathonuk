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
import { Omnibar } from './Omnibar';
import './unified.css';

/**
 * Single OBS browser source that combines the game-layout view (chosen
 * automatically from the currently-playing entry's `layout_type`) with
 * the omnibar pinned to the bottom strip.
 *
 * Layout stack:
 *   ┌────────────────────────────────┐
 *   │ Auto-picked layout 1920×1024   │  (uses .obs-stage)
 *   ├────────────────────────────────┤
 *   │ Omnibar 1920×56                │  (uses .omnibar)
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

  return (
    <div className="obs-unified" aria-hidden>
      <div className="obs-unified-stage" key={`${renderedKey}-${tick}`}>
        <Component />
      </div>
      <div className="obs-unified-omnibar">
        <Omnibar />
      </div>
    </div>
  );
}
