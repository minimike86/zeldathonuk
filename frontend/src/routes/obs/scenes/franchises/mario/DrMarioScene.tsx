import './mario.css';

/**
 * Dr. Mario — the falling-capsule puzzler. A dark bottle-grid playfield with
 * red/blue/yellow viruses wobbling at the bottom, a two-tone vitamin capsule
 * tumbling down from the top, and a couple of stray capsules settled in the
 * pile. `.drm-` namespace.
 */
export function DrMarioScene() {
  const COLS = ['#e23b3b', '#3a7adf', '#ffd23a'];

  return (
    <div className="drm-scene" aria-hidden="true">
      {/* The bottle / playfield grid */}
      <svg className="drm-grid" viewBox="0 0 1200 600" preserveAspectRatio="none">
        <rect x="0" y="0" width="1200" height="600" fill="rgba(10, 14, 40, 0.4)" />
        <g stroke="rgba(122, 150, 255, 0.18)" strokeWidth="2">
          {Array.from({ length: 15 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 86} y1="0" x2={i * 86} y2="600" />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 86} x2="1200" y2={i * 86} />
          ))}
        </g>
      </svg>

      {/* Falling capsule tumbling down */}
      <svg className="drm-capsule drm-capsule-fall" viewBox="0 0 60 120">
        <path d="M2 30 A28 28 0 0 1 58 30 L58 60 L2 60 Z" fill="#e23b3b" stroke="#9a1c1c" strokeWidth="3" />
        <path d="M2 60 L58 60 L58 90 A28 28 0 0 1 2 90 Z" fill="#3a7adf" stroke="#1a4aa0" strokeWidth="3" />
        <ellipse cx="20" cy="22" rx="8" ry="5" fill="rgba(255,255,255,0.4)" />
      </svg>

      {/* Settled capsules in the pile */}
      <svg className="drm-capsule drm-capsule-set-a" viewBox="0 0 120 60">
        <path d="M30 2 A28 28 0 0 0 30 58 L60 58 L60 2 Z" fill="#ffd23a" stroke="#c89a14" strokeWidth="3" />
        <path d="M60 2 L60 58 L90 58 A28 28 0 0 0 90 2 Z" fill="#e23b3b" stroke="#9a1c1c" strokeWidth="3" />
      </svg>
      <svg className="drm-capsule drm-capsule-set-b" viewBox="0 0 120 60">
        <path d="M30 2 A28 28 0 0 0 30 58 L60 58 L60 2 Z" fill="#3a7adf" stroke="#1a4aa0" strokeWidth="3" />
        <path d="M60 2 L60 58 L90 58 A28 28 0 0 0 90 2 Z" fill="#3a7adf" stroke="#1a4aa0" strokeWidth="3" />
      </svg>

      {/* Wobbling viruses */}
      {COLS.map((col, i) => (
        <svg
          key={i}
          className={`drm-virus drm-virus-${['a', 'b', 'c'][i]}`}
          viewBox="0 0 80 80"
        >
          <circle cx="40" cy="42" r="26" fill={col} stroke="rgba(0,0,0,0.35)" strokeWidth="3" />
          {/* spiky arms */}
          <g fill={col} stroke="rgba(0,0,0,0.35)" strokeWidth="2">
            <path d="M14 30 L2 22 L10 38 Z" />
            <path d="M66 30 L78 22 L70 38 Z" />
            <path d="M40 16 L34 2 L48 4 Z" />
          </g>
          {/* angry eyes */}
          <circle cx="31" cy="38" r="6" fill="#fff" /><circle cx="49" cy="38" r="6" fill="#fff" />
          <circle cx="32" cy="40" r="3" fill="#1a1a1a" /><circle cx="48" cy="40" r="3" fill="#1a1a1a" />
          <path d="M24 30 L36 34 M56 30 L44 34" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
          {/* grin */}
          <path d="M30 54 Q40 62 50 54" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      ))}
    </div>
  );
}
