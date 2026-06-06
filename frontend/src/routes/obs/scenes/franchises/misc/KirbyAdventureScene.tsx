import './misc.css';

/**
 * Kirby's Adventure — NES Dream Land. A vivid pastel sky with a big arcing
 * rainbow, a cheerful turreted castle on a green hill, fluffy clouds, and Kirby
 * riding a Warp Star across the arc. `.kad-` namespace.
 */
export function KirbyAdventureScene() {
  return (
    <div className="kad-scene" aria-hidden="true">
      {/* Soft sun bloom */}
      <div className="kad-sun" />

      {/* Big arcing rainbow */}
      <svg className="kad-rainbow" viewBox="0 0 400 220" preserveAspectRatio="none">
        <g fill="none" strokeWidth="14" strokeLinecap="round">
          <path d="M20 220 A180 180 0 0 1 380 220" stroke="#ff8a8a" />
          <path d="M34 220 A166 166 0 0 1 366 220" stroke="#ffc06a" />
          <path d="M48 220 A152 152 0 0 1 352 220" stroke="#ffe98a" />
          <path d="M62 220 A138 138 0 0 1 338 220" stroke="#9be78a" />
          <path d="M76 220 A124 124 0 0 1 324 220" stroke="#8ac6ff" />
          <path d="M90 220 A110 110 0 0 1 310 220" stroke="#c79bff" />
        </g>
      </svg>

      {/* Fluffy clouds */}
      <svg className="kad-cloud kad-cloud-a" viewBox="0 0 160 70">
        <g fill="#ffffff">
          <ellipse cx="52" cy="44" rx="40" ry="22" />
          <ellipse cx="92" cy="38" rx="36" ry="26" />
          <ellipse cx="120" cy="46" rx="30" ry="20" />
        </g>
      </svg>
      <svg className="kad-cloud kad-cloud-b" viewBox="0 0 160 70">
        <g fill="#ffffff">
          <ellipse cx="56" cy="44" rx="34" ry="20" />
          <ellipse cx="92" cy="40" rx="30" ry="22" />
        </g>
      </svg>

      {/* Cheerful turreted Dream Land castle on the hill */}
      <svg className="kad-castle" viewBox="0 0 260 220">
        {/* main keep */}
        <rect x="80" y="80" width="100" height="130" fill="#f3a0c8" stroke="#d76aa0" strokeWidth="3" />
        {/* side towers */}
        <rect x="40" y="100" width="46" height="110" fill="#f9b7d6" stroke="#d76aa0" strokeWidth="3" />
        <rect x="174" y="100" width="46" height="110" fill="#f9b7d6" stroke="#d76aa0" strokeWidth="3" />
        {/* battlements */}
        <g fill="#e785b4">
          <rect x="80" y="72" width="16" height="14" />
          <rect x="106" y="72" width="16" height="14" />
          <rect x="132" y="72" width="16" height="14" />
          <rect x="158" y="72" width="16" height="14" />
        </g>
        {/* conical tower roofs */}
        <path d="M40 100 L63 60 L86 100 Z" fill="#ff8fbf" stroke="#d76aa0" strokeWidth="2" />
        <path d="M174 100 L197 60 L220 100 Z" fill="#ff8fbf" stroke="#d76aa0" strokeWidth="2" />
        {/* flags */}
        <g>
          <rect x="62" y="40" width="2" height="22" fill="#a05a7a" />
          <path d="M64 42 L80 47 L64 52 Z" fill="#ffd94a" />
          <rect x="196" y="40" width="2" height="22" fill="#a05a7a" />
          <path d="M198 42 L214 47 L198 52 Z" fill="#ffd94a" />
        </g>
        {/* arched door + windows */}
        <path d="M118 210 L118 160 Q130 144 142 160 L142 210 Z" fill="#8a4a6a" />
        <g fill="#bfe6ff">
          <rect x="54" y="124" width="18" height="22" rx="4" />
          <rect x="188" y="124" width="18" height="22" rx="4" />
          <rect x="98" y="108" width="18" height="22" rx="4" />
          <rect x="144" y="108" width="18" height="22" rx="4" />
        </g>
      </svg>

      {/* Rolling green hills */}
      <svg className="kad-hills kad-hills-far" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 120 Q200 70 420 110 Q640 150 860 100 Q1040 60 1200 110 L1200 200 Z" fill="#8be08c" />
      </svg>
      <svg className="kad-hills kad-hills-near" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 140 Q240 90 500 130 Q760 170 1000 120 Q1120 95 1200 130 L1200 200 Z" fill="#4fc05a" />
        <g>
          <circle cx="200" cy="150" r="4" fill="#ffe14a" />
          <circle cx="560" cy="160" r="4" fill="#fff" />
          <circle cx="900" cy="148" r="4" fill="#ff9bb0" />
        </g>
      </svg>

      {/* Kirby on a Warp Star riding across the arc */}
      <svg className="kad-rider" viewBox="0 0 120 80">
        {/* warp star */}
        <path d="M30 56 L40 36 L62 36 L46 50 L52 72 L34 60 Z" fill="#ffd94a" stroke="#ffae00" strokeWidth="2" strokeLinejoin="round" />
        {/* kirby body */}
        <ellipse cx="62" cy="34" rx="22" ry="20" fill="#ffb6d5" stroke="#e87aa6" strokeWidth="2.5" />
        <ellipse cx="56" cy="30" rx="3.4" ry="6" fill="#1c2a4a" />
        <ellipse cx="68" cy="30" rx="3.4" ry="6" fill="#1c2a4a" />
        <circle cx="50" cy="40" r="4.5" fill="#ff7aa6" opacity="0.7" />
        <circle cx="74" cy="40" r="4.5" fill="#ff7aa6" opacity="0.7" />
        <ellipse cx="84" cy="34" rx="7" ry="9" fill="#ffb6d5" stroke="#e87aa6" strokeWidth="2" />
      </svg>
    </div>
  );
}
