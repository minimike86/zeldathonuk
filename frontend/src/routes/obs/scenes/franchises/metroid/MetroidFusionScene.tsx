import './metroid.css';

/**
 * Metroid Fusion — the corridors of the BSL research station. Cold teal
 * bulkhead panels and recessed lighting recede down a corridor sealed by an
 * amber hazard door. Orange hazard-strobe glow washes the floor while the
 * shadowy SA-X stalks the far end, its single yellow visor eye locked on
 * Samus. Drifting X-parasite motes pulse in the gloom. `.mfus-` namespace.
 */
export function MetroidFusionScene() {
  return (
    <div className="mfus-scene" aria-hidden="true">
      {/* Amber hazard strobe glow washing the corridor */}
      <div className="mfus-hazard" />

      {/* Receding corridor — perspective bulkhead frame */}
      <svg className="mfus-corridor" viewBox="0 0 1200 600" preserveAspectRatio="none">
        {/* far wall */}
        <rect x="440" y="180" width="320" height="300" fill="#06201f" />
        {/* perspective floor / ceiling / walls converging on the far wall */}
        <g fill="#082a29">
          <path d="M0 600 L440 480 L760 480 L1200 600 Z" />
          <path d="M0 0 L440 180 L760 180 L1200 0 Z" />
        </g>
        <g fill="#05201e">
          <path d="M0 0 L0 600 L440 480 L440 180 Z" />
          <path d="M1200 0 L1200 600 L760 480 L760 180 Z" />
        </g>
        {/* recessed teal light strips down each wall */}
        <g stroke="#1f9c92" strokeWidth="3" opacity="0.7">
          <path d="M0 110 L440 232" />
          <path d="M0 500 L440 432" />
          <path d="M1200 110 L760 232" />
          <path d="M1200 500 L760 432" />
        </g>
        {/* bulkhead ribs along the ceiling */}
        <g stroke="#0c3a37" strokeWidth="4">
          <path d="M150 40 L150 540" opacity="0.5" />
          <path d="M300 110 L300 500" opacity="0.6" />
          <path d="M900 110 L900 500" opacity="0.6" />
          <path d="M1050 40 L1050 540" opacity="0.5" />
        </g>
      </svg>

      {/* Amber hazard door at the far end */}
      <svg className="mfus-door" viewBox="0 0 80 160">
        <rect x="10" y="0" width="60" height="160" fill="#3a2406" stroke="#1c1203" strokeWidth="3" />
        {/* split door halves */}
        <rect x="16" y="6" width="22" height="148" fill="#caa028" opacity="0.9" />
        <rect x="42" y="6" width="22" height="148" fill="#caa028" opacity="0.9" />
        {/* hazard chevrons */}
        <g fill="#1c1203" opacity="0.7">
          <path d="M16 30 L40 22 L40 36 L16 44 Z" />
          <path d="M40 22 L64 30 L64 44 L40 36 Z" />
          <path d="M16 80 L40 72 L40 86 L16 94 Z" />
          <path d="M40 72 L64 80 L64 94 L40 86 Z" />
        </g>
        {/* lock light */}
        <circle cx="40" cy="130" r="5" fill="#ffcf4a" />
      </svg>

      {/* SA-X stalking the far end — cold mirror of Samus */}
      <svg className="mfus-sax" viewBox="0 0 60 110">
        <g fill="#0a1c1b">
          {/* legs */}
          <rect x="22" y="68" width="9" height="38" rx="2" />
          <rect x="32" y="68" width="9" height="38" rx="2" />
          {/* torso */}
          <path d="M16 38 Q30 30 46 38 L44 70 L18 70 Z" />
          {/* shoulder pads */}
          <ellipse cx="18" cy="40" rx="8" ry="7" />
          <ellipse cx="46" cy="40" rx="8" ry="7" />
          {/* helmet */}
          <path d="M22 16 Q31 6 42 16 Q44 30 38 34 L26 34 Q20 30 22 16 Z" />
          {/* arm cannon */}
          <rect x="42" y="44" width="20" height="15" rx="5" />
        </g>
        {/* cold dread outline */}
        <path d="M16 38 Q30 30 46 38 L44 70 L18 70 Z" fill="none" stroke="#1f7a78" strokeWidth="1" opacity="0.6" />
        {/* single yellow visor eye */}
        <path d="M27 18 Q33 14 39 18 L37 25 L29 25 Z" fill="#ffcf4a" opacity="0.95" />
      </svg>
      <div className="mfus-sax-eye" />

      {/* Drifting X-parasite motes */}
      <div className="mfus-parasites" />
    </div>
  );
}
