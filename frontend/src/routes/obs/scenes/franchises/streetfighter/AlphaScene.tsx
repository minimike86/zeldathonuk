import './streetfighter.css';

/**
 * Street Fighter Alpha — anime-style training rooftop at sunset. A vivid
 * orange/teal sky over a city skyline, a tiled rooftop with a water tower and
 * laundry lines, a fighter doing a flying kick framed by bold ink speed-lines,
 * and a burst of cel-shaded impact stars. Bold black ink outlines throughout.
 * `.sfa-` namespace.
 */
export function AlphaScene() {
  return (
    <div className="sfa-scene" aria-hidden="true">
      {/* Radial sunburst behind the action */}
      <div className="sfa-sun" />

      {/* Bold anime speed-lines radiating from centre */}
      <svg className="sfa-speedlines" viewBox="-300 -300 600 600" preserveAspectRatio="xMidYMid slice">
        <g stroke="rgba(10, 18, 28, 0.55)" strokeWidth="6" strokeLinecap="round">
          <line x1="0" y1="0" x2="0" y2="-300" />
          <line x1="0" y1="0" x2="150" y2="-260" />
          <line x1="0" y1="0" x2="260" y2="-150" />
          <line x1="0" y1="0" x2="300" y2="0" />
          <line x1="0" y1="0" x2="260" y2="150" />
          <line x1="0" y1="0" x2="150" y2="260" />
          <line x1="0" y1="0" x2="0" y2="300" />
          <line x1="0" y1="0" x2="-150" y2="260" />
          <line x1="0" y1="0" x2="-260" y2="150" />
          <line x1="0" y1="0" x2="-300" y2="0" />
          <line x1="0" y1="0" x2="-260" y2="-150" />
          <line x1="0" y1="0" x2="-150" y2="-260" />
        </g>
      </svg>

      {/* Teal city skyline silhouette */}
      <svg className="sfa-skyline" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <g fill="rgba(18, 70, 84, 0.92)">
          <rect x="20" y="120" width="90" height="120" />
          <rect x="130" y="80" width="70" height="160" />
          <rect x="220" y="140" width="100" height="100" />
          <rect x="340" y="60" width="60" height="180" />
          <rect x="420" y="110" width="110" height="130" />
          <rect x="560" y="150" width="80" height="90" />
          <rect x="660" y="90" width="64" height="150" />
          <rect x="740" y="130" width="120" height="110" />
          <rect x="880" y="70" width="70" height="170" />
          <rect x="970" y="120" width="100" height="120" />
          <rect x="1090" y="150" width="90" height="90" />
        </g>
        {/* lit windows */}
        <g fill="rgba(255, 196, 90, 0.7)">
          <rect x="150" y="100" width="8" height="10" />
          <rect x="170" y="100" width="8" height="10" />
          <rect x="356" y="84" width="8" height="10" />
          <rect x="356" y="110" width="8" height="10" />
          <rect x="900" y="92" width="8" height="10" />
          <rect x="920" y="120" width="8" height="10" />
        </g>
      </svg>

      {/* Rooftop deck with bold ink outline */}
      <svg className="sfa-rooftop" viewBox="0 0 1200 220" preserveAspectRatio="none">
        <path d="M0 220 L0 70 Q600 40 1200 70 L1200 220 Z" fill="rgba(38, 24, 16, 1)"
          stroke="rgba(8, 6, 10, 1)" strokeWidth="6" />
        {/* tile seams */}
        <g stroke="rgba(255, 150, 70, 0.22)" strokeWidth="3">
          <line x1="0" y1="120" x2="1200" y2="104" />
          <line x1="0" y1="170" x2="1200" y2="158" />
          <line x1="300" y1="70" x2="300" y2="220" />
          <line x1="600" y1="56" x2="600" y2="220" />
          <line x1="900" y1="60" x2="900" y2="220" />
        </g>
      </svg>

      {/* Rooftop water tower on the right */}
      <svg className="sfa-watertower" viewBox="0 0 120 200">
        {/* legs */}
        <g stroke="rgba(8, 6, 10, 1)" strokeWidth="6">
          <line x1="24" y1="200" x2="36" y2="120" />
          <line x1="96" y1="200" x2="84" y2="120" />
          <line x1="60" y1="200" x2="60" y2="120" />
        </g>
        {/* tank */}
        <path d="M28 120 L92 120 L84 50 L36 50 Z" fill="rgba(46, 30, 20, 1)"
          stroke="rgba(8, 6, 10, 1)" strokeWidth="6" />
        {/* conical roof */}
        <path d="M30 50 L90 50 L60 16 Z" fill="rgba(30, 18, 12, 1)"
          stroke="rgba(8, 6, 10, 1)" strokeWidth="6" strokeLinejoin="round" />
        {/* band highlight */}
        <line x1="34" y1="88" x2="86" y2="88" stroke="rgba(255, 150, 70, 0.4)" strokeWidth="4" />
      </svg>

      {/* Laundry line with fluttering sheets */}
      <svg className="sfa-laundry" viewBox="0 0 400 120" preserveAspectRatio="none">
        <path d="M0 14 Q200 40 400 14" fill="none" stroke="rgba(8, 6, 10, 0.9)" strokeWidth="3" />
        <g stroke="rgba(8, 6, 10, 0.9)" strokeWidth="3">
          <path className="sfa-sheet" d="M70 24 L70 80 Q86 74 102 80 L102 24 Z" fill="rgba(255, 230, 200, 0.85)" />
          <path className="sfa-sheet sfa-sheet-2" d="M180 30 L180 86 Q196 80 212 86 L212 30 Z" fill="rgba(160, 220, 230, 0.85)" />
          <path className="sfa-sheet sfa-sheet-3" d="M300 24 L300 78 Q316 72 332 78 L332 24 Z" fill="rgba(255, 200, 170, 0.85)" />
        </g>
      </svg>

      {/* Fighter mid flying-kick, heavy ink outline */}
      <svg className="sfa-fighter" viewBox="0 0 160 140">
        <g fill="rgba(8, 6, 10, 1)" stroke="rgba(8, 6, 10, 1)" strokeWidth="4" strokeLinejoin="round">
          {/* torso leaning into the kick */}
          <path d="M58 40 L94 48 Q102 70 90 90 L60 84 Q50 62 58 40 Z" />
          {/* extended kicking leg */}
          <path d="M90 70 L150 58 L152 70 L96 86 Z" />
          {/* trailing leg tucked */}
          <path d="M64 80 L54 110 L66 114 L78 88 Z" />
          {/* lead arm thrown back for balance */}
          <path d="M60 52 L26 44 L24 54 L60 64 Z" />
          {/* rear arm guard */}
          <path d="M88 54 L108 64 L104 74 L84 66 Z" />
          {/* head */}
          <ellipse cx="68" cy="32" rx="11" ry="12" />
        </g>
        {/* teal gi accent */}
        <path d="M58 40 L94 48 Q98 60 92 72 L62 66 Q54 52 58 40 Z" fill="rgba(40, 170, 180, 0.9)" />
        {/* orange headband flowing back */}
        <path d="M58 28 L34 20 L36 28 L60 36 Z" fill="rgba(232, 84, 46, 1)"
          stroke="rgba(8, 6, 10, 1)" strokeWidth="2" />
      </svg>

      {/* Cel-shaded impact burst near the kick */}
      <svg className="sfa-impact" viewBox="-50 -50 100 100">
        <path d="M0 -46 L10 -14 L42 -22 L18 2 L40 30 L6 18 L0 48 L-8 16 L-40 28 L-18 0 L-44 -24 L-10 -14 Z"
          fill="rgba(255, 230, 120, 0.95)" stroke="rgba(8, 6, 10, 1)" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="0" cy="0" r="10" fill="#fff" />
      </svg>
    </div>
  );
}
