import './dk.css';

/**
 * Donkey Kong Country 2: Diddy's Kong Quest — Crocodile Isle at dusk. A
 * stormy purple sky over a churning sea, the Kremling pirate galleon (the
 * Gangplank Galleon) listing on the waves with tattered sails and a skull
 * flag, jagged rigging, a glowing lantern, and a distant lightning flicker.
 * Moody pirate purples and teals.
 *
 * Namespace: `.dkc2-`
 */
export function DonkeyKongCountry2Scene() {
  return (
    <div className="dkc2-scene" aria-hidden="true">
      {/* Lightning flash flicker behind the clouds */}
      <div className="dkc2-lightning" />

      {/* Storm clouds rolling across the top */}
      <svg className="dkc2-clouds" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <g fill="#2a1840" opacity="0.92">
          <ellipse cx="120" cy="80" rx="180" ry="60" />
          <ellipse cx="360" cy="60" rx="200" ry="66" />
          <ellipse cx="640" cy="80" rx="220" ry="70" />
          <ellipse cx="920" cy="60" rx="200" ry="64" />
          <ellipse cx="1140" cy="80" rx="180" ry="60" />
        </g>
        <g fill="#3c2458" opacity="0.7">
          <ellipse cx="260" cy="40" rx="140" ry="40" />
          <ellipse cx="700" cy="36" rx="160" ry="44" />
          <ellipse cx="1040" cy="40" rx="140" ry="40" />
        </g>
      </svg>

      {/* The Gangplank Galleon listing on the swell */}
      <svg className="dkc2-ship" viewBox="0 0 360 260">
        {/* hull */}
        <path d="M30 180 Q40 230 120 240 L260 240 Q330 232 340 180 Z" fill="#3a2118" />
        <path d="M30 180 L340 180 L330 196 L40 196 Z" fill="#5a3322" />
        {/* gun ports */}
        <g fill="#1c0f0a">
          <rect x="80" y="200" width="18" height="16" rx="2" />
          <rect x="140" y="204" width="18" height="16" rx="2" />
          <rect x="200" y="204" width="18" height="16" rx="2" />
          <rect x="260" y="200" width="18" height="16" rx="2" />
        </g>
        {/* masts */}
        <rect x="120" y="40" width="8" height="142" fill="#2a1810" />
        <rect x="232" y="20" width="8" height="162" fill="#2a1810" />
        {/* cross spars */}
        <rect x="80" y="70" width="92" height="6" fill="#2a1810" />
        <rect x="190" y="56" width="96" height="6" fill="#2a1810" />
        {/* tattered sails */}
        <path d="M86 76 L166 76 L160 130 Q124 120 92 130 Z" fill="#cdbfa0" opacity="0.92" />
        <path d="M196 62 L280 62 L274 124 Q236 112 202 124 Z" fill="#cdbfa0" opacity="0.92" />
        {/* sail tears */}
        <path d="M120 100 L132 116 L116 124 Z" fill="#2a1840" opacity="0.85" />
        <path d="M236 92 L250 110 L232 116 Z" fill="#2a1840" opacity="0.85" />
        {/* skull-and-crossbones flag */}
        <rect x="232" y="14" width="6" height="8" fill="#2a1810" />
        <path d="M238 14 L300 18 L286 30 L238 28 Z" fill="#1c1228" />
        <circle cx="262" cy="22" r="5" fill="#e8e0cc" />
        <rect x="258" y="26" width="8" height="3" fill="#e8e0cc" />
        {/* glowing deck lantern */}
        <circle className="dkc2-lantern" cx="170" cy="172" r="7" fill="#ffb84a" />
      </svg>

      {/* Churning sea */}
      <svg className="dkc2-sea" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <path d="M0 240 L0 90 Q120 60 240 90 Q360 120 480 88 Q600 56 720 90 Q840 120 960 86 Q1080 56 1200 90 L1200 240 Z" fill="#15324a" />
        <path d="M0 240 L0 140 Q150 116 300 142 Q450 166 600 138 Q750 112 900 142 Q1050 168 1200 138 L1200 240 Z" fill="#0e2438" />
        {/* foam crests */}
        <g stroke="#3a6a82" strokeWidth="3" fill="none" opacity="0.7" strokeLinecap="round">
          <path d="M120 96 Q140 86 160 96" />
          <path d="M480 92 Q500 82 520 92" />
          <path d="M820 96 Q840 86 860 96" />
        </g>
      </svg>

      {/* Drifting sea spray motes */}
      <div className="dkc2-spray" />
    </div>
  );
}
