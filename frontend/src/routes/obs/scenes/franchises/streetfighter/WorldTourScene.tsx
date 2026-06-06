import './streetfighter.css';

/**
 * Super Street Fighter II — world-tour airport runway backdrop at midday. A
 * bright arcade-blue sky over a city skyline, a control tower, a jumbo jet
 * banking across the sky leaving a contrail, a windsock and runway lights, a
 * fighter throwing an uppercut on the apron, and a globe-style destination
 * marker nodding to the game's international roster. `.sst-` namespace.
 */
export function WorldTourScene() {
  return (
    <div className="sst-scene" aria-hidden="true">
      {/* Drifting cloud bands */}
      <div className="sst-clouds" />

      {/* Distant blue city skyline */}
      <svg className="sst-skyline" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <g fill="rgba(60, 110, 180, 0.7)">
          <rect x="40" y="90" width="80" height="110" />
          <rect x="140" y="50" width="56" height="150" />
          <rect x="220" y="110" width="100" height="90" />
          <rect x="340" y="70" width="60" height="130" />
          <rect x="430" y="100" width="110" height="100" />
          <rect x="780" y="80" width="64" height="120" />
          <rect x="860" y="110" width="120" height="90" />
          <rect x="1000" y="60" width="70" height="140" />
          <rect x="1090" y="120" width="90" height="80" />
        </g>
      </svg>

      {/* Jumbo jet banking across the sky with a contrail */}
      <svg className="sst-jet" viewBox="0 0 220 100">
        {/* contrail */}
        <path d="M10 70 Q90 60 196 36" fill="none" stroke="rgba(255, 255, 255, 0.55)"
          strokeWidth="6" strokeLinecap="round" />
        {/* fuselage */}
        <path d="M150 30 Q200 28 214 36 Q200 44 150 42 L120 40 Z" fill="rgba(240, 246, 255, 1)"
          stroke="rgba(40, 70, 120, 0.8)" strokeWidth="2" />
        {/* wing */}
        <path d="M168 38 L150 70 L172 44 Z" fill="rgba(200, 220, 245, 1)" />
        {/* tail fin */}
        <path d="M150 36 L138 14 L156 32 Z" fill="rgba(40, 110, 200, 1)" />
        {/* windows */}
        <g fill="rgba(60, 100, 160, 0.9)">
          <rect x="160" y="35" width="4" height="3" />
          <rect x="170" y="35" width="4" height="3" />
          <rect x="180" y="35" width="4" height="3" />
        </g>
      </svg>

      {/* Control tower on the right */}
      <svg className="sst-tower" viewBox="0 0 120 260">
        {/* shaft */}
        <path d="M48 260 L48 80 L72 80 L72 260 Z" fill="rgba(225, 232, 240, 1)"
          stroke="rgba(60, 90, 140, 0.6)" strokeWidth="2" />
        {/* cab */}
        <path d="M30 80 L90 80 L80 44 L40 44 Z" fill="rgba(56, 120, 200, 1)"
          stroke="rgba(30, 60, 110, 0.8)" strokeWidth="2" />
        {/* glass */}
        <rect x="40" y="50" width="40" height="20" fill="rgba(150, 210, 255, 0.9)" />
        {/* roof + beacon */}
        <path d="M34 44 L86 44 L60 24 Z" fill="rgba(40, 80, 150, 1)" />
        <circle className="sst-beacon" cx="60" cy="20" r="5" fill="#ffd23a" />
      </svg>

      {/* Runway apron */}
      <svg className="sst-runway" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 60 Q600 36 1200 60 L1200 200 Z" fill="rgba(54, 60, 74, 1)" />
        {/* centre dashes */}
        <g stroke="rgba(255, 220, 120, 0.7)" strokeWidth="6" strokeLinecap="round">
          <line x1="120" y1="150" x2="220" y2="148" />
          <line x1="340" y1="150" x2="440" y2="148" />
          <line x1="560" y1="150" x2="660" y2="148" />
          <line x1="780" y1="150" x2="880" y2="148" />
          <line x1="1000" y1="150" x2="1100" y2="148" />
        </g>
        {/* edge lights */}
        <g className="sst-runway-lights" fill="#7fd0ff">
          <circle cx="80" cy="100" r="4" />
          <circle cx="300" cy="96" r="4" />
          <circle cx="520" cy="94" r="4" />
          <circle cx="740" cy="94" r="4" />
          <circle cx="960" cy="96" r="4" />
          <circle cx="1140" cy="100" r="4" />
        </g>
      </svg>

      {/* Windsock on a pole, left */}
      <svg className="sst-windsock" viewBox="0 0 120 200">
        <line x1="20" y1="200" x2="20" y2="40" stroke="rgba(220, 228, 238, 1)" strokeWidth="6" />
        <path className="sst-sock" d="M20 32 L96 28 L104 44 L86 48 L96 60 L78 62 L88 76 L20 64 Z"
          fill="rgba(255, 140, 60, 0.92)" stroke="rgba(180, 80, 30, 0.7)" strokeWidth="1.5" />
      </svg>

      {/* Globe destination marker nodding to the world roster */}
      <svg className="sst-globe" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="30" fill="rgba(40, 110, 200, 1)"
          stroke="rgba(255, 255, 255, 0.7)" strokeWidth="2" />
        <g fill="rgba(120, 210, 140, 0.9)">
          <path d="M22 30 Q34 24 38 34 Q30 40 22 38 Z" />
          <path d="M46 44 Q58 40 60 50 Q50 54 44 50 Z" />
        </g>
        <g stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" fill="none">
          <ellipse cx="40" cy="40" rx="30" ry="12" />
          <line x1="10" y1="40" x2="70" y2="40" />
        </g>
      </svg>

      {/* Fighter throwing a rising uppercut on the apron */}
      <svg className="sst-fighter" viewBox="0 0 100 160">
        <g fill="rgba(16, 22, 40, 1)">
          {/* legs in a forward lunge */}
          <path d="M40 96 L20 150 L30 152 L50 102 Z" />
          <path d="M56 96 L72 150 L62 152 L48 104 Z" />
          {/* torso twisting upward */}
          <path d="M40 54 L64 50 Q74 74 62 98 L42 100 Q32 76 40 54 Z" />
          {/* rising uppercut arm */}
          <path d="M58 56 L74 22 L84 26 L68 60 Z" />
          {/* rear arm low */}
          <path d="M42 64 L24 72 L26 80 L44 74 Z" />
          {/* head */}
          <ellipse cx="50" cy="44" rx="9" ry="10" />
        </g>
        {/* uppercut motion arc */}
        <path className="sst-uppercut" d="M70 60 Q92 30 80 6" fill="none"
          stroke="rgba(150, 210, 255, 0.9)" strokeWidth="5" strokeLinecap="round" />
        {/* blue belt accent */}
        <rect x="40" y="94" width="24" height="6" fill="rgba(80, 160, 230, 1)" />
      </svg>
    </div>
  );
}
