import { Stage, GameFrame, SidePanel } from './Layout';

/**
 * 4:3 standard — narrow game frame centered-left, taller side panel on the right.
 */
export function Standard() {
  return (
    <Stage>
      <GameFrame
        style={{
          top: '0',
          left: '180px',
          width: '1080px',
          height: '810px',
        }}
      />
      <SidePanel
        position={{
          top: '0',
          right: '0',
          width: '660px',
          height: '1080px',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '810px',
          left: '0',
          width: '1260px',
          height: '270px',
          background: 'linear-gradient(180deg, rgba(43, 27, 37, 0.95), rgba(76, 19, 36, 0.95))',
          borderTop: '2px solid #b92753',
        }}
      >
        <iframe
          src="/obs/omnibar"
          title="omnibar"
          style={{ width: '100%', height: '100%', border: 0, background: 'transparent' }}
        />
      </div>
    </Stage>
  );
}
