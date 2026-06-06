import './misc.css';

/**
 * Kirby Super Star — SNES bright skies over Dream Land with the Halberd airship
 * cruising in. Vivid blue gradient, big puffy clouds, a hint of the Halberd's
 * masked prow and cannon, with twinkling stars. `.kss-` namespace.
 */
export function KirbySuperStarScene() {
  return (
    <div className="kss-scene" aria-hidden="true">
      {/* Sun bloom */}
      <div className="kss-sun" />

      {/* Twinkling stars */}
      <div className="kss-stars" />

      {/* Big puffy SNES clouds */}
      <svg className="kss-cloud kss-cloud-a" viewBox="0 0 180 90">
        <g fill="#ffffff">
          <ellipse cx="54" cy="56" rx="44" ry="26" />
          <ellipse cx="100" cy="46" rx="42" ry="30" />
          <ellipse cx="138" cy="58" rx="36" ry="24" />
          <ellipse cx="92" cy="66" rx="56" ry="20" />
        </g>
        <g fill="#cdeafe" opacity="0.7">
          <ellipse cx="80" cy="74" rx="52" ry="12" />
        </g>
      </svg>
      <svg className="kss-cloud kss-cloud-b" viewBox="0 0 180 90">
        <g fill="#ffffff">
          <ellipse cx="60" cy="54" rx="38" ry="22" />
          <ellipse cx="104" cy="48" rx="36" ry="26" />
          <ellipse cx="136" cy="58" rx="30" ry="20" />
        </g>
      </svg>

      {/* The Halberd airship cruising in from the right */}
      <svg className="kss-halberd" viewBox="0 0 360 200">
        {/* shadow */}
        <ellipse cx="180" cy="160" rx="150" ry="18" fill="rgba(40, 60, 90, 0.25)" />
        {/* hull */}
        <path d="M30 100 Q150 70 320 96 L340 120 Q200 150 60 138 Z" fill="#8b6fb0" stroke="#5d4880" strokeWidth="3" />
        {/* lower hull plating */}
        <path d="M60 138 Q200 150 340 120 L330 134 Q200 162 70 150 Z" fill="#6e5494" />
        {/* deck superstructure */}
        <rect x="150" y="60" width="120" height="42" rx="6" fill="#9d80c2" stroke="#5d4880" strokeWidth="2" />
        {/* masked prow face (the Halberd's iconic eye) */}
        <path d="M300 84 L344 70 L356 96 L320 110 Z" fill="#c9b6e0" stroke="#5d4880" strokeWidth="2" />
        <ellipse cx="330" cy="92" rx="9" ry="7" fill="#ffd94a" stroke="#c98b1c" strokeWidth="2" />
        <circle cx="332" cy="92" r="3" fill="#1c2a4a" />
        {/* main cannon (Combo Cannon) on deck */}
        <rect x="170" y="40" width="16" height="26" rx="3" fill="#5d4880" />
        <rect x="166" y="30" width="24" height="14" rx="4" fill="#7a5fa3" stroke="#5d4880" strokeWidth="2" />
        {/* sails / fins */}
        <path d="M210 60 L230 18 L250 60 Z" fill="#b39ad4" stroke="#5d4880" strokeWidth="2" />
        {/* engine glow at the stern */}
        <ellipse className="kss-engine" cx="36" cy="118" rx="18" ry="10" fill="#ffd94a" opacity="0.8" />
      </svg>

      {/* Rolling green hills */}
      <svg className="kss-hills kss-hills-far" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 130 Q220 80 460 120 Q700 160 940 110 Q1080 84 1200 120 L1200 200 Z" fill="#7ed07f" />
      </svg>
      <svg className="kss-hills kss-hills-near" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 150 Q260 100 520 140 Q780 178 1020 128 Q1140 104 1200 138 L1200 200 Z" fill="#4fb158" />
        <g>
          <circle cx="240" cy="160" r="4" fill="#ffe14a" />
          <circle cx="640" cy="168" r="4" fill="#fff" />
          <circle cx="980" cy="156" r="4" fill="#ff9bb0" />
        </g>
      </svg>
    </div>
  );
}
