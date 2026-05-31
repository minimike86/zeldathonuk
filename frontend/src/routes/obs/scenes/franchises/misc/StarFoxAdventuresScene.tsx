import './misc.css';

/**
 * Star Fox Adventures — Dinosaur Planet jungle temple. A lush green canopy
 * frames a gold-accented stone temple set with a glowing SpellStone gem, vines,
 * pierced sunbeams and drifting spores. Green/gold. `.sfa-` namespace.
 */
export function StarFoxAdventuresScene() {
  return (
    <div className="sfa-scene" aria-hidden="true">
      {/* Warm jungle light bloom */}
      <div className="sfa-glow" />

      {/* Far misty jungle canopy */}
      <svg className="sfa-canopy" viewBox="0 0 1200 220" preserveAspectRatio="none">
        <g fill="#1f5a30">
          <ellipse cx="120" cy="60" rx="160" ry="90" />
          <ellipse cx="380" cy="50" rx="180" ry="96" />
          <ellipse cx="660" cy="58" rx="170" ry="90" />
          <ellipse cx="940" cy="50" rx="180" ry="96" />
          <ellipse cx="1160" cy="60" rx="150" ry="86" />
        </g>
        <g fill="#2f7a40" opacity="0.7">
          <ellipse cx="260" cy="40" rx="80" ry="30" />
          <ellipse cx="760" cy="40" rx="80" ry="30" />
        </g>
      </svg>

      {/* Pierced sunbeams through the canopy */}
      <div className="sfa-beams" />

      {/* Stone temple centre-back */}
      <svg className="sfa-temple" viewBox="0 0 280 280">
        {/* stepped base */}
        <g fill="#9c8f6a" stroke="#6f6446" strokeWidth="2">
          <rect x="20" y="230" width="240" height="50" />
          <rect x="48" y="190" width="184" height="44" />
          <rect x="76" y="150" width="128" height="44" />
        </g>
        {/* gold trim courses */}
        <g fill="#e8c45a">
          <rect x="20" y="226" width="240" height="6" />
          <rect x="48" y="186" width="184" height="6" />
          <rect x="76" y="146" width="128" height="6" />
        </g>
        {/* upper shrine box */}
        <rect x="104" y="86" width="72" height="64" fill="#8a7d58" stroke="#6f6446" strokeWidth="2" />
        {/* arched doorway with glowing gem */}
        <path d="M124 150 L124 110 Q140 92 156 110 L156 150 Z" fill="#2a2418" />
        <polygon className="sfa-gem" points="140,108 150,122 140,138 130,122" fill="#7af0c0" stroke="#cfe8a0" strokeWidth="2" />
        {/* carved totem face above the door */}
        <g fill="#6f6446">
          <circle cx="128" cy="100" r="4" />
          <circle cx="152" cy="100" r="4" />
          <rect x="132" y="108" width="16" height="3" />
        </g>
        {/* gold finial */}
        <path d="M140 86 L130 70 L150 70 Z" fill="#e8c45a" stroke="#a8842c" strokeWidth="2" />
      </svg>

      {/* Hanging vines framing the sides */}
      <svg className="sfa-vines" viewBox="0 0 1200 300" preserveAspectRatio="none">
        <g stroke="#2f7a40" strokeWidth="4" fill="none" strokeLinecap="round">
          <path d="M60 0 Q70 120 50 260" />
          <path d="M160 0 Q150 130 170 280" />
          <path d="M1040 0 Q1050 120 1030 260" />
          <path d="M1140 0 Q1130 130 1150 280" />
        </g>
        <g fill="#3f9b46">
          <ellipse cx="52" cy="140" rx="6" ry="11" transform="rotate(-20 52 140)" />
          <ellipse cx="168" cy="160" rx="6" ry="11" transform="rotate(20 168 160)" />
          <ellipse cx="1032" cy="140" rx="6" ry="11" transform="rotate(20 1032 140)" />
          <ellipse cx="1148" cy="160" rx="6" ry="11" transform="rotate(-20 1148 160)" />
        </g>
      </svg>

      {/* Mossy foreground ground */}
      <svg className="sfa-ground" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 100 Q300 70 600 100 Q900 130 1200 90 L1200 200 Z" fill="#2a5a2e" />
        <path d="M0 200 L0 150 Q300 124 600 150 Q900 178 1200 142 L1200 200 Z" fill="#1c4421" />
        {/* foreground ferns */}
        <g fill="#357a3a">
          <path d="M140 150 Q150 116 160 150 Q170 110 180 150 Z" />
          <path d="M1020 150 Q1030 116 1040 150 Q1050 110 1060 150 Z" />
        </g>
      </svg>

      {/* Drifting spores / pollen */}
      <div className="sfa-spores" />
    </div>
  );
}
