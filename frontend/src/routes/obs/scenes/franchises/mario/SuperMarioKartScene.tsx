import './mario.css';

/**
 * Super Mario Kart (SNES) — the Mode-7 era. A chequered track receding to a
 * low horizon over Koopa Beach blue water and pale sand, with a couple of
 * item-block panels on the track and a tiny low-poly kart hopping along the
 * near edge. `.smk-` namespace.
 */
export function SuperMarioKartScene() {
  return (
    <div className="smk-scene" aria-hidden="true">
      {/* Koopa Beach sky + distant water haze handled by background */}

      {/* Pseudo Mode-7 chequered track stretching to the horizon */}
      <svg className="smk-track" viewBox="0 0 1200 480" preserveAspectRatio="none">
        {/* track trapezoid */}
        <path d="M0 480 L420 120 L780 120 L1200 480 Z" fill="#c9b07a" />
        {/* receding chequer rows — wider as they near the camera */}
        <g>
          {[
            { y: 130, h: 14, n: 18 },
            { y: 150, h: 20, n: 16 },
            { y: 180, h: 30, n: 14 },
            { y: 224, h: 44, n: 12 },
            { y: 286, h: 64, n: 10 },
            { y: 372, h: 96, n: 8 },
          ].map((row, ri) => {
            const inset = 420 - (row.y - 120) * 1.05;
            const left = Math.max(0, inset);
            const right = 1200 - left;
            const cellW = (right - left) / row.n;
            return Array.from({ length: row.n }).map((_, ci) => (
              <rect
                key={`${ri}-${ci}`}
                x={left + ci * cellW}
                y={row.y}
                width={cellW}
                height={row.h}
                fill={(ci + ri) % 2 === 0 ? '#f4ecd8' : '#3a3a4a'}
              />
            ));
          })}
        </g>
      </svg>

      {/* Item-block panels on the track */}
      <svg className="smk-itembox smk-itembox-a" viewBox="0 0 40 40">
        <rect x="4" y="4" width="32" height="32" rx="5" fill="#ffd23a" stroke="#c87a14" strokeWidth="3" />
        <text x="20" y="29" fontSize="22" fontWeight="700" textAnchor="middle" fill="#9a1c1c">?</text>
      </svg>
      <svg className="smk-itembox smk-itembox-b" viewBox="0 0 40 40">
        <rect x="4" y="4" width="32" height="32" rx="5" fill="#ffd23a" stroke="#c87a14" strokeWidth="3" />
        <text x="20" y="29" fontSize="22" fontWeight="700" textAnchor="middle" fill="#9a1c1c">?</text>
      </svg>

      {/* Low-poly kart hopping along the near edge */}
      <svg className="smk-kart" viewBox="0 0 90 60">
        <ellipse cx="45" cy="54" rx="32" ry="5" fill="rgba(0,0,0,0.25)" />
        <path d="M12 38 Q16 24 38 24 L60 24 Q76 24 78 38 L78 44 L12 44 Z" fill="#e23b3b" stroke="#9a1c1c" strokeWidth="3" />
        <ellipse cx="46" cy="22" rx="11" ry="10" fill="#e23b3b" />
        <circle cx="46" cy="20" r="5" fill="#fff" />
        <circle cx="24" cy="46" r="9" fill="#1c1c2a" /><circle cx="24" cy="46" r="3.5" fill="#7a7a8a" />
        <circle cx="66" cy="46" r="9" fill="#1c1c2a" /><circle cx="66" cy="46" r="3.5" fill="#7a7a8a" />
      </svg>
    </div>
  );
}
