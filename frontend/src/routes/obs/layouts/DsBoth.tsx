import { Stage, GameFrame, SidePanel } from './Layout';

/**
 * DS — both screens shown stacked vertically. Useful for Phantom Hourglass /
 * Spirit Tracks where both screens see game action.
 */
export function DsBoth() {
  return (
    <Stage>
      <GameFrame
        style={{ top: '40px', left: '320px', width: '960px', height: '480px' }}
      />
      <GameFrame
        style={{ top: '540px', left: '320px', width: '960px', height: '480px' }}
      />
      <SidePanel
        position={{ top: '0', right: '0', width: '480px', height: '1080px' }}
      />
    </Stage>
  );
}
