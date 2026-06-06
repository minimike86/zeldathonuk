import './megaman.css';

/**
 * Mega Man 9 — the deliberately retro 8-bit revival. A bright, bold NES stage:
 * a clean two-tone sky, blocky pixel-tile platforms stepping across the
 * screen, a row of chunky background bricks, scrolling spike-free ledges, a
 * big pixel cloud, a floating energy capsule, and the classic blue hero in a
 * crisp jumping pose. Saturated primary colours — sky blue, brick orange,
 * white highlights.
 *
 * Namespace: `.mm9-`
 */
export function MegaMan9Scene() {
  return (
    <div className="mm9-scene" aria-hidden="true">
      {/* Chunky pixel cloud drifting across the sky */}
      <svg className="mm9-cloud" viewBox="0 0 120 60">
        <g fill="#ffffff">
          <rect x="20" y="24" width="80" height="24" />
          <rect x="10" y="32" width="100" height="16" />
          <rect x="36" y="14" width="48" height="14" />
          <rect x="48" y="8" width="24" height="8" />
        </g>
        <g fill="#bfe4ff">
          <rect x="10" y="42" width="100" height="6" />
        </g>
      </svg>

      {/* Background brick wall band */}
      <svg className="mm9-bricks" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <rect width="1200" height="200" fill="#1b58b8" />
        <g stroke="#2f74dd" strokeWidth="3">
          <line x1="0" y1="40" x2="1200" y2="40" />
          <line x1="0" y1="80" x2="1200" y2="80" />
          <line x1="0" y1="120" x2="1200" y2="120" />
          <line x1="0" y1="160" x2="1200" y2="160" />
        </g>
        <g stroke="#2f74dd" strokeWidth="3">
          <line x1="80" y1="0" x2="80" y2="40" />
          <line x1="240" y1="40" x2="240" y2="80" />
          <line x1="400" y1="0" x2="400" y2="40" />
          <line x1="560" y1="40" x2="560" y2="80" />
          <line x1="720" y1="0" x2="720" y2="40" />
          <line x1="880" y1="40" x2="880" y2="80" />
          <line x1="1040" y1="0" x2="1040" y2="40" />
        </g>
      </svg>

      {/* Floating energy capsule pickup */}
      <svg className="mm9-capsule" viewBox="0 0 40 40">
        <rect x="6" y="6" width="28" height="28" fill="#ff3b3b" />
        <rect x="6" y="6" width="28" height="28" fill="none" stroke="#ffffff" strokeWidth="3" />
        <rect x="16" y="12" width="8" height="16" fill="#ffffff" />
        <rect x="12" y="16" width="16" height="8" fill="#ffffff" />
      </svg>

      {/* Stepped pixel platforms — bold orange tiles with white tops */}
      <svg className="mm9-tiles" viewBox="0 0 1200 360" preserveAspectRatio="none">
        <g>
          {/* lower full ground */}
          <rect x="0" y="300" width="1200" height="60" fill="#e07a1a" />
          <rect x="0" y="300" width="1200" height="8" fill="#ffd07a" />
          {/* floating blocks */}
          <rect x="120" y="220" width="120" height="60" fill="#e07a1a" />
          <rect x="120" y="220" width="120" height="8" fill="#ffd07a" />
          <rect x="360" y="160" width="120" height="120" fill="#e07a1a" />
          <rect x="360" y="160" width="120" height="8" fill="#ffd07a" />
          <rect x="760" y="200" width="120" height="80" fill="#e07a1a" />
          <rect x="760" y="200" width="120" height="8" fill="#ffd07a" />
          <rect x="980" y="140" width="120" height="140" fill="#e07a1a" />
          <rect x="980" y="140" width="120" height="8" fill="#ffd07a" />
        </g>
        {/* rivet pixels on the blocks */}
        <g fill="#b35a08">
          <rect x="132" y="240" width="8" height="8" />
          <rect x="220" y="240" width="8" height="8" />
          <rect x="372" y="184" width="8" height="8" />
          <rect x="460" y="184" width="8" height="8" />
          <rect x="772" y="224" width="8" height="8" />
          <rect x="860" y="224" width="8" height="8" />
          <rect x="992" y="164" width="8" height="8" />
          <rect x="1080" y="164" width="8" height="8" />
        </g>
      </svg>

      {/* Classic blue hero in a crisp jump pose */}
      <svg className="mm9-hero" viewBox="0 0 60 80">
        <g fill="#0b63d8">
          {/* torso */}
          <rect x="20" y="34" width="20" height="24" />
          {/* helmet */}
          <path d="M18 18 Q30 10 42 18 L42 34 L18 34 Z" />
          {/* legs in a leap */}
          <rect x="20" y="58" width="9" height="16" />
          <rect x="33" y="56" width="9" height="14" transform="rotate(12 37 60)" />
          {/* arm + buster */}
          <rect x="40" y="36" width="18" height="10" rx="2" />
        </g>
        {/* face skin */}
        <rect x="24" y="24" width="12" height="9" fill="#9fd0ff" />
        {/* eyes */}
        <rect x="26" y="26" width="3" height="5" fill="#0b2a66" />
        <rect x="31" y="26" width="3" height="5" fill="#0b2a66" />
        {/* helmet gem */}
        <rect x="28" y="14" width="4" height="4" fill="#ffd07a" />
        {/* buster muzzle */}
        <circle cx="58" cy="41" r="5" fill="#bfe4ff" />
      </svg>
    </div>
  );
}
