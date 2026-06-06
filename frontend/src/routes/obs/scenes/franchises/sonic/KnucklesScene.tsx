import './sonic.css';

/**
 * Sonic & Knuckles — Mushroom Hill / Flying Battery Zone. Autumnal greens
 * over giant spore-capped mushrooms, a red echidna totem motif carved into
 * the cliff, drifting amber leaves, and a slowly turning Flying Battery rotor
 * silhouetted on the ridge.
 *
 * `.snk-` namespace.
 */
export function KnucklesScene() {
  return (
    <div className="snk-scene" aria-hidden="true">
      {/* Soft autumn haze over the canopy */}
      <div className="snk-haze" />

      {/* Far layered hills in mossy greens */}
      <svg className="snk-hills" viewBox="0 0 1200 280" preserveAspectRatio="none">
        <path
          d="M0 280 L0 160 Q160 110 340 150 Q540 196 720 130 Q900 72 1080 140 Q1150 166 1200 150 L1200 280 Z"
          fill="#3f7a2c"
        />
        <path
          d="M0 280 L0 200 Q220 156 420 188 Q640 224 860 168 Q1040 124 1200 178 L1200 280 Z"
          fill="#2f5e22"
        />
      </svg>

      {/* Flying Battery rotor turning slowly on the right ridge */}
      <svg className="snk-rotor" viewBox="0 0 160 160">
        <g className="snk-rotor-blades" fill="#5a6b52" stroke="#2f3a2a" strokeWidth="2">
          <rect x="74" y="6" width="12" height="68" rx="5" />
          <rect x="74" y="86" width="12" height="68" rx="5" />
          <rect x="6" y="74" width="68" height="12" rx="5" />
          <rect x="86" y="74" width="68" height="12" rx="5" />
        </g>
        <circle cx="80" cy="80" r="16" fill="#8a3b2c" stroke="#4a1f16" strokeWidth="3" />
        <circle cx="80" cy="80" r="6" fill="#d8c08a" />
      </svg>

      {/* Giant mushrooms — Mushroom Hill bounce pads */}
      <svg className="snk-mush snk-mush-1" viewBox="0 0 160 180">
        <rect x="66" y="80" width="28" height="92" rx="10" fill="#e8d8b0" />
        <path d="M10 84 Q80 -2 150 84 Q120 100 80 100 Q40 100 10 84 Z" fill="#b8412c" />
        <g fill="#f2e4c4">
          <circle cx="50" cy="58" r="9" />
          <circle cx="88" cy="46" r="11" />
          <circle cx="118" cy="64" r="8" />
        </g>
      </svg>
      <svg className="snk-mush snk-mush-2" viewBox="0 0 160 180">
        <rect x="66" y="80" width="28" height="92" rx="10" fill="#e8d8b0" />
        <path d="M10 84 Q80 -2 150 84 Q120 100 80 100 Q40 100 10 84 Z" fill="#c95a1e" />
        <g fill="#f2e4c4">
          <circle cx="46" cy="62" r="8" />
          <circle cx="84" cy="48" r="10" />
          <circle cx="120" cy="60" r="9" />
        </g>
      </svg>

      {/* Red echidna totem carved into a foreground cliff stone */}
      <svg className="snk-totem" viewBox="0 0 140 220">
        <rect x="24" y="40" width="92" height="170" rx="14" fill="#6b4a2e" />
        <rect x="24" y="40" width="92" height="170" rx="14" fill="none" stroke="#3f2a18" strokeWidth="4" />
        {/* echidna head glyph */}
        <g transform="translate(70 96)">
          <ellipse cx="0" cy="0" rx="30" ry="26" fill="#c0392b" />
          {/* swept-back dreadlock spines */}
          <path d="M-26 -10 L-52 -22 L-30 2 Z" fill="#b03124" />
          <path d="M-24 8 L-50 14 L-26 20 Z" fill="#b03124" />
          {/* white crescent chest mark */}
          <path d="M-16 6 Q0 22 16 6 Q0 14 -16 6 Z" fill="#f2efe6" />
          {/* eyes */}
          <ellipse cx="-9" cy="-4" rx="6" ry="9" fill="#f2efe6" />
          <ellipse cx="9" cy="-4" rx="6" ry="9" fill="#f2efe6" />
          <circle cx="-8" cy="-2" r="2.4" fill="#1a0a06" />
          <circle cx="10" cy="-2" r="2.4" fill="#1a0a06" />
        </g>
        {/* carved base runes */}
        <g stroke="#3f2a18" strokeWidth="3" strokeLinecap="round">
          <path d="M40 176 H100" />
          <path d="M40 190 H100" />
        </g>
      </svg>

      {/* Autumnal ground with leafy ridge */}
      <svg className="snk-ground" viewBox="0 0 1200 220" preserveAspectRatio="none">
        <rect x="0" y="50" width="1200" height="170" fill="#5a4326" />
        <path
          d="M0 70 L0 44 Q160 22 340 42 Q540 64 720 40 Q900 18 1080 46 Q1150 60 1200 48 L1200 70 Z"
          fill="#4a8a32"
        />
        <path
          d="M0 76 Q160 54 340 74 Q540 96 720 72 Q900 50 1080 78 Q1150 92 1200 80 L1200 86 L0 86 Z"
          fill="#356322"
        />
      </svg>

      {/* Drifting amber leaves */}
      <div className="snk-leaves" />
    </div>
  );
}
