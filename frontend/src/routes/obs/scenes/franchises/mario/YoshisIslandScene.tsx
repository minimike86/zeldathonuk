import './mario.css';

/**
 * Super Mario World 2: Yoshi's Island — the hand-drawn crayon storybook look.
 * Soft pastel hills sketched with crayon outlines, scribbled clouds, a paper
 * sun with wobbly rays, and a green Yoshi silhouette standing on the nearest
 * hill. Everything has a wax-crayon texture feel. `.yi-` namespace.
 */
export function YoshisIslandScene() {
  return (
    <div className="yi-scene" aria-hidden="true">
      {/* Crayon paper sun with wobbly rays */}
      <svg className="yi-sun" viewBox="0 0 120 120">
        <g className="yi-sun-rays" stroke="#f6d24a" strokeWidth="5" strokeLinecap="round">
          <path d="M60 6 L60 24" />
          <path d="M60 96 L60 114" />
          <path d="M6 60 L24 60" />
          <path d="M96 60 L114 60" />
          <path d="M22 22 L34 34" />
          <path d="M86 86 L98 98" />
          <path d="M98 22 L86 34" />
          <path d="M34 86 L22 98" />
        </g>
        <circle cx="60" cy="60" r="28" fill="#fbe06a" stroke="#e8b830" strokeWidth="3" />
        <g fill="#d89a20"><circle cx="52" cy="56" r="3" /><circle cx="68" cy="56" r="3" /></g>
        <path d="M52 66 Q60 72 68 66" stroke="#d89a20" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>

      {/* Scribbled crayon clouds */}
      <svg className="yi-cloud yi-cloud-a" viewBox="0 0 120 60">
        <path
          d="M30 44 Q18 44 18 32 Q18 22 30 24 Q32 12 48 16 Q56 6 70 14 Q86 10 88 26 Q102 26 100 40 Q100 48 88 46 Z"
          fill="#ffffff" stroke="#bcd6ee" strokeWidth="2.5"
        />
      </svg>
      <svg className="yi-cloud yi-cloud-b" viewBox="0 0 120 60">
        <path
          d="M30 44 Q18 44 18 32 Q18 22 30 24 Q32 12 48 16 Q56 6 70 14 Q86 10 88 26 Q102 26 100 40 Q100 48 88 46 Z"
          fill="#ffffff" stroke="#bcd6ee" strokeWidth="2.5"
        />
      </svg>

      {/* Layered pastel crayon hills */}
      <svg className="yi-hills yi-hills-far" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <path
          d="M0 240 L0 130 Q200 60 420 120 Q640 180 860 110 Q1040 56 1200 120 L1200 240 Z"
          fill="#bfe89a" stroke="#8fce6a" strokeWidth="4"
        />
      </svg>
      <svg className="yi-hills yi-hills-mid" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <path
          d="M0 240 L0 170 Q240 110 480 160 Q720 210 960 150 Q1100 116 1200 160 L1200 240 Z"
          fill="#9bda74" stroke="#6fb84a" strokeWidth="4"
        />
        {/* crayon flower dots */}
        <g fill="#ff8fbf"><circle cx="240" cy="184" r="5" /><circle cx="640" cy="196" r="5" /><circle cx="980" cy="178" r="5" /></g>
      </svg>

      {/* Near hill the Yoshi stands on */}
      <svg className="yi-hills yi-hills-near" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 200 L0 120 Q300 60 620 110 Q900 154 1200 100 L1200 200 Z"
          fill="#7bc94e" stroke="#52a234" strokeWidth="4"
        />
      </svg>

      {/* Yoshi silhouette standing on the near hill */}
      <svg className="yi-yoshi" viewBox="0 0 100 120">
        {/* tail */}
        <path d="M8 96 Q-2 96 4 80 Q16 84 22 92 Z" fill="#3fae34" />
        {/* body */}
        <path d="M18 92 Q14 56 40 52 Q44 30 64 30 Q60 56 70 64 Q86 70 80 92 Q74 100 56 98 Q40 102 18 92 Z" fill="#5fd64a" stroke="#3a9e2c" strokeWidth="2.5" />
        {/* belly */}
        <ellipse cx="44" cy="86" rx="18" ry="12" fill="#f4ecd6" />
        {/* head */}
        <path d="M58 22 Q86 18 88 40 Q90 56 70 58 Q56 56 56 40 Q54 26 58 22 Z" fill="#5fd64a" stroke="#3a9e2c" strokeWidth="2.5" />
        {/* snout */}
        <ellipse cx="86" cy="46" rx="10" ry="8" fill="#5fd64a" stroke="#3a9e2c" strokeWidth="2" />
        <circle cx="90" cy="44" r="1.6" fill="#1c4a14" />
        {/* eye */}
        <ellipse cx="70" cy="34" rx="6" ry="9" fill="#ffffff" stroke="#3a9e2c" strokeWidth="1.5" />
        <circle cx="70" cy="36" r="3" fill="#1c1c2a" />
        {/* red sail crest */}
        <path d="M58 24 Q64 12 72 22" fill="#e2403a" stroke="#a82820" strokeWidth="1.5" />
        {/* legs + boots */}
        <rect x="34" y="96" width="9" height="18" rx="3" fill="#5fd64a" />
        <rect x="56" y="96" width="9" height="18" rx="3" fill="#5fd64a" />
        <ellipse cx="34" cy="116" rx="10" ry="5" fill="#f47a2a" />
        <ellipse cx="62" cy="116" rx="10" ry="5" fill="#f47a2a" />
      </svg>
    </div>
  );
}
