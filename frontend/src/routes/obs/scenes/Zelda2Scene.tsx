/**
 * Zelda II: The Adventure of Link scene — pixelated palace silhouette against
 * a stormy NES night, lightning over the Great Palace, the Triforce of
 * Courage pulsing, and an 8-bit grass/brick band scrolling at the bottom.
 *
 * All art is built from SVG rects with `shape-rendering="crispEdges"` so it
 * keeps that pixel-perfect 8-bit look at any scale.
 */
export function Zelda2Scene() {
  return (
    <div className="z2-scene" aria-hidden="true">
      {/* Twinkling 8-bit stars */}
      <div className="z2-stars" />

      {/* Lightning flash — full-screen overlay that pulses occasionally */}
      <div className="z2-lightning" />

      {/* The Great Palace — boxy, towered, recognisably NES */}
      <svg
        className="z2-palace"
        viewBox="0 0 200 140"
        preserveAspectRatio="xMidYEnd meet"
        shapeRendering="crispEdges"
      >
        {/* tall central tower */}
        <g fill="#8a1a0c">
          <rect x="85" y="14" width="30" height="68" />
          {/* crenellated top */}
          <rect x="83" y="10" width="6" height="6" />
          <rect x="93" y="10" width="6" height="6" />
          <rect x="103" y="10" width="6" height="6" />
          <rect x="113" y="10" width="6" height="6" />
          {/* tower roof point */}
          <rect x="97" y="2" width="6" height="6" />
          <rect x="95" y="6" width="10" height="4" />
        </g>
        {/* tower window — glows red */}
        <rect className="z2-window" x="95" y="34" width="10" height="14" fill="#ff8a3a" />
        <rect x="97" y="36" width="6" height="2" fill="#ffd23a" />

        {/* Side wings */}
        <g fill="#6e1408">
          <rect x="35" y="50" width="50" height="32" />
          <rect x="115" y="50" width="50" height="32" />
          {/* battlements */}
          <rect x="35" y="46" width="6" height="6" />
          <rect x="45" y="46" width="6" height="6" />
          <rect x="55" y="46" width="6" height="6" />
          <rect x="65" y="46" width="6" height="6" />
          <rect x="75" y="46" width="6" height="6" />
          <rect x="119" y="46" width="6" height="6" />
          <rect x="129" y="46" width="6" height="6" />
          <rect x="139" y="46" width="6" height="6" />
          <rect x="149" y="46" width="6" height="6" />
          <rect x="159" y="46" width="6" height="6" />
        </g>
        {/* doors / arches on side wings */}
        <rect x="50" y="64" width="8" height="18" fill="#1a0a04" />
        <rect x="64" y="64" width="8" height="18" fill="#1a0a04" />
        <rect x="128" y="64" width="8" height="18" fill="#1a0a04" />
        <rect x="142" y="64" width="8" height="18" fill="#1a0a04" />

        {/* Outer flanking towers */}
        <g fill="#5e1006">
          <rect x="15" y="64" width="22" height="50" />
          <rect x="163" y="64" width="22" height="50" />
          <rect x="13" y="60" width="6" height="6" />
          <rect x="23" y="60" width="6" height="6" />
          <rect x="33" y="60" width="6" height="6" />
          <rect x="161" y="60" width="6" height="6" />
          <rect x="171" y="60" width="6" height="6" />
          <rect x="181" y="60" width="6" height="6" />
        </g>

        {/* Big central gate */}
        <rect x="92" y="86" width="16" height="22" fill="#1a0a04" />
        <rect x="94" y="84" width="12" height="4" fill="#1a0a04" />

        {/* foundation row */}
        <rect x="0" y="108" width="200" height="32" fill="#3a0c06" />
      </svg>

      {/* Mountain silhouettes behind the palace */}
      <svg
        className="z2-mountains"
        viewBox="0 0 320 80"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
      >
        <g fill="#1a0a14">
          <rect x="0" y="60" width="320" height="20" />
          <rect x="20" y="50" width="40" height="10" />
          <rect x="30" y="40" width="20" height="10" />
          <rect x="80" y="44" width="60" height="16" />
          <rect x="100" y="34" width="20" height="10" />
          <rect x="160" y="48" width="50" height="12" />
          <rect x="175" y="38" width="20" height="10" />
          <rect x="230" y="46" width="60" height="14" />
          <rect x="250" y="36" width="20" height="10" />
        </g>
      </svg>

      {/* Triforce of Courage hovering, pulsing */}
      <svg className="z2-triforce" viewBox="-50 -45 100 80" shapeRendering="crispEdges">
        <g fill="#ffd23a">
          <rect x="-4" y="-30" width="8" height="2" />
          <rect x="-6" y="-28" width="12" height="2" />
          <rect x="-8" y="-26" width="16" height="2" />
          <rect x="-10" y="-24" width="20" height="2" />
          <rect x="-12" y="-22" width="24" height="2" />
          <rect x="-14" y="-20" width="28" height="2" />
          <rect x="-16" y="-18" width="32" height="2" />
        </g>
      </svg>

      {/* Lightning bolt zaps periodically over the palace tower */}
      <svg className="z2-bolt" viewBox="0 0 60 200" shapeRendering="crispEdges">
        <g fill="#ffe566">
          <rect x="26" y="0" width="8" height="20" />
          <rect x="22" y="20" width="8" height="20" />
          <rect x="18" y="40" width="8" height="20" />
          <rect x="22" y="60" width="14" height="6" />
          <rect x="30" y="66" width="8" height="20" />
          <rect x="26" y="86" width="8" height="20" />
          <rect x="22" y="106" width="14" height="6" />
          <rect x="30" y="112" width="8" height="24" />
          <rect x="26" y="136" width="8" height="20" />
          <rect x="22" y="156" width="8" height="20" />
        </g>
      </svg>

      {/* 8-bit ground band — brick / grass tiles scrolling slowly */}
      <div className="z2-ground" />

      {/* Tiny pixel-Link sprite walking left-to-right on the ground */}
      <svg className="z2-link" viewBox="0 0 12 16" shapeRendering="crispEdges">
        {/* hat (green) */}
        <rect x="3" y="0" width="6" height="2" fill="#3aaa2a" />
        <rect x="2" y="2" width="8" height="2" fill="#3aaa2a" />
        {/* face */}
        <rect x="3" y="4" width="6" height="3" fill="#f5d6a0" />
        <rect x="4" y="5" width="1" height="1" fill="#1a0a04" />
        <rect x="7" y="5" width="1" height="1" fill="#1a0a04" />
        {/* tunic */}
        <rect x="2" y="7" width="8" height="5" fill="#3aaa2a" />
        {/* belt */}
        <rect x="2" y="10" width="8" height="1" fill="#7a5008" />
        {/* arms */}
        <rect x="0" y="8" width="2" height="3" fill="#f5d6a0" />
        <rect x="10" y="8" width="2" height="3" fill="#f5d6a0" />
        {/* legs */}
        <rect x="3" y="12" width="2" height="3" fill="#a8470a" />
        <rect x="7" y="12" width="2" height="3" fill="#a8470a" />
        {/* sword raised */}
        <rect x="11" y="3" width="1" height="6" fill="#cccccc" />
        <rect x="10" y="2" width="3" height="1" fill="#ffd23a" />
      </svg>
    </div>
  );
}
