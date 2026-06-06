import './megaman.css';

/**
 * Mega Man 3 — classic stage built around the game's signature slide move.
 * A cool blue / steel-grey industrial backdrop with a layered pipe wall,
 * a low slide tunnel (the short-ceiling gap MM3 was famous for), motion
 * dashes trailing behind the hero as he slides along the floor, and a
 * yellow accent on the stage trim. Rush the robot dog watches from a ledge.
 *
 * Namespace: `.mm3-`
 */
export function MegaMan3Scene() {
  return (
    <div className="mm3-scene" aria-hidden="true">
      {/* Steel pipe wall in the background */}
      <svg className="mm3-pipes" viewBox="0 0 1200 360" preserveAspectRatio="none">
        <rect width="1200" height="360" fill="#243a5e" />
        <g fill="#33507e">
          <rect x="60" y="0" width="40" height="360" />
          <rect x="220" y="0" width="40" height="360" />
          <rect x="380" y="0" width="40" height="360" />
          <rect x="540" y="0" width="40" height="360" />
          <rect x="700" y="0" width="40" height="360" />
          <rect x="860" y="0" width="40" height="360" />
          <rect x="1020" y="0" width="40" height="360" />
        </g>
        {/* highlight edge on each pipe */}
        <g fill="#4f74ad">
          <rect x="62" y="0" width="6" height="360" />
          <rect x="222" y="0" width="6" height="360" />
          <rect x="382" y="0" width="6" height="360" />
          <rect x="542" y="0" width="6" height="360" />
          <rect x="702" y="0" width="6" height="360" />
          <rect x="862" y="0" width="6" height="360" />
          <rect x="1022" y="0" width="6" height="360" />
        </g>
        {/* cross bracing */}
        <g stroke="#1a2c47" strokeWidth="5">
          <line x1="0" y1="120" x2="1200" y2="120" />
          <line x1="0" y1="240" x2="1200" y2="240" />
        </g>
      </svg>

      {/* Low slide tunnel — a steel ceiling block forcing a slide gap */}
      <svg className="mm3-ceiling" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <rect x="0" y="0" width="1200" height="90" fill="#5a6f8c" />
        <rect x="0" y="82" width="1200" height="8" fill="#ffd23a" />
        <g fill="#3e4f66">
          <rect x="40" y="20" width="14" height="14" />
          <rect x="180" y="20" width="14" height="14" />
          <rect x="320" y="20" width="14" height="14" />
          <rect x="460" y="20" width="14" height="14" />
          <rect x="600" y="20" width="14" height="14" />
          <rect x="740" y="20" width="14" height="14" />
          <rect x="880" y="20" width="14" height="14" />
          <rect x="1020" y="20" width="14" height="14" />
          <rect x="1160" y="20" width="14" height="14" />
        </g>
      </svg>

      {/* Stage floor */}
      <svg className="mm3-floor" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <rect x="0" y="20" width="1200" height="100" fill="#37506f" />
        <rect x="0" y="20" width="1200" height="8" fill="#ffd23a" />
        <g stroke="#243a5e" strokeWidth="3">
          <line x1="120" y1="28" x2="120" y2="120" />
          <line x1="320" y1="28" x2="320" y2="120" />
          <line x1="520" y1="28" x2="520" y2="120" />
          <line x1="720" y1="28" x2="720" y2="120" />
          <line x1="920" y1="28" x2="920" y2="120" />
          <line x1="1120" y1="28" x2="1120" y2="120" />
        </g>
      </svg>

      {/* Motion dashes trailing the slide */}
      <div className="mm3-dashes" />

      {/* Hero in a low slide crouch, dashing along the floor */}
      <svg className="mm3-hero" viewBox="0 0 90 60">
        <g fill="#1763c8">
          {/* low crouched torso */}
          <path d="M30 24 L62 24 L66 44 L26 44 Z" />
          {/* helmet leaning forward */}
          <path d="M58 18 Q72 12 80 24 L80 40 L58 40 Z" />
          {/* trailing leg extended back */}
          <rect x="20" y="38" width="22" height="9" rx="3" />
          {/* lead leg tucked */}
          <rect x="46" y="44" width="12" height="12" />
          {/* arm */}
          <rect x="68" y="28" width="14" height="8" rx="2" />
        </g>
        {/* face */}
        <rect x="64" y="22" width="10" height="8" fill="#9fd0ff" />
        <rect x="66" y="24" width="3" height="4" fill="#0b2a66" />
        {/* helmet gem */}
        <rect x="62" y="14" width="4" height="4" fill="#ffd23a" />
        {/* slide spark under the trailing foot */}
        <circle className="mm3-spark" cx="18" cy="46" r="5" fill="#ffe27a" />
      </svg>

      {/* Rush the robot-dog watching from a back ledge */}
      <svg className="mm3-rush" viewBox="0 0 80 60">
        <g fill="#d23a1a">
          {/* body */}
          <rect x="14" y="24" width="44" height="20" rx="4" />
          {/* head */}
          <rect x="48" y="14" width="22" height="20" rx="3" />
          {/* legs */}
          <rect x="18" y="44" width="8" height="12" />
          <rect x="46" y="44" width="8" height="12" />
          {/* tail */}
          <rect x="6" y="20" width="12" height="6" rx="2" transform="rotate(-30 12 22)" />
        </g>
        {/* ears + eye */}
        <rect x="50" y="8" width="6" height="8" fill="#d23a1a" />
        <rect x="62" y="8" width="6" height="8" fill="#d23a1a" />
        <circle cx="62" cy="22" r="3" fill="#ffffff" />
        <circle cx="63" cy="22" r="1.5" fill="#1a2c47" />
      </svg>
    </div>
  );
}
