import './megaman.css';

/**
 * Mega Man 8 — the PS1-era painterly intro stage. A soft cyan dusk over a
 * watery cityscape: layered translucent skyline bands receding into haze, a
 * shimmering reflective water plane in the foreground catching light, a comet
 * / energy streak crossing the sky (the falling-meteor opening), and the
 * sleeker hero silhouette gliding in. Airy cyan / aqua gradients.
 *
 * Namespace: `.mm8-`
 */
export function MegaMan8Scene() {
  return (
    <div className="mm8-scene" aria-hidden="true">
      {/* Soft glow on the horizon */}
      <div className="mm8-haze" />

      {/* Falling meteor / energy streak (the MM8 intro) */}
      <div className="mm8-comet" />

      {/* Layered translucent skyline bands receding into haze */}
      <svg className="mm8-skyline mm8-skyline-far" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <g fill="rgba(80, 160, 200, 0.45)">
          <rect x="60" y="90" width="80" height="110" />
          <rect x="200" y="60" width="60" height="140" />
          <rect x="330" y="100" width="100" height="100" />
          <rect x="500" y="50" width="70" height="150" />
          <rect x="640" y="110" width="90" height="90" />
          <rect x="800" y="70" width="64" height="130" />
          <rect x="930" y="100" width="100" height="100" />
          <rect x="1080" y="60" width="80" height="140" />
        </g>
      </svg>
      <svg className="mm8-skyline mm8-skyline-near" viewBox="0 0 1200 220" preserveAspectRatio="none">
        <g fill="rgba(30, 90, 130, 0.85)">
          <rect x="0" y="120" width="120" height="100" />
          <rect x="120" y="80" width="90" height="140" />
          <rect x="260" y="130" width="110" height="90" />
          <rect x="420" y="70" width="80" height="150" />
          <rect x="540" y="120" width="120" height="100" />
          <rect x="700" y="60" width="90" height="160" />
          <rect x="840" y="120" width="110" height="100" />
          <rect x="1000" y="80" width="100" height="140" />
        </g>
        {/* warm window glints */}
        <g className="mm8-windows" fill="#bff0ff">
          <rect x="150" y="110" width="8" height="10" />
          <rect x="170" y="110" width="8" height="10" />
          <rect x="450" y="100" width="8" height="10" />
          <rect x="730" y="90" width="8" height="10" />
          <rect x="1030" y="110" width="8" height="10" />
        </g>
      </svg>

      {/* Shimmering reflective water plane */}
      <svg className="mm8-water" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <rect width="1200" height="200" fill="rgba(20, 120, 170, 0.65)" />
        <g className="mm8-ripple" stroke="rgba(180, 240, 255, 0.6)" strokeWidth="3">
          <line x1="0" y1="40" x2="1200" y2="40" />
          <line x1="0" y1="90" x2="1200" y2="90" />
          <line x1="0" y1="140" x2="1200" y2="140" />
          <line x1="0" y1="180" x2="1200" y2="180" />
        </g>
      </svg>

      {/* Sleeker hero silhouette gliding in */}
      <svg className="mm8-hero" viewBox="0 0 90 80">
        <g fill="#0c4f78">
          {/* dynamic leaning torso */}
          <path d="M34 28 L60 24 L64 50 L32 54 Z" />
          {/* helmet */}
          <path d="M30 14 Q44 4 58 14 L58 30 L30 30 Z" />
          {/* trailing legs */}
          <rect x="30" y="50" width="11" height="24" transform="rotate(-10 35 60)" />
          <rect x="46" y="50" width="11" height="22" transform="rotate(8 51 60)" />
          {/* buster arm forward */}
          <rect x="58" y="26" width="24" height="12" rx="3" />
        </g>
        <rect x="34" y="18" width="12" height="9" fill="#9fe0ff" />
        <rect x="36" y="20" width="3" height="5" fill="#06324d" />
        <rect x="41" y="20" width="3" height="5" fill="#06324d" />
        <circle cx="36" cy="22" r="2.5" fill="#2fe0ff" />
        <circle cx="50" cy="22" r="2.5" fill="#2fe0ff" />
        <circle className="mm8-buster" cx="82" cy="32" r="8" fill="#bff0ff" />
      </svg>
    </div>
  );
}
