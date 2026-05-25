import { Stage, GameFrame, SidePanel } from './Layout';

/**
 * 3DS — top screen wider, bottom screen narrower, stacked vertically.
 */
export function ThreeDs() {
  return (
    <Stage>
      <GameFrame
        style={{ top: '40px', left: '160px', width: '1120px', height: '672px' }}
      />
      <GameFrame
        style={{ top: '740px', left: '320px', width: '800px', height: '240px' }}
      />
      <SidePanel
        position={{ top: '0', right: '0', width: '480px', height: '1080px' }}
      />
    </Stage>
  );
}
