/**
 * The Minish Cap scene — Link shrunk to Picori scale, looking up at a
 * lush forest floor that towers above him. Giant blades of grass and
 * clover leaves frame the foreground; a Minish mushroom-house and a
 * great oak trunk rise in the mid-ground; sunbeams pour through the
 * canopy; kinstone halves spin in the air; Ezlo's cap drifts past on
 * the breeze.
 *
 * Everything is inline SVG + CSS so the OBS browser source needs no
 * external assets.
 */
export function MinishCapScene() {
  return (
    <div className="mc-scene" aria-hidden="true">
      {/* Sky-through-canopy glow at the top of the scene */}
      <div className="mc-canopy" />

      {/* God rays piercing the canopy from upper-left */}
      <div className="mc-rays" />
      <div className="mc-rays mc-rays-2" />

      {/* Distant rolling forest mound silhouettes */}
      <svg className="mc-far-hills" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <path
          d="M0 240 L80 180 L160 200 L260 150 L360 180 L460 140 L560 170 L660 130 L760 170 L860 150 L960 180 L1060 150 L1200 200 L1200 240 Z"
          fill="rgba(40, 78, 36, 0.85)"
        />
      </svg>

      {/* Massive oak trunk on the right, rising out of frame */}
      <svg className="mc-tree" viewBox="0 0 200 600">
        {/* Trunk body — gnarled with sub-roots flaring at the base */}
        <path
          d="M40 600 Q34 480 60 360 Q88 240 70 120 Q56 60 80 0
             L150 0 Q174 60 160 120 Q142 240 170 360 Q196 480 190 600 Z"
          fill="rgba(78, 50, 26, 0.96)"
        />
        {/* Highlight side */}
        <path
          d="M70 120 Q92 60 110 0 L150 0 Q174 60 160 120 Q142 240 170 360"
          fill="rgba(132, 88, 48, 0.55)"
        />
        {/* Bark texture cracks */}
        <g stroke="rgba(36, 20, 8, 0.85)" strokeWidth="2.5" fill="none" strokeLinecap="round">
          <path d="M70 50 Q66 130 72 220 Q78 320 70 420 Q66 510 72 590" />
          <path d="M110 30 Q104 130 112 230 Q120 340 114 450 Q108 540 116 600" />
          <path d="M150 60 Q146 160 152 260 Q158 360 152 470 Q148 560 156 600" />
        </g>
        {/* Lower root flare */}
        <path
          d="M40 600 Q26 540 8 510 L0 600 Z"
          fill="rgba(56, 34, 14, 0.96)"
        />
        <path
          d="M190 600 Q204 540 220 510 L228 600 Z"
          fill="rgba(56, 34, 14, 0.96)"
        />
      </svg>

      {/* Minish mushroom-house at the base of the tree */}
      <svg className="mc-mushroom" viewBox="0 0 200 200">
        {/* Cap — red toon mushroom */}
        <path
          d="M16 110 Q16 50 100 30 Q184 50 184 110 Q140 124 100 120 Q60 124 16 110 Z"
          fill="#d44030"
        />
        {/* Cap shadow underside */}
        <path
          d="M22 108 Q60 124 100 120 Q140 124 178 108 Q178 116 168 124 Q140 132 100 130 Q60 132 32 124 Q22 116 22 108 Z"
          fill="rgba(140, 22, 14, 0.85)"
        />
        {/* White spots on the cap */}
        <g fill="#fdf5e0">
          <ellipse cx="46"  cy="76"  rx="11" ry="8" />
          <ellipse cx="78"  cy="56"  rx="10" ry="7" />
          <ellipse cx="120" cy="62"  rx="13" ry="9" />
          <ellipse cx="156" cy="80"  rx="10" ry="7" />
          <ellipse cx="96"  cy="92"  rx="7"  ry="5" />
        </g>
        {/* Stalk */}
        <path
          d="M62 118 L60 178 Q60 188 70 188 L130 188 Q140 188 140 178 L138 118 Z"
          fill="#f5e8c4"
        />
        <path
          d="M62 118 L60 178 Q60 188 70 188 L80 188 L82 118 Z"
          fill="rgba(180, 156, 100, 0.55)"
        />
        {/* Round Minish door */}
        <ellipse cx="100" cy="170" rx="14" ry="16" fill="#3a2410" />
        <ellipse cx="100" cy="170" rx="10" ry="12" fill="#6e4520" />
        <circle  cx="106" cy="170" r="1.6"  fill="#ffd86a" />
        {/* Tiny round windows on the stalk */}
        <circle cx="78"  cy="148" r="4" fill="#1a1408" />
        <circle cx="78"  cy="148" r="2.5" fill="#ffd86a" />
        <circle cx="122" cy="148" r="4" fill="#1a1408" />
        <circle cx="122" cy="148" r="2.5" fill="#ffd86a" />
      </svg>

      {/* Tiny Picori (Minish) silhouette beside the mushroom house */}
      <svg className="mc-picori" viewBox="0 0 60 80">
        {/* Pointed leaf hood */}
        <path d="M14 32 Q18 4 30 4 Q42 4 46 32 L46 38 L14 38 Z" fill="#3a7a30" />
        <path d="M30 4 L32 -2 L34 4" stroke="#3a7a30" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Face area */}
        <ellipse cx="30" cy="36" rx="10" ry="9" fill="#f4d2a8" />
        {/* Tunic */}
        <path d="M16 46 L44 46 L46 70 L40 78 L20 78 L14 70 Z" fill="#4a8a3a" />
        {/* Belt */}
        <rect x="16" y="60" width="28" height="3" fill="#7a4a1a" />
        {/* Tiny eyes */}
        <circle cx="26" cy="38" r="1.4" fill="#1a0a08" />
        <circle cx="34" cy="38" r="1.4" fill="#1a0a08" />
      </svg>

      {/* Floating kinstone halves — fan-shaped medallions spinning in
        * mid-air, waiting to be fused. Three of them at different
        * positions, sizes, palettes and rotation speeds. */}
      <svg className="mc-kinstone mc-kinstone-1" viewBox="-60 -60 120 120">
        <g>
          {/* Outer fan */}
          <path d="M-40 30 A50 50 0 0 1 40 30 L0 -40 Z" fill="#f0b830" />
          {/* Inner step */}
          <path d="M-28 22 A36 36 0 0 1 28 22 L0 -26 Z" fill="#fce06a" />
          {/* Dark groove */}
          <path d="M0 -40 L0 30" stroke="rgba(120, 70, 10, 0.85)" strokeWidth="3" strokeLinecap="round" />
          {/* Highlight */}
          <path d="M-22 26 A32 32 0 0 1 -4 -22" fill="none" stroke="rgba(255, 244, 200, 0.6)" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      </svg>
      <svg className="mc-kinstone mc-kinstone-2" viewBox="-60 -60 120 120">
        <g>
          <path d="M-40 30 A50 50 0 0 1 40 30 L0 -40 Z" fill="#5a78d8" />
          <path d="M-28 22 A36 36 0 0 1 28 22 L0 -26 Z" fill="#9ab2f0" />
          <path d="M0 -40 L0 30" stroke="rgba(20, 30, 80, 0.85)" strokeWidth="3" strokeLinecap="round" />
          <path d="M-22 26 A32 32 0 0 1 -4 -22" fill="none" stroke="rgba(220, 232, 255, 0.6)" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      </svg>
      <svg className="mc-kinstone mc-kinstone-3" viewBox="-60 -60 120 120">
        <g>
          <path d="M-40 30 A50 50 0 0 1 40 30 L0 -40 Z" fill="#d44040" />
          <path d="M-28 22 A36 36 0 0 1 28 22 L0 -26 Z" fill="#ee8080" />
          <path d="M0 -40 L0 30" stroke="rgba(120, 20, 16, 0.85)" strokeWidth="3" strokeLinecap="round" />
          <path d="M-22 26 A32 32 0 0 1 -4 -22" fill="none" stroke="rgba(255, 220, 220, 0.6)" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      </svg>

      {/* Ezlo's hat — green bird-shaped Picori cap drifting through the
        * mid-air, eyes closed, tail curling. */}
      <svg className="mc-ezlo" viewBox="0 0 160 100">
        {/* Body of the cap */}
        <path
          d="M20 60 Q30 18 80 18 Q120 18 132 36 Q140 48 134 60 Q128 70 110 70 L40 70 Q22 70 20 60 Z"
          fill="#5ab02a"
        />
        {/* Yellow rim band */}
        <path d="M22 60 Q40 70 80 70 Q120 70 134 60 Q138 74 130 80 L40 80 Q22 78 22 60 Z" fill="#ffd86a" />
        {/* Trailing curled tail */}
        <path
          d="M132 36 Q156 28 152 12 Q148 -4 132 4 Q120 10 122 22"
          fill="#5ab02a"
        />
        <path
          d="M132 36 Q156 28 152 12 Q148 -4 132 4 Q120 10 122 22"
          fill="none" stroke="#1d3a1a" strokeWidth="1.4" strokeLinecap="round"
        />
        {/* Beak */}
        <path d="M22 56 L4 60 L22 64 Z" fill="#ffa830" />
        {/* Eye — closed serene line */}
        <path d="M52 40 Q60 36 68 40" stroke="#1d3a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        {/* Outline */}
        <path
          d="M20 60 Q30 18 80 18 Q120 18 132 36 Q140 48 134 60 Q128 70 110 70 L40 70 Q22 70 20 60 Z"
          fill="none" stroke="#1d3a1a" strokeWidth="1.6" strokeLinejoin="round"
        />
      </svg>

      {/* Giant clover leaves at the lower right — towering over Picori-
        * scale Link. Three petals fanning up. */}
      <svg className="mc-clover" viewBox="0 0 240 280" preserveAspectRatio="xMidYMax meet">
        <g>
          {/* Petal A (left) */}
          <path
            d="M120 260 Q60 230 30 170 Q12 110 60 90 Q108 78 124 140 Q132 200 120 260 Z"
            fill="#5ab02a"
          />
          <path d="M120 260 Q88 200 80 140 Q76 110 88 96" stroke="#2e6a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          {/* Petal B (centre) */}
          <path
            d="M120 260 Q100 180 110 100 Q116 50 138 50 Q160 50 164 100 Q172 180 130 260 Z"
            fill="#74cc36"
          />
          <path d="M120 260 Q126 180 130 100 Q132 70 138 56" stroke="#2e6a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          {/* Petal C (right) */}
          <path
            d="M120 260 Q180 230 210 170 Q228 110 180 90 Q132 78 116 140 Q108 200 120 260 Z"
            fill="#5ab02a"
          />
          <path d="M120 260 Q152 200 160 140 Q164 110 152 96" stroke="#2e6a1a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          {/* Stem */}
          <path d="M120 260 Q118 280 118 300" stroke="#2e6a1a" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      </svg>

      {/* Foreground blades of grass on the left — giant from Link's
        * Picori-scale perspective. Drawn with arching ribbon shapes. */}
      <svg className="mc-grass" viewBox="0 0 320 600" preserveAspectRatio="xMinYMax meet">
        <g>
          {/* Tallest centre blade */}
          <path d="M120 600 Q104 360 80 160 Q72 80 56 24 Q46 -10 86 0 Q124 16 132 90 Q146 250 152 420 Q158 540 144 600 Z" fill="#3e8a26" />
          <path d="M120 600 Q104 360 80 160 Q72 80 56 24" stroke="rgba(20, 60, 14, 0.85)" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Mid blade */}
          <path d="M40 600 Q34 360 22 200 Q16 120 4 70 Q-2 50 32 70 Q66 92 70 200 Q76 350 64 600 Z" fill="#4ea234" />
          <path d="M40 600 Q34 360 22 200 Q16 120 4 70" stroke="rgba(20, 60, 14, 0.85)" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Right tall blade arching the other way */}
          <path d="M200 600 Q210 380 226 220 Q236 130 256 60 Q266 36 232 56 Q198 82 192 220 Q186 380 184 600 Z" fill="#62b840" />
          <path d="M200 600 Q210 380 226 220 Q236 130 256 60" stroke="rgba(20, 60, 14, 0.85)" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Short side fronds */}
          <path d="M170 600 Q166 480 174 380 Q180 320 200 280" stroke="#3e8a26" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M88 600 Q92 500 102 420 Q112 360 122 320" stroke="#3e8a26" strokeWidth="5" fill="none" strokeLinecap="round" />
        </g>
      </svg>

      {/* Drifting pollen / spore particles */}
      <div className="mc-pollen" />
      <div className="mc-pollen mc-pollen-2" />

      {/* Dappled light spots on the ground */}
      <div className="mc-dapple" />
    </div>
  );
}
