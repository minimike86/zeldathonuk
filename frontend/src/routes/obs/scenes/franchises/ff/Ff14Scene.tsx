import './ff.css';

/**
 * Final Fantasy XIV — the realm of Eorzea under a heroic blue sky. A towering
 * aetheryte crystal hovers and rotates above a stone plaza, its facets pulsing
 * with aetherial light, while soft clouds drift past distant city spires and
 * motes of aether rise from the ground. `.ff14-` namespace.
 */
export function Ff14Scene() {
  return (
    <div className="ff14-scene" aria-hidden="true">
      {/* Warm heroic sun bloom high in the sky */}
      <div className="ff14-sun" />

      {/* Drifting clouds */}
      <svg className="ff14-clouds" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <g fill="rgba(255, 255, 255, 0.5)">
          <ellipse cx="180" cy="80" rx="120" ry="34" />
          <ellipse cx="300" cy="100" rx="90" ry="28" />
          <ellipse cx="640" cy="60" rx="140" ry="38" />
          <ellipse cx="780" cy="90" rx="100" ry="30" />
          <ellipse cx="1040" cy="80" rx="130" ry="34" />
        </g>
      </svg>

      {/* Distant city spires of a great Eorzean capital */}
      <svg className="ff14-spires" viewBox="0 0 1200 260" preserveAspectRatio="none">
        <g fill="rgba(60, 96, 150, 0.85)">
          <path d="M120 260 L120 120 L140 90 L160 120 L160 260 Z" />
          <path d="M260 260 L260 150 L280 130 L300 150 L300 260 Z" />
          <path d="M900 260 L900 140 L922 110 L944 140 L944 260 Z" />
          <path d="M1040 260 L1040 160 L1058 138 L1076 160 L1076 260 Z" />
        </g>
        {/* faint banners on the tallest spires */}
        <g fill="rgba(120, 180, 240, 0.6)">
          <path d="M140 90 L140 70 L160 76 L140 82 Z" />
          <path d="M922 110 L922 88 L944 94 L922 100 Z" />
        </g>
      </svg>

      {/* Stone plaza ground */}
      <svg className="ff14-plaza" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 70 Q600 30 1200 70 L1200 200 Z" fill="rgba(40, 64, 110, 0.96)" />
        {/* radial paving lines toward the aetheryte */}
        <g stroke="rgba(90, 140, 210, 0.4)" strokeWidth="3">
          <path d="M600 60 L120 200" />
          <path d="M600 60 L380 200" />
          <path d="M600 60 L600 200" />
          <path d="M600 60 L820 200" />
          <path d="M600 60 L1080 200" />
        </g>
      </svg>

      {/* The aetheryte crystal — hovering, rotating shard of blue light */}
      <svg className="ff14-aetheryte" viewBox="0 0 200 320">
        {/* pedestal base */}
        <path d="M70 320 L130 320 L116 280 L84 280 Z" fill="rgba(30, 50, 92, 0.98)" />
        <ellipse cx="100" cy="280" rx="34" ry="9" fill="rgba(44, 72, 124, 0.98)" />
        {/* outer faceted crystal */}
        <g className="ff14-crystal-spin">
          <path d="M100 30 L142 150 L100 260 L58 150 Z" fill="rgba(120, 190, 255, 0.55)" />
          <path d="M100 30 L142 150 L100 150 Z" fill="rgba(170, 220, 255, 0.7)" />
          <path d="M100 30 L58 150 L100 150 Z" fill="rgba(90, 160, 240, 0.7)" />
          <path d="M100 260 L142 150 L100 150 Z" fill="rgba(80, 150, 230, 0.6)" />
          <path d="M100 260 L58 150 L100 150 Z" fill="rgba(60, 130, 220, 0.65)" />
        </g>
        {/* glowing core */}
        <ellipse cx="100" cy="150" rx="14" ry="40" className="ff14-core" fill="#cfe8ff" />
      </svg>

      {/* Rising aether motes */}
      <div className="ff14-aether" />
    </div>
  );
}
