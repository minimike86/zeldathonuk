import './misc.css';

/**
 * Star Fox — a low-poly Arwing banking over Corneria. Cyan/indigo space with a
 * drifting starfield, the curved planet horizon below, twin laser streaks
 * lancing toward the viewer, and the faceted Arwing rolling in the centre.
 * `.sfx-` namespace.
 */
export function StarFoxScene() {
  return (
    <div className="sfx-scene" aria-hidden="true">
      {/* Starfield */}
      <div className="sfx-stars" />

      {/* Curved Corneria horizon glowing below */}
      <svg className="sfx-planet" viewBox="0 0 1200 300" preserveAspectRatio="none">
        <path d="M0 300 L0 180 Q600 60 1200 180 L1200 300 Z" fill="#1c2f6e" />
        <path d="M0 300 L0 230 Q600 140 1200 230 L1200 300 Z" fill="#14245a" />
        {/* atmosphere rim */}
        <path d="M0 182 Q600 62 1200 182" fill="none" stroke="#5fe0ff" strokeWidth="4" opacity="0.7" />
        {/* city lights */}
        <g fill="#7af0ff" opacity="0.8">
          <circle cx="300" cy="210" r="2" />
          <circle cx="420" cy="200" r="2" />
          <circle cx="600" cy="190" r="2.4" />
          <circle cx="780" cy="200" r="2" />
          <circle cx="900" cy="212" r="2" />
        </g>
      </svg>

      {/* Twin laser streaks */}
      <div className="sfx-laser sfx-laser-1" />
      <div className="sfx-laser sfx-laser-2" />

      {/* Low-poly Arwing banking — faceted flat-shaded triangles */}
      <svg className="sfx-arwing" viewBox="0 0 220 140">
        {/* engine glow behind */}
        <ellipse className="sfx-thrust" cx="110" cy="98" rx="26" ry="10" fill="#5fe0ff" opacity="0.7" />

        {/* left wing */}
        <path d="M40 64 L96 70 L86 104 L30 110 Z" fill="#3a4fa0" />
        <path d="M40 64 L96 70 L70 76 Z" fill="#5468c8" />
        {/* left wingtip fin */}
        <path d="M30 110 L18 132 L40 116 Z" fill="#27306e" />

        {/* right wing */}
        <path d="M180 64 L124 70 L134 104 L190 110 Z" fill="#2f3f88" />
        <path d="M180 64 L124 70 L150 76 Z" fill="#46589f" />
        <path d="M190 110 L202 132 L180 116 Z" fill="#20285c" />

        {/* fuselage */}
        <path d="M96 50 L124 50 L130 96 L110 110 L90 96 Z" fill="#6f86d8" />
        <path d="M96 50 L110 110 L90 96 Z" fill="#5468c8" />
        <path d="M110 110 L130 96 L124 50 Z" fill="#3f53ad" />
        {/* nose */}
        <path d="M96 50 L110 16 L124 50 Z" fill="#8aa0ec" />
        <path d="M110 16 L124 50 L110 50 Z" fill="#6f86d8" />
        {/* cockpit canopy */}
        <path d="M104 46 L116 46 L113 64 L107 64 Z" fill="#9ff0ff" opacity="0.9" />
        {/* highlight glints */}
        <path d="M96 50 L110 16 L106 40 Z" fill="#c4d4ff" opacity="0.8" />
      </svg>
    </div>
  );
}
