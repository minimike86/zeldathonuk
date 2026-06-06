import './sonic.css';

/**
 * Sonic Heroes — Seaside Hill. Sun-bleached ancient ruins and checkered
 * stone columns perched above a brilliant turquoise sea, a coiled ruin
 * loop, a bobbing dolphin leaping over the swell, and grassy clifftops.
 * Turquoise / aqua palette.
 *
 * `.shr-` namespace.
 */
export function SonicHeroesScene() {
  return (
    <div className="shr-scene" aria-hidden="true">
      {/* Bright sky haze */}
      <div className="shr-haze" />

      {/* Turquoise sea */}
      <svg className="shr-sea" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <rect x="0" y="0" width="1200" height="240" fill="#19c0c8" />
        <rect x="0" y="0" width="1200" height="80" fill="#2fd6d2" opacity="0.7" />
        <g className="shr-glints" stroke="#eafffd" strokeWidth="3" strokeLinecap="round" opacity="0.85">
          <path d="M140 70 H190" />
          <path d="M360 100 H410" />
          <path d="M620 64 H670" />
          <path d="M860 96 H910" />
          <path d="M1040 72 H1090" />
        </g>
      </svg>

      {/* Leaping dolphin over the swell */}
      <svg className="shr-dolphin" viewBox="0 0 120 80">
        <path
          d="M10 70 Q30 10 70 12 Q98 14 110 40 Q92 30 78 36 Q92 48 96 64 Q80 50 64 52 Q40 54 24 70 Z"
          fill="#3a6fb0"
        />
        <path d="M70 12 Q86 4 96 10 Q86 18 74 20 Z" fill="#2f5e96" />
        <circle cx="30" cy="40" r="3" fill="#0a1a2c" />
      </svg>

      {/* Distant ruined arch */}
      <svg className="shr-arch" viewBox="0 0 300 200" preserveAspectRatio="none">
        <g fill="#d8cba0">
          <rect x="30" y="60" width="40" height="140" />
          <rect x="230" y="60" width="40" height="140" />
          <path d="M30 60 Q150 -10 270 60 L250 60 Q150 16 50 60 Z" />
        </g>
      </svg>

      {/* Checkered stone columns and ruin loop */}
      <svg className="shr-ruins" viewBox="0 0 500 300">
        <defs>
          <pattern id="shr-check" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="#e8dcb4" />
            <rect width="20" height="20" fill="#cbb988" />
            <rect x="20" y="20" width="20" height="20" fill="#cbb988" />
          </pattern>
        </defs>
        {/* coiled ruin loop */}
        <path
          d="M40 290 Q90 280 140 240 Q180 208 180 170 Q180 120 140 120 Q100 120 100 170 Q100 210 140 238 Q190 274 320 280"
          fill="none"
          stroke="url(#shr-check)"
          strokeWidth="26"
          strokeLinecap="round"
        />
        {/* columns */}
        <g>
          <rect x="330" y="100" width="40" height="190" fill="url(#shr-check)" />
          <rect x="410" y="60" width="40" height="230" fill="url(#shr-check)" />
          <rect x="322" y="92" width="56" height="16" rx="4" fill="#d8cba0" />
          <rect x="402" y="52" width="56" height="16" rx="4" fill="#d8cba0" />
        </g>
        {/* running Sonic on the loop */}
        <g className="shr-runner">
          <circle cx="0" cy="0" r="12" fill="#1a6fd6" />
          <path d="M-11 -3 L-26 -8 L-20 3 L-28 7 L-15 9 Z" fill="#1a6fd6" />
          <circle cx="6" cy="-3" r="8" fill="#f0c089" />
          <circle cx="9" cy="-5" r="2" fill="#0a1a2c" />
        </g>
      </svg>

      {/* Grassy clifftop foreground */}
      <svg className="shr-cliff" viewBox="0 0 1200 180" preserveAspectRatio="none">
        <rect x="0" y="60" width="1200" height="120" fill="#c8b884" />
        <path
          d="M0 80 L0 50 Q200 24 420 46 Q640 68 860 42 Q1040 22 1200 48 L1200 80 Z"
          fill="#3fb86a"
        />
        <path
          d="M0 86 Q200 60 420 82 Q640 104 860 78 Q1040 58 1200 84 L1200 92 L0 92 Z"
          fill="#2f8c4c"
        />
      </svg>
    </div>
  );
}
