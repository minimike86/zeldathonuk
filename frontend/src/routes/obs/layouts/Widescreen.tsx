import { Stage, GameFrame, RunnerTimerCard, GameDescCard, CameraFrame, AdPanel } from './Layout';

/**
 * 16:9 widescreen layout — matches the legacy Angular widescreen-side-panel
 * geometry so an existing OBS scene collection drops in unchanged.
 *
 * Total 1920×(1080 − omnibar). Omnibar is a separate /obs/omnibar browser
 * source pinned below this one.
 *
 *   ┌──────────────────────────────┬──────────┐
 *   │ Game capture 1442×809        │ Ad 479×  │
 *   │ (transparent)                │ 510      │
 *   │                              ├──────────┤
 *   ├────────────────┬─────────────┤ Camera   │
 *   │ Runner + Timer │ Game desc   │ 479×514  │
 *   │ 691×215        │ 750×215     │ (transp) │
 *   └────────────────┴─────────────┴──────────┘
 */
export function Widescreen() {
  return (
    <Stage>
      {/* Game capture — transparent so the OBS game-capture source below
       *  shows through unobstructed. */}
      <GameFrame
        style={{ top: '0', left: '0', width: '1442px', height: '809px' }}
      />

      {/* Bottom strip — runner/timer + game description, sharing the same
       *  bloodmoon styling. */}
      <RunnerTimerCard
        style={{ top: '809px', left: '0', width: '691px', height: '215px' }}
      />
      <GameDescCard
        style={{ top: '809px', left: '691px', width: '751px', height: '215px' }}
      />

      {/* Right column — ad panel up top, camera frame below. */}
      <AdPanel
        style={{ top: '0', right: '0', width: '479px', height: '510px' }}
      />
      <CameraFrame
        style={{ top: '510px', right: '0', width: '479px', height: '514px' }}
      />
    </Stage>
  );
}
