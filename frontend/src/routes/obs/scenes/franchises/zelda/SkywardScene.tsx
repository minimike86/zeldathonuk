/**
 * Skyward Sword scene — Skyloft adrift in a golden-hour sea of clouds,
 * the Goddess Statue silhouetted in the haze, distant floating islands,
 * and the Crimson Loftwing gliding majestically across the sky.
 *
 * Layers (back-to-front):
 *   1. Sky gradient (CSS)
 *   2. Sun + radial sunrays
 *   3. Goddess Statue silhouette far back
 *   4. Cloud parallax bands (far / mid / near)
 *   5. Distant floating islands
 *   6. Skyloft itself, with the Statue of the Goddess plaza tower
 *   7. The Crimson Loftwing in flight
 *   8. Sky cyphers + golden motes drifting up
 *   9. Foreground cloud mist
 */
export function SkywardScene() {
  return (
    <div className="ss-scene" aria-hidden="true">
      {/* Warm sun disc behind everything */}
      <div className="ss-sun" />

      {/* Radial god-rays pouring down through the clouds */}
      <div className="ss-sunrays" />

      {/* Goddess Statue — far back silhouette, larger and more refined */}
      <svg className="ss-goddess" viewBox="0 0 240 380" aria-hidden="true">
        {/* Long flowing robe — a single tall silhouette */}
        <path
          d="M120 18
             L132 30 L138 50 L142 70
             L150 90 L152 110 L150 130
             L156 150 L162 178 L160 200
             L156 220 L160 246 L168 272
             L172 296 L176 320 L178 344
             L184 366 L186 380
             L54 380
             L56 366 L62 344 L64 320
             L68 296 L72 272 L80 246
             L84 220 L80 200 L78 178
             L84 150 L90 130 L88 110
             L90 90 L98 70 L102 50
             L108 30 Z"
          fill="rgba(20, 36, 62, 0.92)"
        />
        {/* Outstretched arms holding the Goddess Sword aloft */}
        <path
          d="M98 70 L62 50 L40 50 L42 60 L70 66 L100 86 Z"
          fill="rgba(20, 36, 62, 0.92)"
        />
        <path
          d="M142 70 L178 50 L200 50 L198 60 L170 66 L140 86 Z"
          fill="rgba(20, 36, 62, 0.92)"
        />
        {/* Hood crown — pointed coif */}
        <path
          d="M120 8 L132 18 L120 0 L108 18 Z"
          fill="rgba(20, 36, 62, 0.92)"
        />
        {/* Sword raised between her hands — glowing thin blade */}
        <g stroke="rgba(255, 230, 130, 0.85)" strokeLinecap="round">
          <line x1="120" y1="-20" x2="120" y2="34" strokeWidth="2.4" />
          {/* crossguard */}
          <line x1="108" y1="2" x2="132" y2="2" strokeWidth="3" />
          {/* tip glint */}
          <line x1="118" y1="-20" x2="122" y2="-20" strokeWidth="4" />
        </g>
        {/* Subtle robe folds */}
        <g stroke="rgba(10, 18, 36, 0.55)" strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M104 200 Q108 260 110 340" />
          <path d="M136 200 Q132 260 130 340" />
          <path d="M120 200 L120 360" />
        </g>
      </svg>

      {/* Sea of clouds — three parallax bands */}
      <div className="ss-clouds ss-clouds-far" />
      <div className="ss-clouds ss-clouds-mid" />
      <div className="ss-clouds ss-clouds-near" />

      {/* Distant tiny island silhouettes at the horizon */}
      <div className="ss-far-islands" aria-hidden="true">
        <span className="ss-far-island ss-far-island-1" />
        <span className="ss-far-island ss-far-island-2" />
        <span className="ss-far-island ss-far-island-3" />
      </div>

      {/* SKYLOFT — main island, central, with the Statue of the Goddess plaza */}
      <svg className="ss-skyloft" viewBox="0 0 640 280" aria-hidden="true">
        {/* under-rock silhouette (the lower bulb of the island) */}
        <path
          d="M40 138 Q140 70 320 78 Q500 86 600 142
             L580 170 L560 198 Q520 230 460 240
             Q330 260 220 240 Q140 224 100 200 Q70 182 56 162 Z"
          fill="#2c5076"
          stroke="#15293f"
          strokeWidth="1.5"
        />
        {/* lit-up grassy top surface */}
        <path
          d="M50 134 Q150 64 320 72 Q500 80 590 134
             L580 152 Q480 168 350 168 Q210 168 110 156 Q70 150 50 144 Z"
          fill="#3e8c44"
          stroke="#2a5e30"
          strokeWidth="1"
        />
        {/* top-edge grass highlight */}
        <path
          d="M60 128 Q160 66 320 74 Q500 82 588 130"
          stroke="#6fd05a"
          strokeWidth="2.5"
          fill="none"
        />

        {/* Distant houses on the left of the plateau */}
        <Building x={140} baseY={150} w={32} h={28} roof="#c66533" wall="#e7d2a8" />
        <Building x={186} baseY={154} w={28} h={24} roof="#c66533" wall="#d4c08c" />
        <Building x={228} baseY={158} w={26} h={20} roof="#9a4a28" wall="#e7d2a8" />

        {/* Central Statue plaza — tall steps + the Goddess Statue tower */}
        <g>
          {/* tiered stone plaza base */}
          <rect x="282" y="106" width="80" height="14" fill="#d4c39a" stroke="#7a6940" strokeWidth="1" />
          <rect x="276" y="120" width="92" height="10" fill="#bda783" stroke="#7a6940" strokeWidth="1" />
          <rect x="268" y="130" width="108" height="10" fill="#a89376" stroke="#7a6940" strokeWidth="1" />
          {/* the statue itself rising from the plaza */}
          <path
            d="M322 30 L334 40 L338 60 L342 86 L344 106
               L300 106 L302 86 L306 60 L310 40 Z"
            fill="#e8d8b2"
            stroke="#7a6940"
            strokeWidth="1"
          />
          {/* head/hood */}
          <ellipse cx="322" cy="30" rx="9" ry="11" fill="#e8d8b2" stroke="#7a6940" strokeWidth="1" />
          {/* outstretched arms */}
          <path d="M310 50 L294 56 L294 60 L312 56 Z"
                fill="#e8d8b2" stroke="#7a6940" strokeWidth="1" />
          <path d="M334 50 L350 56 L350 60 L332 56 Z"
                fill="#e8d8b2" stroke="#7a6940" strokeWidth="1" />
          {/* sword in hands */}
          <line x1="322" y1="8" x2="322" y2="32"
                stroke="#3a5078" strokeWidth="2" />
          <line x1="316" y1="20" x2="328" y2="20"
                stroke="#3a5078" strokeWidth="2" />
          {/* statue gold accents */}
          <circle cx="322" cy="78" r="3" fill="#ffd23a" />
        </g>

        {/* Distant houses on the right */}
        <Building x={398} baseY={156} w={26} h={22} roof="#c66533" wall="#e7d2a8" />
        <Building x={438} baseY={154} w={30} h={26} roof="#9a4a28" wall="#d4c08c" />
        <Building x={482} baseY={152} w={34} h={30} roof="#c66533" wall="#e7d2a8" />

        {/* A couple of trees scattered on the plateau */}
        <g>
          <ellipse cx="106" cy="138" rx="10" ry="10" fill="#1f5a2a" />
          <ellipse cx="100" cy="132" rx="6" ry="6" fill="#2a7236" />
          <rect x="104" y="144" width="3" height="6" fill="#3a2014" />
        </g>
        <g>
          <ellipse cx="540" cy="138" rx="11" ry="11" fill="#1f5a2a" />
          <ellipse cx="534" cy="132" rx="6" ry="6" fill="#2a7236" />
          <rect x="538" y="144" width="3" height="6" fill="#3a2014" />
        </g>

        {/* Hanging rocks under the island */}
        <path d="M150 220 L120 268 L194 226 Z" fill="#1f3954" />
        <path d="M320 240 L300 276 L348 240 Z" fill="#1f3954" />
        <path d="M470 224 L500 268 L432 232 Z" fill="#1f3954" />
        <path d="M250 234 L240 264 L268 238 Z" fill="#2a4970" />
        <path d="M390 230 L412 260 L370 234 Z" fill="#2a4970" />
      </svg>

      {/* The Crimson Loftwing — gliding majestically across the sky */}
      <div className="ss-loftwing-wrap">
        <Loftwing />
      </div>

      {/* Ancient Skyward Sword cypher symbols floating upward */}
      <div className="ss-cyphers" />

      {/* Soft golden motes drifting up — extra warmth */}
      <div className="ss-motes" />

      {/* Foreground cloud mist */}
      <div className="ss-foreground-mist" />
    </div>
  );
}

