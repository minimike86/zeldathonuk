import './megaman.css';

/**
 * Mega Man (fallback) — the quintessential NES boss-gate. A dark steel
 * chamber framed by the two-leaf shutter doors of a boss room, a tiled
 * blue floor and ceiling, the big circular Robot-Master gate light on the
 * back wall, and the classic blue hero standing ready with his buster.
 * Generic enough to cover 1 / 4 / 5. Cool blue / steel palette.
 *
 * Namespace: `.mm1-`
 */
export function MegaManScene() {
  return (
    <div className="mm1-scene" aria-hidden="true">
      {/* Tiled back wall */}
      <svg className="mm1-wall" viewBox="0 0 1200 360" preserveAspectRatio="none">
        <rect width="1200" height="360" fill="#16284a" />
        <g stroke="#243f6e" strokeWidth="2">
          <line x1="0" y1="60" x2="1200" y2="60" />
          <line x1="0" y1="120" x2="1200" y2="120" />
          <line x1="0" y1="180" x2="1200" y2="180" />
          <line x1="0" y1="240" x2="1200" y2="240" />
          <line x1="0" y1="300" x2="1200" y2="300" />
        </g>
        <g stroke="#243f6e" strokeWidth="2">
          <line x1="120" y1="0" x2="120" y2="360" />
          <line x1="280" y1="0" x2="280" y2="360" />
          <line x1="440" y1="0" x2="440" y2="360" />
          <line x1="760" y1="0" x2="760" y2="360" />
          <line x1="920" y1="0" x2="920" y2="360" />
          <line x1="1080" y1="0" x2="1080" y2="360" />
        </g>
      </svg>

      {/* Big circular Robot-Master gate light on the back wall */}
      <svg className="mm1-gate" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="80" fill="#0c1d3a" stroke="#2f74dd" strokeWidth="6" />
        <circle className="mm1-gate-ring" cx="100" cy="100" r="58" fill="none" stroke="#28e6ff" strokeWidth="4" opacity="0.7" />
        <circle cx="100" cy="100" r="34" fill="#123a78" />
        <circle className="mm1-gate-core" cx="100" cy="100" r="18" fill="#7af6ff" />
      </svg>

      {/* Left boss-gate shutter (two leaves) */}
      <svg className="mm1-door mm1-door-left" viewBox="0 0 120 360" preserveAspectRatio="none">
        <rect x="0" y="0" width="120" height="360" fill="#33507e" />
        <rect x="100" y="0" width="20" height="360" fill="#1a2c47" />
        <g fill="#27406b">
          <rect x="20" y="20" width="60" height="70" rx="4" />
          <rect x="20" y="110" width="60" height="70" rx="4" />
          <rect x="20" y="200" width="60" height="70" rx="4" />
          <rect x="20" y="290" width="60" height="50" rx="4" />
        </g>
        {/* rivets */}
        <g fill="#4f74ad">
          <circle cx="30" cy="30" r="3" />
          <circle cx="70" cy="30" r="3" />
          <circle cx="30" cy="120" r="3" />
          <circle cx="70" cy="120" r="3" />
        </g>
      </svg>

      {/* Right boss-gate shutter */}
      <svg className="mm1-door mm1-door-right" viewBox="0 0 120 360" preserveAspectRatio="none">
        <rect x="0" y="0" width="120" height="360" fill="#33507e" />
        <rect x="0" y="0" width="20" height="360" fill="#1a2c47" />
        <g fill="#27406b">
          <rect x="40" y="20" width="60" height="70" rx="4" />
          <rect x="40" y="110" width="60" height="70" rx="4" />
          <rect x="40" y="200" width="60" height="70" rx="4" />
          <rect x="40" y="290" width="60" height="50" rx="4" />
        </g>
        <g fill="#4f74ad">
          <circle cx="50" cy="30" r="3" />
          <circle cx="90" cy="30" r="3" />
          <circle cx="50" cy="120" r="3" />
          <circle cx="90" cy="120" r="3" />
        </g>
      </svg>

      {/* Tiled floor */}
      <svg className="mm1-floor" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <rect x="0" y="20" width="1200" height="100" fill="#1f3257" />
        <rect x="0" y="20" width="1200" height="6" fill="#2f74dd" />
        <g stroke="#16284a" strokeWidth="3">
          <line x1="100" y1="26" x2="100" y2="120" />
          <line x1="300" y1="26" x2="300" y2="120" />
          <line x1="500" y1="26" x2="500" y2="120" />
          <line x1="700" y1="26" x2="700" y2="120" />
          <line x1="900" y1="26" x2="900" y2="120" />
          <line x1="1100" y1="26" x2="1100" y2="120" />
        </g>
      </svg>

      {/* Blue hero standing ready, buster out */}
      <svg className="mm1-hero" viewBox="0 0 70 90">
        <g fill="#0b63d8">
          {/* torso */}
          <rect x="22" y="40" width="20" height="26" />
          {/* helmet */}
          <path d="M20 22 Q31 14 42 22 L42 38 L20 38 Z" />
          {/* legs braced */}
          <rect x="20" y="66" width="9" height="22" />
          <rect x="35" y="66" width="9" height="22" />
          {/* buster arm forward */}
          <rect x="42" y="44" width="22" height="11" rx="3" />
        </g>
        {/* face */}
        <rect x="25" y="28" width="12" height="9" fill="#9fd0ff" />
        <rect x="27" y="30" width="3" height="5" fill="#0b2a66" />
        <rect x="32" y="30" width="3" height="5" fill="#0b2a66" />
        {/* helmet gem */}
        <rect x="29" y="18" width="4" height="4" fill="#28e6ff" />
        {/* buster muzzle glow */}
        <circle className="mm1-buster" cx="64" cy="49" r="6" fill="#7af6ff" />
      </svg>
    </div>
  );
}
