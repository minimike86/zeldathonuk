import './ff.css';

/**
 * Final Fantasy IX — Alexandria at night. The castle-theatre with its great
 * sword-shaped tower (the "Falcon's Claw") rising over tiled rooftops, the
 * Prima Vista theatre-airship drifting in to dock, lanterns glowing amber
 * against a soft medieval blue. `.ff9-` namespace.
 */
export function Ff9Scene() {
  return (
    <div className="ff9-scene" aria-hidden="true">
      {/* Warm moon haze */}
      <div className="ff9-moon" />

      {/* Drifting clouds */}
      <svg className="ff9-clouds" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <g fill="rgba(160, 180, 220, 0.14)">
          <ellipse cx="220" cy="60" rx="170" ry="24" />
          <ellipse cx="640" cy="40" rx="200" ry="28" />
          <ellipse cx="1040" cy="70" rx="160" ry="24" />
        </g>
      </svg>

      {/* The Prima Vista theatre-airship drifting in */}
      <svg className="ff9-airship" viewBox="0 0 240 120">
        {/* hull */}
        <path d="M40 64 Q70 40 170 44 Q214 48 224 66 Q214 82 170 86 Q70 90 40 64 Z"
              fill="rgba(120, 70, 48, 0.99)" />
        {/* theatre dome on deck */}
        <path d="M90 44 Q130 8 170 44 Z" fill="rgba(150, 96, 56, 0.99)" />
        <rect x="126" y="2" width="8" height="10" fill="rgba(150, 96, 56, 0.99)" />
        {/* face figurehead (Prima Vista) at prow */}
        <circle cx="224" cy="66" r="12" fill="rgba(150, 96, 56, 0.99)" />
        <circle cx="226" cy="64" r="4" fill="#ffd98a" />
        {/* gold trim & lit portholes */}
        <g fill="#ffcf72">
          <circle cx="80" cy="64" r="3" />
          <circle cx="104" cy="66" r="3" />
          <circle cx="128" cy="66" r="3" />
          <circle cx="152" cy="66" r="3" />
        </g>
        {/* wing fins */}
        <path d="M70 80 L40 104 L90 86 Z" fill="rgba(100, 58, 38, 0.99)" />
      </svg>

      {/* Alexandria rooftops */}
      <svg className="ff9-rooftops" viewBox="0 0 1200 220" preserveAspectRatio="none">
        <path
          d="M0 220 L0 150 L60 110 L120 150 L180 120 L240 160 L320 110 L400 160
             L480 130 L560 170 L660 120 L760 165 L860 125 L960 168 L1060 130 L1140 170 L1200 140 L1200 220 Z"
          fill="rgba(34, 44, 76, 0.97)"
        />
        {/* scattered window lights */}
        <g fill="#ffce72" opacity="0.8">
          <rect x="100" y="160" width="5" height="8" />
          <rect x="300" y="150" width="5" height="8" />
          <rect x="540" y="180" width="5" height="8" />
          <rect x="740" y="172" width="5" height="8" />
          <rect x="1000" y="178" width="5" height="8" />
        </g>
      </svg>

      {/* Alexandria castle — the sword tower (Falcon's Claw) */}
      <svg className="ff9-castle" viewBox="0 0 260 360">
        {/* castle base */}
        <rect x="40" y="200" width="180" height="160" fill="rgba(40, 52, 88, 0.98)" />
        {/* battlements */}
        <g fill="rgba(40, 52, 88, 0.98)">
          <rect x="40" y="190" width="20" height="14" />
          <rect x="80" y="190" width="20" height="14" />
          <rect x="120" y="190" width="20" height="14" />
          <rect x="160" y="190" width="20" height="14" />
          <rect x="200" y="190" width="20" height="14" />
        </g>
        {/* side turrets */}
        <rect x="28" y="150" width="34" height="210" fill="rgba(46, 58, 96, 0.99)" />
        <rect x="198" y="150" width="34" height="210" fill="rgba(46, 58, 96, 0.99)" />
        <path d="M28 150 L45 120 L62 150 Z" fill="rgba(150, 96, 56, 0.95)" />
        <path d="M198 150 L215 120 L232 150 Z" fill="rgba(150, 96, 56, 0.95)" />
        {/* central keep */}
        <rect x="96" y="120" width="68" height="80" fill="rgba(50, 64, 104, 0.99)" />
        {/* the great sword tower rising from the keep */}
        <path d="M120 120 L140 120 L138 40 L122 40 Z" fill="rgba(56, 70, 112, 1)" />
        <path d="M122 40 L138 40 L130 4 Z" fill="rgba(196, 206, 230, 0.95)" />
        {/* crossguard wings on the sword tower */}
        <path d="M108 56 L122 50 L122 62 L100 66 Z" fill="rgba(150, 96, 56, 0.95)" />
        <path d="M152 56 L138 50 L138 62 L160 66 Z" fill="rgba(150, 96, 56, 0.95)" />
        <circle cx="130" cy="10" r="3" className="ff9-tower-light" fill="#ffe2a0" />
        {/* gate + arched windows */}
        <path d="M118 360 L118 300 Q130 286 142 300 L142 360 Z" fill="rgba(20, 28, 50, 0.99)" />
        <g fill="#ffce72">
          <rect x="60" y="240" width="10" height="22" rx="5" />
          <rect x="190" y="240" width="10" height="22" rx="5" />
          <rect x="110" y="150" width="8" height="18" rx="4" />
          <rect x="142" y="150" width="8" height="18" rx="4" />
        </g>
      </svg>

      {/* Foreground rampart with hanging lanterns */}
      <svg className="ff9-foreground" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0 120 L0 50 L1200 50 L1200 120 Z" fill="rgba(16, 22, 42, 1)" />
        <g fill="rgba(16, 22, 42, 1)">
          <rect x="40" y="36" width="24" height="16" />
          <rect x="120" y="36" width="24" height="16" />
          <rect x="200" y="36" width="24" height="16" />
        </g>
      </svg>
      <div className="ff9-lanterns" />
    </div>
  );
}
