/**
 * Ocarina of Time scene — Lost Woods green canopy with shafts of golden
 * light, a giant blue ocarina floating, and the Deku Tree silhouette.
 */
export function OcarinaScene() {
  return (
    <div className="oot-scene" aria-hidden="true">
      {/* Golden light shafts cutting through the canopy */}
      <div className="oot-light-shafts" />

      {/* The blue Ocarina of Time, slowly bobbing */}
      <svg className="oot-ocarina" viewBox="-80 -60 160 120">
        {/* body */}
        <path
          d="M-58 -8 Q-65 -45 -20 -50 Q35 -52 60 -38 Q70 -22 60 -8 Q56 16 30 30 Q0 38 -28 30 Q-54 18 -58 -8 Z"
          fill="#2a7adf"
          stroke="#0e3d8a"
          strokeWidth="2.5"
        />
        {/* highlight */}
        <path
          d="M-40 -34 Q-15 -42 20 -38 Q35 -34 30 -26 Q5 -32 -25 -28 Q-40 -28 -40 -34 Z"
          fill="rgba(255,255,255,0.35)"
        />
        {/* gold trim around the mouthpiece */}
        <path
          d="M48 -25 Q72 -22 70 -8 Q66 4 50 0 Z"
          fill="#ffd23a"
          stroke="#7a5800"
          strokeWidth="1.5"
        />
        {/* finger holes */}
        <circle cx="-30" cy="-14" r="3.5" fill="#0a1f3e" />
        <circle cx="-12" cy="-18" r="3.5" fill="#0a1f3e" />
        <circle cx="6" cy="-16" r="3.5" fill="#0a1f3e" />
        <circle cx="22" cy="-12" r="3.5" fill="#0a1f3e" />
        {/* a faint triforce engraving */}
        <g transform="translate(-12 14)" opacity="0.8">
          <path d="M0 -7 L7 5 L-7 5 Z" fill="#ffd23a" />
        </g>
      </svg>

      {/* Deku Tree silhouette far back */}
      <svg className="oot-deku" viewBox="0 0 800 320" preserveAspectRatio="none">
        {/* trunk */}
        <path
          d="M340 320 L340 200 Q310 170 320 130 Q330 90 380 70 Q450 50 520 80 Q580 110 580 170 L580 320 Z"
          fill="rgba(8, 22, 12, 0.96)"
        />
        {/* canopy */}
        <ellipse cx="450" cy="90" rx="220" ry="80" fill="rgba(6, 18, 8, 0.96)" />
        <ellipse cx="350" cy="110" rx="120" ry="60" fill="rgba(6, 18, 8, 0.96)" />
        <ellipse cx="560" cy="100" rx="130" ry="60" fill="rgba(6, 18, 8, 0.96)" />
        {/* glowing eyes */}
        <ellipse cx="420" cy="170" rx="8" ry="12" fill="#ffd23a" opacity="0.85" />
        <ellipse cx="480" cy="170" rx="8" ry="12" fill="#ffd23a" opacity="0.85" />
      </svg>

      {/* Forest floor canopy silhouette */}
      <svg className="oot-canopy" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 200 Q60 130 130 150 Q200 110 260 140 Q330 100 400 130 Q480 90 560 120 Q640 95 720 125 Q800 90 880 120 Q960 95 1040 130 Q1120 100 1200 140 L1200 200 Z"
          fill="rgba(4, 14, 8, 0.98)"
        />
      </svg>

      {/* Drifting fireflies / glowing pollen */}
      <div className="oot-fireflies" />
    </div>
  );
}
