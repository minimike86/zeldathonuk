import './sonic.css';

/**
 * Sonic Colours — Starlight Carnival. A neon space amusement park drifting
 * in a violet starfield: a ringed planet backdrop, a roller-coaster light
 * track arcing through space, neon ferris wheel, parade fireworks, and a
 * darting white Wisp. Neon violet / cyan / magenta palette.
 *
 * `.scl-` namespace.
 */
export function SonicColorsScene() {
  return (
    <div className="scl-scene" aria-hidden="true">
      {/* Drifting starfield */}
      <div className="scl-stars" />

      {/* Ringed planet backdrop */}
      <svg className="scl-planet" viewBox="0 0 240 200">
        <circle cx="120" cy="100" r="70" fill="#6b3aa0" />
        <circle cx="120" cy="100" r="70" fill="url(#scl-planet-shade)" />
        <defs>
          <radialGradient id="scl-planet-shade" cx="38%" cy="36%" r="70%">
            <stop offset="0%" stopColor="#a96fe0" />
            <stop offset="100%" stopColor="#3a1f6e" />
          </radialGradient>
        </defs>
        <ellipse cx="120" cy="100" rx="118" ry="30" fill="none" stroke="#33e6d0" strokeWidth="6" opacity="0.7" transform="rotate(-18 120 100)" />
        <ellipse cx="120" cy="100" rx="100" ry="24" fill="none" stroke="#ff5fa8" strokeWidth="4" opacity="0.6" transform="rotate(-18 120 100)" />
      </svg>

      {/* Neon ferris wheel slowly turning */}
      <svg className="scl-wheel" viewBox="0 0 200 200">
        <g className="scl-wheel-spin">
          <circle cx="100" cy="100" r="86" fill="none" stroke="#33e6d0" strokeWidth="4" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="#ff5fa8" strokeWidth="3" />
          <g stroke="#b07cff" strokeWidth="3">
            <path d="M100 14 V186" />
            <path d="M14 100 H186" />
            <path d="M39 39 L161 161" />
            <path d="M161 39 L39 161" />
          </g>
          {/* gondola lights */}
          <g fill="#ffe27a">
            <circle cx="100" cy="14" r="6" />
            <circle cx="186" cy="100" r="6" />
            <circle cx="100" cy="186" r="6" />
            <circle cx="14" cy="100" r="6" />
            <circle cx="39" cy="39" r="6" />
            <circle cx="161" cy="39" r="6" />
            <circle cx="39" cy="161" r="6" />
            <circle cx="161" cy="161" r="6" />
          </g>
        </g>
        <circle cx="100" cy="100" r="10" fill="#33e6d0" />
      </svg>

      {/* Roller-coaster light track arcing through space */}
      <svg className="scl-track" viewBox="0 0 600 240">
        <path
          className="scl-track-line"
          d="M-10 200 Q120 60 260 140 Q380 208 480 90 Q540 20 610 70"
          fill="none"
          stroke="#33e6d0"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M-10 200 Q120 60 260 140 Q380 208 480 90 Q540 20 610 70"
          fill="none"
          stroke="#ff5fa8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="3 18"
        />
        {/* coaster car running the track */}
        <g className="scl-car">
          <rect x="-14" y="-8" width="28" height="16" rx="6" fill="#ffe27a" />
          <circle cx="-6" cy="0" r="3" fill="#6b3aa0" />
          <circle cx="6" cy="0" r="3" fill="#6b3aa0" />
        </g>
      </svg>

      {/* Darting white Wisp */}
      <svg className="scl-wisp" viewBox="0 0 60 60">
        <ellipse cx="30" cy="34" rx="18" ry="22" fill="#f4feff" />
        <path d="M16 16 Q30 -2 44 16 Q34 12 30 18 Q26 12 16 16 Z" fill="#f4feff" />
        <circle cx="23" cy="30" r="5" fill="#1a0e30" />
        <circle cx="37" cy="30" r="5" fill="#1a0e30" />
        <circle cx="24" cy="28" r="1.6" fill="#fff" />
        <circle cx="38" cy="28" r="1.6" fill="#fff" />
      </svg>

      {/* Parade fireworks bursts */}
      <div className="scl-fireworks" />

      {/* Neon promenade foreground */}
      <svg className="scl-promenade" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <rect x="0" y="40" width="1200" height="80" fill="#1a0e30" />
        <rect x="0" y="40" width="1200" height="5" fill="#33e6d0" opacity="0.8" />
        <g fill="#ff5fa8" opacity="0.8">
          <circle cx="120" cy="64" r="5" />
          <circle cx="320" cy="64" r="5" />
          <circle cx="520" cy="64" r="5" />
          <circle cx="720" cy="64" r="5" />
          <circle cx="920" cy="64" r="5" />
          <circle cx="1120" cy="64" r="5" />
        </g>
      </svg>
    </div>
  );
}
