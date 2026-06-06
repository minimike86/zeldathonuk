import './misc.css';

/**
 * Pokémon (Kalos) — Lumiose City at blue hour with Prism Tower glowing at its
 * heart. An elegant blue/gold palette, radiating boulevards, lit windows and a
 * sweeping searchlight beam from the tower's beacon. `.pkl-` namespace.
 */
export function PokemonKalosScene() {
  return (
    <div className="pkl-scene" aria-hidden="true">
      {/* City light bloom */}
      <div className="pkl-bloom" />

      {/* Far city skyline silhouette */}
      <svg className="pkl-skyline" viewBox="0 0 1200 220" preserveAspectRatio="none">
        <g fill="#16264e">
          <rect x="40" y="120" width="80" height="100" />
          <rect x="150" y="90" width="70" height="130" />
          <rect x="250" y="130" width="90" height="90" />
          <rect x="900" y="100" width="80" height="120" />
          <rect x="1010" y="130" width="70" height="90" />
          <rect x="1100" y="90" width="80" height="130" />
        </g>
        {/* scattered lit windows */}
        <g fill="#f4d35e" opacity="0.8">
          <rect x="60" y="140" width="8" height="10" />
          <rect x="90" y="160" width="8" height="10" />
          <rect x="170" y="110" width="8" height="10" />
          <rect x="200" y="150" width="8" height="10" />
          <rect x="920" y="120" width="8" height="10" />
          <rect x="1120" y="110" width="8" height="10" />
        </g>
      </svg>

      {/* Sweeping searchlight beam from the beacon */}
      <div className="pkl-beam" />

      {/* Prism Tower — elegant central spire */}
      <svg className="pkl-tower" viewBox="0 0 200 380">
        {/* lattice body, tapering */}
        <path d="M70 360 L130 360 L114 120 L86 120 Z" fill="#1d3666" stroke="#2c4f8f" strokeWidth="2" />
        {/* cross bracing */}
        <g stroke="#3a64ad" strokeWidth="2">
          <line x1="86" y1="120" x2="130" y2="200" />
          <line x1="114" y1="120" x2="70" y2="200" />
          <line x1="78" y1="240" x2="122" y2="320" />
          <line x1="122" y1="240" x2="78" y2="320" />
        </g>
        {/* glowing window bands */}
        <g fill="#7fc4ff" opacity="0.85">
          <rect x="88" y="150" width="24" height="6" rx="2" />
          <rect x="84" y="210" width="32" height="6" rx="2" />
          <rect x="80" y="290" width="40" height="6" rx="2" />
        </g>
        {/* upper spire */}
        <path d="M88 120 L100 30 L112 120 Z" fill="#274a86" stroke="#3a64ad" strokeWidth="2" />
        {/* golden beacon */}
        <circle className="pkl-beacon" cx="100" cy="30" r="9" fill="#ffe08a" stroke="#f4d35e" strokeWidth="3" />
        <line x1="100" y1="22" x2="100" y2="6" stroke="#f4d35e" strokeWidth="3" />
      </svg>

      {/* Radiating boulevard ground */}
      <svg className="pkl-ground" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 40 L1200 40 L1200 200 Z" fill="#0f1d3c" />
        {/* avenues radiating from tower base */}
        <g stroke="#243d6e" strokeWidth="4">
          <line x1="600" y1="40" x2="100" y2="200" />
          <line x1="600" y1="40" x2="400" y2="200" />
          <line x1="600" y1="40" x2="600" y2="200" />
          <line x1="600" y1="40" x2="800" y2="200" />
          <line x1="600" y1="40" x2="1100" y2="200" />
        </g>
        {/* gold streetlamp glints along the avenues */}
        <g fill="#f4d35e">
          <circle cx="320" cy="120" r="3" />
          <circle cx="480" cy="120" r="3" />
          <circle cx="720" cy="120" r="3" />
          <circle cx="880" cy="120" r="3" />
        </g>
      </svg>
    </div>
  );
}
