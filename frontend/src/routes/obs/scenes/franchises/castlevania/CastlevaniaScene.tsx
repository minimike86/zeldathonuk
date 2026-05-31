import './castlevania.css';

/**
 * Castlevania (NES) — the classic title vista: Dracula's castle perched on a
 * jagged hill beneath an enormous blood moon, bats swarming, lightning
 * flashing. Crimson/black palette. Acts as the franchise fallback. `.cv1-`
 * namespace.
 */
export function CastlevaniaScene() {
  return (
    <div className="cv1-scene" aria-hidden="true">
      {/* Blood moon */}
      <svg className="cv1-moon" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="#d83a3a" />
        <circle cx="50" cy="50" r="40" fill="url(#cv1-moon-grad)" />
        <defs>
          <radialGradient id="cv1-moon-grad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ff7a6a" />
            <stop offset="100%" stopColor="#b81e1e" />
          </radialGradient>
        </defs>
        <g fill="#a01818" opacity="0.55">
          <circle cx="40" cy="44" r="6" />
          <circle cx="62" cy="58" r="5" />
          <circle cx="52" cy="34" r="3" />
        </g>
      </svg>

      {/* Lightning flash overlay */}
      <div className="cv1-lightning" />

      {/* Jagged hill silhouette */}
      <svg className="cv1-hill" viewBox="0 0 1200 320" preserveAspectRatio="none">
        <path d="M0 320 L0 200 Q150 150 320 170 Q480 188 600 130 Q740 60 900 120
                 Q1050 170 1200 150 L1200 320 Z" fill="rgba(8, 4, 6, 1)" />
        {/* dead trees on the slope */}
        <g stroke="rgba(14, 6, 8, 1)" strokeWidth="5" fill="none" strokeLinecap="round">
          <path d="M180 200 L186 150" />
          <path d="M184 168 L168 154" />
          <path d="M185 162 L202 148" />
          <path d="M1020 175 L1026 130" />
          <path d="M1024 148 L1008 136" />
          <path d="M1025 144 L1042 132" />
        </g>
      </svg>

      {/* Dracula's castle */}
      <svg className="cv1-castle" viewBox="0 0 460 280">
        {/* main keep */}
        <path d="M60 280 L60 120 L100 120 L100 90 L140 90 L140 60 L180 60 L180 100 L280 100
                 L280 60 L320 60 L320 90 L360 90 L360 120 L400 120 L400 280 Z"
          fill="rgba(12, 6, 8, 0.99)" />
        {/* central tall tower */}
        <rect x="195" y="20" width="70" height="80" fill="rgba(8, 4, 6, 1)" />
        <path d="M188 20 L272 20 L260 0 L200 0 Z" fill="rgba(8, 4, 6, 1)" />
        <path d="M230 0 L230 -18" stroke="rgba(8, 4, 6, 1)" strokeWidth="3" />
        {/* side spires */}
        <path d="M120 60 L120 30 L140 30 L140 60 Z" fill="rgba(8, 4, 6, 1)" />
        <path d="M116 30 L144 30 L130 14 Z" fill="rgba(8, 4, 6, 1)" />
        <path d="M320 60 L320 30 L340 30 L340 60 Z" fill="rgba(8, 4, 6, 1)" />
        <path d="M316 30 L344 30 L330 14 Z" fill="rgba(8, 4, 6, 1)" />
        {/* crenellations */}
        <g fill="rgba(20, 10, 12, 0.98)">
          <rect x="64" y="114" width="14" height="12" />
          <rect x="92" y="114" width="14" height="12" />
          <rect x="354" y="114" width="14" height="12" />
          <rect x="382" y="114" width="14" height="12" />
        </g>
        {/* eerie lit windows */}
        <g fill="#ff5a4a" opacity="0.85">
          <rect x="222" y="44" width="16" height="26" rx="2" />
          <rect x="124" y="40" width="10" height="14" />
          <rect x="326" y="40" width="10" height="14" />
        </g>
        <g fill="#d4992e" opacity="0.7">
          <rect x="150" y="140" width="12" height="20" />
          <rect x="298" y="140" width="12" height="20" />
          {/* great gate */}
          <path d="M210 280 L210 210 Q230 188 250 210 L250 280 Z" fill="#3a0c0c" opacity="0.9" />
        </g>
      </svg>

      {/* Two bat clusters swarming the moon */}
      <svg className="cv1-bats" viewBox="0 0 120 60" style={{ position: 'absolute', top: '18%', left: 0, width: '8%', maxWidth: '100px' }}>
        <g fill="rgba(6, 2, 4, 0.95)">
          <path d="M30 30 Q22 20 10 26 Q18 28 24 36 Q28 28 30 30 Z" />
          <path d="M30 30 Q38 20 50 26 Q42 28 36 36 Q32 28 30 30 Z" />
          <circle cx="30" cy="28" r="2.4" />
          <path d="M80 18 Q74 10 64 15 Q71 17 76 23 Q78 16 80 18 Z" />
          <path d="M80 18 Q86 10 96 15 Q89 17 84 23 Q82 16 80 18 Z" />
          <circle cx="80" cy="16" r="1.8" />
        </g>
      </svg>
      <svg className="cv1-bats cv1-bats-2" viewBox="0 0 120 60" style={{ position: 'absolute', top: '26%', left: 0, width: '7%', maxWidth: '90px' }}>
        <g fill="rgba(6, 2, 4, 0.95)">
          <path d="M40 30 Q32 20 20 26 Q28 28 34 36 Q38 28 40 30 Z" />
          <path d="M40 30 Q48 20 60 26 Q52 28 46 36 Q42 28 40 30 Z" />
          <circle cx="40" cy="28" r="2.2" />
        </g>
      </svg>
    </div>
  );
}
