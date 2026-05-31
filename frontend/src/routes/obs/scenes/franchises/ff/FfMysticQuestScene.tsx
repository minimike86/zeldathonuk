import './ff.css';

/**
 * Final Fantasy Mystic Quest (SNES) — bright, beginner-friendly fantasy. The
 * four elemental crystals (Earth, Water, Fire, Air) float around a central
 * spire under a vivid blue sky, each pulsing in its own colour. Cheerful,
 * saturated SNES palette. `.ffmq-` namespace.
 */
export function FfMysticQuestScene() {
  return (
    <div className="ffmq-scene" aria-hidden="true">
      {/* Bright sky bloom */}
      <div className="ffmq-sky" />

      {/* Rolling bright-green hills */}
      <svg className="ffmq-hills" viewBox="0 0 1200 220" preserveAspectRatio="none">
        <path d="M0 220 L0 120 Q200 70 420 110 Q640 150 860 100 Q1040 64 1200 110 L1200 220 Z"
              fill="rgba(84, 176, 96, 0.96)" />
        <path d="M0 220 L0 160 Q300 120 600 150 Q900 180 1200 150 L1200 220 Z"
              fill="rgba(60, 144, 78, 0.97)" />
      </svg>

      {/* Central focus tower / spire */}
      <svg className="ffmq-spire" viewBox="0 0 120 280">
        <path d="M40 280 L40 120 L52 60 L60 40 L68 60 L80 120 L80 280 Z" fill="rgba(150, 140, 170, 0.96)" />
        <path d="M60 40 L68 60 L60 120 Z" fill="rgba(190, 180, 210, 0.95)" />
        <circle cx="60" cy="36" r="8" className="ffmq-spire-tip" fill="#fff4c0" />
      </svg>

      {/* The four elemental crystals orbiting the spire */}
      <svg className="ffmq-crystals" viewBox="0 0 600 360">
        {/* Earth — green */}
        <g className="ffmq-crystal ffmq-earth">
          <path d="M120 120 L150 60 L180 120 L150 200 Z" fill="rgba(110, 200, 110, 0.92)" />
          <path d="M150 60 L180 120 L150 120 Z" fill="rgba(170, 240, 160, 0.9)" />
        </g>
        {/* Water — blue */}
        <g className="ffmq-crystal ffmq-water">
          <path d="M420 120 L450 60 L480 120 L450 200 Z" fill="rgba(90, 160, 240, 0.92)" />
          <path d="M450 60 L480 120 L450 120 Z" fill="rgba(160, 210, 255, 0.9)" />
        </g>
        {/* Fire — red/orange */}
        <g className="ffmq-crystal ffmq-fire">
          <path d="M120 280 L150 220 L180 280 L150 360 Z" fill="rgba(240, 110, 70, 0.92)" />
          <path d="M150 220 L180 280 L150 280 Z" fill="rgba(255, 180, 120, 0.9)" />
        </g>
        {/* Air — pale cyan */}
        <g className="ffmq-crystal ffmq-air">
          <path d="M420 280 L450 220 L480 280 L450 360 Z" fill="rgba(150, 220, 230, 0.92)" />
          <path d="M450 220 L480 280 L450 280 Z" fill="rgba(210, 245, 250, 0.9)" />
        </g>
      </svg>

      {/* Foreground flowery meadow */}
      <svg className="ffmq-meadow" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0 120 L0 50 Q300 30 600 46 Q900 60 1200 40 L1200 120 Z" fill="rgba(48, 120, 64, 1)" />
        <g>
          <circle cx="160" cy="70" r="6" fill="rgba(255, 220, 120, 0.9)" />
          <circle cx="420" cy="78" r="6" fill="rgba(255, 150, 190, 0.9)" />
          <circle cx="720" cy="68" r="6" fill="rgba(255, 220, 120, 0.9)" />
          <circle cx="1000" cy="76" r="6" fill="rgba(180, 160, 255, 0.9)" />
        </g>
      </svg>

      {/* Cheerful sparkles */}
      <div className="ffmq-sparkles" />
    </div>
  );
}
