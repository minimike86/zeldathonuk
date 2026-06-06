import './mario.css';

/**
 * Super Mario Bros. — the iconic World 1-1. Bright blue sky, round white
 * clouds, stepped green hills, a brick-and-?-block row floating mid-air, green
 * warp pipes, and a coin spinning above a block. The most recognisable NES
 * platformer tableau. `.smb1-` namespace.
 */
export function SuperMarioBrosScene() {
  return (
    <div className="smb1-scene" aria-hidden="true">
      {/* Round clouds */}
      <svg className="smb1-cloud smb1-cloud-a" viewBox="0 0 120 50">
        <g fill="#ffffff">
          <ellipse cx="30" cy="32" rx="18" ry="14" />
          <ellipse cx="52" cy="26" rx="22" ry="18" />
          <ellipse cx="78" cy="26" rx="22" ry="18" />
          <ellipse cx="98" cy="32" rx="18" ry="14" />
        </g>
      </svg>
      <svg className="smb1-cloud smb1-cloud-b" viewBox="0 0 120 50">
        <g fill="#ffffff">
          <ellipse cx="30" cy="32" rx="18" ry="14" />
          <ellipse cx="52" cy="26" rx="22" ry="18" />
          <ellipse cx="78" cy="26" rx="22" ry="18" />
          <ellipse cx="98" cy="32" rx="18" ry="14" />
        </g>
      </svg>

      {/* Stepped green hills with the classic two-bump shape */}
      <svg className="smb1-hill smb1-hill-big" viewBox="0 0 200 100">
        <path d="M0 100 Q20 100 30 78 Q40 56 60 56 Q72 56 80 70 Q92 88 110 88 Q130 88 140 70 Q150 56 162 56 Q182 56 192 78 Q200 100 200 100 Z" fill="#3aa648" />
        <g fill="#1c6e26"><ellipse cx="86" cy="74" rx="3" ry="5" /><ellipse cx="98" cy="74" rx="3" ry="5" /></g>
      </svg>
      <svg className="smb1-hill smb1-hill-small" viewBox="0 0 140 70">
        <path d="M0 70 Q14 70 22 52 Q32 36 50 36 Q70 36 80 52 Q88 70 100 70 Z" fill="#46b855" />
        <g fill="#1c6e26"><ellipse cx="42" cy="50" rx="2.6" ry="4" /><ellipse cx="52" cy="50" rx="2.6" ry="4" /></g>
      </svg>

      {/* Floating block row: brick ? brick */}
      <svg className="smb1-blocks" viewBox="0 0 160 44">
        {/* brick */}
        <rect x="2" y="2" width="40" height="40" fill="#c8702a" stroke="#8a4a16" strokeWidth="2" />
        <g stroke="#8a4a16" strokeWidth="2"><path d="M2 22 L42 22" /><path d="M22 2 L22 22" /><path d="M12 22 L12 42" /><path d="M32 22 L32 42" /></g>
        {/* ? block */}
        <rect x="58" y="2" width="40" height="40" rx="3" fill="#f6a82a" stroke="#b06e10" strokeWidth="2" />
        <g fill="#6e3e08"><circle cx="62" cy="6" r="2" /><circle cx="94" cy="6" r="2" /><circle cx="62" cy="38" r="2" /><circle cx="94" cy="38" r="2" /></g>
        <text x="78" y="32" fontSize="26" fontWeight="700" textAnchor="middle" fill="#fff">?</text>
        {/* brick */}
        <rect x="116" y="2" width="40" height="40" fill="#c8702a" stroke="#8a4a16" strokeWidth="2" />
        <g stroke="#8a4a16" strokeWidth="2"><path d="M116 22 L156 22" /><path d="M136 2 L136 22" /><path d="M126 22 L126 42" /><path d="M146 22 L146 42" /></g>
      </svg>

      {/* Spinning coin above the ? block */}
      <svg className="smb1-coin" viewBox="0 0 24 32">
        <ellipse cx="12" cy="16" rx="8" ry="14" fill="#ffd23a" stroke="#c89a14" strokeWidth="2" />
        <rect x="10" y="6" width="4" height="20" fill="#ffe890" />
      </svg>

      {/* Green warp pipes */}
      <svg className="smb1-pipe smb1-pipe-a" viewBox="0 0 80 110">
        <rect x="18" y="34" width="44" height="76" fill="#36c34a" stroke="#1c6e26" strokeWidth="3" />
        <rect x="10" y="14" width="60" height="24" rx="3" fill="#4cd95e" stroke="#1c6e26" strokeWidth="3" />
        <rect x="26" y="40" width="6" height="70" fill="#2a9d3a" />
      </svg>
      <svg className="smb1-pipe smb1-pipe-b" viewBox="0 0 80 150">
        <rect x="18" y="34" width="44" height="116" fill="#36c34a" stroke="#1c6e26" strokeWidth="3" />
        <rect x="10" y="14" width="60" height="24" rx="3" fill="#4cd95e" stroke="#1c6e26" strokeWidth="3" />
        <rect x="26" y="40" width="6" height="110" fill="#2a9d3a" />
      </svg>

      {/* Ground course strip */}
      <svg className="smb1-ground" viewBox="0 0 1200 80" preserveAspectRatio="none">
        <rect x="0" y="0" width="1200" height="80" fill="#c8702a" />
        <g stroke="#8a4a16" strokeWidth="3">
          <path d="M0 26 L1200 26" />
          <path d="M0 52 L1200 52" />
          <path d="M30 0 L30 26 M90 26 L90 52 M150 0 L150 26 M210 26 L210 52 M270 0 L270 26 M330 26 L330 52 M390 0 L390 26 M450 26 L450 52 M510 0 L510 26 M570 26 L570 52 M630 0 L630 26 M690 26 L690 52 M750 0 L750 26 M810 26 L810 52 M870 0 L870 26 M930 26 L930 52 M990 0 L990 26 M1050 26 L1050 52 M1110 0 L1110 26 M1170 26 L1170 52" />
        </g>
      </svg>
    </div>
  );
}
