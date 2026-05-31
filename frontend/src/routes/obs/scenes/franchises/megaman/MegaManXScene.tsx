import './megaman.css';

/**
 * Mega Man X — a Tron-blue futuristic Maverick city at night. A neon-gridded
 * skyline of glowing towers recedes into electric haze, energy data-streams
 * pulse up the buildings, a hover-rail of light streaks across, and X's
 * helmeted silhouette stands on a foreground ledge with his buster charging.
 * Cool cyan / electric-blue palette. Covers X2-X5 as well.
 *
 * Namespace: `.mmx-`
 */
export function MegaManXScene() {
  return (
    <div className="mmx-scene" aria-hidden="true">
      {/* Electric haze glow on the horizon */}
      <div className="mmx-glow" />

      {/* Perspective neon floor grid receding to a vanishing point */}
      <svg className="mmx-grid" viewBox="0 0 1200 300" preserveAspectRatio="none">
        <g stroke="#1cd6ff" strokeWidth="1.4" opacity="0.55">
          {/* horizontals */}
          <line x1="0" y1="40" x2="1200" y2="40" opacity="0.3" />
          <line x1="0" y1="70" x2="1200" y2="70" opacity="0.4" />
          <line x1="0" y1="115" x2="1200" y2="115" opacity="0.55" />
          <line x1="0" y1="180" x2="1200" y2="180" opacity="0.7" />
          <line x1="0" y1="270" x2="1200" y2="270" />
        </g>
        {/* verticals converging on the centre vanishing point (600, 0) */}
        <g stroke="#1cd6ff" strokeWidth="1.4" opacity="0.5">
          <line x1="600" y1="0" x2="-260" y2="300" />
          <line x1="600" y1="0" x2="120" y2="300" />
          <line x1="600" y1="0" x2="360" y2="300" />
          <line x1="600" y1="0" x2="600" y2="300" />
          <line x1="600" y1="0" x2="840" y2="300" />
          <line x1="600" y1="0" x2="1080" y2="300" />
          <line x1="600" y1="0" x2="1460" y2="300" />
        </g>
      </svg>

      {/* Distant skyline — neon-edged Maverick towers */}
      <svg className="mmx-skyline" viewBox="0 0 1200 360" preserveAspectRatio="none">
        <g fill="#0a1430">
          <rect x="40" y="150" width="90" height="210" />
          <rect x="150" y="90" width="70" height="270" />
          <rect x="240" y="180" width="110" height="180" />
          <rect x="370" y="60" width="80" height="300" />
          <rect x="470" y="130" width="100" height="230" />
          <rect x="590" y="40" width="64" height="320" />
          <rect x="672" y="160" width="120" height="200" />
          <rect x="810" y="100" width="84" height="260" />
          <rect x="910" y="180" width="110" height="180" />
          <rect x="1040" y="80" width="74" height="280" />
          <rect x="1130" y="160" width="70" height="200" />
        </g>
        {/* neon top edges */}
        <g stroke="#28e6ff" strokeWidth="2.5" opacity="0.9">
          <line x1="150" y1="90" x2="220" y2="90" />
          <line x1="370" y1="60" x2="450" y2="60" />
          <line x1="590" y1="40" x2="654" y2="40" />
          <line x1="810" y1="100" x2="894" y2="100" />
          <line x1="1040" y1="80" x2="1114" y2="80" />
        </g>
        {/* lit window strips */}
        <g className="mmx-windows" fill="#28e6ff">
          <rect x="178" y="120" width="6" height="200" />
          <rect x="198" y="120" width="6" height="200" />
          <rect x="398" y="90" width="6" height="260" />
          <rect x="418" y="90" width="6" height="260" />
          <rect x="614" y="70" width="6" height="280" />
          <rect x="836" y="130" width="6" height="220" />
          <rect x="1064" y="110" width="6" height="240" />
        </g>
      </svg>

      {/* Light hover-rail streaking across the mid-sky */}
      <div className="mmx-streak" />

      {/* X silhouette on a foreground ledge, buster arm raised */}
      <svg className="mmx-x" viewBox="0 0 80 120">
        <g fill="#0c1840">
          {/* torso */}
          <path d="M28 50 L52 50 L54 86 L26 86 Z" />
          {/* helmet head */}
          <path d="M28 26 Q40 16 52 26 L52 44 L28 44 Z" />
          {/* helmet crest fin */}
          <path d="M38 16 L42 16 L46 6 L40 12 L34 6 Z" />
          {/* legs */}
          <rect x="28" y="86" width="9" height="30" />
          <rect x="43" y="86" width="9" height="30" />
          {/* buster arm raised forward */}
          <rect x="52" y="52" width="22" height="11" rx="3" />
        </g>
        {/* helmet ear gems */}
        <circle cx="30" cy="36" r="3" fill="#28e6ff" />
        <circle cx="50" cy="36" r="3" fill="#28e6ff" />
        {/* charged buster muzzle glow */}
        <circle className="mmx-buster" cx="74" cy="57" r="8" fill="#7af6ff" />
        {/* core chest light */}
        <circle cx="40" cy="62" r="3.5" fill="#28e6ff" />
      </svg>

      {/* Foreground ledge the hero stands on */}
      <svg className="mmx-ledge" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0 120 L0 40 L1200 20 L1200 120 Z" fill="#060c22" />
        <path d="M0 40 L1200 20" stroke="#28e6ff" strokeWidth="2" opacity="0.7" />
      </svg>

      {/* Rising energy data-motes */}
      <div className="mmx-motes" />
    </div>
  );
}
