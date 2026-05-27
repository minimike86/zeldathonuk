import { Stage, GameFrame, RunnerTimerCard, GameDescCard, CameraFrame, AdPanel } from './Layout';

/**
 * 3DS — mirrors the legacy Angular `ds3-bottom-panel` geometry so existing
 * OBS scene collections drop in unchanged.
 *
 * Three transparent windows for the OBS capture sources to sit beneath:
 *   - Top screen   (1366×820, right column)
 *   - Bottom screen (554×413, top-left)
 *   - Camera       (554×407, mid-left)
 *
 * The remaining cells hold opaque chrome that the React layout already
 * provides: an ad/sponsor block on the bottom-left, and a runner-timer +
 * game-description strip across the right column's lower 204px.
 *
 * Total 1920×1024 (stage = 1080 − omnibar 56).
 *
 *   ┌──────────┬───────────────────────────────┐
 *   │ Bottom   │ Top screen 1366×820           │
 *   │ screen   │ (transparent game capture)    │
 *   │ 554×413  │                               │
 *   │ (transp) │                               │
 *   ├──────────┤                               │
 *   │ Camera   │                               │
 *   │ 554×407  │                               │
 *   │ (transp) │                               │
 *   ├──────────┼──────────────┬────────────────┤
 *   │ Ad panel │ Runner+Timer │ Game desc      │
 *   │ 554×204  │ 616×204      │ 750×204        │
 *   └──────────┴──────────────┴────────────────┘
 */
export function ThreeDs() {
  return (
    <Stage variant="3ds">
      {/* Left column — bottom 3DS screen, camera, ad panel stacked.
       *  Inline gold border on the bottom-screen frame so the seam
       *  between the (transparent) bottom-screen and the (transparent)
       *  camera is visible — otherwise the two windows read as one
       *  fused void. */}
      <GameFrame
        style={{
          top: '0',
          left: '0',
          width: '554px',
          height: '413px',
          borderBottom: '2px solid var(--obs-accent, #e71347)',
        }}
      />
      <CameraFrame
        style={{ top: '413px', left: '0', width: '554px', height: '407px' }}
      />
      <AdPanel
        style={{ top: '820px', left: '0', width: '554px', height: '204px' }}
      />

      {/* Right column — top 3DS screen on top, runner/timer + game desc
       *  beneath. */}
      <GameFrame
        style={{ top: '0', left: '554px', width: '1366px', height: '820px' }}
      />
      <RunnerTimerCard
        style={{ top: '820px', left: '554px', width: '616px', height: '204px' }}
      />
      <GameDescCard
        style={{ top: '820px', left: '1170px', width: '750px', height: '204px' }}
      />
    </Stage>
  );
}
