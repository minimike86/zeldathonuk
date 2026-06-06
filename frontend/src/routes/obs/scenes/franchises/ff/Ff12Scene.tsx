import './ff.css';

/**
 * Final Fantasy XII — the desert kingdom of Rabanastre under an amber sky.
 * Sandstone domes and minarets bake in warm light, airships cruise the haze
 * above the city walls, and heat shimmer with drifting sand fills the air.
 * `.ff12-` namespace.
 */
export function Ff12Scene() {
  return (
    <div className="ff12-scene" aria-hidden="true">
      {/* Low desert sun */}
      <div className="ff12-sun" />

      {/* Heat-haze band over the rooftops */}
      <div className="ff12-haze" />

      {/* Cruising airships in the amber sky */}
      <svg className="ff12-airship ff12-airship-lead" viewBox="0 0 260 110">
        <path d="M20 60 Q130 20 240 60 Q130 86 20 60 Z" fill="rgba(96, 70, 40, 0.96)" />
        <path d="M70 60 Q130 44 190 60 Q130 70 70 60 Z" fill="rgba(150, 110, 60, 0.95)" />
        {/* sail rigging */}
        <path d="M130 44 L130 14 L180 30 Z" fill="rgba(210, 170, 110, 0.9)" />
        {/* engine glow */}
        <circle cx="36" cy="60" r="6" className="ff12-thruster" fill="#ffd98a" />
      </svg>
      <svg className="ff12-airship ff12-airship-2" viewBox="0 0 200 90">
        <path d="M16 48 Q100 18 184 48 Q100 70 16 48 Z" fill="rgba(80, 58, 34, 0.95)" />
        <circle cx="28" cy="48" r="5" className="ff12-thruster" fill="#ffce72" />
      </svg>

      {/* Distant city wall and towers */}
      <svg className="ff12-wall" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 110 L1200 110 L1200 200 Z" fill="rgba(150, 104, 56, 0.9)" />
        {/* crenellations */}
        <g fill="rgba(150, 104, 56, 0.9)">
          <rect x="40" y="92" width="22" height="20" />
          <rect x="120" y="92" width="22" height="20" />
          <rect x="200" y="92" width="22" height="20" />
          <rect x="980" y="92" width="22" height="20" />
          <rect x="1060" y="92" width="22" height="20" />
          <rect x="1140" y="92" width="22" height="20" />
        </g>
      </svg>

      {/* Rabanastre skyline — domes and minarets */}
      <svg className="ff12-city" viewBox="0 0 1200 300" preserveAspectRatio="none">
        <g fill="rgba(176, 122, 64, 0.97)">
          {/* blocky sandstone buildings */}
          <rect x="60" y="160" width="120" height="140" />
          <rect x="220" y="120" width="140" height="180" />
          <rect x="700" y="150" width="130" height="150" />
          <rect x="900" y="110" width="150" height="190" />
        </g>
        {/* central great dome */}
        <g fill="rgba(196, 142, 78, 0.98)">
          <path d="M440 300 L440 160 Q600 60 760 160 L760 300 Z" />
          <ellipse cx="600" cy="160" rx="160" ry="70" />
        </g>
        {/* minaret spires */}
        <g fill="rgba(160, 110, 58, 0.98)">
          <rect x="470" y="80" width="20" height="120" />
          <path d="M462 80 L498 80 L480 50 Z" />
          <rect x="712" y="90" width="20" height="110" />
          <path d="M704 90 L740 90 L722 60 Z" />
        </g>
        {/* warm lit windows */}
        <g fill="rgba(255, 220, 150, 0.7)">
          <rect x="90" y="190" width="8" height="12" />
          <rect x="260" y="160" width="8" height="12" />
          <rect x="740" y="180" width="8" height="12" />
          <rect x="950" y="150" width="8" height="12" />
        </g>
      </svg>

      {/* Foreground dune line */}
      <svg className="ff12-dunes" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0 120 L0 60 Q300 30 600 56 Q900 80 1200 50 L1200 120 Z" fill="rgba(110, 74, 38, 1)" />
      </svg>

      {/* Drifting sand particles */}
      <div className="ff12-sand" />
    </div>
  );
}
