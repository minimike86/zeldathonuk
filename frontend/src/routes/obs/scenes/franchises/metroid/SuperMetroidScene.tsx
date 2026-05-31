import './metroid.css';

/**
 * Super Metroid — the deep caverns of Zebes. Jagged stalactite/stalagmite rock
 * walls frame an eerie teal-glowing cavern. Samus stands in silhouette on a
 * rocky ledge, arm-cannon ready, while a captured Metroid jellyfish pulses in
 * its glass tank and bio-luminescent spores drift through the gloom.
 * `.smet-` namespace.
 */
export function SuperMetroidScene() {
  return (
    <div className="smet-scene" aria-hidden="true">
      {/* Eerie teal cavern glow */}
      <div className="smet-glow" />

      {/* Ceiling stalactites */}
      <svg className="smet-ceiling" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 0 L1200 0 L1200 70 L1140 30 L1080 90 L1010 24 L940 80 L870 20 L800 96 L720 30 L650 84 L560 18 L490 90 L410 26 L340 80 L260 22 L190 92 L110 30 L40 78 L0 26 Z"
          fill="#0e2226"
        />
        {/* dripping highlight tips */}
        <g fill="#1f4a4e">
          <path d="M800 96 L796 84 L804 84 Z" />
          <path d="M490 90 L486 78 L494 78 Z" />
          <path d="M190 92 L186 80 L194 80 Z" />
        </g>
      </svg>

      {/* Back cavern wall with glowing fissures */}
      <svg className="smet-backwall" viewBox="0 0 1200 400" preserveAspectRatio="none">
        <path d="M0 400 L0 120 Q200 80 380 140 Q560 200 760 130 Q960 70 1200 150 L1200 400 Z" fill="#0a1a1e" />
        <g stroke="#1aa3a0" strokeWidth="2" fill="none" opacity="0.55">
          <path d="M260 200 Q280 260 250 320" />
          <path d="M620 180 Q640 250 610 320" />
          <path d="M980 200 Q1000 260 970 330" />
        </g>
      </svg>

      {/* Metroid in a glass containment tank */}
      <svg className="smet-metroid" viewBox="0 0 100 130">
        {/* tank glass */}
        <rect x="14" y="10" width="72" height="110" rx="10" fill="rgba(40, 110, 110, 0.18)" stroke="#1f7a78" strokeWidth="2.5" />
        {/* metroid membrane */}
        <ellipse cx="50" cy="56" rx="30" ry="26" fill="rgba(64, 220, 200, 0.28)" stroke="#5fe8d6" strokeWidth="2" />
        {/* nuclei */}
        <g fill="#d63a6a"><circle cx="40" cy="50" r="7" /><circle cx="58" cy="46" r="7" /><circle cx="48" cy="62" r="7" /><circle cx="62" cy="60" r="6" /></g>
        <g fill="#ff9fc0" opacity="0.8"><circle cx="38" cy="48" r="2.5" /><circle cx="56" cy="44" r="2.5" /></g>
        {/* fangs / mandibles */}
        <g stroke="#bfe8e0" strokeWidth="2.5" strokeLinecap="round">
          <path d="M40 80 L36 96" /><path d="M50 82 L50 98" /><path d="M60 80 L64 96" />
        </g>
      </svg>

      {/* Rocky ledge Samus stands on */}
      <svg className="smet-ledge" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 110 Q160 80 340 100 Q520 122 700 92 Q900 62 1200 110 L1200 200 Z" fill="#06141a" />
      </svg>

      {/* Samus silhouette, arm cannon ready */}
      <svg className="smet-samus" viewBox="0 0 60 100">
        <g fill="#08161a">
          {/* legs */}
          <rect x="22" y="64" width="9" height="34" rx="2" />
          <rect x="33" y="64" width="9" height="34" rx="2" />
          {/* torso / suit */}
          <path d="M18 38 Q32 30 46 38 L44 66 L20 66 Z" />
          {/* shoulder pads */}
          <ellipse cx="20" cy="40" rx="8" ry="7" />
          <ellipse cx="44" cy="40" rx="8" ry="7" />
          {/* helmet */}
          <path d="M22 18 Q32 8 42 18 Q44 30 38 34 L26 34 Q20 30 22 18 Z" />
          {/* arm cannon */}
          <rect x="42" y="44" width="20" height="14" rx="5" />
        </g>
        {/* visor glow */}
        <path d="M28 20 Q34 16 39 20 L37 26 L30 26 Z" fill="#5fe8d6" opacity="0.9" />
        {/* cannon muzzle glow */}
        <circle cx="60" cy="51" r="4" fill="#5fe8d6" opacity="0.9" />
      </svg>
      <div className="smet-cannon-glow" />

      {/* Drifting bio-luminescent spores */}
      <div className="smet-spores" />
    </div>
  );
}