/**
 * Reusable Skyloft building block — pointed roof + walls + door.
 */
function Building({
  x,
  baseY,
  w,
  h,
  roof,
  wall,
}: {
  x: number;
  baseY: number;
  w: number;
  h: number;
  roof: string;
  wall: string;
}) {
  return (
    <g>
      {/* walls */}
      <rect x={x} y={baseY - h} width={w} height={h} fill={wall} stroke="#7a6940" strokeWidth="0.8" />
      {/* peaked roof */}
      <path
        d={`M${x - 2} ${baseY - h} L${x + w / 2} ${baseY - h - 12} L${x + w + 2} ${baseY - h} Z`}
        fill={roof}
        stroke="#5a2818"
        strokeWidth="0.8"
      />
      {/* roof ridge highlight */}
      <line
        x1={x - 2}
        y1={baseY - h}
        x2={x + w + 2}
        y2={baseY - h}
        stroke="#5a2818"
        strokeWidth="0.8"
      />
      {/* small window glowing warm */}
      <rect x={x + w / 2 - 2} y={baseY - h * 0.55} width={4} height={5} fill="#ffd23a" />
      {/* door */}
      <rect x={x + w / 2 - 3} y={baseY - h * 0.35} width={6} height={h * 0.35} fill="#3a2014" />
    </g>
  );
}

