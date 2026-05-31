import './castlevania.css';

/**
 * Super Castlevania IV — the grand entrance hall: a towering stained-glass
 * window glows above, stone pillars recede down a crimson carpet, and two
 * heavy iron chandeliers swing overhead. Crimson/gold palette. `.scv4-`
 * namespace.
 */
export function SuperCv4Scene() {
  return (
    <div className="scv4-scene" aria-hidden="true">
      {/* Stained-glass rose window high on the back wall */}
      <svg className="scv4-window" viewBox="0 0 200 280">
        {/* gothic arch frame */}
        <path d="M20 280 L20 100 Q100 0 180 100 L180 280 Z" fill="rgba(40, 8, 12, 0.9)" />
        <path d="M30 280 L30 104 Q100 16 170 104 L170 280 Z" fill="rgba(10, 4, 6, 0.95)" />
        {/* leaded glass panels */}
        <g opacity="0.92">
          <path d="M36 270 L36 108 Q100 26 164 108 L164 270 Z" fill="#7a1f2a" />
          {/* mullion verticals */}
          <rect x="68" y="60" width="4" height="210" fill="rgba(20, 6, 8, 0.8)" />
          <rect x="98" y="34" width="4" height="236" fill="rgba(20, 6, 8, 0.8)" />
          <rect x="128" y="60" width="4" height="210" fill="rgba(20, 6, 8, 0.8)" />
          {/* glowing coloured lights */}
          <circle cx="100" cy="90" r="20" fill="#ffd76a" />
          <circle cx="100" cy="90" r="11" fill="#ffeaa0" />
          <rect x="48" y="140" width="14" height="34" fill="#d4992e" opacity="0.9" />
          <rect x="84" y="150" width="14" height="40" fill="#c23a44" opacity="0.85" />
          <rect x="118" y="150" width="14" height="40" fill="#d4992e" opacity="0.9" />
          <rect x="140" y="140" width="14" height="34" fill="#c23a44" opacity="0.85" />
        </g>
      </svg>

      {/* Stone pillars / hall walls */}
      <svg className="scv4-pillars" viewBox="0 0 1200 400" preserveAspectRatio="none">
        {/* back wall blocks */}
        <rect x="0" y="0" width="1200" height="400" fill="rgba(48, 14, 18, 0.4)" />
        <g fill="rgba(30, 8, 12, 0.95)">
          <rect x="40" y="40" width="90" height="360" />
          <rect x="220" y="20" width="100" height="380" />
          <rect x="880" y="20" width="100" height="380" />
          <rect x="1070" y="40" width="90" height="360" />
        </g>
        {/* pillar capitals */}
        <g fill="rgba(60, 20, 24, 0.95)">
          <rect x="28" y="34" width="114" height="16" />
          <rect x="208" y="14" width="124" height="16" />
          <rect x="868" y="14" width="124" height="16" />
          <rect x="1058" y="34" width="114" height="16" />
        </g>
        {/* pillar block seams */}
        <g stroke="rgba(12, 4, 6, 0.7)" strokeWidth="2">
          <line x1="40" y1="120" x2="130" y2="120" />
          <line x1="40" y1="200" x2="130" y2="200" />
          <line x1="40" y1="280" x2="130" y2="280" />
          <line x1="220" y1="110" x2="320" y2="110" />
          <line x1="220" y1="200" x2="320" y2="200" />
          <line x1="220" y1="290" x2="320" y2="290" />
          <line x1="880" y1="110" x2="980" y2="110" />
          <line x1="880" y1="200" x2="980" y2="200" />
          <line x1="880" y1="290" x2="980" y2="290" />
        </g>
      </svg>

      {/* Chandelier left */}
      <svg className="scv4-chandelier scv4-chandelier-left" viewBox="0 0 120 110">
        <line x1="60" y1="0" x2="60" y2="30" stroke="#3a2410" strokeWidth="3" />
        {/* iron ring */}
        <ellipse cx="60" cy="46" rx="46" ry="12" fill="none" stroke="#5a3c18" strokeWidth="5" />
        <ellipse cx="60" cy="56" rx="30" ry="8" fill="none" stroke="#4a2f12" strokeWidth="4" />
        {/* candle cups + flames */}
        <g>
          {[16, 38, 60, 82, 104].map((x, i) => (
            <g key={i}>
              <rect x={x - 2} y={42} width="4" height="10" fill="#d8cba0" />
              <path d={`M${x} 42 Q${x - 3} 34 ${x} 28 Q${x + 3} 34 ${x} 42 Z`} fill="#ffc24d" />
            </g>
          ))}
        </g>
      </svg>

      {/* Chandelier right */}
      <svg className="scv4-chandelier scv4-chandelier-right" viewBox="0 0 120 110">
        <line x1="60" y1="0" x2="60" y2="30" stroke="#3a2410" strokeWidth="3" />
        <ellipse cx="60" cy="46" rx="46" ry="12" fill="none" stroke="#5a3c18" strokeWidth="5" />
        <ellipse cx="60" cy="56" rx="30" ry="8" fill="none" stroke="#4a2f12" strokeWidth="4" />
        <g>
          {[16, 38, 60, 82, 104].map((x, i) => (
            <g key={i}>
              <rect x={x - 2} y={42} width="4" height="10" fill="#d8cba0" />
              <path d={`M${x} 42 Q${x - 3} 34 ${x} 28 Q${x + 3} 34 ${x} 42 Z`} fill="#ffc24d" />
            </g>
          ))}
        </g>
      </svg>

      {/* Crimson carpet running down the hall floor */}
      <svg className="scv4-carpet" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <rect x="0" y="0" width="1200" height="120" fill="rgba(18, 4, 6, 0.98)" />
        <path d="M420 120 L780 120 L660 0 L540 0 Z" fill="#8a1a26" />
        <path d="M470 120 L730 120 L640 0 L560 0 Z" fill="#b3303e" />
        {/* gold trim */}
        <path d="M540 0 L560 0 L470 120 L450 120 Z" fill="#d4992e" opacity="0.85" />
        <path d="M660 0 L640 0 L730 120 L750 120 Z" fill="#d4992e" opacity="0.85" />
      </svg>
    </div>
  );
}
