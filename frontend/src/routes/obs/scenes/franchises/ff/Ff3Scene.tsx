import './ff.css';

/**
 * Final Fantasy III (NES) — a floating continent drifting through a star-strewn
 * sky, with the great Crystal Tower rising from its centre toward the heavens.
 * Blocky 8-bit silhouettes, deep indigo night, twinkling stars. `.ff3-`
 * namespace.
 */
export function Ff3Scene() {
  return (
    <div className="ff3-scene" aria-hidden="true">
      {/* Star field */}
      <div className="ff3-stars" />

      {/* Aura glow behind the tower */}
      <div className="ff3-aura" />

      {/* Distant smaller floating islets */}
      <svg className="ff3-islets" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <g fill="rgba(40, 56, 100, 0.85)">
          <path d="M120 60 Q180 40 240 60 L220 100 L150 100 Z" />
          <path d="M880 80 Q940 58 1000 80 L980 120 L900 120 Z" />
        </g>
      </svg>

      {/* The Crystal Tower rising from the floating continent */}
      <svg className="ff3-tower" viewBox="0 0 160 360">
        {/* tiered tower body, blocky NES style */}
        <g fill="rgba(150, 170, 230, 0.95)">
          <rect x="56" y="60" width="48" height="120" />
          <rect x="48" y="180" width="64" height="80" />
          <rect x="40" y="260" width="80" height="70" />
        </g>
        {/* tower top crystal */}
        <path d="M80 12 L100 60 L60 60 Z" className="ff3-tower-crystal" fill="#cfe0ff" />
        {/* glowing window slits */}
        <g fill="rgba(200, 230, 255, 0.85)" className="ff3-tower-lights">
          <rect x="74" y="90" width="12" height="20" />
          <rect x="72" y="200" width="16" height="22" />
          <rect x="70" y="285" width="20" height="24" />
        </g>
      </svg>

      {/* The floating continent — a great rock slab hanging in the void */}
      <svg className="ff3-continent" viewBox="0 0 800 280" preserveAspectRatio="none">
        {/* grassy top surface */}
        <path d="M40 120 Q400 70 760 120 L740 160 L60 160 Z" fill="rgba(70, 120, 80, 0.97)" />
        {/* rock underside, tapering to a point */}
        <path d="M60 160 L740 160 Q640 240 400 270 Q160 240 60 160 Z" fill="rgba(50, 40, 70, 0.98)" />
        {/* dangling rubble chunks */}
        <g fill="rgba(50, 40, 70, 0.98)">
          <path d="M260 200 L300 200 L280 250 Z" />
          <path d="M520 210 L560 210 L540 260 Z" />
        </g>
      </svg>

      {/* Floating motes drifting up from the continent */}
      <div className="ff3-motes" />
    </div>
  );
}
