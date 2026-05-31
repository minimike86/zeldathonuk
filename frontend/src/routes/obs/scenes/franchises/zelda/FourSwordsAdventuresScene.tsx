/**
 * Four Swords Adventures scene — GBA-style top-down pixel art of the
 * Four Sword Sanctuary.
 *
 * Centre stage: the Four Sword embedded in its pedestal, glowing.
 * Around it: the four colored Links (green, red, blue, purple) standing at the
 * cardinal points. Behind: stylised stone shrine arch with stained glass.
 * Foreground: pixel grass tiles. Magical light sparkles drift upward.
 */
export function FourSwordsAdventuresScene() {
  return (
    <div className="fsa-scene" aria-hidden="true">
      {/* Subtle radial light from above the sanctuary */}
      <div className="fsa-light" />

      {/* Stone shrine arch behind the pedestal — chunky pixel masonry with
        * a stained-glass rose window. */}
      <svg
        className="fsa-shrine"
        viewBox="0 0 200 220"
        shapeRendering="crispEdges"
      >
        {/* Outer stone arch */}
        <g fill="#4a5470">
          <rect x="20" y="60" width="160" height="160" />
          <rect x="30" y="40" width="140" height="20" />
          <rect x="40" y="24" width="120" height="16" />
          <rect x="52" y="12" width="96" height="12" />
        </g>
        {/* Inner stone shading */}
        <g fill="#2a3450">
          <rect x="20" y="60" width="4" height="160" />
          <rect x="176" y="60" width="4" height="160" />
          <rect x="30" y="40" width="4" height="20" />
          <rect x="166" y="40" width="4" height="20" />
        </g>
        {/* Mortar lines on the arch — horizontal grout */}
        <g fill="#2a3450">
          <rect x="20" y="80"  width="160" height="2" />
          <rect x="20" y="100" width="160" height="2" />
          <rect x="20" y="120" width="160" height="2" />
          <rect x="20" y="140" width="160" height="2" />
          <rect x="20" y="160" width="160" height="2" />
          <rect x="20" y="180" width="160" height="2" />
        </g>
        {/* Mortar lines — vertical, offset per course for brick pattern */}
        <g fill="#2a3450">
          <rect x="40"  y="60"  width="2" height="20" />
          <rect x="60"  y="60"  width="2" height="20" />
          <rect x="80"  y="60"  width="2" height="20" />
          <rect x="100" y="60"  width="2" height="20" />
          <rect x="120" y="60"  width="2" height="20" />
          <rect x="140" y="60"  width="2" height="20" />
          <rect x="160" y="60"  width="2" height="20" />
          <rect x="30"  y="82"  width="2" height="18" />
          <rect x="50"  y="82"  width="2" height="18" />
          <rect x="70"  y="82"  width="2" height="18" />
          <rect x="90"  y="82"  width="2" height="18" />
          <rect x="110" y="82"  width="2" height="18" />
          <rect x="130" y="82"  width="2" height="18" />
          <rect x="150" y="82"  width="2" height="18" />
          <rect x="170" y="82"  width="2" height="18" />
          <rect x="40"  y="102" width="2" height="18" />
          <rect x="60"  y="102" width="2" height="18" />
          <rect x="80"  y="102" width="2" height="18" />
          <rect x="120" y="102" width="2" height="18" />
          <rect x="140" y="102" width="2" height="18" />
          <rect x="160" y="102" width="2" height="18" />
        </g>
        {/* Stained-glass rose window — circular, divided into four
          * coloured quadrants for the four heroes. */}
        <g>
          <rect x="80" y="100" width="40" height="40" fill="#0a0e1a" />
          {/* coloured quadrants — clipped to the inner square */}
          <rect x="82" y="102" width="18" height="18" fill="#3aa84a" />
          <rect x="100" y="102" width="18" height="18" fill="#d63a3a" />
          <rect x="82" y="120" width="18" height="18" fill="#3a6ad6" />
          <rect x="100" y="120" width="18" height="18" fill="#7a3ad6" />
          {/* lead came (cross) */}
          <rect x="80" y="118" width="40" height="4" fill="#1a2030" />
          <rect x="98" y="100" width="4" height="40" fill="#1a2030" />
          {/* outer rim highlights */}
          <rect x="80" y="100" width="40" height="2" fill="#7a8aaa" />
          <rect x="80" y="138" width="40" height="2" fill="#2a3450" />
        </g>
        {/* Sanctuary entrance — dark archway below the rose */}
        <g fill="#0a0e1a">
          <rect x="86" y="160" width="28" height="58" />
          <rect x="84" y="158" width="32" height="4" />
        </g>
        <g fill="#5a6480">
          <rect x="84" y="158" width="4"  height="62" />
          <rect x="112" y="158" width="4" height="62" />
        </g>
      </svg>

      {/* Stone floor tiles in front of the shrine */}
      <div className="fsa-floor" />

      {/* The Four Sword in its pedestal — centre */}
      <svg
        className="fsa-pedestal"
        viewBox="-40 -80 80 160"
        shapeRendering="crispEdges"
      >
        {/* Pedestal stone block */}
        <g fill="#6a7488">
          <rect x="-26" y="40" width="52" height="38" />
        </g>
        <g fill="#3a4458">
          <rect x="-26" y="40" width="52" height="3" />
          <rect x="-26" y="62" width="52" height="2" />
          <rect x="-26" y="74" width="52" height="4" />
        </g>
        <g fill="#8c96aa">
          <rect x="-26" y="40" width="3" height="38" />
          <rect x="23" y="40" width="3" height="38" />
        </g>
        {/* Four-coloured stones inset on the pedestal face */}
        <rect x="-18" y="50" width="6" height="6" fill="#3aa84a" />
        <rect x="-6"  y="50" width="6" height="6" fill="#d63a3a" />
        <rect x="6"   y="50" width="6" height="6" fill="#3a6ad6" />
        <rect x="18" y="50" width="0" height="0" />
        <rect x="12" y="50" width="6" height="6" fill="#7a3ad6" />

        {/* The Four Sword — blade points down into the pedestal, hilt up.
          * Pommel features four colored gems for the four Links. */}
        <g transform="translate(0, -54) scale(1, -1)">
          {/* tip apex */}
          <rect x="-1" y="-66" width="2" height="2" fill="#ffffff" />
          {/* tip row 2 */}
          <rect x="-3" y="-64" width="6" height="2" fill="#e6f0fc" />
          <rect x="1"  y="-64" width="2" height="2" fill="#a8b8d4" />
          {/* tip row 3 */}
          <rect x="-5" y="-62" width="10" height="2" fill="#c0d2ec" />
          <rect x="-5" y="-62" width="2"  height="2" fill="#ffffff" />
          <rect x="3"  y="-62" width="2"  height="2" fill="#7a8aaa" />
          {/* main blade body — light blue tint */}
          <rect x="-6" y="-60" width="12" height="56" fill="#c0d2ec" />
          <rect x="-4" y="-60" width="2"  height="56" fill="#ffffff" />
          <rect x="4"  y="-60" width="2"  height="56" fill="#7a8aaa" />
          {/* Triforce-ish notch on blade base */}
          <rect x="-2" y="-12" width="4" height="2" fill="#7ad4ff" />

          {/* crossguard — gold, T-shaped with flared wings */}
          <g fill="#ffc83a">
            <rect x="-16" y="-4" width="32" height="4" />
            <rect x="-14" y="-6" width="28" height="2" />
            <rect x="-12" y="-8" width="24" height="2" />
            <rect x="-14" y="0"  width="28" height="2" />
          </g>
          <g fill="#fff0a0">
            <rect x="-16" y="-4" width="32" height="2" />
            <rect x="-12" y="-8" width="24" height="2" />
          </g>
          <g fill="#8a5a00">
            <rect x="-16" y="-2" width="32" height="2" />
            <rect x="-14" y="0"  width="28" height="2" />
          </g>
          {/* small jewel set into crossguard centre */}
          <rect x="-2" y="-2" width="4" height="2" fill="#5dd5ff" />

          {/* grip — wrapped, blue */}
          <g fill="#2a5a8e">
            <rect x="-3" y="2" width="6" height="14" />
          </g>
          <g fill="#4a8ec8">
            <rect x="-3" y="2" width="2" height="14" />
          </g>
          <g fill="#0a2a4e">
            <rect x="1" y="2" width="2" height="14" />
          </g>
          {/* grip binding stripes */}
          <g fill="#0a2a4e">
            <rect x="-3" y="6"  width="6" height="2" />
            <rect x="-3" y="12" width="6" height="2" />
          </g>

          {/* pommel — gold with four jewels (green, red, blue, purple) */}
          <g fill="#ffc83a">
            <rect x="-7" y="16" width="14" height="8" />
            <rect x="-5" y="24" width="10" height="2" />
          </g>
          <g fill="#fff0a0">
            <rect x="-7" y="16" width="14" height="2" />
          </g>
          <g fill="#8a5a00">
            <rect x="-7" y="22" width="14" height="2" />
            <rect x="-5" y="24" width="10" height="2" />
          </g>
          {/* four jewels on the pommel */}
          <rect x="-6" y="18" width="2" height="2" fill="#3aa84a" />
          <rect x="-2" y="18" width="2" height="2" fill="#d63a3a" />
          <rect x="2"  y="18" width="2" height="2" fill="#3a6ad6" />
          <rect x="-6" y="18" width="0" height="0" />
          <rect x="4"  y="18" width="2" height="2" fill="#7a3ad6" />
        </g>
      </svg>

      {/* Magical light beam shining down on the sword */}
      <div className="fsa-beam" />

      {/* The Four Heroes — colored Links at cardinal points around the
        * pedestal, drawn in chunky GBA-sprite style. */}
      <div className="fsa-heroes">
        <FourSwordsLink color="green"  className="fsa-hero fsa-hero-back" />
        <FourSwordsLink color="red"    className="fsa-hero fsa-hero-left" />
        <FourSwordsLink color="blue"   className="fsa-hero fsa-hero-right" />
        <FourSwordsLink color="purple" className="fsa-hero fsa-hero-front" />
      </div>

      {/* Sparkles drifting upward around the sword */}
      <div className="fsa-sparkles" />
    </div>
  );
}

