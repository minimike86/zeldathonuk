import type { ReactNode } from 'react';

/**
 * The Legend of Zelda (NES, 1986) scene — top-down 8-bit overworld.
 *
 * Layout, top to bottom:
 *
 *   • NES HUD strip (level, score, rupee/key/bomb counts, B/A buttons, heart row)
 *   • Mountain wall with a centred cave entrance, the Wooden Sword bobbing
 *     above it, and the old man's "IT'S DANGEROUS TO GO ALONE!" text fading
 *     in and out — the iconic opening screen.
 *   • Grass field with a sandy path winding across, scattered bushes, trees,
 *     and rocks.
 *   • An 8-bit Link sprite walks back and forth across the path.
 *   • An Octorok on the right fires a rock projectile that travels across
 *     the screen and respawns.
 *   • Heart, rupee, and a faint Triforce glow round things out.
 *
 * All artwork is inline SVG using NES-palette colours and
 * `shape-rendering="crispEdges"` so the pixels stay chunky.
 */
export function NesScene() {
  return (
    <div className="nes-scene" aria-hidden="true">
      {/* Distant Triforce glow far back, top-left, as a faint ambient tease */}
      <svg className="nes-triforce-bg" viewBox="-60 -55 120 110" shapeRendering="crispEdges">
        <g fill="#ffd23a" opacity="0.9">
          <path d="M-30 30 L-15 5 L0 30 Z" />
          <path d="M0 30 L15 5 L30 30 Z" />
          <path d="M-15 5 L0 -22 L15 5 Z" />
        </g>
      </svg>

      {/* ── NES HUD strip ── */}
      <div className="nes-hud">
        <div className="nes-hud-block nes-hud-map">
          <div className="nes-hud-label">LEVEL-1</div>
          <div className="nes-hud-mini-map">
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} className={`nes-mini-cell ${i === 11 ? 'is-here' : ''}`} />
            ))}
          </div>
        </div>
        <div className="nes-hud-block nes-hud-inventory">
          <div className="nes-hud-row">
            <span className="nes-hud-icon nes-icon-rupee" />
            <span className="nes-hud-text">x255</span>
          </div>
          <div className="nes-hud-row">
            <span className="nes-hud-icon nes-icon-key" />
            <span className="nes-hud-text">x08</span>
          </div>
          <div className="nes-hud-row">
            <span className="nes-hud-icon nes-icon-bomb" />
            <span className="nes-hud-text">x12</span>
          </div>
        </div>
        <div className="nes-hud-block nes-hud-items">
          <div className="nes-hud-slot nes-slot-b">
            <span className="nes-slot-label">B</span>
            <span className="nes-hud-icon nes-icon-boomerang" />
          </div>
          <div className="nes-hud-slot nes-slot-a">
            <span className="nes-slot-label">A</span>
            <span className="nes-hud-icon nes-icon-sword" />
          </div>
        </div>
        <div className="nes-hud-block nes-hud-life">
          <div className="nes-hud-label nes-label-yellow">-LIFE-</div>
          <div className="nes-hud-hearts">
            {Array.from({ length: 8 }).map((_, i) => (
              <Heart key={i} half={i === 5} empty={i >= 6} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Mountain wall along the top of the playfield ── */}
      <div className="nes-mountain">
        <svg viewBox="0 0 800 160" preserveAspectRatio="none" shapeRendering="crispEdges">
          {/* Solid brown wall band */}
          <rect x="0" y="0" width="800" height="160" fill="#7c3800" />
          {/* Brick pattern — staggered 32x32 tiles drawn as alternating shades */}
          <g fill="#a04000">
            {Array.from({ length: 5 * 25 }).map((_, i) => {
              const row = Math.floor(i / 25);
              const col = i % 25;
              if ((row + col) % 2 !== 0) return null;
              return <rect key={i} x={col * 32} y={row * 32} width="30" height="30" />;
            })}
          </g>
          {/* Darker scuffs for variety */}
          <g fill="#5a2400" opacity="0.55">
            <rect x="40"  y="14" width="6" height="6" />
            <rect x="120" y="42" width="8" height="4" />
            <rect x="260" y="22" width="6" height="6" />
            <rect x="520" y="60" width="8" height="6" />
            <rect x="640" y="18" width="6" height="6" />
            <rect x="720" y="100" width="8" height="6" />
          </g>
        </svg>
      </div>

      {/* ── Cave entrance cut into the mountain ── */}
      <div className="nes-cave">
        <svg viewBox="0 0 80 96" shapeRendering="crispEdges">
          {/* Stone arch surround */}
          <rect x="0" y="40" width="80" height="56" fill="#a04000" />
          <rect x="8" y="32" width="64" height="64" fill="#a04000" />
          <rect x="16" y="24" width="48" height="72" fill="#a04000" />
          <rect x="24" y="16" width="32" height="80" fill="#a04000" />
          {/* Inner dark cave */}
          <rect x="20" y="40" width="40" height="56" fill="#000000" />
          <rect x="28" y="32" width="24" height="8" fill="#000000" />
          <rect x="24" y="36" width="32" height="4" fill="#000000" />
          {/* Cave glow — Old Man's fire just inside */}
          <ellipse className="nes-cave-glow" cx="40" cy="74" rx="14" ry="10" fill="#fc7460" />
          <ellipse className="nes-cave-glow" cx="40" cy="74" rx="8" ry="6" fill="#fcd078" />
        </svg>
      </div>

      {/* ── Wooden Sword floating above the cave entrance ── */}
      <svg className="nes-sword" viewBox="0 0 24 64" shapeRendering="crispEdges">
        {/* Blade */}
        <rect x="9"  y="2"  width="6" height="2" fill="#e0e0e8" />
        <rect x="8"  y="4"  width="8" height="2" fill="#e0e0e8" />
        <rect x="9"  y="6"  width="6" height="34" fill="#e0e0e8" />
        <rect x="10" y="2"  width="2" height="38" fill="#fcfcfc" />
        <rect x="13" y="6"  width="2" height="34" fill="#787878" />
        {/* Guard */}
        <rect x="4"  y="40" width="16" height="4" fill="#d8aa00" />
        <rect x="4"  y="44" width="16" height="2" fill="#947800" />
        {/* Hilt */}
        <rect x="9"  y="46" width="6" height="14" fill="#a04000" />
        <rect x="9"  y="60" width="6" height="2" fill="#5a2400" />
        {/* Sparkle stars next to the blade */}
        <g className="nes-sword-sparkle">
          <rect x="0" y="14" width="2" height="2" fill="#fcfcfc" />
          <rect x="22" y="22" width="2" height="2" fill="#fcfcfc" />
          <rect x="2" y="28" width="2" height="2" fill="#fcfcfc" />
          <rect x="20" y="8" width="2" height="2" fill="#fcfcfc" />
        </g>
      </svg>

      {/* ── Old Man's iconic line — fades in and out ── */}
      <div className="nes-dialog">
        IT'S DANGEROUS<br />TO GO ALONE!<br />TAKE THIS.
      </div>

      {/* ── Grass field with scrolling pixel-tile motif ── */}
      <div className="nes-grass" />

      {/* ── Sandy path winding across the middle of the field ── */}
      <svg
        className="nes-path"
        viewBox="0 0 800 220"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
      >
        <path
          d="M-20 80 L160 80 L160 140 L380 140 L380 60 L600 60 L600 130 L820 130 L820 200 L-20 200 Z"
          fill="#fca044"
        />
        {/* Darker sand specks */}
        <g fill="#ac6800" opacity="0.7">
          <rect x="40"  y="100" width="6" height="6" />
          <rect x="200" y="160" width="6" height="6" />
          <rect x="320" y="120" width="6" height="6" />
          <rect x="480" y="84"  width="6" height="6" />
          <rect x="660" y="160" width="6" height="6" />
        </g>
      </svg>

      {/* ── Trees scattered in the field ── */}
      <Tree className="nes-tree nes-tree-1" />
      <Tree className="nes-tree nes-tree-2" />
      <Tree className="nes-tree nes-tree-3" />

      {/* ── Bushes ── */}
      <Bush className="nes-bush nes-bush-1" />
      <Bush className="nes-bush nes-bush-2" />
      <Bush className="nes-bush nes-bush-3" />
      <Bush className="nes-bush nes-bush-4" />

      {/* ── Boulders/rocks ── */}
      <Rock className="nes-rock nes-rock-1" />
      <Rock className="nes-rock nes-rock-2" />

      {/* ── Heart pickup bobbing in the bottom-left ── */}
      <Heart className="nes-pickup nes-heart-pickup" />

      {/* ── Rupee pickup bobbing in the bottom-right ── */}
      <Rupee className="nes-pickup nes-rupee-pickup" />

      {/* ── Octorok firing a rock projectile ── */}
      <Octorok className="nes-octorok" />
      <svg
        className="nes-projectile"
        viewBox="0 0 12 12"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <rect x="2" y="2" width="8" height="8" fill="#7c7c7c" />
        <rect x="4" y="0" width="4" height="2" fill="#bcbcbc" />
        <rect x="0" y="4" width="2" height="4" fill="#bcbcbc" />
        <rect x="10" y="4" width="2" height="4" fill="#5a5a5a" />
        <rect x="4" y="10" width="4" height="2" fill="#5a5a5a" />
        <rect x="2" y="2" width="2" height="2" fill="#fcfcfc" />
      </svg>

      {/* ── Link sprite (front-facing, 2-frame walk) ── */}
      <Link className="nes-link" />

      {/* CRT scanlines for the retro NES feel */}
      <div className="nes-scanlines" />
    </div>
  );
}

