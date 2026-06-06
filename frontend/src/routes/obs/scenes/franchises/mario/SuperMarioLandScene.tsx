import './mario.css';

/**
 * Super Mario Land — the original Game Boy outing in Sarasaland. Rendered in
 * the classic monochrome-green DMG palette: Birabuto pyramids on the horizon,
 * a sphinx-block, a palm, the Sky Pop / Marine Pop suggestion, and faux LCD
 * scanlines over everything. Covers Land 1 & 2. `.sml-` namespace.
 */
export function SuperMarioLandScene() {
  return (
    <div className="sml-scene" aria-hidden="true">
      {/* DMG-green sun disc */}
      <svg className="sml-sun" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="30" fill="#306230" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="#0f380f" strokeWidth="3" />
      </svg>

      {/* Birabuto pyramids on the horizon */}
      <svg className="sml-pyramids" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <g fill="#306230" stroke="#0f380f" strokeWidth="3">
          <path d="M120 240 L320 60 L520 240 Z" />
          <path d="M640 240 L820 90 L1000 240 Z" />
          <path d="M980 240 L1120 120 L1260 240 Z" />
        </g>
        {/* brick courses */}
        <g stroke="#8bac0f" strokeWidth="2" opacity="0.6" fill="none">
          <path d="M250 130 L390 130 M210 175 L430 175 M170 215 L470 215" />
        </g>
      </svg>

      {/* Sphinx block */}
      <svg className="sml-sphinx" viewBox="0 0 140 100">
        <path d="M10 100 L10 50 Q10 30 40 30 L60 30 L60 14 L96 14 L96 40 L130 40 L130 100 Z" fill="#306230" stroke="#0f380f" strokeWidth="3" />
        <rect x="66" y="22" width="10" height="6" fill="#0f380f" /><rect x="82" y="22" width="10" height="6" fill="#0f380f" />
        <path d="M10 70 L130 70 M40 50 L40 100 M90 50 L90 100" stroke="#0f380f" strokeWidth="2" opacity="0.7" />
      </svg>

      {/* Lone palm */}
      <svg className="sml-palm" viewBox="0 0 120 160">
        <rect x="52" y="60" width="16" height="100" fill="#306230" stroke="#0f380f" strokeWidth="3" />
        <path d="M56 65 L56 150 M64 65 L64 150" stroke="#0f380f" strokeWidth="1.5" opacity="0.6" />
        <g fill="#306230" stroke="#0f380f" strokeWidth="3">
          <path d="M60 62 Q20 40 6 56 Q34 48 60 70 Z" />
          <path d="M60 62 Q100 40 114 56 Q86 48 60 70 Z" />
          <path d="M60 60 Q40 20 24 18 Q52 34 60 70 Z" />
          <path d="M60 60 Q80 20 96 18 Q68 34 60 70 Z" />
        </g>
      </svg>

      {/* Sky Pop aeroplane buzzing across */}
      <svg className="sml-plane" viewBox="0 0 120 60">
        <path d="M20 30 L92 26 Q108 26 108 34 Q108 42 92 40 L24 38 Z" fill="#306230" stroke="#0f380f" strokeWidth="3" />
        <path d="M40 28 L58 8 L66 28 Z" fill="#306230" stroke="#0f380f" strokeWidth="3" />
        <path d="M16 30 L2 22 L2 40 Z" fill="#306230" stroke="#0f380f" strokeWidth="3" />
        <circle cx="84" cy="33" r="6" fill="#8bac0f" stroke="#0f380f" strokeWidth="2" />
        <g className="sml-prop"><rect x="104" y="22" width="3" height="24" fill="#0f380f" /></g>
      </svg>

      {/* Pixel-block ground */}
      <svg className="sml-ground" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <rect x="0" y="0" width="1200" height="120" fill="#306230" />
        <g stroke="#0f380f" strokeWidth="2" opacity="0.7">
          <path d="M0 40 L1200 40 M0 80 L1200 80" />
          <path d="M100 0 L100 120 M300 0 L300 120 M500 0 L500 120 M700 0 L700 120 M900 0 L900 120 M1100 0 L1100 120" />
        </g>
      </svg>

      {/* Faux LCD scanlines over everything */}
      <div className="sml-lcd" />
    </div>
  );
}
