import './ff.css';

/**
 * Final Fantasy X — the ruins of Zanarkand at night. Broken towers and arches
 * silhouetted against a blue dusk, glowing pyreflies rising like fireflies,
 * their lights mirrored in the still flooded water of the foreground.
 * `.ff10-` namespace.
 */
export function Ff10Scene() {
  return (
    <div className="ff10-scene" aria-hidden="true">
      {/* Soft moon glow */}
      <div className="ff10-moon" />

      {/* Distant ruined skyline */}
      <svg className="ff10-ruins-far" viewBox="0 0 1200 260" preserveAspectRatio="none">
        <path
          d="M0 260 L0 180 L70 180 L70 120 L110 120 L110 170 L180 170 L180 90 L220 90
             L220 160 L300 160 L300 110 L350 110 L350 150 L460 150 L460 70 L500 70
             L500 150 L600 150 L600 120 L700 120 L700 170 L820 170 L820 100 L860 100
             L860 160 L960 160 L960 130 L1060 130 L1060 170 L1140 170 L1140 110 L1200 110 L1200 260 Z"
          fill="rgba(22, 38, 70, 0.92)"
        />
      </svg>

      {/* The great broken central tower */}
      <svg className="ff10-tower" viewBox="0 0 220 360">
        {/* main shaft, jagged broken top */}
        <path d="M70 360 L70 80 L96 50 L110 70 L124 44 L140 72 L150 80 L150 360 Z"
              fill="rgba(28, 46, 82, 0.98)" />
        {/* inner shading */}
        <path d="M110 70 L110 360 L150 360 L150 80 L140 72 Z" fill="rgba(18, 32, 60, 0.7)" />
        {/* glowing arch openings */}
        <g fill="rgba(90, 170, 230, 0.55)">
          <path d="M84 200 Q96 184 108 200 L108 230 L84 230 Z" />
          <path d="M118 200 Q130 184 142 200 L142 230 L118 230 Z" />
          <path d="M84 280 Q96 264 108 280 L108 310 L84 310 Z" />
          <path d="M118 280 Q130 264 142 280 L142 310 L118 310 Z" />
        </g>
        {/* cracks */}
        <g stroke="rgba(12, 22, 44, 0.9)" strokeWidth="2" fill="none">
          <path d="M82 120 L92 160 L84 210" />
          <path d="M138 100 L130 150 L138 200" />
        </g>
      </svg>

      {/* Flanking broken arches */}
      <svg className="ff10-arches" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <g fill="rgba(24, 40, 74, 0.95)">
          <path d="M120 200 L120 90 Q170 30 220 90 L220 200 L190 200 L190 110 Q170 80 150 110 L150 200 Z" />
          <path d="M940 200 L940 100 Q990 40 1040 100 L1040 200 L1010 200 L1010 118 Q990 90 970 118 L970 200 Z" />
        </g>
      </svg>

      {/* Rising pyreflies */}
      <div className="ff10-pyreflies" />

      {/* Still flooded water with reflections */}
      <svg className="ff10-water" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 0 L1200 0 L1200 200 L0 200 Z" fill="rgba(14, 28, 58, 0.96)" />
        {/* reflection shimmer bands */}
        <g stroke="rgba(90, 170, 230, 0.4)" strokeWidth="3" strokeLinecap="round">
          <path d="M120 50 L260 50" />
          <path d="M420 90 L600 90" />
          <path d="M760 60 L900 60" />
          <path d="M300 140 L520 140" />
          <path d="M700 150 L880 150" />
          <path d="M980 110 L1120 110" />
        </g>
        {/* tower reflection (faint inverted glow) */}
        <path d="M580 0 L640 0 L632 120 L588 120 Z" fill="rgba(40, 80, 130, 0.3)" />
      </svg>

      {/* Drifting light reflections on the surface */}
      <div className="ff10-glints" />
    </div>
  );
}
