import './megaman.css';

/**
 * Mega Man ZX — sleek Biometal sci-fi. A clean black-and-teal high-tech
 * interior: a glowing hex-circuit back wall, a floating Biometal core (the
 * Model series gem) pulsing in the centre, vertical data conduits glowing
 * teal, and the slim Megamerged hero silhouette with a teal energy edge.
 * Crisp teal / near-black palette.
 *
 * Namespace: `.mmzx-`
 */
export function MegaManZxScene() {
  return (
    <div className="mmzx-scene" aria-hidden="true">
      {/* Hex-circuit back wall */}
      <svg className="mmzx-circuit" viewBox="0 0 1200 360" preserveAspectRatio="none">
        <rect width="1200" height="360" fill="#06100f" />
        <g stroke="#0d3b38" strokeWidth="2" fill="none">
          <path d="M100 40 L160 20 L220 40 L220 100 L160 120 L100 100 Z" />
          <path d="M400 60 L460 40 L520 60 L520 120 L460 140 L400 120 Z" />
          <path d="M760 30 L820 10 L880 30 L880 90 L820 110 L760 90 Z" />
          <path d="M980 80 L1040 60 L1100 80 L1100 140 L1040 160 L980 140 Z" />
        </g>
        {/* glowing circuit traces */}
        <g className="mmzx-trace" stroke="#1ad6c4" strokeWidth="2.5" fill="none" opacity="0.8">
          <path d="M0 200 L300 200 L340 240 L700 240" />
          <path d="M1200 160 L900 160 L860 120 L500 120" />
          <path d="M0 300 L500 300 L540 260 L1200 260" />
        </g>
        {/* node dots */}
        <g className="mmzx-node" fill="#5fffe6">
          <circle cx="300" cy="200" r="5" />
          <circle cx="700" cy="240" r="5" />
          <circle cx="500" cy="120" r="5" />
          <circle cx="540" cy="260" r="5" />
        </g>
      </svg>

      {/* Vertical glowing data conduits */}
      <svg className="mmzx-conduits" viewBox="0 0 1200 360" preserveAspectRatio="none">
        <g fill="#0a1f1d">
          <rect x="60" y="0" width="40" height="360" />
          <rect x="1100" y="0" width="40" height="360" />
        </g>
        <g className="mmzx-flow" fill="#1ad6c4">
          <rect x="74" y="0" width="12" height="360" />
          <rect x="1114" y="0" width="12" height="360" />
        </g>
      </svg>

      {/* Floating Biometal core in the centre */}
      <svg className="mmzx-biometal" viewBox="0 0 120 120">
        <polygon className="mmzx-core-ring" points="60,8 104,34 104,86 60,112 16,86 16,34" fill="none" stroke="#1ad6c4" strokeWidth="4" opacity="0.8" />
        <polygon points="60,26 88,42 88,78 60,94 32,78 32,42" fill="#0d2e2b" />
        <polygon className="mmzx-core" points="60,40 76,50 76,70 60,80 44,70 44,50" fill="#5fffe6" />
      </svg>

      {/* Slim Megamerged hero silhouette with teal energy edge */}
      <svg className="mmzx-hero" viewBox="0 0 70 110">
        <g fill="#0a1816" stroke="#1ad6c4" strokeWidth="1.5">
          {/* torso */}
          <path d="M26 40 L48 40 L50 78 L24 78 Z" />
          {/* helmet */}
          <path d="M26 18 Q37 8 48 18 L48 36 L26 36 Z" />
          {/* legs */}
          <rect x="26" y="78" width="9" height="28" />
          <rect x="39" y="78" width="9" height="28" />
          {/* arm */}
          <rect x="48" y="42" width="9" height="22" rx="3" />
          <rect x="17" y="42" width="9" height="22" rx="3" />
        </g>
        {/* helmet fin */}
        <path d="M35 8 L40 8 L46 -4 L37 4 L28 -4 Z" fill="#1ad6c4" />
        {/* chest core */}
        <circle className="mmzx-chest" cx="37" cy="56" r="4" fill="#5fffe6" />
        {/* eye visor */}
        <rect x="30" y="24" width="14" height="5" fill="#5fffe6" />
      </svg>
    </div>
  );
}
