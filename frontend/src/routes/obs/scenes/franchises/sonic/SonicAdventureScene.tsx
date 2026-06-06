import './sonic.css';

/**
 * Sonic Adventure — Emerald Coast. A bright Dreamcast-era cyan sky over a
 * sparkling ocean, a wooden boardwalk pier reaching out over the water,
 * leaning palms, and gentle rolling surf foam. Bright cyan / aqua.
 *
 * `.sad-` namespace.
 */
export function SonicAdventureScene() {
  return (
    <div className="sad-scene" aria-hidden="true">
      {/* Soft sun shimmer high in the sky */}
      <div className="sad-sun" />

      {/* Drifting fair-weather clouds */}
      <div className="sad-clouds" />

      {/* Distant headland and sea horizon */}
      <svg className="sad-headland" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 150 Q120 120 280 140 Q360 150 360 200 Z" fill="#2a9b8f" />
        <path d="M1200 200 L1200 140 Q1080 110 920 132 Q840 142 840 200 Z" fill="#2a9b8f" />
      </svg>

      {/* Sparkling ocean */}
      <svg className="sad-sea" viewBox="0 0 1200 260" preserveAspectRatio="none">
        <rect x="0" y="0" width="1200" height="260" fill="#1fb8d8" />
        <rect x="0" y="0" width="1200" height="90" fill="#36c8e0" opacity="0.7" />
        {/* glints */}
        <g className="sad-glints" stroke="#eafcff" strokeWidth="3" strokeLinecap="round" opacity="0.85">
          <path d="M120 60 H170" />
          <path d="M320 96 H380" />
          <path d="M560 70 H600" />
          <path d="M760 110 H820" />
          <path d="M980 80 H1030" />
        </g>
      </svg>

      {/* Rolling surf foam line */}
      <svg className="sad-surf" viewBox="0 0 1200 80" preserveAspectRatio="none">
        <path
          className="sad-surf-wave"
          d="M0 50 Q150 20 300 50 Q450 80 600 50 Q750 20 900 50 Q1050 80 1200 50 L1200 80 L0 80 Z"
          fill="#f4feff"
        />
      </svg>

      {/* Wooden boardwalk pier reaching out over the water */}
      <svg className="sad-pier" viewBox="0 0 400 200">
        {/* deck */}
        <path d="M0 60 L400 30 L400 64 L0 100 Z" fill="#b9803e" />
        <path d="M0 60 L400 30 L400 38 L0 70 Z" fill="#d4a35e" />
        {/* plank lines */}
        <g stroke="#7a5226" strokeWidth="2" opacity="0.7">
          <path d="M60 91 L60 56" />
          <path d="M140 84 L140 50" />
          <path d="M220 76 L220 44" />
          <path d="M300 68 L300 38" />
        </g>
        {/* support posts */}
        <g fill="#8a5e2e">
          <rect x="50" y="96" width="12" height="100" />
          <rect x="190" y="78" width="12" height="120" />
          <rect x="330" y="58" width="12" height="140" />
        </g>
      </svg>

      {/* Leaning beach palm */}
      <svg className="sad-palm" viewBox="0 0 120 200">
        <path d="M54 200 Q44 120 30 60" fill="none" stroke="#8a5e2e" strokeWidth="12" strokeLinecap="round" />
        <g className="sad-fronds" fill="#2fbf7a">
          <ellipse cx="30" cy="50" rx="40" ry="11" transform="rotate(-18 30 50)" />
          <ellipse cx="30" cy="50" rx="40" ry="11" transform="rotate(18 30 50)" />
          <ellipse cx="30" cy="50" rx="38" ry="10" transform="rotate(-52 30 50)" />
          <ellipse cx="30" cy="50" rx="38" ry="10" transform="rotate(52 30 50)" />
        </g>
        <circle cx="30" cy="50" r="6" fill="#1f8e5a" />
      </svg>

      {/* Sandy foreground beach */}
      <svg className="sad-beach" viewBox="0 0 1200 160" preserveAspectRatio="none">
        <path d="M0 160 L0 50 Q300 20 600 40 Q900 60 1200 36 L1200 160 Z" fill="#f0dca4" />
        <path d="M0 160 L0 90 Q300 70 600 84 Q900 98 1200 76 L1200 160 Z" fill="#e2c682" />
      </svg>
    </div>
  );
}
