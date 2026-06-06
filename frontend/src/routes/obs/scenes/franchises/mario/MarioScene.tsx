import './mario.css';

/**
 * Mario (generic fallback) — used for any Mario-family entry that isn't a more
 * specific title (Paper Mario, Luigi's Mansion, etc). A cheerful blue field
 * with a big red-capped "M" emblem pulsing centre-stage, spinning gold coins,
 * floating ? blocks and brick blocks, on a tidy course-ground strip.
 * `.mario-` namespace.
 */
export function MarioScene() {
  return (
    <div className="mario-scene" aria-hidden="true">
      {/* Drifting clouds */}
      <svg className="mario-cloud mario-cloud-a" viewBox="0 0 120 50">
        <g fill="#ffffff">
          <ellipse cx="30" cy="32" rx="18" ry="14" />
          <ellipse cx="54" cy="26" rx="22" ry="18" />
          <ellipse cx="80" cy="26" rx="22" ry="18" />
          <ellipse cx="100" cy="32" rx="18" ry="14" />
        </g>
      </svg>
      <svg className="mario-cloud mario-cloud-b" viewBox="0 0 120 50">
        <g fill="#ffffff">
          <ellipse cx="30" cy="32" rx="18" ry="14" />
          <ellipse cx="54" cy="26" rx="22" ry="18" />
          <ellipse cx="80" cy="26" rx="22" ry="18" />
          <ellipse cx="100" cy="32" rx="18" ry="14" />
        </g>
      </svg>

      {/* Central red-cap "M" emblem */}
      <svg className="mario-emblem" viewBox="0 0 120 120">
        {/* white ring */}
        <circle cx="60" cy="60" r="54" fill="#e23b3b" stroke="#ffffff" strokeWidth="6" />
        <circle cx="60" cy="60" r="54" fill="none" stroke="#9a1c1c" strokeWidth="2" />
        {/* M */}
        <path
          d="M30 86 L30 34 L46 34 L60 60 L74 34 L90 34 L90 86 L76 86 L76 56 L62 80 L58 80 L44 56 L44 86 Z"
          fill="#ffffff"
        />
      </svg>
      <div className="mario-emblem-glow" />

      {/* Spinning gold coins */}
      <svg className="mario-coin mario-coin-a" viewBox="0 0 24 32">
        <ellipse cx="12" cy="16" rx="8" ry="14" fill="#ffd23a" stroke="#c89a14" strokeWidth="2" />
        <rect x="10" y="6" width="4" height="20" fill="#ffe890" />
      </svg>
      <svg className="mario-coin mario-coin-b" viewBox="0 0 24 32">
        <ellipse cx="12" cy="16" rx="8" ry="14" fill="#ffd23a" stroke="#c89a14" strokeWidth="2" />
        <rect x="10" y="6" width="4" height="20" fill="#ffe890" />
      </svg>
      <svg className="mario-coin mario-coin-c" viewBox="0 0 24 32">
        <ellipse cx="12" cy="16" rx="8" ry="14" fill="#ffd23a" stroke="#c89a14" strokeWidth="2" />
        <rect x="10" y="6" width="4" height="20" fill="#ffe890" />
      </svg>

      {/* Floating ? block */}
      <svg className="mario-block mario-block-q" viewBox="0 0 44 44">
        <rect x="2" y="2" width="40" height="40" rx="3" fill="#f6a82a" stroke="#b06e10" strokeWidth="2" />
        <g fill="#6e3e08"><circle cx="6" cy="6" r="2" /><circle cx="38" cy="6" r="2" /><circle cx="6" cy="38" r="2" /><circle cx="38" cy="38" r="2" /></g>
        <text x="22" y="34" fontSize="28" fontWeight="700" textAnchor="middle" fill="#fff">?</text>
      </svg>
      {/* Floating brick block */}
      <svg className="mario-block mario-block-brick" viewBox="0 0 44 44">
        <rect x="2" y="2" width="40" height="40" fill="#c8702a" stroke="#8a4a16" strokeWidth="2" />
        <g stroke="#8a4a16" strokeWidth="2"><path d="M2 22 L42 22" /><path d="M22 2 L22 22" /><path d="M12 22 L12 42" /><path d="M32 22 L32 42" /></g>
      </svg>

      {/* Course-ground strip */}
      <svg className="mario-ground" viewBox="0 0 1200 80" preserveAspectRatio="none">
        <rect x="0" y="0" width="1200" height="80" fill="#c8702a" />
        <g stroke="#8a4a16" strokeWidth="3">
          <path d="M0 26 L1200 26" />
          <path d="M0 52 L1200 52" />
          <path d="M30 0 L30 26 M90 26 L90 52 M150 0 L150 26 M210 26 L210 52 M270 0 L270 26 M330 26 L330 52 M390 0 L390 26 M450 26 L450 52 M510 0 L510 26 M570 26 L570 52 M630 0 L630 26 M690 26 L690 52 M750 0 L750 26 M810 26 L810 52 M870 0 L870 26 M930 26 L930 52 M990 0 L990 26 M1050 26 L1050 52 M1110 0 L1110 26 M1170 26 L1170 52" />
        </g>
      </svg>
    </div>
  );
}
