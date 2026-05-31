import './dk.css';

/**
 * Donkey Kong Country — the lush jungle canopy. Warm dappled sunlight
 * through a dense leaf ceiling, hanging vines with a swinging tyre, a
 * stack of wooden DK barrels, a striped wooden sign, big tropical fronds
 * framing the sides, and DK's gorilla silhouette beating his chest on a
 * vine. Warm jungle greens and barrel browns.
 *
 * Namespace: `.dkc-`
 */
export function DonkeyKongCountryScene() {
  return (
    <div className="dkc-scene" aria-hidden="true">
      {/* Dappled sun glow filtering through the canopy */}
      <div className="dkc-sun" />

      {/* Dense canopy ceiling across the top */}
      <svg className="dkc-canopy" viewBox="0 0 1200 220" preserveAspectRatio="none">
        <g fill="#1c4a26">
          <ellipse cx="100" cy="40" rx="160" ry="80" />
          <ellipse cx="320" cy="20" rx="180" ry="86" />
          <ellipse cx="600" cy="40" rx="200" ry="90" />
          <ellipse cx="880" cy="20" rx="180" ry="86" />
          <ellipse cx="1120" cy="40" rx="160" ry="80" />
        </g>
        <g fill="#2c6a36" opacity="0.8">
          <ellipse cx="220" cy="10" rx="120" ry="50" />
          <ellipse cx="700" cy="6" rx="140" ry="54" />
          <ellipse cx="1000" cy="10" rx="120" ry="50" />
        </g>
        {/* leaf-highlight sparkles */}
        <g fill="#5aa84a" opacity="0.7">
          <circle cx="160" cy="20" r="3" />
          <circle cx="440" cy="12" r="3" />
          <circle cx="760" cy="16" r="3" />
          <circle cx="1040" cy="14" r="3" />
        </g>
      </svg>

      {/* Hanging vines */}
      <svg className="dkc-vines" viewBox="0 0 1200 360" preserveAspectRatio="none">
        <g stroke="#235c2c" strokeWidth="5" fill="none" strokeLinecap="round">
          <path d="M180 0 Q176 120 184 220" />
          <path d="M420 0 Q426 140 418 260" />
          <path d="M980 0 Q974 130 982 240" />
        </g>
        {/* leaves on vines */}
        <g fill="#3a7a3e">
          <ellipse cx="178" cy="120" rx="6" ry="12" transform="rotate(-30 178 120)" />
          <ellipse cx="424" cy="150" rx="6" ry="12" transform="rotate(25 424 150)" />
          <ellipse cx="976" cy="130" rx="6" ry="12" transform="rotate(-25 976 130)" />
        </g>
      </svg>

      {/* Swinging tyre on a vine */}
      <svg className="dkc-tyre" viewBox="0 0 80 120">
        <line x1="40" y1="0" x2="40" y2="50" stroke="#235c2c" strokeWidth="5" />
        <circle cx="40" cy="80" r="30" fill="#1a1a1a" />
        <circle cx="40" cy="80" r="16" fill="#3a2a1a" />
      </svg>

      {/* DK barrel stack on the ground */}
      <svg className="dkc-barrels" viewBox="0 0 160 160">
        {/* two base barrels */}
        <g>
          <rect x="6" y="70" width="64" height="84" rx="14" fill="#7a4a22" />
          <rect x="90" y="70" width="64" height="84" rx="14" fill="#7a4a22" />
        </g>
        {/* top barrel */}
        <rect x="48" y="6" width="64" height="84" rx="14" fill="#8a5628" />
        {/* metal bands + DK letters */}
        <g fill="#caa23a">
          <rect x="6" y="92" width="64" height="8" />
          <rect x="90" y="92" width="64" height="8" />
          <rect x="48" y="28" width="64" height="8" />
        </g>
        <g fill="#caa23a" opacity="0.95">
          <rect x="68" y="46" width="6" height="24" />
          <rect x="84" y="46" width="6" height="24" />
        </g>
      </svg>

      {/* DK gorilla silhouette on a vine */}
      <svg className="dkc-dk" viewBox="0 0 120 140">
        <line x1="60" y1="0" x2="60" y2="40" stroke="#235c2c" strokeWidth="6" />
        <g fill="#3a2414">
          {/* body */}
          <ellipse cx="60" cy="80" rx="34" ry="40" />
          {/* head */}
          <ellipse cx="60" cy="40" rx="22" ry="20" />
          {/* arms gripping vine / beating chest */}
          <path d="M30 56 Q12 40 20 24 L34 40 Z" />
          <path d="M90 56 Q108 40 100 24 L86 40 Z" />
          {/* legs */}
          <ellipse cx="44" cy="120" rx="12" ry="16" />
          <ellipse cx="76" cy="120" rx="12" ry="16" />
        </g>
        {/* muzzle + tie */}
        <ellipse cx="60" cy="48" rx="14" ry="9" fill="#caa07a" />
        <path d="M52 60 L68 60 L64 78 L56 78 Z" fill="#c0282c" />
        {/* eyes */}
        <circle cx="53" cy="36" r="2.5" fill="#fff" />
        <circle cx="67" cy="36" r="2.5" fill="#fff" />
      </svg>

      {/* Striped wooden sign */}
      <svg className="dkc-sign" viewBox="0 0 120 90">
        <rect x="54" y="30" width="12" height="60" fill="#5a3a1e" />
        <rect x="6" y="14" width="108" height="34" rx="4" fill="#caa23a" />
        <rect x="6" y="14" width="108" height="34" rx="4" fill="none" stroke="#7a4a22" strokeWidth="4" />
        <g fill="#7a4a22">
          <rect x="22" y="24" width="10" height="14" />
          <rect x="40" y="24" width="10" height="14" />
        </g>
      </svg>

      {/* Foreground tropical fronds */}
      <svg className="dkc-fronds" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <g fill="#143a1e">
          <path d="M0 200 L0 80 Q60 60 80 120 Q100 70 140 110 Q160 60 200 110 L200 200 Z" />
          <path d="M1000 200 L1000 110 Q1040 60 1060 110 Q1100 70 1120 120 Q1140 60 1200 80 L1200 200 Z" />
        </g>
      </svg>
    </div>
  );
}
