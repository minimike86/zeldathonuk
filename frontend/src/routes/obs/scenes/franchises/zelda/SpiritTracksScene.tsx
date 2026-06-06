/**
 * Spirit Tracks scene — DS cel-shaded landscape with the Tower of Spirits
 * on the horizon, rolling green hills, train tracks crossing the foreground,
 * and the Spirit Train chugging across with billowing steam plumes.
 *
 * Built from inline SVG + CSS so the OBS browser source loads no external
 * assets. The train rides on a CSS animation that loops it across the screen.
 */
export function SpiritTracksScene() {
  return (
    <div className="st-scene" aria-hidden="true">
      {/* Soft sun glow high in the sky */}
      <div className="st-sun" />

      {/* Drifting cloud layer */}
      <div className="st-clouds" />

      {/* Tower of Spirits — tall fantasy spire centre-back */}
      <svg
        className="st-tower"
        viewBox="0 0 200 380"
        preserveAspectRatio="xMidYEnd meet"
        aria-hidden="true"
      >
        {/* Tower glow halo */}
        <ellipse cx="100" cy="160" rx="74" ry="180" fill="rgba(180, 230, 255, 0.18)" />

        {/* Main spire — tapered, ringed with stacked tiers */}
        <g fill="#d9c8a4">
          <rect x="86" y="40" width="28" height="140" />
          <rect x="78" y="180" width="44" height="60" />
          <rect x="70" y="240" width="60" height="60" />
          <rect x="60" y="300" width="80" height="68" />
        </g>
        {/* Tier shadow lips */}
        <g fill="#8c7a52">
          <rect x="80" y="178" width="40" height="4" />
          <rect x="72" y="238" width="56" height="4" />
          <rect x="62" y="298" width="76" height="4" />
        </g>
        {/* Lighter highlight strip on the left edge */}
        <g fill="#f0e2c0">
          <rect x="86"  y="40"  width="3" height="140" />
          <rect x="78"  y="180" width="3" height="60" />
          <rect x="70"  y="240" width="3" height="60" />
          <rect x="60"  y="300" width="3" height="68" />
        </g>
        {/* Right-side darker shade */}
        <g fill="#a8956a">
          <rect x="111" y="40"  width="3" height="140" />
          <rect x="119" y="180" width="3" height="60" />
          <rect x="127" y="240" width="3" height="60" />
          <rect x="137" y="300" width="3" height="68" />
        </g>
        {/* Conical top spire */}
        <g fill="#3a6e2a">
          <path d="M100 8 L114 40 L86 40 Z" />
        </g>
        <path d="M100 8 L100 40 L86 40 Z" fill="#5a9a3a" />
        {/* Spire crown ball */}
        <circle cx="100" cy="6" r="3" fill="#ffd23a" />
        {/* Windows down the spire — glowing yellow */}
        <g fill="#ffd23a">
          <rect x="96" y="64"  width="8" height="10" />
          <rect x="96" y="92"  width="8" height="10" />
          <rect x="96" y="120" width="8" height="10" />
          <rect x="96" y="150" width="8" height="10" />
          {/* Arched windows on the second tier */}
          <rect x="88"  y="196" width="6" height="14" />
          <rect x="106" y="196" width="6" height="14" />
          {/* Third tier */}
          <rect x="78"  y="258" width="6" height="14" />
          <rect x="96"  y="258" width="8" height="14" />
          <rect x="116" y="258" width="6" height="14" />
        </g>
        {/* Window shading (lower halves) */}
        <g fill="#a87a18">
          <rect x="96" y="72"  width="8" height="2" />
          <rect x="96" y="100" width="8" height="2" />
          <rect x="96" y="128" width="8" height="2" />
          <rect x="96" y="158" width="8" height="2" />
        </g>
        {/* Base — wide ornate plinth at ground level */}
        <g fill="#b8a070">
          <rect x="50" y="368" width="100" height="12" />
        </g>
        <g fill="#7a6440">
          <rect x="50" y="376" width="100" height="4" />
        </g>
      </svg>

      {/* Far rolling hills — softest, layered */}
      <svg className="st-hills-far" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <path
          d="M0 240 L0 120
             Q150 90 300 110
             Q450 130 600 100
             Q750 70 900 110
             Q1050 145 1200 115
             L1200 240 Z"
          fill="#5a8a3a"
        />
        {/* Hilltop highlight */}
        <path
          d="M0 120 Q150 90 300 110 Q450 130 600 100 Q750 70 900 110 Q1050 145 1200 115"
          stroke="#7eb04a"
          strokeWidth="3"
          fill="none"
        />
      </svg>

      {/* Mid hills — closer, brighter green */}
      <svg className="st-hills-mid" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 200 L0 90
             Q200 60 380 80
             Q560 100 760 70
             Q940 50 1200 90
             L1200 200 Z"
          fill="#4a7a2a"
        />
        <path
          d="M0 90 Q200 60 380 80 Q560 100 760 70 Q940 50 1200 90"
          stroke="#6ea03a"
          strokeWidth="3"
          fill="none"
        />
      </svg>

      {/* Distant tiny trees dotting the hills */}
      <svg className="st-trees" viewBox="0 0 1200 80" preserveAspectRatio="none">
        <g fill="#1c3a14">
          <StTree x={80}   />
          <StTree x={170}  />
          <StTree x={260}  />
          <StTree x={390}  />
          <StTree x={520}  />
          <StTree x={680}  />
          <StTree x={780}  />
          <StTree x={920}  />
          <StTree x={1050} />
          <StTree x={1140} />
        </g>
      </svg>

      {/* Foreground grass plain — the strip the tracks rest on */}
      <div className="st-grass" />

      {/* Train tracks — long horizontal pair with regular wooden sleepers */}
      <svg
        className="st-tracks"
        viewBox="0 0 1200 60"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Track-bed gravel shadow */}
        <rect x="0" y="14" width="1200" height="40" fill="#5a4a2a" opacity="0.65" />
        {/* Sleepers (wooden ties) */}
        <g fill="#3a2818">
          {Array.from({ length: 60 }).map((_, i) => (
            <rect key={i} x={i * 20} y="18" width="14" height="30" />
          ))}
        </g>
        {/* Sleeper highlight on top edge */}
        <g fill="#6a4a2a">
          {Array.from({ length: 60 }).map((_, i) => (
            <rect key={i} x={i * 20} y="18" width="14" height="2" />
          ))}
        </g>
        {/* Steel rails */}
        <rect x="0" y="22" width="1200" height="3" fill="#b8b8c8" />
        <rect x="0" y="42" width="1200" height="3" fill="#b8b8c8" />
        <rect x="0" y="24" width="1200" height="1" fill="#7a7a8a" />
        <rect x="0" y="44" width="1200" height="1" fill="#7a7a8a" />
      </svg>

      {/* The Spirit Train — locomotive + tender + carriage. Wrapped in a
        * container that animates left→right across the scene. The train
        * silhouette is drawn in DS cel-shaded style with thick outlines. */}
      <div className="st-train">
        <svg
          viewBox="0 0 320 110"
          shapeRendering="auto"
          aria-hidden="true"
        >
          {/* === LOCOMOTIVE === */}
          {/* Cowcatcher (front grille) */}
          <g stroke="#0a0a18" strokeWidth="2" strokeLinejoin="round">
            <path d="M14 84 L4 100 L40 100 L34 84 Z" fill="#a02828" />
            <line x1="10" y1="92" x2="38" y2="92" stroke="#7a1a1a" strokeWidth="1.5" />
          </g>

          {/* Main boiler — long cylindrical body */}
          <rect
            x="34" y="50" width="100" height="44" rx="6"
            fill="#c83838" stroke="#0a0a18" strokeWidth="2"
          />
          {/* Boiler highlight stripe */}
          <rect x="36" y="54" width="96" height="4" fill="#e87878" />
          {/* Boiler banding */}
          <rect x="58" y="50" width="3" height="44" fill="#7a1a1a" />
          <rect x="98" y="50" width="3" height="44" fill="#7a1a1a" />
          {/* Gold trim band along bottom */}
          <rect
            x="34" y="86" width="100" height="6"
            fill="#ffd23a" stroke="#0a0a18" strokeWidth="1.5"
          />

          {/* Front headlight */}
          <circle cx="40" cy="72" r="5" fill="#fff5b8" stroke="#0a0a18" strokeWidth="1.5" />
          <circle cx="40" cy="72" r="2" fill="#ffffff" />

          {/* Smokestack — chimney rising from the boiler top */}
          <g stroke="#0a0a18" strokeWidth="2">
            <rect x="50" y="32" width="14" height="20" fill="#3a3a4a" />
            <rect x="46" y="28" width="22" height="6"  fill="#5a5a6a" />
          </g>
          <rect x="52" y="34" width="2" height="16" fill="#7a7a8a" />

          {/* Dome (steam dome) — gold cap behind smokestack */}
          <g stroke="#0a0a18" strokeWidth="2">
            <path d="M80 50 L80 38 Q92 30 104 38 L104 50 Z" fill="#ffd23a" />
          </g>
          <path d="M82 40 Q92 34 102 40" stroke="#fff0a0" strokeWidth="2" fill="none" />

          {/* Cab (driver's compartment) */}
          <g stroke="#0a0a18" strokeWidth="2">
            <rect x="134" y="42" width="46" height="52" fill="#c83838" />
            <rect x="138" y="48" width="14" height="14" fill="#6ec4e8" /> {/* window */}
            <rect x="162" y="48" width="14" height="14" fill="#6ec4e8" />
            {/* Cab roof */}
            <path d="M130 42 L184 42 L188 36 L126 36 Z" fill="#7a1a1a" />
          </g>
          <rect x="138" y="48" width="14" height="3" fill="#a0e0f8" />
          <rect x="162" y="48" width="14" height="3" fill="#a0e0f8" />

          {/* === TENDER (coal car behind cab) === */}
          <g stroke="#0a0a18" strokeWidth="2">
            <rect x="190" y="56" width="60" height="38" fill="#7a3818" />
            {/* Coal lumps poking up */}
            <path d="M194 56 Q200 50 206 56 Q212 50 218 56 Q224 50 230 56 Q236 50 242 56 Q246 50 250 56"
                  fill="#1a1a24" stroke="#0a0a18" strokeWidth="1.5" />
            {/* Tender side trim */}
            <rect x="190" y="86" width="60" height="6" fill="#ffd23a" />
          </g>

          {/* === PASSENGER CARRIAGE === */}
          <g stroke="#0a0a18" strokeWidth="2">
            <rect x="254" y="48" width="60" height="46" fill="#d6b048" />
            {/* Windows */}
            <rect x="260" y="56" width="12" height="12" fill="#6ec4e8" />
            <rect x="276" y="56" width="12" height="12" fill="#6ec4e8" />
            <rect x="292" y="56" width="12" height="12" fill="#6ec4e8" />
            {/* Roof */}
            <path d="M250 48 L318 48 L314 40 L254 40 Z" fill="#7a5a18" />
            {/* Lower trim */}
            <rect x="254" y="86" width="60" height="6" fill="#a07820" />
          </g>
          <rect x="260" y="56" width="12" height="3" fill="#a0e0f8" />
          <rect x="276" y="56" width="12" height="3" fill="#a0e0f8" />
          <rect x="292" y="56" width="12" height="3" fill="#a0e0f8" />

          {/* === WHEELS === */}
          <g stroke="#0a0a18" strokeWidth="2" fill="#1a1a24">
            {/* Locomotive — three drive wheels */}
            <circle cx="50"  cy="98" r="7" />
            <circle cx="78"  cy="98" r="9" />
            <circle cx="112" cy="98" r="9" />
            {/* Tender wheels */}
            <circle cx="204" cy="98" r="7" />
            <circle cx="236" cy="98" r="7" />
            {/* Carriage wheels */}
            <circle cx="268" cy="98" r="7" />
            <circle cx="300" cy="98" r="7" />
          </g>
          {/* Wheel hubs */}
          <g fill="#7a7a8a">
            <circle cx="50"  cy="98" r="2" />
            <circle cx="78"  cy="98" r="3" />
            <circle cx="112" cy="98" r="3" />
            <circle cx="204" cy="98" r="2" />
            <circle cx="236" cy="98" r="2" />
            <circle cx="268" cy="98" r="2" />
            <circle cx="300" cy="98" r="2" />
          </g>
          {/* Connecting rod between locomotive drive wheels */}
          <rect x="76" y="96" width="38" height="3" fill="#5a5a6a" stroke="#0a0a18" strokeWidth="1" />

          {/* Couplings between cars */}
          <rect x="180" y="86" width="12" height="4" fill="#3a3a4a" stroke="#0a0a18" strokeWidth="1" />
          <rect x="248" y="86" width="8"  height="4" fill="#3a3a4a" stroke="#0a0a18" strokeWidth="1" />
        </svg>

        {/* Steam plumes billowing from the smokestack — multiple puffs in a
          * trail, each puff scaling and fading on its own offset cycle. */}
        <span className="st-steam st-steam-1" />
        <span className="st-steam st-steam-2" />
        <span className="st-steam st-steam-3" />
        <span className="st-steam st-steam-4" />
        <span className="st-steam st-steam-5" />
      </div>

      {/* Spirit wisps floating across the upper-mid scene */}
      <div className="st-wisps" />

      {/* Subtle ground-shadow gradient under the tracks */}
      <div className="st-track-shadow" />
    </div>
  );
}

/** Tiny pine-tree silhouette dotted along the hills. */
function StTree({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path d="M0 60 L-8 60 L0 40 L8 60 Z" />
      <path d="M0 50 L-10 70 L10 70 Z" />
      <rect x="-1.5" y="68" width="3" height="6" fill="#3a2818" />
    </g>
  );
}
