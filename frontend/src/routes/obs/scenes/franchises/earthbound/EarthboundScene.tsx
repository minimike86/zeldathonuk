import './earthbound.css';

/**
 * EarthBound — the town of Onett at dusk. A row of cosy small-town houses sits
 * beneath leaning telephone poles strung with drooping wires, a big quirky sun
 * sinks behind a rolling hill, a few early stars twinkle, and a Mr. Saturn
 * waddles down the street with its signature bouncing bow-dot. Purple/teal
 * Americana palette. `.eb-` namespace.
 */
export function EarthboundScene() {
  return (
    <div className="eb-scene" aria-hidden="true">
      {/* Early stars */}
      <div className="eb-stars" />

      {/* Quirky dusk sun */}
      <div className="eb-sun" />

      {/* Rolling hill behind town */}
      <svg className="eb-hill" viewBox="0 0 1200 160" preserveAspectRatio="none">
        <path d="M0 160 L0 90 Q300 30 640 56 Q960 80 1200 44 L1200 160 Z" fill="rgba(58, 96, 86, 0.95)" />
        <path d="M0 160 L0 120 Q360 96 720 110 Q980 120 1200 100 L1200 160 Z" fill="rgba(40, 72, 66, 0.97)" />
      </svg>

      {/* Row of houses */}
      <svg className="eb-town" viewBox="0 0 1200 220" preserveAspectRatio="none">
        {/* house 1 — teal */}
        <rect x="60" y="110" width="180" height="110" fill="#2f7d74" />
        <path d="M44 110 L150 50 L256 110 Z" fill="#b5443a" />
        <rect x="100" y="140" width="36" height="36" fill="#ffd76a" />
        <rect x="170" y="140" width="36" height="36" fill="#ffd76a" />
        <rect x="130" y="180" width="40" height="40" fill="#3a2a4e" />

        {/* house 2 — mauve, taller */}
        <rect x="320" y="80" width="160" height="140" fill="#7a5c8e" />
        <path d="M306 80 L400 28 L494 80 Z" fill="#3a6e64" />
        <rect x="352" y="110" width="34" height="34" fill="#ffe08a" />
        <rect x="414" y="110" width="34" height="34" fill="#ffe08a" />
        <rect x="380" y="170" width="42" height="50" fill="#2a1f3a" />

        {/* house 3 — orange */}
        <rect x="560" y="120" width="170" height="100" fill="#c97a4a" />
        <path d="M544 120 L645 64 L746 120 Z" fill="#4a3a6e" />
        <rect x="596" y="146" width="34" height="34" fill="#fff0b0" />
        <rect x="660" y="146" width="34" height="34" fill="#fff0b0" />
        <rect x="628" y="184" width="38" height="36" fill="#2a1f3a" />

        {/* house 4 — drugstore-ish, flat top */}
        <rect x="800" y="96" width="180" height="124" fill="#566ea0" />
        <rect x="790" y="84" width="200" height="16" fill="#3a4a72" />
        <rect x="836" y="128" width="40" height="36" fill="#ffd76a" />
        <rect x="908" y="128" width="40" height="36" fill="#ffd76a" />
        <rect x="866" y="178" width="48" height="42" fill="#2a1f3a" />

        {/* house 5 — green cottage */}
        <rect x="1040" y="120" width="150" height="100" fill="#4e8a64" />
        <path d="M1026 120 L1115 68 L1204 120 Z" fill="#b5443a" />
        <rect x="1076" y="146" width="32" height="32" fill="#ffe08a" />
        <rect x="1132" y="146" width="32" height="32" fill="#ffe08a" />
      </svg>

      {/* Telephone poles + drooping wires */}
      <svg className="eb-poles" viewBox="0 0 1200 260" preserveAspectRatio="none">
        <g stroke="#2a1f2e" strokeWidth="6" fill="none">
          {/* pole 1 */}
          <line x1="160" y1="260" x2="166" y2="40" />
          <line x1="138" y1="64" x2="190" y2="58" />
          <line x1="142" y1="86" x2="186" y2="82" />
          {/* pole 2 */}
          <line x1="540" y1="260" x2="544" y2="30" />
          <line x1="518" y1="54" x2="570" y2="48" />
          <line x1="522" y1="76" x2="566" y2="72" />
          {/* pole 3 */}
          <line x1="940" y1="260" x2="936" y2="46" />
          <line x1="912" y1="70" x2="964" y2="64" />
          <line x1="916" y1="92" x2="960" y2="88" />
        </g>
        {/* drooping wires between poles */}
        <g stroke="#1c141f" strokeWidth="2" fill="none">
          <path d="M166 60 Q360 110 544 50" />
          <path d="M166 84 Q360 130 544 74" />
          <path d="M544 50 Q740 100 936 66" />
          <path d="M544 74 Q740 120 936 90" />
          <path d="M936 66 Q1080 96 1200 70" />
        </g>
      </svg>

      {/* Foreground street */}
      <svg className="eb-street" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0 120 L0 20 Q600 4 1200 24 L1200 120 Z" fill="#4a3a58" />
        {/* lane dashes */}
        <g fill="#ffe08a" opacity="0.8">
          <rect x="160" y="64" width="60" height="8" rx="4" />
          <rect x="380" y="68" width="60" height="8" rx="4" />
          <rect x="620" y="66" width="60" height="8" rx="4" />
          <rect x="860" y="68" width="60" height="8" rx="4" />
          <rect x="1080" y="64" width="60" height="8" rx="4" />
        </g>
      </svg>

      {/* Mr. Saturn waddling down the street */}
      <svg className="eb-saturn" viewBox="0 0 110 120">
        {/* bouncing bow-dot on a wiry stalk */}
        <g className="eb-saturn-bow">
          <line x1="55" y1="36" x2="55" y2="8" stroke="#2a1f2e" strokeWidth="2" />
          {/* the red bow */}
          <path d="M55 8 L42 0 L48 10 Z" fill="#d8323a" />
          <path d="M55 8 L68 0 L62 10 Z" fill="#d8323a" />
          <circle cx="55" cy="8" r="3.5" fill="#d8323a" />
        </g>
        {/* round cream body */}
        <ellipse cx="55" cy="74" rx="42" ry="38" fill="#f4ead2" stroke="#3a2a2e" strokeWidth="2.5" />
        {/* big nose */}
        <ellipse cx="55" cy="78" rx="7" ry="16" fill="#e8a37a" stroke="#3a2a2e" strokeWidth="2" />
        {/* dot eyes */}
        <circle cx="40" cy="66" r="4" fill="#2a1f2e" />
        <circle cx="70" cy="66" r="4" fill="#2a1f2e" />
        {/* little feet */}
        <ellipse cx="40" cy="112" rx="10" ry="6" fill="#3a2a2e" />
        <ellipse cx="70" cy="112" rx="10" ry="6" fill="#3a2a2e" />
        {/* whisker mouth */}
        <path d="M48 92 Q55 98 62 92" fill="none" stroke="#3a2a2e" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
