import './mario.css';

/**
 * Mario Kart — Rainbow Road. A neon multicolour ribbon track arcs through deep
 * space with guard-rail rails of light, scattered stars, a checkered start
 * banner suggestion, and a tiny kart zipping along the ribbon. `.mk-` namespace.
 */
export function MarioKartScene() {
  return (
    <div className="mk-scene" aria-hidden="true">
      {/* Space starfield */}
      <div className="mk-stars" />

      {/* Rainbow Road ribbon arcing through space */}
      <svg className="mk-road" viewBox="0 0 1200 360" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mk-rainbow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff4d6d" />
            <stop offset="20%" stopColor="#ffae2a" />
            <stop offset="40%" stopColor="#ffe83a" />
            <stop offset="60%" stopColor="#4cd95e" />
            <stop offset="80%" stopColor="#3a8ad0" />
            <stop offset="100%" stopColor="#a07cff" />
          </linearGradient>
        </defs>
        {/* glow underlay */}
        <path
          d="M-60 300 Q300 120 640 200 Q960 274 1260 90"
          fill="none" stroke="url(#mk-rainbow)" strokeWidth="46" strokeLinecap="round" opacity="0.35"
        />
        {/* main ribbon */}
        <path
          d="M-60 300 Q300 120 640 200 Q960 274 1260 90"
          fill="none" stroke="url(#mk-rainbow)" strokeWidth="26" strokeLinecap="round"
        />
        {/* dashed centre line */}
        <path
          d="M-60 300 Q300 120 640 200 Q960 274 1260 90"
          fill="none" stroke="#ffffff" strokeWidth="3" strokeDasharray="14 22" opacity="0.9"
        />
        {/* edge rail of light */}
        <path
          d="M-60 286 Q300 106 640 186 Q960 260 1260 76"
          fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.5"
        />
      </svg>

      {/* Kart zipping along the ribbon */}
      <svg className="mk-kart" viewBox="0 0 80 50">
        {/* body */}
        <path d="M10 30 Q14 18 34 18 L58 18 Q72 18 72 30 L72 36 L10 36 Z" fill="#e23b3b" stroke="#9a1c1c" strokeWidth="2" />
        {/* cockpit / driver cap */}
        <ellipse cx="42" cy="16" rx="10" ry="9" fill="#e23b3b" />
        <path d="M32 16 Q42 6 52 16 Z" fill="#cf3030" />
        <circle cx="42" cy="14" r="4" fill="#fff" /><path d="M40 13 L44 13" stroke="#e23b3b" strokeWidth="1.5" />
        {/* wheels */}
        <circle cx="22" cy="38" r="9" fill="#1c1c2a" /><circle cx="22" cy="38" r="3.5" fill="#5a5a6a" />
        <circle cx="60" cy="38" r="9" fill="#1c1c2a" /><circle cx="60" cy="38" r="3.5" fill="#5a5a6a" />
        {/* exhaust glow */}
        <path d="M6 30 L-8 26 L-4 32 L-8 38 Z" fill="#7af0ff" opacity="0.8" />
      </svg>

      {/* Start/finish checkered banner suggestion, far */}
      <svg className="mk-banner" viewBox="0 0 80 40">
        <g>
          <rect x="0" y="0" width="10" height="10" fill="#fff" /><rect x="10" y="0" width="10" height="10" fill="#1c1c2a" />
          <rect x="20" y="0" width="10" height="10" fill="#fff" /><rect x="30" y="0" width="10" height="10" fill="#1c1c2a" />
          <rect x="0" y="10" width="10" height="10" fill="#1c1c2a" /><rect x="10" y="10" width="10" height="10" fill="#fff" />
          <rect x="20" y="10" width="10" height="10" fill="#1c1c2a" /><rect x="30" y="10" width="10" height="10" fill="#fff" />
        </g>
      </svg>

      {/* Item-box question cubes drifting */}
      <svg className="mk-itembox mk-itembox-a" viewBox="0 0 40 40">
        <rect x="4" y="4" width="32" height="32" rx="6" fill="#7af0ff" stroke="#2a9dc8" strokeWidth="2" opacity="0.85" />
        <text x="20" y="29" fontSize="22" fontWeight="700" textAnchor="middle" fill="#ffffff">?</text>
      </svg>
      <svg className="mk-itembox mk-itembox-b" viewBox="0 0 40 40">
        <rect x="4" y="4" width="32" height="32" rx="6" fill="#ffae2a" stroke="#c87a14" strokeWidth="2" opacity="0.85" />
        <text x="20" y="29" fontSize="22" fontWeight="700" textAnchor="middle" fill="#ffffff">?</text>
      </svg>
    </div>
  );
}
