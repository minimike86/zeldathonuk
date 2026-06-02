import { useEffect, useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import { onLayoutChanged } from '@/lib/layoutBus';
import { Stage, GameFrame } from './Layout';
import { RegionRenderer } from './RegionRenderer';
import { useLayoutPresetConfig } from './useLayoutPresetConfig';

/**
 * 4:3 standard layout. The game capture's position (left / middle / right) and
 * the elements shown in the freed region(s) come from the **active 4x3 layout
 * preset** (managed in /control/layouts). Geometry is clamped to the 1920×984
 * stage by `useLayoutPresetConfig` so a preset can never push content
 * off-screen. Falls back to a sensible capture-centre arrangement when no
 * preset is active.
 */
export function Standard() {
  // Self-fetch presets so this works both inside /obs/full and via the
  // standalone /obs/layout/4x3 route. Bump the poll the instant a preset is
  // activated/edited in another tab so a live capture-position swap lands fast.
  const [bump, setBump] = useState(0);
  useEffect(() => onLayoutChanged(() => setBump((b) => b + 1)), []);
  const { data: presets } = usePolledQuery(() => obsApi.layoutPresets('4x3'), 2000, [bump]);

  const { config, geometry } = useLayoutPresetConfig(presets, '4x3');

  return (
    <Stage>
      <GameFrame
        style={{
          left: `${geometry.capture.left}px`,
          top: `${geometry.capture.top}px`,
          width: `${geometry.capture.width}px`,
          height: `${geometry.capture.height}px`,
        }}
      />
      {config.variant.regions.map((rid) => {
        const box = geometry.regions[rid];
        if (!box) return null;
        return (
          <RegionRenderer key={rid} box={box} elements={config.regions[rid].elements} />
        );
      })}
    </Stage>
  );
}
