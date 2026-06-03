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
/** Fallback device label for single-capture layouts (multi-capture builders set
 *  their own per-screen labels). Shown in the alignment guide overlay. */
const CAPTURE_DEVICE_LABEL: Partial<Record<LayoutKey, string>> = {
  '4x3': '4:3 Capture',
  '16x9': '16:9 Capture',
  'ds-top': 'DS — Top Screen',
};

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

  // Global capture-alignment guide, toggled from /control/layouts. Polled here
  // (separate browser context from control) + bumped on the layoutBus so a
  // same-browser toggle reflects immediately.
  const { data: guideData } = usePolledQuery(() => obsApi.layoutGuide(), 5000, [bump]);
  const guide = guideData?.show_guide ?? false;

  const { config, geometry } = useLayoutPresetConfig(presets, layoutType);

  // Fetch the currently-playing entry + the event-level feed ONCE and thread
  // them down — see RegionRenderer's note on the per-element polling trap.
  const entry = useCurrentEntry();
  const needed = useMemo(
    () => neededSources(Object.values(config.regions).flatMap((r) => r.elements)),
    [config],
  );
  const feed = useRegionFeed(needed);

  return (
    <Stage>
      {/* Operator console shell image (DS/3DS) — framing the screen cutouts.
          Clipped to the free capture area so a zoomed/nudged shell that creeps
          past the screens is cropped at the panel boundary, leaving panel zones
          (e.g. a transparent camera) uncovered. */}
      {config.shellImageUrl && geometry.shell && (
        <div
          className="obs-region-shell-clip"
          aria-hidden
          style={{
            left: `${geometry.captureArea.left}px`,
            top: `${geometry.captureArea.top}px`,
            width: `${geometry.captureArea.width}px`,
            height: `${geometry.captureArea.height}px`,
          }}
        >
          <img
            className="obs-region-shell"
            src={config.shellImageUrl}
            alt=""
            style={{
              left: `${geometry.shell.left - geometry.captureArea.left}px`,
              top: `${geometry.shell.top - geometry.captureArea.top}px`,
              width: `${geometry.shell.width}px`,
              height: `${geometry.shell.height}px`,
            }}
          />
        </div>
      )}

      {/* Transparent game-capture windows — OBS sources sit behind them. */}
      {geometry.captures.map((cap, i) => (
        <GameFrame
          key={i}
          guide={guide}
          label={cap.label ?? CAPTURE_DEVICE_LABEL[layoutType] ?? 'Capture'}
          style={{
            left: `${cap.left}px`,
            top: `${cap.top}px`,
            width: `${cap.width}px`,
            height: `${cap.height}px`,
          }}
        />
      ))}

      {/* Freed regions with the operator's chosen elements — carved edge zones
          plus any gap zones the operator filled (both live in geometry.regions). */}
      {Object.entries(geometry.regions).map(([rid, box]) => (
        <RegionRenderer
          key={rid}
          box={box}
          elements={config.regions[rid]?.elements ?? []}
          entry={entry}
          feed={feed}
        />
      ))}
    </Stage>
  );
}
