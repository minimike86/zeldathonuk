import './sonic.css';

/**
 * Sonic the Hedgehog — Green Hill Zone. The signature looping ribbon path
 * arcs across a bright blue sky, palm-and-loop trees sway, totem checkpoint
 * posts dot the rolling hills, and a checkerboard cliff face scrolls under a
 * grassy ridge. Fallback scene for Sonic 1 / & Knuckles / generic Sonic.
 *
 * `.snc-` namespace.
 */
export function SonicScene() {
  return (
    <div className="snc-scene" aria-hidden="true">
      {/* Lazy clouds drifting across the sky */}
      <div className="snc-clouds" />

      {/* Far rolling hill backdrop */}
      <svg className="snc-hills-far" viewBox="0 0 1200 260" preserveAspectRatio="none">
        <path
          d="M0 260 L0 180 Q150 120 320 150 Q500 182 680 130 Q860 80 1040 140 Q1130 168 1200 150 L1200 260 Z"
          fill="#3aa64a"
        />
        <path
          d="M0 260 L0 200 Q200 160 400 188 Q620 218 840 170 Q1020 132 1200 180 L1200 260 Z"
          fill="#2f8c3d"
        />
      </svg>

      {/* Palm-loop trees swaying along the ridge */}
      <svg className="snc-tree snc-tree-1" viewBox="0 0 80 120">
        <rect x="36" y="48" width="8" height="60" rx="3" fill="#7a4a1e" />
        <circle cx="40" cy="30" r="26" fill="none" stroke="#1f6b2c" strokeWidth="9" />
        <g fill="#37c14a">
          <ellipse cx="40" cy="14" rx="22" ry="9" />
          <ellipse cx="22" cy="26" rx="16" ry="8" transform="rotate(-30 22 26)" />
          <ellipse cx="58" cy="26" rx="16" ry="8" transform="rotate(30 58 26)" />
        </g>
      </svg>
      <svg className="snc-tree snc-tree-2" viewBox="0 0 80 120">
        <rect x="36" y="48" width="8" height="60" rx="3" fill="#7a4a1e" />
        <circle cx="40" cy="30" r="26" fill="none" stroke="#1f6b2c" strokeWidth="9" />
        <g fill="#37c14a">
          <ellipse cx="40" cy="14" rx="22" ry="9" />
          <ellipse cx="22" cy="26" rx="16" ry="8" transform="rotate(-30 22 26)" />
          <ellipse cx="58" cy="26" rx="16" ry="8" transform="rotate(30 58 26)" />
        </g>
      </svg>

      {/* The iconic loop-the-loop ribbon path */}
      <svg className="snc-loop" viewBox="0 0 300 240">
        <path
          d="M10 230 Q60 220 110 180 Q150 148 150 110 Q150 60 110 60 Q70 60 70 110 Q70 150 110 178 Q160 214 290 220"
          fill="none"
          stroke="#caa24a"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M10 230 Q60 220 110 180 Q150 148 150 110 Q150 60 110 60 Q70 60 70 110 Q70 150 110 178 Q160 214 290 220"
          fill="none"
          stroke="#7a4a1e"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="2 22"
          opacity="0.5"
        />
        {/* Sonic dashing along the loop crest */}
        <g className="snc-runner">
          <circle cx="0" cy="0" r="13" fill="#1a6fd6" />
          <path d="M-12 -4 L-26 -10 L-22 2 L-30 6 L-18 8 Z" fill="#1a6fd6" />
          <circle cx="6" cy="-3" r="9" fill="#f0c089" />
          <circle cx="9" cy="-5" r="2" fill="#0a1a2c" />
          <path d="M2 6 L6 14 L12 6 Z" fill="#e23b3b" />
        </g>
      </svg>

      {/* Spinning gold rings hovering over the path */}
      <svg className="snc-rings" viewBox="0 0 400 60">
        <g className="snc-ring" fill="none" stroke="#ffd23a" strokeWidth="4">
          <ellipse cx="60" cy="30" rx="9" ry="14" />
          <ellipse cx="180" cy="30" rx="9" ry="14" />
          <ellipse cx="300" cy="30" rx="9" ry="14" />
        </g>
      </svg>

      {/* Grassy ridge with a checkerboard cliff face beneath */}
      <svg className="snc-ground" viewBox="0 0 1200 260" preserveAspectRatio="none">
        {/* checkerboard dirt cliff */}
        <defs>
          <pattern id="snc-check" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect width="60" height="60" fill="#c47a2c" />
            <rect width="30" height="30" fill="#a35e1c" />
            <rect x="30" y="30" width="30" height="30" fill="#a35e1c" />
          </pattern>
        </defs>
        <rect x="0" y="70" width="1200" height="190" fill="url(#snc-check)" />
        {/* grassy top lip */}
        <path
          d="M0 90 L0 60 Q150 36 320 56 Q500 78 680 50 Q860 24 1040 58 Q1130 74 1200 60 L1200 90 Z"
          fill="#37c14a"
        />
        <path
          d="M0 96 Q150 72 320 92 Q500 114 680 86 Q860 60 1040 94 Q1130 110 1200 96 L1200 102 L0 102 Z"
          fill="#1f6b2c"
        />
      </svg>

      {/* Floating sparkle dots that scatter as Sonic passes */}
      <div className="snc-sparkle" />
    </div>
  );
}
