/**
 * Tears of the Kingdom — Depths scene.
 *
 * Deep underground cavern: jagged cave ceiling with stalactites, two bright
 * "Chasms" punched through the rock with warm sunlight pouring down,
 * drifting Poe wisps, a Brightbloom-seed starfield, a Gloom puddle with
 * eyes of malice along the ground, and a Bokoblin-shaped monster
 * silhouette skulking in the middle distance. Atmospheric haze ties the
 * depths together.
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

      {/* Brightbloom seeds — a scattered starfield of bright cyan dots
        * across the cavern floor and walls. CSS background image. */}
      <div className="totk-depths-blooms" />

      {/* Floating script ribbons of abstract glyphs flowing across the
        * cavern. Two ribbons at different heights with opposite scroll
        * directions. Pattern duplicated in the second half of the viewBox
        * so a -50% translate loops seamlessly. */}
      <svg className="totk-depths-script totk-depths-script-1" viewBox="0 0 2400 120" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          {/* 12 original abstract glyph definitions for ribbon 1. Each is a
            * cluster of basic geometric primitives (lines, circles, arcs,
            * triangles) so the script reads as alien but legibly structured. */}
          <g id="r1g1">
            <line x1="-6" y1="-8" x2="-6" y2="8" />
            <line x1="-10" y1="0" x2="-2" y2="0" />
            <circle cx="6" cy="0" r="4" />
            <circle cx="6" cy="0" r="1.4" fill="#9af8ee" stroke="none" />
            <path d="M14 -5 L20 0 L14 5" />
          </g>
          <g id="r1g2">
            <path d="M0 -7 L7 0 L0 7 L-7 0 Z" />
            <circle cx="0" cy="0" r="2.5" />
            <line x1="14" y1="-4" x2="22" y2="4" />
          </g>
          <g id="r1g3">
            <path d="M-8 0 L0 -6 L8 0 L0 6 Z" />
            <line x1="14" y1="-4" x2="22" y2="-4" />
            <line x1="14" y1="0" x2="22" y2="0" />
            <line x1="14" y1="4" x2="22" y2="4" />
            <circle cx="30" cy="0" r="2" fill="#9af8ee" stroke="none" />
          </g>
          <g id="r1g4">
            <line x1="-6" y1="-7" x2="-6" y2="7" />
            <line x1="-2" y1="-7" x2="-2" y2="7" />
            <line x1="-8" y1="-3" x2="0" y2="-3" />
            <line x1="-8" y1="3" x2="0" y2="3" />
            <circle cx="10" cy="0" r="2.5" />
            <line x1="16" y1="-5" x2="22" y2="-5" />
          </g>
          <g id="r1g5">
            <line x1="-6" y1="-6" x2="6" y2="6" />
            <line x1="-6" y1="6" x2="6" y2="-6" />
            <path d="M14 -5 Q22 0 14 5" />
            <circle cx="28" cy="0" r="2.5" />
          </g>
          <g id="r1g6">
            <path d="M-3 -7 Q-9 0 -3 7 Q3 0 -3 -7 Z" />
            <circle cx="8" cy="0" r="1.4" fill="#9af8ee" stroke="none" />
            <circle cx="14" cy="-4" r="1.4" fill="#9af8ee" stroke="none" />
            <circle cx="14" cy="4" r="1.4" fill="#9af8ee" stroke="none" />
            <line x1="20" y1="-5" x2="20" y2="5" />
          </g>
          <g id="r1g7">
            <path d="M-3 -2 Q-3 -6 1 -6 Q6 -6 6 -1 Q6 4 1 4 Q-2 4 -2 1" />
            <circle cx="18" cy="0" r="6" />
            <circle cx="18" cy="0" r="3" />
            <circle cx="18" cy="0" r="1" fill="#9af8ee" stroke="none" />
          </g>
          <g id="r1g8">
            <path d="M-7 -5 Q-2 0 -7 5" />
            <path d="M-3 -5 Q2 0 -3 5" />
            <path d="M1 -5 Q6 0 1 5" />
            <circle cx="14" cy="0" r="3" />
            <line x1="20" y1="-5" x2="26" y2="5" />
          </g>
          <g id="r1g9">
            <line x1="-6" y1="-8" x2="-6" y2="8" />
            <line x1="0" y1="-8" x2="0" y2="8" />
            <line x1="6" y1="-8" x2="6" y2="8" />
            <line x1="-6" y1="-4" x2="6" y2="-4" />
            <line x1="-6" y1="0" x2="6" y2="0" />
            <line x1="-6" y1="4" x2="6" y2="4" />
          </g>
          <g id="r1g10">
            <path d="M-7 5 L0 -7 L7 5 Z" />
            <line x1="-3" y1="2" x2="3" y2="2" />
            <line x1="-1" y1="-1" x2="1" y2="-1" />
            <circle cx="14" cy="0" r="2" />
            <line x1="20" y1="-6" x2="24" y2="6" />
          </g>
          <g id="r1g11">
            <path d="M-10 -4 Q-6 2 -2 -4 Q2 -10 6 -4 Q10 2 14 -4" />
            <circle cx="22" cy="0" r="3" />
            <line x1="28" y1="-5" x2="34" y2="5" />
          </g>
          <g id="r1g12">
            <line x1="-7" y1="0" x2="7" y2="0" />
            <line x1="0" y1="-7" x2="0" y2="7" />
            <circle cx="-7" cy="0" r="1.4" fill="#9af8ee" stroke="none" />
            <circle cx="7" cy="0" r="1.4" fill="#9af8ee" stroke="none" />
            <circle cx="0" cy="-7" r="1.4" fill="#9af8ee" stroke="none" />
            <circle cx="0" cy="7" r="1.4" fill="#9af8ee" stroke="none" />
            <line x1="14" y1="-5" x2="22" y2="-5" />
            <line x1="14" y1="0" x2="22" y2="0" />
          </g>
          {/* Wisp orb — small cyan eye-pulse that drifts along the ribbon
            * in the same palette as the glyph strokes. Layered transparency
            * for a soft glowing halo. */}
          <g id="malice-wisp">
            <circle cx="0" cy="0" r="11" fill="rgba(154, 248, 238, 0.22)" stroke="none" />
            <circle cx="0" cy="0" r="6"  fill="rgba(154, 248, 238, 0.65)" stroke="none" />
            <circle cx="0" cy="0" r="3"  fill="#9af8ee" stroke="none" />
            <circle cx="0" cy="0" r="1.2" fill="#ffffff" stroke="none" />
          </g>
        </defs>
        <g fill="none" stroke="#9af8ee" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {/* Continuous wavy underline ribbon */}
          <path d="M-20 70 Q200 50 400 70 Q600 90 800 70 Q1000 50 1200 70 Q1400 90 1600 70 Q1800 50 2000 70 Q2200 90 2420 70"
                strokeWidth="0.8" opacity="0.4" />
          {/* Pass 1 — 12 glyphs at 100-unit intervals. Y coords trace a
            * sine wave so the row of marks looks like a slow wave rather
            * than a flat line. */}
          <g className="totk-script-pass">
            <use className="totk-script-glyph" href="#r1g1"  x="60"   y="60" />
            <use className="totk-script-glyph" href="#r1g2"  x="160"  y="62" />
            <use className="totk-script-glyph" href="#r1g3"  x="260"  y="64" />
            <use className="totk-script-glyph" href="#r1g4"  x="360"  y="65" />
            <use className="totk-script-glyph" href="#r1g5"  x="460"  y="64" />
            <use className="totk-script-glyph" href="#r1g6"  x="560"  y="62" />
            <use className="totk-script-glyph" href="#r1g7"  x="660"  y="60" />
            <use className="totk-script-glyph" href="#r1g8"  x="760"  y="58" />
            <use className="totk-script-glyph" href="#r1g9"  x="860"  y="56" />
            <use className="totk-script-glyph" href="#r1g10" x="960"  y="55" />
            <use className="totk-script-glyph" href="#r1g11" x="1060" y="56" />
            <use className="totk-script-glyph" href="#r1g12" x="1160" y="58" />
            {/* Malice wisps drifting along the ribbon path */}
            <use className="totk-malice-wisp" href="#malice-wisp" x="140" y="58" />
            <use className="totk-malice-wisp" href="#malice-wisp" x="540" y="82" />
            <use className="totk-malice-wisp" href="#malice-wisp" x="900" y="56" />
            <use className="totk-malice-wisp" href="#malice-wisp" x="1100" y="70" />
          </g>
          {/* Pass 2 — same glyphs and wisps shifted by 1200 for the seamless loop */}
          <g className="totk-script-pass" transform="translate(1200 0)">
            <use className="totk-script-glyph" href="#r1g1"  x="60"   y="60" />
            <use className="totk-script-glyph" href="#r1g2"  x="160"  y="62" />
            <use className="totk-script-glyph" href="#r1g3"  x="260"  y="64" />
            <use className="totk-script-glyph" href="#r1g4"  x="360"  y="65" />
            <use className="totk-script-glyph" href="#r1g5"  x="460"  y="64" />
            <use className="totk-script-glyph" href="#r1g6"  x="560"  y="62" />
            <use className="totk-script-glyph" href="#r1g7"  x="660"  y="60" />
            <use className="totk-script-glyph" href="#r1g8"  x="760"  y="58" />
            <use className="totk-script-glyph" href="#r1g9"  x="860"  y="56" />
            <use className="totk-script-glyph" href="#r1g10" x="960"  y="55" />
            <use className="totk-script-glyph" href="#r1g11" x="1060" y="56" />
            <use className="totk-script-glyph" href="#r1g12" x="1160" y="58" />
            <use className="totk-malice-wisp" href="#malice-wisp" x="140" y="58" />
            <use className="totk-malice-wisp" href="#malice-wisp" x="540" y="82" />
            <use className="totk-malice-wisp" href="#malice-wisp" x="900" y="56" />
            <use className="totk-malice-wisp" href="#malice-wisp" x="1100" y="70" />
          </g>
        </g>
      </svg>

      {/* Second ribbon — slightly different glyph set, scrolls the other way */}
      <svg className="totk-depths-script totk-depths-script-2" viewBox="0 0 2400 120" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          {/* 12 distinct glyph definitions for ribbon 2 — different from
            * ribbon 1 so the two scrolling lines never feel like the same
            * alphabet repeated. */}
          <g id="r2g1">
            <circle cx="0" cy="0" r="5" />
            <line x1="-7" y1="-7" x2="7" y2="7" />
            <line x1="-7" y1="7" x2="7" y2="-7" />
          </g>
          <g id="r2g2">
            <line x1="-5" y1="0" x2="5" y2="0" />
            <line x1="0" y1="-5" x2="0" y2="5" />
            <line x1="-4" y1="-4" x2="4" y2="4" />
            <line x1="-4" y1="4" x2="4" y2="-4" />
            <circle cx="12" cy="0" r="2.5" />
          </g>
          <g id="r2g3">
            <path d="M-6 -6 L0 6 L6 -6" />
            <line x1="-6" y1="6" x2="6" y2="6" />
            <circle cx="14" cy="0" r="2" fill="#7ef4ec" stroke="none" />
            <line x1="20" y1="-6" x2="20" y2="6" />
          </g>
          <g id="r2g4">
            <path d="M-5 -5 L5 -5 L5 5 L-5 5 Z" />
            <line x1="-5" y1="-5" x2="5" y2="5" />
            <line x1="-5" y1="5" x2="5" y2="-5" />
            <circle cx="14" cy="0" r="2" />
            <line x1="20" y1="-4" x2="24" y2="4" />
          </g>
          <g id="r2g5">
            <path d="M-6 0 L0 -6 L6 0 L0 6 L-6 0 M-3 0 L3 0" />
            <line x1="12" y1="-4" x2="20" y2="0" />
            <line x1="12" y1="4" x2="20" y2="0" />
          </g>
          <g id="r2g6">
            <circle cx="0" cy="0" r="3" />
            <line x1="0" y1="-8" x2="0" y2="-5" />
            <line x1="0" y1="5" x2="0" y2="8" />
            <line x1="-8" y1="0" x2="-5" y2="0" />
            <line x1="5" y1="0" x2="8" y2="0" />
            <line x1="-5" y1="-5" x2="-3" y2="-3" />
            <line x1="3" y1="3" x2="5" y2="5" />
            <line x1="-5" y1="5" x2="-3" y2="3" />
            <line x1="3" y1="-3" x2="5" y2="-5" />
            <line x1="14" y1="-5" x2="20" y2="-5" />
          </g>
          <g id="r2g7">
            <line x1="-6" y1="-6" x2="-6" y2="6" />
            <line x1="6" y1="-6" x2="6" y2="6" />
            <path d="M-6 -2 Q0 4 6 -2" />
            <circle cx="14" cy="0" r="3" />
            <circle cx="14" cy="0" r="1" fill="#7ef4ec" stroke="none" />
          </g>
          <g id="r2g8">
            <line x1="0" y1="-7" x2="0" y2="7" strokeWidth="2" />
            <line x1="-4" y1="-7" x2="4" y2="-7" />
            <line x1="-3" y1="-3" x2="3" y2="-3" />
            <line x1="-3" y1="3" x2="3" y2="3" />
            <line x1="-4" y1="7" x2="4" y2="7" />
            <circle cx="12" cy="0" r="2.5" />
          </g>
          <g id="r2g9">
            <path d="M-7 0 L0 -7 L7 0 L0 7 Z" />
            <circle cx="0" cy="0" r="2" fill="#7ef4ec" stroke="none" />
            <line x1="14" y1="-6" x2="22" y2="-6" />
            <line x1="14" y1="6" x2="22" y2="6" />
          </g>
          <g id="r2g10">
            <path d="M-5 -7 Q-5 -2 0 -2 Q5 -2 5 3 Q5 7 0 7" />
            <circle cx="14" cy="-2" r="1.4" fill="#7ef4ec" stroke="none" />
            <circle cx="14" cy="2" r="1.4" fill="#7ef4ec" stroke="none" />
            <line x1="20" y1="-5" x2="20" y2="5" />
          </g>
          <g id="r2g11">
            <path d="M-4 -6 L-4 6 M-4 0 L4 0 M4 -6 L4 6" />
            <path d="M12 -6 Q20 0 12 6" />
            <circle cx="26" cy="0" r="2.5" />
          </g>
          <g id="r2g12">
            <circle cx="0" cy="0" r="6" />
            <line x1="-6" y1="0" x2="6" y2="0" />
            <line x1="0" y1="-6" x2="0" y2="6" />
            <line x1="14" y1="-5" x2="22" y2="5" />
            <line x1="22" y1="-5" x2="14" y2="5" />
          </g>
          {/* Wisp orb in ribbon 2's teal palette (defs are scoped per-SVG
            * so we define it again here). */}
          <g id="malice-wisp-2">
            <circle cx="0" cy="0" r="11" fill="rgba(126, 244, 236, 0.22)" stroke="none" />
            <circle cx="0" cy="0" r="6"  fill="rgba(126, 244, 236, 0.65)" stroke="none" />
            <circle cx="0" cy="0" r="3"  fill="#7ef4ec" stroke="none" />
            <circle cx="0" cy="0" r="1.2" fill="#ffffff" stroke="none" />
          </g>
        </defs>
        <g fill="none" stroke="#7ef4ec" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M-20 60 Q200 80 400 60 Q600 40 800 60 Q1000 80 1200 60 Q1400 40 1600 60 Q1800 80 2000 60 Q2200 40 2420 60"
                strokeWidth="0.7" opacity="0.35" />
          {/* Pass 1 — 12 glyphs across the first half. Y coords trace the
            * INVERSE sine wave to ribbon 1 so the two ribbons don't move
            * in lockstep. */}
          <g className="totk-script-pass">
            <use className="totk-script-glyph" href="#r2g1"  x="60"   y="60" />
            <use className="totk-script-glyph" href="#r2g2"  x="160"  y="58" />
            <use className="totk-script-glyph" href="#r2g3"  x="260"  y="56" />
            <use className="totk-script-glyph" href="#r2g4"  x="360"  y="55" />
            <use className="totk-script-glyph" href="#r2g5"  x="460"  y="56" />
            <use className="totk-script-glyph" href="#r2g6"  x="560"  y="58" />
            <use className="totk-script-glyph" href="#r2g7"  x="660"  y="60" />
            <use className="totk-script-glyph" href="#r2g8"  x="760"  y="62" />
            <use className="totk-script-glyph" href="#r2g9"  x="860"  y="64" />
            <use className="totk-script-glyph" href="#r2g10" x="960"  y="65" />
            <use className="totk-script-glyph" href="#r2g11" x="1060" y="64" />
            <use className="totk-script-glyph" href="#r2g12" x="1160" y="62" />
            {/* Malice wisps drifting along the ribbon path */}
            <use className="totk-malice-wisp" href="#malice-wisp-2" x="220" y="74" />
            <use className="totk-malice-wisp" href="#malice-wisp-2" x="600" y="44" />
            <use className="totk-malice-wisp" href="#malice-wisp-2" x="980" y="70" />
          </g>
          {/* Pass 2 — duplicate set shifted by 1200 for the seamless loop */}
          <g className="totk-script-pass" transform="translate(1200 0)">
            <use className="totk-script-glyph" href="#r2g1"  x="60"   y="60" />
            <use className="totk-script-glyph" href="#r2g2"  x="160"  y="58" />
            <use className="totk-script-glyph" href="#r2g3"  x="260"  y="56" />
            <use className="totk-script-glyph" href="#r2g4"  x="360"  y="55" />
            <use className="totk-script-glyph" href="#r2g5"  x="460"  y="56" />
            <use className="totk-script-glyph" href="#r2g6"  x="560"  y="58" />
            <use className="totk-script-glyph" href="#r2g7"  x="660"  y="60" />
            <use className="totk-script-glyph" href="#r2g8"  x="760"  y="62" />
            <use className="totk-script-glyph" href="#r2g9"  x="860"  y="64" />
            <use className="totk-script-glyph" href="#r2g10" x="960"  y="65" />
            <use className="totk-script-glyph" href="#r2g11" x="1060" y="64" />
            <use className="totk-script-glyph" href="#r2g12" x="1160" y="62" />
            <use className="totk-malice-wisp" href="#malice-wisp-2" x="220" y="74" />
            <use className="totk-malice-wisp" href="#malice-wisp-2" x="600" y="44" />
            <use className="totk-malice-wisp" href="#malice-wisp-2" x="980" y="70" />
          </g>
        </g>
      </svg>

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

      {/* Gloom Hands — spindly skeletal arms rising out of the Gloom pool,
        * fingers grasping upward. Each hand sways on its own slow cadence. */}
      <svg className="totk-depths-gloom-hands" viewBox="0 0 700 260" preserveAspectRatio="none" aria-hidden="true">
        {/* Hand 1 — tall, left side */}
        <g className="totk-gloom-hand totk-gloom-hand-1">
          {/* Forearm */}
          <path d="M86 260 Q82 220 84 180 Q86 150 90 124"
                stroke="rgba(8, 4, 8, 0.97)" strokeWidth="7" strokeLinecap="round" fill="none" />
          {/* Palm */}
          <ellipse cx="90" cy="120" rx="9" ry="8" fill="rgba(8, 4, 8, 0.97)" />
          {/* Fingers fanning up */}
          <g stroke="rgba(8, 4, 8, 0.97)" strokeWidth="3.5" strokeLinecap="round" fill="none">
            <path d="M82 116 Q76 96 70 80" />
            <path d="M88 112 Q86 88 84 70" />
            <path d="M94 112 Q98 88 102 70" />
            <path d="M100 116 Q108 100 116 88" />
            {/* Thumb curving out */}
            <path d="M82 124 Q70 122 62 118" />
          </g>
          {/* Claw tips */}
          <g fill="rgba(8, 4, 8, 0.97)">
            <circle cx="70" cy="80" r="1.6" />
            <circle cx="84" cy="70" r="1.6" />
            <circle cx="102" cy="70" r="1.6" />
            <circle cx="116" cy="88" r="1.6" />
          </g>
          {/* Red wrist glow */}
          <circle cx="90" cy="138" r="2.5" fill="#ff3a3a" />
        </g>

        {/* Hand 2 — medium, between left and centre */}
        <g className="totk-gloom-hand totk-gloom-hand-2">
          <path d="M210 260 Q206 226 208 192 Q212 168 216 148"
                stroke="rgba(8, 4, 8, 0.97)" strokeWidth="6" strokeLinecap="round" fill="none" />
          <ellipse cx="216" cy="144" rx="8" ry="7" fill="rgba(8, 4, 8, 0.97)" />
          <g stroke="rgba(8, 4, 8, 0.97)" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M210 140 Q204 122 200 108" />
            <path d="M214 138 Q212 116 212 100" />
            <path d="M220 138 Q224 116 228 100" />
            <path d="M224 142 Q232 128 238 118" />
            <path d="M208 148 Q198 144 192 140" />
          </g>
          <g fill="rgba(8, 4, 8, 0.97)">
            <circle cx="200" cy="108" r="1.4" />
            <circle cx="212" cy="100" r="1.4" />
            <circle cx="228" cy="100" r="1.4" />
            <circle cx="238" cy="118" r="1.4" />
          </g>
        </g>

        {/* Hand 3 — tallest, near centre */}
        <g className="totk-gloom-hand totk-gloom-hand-3">
          <path d="M348 260 Q342 212 346 162 Q350 124 356 100"
                stroke="rgba(8, 4, 8, 0.97)" strokeWidth="8" strokeLinecap="round" fill="none" />
          <ellipse cx="356" cy="96" rx="10" ry="9" fill="rgba(8, 4, 8, 0.97)" />
          <g stroke="rgba(8, 4, 8, 0.97)" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M348 92 Q342 68 336 50" />
            <path d="M354 90 Q352 62 350 42" />
            <path d="M360 88 Q364 60 368 38" />
            <path d="M366 92 Q374 70 384 58" />
            <path d="M346 100 Q334 96 326 92" />
          </g>
          <g fill="rgba(8, 4, 8, 0.97)">
            <circle cx="336" cy="50" r="1.8" />
            <circle cx="350" cy="42" r="1.8" />
            <circle cx="368" cy="38" r="1.8" />
            <circle cx="384" cy="58" r="1.8" />
          </g>
          <circle cx="356" cy="116" r="3" fill="#ff3a3a" />
        </g>

        {/* Hand 4 — medium, right of centre */}
        <g className="totk-gloom-hand totk-gloom-hand-4">
          <path d="M482 260 Q478 222 482 188 Q486 162 492 138"
                stroke="rgba(8, 4, 8, 0.97)" strokeWidth="6" strokeLinecap="round" fill="none" />
          <ellipse cx="492" cy="134" rx="8" ry="7" fill="rgba(8, 4, 8, 0.97)" />
          <g stroke="rgba(8, 4, 8, 0.97)" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M486 130 Q480 110 476 94" />
            <path d="M491 128 Q488 104 487 88" />
            <path d="M497 128 Q502 104 506 86" />
            <path d="M502 132 Q510 116 518 106" />
            <path d="M484 138 Q472 134 466 130" />
          </g>
          <g fill="rgba(8, 4, 8, 0.97)">
            <circle cx="476" cy="94" r="1.4" />
            <circle cx="487" cy="88" r="1.4" />
            <circle cx="506" cy="86" r="1.4" />
            <circle cx="518" cy="106" r="1.4" />
          </g>
          <circle cx="492" cy="150" r="2.4" fill="#ff3a3a" />
        </g>

        {/* Hand 5 — short, far right */}
        <g className="totk-gloom-hand totk-gloom-hand-5">
          <path d="M620 260 Q616 232 618 200 Q622 178 626 160"
                stroke="rgba(8, 4, 8, 0.97)" strokeWidth="5" strokeLinecap="round" fill="none" />
          <ellipse cx="626" cy="156" rx="7" ry="6" fill="rgba(8, 4, 8, 0.97)" />
          <g stroke="rgba(8, 4, 8, 0.97)" strokeWidth="2.5" strokeLinecap="round" fill="none">
            <path d="M620 152 Q616 134 612 122" />
            <path d="M624 150 Q623 130 622 116" />
            <path d="M630 150 Q633 130 636 116" />
            <path d="M634 154 Q640 142 644 134" />
            <path d="M620 158 Q610 154 604 150" />
          </g>
          <g fill="rgba(8, 4, 8, 0.97)">
            <circle cx="612" cy="122" r="1.3" />
            <circle cx="622" cy="116" r="1.3" />
            <circle cx="636" cy="116" r="1.3" />
            <circle cx="644" cy="134" r="1.3" />
          </g>
        </g>
      </svg>

      {/* Silver Lynel patrolling the cavern floor. Walks right→left, pivots
       * (scaleX squeeze through 0), then walks left→right; small walking
       * bob layered via a custom prop so it stacks with the patrol flip. */}
      <img className="totk-depths-lynel" src="/assets/img/game-franchise/legend-of-zelda/botw/audio-scene/botw-white-lynel.png" alt="" />

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
