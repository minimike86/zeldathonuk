/**
 * Oracle of Seasons scene — GBC-era pixel art that cycles through all four
 * seasons on a continuous loop.
 *
 * Centre stage: the Rod of Seasons embedded in the Temple of Seasons stone
 * pedestal, with the active season's gem glowing brighter. Around it:
 *
 *   • Spring  — cherry blossoms drifting, pink-tinted sky, pink-leaved tree
 *   • Summer  — bright sun rays, deep green canopy, no falling particles
 *   • Autumn  — falling orange/red leaves, amber sky, half-bare tree
 *   • Winter  — falling snowflakes, grey-blue sky, bare tree
 *
 * The Maku Tree (Seasons elder version, supplied by the project owner) sits
 * on the left. Subrosian volcano silhouette far back. Every shape uses
 * `shape-rendering="crispEdges"` to stay 16-bit chunky.
 */
export function OracleSeasonsScene() {
  return (
    <div className="oos-scene" aria-hidden="true">
      {/* Season-specific sky layers — each fades in for its quarter of the cycle */}
      <div className="oos-sky oos-sky-spring" />
      <div className="oos-sky oos-sky-summer" />
      <div className="oos-sky oos-sky-autumn" />
      <div className="oos-sky oos-sky-winter" />

      {/* Subrosian volcano far in the distance (always visible — Subrosia is below the seasons) */}
      <svg className="oos-volcano" viewBox="0 0 400 220" shapeRendering="crispEdges">
        <g fill="rgba(60, 24, 16, 0.92)">
          <path d="M0 220 L80 130 L130 100 L160 70 L180 50 L210 40 L240 60 L270 90 L320 130 L400 220 Z" />
        </g>
        <g fill="#e57c2a" opacity="0.85">
          <rect x="175" y="48" width="40" height="6" />
          <rect x="180" y="42" width="30" height="6" />
        </g>
        <g className="oos-volcano-flame">
          <path d="M190 40 Q187 28 195 22 Q200 30 197 38 Z" fill="#ffd23a" />
          <path d="M198 40 Q196 30 202 26 Q206 32 203 40 Z" fill="#ffc54a" />
        </g>
      </svg>

      {/* Distant mountain silhouettes — they stay grey/blue regardless of season */}
      <svg className="oos-mountains" viewBox="0 0 1200 200" preserveAspectRatio="none" shapeRendering="crispEdges">
        <path
          d="M0 200 L80 140 L160 160 L260 110 L340 150 L420 100 L520 140 L600 110 L700 80 L780 130 L860 100 L960 140 L1060 120 L1200 200 Z"
          fill="rgba(40, 60, 92, 0.88)"
        />
      </svg>

      {/* Foreground tree on the right — its canopy changes per season via CSS opacity */}
      <svg className="oos-tree" viewBox="0 0 200 280" shapeRendering="crispEdges">
        {/* trunk — same every season */}
        <g fill="#5a3a18">
          <rect x="86" y="160" width="28" height="110" />
          <rect x="78" y="170" width="44" height="6" />
          <rect x="80" y="240" width="40" height="20" />
        </g>
        {/* dark trunk shading */}
        <g fill="#3a2308">
          <rect x="106" y="160" width="8" height="110" />
        </g>

        {/* SPRING canopy — pink blossoms */}
        <g className="oos-canopy oos-canopy-spring">
          <g fill="#e88aae">
            <rect x="40" y="60" width="120" height="60" />
            <rect x="30" y="80" width="20" height="40" />
            <rect x="150" y="80" width="20" height="40" />
            <rect x="50" y="40" width="100" height="20" />
            <rect x="60" y="20" width="80" height="20" />
            <rect x="80" y="6" width="40" height="14" />
          </g>
          <g fill="#ffc2da" opacity="0.85">
            <rect x="56" y="56" width="20" height="12" />
            <rect x="68" y="36" width="16" height="12" />
            <rect x="120" y="46" width="14" height="10" />
          </g>
        </g>

        {/* SUMMER canopy — full lush green */}
        <g className="oos-canopy oos-canopy-summer">
          <g fill="#2a8a3a">
            <rect x="40" y="60" width="120" height="60" />
            <rect x="30" y="80" width="20" height="40" />
            <rect x="150" y="80" width="20" height="40" />
            <rect x="50" y="40" width="100" height="20" />
            <rect x="60" y="20" width="80" height="20" />
            <rect x="80" y="6" width="40" height="14" />
          </g>
          <g fill="#5cc065" opacity="0.85">
            <rect x="56" y="56" width="20" height="12" />
            <rect x="68" y="36" width="16" height="12" />
            <rect x="120" y="46" width="14" height="10" />
          </g>
        </g>

        {/* AUTUMN canopy — orange/red with patches missing */}
        <g className="oos-canopy oos-canopy-autumn">
          <g fill="#c8431f">
            <rect x="40" y="60" width="120" height="60" />
            <rect x="30" y="80" width="14" height="40" />
            <rect x="156" y="80" width="14" height="40" />
            <rect x="50" y="40" width="100" height="20" />
            <rect x="70" y="20" width="60" height="20" />
          </g>
          <g fill="#e57c2a">
            <rect x="60" y="60" width="20" height="12" />
            <rect x="100" y="48" width="20" height="12" />
            <rect x="78" y="80" width="18" height="14" />
          </g>
          <g fill="#f5b53a">
            <rect x="120" y="70" width="14" height="10" />
            <rect x="82" y="100" width="10" height="6" />
          </g>
        </g>

        {/* WINTER — bare branches, no canopy */}
        <g className="oos-canopy oos-canopy-winter">
          {/* spindly branches reaching up from the trunk */}
          <g fill="#3a2308">
            <rect x="98" y="40" width="4" height="120" />
            <rect x="98" y="40" width="20" height="4" />
            <rect x="86" y="56" width="4" height="14" />
            <rect x="76" y="50" width="14" height="4" />
            <rect x="116" y="70" width="4" height="14" />
            <rect x="116" y="70" width="16" height="4" />
            <rect x="80" y="90" width="22" height="4" />
            <rect x="100" y="100" width="20" height="4" />
            <rect x="76" y="22" width="4" height="20" />
            <rect x="70" y="22" width="14" height="4" />
            <rect x="124" y="38" width="14" height="4" />
            <rect x="124" y="38" width="4" height="18" />
          </g>
          {/* snow caps on the branches */}
          <g fill="#ffffff">
            <rect x="98" y="36" width="4" height="4" />
            <rect x="76" y="18" width="6" height="4" />
            <rect x="124" y="34" width="6" height="4" />
            <rect x="86" y="52" width="4" height="4" />
            <rect x="116" y="66" width="4" height="4" />
          </g>
        </g>
      </svg>

      {/* Ground band — colour shifts per season via the same .oos-ground stack */}
      <div className="oos-ground oos-ground-spring" />
      <div className="oos-ground oos-ground-summer" />
      <div className="oos-ground oos-ground-autumn" />
      <div className="oos-ground oos-ground-winter" />

      {/* Stone pedestal in the centre — the Temple of Seasons */}
      <svg className="oos-pedestal" viewBox="0 0 140 100" shapeRendering="crispEdges">
        {/* base steps */}
        <g fill="#9494a8">
          <rect x="6" y="80" width="128" height="14" />
          <rect x="0" y="94" width="140" height="6" />
        </g>
        <g fill="#6a6a82">
          <rect x="6" y="92" width="128" height="2" />
          <rect x="0" y="98" width="140" height="2" />
        </g>
        {/* main pillar */}
        <g fill="#b0b0c4">
          <rect x="40" y="20" width="60" height="62" />
        </g>
        <g fill="#7a7a92">
          <rect x="86" y="20" width="14" height="62" />
        </g>
        <g fill="#cccce0">
          <rect x="40" y="20" width="4" height="62" />
        </g>
        {/* engraved season symbols on the pillar */}
        <g>
          <rect x="46" y="30" width="6" height="6" fill="#e88aae" />
          <rect x="58" y="30" width="6" height="6" fill="#5cc065" />
          <rect x="70" y="30" width="6" height="6" fill="#e57c2a" />
          <rect x="82" y="30" width="6" height="6" fill="#cce4f0" />
        </g>
        {/* top rim */}
        <g fill="#cccce0">
          <rect x="36" y="14" width="68" height="8" />
        </g>
        <g fill="#7a7a92">
          <rect x="36" y="20" width="68" height="2" />
        </g>
      </svg>

      {/* The Rod of Seasons rising from the pedestal — four-gem staff */}
      <svg className="oos-rod" viewBox="0 0 40 160" shapeRendering="crispEdges">
        {/* shaft */}
        <g fill="#a87a08">
          <rect x="16" y="40" width="8" height="110" />
        </g>
        <g fill="#5a3a04">
          <rect x="22" y="40" width="2" height="110" />
        </g>
        {/* spiral grip wrap */}
        <g fill="#5a3a04">
          <rect x="14" y="56" width="12" height="2" />
          <rect x="14" y="74" width="12" height="2" />
          <rect x="14" y="92" width="12" height="2" />
          <rect x="14" y="110" width="12" height="2" />
          <rect x="14" y="128" width="12" height="2" />
        </g>
        {/* crown — four gems stacked in a diamond, one per season */}
        <g>
          <rect x="12" y="22" width="16" height="4" fill="#a87a08" />
          {/* spring gem (top) */}
          <rect className="oos-gem oos-gem-spring" x="16" y="6" width="8" height="8" fill="#e88aae" />
          <rect x="18" y="4" width="4" height="2" fill="#ffd2e0" />
          {/* summer gem (right) */}
          <rect className="oos-gem oos-gem-summer" x="26" y="14" width="8" height="8" fill="#5cc065" />
          <rect x="28" y="12" width="4" height="2" fill="#a3ec9c" />
          {/* autumn gem (bottom) */}
          <rect className="oos-gem oos-gem-autumn" x="16" y="22" width="8" height="8" fill="#e57c2a" />
          <rect x="18" y="20" width="4" height="2" fill="#ffaa3a" />
          {/* winter gem (left) */}
          <rect className="oos-gem oos-gem-winter" x="6" y="14" width="8" height="8" fill="#cce4f0" />
          <rect x="8" y="12" width="4" height="2" fill="#ffffff" />
        </g>
      </svg>

      {/* Maku Tree (Seasons, elder male) — supplied by project owner */}
      <img
        className="oos-maku"
        src="/assets/img/maku-tree-seasons.png"
        alt=""
      />

      {/* Link holding the Rod of Seasons — supplied by project owner. Sits on
        * the right of the pedestal as the hero foreground figure. */}
      <img
        className="oos-link"
        src="/assets/img/link-rod-seasons.png"
        alt=""
      />

      {/* Din, the Oracle of Seasons, mid-dance — supplied by project owner.
        * Floats on the left of the scene with a gentle dance bob. */}
      <img
        className="oos-din"
        src="/assets/img/din-seasons.png"
        alt=""
      />

      {/* Falling particles — one container per season, each visible only during its slice */}
      <div className="oos-particles oos-blossoms" />
      <div className="oos-particles oos-leaves" />
      <div className="oos-particles oos-snow" />
      <div className="oos-particles oos-sunrays" />

      {/* Season label briefly fading in/out as the wheel turns */}
      <div className="oos-season-label oos-label-spring">SPRING</div>
      <div className="oos-season-label oos-label-summer">SUMMER</div>
      <div className="oos-season-label oos-label-autumn">AUTUMN</div>
      <div className="oos-season-label oos-label-winter">WINTER</div>

      {/* GBC scanline overlay so it matches the Ages scene's retro feel */}
      <div className="oos-scanlines" />
    </div>
  );
}
