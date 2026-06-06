import './mario.css';

/**
 * Super Mario Bros. 2 — the dream world of Subcon. A magenta/purple twilight
 * desert with rolling dune silhouettes, a plucked turnip hovering centre-stage,
 * Shy Guy masks peeking from the sand, and floating "Subspace" potion doors
 * shimmering in the dreamy haze. `.smb2-` namespace.
 */
export function SuperMarioBros2Scene() {
  return (
    <div className="smb2-scene" aria-hidden="true">
      {/* Dream haze bloom */}
      <div className="smb2-haze" />

      {/* Floating Subspace potion door, drifting */}
      <svg className="smb2-door" viewBox="0 0 80 120">
        <rect x="14" y="20" width="52" height="96" rx="6" fill="#7a2db0" stroke="#4a1670" strokeWidth="3" />
        <path d="M14 40 Q40 8 66 40 L66 20 L14 20 Z" fill="#9a4cd6" />
        <circle cx="56" cy="70" r="3.5" fill="#ffd23a" />
        <rect x="24" y="50" width="32" height="2" fill="#4a1670" />
        <rect x="24" y="86" width="32" height="2" fill="#4a1670" />
      </svg>

      {/* Hovering plucked turnip — the SMB2 throwable */}
      <svg className="smb2-turnip" viewBox="0 0 80 90">
        {/* leafy greens */}
        <g fill="#5fd66a">
          <path d="M40 8 Q28 -2 24 14 Q34 18 40 20 Z" />
          <path d="M40 8 Q52 -2 56 14 Q46 18 40 20 Z" />
          <path d="M40 6 Q40 -6 40 18 Z" stroke="#3fae54" strokeWidth="3" />
        </g>
        {/* bulb */}
        <path d="M40 20 Q70 26 64 58 Q56 86 40 86 Q24 86 16 58 Q10 26 40 20 Z" fill="#f6ecdc" />
        <path d="M40 20 Q24 30 22 56 Q24 80 40 84" fill="#fff8ee" opacity="0.6" />
        {/* face */}
        <g fill="#1c0a2a">
          <circle cx="32" cy="50" r="3" />
          <circle cx="48" cy="50" r="3" />
        </g>
        <path d="M34 60 Q40 64 46 60" stroke="#1c0a2a" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>

      {/* Shy Guy masks peeking from the dunes */}
      <svg className="smb2-shyguy smb2-shyguy-a" viewBox="0 0 40 50">
        <path d="M8 24 Q8 8 20 8 Q32 8 32 24 L32 44 L8 44 Z" fill="#d6203a" />
        <ellipse cx="20" cy="26" rx="13" ry="14" fill="#f0e6d2" />
        <g fill="#3a2a1a"><circle cx="15" cy="24" r="2.5" /><circle cx="25" cy="24" r="2.5" /></g>
        <rect x="10" y="42" width="20" height="6" fill="#7a2db0" />
      </svg>
      <svg className="smb2-shyguy smb2-shyguy-b" viewBox="0 0 40 50">
        <path d="M8 24 Q8 8 20 8 Q32 8 32 24 L32 44 L8 44 Z" fill="#3a5ad6" />
        <ellipse cx="20" cy="26" rx="13" ry="14" fill="#f0e6d2" />
        <g fill="#3a2a1a"><circle cx="15" cy="24" r="2.5" /><circle cx="25" cy="24" r="2.5" /></g>
        <rect x="10" y="42" width="20" height="6" fill="#7a2db0" />
      </svg>

      {/* Far dune ridge */}
      <svg className="smb2-dunes smb2-dunes-far" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 200 L0 120 Q150 80 320 110 Q500 140 680 100 Q860 70 1040 110 Q1140 130 1200 110 L1200 200 Z"
          fill="#5a2a8a"
        />
      </svg>
      {/* Near dune ridge */}
      <svg className="smb2-dunes smb2-dunes-near" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 200 L0 150 Q180 110 380 140 Q580 168 780 130 Q980 96 1200 140 L1200 200 Z"
          fill="#3a1660"
        />
        {/* sand striations */}
        <g stroke="#5a2a8a" strokeWidth="2" fill="none" opacity="0.7">
          <path d="M40 162 Q300 144 560 160" />
          <path d="M640 152 Q900 134 1160 156" />
        </g>
      </svg>

      {/* Drifting dream sparkles */}
      <div className="smb2-sparkles" />
    </div>
  );
}
