/**
 * A Link Between Worlds scene — watercolour-and-paint themed for Yuga's
 * painting motif and Link's wall-merge ability. Built from layered
 * blurred gradient washes (the watercolour), drifting brushstroke
 * shapes, periodic paint-splatter "events" that bloom at random spots,
 * paint drips running down from the top, and a flat painted Link
 * silhouette frozen mid-merge on a canvas panel.
 *
 * Everything is inline SVG + CSS so the OBS browser source needs no
 * external assets.
 */
export function AlbwScene() {
  return (
    <div className="albw-scene" aria-hidden="true">
      {/* Background watercolour washes — soft bleeding colour fields.
        * Three layers in different palettes (gold/violet/rose) blur into
        * each other for a wet-on-wet paper feel. */}
      <div className="albw-wash albw-wash-gold" />
      <div className="albw-wash albw-wash-violet" />
      <div className="albw-wash albw-wash-rose" />

      {/* Large watercolour brushstroke bands across the canvas — soft
        * organic shapes with heavy blur and translucent fills. */}
      <svg className="albw-strokes" viewBox="0 0 1200 800" preserveAspectRatio="none">
        <g fill="rgba(255, 200, 61, 0.22)">
          <path d="M-60 180 C200 130 460 220 720 200 C940 184 1100 240 1260 210 L1260 320 C1100 348 940 296 720 312 C460 332 200 270 -60 318 Z" />
        </g>
        <g fill="rgba(160, 124, 255, 0.26)">
          <path d="M-60 460 C220 408 480 500 740 470 C960 446 1120 520 1260 478 L1260 600 C1120 640 960 580 740 612 C480 644 220 568 -60 612 Z" />
        </g>
        <g fill="rgba(214, 92, 132, 0.20)">
          <path d="M-60 660 C260 620 540 720 820 680 C1020 652 1160 720 1260 690 L1260 800 L-60 800 Z" />
        </g>
        {/* Slim crosswise stroke high in the sky */}
        <g fill="rgba(255, 244, 200, 0.18)">
          <path d="M-60 80 C260 50 540 110 820 80 C1020 60 1160 100 1260 80 L1260 120 C1160 140 1020 110 820 130 C540 160 260 110 -60 130 Z" />
        </g>
      </svg>

      {/* Paint drips streaming down from the top edge of the canvas.
        * Each strand is a thin vertical bar with a bulbous tip — the
        * `animation` (in zelda.css) extends it downward over time. */}
      <div className="albw-drips">
        <span className="albw-drip" style={{ left: '6%',  ['--drip-color' as string]: '#ffc83d', ['--drip-delay' as string]: '0s',   ['--drip-len' as string]: '38vh', ['--drip-dur' as string]: '11s' }} />
        <span className="albw-drip" style={{ left: '17%', ['--drip-color' as string]: '#a07cff', ['--drip-delay' as string]: '-3s',  ['--drip-len' as string]: '52vh', ['--drip-dur' as string]: '14s' }} />
        <span className="albw-drip" style={{ left: '29%', ['--drip-color' as string]: '#d65c84', ['--drip-delay' as string]: '-6s',  ['--drip-len' as string]: '28vh', ['--drip-dur' as string]: '10s' }} />
        <span className="albw-drip" style={{ left: '41%', ['--drip-color' as string]: '#ffe07a', ['--drip-delay' as string]: '-1.5s',['--drip-len' as string]: '46vh', ['--drip-dur' as string]: '13s' }} />
        <span className="albw-drip" style={{ left: '53%', ['--drip-color' as string]: '#7e8cff', ['--drip-delay' as string]: '-4.5s',['--drip-len' as string]: '60vh', ['--drip-dur' as string]: '16s' }} />
        <span className="albw-drip" style={{ left: '64%', ['--drip-color' as string]: '#a07cff', ['--drip-delay' as string]: '-8s',  ['--drip-len' as string]: '32vh', ['--drip-dur' as string]: '12s' }} />
        <span className="albw-drip" style={{ left: '76%', ['--drip-color' as string]: '#ffc83d', ['--drip-delay' as string]: '-2s',  ['--drip-len' as string]: '50vh', ['--drip-dur' as string]: '15s' }} />
        <span className="albw-drip" style={{ left: '88%', ['--drip-color' as string]: '#d65c84', ['--drip-delay' as string]: '-7s',  ['--drip-len' as string]: '34vh', ['--drip-dur' as string]: '11s' }} />
      </div>

      {/* Yuga's canvas — a tall ornate frame on the right side of the
        * scene with a paint-soaked panel inside. Link is shown as a flat
        * painting frozen mid-merge onto the canvas surface. */}
      <div className="albw-canvas">
        <div className="albw-canvas-frame" />
        <div className="albw-canvas-panel">
          {/* Painted-Link silhouette — flat green tunic + cap, very
            * minimal, like a brushstroke figure on the wall. */}
          <svg className="albw-link" viewBox="0 0 80 130" preserveAspectRatio="xMidYMid meet">
            {/* Outer wet-paint halo around the figure */}
            <ellipse cx="40" cy="80" rx="34" ry="48" fill="#4a8a3a" opacity="0.22" />
            {/* Cap */}
            <path d="M22 32 L42 12 L58 32 L52 38 L28 38 Z" fill="#3a7a30" />
            <path d="M22 32 L42 12 L58 32 L52 38 L28 38 Z" fill="none" stroke="#1d3a1a" strokeWidth="1.4" strokeLinejoin="round" />
            {/* Head */}
            <ellipse cx="40" cy="44" rx="11" ry="12" fill="#f4d2a8" />
            <ellipse cx="40" cy="44" rx="11" ry="12" fill="none" stroke="#1d3a1a" strokeWidth="1.2" />
            {/* Tunic */}
            <path d="M24 58 L56 58 L60 92 L52 110 L28 110 L20 92 Z" fill="#4a8a3a" />
            <path d="M24 58 L56 58 L60 92 L52 110 L28 110 L20 92 Z" fill="none" stroke="#1d3a1a" strokeWidth="1.4" strokeLinejoin="round" />
            {/* Triforce belt buckle */}
            <path d="M36 80 L44 80 L40 86 Z" fill="#ffd86a" />
            {/* Legs */}
            <path d="M28 110 L32 124 L38 124 L40 110 Z" fill="#f0e8d8" stroke="#1d3a1a" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M40 110 L42 124 L48 124 L52 110 Z" fill="#f0e8d8" stroke="#1d3a1a" strokeWidth="1.2" strokeLinejoin="round" />
            {/* Sword strap diagonal across chest */}
            <path d="M28 60 L52 74" stroke="#7a5a2a" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Sword hilt poking up over the right shoulder */}
            <rect x="56" y="46" width="3" height="14" fill="#9a8a3a" />
            <path d="M52 46 L62 46" stroke="#9a8a3a" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Paint drip leaking from the figure */}
            <path d="M40 124 Q38 134 40 142 Q42 150 40 158" stroke="#4a8a3a" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85" />
          </svg>
          {/* A faint Triforce sigil watermarked on the panel */}
          <svg className="albw-triforce" viewBox="0 0 100 90">
            <g fill="rgba(255, 216, 106, 0.18)" stroke="rgba(255, 216, 106, 0.35)" strokeWidth="1.2">
              <path d="M50 6 L74 48 L26 48 Z" />
              <path d="M26 48 L50 90 L2 90 Z" />
              <path d="M74 48 L98 90 L50 90 Z" />
            </g>
          </svg>
        </div>
      </div>

      {/* Hilda's mark — an inverted Triforce drifting on the left side
        * as a Lorule watermark, larger and ghostlier than Link's. */}
      <svg className="albw-hilda-mark" viewBox="0 0 100 90">
        <g fill="rgba(160, 124, 255, 0.22)" stroke="rgba(160, 124, 255, 0.55)" strokeWidth="1.4">
          <path d="M50 84 L74 42 L26 42 Z" />
          <path d="M26 42 L50 0 L2 0 Z" />
          <path d="M74 42 L98 0 L50 0 Z" />
        </g>
      </svg>

      {/* Paint splatter "events" — radial blooms that pop in at staggered
        * intervals around the scene. Each `.albw-splat` has its own
        * position, palette, size, and animation phase. Six concurrent
        * blooms keep the canvas feeling actively painted. */}
      <div className="albw-splat albw-splat-1" />
      <div className="albw-splat albw-splat-2" />
      <div className="albw-splat albw-splat-3" />
      <div className="albw-splat albw-splat-4" />
      <div className="albw-splat albw-splat-5" />
      <div className="albw-splat albw-splat-6" />

      {/* Tiny droplet flecks scattered around — sub-splat detail.
        * CSS background-image of dots scaled randomly. */}
      <div className="albw-flecks" />

      {/* Vignette tying everything to the paper edges */}
      <div className="albw-vignette" />
    </div>
  );
}
