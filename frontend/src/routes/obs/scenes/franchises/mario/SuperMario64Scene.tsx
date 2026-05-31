import './mario.css';

/**
 * Super Mario 64 — Peach's Castle on its grassy hill under a clear sky. The
 * castle has its central red-roofed tower, stained-glass Peach window, side
 * turrets, and a glowing painting-portal shimmering on the lawn (a nod to the
 * jump-into-paintings warps). Soft drifting clouds. `.sm64-` namespace.
 */
export function SuperMario64Scene() {
  return (
    <div className="sm64-scene" aria-hidden="true">
      {/* Soft clouds */}
      <svg className="sm64-cloud sm64-cloud-a" viewBox="0 0 140 60">
        <g fill="#ffffff">
          <ellipse cx="40" cy="38" rx="28" ry="18" />
          <ellipse cx="72" cy="30" rx="30" ry="22" />
          <ellipse cx="104" cy="38" rx="26" ry="18" />
        </g>
      </svg>
      <svg className="sm64-cloud sm64-cloud-b" viewBox="0 0 140 60">
        <g fill="#ffffff">
          <ellipse cx="40" cy="38" rx="28" ry="18" />
          <ellipse cx="72" cy="30" rx="30" ry="22" />
          <ellipse cx="104" cy="38" rx="26" ry="18" />
        </g>
      </svg>

      {/* Sun bloom */}
      <div className="sm64-sun" />

      {/* The grassy hill */}
      <svg className="sm64-hill" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <path d="M0 240 L0 160 Q300 70 620 110 Q900 146 1200 90 L1200 240 Z" fill="#5fc35a" />
        <path d="M0 240 L0 200 Q300 150 620 180 Q900 206 1200 168 L1200 240 Z" fill="#4aa848" />
      </svg>

      {/* Peach's Castle */}
      <svg className="sm64-castle" viewBox="0 0 300 280">
        {/* main keep */}
        <rect x="90" y="120" width="120" height="120" fill="#f0e6d2" stroke="#c8b890" strokeWidth="2" />
        {/* central tall tower */}
        <rect x="120" y="60" width="60" height="180" fill="#f6ecdc" stroke="#c8b890" strokeWidth="2" />
        {/* central red cone roof */}
        <path d="M115 60 L150 14 L185 60 Z" fill="#e23b3b" stroke="#a82820" strokeWidth="2" />
        <circle cx="150" cy="12" r="4" fill="#ffd23a" />
        {/* Peach stained-glass round window */}
        <circle cx="150" cy="98" r="20" fill="#ffd0e6" stroke="#d68fb0" strokeWidth="3" />
        <circle cx="150" cy="92" r="7" fill="#f6b8d0" />
        <path d="M138 104 Q150 112 162 104 L162 116 L138 116 Z" fill="#f6b8d0" />
        {/* side turrets */}
        <rect x="70" y="140" width="34" height="100" fill="#efe4cf" stroke="#c8b890" strokeWidth="2" />
        <path d="M66 140 L87 108 L108 140 Z" fill="#e23b3b" stroke="#a82820" strokeWidth="2" />
        <rect x="196" y="140" width="34" height="100" fill="#efe4cf" stroke="#c8b890" strokeWidth="2" />
        <path d="M192 140 L213 108 L234 140 Z" fill="#e23b3b" stroke="#a82820" strokeWidth="2" />
        {/* rear corner towers */}
        <rect x="40" y="170" width="26" height="70" fill="#e8ddc6" stroke="#c8b890" strokeWidth="2" />
        <path d="M37 170 L53 144 L69 170 Z" fill="#cf3030" />
        <rect x="234" y="170" width="26" height="70" fill="#e8ddc6" stroke="#c8b890" strokeWidth="2" />
        <path d="M231 170 L247 144 L263 170 Z" fill="#cf3030" />
        {/* battlements */}
        <g fill="#e8ddc6">
          <rect x="90" y="116" width="10" height="8" /><rect x="110" y="116" width="10" height="8" />
          <rect x="180" y="116" width="10" height="8" /><rect x="200" y="116" width="10" height="8" />
        </g>
        {/* gate */}
        <path d="M132 240 L132 200 Q150 184 168 200 L168 240 Z" fill="#8a5a2a" stroke="#5e3a14" strokeWidth="2" />
        {/* windows */}
        <g fill="#7ac4ff">
          <rect x="100" y="150" width="12" height="18" rx="2" />
          <rect x="188" y="150" width="12" height="18" rx="2" />
          <rect x="78" y="170" width="10" height="14" rx="2" />
          <rect x="212" y="170" width="10" height="14" rx="2" />
        </g>
      </svg>

      {/* Painting-portal shimmering on the lawn */}
      <svg className="sm64-painting" viewBox="0 0 100 120">
        <rect x="6" y="6" width="88" height="108" rx="4" fill="#caa23a" stroke="#7a5800" strokeWidth="4" />
        <rect x="16" y="16" width="68" height="88" rx="2" fill="#3a8ad0" />
        <path d="M16 88 Q50 60 84 88 L84 104 L16 104 Z" fill="#4caf50" />
        <circle cx="56" cy="44" r="12" fill="#ffe06a" />
      </svg>
      <div className="sm64-painting-glow" />
    </div>
  );
}
