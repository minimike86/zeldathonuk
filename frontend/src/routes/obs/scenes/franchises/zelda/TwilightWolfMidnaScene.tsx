/**
 * Twilight Princess — Wolf Link with Midna in the Twili-rune chamber.
 *
 * A stone dungeon interior with cyan Twili glyphs glowing on the back wall
 * and floor tiles. Wolf Link stalks centre-frame in silhouette with Midna's
 * imp form perched atop, her Fused Shadow helmet catching the light and an
 * orange eye burning beneath. Twili pixel motes drift upward, and the room
 * pulses with a faint cyan glow on a slow breath cycle.
 */
export function TwilightWolfMidnaScene() {
  return (
    <div className="tpw-scene" aria-hidden="true">
      {/* Back wall — coarse stonework with mortar lines. Built from a
       * repeating-linear-gradient stack so it scales without an image. */}
      <div className="tpw-wall" />

      {/* Glowing Twili rune carved into the back wall above the wolf */}
      <svg className="tpw-wall-rune" viewBox="-100 -100 200 200">
        <g fill="none" stroke="#5fd6c0" strokeWidth="2.2" opacity="0.85"
           strokeLinecap="round" strokeLinejoin="round">
          {/* Outer broken ring */}
          <path d="M-70 0 A70 70 0 0 1 -10 -68" />
          <path d="M10 -68 A70 70 0 0 1 70 0" />
          <path d="M70 0 A70 70 0 0 1 10 68" />
          <path d="M-10 68 A70 70 0 0 1 -70 0" />
          {/* Inner spiral / square-spiral motif */}
          <path d="M-40 -20 L-40 30 L20 30 L20 -10 L-10 -10 L-10 10" />
          {/* Bottom hooks */}
          <path d="M-50 50 L-30 40 M50 50 L30 40" />
          {/* Crown ticks */}
          <path d="M0 -80 L0 -68 M-30 -72 L-26 -60 M30 -72 L26 -60" />
        </g>
      </svg>

      {/* Floor — perspective tiles. Drawn as a single SVG with trapezoidal
       * panels so the geometry reads as a recessed dungeon floor. */}
      <svg className="tpw-floor" viewBox="-600 0 1200 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="tpw-floor-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1c2230" />
            <stop offset="100%" stopColor="#06080c" />
          </linearGradient>
        </defs>
        <path d="M-600 300 L600 300 L260 0 L-260 0 Z"
              fill="url(#tpw-floor-fill)" />
        {/* Receding longitudinal tile lines */}
        <g stroke="rgba(95, 214, 192, 0.18)" strokeWidth="1.5" fill="none">
          <path d="M-260 0 L-600 300" />
          <path d="M-160 0 L-420 300" />
          <path d="M-60 0  L-160 300" />
          <path d="M60 0   L160 300" />
          <path d="M160 0  L420 300" />
          <path d="M260 0  L600 300" />
          <path d="M0 0    L0 300" opacity="0.35" />
        </g>
        {/* Latitudinal tile rows getting wider toward the camera */}
        <g stroke="rgba(95, 214, 192, 0.22)" strokeWidth="1.5" fill="none">
          <path d="M-260 0   L260 0" opacity="0.3" />
          <path d="M-292 28  L292 28" />
          <path d="M-340 70  L340 70" />
          <path d="M-410 130 L410 130" />
          <path d="M-510 220 L510 220" />
        </g>
      </svg>

      {/* Cyan twilight glow ring on the floor right under the wolf */}
      <div className="tpw-floor-glow" />

      {/* Wolf Link — chunky silhouette with a faint twili rune brand on the
       * shoulder and a single glowing orange eye. */}
      <svg className="tpw-wolf" viewBox="0 0 320 200">
        <defs>
          <linearGradient id="tpw-fur" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1410" />
            <stop offset="100%" stopColor="#06040a" />
          </linearGradient>
        </defs>
        {/* Body */}
        <path
          d="M40 150 L52 105 L78 92 L92 70 L116 60 L130 85 L170 80
             L210 88 L260 92 L292 110 L298 150 L276 168 L240 178
             L160 180 L88 178 L52 168 Z"
          fill="url(#tpw-fur)"
          stroke="#000"
          strokeWidth="1.5"
        />
        {/* Ears */}
        <path d="M100 65 L92 38 L120 60 Z" fill="#06040a" />
        <path d="M126 60 L120 30 L142 58 Z" fill="#06040a" />
        {/* Snout */}
        <path d="M260 92 L304 96 L306 112 L290 118 L262 110 Z" fill="#06040a" />
        {/* Tail */}
        <path d="M38 148 L8 130 L4 162 L36 162 Z" fill="#06040a" />
        {/* Legs (front + back, suggested) */}
        <g fill="#04020a">
          <rect x="92"  y="160" width="14" height="36" />
          <rect x="138" y="162" width="14" height="36" />
          <rect x="222" y="160" width="14" height="38" />
          <rect x="262" y="162" width="14" height="36" />
        </g>
        {/* Paw cuffs — the twilight realm gives wolf-Link banded cuffs */}
        <g fill="#4a3018" stroke="#000" strokeWidth="1">
          <rect x="90"  y="188" width="18" height="6" />
          <rect x="136" y="190" width="18" height="6" />
          <rect x="220" y="188" width="18" height="6" />
          <rect x="260" y="190" width="18" height="6" />
        </g>
        {/* Twili rune brand on the shoulder */}
        <g fill="none" stroke="#5fd6c0" strokeWidth="1.6"
           opacity="0.85" strokeLinecap="round">
          <path d="M158 110 L168 110 L168 122 L180 122" />
          <path d="M162 130 L174 130" />
        </g>
        {/* Glowing eye */}
        <circle cx="282" cy="104" r="3.2" fill="#ffaa3a" />
        <circle cx="282" cy="104" r="6" fill="#ffaa3a" opacity="0.35" />
      </svg>

      {/* Midna — perched on the wolf's back. Stylised imp silhouette with the
       * Fused Shadow helmet (carved stone), a single orange eye, a tuft of
       * golden hair atop, and cyan Twili line-glyphs across her form. */}
      <svg className="tpw-midna" viewBox="0 0 200 240">
        {/* Body — small imp curled forward */}
        <g fill="#b8ccc4" stroke="#0a1a18" strokeWidth="1.4">
          {/* Torso */}
          <path d="M84 130 Q70 110 80 92 Q92 78 108 80 Q126 84 130 100
                   Q132 122 122 138 Q108 150 96 148 Z" />
          {/* Arms */}
          <path d="M86 128 Q74 140 70 158 Q72 168 82 166 Q90 158 92 144 Z" />
          <path d="M124 132 Q138 142 142 160 Q142 170 132 168 Q122 158 118 144 Z" />
          {/* Lower body */}
          <path d="M96 148 Q100 168 96 192 L108 192 Q112 168 108 148 Z" />
        </g>
        {/* Cyan twili markings on the body */}
        <g fill="none" stroke="#5fd6c0" strokeWidth="1.8"
           opacity="0.95" strokeLinecap="round">
          <path d="M100 102 L104 116 L96 124 L106 136" />
          <path d="M88 112 L94 122" />
          <path d="M120 112 L114 122" />
          <path d="M100 156 L104 172 L100 184" />
          <path d="M94 168 L106 168" />
        </g>
        {/* Fused Shadow helmet — carved stone with engraved spiral motifs */}
        <g>
          <path
            d="M52 50 Q40 36 60 22 Q78 12 100 14 Q124 14 140 24 Q160 36 148 52
               Q140 64 130 70 L130 78 L132 88 L118 90 L110 76 L96 76 L86 86
               L74 90 L72 78 L70 70 Q58 64 52 50 Z"
            fill="#7a8a8a"
            stroke="#1a2424"
            strokeWidth="1.6"
          />
          {/* Engraved spiral patterns on helmet front */}
          <g fill="none" stroke="#2a3434" strokeWidth="1.2">
            <path d="M70 38 L82 38 L82 50 L70 50 L70 42 L78 42 L78 46" />
            <path d="M118 38 L130 38 L130 50 L118 50 L118 42 L126 42 L126 46" />
            <path d="M88 30 Q100 22 112 30" />
            <path d="M88 60 Q100 66 112 60" />
          </g>
          {/* Side prongs */}
          <path d="M52 50 L36 60 L48 64 Z" fill="#7a8a8a" stroke="#1a2424" strokeWidth="1.6" />
          <path d="M148 50 L164 60 L152 64 Z" fill="#7a8a8a" stroke="#1a2424" strokeWidth="1.6" />
          {/* Glowing cyan crack lines */}
          <g fill="none" stroke="#5fd6c0" strokeWidth="1.5" opacity="0.85">
            <path d="M88 70 L92 78 L98 80" />
            <path d="M112 70 L108 78 L102 80" />
          </g>
        </g>
        {/* Golden hair tuft poking from the top of the helmet */}
        <g fill="#ffd24a" stroke="#a07820" strokeWidth="1.2">
          <path d="M86 14 L90 0 L96 12 L102 -4 L108 12 L114 0 L118 14
                   Q100 22 86 14 Z" />
        </g>
        {/* Glowing single orange eye peeking from beneath the helmet */}
        <g>
          <ellipse cx="100" cy="58" rx="5" ry="3.5" fill="#ffaa3a" />
          <ellipse cx="100" cy="58" rx="11" ry="6" fill="#ffaa3a" opacity="0.35" />
        </g>
      </svg>

      {/* Twili pixel motes drifting upward — small black squares that fade
       * out as they ascend, plus a few cyan flecks. */}
      <div className="tpw-motes">
        <span className="tpw-mote tpw-mote-1" />
        <span className="tpw-mote tpw-mote-2" />
        <span className="tpw-mote tpw-mote-3" />
        <span className="tpw-mote tpw-mote-4" />
        <span className="tpw-mote tpw-mote-5" />
        <span className="tpw-mote tpw-mote-6" />
        <span className="tpw-mote tpw-mote-7 tpw-mote-cyan" />
        <span className="tpw-mote tpw-mote-8 tpw-mote-cyan" />
        <span className="tpw-mote tpw-mote-9 tpw-mote-cyan" />
      </div>

      {/* Side torch sconces casting warm pools of light against the wall */}
      <div className="tpw-torch tpw-torch-l" />
      <div className="tpw-torch tpw-torch-r" />

      {/* Soft vignette — pulls focus to the centre and darkens edges */}
      <div className="tpw-vignette" />
    </div>
  );
}
