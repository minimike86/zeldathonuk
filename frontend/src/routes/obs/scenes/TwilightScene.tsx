/**
 * Twilight Princess scene — twilight particles drifting upward, with a wolf
 * silhouette on a hill.
 */
export function TwilightScene() {
  return (
    <div className="tp-scene" aria-hidden="true">
      <div className="tp-twilight-glow" />
      <div className="tp-particles" />
      <svg className="tp-hill" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 200 Q300 100 600 110 Q900 120 1200 180 L1200 200 Z"
          fill="rgba(20, 8, 28, 0.97)"
        />
      </svg>
      <svg className="tp-wolf" viewBox="0 0 200 110">
        {/* Wolf silhouette */}
        <path
          d="M30 80 L40 60 L55 55 L60 40 L72 35 L80 50 L100 50 L120 55 L150 55 L170 65 L175 80 L160 90 L140 95 L100 95 L65 95 L45 95 L30 90 Z"
          fill="rgba(8, 4, 14, 1)"
        />
        {/* ears + tail */}
        <path d="M65 40 L60 25 L72 35 Z" fill="rgba(8,4,14,1)" />
        <path d="M170 65 L195 55 L185 75 Z" fill="rgba(8,4,14,1)" />
        {/* glowing eye */}
        <circle cx="78" cy="58" r="2.5" fill="#ffaa3a" />
      </svg>
    </div>
  );
}