/**
 * Crimson Loftwing — a shoebill-stork-inspired take on the Skyward Sword
 * mount. Rotund crimson body, broad rounded head with bare leathery facial
 * skin around a forward-facing yellow eye, a massive clog-shaped grey bill
 * with a hooked tip and dark mottling, and a sparse back-of-head tuft.
 * Huge red wings and a long forked tail keep the silhouette unmistakably
 * Loftwing.
 *
 * Faces right. The whole SVG is wrapped in `.ss-loftwing-wrap` which handles
 * the long horizontal glide; the body bobs gently and the wings flap.
 */
function Loftwing() {
  return (
    <svg
      className="ss-loftwing"
      viewBox="0 0 360 220"
      aria-hidden="true"
    >
      <defs>
        {/* Gradients for richer plumage */}
        <linearGradient id="ss-bird-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#f25048" />
          <stop offset="55%" stopColor="#d8302a" />
          <stop offset="100%" stopColor="#a01a16" />
        </linearGradient>
        <linearGradient id="ss-bird-belly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#ffe7d2" />
          <stop offset="100%" stopColor="#f0b48a" />
        </linearGradient>
        <linearGradient id="ss-bird-wing-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#ef433c" />
          <stop offset="60%" stopColor="#c6261e" />
          <stop offset="100%" stopColor="#7a120e" />
        </linearGradient>
        <linearGradient id="ss-bird-wing-bot" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#d8302a" />
          <stop offset="100%" stopColor="#7a120e" />
        </linearGradient>
        {/* Shoebill bill — pale yellowish-grey with horn-coloured shading,
          * matching the real bird's clog-coloured bill. */}
        <linearGradient id="ss-bird-bill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#d8c8a2" />
          <stop offset="55%" stopColor="#a8957a" />
          <stop offset="100%" stopColor="#705e44" />
        </linearGradient>
        {/* Bare facial skin — warm leathery pink-orange like a shoebill's
          * naked face patch. */}
        <linearGradient id="ss-bird-face-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#f0a880" />
          <stop offset="100%" stopColor="#c66a40" />
        </linearGradient>
      </defs>

      {/* ============ FAR (UNDERSIDE) WING — drawn first so it sits behind body ============ */}
      <g className="ss-wing ss-wing-back" style={{ transformOrigin: '170px 100px' }}>
        {/* secondary feathers fan — broad sweep behind the body */}
        <path
          d="M170 100
             Q150 70 110 56
             Q70 46 36 60
             Q60 80 90 92
             Q120 102 150 108
             Q166 112 170 106 Z"
          fill="url(#ss-bird-wing-bot)"
          stroke="#5a0a08"
          strokeWidth="1.2"
          opacity="0.7"
        />
        {/* feather separations on far wing */}
        <g stroke="#5a0a08" strokeWidth="1" fill="none" opacity="0.55">
          <path d="M170 100 Q140 84 100 76" />
          <path d="M170 100 Q138 92 90 92" />
          <path d="M170 100 Q138 100 88 102" />
        </g>
      </g>

      {/* ============ BODY — rotund, hunched, shoebill-stout ============ */}
      <path
        d="M118 108
           Q108 78 156 70
           Q220 56 264 78
           Q294 92 296 116
           Q288 138 254 146
           Q200 156 154 148
           Q120 142 112 124
           Q110 116 118 108 Z"
        fill="url(#ss-bird-body)"
        stroke="#6a0e0a"
        strokeWidth="1.6"
      />
      {/* white belly underside — fuller and rounder for a stork silhouette */}
      <path
        d="M130 128
           Q170 148 232 144
           Q264 140 282 128
           Q272 154 224 158
           Q170 162 130 148
           Q120 138 130 128 Z"
        fill="url(#ss-bird-belly)"
        stroke="#a06340"
        strokeWidth="0.8"
        opacity="0.95"
      />
      {/* darker mantle along the back/top of the body */}
      <path
        d="M130 92 Q200 70 286 92 Q260 100 196 96 Q156 98 130 100 Z"
        fill="#7a120e"
        opacity="0.55"
      />
      {/* a few suggested feathers on the lower flank */}
      <g stroke="#6a0e0a" strokeWidth="0.9" fill="none" opacity="0.55">
        <path d="M150 134 Q160 142 170 134" />
        <path d="M178 140 Q190 148 200 140" />
        <path d="M210 142 Q222 150 232 142" />
        <path d="M240 138 Q252 146 262 138" />
      </g>

      {/* ============ TAIL FEATHERS ============ */}
      <g stroke="#5a0a08" strokeWidth="1.2" strokeLinejoin="round">
        {/* upper long plume */}
        <path
          d="M126 108
             Q90 96 50 88
             Q60 100 86 110
             Q66 110 36 108
             Q60 120 90 122
             Q72 128 44 134
             Q72 138 100 132
             Q120 128 126 120 Z"
          fill="#c6261e"
        />
        {/* mid plume — deeper red */}
        <path
          d="M120 122
             Q88 124 56 130
             Q70 134 92 134
             Q72 142 50 148
             Q82 148 110 142
             Q124 138 122 130 Z"
          fill="#a01a16"
        />
        {/* white tail-tip accent */}
        <path
          d="M50 88 Q44 90 38 96 Q46 96 54 94 Z"
          fill="#fbeed2"
          stroke="#a06340"
          strokeWidth="0.6"
        />
        <path
          d="M44 134 Q38 138 36 144 Q46 142 54 138 Z"
          fill="#fbeed2"
          stroke="#a06340"
          strokeWidth="0.6"
        />
      </g>

      {/* ============ NEAR (TOP) WING — the showpiece ============ */}
      <g className="ss-wing ss-wing-front" style={{ transformOrigin: '200px 96px' }}>
        {/* wing main shape — broad sweep with fingered tips */}
        <path
          d="M200 96
             Q188 56 158 30
             Q126 8 86 6
             Q102 28 130 40
             Q108 38 76 26
             Q98 54 132 62
             Q108 64 78 56
             Q108 76 144 78
             Q120 84 92 80
             Q130 96 168 96
             Q188 98 200 96 Z"
          fill="url(#ss-bird-wing-top)"
          stroke="#5a0a08"
          strokeWidth="1.6"
        />
        {/* upper-wing highlight band */}
        <path
          d="M198 92 Q180 60 154 40 Q176 70 196 92 Z"
          fill="#ff766c"
          opacity="0.6"
        />
        {/* primary feather separations (the "fingers") */}
        <g stroke="#5a0a08" strokeWidth="1.4" fill="none">
          <path d="M200 96 Q170 70 132 40" />
          <path d="M200 96 Q166 68 110 30" />
          <path d="M200 96 Q164 70 88 26" />
          <path d="M200 96 Q150 70 78 56" />
          <path d="M200 96 Q146 84 92 78" />
        </g>
        {/* white wing-tip accents on the longest primaries */}
        <g fill="#fbeed2" stroke="#a06340" strokeWidth="0.6">
          <path d="M86 6 Q78 4 76 12 Q86 12 94 14 Z" />
          <path d="M76 26 Q66 26 64 34 Q78 32 88 30 Z" />
          <path d="M78 56 Q66 60 68 66 Q82 62 92 60 Z" />
        </g>
        {/* covert feathers — small overlapping shapes near the shoulder */}
        <g fill="#a01a16" stroke="#5a0a08" strokeWidth="0.8" opacity="0.85">
          <ellipse cx="190" cy="88" rx="8" ry="3" />
          <ellipse cx="178" cy="86" rx="8" ry="3" />
          <ellipse cx="166" cy="86" rx="7" ry="3" />
          <ellipse cx="156" cy="86" rx="6" ry="2.5" />
        </g>
      </g>

      {/* ============ NECK + HEAD ============ */}
      {/* neck */}
      <path
        d="M256 92
           Q278 78 296 72
           Q314 70 318 84
           Q298 96 282 100
           Q266 104 256 100 Z"
        fill="url(#ss-bird-body)"
        stroke="#6a0e0a"
        strokeWidth="1.6"
      />

      {/* head — flattened shoebill-like dome with bare facial-skin patch
        * around the eye. Smaller than before to make room for the massive
        * bill that defines the silhouette. */}
      <ellipse cx="298" cy="80" rx="22" ry="18" fill="url(#ss-bird-body)" stroke="#6a0e0a" strokeWidth="1.6" />
      {/* head crown highlight */}
      <path d="M286 64 Q300 58 314 66" stroke="#ff766c" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Sparse shoebill back-of-head tuft — just a couple of long thin
        * plumes rather than a flashy crest. */}
      <g stroke="#5a0a08" strokeWidth="1.3" strokeLinejoin="round">
        <path d="M288 60 Q282 38 276 22 Q288 36 294 58 Z" fill="#c6261e" />
        <path d="M296 58 Q296 34 298 16 Q304 32 304 58 Z" fill="#a01a16" />
        <path d="M304 60 Q310 38 318 24 Q312 42 310 62 Z" fill="#7a120e" />
      </g>

      {/* Bare leathery facial-skin patch around the eye — warm pink-orange
        * like a real shoebill's naked face. */}
      <path
        d="M288 78 Q302 72 316 78 Q314 88 304 90 Q294 90 288 86 Z"
        fill="url(#ss-bird-face-skin)"
        stroke="#7a3818"
        strokeWidth="0.8"
      />
      {/* Yellow forward-staring shoebill eye */}
      <circle cx="306" cy="82" r="3.4" fill="#fff5b8" stroke="#7a3818" strokeWidth="0.8" />
      <circle cx="306" cy="82" r="2.4" fill="#ffd24a" />
      <circle cx="306" cy="82" r="1.4" fill="#0c1830" />
      <circle cx="307" cy="81" r="0.7" fill="#ffffff" />

      {/* ============ BILL — massive clog-shaped shoebill bill ============
        * Upper mandible: long, fat, with a hook curving down at the tip.
        * Lower mandible: shorter and shallower beneath the upper.
        * Sized so the bill is roughly as long as the head is wide — the
        * defining silhouette of a shoebill. */}
      {/* Upper mandible — fat tubular slab ending in a curved hook tip */}
      <path
        d="M318 76
           Q344 70 364 76
           Q380 82 384 92
           Q386 100 380 104
           Q378 98 370 96
           Q358 96 342 94
           Q326 92 318 88
           Q316 82 318 76 Z"
        fill="url(#ss-bird-bill)"
        stroke="#5a4020"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* Lower mandible — sits beneath the upper, shorter */}
      <path
        d="M320 90
           Q344 96 368 96
           Q374 98 372 102
           Q358 106 338 104
           Q322 100 320 96
           Z"
        fill="url(#ss-bird-bill)"
        stroke="#5a4020"
        strokeWidth="1.2"
        opacity="0.95"
      />
      {/* Hook on the upper-bill tip — sharp downward curl */}
      <path
        d="M376 90
           Q386 92 384 100
           Q380 102 376 100
           Q372 96 376 90 Z"
        fill="#5a4020"
        stroke="#3a2810"
        strokeWidth="0.8"
      />
      {/* Mottling spots along the upper mandible */}
      <g fill="rgba(70, 50, 26, 0.6)">
        <ellipse cx="332" cy="82" rx="3" ry="1.6" />
        <ellipse cx="348" cy="80" rx="2.4" ry="1.4" />
        <ellipse cx="362" cy="84" rx="2" ry="1.2" />
        <ellipse cx="356" cy="90" rx="2.2" ry="1.2" />
        <ellipse cx="342" cy="88" rx="2.4" ry="1.4" />
      </g>
      {/* Mandible separation line where upper meets lower */}
      <path
        d="M318 90 Q344 96 374 96"
        stroke="#3a2810"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Nostril — small horizontal slit near the base of the upper bill */}
      <ellipse cx="326" cy="82" rx="1.4" ry="0.6" fill="#3a2810" />
      {/* Bright highlight stripe along the top ridge of the upper bill */}
      <path
        d="M320 76 Q344 72 366 78"
        stroke="rgba(255, 240, 200, 0.7)"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />

      {/* ============ TUCKED LEGS ============ */}
      <g stroke="#7a4a00" strokeWidth="1.4" strokeLinecap="round" fill="none">
        <path d="M218 138 Q224 148 220 156" />
        <path d="M232 138 Q238 148 236 156" />
      </g>
      {/* talons */}
      <g fill="#7a4a00">
        <path d="M218 154 L214 160 L218 158 L220 162 L222 158 L224 162 L226 158 Z" />
        <path d="M234 154 L230 160 L234 158 L236 162 L238 158 L240 162 L242 158 Z" />
      </g>
    </svg>
  );
}
