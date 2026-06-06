import './castlevania.css';

/**
 * Castlevania III: Dracula's Curse — Trevor Belmont braces on a crumbling stone
 * bridge, whip raised, as a storm rages over the distant castle. Stormy
 * blue/violet palette with lightning. `.cv3-` namespace.
 */
export function Castlevania3Scene() {
  return (
    <div className="cv3-scene" aria-hidden="true">
      {/* Storm clouds rolling across the sky */}
      <svg className="cv3-clouds" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <g fill="rgba(24, 18, 44, 0.85)">
          <ellipse cx="140" cy="80" rx="180" ry="60" />
          <ellipse cx="420" cy="60" rx="200" ry="64" />
          <ellipse cx="720" cy="80" rx="190" ry="58" />
          <ellipse cx="1020" cy="64" rx="200" ry="62" />
        </g>
        <g fill="rgba(40, 32, 66, 0.7)">
          <ellipse cx="260" cy="120" rx="160" ry="48" />
          <ellipse cx="600" cy="130" rx="180" ry="50" />
          <ellipse cx="940" cy="120" rx="170" ry="48" />
        </g>
      </svg>

      {/* Lightning flash overlay */}
      <div className="cv3-lightning" />

      {/* Distant castle on the far cliff */}
      <svg className="cv3-castle" viewBox="0 0 280 200">
        <path d="M20 200 L20 90 L60 90 L60 60 L90 60 L90 30 L120 30 L120 70 L180 70 L180 50 L220 50 L220 90 L260 90 L260 200 Z"
          fill="rgba(14, 10, 24, 0.98)" />
        {/* towers */}
        <path d="M100 30 L100 8 L120 8 L120 30 Z" fill="rgba(10, 8, 20, 0.99)" />
        <path d="M96 8 L124 8 L110 -6 Z" fill="rgba(10, 8, 20, 0.99)" />
        <rect x="190" y="30" width="22" height="20" fill="rgba(10, 8, 20, 0.99)" />
        {/* faint lit windows */}
        <g fill="#caa6ff" opacity="0.6">
          <rect x="106" y="16" width="6" height="10" />
          <rect x="196" y="36" width="5" height="8" />
        </g>
      </svg>

      {/* Crumbling stone bridge across the foreground */}
      <svg className="cv3-bridge" viewBox="0 0 1200 220" preserveAspectRatio="none">
        {/* bridge deck */}
        <path d="M0 220 L0 90 L1200 90 L1200 220 Z" fill="rgba(10, 8, 18, 1)" />
        {/* deck top edge with broken gaps */}
        <path d="M0 90 L300 90 L320 84 L520 84 L540 92 L820 92 L840 84 L1080 84 L1100 90 L1200 90 L1200 70 L0 70 Z"
          fill="rgba(28, 22, 42, 0.98)" />
        {/* stone block seams */}
        <g stroke="rgba(6, 4, 12, 0.8)" strokeWidth="2">
          <line x1="120" y1="92" x2="120" y2="220" />
          <line x1="300" y1="92" x2="300" y2="220" />
          <line x1="540" y1="94" x2="540" y2="220" />
          <line x1="760" y1="94" x2="760" y2="220" />
          <line x1="980" y1="92" x2="980" y2="220" />
        </g>
        {/* crumbling chunk falling */}
        <g fill="rgba(28, 22, 42, 0.9)">
          <rect x="620" y="120" width="22" height="18" transform="rotate(18 631 129)" />
          <rect x="680" y="160" width="16" height="14" transform="rotate(-12 688 167)" />
        </g>
        {/* support arches below */}
        <g fill="rgba(16, 12, 26, 0.95)">
          <path d="M80 220 L80 140 Q200 110 320 140 L320 220 Z" />
          <path d="M880 220 L880 140 Q1000 110 1120 140 L1120 220 Z" />
        </g>
      </svg>

      {/* Trevor Belmont on the bridge, whip raised */}
      <svg className="cv3-trevor" viewBox="0 0 140 160">
        {/* whip — pivots from the raised hand */}
        <path className="cv3-whip"
          d="M44 44 Q10 20 -6 34 Q14 30 30 50"
          fill="none" stroke="#7a5a2a" strokeWidth="4" strokeLinecap="round" />
        {/* cape */}
        <path d="M58 50 Q86 70 80 130 L60 120 Z" fill="rgba(40, 12, 16, 0.95)" />
        {/* body */}
        <path d="M48 56 L70 56 L66 118 L52 118 Z" fill="rgba(36, 26, 16, 1)" />
        {/* head + headband */}
        <ellipse cx="58" cy="44" rx="10" ry="11" fill="rgba(30, 22, 14, 1)" />
        <rect x="48" y="40" width="20" height="4" fill="#9a1a22" />
        {/* raised whip arm */}
        <rect x="44" y="40" width="14" height="6" rx="3" fill="rgba(36, 26, 16, 1)" transform="rotate(-28 50 43)" />
        {/* legs braced */}
        <path d="M52 118 L48 150 L56 150 L60 120 Z" fill="rgba(28, 20, 12, 1)" />
        <path d="M62 118 L72 148 L80 146 L68 116 Z" fill="rgba(28, 20, 12, 1)" />
      </svg>
    </div>
  );
}
