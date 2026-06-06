import './ff.css';

/**
 * Final Fantasy V — the four elemental crystals glowing in a windswept grove.
 * Faceted crystals pulse on their pedestals while wind carries leaves across a
 * green-and-gold dawn sky over rolling hills. `.ff5-` namespace.
 */
export function Ff5Scene() {
  return (
    <div className="ff5-scene" aria-hidden="true">
      {/* Warm dawn bloom */}
      <div className="ff5-dawn" />

      {/* Wind streaks sweeping across the sky */}
      <svg className="ff5-wind" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <g stroke="rgba(220, 240, 200, 0.18)" strokeWidth="2" fill="none" strokeLinecap="round">
          <path d="M40 60 Q200 50 360 64" />
          <path d="M120 110 Q320 98 520 112" />
          <path d="M500 50 Q700 42 900 56" />
          <path d="M700 130 Q900 120 1100 134" />
        </g>
      </svg>

      {/* Rolling hills */}
      <svg className="ff5-hills" viewBox="0 0 1200 260" preserveAspectRatio="none">
        <path d="M0 260 L0 160 Q200 110 420 150 Q640 190 860 140 Q1040 100 1200 150 L1200 260 Z"
              fill="rgba(34, 78, 46, 0.9)" />
        <path d="M0 260 L0 200 Q260 160 520 196 Q780 230 1040 188 Q1140 172 1200 192 L1200 260 Z"
              fill="rgba(26, 60, 36, 0.96)" />
      </svg>

      {/* The four elemental crystals on their pedestals */}
      <svg className="ff5-crystals" viewBox="0 0 600 280">
        {/* pedestals */}
        <g fill="rgba(40, 50, 38, 0.96)">
          <path d="M70 280 L150 280 L138 230 L82 230 Z" />
          <path d="M230 280 L310 280 L298 230 L242 230 Z" />
          <path d="M390 280 L470 280 L458 230 L402 230 Z" />
          <path d="M510 280 L590 280 L578 230 L522 230 Z" />
        </g>

        {/* Earth crystal (green) */}
        <g className="ff5-crystal ff5-crystal-1">
          <path d="M110 110 L138 180 L110 230 L82 180 Z" fill="#4fd16a" opacity="0.92" />
          <path d="M110 110 L138 180 L110 180 Z" fill="#a8f5b4" opacity="0.85" />
          <path d="M110 110 L82 180 L110 180 Z" fill="#2c9c44" opacity="0.9" />
        </g>
        {/* Wind crystal (gold) */}
        <g className="ff5-crystal ff5-crystal-2">
          <path d="M270 120 L298 180 L270 230 L242 180 Z" fill="#ffd24a" opacity="0.92" />
          <path d="M270 120 L298 180 L270 180 Z" fill="#fff0a8" opacity="0.85" />
          <path d="M270 120 L242 180 L270 180 Z" fill="#d89a1c" opacity="0.9" />
        </g>
        {/* Water crystal (teal) */}
        <g className="ff5-crystal ff5-crystal-3">
          <path d="M430 110 L458 180 L430 230 L402 180 Z" fill="#4fd9d1" opacity="0.92" />
          <path d="M430 110 L458 180 L430 180 Z" fill="#b4f7f2" opacity="0.85" />
          <path d="M430 110 L402 180 L430 180 Z" fill="#2c9c98" opacity="0.9" />
        </g>
        {/* Fire crystal (amber-red) */}
        <g className="ff5-crystal ff5-crystal-4">
          <path d="M550 120 L578 180 L550 230 L522 180 Z" fill="#ff9a4a" opacity="0.92" />
          <path d="M550 120 L578 180 L550 180 Z" fill="#ffd0a8" opacity="0.85" />
          <path d="M550 120 L522 180 L550 180 Z" fill="#d85a1c" opacity="0.9" />
        </g>
      </svg>

      {/* Foreground meadow */}
      <svg className="ff5-foreground" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0 120 L0 50 Q300 20 600 46 Q900 72 1200 44 L1200 120 Z"
              fill="rgba(16, 40, 22, 1)" />
        {/* grass tufts */}
        <g stroke="rgba(72, 140, 64, 0.9)" strokeWidth="2" strokeLinecap="round">
          <path d="M120 50 L122 36" />
          <path d="M128 52 L132 38" />
          <path d="M420 44 L422 30" />
          <path d="M428 46 L432 32" />
          <path d="M820 50 L822 36" />
          <path d="M828 52 L832 38" />
        </g>
      </svg>

      {/* Wind-blown leaves */}
      <div className="ff5-leaves" />
    </div>
  );
}
