import './mario.css';

/**
 * Super Mario World — Dinosaur Land under a bright blue sky. Rounded SNES hills
 * with the signature face-decorated bushes, a couple of warp pipes, a Yoshi
 * silhouette on the ground, and a giant Banzai Bill cruising in from the right.
 * `.smw-` namespace.
 */
export function SuperMarioWorldScene() {
  return (
    <div className="smw-scene" aria-hidden="true">
      {/* SMW round clouds with little faces */}
      <svg className="smw-cloud smw-cloud-a" viewBox="0 0 120 60">
        <g fill="#ffffff">
          <ellipse cx="38" cy="38" rx="24" ry="18" />
          <ellipse cx="64" cy="30" rx="26" ry="20" />
          <ellipse cx="88" cy="38" rx="22" ry="16" />
        </g>
        <g fill="#1c1c2a"><circle cx="56" cy="30" r="2.4" /><circle cx="70" cy="30" r="2.4" /></g>
      </svg>
      <svg className="smw-cloud smw-cloud-b" viewBox="0 0 120 60">
        <g fill="#ffffff">
          <ellipse cx="38" cy="38" rx="24" ry="18" />
          <ellipse cx="64" cy="30" rx="26" ry="20" />
          <ellipse cx="88" cy="38" rx="22" ry="16" />
        </g>
      </svg>

      {/* Banzai Bill cruising in from the right */}
      <svg className="smw-banzai" viewBox="0 0 200 120">
        <ellipse cx="100" cy="60" rx="92" ry="50" fill="#2a2a36" />
        <path d="M192 60 Q176 30 156 30 L156 90 Q176 90 192 60 Z" fill="#1a1a24" />
        {/* eyes */}
        <g fill="#ffffff"><ellipse cx="120" cy="48" rx="14" ry="16" /><ellipse cx="120" cy="48" rx="14" ry="16" /></g>
        <circle cx="124" cy="50" r="6" fill="#1c1c2a" />
        {/* angry brow + grin */}
        <path d="M104 32 L134 40" stroke="#0a0a12" strokeWidth="4" strokeLinecap="round" />
        <path d="M86 78 Q108 92 132 78" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" />
        {/* arms */}
        <rect x="60" y="26" width="14" height="30" rx="6" fill="#1a1a24" />
        <rect x="60" y="64" width="14" height="30" rx="6" fill="#1a1a24" />
        {/* tail flame */}
        <path d="M8 60 L-18 44 L-6 60 L-18 76 Z" fill="#ffae2a" />
      </svg>

      {/* Distant rounded hills */}
      <svg className="smw-hills smw-hills-far" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 150 Q160 90 340 140 Q520 188 700 130 Q880 78 1060 134 Q1140 156 1200 138 L1200 200 Z" fill="#7fd06a" />
      </svg>

      {/* Decorated SMW bushes / hills with eyes */}
      <svg className="smw-ground" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 110 Q200 70 440 100 Q700 132 940 96 Q1080 78 1200 104 L1200 200 Z" fill="#4caf50" />
      </svg>
      <svg className="smw-bush smw-bush-a" viewBox="0 0 160 80">
        <path d="M10 78 Q10 40 40 40 Q44 18 70 24 Q86 12 104 26 Q132 26 134 52 Q150 54 150 78 Z" fill="#3a9e44" />
        <g fill="#1c4a22"><ellipse cx="60" cy="44" rx="4" ry="6" /><ellipse cx="84" cy="44" rx="4" ry="6" /></g>
      </svg>
      <svg className="smw-bush smw-bush-b" viewBox="0 0 160 80">
        <path d="M10 78 Q10 40 40 40 Q44 18 70 24 Q86 12 104 26 Q132 26 134 52 Q150 54 150 78 Z" fill="#3a9e44" />
        <g fill="#1c4a22"><ellipse cx="60" cy="44" rx="4" ry="6" /><ellipse cx="84" cy="44" rx="4" ry="6" /></g>
      </svg>

      {/* Two warp pipes */}
      <svg className="smw-pipe smw-pipe-a" viewBox="0 0 80 120">
        <rect x="18" y="34" width="44" height="86" fill="#36c34a" stroke="#1c6e26" strokeWidth="3" />
        <rect x="10" y="14" width="60" height="24" rx="4" fill="#4cd95e" stroke="#1c6e26" strokeWidth="3" />
        <rect x="26" y="40" width="6" height="80" fill="#2a9d3a" />
      </svg>

      {/* Yoshi silhouette by the pipe */}
      <svg className="smw-yoshi" viewBox="0 0 90 100">
        <path d="M6 84 Q-2 84 4 70 Q14 74 18 80 Z" fill="#3fae34" />
        <path d="M14 80 Q12 50 36 46 Q40 26 58 26 Q54 50 64 56 Q80 62 74 82 Q66 90 50 88 Q34 92 14 80 Z" fill="#5fd64a" />
        <path d="M52 18 Q78 16 80 36 Q82 50 64 52 Q52 50 52 36 Z" fill="#5fd64a" />
        <ellipse cx="78" cy="40" rx="9" ry="7" fill="#5fd64a" />
        <ellipse cx="64" cy="30" rx="5" ry="8" fill="#ffffff" /><circle cx="64" cy="32" r="3" fill="#1c1c2a" />
        <ellipse cx="40" cy="78" rx="14" ry="9" fill="#f4ecd6" />
        <ellipse cx="32" cy="98" rx="9" ry="4" fill="#f47a2a" />
        <ellipse cx="56" cy="98" rx="9" ry="4" fill="#f47a2a" />
      </svg>
    </div>
  );
}
