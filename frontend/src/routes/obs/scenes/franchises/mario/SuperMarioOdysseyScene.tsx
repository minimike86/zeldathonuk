import './mario.css';

/**
 * Super Mario Odyssey — New Donk City at dusk. A warm metropolitan skyline of
 * lit skyscrapers under a sunset gradient, the Odyssey airship's top-hat shape
 * suggested above, scattered lit windows, and Cappy (Mario's sentient hat)
 * tumbling through the air as the franchise motif. `.smo-` namespace.
 */
export function SuperMarioOdysseyScene() {
  return (
    <div className="smo-scene" aria-hidden="true">
      {/* Dusk sun haze low on the horizon */}
      <div className="smo-sun" />

      {/* Far skyline band */}
      <svg className="smo-skyline smo-skyline-far" viewBox="0 0 1200 260" preserveAspectRatio="none">
        <g fill="rgba(58, 40, 78, 0.92)">
          <rect x="40" y="120" width="80" height="140" />
          <rect x="150" y="80" width="64" height="180" />
          <rect x="250" y="150" width="90" height="110" />
          <rect x="380" y="60" width="56" height="200" />
          <rect x="470" y="130" width="80" height="130" />
          <rect x="590" y="100" width="70" height="160" />
          <rect x="700" y="160" width="96" height="100" />
          <rect x="830" y="70" width="58" height="190" />
          <rect x="930" y="140" width="84" height="120" />
          <rect x="1050" y="100" width="70" height="160" />
        </g>
      </svg>

      {/* Near skyscrapers with lit windows */}
      <svg className="smo-skyline smo-skyline-near" viewBox="0 0 1200 320" preserveAspectRatio="none">
        <g fill="rgba(30, 22, 44, 0.98)">
          <rect x="60" y="120" width="120" height="200" />
          <rect x="220" y="60" width="100" height="260" />
          <rect x="360" y="160" width="140" height="160" />
          <rect x="540" y="40" width="110" height="280" />
          <rect x="700" y="140" width="130" height="180" />
          <rect x="870" y="90" width="104" height="230" />
          <rect x="1010" y="150" width="150" height="170" />
        </g>
        {/* warm lit windows */}
        <g fill="#ffd27a" opacity="0.9">
          {[
            [80, 140], [120, 140], [80, 180], [120, 220], [80, 260],
            [240, 90], [280, 90], [240, 140], [280, 200], [240, 260],
            [400, 190], [450, 190], [400, 240], [450, 290],
            [560, 70], [600, 70], [560, 130], [600, 190], [560, 250],
            [730, 170], [780, 170], [730, 230], [780, 290],
            [900, 120], [940, 120], [900, 180], [940, 250],
            [1040, 180], [1090, 180], [1040, 250],
          ].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="16" height="22" />
          ))}
        </g>
      </svg>

      {/* Odyssey airship — a top-hat silhouette hovering above the city */}
      <svg className="smo-odyssey" viewBox="0 0 200 140">
        <ellipse cx="100" cy="118" rx="86" ry="16" fill="#d8534a" stroke="#9a2c22" strokeWidth="3" />
        <rect x="44" y="40" width="112" height="80" rx="14" fill="#e8645a" stroke="#9a2c22" strokeWidth="3" />
        <rect x="56" y="56" width="88" height="14" rx="6" fill="#2a3a6a" />
        <rect x="56" y="80" width="88" height="14" rx="6" fill="#2a3a6a" />
        {/* little globe / steering wheel on top */}
        <circle cx="100" cy="30" r="16" fill="#7af0ff" stroke="#2a9dc8" strokeWidth="3" />
        <path d="M100 30 L100 4 M84 30 L116 30" stroke="#2a9dc8" strokeWidth="2" />
      </svg>

      {/* Cappy tumbling through the air */}
      <svg className="smo-cappy" viewBox="0 0 100 90">
        {/* hat brim */}
        <ellipse cx="50" cy="64" rx="46" ry="14" fill="#e23b3b" stroke="#9a1c1c" strokeWidth="3" />
        {/* hat dome */}
        <path d="M14 64 Q14 18 50 18 Q86 18 86 64 Z" fill="#e23b3b" stroke="#9a1c1c" strokeWidth="3" />
        {/* white band */}
        <rect x="14" y="52" width="72" height="12" fill="#fff" />
        {/* M emblem circle */}
        <circle cx="50" cy="38" r="12" fill="#fff" />
        <path d="M44 44 L44 32 L50 38 L56 32 L56 44" fill="none" stroke="#e23b3b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* googly eyes */}
        <ellipse cx="38" cy="60" rx="6" ry="8" fill="#fff" stroke="#1a1a1a" strokeWidth="1.5" />
        <ellipse cx="62" cy="60" rx="6" ry="8" fill="#fff" stroke="#1a1a1a" strokeWidth="1.5" />
        <circle cx="38" cy="62" r="2.5" fill="#1a1a1a" /><circle cx="62" cy="62" r="2.5" fill="#1a1a1a" />
      </svg>
    </div>
  );
}