/* ─── Sprite components ──────────────────────────────────────────────────── */

function Link({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {/* Cap (green) */}
      <rect x="6"  y="0" width="4" height="1" fill="#00a800" />
      <rect x="5"  y="1" width="6" height="1" fill="#00a800" />
      <rect x="4"  y="2" width="8" height="2" fill="#00a800" />
      {/* Face (skin + eyes) */}
      <rect x="5"  y="4" width="6" height="2" fill="#fcbcb0" />
      <rect x="6"  y="5" width="1" height="1" fill="#000000" />
      <rect x="9"  y="5" width="1" height="1" fill="#000000" />
      {/* Neck */}
      <rect x="6"  y="6" width="4" height="1" fill="#fcbcb0" />
      {/* Tunic shoulders + body */}
      <rect x="4"  y="7"  width="8" height="1" fill="#00a800" />
      <rect x="3"  y="8"  width="10" height="2" fill="#00a800" />
      {/* Arms (skin) */}
      <rect x="3"  y="9"  width="1" height="1" fill="#fcbcb0" />
      <rect x="12" y="9"  width="1" height="1" fill="#fcbcb0" />
      {/* Belt */}
      <rect x="4"  y="10" width="8" height="1" fill="#7c3800" />
      <rect x="7"  y="10" width="2" height="1" fill="#fcd078" />
      {/* Lower tunic */}
      <rect x="4"  y="11" width="8" height="2" fill="#007800" />
      {/* Legs */}
      <Frame frame="a">
        <rect x="5"  y="13" width="2" height="2" fill="#fcbcb0" />
        <rect x="9"  y="13" width="2" height="2" fill="#fcbcb0" />
        <rect x="5"  y="15" width="2" height="1" fill="#7c3800" />
        <rect x="9"  y="15" width="2" height="1" fill="#7c3800" />
      </Frame>
      <Frame frame="b">
        <rect x="4"  y="13" width="2" height="2" fill="#fcbcb0" />
        <rect x="10" y="13" width="2" height="2" fill="#fcbcb0" />
        <rect x="4"  y="15" width="2" height="1" fill="#7c3800" />
        <rect x="10" y="15" width="2" height="1" fill="#7c3800" />
      </Frame>
    </svg>
  );
}

