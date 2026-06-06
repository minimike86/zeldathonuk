import './megaman.css';

/**
 * Mega Man Zero — the GBA ruined-future resistance base. A scorched amber
 * dusk over the crumbled silhouette of a destroyed cityscape and broken
 * resistance-base ruins, drifting ember sparks, and Zero's tall red
 * silhouette standing with his Z-Saber drawn, its energy blade glowing.
 * Burnt amber / crimson palette.
 *
 * Namespace: `.mmz-`
 */
export function MegaManZeroScene() {
  return (
    <div className="mmz-scene" aria-hidden="true">
      {/* Amber dusk glow on the horizon */}
      <div className="mmz-glow" />

      {/* Crumbled distant city silhouette */}
      <svg className="mmz-ruins-far" viewBox="0 0 1200 220" preserveAspectRatio="none">
        <g fill="rgba(60, 30, 24, 0.9)">
          <path d="M0 220 L0 120 L60 120 L60 80 L120 80 L120 140 L200 140 L200 60 L240 60 L240 130 L320 130 L320 100 L380 100 L380 160 L460 160 L460 90 L500 90 L500 150 L600 150 L600 70 L640 70 L640 140 L720 140 L720 110 L780 110 L780 170 L860 170 L860 90 L900 90 L900 150 L1000 150 L1000 60 L1040 60 L1040 130 L1120 130 L1120 100 L1200 100 L1200 220 Z" />
        </g>
      </svg>

      {/* Broken resistance-base ruins in the foreground */}
      <svg className="mmz-ruins-near" viewBox="0 0 1200 260" preserveAspectRatio="none">
        <g fill="#1c1210">
          {/* jagged broken wall */}
          <path d="M0 260 L0 90 L100 90 L120 60 L140 90 L260 90 L260 130 L360 130 L380 70 L400 130 L520 130 L520 80 L1200 80 L1200 260 Z" />
        </g>
        {/* exposed rebar / girders */}
        <g stroke="#3a241c" strokeWidth="5">
          <line x1="120" y1="60" x2="120" y2="20" />
          <line x1="380" y1="70" x2="380" y2="30" />
          <line x1="700" y1="80" x2="700" y2="40" />
          <line x1="980" y1="80" x2="980" y2="36" />
        </g>
        {/* glowing damaged-circuit lights */}
        <g className="mmz-flicker" fill="#ff8a3a">
          <rect x="180" y="120" width="10" height="14" />
          <rect x="440" y="110" width="10" height="14" />
          <rect x="640" y="120" width="10" height="14" />
          <rect x="900" y="110" width="10" height="14" />
        </g>
      </svg>

      {/* Drifting embers */}
      <div className="mmz-embers" />

      {/* Zero's tall red silhouette with Z-Saber drawn */}
      <svg className="mmz-zero" viewBox="0 0 90 130">
        <g fill="#c81a1a">
          {/* torso */}
          <path d="M30 50 L56 50 L58 92 L28 92 Z" />
          {/* helmet */}
          <path d="M30 24 Q43 14 56 24 L56 44 L30 44 Z" />
          {/* long hair flowing back */}
          <path className="mmz-hair" d="M30 30 Q6 40 2 90 Q18 70 30 60 Z" />
          {/* legs */}
          <rect x="30" y="92" width="11" height="34" />
          <rect x="45" y="92" width="11" height="34" />
          {/* saber arm raised */}
          <rect x="54" y="40" width="14" height="10" rx="3" transform="rotate(-28 60 45)" />
        </g>
        {/* helmet crest gem */}
        <circle cx="43" cy="34" r="3.5" fill="#ffd23a" />
        {/* face */}
        <rect x="34" y="30" width="11" height="8" fill="#ffd6c2" />
        <rect x="36" y="32" width="3" height="4" fill="#5a0c0c" />
        {/* glowing Z-Saber blade */}
        <rect className="mmz-saber" x="70" y="-22" width="6" height="56" rx="3" fill="#5fffce" transform="rotate(18 73 6)" />
      </svg>
    </div>
  );
}
