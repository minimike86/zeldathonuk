import './dk.css';

/**
 * Donkey Kong Country 3: Dixie Kong's Double Trouble — the cool alpine
 * Northern Kremisphere. Snow-capped pine mountains reflected in a still
 * glacial lake, a wooden jetty, drifting reflections, a pale sun behind
 * thin cloud, and a lone Kremling watchtower silhouette on the far shore.
 * Cool blues and pine greens.
 *
 * Namespace: `.dkc3-`
 */
export function DonkeyKongCountry3Scene() {
  return (
    <div className="dkc3-scene" aria-hidden="true">
      {/* Pale alpine sun behind thin haze */}
      <div className="dkc3-sun" />

      {/* Far snow-capped mountains */}
      <svg className="dkc3-mountains" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <path d="M0 240 L120 110 L240 180 L380 70 L520 170 L660 90 L820 180 L960 100 L1120 170 L1200 130 L1200 240 Z" fill="#3a5a78" />
        {/* snow caps */}
        <g fill="#dceaf4">
          <path d="M380 70 L356 110 L404 110 Z" />
          <path d="M660 90 L640 124 L680 124 Z" />
          <path d="M960 100 L940 132 L980 132 Z" />
        </g>
      </svg>

      {/* Mid pine ridge */}
      <svg className="dkc3-pines" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 120 Q150 100 300 118 Q450 134 600 112 Q750 92 900 116 Q1050 136 1200 110 L1200 200 Z" fill="#1f4838" />
        {/* pine trees along the ridge */}
        <g fill="#163a2c">
          <path d="M120 120 L100 120 L110 80 Z" />
          <path d="M118 100 L102 100 L110 70 Z" />
          <path d="M300 118 L280 118 L290 78 Z" />
          <path d="M540 116 L520 116 L530 76 Z" />
          <path d="M780 110 L760 110 L770 70 Z" />
          <path d="M1000 116 L980 116 L990 76 Z" />
        </g>
      </svg>

      {/* Distant Kremling watchtower on the far shore */}
      <svg className="dkc3-tower" viewBox="0 0 80 160">
        <rect x="30" y="40" width="20" height="120" fill="#13302a" />
        <path d="M22 44 L58 44 L50 24 L30 24 Z" fill="#0e2620" />
        <path d="M26 24 L54 24 L40 6 Z" fill="#0e2620" />
        <rect x="36" y="60" width="8" height="14" fill="#7ad6b0" opacity="0.7" />
      </svg>

      {/* Still glacial lake with reflections */}
      <svg className="dkc3-lake" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <rect width="1200" height="240" fill="#234e6c" />
        {/* mirrored mountain reflection (faded, flipped) */}
        <path d="M0 0 L120 130 L240 60 L380 170 L520 70 L660 150 L820 60 L960 140 L1120 70 L1200 110 L1200 0 Z" fill="#2c5a7a" opacity="0.5" />
        {/* horizontal reflection ripples */}
        <g stroke="#3f7396" strokeWidth="2.5" opacity="0.55">
          <line x1="120" y1="60" x2="380" y2="60" />
          <line x1="520" y1="100" x2="820" y2="100" />
          <line x1="200" y1="150" x2="560" y2="150" />
          <line x1="720" y1="180" x2="1080" y2="180" />
        </g>
      </svg>

      {/* Wooden jetty in the foreground */}
      <svg className="dkc3-jetty" viewBox="0 0 360 120">
        <g fill="#5a3e22">
          <rect x="0" y="40" width="300" height="16" />
          <rect x="20" y="56" width="10" height="60" />
          <rect x="120" y="56" width="10" height="60" />
          <rect x="230" y="56" width="10" height="60" />
        </g>
        <g fill="#6e4e2c">
          <rect x="0" y="40" width="300" height="4" />
        </g>
        {/* mooring post */}
        <rect x="288" y="20" width="14" height="40" fill="#3e2a16" />
      </svg>

      {/* Drifting cool mist over the lake */}
      <div className="dkc3-mist" />
    </div>
  );
}
