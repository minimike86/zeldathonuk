/**
 * Majora's Mask scene — the moon descending over Clock Town.
 */
export function MajorasMaskScene() {
  return (
    <div className="mm-scene" aria-hidden="true">
      <svg className="mm-moon" viewBox="-110 -110 220 220">
        {/* Cracked, angry moon */}
        <circle cx="0" cy="0" r="100" fill="#f0d09a" />
        <ellipse cx="-30" cy="-15" rx="14" ry="8" fill="#1d0a06" />
        <ellipse cx="30" cy="-15" rx="14" ry="8" fill="#1d0a06" />
        <path
          d="M-45 35 Q-15 50 0 38 Q20 50 45 32"
          stroke="#1d0a06"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        {/* nose */}
        <path d="M-8 5 L0 25 L8 5 Z" fill="#7a3a1a" opacity="0.4" />
      </svg>
      <svg className="mm-clocktown" viewBox="0 0 800 220" preserveAspectRatio="none">
        <path
          d="M0 220 L40 180 L90 160 L120 180 L150 130 L180 160 L220 140 L260 170 L300 110 L340 150 L380 130 L420 160 L460 100 L500 140 L540 130 L580 170 L620 150 L660 180 L700 160 L740 190 L800 220 Z"
          fill="rgba(20, 16, 30, 0.95)"
        />
      </svg>
      <div className="mm-glow" />
    </div>
  );
}
