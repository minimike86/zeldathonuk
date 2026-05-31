/**
 * Ocarina of Time scene — Kokiri Forest at dawn.
 *
 * Layered depth (back-to-front):
 *   1. Sky/canopy gradient (handled by the .oot-scene background)
 *   2. Far tree silhouettes receding into golden mist
 *   3. Great Deku Tree centre-back, with a kindly face
 *   4. Mid trees framing the sides
 *   5. Golden light shafts piercing the canopy
 *   6. The Ocarina of Time floating front-and-centre, with finger
 *      holes, gold trim, and a properly tessellated Triforce engraving
 *   7. Forest floor with grass tufts
 *   8. Drifting fireflies/pollen motes
 *
 * Everything is original inline SVG + CSS using basic geometric primitives
 * (paths, ellipses, circles) — no copyrighted artwork.
 */
export function OcarinaScene() {
  return (
    <div className="oot-scene" aria-hidden="true">
      {/* Warm dawn aura behind the Deku Tree — soft golden bloom */}
      <div className="oot-deku-aura" />

      {/* Drifting horizontal mist bands between the tree layers */}
      <div className="oot-mist" />

      {/* Far tree silhouettes — softest, mistiest layer */}
      <svg className="oot-trees-far" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <g fill="rgba(20, 50, 30, 0.6)">
          {/* Distant fluffy tree clusters */}
          <ellipse cx="80"   cy="200" rx="90"  ry="60" />
          <ellipse cx="220"  cy="190" rx="80"  ry="55" />
          <ellipse cx="380"  cy="200" rx="100" ry="58" />
          <ellipse cx="540"  cy="195" rx="85"  ry="55" />
          <ellipse cx="700"  cy="200" rx="95"  ry="60" />
          <ellipse cx="860"  cy="190" rx="80"  ry="55" />
          <ellipse cx="1020" cy="200" rx="100" ry="58" />
          <ellipse cx="1150" cy="195" rx="85"  ry="55" />
        </g>
        {/* Trunks below the canopy bases */}
        <g fill="rgba(18, 40, 26, 0.85)">
          <rect x="74"   y="220" width="12" height="20" />
          <rect x="214"  y="210" width="12" height="30" />
          <rect x="374"  y="220" width="12" height="20" />
          <rect x="534"  y="215" width="12" height="25" />
          <rect x="694"  y="220" width="12" height="20" />
          <rect x="854"  y="210" width="12" height="30" />
          <rect x="1014" y="220" width="12" height="20" />
        </g>
      </svg>

      {/* The Great Deku Tree — ancient kindly giant with a sleepy face
        * carved into the trunk. Big bushy moss brows and a hanging moss
        * moustache, vines drooping from the canopy, gnarled flared roots. */}
      <svg className="oot-deku" viewBox="0 0 500 400" aria-hidden="true">
        {/* Drop-shadow patch on the ground */}
        <ellipse cx="250" cy="392" rx="190" ry="11" fill="rgba(0, 0, 0, 0.55)" />

        {/* Sprawling canopy — many overlapping puffs for a fluffy weight */}
        <g fill="rgba(12, 38, 20, 0.98)">
          <ellipse cx="250" cy="80"  rx="200" ry="70" />
          <ellipse cx="115" cy="120" rx="100" ry="60" />
          <ellipse cx="385" cy="120" rx="100" ry="60" />
          <ellipse cx="190" cy="56"  rx="90"  ry="42" />
          <ellipse cx="312" cy="52"  rx="92"  ry="44" />
          <ellipse cx="60"  cy="148" rx="60"  ry="36" />
          <ellipse cx="440" cy="148" rx="60"  ry="36" />
        </g>
        {/* Highlight tufts on the canopy (warmer top edge) */}
        <g fill="rgba(46, 100, 56, 0.75)">
          <ellipse cx="190" cy="48"  rx="60" ry="20" />
          <ellipse cx="298" cy="38"  rx="68" ry="22" />
          <ellipse cx="100" cy="108" rx="42" ry="14" />
          <ellipse cx="400" cy="108" rx="44" ry="16" />
        </g>
        {/* Bright sparkle dots on the canopy */}
        <g fill="rgba(180, 230, 140, 0.85)">
          <circle cx="170" cy="42"  r="1.6" />
          <circle cx="248" cy="32"  r="1.6" />
          <circle cx="310" cy="40"  r="1.4" />
          <circle cx="120" cy="100" r="1.4" />
          <circle cx="380" cy="100" r="1.6" />
        </g>

        {/* Hanging vines dropping from beneath the canopy */}
        <g stroke="rgba(36, 80, 38, 0.92)" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M88 158 Q92 200 86 232" />
          <path d="M150 168 Q148 210 154 250" />
          <path d="M412 158 Q408 200 414 232" />
          <path d="M350 168 Q352 210 346 250" />
          <path d="M52 178 Q50 210 56 240" />
          <path d="M448 178 Q450 210 444 240" />
        </g>
        {/* Tiny leaves along the vines */}
        <g fill="rgba(56, 110, 50, 0.95)">
          <ellipse cx="90"  cy="200" rx="3" ry="5" transform="rotate(-20 90 200)" />
          <ellipse cx="152" cy="220" rx="3" ry="5" transform="rotate(15 152 220)" />
          <ellipse cx="410" cy="200" rx="3" ry="5" transform="rotate(20 410 200)" />
          <ellipse cx="348" cy="220" rx="3" ry="5" transform="rotate(-15 348 220)" />
          <ellipse cx="54"  cy="218" rx="3" ry="5" transform="rotate(-20 54 218)" />
          <ellipse cx="446" cy="218" rx="3" ry="5" transform="rotate(20 446 218)" />
        </g>

        {/* Trunk — much wider at the base, gnarled silhouette */}
        <path
          d="M188 140
             Q170 170 154 210
             Q142 250 132 290
             Q122 330 108 380
             L392 380
             Q378 330 368 290
             Q358 250 346 210
             Q330 170 312 140
             Z"
          fill="rgba(58, 38, 22, 0.99)"
        />
        {/* Right-side darker shading */}
        <path
          d="M250 140
             Q284 170 304 210
             Q322 260 348 380
             L392 380
             Q378 330 368 290
             Q358 250 346 210
             Q330 170 312 140
             Z"
          fill="rgba(30, 20, 12, 0.55)"
        />
        {/* Bark cracks */}
        <g stroke="rgba(20, 14, 10, 0.85)" strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M170 200 Q176 240 172 300" />
          <path d="M150 280 Q156 320 150 360" />
          <path d="M226 300 Q230 340 226 372" />
          <path d="M286 290 Q282 330 288 366" />
          <path d="M320 240 Q316 280 322 320" />
        </g>
        {/* Root flares at the base */}
        <g fill="rgba(42, 28, 18, 0.96)">
          <path d="M108 380 L82 396 L138 396 Z" />
          <path d="M158 380 L142 396 L182 396 Z" />
          <path d="M198 380 L186 396 L218 396 Z" />
          <path d="M306 380 L320 396 L290 396 Z" />
          <path d="M340 380 L358 396 L320 396 Z" />
          <path d="M392 380 L420 396 L362 396 Z" />
        </g>

        {/* ============ FACE ============ */}

        {/* Bushy moss brow — wider, fluffier, with leafy ridges */}
        <g fill="rgba(34, 70, 32, 0.99)">
          <ellipse cx="200" cy="184" rx="44" ry="14" />
          <ellipse cx="300" cy="184" rx="44" ry="14" />
          <ellipse cx="170" cy="180" rx="14" ry="8" />
          <ellipse cx="230" cy="186" rx="12" ry="8" />
          <ellipse cx="270" cy="186" rx="12" ry="8" />
          <ellipse cx="330" cy="180" rx="14" ry="8" />
        </g>
        {/* Brow highlights — brighter green tufts on top */}
        <g fill="rgba(70, 130, 60, 0.85)">
          <ellipse cx="186" cy="176" rx="20" ry="5" />
          <ellipse cx="220" cy="178" rx="14" ry="4" />
          <ellipse cx="280" cy="178" rx="14" ry="4" />
          <ellipse cx="314" cy="176" rx="20" ry="5" />
        </g>

        {/* SLEEPY EYES — heavy upper lids drooping over each eye, with a
          * narrow band of warm glow visible underneath. */}
        {/* Left eye socket */}
        <ellipse cx="200" cy="206" rx="18" ry="11" fill="rgba(16, 8, 4, 0.99)" />
        {/* Warm glow band */}
        <path
          d="M184 208 Q200 216 216 208 Q214 213 200 215 Q186 213 184 208 Z"
          fill="#ffd23a"
        />
        <path
          d="M188 210 Q200 215 212 210"
          fill="none" stroke="#fff5b8" strokeWidth="1.5" strokeLinecap="round"
        />
        {/* Heavy upper eyelid */}
        <path
          d="M180 200 Q200 192 220 200 Q220 210 200 210 Q180 210 180 200 Z"
          fill="rgba(50, 32, 20, 0.99)"
        />
        {/* Eyelash crease line */}
        <path d="M183 204 Q200 198 217 204"
              stroke="rgba(20, 12, 6, 0.95)" strokeWidth="1.2" fill="none" />

        {/* Right eye socket — mirrored */}
        <ellipse cx="300" cy="206" rx="18" ry="11" fill="rgba(16, 8, 4, 0.99)" />
        <path
          d="M284 208 Q300 216 316 208 Q314 213 300 215 Q286 213 284 208 Z"
          fill="#ffd23a"
        />
        <path
          d="M288 210 Q300 215 312 210"
          fill="none" stroke="#fff5b8" strokeWidth="1.5" strokeLinecap="round"
        />
        <path
          d="M280 200 Q300 192 320 200 Q320 210 300 210 Q280 210 280 200 Z"
          fill="rgba(50, 32, 20, 0.99)"
        />
        <path d="M283 204 Q300 198 317 204"
              stroke="rgba(20, 12, 6, 0.95)" strokeWidth="1.2" fill="none" />

        {/* Bulbous nose */}
        <path
          d="M236 224 Q250 218 264 224 Q272 234 268 244 Q260 250 250 250 Q240 250 232 244 Q228 234 236 224 Z"
          fill="rgba(32, 20, 14, 0.99)"
        />
        {/* Nose highlight */}
        <ellipse cx="246" cy="228" rx="6" ry="2" fill="rgba(96, 60, 30, 0.6)" />

        {/* Bushy moss moustache hanging below the nose */}
        <g fill="rgba(40, 82, 36, 0.99)">
          <ellipse cx="226" cy="262" rx="28" ry="14" />
          <ellipse cx="274" cy="262" rx="28" ry="14" />
          <ellipse cx="200" cy="266" rx="14" ry="10" />
          <ellipse cx="300" cy="266" rx="14" ry="10" />
          <ellipse cx="250" cy="258" rx="22" ry="10" />
        </g>
        {/* Moustache highlights */}
        <g fill="rgba(74, 130, 58, 0.85)">
          <ellipse cx="218" cy="256" rx="18" ry="4" />
          <ellipse cx="282" cy="256" rx="18" ry="4" />
        </g>
        {/* A few moss tendrils dripping from the moustache */}
        <g stroke="rgba(40, 82, 36, 0.95)" strokeWidth="3" fill="none" strokeLinecap="round">
          <path d="M210 274 Q212 286 208 296" />
          <path d="M236 278 Q238 292 234 304" />
          <path d="M264 278 Q266 292 270 304" />
          <path d="M290 274 Q292 286 296 296" />
        </g>

        {/* Wide mouth, slightly open, under the moustache */}
        <path
          d="M210 302 Q250 318 290 302 Q282 320 250 322 Q218 320 210 302 Z"
          fill="rgba(14, 8, 4, 0.99)"
        />
        {/* Lower lip highlight */}
        <path d="M218 314 Q250 320 282 314"
              fill="none" stroke="rgba(80, 50, 30, 0.85)" strokeWidth="1.4" strokeLinecap="round" />

        {/* Side knots / age scars */}
        <g fill="rgba(28, 18, 10, 0.92)">
          <ellipse cx="160" cy="270" rx="8" ry="5" />
          <ellipse cx="340" cy="270" rx="8" ry="5" />
          <ellipse cx="170" cy="320" rx="6" ry="4" />
          <ellipse cx="330" cy="320" rx="6" ry="4" />
        </g>
      </svg>

      {/* Mid-range trees framing the sides */}
      <svg className="oot-trees-mid oot-trees-left" viewBox="0 0 240 360" aria-hidden="true">
        {/* Far tree */}
        <g fill="rgba(8, 30, 16, 0.92)">
          <ellipse cx="80" cy="110" rx="80" ry="60" />
          <ellipse cx="60" cy="80"  rx="50" ry="32" />
          <ellipse cx="110" cy="90" rx="55" ry="34" />
        </g>
        <rect x="72" y="160" width="20" height="200" fill="rgba(40, 24, 14, 0.96)" />
        {/* Near tree (slightly forward) */}
        <g fill="rgba(6, 26, 14, 0.95)">
          <ellipse cx="180" cy="180" rx="70" ry="50" />
          <ellipse cx="160" cy="155" rx="50" ry="30" />
          <ellipse cx="210" cy="160" rx="50" ry="30" />
        </g>
        <rect x="172" y="220" width="18" height="140" fill="rgba(32, 18, 10, 0.96)" />
      </svg>

      <svg className="oot-trees-mid oot-trees-right" viewBox="0 0 240 360" aria-hidden="true">
        <g fill="rgba(8, 30, 16, 0.92)">
          <ellipse cx="160" cy="110" rx="80" ry="60" />
          <ellipse cx="130" cy="80"  rx="50" ry="32" />
          <ellipse cx="180" cy="90"  rx="55" ry="34" />
        </g>
        <rect x="150" y="160" width="20" height="200" fill="rgba(40, 24, 14, 0.96)" />
        <g fill="rgba(6, 26, 14, 0.95)">
          <ellipse cx="60" cy="180" rx="70" ry="50" />
          <ellipse cx="40" cy="155" rx="50" ry="30" />
          <ellipse cx="90" cy="160" rx="50" ry="30" />
        </g>
        <rect x="50" y="220" width="18" height="140" fill="rgba(32, 18, 10, 0.96)" />
      </svg>

      {/* Golden light shafts cutting through the canopy from upper-right */}
      <div className="oot-light-shafts" />

      {/* Ocarina — clean real-instrument silhouette built from simple
        * primitives so the shape is smooth and readable:
        *   - a single oval ellipse for the chamber body
        *   - a straight tapered tube path for the mouthpiece, angled up-left
        *   - a gold parallelogram collar where they meet
        *   - 6 finger holes (4 top + 2 belly) in clean rows
        *   - a tessellated Triforce engraving on the face
        */}
      <svg className="oot-ocarina" viewBox="-120 -60 240 120" aria-hidden="true">
        {/* Soft halo behind the ocarina */}
        <ellipse cx="6" cy="0" rx="108" ry="54" fill="#7ac4ff" opacity="0.22" />
        <ellipse cx="6" cy="0" rx="70"  ry="36" fill="#9fd8ff" opacity="0.24" />

        {/* Main chamber body — clean wide oval */}
        <ellipse
          cx="10" cy="0" rx="72" ry="40"
          fill="#2a7adf" stroke="#0c3a82" strokeWidth="3"
        />

        {/* Mouthpiece — short tapered tube angled up-left from the upper-
          * left of the body. Quadrilateral path so the edges are straight. */}
        <path
          d="M-46 -24
             L-94 -50
             L-90 -58
             L-40 -34 Z"
          fill="#2a7adf"
          stroke="#0c3a82"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Dark opening at the mouthpiece tip — the bit you blow into */}
        <ellipse
          cx="-91" cy="-54" rx="5" ry="2.4"
          fill="#0a1f3e" stroke="#0c3a82" strokeWidth="1.2"
          transform="rotate(-28 -91 -54)"
        />

        {/* Gold collar at the mouthpiece base — clear parallelogram */}
        <path
          d="M-50 -30 L-38 -36 L-30 -22 L-42 -16 Z"
          fill="#ffd23a"
          stroke="#7a5800"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Bright top edge on the collar */}
        <path
          d="M-50 -30 L-38 -36"
          stroke="#fff0a0" strokeWidth="1.5" strokeLinecap="round"
        />

        {/* Body upper highlight — bright catch-light across the top */}
        <ellipse
          cx="0" cy="-20" rx="46" ry="11"
          fill="rgba(255, 255, 255, 0.42)"
        />

        {/* Body lower-right shadow — gives the chamber its roundness */}
        <ellipse
          cx="28" cy="22" rx="50" ry="14"
          fill="rgba(0, 0, 0, 0.22)"
        />

        {/* Finger holes — 4 evenly spaced across the top of the chamber */}
        <circle cx="-26" cy="-14" r="4" fill="#08183c" />
        <circle cx="-6"  cy="-18" r="4" fill="#08183c" />
        <circle cx="16"  cy="-18" r="4" fill="#08183c" />
        <circle cx="38"  cy="-14" r="4" fill="#08183c" />

        {/* Two thumb holes on the belly */}
        <circle cx="-2" cy="20" r="3.5" fill="#08183c" />
        <circle cx="22" cy="20" r="3.5" fill="#08183c" />

        {/* Triforce engraving in the centre of the chamber face */}
        <g transform="translate(10 4)" fill="#ffd23a" opacity="0.95" stroke="#7a5800" strokeWidth="0.8">
          <path d="M0 -7 L6 3 L-6 3 Z" />
          <path d="M-6 3 L0 12 L-12 12 Z" />
          <path d="M6 3 L12 12 L0 12 Z" />
        </g>
      </svg>

      {/* Forest floor — rolling silhouette across the bottom */}
      <svg className="oot-foreground" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 200 L0 110
             Q120 84  240 100
             Q360 120 480 90
             Q600 65  720 100
             Q840 130 960 95
             Q1080 70 1200 105
             L1200 200 Z"
          fill="rgba(4, 14, 8, 1)"
        />
        {/* Grass blade tufts along the upper edge */}
        <g stroke="rgba(56, 110, 50, 0.95)" strokeWidth="1.6" strokeLinecap="round">
          <path d="M60 100 L62 88" />
          <path d="M66 102 L70 90" />
          <path d="M72 100 L74 86" />
          <path d="M210 96 L212 84" />
          <path d="M216 98 L220 86" />
          <path d="M450 92 L452 80" />
          <path d="M456 94 L460 82" />
          <path d="M660 96 L662 84" />
          <path d="M666 98 L670 86" />
          <path d="M900 95 L902 82" />
          <path d="M906 97 L910 84" />
          <path d="M1100 100 L1102 88" />
        </g>
        {/* Small foreground ferns */}
        <g fill="rgba(36, 78, 38, 0.92)">
          <path d="M120 110 Q126 90 132 110 Q138 84 144 110 Z" />
          <path d="M520 100 Q526 80 532 100 Q538 74 544 100 Z" />
          <path d="M820 102 Q826 82 832 102 Q838 76 844 102 Z" />
        </g>
      </svg>

      {/* Drifting fireflies / pollen motes */}
      <div className="oot-fireflies" />
    </div>
  );
}
