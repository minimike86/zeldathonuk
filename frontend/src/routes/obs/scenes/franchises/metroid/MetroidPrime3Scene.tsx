import './metroid.css';

/**
 * Metroid Prime 3: Corruption — the Galactic Federation flagship GFS Olympus
 * hangs in deep space above a Phazon-corrupted world. Cold blue Phazon veins
 * creep across the hull and the surrounding tech, pulsing with toxic light.
 * Drifting Phazon spores and a corruption-meter readout complete the dread.
 * `.mp3-` namespace.
 */
export function MetroidPrime3Scene() {
  return (
    <div className="mp3-scene" aria-hidden="true">
      {/* Phazon corruption glow creeping in from the edges */}
      <div className="mp3-corruption" />

      {/* Star field behind the fleet */}
      <div className="mp3-stars" />

      {/* Corrupted planet limb arcing across the lower scene */}
      <svg className="mp3-planet" viewBox="0 0 1200 400" preserveAspectRatio="none">
        <path d="M0 400 L0 240 Q600 80 1200 240 L1200 400 Z" fill="#0a1830" />
        {/* phazon veins glowing across the surface */}
        <g stroke="#3aa0ff" strokeWidth="2.5" fill="none" opacity="0.7">
          <path d="M180 260 Q260 220 220 180 Q300 200 360 160" />
          <path d="M620 200 Q700 170 660 130 Q760 160 820 120" />
          <path d="M980 250 Q1040 210 1000 170" />
        </g>
        {/* phazon pools */}
        <g fill="#1f6fd6" opacity="0.5">
          <ellipse cx="300" cy="300" rx="50" ry="18" />
          <ellipse cx="740" cy="280" rx="60" ry="20" />
        </g>
      </svg>

      {/* GFS Olympus — Federation flagship hanging above */}
      <svg className="mp3-ship" viewBox="0 0 360 160">
        {/* main hull */}
        <path d="M20 90 L120 70 L300 70 L350 86 L300 102 L120 102 Z" fill="#243a52" stroke="#0c1622" strokeWidth="3" />
        {/* command tower */}
        <path d="M150 70 L170 40 L230 40 L250 70 Z" fill="#2c4866" stroke="#0c1622" strokeWidth="2.5" />
        {/* engine nacelles */}
        <g fill="#1a2c40" stroke="#0c1622" strokeWidth="2">
          <rect x="40" y="62" width="70" height="14" rx="4" />
          <rect x="40" y="96" width="70" height="14" rx="4" />
        </g>
        {/* engine thruster glow */}
        <g fill="#3aa0ff" opacity="0.85">
          <rect x="34" y="65" width="8" height="8" rx="2" />
          <rect x="34" y="99" width="8" height="8" rx="2" />
        </g>
        {/* hull running lights */}
        <g fill="#7ac6ff">
          <circle cx="180" cy="86" r="3" /><circle cx="220" cy="86" r="3" /><circle cx="270" cy="86" r="3" />
        </g>
        {/* window strip on the tower */}
        <rect x="178" y="50" width="44" height="6" rx="2" fill="#7ac6ff" opacity="0.8" />
        {/* a creeping phazon vein along the hull */}
        <path d="M120 80 Q160 76 200 84 Q250 92 300 84" stroke="#3aa0ff" strokeWidth="2" fill="none" opacity="0.7" />
      </svg>

      {/* Corruption meter readout, top-right */}
      <svg className="mp3-meter" viewBox="0 0 160 70">
        <rect x="6" y="20" width="148" height="22" rx="4" fill="none" stroke="#3aa0ff" strokeWidth="2" />
        <g fill="#3aa0ff">
          <rect x="10" y="24" width="20" height="14" rx="2" />
          <rect x="34" y="24" width="20" height="14" rx="2" />
          <rect x="58" y="24" width="20" height="14" rx="2" opacity="0.8" />
          <rect x="82" y="24" width="20" height="14" rx="2" opacity="0.45" />
        </g>
        <text x="80" y="60" fontSize="13" fill="#7ac6ff" textAnchor="middle" opacity="0.8">PHAZON</text>
      </svg>

      {/* Drifting Phazon spores */}
      <div className="mp3-spores" />
    </div>
  );
}
