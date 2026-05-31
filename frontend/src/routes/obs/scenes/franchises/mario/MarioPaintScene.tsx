import './mario.css';

/**
 * Mario Paint — the SNES creative toy. A bright canvas with a grid, a column
 * of colour swatches down the left, a moving hand cursor, a few playful doodle
 * strokes, and the infamous fly buzzing around (for the fly-swat mini-game).
 * `.mpaint-` namespace.
 */
export function MarioPaintScene() {
  const SWATCHES = ['#e23b3b', '#ff8a2a', '#ffd23a', '#4cd95e', '#3a7adf', '#a07cff', '#ffffff', '#1a1a1a'];

  return (
    <div className="mpaint-scene" aria-hidden="true">
      {/* Canvas grid */}
      <svg className="mpaint-grid" viewBox="0 0 1200 600" preserveAspectRatio="none">
        <g stroke="rgba(120, 150, 200, 0.18)" strokeWidth="1.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 80} y1="0" x2={i * 80} y2="600" />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 80} x2="1200" y2={i * 80} />
          ))}
        </g>
      </svg>

      {/* Playful doodle strokes already on the canvas */}
      <svg className="mpaint-doodle" viewBox="0 0 1200 600" preserveAspectRatio="none">
        <path d="M260 180 Q360 80 460 180 Q560 280 660 180" fill="none" stroke="#e23b3b" strokeWidth="10" strokeLinecap="round" />
        <path d="M740 240 Q820 160 900 240 T1060 240" fill="none" stroke="#3a7adf" strokeWidth="10" strokeLinecap="round" />
        <circle cx="940" cy="420" r="46" fill="none" stroke="#4cd95e" strokeWidth="10" />
        <path d="M300 440 L360 380 L420 440 L480 380" fill="none" stroke="#ffd23a" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Colour swatch palette down the left */}
      <svg className="mpaint-palette" viewBox="0 0 80 360">
        <rect x="2" y="2" width="76" height="356" rx="10" fill="#f0e6d2" stroke="#b89a6a" strokeWidth="3" />
        {SWATCHES.map((c, i) => (
          <rect
            key={i}
            x={i % 2 === 0 ? 12 : 44}
            y={14 + Math.floor(i / 2) * 86}
            width="24"
            height="24"
            rx="4"
            fill={c}
            stroke="#8a6a3a"
            strokeWidth="2"
          />
        ))}
      </svg>

      {/* The pointing-hand cursor scooting around */}
      <svg className="mpaint-cursor" viewBox="0 0 60 70">
        <path d="M22 4 Q26 2 28 6 L30 30 L34 22 Q40 18 42 26 L40 40 Q40 56 28 60 Q16 58 14 44 L8 30 Q6 22 14 24 L20 32 L18 8 Q18 2 22 4 Z"
          fill="#ffe0c0" stroke="#1a1a1a" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>

      {/* The fly-swat bug buzzing about */}
      <svg className="mpaint-fly" viewBox="0 0 60 50">
        {/* wings */}
        <g className="mpaint-fly-wings" fill="rgba(180, 220, 255, 0.7)" stroke="#7aa8c8" strokeWidth="1.5">
          <ellipse cx="18" cy="14" rx="14" ry="9" transform="rotate(-26 18 14)" />
          <ellipse cx="42" cy="14" rx="14" ry="9" transform="rotate(26 42 14)" />
        </g>
        {/* body */}
        <ellipse cx="30" cy="30" rx="11" ry="15" fill="#2a2a3a" stroke="#000" strokeWidth="1.5" />
        <circle cx="30" cy="18" r="8" fill="#1a1a28" />
        <circle cx="26" cy="16" r="3" fill="#e23b3b" /><circle cx="34" cy="16" r="3" fill="#e23b3b" />
        {/* legs */}
        <g stroke="#1a1a28" strokeWidth="2" strokeLinecap="round">
          <path d="M22 38 L14 46 M30 42 L30 50 M38 38 L46 46" />
        </g>
      </svg>
    </div>
  );
}
