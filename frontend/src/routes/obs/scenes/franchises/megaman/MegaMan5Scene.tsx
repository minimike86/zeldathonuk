import './megaman.css';

/**
 * Mega Man 5 — a cool blue / steel-grey NES stage. A dim industrial wall
 * of riveted girder columns recedes behind a plain stage floor, and Beat —
 * the bird support unit you assemble across the game — circles overhead
 * flapping. The blue hero stands ready below. Muted blues and greys with a
 * pale-cyan accent.
 *
 * Namespace: `.mm5-`
 */
export function MegaMan5Scene() {
  return (
    <div className="mm5-scene" aria-hidden="true">
      {/* Riveted girder wall */}
      <svg className="mm5-wall" viewBox="0 0 1200 360" preserveAspectRatio="none">
        <rect width="1200" height="360" fill="#34465f" />
        <g fill="#27384e">
          <rect x="40" y="0" width="60" height="360" />
          <rect x="260" y="0" width="60" height="360" />
          <rect x="480" y="0" width="60" height="360" />
          <rect x="700" y="0" width="60" height="360" />
          <rect x="920" y="0" width="60" height="360" />
          <rect x="1140" y="0" width="60" height="360" />
        </g>
        {/* girder highlight + rivets */}
        <g fill="#5c7290">
          <rect x="44" y="0" width="6" height="360" />
          <rect x="264" y="0" width="6" height="360" />
          <rect x="484" y="0" width="6" height="360" />
          <rect x="704" y="0" width="6" height="360" />
          <rect x="924" y="0" width="6" height="360" />
          <rect x="1144" y="0" width="6" height="360" />
        </g>
        <g fill="#7f96b3">
          <circle cx="70" cy="60" r="4" />
          <circle cx="70" cy="180" r="4" />
          <circle cx="70" cy="300" r="4" />
          <circle cx="290" cy="120" r="4" />
          <circle cx="290" cy="240" r="4" />
          <circle cx="510" cy="60" r="4" />
          <circle cx="510" cy="300" r="4" />
          <circle cx="730" cy="180" r="4" />
          <circle cx="950" cy="120" r="4" />
          <circle cx="950" cy="240" r="4" />
        </g>
        {/* cross bracing */}
        <g stroke="#1f2e41" strokeWidth="5">
          <line x1="0" y1="140" x2="1200" y2="140" />
          <line x1="0" y1="260" x2="1200" y2="260" />
        </g>
      </svg>

      {/* Beat the support-bird circling overhead */}
      <svg className="mm5-beat" viewBox="0 0 80 60">
        <g fill="#e6e9ef">
          {/* body */}
          <ellipse cx="40" cy="34" rx="20" ry="14" />
          {/* head */}
          <circle cx="58" cy="26" r="11" />
          {/* tail */}
          <path d="M20 34 L4 26 L8 42 Z" />
        </g>
        {/* wings */}
        <path className="mm5-wing" d="M34 26 L18 8 L40 22 Z" fill="#bcc6d6" />
        <path className="mm5-wing mm5-wing-2" d="M46 26 L62 8 L40 22 Z" fill="#bcc6d6" />
        {/* beak + eye + crest */}
        <path d="M68 26 L80 28 L68 32 Z" fill="#ffd23a" />
        <circle cx="60" cy="24" r="2.5" fill="#1f2e41" />
        <rect x="54" y="14" width="10" height="6" fill="#7af6ff" />
      </svg>

      {/* Stage floor */}
      <svg className="mm5-floor" viewBox="0 0 1200 130" preserveAspectRatio="none">
        <rect x="0" y="22" width="1200" height="108" fill="#283a52" />
        <rect x="0" y="22" width="1200" height="6" fill="#7af6ff" />
        <g stroke="#1a2738" strokeWidth="3">
          <line x1="120" y1="28" x2="120" y2="130" />
          <line x1="320" y1="28" x2="320" y2="130" />
          <line x1="520" y1="28" x2="520" y2="130" />
          <line x1="720" y1="28" x2="720" y2="130" />
          <line x1="920" y1="28" x2="920" y2="130" />
          <line x1="1120" y1="28" x2="1120" y2="130" />
        </g>
      </svg>

      {/* Blue hero standing ready */}
      <svg className="mm5-hero" viewBox="0 0 70 90">
        <g fill="#1763c8">
          <rect x="22" y="40" width="20" height="26" />
          <path d="M20 22 Q31 14 42 22 L42 38 L20 38 Z" />
          <rect x="20" y="66" width="9" height="22" />
          <rect x="35" y="66" width="9" height="22" />
          <rect x="42" y="44" width="22" height="11" rx="3" />
        </g>
        <rect x="25" y="28" width="12" height="9" fill="#9fd0ff" />
        <rect x="27" y="30" width="3" height="5" fill="#0b2a66" />
        <rect x="32" y="30" width="3" height="5" fill="#0b2a66" />
        <rect x="29" y="18" width="4" height="4" fill="#7af6ff" />
        <circle className="mm5-buster" cx="64" cy="49" r="6" fill="#7af6ff" />
      </svg>
    </div>
  );
}