const HERO_PALETTES = {
  green:  { tunic: '#3aa84a', shade: '#1c6028', cap: '#3aa84a', boots: '#5a3414' },
  red:    { tunic: '#d63a3a', shade: '#7a1a1a', cap: '#d63a3a', boots: '#5a3414' },
  blue:   { tunic: '#3a6ad6', shade: '#1a3a7a', cap: '#3a6ad6', boots: '#5a3414' },
  purple: { tunic: '#7a3ad6', shade: '#3a1a7a', cap: '#7a3ad6', boots: '#5a3414' },
} as const;

type HeroColor = keyof typeof HERO_PALETTES;

/**
 * One of the four Links — GBA top-down sprite style, facing inward to the
 * pedestal. Drawn at a slight 3/4 angle: cap and tunic dominate, with a face
 * tile and a tiny sword/shield held at the sides.
 */
function FourSwordsLink({ color, className }: { color: HeroColor; className: string }) {
  const p = HERO_PALETTES[color];
  return (
    <svg
      className={className}
      viewBox="0 0 32 40"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {/* Drop shadow */}
      <ellipse cx="16" cy="38" rx="9" ry="2" fill="rgba(0,0,0,0.55)" />

      {/* Cap — long pointed hat draping back-left */}
      <g fill={p.cap}>
        <rect x="10" y="2"  width="12" height="2" />
        <rect x="8"  y="4"  width="16" height="2" />
        <rect x="6"  y="6"  width="20" height="4" />
        <rect x="22" y="2"  width="2"  height="2" />
        <rect x="24" y="4"  width="2"  height="2" />
        <rect x="26" y="6"  width="2"  height="2" />
        <rect x="28" y="8"  width="2"  height="2" />
      </g>
      <g fill={p.shade}>
        <rect x="6"  y="8"  width="20" height="2" />
        <rect x="22" y="2"  width="2"  height="2" />
        <rect x="26" y="6"  width="2"  height="2" />
      </g>

      {/* Face — skin tone band under the cap */}
      <g fill="#f0c898">
        <rect x="10" y="10" width="12" height="4" />
      </g>
      {/* Eyes */}
      <rect x="12" y="12" width="2" height="2" fill="#0a0a18" />
      <rect x="18" y="12" width="2" height="2" fill="#0a0a18" />
      {/* Face shading */}
      <rect x="20" y="10" width="2" height="4" fill="#c89866" />

      {/* Hair tufts beside the face */}
      <rect x="8" y="10" width="2" height="2" fill="#ffd23a" />
      <rect x="22" y="10" width="2" height="2" fill="#ffd23a" />

      {/* Tunic body */}
      <g fill={p.tunic}>
        <rect x="8"  y="14" width="16" height="14" />
        <rect x="10" y="28" width="12" height="2" />
      </g>
      {/* Tunic shading */}
      <g fill={p.shade}>
        <rect x="22" y="14" width="2"  height="14" />
        <rect x="8"  y="26" width="16" height="2" />
      </g>
      {/* Belt */}
      <rect x="8"  y="24" width="16" height="2" fill="#5a3414" />
      <rect x="14" y="24" width="4"  height="2" fill="#ffc83a" />

      {/* Arms */}
      <rect x="6"  y="16" width="2" height="8" fill={p.tunic} />
      <rect x="24" y="16" width="2" height="8" fill={p.shade} />
      <rect x="4"  y="22" width="4" height="4" fill="#f0c898" />
      <rect x="24" y="22" width="4" height="4" fill="#f0c898" />

      {/* Tiny sword raised on the right hand */}
      <g shapeRendering="crispEdges">
        <rect x="26" y="14" width="2" height="8" fill="#c0d2ec" />
        <rect x="25" y="22" width="4" height="2" fill="#ffc83a" />
      </g>
      {/* Tiny round shield held on the left arm */}
      <g shapeRendering="crispEdges">
        <rect x="2" y="20" width="4" height="4" fill="#3a6ad6" />
        <rect x="3" y="21" width="2" height="2" fill="#ffc83a" />
      </g>

      {/* Legs */}
      <rect x="10" y="30" width="4" height="6" fill="#f0c898" />
      <rect x="18" y="30" width="4" height="6" fill="#f0c898" />
      {/* Boots */}
      <rect x="10" y="34" width="4" height="2" fill={p.boots} />
      <rect x="18" y="34" width="4" height="2" fill={p.boots} />
    </svg>
  );
}
