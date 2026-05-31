import './metroid.css';

/**
 * Metroid II: Return of Samus — the cramped caverns of SR388, rendered in the
 * monochrome four-shade Game Boy green of the original handheld. Jagged rock
 * tunnels frame a tight cavern; a lone Samus silhouette hunts deeper, arm
 * cannon raised, while an evolved Metroid drifts in the murk. Faint scanline
 * dither overlays the whole scene. `.m2-` namespace.
 */
export function MetroidIIScene() {
  return (
    <div className="m2-scene" aria-hidden="true">
      {/* Soft green dot-matrix bloom */}
      <div className="m2-glow" />

      {/* Cavern ceiling — jagged GB-green rock */}
      <svg className="m2-ceiling" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 0 L1200 0 L1200 60 L1130 110 L1060 50 L990 100 L910 40 L830 100 L750 46 L660 104 L580 40 L500 100 L420 48 L340 104 L260 44 L180 100 L100 50 L0 96 Z"
          fill="#306230"
        />
        <g fill="#0f380f">
          <path d="M750 46 L744 70 L756 70 Z" />
          <path d="M420 48 L414 72 L426 72 Z" />
          <path d="M100 50 L94 74 L106 74 Z" />
        </g>
      </svg>

      {/* Back tunnel wall with dithered shading */}
      <svg className="m2-backwall" viewBox="0 0 1200 400" preserveAspectRatio="none">
        <path d="M0 400 L0 110 Q220 70 400 130 Q600 190 800 120 Q1000 60 1200 140 L1200 400 Z" fill="#0f380f" />
        {/* dither bands */}
        <g fill="#306230" opacity="0.5">
          <rect x="120" y="180" width="160" height="10" />
          <rect x="520" y="220" width="180" height="10" />
          <rect x="900" y="190" width="160" height="10" />
        </g>
        {/* tunnel mouth deeper in */}
        <ellipse cx="600" cy="250" rx="150" ry="110" fill="#0a280a" />
        <ellipse cx="600" cy="250" rx="100" ry="74" fill="#081e08" />
      </svg>

      {/* Cavern floor — jagged rock ledge */}
      <svg className="m2-floor" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 120 L80 70 L160 120 L240 64 L330 120 L410 70 L500 120 L590 60 L680 120 L770 70 L860 120 L950 64 L1040 120 L1130 70 L1200 110 L1200 200 Z" fill="#306230" />
        <path d="M0 200 L0 150 L1200 150 L1200 200 Z" fill="#0f380f" />
      </svg>

      {/* Evolved Metroid drifting in the murk */}
      <svg className="m2-metroid" viewBox="0 0 100 100">
        <ellipse cx="50" cy="46" rx="34" ry="30" fill="#306230" stroke="#9bbc0f" strokeWidth="3" />
        {/* nuclei rendered as the darkest shade */}
        <g fill="#0f380f"><circle cx="38" cy="40" r="8" /><circle cx="60" cy="36" r="8" /><circle cx="46" cy="54" r="8" /><circle cx="64" cy="52" r="7" /></g>
        {/* claws / mandibles */}
        <g stroke="#9bbc0f" strokeWidth="3" strokeLinecap="round">
          <path d="M36 72 L30 92" /><path d="M50 74 L50 94" /><path d="M64 72 L70 92" />
        </g>
      </svg>

      {/* Lone Samus hunting, arm cannon up */}
      <svg className="m2-samus" viewBox="0 0 60 100">
        <g fill="#0f380f">
          <rect x="22" y="64" width="9" height="34" rx="2" />
          <rect x="33" y="64" width="9" height="34" rx="2" />
          <path d="M18 38 Q32 30 46 38 L44 66 L20 66 Z" />
          <ellipse cx="20" cy="40" rx="8" ry="7" />
          <ellipse cx="44" cy="40" rx="8" ry="7" />
          <path d="M22 18 Q32 8 42 18 Q44 30 38 34 L26 34 Q20 30 22 18 Z" />
          <rect x="42" y="44" width="20" height="14" rx="5" />
        </g>
        {/* GB-green visor + muzzle */}
        <path d="M28 20 Q34 16 39 20 L37 26 L30 26 Z" fill="#9bbc0f" opacity="0.95" />
        <circle cx="60" cy="51" r="4" fill="#9bbc0f" opacity="0.95" />
      </svg>
      <div className="m2-cannon-glow" />

      {/* Dot-matrix scanline overlay */}
      <div className="m2-scanlines" />
    </div>
  );
}
