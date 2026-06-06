import './chrono.css';

/**
 * Chrono Trigger — the Epoch time machine soaring over the green fields of
 * 1000 A.D. at sunset. Banded amber sky, a distant ominous red glow where
 * Lavos sleeps beneath the earth, rolling hills, and the wing-finned Epoch
 * streaking across with its bubble cockpit and jet trail.
 *
 * `.ctr-` namespace.
 */
export function ChronoTriggerScene() {
  return (
    <div className="ctr-scene" aria-hidden="true">
      {/* Setting sun on the horizon */}
      <div className="ctr-sun" />

      {/* Distant Lavos glow welling up from the ground, off to one side */}
      <div className="ctr-lavos" />

      {/* Drifting sunset cloud bands */}
      <div className="ctr-clouds" />

      {/* Soft scattered stars in the upper dusk band */}
      <div className="ctr-stars" />

      {/* Far hill ridge of 1000 A.D. */}
      <svg className="ctr-hills-far" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0 200 L0 130 Q160 96 340 120 Q540 148 720 110 Q900 76 1080 116 Q1150 130 1200 120 L1200 200 Z"
          fill="#5a7a3a"
        />
      </svg>

      {/* Rolling green fields foreground */}
      <svg className="ctr-fields" viewBox="0 0 1200 220" preserveAspectRatio="none">
        <path
          d="M0 220 L0 120 Q200 70 420 110 Q640 150 860 100 Q1040 60 1200 104 L1200 220 Z"
          fill="#3f7a32"
        />
        <path
          d="M0 220 L0 160 Q240 116 480 150 Q740 188 980 144 Q1100 122 1200 150 L1200 220 Z"
          fill="#2f6326"
        />
        {/* hedgerow tufts */}
        <g fill="#264f1f">
          <ellipse cx="160" cy="150" rx="40" ry="16" />
          <ellipse cx="520" cy="140" rx="48" ry="18" />
          <ellipse cx="900" cy="150" rx="42" ry="16" />
        </g>
      </svg>

      {/* The Epoch — wing-finned time machine streaking past */}
      <svg className="ctr-epoch" viewBox="0 0 260 120">
        {/* jet/contrail behind */}
        <path className="ctr-trail" d="M30 70 Q-40 64 -120 72 Q-40 80 30 74 Z" fill="#9fe8ff" opacity="0.55" />

        {/* tail fins */}
        <path d="M50 56 L18 30 L40 58 Z" fill="#2a4a8e" />
        <path d="M50 84 L18 110 L40 82 Z" fill="#1f3a72" />

        {/* main fuselage */}
        <path
          d="M40 70 Q120 40 220 60 Q240 64 236 72 Q232 80 210 84 Q120 100 40 70 Z"
          fill="#3a5fb0"
          stroke="#1c2f66"
          strokeWidth="3"
        />
        {/* under-belly shadow */}
        <path d="M70 84 Q150 96 210 84 Q150 92 70 84 Z" fill="#1c2f66" opacity="0.6" />

        {/* swept delta wings */}
        <path d="M110 64 L150 20 L172 30 L150 66 Z" fill="#4a72c8" stroke="#1c2f66" strokeWidth="2" />
        <path d="M110 76 L150 116 L172 106 L150 74 Z" fill="#2a4a8e" stroke="#1c2f66" strokeWidth="2" />

        {/* glass bubble cockpit */}
        <ellipse cx="180" cy="62" rx="26" ry="18" fill="#7fd4ff" stroke="#1c2f66" strokeWidth="3" />
        <ellipse cx="172" cy="56" rx="10" ry="6" fill="#dffaff" opacity="0.85" />
        {/* gold nose tip */}
        <path d="M222 60 Q244 66 234 74 Q224 72 222 60 Z" fill="#ffd23a" stroke="#7a5800" strokeWidth="1.5" />

        {/* thruster glow */}
        <circle className="ctr-thruster" cx="38" cy="70" r="9" fill="#9fe8ff" />
      </svg>

      {/* A scattering of warp sparkles in the Epoch's wake */}
      <div className="ctr-sparkle" />
    </div>
  );
}
