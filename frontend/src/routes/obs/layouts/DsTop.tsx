import { Stage, GameFrame, SidePanel } from './Layout';

/**
 * DS — top screen only. Larger crop, like the 3DS layout but no bottom screen.
 */
export function DsTop() {
  return (
    <Stage>
      <GameFrame
        style={{ top: '100px', left: '160px', width: '1280px', height: '960px' }}
      />
      <SidePanel
        position={{ top: '0', right: '0', width: '480px', height: '1080px' }}
      />
    </Stage>
  );
}
