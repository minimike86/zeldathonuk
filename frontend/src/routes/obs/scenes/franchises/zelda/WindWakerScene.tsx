import { WindWakerWater } from './WindWakerWater';

/**
 * Wind Waker scene — sky/ocean gradient with a sailing King of Red Lions
 * crossing between an icy island and a volcanic one, plus wave bands and
 * passing wind streaks.
 *
 * The water surface is rendered with a small WebGL fragment shader so it
 * actually wobbles and ripples; everything else is inline SVG + CSS.
 */
export function WindWakerScene() {
  return (
    <div className="ww-scene" aria-hidden="true">
      {/* Sky / sea horizon glow */}
      <div className="ww-horizon" />

      {/* Sun reflection on the water */}
      <div className="ww-sun" />

      {/* Animated toon-water surface (WebGL shader). Sits below the islands
        * and boat in DOM order so they render on top. */}
      <WindWakerWater />

      {/* Subtle icy waterline base under the ice island — pale blue-white
        * crescent matching the volcano's sandy shadow. */}
      <svg className="ww-ice-base" viewBox="0 0 200 40" preserveAspectRatio="none">
        <ellipse cx="100" cy="4" rx="92" ry="6" fill="rgba(220, 238, 248, 0.6)" />
        <ellipse cx="100" cy="6" rx="60" ry="5" fill="rgba(168, 210, 232, 0.5)" />
      </svg>

      {/* Static island silhouettes far back */}
      <svg className="ww-island ww-island-ice" viewBox="0 0 400 200" preserveAspectRatio="none">
        <path
          d="M0 200 L40 130 L80 80 L120 50 L150 30 L180 60 L210 40 L250 75 L300 105 L350 150 L400 200 Z"
          fill="rgba(180, 220, 240, 0.85)"
        />
        <path
          d="M40 130 L80 80 L120 50 L150 30 L180 60 L210 40 L250 75"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="2"
        />
      </svg>

      {/* Subtle sandbar hint under the volcano — barely-there crescent that
        * reads like a soft shadow at the waterline rather than a fully
        * drawn island. Just a thin tan smudge fading to nothing. */}
      <svg className="ww-volcano-sand" viewBox="0 0 200 40" preserveAspectRatio="none">
        {/* Soft tan crescent — wider than the volcano base, fades at the edges */}
        <ellipse cx="100" cy="4" rx="92" ry="6" fill="rgba(208, 168, 110, 0.55)" />
        {/* Tighter inner band, slightly more opaque, just under the spire */}
        <ellipse cx="100" cy="6" rx="60" ry="5" fill="rgba(176, 130, 80, 0.5)" />
      </svg>

      {/* Volcano spire — thin and tall like a stylised Dragon Roost peak. */}
      <svg className="ww-island ww-island-volcano" viewBox="0 0 280 320">
        <path
          d="M0 320 L40 240 L70 180 L100 120 L125 80 L145 50 L152 35 L158 50 L178 80 L205 120 L235 180 L265 240 L280 320 Z"
          fill="rgba(54, 24, 18, 0.92)"
        />
        {/* Shadow side, slightly darker on the right slope */}
        <path
          d="M152 35 L158 50 L178 80 L205 120 L235 180 L265 240 L280 320 L240 320 L222 240 L198 180 L178 120 L168 80 L160 50 Z"
          fill="rgba(30, 14, 10, 0.35)"
        />
        {/* Lava cap at the peak */}
        <path
          d="M144 42 L152 32 L160 42 L152 52 Z"
          fill="rgba(255, 110, 32, 0.95)"
        />
        {/* Flame */}
        <g className="ww-flame">
          <path
            d="M150 30 C140 10 165 5 158 -10 C178 -2 180 18 165 22 Z"
            fill="rgba(255, 180, 60, 0.95)"
          />
          <path
            d="M152 26 C144 12 160 8 156 -4 C170 2 170 18 160 22 Z"
            fill="rgba(255, 230, 100, 0.85)"
          />
        </g>
      </svg>

      {/* Cloud swirl wrapping around the upper third of the volcano,
        * positioned BELOW Valoo's perch. Built from overlapping ellipses and
        * circles so the cloud reads as a fluffy ring at altitude. */}
      <svg className="ww-volcano-cloud" viewBox="0 0 400 120">
        <g fill="rgba(245, 250, 252, 0.92)">
          {/* Main puffy mass */}
          <ellipse cx="80"  cy="70" rx="55" ry="22" />
          <ellipse cx="140" cy="60" rx="48" ry="20" />
          <ellipse cx="200" cy="68" rx="55" ry="24" />
          <ellipse cx="262" cy="58" rx="46" ry="20" />
          <ellipse cx="322" cy="72" rx="52" ry="22" />
          {/* Top fluff */}
          <circle cx="120" cy="42" r="16" />
          <circle cx="175" cy="34" r="18" />
          <circle cx="232" cy="38" r="16" />
          <circle cx="285" cy="42" r="14" />
        </g>
        {/* Cooler shadow underside */}
        <g fill="rgba(208, 226, 235, 0.85)">
          <ellipse cx="160" cy="92" rx="110" ry="10" />
          <ellipse cx="280" cy="94" rx="80" ry="9" />
        </g>
        {/* Soft highlight crest */}
        <g fill="rgba(255, 255, 255, 0.9)">
          <ellipse cx="170" cy="28" rx="40" ry="6" />
          <ellipse cx="250" cy="32" rx="30" ry="5" />
        </g>
      </svg>

      {/* Valoo perched atop the volcano, above the cloud band. */}
      <img className="ww-valoo" src="/assets/img/game-franchise/legend-of-zelda/ww/audio-scene/valoo_ww.png" alt="" />

      {/* Zephos drifting across the sky on his cloud. Same trick as the
       * boat: linear X traversal with two incommensurate Y wanders so each
       * trip across takes a different route. */}
      <img className="ww-zephos" src="/assets/img/game-franchise/legend-of-zelda/ww/audio-scene/zephos_ww.png" alt="" />

      {/* Cyclos, Zephos's grumpy brother, drifting the opposite way
       * (right → left) on his magenta cloud. Independent Y wanders. */}
      <img className="ww-cyclos" src="/assets/img/game-franchise/legend-of-zelda/ww/audio-scene/cyclos_ww.png" alt="" />

      {/* The King of Red Lions sailing across, looping. Artwork supplied by
        * the project owner. A trailing wake fans out behind the stern. */}
      <div className="ww-boat">
        <svg className="ww-trail" viewBox="0 0 240 50" preserveAspectRatio="none" aria-hidden="true">
          <g stroke="rgba(255,255,255,0.78)" fill="none" strokeLinecap="round">
            <path d="M2 26 Q60 18 130 26 Q190 32 238 26"
                  strokeWidth="2" strokeDasharray="22 10 6 16" />
            <path d="M2 34 Q70 28 140 34 Q200 40 238 34"
                  strokeWidth="1.4" strokeDasharray="14 8 4 12" opacity="0.7" />
            <path d="M14 18 Q70 12 140 18 Q190 22 232 18"
                  strokeWidth="1.1" strokeDasharray="8 12" opacity="0.5" />
          </g>
        </svg>
        <img src="/assets/img/game-franchise/legend-of-zelda/ww/audio-scene/red_lions_ww.png" alt="" />
      </div>

      {/* Salvage Corp ship sailing the opposite way (right → left). Sits a
        * bit higher on the canvas so it reads as further away. Includes a
        * trailing wake behind the stern (on its right since the ship moves
        * left) plus a soft whitewater drop-shadow under the hull. */}
      <div className="ww-salvage">
        <svg className="ww-salvage-trail" viewBox="0 0 240 50" preserveAspectRatio="none" aria-hidden="true">
          <g stroke="rgba(255,255,255,0.78)" fill="none" strokeLinecap="round">
            <path d="M2 26 Q50 32 110 26 Q180 18 238 26"
                  strokeWidth="2" strokeDasharray="22 10 6 16" />
            <path d="M2 34 Q40 40 100 34 Q170 28 238 34"
                  strokeWidth="1.4" strokeDasharray="14 8 4 12" opacity="0.7" />
            <path d="M8 18 Q60 22 120 18 Q170 12 226 18"
                  strokeWidth="1.1" strokeDasharray="8 12" opacity="0.5" />
          </g>
        </svg>
        <svg className="ww-salvage-whitewater" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
          <ellipse cx="100" cy="22" rx="92" ry="9" fill="rgba(255, 255, 255, 0.55)" />
          <ellipse cx="100" cy="22" rx="62" ry="6" fill="rgba(255, 255, 255, 0.75)" />
        </svg>
        <img src="/assets/img/game-franchise/legend-of-zelda/ww/audio-scene/salvage_corp_ww.png" alt="" />
      </div>

      {/* Seagulls circling */}
      <svg className="ww-gull ww-gull-1" viewBox="0 0 60 30">
        <path d="M2 18 Q12 4 22 16 Q32 4 42 16 Q52 4 58 18" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
      <svg className="ww-gull ww-gull-2" viewBox="0 0 60 30">
        <path d="M2 18 Q12 4 22 16 Q32 4 42 16 Q52 4 58 18" stroke="rgba(255,255,255,0.85)" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
      <svg className="ww-gull ww-gull-3" viewBox="0 0 60 30">
        <path d="M2 18 Q12 4 22 16 Q32 4 42 16 Q52 4 58 18" stroke="rgba(255,255,255,0.75)" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>

      {/* Cel-shaded foam — dense rows of repeating C-curl ripples drifting
       * across the surface. Five horizontal bands at different scales fake
       * the look of toon-shaded foam highlights on a stylised cartoon sea. */}
      <svg className="ww-foam" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <g stroke="rgba(255,255,255,0.92)" fill="none" strokeLinecap="round">
          {/* Row 1 (top band, distant) — small ripples */}
          <g strokeWidth="2">
            <path d="M30 22 q10 -8 20 0" />
            <path d="M120 18 q10 -8 20 0" />
            <path d="M220 24 q10 -8 20 0" />
            <path d="M320 18 q10 -8 20 0" />
            <path d="M420 22 q10 -8 20 0" />
            <path d="M520 18 q10 -8 20 0" />
            <path d="M620 24 q10 -8 20 0" />
            <path d="M720 18 q10 -8 20 0" />
            <path d="M820 22 q10 -8 20 0" />
            <path d="M920 18 q10 -8 20 0" />
            <path d="M1020 24 q10 -8 20 0" />
            <path d="M1120 18 q10 -8 20 0" />
          </g>
          {/* Row 2 — medium ripples, offset */}
          <g strokeWidth="2.2">
            <path d="M70 62 q14 -10 28 0" />
            <path d="M180 58 q14 -10 28 0" />
            <path d="M300 64 q14 -10 28 0" />
            <path d="M420 58 q14 -10 28 0" />
            <path d="M540 62 q14 -10 28 0" />
            <path d="M660 58 q14 -10 28 0" />
            <path d="M780 64 q14 -10 28 0" />
            <path d="M900 58 q14 -10 28 0" />
            <path d="M1020 62 q14 -10 28 0" />
            <path d="M1140 58 q14 -10 28 0" />
          </g>
          {/* Row 3 — small ripples again, different offset */}
          <g strokeWidth="2">
            <path d="M40 102 q12 -8 24 0" />
            <path d="M150 98 q12 -8 24 0" />
            <path d="M260 104 q12 -8 24 0" />
            <path d="M370 98 q12 -8 24 0" />
            <path d="M480 102 q12 -8 24 0" />
            <path d="M590 98 q12 -8 24 0" />
            <path d="M700 104 q12 -8 24 0" />
            <path d="M810 98 q12 -8 24 0" />
            <path d="M920 102 q12 -8 24 0" />
            <path d="M1030 98 q12 -8 24 0" />
            <path d="M1140 104 q12 -8 24 0" />
          </g>
          {/* Row 4 — wider crests */}
          <g strokeWidth="2.4">
            <path d="M80 142 q18 -12 36 0" />
            <path d="M220 138 q18 -12 36 0" />
            <path d="M360 144 q18 -12 36 0" />
            <path d="M500 138 q18 -12 36 0" />
            <path d="M640 142 q18 -12 36 0" />
            <path d="M780 138 q18 -12 36 0" />
            <path d="M920 144 q18 -12 36 0" />
            <path d="M1060 138 q18 -12 36 0" />
          </g>
          {/* Row 5 (bottom band, near) — biggest curls */}
          <g strokeWidth="2.6">
            <path d="M30 182 q22 -16 44 0" />
            <path d="M180 178 q22 -16 44 0" />
            <path d="M340 184 q22 -16 44 0" />
            <path d="M500 178 q22 -16 44 0" />
            <path d="M660 182 q22 -16 44 0" />
            <path d="M820 178 q22 -16 44 0" />
            <path d="M980 184 q22 -16 44 0" />
            <path d="M1140 178 q22 -16 44 0" />
          </g>
          {/* Scattered swirl/eddy accents */}
          <g strokeWidth="1.6">
            <path d="M260 40 q10 -8 20 0 q-4 6 -10 4 q-8 -2 0 -8" />
            <path d="M580 82 q10 -8 20 0 q-4 6 -10 4 q-8 -2 0 -8" />
            <path d="M880 30 q10 -8 20 0 q-4 6 -10 4 q-8 -2 0 -8" />
            <path d="M380 124 q10 -8 20 0 q-4 6 -10 4 q-8 -2 0 -8" />
            <path d="M780 162 q10 -8 20 0 q-4 6 -10 4 q-8 -2 0 -8" />
            <path d="M1080 116 q10 -8 20 0 q-4 6 -10 4 q-8 -2 0 -8" />
          </g>
        </g>
      </svg>

      {/* Wind wisps — curling tendrils styled after BotW Malice but in airy
       * whites/cyans. Each path is dashed and flows via animated
       * `stroke-dashoffset`; each wisp also pulses opacity at its own cadence
       * so the sky feels alive without anything tracking horizontally. */}
      <svg className="ww-wisps" viewBox="0 0 1600 500" preserveAspectRatio="none">
        <g stroke="rgba(245, 252, 255, 0.92)" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path className="ww-wisp ww-wisp-1"
                d="M60 80 Q200 30 320 110 Q440 190 360 260 Q280 320 400 360 Q500 388 460 440" />
          <path className="ww-wisp ww-wisp-2"
                d="M500 60 Q640 130 780 80 Q900 40 860 160 Q820 270 960 240 Q1060 220 1020 340" />
          <path className="ww-wisp ww-wisp-3"
                d="M1040 50 Q1180 120 1320 70 Q1440 30 1400 160 Q1360 270 1500 250" />
          <path className="ww-wisp ww-wisp-4"
                d="M120 250 Q260 320 400 270 Q540 220 480 360 Q440 440 580 420" />
          <path className="ww-wisp ww-wisp-5"
                d="M680 290 Q820 360 960 310 Q1080 270 1020 400 Q980 460 1120 440" />
          <path className="ww-wisp ww-wisp-6"
                d="M1180 280 Q1320 360 1460 320 Q1560 290 1520 420" />
        </g>
      </svg>

      {/* Bright cel-shaded highlight patches — organic blobs of lighter
       * cyan that drift across the water surface, giving the impression of
       * sunlight catching the top of the swells. */}
      <svg className="ww-patches" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <g fill="rgba(180, 230, 245, 0.45)">
          <path d="M40 30 Q90 22 140 30 Q170 40 130 52 Q90 56 50 50 Q22 40 40 30 Z" />
          <path d="M270 86 Q360 76 430 86 Q460 96 410 108 Q340 114 280 108 Q252 96 270 86 Z" />
          <path d="M560 50 Q640 40 700 50 Q730 60 680 72 Q610 76 560 70 Q540 60 560 50 Z" />
          <path d="M820 124 Q900 114 970 124 Q1000 134 940 146 Q860 150 820 144 Q800 134 820 124 Z" />
          <path d="M1020 60 Q1100 50 1160 60 Q1190 70 1140 82 Q1070 86 1020 80 Q1000 70 1020 60 Z" />
          <path d="M120 162 Q210 152 280 162 Q310 172 250 184 Q170 188 120 182 Q100 172 120 162 Z" />
          <path d="M460 162 Q540 152 600 162 Q630 172 580 184 Q500 188 460 180 Q440 170 460 162 Z" />
          <path d="M740 30 Q820 22 870 30 Q890 40 850 50 Q780 56 740 50 Q720 40 740 30 Z" />
        </g>
      </svg>


      {/* Wave bands — flat colour with a thin white crest outline along the
       * top edge so the wave reads as a cel-shaded toon shape rather than a
       * smooth blob. */}
      <svg className="ww-waves ww-waves-back" viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path
          d="M0 30 Q150 10 300 30 T600 30 T900 30 T1200 30 V60 H0 Z"
          fill="rgba(40, 110, 160, 0.65)"
        />
        <path
          d="M0 30 Q150 10 300 30 T600 30 T900 30 T1200 30"
          stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" fill="none"
        />
      </svg>
      <svg className="ww-waves ww-waves-mid" viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path
          d="M0 30 Q150 50 300 30 T600 30 T900 30 T1200 30 V60 H0 Z"
          fill="rgba(20, 80, 130, 0.75)"
        />
        <path
          d="M0 30 Q150 50 300 30 T600 30 T900 30 T1200 30"
          stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" fill="none"
        />
      </svg>
      <svg className="ww-waves ww-waves-front" viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path
          d="M0 30 Q150 12 300 30 T600 30 T900 30 T1200 30 V60 H0 Z"
          fill="rgba(8, 50, 90, 0.9)"
        />
        <path
          d="M0 30 Q150 12 300 30 T600 30 T900 30 T1200 30"
          stroke="rgba(255,255,255,0.75)" strokeWidth="1.8" fill="none"
        />
      </svg>

      {/* Wind streaks — passing horizontal lines, drawn as a CSS background */}
      <div className="ww-wind" />

      {/* Fishman — pops up at random spots across the ocean. The single
       * animation cycles through several positions; between pops his
       * opacity is 0 so the teleport from spot to spot is invisible. */}
      <img className="ww-fishman" src="/assets/img/game-franchise/legend-of-zelda/ww/audio-scene/fishman_ww.png" alt="" />

      {/* Cel-shaded splash that fires at each of fishman's pop positions.
       * Its keyframe animation shares the same position waypoints as
       * fishman but starts a touch earlier and scales up/fades out so it
       * reads as the water breaking around him. */}
      <svg className="ww-fishman-splash" viewBox="-100 -60 200 80" aria-hidden="true">
        {/* Outer foam ring */}
        <ellipse cx="0" cy="0" rx="52" ry="10"
                 stroke="rgba(255,255,255,0.95)" strokeWidth="3" fill="none" />
        {/* Inner ring */}
        <ellipse cx="0" cy="2" rx="32" ry="6"
                 stroke="rgba(255,255,255,0.75)" strokeWidth="2" fill="none" />
        {/* Upward droplet plumes */}
        <g fill="rgba(255,255,255,0.95)">
          <ellipse cx="-66" cy="-12" rx="5" ry="8" transform="rotate(-26 -66 -12)" />
          <ellipse cx="-42" cy="-24" rx="4" ry="7" transform="rotate(-14 -42 -24)" />
          <ellipse cx="-16" cy="-32" rx="5" ry="9" transform="rotate(-5 -16 -32)" />
          <ellipse cx="16"  cy="-30" rx="5" ry="8" transform="rotate(6 16 -30)" />
          <ellipse cx="42"  cy="-22" rx="4" ry="7" transform="rotate(14 42 -22)" />
          <ellipse cx="66"  cy="-10" rx="5" ry="8" transform="rotate(26 66 -10)" />
        </g>
        {/* Accent droplets */}
        <g fill="rgba(255,255,255,0.85)">
          <circle cx="-54" cy="-38" r="3" />
          <circle cx="-22" cy="-48" r="3.5" />
          <circle cx="26"  cy="-46" r="3" />
          <circle cx="56"  cy="-34" r="3.5" />
        </g>
        {/* C-curls on the ring */}
        <g stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M-72 -2 q6 -10 14 -3" />
          <path d="M58 -2 q6 -10 14 -3" />
        </g>
      </svg>
    </div>
  );
}
