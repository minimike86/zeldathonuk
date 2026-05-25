/**
 * Tears of the Kingdom — Depths scene.
 *
 * Deep underground cavern: jagged cave ceiling with stalactites, two bright
 * "Chasms" punched through the rock with warm sunlight pouring down, a
 * cyan-glowing Lightroot rising from the cavern floor, drifting Poe wisps,
 * a Brightbloom-seed starfield, a Gloom puddle with eyes of malice along
 * the ground, and a Bokoblin-shaped monster silhouette skulking in the
 * middle distance. Atmospheric haze ties the depths together.
 *
 * Everything is original inline SVG + CSS — basic geometric shapes evoking
 * the general aesthetic of an underground cavern; no copyrighted artwork.
 */
export function TotkDepthsScene() {
  return (
    <div className="totk-depths-scene" aria-hidden="true">
      {/* Cave ceiling — jagged silhouette across the top */}
      <svg className="totk-depths-ceiling" viewBox="0 0 1200 260" preserveAspectRatio="none">
        <path
          d="M0 0 L0 130 L60 150 L120 110 L180 160 L250 130 L310 180
             L380 130 L450 190 L520 150 L580 110 L640 170 L700 120
             L770 180 L840 140 L900 110 L960 170 L1030 130 L1090 180
             L1150 130 L1200 160 L1200 0 Z"
          fill="rgba(16, 10, 20, 0.99)"
        />
        {/* Stalactites hanging down */}
        <g fill="rgba(16, 10, 20, 0.99)">
          <path d="M118 110 L128 200 L142 116 Z" />
          <path d="M380 130 L394 220 L410 138 Z" />
          <path d="M582 110 L592 198 L604 116 Z" />
          <path d="M770 180 L780 232 L792 184 Z" />
          <path d="M900 110 L912 198 L924 118 Z" />
          <path d="M1090 180 L1098 220 L1108 184 Z" />
        </g>
        {/* Smaller stalactites for texture */}
        <g fill="rgba(20, 14, 24, 0.95)">
          <path d="M60 150 L66 180 L74 154 Z" />
          <path d="M250 130 L258 162 L266 136 Z" />
          <path d="M520 150 L526 178 L534 154 Z" />
          <path d="M700 120 L706 156 L716 124 Z" />
          <path d="M1030 130 L1036 162 L1044 134 Z" />
        </g>
      </svg>

      {/* Two bright chasm openings in the ceiling */}
      <div className="totk-depths-hole totk-depths-hole-1" />
      <div className="totk-depths-hole totk-depths-hole-2" />

      {/* Sunbeams pouring down from each chasm */}
      <div className="totk-depths-beam totk-depths-beam-1" />
      <div className="totk-depths-beam totk-depths-beam-2" />

      {/* Falling debris specks within each beam */}
      <div className="totk-depths-dust totk-depths-dust-1" />
      <div className="totk-depths-dust totk-depths-dust-2" />

      {/* Atmospheric haze across the cavern mid-band */}
      <div className="totk-depths-fog" />

      {/* Lightroot — an inverted glowing tree-like structure rising from
        * the floor. Cyan/teal glow surrounding its splayed crown. */}
      <svg className="totk-depths-lightroot" viewBox="0 0 220 320" aria-hidden="true">
        {/* Outer halo */}
        <ellipse cx="110" cy="70" rx="100" ry="60" fill="#5af0e8" opacity="0.16" />
        <ellipse cx="110" cy="70" rx="70"  ry="40" fill="#9af8ee" opacity="0.22" />
        <ellipse cx="110" cy="70" rx="40"  ry="22" fill="#cffcf6" opacity="0.4" />

        {/* Trunk rising from the bottom */}
        <path
          d="M100 320 L100 130 Q104 110 110 100 L114 100 Q116 112 120 130 L120 320 Z"
          fill="rgba(40, 70, 86, 0.92)"
        />
        {/* Trunk highlight */}
        <path
          d="M104 320 L104 130 L108 120 L108 320 Z"
          fill="rgba(96, 184, 196, 0.55)"
        />

        {/* Branching glowing tendrils at the top */}
        <g stroke="#7ef4ec" strokeWidth="3.5" fill="none" strokeLinecap="round">
          <path d="M110 100 L82 70 L60 50" />
          <path d="M82 70 L72 58" />
          <path d="M110 100 L138 70 L160 50" />
          <path d="M138 70 L148 58" />
          <path d="M110 100 L110 50 L106 36" />
          <path d="M110 100 L96 80 L86 88" />
          <path d="M110 100 L124 80 L134 88" />
        </g>
        {/* Brighter inner glow strokes */}
        <g stroke="#e8fefe" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.9">
          <path d="M110 100 L82 70 L60 50" />
          <path d="M110 100 L138 70 L160 50" />
          <path d="M110 100 L110 50" />
        </g>
        {/* Glowing dot at the centre */}
        <circle cx="110" cy="100" r="6"  fill="#ffffff" />
        <circle cx="110" cy="100" r="14" fill="#a8f8f0" opacity="0.6" />

        {/* Base glow where the trunk meets the ground */}
        <ellipse cx="110" cy="312" rx="60" ry="10" fill="#5af0e8" opacity="0.45" />
      </svg>

      {/* Brightbloom seeds — a scattered starfield of bright cyan dots
        * across the cavern floor and walls. CSS background image. */}
      <div className="totk-depths-blooms" />

      {/* Drifting Poe wisps — ghostly translucent flame-shapes that float
        * up and bob around. Three wisps at different positions and speeds. */}
      <svg className="totk-depths-wisp totk-depths-wisp-1" viewBox="0 0 60 100" aria-hidden="true">
        <ellipse cx="30" cy="80" rx="14" ry="6" fill="#a8e8ff" opacity="0.35" />
        <path d="M30 80 Q22 60 26 40 Q30 24 30 12 Q36 24 36 40 Q40 60 30 80 Z"
              fill="#cffaff" opacity="0.85" />
        <path d="M30 80 Q26 60 28 42 Q30 30 30 22 Q34 30 34 42 Q36 60 30 80 Z"
              fill="#ffffff" opacity="0.7" />
        <circle cx="30" cy="22" r="3" fill="#ffffff" />
      </svg>

      <svg className="totk-depths-wisp totk-depths-wisp-2" viewBox="0 0 60 100" aria-hidden="true">
        <ellipse cx="30" cy="80" rx="12" ry="5" fill="#a8e8ff" opacity="0.3" />
        <path d="M30 80 Q22 60 26 40 Q30 24 30 12 Q36 24 36 40 Q40 60 30 80 Z"
              fill="#cffaff" opacity="0.8" />
        <circle cx="30" cy="22" r="2.5" fill="#ffffff" />
      </svg>

      <svg className="totk-depths-wisp totk-depths-wisp-3" viewBox="0 0 60 100" aria-hidden="true">
        <ellipse cx="30" cy="80" rx="10" ry="4" fill="#a8e8ff" opacity="0.25" />
        <path d="M30 80 Q22 60 26 40 Q30 24 30 12 Q36 24 36 40 Q40 60 30 80 Z"
              fill="#cffaff" opacity="0.75" />
        <circle cx="30" cy="22" r="2" fill="#ffffff" />
      </svg>

      {/* Monster silhouette — Bokoblin-shaped goon lurking in the mid-ground */}
      <svg className="totk-depths-monster" viewBox="0 0 120 140" aria-hidden="true">
        {/* Pointy-eared head */}
        <ellipse cx="60" cy="60" rx="26" ry="28" fill="rgba(14, 8, 12, 0.96)" />
        <path d="M34 50 L20 24 L42 44 Z" fill="rgba(14, 8, 12, 0.96)" />
        <path d="M86 50 L100 24 L78 44 Z" fill="rgba(14, 8, 12, 0.96)" />
        {/* Snout */}
        <ellipse cx="60" cy="74" rx="8" ry="6" fill="rgba(20, 12, 16, 0.96)" />
        {/* Glowing red eyes */}
        <circle cx="50" cy="58" r="3" fill="#ff3a3a" />
        <circle cx="70" cy="58" r="3" fill="#ff3a3a" />
        <circle cx="50" cy="58" r="1.2" fill="#1a0408" />
        <circle cx="70" cy="58" r="1.2" fill="#1a0408" />
        {/* Hunched body */}
        <path d="M40 86 Q40 110 50 138 L70 138 Q80 110 80 86 Q80 80 60 80 Q40 80 40 86 Z"
              fill="rgba(14, 8, 12, 0.96)" />
        {/* Crude club held to the side */}
        <rect x="84" y="86" width="4" height="34" fill="rgba(14, 8, 12, 0.96)" />
        <ellipse cx="86" cy="120" rx="6" ry="4" fill="rgba(14, 8, 12, 0.96)" />
      </svg>

      {/* Gloom seeping along the cavern floor */}
      <svg className="totk-depths-gloom" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path
          d="M0 60 Q100 46 240 56 Q380 68 540 50 Q700 42 860 60
             Q1020 76 1200 56 L1200 120 L0 120 Z"
          fill="rgba(28, 4, 10, 0.95)"
        />
        <path
          d="M0 64 Q100 50 240 60 Q380 72 540 54 Q700 46 860 64
             Q1020 80 1200 60"
          fill="none" stroke="rgba(216, 36, 58, 0.55)" strokeWidth="1.6"
        />
        {/* Eyes of Malice */}
        <g>
          <circle cx="120" cy="68" r="3.5" fill="#ff3a3a" />
          <circle cx="120" cy="68" r="1.4" fill="#1a0408" />
          <circle cx="320" cy="58" r="3"   fill="#ff3a3a" />
          <circle cx="320" cy="58" r="1.2" fill="#1a0408" />
          <circle cx="540" cy="58" r="4"   fill="#ff3a3a" />
          <circle cx="540" cy="58" r="1.6" fill="#1a0408" />
          <circle cx="760" cy="58" r="3"   fill="#ff3a3a" />
          <circle cx="760" cy="58" r="1.2" fill="#1a0408" />
          <circle cx="980" cy="68" r="3.5" fill="#ff3a3a" />
          <circle cx="980" cy="68" r="1.4" fill="#1a0408" />
        </g>
      </svg>

      {/* Foreground rock ledge */}
      <svg className="totk-depths-foreground" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 200 L0 130 Q100 110 220 120 Q360 134 500 110 Q660 90 820 122
             Q980 142 1200 118 L1200 200 Z"
          fill="rgba(8, 4, 10, 1)"
        />
      </svg>
    </div>
  );
}
