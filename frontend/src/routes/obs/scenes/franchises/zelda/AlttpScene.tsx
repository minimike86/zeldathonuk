/**
 * A Link to the Past scene — 16-bit pixel art.
 *
 * Centre stage: the Master Sword in its pedestal in the Lost Woods, with a
 * pulsing Triforce above. Far back: Hyrule Castle (Light World) which fades
 * out and is replaced by the Pyramid of Power (Dark World) on a slow cycle,
 * mirroring the world-swap mechanic from the game. Lost Woods tree pixels
 * frame both sides. Every shape uses `shape-rendering="crispEdges"` so it
 * stays SNES-chunky at any scale.
 */
export function AlttpScene() {
  return (
    <div className="alttp-scene" aria-hidden="true">
      {/* The whole scene swaps between light/dark every ~12s via this layer.
        * dark world layer sits on top of light world and fades opacity. */}
      <div className="alttp-darkworld-tint" />

      {/* Far-back layer A: Hyrule Castle (light world) */}
      <svg
        className="alttp-bg alttp-castle"
        viewBox="0 0 240 160"
        shapeRendering="crispEdges"
      >
        <g fill="#2a1a14">
          {/* main keep */}
          <rect x="80" y="40" width="80" height="100" />
          {/* central tower */}
          <rect x="108" y="14" width="24" height="120" />
          {/* tower roof spike */}
          <rect x="116" y="6" width="8" height="8" />
          {/* battlements on keep */}
          <rect x="78" y="36" width="6" height="6" />
          <rect x="88" y="36" width="6" height="6" />
          <rect x="98" y="36" width="6" height="6" />
          <rect x="138" y="36" width="6" height="6" />
          <rect x="148" y="36" width="6" height="6" />
          <rect x="156" y="36" width="6" height="6" />
          {/* tower battlements */}
          <rect x="106" y="10" width="6" height="6" />
          <rect x="116" y="10" width="6" height="6" />
          <rect x="126" y="10" width="6" height="6" />
          {/* side wings */}
          <rect x="40" y="64" width="40" height="76" />
          <rect x="160" y="64" width="40" height="76" />
          <rect x="38" y="60" width="6" height="6" />
          <rect x="48" y="60" width="6" height="6" />
          <rect x="58" y="60" width="6" height="6" />
          <rect x="68" y="60" width="6" height="6" />
          <rect x="162" y="60" width="6" height="6" />
          <rect x="172" y="60" width="6" height="6" />
          <rect x="182" y="60" width="6" height="6" />
          <rect x="192" y="60" width="6" height="6" />
          {/* outer guard towers */}
          <rect x="20" y="84" width="20" height="56" />
          <rect x="200" y="84" width="20" height="56" />
          <rect x="18" y="80" width="6" height="6" />
          <rect x="28" y="80" width="6" height="6" />
          <rect x="200" y="80" width="6" height="6" />
          <rect x="210" y="80" width="6" height="6" />
        </g>
        {/* windows glowing */}
        <rect className="alttp-window" x="114" y="50" width="12" height="14" fill="#ffd23a" />
        <rect x="56" y="86" width="8" height="14" fill="#1a0a04" />
        <rect x="176" y="86" width="8" height="14" fill="#1a0a04" />
        <rect x="116" y="100" width="8" height="14" fill="#1a0a04" />
        {/* central gate */}
        <rect x="112" y="118" width="16" height="22" fill="#0a0402" />
      </svg>

      {/* Far-back layer B: Pyramid of Power (dark world) — fades in/out alongside the tint */}
      <svg
        className="alttp-bg alttp-pyramid"
        viewBox="0 0 240 160"
        shapeRendering="crispEdges"
      >
        {/* base */}
        <g fill="#3a1844">
          {/* stepped pyramid built from stacked rects */}
          <rect x="20" y="130" width="200" height="14" />
          <rect x="34" y="116" width="172" height="14" />
          <rect x="48" y="102" width="144" height="14" />
          <rect x="62" y="88" width="116" height="14" />
          <rect x="76" y="74" width="88" height="14" />
          <rect x="90" y="60" width="60" height="14" />
          <rect x="104" y="46" width="32" height="14" />
          <rect x="114" y="32" width="12" height="14" />
        </g>
        {/* shadow stripes between courses */}
        <g fill="#1a0a1c">
          <rect x="20" y="128" width="200" height="2" />
          <rect x="34" y="114" width="172" height="2" />
          <rect x="48" y="100" width="144" height="2" />
          <rect x="62" y="86" width="116" height="2" />
          <rect x="76" y="72" width="88" height="2" />
          <rect x="90" y="58" width="60" height="2" />
          <rect x="104" y="44" width="32" height="2" />
        </g>
        {/* Ganon's symbol carved on the face */}
        <g fill="#ff5a3a">
          <rect x="116" y="80" width="8" height="2" />
          <rect x="114" y="82" width="12" height="2" />
          <rect x="112" y="84" width="16" height="2" />
          <rect x="116" y="86" width="2" height="6" />
          <rect x="122" y="86" width="2" height="6" />
        </g>
      </svg>

      {/* Lost Woods trees — pixelated, framing left & right */}
      <svg className="alttp-trees alttp-trees-left" viewBox="0 0 100 200" shapeRendering="crispEdges">
        <AlttpTree x={20} y={120} h={70} />
        <AlttpTree x={50} y={100} h={90} />
        <AlttpTree x={75} y={130} h={60} />
        <AlttpTree x={10} y={150} h={45} />
      </svg>
      <svg className="alttp-trees alttp-trees-right" viewBox="0 0 100 200" shapeRendering="crispEdges">
        <AlttpTree x={20} y={130} h={60} />
        <AlttpTree x={50} y={100} h={90} />
        <AlttpTree x={75} y={125} h={65} />
        <AlttpTree x={90} y={150} h={45} />
      </svg>

      {/* Master Sword in pedestal — centred, pulsing */}
      <svg className="alttp-master-sword" viewBox="-40 -80 80 160" shapeRendering="crispEdges">
        {/* pedestal stone */}
        <g fill="#5a5a6a">
          <rect x="-30" y="40" width="60" height="40" />
        </g>
        <g fill="#3a3a4a">
          <rect x="-30" y="40" width="60" height="4" />
          <rect x="-30" y="62" width="60" height="2" />
        </g>
        <g fill="#7a7a8a">
          <rect x="-30" y="40" width="2" height="40" />
          <rect x="28" y="40" width="2" height="40" />
        </g>
        {/* triforce engraving on pedestal */}
        <g fill="#ffd23a">
          <rect x="-2" y="50" width="4" height="2" />
          <rect x="-4" y="52" width="8" height="2" />
          <rect x="-6" y="54" width="12" height="2" />
        </g>

        {/* Sword (blade + crossguard + grip + pommel) — flipped and lifted so
          * the blade points down while the whole sword floats above the pedestal. */}
        <g transform="translate(0, -50) scale(1, -1)">
        {/* blade — silver with a cool blue tint, pointy tip tapering to full width */}
        <g>
          {/* tip apex */}
          <rect x="-1" y="-74" width="2" height="2" fill="#ffffff" />
          {/* tip row 2 — width 6 with shading */}
          <rect x="-3" y="-72" width="6" height="2" fill="#e0ecf4" />
          <rect x="1"  y="-72" width="2" height="2" fill="#b8c8d8" />
          {/* tip row 3 — width 10 with full shading columns */}
          <rect x="-5" y="-70" width="10" height="2" fill="#b8c8d8" />
          <rect x="-5" y="-70" width="2"  height="2" fill="#e0ecf4" />
          <rect x="3"  y="-70" width="2"  height="2" fill="#6a7a8e" />
          {/* main blade body */}
          <rect x="-6" y="-68" width="12" height="64" fill="#b8c8d8" />
          <rect x="-4" y="-68" width="2"  height="64" fill="#e0ecf4" />
          <rect x="4"  y="-68" width="2"  height="64" fill="#6a7a8e" />
        </g>
        {/* crossguard (T-shape) — Master Sword blue */}
        <g fill="#1a4a8e">
          <rect x="-14" y="-6" width="28" height="6" />
          <rect x="-12" y="-8" width="24" height="2" />
          <rect x="-12" y="0" width="24" height="2" />
        </g>
        <g fill="#4a8edc">
          <rect x="-14" y="-6" width="28" height="2" />
          <rect x="-12" y="-8" width="24" height="2" />
        </g>
        <g fill="#0a2a5e">
          <rect x="-14" y="-2" width="28" height="2" />
          <rect x="-12" y="0" width="24" height="2" />
        </g>
        {/* hilt grip — Master Sword blue */}
        <g fill="#1a4a8e">
          <rect x="-3" y="0" width="6" height="14" />
        </g>
        <g fill="#4a8edc">
          <rect x="-3" y="0" width="2" height="14" />
        </g>
        <g fill="#0a2a5e">
          <rect x="1" y="0" width="2" height="14" />
        </g>
        {/* pommel — Master Sword blue with a light gem inset */}
        <g fill="#1a4a8e">
          <rect x="-5" y="14" width="10" height="6" />
          <rect x="-3" y="20" width="6" height="2" />
        </g>
        <g fill="#4a8edc">
          <rect x="-5" y="14" width="10" height="2" />
        </g>
        <g fill="#0a2a5e">
          <rect x="-5" y="18" width="10" height="2" />
          <rect x="-3" y="20" width="6" height="2" />
        </g>
        <g fill="#a8d4ff">
          <rect x="-1" y="16" width="2" height="2" />
        </g>
        </g>
      </svg>

      {/* Beam of holy light shining down on the sword */}
      <div className="alttp-light-beam" />

      {/* Triforce hovering above the sword, pulsing.
        * Three identical 5-row pyramids tessellated so their corners share a
        * pixel column, leaving a clean inverted-triangle gap in the middle. */}
      <svg className="alttp-triforce" viewBox="-30 -25 60 50" shapeRendering="crispEdges">
        <g fill="#ffd23a">
          {/* top triangle — centred on x=0 */}
          <rect x="-1" y="-22" width="2"  height="2" />
          <rect x="-3" y="-20" width="6"  height="2" />
          <rect x="-5" y="-18" width="10" height="2" />
          <rect x="-7" y="-16" width="14" height="2" />
          <rect x="-9" y="-14" width="18" height="2" />
          {/* bottom-left triangle — apex sits directly below the top's left corner */}
          <rect x="-9"  y="-12" width="2"  height="2" />
          <rect x="-11" y="-10" width="6"  height="2" />
          <rect x="-13" y="-8"  width="10" height="2" />
          <rect x="-15" y="-6"  width="14" height="2" />
          <rect x="-17" y="-4"  width="18" height="2" />
          {/* bottom-right triangle — mirror of the bottom-left */}
          <rect x="7"  y="-12" width="2"  height="2" />
          <rect x="5"  y="-10" width="6"  height="2" />
          <rect x="3"  y="-8"  width="10" height="2" />
          <rect x="1"  y="-6"  width="14" height="2" />
          <rect x="-1" y="-4"  width="18" height="2" />
        </g>
      </svg>

      {/* Pixel grass tiles at the bottom — alternating green dithered band */}
      <div className="alttp-grass" />

      {/* Light particles drifting upward (forest atmosphere) */}
      <div className="alttp-particles" />
    </div>
  );
}

