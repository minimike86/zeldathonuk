import './misc.css';

/**
 * Metal Gear — Shadow Moses at night. A cold blue snowfield under falling snow,
 * codec-green scanlines overlaying everything, a sneaking silhouette crouched
 * along a wall, and a red "!" alert glint pulsing above it. `.mgs-` namespace.
 */
export function MetalGearScene() {
  return (
    <div className="mgs-scene" aria-hidden="true">
      {/* Falling snow */}
      <div className="mgs-snow" />

      {/* Distant facility silhouette / mountains */}
      <svg className="mgs-ridge" viewBox="0 0 1200 220" preserveAspectRatio="none">
        <path
          d="M0 220 L0 150 L140 90 L260 140 L380 70 L520 130 L640 80 L780 140 L920 90 L1060 130 L1200 90 L1200 220 Z"
          fill="rgba(18, 30, 46, 0.95)"
        />
      </svg>

      {/* Facility blocks + comms tower */}
      <svg className="mgs-facility" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <g fill="rgba(12, 22, 36, 0.97)">
          <rect x="120" y="80" width="160" height="120" />
          <rect x="300" y="110" width="120" height="90" />
          <rect x="820" y="90" width="200" height="110" />
        </g>
        {/* lit windows */}
        <g fill="#7dd6a8" opacity="0.7">
          <rect x="140" y="100" width="10" height="14" />
          <rect x="170" y="100" width="10" height="14" />
          <rect x="850" y="110" width="10" height="14" />
          <rect x="890" y="110" width="10" height="14" />
        </g>
      </svg>

      {/* Snowfield foreground */}
      <svg className="mgs-snowfield" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 120 Q300 90 600 120 Q900 150 1200 110 L1200 200 Z" fill="#cfe3f2" />
        <path d="M0 200 L0 150 Q300 130 600 155 Q900 178 1200 145 L1200 200 Z" fill="#aecbe2" opacity="0.85" />
      </svg>

      {/* Low concrete wall the soldier hugs */}
      <svg className="mgs-wall" viewBox="0 0 1200 80" preserveAspectRatio="none">
        <rect x="0" y="20" width="1200" height="60" fill="rgba(40, 54, 70, 0.97)" />
        <g stroke="rgba(20, 30, 44, 0.9)" strokeWidth="2">
          <line x1="200" y1="20" x2="200" y2="80" />
          <line x1="500" y1="20" x2="500" y2="80" />
          <line x1="800" y1="20" x2="800" y2="80" />
        </g>
        <rect x="0" y="20" width="1200" height="5" fill="#dcebf7" opacity="0.5" />
      </svg>

      {/* Sneaking silhouette — crouched soldier with bandana */}
      <svg className="mgs-sneaker" viewBox="0 0 90 90">
        <g fill="rgba(8, 14, 22, 0.98)">
          {/* crouched back / torso */}
          <path d="M14 64 Q24 44 50 46 L66 52 L62 66 L20 70 Z" />
          {/* head + bandana tail */}
          <ellipse cx="58" cy="38" rx="11" ry="10" />
          <path d="M68 34 L84 30 L82 38 L68 40 Z" />
          {/* raised arm holding sidearm */}
          <rect x="62" y="46" width="20" height="5" rx="2" transform="rotate(-6 62 46)" />
          {/* bent legs */}
          <path d="M20 68 L18 86 L28 86 L32 70 Z" />
          <path d="M44 66 L52 84 L62 82 L52 64 Z" />
        </g>
        {/* exclamation alert glint above */}
        <g className="mgs-alert">
          <rect x="40" y="2" width="6" height="14" rx="2" fill="#ff2a2a" />
          <circle cx="43" cy="22" r="3.4" fill="#ff2a2a" />
        </g>
      </svg>

      {/* Codec-green scanlines overlay */}
      <div className="mgs-scanlines" />
      {/* Cold vignette */}
      <div className="mgs-vignette" />
    </div>
  );
}
