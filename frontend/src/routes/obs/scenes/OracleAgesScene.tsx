/**
 * Oracle of Ages scene — GBC-era pixel art.
 *
 * A spinning time vortex behind a giant sundial / clockface. The Harp of Ages
 * floats in the foreground emitting blue notes, with the Maku Tree silhouetted
 * far back. Sand grains drift downward (hourglass theme), and the whole
 * palette periodically flips between PRESENT (vivid blue-green) and PAST
 * (sepia gold) to evoke the game's time-travel mechanic. Every element uses
 * `shape-rendering="crispEdges"` for that chunky 8-bit/GBC look.
 */
export function OracleAgesScene() {
  return (
    <div className="ooa-scene" aria-hidden="true">
      {/* Past-tint overlay that fades in and out to flip the era */}
      <div className="ooa-past-tint" />

      {/* Spinning time vortex behind everything */}
      <svg className="ooa-vortex" viewBox="-100 -100 200 200" shapeRendering="crispEdges">
        <g fill="none" strokeLinecap="butt">
          {/* Concentric pixelated rings — built from rect arcs so the lines
            * have hard edges, not anti-aliased curves. */}
          <circle cx="0" cy="0" r="90" stroke="#3aa4d6" strokeWidth="3" opacity="0.35" />
          <circle cx="0" cy="0" r="70" stroke="#7ad4ff" strokeWidth="3" opacity="0.5" />
          <circle cx="0" cy="0" r="50" stroke="#3aa4d6" strokeWidth="3" opacity="0.65" />
          <circle cx="0" cy="0" r="30" stroke="#7ad4ff" strokeWidth="3" opacity="0.8" />
          {/* Vortex spokes — chunky rectangles radiating from centre */}
          <g fill="#a8e0ff" opacity="0.6">
            <rect x="-2" y="-95" width="4" height="20" />
            <rect x="-2" y="75" width="4" height="20" />
            <rect x="-95" y="-2" width="20" height="4" />
            <rect x="75" y="-2" width="20" height="4" />
          </g>
          <g fill="#7ad4ff" opacity="0.45" transform="rotate(45)">
            <rect x="-2" y="-95" width="4" height="18" />
            <rect x="-2" y="77" width="4" height="18" />
            <rect x="-95" y="-2" width="18" height="4" />
            <rect x="77" y="-2" width="18" height="4" />
          </g>
        </g>
      </svg>

      {/* Oracle of Ages Maku Tree � image supplied by project owner. */}
      <img
        className="ooa-maku"
        src="/assets/img/maku-tree-ages.png"
        alt=""
      />

      {/* Giant sundial / clock face — chunky pixel ring with hour ticks */}
      <svg className="ooa-clockface" viewBox="-100 -100 200 200" shapeRendering="crispEdges">
        {/* outer ring */}
        <g fill="none" stroke="#0a4a6e" strokeWidth="6">
          <circle cx="0" cy="0" r="80" />
        </g>
        {/* hour ticks built from rects */}
        <g fill="#0a4a6e">
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <g key={deg} transform={`rotate(${deg})`}>
              <rect x="-3" y="-85" width="6" height="10" />
            </g>
          ))}
          {/* major ticks at 12/3/6/9 */}
          {[0, 90, 180, 270].map((deg) => (
            <g key={`major-${deg}`} transform={`rotate(${deg})`}>
              <rect x="-4" y="-90" width="8" height="14" />
            </g>
          ))}
        </g>
        {/* clock hands — sweep around */}
        <g className="ooa-hand ooa-hand-hour">
          <rect x="-3" y="-40" width="6" height="46" fill="#0a4a6e" />
        </g>
        <g className="ooa-hand ooa-hand-minute">
          <rect x="-2" y="-66" width="4" height="74" fill="#0a4a6e" />
        </g>
        {/* central hub */}
        <circle cx="0" cy="0" r="6" fill="#0a4a6e" />
      </svg>

      {/* Nayru, the Oracle of Ages — image supplied by project owner. */}
      <img
        className="ooa-nayru"
        src="/assets/img/nayru-harp-ages.png"
        alt=""
      />

      {/* Link playing the Harp of Ages — image supplied by project owner. */}
      <img
        className="ooa-harp"
        src="/assets/img/link-harp-ages.png"
        alt=""
      />

      {/* Musical notes spilling from the harp — each is its own SVG that
        * floats from the harp area up across the screen on a stagger. */}
      <div className="ooa-notes">
        <MusicNote variant="eighth" className="ooa-note ooa-note-1" />
        <MusicNote variant="beam" className="ooa-note ooa-note-2" />
        <MusicNote variant="quarter" className="ooa-note ooa-note-3" />
        <MusicNote variant="eighth" className="ooa-note ooa-note-4" />
        <MusicNote variant="beam" className="ooa-note ooa-note-5" />
        <MusicNote variant="quarter" className="ooa-note ooa-note-6" />
      </div>

      {/* Music notes rising from Nayru's harp — blue to match her palette */}
      <div className="ooa-notes">
        <MusicNote variant="beam" className="ooa-note ooa-nayru-note-1" fill="#a8e0ff" shadow="#1a4a8e" />
        <MusicNote variant="eighth" className="ooa-note ooa-nayru-note-2" fill="#a8e0ff" shadow="#1a4a8e" />
        <MusicNote variant="quarter" className="ooa-note ooa-nayru-note-3" fill="#a8e0ff" shadow="#1a4a8e" />
        <MusicNote variant="eighth" className="ooa-note ooa-nayru-note-4" fill="#a8e0ff" shadow="#1a4a8e" />
        <MusicNote variant="beam" className="ooa-note ooa-nayru-note-5" fill="#a8e0ff" shadow="#1a4a8e" />
        <MusicNote variant="quarter" className="ooa-note ooa-nayru-note-6" fill="#a8e0ff" shadow="#1a4a8e" />
      </div>

      {/* Sand grains drifting downward (hourglass mood) */}
      <div className="ooa-sand" />

      {/* GBC scanline / pixel-grid overlay for retro feel */}
      <div className="ooa-scanlines" />
    </div>
  );
}