/** Pixel tree primitive — two-tone canopy + trunk. */
function AlttpTree({ x, y, h }: { x: number; y: number; h: number }) {
  const canopyH = Math.floor(h * 0.65);
  const trunkH = h - canopyH;
  const canopyW = 18;
  return (
    <g>
      {/* Trunk */}
      <rect x={x - 2} y={y + canopyH} width={4} height={trunkH} fill="#3a1a08" />
      {/* Canopy — chunky pyramid */}
      <rect x={x - canopyW / 2} y={y + canopyH - 6} width={canopyW} height={6} fill="#0e3a1c" />
      <rect x={x - canopyW / 2 + 2} y={y + canopyH - 12} width={canopyW - 4} height={6} fill="#125a28" />
      <rect x={x - canopyW / 2 + 4} y={y + canopyH - 18} width={canopyW - 8} height={6} fill="#0e3a1c" />
      <rect x={x - canopyW / 2 + 6} y={y + canopyH - 24} width={canopyW - 12} height={6} fill="#125a28" />
      {/* Tree top point */}
      <rect x={x - 2} y={y + canopyH - 30} width={4} height={6} fill="#0e3a1c" />
      {/* Highlight pixel */}
      <rect x={x - 3} y={y + canopyH - 10} width={2} height={2} fill="#2a8a3a" />
    </g>
  );
}
