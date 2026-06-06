import './ff.css';

/**
 * Final Fantasy XIII — the crystalline sci-fi divide of Cocoon and Pulse. A
 * cool white-and-blue palette: the great hanging sphere of Cocoon glows above
 * a glassy crystal-pillar landscape, slick fal'Cie machinery lines glint, and
 * crystal dust drifts through the air. `.ff13-` namespace.
 */
export function Ff13Scene() {
  return (
    <div className="ff13-scene" aria-hidden="true">
      {/* Cool overhead glow */}
      <div className="ff13-glow" />

      {/* Cocoon — vast suspended sphere high in the sky */}
      <svg className="ff13-cocoon" viewBox="0 0 360 360">
        <circle cx="180" cy="180" r="150" fill="rgba(180, 210, 250, 0.28)" />
        <circle cx="180" cy="180" r="150" fill="none" stroke="rgba(210, 235, 255, 0.6)" strokeWidth="3" />
        {/* interior continents / structural bands */}
        <g stroke="rgba(150, 195, 245, 0.45)" strokeWidth="2" fill="none">
          <ellipse cx="180" cy="180" rx="150" ry="56" />
          <ellipse cx="180" cy="180" rx="120" ry="120" />
          <path d="M60 150 Q180 110 300 150" />
          <path d="M70 220 Q180 260 290 220" />
        </g>
        {/* bright underside node */}
        <circle cx="180" cy="320" r="16" className="ff13-node" fill="#e8f4ff" />
      </svg>

      {/* Far crystal-pillar horizon (the Pulse pillar supporting Cocoon) */}
      <svg className="ff13-pillar" viewBox="0 0 160 400">
        <path d="M40 400 L40 120 L70 40 L90 40 L120 120 L120 400 Z" fill="rgba(120, 170, 230, 0.4)" />
        <path d="M70 40 L90 40 L120 120 L80 120 Z" fill="rgba(180, 215, 250, 0.55)" />
        <g stroke="rgba(210, 235, 255, 0.5)" strokeWidth="2">
          <path d="M80 60 L80 380" />
          <path d="M58 160 L102 160" />
          <path d="M52 260 L108 260" />
        </g>
      </svg>

      {/* Glassy crystallised ground with sharp facets */}
      <svg className="ff13-crystals" viewBox="0 0 1200 260" preserveAspectRatio="none">
        <g fill="rgba(70, 110, 175, 0.92)">
          <path d="M0 260 L0 180 L120 90 L240 170 L360 70 L480 160 L600 100 L720 170 L840 80 L960 160 L1080 110 L1200 170 L1200 260 Z" />
        </g>
        {/* faceted highlights */}
        <g fill="rgba(160, 200, 245, 0.5)">
          <path d="M120 90 L240 170 L180 170 Z" />
          <path d="M360 70 L480 160 L420 160 Z" />
          <path d="M840 80 L960 160 L900 160 Z" />
        </g>
      </svg>

      {/* fal'Cie circuitry glints traced across the foreground */}
      <svg className="ff13-circuit" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <g stroke="rgba(180, 220, 255, 0.55)" strokeWidth="2" fill="none">
          <path d="M0 80 L200 80 L240 40 L420 40" />
          <path d="M520 90 L700 90 L740 50 L920 50 L960 90 L1200 90" />
        </g>
        <g fill="#d8ecff" className="ff13-circuit-glint">
          <circle cx="240" cy="40" r="4" />
          <circle cx="740" cy="50" r="4" />
          <circle cx="960" cy="90" r="4" />
        </g>
      </svg>

      {/* Drifting crystal dust */}
      <div className="ff13-dust" />
    </div>
  );
}
