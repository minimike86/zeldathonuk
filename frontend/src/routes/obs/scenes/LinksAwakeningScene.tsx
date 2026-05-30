/**
 * Link's Awakening scene — Koholint Island at dawn.
 *
 * Layers back-to-front:
 *   1. Soft pink-and-indigo dawn sky gradient (handled by .la-scene)
 *   2. Drifting starlight motes
 *   3. Soft puffy pink clouds at altitude
 *   4. A great whale-like Wind Fish drifting across the upper sky
 *   5. A tall conical mountain in the mid-back with an oversized egg
 *      perched on the peak, wreathed in a pink dream-halo
 *   6. Lower foothill silhouettes flanking the mountain
 *   7. Calm ocean with a gentle wave line at the horizon
 *   8. Beach silhouette in the foreground
 *   9. Floating sparkles / petals for the dreamlike atmosphere
 *
 * All shapes are original geometric primitives (paths, ellipses, circles).
 */
export function LinksAwakeningScene() {
  return (
    <div className="la-scene" aria-hidden="true">
      {/* Upper-sky starlight motes */}
      <div className="la-stars" />

      {/* Sun glow on the horizon — soft warm radial */}
      <div className="la-sun" />

      {/* Drifting puffy clouds in the upper sky */}
      <svg className="la-clouds" viewBox="0 0 1600 200" preserveAspectRatio="none" aria-hidden="true">
        <g fill="rgba(255, 200, 210, 0.55)">
          <ellipse cx="180"  cy="80"  rx="80" ry="16" />
          <ellipse cx="230"  cy="68"  rx="50" ry="14" />
          <ellipse cx="600"  cy="90"  rx="100" ry="18" />
          <ellipse cx="650"  cy="76"  rx="60"  ry="14" />
          <ellipse cx="1020" cy="70"  rx="90"  ry="16" />
          <ellipse cx="1070" cy="58"  rx="55"  ry="14" />
          <ellipse cx="1400" cy="100" rx="70"  ry="14" />
        </g>
        {/* Brighter cloud highlights */}
        <g fill="rgba(255, 230, 235, 0.85)">
          <ellipse cx="200"  cy="72"  rx="50" ry="6" />
          <ellipse cx="620"  cy="82"  rx="64" ry="7" />
          <ellipse cx="1040" cy="62"  rx="58" ry="6" />
        </g>
      </svg>

      {/* The Wind Fish — artwork supplied by the project owner. Drifts
        * right-to-left across the sky (outer div) while the inner image
        * bobs and tilts gently to suggest turbulent air. */}
      <div className="la-windfish">
        <img className="la-windfish-inner" src="/assets/img/game-franchise/legend-of-zelda/la/audio-scene/windfish-la.png" alt="" />
      </div>

      {/* Mount Tamaranch with the Wind Fish's egg on top */}
      <svg className="la-mountain" viewBox="0 0 500 360" aria-hidden="true">
        {/* Dream halo around the egg */}
        <ellipse cx="250" cy="80" rx="100" ry="80" fill="#ffb5c5" opacity="0.22" />
        <ellipse cx="250" cy="80" rx="62"  ry="50" fill="#ffd5d8" opacity="0.28" />

        {/* Mountain base silhouette — tall conical shape */}
        <path
          d="M0 360
             L60 280 L120 200 L180 130
             L220 80 L250 56 L280 80 L320 130
             L380 200 L440 280 L500 360 Z"
          fill="rgba(20, 36, 64, 0.97)"
        />
        {/* Mountain right-side darker shading */}
        <path
          d="M250 56 L280 80 L320 130 L380 200 L440 280 L500 360 L320 360 Z"
          fill="rgba(8, 16, 36, 0.45)"
        />
        {/* Snow / cloud cover near the peak */}
        <path
          d="M218 90 Q250 80 282 90 Q260 100 220 100 Z"
          fill="rgba(255, 220, 230, 0.8)"
        />
        <path
          d="M204 110 Q240 100 296 110 Q260 122 210 122 Z"
          fill="rgba(255, 220, 230, 0.55)"
        />

        {/* The egg perched on the peak — cream shell with pink spots */}
        <ellipse cx="250" cy="48" rx="26" ry="34" fill="#f6ead2" stroke="#a89878" strokeWidth="1.5" />
        {/* Egg highlight */}
        <ellipse cx="240" cy="36" rx="7" ry="11" fill="rgba(255, 255, 255, 0.7)" />
        {/* Egg shadow band on the right */}
        <path
          d="M256 22 Q272 28 274 50 Q272 70 256 76 Q272 70 270 50 Q272 28 256 22 Z"
          fill="rgba(80, 60, 30, 0.35)"
        />
        {/* Pink spots scattered across the shell — the iconic egg pattern */}
        <g fill="#ff7aa0">
          <ellipse cx="244" cy="30" rx="3.5" ry="3"   />
          <ellipse cx="252" cy="42" rx="4"   ry="3.5" />
          <ellipse cx="240" cy="56" rx="3"   ry="3"   />
          <ellipse cx="256" cy="64" rx="3.5" ry="3"   />
          <ellipse cx="248" cy="74" rx="3"   ry="2.5" />
          <ellipse cx="234" cy="44" rx="2.5" ry="2.5" />
          <ellipse cx="262" cy="32" rx="2.5" ry="2.2" />
          <ellipse cx="262" cy="52" rx="2.8" ry="2.4" />
        </g>
        {/* Brighter pink core on the spots for a 3D wrap-around feel */}
        <g fill="#ffb5c5">
          <circle cx="243" cy="29" r="1.4" />
          <circle cx="251" cy="41" r="1.6" />
          <circle cx="247" cy="73" r="1.2" />
          <circle cx="261" cy="51" r="1.2" />
        </g>

        {/* Bright sparkle points around the egg */}
        <g fill="#ffe898">
          <circle cx="200" cy="34" r="1.6" />
          <circle cx="300" cy="42" r="1.6" />
          <circle cx="226" cy="14" r="1.4" />
          <circle cx="276" cy="20" r="1.4" />
          <circle cx="312" cy="74" r="1.4" />
        </g>
      </svg>

      {/* Lower foothill ridges flanking the mountain */}
      <svg className="la-foothills" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0 200
             L0 130 Q120 80 240 110 Q360 140 480 100
             L520 100
             Q540 100 540 100
             L660 100
             Q780 140 900 100 Q1020 80 1140 120 L1200 110 L1200 200 Z"
          fill="rgba(14, 28, 56, 0.96)"
        />
        {/* Mid-ridge highlight band */}
        <path
          d="M0 130 Q120 80 240 110 Q360 140 480 100"
          fill="none" stroke="rgba(255, 180, 195, 0.4)" strokeWidth="1.6"
        />
        <path
          d="M660 100 Q780 140 900 100 Q1020 80 1140 120"
          fill="none" stroke="rgba(255, 180, 195, 0.4)" strokeWidth="1.6"
        />
      </svg>

      {/* Ocean — calm horizontal band with a gentle wave crest line */}
      <svg className="la-ocean" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0 160 L0 40
             Q80 32 160 40 Q240 48 320 40 Q400 32 480 40 Q560 48 640 40
             Q720 32 800 40 Q880 48 960 40 Q1040 32 1120 40 Q1200 48 1200 40
             L1200 160 Z"
          fill="rgba(18, 50, 88, 0.95)"
        />
        {/* Pink sunset glint along the wave top */}
        <path
          d="M0 40
             Q80 32 160 40 Q240 48 320 40 Q400 32 480 40 Q560 48 640 40
             Q720 32 800 40 Q880 48 960 40 Q1040 32 1120 40 Q1200 48 1200 40"
          fill="none" stroke="rgba(255, 181, 197, 0.55)" strokeWidth="2.4"
        />
        {/* Smaller secondary wave line below */}
        <path
          d="M0 78 Q120 86 240 78 Q360 70 480 78 Q600 86 720 78 Q840 70 960 78 Q1080 86 1200 78"
          fill="none" stroke="rgba(155, 214, 255, 0.4)" strokeWidth="1.4"
        />
        <path
          d="M0 110 Q160 116 320 110 Q480 104 640 110 Q800 116 960 110 Q1120 104 1200 110"
          fill="none" stroke="rgba(155, 214, 255, 0.3)" strokeWidth="1.2"
        />
      </svg>

      {/* Foreground beach silhouette */}
      <svg className="la-beach" viewBox="0 0 1200 100" preserveAspectRatio="none" aria-hidden="true">
        <path
          d="M0 100 L0 40 Q120 28 240 36 Q360 46 480 30 Q600 18 720 32 Q840 46 960 30 Q1080 18 1200 36 L1200 100 Z"
          fill="rgba(10, 16, 32, 0.99)"
        />
        {/* Sand-line shimmer */}
        <path
          d="M0 40 Q120 28 240 36 Q360 46 480 30 Q600 18 720 32 Q840 46 960 30 Q1080 18 1200 36"
          fill="none" stroke="rgba(255, 200, 168, 0.55)" strokeWidth="1.8"
        />
      </svg>

      {/* Floating sparkles / petals for dream-like atmosphere */}
      <div className="la-sparkles" />
    </div>
  );
}
