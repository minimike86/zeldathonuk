import './chrono.css';

/**
 * Chrono Cross — the El Nido archipelago at golden hour. A warm teal/gold
 * tropical sea shimmering under a low sun, lush palm islets receding into
 * haze, a sandy near-shore, and gentle swell sparkle across the water.
 *
 * `.crx-` namespace.
 */
export function ChronoCrossScene() {
  return (
    <div className="crx-scene" aria-hidden="true">
      {/* Low golden-hour sun with a long reflection */}
      <div className="crx-sun" />
      <div className="crx-sun-reflection" />

      {/* Soft warm haze over the horizon */}
      <div className="crx-haze" />

      {/* Distant island silhouettes receding into the gold haze */}
      <svg className="crx-islands-far" viewBox="0 0 1200 160" preserveAspectRatio="none">
        <g fill="rgba(40, 90, 90, 0.55)">
          <path d="M120 160 Q200 90 300 160 Z" />
          <path d="M520 160 Q620 70 740 160 Z" />
          <path d="M880 160 Q960 100 1060 160 Z" />
        </g>
      </svg>

      {/* A nearer palm islet on the right */}
      <svg className="crx-islet" viewBox="0 0 260 180">
        {/* island mass */}
        <path d="M10 170 Q40 120 120 116 Q210 112 250 150 L250 180 L10 180 Z" fill="#2f6b5a" />
        <path d="M10 170 Q40 120 120 116 Q210 112 250 150" fill="none" stroke="#3f8a72" strokeWidth="4" opacity="0.6" />
        {/* sandy fringe */}
        <path d="M10 170 Q40 150 120 148 Q210 146 250 162 L250 180 L10 180 Z" fill="#e6c98a" opacity="0.85" />
        {/* palms */}
        <g className="crx-palm">
          <path d="M150 120 Q146 84 156 54" fill="none" stroke="#6e4a2c" strokeWidth="7" strokeLinecap="round" />
          <g fill="#3f9a72">
            <ellipse cx="156" cy="50" rx="30" ry="9" transform="rotate(-20 156 50)" />
            <ellipse cx="156" cy="50" rx="30" ry="9" transform="rotate(20 156 50)" />
            <ellipse cx="156" cy="46" rx="26" ry="8" />
          </g>
        </g>
        <g className="crx-palm crx-palm-2">
          <path d="M200 124 Q204 92 196 64" fill="none" stroke="#6e4a2c" strokeWidth="6" strokeLinecap="round" />
          <g fill="#2f8a62">
            <ellipse cx="196" cy="60" rx="24" ry="8" transform="rotate(-18 196 60)" />
            <ellipse cx="196" cy="60" rx="24" ry="8" transform="rotate(18 196 60)" />
            <ellipse cx="196" cy="56" rx="20" ry="7" />
          </g>
        </g>
      </svg>

      {/* The shimmering sea — layered swell bands */}
      <svg className="crx-sea" viewBox="0 0 1200 280" preserveAspectRatio="none">
        <rect x="0" y="0" width="1200" height="280" fill="#1f8a86" />
        <path d="M0 60 Q300 40 600 60 Q900 80 1200 60 L1200 0 L0 0 Z" fill="#2fa6a0" opacity="0.7" />
        <path d="M0 150 Q300 128 600 150 Q900 172 1200 150 L1200 280 L0 280 Z" fill="#176f6c" opacity="0.8" />
        {/* gold glints riding the swell */}
        <g className="crx-glints" stroke="#ffe6a0" strokeWidth="3" strokeLinecap="round" opacity="0.8">
          <path d="M120 90 q14 -4 28 0" />
          <path d="M360 130 q14 -4 28 0" />
          <path d="M620 100 q14 -4 28 0" />
          <path d="M840 150 q14 -4 28 0" />
          <path d="M1020 110 q14 -4 28 0" />
          <path d="M240 180 q14 -4 28 0" />
          <path d="M540 200 q14 -4 28 0" />
          <path d="M900 210 q14 -4 28 0" />
        </g>
      </svg>

      {/* Sandy near-shore in the foreground */}
      <svg className="crx-shore" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0 120 L0 40 Q300 12 600 40 Q900 68 1200 36 L1200 120 Z" fill="#e6c98a" />
        {/* wet-sand wash line */}
        <path d="M0 44 Q300 16 600 44 Q900 72 1200 40" fill="none" stroke="#fff4d6" strokeWidth="4" opacity="0.7" />
        {/* foam dabs */}
        <g fill="#fff7e2" opacity="0.8">
          <ellipse cx="220" cy="42" rx="20" ry="4" />
          <ellipse cx="560" cy="50" rx="24" ry="4" />
          <ellipse cx="900" cy="46" rx="22" ry="4" />
        </g>
      </svg>

      {/* Slow water shimmer overlay */}
      <div className="crx-shimmer" />
    </div>
  );
}
