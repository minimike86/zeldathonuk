import './megaman.css';

/**
 * Mega Man 6 — the Global Robot Tournament era. A bold, brightly-lit NES
 * stage in saturated primaries: a clear sky banded with bunting-style
 * pennant flags strung across the top, a tiered grandstand wall behind a
 * tournament arena floor, a waving tournament flag on a pole, and the
 * classic blue hero squared up mid-arena with his buster out. Bold red /
 * yellow / blue tournament colours.
 *
 * Namespace: `.mm6-`
 */
export function MegaMan6Scene() {
  return (
    <div className="mm6-scene" aria-hidden="true">
      {/* Strings of tournament pennant flags across the top */}
      <svg className="mm6-bunting" viewBox="0 0 1200 90" preserveAspectRatio="none">
        <path d="M0 14 Q300 50 600 14 Q900 50 1200 14" fill="none" stroke="#ffd23a" strokeWidth="3" />
        <g className="mm6-pennants">
          <path d="M60 22 L84 22 L72 46 Z" fill="#e22a2a" />
          <path d="M150 30 L174 30 L162 54 Z" fill="#1763c8" />
          <path d="M250 32 L274 32 L262 56 Z" fill="#ffd23a" />
          <path d="M360 30 L384 30 L372 54 Z" fill="#e22a2a" />
          <path d="M480 24 L504 24 L492 48 Z" fill="#1763c8" />
          <path d="M600 20 L624 20 L612 44 Z" fill="#ffd23a" />
          <path d="M720 24 L744 24 L732 48 Z" fill="#e22a2a" />
          <path d="M840 30 L864 30 L852 54 Z" fill="#1763c8" />
          <path d="M960 32 L984 32 L972 56 Z" fill="#ffd23a" />
          <path d="M1070 30 L1094 30 L1082 54 Z" fill="#e22a2a" />
        </g>
      </svg>

      {/* Tiered grandstand wall behind the arena */}
      <svg className="mm6-stands" viewBox="0 0 1200 360" preserveAspectRatio="none">
        <rect width="1200" height="360" fill="#2f7fe0" />
        <g fill="#1763c8">
          <rect x="0" y="80" width="1200" height="40" />
          <rect x="0" y="150" width="1200" height="40" />
          <rect x="0" y="220" width="1200" height="40" />
        </g>
        {/* crowd dot rows */}
        <g fill="#ffd23a">
          <rect x="60" y="90" width="14" height="14" />
          <rect x="160" y="90" width="14" height="14" />
          <rect x="260" y="90" width="14" height="14" />
          <rect x="420" y="90" width="14" height="14" />
          <rect x="640" y="90" width="14" height="14" />
          <rect x="860" y="90" width="14" height="14" />
          <rect x="1060" y="90" width="14" height="14" />
        </g>
        <g fill="#e22a2a">
          <rect x="120" y="160" width="14" height="14" />
          <rect x="320" y="160" width="14" height="14" />
          <rect x="520" y="160" width="14" height="14" />
          <rect x="740" y="160" width="14" height="14" />
          <rect x="960" y="160" width="14" height="14" />
        </g>
      </svg>

      {/* Tournament flag on a pole, waving */}
      <svg className="mm6-flag" viewBox="0 0 100 160">
        <rect x="14" y="0" width="6" height="160" fill="#5a6f8c" />
        <path className="mm6-flagcloth" d="M20 8 L90 14 Q70 30 90 46 L20 52 Z" fill="#e22a2a" />
        <circle cx="55" cy="30" r="9" fill="#ffd23a" />
      </svg>

      {/* Arena floor */}
      <svg className="mm6-floor" viewBox="0 0 1200 140" preserveAspectRatio="none">
        <rect x="0" y="24" width="1200" height="116" fill="#e07a1a" />
        <rect x="0" y="24" width="1200" height="8" fill="#ffd23a" />
        <g stroke="#b35a08" strokeWidth="3">
          <line x1="150" y1="32" x2="150" y2="140" />
          <line x1="370" y1="32" x2="370" y2="140" />
          <line x1="600" y1="32" x2="600" y2="140" />
          <line x1="830" y1="32" x2="830" y2="140" />
          <line x1="1050" y1="32" x2="1050" y2="140" />
        </g>
      </svg>

      {/* Blue hero squared up, buster forward */}
      <svg className="mm6-hero" viewBox="0 0 70 90">
        <g fill="#1763c8">
          <rect x="22" y="40" width="20" height="26" />
          <path d="M20 22 Q31 14 42 22 L42 38 L20 38 Z" />
          <rect x="20" y="66" width="9" height="22" />
          <rect x="35" y="66" width="9" height="22" />
          <rect x="42" y="44" width="22" height="11" rx="3" />
        </g>
        <rect x="25" y="28" width="12" height="9" fill="#9fd0ff" />
        <rect x="27" y="30" width="3" height="5" fill="#0b2a66" />
        <rect x="32" y="30" width="3" height="5" fill="#0b2a66" />
        <rect x="29" y="18" width="4" height="4" fill="#ffd23a" />
        <circle className="mm6-buster" cx="64" cy="49" r="6" fill="#ffd23a" />
      </svg>
    </div>
  );
}
