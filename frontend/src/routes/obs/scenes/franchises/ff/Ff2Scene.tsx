import './ff.css';

/**
 * Final Fantasy II (NES) — the rebellion against the Empire. The dark imperial
 * fortress looms on the left beneath a brooding sky, a rebel banner stands
 * defiant on a green rise, and a chocobo forest of round trees lines the
 * horizon in classic 8-bit silhouette. `.ff2-` namespace.
 */
export function Ff2Scene() {
  return (
    <div className="ff2-scene" aria-hidden="true">
      {/* Dim moon over the warring land */}
      <div className="ff2-moon" />

      {/* Twinkling stars */}
      <div className="ff2-stars" />

      {/* The imperial fortress on the left, dark and angular */}
      <svg className="ff2-fortress" viewBox="0 0 280 300">
        <g fill="rgba(36, 30, 54, 0.98)">
          {/* keep block */}
          <rect x="60" y="120" width="160" height="180" />
          {/* flanking towers */}
          <rect x="30" y="90" width="50" height="210" />
          <rect x="200" y="90" width="50" height="210" />
          {/* central spire */}
          <rect x="120" y="50" width="40" height="80" />
        </g>
        {/* battlements */}
        <g fill="rgba(36, 30, 54, 0.98)">
          <rect x="30" y="78" width="14" height="16" />
          <rect x="56" y="78" width="14" height="16" />
          <rect x="210" y="78" width="14" height="16" />
          <rect x="236" y="78" width="14" height="16" />
        </g>
        {/* menacing red window glow */}
        <g fill="rgba(200, 60, 60, 0.85)" className="ff2-fortress-glow">
          <rect x="130" y="80" width="20" height="26" />
          <rect x="48" y="140" width="12" height="18" />
          <rect x="220" y="140" width="12" height="18" />
        </g>
      </svg>

      {/* Chocobo forest — rows of round-canopied trees */}
      <svg className="ff2-forest" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <g fill="rgba(36, 92, 56, 0.95)">
          <circle cx="520" cy="140" r="56" />
          <circle cx="600" cy="120" r="64" />
          <circle cx="690" cy="140" r="56" />
          <circle cx="780" cy="130" r="60" />
          <circle cx="880" cy="150" r="54" />
          <circle cx="980" cy="135" r="58" />
          <circle cx="1080" cy="148" r="52" />
        </g>
        {/* trunks */}
        <g fill="rgba(70, 48, 30, 0.95)">
          <rect x="592" y="160" width="16" height="40" />
          <rect x="772" y="168" width="16" height="34" />
          <rect x="972" y="170" width="16" height="32" />
        </g>
      </svg>

      {/* Green rebel rise in the foreground */}
      <svg className="ff2-ground" viewBox="0 0 1200 160" preserveAspectRatio="none">
        <path d="M0 160 L0 70 Q400 30 800 60 Q1000 76 1200 50 L1200 160 Z" fill="rgba(46, 104, 60, 0.98)" />
      </svg>

      {/* The defiant rebel banner on its pole */}
      <svg className="ff2-banner" viewBox="0 0 100 200">
        <rect x="46" y="20" width="6" height="180" fill="rgba(80, 56, 34, 0.98)" />
        <g className="ff2-banner-wave">
          <path d="M52 28 L96 36 L88 64 L96 92 L52 100 Z" fill="rgba(180, 60, 64, 0.97)" />
          {/* rebel emblem — a wild rose */}
          <circle cx="70" cy="62" r="9" fill="rgba(255, 220, 150, 0.9)" />
          <circle cx="70" cy="62" r="4" fill="rgba(180, 60, 64, 0.97)" />
        </g>
      </svg>

      {/* Drifting embers from the conflict */}
      <div className="ff2-embers" />
    </div>
  );
}
