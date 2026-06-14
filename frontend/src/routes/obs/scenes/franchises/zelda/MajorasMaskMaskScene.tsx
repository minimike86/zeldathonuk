/**
 * Majora's Mask scene — the mask itself, with Termina's other masks circling it.
 */
export function MajorasMaskMaskScene() {
  return (
    <div className="mmm-scene" aria-hidden="true">
      <div className="mmm-aura" />
      <div className="mmm-swirl mmm-swirl-back" />
      <div className="mmm-swirl mmm-swirl-front" />

      <svg className="mmm-support-mask mmm-mask-deku" viewBox="-60 -60 120 120">
        <ellipse cx="0" cy="0" rx="42" ry="48" fill="#7a4a20" stroke="#241009" strokeWidth="4" />
        <path d="M-34 -10 Q-16 -26 0 -12 Q16 -26 34 -10 Q20 0 0 -2 Q-20 0 -34 -10 Z" fill="#3f2413" />
        <circle cx="-16" cy="-7" r="6" fill="#ffd84c" />
        <circle cx="16" cy="-7" r="6" fill="#ffd84c" />
        <ellipse cx="0" cy="20" rx="20" ry="13" fill="#2b140c" />
        <path d="M-28 32 Q0 48 28 32" stroke="#3ba34b" strokeWidth="7" fill="none" strokeLinecap="round" />
      </svg>

      <svg className="mmm-support-mask mmm-mask-goron" viewBox="-60 -60 120 120">
        <circle cx="0" cy="0" r="44" fill="#b9824b" stroke="#2d160b" strokeWidth="4" />
        <path d="M-40 -6 Q-18 -30 0 -12 Q18 -30 40 -6" fill="#6a3b20" />
        <ellipse cx="-17" cy="-4" rx="8" ry="5" fill="#1c0906" />
        <ellipse cx="17" cy="-4" rx="8" ry="5" fill="#1c0906" />
        <path d="M-18 22 Q0 34 18 22" stroke="#2d160b" strokeWidth="5" fill="none" strokeLinecap="round" />
        <g fill="#d4ad71">
          <circle cx="-32" cy="26" r="7" />
          <circle cx="32" cy="26" r="7" />
          <circle cx="0" cy="-35" r="8" />
        </g>
      </svg>

      <svg className="mmm-support-mask mmm-mask-zora" viewBox="-70 -70 140 140">
        <path
          d="M0 -58 C36 -42 56 -12 44 24 C32 56 -10 58 -30 34 C-52 8 -38 -36 0 -58 Z"
          fill="#8ed5ce"
          stroke="#12353b"
          strokeWidth="4"
        />
        <path d="M0 -58 C-16 -24 -14 14 0 50 C18 16 20 -22 0 -58 Z" fill="#e6f4d7" opacity="0.82" />
        <path d="M-38 -12 L-64 -30 L-46 6 Z" fill="#62aaa9" stroke="#12353b" strokeWidth="3" />
        <path d="M38 -12 L64 -30 L46 6 Z" fill="#62aaa9" stroke="#12353b" strokeWidth="3" />
        <ellipse cx="-15" cy="-8" rx="7" ry="10" fill="#111018" />
        <ellipse cx="15" cy="-8" rx="7" ry="10" fill="#111018" />
        <path d="M-16 22 Q0 32 16 22" stroke="#12353b" strokeWidth="4" fill="none" strokeLinecap="round" />
      </svg>

      <svg className="mmm-support-mask mmm-mask-bunny" viewBox="-70 -80 140 160">
        <path d="M-22 -8 C-42 -42 -38 -76 -20 -72 C-4 -68 -2 -30 -8 -4 Z" fill="#f1d8b8" stroke="#3a1b18" strokeWidth="4" />
        <path d="M22 -8 C42 -42 38 -76 20 -72 C4 -68 2 -30 8 -4 Z" fill="#f1d8b8" stroke="#3a1b18" strokeWidth="4" />
        <ellipse cx="0" cy="18" rx="38" ry="44" fill="#d49a6a" stroke="#3a1b18" strokeWidth="4" />
        <ellipse cx="-14" cy="8" rx="7" ry="9" fill="#21100f" />
        <ellipse cx="14" cy="8" rx="7" ry="9" fill="#21100f" />
        <path d="M0 18 L-8 31 L8 31 Z" fill="#4c201d" />
        <path d="M-18 42 Q0 52 18 42" stroke="#3a1b18" strokeWidth="4" fill="none" strokeLinecap="round" />
      </svg>

      <svg className="mmm-support-mask mmm-mask-captain" viewBox="-60 -70 120 140">
        <path d="M-36 -20 Q0 -56 36 -20 L42 34 Q10 58 -10 52 Q-36 44 -42 18 Z" fill="#d6cfb7" stroke="#221414" strokeWidth="4" />
        <path d="M-32 -18 Q0 -40 32 -18 Q18 -6 0 -10 Q-18 -6 -32 -18 Z" fill="#4a2822" />
        <ellipse cx="-14" cy="-4" rx="9" ry="6" fill="#111" />
        <ellipse cx="14" cy="-4" rx="9" ry="6" fill="#111" />
        <path d="M-16 22 Q0 16 16 22" stroke="#221414" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M-42 18 L-58 34 M42 18 L58 34" stroke="#d6cfb7" strokeWidth="8" strokeLinecap="round" />
      </svg>

      <svg className="mmm-majora-mask" viewBox="-200 -180 400 350">
        <defs>
          <radialGradient id="mmm-heart" cx="50%" cy="34%" r="70%">
            <stop offset="0%" stopColor="#6b4eb4" />
            <stop offset="38%" stopColor="#34207d" />
            <stop offset="74%" stopColor="#1d124f" />
            <stop offset="100%" stopColor="#09051f" />
          </radialGradient>
          <radialGradient id="mmm-eye-red" cx="48%" cy="42%" r="62%">
            <stop offset="0%" stopColor="#ffe45a" />
            <stop offset="24%" stopColor="#ffba24" />
            <stop offset="46%" stopColor="#ff3f12" />
            <stop offset="78%" stopColor="#a40a1e" />
            <stop offset="100%" stopColor="#1a0312" />
          </radialGradient>
          <linearGradient id="mmm-horn-green" x1="0" x2="1">
            <stop offset="0%" stopColor="#ffe65a" />
            <stop offset="30%" stopColor="#87d84d" />
            <stop offset="100%" stopColor="#0b3b29" />
          </linearGradient>
          <linearGradient id="mmm-horn-yellow" x1="0" x2="1">
            <stop offset="0%" stopColor="#fff06a" />
            <stop offset="55%" stopColor="#f2c830" />
            <stop offset="100%" stopColor="#9f5e18" />
          </linearGradient>
          <linearGradient id="mmm-horn-blue" x1="0" x2="1">
            <stop offset="0%" stopColor="#f5de48" />
            <stop offset="44%" stopColor="#35b8d7" />
            <stop offset="100%" stopColor="#132e72" />
          </linearGradient>
        </defs>

        <g className="mmm-mask-horns" stroke="#090313" strokeWidth="5" strokeLinejoin="round">
          <path d="M-70 -116 L-86 -174 L-46 -118 Z" fill="url(#mmm-horn-yellow)" />
          <path d="M70 -116 L86 -174 L46 -118 Z" fill="url(#mmm-horn-yellow)" />
          <path d="M-124 -56 L-190 -28 L-126 -12 Z" fill="url(#mmm-horn-yellow)" />
          <path d="M124 -56 L190 -28 L126 -12 Z" fill="url(#mmm-horn-yellow)" />
          <path d="M-128 -12 L-184 32 L-114 34 Z" fill="url(#mmm-horn-yellow)" />
          <path d="M128 -12 L184 32 L114 34 Z" fill="url(#mmm-horn-yellow)" />
          <path d="M-108 38 L-168 82 L-92 88 Z" fill="url(#mmm-horn-green)" />
          <path d="M108 38 L168 82 L92 88 Z" fill="url(#mmm-horn-green)" />
          <path d="M-68 82 L-104 140 L-36 108 Z" fill="url(#mmm-horn-blue)" />
          <path d="M68 82 L104 140 L36 108 Z" fill="url(#mmm-horn-blue)" />
          <g strokeWidth="2.2" opacity="0.72">
            <path d="M-72 -150 L-60 -120" stroke="#fff6a0" />
            <path d="M72 -150 L60 -120" stroke="#fff6a0" />
            <path d="M-160 -30 L-126 -26" stroke="#fff6a0" />
            <path d="M160 -30 L126 -26" stroke="#fff6a0" />
            <path d="M-146 72 L-104 72" stroke="#fff6a0" />
            <path d="M146 72 L104 72" stroke="#fff6a0" />
          </g>
        </g>

        <path
          d="M0 -126
             C42 -150 108 -122 128 -62
             C150 6 112 82 64 118
             C36 140 12 154 0 158
             C-12 154 -36 140 -64 118
             C-112 82 -150 6 -128 -62
             C-108 -122 -42 -150 0 -126 Z"
          fill="url(#mmm-heart)"
          stroke="#090313"
          strokeWidth="8"
        />
        <path
          d="M0 -118 C18 -82 24 -32 20 24 C16 78 8 124 0 150 C-8 124 -16 78 -20 24 C-24 -32 -18 -82 0 -118 Z"
          fill="#17104a"
          opacity="0.82"
        />

        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M-116 -72 C-82 -106 -38 -106 -8 -76" stroke="#f5c54e" strokeWidth="7" />
          <path d="M116 -72 C82 -106 38 -106 8 -76" stroke="#f5c54e" strokeWidth="7" />
          <path d="M-96 -98 Q-58 -124 -18 -102" stroke="#e75b38" strokeWidth="4.5" />
          <path d="M96 -98 Q58 -124 18 -102" stroke="#e75b38" strokeWidth="4.5" />
          <path d="M-124 -18 Q-98 -34 -72 -14" stroke="#39badc" strokeWidth="5" />
          <path d="M124 -18 Q98 -34 72 -14" stroke="#39badc" strokeWidth="5" />
          <path d="M-104 18 Q-76 34 -48 18" stroke="#f5c54e" strokeWidth="5" />
          <path d="M104 18 Q76 34 48 18" stroke="#f5c54e" strokeWidth="5" />
        </g>

        <g stroke="#090313" strokeWidth="5">
          <path d="M-90 -50 C-78 -82 -34 -88 -10 -58 C0 -42 -4 -18 -20 -8 C-42 4 -78 -10 -90 -50 Z" fill="url(#mmm-eye-red)" />
          <path d="M90 -50 C78 -82 34 -88 10 -58 C0 -42 4 -18 20 -8 C42 4 78 -10 90 -50 Z" fill="url(#mmm-eye-red)" />
          <circle cx="-48" cy="-40" r="18" fill="#fff138" />
          <circle cx="48" cy="-40" r="18" fill="#fff138" />
          <circle cx="-48" cy="-40" r="11" fill="#28e23a" />
          <circle cx="48" cy="-40" r="11" fill="#28e23a" />
          <circle cx="-48" cy="-40" r="4.5" fill="#06050d" />
          <circle cx="48" cy="-40" r="4.5" fill="#06050d" />
        </g>

        <path d="M-18 -4 Q0 -22 18 -4 L8 30 Q0 40 -8 30 Z" fill="#0f0a2f" stroke="#090313" strokeWidth="5" />
        <path d="M-10 0 Q0 10 10 0" stroke="#7045ba" strokeWidth="4" fill="none" strokeLinecap="round" />

        <g fill="#c92165" stroke="#090313" strokeWidth="4">
          <circle cx="-90" cy="36" r="13" />
          <circle cx="90" cy="36" r="13" />
          <circle cx="-48" cy="96" r="12" />
          <circle cx="48" cy="96" r="12" />
        </g>
        <g fill="#30d04a" stroke="#0b4e23" strokeWidth="3">
          <circle cx="-90" cy="36" r="6" />
          <circle cx="90" cy="36" r="6" />
          <circle cx="-48" cy="96" r="5.5" />
          <circle cx="48" cy="96" r="5.5" />
        </g>

        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M-84 58 Q-54 78 -22 58" stroke="#f5c54e" strokeWidth="6" />
          <path d="M84 58 Q54 78 22 58" stroke="#f5c54e" strokeWidth="6" />
          <path d="M-58 78 Q-26 96 0 78 Q26 96 58 78" stroke="#e9682c" strokeWidth="5" />
          <path d="M-28 110 Q0 132 28 110" stroke="#f5c54e" strokeWidth="6" />
          <path d="M-110 78 Q-78 112 -34 128" stroke="#39badc" strokeWidth="5" />
          <path d="M110 78 Q78 112 34 128" stroke="#39badc" strokeWidth="5" />
          <path d="M-16 -118 Q0 -104 16 -118" stroke="#e9682c" strokeWidth="5" />
          <path d="M-12 -98 Q0 -86 12 -98" stroke="#35d650" strokeWidth="4" />
          <path d="M-32 -130 Q0 -112 32 -130" stroke="#f5c54e" strokeWidth="4" />
        </g>
      </svg>

      <div className="mmm-vignette" />
    </div>
  );
}
