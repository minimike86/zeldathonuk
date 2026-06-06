/**
 * Tears of the Kingdom scene — a dawn-lit Hyrule sky with multiple Zonai
 * sky islands at different depths, a distant uplifted castle wreathed in
 * teal energy, Death Mountain belching smoke far back, and a golden
 * Light Dragon ribbon arcing across the sky. Atmospheric haze ties it
 * all together; small glowing motes drift through the air.
 */
export function TotkScene() {
  return (
    <div className="totk-scene" aria-hidden="true">
      {/* Far mountain silhouettes (Hyrule horizon) */}
      <svg className="totk-mountains-far" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 200 L80 160 L160 175 L260 130 L340 165 L420 120
             L520 155 L600 125 L700 100 L780 145 L860 120 L960 160
             L1060 140 L1200 200 Z"
          fill="rgba(40, 60, 86, 0.92)"
        />
      </svg>

      {/* Death Mountain — tall central peak with rising smoke */}
      <svg className="totk-deathmountain" viewBox="0 0 320 240" aria-hidden="true">
        {/* base silhouette */}
        <path
          d="M0 240 L70 165 L120 110 L150 75 L165 60 L185 80 L210 115
             L245 150 L290 195 L320 240 Z"
          fill="rgba(38, 28, 48, 0.95)"
        />
        {/* sunlit crest, warmer dawn tone */}
        <path
          d="M150 75 L165 60 L185 80 L210 115 L196 120 L170 90 Z"
          fill="rgba(70, 50, 70, 0.85)"
        />
        {/* glowing caldera */}
        <ellipse cx="170" cy="62" rx="8" ry="2.5" fill="#ff8a3a" opacity="0.85" />
        {/* smoke plume */}
        <g className="totk-smoke">
          <ellipse cx="172" cy="46" rx="14" ry="7" fill="rgba(180, 170, 180, 0.45)" />
          <ellipse cx="176" cy="30" rx="18" ry="9" fill="rgba(200, 190, 200, 0.32)" />
          <ellipse cx="170" cy="12" rx="22" ry="11" fill="rgba(220, 210, 220, 0.2)" />
        </g>
      </svg>

      {/* Hyrule Castle, only slightly lifted off the ground and heavily
        * engulfed by Gloom. The castle sits low in the scene, with a wide
        * pool of red-black Malice spreading from beneath it, glowing red
        * eyes scattered through the goo, and dark tendrils licking up its
        * walls. A small visible gap underneath shows it's hovering. */}
      <svg className="totk-castle" viewBox="0 0 360 300" aria-hidden="true">
        {/* Wide Gloom pool spreading along the ground beneath the castle */}
        <ellipse cx="180" cy="270" rx="180" ry="22" fill="rgba(18, 4, 8, 0.85)" />
        <ellipse cx="180" cy="272" rx="148" ry="14" fill="rgba(48, 8, 18, 0.95)" />
        <ellipse cx="180" cy="274" rx="116" ry="8"  fill="rgba(86, 12, 26, 0.95)" />

        {/* Red ambient glow rising off the Gloom pool — the haze of corruption */}
        <ellipse cx="180" cy="240" rx="170" ry="44" fill="#b8203a" opacity="0.18" />
        <ellipse cx="180" cy="235" rx="120" ry="30" fill="#d8243a" opacity="0.20" />

        {/* Bedrock chunk torn slightly off the ground — the castle is lifted
          * just barely off the cliff. Sits above the gloom pool. */}
        <path
          d="M50 226 Q120 244 180 242 Q252 240 310 226
             L296 244 Q230 256 180 256 Q126 256 64 244 Z"
          fill="rgba(42, 30, 26, 0.96)"
        />
        <path
          d="M50 226 Q120 242 180 240 Q252 238 310 226"
          fill="none"
          stroke="rgba(80, 58, 48, 0.95)"
          strokeWidth="1.5"
        />
        {/* A few crumbling fragments hanging just under the bedrock */}
        <g fill="rgba(28, 20, 18, 0.95)">
          <path d="M82 248 L74 264 L94 250 Z" />
          <path d="M152 252 L146 268 L162 252 Z" />
          <path d="M226 250 L218 266 L238 252 Z" />
          <path d="M288 246 L282 262 L298 248 Z" />
        </g>

        {/* Outer wall */}
        <path
          d="M70 224 L70 174 L100 162 L100 138 L136 130 L136 112 L168 100
             L168 82 L188 70 L208 82 L208 100 L240 112 L240 130 L276 138
             L276 162 L306 174 L306 224 Z"
          fill="rgba(26, 16, 22, 0.98)"
        />
        {/* Central keep + spire */}
        <path
          d="M162 114 L162 74 L178 64 L198 64 L214 74 L214 114 Z"
          fill="rgba(18, 10, 16, 0.98)"
        />
        <path d="M184 64 L190 48 L196 64 Z" fill="rgba(18, 10, 16, 0.98)" />

        {/* Battlements along the wall top */}
        <g fill="rgba(18, 10, 16, 0.98)">
          <rect x="74"  y="168" width="6" height="6" />
          <rect x="86"  y="168" width="6" height="6" />
          <rect x="270" y="168" width="6" height="6" />
          <rect x="282" y="168" width="6" height="6" />
        </g>

        {/* Sickly Malice-red glow in the windows — the castle's corruption */}
        <rect x="184" y="84"  width="6" height="12" fill="#ff3a3a" opacity="0.9" />
        <rect x="122" y="152" width="6" height="12" fill="#ff3a3a" opacity="0.7" />
        <rect x="248" y="152" width="6" height="12" fill="#ff3a3a" opacity="0.7" />
        <rect x="176" y="144" width="6" height="12" fill="#ff3a3a" opacity="0.85" />

        {/* Gloom tendrils oozing up the walls and around the base */}
        <g stroke="rgba(40, 6, 14, 0.95)" strokeWidth="3" fill="none" strokeLinecap="round">
          <path d="M58 244 Q58 220 78 232 Q92 244 76 224" />
          <path d="M118 246 Q120 218 138 234 Q146 248 130 220" />
          <path d="M222 246 Q220 218 238 234 Q246 248 230 218" />
          <path d="M286 244 Q288 220 308 232 Q322 246 304 224" />
        </g>
        {/* Brighter red glow on the tendril edges */}
        <g stroke="rgba(216, 36, 58, 0.85)" strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M58 244 Q58 220 78 232 Q92 244 76 224" />
          <path d="M118 246 Q120 218 138 234 Q146 248 130 220" />
          <path d="M222 246 Q220 218 238 234 Q246 248 230 218" />
          <path d="M286 244 Q288 220 308 232 Q322 246 304 224" />
        </g>

        {/* Eyes of Malice scattered through the Gloom pool */}
        <g>
          <circle cx="70"  cy="270" r="4"   fill="#ff3a3a" />
          <circle cx="70"  cy="270" r="1.5" fill="#1a0408" />

          <circle cx="120" cy="276" r="3"   fill="#ff3a3a" />
          <circle cx="120" cy="276" r="1.2" fill="#1a0408" />

          <circle cx="178" cy="272" r="4.5" fill="#ff3a3a" />
          <circle cx="178" cy="272" r="1.6" fill="#1a0408" />

          <circle cx="234" cy="276" r="3"   fill="#ff3a3a" />
          <circle cx="234" cy="276" r="1.2" fill="#1a0408" />

          <circle cx="294" cy="270" r="3.5" fill="#ff3a3a" />
          <circle cx="294" cy="270" r="1.3" fill="#1a0408" />
        </g>

        {/* A few drifting embers / motes of corruption rising from the pool */}
        <g fill="rgba(255, 80, 80, 0.7)" className="totk-gloom-embers">
          <circle cx="90"  cy="248" r="1.4" />
          <circle cx="160" cy="240" r="1.2" />
          <circle cx="216" cy="246" r="1.4" />
          <circle cx="270" cy="240" r="1.2" />
        </g>
      </svg>

      {/* Light Dragon — golden serpentine ribbon arcing across the sky */}
      <svg className="totk-dragon" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <defs>
          <linearGradient id="totk-dragon-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"  stopColor="#ffd24a" stopOpacity="0" />
            <stop offset="20%" stopColor="#ffe28a" stopOpacity="0.85" />
            <stop offset="55%" stopColor="#fff7c8" stopOpacity="1" />
            <stop offset="85%" stopColor="#ffd24a" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#ffaa3a" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Glow under-stroke */}
        <path
          className="totk-dragon-glow"
          d="M-40 180 Q200 80 460 130 Q720 200 940 80 Q1100 20 1240 70"
          stroke="rgba(255, 220, 130, 0.55)"
          strokeWidth="22"
          fill="none"
          strokeLinecap="round"
        />
        {/* Main ribbon */}
        <path
          className="totk-dragon-ribbon"
          d="M-40 180 Q200 80 460 130 Q720 200 940 80 Q1100 20 1240 70"
          stroke="url(#totk-dragon-grad)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        {/* Sparkle accents along the body */}
        <g className="totk-dragon-sparks" fill="#fff7c8">
          <circle cx="220" cy="110" r="1.8" />
          <circle cx="380" cy="125" r="1.4" />
          <circle cx="540" cy="155" r="1.6" />
          <circle cx="720" cy="170" r="1.4" />
          <circle cx="880" cy="120" r="1.8" />
          <circle cx="1020" cy="55" r="1.4" />
        </g>
      </svg>

      {/* Atmospheric haze across the middle of the scene */}
      <div className="totk-fog" />

      {/* Drifting Zonai energy motes — small glowing teal/gold particles */}
      <div className="totk-motes" />

      {/* Large central sky island — multi-layered rock, varied grass, a Zonai
        * ruin arch, a couple of trees, a small waterfall cascading off the
        * left edge, and irregular hanging rock chunks of mixed sizes. */}
      <svg className="totk-island totk-island-large" viewBox="0 0 620 260" aria-hidden="true">
        {/* Hanging rock chunks — varied sizes & shadows, drawn first */}
        <g fill="rgba(28, 20, 18, 0.94)">
          <path d="M86 178 L70 226 L102 182 Z" />
          <path d="M154 188 L138 244 L168 192 Z" />
          <path d="M218 198 L208 250 L236 202 Z" />
          <path d="M298 204 L286 254 L318 208 Z" />
          <path d="M376 198 L366 244 L398 200 Z" />
          <path d="M448 188 L432 234 L468 192 Z" />
          <path d="M520 178 L508 224 L540 180 Z" />
        </g>
        {/* Small floating debris flakes below */}
        <g fill="rgba(46, 34, 30, 0.85)">
          <path d="M110 248 L106 256 L118 250 Z" />
          <path d="M260 256 L256 260 L268 256 Z" />
          <path d="M400 254 L394 260 L410 256 Z" />
          <path d="M484 250 L478 256 L496 252 Z" />
        </g>

        {/* Waterfall cascading off the left edge — tapering body, animated
          * highlight streaks that scroll downward to sell falling motion,
          * stray droplets, and a wider fuzzy mist cloud at the bottom. */}
        <g className="totk-waterfall">
          {/* Outer body — slightly wider, semi-transparent, tapers as it falls */}
          <path
            d="M44 148 L60 148 L66 196 L62 224 L40 224 L36 196 Z"
            fill="rgba(150, 210, 235, 0.5)"
          />
          {/* Inner brighter stream */}
          <path
            d="M48 148 L56 148 L60 196 L57 222 L45 222 L42 196 Z"
            fill="rgba(220, 244, 252, 0.75)"
          />
          {/* Bright core */}
          <path
            d="M50 148 L54 148 L55 220 L49 220 Z"
            fill="rgba(255, 255, 255, 0.85)"
          />

          {/* Animated highlight streaks — dashed lines that scroll downward
            * to read as falling water */}
          <line
            className="totk-waterfall-stream"
            x1="49" y1="148" x2="51" y2="222"
            stroke="rgba(255, 255, 255, 0.9)" strokeWidth="1"
            strokeDasharray="10 6" strokeLinecap="round"
          />
          <line
            className="totk-waterfall-stream totk-waterfall-stream-2"
            x1="53" y1="148" x2="55" y2="222"
            stroke="rgba(230, 248, 255, 0.7)" strokeWidth="0.8"
            strokeDasharray="6 10" strokeLinecap="round"
          />
          <line
            className="totk-waterfall-stream totk-waterfall-stream-3"
            x1="46" y1="148" x2="48" y2="222"
            stroke="rgba(200, 232, 246, 0.55)" strokeWidth="0.6"
            strokeDasharray="4 8" strokeLinecap="round"
          />

          {/* Mist cloud at the base — multiple overlapping ellipses for a
            * soft fluffy edge */}
          <ellipse cx="50" cy="226" rx="22" ry="6" fill="rgba(220, 240, 250, 0.55)" />
          <ellipse cx="46" cy="222" rx="16" ry="5" fill="rgba(235, 248, 255, 0.65)" />
          <ellipse cx="56" cy="228" rx="12" ry="4" fill="rgba(255, 255, 255, 0.5)" />
          <ellipse cx="42" cy="230" rx="9"  ry="3" fill="rgba(220, 240, 250, 0.45)" />

          {/* Stray droplets falling beneath the mist */}
          <g className="totk-waterfall-drops">
            <circle cx="48" cy="236" r="1.5" fill="rgba(220, 240, 250, 0.85)" />
            <circle cx="56" cy="240" r="1.2" fill="rgba(200, 230, 245, 0.7)" />
            <circle cx="42" cy="246" r="1"   fill="rgba(180, 220, 240, 0.6)" />
            <circle cx="52" cy="250" r="0.9" fill="rgba(180, 220, 240, 0.5)" />
          </g>
        </g>

        {/* Main rocky body — two-tone with darker lower band */}
        <path
          d="M10 140 Q48 80 130 64 Q230 46 360 56 Q470 66 540 86
             Q590 100 608 140 L588 188 Q500 212 380 208 Q240 214 110 198
             Q48 186 10 158 Z"
          fill="rgba(90, 64, 48, 0.97)"
        />
        <path
          d="M10 158 Q90 188 220 200 Q360 212 480 202 Q570 194 608 178
             L588 188 Q500 212 380 208 Q240 214 110 198 Q48 186 10 158 Z"
          fill="rgba(40, 26, 22, 0.65)"
        />
        {/* Rock striations */}
        <path
          d="M50 168 Q160 178 280 180 Q420 184 560 174"
          stroke="rgba(54, 38, 30, 0.8)" strokeWidth="1.2" fill="none"
        />

        {/* Grass crest — thick top with bumpy outline */}
        <path
          d="M16 140 Q42 88 100 76 Q160 60 220 64 Q280 56 340 60 Q420 56
             480 70 Q540 84 600 140 L588 154 Q500 124 380 116 Q240 110
             120 124 Q60 132 18 152 Z"
          fill="rgba(74, 130, 60, 0.97)"
        />
        {/* Grass highlight band */}
        <path
          d="M44 130 Q120 90 230 80 Q340 74 440 92 Q520 106 568 132
             L556 140 Q480 114 360 108 Q240 108 140 122 Q90 130 52 138 Z"
          fill="rgba(122, 184, 88, 0.85)"
        />
        {/* Tiny grass blade flecks along the upper edge */}
        <g stroke="rgba(160, 220, 110, 0.85)" strokeWidth="1.4" strokeLinecap="round">
          <line x1="76"  y1="92"  x2="78"  y2="84" />
          <line x1="138" y1="78"  x2="142" y2="68" />
          <line x1="210" y1="68"  x2="214" y2="58" />
          <line x1="276" y1="62"  x2="280" y2="52" />
          <line x1="346" y1="62"  x2="350" y2="52" />
          <line x1="424" y1="66"  x2="428" y2="56" />
          <line x1="500" y1="78"  x2="504" y2="68" />
        </g>

        {/* Zonai ruin arch — two columns with a horizontal beam, glowing nodes */}
        <g>
          {/* Left column */}
          <rect x="296" y="60" width="14" height="48" fill="rgba(32, 26, 42, 0.96)" />
          <rect x="294" y="56" width="18" height="6"  fill="rgba(20, 16, 30, 0.98)" />
          {/* Right column */}
          <rect x="344" y="60" width="14" height="48" fill="rgba(32, 26, 42, 0.96)" />
          <rect x="342" y="56" width="18" height="6"  fill="rgba(20, 16, 30, 0.98)" />
          {/* Lintel */}
          <rect x="290" y="46" width="78" height="10" fill="rgba(32, 26, 42, 0.96)" />
          <rect x="290" y="44" width="78" height="3"  fill="rgba(20, 16, 30, 0.98)" />
          {/* Zonai glyph slot in the lintel */}
          <rect x="324" y="48" width="10" height="6" fill="#5ad6c6" opacity="0.95" />
          {/* Glowing nodes on the columns */}
          <rect x="300" y="74" width="6" height="6" fill="#8aeb88" opacity="0.95" />
          <rect x="348" y="84" width="6" height="6" fill="#8aeb88" opacity="0.95" />
        </g>

        {/* Twin pine-style tree silhouettes */}
        <g className="totk-tree" fill="rgba(20, 14, 10, 0.96)">
          {/* Left tree */}
          <rect x="166" y="92" width="3" height="22" />
          <path d="M167 96 L156 108 L178 108 Z" />
          <path d="M167 90 L158 100 L176 100 Z" />
          <path d="M167 84 L160 92 L174 92 Z" />
          {/* Right tree (smaller) */}
          <rect x="446" y="98" width="3" height="20" />
          <path d="M447 102 L438 112 L456 112 Z" />
          <path d="M447 96 L440 104 L454 104 Z" />
        </g>
        {/* Tiny rock cluster on the right shoulder */}
        <g fill="rgba(46, 32, 26, 0.95)">
          <ellipse cx="510" cy="104" rx="9" ry="4" />
          <ellipse cx="516" cy="100" rx="5" ry="3" />
        </g>
      </svg>

      {/* Mid-size sky island — flatter and more horizontal, with broken
        * Zonai pillars on top suggesting ancient ruins. */}
      <svg className="totk-island totk-island-mid" viewBox="0 0 460 180" aria-hidden="true">
        {/* Hanging rocks */}
        <g fill="rgba(28, 20, 18, 0.92)">
          <path d="M90 120 L74 162 L106 124 Z" />
          <path d="M180 130 L166 170 L198 134 Z" />
          <path d="M270 132 L256 172 L286 134 Z" />
          <path d="M360 122 L346 162 L376 124 Z" />
        </g>
        {/* Trailing debris */}
        <g fill="rgba(46, 34, 30, 0.85)">
          <path d="M134 168 L130 174 L142 168 Z" />
          <path d="M310 174 L306 178 L318 174 Z" />
        </g>

        {/* Main rocky body — flatter shape */}
        <path
          d="M16 88 Q56 48 140 40 Q240 30 330 44 Q400 56 444 88
             L426 124 Q360 138 240 138 Q120 138 50 124 Q22 116 16 100 Z"
          fill="rgba(80, 58, 44, 0.96)"
        />
        <path
          d="M16 100 Q90 124 220 134 Q340 138 444 116 L426 124
             Q360 138 240 138 Q120 138 50 124 Q22 116 16 100 Z"
          fill="rgba(40, 26, 22, 0.6)"
        />

        {/* Top grass */}
        <path
          d="M20 90 Q60 52 140 44 Q240 34 330 48 Q400 60 440 90
             L432 100 Q360 76 240 70 Q130 72 56 90 Q30 96 20 96 Z"
          fill="rgba(74, 130, 60, 0.97)"
        />
        <path
          d="M44 84 Q120 60 220 56 Q310 56 380 72 Q412 80 420 90
             L412 94 Q350 76 240 72 Q140 74 80 86 Q60 90 48 88 Z"
          fill="rgba(122, 184, 88, 0.85)"
        />

        {/* Broken Zonai pillars — two intact, one collapsed */}
        <g fill="rgba(38, 30, 50, 0.95)">
          {/* Intact pillar 1 */}
          <rect x="146" y="44" width="12" height="42" />
          <rect x="143" y="40" width="18" height="5" />
          {/* Intact pillar 2 (shorter, broken at top) */}
          <rect x="194" y="56" width="12" height="30" />
          <path d="M194 56 L206 56 L210 50 L196 52 Z" />
          {/* Toppled pillar piece on the ground */}
          <rect x="246" y="80" width="34" height="8" />
          <rect x="280" y="80" width="6"  height="8" />
        </g>
        {/* Zonai glow nodes on the intact pillars */}
        <rect x="148" y="56" width="6" height="6" fill="#5ad6c6" opacity="0.95" />
        <rect x="196" y="64" width="6" height="6" fill="#8aeb88" opacity="0.9" />

        {/* Small bush on the right end */}
        <g fill="rgba(58, 100, 50, 0.95)">
          <ellipse cx="372" cy="74" rx="14" ry="6" />
          <ellipse cx="380" cy="68" rx="8"  ry="4" />
        </g>
      </svg>

      {/* Small top-right island — more angular and jagged, ending in a
        * pointed undersurface. Has a single standing stone / Zonai sentinel. */}
      <svg className="totk-island totk-island-small" viewBox="0 0 280 140" aria-hidden="true">
        {/* Pointed pendant shape under the island */}
        <path
          d="M44 70 L266 70 L240 100 L180 116 L140 124 L100 116 L60 100 Z"
          fill="rgba(70, 50, 40, 0.95)"
        />
        {/* Sharper tip extension */}
        <path
          d="M120 122 L140 138 L160 122 Z"
          fill="rgba(36, 24, 20, 0.95)"
        />
        {/* Body shading */}
        <path
          d="M44 70 L266 70 L240 100 L180 116 L140 124 L100 116 L60 100 Z"
          fill="rgba(34, 22, 18, 0.45)"
        />

        {/* Top body */}
        <path
          d="M30 56 Q66 26 130 22 Q198 18 252 32 Q272 38 274 60
             L266 72 Q200 80 140 78 Q72 80 36 70 Q22 64 30 60 Z"
          fill="rgba(82, 58, 44, 0.96)"
        />
        {/* Grass cap */}
        <path
          d="M34 56 Q66 28 130 24 Q198 20 250 34 Q270 40 272 58
             L264 64 Q210 48 140 46 Q70 50 38 60 Q26 60 34 58 Z"
          fill="rgba(74, 130, 60, 0.97)"
        />
        <path
          d="M50 50 Q110 32 180 32 Q230 34 256 48 L250 56
             Q210 44 150 44 Q90 48 60 54 Q44 56 50 54 Z"
          fill="rgba(122, 184, 88, 0.85)"
        />

        {/* Standing Zonai sentinel stone */}
        <g>
          <rect x="140" y="22" width="10" height="30" fill="rgba(36, 28, 46, 0.96)" />
          <rect x="138" y="20" width="14" height="4" fill="rgba(22, 16, 30, 0.98)" />
          <rect x="142" y="32" width="6" height="6" fill="#5ad6c6" opacity="0.95" />
        </g>
        {/* Sparse grass blade */}
        <line x1="80" y1="38" x2="82" y2="30" stroke="rgba(160, 220, 110, 0.85)" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="206" y1="38" x2="208" y2="30" stroke="rgba(160, 220, 110, 0.85)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>

      {/* Castle remnants on the ground directly below the floating castle —
        * the ruined foundation that was left behind when the castle was
        * uplifted. Broken outer walls, a snapped-off spire stump, scattered
        * rubble, and Gloom seeping out of the cracks. Sits just under the
        * hovering castle so the gap reads as the levitation distance. */}
      <svg className="totk-castle-remnants" viewBox="0 0 360 130" aria-hidden="true">
        {/* Wide Gloom puddle around the foundation */}
        <ellipse cx="180" cy="118" rx="170" ry="10" fill="rgba(18, 4, 8, 0.85)" />
        <ellipse cx="180" cy="120" rx="138" ry="6"  fill="rgba(48, 8, 18, 0.95)" />

        {/* Broken outer wall — left fragment, battlements snapped off */}
        <path
          d="M16 116 L16 70 L42 60 L42 78 L66 78 L66 50 L88 50
             L88 88 L108 88 L108 116 Z"
          fill="rgba(22, 14, 20, 0.98)"
        />
        {/* Jagged top edge highlight */}
        <path
          d="M16 70 L26 64 L42 60 L42 78 L52 76 L66 78 L66 50 L74 46 L88 50
             L88 88 L96 86 L108 88"
          fill="none" stroke="rgba(40, 8, 18, 0.85)" strokeWidth="1.4"
        />

        {/* Centre spire stump — only the lower section remains */}
        <path
          d="M148 116 L148 40 L154 32 L168 28 L182 28 L196 32 L202 40 L202 116 Z"
          fill="rgba(18, 10, 16, 0.98)"
        />
        {/* Crack across the broken top of the stump */}
        <path
          d="M148 52 L162 46 L178 50 L188 42 L202 48"
          stroke="rgba(40, 8, 18, 0.95)" strokeWidth="2" fill="none"
        />
        <path
          d="M148 52 L162 46 L178 50 L188 42 L202 48"
          stroke="rgba(216, 36, 58, 0.65)" strokeWidth="0.8" fill="none"
        />
        {/* Lit window glow on the spire stump */}
        <rect x="170" y="68" width="6" height="10" fill="#ff3a3a" opacity="0.85" />

        {/* Right side: collapsed wall section with stepped ruin profile */}
        <path
          d="M232 116 L232 86 L252 80 L252 64 L274 64 L274 88 L302 88
             L302 70 L330 64 L330 116 Z"
          fill="rgba(22, 14, 20, 0.98)"
        />
        <path
          d="M232 86 L252 80 L252 64 L262 60 L274 64 L274 88 L290 86 L302 88 L302 70 L316 66 L330 64"
          fill="none" stroke="rgba(40, 8, 18, 0.85)" strokeWidth="1.4"
        />

        {/* Scattered stone blocks rolled across the ground */}
        <g fill="rgba(28, 18, 24, 0.96)">
          <rect x="118" y="100" width="14" height="12" />
          <rect x="136" y="106" width="10" height="8" />
          <rect x="212" y="100" width="12" height="14" />
          <rect x="226" y="108" width="8"  height="6" />
          <rect x="338" y="104" width="14" height="10" />
        </g>
        {/* Tiny rubble pebbles */}
        <g fill="rgba(46, 30, 36, 0.85)">
          <circle cx="6"   cy="118" r="2" />
          <circle cx="120" cy="116" r="1.6" />
          <circle cx="198" cy="116" r="1.8" />
          <circle cx="240" cy="118" r="1.6" />
          <circle cx="346" cy="118" r="2" />
        </g>

        {/* Gloom tendrils licking up the surviving walls */}
        <g stroke="rgba(40, 6, 14, 0.95)" strokeWidth="2.4" fill="none" strokeLinecap="round">
          <path d="M30 116 Q34 96 50 102 Q60 110 50 92" />
          <path d="M170 116 Q172 92 184 102 Q192 112 178 88" />
          <path d="M312 116 Q310 96 326 102 Q336 112 322 90" />
        </g>
        <g stroke="rgba(216, 36, 58, 0.8)" strokeWidth="1.1" fill="none" strokeLinecap="round">
          <path d="M30 116 Q34 96 50 102 Q60 110 50 92" />
          <path d="M170 116 Q172 92 184 102 Q192 112 178 88" />
          <path d="M312 116 Q310 96 326 102 Q336 112 322 90" />
        </g>

        {/* Eyes of Malice scattered through the foundation Gloom */}
        <g>
          <circle cx="40"  cy="118" r="3"   fill="#ff3a3a" />
          <circle cx="40"  cy="118" r="1.2" fill="#1a0408" />
          <circle cx="180" cy="120" r="3.5" fill="#ff3a3a" />
          <circle cx="180" cy="120" r="1.4" fill="#1a0408" />
          <circle cx="280" cy="118" r="2.8" fill="#ff3a3a" />
          <circle cx="280" cy="118" r="1.1" fill="#1a0408" />
        </g>
      </svg>

      {/* Foreground rock ledge — the cliff the camera stands on */}
      <svg className="totk-foreground" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 200 L0 130 Q120 100 280 110 Q420 122 580 100 Q740 82 900 110
             Q1060 132 1200 110 L1200 200 Z"
          fill="rgba(20, 14, 18, 1)"
        />
      </svg>
    </div>
  );
}
