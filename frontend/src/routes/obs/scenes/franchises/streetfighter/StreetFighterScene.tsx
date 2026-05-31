import './streetfighter.css';

/**
 * Street Fighter — Ryu's Suzaku Castle stage at sunset. A multi-tiered pagoda
 * sits on the right cliff, a waterfall pours on the left, the sun sinks behind
 * a distant ridge, cherry blossoms drift, and Ryu stands centre-stage in his
 * fighting stance charging a Hadouken. Orange/violet sky. Covers SF II / Super
 * SF II. `.sf-` namespace.
 */
export function StreetFighterScene() {
  return (
    <div className="sf-scene" aria-hidden="true">
      {/* Setting sun */}
      <div className="sf-sun" />

      {/* Distant ridge */}
      <svg className="sf-ridge" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 130 Q160 90 340 120 Q520 150 700 100 Q880 60 1060 110 Q1140 130 1200 116 L1200 200 Z"
          fill="rgba(120, 50, 70, 0.7)" />
        <path d="M0 200 L0 160 Q200 140 420 156 Q640 172 860 150 Q1040 132 1200 152 L1200 200 Z"
          fill="rgba(80, 32, 56, 0.85)" />
      </svg>

      {/* Pagoda on the right cliff */}
      <svg className="sf-pagoda" viewBox="0 0 300 320">
        {/* base platform / cliff */}
        <path d="M20 320 L20 250 L280 250 L280 320 Z" fill="rgba(40, 18, 30, 0.95)" />
        {/* body — bottom storey */}
        <rect x="70" y="180" width="160" height="72" fill="rgba(74, 26, 30, 0.98)" />
        {/* lower roof */}
        <path d="M40 184 L260 184 L210 150 L90 150 Z" fill="rgba(30, 14, 20, 0.98)" />
        <path d="M40 184 Q150 196 260 184 L256 176 Q150 188 44 176 Z" fill="rgba(20, 10, 16, 0.99)" />
        {/* middle storey */}
        <rect x="92" y="112" width="116" height="44" fill="rgba(74, 26, 30, 0.98)" />
        {/* middle roof */}
        <path d="M66 116 L234 116 L196 86 L104 86 Z" fill="rgba(30, 14, 20, 0.98)" />
        <path d="M66 116 Q150 126 234 116 L230 109 Q150 119 70 109 Z" fill="rgba(20, 10, 16, 0.99)" />
        {/* top storey */}
        <rect x="116" y="56" width="68" height="36" fill="rgba(74, 26, 30, 0.98)" />
        {/* top roof */}
        <path d="M94 60 L206 60 L172 30 L128 30 Z" fill="rgba(30, 14, 20, 0.98)" />
        <path d="M94 60 Q150 70 206 60 L202 53 Q150 63 98 53 Z" fill="rgba(20, 10, 16, 0.99)" />
        {/* finial */}
        <rect x="146" y="14" width="8" height="18" fill="rgba(20, 10, 16, 0.99)" />
        <circle cx="150" cy="12" r="5" fill="#ffd24a" opacity="0.85" />
        {/* glowing lanterns */}
        <g fill="#ffb347" opacity="0.9">
          <rect x="104" y="200" width="14" height="22" rx="3" />
          <rect x="182" y="200" width="14" height="22" rx="3" />
          <rect x="140" y="124" width="12" height="20" rx="3" />
        </g>
        {/* eave details */}
        <g stroke="rgba(255, 170, 80, 0.5)" strokeWidth="2">
          <line x1="86" y1="180" x2="214" y2="180" />
          <line x1="100" y1="112" x2="200" y2="112" />
        </g>
      </svg>

      {/* Waterfall on the left */}
      <svg className="sf-waterfall" viewBox="0 0 180 360" preserveAspectRatio="none">
        {/* rock channel */}
        <path d="M0 0 L60 0 L70 360 L0 360 Z" fill="rgba(28, 14, 22, 0.9)" />
        <path d="M140 0 L180 0 L180 360 L130 360 Z" fill="rgba(28, 14, 22, 0.9)" />
        {/* falling water streaks */}
        <g fill="#cde9ff" opacity="0.7">
          <rect className="sf-waterfall-streak" x="68" y="0" width="14" height="360" rx="6" />
          <rect className="sf-waterfall-streak sf-waterfall-streak-2" x="88" y="0" width="18" height="360" rx="8" />
          <rect className="sf-waterfall-streak sf-waterfall-streak-3" x="112" y="0" width="14" height="360" rx="6" />
        </g>
        {/* mist pool at the base */}
        <ellipse cx="96" cy="350" rx="60" ry="16" fill="rgba(220, 240, 255, 0.45)" />
      </svg>

      {/* Arena floor */}
      <svg className="sf-floor" viewBox="0 0 1200 160" preserveAspectRatio="none">
        <path d="M0 160 L0 40 Q300 24 600 34 Q900 44 1200 28 L1200 160 Z" fill="rgba(24, 10, 18, 1)" />
        <g stroke="rgba(255, 140, 70, 0.18)" strokeWidth="2">
          <line x1="0" y1="80" x2="1200" y2="64" />
          <line x1="0" y1="120" x2="1200" y2="108" />
        </g>
      </svg>

      {/* Ryu in fighting stance */}
      <svg className="sf-fighter" viewBox="0 0 100 160">
        <g fill="rgba(10, 4, 12, 1)">
          {/* rear leg planted */}
          <path d="M58 96 L78 150 L88 148 L66 92 Z" />
          {/* front leg bent */}
          <path d="M48 96 L40 130 L30 150 L40 152 L52 124 L56 100 Z" />
          {/* gi / torso */}
          <path d="M40 56 L66 56 Q72 78 64 100 L42 100 Q34 78 40 56 Z" />
          {/* belt */}
        </g>
        <rect x="40" y="92" width="26" height="6" fill="rgba(40, 30, 60, 1)" />
        <g fill="rgba(10, 4, 12, 1)">
          {/* lead arm extended forward (low), ready for hadouken */}
          <path d="M40 70 L18 84 L20 92 L42 80 Z" />
          {/* rear arm cocked */}
          <path d="M64 68 L80 76 L78 84 L62 78 Z" />
          {/* head + headband tails */}
          <ellipse cx="53" cy="46" rx="9" ry="10" />
          <path d="M44 44 L30 40 L32 46 L45 49 Z" />
        </g>
        {/* red headband */}
        <rect x="44" y="40" width="18" height="4" fill="#c9202a" />
        <path d="M44 42 L28 38 L30 44 L45 47 Z" fill="#c9202a" />
      </svg>

      {/* Hadouken energy charging */}
      <div className="sf-hadouken" />

      {/* Drifting cherry blossoms */}
      <div className="sf-petals" />
    </div>
  );
}
