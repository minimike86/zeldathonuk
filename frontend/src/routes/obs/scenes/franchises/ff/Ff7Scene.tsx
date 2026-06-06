import './ff.css';

/**
 * Final Fantasy VII — the Midgar industrial skyline at night. Stacked steel
 * silhouettes, smokestacks venting steam, and a Mako reactor pulsing a sickly
 * green glow over the sprawl, with the plate suspended above the slums on its
 * great support pillars. `.ff7-` namespace.
 */
export function Ff7Scene() {
  return (
    <div className="ff7-scene" aria-hidden="true">
      {/* Mako-green haze pooling over the city */}
      <div className="ff7-haze" />

      {/* Far industrial skyline */}
      <svg className="ff7-skyline-far" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <path
          d="M0 240 L0 160 L60 160 L60 120 L120 120 L120 150 L200 150 L200 100 L260 100
             L260 140 L340 140 L340 90 L420 90 L420 130 L520 130 L520 110 L600 110
             L600 150 L700 150 L700 120 L800 120 L800 160 L900 160 L900 130 L1000 130
             L1000 150 L1100 150 L1100 120 L1200 120 L1200 240 Z"
          fill="rgba(20, 32, 30, 0.95)"
        />
      </svg>

      {/* The great support pillar holding the plate aloft */}
      <svg className="ff7-pillar" viewBox="0 0 160 360">
        <path d="M40 360 L120 360 L96 120 L64 120 Z" fill="rgba(18, 28, 28, 0.98)" />
        {/* cross-bracing */}
        <g stroke="rgba(40, 56, 52, 0.95)" strokeWidth="4">
          <path d="M64 180 L96 220" />
          <path d="M96 180 L64 220" />
          <path d="M58 260 L102 300" />
          <path d="M102 260 L58 300" />
        </g>
        {/* a few lit windows */}
        <g fill="#9fffa8" opacity="0.7">
          <rect x="70" y="150" width="6" height="8" />
          <rect x="86" y="150" width="6" height="8" />
          <rect x="74" y="240" width="6" height="8" />
        </g>
      </svg>

      {/* Mid steel buildings */}
      <svg className="ff7-skyline-mid" viewBox="0 0 1200 280" preserveAspectRatio="none">
        <path
          d="M0 280 L0 180 L90 180 L90 90 L170 90 L170 140 L260 140 L260 70 L350 70
             L350 130 L460 130 L460 60 L560 60 L560 120 L680 120 L680 90 L780 90
             L780 150 L900 150 L900 100 L1020 100 L1020 160 L1120 160 L1120 110 L1200 110 L1200 280 Z"
          fill="rgba(14, 22, 22, 0.98)"
        />
        {/* scattered lit windows */}
        <g fill="#cfe8d0" opacity="0.55">
          <rect x="40" y="200" width="6" height="9" />
          <rect x="120" y="110" width="6" height="9" />
          <rect x="300" y="100" width="6" height="9" />
          <rect x="500" y="90" width="6" height="9" />
          <rect x="720" y="120" width="6" height="9" />
          <rect x="950" y="130" width="6" height="9" />
          <rect x="1060" y="190" width="6" height="9" />
        </g>
      </svg>

      {/* The Mako reactor — bulb dome venting green energy */}
      <svg className="ff7-reactor" viewBox="0 0 220 200">
        {/* support legs */}
        <g fill="rgba(16, 24, 24, 0.99)">
          <path d="M48 200 L66 120 L80 120 L72 200 Z" />
          <path d="M172 200 L154 120 L140 120 L148 200 Z" />
        </g>
        {/* reactor sphere */}
        <circle cx="110" cy="100" r="56" fill="rgba(26, 44, 40, 0.99)" />
        <circle cx="110" cy="100" r="56" fill="none" stroke="rgba(50, 80, 70, 0.9)" strokeWidth="3" />
        {/* glowing core */}
        <circle cx="110" cy="100" r="26" className="ff7-core" fill="#7bff8a" />
        <circle cx="110" cy="100" r="14" fill="#d8ffd6" />
        {/* containment rings */}
        <ellipse cx="110" cy="100" rx="56" ry="18" fill="none" stroke="rgba(60, 100, 84, 0.8)" strokeWidth="2" />
        {/* vent pipes top */}
        <rect x="84" y="40" width="10" height="24" fill="rgba(20, 32, 30, 0.99)" />
        <rect x="126" y="40" width="10" height="24" fill="rgba(20, 32, 30, 0.99)" />
      </svg>

      {/* Smokestacks venting drifting steam */}
      <svg className="ff7-stacks" viewBox="0 0 300 260" preserveAspectRatio="none">
        <g fill="rgba(12, 20, 20, 0.99)">
          <rect x="40" y="120" width="28" height="140" />
          <rect x="120" y="80" width="32" height="180" />
          <rect x="210" y="140" width="26" height="120" />
        </g>
        <g className="ff7-steam" fill="rgba(140, 200, 170, 0.18)">
          <ellipse cx="54" cy="110" rx="22" ry="14" />
          <ellipse cx="136" cy="68" rx="26" ry="16" />
          <ellipse cx="223" cy="128" rx="20" ry="13" />
        </g>
      </svg>

      {/* Foreground slum rubble line */}
      <svg className="ff7-foreground" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0 120 L0 60 L120 70 L300 50 L520 72 L760 48 L980 70 L1200 56 L1200 120 Z"
              fill="rgba(6, 12, 12, 1)" />
      </svg>

      {/* Floating green Mako particles */}
      <div className="ff7-sparks" />
    </div>
  );
}
