import './mario.css';

/**
 * Super Mario Galaxy — the cosmic observatory. Deep blue/violet space with a
 * dense starfield, several little spherical planetoids (one ringed, one with a
 * tiny pipe, one grassy) orbiting at different depths, a comet streaking past,
 * and scattered Star Bits twinkling. `.smg-` namespace.
 */
export function SuperMarioGalaxyScene() {
  return (
    <div className="smg-scene" aria-hidden="true">
      {/* Twinkling deep-space starfield */}
      <div className="smg-stars" />

      {/* Streaking comet */}
      <svg className="smg-comet" viewBox="0 0 200 40">
        <path d="M0 22 L150 18 Z" stroke="#9fd8ff" strokeWidth="3" opacity="0.7" strokeLinecap="round" />
        <circle cx="158" cy="18" r="8" fill="#cfeeff" />
        <circle cx="158" cy="18" r="4" fill="#ffffff" />
      </svg>

      {/* Ringed planetoid, mid */}
      <svg className="smg-planet smg-planet-ring" viewBox="0 0 120 100">
        <ellipse cx="60" cy="50" rx="54" ry="16" fill="none" stroke="#ffcf6a" strokeWidth="4" opacity="0.8" />
        <circle cx="60" cy="50" r="30" fill="#c86adf" />
        <path d="M34 44 Q48 38 60 42 Q76 46 86 40" stroke="#9a3cc0" strokeWidth="3" fill="none" />
        <ellipse cx="60" cy="50" rx="54" ry="16" fill="none" stroke="#ffe0a0" strokeWidth="1.5" opacity="0.9" />
      </svg>

      {/* Grassy planetoid with a tiny pipe + flag, foreground */}
      <svg className="smg-planet smg-planet-grass" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="44" fill="#3a6acd" />
        <path d="M16 60 A44 44 0 0 1 104 60 Q84 50 60 52 Q36 50 16 60 Z" fill="#4caf50" />
        <ellipse cx="60" cy="16" rx="44" ry="10" fill="#5fc35a" />
        {/* tiny green pipe */}
        <rect x="50" y="6" width="14" height="12" fill="#2a9d3a" stroke="#1c6e26" strokeWidth="1.5" />
        <rect x="47" y="2" width="20" height="6" fill="#36c34a" stroke="#1c6e26" strokeWidth="1.5" />
        {/* little flag */}
        <rect x="84" y="20" width="2" height="16" fill="#ffffff" />
        <path d="M86 20 L98 24 L86 28 Z" fill="#e23b3b" />
      </svg>

      {/* Small distant planetoid */}
      <svg className="smg-planet smg-planet-far" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="30" fill="#7a4cd0" />
        <g fill="#5a2ca8"><circle cx="30" cy="34" r="6" /><circle cx="52" cy="46" r="5" /><circle cx="40" cy="54" r="4" /></g>
      </svg>

      {/* Scattered twinkling Star Bits */}
      <svg className="smg-bit smg-bit-a" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="#7af0ff" /><circle cx="12" cy="12" r="3" fill="#ffffff" /></svg>
      <svg className="smg-bit smg-bit-b" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="#ff8fd6" /><circle cx="12" cy="12" r="3" fill="#ffffff" /></svg>
      <svg className="smg-bit smg-bit-c" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="#ffe06a" /><circle cx="12" cy="12" r="3" fill="#ffffff" /></svg>

      {/* Launch Star centre — a spinning five-point gleam */}
      <svg className="smg-launchstar" viewBox="0 0 60 60">
        <path
          d="M30 2 L37 22 L58 22 L41 35 L48 56 L30 43 L12 56 L19 35 L2 22 L23 22 Z"
          fill="#ffd23a" stroke="#ffae2a" strokeWidth="2"
        />
        <circle cx="30" cy="30" r="7" fill="#fff6c8" />
      </svg>
    </div>
  );
}
