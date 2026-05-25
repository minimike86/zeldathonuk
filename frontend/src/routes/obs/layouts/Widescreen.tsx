import { Stage, GameFrame, SidePanel } from './Layout';

/**
 * 16:9 widescreen — game capture occupies the left ~75%, side panel on the right.
 * Sized for a 1920x1080 OBS canvas.
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
          height: '1080px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '810px',
          left: '0',
          width: '1440px',
          height: '270px',
          background: 'linear-gradient(180deg, rgba(43, 27, 37, 0.95), rgba(76, 19, 36, 0.95))',
          borderTop: '2px solid #b92753',
        }}
      >
        {/* Lower-third strip is where the omnibar plugs in. */}
        <iframe
          src="/obs/omnibar"
          title="omnibar"
          style={{ width: '100%', height: '100%', border: 0, background: 'transparent' }}
        />
      </div>
    </Stage>
  );
}