/** Two-frame sprite frames — `.nes-frame[data-frame=...]` blinks via CSS. */
function Frame({ frame, children }: { frame: 'a' | 'b'; children: ReactNode }) {
  return (
    <g className="nes-frame" data-frame={frame}>
      {children}
    </g>
  );
}

function Octorok({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {/* Body — chunky red octopus */}
      <rect x="5"  y="1" width="6" height="1" fill="#d82800" />
      <rect x="3"  y="2" width="10" height="2" fill="#d82800" />
      <rect x="2"  y="4" width="12" height="4" fill="#d82800" />
      <rect x="3"  y="8" width="10" height="2" fill="#d82800" />
      {/* Eyes */}
      <rect x="5"  y="4" width="2" height="2" fill="#fcfcfc" />
      <rect x="9"  y="4" width="2" height="2" fill="#fcfcfc" />
      <rect x="6"  y="5" width="1" height="1" fill="#000000" />
      <rect x="10" y="5" width="1" height="1" fill="#000000" />
      {/* Mouth tube (pointing left — towards Link) */}
      <rect x="0"  y="6" width="3" height="2" fill="#d82800" />
      <rect x="0"  y="7" width="1" height="1" fill="#ac0000" />
      {/* Tentacles */}
      <rect x="2"  y="10" width="3" height="2" fill="#d82800" />
      <rect x="6"  y="10" width="3" height="2" fill="#d82800" />
      <rect x="10" y="10" width="3" height="2" fill="#d82800" />
      <rect x="2"  y="12" width="2" height="2" fill="#ac0000" />
      <rect x="7"  y="12" width="2" height="2" fill="#ac0000" />
      <rect x="11" y="12" width="2" height="2" fill="#ac0000" />
    </svg>
  );
}

