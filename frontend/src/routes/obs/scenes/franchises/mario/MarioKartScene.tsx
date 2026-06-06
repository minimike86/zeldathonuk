import './mario.css';

/**
 * Mario Kart — Rainbow Road. A neon multicolour ribbon track arcs through deep
 * space with guard-rail rails of light, scattered stars, a checkered start
 * banner suggestion, and a tiny kart zipping along the ribbon. `.mk-` namespace.
 */
export function MarioKartScene() {
  return (
    <div className="mk-scene" aria-hidden="true">
      {/* Space starfield */}
      <div className="mk-stars" />

      {/* Rainbow Road ribbon arcing through space. The kart lives inside this
       * same SVG so SMIL <animateMotion> can reference the road path via
       * <mpath> — that's the only way to track a path whose actual rendered
       * geometry depends on preserveAspectRatio="none" stretching. Driving
       * the kart via CSS keyframes (or CSS offset-path) would require
       * pre-computing pixel coordinates that only hold if the stage is
       * exactly 1920×1080; the SVG approach is dimension-agnostic. */}
      <svg className="mk-road" viewBox="0 0 1200 360" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mk-rainbow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff4d6d" />
            <stop offset="20%" stopColor="#ffae2a" />
            <stop offset="40%" stopColor="#ffe83a" />
            <stop offset="60%" stopColor="#4cd95e" />
            <stop offset="80%" stopColor="#3a8ad0" />
            <stop offset="100%" stopColor="#a07cff" />
          </linearGradient>
          {/* Road centreline — defined once, reused for the three stroke
           * passes below AND referenced by the kart's <animateMotion>
           * so the kart can't drift out of sync with the visual path. */}
          <path id="mk-road-path" d="M-60 300 Q300 120 640 200 Q960 274 1260 90" />
        </defs>
        {/* glow underlay */}
        <use href="#mk-road-path" fill="none" stroke="url(#mk-rainbow)" strokeWidth="46" strokeLinecap="round" opacity="0.35" />
        {/* main ribbon */}
        <use href="#mk-road-path" fill="none" stroke="url(#mk-rainbow)" strokeWidth="26" strokeLinecap="round" />
        {/* dashed centre line */}
        <use href="#mk-road-path" fill="none" stroke="#ffffff" strokeWidth="3" strokeDasharray="14 22" opacity="0.9" />
        {/* edge rail of light, offset 14 units above the centreline */}
        <path d="M-60 286 Q300 106 640 186 Q960 260 1260 76" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.5" />

        {/* Kart driving the road. Drawn around its own (0,0) so
         * animateMotion places the chassis centre on the path's
         * centreline. The body extends above and the wheels just below,
         * staying inside the 26-unit-wide rainbow stroke — looks like
         * the kart is riding the ribbon. `rotate="auto"` banks the kart
         * with the road's tangent so it pitches up climbing the second
         * arc and noses down through the mid dip. The whole group sits
         * inside the road SVG (same viewBox + preserveAspectRatio="none")
         * so the kart stretches identically to the road — they cannot
         * fall out of alignment regardless of stage dimensions. */}
        <g>
          {/* exhaust glow trailing behind */}
          <path d="M-24 -2 L-34 -6 L-30 0 L-34 6 Z" fill="#7af0ff" opacity="0.8" />
          {/* body */}
          <path d="M-18 -2 Q-14 -12 4 -12 L16 -12 Q26 -12 26 -2 L26 6 L-18 6 Z" fill="#e23b3b" stroke="#9a1c1c" strokeWidth="1.4" />
          {/* cockpit / driver cap */}
          <ellipse cx="8" cy="-14" rx="7" ry="6" fill="#e23b3b" />
          <path d="M1 -14 Q8 -22 15 -14 Z" fill="#cf3030" />
          <circle cx="8" cy="-16" r="2.8" fill="#fff" />
          {/* wheels */}
          <circle cx="-9" cy="10" r="5" fill="#1c1c2a" />
          <circle cx="-9" cy="10" r="2" fill="#5a5a6a" />
          <circle cx="17" cy="10" r="5" fill="#1c1c2a" />
          <circle cx="17" cy="10" r="2" fill="#5a5a6a" />
          <animateMotion dur="9s" repeatCount="indefinite" rotate="auto">
            <mpath href="#mk-road-path" />
          </animateMotion>
        </g>
      </svg>

      {/* Start/finish checkered banner suggestion, far */}
      <svg className="mk-banner" viewBox="0 0 80 40">
        <g>
          <rect x="0" y="0" width="10" height="10" fill="#fff" /><rect x="10" y="0" width="10" height="10" fill="#1c1c2a" />
          <rect x="20" y="0" width="10" height="10" fill="#fff" /><rect x="30" y="0" width="10" height="10" fill="#1c1c2a" />
          <rect x="0" y="10" width="10" height="10" fill="#1c1c2a" /><rect x="10" y="10" width="10" height="10" fill="#fff" />
          <rect x="20" y="10" width="10" height="10" fill="#1c1c2a" /><rect x="30" y="10" width="10" height="10" fill="#fff" />
        </g>
      </svg>

      {/* Item-box question cubes drifting */}
      <svg className="mk-itembox mk-itembox-a" viewBox="0 0 40 40">
        <rect x="4" y="4" width="32" height="32" rx="6" fill="#7af0ff" stroke="#2a9dc8" strokeWidth="2" opacity="0.85" />
        <text x="20" y="29" fontSize="22" fontWeight="700" textAnchor="middle" fill="#ffffff">?</text>
      </svg>
      <svg className="mk-itembox mk-itembox-b" viewBox="0 0 40 40">
        <rect x="4" y="4" width="32" height="32" rx="6" fill="#ffae2a" stroke="#c87a14" strokeWidth="2" opacity="0.85" />
        <text x="20" y="29" fontSize="22" fontWeight="700" textAnchor="middle" fill="#ffffff">?</text>
      </svg>
    </div>
  );
}
