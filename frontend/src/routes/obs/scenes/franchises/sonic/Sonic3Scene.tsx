import './sonic.css';

/**
 * Sonic the Hedgehog 3 — Angel Island / Launch Base. A warm orange sunset
 * over a floating jungle island, swaying palms on the cliff edge, and the
 * teal Launch Base tech rig with rotating gears bolted into the rock below.
 *
 * `.sn3-` namespace.
 */
export function Sonic3Scene() {
  return (
    <div className="sn3-scene" aria-hidden="true">
      {/* Setting sun bloom on the horizon */}
      <div className="sn3-sun" />

      {/* Soft sunset cloud bands */}
      <div className="sn3-clouds" />

      {/* The floating island, jungle canopy on top, rock underside */}
      <svg className="sn3-island" viewBox="0 0 1200 320" preserveAspectRatio="none">
        {/* rock underside tapering to a point */}
        <path
          d="M0 120 L1200 120 L1040 240 Q700 360 540 300 Q360 360 160 240 Z"
          fill="#6e3b1c"
        />
        <path
          d="M0 120 L1200 120 L1040 240 Q700 350 540 296 Q360 350 160 240 Z"
          fill="#9c5a2c"
          opacity="0.55"
        />
        {/* jungle canopy ridge on top */}
        <path
          d="M0 130 L0 90 Q160 50 340 80 Q540 116 720 70 Q900 30 1080 78 Q1150 96 1200 84 L1200 130 Z"
          fill="#2f8c3d"
        />
        <path
          d="M0 130 Q200 96 400 122 Q620 152 840 110 Q1020 76 1200 120 L1200 130 Z"
          fill="#1f6b2c"
        />
      </svg>

      {/* Swaying palms on the cliff edge */}
      <svg className="sn3-palm sn3-palm-1" viewBox="0 0 100 140">
        <path d="M48 132 Q44 90 50 50" fill="none" stroke="#7a4a1e" strokeWidth="8" strokeLinecap="round" />
        <g className="sn3-fronds" fill="#37c14a">
          <ellipse cx="50" cy="44" rx="34" ry="10" transform="rotate(-18 50 44)" />
          <ellipse cx="50" cy="44" rx="34" ry="10" transform="rotate(18 50 44)" />
          <ellipse cx="50" cy="40" rx="30" ry="9" />
          <ellipse cx="50" cy="48" rx="20" ry="8" transform="rotate(-50 50 48)" />
          <ellipse cx="50" cy="48" rx="20" ry="8" transform="rotate(50 50 48)" />
        </g>
      </svg>
      <svg className="sn3-palm sn3-palm-2" viewBox="0 0 100 140">
        <path d="M48 132 Q52 90 46 50" fill="none" stroke="#7a4a1e" strokeWidth="8" strokeLinecap="round" />
        <g className="sn3-fronds" fill="#2f8c3d">
          <ellipse cx="46" cy="44" rx="32" ry="10" transform="rotate(-18 46 44)" />
          <ellipse cx="46" cy="44" rx="32" ry="10" transform="rotate(18 46 44)" />
          <ellipse cx="46" cy="40" rx="28" ry="9" />
          <ellipse cx="46" cy="48" rx="18" ry="8" transform="rotate(-50 46 48)" />
          <ellipse cx="46" cy="48" rx="18" ry="8" transform="rotate(50 46 48)" />
        </g>
      </svg>

      {/* Launch Base tech rig with turning gears */}
      <svg className="sn3-rig" viewBox="0 0 260 200">
        {/* support beams */}
        <g fill="#14706e">
          <rect x="20" y="40" width="16" height="160" />
          <rect x="224" y="40" width="16" height="160" />
          <rect x="20" y="40" width="220" height="16" />
        </g>
        <g fill="#1fa39e">
          <rect x="24" y="44" width="8" height="156" />
          <rect x="228" y="44" width="8" height="156" />
        </g>
        {/* big gear */}
        <g className="sn3-gear" style={{ transformOrigin: '94px 116px' }}>
          <circle cx="94" cy="116" r="40" fill="#16807c" />
          <g fill="#16807c">
            {Array.from({ length: 8 }).map((_, i) => (
              <rect
                key={i}
                x="88"
                y="68"
                width="12"
                height="14"
                transform={`rotate(${i * 45} 94 116)`}
              />
            ))}
          </g>
          <circle cx="94" cy="116" r="26" fill="#0e4f4c" />
          <circle cx="94" cy="116" r="8" fill="#1fc7bf" />
        </g>
        {/* small gear, counter-spin */}
        <g className="sn3-gear-rev" style={{ transformOrigin: '168px 142px' }}>
          <circle cx="168" cy="142" r="26" fill="#16807c" />
          <g fill="#16807c">
            {Array.from({ length: 6 }).map((_, i) => (
              <rect
                key={i}
                x="163"
                y="112"
                width="10"
                height="12"
                transform={`rotate(${i * 60} 168 142)`}
              />
            ))}
          </g>
          <circle cx="168" cy="142" r="16" fill="#0e4f4c" />
          <circle cx="168" cy="142" r="5" fill="#1fc7bf" />
        </g>
        {/* bolts */}
        <g fill="#f59a2c">
          <circle cx="28" cy="48" r="3.5" />
          <circle cx="232" cy="48" r="3.5" />
          <circle cx="28" cy="192" r="3.5" />
          <circle cx="232" cy="192" r="3.5" />
        </g>
      </svg>
    </div>
  );
}
