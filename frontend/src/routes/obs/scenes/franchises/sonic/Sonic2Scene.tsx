import './sonic.css';

/**
 * Sonic the Hedgehog 2 — Chemical Plant Zone. A magenta dusk sky over a
 * lattice of blue/purple industrial pipes, glowing pink chemical reservoirs,
 * and the iconic spiralling tube that loops through the structure.
 *
 * `.sn2-` namespace.
 */
export function Sonic2Scene() {
  return (
    <div className="sn2-scene" aria-hidden="true">
      {/* Drifting toxic haze across the magenta sky */}
      <div className="sn2-haze" />

      {/* Distant plant towers silhouetted against the sky */}
      <svg className="sn2-skyline" viewBox="0 0 1200 300" preserveAspectRatio="none">
        <g fill="#3a1f6e">
          <rect x="60" y="120" width="60" height="180" />
          <rect x="180" y="80" width="48" height="220" />
          <rect x="900" y="100" width="70" height="200" />
          <rect x="1040" y="60" width="50" height="240" />
        </g>
        <g fill="#2a1550">
          <rect x="360" y="150" width="90" height="150" />
          <rect x="640" y="130" width="80" height="170" />
        </g>
        {/* blinking beacons */}
        <g className="sn2-beacon" fill="#ff4fb0">
          <circle cx="90" cy="120" r="5" />
          <circle cx="204" cy="80" r="5" />
          <circle cx="935" cy="100" r="5" />
          <circle cx="1065" cy="60" r="5" />
        </g>
      </svg>

      {/* Glowing chemical reservoir tanks */}
      <svg className="sn2-tanks" viewBox="0 0 1200 220" preserveAspectRatio="none">
        <g fill="#241060">
          <rect x="120" y="60" width="200" height="160" rx="14" />
          <rect x="780" y="40" width="240" height="180" rx="14" />
        </g>
        {/* glowing pink fluid surface */}
        <g fill="#ff4fb0" opacity="0.85">
          <rect className="sn2-fluid" x="132" y="80" width="176" height="20" rx="6" />
          <rect className="sn2-fluid sn2-fluid-2" x="792" y="64" width="216" height="22" rx="6" />
        </g>
        <g fill="#ff9fd6" opacity="0.5">
          <rect x="132" y="80" width="176" height="6" rx="3" />
          <rect x="792" y="64" width="216" height="6" rx="3" />
        </g>
      </svg>

      {/* Pipe lattice — blue/purple interlocking tubes */}
      <svg className="sn2-pipes" viewBox="0 0 1200 360">
        <g fill="none" strokeLinecap="round">
          {/* outer casing */}
          <g stroke="#1f56c4" strokeWidth="26">
            <path d="M-20 120 H400 Q470 120 470 200 V380" />
            <path d="M1220 90 H760 Q700 90 700 170 Q700 250 620 250 H300" />
            <path d="M120 380 V260 Q120 200 200 200 H520" />
          </g>
          {/* inner highlight */}
          <g stroke="#5b9bff" strokeWidth="8">
            <path d="M-20 120 H400 Q470 120 470 200 V380" />
            <path d="M1220 90 H760 Q700 90 700 170 Q700 250 620 250 H300" />
            <path d="M120 380 V260 Q120 200 200 200 H520" />
          </g>
        </g>
        {/* joint flanges */}
        <g fill="#7a3fd0">
          <circle cx="470" cy="200" r="20" />
          <circle cx="700" cy="170" r="20" />
          <circle cx="200" cy="200" r="18" />
        </g>
        <g fill="#b07cff">
          <circle cx="470" cy="200" r="9" />
          <circle cx="700" cy="170" r="9" />
          <circle cx="200" cy="200" r="8" />
        </g>
      </svg>

      {/* Spiralling transit tube with Sonic whizzing through it */}
      <svg className="sn2-spiral" viewBox="0 0 220 220">
        <path
          d="M110 20 A90 90 0 1 1 109 20 M110 60 A50 50 0 1 0 111 60"
          fill="none"
          stroke="#1f56c4"
          strokeWidth="16"
          opacity="0.85"
        />
        <g className="sn2-runner">
          <circle cx="0" cy="0" r="11" fill="#1a6fd6" />
          <circle cx="5" cy="-2" r="7" fill="#f0c089" />
          <circle cx="7" cy="-3" r="1.6" fill="#0a1a2c" />
        </g>
      </svg>

      {/* Grid-tech foreground floor */}
      <svg className="sn2-floor" viewBox="0 0 1200 160" preserveAspectRatio="none">
        <rect x="0" y="40" width="1200" height="120" fill="#150a3a" />
        <g stroke="#3a1f8e" strokeWidth="2" opacity="0.8">
          <path d="M0 60 H1200" />
          <path d="M0 90 H1200" />
          <path d="M0 124 H1200" />
        </g>
        <path d="M0 44 H1200" stroke="#ff4fb0" strokeWidth="3" opacity="0.7" />
      </svg>
    </div>
  );
}
