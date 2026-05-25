/**
 * Breath of the Wild scene — painterly silhouette of Hyrule at sunset.
 *
 * Sunset-banded sky, layered mountain silhouettes, the Great Plateau in the
 * foreground with a glowing Sheikah Shrine, a Sheikah Tower rising on the
 * right with its orange glyph rings, and Hyrule Castle in the far distance
 * with crimson Malice tendrils swirling around it. Link's silhouette stands
 * on the cliff edge, paraglider stowed.
 */
export function BotwScene() {
  return (
    <div className="botw-scene" aria-hidden="true">
      {/* Sun glow at the horizon */}
      <div className="botw-sun" />

      {/* Far mountains */}
      <svg className="botw-mountains botw-mountains-far" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 200 L80 130 L160 160 L260 100 L340 150 L420 90 L520 140 L600 110 L700 80 L780 130 L860 100 L960 140 L1060 120 L1200 200 Z"
          fill="rgba(70, 50, 80, 0.92)"
        />
      </svg>

      {/* Hyrule Castle far in the distance, centre-back */}
      <svg className="botw-castle" viewBox="0 0 220 160">
        {/* outer wall */}
        <path
          d="M10 150 L10 110 L30 100 L30 80 L60 75 L60 60 L90 50 L90 35 L110 25 L130 35 L130 50 L160 60 L160 75 L190 80 L190 100 L210 110 L210 150 Z"
          fill="rgba(40, 30, 50, 0.97)"
        />
        {/* central keep */}
        <path
          d="M85 60 L85 30 L100 22 L120 22 L135 30 L135 60 Z"
          fill="rgba(28, 20, 36, 0.98)"
        />
        {/* spire */}
        <path d="M105 22 L110 8 L115 22 Z" fill="rgba(28, 20, 36, 0.98)" />
      </svg>

      {/* Malice tendrils swirling around the castle */}
      <svg className="botw-malice" viewBox="-100 -100 200 200">
        <g stroke="#a8181c" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85">
          <path className="botw-malice-tendril" d="M-90 60 Q-60 -40 -10 -20 Q40 0 30 -60 Q20 -90 -20 -80" />
          <path className="botw-malice-tendril botw-malice-tendril-2" d="M70 40 Q40 -20 -10 -10 Q-50 10 -60 -40 Q-70 -70 -30 -85" />
          <path className="botw-malice-tendril botw-malice-tendril-3" d="M-50 80 Q0 30 50 50 Q90 60 80 0" />
        </g>
        {/* eyeball malice spots */}
        <g fill="#ff3833">
          <circle cx="-30" cy="-40" r="3.5" />
          <circle cx="20" cy="-30" r="3" />
          <circle cx="-15" cy="20" r="3" />
        </g>
        {/* black inner pupils */}
        <g fill="#1a0204">
          <circle cx="-30" cy="-40" r="1.5" />
          <circle cx="20" cy="-30" r="1.2" />
          <circle cx="-15" cy="20" r="1.2" />
        </g>
      </svg>

      {/* Mid-range mountains */}
      <svg className="botw-mountains botw-mountains-mid" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 200 L100 110 L220 150 L340 80 L460 130 L580 90 L700 130 L820 70 L960 120 L1080 100 L1200 200 Z"
          fill="rgba(36, 20, 44, 0.96)"
        />
      </svg>

      {/* Sheikah Tower rising up on the right */}
      <svg className="botw-tower" viewBox="0 0 100 320">
        {/* base platform */}
        <path d="M30 320 L70 320 L75 305 L25 305 Z" fill="rgba(28, 60, 80, 0.98)" />
        {/* shaft */}
        <path
          d="M40 305 L60 305 L62 30 L38 30 Z"
          fill="rgba(32, 70, 92, 0.98)"
          stroke="rgba(10, 30, 42, 1)"
          strokeWidth="1"
        />
        {/* shaft inner glow stripe */}
        <rect x="48" y="35" width="4" height="270" fill="#f56b1a" opacity="0.85" />
        {/* ring band — Sheikah glyph */}
        <g>
          <rect x="32" y="60" width="36" height="14" fill="rgba(20, 40, 56, 1)" />
          <circle cx="50" cy="67" r="4" fill="#f56b1a" />
          <rect x="32" y="160" width="36" height="14" fill="rgba(20, 40, 56, 1)" />
          <circle cx="50" cy="167" r="4" fill="#f56b1a" />
          <rect x="32" y="260" width="36" height="14" fill="rgba(20, 40, 56, 1)" />
          <circle cx="50" cy="267" r="4" fill="#f56b1a" />
        </g>
        {/* top crown with map pedestal */}
        <path d="M30 30 L70 30 L72 18 L28 18 Z" fill="rgba(40, 80, 100, 1)" />
        <rect x="40" y="6" width="20" height="12" fill="rgba(30, 60, 78, 1)" />
        <rect x="44" y="0" width="12" height="6" fill="#f56b1a" />
      </svg>

      {/* Near foreground: cliff / plateau silhouette */}
      <svg className="botw-plateau" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 200 L0 150 Q80 130 200 140 Q320 150 460 130 Q580 115 720 135 Q860 145 1000 125 Q1120 110 1200 130 L1200 200 Z"
          fill="rgba(14, 8, 18, 1)"
        />
      </svg>

      {/* Glowing Sheikah Shrine on the plateau */}
      <svg className="botw-shrine" viewBox="0 0 80 80">
        {/* base pedestal */}
        <rect x="20" y="60" width="40" height="14" fill="rgba(24, 50, 66, 0.98)" />
        {/* upright pillar with sheikah symbol */}
        <rect x="28" y="20" width="24" height="44" fill="rgba(36, 70, 90, 0.98)" stroke="rgba(8, 24, 36, 1)" strokeWidth="1" />
        {/* glowing eye sheikah symbol */}
        <path d="M30 30 Q40 22 50 30 Q40 38 30 30 Z" fill="#f56b1a" />
        <circle cx="40" cy="30" r="2.5" fill="#fff" />
        {/* vertical glow bar */}
        <rect x="38" y="40" width="4" height="20" fill="#f56b1a" />
      </svg>
      <div className="botw-shrine-glow" />

      {/* Link silhouette standing on the plateau, paraglider stowed */}
      <svg className="botw-link" viewBox="0 0 30 60">
        <g fill="rgba(8, 4, 14, 1)">
          {/* body / tunic */}
          <path d="M11 24 L19 24 L19 44 L11 44 Z" />
          {/* head */}
          <ellipse cx="15" cy="18" rx="5" ry="6" />
          {/* hat */}
          <path d="M10 16 L13 8 L20 8 L22 18 Z" />
          {/* arm + sword raised */}
          <rect x="19" y="22" width="3" height="14" />
          <rect x="21" y="6" width="2" height="18" />
          {/* legs */}
          <rect x="11" y="44" width="3" height="14" />
          <rect x="16" y="44" width="3" height="14" />
        </g>
        {/* sword glow */}
        <rect x="21" y="2" width="2" height="4" fill="#a8d4ff" opacity="0.9" />
      </svg>

      {/* Drifting Sheikah-orange ember particles */}
      <div className="botw-embers" />
    </div>
  );
}
