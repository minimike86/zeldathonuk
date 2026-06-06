import './mario.css';

/**
 * Paper Mario — a papercraft diorama. Flat folded paper hills layered with
 * visible fold creases, paper clouds on sticks, a flat folded Mario standee
 * and a Goomba standee, with confetti-like paper scraps drifting down. Covers
 * Paper Mario / Super Paper Mario / TTYD. `.pm-` namespace.
 */
export function PaperMarioScene() {
  return (
    <div className="pm-scene" aria-hidden="true">
      {/* Paper sun in the corner — flat with a fold */}
      <svg className="pm-sun" viewBox="0 0 120 120">
        <g transform="translate(60 60)">
          {Array.from({ length: 12 }).map((_, i) => (
            <path
              key={i}
              d="M0 -56 L7 -40 L-7 -40 Z"
              fill="#ffd23a"
              transform={`rotate(${i * 30})`}
            />
          ))}
        </g>
        <circle cx="60" cy="60" r="34" fill="#ffe26a" />
        <path d="M60 26 L60 94" stroke="#e8b830" strokeWidth="2" opacity="0.7" />
        <circle cx="60" cy="60" r="34" fill="none" stroke="#e8b830" strokeWidth="2" />
      </svg>

      {/* Paper clouds on little stands */}
      <svg className="pm-cloud pm-cloud-a" viewBox="0 0 160 90">
        <path d="M20 60 Q14 36 38 36 Q44 18 70 22 Q86 6 108 22 Q140 20 138 48 Q150 56 138 66 L24 66 Q14 64 20 60 Z" fill="#ffffff" stroke="#cfe0ee" strokeWidth="2" />
        <path d="M70 22 L70 66" stroke="#dceaf4" strokeWidth="1.5" opacity="0.8" />
      </svg>
      <svg className="pm-cloud pm-cloud-b" viewBox="0 0 160 90">
        <path d="M20 60 Q14 36 38 36 Q44 18 70 22 Q86 6 108 22 Q140 20 138 48 Q150 56 138 66 L24 66 Q14 64 20 60 Z" fill="#ffffff" stroke="#cfe0ee" strokeWidth="2" />
      </svg>

      {/* Layered folded paper hills — each a flat sheet with a crease */}
      <svg className="pm-hills pm-hills-far" viewBox="0 0 1200 220" preserveAspectRatio="none">
        <path d="M0 220 L0 120 L220 60 L520 130 L820 50 L1080 120 L1200 80 L1200 220 Z" fill="#8fd06a" stroke="#6fae4a" strokeWidth="3" />
        <path d="M220 60 L220 220 M820 50 L820 220" stroke="#6fae4a" strokeWidth="2" opacity="0.6" />
      </svg>
      <svg className="pm-hills pm-hills-near" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 110 L300 60 L640 120 L980 56 L1200 110 L1200 200 Z" fill="#5fb83f" stroke="#3f8c28" strokeWidth="3" />
        <path d="M300 60 L300 200 M980 56 L980 200" stroke="#3f8c28" strokeWidth="2" opacity="0.6" />
      </svg>

      {/* Flat folded Mario standee — propped up like a cardboard cutout */}
      <svg className="pm-mario" viewBox="0 0 90 150">
        {/* shadow tab */}
        <ellipse cx="45" cy="146" rx="30" ry="5" fill="rgba(0,0,0,0.2)" />
        {/* cap */}
        <path d="M16 36 Q45 12 74 36 L74 44 L16 44 Z" fill="#e23b3b" stroke="#9a1c1c" strokeWidth="2" />
        <circle cx="45" cy="34" r="7" fill="#fff" />
        <path d="M41 32 Q45 28 49 32" stroke="#e23b3b" strokeWidth="1.4" fill="none" />
        {/* face */}
        <rect x="24" y="44" width="42" height="26" rx="6" fill="#f0c08a" stroke="#c89a64" strokeWidth="1.5" />
        <path d="M30 60 Q45 70 60 60" stroke="#7a4a22" strokeWidth="3" fill="none" />
        {/* body / overalls */}
        <path d="M24 70 L66 70 L70 120 L20 120 Z" fill="#2a6adf" stroke="#1a4aa0" strokeWidth="2" />
        <rect x="30" y="70" width="30" height="20" fill="#e23b3b" />
        <circle cx="38" cy="92" r="3" fill="#ffd23a" /><circle cx="52" cy="92" r="3" fill="#ffd23a" />
        {/* fold crease down the middle */}
        <path d="M45 44 L45 120" stroke="#1a4aa0" strokeWidth="1.5" opacity="0.5" />
        {/* legs */}
        <rect x="24" y="120" width="14" height="22" fill="#2a6adf" />
        <rect x="52" y="120" width="14" height="22" fill="#2a6adf" />
        <rect x="20" y="138" width="22" height="8" rx="4" fill="#6a3a1a" />
        <rect x="48" y="138" width="22" height="8" rx="4" fill="#6a3a1a" />
      </svg>

      {/* Flat folded Goomba standee */}
      <svg className="pm-goomba" viewBox="0 0 80 80">
        <ellipse cx="40" cy="76" rx="22" ry="3.5" fill="rgba(0,0,0,0.2)" />
        <path d="M10 50 Q10 18 40 18 Q70 18 70 50 Q70 60 56 60 L24 60 Q10 60 10 50 Z" fill="#a86a2a" stroke="#6a3a14" strokeWidth="2" />
        <path d="M40 18 L40 60" stroke="#6a3a14" strokeWidth="1.4" opacity="0.5" />
        <path d="M22 40 L34 34 M58 40 L46 34" stroke="#3a1c08" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="30" cy="46" rx="4" ry="6" fill="#fff" /><ellipse cx="50" cy="46" rx="4" ry="6" fill="#fff" />
        <circle cx="30" cy="48" r="2" fill="#1a1a1a" /><circle cx="50" cy="48" r="2" fill="#1a1a1a" />
        <rect x="18" y="60" width="16" height="12" fill="#caa07a" />
        <rect x="46" y="60" width="16" height="12" fill="#caa07a" />
      </svg>

      {/* Drifting confetti paper scraps */}
      <svg className="pm-scrap pm-scrap-a" viewBox="0 0 20 20"><rect x="2" y="2" width="16" height="16" fill="#e23b3b" /></svg>
      <svg className="pm-scrap pm-scrap-b" viewBox="0 0 20 20"><rect x="2" y="2" width="16" height="16" fill="#2a9dc8" /></svg>
      <svg className="pm-scrap pm-scrap-c" viewBox="0 0 20 20"><rect x="2" y="2" width="16" height="16" fill="#ffd23a" /></svg>
    </div>
  );
}
