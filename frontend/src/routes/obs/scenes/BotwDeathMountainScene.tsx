/**
 * Breath of the Wild — Death Mountain at night.
 *
 * The iconic spiral volcano belching orange glow into a deep purple sky.
 * Vah Rudania (the salamander Divine Beast) clings to the side, scales
 * lit from below by lava. Lava streams trickle down the slopes, smoke
 * rises from the caldera, and ember sparks drift across the screen.
 */
export function BotwDeathMountainScene() {
  return (
    <div className="botw-dm-scene" aria-hidden="true">
      {/* Volcanic ambient glow behind the mountain */}
      <div className="botw-dm-skyglow" />

      {/* Smoke plume rising from the crater */}
      <div className="botw-dm-smoke" />
      <div className="botw-dm-smoke botw-dm-smoke-2" />

      {/* Far mountain silhouettes */}
      <svg className="botw-dm-far-mountains" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 200 L100 140 L220 170 L340 100 L460 150 L600 110 L740 140 L880 90 L1000 130 L1200 200 Z"
          fill="rgba(38, 18, 32, 0.92)"
        />
      </svg>

      {/* The volcano itself — chunky silhouette with a glowing crater */}
      <svg className="botw-dm-volcano" viewBox="0 0 600 360">
        {/* main cone body */}
        <path
          d="M40 360 L160 240 L220 180 L260 130 L280 100 L320 100 L340 130 L380 180 L440 240 L560 360 Z"
          fill="rgba(28, 10, 16, 0.98)"
        />
        {/* Caldera rim — slight inward dip */}
        <path
          d="M275 100 L325 100 L335 115 L265 115 Z"
          fill="rgba(255, 110, 32, 0.95)"
        />
        {/* glow inside the crater */}
        <ellipse cx="300" cy="118" rx="36" ry="10" fill="#ffd23a" opacity="0.85" />
        {/* lava streams running down the cone */}
        <g className="botw-dm-lava">
          <path
            d="M280 115 L266 150 L262 180 L258 215 L252 250 L246 290 L240 335"
            stroke="#ff5a18"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M320 115 L330 150 L336 185 L342 220 L350 260 L356 300"
            stroke="#ff7a1c"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M300 118 L302 160 L304 200 L306 240 L308 280 L310 320"
            stroke="#ffaa3a"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            opacity="0.85"
          />
        </g>
        {/* highlight on the right ridge */}
        <path
          d="M340 130 L380 180 L440 240"
          stroke="rgba(255, 110, 32, 0.35)"
          strokeWidth="2"
          fill="none"
        />
      </svg>

      {/* Vah Rudania (salamander) crawling on the cone */}
      <svg className="botw-dm-rudania" viewBox="0 0 220 100">
        <g>
          {/* tail */}
          <path
            d="M0 60 Q20 40 50 55 Q80 70 100 60"
            stroke="#1a1018"
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
          />
          {/* body */}
          <ellipse cx="120" cy="55" rx="60" ry="22" fill="#1a1018" />
          {/* head */}
          <ellipse cx="186" cy="48" rx="22" ry="16" fill="#1a1018" />
          {/* legs */}
          <path d="M85 75 L80 95 L92 95 L96 75" fill="#1a1018" />
          <path d="M155 75 L150 95 L162 95 L166 75" fill="#1a1018" />
          {/* spine markings — orange Sheikah glyphs */}
          <g fill="#f56b1a">
            <circle cx="80" cy="45" r="3.5" />
            <circle cx="110" cy="40" r="4" />
            <circle cx="140" cy="42" r="4" />
            <circle cx="170" cy="44" r="3.5" />
          </g>
          {/* eye glow */}
          <circle cx="195" cy="45" r="3" fill="#f56b1a" />
          <circle cx="195" cy="45" r="1.5" fill="#fff" />
        </g>
      </svg>

      {/* Foreground silhouette — Goron-village ridge */}
      <svg className="botw-dm-foreground" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 200 L0 140 Q120 110 280 130 Q420 145 580 120 Q740 100 900 130 Q1060 150 1200 130 L1200 200 Z"
          fill="rgba(10, 4, 10, 1)"
        />
        {/* boulder-like Goron silhouettes */}
        <g fill="rgba(40, 18, 16, 0.95)">
          <circle cx="180" cy="135" r="12" />
          <circle cx="520" cy="125" r="14" />
          <circle cx="860" cy="130" r="11" />
        </g>
      </svg>

      {/* Embers drifting up across the whole scene */}
      <div className="botw-dm-embers" />
      <div className="botw-dm-embers botw-dm-embers-2" />
    </div>
  );
}
