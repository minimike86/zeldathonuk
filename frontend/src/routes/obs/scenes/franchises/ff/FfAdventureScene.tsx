import './ff.css';

/**
 * Final Fantasy Adventure (Game Boy) — the great Mana Tree at the heart of a
 * gentle four-shade green world. Rendered in the soft, limited palette of the
 * original handheld: dithered foliage, a glowing seed at the tree's core, and
 * drifting leaves on a calm breeze. `.ffa-` namespace.
 */
export function FfAdventureScene() {
  return (
    <div className="ffa-scene" aria-hidden="true">
      {/* Soft glow behind the Mana Tree */}
      <div className="ffa-glow" />

      {/* Dithered "Game Boy" scanline overlay for retro texture */}
      <div className="ffa-scanlines" />

      {/* Distant rolling hills in mid-green */}
      <svg className="ffa-hills" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 120 Q200 80 400 110 Q600 140 800 100 Q1000 70 1200 110 L1200 200 Z"
              fill="rgba(96, 152, 88, 0.9)" />
      </svg>

      {/* The Mana Tree — vast canopy on a sturdy trunk */}
      <svg className="ffa-tree" viewBox="0 0 360 420">
        {/* trunk */}
        <path d="M150 420 L150 240 Q140 200 130 180 L150 180 L150 160 L210 160 L210 180 L230 180 Q220 200 210 240 L210 420 Z"
              fill="rgba(74, 110, 64, 0.98)" />
        {/* layered round canopy in stacked greens */}
        <g>
          <circle cx="180" cy="150" r="120" fill="rgba(56, 112, 64, 0.98)" />
          <circle cx="110" cy="170" r="80" fill="rgba(72, 136, 80, 0.96)" />
          <circle cx="250" cy="170" r="80" fill="rgba(72, 136, 80, 0.96)" />
          <circle cx="180" cy="120" r="86" fill="rgba(120, 176, 104, 0.95)" />
        </g>
        {/* glowing Mana seed at the heart */}
        <circle cx="180" cy="150" r="20" className="ffa-seed" fill="rgba(220, 240, 180, 0.95)" />
        <circle cx="180" cy="150" r="10" fill="#f4ffd8" />
      </svg>

      {/* Foreground grass tufts */}
      <svg className="ffa-grass" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0 120 L0 50 Q300 30 600 46 Q900 60 1200 40 L1200 120 Z" fill="rgba(58, 104, 56, 1)" />
        <g stroke="rgba(96, 152, 88, 0.9)" strokeWidth="4" strokeLinecap="round">
          <path d="M120 70 L120 40" />
          <path d="M340 76 L340 48" />
          <path d="M640 70 L640 42" />
          <path d="M900 78 L900 50" />
          <path d="M1080 72 L1080 44" />
        </g>
      </svg>

      {/* Drifting leaves on the breeze */}
      <div className="ffa-leaves" />
    </div>
  );
}
