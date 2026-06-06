import './misc.css';

/**
 * Kirby — Dream Land. A pastel pink/blue sky over rolling green hills, with
 * Whispy Woods silhouetted on the right, a Warp Star streaking across the sky,
 * and fluffy clouds drifting by. `.kby-` namespace.
 */
export function KirbyScene() {
  return (
    <div className="kby-scene" aria-hidden="true">
      {/* Soft sun bloom behind the clouds */}
      <div className="kby-sun" />

      {/* Fluffy clouds drifting */}
      <svg className="kby-cloud kby-cloud-a" viewBox="0 0 160 70">
        <g fill="#ffffff">
          <ellipse cx="50" cy="44" rx="40" ry="22" />
          <ellipse cx="90" cy="38" rx="36" ry="26" />
          <ellipse cx="120" cy="46" rx="32" ry="20" />
          <ellipse cx="78" cy="52" rx="46" ry="18" />
        </g>
        <g fill="#fde3ef" opacity="0.7">
          <ellipse cx="60" cy="58" rx="44" ry="10" />
        </g>
      </svg>
      <svg className="kby-cloud kby-cloud-b" viewBox="0 0 160 70">
        <g fill="#ffffff">
          <ellipse cx="50" cy="44" rx="34" ry="20" />
          <ellipse cx="88" cy="40" rx="32" ry="22" />
          <ellipse cx="116" cy="48" rx="28" ry="18" />
        </g>
      </svg>
      <svg className="kby-cloud kby-cloud-c" viewBox="0 0 160 70">
        <g fill="#ffffff">
          <ellipse cx="58" cy="42" rx="38" ry="22" />
          <ellipse cx="98" cy="46" rx="34" ry="20" />
        </g>
      </svg>

      {/* Warp Star streaking across the sky */}
      <svg className="kby-warpstar" viewBox="0 0 60 60">
        <g className="kby-warpstar-body">
          <path
            d="M30 2 L37 22 L58 22 L41 35 L48 56 L30 43 L12 56 L19 35 L2 22 L23 22 Z"
            fill="#ffd94a"
            stroke="#ffae00"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M30 10 L34 22 L24 30 Z" fill="#fff3b0" opacity="0.9" />
        </g>
      </svg>

      {/* Whispy Woods — big tree silhouette on the right with a kindly face */}
      <svg className="kby-whispy" viewBox="0 0 240 320">
        {/* canopy */}
        <g fill="#3f9b46">
          <ellipse cx="120" cy="92" rx="118" ry="78" />
          <ellipse cx="56" cy="120" rx="56" ry="46" />
          <ellipse cx="190" cy="116" rx="58" ry="48" />
          <ellipse cx="120" cy="56" rx="78" ry="44" />
        </g>
        <g fill="#5bbf60" opacity="0.7">
          <ellipse cx="96" cy="52" rx="52" ry="18" />
          <ellipse cx="172" cy="74" rx="40" ry="14" />
        </g>
        {/* trunk */}
        <path
          d="M82 150 Q72 220 64 300 L176 300 Q168 220 158 150 Z"
          fill="#b5793a"
        />
        <path d="M120 150 Q132 220 150 300 L176 300 Q168 220 158 150 Z" fill="#8a572a" opacity="0.6" />
        {/* face — sleepy eyes + big nose + soft smile */}
        <ellipse cx="100" cy="208" rx="13" ry="16" fill="#3a2412" />
        <ellipse cx="140" cy="208" rx="13" ry="16" fill="#3a2412" />
        <circle cx="100" cy="204" r="4" fill="#ffffff" />
        <circle cx="140" cy="204" r="4" fill="#ffffff" />
        <ellipse cx="120" cy="236" rx="14" ry="11" fill="#3a2412" />
        <path d="M96 262 Q120 282 144 262" stroke="#3a2412" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* rosy cheeks */}
        <circle cx="80" cy="240" r="9" fill="#ff9bb0" opacity="0.5" />
        <circle cx="160" cy="240" r="9" fill="#ff9bb0" opacity="0.5" />
      </svg>

      {/* Rolling green hills */}
      <svg className="kby-hills kby-hills-far" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 200 L0 120 Q200 70 420 110 Q640 150 860 100 Q1040 60 1200 110 L1200 200 Z"
          fill="#7ed07f"
        />
      </svg>
      <svg className="kby-hills kby-hills-near" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 200 L0 140 Q240 90 500 130 Q760 170 1000 120 Q1120 95 1200 130 L1200 200 Z"
          fill="#4fb158"
        />
        {/* little flowers */}
        <g>
          <circle cx="180" cy="150" r="4" fill="#ffe14a" />
          <circle cx="520" cy="160" r="4" fill="#fff" />
          <circle cx="860" cy="148" r="4" fill="#ff9bb0" />
        </g>
      </svg>

      {/* Kirby bobbing on the near hill */}
      <svg className="kby-kirby" viewBox="0 0 80 80">
        <ellipse cx="40" cy="44" rx="34" ry="32" fill="#ffb6d5" stroke="#e87aa6" strokeWidth="2.5" />
        {/* feet */}
        <ellipse cx="22" cy="74" rx="12" ry="7" fill="#e0457a" />
        <ellipse cx="58" cy="74" rx="12" ry="7" fill="#e0457a" />
        {/* stubby arms */}
        <ellipse cx="8" cy="46" rx="9" ry="11" fill="#ffb6d5" stroke="#e87aa6" strokeWidth="2" />
        <ellipse cx="72" cy="46" rx="9" ry="11" fill="#ffb6d5" stroke="#e87aa6" strokeWidth="2" />
        {/* eyes */}
        <ellipse cx="32" cy="38" rx="5" ry="9" fill="#1c2a4a" />
        <ellipse cx="48" cy="38" rx="5" ry="9" fill="#1c2a4a" />
        <ellipse cx="32" cy="34" rx="2.4" ry="4" fill="#bfe6ff" />
        <ellipse cx="48" cy="34" rx="2.4" ry="4" fill="#bfe6ff" />
        {/* cheeks + mouth */}
        <circle cx="24" cy="50" r="6" fill="#ff7aa6" opacity="0.7" />
        <circle cx="56" cy="50" r="6" fill="#ff7aa6" opacity="0.7" />
        <path d="M36 52 Q40 58 44 52" stroke="#c43a68" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}
