import { Stage, GameFrame, SidePanel } from './Layout';

/**
 * 4:3 standard — narrow game frame centered-left, taller side panel on
 * the right. Stage is 1920×(1080 − omnibar); the omnibar is a separate
 * OBS browser source added below this one.
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
          height: 'var(--obs-stage-height)',
        }}
      />
    </Stage>
  );
}
