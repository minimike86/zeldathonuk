import './metroid.css';

/**
 * Metroid (NES, generic fallback) — the planet Brinstar's tunnels. Blocky
 * magenta/green tiled rock tunnels with a horizontal corridor, a lone Samus
 * silhouette mid-jump, a free-floating Metroid drifting menacingly, and a
 * single energy door at the corridor's end. Retro 8-bit framing.
 * `.met-` namespace.
 */
export function MetroidScene() {
  return (
    <div className="met-scene" aria-hidden="true">
      {/* Subtle alien glow */}
      <div className="met-glow" />

      {/* Tiled rock ceiling — blocky 8-bit chunks */}
      <svg className="met-ceiling" viewBox="0 0 1200 160" preserveAspectRatio="none">
        <rect x="0" y="0" width="1200" height="90" fill="#3a0a4a" />
        <g fill="#5a1470">
          <rect x="0" y="70" width="60" height="40" /><rect x="120" y="70" width="60" height="50" />
          <rect x="240" y="70" width="60" height="36" /><rect x="360" y="70" width="60" height="50" />
          <rect x="480" y="70" width="60" height="40" /><rect x="600" y="70" width="60" height="52" />
          <rect x="720" y="70" width="60" height="38" /><rect x="840" y="70" width="60" height="50" />
          <rect x="960" y="70" width="60" height="40" /><rect x="1080" y="70" width="60" height="50" />
        </g>
        <g stroke="#2a0636" strokeWidth="2">
          <path d="M0 40 L1200 40" /><path d="M60 0 L60 40 M180 0 L180 40 M300 0 L300 40 M420 0 L420 40 M540 0 L540 40 M660 0 L660 40 M780 0 L780 40 M900 0 L900 40 M1020 0 L1020 40 M1140 0 L1140 40" />
        </g>
      </svg>

      {/* Energy door at the corridor end, right side */}
      <svg className="met-door" viewBox="0 0 60 140">
        <rect x="18" y="0" width="24" height="140" fill="#1a4a2a" stroke="#0c2a16" strokeWidth="2" />
        <rect x="22" y="10" width="16" height="120" fill="#2aa84a" opacity="0.85" />
        <g fill="#5fe87a"><rect x="24" y="20" width="12" height="8" /><rect x="24" y="64" width="12" height="8" /><rect x="24" y="108" width="12" height="8" /></g>
      </svg>

      {/* Free-floating Metroid drifting */}
      <svg className="met-metroid" viewBox="0 0 90 90">
        <ellipse cx="45" cy="42" rx="32" ry="28" fill="rgba(90, 230, 120, 0.3)" stroke="#5fe87a" strokeWidth="2.5" />
        <g fill="#e23b6a"><circle cx="34" cy="36" r="8" /><circle cx="54" cy="32" r="8" /><circle cx="42" cy="50" r="8" /><circle cx="58" cy="48" r="7" /></g>
        <g fill="#ff9fc0" opacity="0.8"><circle cx="32" cy="34" r="2.6" /><circle cx="52" cy="30" r="2.6" /></g>
        <g stroke="#bfe8c8" strokeWidth="2.6" strokeLinecap="round">
          <path d="M34 66 L30 84" /><path d="M45 68 L45 86" /><path d="M56 66 L60 84" />
        </g>
      </svg>

      {/* Floor — tiled rock */}
      <svg className="met-floor" viewBox="0 0 1200 160" preserveAspectRatio="none">
        <rect x="0" y="50" width="1200" height="110" fill="#3a0a4a" />
        <g fill="#5a1470">
          <rect x="0" y="50" width="60" height="40" /><rect x="120" y="50" width="60" height="40" />
          <rect x="240" y="50" width="60" height="40" /><rect x="360" y="50" width="60" height="40" />
          <rect x="480" y="50" width="60" height="40" /><rect x="600" y="50" width="60" height="40" />
          <rect x="720" y="50" width="60" height="40" /><rect x="840" y="50" width="60" height="40" />
          <rect x="960" y="50" width="60" height="40" /><rect x="1080" y="50" width="60" height="40" />
        </g>
        <g stroke="#2a0636" strokeWidth="2">
          <path d="M0 96 L1200 96" /><path d="M60 50 L60 160 M180 50 L180 160 M300 50 L300 160 M420 50 L420 160 M540 50 L540 160 M660 50 L660 160 M780 50 L780 160 M900 50 L900 160 M1020 50 L1020 160 M1140 50 L1140 160" />
        </g>
      </svg>

      {/* Lone Samus silhouette mid-jump */}
      <svg className="met-samus" viewBox="0 0 60 90">
        <g fill="#0c2a16">
          {/* tucked legs (jump) */}
          <rect x="20" y="58" width="10" height="20" rx="3" transform="rotate(18 25 68)" />
          <rect x="30" y="58" width="10" height="20" rx="3" transform="rotate(-10 35 68)" />
          {/* torso */}
          <path d="M16 34 Q30 26 44 34 L42 60 L18 60 Z" />
          {/* helmet */}
          <path d="M22 14 Q30 6 40 14 Q42 26 36 30 L26 30 Q20 26 22 14 Z" />
          {/* arm cannon */}
          <rect x="42" y="38" width="18" height="13" rx="5" />
        </g>
        <path d="M28 16 Q33 12 38 16 L36 22 L30 22 Z" fill="#5fe87a" opacity="0.9" />
        <circle cx="58" cy="44" r="3.5" fill="#5fe87a" opacity="0.9" />
      </svg>
      <div className="met-cannon-glow" />
    </div>
  );
}
