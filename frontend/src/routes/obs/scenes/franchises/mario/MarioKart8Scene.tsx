import './mario.css';

/**
 * Mario Kart 8 — the anti-gravity era. A glowing neon track loop twisting
 * through deep space with magenta/cyan edge lighting, a parallax starfield,
 * a distant checkered finish arch, drifting item boxes, glittering coins,
 * the occasional green shell fly-by, and a kart riding the loop on
 * cyan-haloed anti-grav wheels. `.mk8-` namespace.
 */
export function MarioKart8Scene() {
  return (
    <div className="mk8-scene" aria-hidden="true">
      {/* Atmospheric nebula glow — three offset radial gradients give the
       * background a layered space-dust feel without any star sprites. */}
      <div className="mk8-nebula" />

      {/* Parallax starfield: near-layer twinkles + a smaller, dimmer
       * far-layer drifts slower for depth. */}
      <div className="mk8-stars" />
      <div className="mk8-stars mk8-stars-far" />

      {/* Distant planet hanging in the upper-left — silent depth cue. */}
      <svg className="mk8-planet" viewBox="0 0 200 200">
        <defs>
          <radialGradient id="mk8-planet-grad" cx="35%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#ff9fe0" />
            <stop offset="55%" stopColor="#a07cff" />
            <stop offset="100%" stopColor="#3a1a6e" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="92" fill="url(#mk8-planet-grad)" />
        {/* Subtle ring */}
        <ellipse cx="100" cy="100" rx="120" ry="22" fill="none" stroke="#33e6ff" strokeWidth="2" opacity="0.45" />
        <ellipse cx="100" cy="100" rx="120" ry="22" fill="none" stroke="#ff9fe0" strokeWidth="1" opacity="0.5" transform="rotate(8 100 100)" />
      </svg>

      {/* Shooting comets streak diagonally on independent cadences. */}
      <div className="mk8-comet" />
      <div className="mk8-comet mk8-comet-2" />

      {/* Distant checkered finish arch — MK8's iconic start/finish gate
       * suggested as a small backdrop element with a gentle bob. */}
      <svg className="mk8-arch" viewBox="0 0 220 240">
        <defs>
          <linearGradient id="mk8-arch-pillar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a07cff" />
            <stop offset="100%" stopColor="#3a2070" />
          </linearGradient>
        </defs>
        {/* Pillars */}
        <rect x="14" y="60" width="26" height="170" fill="url(#mk8-arch-pillar)" stroke="#33e6ff" strokeWidth="2" />
        <rect x="180" y="60" width="26" height="170" fill="url(#mk8-arch-pillar)" stroke="#33e6ff" strokeWidth="2" />
        {/* Pillar window slits */}
        <g fill="#7af0ff" opacity="0.9">
          <rect x="20" y="72" width="14" height="6" />
          <rect x="20" y="92" width="14" height="6" />
          <rect x="20" y="112" width="14" height="6" />
          <rect x="186" y="72" width="14" height="6" />
          <rect x="186" y="92" width="14" height="6" />
          <rect x="186" y="112" width="14" height="6" />
        </g>
        {/* Arch crossbeam */}
        <path d="M14 60 Q110 0 206 60" fill="none" stroke="#a07cff" strokeWidth="10" strokeLinecap="round" />
        <path d="M14 60 Q110 0 206 60" fill="none" stroke="#33e6ff" strokeWidth="2" opacity="0.75" />
        {/* Checkered banner draped under the arch */}
        <g>
          {Array.from({ length: 22 }, (_, i) => (
            <rect key={`a-${i}`} x={20 + i * 8} y="48" width="8" height="8" fill={i % 2 === 0 ? '#fff' : '#10203a'} />
          ))}
          {Array.from({ length: 22 }, (_, i) => (
            <rect key={`b-${i}`} x={20 + i * 8} y="56" width="8" height="8" fill={i % 2 === 0 ? '#10203a' : '#fff'} />
          ))}
        </g>
      </svg>

      {/* The anti-gravity track loop. Kart lives inside this SVG so SMIL
       * <animateMotion mpath="#mk8-loop-path"> can follow the literal
       * road geometry — see MarioKartScene.tsx for the rationale (CSS
       * offset-path requires pre-computed pixel coords that only line
       * up at the design stage size of 1920×1080). */}
      <svg className="mk8-loop" viewBox="0 0 1200 600" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mk8-edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff4dd2" />
            <stop offset="50%" stopColor="#a07cff" />
            <stop offset="100%" stopColor="#33e6ff" />
          </linearGradient>
          <linearGradient id="mk8-edge-bright" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff9fe0" />
            <stop offset="50%" stopColor="#7af0ff" />
            <stop offset="100%" stopColor="#33e6ff" />
          </linearGradient>
          {/* Road centreline — defined once, reused for the dark base + glow
           * + dashed centre passes below, and referenced by the kart's
           * <animateMotion> so kart and ribbon can't drift out of sync. */}
          <path id="mk8-loop-path" d="M-40 460 Q260 300 520 420 Q820 560 980 360 Q1100 210 1260 300" />
        </defs>
        {/* track surface — sweeping dark ribbon */}
        <use href="#mk8-loop-path" fill="none" stroke="#1a1838" strokeWidth="72" strokeLinecap="round" />
        {/* glow underlay */}
        <use href="#mk8-loop-path" fill="none" stroke="url(#mk8-edge)" strokeWidth="84" strokeLinecap="round" opacity="0.28" />
        {/* twin neon edge lines (offset ±34 from the centreline) */}
        <path
          d="M-40 426 Q260 266 520 386 Q820 526 980 326 Q1100 176 1260 266"
          fill="none" stroke="url(#mk8-edge-bright)" strokeWidth="5" strokeLinecap="round"
        />
        <path
          d="M-40 494 Q260 334 520 454 Q820 594 980 394 Q1100 244 1260 334"
          fill="none" stroke="url(#mk8-edge-bright)" strokeWidth="5" strokeLinecap="round"
        />
        {/* dashed centre */}
        <use href="#mk8-loop-path" fill="none" stroke="#cfe6ff" strokeWidth="3" strokeDasharray="16 26" opacity="0.7" />
        {/* lane separator pips — small dots between dashes for that
         * "scrolling at speed" feel */}
        <use href="#mk8-loop-path" fill="none" stroke="#7af0ff" strokeWidth="2" strokeDasharray="2 56" opacity="0.6" />
        {/* blue anti-grav boost chevrons — clustered into two boost pads */}
        <g className="mk8-boost" fill="#33e6ff" opacity="0.85">
          {/* boost pad 1 */}
          <path d="M280 372 L308 382 L280 392 Z" />
          <path d="M320 366 L348 376 L320 386 Z" />
          <path d="M360 360 L388 370 L360 380 Z" />
          {/* boost pad 2 */}
          <path d="M800 450 L828 460 L800 470 Z" />
          <path d="M840 444 L868 454 L840 464 Z" />
          <path d="M880 438 L908 448 L880 458 Z" />
        </g>

        {/* Item boxes drifting just above the road surface — spinning ?
         * cubes the kart can pick up. Three positions across the loop. */}
        <g className="mk8-loop-boxes">
          <g transform="translate(180 390)" className="mk8-loop-box mk8-loop-box-a">
            <rect x="-16" y="-16" width="32" height="32" rx="5" fill="rgba(122, 240, 255, 0.9)" stroke="#33e6ff" strokeWidth="2.5" />
            <text x="0" y="9" fontSize="22" fontWeight="900" textAnchor="middle" fill="#ffffff">?</text>
          </g>
          <g transform="translate(600 350)" className="mk8-loop-box mk8-loop-box-b">
            <rect x="-16" y="-16" width="32" height="32" rx="5" fill="rgba(255, 159, 224, 0.9)" stroke="#ff4dd2" strokeWidth="2.5" />
            <text x="0" y="9" fontSize="22" fontWeight="900" textAnchor="middle" fill="#ffffff">?</text>
          </g>
          <g transform="translate(1060 270)" className="mk8-loop-box mk8-loop-box-c">
            <rect x="-16" y="-16" width="32" height="32" rx="5" fill="rgba(160, 124, 255, 0.9)" stroke="#a07cff" strokeWidth="2.5" />
            <text x="0" y="9" fontSize="22" fontWeight="900" textAnchor="middle" fill="#ffffff">?</text>
          </g>
        </g>

        {/* Coin sparkles strung along the road — small spinning gold disks.
         * Each animates its own scaleX/opacity in CSS for a coin-flip shimmer. */}
        <g className="mk8-loop-coins">
          <ellipse className="mk8-loop-coin mk8-loop-coin-a" cx="120" cy="404" rx="6" ry="9" fill="#ffe83a" stroke="#c89020" strokeWidth="1.2" />
          <ellipse className="mk8-loop-coin mk8-loop-coin-b" cx="420" cy="396" rx="6" ry="9" fill="#ffe83a" stroke="#c89020" strokeWidth="1.2" />
          <ellipse className="mk8-loop-coin mk8-loop-coin-c" cx="700" cy="490" rx="6" ry="9" fill="#ffe83a" stroke="#c89020" strokeWidth="1.2" />
          <ellipse className="mk8-loop-coin mk8-loop-coin-d" cx="940" cy="384" rx="6" ry="9" fill="#ffe83a" stroke="#c89020" strokeWidth="1.2" />
          <ellipse className="mk8-loop-coin mk8-loop-coin-e" cx="1140" cy="300" rx="6" ry="9" fill="#ffe83a" stroke="#c89020" strokeWidth="1.2" />
        </g>

        {/* Kart with glowing anti-grav wheels, drawn around (0,0) so
         * animateMotion places the chassis centre on the loop's
         * centreline. The body span (-22..+34 × -19..+20 SVG units)
         * fits inside the 72-unit dark stroke, so the kart appears
         * to ride the track. `rotate="auto"` banks it through the
         * dips and rises. The 8s loop preserves the original cadence. */}
        <g className="mk8-kart-group">
          {/* long boost trail tailing behind */}
          <path d="M-22 0 L-46 -8 L-40 0 L-46 8 Z" fill="#7af0ff" opacity="0.55" />
          <path d="M-24 0 L-58 -3 L-52 0 L-58 3 Z" fill="#33e6ff" opacity="0.7" />
          {/* anti-grav under-glow */}
          <ellipse cx="6" cy="20" rx="32" ry="5" fill="#33e6ff" opacity="0.55" />
          <ellipse cx="6" cy="22" rx="22" ry="3" fill="#7af0ff" opacity="0.75" />
          {/* chassis */}
          <path d="M-22 4 Q-18 -10 4 -10 L20 -10 Q34 -10 34 4 L34 10 L-22 10 Z" fill="#3a7adf" stroke="#1a4aa0" strokeWidth="2" />
          {/* chassis highlight stripe */}
          <path d="M-18 -4 L30 -4" stroke="#7af0ff" strokeWidth="1.2" opacity="0.85" />
          {/* cockpit / driver cap */}
          <ellipse cx="6" cy="-12" rx="9" ry="8" fill="#3a7adf" stroke="#1a4aa0" strokeWidth="1.2" />
          <path d="M-3 -12 Q6 -22 15 -12 Z" fill="#1a4aa0" />
          <circle cx="6" cy="-14" r="3.5" fill="#fff" />
          {/* glowing wheels with cyan halos */}
          <circle cx="-12" cy="14" r="9" fill="#33e6ff" opacity="0.4" />
          <circle cx="-12" cy="14" r="7" fill="#10203a" stroke="#33e6ff" strokeWidth="2.5" />
          <circle cx="-12" cy="14" r="3" fill="#7af0ff" />
          <circle cx="28" cy="14" r="9" fill="#33e6ff" opacity="0.4" />
          <circle cx="28" cy="14" r="7" fill="#10203a" stroke="#33e6ff" strokeWidth="2.5" />
          <circle cx="28" cy="14" r="3" fill="#7af0ff" />
          <animateMotion dur="8s" repeatCount="indefinite" rotate="auto">
            <mpath href="#mk8-loop-path" />
          </animateMotion>
        </g>
      </svg>

      {/* Foreground floating item boxes — drifting + spinning ahead of
       * the track for parallax depth. */}
      <svg className="mk8-itembox mk8-itembox-a" viewBox="0 0 44 44">
        <rect x="4" y="4" width="36" height="36" rx="6" fill="rgba(122, 240, 255, 0.9)" stroke="#2a9dc8" strokeWidth="2.5" />
        <rect x="9" y="9" width="26" height="26" rx="3" fill="rgba(255, 255, 255, 0.18)" />
        <text x="22" y="32" fontSize="24" fontWeight="900" textAnchor="middle" fill="#ffffff">?</text>
      </svg>
      <svg className="mk8-itembox mk8-itembox-b" viewBox="0 0 44 44">
        <rect x="4" y="4" width="36" height="36" rx="6" fill="rgba(255, 159, 224, 0.9)" stroke="#c8329d" strokeWidth="2.5" />
        <rect x="9" y="9" width="26" height="26" rx="3" fill="rgba(255, 255, 255, 0.18)" />
        <text x="22" y="32" fontSize="24" fontWeight="900" textAnchor="middle" fill="#ffffff">?</text>
      </svg>
      <svg className="mk8-itembox mk8-itembox-c" viewBox="0 0 44 44">
        <rect x="4" y="4" width="36" height="36" rx="6" fill="rgba(160, 124, 255, 0.9)" stroke="#5a3ec8" strokeWidth="2.5" />
        <rect x="9" y="9" width="26" height="26" rx="3" fill="rgba(255, 255, 255, 0.18)" />
        <text x="22" y="32" fontSize="24" fontWeight="900" textAnchor="middle" fill="#ffffff">?</text>
      </svg>

      {/* Green shell occasional fly-by — the iconic green koopa shell
       * skids across the screen, bouncing off the bottom edge. */}
      <svg className="mk8-shell" viewBox="0 0 60 50">
        {/* shell body */}
        <ellipse cx="30" cy="32" rx="26" ry="16" fill="#5cdb5c" stroke="#2a8a2a" strokeWidth="2.5" />
        {/* shell rim */}
        <path d="M4 32 Q30 24 56 32" fill="none" stroke="#fff" strokeWidth="2" />
        {/* hex pattern hint */}
        <path d="M16 28 L20 22 L24 28 M30 26 L34 20 L38 26 M44 28 L48 22 L52 28" fill="none" stroke="#2a8a2a" strokeWidth="1.5" />
        {/* base ring */}
        <ellipse cx="30" cy="44" rx="22" ry="4" fill="#1a4a1a" />
        {/* spin glint */}
        <ellipse cx="22" cy="26" rx="6" ry="3" fill="#fff" opacity="0.5" />
      </svg>
    </div>
  );
}
