import './ducktales.css';

/**
 * DuckTales — the iconic NES "Moon" stage. Scrooge McDuck pogo-bounces on his
 * cane across a cratered lunar surface under a twinkling starfield, with Earth
 * hanging in the black sky and an alien saucer drifting past. Cyan/violet
 * palette after the legendary Moon Theme.
 *
 * Template scene for the franchise scene set: pure SVG + a co-located CSS file
 * (no shared scenes.css), `.dt-` class namespace, root is the standard
 * absolute/inset-0 stage layer.
 */
export function DuckTalesScene() {
  return (
    <div className="dt-scene" aria-hidden="true">
      {/* Starfield (twinkling dots painted via CSS box-shadows) */}
      <div className="dt-stars" />

      {/* Earth hanging in the distance, top-left */}
      <svg className="dt-earth" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="44" fill="#1f6fd0" />
        <path
          d="M22 38 Q40 30 54 40 Q70 48 60 60 Q44 70 30 62 Q18 52 22 38 Z"
          fill="#3fae6a"
          opacity="0.9"
        />
        <path d="M62 28 Q74 34 72 46 Q64 44 62 28 Z" fill="#3fae6a" opacity="0.85" />
        <circle cx="50" cy="50" r="44" fill="none" stroke="#9fd6ff" strokeWidth="1.5" opacity="0.5" />
      </svg>

      {/* Drifting alien saucer */}
      <svg className="dt-ufo" viewBox="0 0 120 60">
        <ellipse cx="60" cy="34" rx="46" ry="12" fill="#2a1f4a" />
        <ellipse cx="60" cy="30" rx="46" ry="12" fill="#5a3fb0" />
        <path d="M40 26 Q60 8 80 26 Z" fill="#a07cff" />
        <g fill="#7af0ff">
          <circle cx="44" cy="34" r="2.5" />
          <circle cx="60" cy="36" r="2.5" />
          <circle cx="76" cy="34" r="2.5" />
        </g>
      </svg>

      {/* Cratered lunar surface across the foreground */}
      <svg className="dt-moon" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <path
          d="M0 240 L0 150 Q60 120 140 130 Q210 138 280 118 Q360 96 450 120
             Q540 142 640 116 Q740 92 840 122 Q940 148 1040 120 Q1130 100 1200 124
             L1200 240 Z"
          fill="#3a2f5e"
        />
        <path
          d="M0 240 L0 175 Q120 160 260 170 Q420 182 560 166 Q720 150 880 172
             Q1020 190 1200 168 L1200 240 Z"
          fill="#2a2148"
        />
        {/* craters */}
        <g fill="#241a40">
          <ellipse cx="200" cy="190" rx="34" ry="11" />
          <ellipse cx="520" cy="200" rx="46" ry="13" />
          <ellipse cx="900" cy="192" rx="38" ry="12" />
        </g>
      </svg>

      {/* Scrooge McDuck pogo-bouncing on his cane */}
      <svg className="dt-scrooge" viewBox="0 0 60 90">
        {/* pogo cane */}
        <rect x="28" y="40" width="4" height="42" fill="#caa23a" />
        <path d="M24 82 L36 82 L30 90 Z" fill="#caa23a" />
        {/* coat / body */}
        <path d="M18 36 Q30 28 42 36 L40 60 L20 60 Z" fill="#e23b3b" />
        {/* belly / shirt */}
        <ellipse cx="30" cy="50" rx="9" ry="11" fill="#f4e9d2" />
        {/* head */}
        <ellipse cx="30" cy="24" rx="11" ry="10" fill="#f4e9d2" />
        {/* beak */}
        <path d="M30 24 Q44 24 42 30 Q34 32 30 28 Z" fill="#f0a830" />
        {/* top hat */}
        <rect x="20" y="8" width="20" height="4" rx="1" fill="#1a1a22" />
        <rect x="24" y="-2" width="12" height="12" rx="1" fill="#1a1a22" />
        <rect x="24" y="6" width="12" height="2" fill="#e23b3b" />
        {/* glasses + eye dots */}
        <circle cx="27" cy="22" r="3" fill="none" stroke="#3a3a44" strokeWidth="1" />
        <circle cx="33" cy="22" r="3" fill="none" stroke="#3a3a44" strokeWidth="1" />
        {/* legs gripping the pogo */}
        <rect x="24" y="58" width="5" height="12" fill="#1f7ad0" />
        <rect x="31" y="58" width="5" height="12" fill="#1f7ad0" />
      </svg>
    </div>
  );
}
