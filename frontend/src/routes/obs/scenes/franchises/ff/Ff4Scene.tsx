import './ff.css';

/**
 * Final Fantasy IV — the Red Wings, Baron's airship fleet, flying in formation
 * beneath an enormous moon over a deep-blue night sky and a sea of clouds.
 * `.ff4-` namespace.
 */
export function Ff4Scene() {
  return (
    <div className="ff4-scene" aria-hidden="true">
      {/* Twinkling starfield */}
      <div className="ff4-stars" />

      {/* The huge moon */}
      <svg className="ff4-moon" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="90" fill="#e8e2d0" />
        <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255, 250, 230, 0.6)" strokeWidth="2" />
        {/* craters / maria */}
        <g fill="rgba(180, 172, 150, 0.7)">
          <ellipse cx="74" cy="78" rx="22" ry="16" />
          <ellipse cx="120" cy="110" rx="28" ry="20" />
          <ellipse cx="92" cy="140" rx="16" ry="12" />
          <circle cx="138" cy="68" r="9" />
        </g>
      </svg>

      {/* Lead Red Wings flagship */}
      <svg className="ff4-airship ff4-airship-lead" viewBox="0 0 240 110">
        {/* hull */}
        <path d="M30 56 Q60 32 170 38 Q214 42 226 58 Q214 76 170 80 Q60 84 30 56 Z"
              fill="rgba(150, 36, 40, 0.99)" />
        {/* deck cabin */}
        <path d="M88 38 L168 42 L158 22 L100 22 Z" fill="rgba(120, 28, 32, 0.99)" />
        {/* great red sails / wings */}
        <path d="M70 40 L40 4 L120 30 Z" fill="rgba(176, 44, 48, 0.96)" />
        <path d="M150 42 L190 8 L120 32 Z" fill="rgba(176, 44, 48, 0.96)" />
        {/* prow */}
        <path d="M226 58 L240 52 L236 60 L240 68 Z" fill="rgba(120, 28, 32, 0.99)" />
        {/* warm lit windows */}
        <g fill="#ffd98a">
          <rect x="104" y="26" width="6" height="8" />
          <rect x="120" y="26" width="6" height="8" />
          <rect x="136" y="26" width="6" height="8" />
        </g>
        {/* paddle wheel */}
        <circle cx="40" cy="56" r="14" fill="none" stroke="rgba(120, 28, 32, 0.99)" strokeWidth="4" />
      </svg>

      {/* Escort ships in formation */}
      <svg className="ff4-airship ff4-airship-2" viewBox="0 0 160 80">
        <path d="M20 42 Q44 24 116 28 Q146 30 152 44 Q146 58 116 60 Q44 62 20 42 Z"
              fill="rgba(132, 32, 36, 0.95)" />
        <path d="M50 28 L46 6 L96 22 Z" fill="rgba(160, 40, 44, 0.92)" />
        <g fill="#ffd98a"><rect x="64" y="32" width="5" height="6" /><rect x="80" y="32" width="5" height="6" /></g>
      </svg>
      <svg className="ff4-airship ff4-airship-3" viewBox="0 0 160 80">
        <path d="M20 42 Q44 24 116 28 Q146 30 152 44 Q146 58 116 60 Q44 62 20 42 Z"
              fill="rgba(120, 28, 32, 0.92)" />
        <path d="M50 28 L46 6 L96 22 Z" fill="rgba(148, 36, 40, 0.9)" />
        <g fill="#ffd98a"><rect x="64" y="32" width="5" height="6" /><rect x="80" y="32" width="5" height="6" /></g>
      </svg>

      {/* Sea of moonlit clouds */}
      <svg className="ff4-clouds" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <path
          d="M0 240 L0 140 Q90 110 170 130 Q230 110 320 132 Q400 108 500 134
             Q580 112 680 132 Q770 110 870 134 Q960 112 1060 132 Q1140 114 1200 134 L1200 240 Z"
          fill="rgba(36, 50, 96, 0.85)"
        />
        <path
          d="M0 240 L0 180 Q120 156 260 176 Q420 198 560 174 Q720 150 880 178
             Q1020 200 1200 174 L1200 240 Z"
          fill="rgba(24, 34, 70, 0.95)"
        />
        {/* moonlit cloud rims */}
        <g fill="rgba(160, 180, 230, 0.4)">
          <ellipse cx="180" cy="138" rx="70" ry="10" />
          <ellipse cx="540" cy="138" rx="80" ry="10" />
          <ellipse cx="900" cy="138" rx="70" ry="10" />
        </g>
      </svg>
    </div>
  );
}
