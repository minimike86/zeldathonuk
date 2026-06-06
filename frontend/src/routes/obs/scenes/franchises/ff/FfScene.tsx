import './ff.css';

/**
 * Final Fantasy (the original NES classic — fallback catching I / II / the
 * Adventure spin-offs). The four orbs/crystals float in a ring while the
 * Warrior of Light stands sword raised beneath a deep starry sky. Pixel-jewel
 * palette of red, green, blue and amber. `.ff1-` namespace.
 */
export function FfScene() {
  return (
    <div className="ff1-scene" aria-hidden="true">
      {/* Starfield */}
      <div className="ff1-stars" />

      {/* Soft central aura behind the crystals */}
      <div className="ff1-aura" />

      {/* The four orbs floating in formation */}
      <svg className="ff1-crystals" viewBox="0 0 400 300">
        {/* Fire orb (top) */}
        <g className="ff1-orb ff1-orb-1">
          <path d="M200 30 L224 76 L200 116 L176 76 Z" fill="#ff5a4a" opacity="0.92" />
          <path d="M200 30 L224 76 L200 76 Z" fill="#ffb0a0" opacity="0.85" />
          <path d="M200 30 L176 76 L200 76 Z" fill="#c8322a" opacity="0.9" />
        </g>
        {/* Water orb (left) */}
        <g className="ff1-orb ff1-orb-2">
          <path d="M70 120 L94 166 L70 206 L46 166 Z" fill="#4a8aff" opacity="0.92" />
          <path d="M70 120 L94 166 L70 166 Z" fill="#a8c8ff" opacity="0.85" />
          <path d="M70 120 L46 166 L70 166 Z" fill="#2a52c8" opacity="0.9" />
        </g>
        {/* Wind orb (right) */}
        <g className="ff1-orb ff1-orb-3">
          <path d="M330 120 L354 166 L330 206 L306 166 Z" fill="#4fd16a" opacity="0.92" />
          <path d="M330 120 L354 166 L330 166 Z" fill="#a8f5b4" opacity="0.85" />
          <path d="M330 120 L306 166 L330 166 Z" fill="#2c9c44" opacity="0.9" />
        </g>
        {/* Earth orb (bottom) */}
        <g className="ff1-orb ff1-orb-4">
          <path d="M200 184 L224 230 L200 270 L176 230 Z" fill="#ffd24a" opacity="0.92" />
          <path d="M200 184 L224 230 L200 230 Z" fill="#fff0a8" opacity="0.85" />
          <path d="M200 184 L176 230 L200 230 Z" fill="#d89a1c" opacity="0.9" />
        </g>
      </svg>

      {/* Warrior of Light silhouette */}
      <svg className="ff1-warrior" viewBox="0 0 80 140">
        <g fill="rgba(10, 14, 30, 1)">
          {/* horned helm */}
          <path d="M28 28 L52 28 L50 44 L30 44 Z" />
          <path d="M28 28 L18 14 L30 24 Z" />
          <path d="M52 28 L62 14 L50 24 Z" />
          {/* head slot */}
          <rect x="34" y="32" width="12" height="8" fill="#7ac4ff" opacity="0.7" />
          {/* torso / armour */}
          <path d="M26 44 L54 44 L58 92 L22 92 Z" />
          {/* shoulder pauldrons */}
          <path d="M22 48 L14 64 L26 60 Z" />
          <path d="M58 48 L66 64 L54 60 Z" />
          {/* skirt */}
          <path d="M24 92 L56 92 L60 112 L20 112 Z" />
          {/* legs */}
          <rect x="28" y="112" width="9" height="28" />
          <rect x="43" y="112" width="9" height="28" />
          {/* sword arm + blade raised */}
          <rect x="58" y="56" width="6" height="20" />
          <rect x="60" y="-2" width="3" height="58" />
        </g>
        {/* shield */}
        <path d="M12 64 Q22 60 26 70 L24 92 Q16 88 12 78 Z" fill="rgba(20, 28, 56, 1)" />
        {/* gleaming blade tip */}
        <rect x="60" y="-6" width="3" height="8" className="ff1-blade" fill="#cfe8ff" />
      </svg>

      {/* Ground silhouette */}
      <svg className="ff1-foreground" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0 120 L0 60 Q300 40 600 56 Q900 72 1200 52 L1200 120 Z"
              fill="rgba(8, 10, 24, 1)" />
      </svg>
    </div>
  );
}
