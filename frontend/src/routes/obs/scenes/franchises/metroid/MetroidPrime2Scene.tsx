import './metroid.css';

/**
 * Metroid Prime 2: Echoes — the planet Aether split across two dimensions. The
 * scene is cleaved down the middle: the left is bright Light Aether with warm
 * Luminoth spires and a Light Beam glow; the right is murky Dark Aether, a
 * poisoned purple atmosphere of jagged Ing-corrupted rock. A dimensional rift
 * portal pulses on the seam between worlds. `.mp2-` namespace.
 */
export function MetroidPrime2Scene() {
  return (
    <div className="mp2-scene" aria-hidden="true">
      {/* Light half — warm bright Aether (left) */}
      <div className="mp2-light-half" />
      {/* Dark half — murky purple Aether (right) */}
      <div className="mp2-dark-half" />

      {/* Light Aether — Luminoth spires + serene terrain (left) */}
      <svg className="mp2-light-scene" viewBox="0 0 600 600" preserveAspectRatio="none">
        {/* glowing sky bloom */}
        <ellipse cx="300" cy="180" rx="260" ry="160" fill="rgba(168, 232, 160, 0.18)" />
        {/* Luminoth temple spires */}
        <g fill="#1f5a3a" stroke="#0c2a1c" strokeWidth="2">
          <path d="M120 600 L120 360 L150 300 L180 360 L180 600 Z" />
          <path d="M360 600 L360 300 L400 220 L440 300 L440 600 Z" />
          <path d="M500 600 L500 400 L520 350 L540 400 L540 600 Z" />
        </g>
        {/* warm spire energy windows */}
        <g fill="#a8e8a0" opacity="0.85">
          <rect x="146" y="330" width="8" height="40" rx="2" />
          <rect x="392" y="260" width="14" height="60" rx="3" />
          <rect x="516" y="370" width="8" height="30" rx="2" />
        </g>
        {/* serene ground */}
        <path d="M0 600 L0 480 Q300 440 600 490 L600 600 Z" fill="#143a26" />
      </svg>

      {/* Dark Aether — jagged Ing-corrupted rock + poison haze (right) */}
      <svg className="mp2-dark-scene" viewBox="0 0 600 600" preserveAspectRatio="none">
        {/* poison atmosphere bloom */}
        <ellipse cx="300" cy="200" rx="280" ry="180" fill="rgba(120, 40, 160, 0.28)" />
        {/* jagged corrupted spires */}
        <g fill="#1a0a2e" stroke="#3a1060" strokeWidth="2">
          <path d="M80 600 L60 340 L110 300 L140 360 L120 600 Z" />
          <path d="M280 600 L300 280 L350 240 L380 320 L360 600 Z" />
          <path d="M480 600 L470 380 L510 340 L540 400 L520 600 Z" />
        </g>
        {/* Ing corruption veins */}
        <g stroke="#a040d0" strokeWidth="2.5" fill="none" opacity="0.7">
          <path d="M100 420 Q140 380 120 340" />
          <path d="M320 380 Q360 340 340 300" />
          <path d="M500 440 Q530 400 510 360" />
        </g>
        {/* corrupted ground */}
        <path d="M0 600 L0 490 Q300 450 600 500 L600 600 Z" fill="#100620" />
        {/* drifting Ing eyes */}
        <g fill="#d060ff">
          <circle cx="200" cy="220" r="4" /><circle cx="420" cy="180" r="3.5" /><circle cx="520" cy="260" r="3" />
        </g>
      </svg>

      {/* Dimensional rift portal pulsing on the seam */}
      <svg className="mp2-rift" viewBox="0 0 120 320">
        <ellipse cx="60" cy="160" rx="42" ry="150" fill="rgba(160, 64, 208, 0.22)" stroke="#a040d0" strokeWidth="3" />
        <ellipse cx="60" cy="160" rx="26" ry="120" fill="rgba(168, 232, 160, 0.18)" stroke="#a8e8a0" strokeWidth="2" opacity="0.8" />
        <ellipse cx="60" cy="160" rx="10" ry="80" fill="#e0c0ff" opacity="0.6" />
      </svg>

      {/* Pulsing seam glow down the centre */}
      <div className="mp2-seam" />
    </div>
  );
}
