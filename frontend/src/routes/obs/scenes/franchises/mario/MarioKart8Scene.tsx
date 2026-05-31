import './mario.css';

/**
 * Mario Kart 8 — the anti-gravity era. A glowing neon track loop twisting
 * through dark space with magenta/cyan edge lighting, a vertical anti-grav
 * wall section, blue anti-grav glow boosters, and a kart with brightly
 * glowing wheels zipping the loop. `.mk8-` namespace.
 */
export function MarioKart8Scene() {
  return (
    <div className="mk8-scene" aria-hidden="true">
      {/* Faint star/space speckle */}
      <div className="mk8-stars" />

      {/* The anti-gravity track loop */}
      <svg className="mk8-loop" viewBox="0 0 1200 600" preserveAspectRatio="none">
        <defs>
          <linearGradient id="mk8-edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff4dd2" />
            <stop offset="50%" stopColor="#a07cff" />
            <stop offset="100%" stopColor="#33e6ff" />
          </linearGradient>
        </defs>
        {/* track surface — a sweeping loop ribbon */}
        <path
          d="M-40 460 Q260 300 520 420 Q820 560 980 360 Q1100 210 1260 300"
          fill="none" stroke="#1a1838" strokeWidth="72" strokeLinecap="round"
        />
        {/* glow underlay */}
        <path
          d="M-40 460 Q260 300 520 420 Q820 560 980 360 Q1100 210 1260 300"
          fill="none" stroke="url(#mk8-edge)" strokeWidth="84" strokeLinecap="round" opacity="0.25"
        />
        {/* twin neon edge lines */}
        <path
          d="M-40 426 Q260 266 520 386 Q820 526 980 326 Q1100 176 1260 266"
          fill="none" stroke="url(#mk8-edge)" strokeWidth="5" strokeLinecap="round"
        />
        <path
          d="M-40 494 Q260 334 520 454 Q820 594 980 394 Q1100 244 1260 334"
          fill="none" stroke="url(#mk8-edge)" strokeWidth="5" strokeLinecap="round"
        />
        {/* dashed centre */}
        <path
          d="M-40 460 Q260 300 520 420 Q820 560 980 360 Q1100 210 1260 300"
          fill="none" stroke="#cfe6ff" strokeWidth="3" strokeDasharray="16 26" opacity="0.7"
        />
        {/* blue anti-grav boost chevrons */}
        <g className="mk8-boost" fill="#33e6ff" opacity="0.85">
          <path d="M300 366 L324 374 L300 382 Z" />
          <path d="M340 360 L364 368 L340 376 Z" />
          <path d="M820 442 L844 450 L820 458 Z" />
          <path d="M860 436 L884 444 L860 452 Z" />
        </g>
      </svg>

      {/* Anti-grav wall panel rising on the right */}
      <svg className="mk8-wall" viewBox="0 0 200 360">
        <path d="M20 360 L20 40 L180 0 L180 320 Z" fill="rgba(40, 30, 70, 0.6)" stroke="#a07cff" strokeWidth="3" />
        <g stroke="#33e6ff" strokeWidth="2" opacity="0.55">
          <path d="M20 120 L180 90 M20 200 L180 175 M20 280 L180 260" />
        </g>
      </svg>

      {/* Kart with glowing anti-grav wheels */}
      <svg className="mk8-kart" viewBox="0 0 100 60">
        <path d="M14 36 Q18 22 40 22 L64 22 Q80 22 82 36 L82 42 L14 42 Z" fill="#3a7adf" stroke="#1a4aa0" strokeWidth="3" />
        <ellipse cx="48" cy="20" rx="11" ry="10" fill="#3a7adf" />
        <circle cx="48" cy="18" r="5" fill="#fff" />
        {/* glowing wheels */}
        <circle cx="26" cy="44" r="10" fill="#10203a" stroke="#33e6ff" strokeWidth="3" />
        <circle cx="26" cy="44" r="4" fill="#7af0ff" />
        <circle cx="70" cy="44" r="10" fill="#10203a" stroke="#33e6ff" strokeWidth="3" />
        <circle cx="70" cy="44" r="4" fill="#7af0ff" />
        {/* anti-grav under-glow */}
        <ellipse cx="48" cy="52" rx="38" ry="6" fill="#33e6ff" opacity="0.5" />
      </svg>
    </div>
  );
}