/** Chunky GBC-style music note. Three glyph variants. */
function MusicNote({
  variant,
  className,
  fill = '#ffe566',
  shadow = '#a87a08',
}: {
  variant: 'eighth' | 'quarter' | 'beam';
  className?: string;
  fill?: string;
  shadow?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 48"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {variant === 'eighth' && (
        <g>
          {/* note head (filled oval, built from chunky rects) */}
          <rect x="2" y="34" width="14" height="10" fill={fill} />
          <rect x="4" y="32" width="10" height="2" fill={fill} />
          <rect x="4" y="44" width="10" height="2" fill={fill} />
          <rect x="2" y="44" width="14" height="2" fill={shadow} />
          {/* stem */}
          <rect x="14" y="6" width="3" height="32" fill={fill} />
          {/* flag */}
          <rect x="17" y="6" width="10" height="3" fill={fill} />
          <rect x="22" y="9" width="5" height="3" fill={fill} />
          <rect x="24" y="12" width="3" height="4" fill={fill} />
        </g>
      )}
      {variant === 'quarter' && (
        <g>
          <rect x="2" y="34" width="14" height="10" fill={fill} />
          <rect x="4" y="32" width="10" height="2" fill={fill} />
          <rect x="4" y="44" width="10" height="2" fill={fill} />
          <rect x="2" y="44" width="14" height="2" fill={shadow} />
          <rect x="14" y="6" width="3" height="32" fill={fill} />
        </g>
      )}
      {variant === 'beam' && (
        <g>
          {/* two note heads connected by a beam */}
          <rect x="2" y="30" width="12" height="8" fill={fill} />
          <rect x="2" y="38" width="12" height="2" fill={shadow} />
          <rect x="18" y="36" width="12" height="8" fill={fill} />
          <rect x="18" y="44" width="12" height="2" fill={shadow} />
          {/* stems */}
          <rect x="12" y="6" width="2" height="26" fill={fill} />
          <rect x="28" y="6" width="2" height="32" fill={fill} />
          {/* beam connecting the two stems */}
          <rect x="12" y="6" width="18" height="4" fill={fill} />
        </g>
      )}
    </svg>
  );
}
