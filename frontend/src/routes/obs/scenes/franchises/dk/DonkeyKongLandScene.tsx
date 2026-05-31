import './dk.css';

/**
 * Donkey Kong Land — the Game Boy DKC port, rendered in the classic DMG
 * monochrome-green palette. A flat jungle with layered silhouette canopy,
 * a hanging vine, stacked DK barrels, a swaying palm and DK's tie emblem
 * on a sign, all dithered greens under faux LCD scanlines. `.dkl-` namespace.
 */
export function DonkeyKongLandScene() {
  return (
    <div className="dkl-scene" aria-hidden="true">
      {/* Pale DMG sun */}
      <svg className="dkl-sun" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="28" fill="#8bac0f" stroke="#0f380f" strokeWidth="3" />
      </svg>

      {/* Far canopy silhouette */}
      <svg className="dkl-canopy" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <g fill="#306230" stroke="#0f380f" strokeWidth="3">
          <ellipse cx="120" cy="160" rx="150" ry="110" />
          <ellipse cx="380" cy="140" rx="170" ry="120" />
          <ellipse cx="640" cy="170" rx="160" ry="110" />
          <ellipse cx="900" cy="140" rx="170" ry="120" />
          <ellipse cx="1140" cy="165" rx="160" ry="110" />
        </g>
        {/* dither dots on the canopy */}
        <g fill="#8bac0f" opacity="0.6">
          {Array.from({ length: 40 }).map((_, i) => (
            <rect key={i} x={(i * 61) % 1200} y={40 + ((i * 37) % 120)} width="6" height="6" />
          ))}
        </g>
      </svg>

      {/* Hanging vine with a tyre */}
      <svg className="dkl-vine" viewBox="0 0 80 240">
        <path d="M40 0 Q34 80 40 140" stroke="#0f380f" strokeWidth="6" fill="none" />
        <circle cx="40" cy="180" r="30" fill="none" stroke="#306230" strokeWidth="12" />
        <circle cx="40" cy="180" r="30" fill="none" stroke="#0f380f" strokeWidth="3" />
      </svg>

      {/* Swaying palm */}
      <svg className="dkl-palm" viewBox="0 0 120 180">
        <rect x="52" y="70" width="16" height="110" fill="#306230" stroke="#0f380f" strokeWidth="3" />
        <path d="M54 76 L54 170 M64 76 L64 170" stroke="#0f380f" strokeWidth="1.5" opacity="0.6" />
        <g fill="#306230" stroke="#0f380f" strokeWidth="3">
          <path d="M60 70 Q18 48 4 64 Q34 56 60 80 Z" />
          <path d="M60 70 Q102 48 116 64 Q86 56 60 80 Z" />
          <path d="M60 68 Q40 26 24 24 Q52 40 60 78 Z" />
          <path d="M60 68 Q80 26 96 24 Q68 40 60 78 Z" />
        </g>
      </svg>

      {/* Stacked DK barrels */}
      <svg className="dkl-barrels" viewBox="0 0 160 130">
        <g stroke="#0f380f" strokeWidth="3">
          <rect x="10" y="60" width="60" height="64" rx="10" fill="#306230" />
          <rect x="86" y="60" width="60" height="64" rx="10" fill="#306230" />
          <rect x="48" y="2" width="60" height="64" rx="10" fill="#306230" />
        </g>
        <g stroke="#8bac0f" strokeWidth="3" opacity="0.8">
          <path d="M14 80 L66 80 M14 104 L66 104 M90 80 L142 80 M90 104 L142 104 M52 22 L104 22 M52 46 L104 46" />
        </g>
        {/* DK initials on the top barrel */}
        <text x="78" y="40" fontSize="20" fontWeight="800" textAnchor="middle" fill="#0f380f">DK</text>
      </svg>

      {/* Ground line */}
      <svg className="dkl-ground" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <rect x="0" y="0" width="1200" height="120" fill="#306230" />
        <g stroke="#0f380f" strokeWidth="2" opacity="0.7">
          <path d="M0 40 L1200 40 M0 80 L1200 80" />
        </g>
        <g fill="#8bac0f" opacity="0.5">
          {Array.from({ length: 30 }).map((_, i) => (
            <rect key={i} x={(i * 79) % 1200} y={10 + ((i * 53) % 90)} width="6" height="6" />
          ))}
        </g>
      </svg>

      {/* Faux LCD scanlines */}
      <div className="dkl-lcd" />
    </div>
  );
}
