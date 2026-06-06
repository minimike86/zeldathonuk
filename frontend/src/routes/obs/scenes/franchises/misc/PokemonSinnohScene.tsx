import './misc.css';

/**
 * Pokémon (Sinnoh) — the snowy ascent of Mt. Coronet. A cool slate/blue sky,
 * jagged snow-capped peaks, drifting snow, a frozen ridge path and a distant
 * Spear Pillar of standing stones. `.psn-` namespace.
 */
export function PokemonSinnohScene() {
  return (
    <div className="psn-scene" aria-hidden="true">
      {/* Cold pale sun */}
      <div className="psn-sun" />

      {/* Falling snow */}
      <div className="psn-snow" />

      {/* Far peaks */}
      <svg className="psn-peaks psn-peaks-far" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <path
          d="M0 240 L120 110 L240 170 L360 90 L500 160 L620 80 L760 150 L900 100 L1040 160 L1200 110 L1200 240 Z"
          fill="#5d6f8c"
        />
        {/* snow caps */}
        <g fill="#dde9f6">
          <path d="M360 90 L390 120 L330 120 Z" />
          <path d="M620 80 L654 116 L586 116 Z" />
          <path d="M900 100 L930 132 L870 132 Z" />
        </g>
      </svg>

      {/* Mid peaks — the body of Mt. Coronet */}
      <svg className="psn-peaks psn-peaks-mid" viewBox="0 0 1200 260" preserveAspectRatio="none">
        <path
          d="M0 260 L160 120 L320 190 L480 70 L640 180 L800 100 L980 200 L1140 130 L1200 170 L1200 260 Z"
          fill="#3f4f6e"
        />
        <g fill="#cfe0f2">
          <path d="M480 70 L520 124 L440 124 Z" />
          <path d="M800 100 L838 150 L762 150 Z" />
        </g>
      </svg>

      {/* Spear Pillar — ring of standing stones near the summit */}
      <svg className="psn-pillars" viewBox="0 0 200 120">
        <ellipse cx="100" cy="100" rx="92" ry="18" fill="#2c3a54" opacity="0.7" />
        <g fill="#8a99b4" stroke="#56657f" strokeWidth="2">
          <rect x="20" y="44" width="14" height="58" rx="2" />
          <rect x="56" y="30" width="14" height="72" rx="2" />
          <rect x="96" y="22" width="16" height="80" rx="2" />
          <rect x="136" y="30" width="14" height="72" rx="2" />
          <rect x="170" y="44" width="14" height="58" rx="2" />
        </g>
        {/* faint glyph glow */}
        <g fill="#9fd0ff" opacity="0.7">
          <circle cx="104" cy="48" r="3.5" />
          <circle cx="27" cy="64" r="2.5" />
          <circle cx="177" cy="64" r="2.5" />
        </g>
      </svg>

      {/* Snowfield foreground */}
      <svg className="psn-snowfield psn-snowfield-far" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 120 Q300 92 600 120 Q900 150 1200 108 L1200 200 Z" fill="#e6f0fb" />
      </svg>
      <svg className="psn-snowfield psn-snowfield-near" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 150 Q300 128 600 152 Q900 178 1200 144 L1200 200 Z" fill="#c4d6ec" />
        {/* a winding ridge path of darker ice */}
        <path d="M520 200 Q556 168 540 148 Q524 128 562 110 L680 110 Q644 138 662 158 Q682 184 720 200 Z" fill="#9fb6d2" opacity="0.8" />
      </svg>

      {/* Foreground icy rocks */}
      <svg className="psn-rocks" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <g fill="#7d90ad">
          <path d="M60 120 L100 60 L150 120 Z" />
          <path d="M1020 120 L1080 70 L1150 120 Z" />
        </g>
        <g fill="#dce8f6">
          <path d="M84 78 L108 60 L122 86 Z" />
          <path d="M1050 88 L1080 70 L1100 92 Z" />
        </g>
      </svg>
    </div>
  );
}
