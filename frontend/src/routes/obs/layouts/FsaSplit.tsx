import { Stage, GameFrame, SidePanel } from './Layout';

/**
 * Four Swords Adventures — four GBA viewports + a TV screen.
 * Layout: TV (GameCube) in the top half, 4 GBAs along the bottom.
 */
export function FsaSplit() {
  return (
    <Stage>
      <GameFrame
        style={{ top: '0', left: '0', width: '1440px', height: '540px' }}
      />
      <GameFrame
        style={{ top: '540px', left: '0', width: '360px', height: '540px' }}
      />
      <GameFrame
        style={{ top: '540px', left: '360px', width: '360px', height: '540px' }}
      />
      <GameFrame
        style={{ top: '540px', left: '720px', width: '360px', height: '540px' }}
      />
      <GameFrame
        style={{ top: '540px', left: '1080px', width: '360px', height: '540px' }}
      />
      <SidePanel
        position={{ top: '0', right: '0', width: '480px', height: '1080px' }}
      />
    </Stage>
  );
}
