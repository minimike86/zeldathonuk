import './misc.css';

/**
 * Metal Gear Solid 3 — the Tselinoyarsk jungle. Dense camo-green foliage layers,
 * dappled sunlight, a crouched camouflaged sneaker blending into the brush, and
 * drifting pollen. Warm camo greens. `.mg3-` namespace.
 */
export function MetalGearSolid3Scene() {
  return (
    <div className="mg3-scene" aria-hidden="true">
      {/* Dappled jungle light */}
      <div className="mg3-light" />

      {/* Far jungle ridge */}
      <svg className="mg3-ridge" viewBox="0 0 1200 220" preserveAspectRatio="none">
        <path d="M0 220 L0 120 Q200 70 420 110 Q640 150 860 90 Q1040 60 1200 110 L1200 220 Z" fill="#2c4322" />
      </svg>

      {/* Mid foliage canopy clusters */}
      <svg className="mg3-canopy" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <g fill="#3b5a2a">
          <ellipse cx="120" cy="80" rx="150" ry="90" />
          <ellipse cx="380" cy="70" rx="170" ry="96" />
          <ellipse cx="660" cy="78" rx="160" ry="90" />
          <ellipse cx="940" cy="70" rx="170" ry="96" />
          <ellipse cx="1160" cy="80" rx="150" ry="86" />
        </g>
        <g fill="#4e7339" opacity="0.7">
          <ellipse cx="260" cy="56" rx="80" ry="30" />
          <ellipse cx="760" cy="56" rx="80" ry="30" />
        </g>
      </svg>

      {/* Hanging leaf fronds from the top */}
      <svg className="mg3-fronds" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <g fill="#43662f">
          <path d="M40 0 Q60 80 30 160 Q70 90 90 0 Z" />
          <path d="M200 0 Q210 100 240 170 Q200 100 250 0 Z" />
          <path d="M980 0 Q1000 80 970 160 Q1010 90 1030 0 Z" />
          <path d="M1140 0 Q1150 100 1180 170 Q1140 100 1190 0 Z" />
        </g>
      </svg>

      {/* Crouched camouflaged sneaker blending into the brush */}
      <svg className="mg3-sneaker" viewBox="0 0 110 100">
        {/* camo body */}
        <g fill="#46612f">
          <path d="M16 76 Q28 52 58 54 L78 60 L72 78 L24 82 Z" />
          <ellipse cx="68" cy="44" rx="13" ry="11" />
          <path d="M22 80 L20 98 L32 98 L36 82 Z" />
          <path d="M52 76 L60 96 L72 94 L60 74 Z" />
        </g>
        {/* camo blotch overlay */}
        <g fill="#2f4420" opacity="0.85">
          <ellipse cx="40" cy="66" rx="10" ry="6" />
          <ellipse cx="60" cy="70" rx="8" ry="5" />
          <circle cx="68" cy="44" r="6" />
        </g>
        {/* bandana / sneaking suit highlight */}
        <path d="M58 38 L80 34 L78 42 L60 44 Z" fill="#5c7a3d" />
      </svg>

      {/* Foreground brush hiding the lower edge */}
      <svg className="mg3-brush" viewBox="0 0 1200 160" preserveAspectRatio="none">
        <path d="M0 160 L0 80 Q300 50 600 80 Q900 110 1200 70 L1200 160 Z" fill="#23381b" />
        {/* tall grass blades */}
        <g stroke="#3b5a2a" strokeWidth="4" fill="none" strokeLinecap="round">
          <path d="M80 160 Q86 90 70 50" />
          <path d="M120 160 Q126 100 140 56" />
          <path d="M540 160 Q546 90 530 50" />
          <path d="M600 160 Q606 100 620 56" />
          <path d="M1040 160 Q1046 90 1030 50" />
          <path d="M1100 160 Q1106 100 1120 56" />
        </g>
      </svg>

      {/* Drifting pollen motes */}
      <div className="mg3-pollen" />
      {/* Codec scanlines */}
      <div className="mg3-scanlines" />
    </div>
  );
}