function Tree({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 18"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {/* Canopy — chunky cluster of dark + light greens */}
      <rect x="2"  y="0" width="12" height="2" fill="#006800" />
      <rect x="0"  y="2" width="16" height="10" fill="#006800" />
      <rect x="1"  y="3" width="3" height="3" fill="#00a844" />
      <rect x="10" y="2" width="4" height="3" fill="#00a844" />
      <rect x="5"  y="6" width="4" height="3" fill="#00a844" />
      <rect x="11" y="7" width="3" height="3" fill="#00a844" />
      <rect x="2"  y="9" width="3" height="2" fill="#00a844" />
      {/* Trunk */}
      <rect x="6"  y="12" width="4" height="6" fill="#7c3800" />
      <rect x="6"  y="12" width="1" height="6" fill="#a04000" />
      <rect x="9"  y="12" width="1" height="6" fill="#5a2400" />
    </svg>
  );
}

function Bush({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect x="1" y="0" width="6" height="2" fill="#007800" />
      <rect x="0" y="2" width="8" height="4" fill="#007800" />
      <rect x="1" y="6" width="6" height="2" fill="#007800" />
      {/* Highlight pixels */}
      <rect x="2" y="1" width="1" height="1" fill="#00a844" />
      <rect x="4" y="3" width="2" height="1" fill="#00a844" />
      <rect x="1" y="5" width="1" height="1" fill="#00a844" />
    </svg>
  );
}

function Rock({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 12 10"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect x="2"  y="1" width="8" height="1" fill="#bcbcbc" />
      <rect x="1"  y="2" width="10" height="6" fill="#bcbcbc" />
      <rect x="2"  y="8" width="8" height="1" fill="#bcbcbc" />
      {/* Shading */}
      <rect x="1"  y="2" width="2" height="6" fill="#fcfcfc" />
      <rect x="9"  y="2" width="2" height="6" fill="#7c7c7c" />
      <rect x="2"  y="8" width="8" height="1" fill="#7c7c7c" />
    </svg>
  );
}

function Heart({
  className,
  half,
  empty,
}: {
  className?: string;
  half?: boolean;
  empty?: boolean;
}) {
  // Two side-by-side pixels indicate left/right halves of the NES heart.
  const left = empty ? '#3a0000' : '#d82800';
  const right = empty || half ? '#3a0000' : '#d82800';
  const leftHi = empty ? 'transparent' : '#fc7460';
  const rightHi = empty || half ? 'transparent' : '#fc7460';
  return (
    <svg
      className={className ?? 'nes-hud-heart'}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {/* Left lobe */}
      <rect x="1" y="1" width="2" height="1" fill={left} />
      <rect x="0" y="2" width="4" height="2" fill={left} />
      <rect x="0" y="4" width="4" height="1" fill={left} />
      <rect x="1" y="5" width="3" height="1" fill={left} />
      <rect x="2" y="6" width="2" height="1" fill={left} />
      <rect x="3" y="7" width="1" height="1" fill={left} />
      <rect x="1" y="2" width="1" height="1" fill={leftHi} />
      {/* Right lobe */}
      <rect x="5" y="1" width="2" height="1" fill={right} />
      <rect x="4" y="2" width="4" height="2" fill={right} />
      <rect x="4" y="4" width="4" height="1" fill={right} />
      <rect x="4" y="5" width="3" height="1" fill={right} />
      <rect x="4" y="6" width="2" height="1" fill={right} />
      <rect x="4" y="7" width="1" height="1" fill={right} />
      <rect x="6" y="2" width="1" height="1" fill={rightHi} />
    </svg>
  );
}

function Rupee({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 8 12"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect x="3" y="0" width="2" height="2" fill="#fca044" />
      <rect x="2" y="2" width="4" height="2" fill="#fca044" />
      <rect x="1" y="4" width="6" height="4" fill="#fca044" />
      <rect x="2" y="8" width="4" height="2" fill="#fca044" />
      <rect x="3" y="10" width="2" height="2" fill="#fca044" />
      {/* Highlight */}
      <rect x="2" y="2" width="1" height="2" fill="#fcd078" />
      <rect x="1" y="4" width="1" height="3" fill="#fcd078" />
      {/* Shadow */}
      <rect x="5" y="2" width="1" height="2" fill="#ac6800" />
      <rect x="6" y="4" width="1" height="3" fill="#ac6800" />
    </svg>
  );
}
