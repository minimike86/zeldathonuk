import './misc.css';

/**
 * Metal Gear Solid 2 — the Big Shell offshore rig at night in driving rain.
 * Cold steel struts and connecting bridges over dark sea, hexagonal strut
 * pods, sweeping rain, codec scanlines and a sweeping searchlight. `.mg2-`
 * namespace.
 */
export function MetalGearSolid2Scene() {
  return (
    <div className="mg2-scene" aria-hidden="true">
      {/* Driving rain */}
      <div className="mg2-rain" />

      {/* Sweeping searchlight */}
      <div className="mg2-searchlight" />

      {/* Dark sea horizon */}
      <svg className="mg2-sea" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 60 L1200 60 L1200 200 Z" fill="#0c2030" />
        {/* choppy swells */}
        <g stroke="#16384c" strokeWidth="3" fill="none" opacity="0.7">
          <path d="M0 110 Q60 100 120 110 T240 110 T360 110 T480 110 T600 110 T720 110 T840 110 T960 110 T1080 110 T1200 110" />
          <path d="M0 150 Q70 140 140 150 T280 150 T420 150 T560 150 T700 150 T840 150 T980 150 T1120 150 T1200 150" />
        </g>
      </svg>

      {/* The Big Shell — linked hexagonal strut pods on legs */}
      <svg className="mg2-rig" viewBox="0 0 1200 260" preserveAspectRatio="none">
        {/* connecting bridges */}
        <g fill="rgba(50, 66, 84, 0.97)">
          <rect x="120" y="110" width="960" height="14" />
        </g>
        {/* support legs into the sea */}
        <g stroke="rgba(36, 50, 66, 0.97)" strokeWidth="8">
          <line x1="220" y1="124" x2="210" y2="240" />
          <line x1="280" y1="124" x2="290" y2="240" />
          <line x1="600" y1="124" x2="590" y2="240" />
          <line x1="660" y1="124" x2="670" y2="240" />
          <line x1="940" y1="124" x2="930" y2="240" />
          <line x1="1000" y1="124" x2="1010" y2="240" />
        </g>
        {/* hexagonal strut pods */}
        <g fill="rgba(58, 76, 96, 0.98)" stroke="rgba(28, 40, 54, 1)" strokeWidth="3">
          <polygon points="180,60 250,60 285,110 250,160 180,160 145,110" />
          <polygon points="560,60 630,60 665,110 630,160 560,160 525,110" />
          <polygon points="900,60 970,60 1005,110 970,160 900,160 865,110" />
        </g>
        {/* lit windows on pods */}
        <g fill="#7dd6a8" opacity="0.75">
          <rect x="180" y="92" width="10" height="12" />
          <rect x="206" y="92" width="10" height="12" />
          <rect x="232" y="92" width="10" height="12" />
          <rect x="560" y="92" width="10" height="12" />
          <rect x="586" y="92" width="10" height="12" />
          <rect x="900" y="92" width="10" height="12" />
          <rect x="926" y="92" width="10" height="12" />
        </g>
        {/* warning beacons */}
        <g className="mg2-beacon" fill="#ff2a2a">
          <circle cx="215" cy="56" r="4" />
          <circle cx="595" cy="56" r="4" />
          <circle cx="935" cy="56" r="4" />
        </g>
      </svg>

      {/* Foreground railing the player crouches behind */}
      <svg className="mg2-rail" viewBox="0 0 1200 60" preserveAspectRatio="none">
        <rect x="0" y="6" width="1200" height="6" fill="rgba(70, 88, 108, 0.97)" />
        <rect x="0" y="30" width="1200" height="6" fill="rgba(54, 70, 88, 0.97)" />
        <g fill="rgba(50, 66, 84, 0.97)">
          <rect x="120" y="6" width="8" height="54" />
          <rect x="420" y="6" width="8" height="54" />
          <rect x="720" y="6" width="8" height="54" />
          <rect x="1020" y="6" width="8" height="54" />
        </g>
      </svg>

      {/* Codec-green scanlines */}
      <div className="mg2-scanlines" />
      {/* Cold vignette */}
      <div className="mg2-vignette" />
    </div>
  );
}
