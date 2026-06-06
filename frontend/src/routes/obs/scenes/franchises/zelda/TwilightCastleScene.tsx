/**
 * Twilight Princess — Hyrule Castle sealed inside the twilight barrier.
 *
 * A glowing amber pyramidal dome encases the castle silhouette mid-screen.
 * Castle spires read in stark black against the warm glow inside the dome.
 * Black twilight squares — the iconic pixelated dissolution from the game's
 * cutscenes — peel off the dome and rise into the sky. A muted hill horizon
 * and a few distant twili glyphs floating in the dusk finish the mood.
 */
export function TwilightCastleScene() {
  return (
    <div className="tpc-scene" aria-hidden="true">
      {/* Sky gradient is on .tpc-scene itself; this layer adds a soft
       * dusk horizon glow centred behind the dome. */}
      <div className="tpc-horizon-glow" />

      {/* Drifting twili glyphs in the upper sky — small geometric runes
       * fading in and out at different cadences. */}
      <svg className="tpc-glyph tpc-glyph-1" viewBox="0 0 60 60">
        <g fill="none" stroke="#7e2d8e" strokeWidth="2" opacity="0.85">
          <rect x="14" y="14" width="32" height="32" />
          <path d="M14 30 L30 14 L46 30 L30 46 Z" />
          <circle cx="30" cy="30" r="6" />
        </g>
      </svg>
      <svg className="tpc-glyph tpc-glyph-2" viewBox="0 0 60 60">
        <g fill="none" stroke="#ffaa3a" strokeWidth="1.5" opacity="0.8">
          <path d="M10 30 L30 10 L50 30 L30 50 Z" />
          <path d="M22 30 L30 22 L38 30 L30 38 Z" />
        </g>
      </svg>
      <svg className="tpc-glyph tpc-glyph-3" viewBox="0 0 60 60">
        <g fill="none" stroke="#7e2d8e" strokeWidth="1.5" opacity="0.8">
          <circle cx="30" cy="30" r="20" />
          <path d="M30 10 L30 50 M10 30 L50 30" />
        </g>
      </svg>

      {/* Dark hill horizon — silhouetted ridge line at the base of the sky. */}
      <svg className="tpc-hills" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 200 L0 130 Q150 95 280 110 Q420 130 540 105 Q680 80 820 100
             Q960 120 1080 95 Q1140 85 1200 105 L1200 200 Z"
          fill="rgba(14, 6, 22, 0.95)"
        />
        <path
          d="M0 200 L0 160 Q200 145 380 158 Q560 175 740 152 Q920 130 1100 150
             Q1160 155 1200 148 L1200 200 Z"
          fill="rgba(8, 4, 14, 0.98)"
        />
      </svg>

      {/* The twilight dome — pyramidal amber field over the castle. Glow is
       * doubled (broad halo + crisper inner cone) so the dome reads as both
       * luminous and physical. */}
      <div className="tpc-dome">
        <svg viewBox="-200 -260 400 280">
          <defs>
            <linearGradient id="tpc-dome-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="rgba(255, 220, 120, 0.85)" />
              <stop offset="55%"  stopColor="rgba(220, 160, 60, 0.55)" />
              <stop offset="100%" stopColor="rgba(120, 70, 20, 0.25)" />
            </linearGradient>
            <linearGradient id="tpc-dome-edge" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="rgba(255, 240, 180, 1)" />
              <stop offset="100%" stopColor="rgba(180, 100, 30, 0.4)" />
            </linearGradient>
            <linearGradient id="tpc-castle" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(10, 4, 6, 0.95)" />
              <stop offset="100%" stopColor="rgba(20, 8, 14, 0.85)" />
            </linearGradient>
          </defs>

          {/* Soft outer halo */}
          <path
            d="M0 -250 L180 10 L-180 10 Z"
            fill="rgba(255, 200, 100, 0.18)"
            filter="url(#tpc-blur)"
          />

          {/* Main dome face */}
          <path
            d="M0 -250 L170 10 L-170 10 Z"
            fill="url(#tpc-dome-fill)"
            stroke="url(#tpc-dome-edge)"
            strokeWidth="2"
          />

          {/* Internal lattice — faint dome panel lines suggesting a magical
            * tessellated barrier rather than smooth glass. */}
          <g stroke="rgba(255, 235, 170, 0.35)" strokeWidth="1" fill="none">
            <path d="M0 -250 L-110 10 M0 -250 L110 10" />
            <path d="M0 -250 L-55 10 M0 -250 L55 10" />
            <path d="M-120 -78 L120 -78" />
            <path d="M-150 -30 L150 -30" />
            <path d="M-85 -130 L85 -130" />
          </g>

          {/* Hyrule Castle silhouette inside the dome. Five spires fanning
            * outward from a central tall keep — stylised. */}
          <g fill="url(#tpc-castle)">
            {/* Castle base / hill */}
            <path d="M-130 10 L-110 -20 L-90 -10 L-70 -25 L-30 -15 L0 -30
                     L30 -15 L70 -25 L90 -10 L110 -20 L130 10 Z" />
            {/* Outer left tower */}
            <path d="M-120 -10 L-110 -90 L-100 -100 L-90 -90 L-90 -10 Z" />
            <path d="M-110 -100 L-100 -118 L-90 -100 Z" />
            {/* Inner left tower */}
            <path d="M-78 -18 L-70 -130 L-60 -142 L-50 -130 L-50 -18 Z" />
            <path d="M-70 -142 L-60 -162 L-50 -142 Z" />
            {/* Central keep — tall, with crenellations */}
            <path d="M-32 -28 L-30 -180 L-20 -210 L0 -228 L20 -210 L30 -180 L32 -28 Z" />
            <g>
              <rect x="-22" y="-186" width="4" height="-10" />
              <rect x="-12" y="-186" width="4" height="-10" />
              <rect x="-2"  y="-186" width="4" height="-10" />
              <rect x="8"   y="-186" width="4" height="-10" />
              <rect x="18"  y="-186" width="4" height="-10" />
            </g>
            {/* Inner right tower */}
            <path d="M50 -18 L50 -130 L60 -142 L70 -130 L78 -18 Z" />
            <path d="M50 -142 L60 -162 L70 -142 Z" />
            {/* Outer right tower */}
            <path d="M90 -10 L90 -90 L100 -100 L110 -90 L120 -10 Z" />
            <path d="M90 -100 L100 -118 L110 -100 Z" />
          </g>

          {/* Light beam piercing up through the dome apex */}
          <path d="M-6 -250 L6 -250 L18 20 L-18 20 Z"
                fill="rgba(255, 235, 170, 0.35)" />

          <filter id="tpc-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </svg>
      </div>

      {/* Black twilight squares peeling off the dome and floating upward.
       * The signature dissolution effect from the game's cutscenes. */}
      <div className="tpc-pixels">
        <span className="tpc-pixel tpc-pixel-1" />
        <span className="tpc-pixel tpc-pixel-2" />
        <span className="tpc-pixel tpc-pixel-3" />
        <span className="tpc-pixel tpc-pixel-4" />
        <span className="tpc-pixel tpc-pixel-5" />
        <span className="tpc-pixel tpc-pixel-6" />
        <span className="tpc-pixel tpc-pixel-7" />
        <span className="tpc-pixel tpc-pixel-8" />
        <span className="tpc-pixel tpc-pixel-9" />
        <span className="tpc-pixel tpc-pixel-10" />
        <span className="tpc-pixel tpc-pixel-11" />
        <span className="tpc-pixel tpc-pixel-12" />
      </div>

      {/* Soft vignette pulling the eye toward the castle */}
      <div className="tpc-vignette" />
    </div>
  );
}
