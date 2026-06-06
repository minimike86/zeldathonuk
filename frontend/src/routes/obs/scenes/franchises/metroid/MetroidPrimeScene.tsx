import './metroid.css';

/**
 * Metroid Prime — the first-person Combat Visor view. Curved orange HUD arcs
 * frame the screen with the radar reticle top-left, an ammo/energy readout
 * top-right, scan brackets tracking a target, and the morph ball rolling
 * across the lower deck. A faint cyan scan-line sweep crosses the visor.
 * `.mprime-` namespace.
 */
export function MetroidPrimeScene() {
  return (
    <div className="mprime-scene" aria-hidden="true">
      {/* Cyan scan-line sweep across the visor */}
      <div className="mprime-scanline" />

      {/* Visor HUD frame — curved arcs top + bottom */}
      <svg className="mprime-hud" viewBox="0 0 1200 600" preserveAspectRatio="none">
        <g fill="none" stroke="#f5821f" strokeWidth="3" opacity="0.85">
          {/* upper visor arc */}
          <path d="M-40 70 Q600 -40 1240 70" />
          <path d="M-40 92 Q600 -16 1240 92" strokeWidth="1.5" opacity="0.5" />
          {/* lower visor arc */}
          <path d="M-40 540 Q600 660 1240 540" />
          <path d="M-40 518 Q600 636 1240 518" strokeWidth="1.5" opacity="0.5" />
        </g>
        {/* corner brackets */}
        <g stroke="#19c6d6" strokeWidth="3" fill="none" opacity="0.7">
          <path d="M60 130 L60 100 L100 100" />
          <path d="M1140 130 L1140 100 L1100 100" />
          <path d="M60 470 L60 500 L100 500" />
          <path d="M1140 470 L1140 500 L1100 500" />
        </g>
      </svg>

      {/* Radar reticle, top-left */}
      <svg className="mprime-radar" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="rgba(245, 130, 31, 0.08)" stroke="#f5821f" strokeWidth="2" />
        <circle cx="60" cy="60" r="34" fill="none" stroke="#f5821f" strokeWidth="1.5" opacity="0.6" />
        <circle cx="60" cy="60" r="14" fill="none" stroke="#f5821f" strokeWidth="1.5" opacity="0.6" />
        <path d="M60 60 L60 6" stroke="#f5821f" strokeWidth="1" opacity="0.5" />
        <path d="M60 60 L114 60" stroke="#f5821f" strokeWidth="1" opacity="0.5" />
        {/* sweep wedge */}
        <path className="mprime-radar-sweep" d="M60 60 L60 6 A54 54 0 0 1 110 78 Z" fill="rgba(25, 198, 214, 0.25)" />
        {/* blips */}
        <g fill="#19c6d6"><circle cx="78" cy="44" r="3" /><circle cx="46" cy="74" r="3" /></g>
      </svg>

      {/* Energy/ammo readout, top-right */}
      <svg className="mprime-readout" viewBox="0 0 140 80">
        <g stroke="#f5821f" strokeWidth="2" fill="none">
          <rect x="6" y="10" width="128" height="20" rx="4" />
        </g>
        <g fill="#f5821f">
          <rect x="10" y="14" width="18" height="12" rx="2" />
          <rect x="32" y="14" width="18" height="12" rx="2" />
          <rect x="54" y="14" width="18" height="12" rx="2" opacity="0.7" />
          <rect x="76" y="14" width="18" height="12" rx="2" opacity="0.4" />
        </g>
        {/* missile pips */}
        <g fill="#19c6d6">
          <path d="M14 46 L20 40 L26 46 L20 64 Z" />
          <path d="M40 46 L46 40 L52 46 L46 64 Z" />
          <path d="M66 46 L72 40 L78 46 L72 64 Z" opacity="0.5" />
        </g>
      </svg>

      {/* Scan brackets tracking a target, centre */}
      <svg className="mprime-scan" viewBox="0 0 200 200">
        <g stroke="#19c6d6" strokeWidth="3" fill="none">
          <path d="M30 60 L30 30 L60 30" />
          <path d="M170 60 L170 30 L140 30" />
          <path d="M30 140 L30 170 L60 170" />
          <path d="M170 140 L170 170 L140 170" />
        </g>
        <circle cx="100" cy="100" r="6" fill="none" stroke="#19c6d6" strokeWidth="2" />
        <text x="100" y="190" fontSize="14" fill="#19c6d6" textAnchor="middle" opacity="0.8">SCAN</text>
      </svg>

      {/* Morph ball rolling across the lower deck */}
      <svg className="mprime-morphball" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="34" fill="#3a2a1a" stroke="#1c120a" strokeWidth="3" />
        <circle cx="40" cy="40" r="34" fill="none" stroke="#f5821f" strokeWidth="2" opacity="0.7" />
        {/* segment seams */}
        <g stroke="#1c120a" strokeWidth="2">
          <path d="M6 40 L74 40" /><path d="M40 6 L40 74" />
        </g>
        {/* orange core glow */}
        <circle cx="40" cy="40" r="10" fill="#f5821f" opacity="0.85" />
        <circle cx="36" cy="32" r="6" fill="#ffd0a0" opacity="0.6" />
      </svg>
    </div>
  );
}
