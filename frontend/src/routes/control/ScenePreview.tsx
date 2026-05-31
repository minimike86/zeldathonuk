import type { ComponentType } from 'react';
import { themeToCssVars, type GameTheme } from '../obs/game-themes';
import '../obs/scenes/scenes.css';

const STAGE_W = 1920;
const STAGE_H = 1080;

/**
 * Renders a single /obs/audio-countdown scene at thumbnail size. The scene
 * components are authored against a 1920x1080 .ac-stage and use absolute /
 * percentage positioning, so we render them at full resolution inside a
 * fixed-size inner box and CSS-scale the box down to the preview tile.
 *
 * The outer wrapper mimics .ac-stage (theme CSS vars + radial bg gradient)
 * so per-game colour variables (--ac-primary etc.) cascade into the scene's
 * children exactly as they would in production.
 */
export function ScenePreview({
  Scene,
  theme,
  width = 320,
}: {
  Scene: ComponentType;
  theme: GameTheme;
  width?: number;
}) {
  const height = Math.round((width * STAGE_H) / STAGE_W);
  const scale = width / STAGE_W;
  return (
    <div
      className="scene-preview"
      style={{ ...themeToCssVars(theme), width, height }}
    >
      <div
        className="scene-preview-stage"
        style={{ transform: `scale(${scale})` }}
      >
        <Scene />
      </div>
    </div>
  );
}
