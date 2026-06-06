import './ff.css';

/**
 * Final Fantasy VIII — Balamb Garden, the floating academy, hovering over the
 * ocean at dusk. A great domed structure with its central spire and ringed
 * support struts drifts above a calm sea while gulls wheel and the twin-toned
 * blue/teal sky deepens toward night. `.ff8-` namespace.
 */
export function Ff8Scene() {
  return (
    <div className="ff8-scene" aria-hidden="true">
      {/* Soft sun bloom low on the horizon */}
      <div className="ff8-sun" />

      {/* Drifting wispy clouds */}
      <svg className="ff8-clouds" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <g fill="rgba(180, 220, 240, 0.16)">
          <ellipse cx="180" cy="70" rx="160" ry="26" />
          <ellipse cx="520" cy="50" rx="200" ry="30" />
          <ellipse cx="900" cy="80" rx="180" ry="28" />
          <ellipse cx="1120" cy="48" rx="150" ry="24" />
        </g>
      </svg>

      {/* Wheeling gulls */}
      <svg className="ff8-gulls" viewBox="0 0 200 80">
        <g stroke="rgba(220, 240, 255, 0.7)" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M20 30 Q30 22 40 30 Q50 22 60 30" />
          <path d="M90 50 Q98 44 106 50 Q114 44 122 50" />
          <path d="M150 24 Q158 18 166 24 Q174 18 182 24" />
        </g>
      </svg>

      {/* Distant sea horizon */}
      <svg className="ff8-sea" viewBox="0 0 1200 300" preserveAspectRatio="none">
        <path d="M0 80 L1200 80 L1200 300 L0 300 Z" fill="rgba(14, 42, 78, 0.95)" />
        {/* shimmering highlights on the water */}
        <g stroke="rgba(120, 200, 230, 0.5)" strokeWidth="3" strokeLinecap="round">
          <path d="M120 150 L260 150" />
          <path d="M420 190 L600 190" />
          <path d="M760 160 L900 160" />
          <path d="M980 210 L1120 210" />
          <path d="M300 240 L520 240" />
          <path d="M700 250 L880 250" />
        </g>
      </svg>

      {/* Balamb Garden — the floating academy */}
      <svg className="ff8-garden" viewBox="0 0 400 340">
        {/* shadow halo beneath */}
        <ellipse cx="200" cy="300" rx="150" ry="20" fill="rgba(8, 20, 40, 0.5)" />

        {/* outer ring struts splayed beneath the dome */}
        <g fill="rgba(36, 78, 120, 0.96)">
          <path d="M120 180 L60 250 L96 256 L150 200 Z" />
          <path d="M280 180 L340 250 L304 256 L250 200 Z" />
          <path d="M200 210 L200 290 L182 286 L182 220 Z" />
          <path d="M200 210 L200 290 L218 286 L218 220 Z" />
        </g>

        {/* main domed body */}
        <path
          d="M70 190 Q70 110 200 96 Q330 110 330 190 L330 210 L70 210 Z"
          fill="rgba(60, 116, 168, 0.98)"
        />
        {/* dome highlight band */}
        <path
          d="M90 150 Q150 118 200 116 Q250 118 310 150 Q250 138 200 138 Q150 138 90 150 Z"
          fill="rgba(150, 210, 235, 0.5)"
        />
        {/* lower hull */}
        <path d="M70 200 L330 200 L300 250 L100 250 Z" fill="rgba(40, 84, 124, 0.98)" />

        {/* ring of lit windows around the rim */}
        <g fill="#ffd98a">
          <rect x="96" y="206" width="8" height="10" rx="1" />
          <rect x="130" y="208" width="8" height="10" rx="1" />
          <rect x="164" y="210" width="8" height="10" rx="1" />
          <rect x="198" y="210" width="8" height="10" rx="1" />
          <rect x="232" y="210" width="8" height="10" rx="1" />
          <rect x="266" y="208" width="8" height="10" rx="1" />
          <rect x="296" y="206" width="8" height="10" rx="1" />
        </g>

        {/* central spire / control tower */}
        <path d="M186 100 L214 100 L208 44 L192 44 Z" fill="rgba(48, 96, 140, 0.99)" />
        <path d="M192 44 L208 44 L200 14 Z" fill="rgba(70, 130, 175, 1)" />
        <circle cx="200" cy="20" r="5" className="ff8-spire-light" fill="#8fe4ff" />
        {/* twin side antennae */}
        <rect x="150" y="84" width="4" height="26" fill="rgba(48, 96, 140, 0.99)" />
        <rect x="246" y="84" width="4" height="26" fill="rgba(48, 96, 140, 0.99)" />
        <circle cx="152" cy="82" r="3" fill="#8fe4ff" />
        <circle cx="248" cy="82" r="3" fill="#8fe4ff" />
      </svg>

      {/* Drifting bloom motes */}
      <div className="ff8-motes" />
    </div>
  );
}
