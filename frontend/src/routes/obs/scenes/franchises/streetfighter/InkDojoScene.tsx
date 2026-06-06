import './streetfighter.css';

/**
 * Street Fighter IV — sumi-e ink-splash dojo. A warm cream/rice-paper backdrop
 * with a bold red rising-sun disc, sweeping black brush-stroke calligraphy,
 * a sliding shoji screen, a fighter silhouette painted in rough ink with a
 * trailing brush smear, and splattering ink droplets flicked across the frame.
 * `.sf4-` namespace.
 */
export function InkDojoScene() {
  return (
    <div className="sf4-scene" aria-hidden="true">
      {/* Bold red rising-sun ink disc */}
      <div className="sf4-sun" />

      {/* Shoji screen lattice across the back */}
      <svg className="sf4-shoji" viewBox="0 0 1200 400" preserveAspectRatio="none">
        <rect x="0" y="0" width="1200" height="400" fill="rgba(244, 236, 220, 0.55)" />
        <g stroke="rgba(60, 42, 30, 0.5)" strokeWidth="3">
          {[150, 300, 450, 600, 750, 900, 1050].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="400" />
          ))}
          <line x1="0" y1="130" x2="1200" y2="130" />
          <line x1="0" y1="260" x2="1200" y2="260" />
        </g>
      </svg>

      {/* Big sweeping brush-stroke arc */}
      <svg className="sf4-brushstroke" viewBox="0 0 1200 300" preserveAspectRatio="none">
        <path d="M-40 120 Q300 -10 620 90 Q920 180 1240 70"
          fill="none" stroke="rgba(18, 14, 12, 0.92)" strokeWidth="34" strokeLinecap="round" />
        {/* dry-brush splits trailing the stroke */}
        <path d="M820 130 Q1000 150 1180 110"
          fill="none" stroke="rgba(18, 14, 12, 0.5)" strokeWidth="6" strokeLinecap="round" />
      </svg>

      {/* Vertical calligraphy column on the left */}
      <svg className="sf4-calligraphy" viewBox="0 0 120 360">
        <g fill="rgba(18, 14, 12, 0.9)">
          <path d="M30 20 Q60 30 90 24 Q66 40 90 56 Q60 50 34 60 Q40 40 30 20 Z" />
          <path d="M40 110 Q70 120 96 112 L60 140 Q44 124 40 110 Z" />
          <path d="M28 170 L92 162 L88 178 L30 186 Z" />
          <path d="M56 200 L66 280 L52 280 Z" />
          <path d="M30 300 Q60 310 90 302 Q66 320 90 336 Q56 330 32 340 Q40 320 30 300 Z" />
        </g>
        {/* red seal stamp */}
        <rect x="40" y="200" width="40" height="40" rx="4" fill="rgba(200, 30, 36, 0.92)" />
        <g stroke="rgba(255, 240, 232, 0.9)" strokeWidth="3" fill="none">
          <line x1="50" y1="210" x2="50" y2="230" />
          <line x1="60" y1="208" x2="60" y2="232" />
          <line x1="70" y1="210" x2="70" y2="230" />
          <line x1="46" y1="220" x2="74" y2="220" />
        </g>
      </svg>

      {/* Fighter painted in rough ink, mid focus-attack stance */}
      <svg className="sf4-fighter" viewBox="0 0 120 170">
        <g fill="rgba(16, 12, 10, 0.96)">
          {/* deep horse-stance legs */}
          <path d="M48 96 L22 156 L36 158 L58 104 Z" />
          <path d="M70 96 L96 156 L82 158 L60 104 Z" />
          {/* torso, coiled forward */}
          <path d="M44 50 L74 50 Q84 76 70 102 L48 102 Q34 76 44 50 Z" />
          {/* both fists drawn back, charging */}
          <path d="M46 64 L22 72 L24 82 L48 76 Z" />
          <path d="M72 64 L96 72 L94 82 L70 76 Z" />
          {/* head */}
          <ellipse cx="58" cy="42" rx="11" ry="12" />
        </g>
        {/* trailing ink smear behind the back leg */}
        <path d="M82 150 Q120 140 150 158 Q116 156 84 162 Z" fill="rgba(16, 12, 10, 0.55)" />
        {/* red sash */}
        <path d="M44 94 L74 94 L70 104 L48 104 Z" fill="rgba(200, 30, 36, 0.9)" />
      </svg>

      {/* Focus-attack charge ring around the fighter */}
      <svg className="sf4-focusring" viewBox="-60 -60 120 120">
        <circle cx="0" cy="0" r="50" fill="none" stroke="rgba(200, 30, 36, 0.7)"
          strokeWidth="5" strokeDasharray="14 10" />
      </svg>

      {/* Cream wooden floor */}
      <svg className="sf4-floor" viewBox="0 0 1200 160" preserveAspectRatio="none">
        <path d="M0 160 L0 30 Q600 8 1200 30 L1200 160 Z" fill="rgba(214, 188, 150, 0.95)" />
        <g stroke="rgba(120, 90, 56, 0.3)" strokeWidth="3">
          <line x1="0" y1="70" x2="1200" y2="58" />
          <line x1="0" y1="116" x2="1200" y2="106" />
          <line x1="400" y1="20" x2="400" y2="160" />
          <line x1="800" y1="16" x2="800" y2="160" />
        </g>
      </svg>

      {/* Flicked ink splatter droplets */}
      <svg className="sf4-splatter" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
        <g fill="rgba(16, 12, 10, 0.85)">
          <circle cx="180" cy="120" r="10" />
          <circle cx="210" cy="140" r="4" />
          <circle cx="240" cy="96" r="3" />
          <circle cx="980" cy="90" r="12" />
          <circle cx="1010" cy="120" r="5" />
          <circle cx="950" cy="130" r="3" />
          <circle cx="600" cy="60" r="7" />
          <circle cx="640" cy="44" r="3" />
          <ellipse cx="420" cy="200" rx="8" ry="4" transform="rotate(30 420 200)" />
          <ellipse cx="760" cy="220" rx="9" ry="4" transform="rotate(-24 760 220)" />
        </g>
      </svg>
    </div>
  );
}
