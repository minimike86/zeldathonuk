import './megaman.css';

/**
 * Mega Man 4 — Dr. Cossack's snowbound fortress. A cold steel-grey
 * industrial citadel of crenellated towers under a pale, snowy sky, with
 * snow drifting down across the scene, an icy ledge of snow caps along the
 * battlements, and the blue hero standing in the cold. Frosty white / steel
 * palette with a faint cyan glow.
 *
 * Namespace: `.mm4-`
 */
export function MegaMan4Scene() {
  return (
    <div className="mm4-scene" aria-hidden="true">
      {/* Falling snow */}
      <div className="mm4-snow" />

      {/* Cossack fortress silhouette — crenellated industrial towers */}
      <svg className="mm4-fortress" viewBox="0 0 1200 360" preserveAspectRatio="none">
        <g fill="#3a4656">
          {/* curtain wall */}
          <rect x="0" y="180" width="1200" height="180" />
          {/* towers */}
          <rect x="80" y="90" width="120" height="270" />
          <rect x="360" y="50" width="150" height="310" />
          <rect x="680" y="110" width="120" height="250" />
          <rect x="940" y="40" width="160" height="320" />
        </g>
        {/* crenellations on tower tops */}
        <g fill="#3a4656">
          <rect x="80" y="74" width="24" height="20" />
          <rect x="128" y="74" width="24" height="20" />
          <rect x="176" y="74" width="24" height="20" />
          <rect x="360" y="34" width="30" height="20" />
          <rect x="420" y="34" width="30" height="20" />
          <rect x="480" y="34" width="30" height="20" />
          <rect x="940" y="24" width="32" height="20" />
          <rect x="1004" y="24" width="32" height="20" />
          <rect x="1068" y="24" width="32" height="20" />
        </g>
        {/* snow caps along the battlement tops */}
        <g fill="#e8f1ff">
          <rect x="80" y="70" width="120" height="6" />
          <rect x="360" y="30" width="150" height="6" />
          <rect x="680" y="106" width="120" height="6" />
          <rect x="940" y="20" width="160" height="6" />
          <rect x="0" y="176" width="1200" height="6" />
        </g>
        {/* lit fortress windows */}
        <g className="mm4-glow" fill="#7af6ff">
          <rect x="120" y="140" width="14" height="20" />
          <rect x="410" y="100" width="16" height="22" />
          <rect x="450" y="100" width="16" height="22" />
          <rect x="720" y="160" width="14" height="20" />
          <rect x="990" y="90" width="16" height="22" />
          <rect x="1040" y="90" width="16" height="22" />
        </g>
      </svg>

      {/* Snowy foreground ledge */}
      <svg className="mm4-ledge" viewBox="0 0 1200 140" preserveAspectRatio="none">
        <path d="M0 140 L0 40 L1200 24 L1200 140 Z" fill="#2b3543" />
        <path d="M0 40 L1200 24" stroke="#e8f1ff" strokeWidth="8" />
      </svg>

      {/* Blue hero standing in the cold */}
      <svg className="mm4-hero" viewBox="0 0 70 90">
        <g fill="#1763c8">
          <rect x="22" y="40" width="20" height="26" />
          <path d="M20 22 Q31 14 42 22 L42 38 L20 38 Z" />
          <rect x="20" y="66" width="9" height="22" />
          <rect x="35" y="66" width="9" height="22" />
          <rect x="42" y="44" width="22" height="11" rx="3" />
        </g>
        <rect x="25" y="28" width="12" height="9" fill="#bfe4ff" />
        <rect x="27" y="30" width="3" height="5" fill="#0b2a66" />
        <rect x="32" y="30" width="3" height="5" fill="#0b2a66" />
        <rect x="29" y="18" width="4" height="4" fill="#7af6ff" />
        <circle className="mm4-buster" cx="64" cy="49" r="6" fill="#cfeeff" />
      </svg>
    </div>
  );
}
