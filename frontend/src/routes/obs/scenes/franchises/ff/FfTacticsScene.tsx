import './ff.css';

/**
 * Final Fantasy Tactics — the land of Ivalice rendered as an isometric
 * battlefield. Tiled diamond terrain steps up toward a medieval keep, war
 * banners flutter on the ridge, and a sepia dusk washes the whole scene in
 * aged parchment tones. `.fft-` namespace.
 */
export function FfTacticsScene() {
  return (
    <div className="fft-scene" aria-hidden="true">
      {/* Sepia dusk wash */}
      <div className="fft-dusk" />

      {/* Distant medieval keep on the ridge */}
      <svg className="fft-keep" viewBox="0 0 240 220">
        <g fill="rgba(96, 72, 44, 0.96)">
          <rect x="60" y="100" width="120" height="120" />
          <rect x="30" y="70" width="44" height="150" />
          <rect x="166" y="70" width="44" height="150" />
        </g>
        {/* conical roofs */}
        <g fill="rgba(120, 70, 50, 0.96)">
          <path d="M26 70 L78 70 L52 36 Z" />
          <path d="M162 70 L214 70 L188 36 Z" />
        </g>
        {/* gate */}
        <path d="M104 220 L104 150 Q120 130 136 150 L136 220 Z" fill="rgba(60, 44, 28, 0.98)" />
      </svg>

      {/* Fluttering war banners on the ridge */}
      <svg className="fft-banners" viewBox="0 0 400 160">
        <g>
          <rect x="60" y="30" width="5" height="130" fill="rgba(70, 50, 30, 0.98)" />
          <path className="fft-banner-wave" d="M65 36 L120 44 L112 70 L120 96 L65 104 Z" fill="rgba(150, 60, 50, 0.95)" />
          <rect x="300" y="40" width="5" height="120" fill="rgba(70, 50, 30, 0.98)" />
          <path className="fft-banner-wave fft-banner-wave-2" d="M305 46 L356 54 L348 78 L356 102 L305 110 Z" fill="rgba(90, 80, 130, 0.95)" />
        </g>
      </svg>

      {/* Isometric tiled battlefield — stacked diamond terrain */}
      <svg className="fft-grid" viewBox="0 0 1200 420" preserveAspectRatio="xMidYMax meet">
        {/* lower tier */}
        <g stroke="rgba(120, 96, 60, 0.7)" strokeWidth="2">
          <g fill="rgba(150, 120, 74, 0.9)">
            <path d="M200 360 L320 300 L440 360 L320 420 Z" />
            <path d="M440 360 L560 300 L680 360 L560 420 Z" />
            <path d="M680 360 L800 300 L920 360 L800 420 Z" />
            <path d="M920 360 L1040 300 L1160 360 L1040 420 Z" />
          </g>
          {/* tile side faces for depth */}
          <g fill="rgba(110, 86, 52, 0.9)" stroke="none">
            <path d="M320 420 L200 360 L200 392 L320 452 Z" />
            <path d="M560 420 L440 360 L440 392 L560 452 Z" />
            <path d="M800 420 L680 360 L680 392 L800 452 Z" />
            <path d="M1040 420 L920 360 L920 392 L1040 452 Z" />
          </g>
        </g>
        {/* raised tier toward the keep */}
        <g stroke="rgba(130, 104, 64, 0.7)" strokeWidth="2">
          <g fill="rgba(168, 136, 86, 0.92)">
            <path d="M380 270 L500 210 L620 270 L500 330 Z" />
            <path d="M620 270 L740 210 L860 270 L740 330 Z" />
          </g>
          <g className="fft-tile-glow" fill="rgba(220, 190, 120, 0.5)" stroke="none">
            <path d="M500 210 L620 270 L500 330 L380 270 Z" />
          </g>
        </g>
      </svg>

      {/* A lone unit silhouette standing on the highlighted tile */}
      <svg className="fft-unit" viewBox="0 0 30 60">
        <g fill="rgba(46, 34, 20, 1)">
          <ellipse cx="15" cy="14" rx="5" ry="6" />
          <path d="M10 12 L13 4 L20 6 L21 14 Z" />
          <path d="M11 20 L19 20 L19 42 L11 42 Z" />
          <rect x="20" y="6" width="2" height="36" />
          <rect x="11" y="42" width="3" height="14" />
          <rect x="16" y="42" width="3" height="14" />
        </g>
      </svg>

      {/* Drifting parchment dust */}
      <div className="fft-dust" />
    </div>
  );
}
