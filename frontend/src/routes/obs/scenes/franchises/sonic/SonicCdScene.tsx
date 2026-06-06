import './sonic.css';

/**
 * Sonic CD — Palmtree Panic. A bright, candy-coloured sky with a giant
 * sherbet sun, bouncy striped hills, curly palm trees, and the iconic
 * time-travel signpost ("PAST / FUTURE") flickering as motion sparkles
 * streak past — evoking the time-warp dash.
 *
 * `.scd-` namespace.
 */
export function SonicCdScene() {
  return (
    <div className="scd-scene" aria-hidden="true">
      {/* Giant pastel sun */}
      <svg className="scd-sun" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="80" fill="#ffe27a" />
        <circle cx="100" cy="100" r="80" fill="none" stroke="#ffd23a" strokeWidth="6" opacity="0.6" />
        <g className="scd-sun-rays" stroke="#ffd23a" strokeWidth="6" strokeLinecap="round" opacity="0.7">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1="100" y1="6" x2="100" y2="22" transform={`rotate(${i * 30} 100 100)`} />
          ))}
        </g>
      </svg>

      {/* Puffy cartoon clouds */}
      <div className="scd-clouds" />

      {/* Rolling candy-striped hills */}
      <svg className="scd-hills" viewBox="0 0 1200 300" preserveAspectRatio="none">
        <path
          d="M0 300 L0 160 Q200 90 420 150 Q640 210 860 130 Q1040 66 1200 140 L1200 300 Z"
          fill="#36b85a"
        />
        <path
          d="M0 300 L0 210 Q240 150 480 200 Q720 250 960 190 Q1100 156 1200 200 L1200 300 Z"
          fill="#2a9a48"
        />
        {/* hill stripes */}
        <g stroke="#54d676" strokeWidth="10" opacity="0.5" fill="none">
          <path d="M0 172 Q200 102 420 162" />
          <path d="M620 198 Q840 122 1040 162" />
        </g>
      </svg>

      {/* Curly Palmtree Panic palms */}
      <svg className="scd-palm scd-palm-1" viewBox="0 0 90 130">
        <path d="M44 124 Q40 86 50 56" fill="none" stroke="#b06a2c" strokeWidth="9" strokeLinecap="round" />
        <g fill="#36b85a">
          <path d="M50 52 Q22 40 8 54 Q30 50 50 60 Z" />
          <path d="M50 52 Q78 40 84 56 Q60 50 50 60 Z" />
          <path d="M50 52 Q40 28 56 18 Q52 40 56 56 Z" />
        </g>
        <circle cx="50" cy="56" r="6" fill="#ffd23a" />
      </svg>
      <svg className="scd-palm scd-palm-2" viewBox="0 0 90 130">
        <path d="M44 124 Q48 86 38 56" fill="none" stroke="#b06a2c" strokeWidth="9" strokeLinecap="round" />
        <g fill="#2a9a48">
          <path d="M38 52 Q10 40 4 56 Q28 50 38 60 Z" />
          <path d="M38 52 Q66 40 80 54 Q52 50 38 60 Z" />
          <path d="M38 52 Q28 28 44 18 Q40 40 44 56 Z" />
        </g>
        <circle cx="38" cy="56" r="6" fill="#ffd23a" />
      </svg>

      {/* Time-travel signpost */}
      <svg className="scd-signpost" viewBox="0 0 120 160">
        <rect x="55" y="60" width="10" height="100" rx="3" fill="#9c5a2c" />
        {/* FUTURE plate (top) */}
        <g className="scd-sign-future">
          <rect x="14" y="30" width="92" height="30" rx="5" fill="#1f8edb" stroke="#0c4f86" strokeWidth="3" />
          <text x="60" y="51" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="#ffffff">FUTURE</text>
          <path d="M106 36 L118 45 L106 54 Z" fill="#1f8edb" stroke="#0c4f86" strokeWidth="3" />
        </g>
        {/* PAST plate (bottom) */}
        <g className="scd-sign-past">
          <rect x="14" y="70" width="92" height="30" rx="5" fill="#e23b6f" stroke="#8a1d44" strokeWidth="3" />
          <text x="64" y="91" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="#ffffff">PAST</text>
          <path d="M14 76 L2 85 L14 94 Z" fill="#e23b6f" stroke="#8a1d44" strokeWidth="3" />
        </g>
        {/* sparkle burst around the post */}
        <g className="scd-sign-spark" fill="#fff4b8">
          <path d="M28 22 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" />
          <path d="M96 110 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" />
        </g>
      </svg>

      {/* Time-warp motion sparkle streaks */}
      <div className="scd-warp" />

      {/* Checkerboard foreground lip */}
      <svg className="scd-ground" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <defs>
          <pattern id="scd-check" width="48" height="48" patternUnits="userSpaceOnUse">
            <rect width="48" height="48" fill="#36b85a" />
            <rect width="24" height="24" fill="#2a9a48" />
            <rect x="24" y="24" width="24" height="24" fill="#2a9a48" />
          </pattern>
        </defs>
        <rect x="0" y="30" width="1200" height="90" fill="url(#scd-check)" />
        <path d="M0 34 H1200" stroke="#54d676" strokeWidth="4" opacity="0.7" />
      </svg>
    </div>
  );
}
