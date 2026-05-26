import { Stage, GameFrame, SidePanel } from './Layout';

/**
 * 16:9 widescreen — game capture occupies the left ~75%, side panel on the
 * right. Sized for a 1920×(1080 − omnibar) OBS canvas. The omnibar is a
 * separate browser source added below this one in OBS, so this page only
 * paints inside `var(--obs-stage-height)`.
 */
export function Widescreen() {
  return (
    <Stage>
      <GameFrame
        style={{
          top: '0',
          left: '0',
          width: '1440px',
          height: '810px',
        }}
      />
      <SidePanel
        position={{
          top: '0',
          right: '0',
          width: '480px',
          height: 'var(--obs-stage-height)',
        }}
      />
    </Stage>
  );
}
