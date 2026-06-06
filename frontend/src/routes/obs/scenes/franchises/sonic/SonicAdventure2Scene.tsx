import './sonic.css';

/**
 * Sonic Adventure 2 — City Escape. A bright urban morning over downtown
 * skyscrapers, a grind-rail snaking down a sloped boulevard, and the GUN
 * truck barrelling along in pursuit. Urban blues and greens.
 *
 * `.sa2-` namespace.
 */
export function SonicAdventure2Scene() {
  return (
    <div className="sa2-scene" aria-hidden="true">
      {/* Hazy morning glow over the skyline */}
      <div className="sa2-glow" />

      {/* Far downtown skyscrapers */}
      <svg className="sa2-skyline" viewBox="0 0 1200 360" preserveAspectRatio="none">
        <g fill="#2f5e7a">
          <rect x="40" y="120" width="90" height="240" />
          <rect x="170" y="60" width="70" height="300" />
          <rect x="980" y="100" width="100" height="260" />
          <rect x="1110" y="160" width="70" height="200" />
        </g>
        <g fill="#26506a">
          <rect x="300" y="160" width="120" height="200" />
          <rect x="470" y="90" width="80" height="270" />
          <rect x="640" y="140" width="110" height="220" />
          <rect x="800" y="70" width="90" height="290" />
        </g>
        {/* lit windows */}
        <g fill="#7fe0c8" opacity="0.8">
          <rect x="190" y="90" width="10" height="14" />
          <rect x="214" y="90" width="10" height="14" />
          <rect x="190" y="130" width="10" height="14" />
          <rect x="820" y="100" width="10" height="14" />
          <rect x="844" y="100" width="10" height="14" />
          <rect x="820" y="140" width="10" height="14" />
          <rect x="1000" y="130" width="10" height="14" />
          <rect x="1024" y="130" width="10" height="14" />
        </g>
      </svg>

      {/* Sloped boulevard descending left-to-right */}
      <svg className="sa2-road" viewBox="0 0 1200 300" preserveAspectRatio="none">
        <path d="M0 90 L1200 200 L1200 300 L0 300 Z" fill="#3a4a52" />
        {/* lane dashes */}
        <g stroke="#e8e2c8" strokeWidth="6" strokeDasharray="40 36" opacity="0.7">
          <path d="M40 150 L1180 250" />
          <path d="M20 220 L1180 300" />
        </g>
      </svg>

      {/* Grind rail snaking down the slope */}
      <svg className="sa2-rail" viewBox="0 0 600 200">
        <path
          d="M10 40 Q150 60 260 110 Q360 156 590 170"
          fill="none"
          stroke="#9aa6ad"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M10 40 Q150 60 260 110 Q360 156 590 170"
          fill="none"
          stroke="#d8e0e4"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Sonic grinding with a spark trail */}
        <g className="sa2-grinder">
          <circle cx="0" cy="0" r="13" fill="#1a6fd6" />
          <path d="M-12 -3 L-28 -8 L-22 3 L-30 7 L-16 9 Z" fill="#1a6fd6" />
          <circle cx="6" cy="-3" r="9" fill="#f0c089" />
          <circle cx="9" cy="-5" r="2" fill="#0a1a2c" />
        </g>
        <g className="sa2-spark" fill="#ffe27a">
          <circle cx="0" cy="14" r="3" />
          <circle cx="-10" cy="16" r="2" />
          <circle cx="-20" cy="13" r="1.6" />
        </g>
      </svg>

      {/* GUN truck barrelling along the foreground road */}
      <svg className="sa2-truck" viewBox="0 0 240 130">
        {/* trailer / cab body */}
        <rect x="10" y="30" width="150" height="60" rx="8" fill="#4a5a3a" />
        <rect x="150" y="44" width="70" height="46" rx="8" fill="#3a4a2e" />
        {/* windshield */}
        <rect x="186" y="50" width="28" height="22" rx="4" fill="#9fd0e0" />
        {/* GUN insignia */}
        <circle cx="80" cy="60" r="16" fill="#c8d0b8" />
        <path d="M72 60 H88 M80 52 V68" stroke="#3a4a2e" strokeWidth="4" />
        {/* grille / bumper */}
        <rect x="216" y="74" width="10" height="18" fill="#9aa68a" />
        {/* wheels */}
        <g>
          <circle className="sa2-wheel" cx="56" cy="98" r="18" fill="#1a1a1a" />
          <circle className="sa2-wheel" cx="120" cy="98" r="18" fill="#1a1a1a" />
          <circle className="sa2-wheel" cx="190" cy="98" r="18" fill="#1a1a1a" />
        </g>
        <g fill="#5a5a5a">
          <circle cx="56" cy="98" r="6" />
          <circle cx="120" cy="98" r="6" />
          <circle cx="190" cy="98" r="6" />
        </g>
      </svg>

      {/* Foreground curb */}
      <svg className="sa2-curb" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <rect x="0" y="40" width="1200" height="80" fill="#2a343a" />
        <rect x="0" y="40" width="1200" height="8" fill="#7fe0c8" opacity="0.6" />
      </svg>
    </div>
  );
}
