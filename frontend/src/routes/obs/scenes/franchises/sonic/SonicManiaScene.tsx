import './sonic.css';

/**
 * Sonic Mania — Studiopolis Zone. A retro-modern neon news/TV city at dusk:
 * pink/teal skyscrapers, a glowing TV-station broadcast tower, a flickering
 * neon "ON AIR" sign, drifting popcorn clouds, and a giant pixel-styled
 * camera flash. Pink / teal palette.
 *
 * `.smn-` namespace.
 */
export function SonicManiaScene() {
  return (
    <div className="smn-scene" aria-hidden="true">
      {/* Neon dusk wash */}
      <div className="smn-wash" />

      {/* Studiopolis skyline in neon pink/teal */}
      <svg className="smn-skyline" viewBox="0 0 1200 360" preserveAspectRatio="none">
        <g fill="#3a1f6e">
          <rect x="30" y="120" width="100" height="240" />
          <rect x="280" y="80" width="80" height="280" />
          <rect x="560" y="140" width="120" height="220" />
          <rect x="900" y="100" width="90" height="260" />
        </g>
        <g fill="#2a1550">
          <rect x="160" y="160" width="90" height="200" />
          <rect x="420" y="110" width="100" height="250" />
          <rect x="740" y="150" width="120" height="210" />
          <rect x="1040" y="130" width="120" height="230" />
        </g>
        {/* neon rooftop strips */}
        <g className="smn-neon-strip">
          <rect x="30" y="116" width="100" height="6" fill="#ff5fa8" />
          <rect x="560" y="136" width="120" height="6" fill="#33e6d0" />
          <rect x="900" y="96" width="90" height="6" fill="#ff5fa8" />
          <rect x="1040" y="126" width="120" height="6" fill="#33e6d0" />
        </g>
        {/* windows */}
        <g fill="#ffe27a" opacity="0.85">
          <rect x="300" y="110" width="10" height="14" />
          <rect x="324" y="110" width="10" height="14" />
          <rect x="300" y="150" width="10" height="14" />
          <rect x="600" y="170" width="10" height="14" />
          <rect x="624" y="170" width="10" height="14" />
        </g>
      </svg>

      {/* Broadcast tower with a pulsing beacon */}
      <svg className="smn-tower" viewBox="0 0 120 280">
        <path d="M44 280 L76 280 L66 90 L54 90 Z" fill="#6b3aa0" />
        <g stroke="#9a6fd0" strokeWidth="3">
          <path d="M48 240 H72" />
          <path d="M50 200 H70" />
          <path d="M52 160 H68" />
        </g>
        {/* dish */}
        <ellipse cx="60" cy="78" rx="26" ry="12" fill="#b07cff" />
        <ellipse cx="60" cy="78" rx="14" ry="6" fill="#6b3aa0" />
        {/* pulsing beacon */}
        <circle className="smn-beacon" cx="60" cy="40" r="9" fill="#33e6d0" />
        <g className="smn-beacon-ring" fill="none" stroke="#33e6d0" strokeWidth="2">
          <circle cx="60" cy="40" r="16" />
        </g>
      </svg>

      {/* Flickering neon ON AIR sign */}
      <svg className="smn-sign" viewBox="0 0 200 90">
        <rect x="6" y="6" width="188" height="78" rx="12" fill="#1a0e30" stroke="#ff5fa8" strokeWidth="3" />
        <g className="smn-onair" fill="#ff5fa8">
          {/* O N */}
          <rect x="26" y="26" width="14" height="38" rx="6" fill="none" stroke="#ff5fa8" strokeWidth="5" />
          <path d="M54 64 V26 L78 64 V26" fill="none" stroke="#ff5fa8" strokeWidth="5" />
        </g>
        <g className="smn-onair smn-onair-2" fill="none" stroke="#33e6d0" strokeWidth="5">
          {/* A I R */}
          <path d="M104 64 L114 26 L124 64 M108 50 H120" />
          <path d="M138 26 V64" />
          <path d="M156 64 V26 H172 Q180 26 180 38 Q180 48 168 48 L180 64 M156 48 H168" />
        </g>
      </svg>

      {/* Drifting popcorn clouds */}
      <div className="smn-popcorn" />

      {/* Giant camera flash burst */}
      <div className="smn-flash" />

      {/* Checkered foreground street */}
      <svg className="smn-street" viewBox="0 0 1200 140" preserveAspectRatio="none">
        <defs>
          <pattern id="smn-check" width="80" height="40" patternUnits="userSpaceOnUse">
            <rect width="80" height="40" fill="#2a1550" />
            <rect width="40" height="40" fill="#3a1f6e" />
          </pattern>
        </defs>
        <rect x="0" y="30" width="1200" height="110" fill="url(#smn-check)" />
        <rect x="0" y="30" width="1200" height="6" fill="#ff5fa8" opacity="0.7" />
      </svg>
    </div>
  );
}
