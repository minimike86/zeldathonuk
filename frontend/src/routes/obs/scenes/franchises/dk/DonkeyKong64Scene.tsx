import './dk.css';

/**
 * Donkey Kong 64 — an N64-era jungle clearing. Lush layered foliage under a
 * golden sky, a wooden DK-emblem sign, golden bananas and a Banana Coin
 * bobbing, and DK aiming his coconut gun with a coconut shot streaking past.
 * Banana-gold accents on jungle greens. `.dk64-` namespace.
 */
export function DonkeyKong64Scene() {
  return (
    <div className="dk64-scene" aria-hidden="true">
      {/* Warm canopy light bloom */}
      <div className="dk64-sun" />

      {/* Far jungle treeline */}
      <svg className="dk64-trees" viewBox="0 0 1200 280" preserveAspectRatio="none">
        <g fill="rgba(20, 60, 26, 0.92)">
          <ellipse cx="120" cy="180" rx="160" ry="120" />
          <ellipse cx="360" cy="160" rx="180" ry="130" />
          <ellipse cx="620" cy="190" rx="170" ry="120" />
          <ellipse cx="860" cy="160" rx="180" ry="130" />
          <ellipse cx="1100" cy="185" rx="170" ry="120" />
        </g>
        <g fill="rgba(40, 96, 44, 0.7)">
          <ellipse cx="240" cy="120" rx="90" ry="50" />
          <ellipse cx="540" cy="110" rx="100" ry="54" />
          <ellipse cx="820" cy="120" rx="90" ry="50" />
        </g>
      </svg>

      {/* Big foreground leaves framing the clearing */}
      <svg className="dk64-leaf dk64-leaf-left" viewBox="0 0 220 320">
        <path d="M210 320 Q40 280 20 120 Q10 40 70 10 Q60 110 120 180 Q170 240 210 320 Z" fill="#2f7a34" stroke="#1c4a22" strokeWidth="3" />
        <path d="M70 60 Q120 160 200 300" stroke="#1c4a22" strokeWidth="2.5" fill="none" opacity="0.7" />
      </svg>
      <svg className="dk64-leaf dk64-leaf-right" viewBox="0 0 220 320">
        <path d="M10 320 Q180 280 200 120 Q210 40 150 10 Q160 110 100 180 Q50 240 10 320 Z" fill="#367f3a" stroke="#1c4a22" strokeWidth="3" />
        <path d="M150 60 Q100 160 20 300" stroke="#1c4a22" strokeWidth="2.5" fill="none" opacity="0.7" />
      </svg>

      {/* Wooden DK-emblem sign */}
      <svg className="dk64-sign" viewBox="0 0 120 130">
        <rect x="54" y="60" width="12" height="70" fill="#6a3a1a" />
        <rect x="6" y="10" width="108" height="60" rx="8" fill="#8a5226" stroke="#4a2a10" strokeWidth="4" />
        <g stroke="#5a3216" strokeWidth="2" opacity="0.6"><path d="M6 30 L114 30 M6 50 L114 50" /></g>
        <text x="60" y="52" fontSize="36" fontWeight="800" textAnchor="middle" fill="#ffd23a" stroke="#9a5a14" strokeWidth="1">DK</text>
      </svg>

      {/* Bobbing golden bananas */}
      <svg className="dk64-banana dk64-banana-a" viewBox="0 0 60 50">
        <path d="M8 14 Q4 40 30 46 Q56 48 54 22 Q50 38 30 38 Q14 36 16 14 Z" fill="#ffd23a" stroke="#c89a14" strokeWidth="3" />
        <path d="M8 14 L4 6 L12 10 Z" fill="#6a4a1a" />
      </svg>
      <svg className="dk64-banana dk64-banana-b" viewBox="0 0 60 50">
        <path d="M8 14 Q4 40 30 46 Q56 48 54 22 Q50 38 30 38 Q14 36 16 14 Z" fill="#ffd23a" stroke="#c89a14" strokeWidth="3" />
        <path d="M8 14 L4 6 L12 10 Z" fill="#6a4a1a" />
      </svg>

      {/* Banana Coin spinning */}
      <svg className="dk64-coin" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="22" fill="#ffcf2a" stroke="#b8870f" strokeWidth="3" />
        <path d="M16 16 Q14 32 26 34 Q38 34 36 22 Q33 30 25 30 Q18 28 20 16 Z" fill="#9a6a0a" />
      </svg>

      {/* DK with coconut gun + coconut shot */}
      <svg className="dk64-dk" viewBox="0 0 160 160">
        <g fill="#5a3418">
          <ellipse cx="74" cy="92" rx="44" ry="46" />
          <ellipse cx="74" cy="42" rx="28" ry="26" />
          <ellipse cx="40" cy="138" rx="16" ry="14" />
          <ellipse cx="100" cy="138" rx="16" ry="14" />
          <path d="M28 70 Q6 50 16 30 L38 52 Z" />
        </g>
        {/* muzzle face */}
        <ellipse cx="74" cy="52" rx="18" ry="13" fill="#caa07a" />
        <circle cx="66" cy="38" r="3.5" fill="#fff" /><circle cx="82" cy="38" r="3.5" fill="#fff" />
        <circle cx="66" cy="38" r="1.8" fill="#1a1a1a" /><circle cx="82" cy="38" r="1.8" fill="#1a1a1a" />
        {/* red tie */}
        <path d="M68 66 L80 66 L78 92 L70 92 Z" fill="#e0341a" />
        <text x="74" y="84" fontSize="14" fontWeight="800" textAnchor="middle" fill="#ffd23a">DK</text>
        {/* coconut gun barrel */}
        <g fill="#caa23a" stroke="#7a5a14" strokeWidth="2">
          <rect x="104" y="96" width="48" height="16" rx="6" />
          <circle cx="152" cy="104" r="9" fill="#2a1c10" />
        </g>
      </svg>
      {/* coconut streaking from the gun */}
      <svg className="dk64-coconut" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="#7a4a22" stroke="#4a2a10" strokeWidth="3" />
        <circle cx="14" cy="14" r="3" fill="#3a1c08" /><circle cx="24" cy="12" r="3" fill="#3a1c08" /><circle cx="20" cy="22" r="3" fill="#3a1c08" />
      </svg>
    </div>
  );
}
