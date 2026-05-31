import './misc.css';

/**
 * Star Fox 64 — the Corneria city run at dusk. An Arwing skims low over a
 * receding grid of polygon skyscrapers, twin lasers lancing ahead, a dusky
 * orange/indigo sky and a glowing horizon. `.sf6-` namespace.
 */
export function StarFox64Scene() {
  return (
    <div className="sf6-scene" aria-hidden="true">
      {/* Dusk sun on the horizon */}
      <div className="sf6-sun" />

      {/* Distant city skyline */}
      <svg className="sf6-skyline" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <g fill="#2a2f63">
          <rect x="40" y="80" width="70" height="120" />
          <rect x="140" y="50" width="60" height="150" />
          <rect x="230" y="100" width="80" height="100" />
          <rect x="900" y="70" width="70" height="130" />
          <rect x="1000" y="100" width="60" height="100" />
          <rect x="1090" y="50" width="80" height="150" />
        </g>
        <g fill="#7af0ff" opacity="0.6">
          <rect x="60" y="100" width="6" height="8" />
          <rect x="160" y="80" width="6" height="8" />
          <rect x="250" y="120" width="6" height="8" />
          <rect x="920" y="90" width="6" height="8" />
          <rect x="1110" y="80" width="6" height="8" />
        </g>
      </svg>

      {/* Receding polygon buildings — perspective grid run, both flanks */}
      <svg className="sf6-buildings sf6-buildings-left" viewBox="0 0 400 360" preserveAspectRatio="none">
        <g fill="#3a4fa0" stroke="#1c2a6a" strokeWidth="2">
          <path d="M40 360 L40 120 L130 90 L130 360 Z" />
          <path d="M150 360 L150 170 L210 150 L210 360 Z" />
          <path d="M230 360 L230 210 L280 198 L280 360 Z" />
          <path d="M300 360 L300 250 L340 242 L340 360 Z" />
        </g>
        <g fill="#5468c8" opacity="0.8">
          <path d="M130 90 L130 360 L160 360 L160 96 Z" />
          <path d="M210 150 L210 360 L232 360 L232 154 Z" />
        </g>
        {/* window grids */}
        <g fill="#9ff0ff" opacity="0.7">
          <rect x="60" y="150" width="8" height="10" />
          <rect x="60" y="180" width="8" height="10" />
          <rect x="90" y="150" width="8" height="10" />
          <rect x="90" y="180" width="8" height="10" />
        </g>
      </svg>
      <svg className="sf6-buildings sf6-buildings-right" viewBox="0 0 400 360" preserveAspectRatio="none">
        <g fill="#2f3f88" stroke="#1c2a6a" strokeWidth="2">
          <path d="M360 360 L360 120 L270 90 L270 360 Z" />
          <path d="M250 360 L250 170 L190 150 L190 360 Z" />
          <path d="M170 360 L170 210 L120 198 L120 360 Z" />
          <path d="M100 360 L100 250 L60 242 L60 360 Z" />
        </g>
        <g fill="#9ff0ff" opacity="0.7">
          <rect x="300" y="150" width="8" height="10" />
          <rect x="300" y="180" width="8" height="10" />
          <rect x="330" y="150" width="8" height="10" />
          <rect x="330" y="180" width="8" height="10" />
        </g>
      </svg>

      {/* Receding road grid down the centre */}
      <svg className="sf6-road" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <path d="M520 0 L680 0 L900 240 L300 240 Z" fill="#1a2150" />
        <g stroke="#4a5cae" strokeWidth="2">
          <line x1="600" y1="0" x2="600" y2="240" />
          <line x1="560" y1="40" x2="480" y2="240" />
          <line x1="640" y1="40" x2="720" y2="240" />
          <line x1="540" y1="100" x2="400" y2="240" />
          <line x1="660" y1="100" x2="800" y2="240" />
        </g>
      </svg>

      {/* Twin laser fire streaking ahead */}
      <div className="sf6-laser sf6-laser-1" />
      <div className="sf6-laser sf6-laser-2" />

      {/* Arwing skimming low, tail toward viewer */}
      <svg className="sf6-arwing" viewBox="0 0 220 120">
        <ellipse className="sf6-thrust" cx="110" cy="60" rx="30" ry="12" fill="#5fe0ff" opacity="0.7" />
        {/* wings */}
        <path d="M44 50 L96 56 L88 86 L34 92 Z" fill="#3a4fa0" />
        <path d="M176 50 L124 56 L132 86 L186 92 Z" fill="#2f3f88" />
        <path d="M34 92 L20 112 L44 96 Z" fill="#27306e" />
        <path d="M186 92 L200 112 L176 96 Z" fill="#20285c" />
        {/* fuselage */}
        <path d="M96 40 L124 40 L130 84 L110 96 L90 84 Z" fill="#6f86d8" />
        <path d="M96 40 L110 8 L124 40 Z" fill="#8aa0ec" />
        <path d="M104 36 L116 36 L113 54 L107 54 Z" fill="#9ff0ff" opacity="0.9" />
      </svg>
    </div>
  );
}
