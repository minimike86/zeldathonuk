import './mario.css';

/**
 * Super Mario RPG: Legend of the Seven Stars — Star Road at night. A warm
 * indigo/amber sky over an isometric rolling landscape, the broken Star Road
 * arcing across the heavens, and bright wish-stars falling and streaking down.
 * `.smrpg-` namespace.
 */
export function SuperMarioRpgScene() {
  return (
    <div className="smrpg-scene" aria-hidden="true">
      {/* Static background stars */}
      <div className="smrpg-stars" />

      {/* The broken Star Road arcing across the sky */}
      <svg className="smrpg-road" viewBox="0 0 1200 300" preserveAspectRatio="none">
        <path
          d="M-40 250 Q300 60 600 120 Q900 180 1240 40"
          fill="none" stroke="#ffd23a" strokeWidth="14" strokeLinecap="round" opacity="0.85"
        />
        <path
          d="M-40 250 Q300 60 600 120 Q900 180 1240 40"
          fill="none" stroke="#fff6c8" strokeWidth="5" strokeLinecap="round"
        />
        {/* a couple of broken gaps suggested by dark notches */}
        <g fill="#1a1640"><circle cx="430" cy="92" r="7" /><circle cx="820" cy="158" r="7" /></g>
      </svg>

      {/* The seven-pointed wish star, gently spinning centre */}
      <svg className="smrpg-wishstar" viewBox="0 0 80 80">
        <path
          d="M40 4 L48 28 L74 28 L52 44 L60 70 L40 54 L20 70 L28 44 L6 28 L32 28 Z"
          fill="#ffe06a" stroke="#ffae2a" strokeWidth="2"
        />
        <g fill="#fff1c0"><circle cx="40" cy="40" r="9" /></g>
        <g fill="#1c1c2a"><circle cx="36" cy="38" r="1.6" /><circle cx="44" cy="38" r="1.6" /></g>
        <path d="M36 44 Q40 47 44 44" stroke="#1c1c2a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </svg>

      {/* Falling streaking stars */}
      <svg className="smrpg-fall smrpg-fall-a" viewBox="0 0 120 30">
        <path d="M0 4 L80 14 Z" stroke="#fff6c8" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        <path d="M84 14 L92 8 L96 16 L104 14 L96 20 L98 28 L90 22 L84 26 L86 18 Z" fill="#ffe06a" />
      </svg>
      <svg className="smrpg-fall smrpg-fall-b" viewBox="0 0 120 30">
        <path d="M0 4 L80 14 Z" stroke="#fff6c8" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        <path d="M84 14 L92 8 L96 16 L104 14 L96 20 L98 28 L90 22 L84 26 L86 18 Z" fill="#ffcf6a" />
      </svg>
      <svg className="smrpg-fall smrpg-fall-c" viewBox="0 0 120 30">
        <path d="M0 4 L80 14 Z" stroke="#fff6c8" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        <path d="M84 14 L92 8 L96 16 L104 14 L96 20 L98 28 L90 22 L84 26 L86 18 Z" fill="#ffe06a" />
      </svg>

      {/* Isometric warm-toned land in the foreground */}
      <svg className="smrpg-land" viewBox="0 0 1200 220" preserveAspectRatio="none">
        <path d="M0 220 L0 150 Q300 110 600 140 Q900 170 1200 130 L1200 220 Z" fill="#5a3a7a" />
        <path d="M0 220 L0 184 Q300 156 600 178 Q900 200 1200 170 L1200 220 Z" fill="#3a2456" />
        {/* isometric diamond tile glints */}
        <g fill="#8a5ac0" opacity="0.5">
          <path d="M200 188 L220 196 L200 204 L180 196 Z" />
          <path d="M520 196 L540 204 L520 212 L500 204 Z" />
          <path d="M880 188 L900 196 L880 204 L860 196 Z" />
        </g>
      </svg>
    </div>
  );
}
