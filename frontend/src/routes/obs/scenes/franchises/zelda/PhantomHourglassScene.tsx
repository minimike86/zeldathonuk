/**
 * Phantom Hourglass scene — DS-era cel-shaded ocean.
 *
 * The titular Phantom Hourglass dominates the centre: a golden frame with two
 * glass bulbs of glowing sand and a thin sand stream falling between them. The
 * SS Linebeck steams across the foreground left → right, smokestack puffing,
 * while a spectral Ghost Ship drifts the opposite way far behind, fading in
 * and out. A tattered sea chart pins itself to the upper-left corner with
 * dashed route lines and an X marking buried treasure. Cel-shaded foam,
 * waves, and drifting gold sand grains finish the toon look.
 */
export function PhantomHourglassScene() {
  return (
    <div className="ph-scene" aria-hidden="true">
      {/* Sky / horizon haze */}
      <div className="ph-horizon" />

      {/* Sea chart pinned in the corner */}
      <svg className="ph-chart" viewBox="0 0 320 220">
        {/* Parchment background with torn edges */}
        <path
          d="M8 14 L26 6 L70 12 L120 4 L180 10 L240 4 L290 12 L312 8 L308 60 L316 110
             L304 160 L312 200 L260 212 L200 206 L140 214 L80 208 L20 216 L12 170
             L4 110 L10 60 Z"
          fill="#f0d9a5"
          stroke="#7a5224"
          strokeWidth="1.5"
        />
        {/* Inner border */}
        <path
          d="M22 24 L300 22 L298 200 L24 198 Z"
          fill="none"
          stroke="#a07a3a"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        {/* Stylised island blobs */}
        <g fill="#8fbf78" stroke="#3a5a30" strokeWidth="1.2">
          <ellipse cx="80" cy="80" rx="32" ry="20" />
          <ellipse cx="220" cy="120" rx="40" ry="24" />
          <ellipse cx="150" cy="160" rx="22" ry="14" />
        </g>
        {/* Dashed sailing route */}
        <path
          d="M60 60 Q120 40 180 80 Q240 120 200 160 Q160 180 110 170"
          stroke="#b03a1a"
          strokeWidth="2"
          fill="none"
          strokeDasharray="6 5"
          strokeLinecap="round"
        />
        {/* X marks the spot */}
        <g stroke="#b03a1a" strokeWidth="3" strokeLinecap="round">
          <line x1="100" y1="160" x2="120" y2="180" />
          <line x1="120" y1="160" x2="100" y2="180" />
        </g>
        {/* Compass rose */}
        <g transform="translate(258, 60)">
          <circle r="14" fill="#f0d9a5" stroke="#7a5224" strokeWidth="1" />
          <path d="M0 -12 L3 0 L0 12 L-3 0 Z" fill="#7a5224" />
          <path d="M-12 0 L0 -3 L12 0 L0 3 Z" fill="#7a5224" opacity="0.6" />
          <text x="0" y="-16" fontSize="6" textAnchor="middle" fill="#7a5224"
                fontFamily="serif">N</text>
        </g>
      </svg>

      {/* Spectral Ghost Ship far back — drifts right→left, fades in and out */}
      <svg className="ph-ghost-ship" viewBox="0 0 240 140">
        {/* Hull — tall galleon */}
        <g fill="rgba(180, 240, 220, 0.55)" stroke="rgba(220, 255, 240, 0.7)" strokeWidth="1.4">
          <path d="M30 100 L210 100 L196 120 L44 120 Z" />
          {/* Cabin */}
          <rect x="60" y="78" width="120" height="22" />
          {/* Bowsprit */}
          <path d="M210 100 L228 92 L228 96 L212 104 Z" />
        </g>
        {/* Masts */}
        <g stroke="rgba(220, 255, 240, 0.75)" strokeWidth="2">
          <line x1="80" y1="78" x2="80" y2="10" />
          <line x1="140" y1="78" x2="140" y2="14" />
          <line x1="190" y1="78" x2="190" y2="22" />
        </g>
        {/* Tattered sails */}
        <g fill="rgba(200, 250, 230, 0.4)" stroke="rgba(220, 255, 240, 0.65)" strokeWidth="1.2">
          <path d="M60 20 L100 20 L102 60 L78 56 L58 60 Z" />
          <path d="M118 22 L162 22 L164 64 L138 60 L116 64 Z" />
          <path d="M170 30 L210 30 L212 66 L188 62 L168 66 Z" />
        </g>
        {/* Skull on the bow */}
        <g fill="rgba(240, 255, 248, 0.85)">
          <circle cx="216" cy="92" r="3" />
        </g>
      </svg>

      {/* Cel-shaded waves at the bottom of the canvas — three layers, back to
       * front, so the foreground swells sit above the ship and hourglass base. */}
      <svg className="ph-waves ph-waves-back" viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path d="M0 30 Q150 10 300 30 T600 30 T900 30 T1200 30 V60 H0 Z"
              fill="rgba(40, 130, 170, 0.6)" />
        <path d="M0 30 Q150 10 300 30 T600 30 T900 30 T1200 30"
              stroke="rgba(220,240,255,0.55)" strokeWidth="1.6" fill="none" />
      </svg>

      {/* SS Linebeck — steamship sailing across the foreground. Inline SVG so
       * it sits crisply between wave layers without needing a PNG. */}
      <div className="ph-linebeck">
        {/* Trailing wake */}
        <svg className="ph-linebeck-trail" viewBox="0 0 240 50" preserveAspectRatio="none">
          <g stroke="rgba(255,255,255,0.78)" fill="none" strokeLinecap="round">
            <path d="M2 26 Q60 18 130 26 Q190 32 238 26"
                  strokeWidth="2" strokeDasharray="22 10 6 16" />
            <path d="M2 34 Q70 28 140 34 Q200 40 238 34"
                  strokeWidth="1.4" strokeDasharray="14 8 4 12" opacity="0.7" />
          </g>
        </svg>
        <svg className="ph-linebeck-ship" viewBox="0 0 260 160">
          {/* Hull — red below the waterline, white above */}
          <path d="M20 100 L240 100 L222 132 L40 132 Z"
                fill="#c8341c" stroke="#5a1408" strokeWidth="2" />
          <rect x="32" y="80" width="196" height="22"
                fill="#f0e9d2" stroke="#5a1408" strokeWidth="2" />
          {/* Cabin */}
          <rect x="70" y="44" width="120" height="38"
                fill="#f0e9d2" stroke="#5a1408" strokeWidth="2" />
          {/* Cabin windows */}
          <g fill="#26b3d3" stroke="#0a3146" strokeWidth="1.5">
            <circle cx="92" cy="64" r="6" />
            <circle cx="116" cy="64" r="6" />
            <circle cx="140" cy="64" r="6" />
            <circle cx="164" cy="64" r="6" />
          </g>
          {/* Smokestack */}
          <rect x="120" y="14" width="22" height="32"
                fill="#3a2a18" stroke="#1a0e08" strokeWidth="2" />
          <rect x="116" y="10" width="30" height="6"
                fill="#1a0e08" />
          {/* Bowsprit / flag pole */}
          <line x1="240" y1="100" x2="252" y2="92"
                stroke="#5a1408" strokeWidth="2" />
          {/* Triangular pennant flag at stern */}
          <g>
            <line x1="22" y1="100" x2="22" y2="40"
                  stroke="#5a1408" strokeWidth="2" />
            <path d="M22 42 L52 50 L22 58 Z"
                  fill="#26b3d3" stroke="#0a3146" strokeWidth="1.5" />
          </g>
          {/* Trim band on hull */}
          <rect x="32" y="98" width="196" height="3" fill="#5a1408" />
        </svg>
        {/* Puffs of smoke rising from the stack */}
        <div className="ph-smoke ph-smoke-1" />
        <div className="ph-smoke ph-smoke-2" />
        <div className="ph-smoke ph-smoke-3" />
      </div>

      <svg className="ph-waves ph-waves-mid" viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path d="M0 30 Q150 50 300 30 T600 30 T900 30 T1200 30 V60 H0 Z"
              fill="rgba(18, 86, 130, 0.78)" />
        <path d="M0 30 Q150 50 300 30 T600 30 T900 30 T1200 30"
              stroke="rgba(220,240,255,0.5)" strokeWidth="1.6" fill="none" />
      </svg>
      <svg className="ph-waves ph-waves-front" viewBox="0 0 1200 60" preserveAspectRatio="none">
        <path d="M0 30 Q150 12 300 30 T600 30 T900 30 T1200 30 V60 H0 Z"
              fill="rgba(6, 44, 76, 0.92)" />
        <path d="M0 30 Q150 12 300 30 T600 30 T900 30 T1200 30"
              stroke="rgba(220,240,255,0.7)" strokeWidth="1.9" fill="none" />
      </svg>

      {/* THE Phantom Hourglass — centred, glowing. Two glass bulbs in a
       * golden frame, sand piled in the bottom bulb with a steady stream
       * trickling from the upper. */}
      <div className="ph-hourglass">
        <svg viewBox="-100 -160 200 320">
          {/* Glow halo behind the artifact */}
          <ellipse cx="0" cy="0" rx="92" ry="150"
                   fill="url(#ph-halo)" opacity="0.85" />
          <defs>
            <radialGradient id="ph-halo" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#7ad4ea" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#26b3d3" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#0a3146" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="ph-gold" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffe79a" />
              <stop offset="55%" stopColor="#f0c54a" />
              <stop offset="100%" stopColor="#a07820" />
            </linearGradient>
            <linearGradient id="ph-sand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffe79a" />
              <stop offset="100%" stopColor="#d49a3a" />
            </linearGradient>
            <linearGradient id="ph-glass" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(180, 235, 250, 0.55)" />
              <stop offset="50%" stopColor="rgba(120, 200, 230, 0.25)" />
              <stop offset="100%" stopColor="rgba(180, 235, 250, 0.55)" />
            </linearGradient>
          </defs>

          {/* Top & bottom golden caps */}
          <rect x="-72" y="-156" width="144" height="14" rx="3"
                fill="url(#ph-gold)" stroke="#604414" strokeWidth="2" />
          <rect x="-72" y="142" width="144" height="14" rx="3"
                fill="url(#ph-gold)" stroke="#604414" strokeWidth="2" />
          {/* Decorative bumps on the caps */}
          <g fill="#604414">
            <circle cx="-56" cy="-149" r="3" />
            <circle cx="0" cy="-149" r="3" />
            <circle cx="56" cy="-149" r="3" />
            <circle cx="-56" cy="149" r="3" />
            <circle cx="0" cy="149" r="3" />
            <circle cx="56" cy="149" r="3" />
          </g>

          {/* Upper bulb (glass) */}
          <path d="M-58 -142 Q-58 -60 -8 -10 L8 -10 Q58 -60 58 -142 Z"
                fill="url(#ph-glass)" stroke="#a07820" strokeWidth="2.5" />
          {/* Lower bulb (glass) */}
          <path d="M-58 142 Q-58 60 -8 10 L8 10 Q58 60 58 142 Z"
                fill="url(#ph-glass)" stroke="#a07820" strokeWidth="2.5" />
          {/* Pinched centre band */}
          <rect x="-12" y="-12" width="24" height="24"
                fill="url(#ph-gold)" stroke="#604414" strokeWidth="2" />

          {/* Sand piled in the upper bulb — shrinks over the loop */}
          <g className="ph-sand-upper">
            <path d="M-54 -130 Q-54 -70 -10 -16 L10 -16 Q54 -70 54 -130 Z"
                  fill="url(#ph-sand)" />
          </g>
          {/* Sand piled in the lower bulb — grows over the loop */}
          <g className="ph-sand-lower">
            <path d="M-50 142 Q-50 120 -30 110 Q-10 100 0 102 Q10 100 30 110 Q50 120 50 142 Z"
                  fill="url(#ph-sand)" />
          </g>

          {/* The falling sand stream */}
          <rect className="ph-sand-stream"
                x="-2" y="-10" width="4" height="120"
                fill="#f0c54a" />

          {/* Highlight on the glass */}
          <path d="M-46 -130 Q-50 -90 -30 -40"
                stroke="rgba(255,255,255,0.55)" strokeWidth="3"
                fill="none" strokeLinecap="round" />
          <path d="M-46 130 Q-50 90 -30 40"
                stroke="rgba(255,255,255,0.4)" strokeWidth="2.5"
                fill="none" strokeLinecap="round" />

          {/* Triforce engraving on the centre band */}
          <g fill="#fff7c8" opacity="0.85">
            <path d="M0 -7 L5 1 L-5 1 Z" />
          </g>
        </svg>
      </div>

      {/* Drifting gold sand motes around the hourglass */}
      <div className="ph-motes">
        <span className="ph-mote ph-mote-1" />
        <span className="ph-mote ph-mote-2" />
        <span className="ph-mote ph-mote-3" />
        <span className="ph-mote ph-mote-4" />
        <span className="ph-mote ph-mote-5" />
        <span className="ph-mote ph-mote-6" />
        <span className="ph-mote ph-mote-7" />
        <span className="ph-mote ph-mote-8" />
      </div>

      {/* Subtle cel-shaded foam ripples scattered across the sea */}
      <svg className="ph-foam" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <g stroke="rgba(255,255,255,0.85)" fill="none" strokeLinecap="round" strokeWidth="2">
          <path d="M60 40 q12 -10 24 0" />
          <path d="M220 70 q14 -10 28 0" />
          <path d="M400 30 q12 -10 24 0" />
          <path d="M560 90 q14 -10 28 0" />
          <path d="M720 50 q12 -10 24 0" />
          <path d="M880 110 q14 -10 28 0" />
          <path d="M1040 60 q12 -10 24 0" />
          <path d="M140 140 q16 -12 32 0" />
          <path d="M340 160 q16 -12 32 0" />
          <path d="M620 150 q16 -12 32 0" />
          <path d="M920 170 q16 -12 32 0" />
        </g>
      </svg>
    </div>
  );
}
