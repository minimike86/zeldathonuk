import { useEffect, useMemo, useState } from 'react';
import { obsApi, usePolledQuery, type LayoutKey } from '@/lib/obsApi';
import { onLayoutChanged } from '@/lib/layoutBus';
import { Stage, GameFrame, useCurrentEntry } from './Layout';
import { RegionRenderer } from './RegionRenderer';
import { useLayoutPresetConfig } from './useLayoutPresetConfig';
import { neededSources, useRegionFeed } from './useRegionFeed';

/**
 * Generic preset-driven game layout for ANY aspect ratio. The active preset for
 * `layoutType` (managed in /control/layouts) drives:
 *   - the variant's transparent game-capture window(s) — one for 4x3 / 16x9 /
 *     ds-top, several for 3ds / ds-both / fsa-split,
 *   - an optional operator-supplied console shell image framing the screens,
 *   - the freed regions and the elements placed in each.
 * Geometry is clamped to the 1920×984 stage by useLayoutPresetConfig.
 */
export function PresetLayout({ layoutType }: { layoutType: LayoutKey }) {
  // Self-fetch presets so this works both in /obs/full and the standalone
  // /obs/layout/<type> route. Bump on layoutBus so an activate/edit lands fast.
  const [bump, setBump] = useState(0);
  useEffect(() => onLayoutChanged(() => setBump((b) => b + 1)), []);
  const { data: presets } = usePolledQuery(
    () => obsApi.layoutPresets(layoutType),
    5000,
    [bump, layoutType],
  );

  const { config, geometry } = useLayoutPresetConfig(presets, layoutType);

  // Fetch the currently-playing entry + the event-level feed ONCE and thread
  // them down — see RegionRenderer's note on the per-element polling trap.
  const entry = useCurrentEntry();
  const needed = useMemo(
    () => neededSources(config.variant.regions.flatMap((slot) => config.regions[slot.id]?.elements ?? [])),
    [config],
  );
  const feed = useRegionFeed(needed);

  return (
    <Stage>
      {/* Operator console shell image (DS/3DS) — framing the screen cutouts. */}
      {config.shellImageUrl && geometry.shell && (
        <img
          className="obs-region-shell"
          src={config.shellImageUrl}
          alt=""
          aria-hidden
          style={{
            left: `${geometry.shell.left}px`,
            top: `${geometry.shell.top}px`,
            width: `${geometry.shell.width}px`,
            height: `${geometry.shell.height}px`,
          }}
        />
      )}

      {/* Transparent game-capture windows — OBS sources sit behind them. */}
      {geometry.captures.map((cap, i) => (
        <GameFrame
          key={i}
          style={{
            left: `${cap.left}px`,
            top: `${cap.top}px`,
            width: `${cap.width}px`,
            height: `${cap.height}px`,
          }}
        />
      ))}

      {/* Freed regions with the operator's chosen elements. */}
      {config.variant.regions.map((slot) => {
        const box = geometry.regions[slot.id];
        if (!box) return null;
        return (
          <RegionRenderer
            key={slot.id}
            box={box}
            elements={config.regions[slot.id]?.elements ?? []}
            entry={entry}
            feed={feed}
          />
        );
      })}
    </Stage>
  );
}
