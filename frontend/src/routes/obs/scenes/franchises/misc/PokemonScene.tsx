import './misc.css';

/**
 * Pokémon — Pallet Town / Route 1 on a soft summer afternoon. Rolling green
 * fields, a wooden ledge fence, a tall wooden route sign, and a large Poké Ball
 * motif glinting in the sky. `.pkm-` namespace.
 */
export function PokemonScene() {
  return (
    <div className="pkm-scene" aria-hidden="true">
      {/* Sun glow */}
      <div className="pkm-sun" />

      {/* Drifting clouds */}
      <svg className="pkm-cloud pkm-cloud-a" viewBox="0 0 160 60">
        <g fill="#ffffff">
          <ellipse cx="54" cy="38" rx="38" ry="20" />
          <ellipse cx="92" cy="32" rx="34" ry="24" />
          <ellipse cx="118" cy="40" rx="28" ry="18" />
        </g>
      </svg>
      <svg className="pkm-cloud pkm-cloud-b" viewBox="0 0 160 60">
        <g fill="#ffffff">
          <ellipse cx="60" cy="36" rx="34" ry="20" />
          <ellipse cx="98" cy="40" rx="30" ry="18" />
        </g>
      </svg>

      {/* Poké Ball motif in the sky — slow spin/glint */}
      <svg className="pkm-pokeball" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="46" fill="#f4f4f4" stroke="#1c1c1c" strokeWidth="4" />
        <path d="M5 50 A45 45 0 0 1 95 50 Z" fill="#ee3b3b" />
        <rect x="4" y="46" width="92" height="8" fill="#1c1c1c" />
        <circle cx="50" cy="50" r="14" fill="#1c1c1c" />
        <circle cx="50" cy="50" r="9" fill="#f4f4f4" stroke="#1c1c1c" strokeWidth="3" />
        <circle cx="44" cy="32" r="6" fill="#ffffff" opacity="0.55" />
      </svg>

      {/* Far tree line */}
      <svg className="pkm-treeline" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <g fill="#3d8f4a">
          <ellipse cx="80" cy="180" rx="100" ry="70" />
          <ellipse cx="280" cy="190" rx="120" ry="74" />
          <ellipse cx="500" cy="180" rx="110" ry="70" />
          <ellipse cx="720" cy="192" rx="120" ry="76" />
          <ellipse cx="950" cy="182" rx="110" ry="70" />
          <ellipse cx="1150" cy="190" rx="110" ry="74" />
        </g>
      </svg>

      {/* Grass fields */}
      <svg className="pkm-field pkm-field-far" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 110 Q300 80 600 110 Q900 140 1200 100 L1200 200 Z" fill="#74c264" />
      </svg>
      <svg className="pkm-field pkm-field-near" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 150 Q300 120 600 150 Q900 180 1200 140 L1200 200 Z" fill="#4f9e44" />
        {/* dirt route path winding up */}
        <path d="M520 200 Q560 170 540 150 Q520 130 560 110 L680 110 Q640 140 660 160 Q680 185 720 200 Z" fill="#c8a36a" opacity="0.92" />
      </svg>

      {/* Tall wooden route sign, left */}
      <svg className="pkm-sign" viewBox="0 0 80 140">
        <rect x="36" y="40" width="8" height="100" fill="#8a5a2b" />
        <rect x="6" y="20" width="68" height="34" rx="3" fill="#b5793a" stroke="#7a4a1f" strokeWidth="3" />
        <rect x="10" y="24" width="60" height="26" rx="2" fill="#d8b178" />
        {/* "ROUTE 1" lettering as bars */}
        <g fill="#5a3a18">
          <rect x="16" y="30" width="22" height="4" />
          <rect x="16" y="38" width="16" height="4" />
          <rect x="44" y="30" width="20" height="4" />
          <rect x="44" y="38" width="12" height="4" />
        </g>
        {/* arrow point */}
        <path d="M74 24 L80 37 L74 50 Z" fill="#b5793a" stroke="#7a4a1f" strokeWidth="2" />
      </svg>

      {/* Wooden ledge fence across the foreground */}
      <svg className="pkm-fence" viewBox="0 0 1200 90" preserveAspectRatio="none">
        <g fill="#9c6a35" stroke="#6f4820" strokeWidth="2">
          <rect x="40" y="20" width="14" height="70" />
          <rect x="240" y="20" width="14" height="70" />
          <rect x="440" y="20" width="14" height="70" />
          <rect x="640" y="20" width="14" height="70" />
          <rect x="840" y="20" width="14" height="70" />
          <rect x="1040" y="20" width="14" height="70" />
        </g>
        <g fill="#b5793a" stroke="#6f4820" strokeWidth="2">
          <rect x="0" y="28" width="1200" height="12" />
          <rect x="0" y="56" width="1200" height="12" />
        </g>
      </svg>

      {/* Grass tufts swaying in the foreground */}
      <div className="pkm-grass" />
    </div>
  );
}
