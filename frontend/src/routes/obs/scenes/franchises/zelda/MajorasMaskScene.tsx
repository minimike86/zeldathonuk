/**
 * Majora's Mask scene — the moon descending over Clock Town.
 */
export function MajorasMaskScene() {
  return (
    <div className="mm-scene" aria-hidden="true">
      <div className="mm-sky-pulse" />
      <div className="mm-clouds mm-clouds-back" />
      <div className="mm-clouds mm-clouds-front" />
      <svg className="mm-moon" viewBox="-130 -130 260 260">
        <defs>
          <radialGradient id="mm-moon-surface" cx="42%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#f8d9a6" />
            <stop offset="45%" stopColor="#c8844f" />
            <stop offset="78%" stopColor="#8f4a35" />
            <stop offset="100%" stopColor="#44221f" />
          </radialGradient>
          <radialGradient id="mm-moon-shadow" cx="50%" cy="52%" r="58%">
            <stop offset="0%" stopColor="rgba(255, 222, 166, 0)" />
            <stop offset="62%" stopColor="rgba(86, 34, 28, 0.16)" />
            <stop offset="100%" stopColor="rgba(22, 8, 12, 0.56)" />
          </radialGradient>
          <clipPath id="mm-moon-clip">
            <circle cx="0" cy="0" r="112" />
          </clipPath>
        </defs>

        <circle cx="0" cy="0" r="116" fill="rgba(245, 204, 134, 0.18)" />
        <g clipPath="url(#mm-moon-clip)">
          <circle cx="0" cy="0" r="112" fill="url(#mm-moon-surface)" />
          <path
            d="M-112 -4 C-82 -34 -56 -50 -18 -54 C38 -60 82 -36 112 -4 L112 116 L-112 116 Z"
            fill="rgba(82, 35, 32, 0.24)"
          />
          <ellipse cx="-54" cy="-74" rx="28" ry="13" fill="rgba(255, 222, 156, 0.24)" transform="rotate(-18 -54 -74)" />
          <ellipse cx="58" cy="-70" rx="23" ry="11" fill="rgba(255, 222, 156, 0.16)" transform="rotate(18 58 -70)" />
          <ellipse cx="-76" cy="18" rx="14" ry="22" fill="rgba(64, 22, 22, 0.35)" transform="rotate(-26 -76 18)" />
          <ellipse cx="78" cy="18" rx="18" ry="25" fill="rgba(64, 22, 22, 0.32)" transform="rotate(22 78 18)" />
          <ellipse cx="-22" cy="72" rx="42" ry="20" fill="rgba(64, 22, 22, 0.22)" />
          <g fill="rgba(62, 24, 22, 0.34)">
            <circle cx="-84" cy="-28" r="8" />
            <circle cx="-20" cy="-92" r="6" />
            <circle cx="22" cy="-82" r="5" />
            <circle cx="84" cy="-18" r="7" />
            <circle cx="-92" cy="64" r="5" />
            <circle cx="52" cy="76" r="9" />
          </g>

          <g fill="#2a0d0b">
            <path d="M-82 -24 C-64 -58 -20 -60 -8 -29 C-26 -38 -54 -34 -82 -24 Z" />
            <path d="M82 -24 C64 -58 20 -60 8 -29 C26 -38 54 -34 82 -24 Z" />
            <ellipse cx="-43" cy="-18" rx="22" ry="11" transform="rotate(-10 -43 -18)" />
            <ellipse cx="43" cy="-18" rx="22" ry="11" transform="rotate(10 43 -18)" />
          </g>
          <g fill="#f3d35f">
            <ellipse cx="-41" cy="-17" rx="8" ry="4" transform="rotate(-10 -41 -17)" />
            <ellipse cx="41" cy="-17" rx="8" ry="4" transform="rotate(10 41 -17)" />
          </g>
          <g fill="rgba(21, 8, 8, 0.76)">
            <path d="M-14 -6 C-22 14 -20 38 0 48 C20 38 22 14 14 -6 C8 4 -8 4 -14 -6 Z" />
            <ellipse cx="-7" cy="26" rx="5" ry="3" />
            <ellipse cx="7" cy="26" rx="5" ry="3" />
          </g>
          <path
            d="M-70 44 C-42 72 -8 80 0 65 C8 80 43 72 70 42 C56 76 30 95 0 96 C-30 95 -57 77 -70 44 Z"
            fill="#240909"
          />
          <path
            d="M-58 52 C-36 65 -16 67 0 58 C17 67 37 64 58 51"
            stroke="#f1c069"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <g fill="#ead08c">
            <path d="M-44 59 L-35 69 L-27 58 Z" />
            <path d="M-18 64 L-9 75 L-2 62 Z" />
            <path d="M11 63 L20 74 L28 61 Z" />
            <path d="M38 58 L47 68 L55 55 Z" />
          </g>
          <g stroke="#3a130f" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.78">
            <path d="M-88 -62 L-66 -48 L-72 -28 L-48 -20" />
            <path d="M72 -82 L52 -62 L58 -42 L34 -28" />
            <path d="M-104 14 L-82 30 L-88 52 L-60 66" />
            <path d="M30 88 L48 62 L72 58 L86 36" />
            <path d="M-10 -108 L-4 -78 L14 -66" />
          </g>
          <circle cx="0" cy="0" r="112" fill="url(#mm-moon-shadow)" />
        </g>
        <circle cx="0" cy="0" r="112" fill="none" stroke="rgba(55, 20, 18, 0.58)" strokeWidth="5" />
      </svg>
      <div className="mm-falling-star mm-falling-star-1" />
      <div className="mm-falling-star mm-falling-star-2" />
      <svg className="mm-clocktower" viewBox="0 0 180 320" aria-hidden="true">
        <path d="M70 320 L78 128 L102 128 L110 320 Z" fill="rgba(11, 7, 18, 0.96)" />
        <path d="M46 142 L90 78 L134 142 Z" fill="rgba(15, 10, 24, 0.98)" />
        <rect x="58" y="142" width="64" height="90" fill="rgba(14, 9, 22, 0.98)" />
        <circle cx="90" cy="176" r="24" fill="rgba(244, 184, 75, 0.2)" stroke="rgba(244, 184, 75, 0.7)" strokeWidth="4" />
        <path d="M90 176 L90 160 M90 176 L104 184" stroke="rgba(244, 184, 75, 0.85)" strokeWidth="4" strokeLinecap="round" />
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
