import './misc.css';

/**
 * Pokémon (Johto) — Ecruteak City at autumn dusk. A gold/maroon sky over the
 * tall tiered Bell Tower, raked-roof shrine pagodas, drifting autumn leaves and
 * a Ho-Oh-style rainbow feather glinting overhead. `.pjt-` namespace.
 */
export function PokemonJohtoScene() {
  return (
    <div className="pjt-scene" aria-hidden="true">
      {/* Warm autumn sun low on the horizon */}
      <div className="pjt-sun" />

      {/* Drifting clouds tinted amber */}
      <svg className="pjt-cloud pjt-cloud-a" viewBox="0 0 160 60">
        <g fill="#f6dca6">
          <ellipse cx="56" cy="38" rx="38" ry="18" />
          <ellipse cx="94" cy="32" rx="32" ry="22" />
          <ellipse cx="120" cy="40" rx="26" ry="16" />
        </g>
      </svg>
      <svg className="pjt-cloud pjt-cloud-b" viewBox="0 0 160 60">
        <g fill="#f0cf94">
          <ellipse cx="62" cy="36" rx="32" ry="18" />
          <ellipse cx="98" cy="40" rx="28" ry="16" />
        </g>
      </svg>

      {/* Ho-Oh rainbow feather glinting overhead */}
      <svg className="pjt-feather" viewBox="0 0 60 120">
        <path d="M30 4 Q48 40 30 116 Q12 40 30 4 Z" fill="#f4d35e" stroke="#c98b1c" strokeWidth="2" />
        <path d="M30 16 Q40 50 30 108 Q20 50 30 16 Z" fill="#ee6b3b" opacity="0.8" />
        <path d="M30 28 Q35 56 30 100 Q25 56 30 28 Z" fill="#d63d3d" opacity="0.75" />
        <line x1="30" y1="6" x2="30" y2="116" stroke="#7a4a1f" strokeWidth="1.5" />
      </svg>

      {/* Far autumnal tree line */}
      <svg className="pjt-treeline" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <g fill="#b5652a">
          <ellipse cx="100" cy="180" rx="110" ry="70" />
          <ellipse cx="320" cy="190" rx="120" ry="74" />
          <ellipse cx="560" cy="180" rx="110" ry="70" />
          <ellipse cx="800" cy="192" rx="120" ry="76" />
          <ellipse cx="1040" cy="182" rx="110" ry="70" />
        </g>
        <g fill="#d98b3a" opacity="0.7">
          <ellipse cx="220" cy="168" rx="60" ry="22" />
          <ellipse cx="660" cy="170" rx="60" ry="22" />
          <ellipse cx="980" cy="166" rx="60" ry="22" />
        </g>
      </svg>

      {/* The Bell Tower — tall tiered pagoda centre-back */}
      <svg className="pjt-belltower" viewBox="0 0 200 360">
        {/* central pillar */}
        <rect x="86" y="60" width="28" height="290" fill="#7a2f24" />
        {/* tiered roofs, widest at bottom */}
        <g stroke="#5a1f17" strokeWidth="2">
          <path d="M30 60 L100 16 L170 60 L150 72 L50 72 Z" fill="#9c3a2a" />
          <path d="M22 130 L100 96 L178 130 L156 144 L44 144 Z" fill="#b14633" />
          <path d="M14 210 L100 172 L186 210 L162 226 L38 226 Z" fill="#9c3a2a" />
          <path d="M6 300 L100 256 L194 300 L168 318 L32 318 Z" fill="#b14633" />
        </g>
        {/* golden finial */}
        <rect x="96" y="2" width="8" height="16" fill="#f4d35e" />
        <circle cx="100" cy="2" r="5" fill="#f4d35e" stroke="#c98b1c" strokeWidth="1.5" />
        {/* lit windows */}
        <g fill="#f6d98a">
          <rect x="92" y="120" width="16" height="20" rx="2" />
          <rect x="92" y="196" width="16" height="22" rx="2" />
          <rect x="90" y="284" width="20" height="26" rx="2" />
        </g>
      </svg>

      {/* Flanking shrine pagodas */}
      <svg className="pjt-pagoda pjt-pagoda-left" viewBox="0 0 140 220">
        <rect x="58" y="60" width="24" height="160" fill="#6f2a20" />
        <g stroke="#5a1f17" strokeWidth="2">
          <path d="M14 60 L70 24 L126 60 L108 70 L32 70 Z" fill="#9c3a2a" />
          <path d="M6 140 L70 100 L134 140 L114 152 L26 152 Z" fill="#b14633" />
        </g>
        <rect x="62" y="118" width="16" height="22" rx="2" fill="#f6d98a" />
      </svg>

      {/* Cobbled ground */}
      <svg className="pjt-ground pjt-ground-far" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 110 Q300 84 600 110 Q900 138 1200 100 L1200 200 Z" fill="#a86a3a" />
      </svg>
      <svg className="pjt-ground pjt-ground-near" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 150 Q300 124 600 150 Q900 180 1200 142 L1200 200 Z" fill="#7e4d28" />
        {/* path stones */}
        <g fill="#6a3f20" opacity="0.7">
          <rect x="500" y="158" width="40" height="14" rx="4" />
          <rect x="560" y="170" width="44" height="14" rx="4" />
          <rect x="630" y="160" width="40" height="14" rx="4" />
        </g>
      </svg>

      {/* Drifting autumn leaves */}
      <div className="pjt-leaves" />
    </div>
  );
}
