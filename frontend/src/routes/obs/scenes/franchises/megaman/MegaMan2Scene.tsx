import './megaman.css';

/**
 * Mega Man 2 — the iconic title-screen tableau. A deep-blue night city
 * skyline of slim skyscrapers steps up toward the right, lit windows
 * twinkling, a tall foreground tower on the right edge, and Mega Man
 * stands on a high ledge gazing out over the city. A scattering of stars
 * dots the dark sky. Cool blue / cyan palette, recreated from primitives.
 *
 * Namespace: `.mm2-`
 */
export function MegaMan2Scene() {
  return (
    <div className="mm2-scene" aria-hidden="true">
      {/* Star scatter in the night sky */}
      <div className="mm2-stars" />

      {/* Distant skyline stepping up to the right (title-screen layout) */}
      <svg className="mm2-skyline" viewBox="0 0 1200 360" preserveAspectRatio="none">
        <g fill="#0f1f4a">
          <rect x="0" y="280" width="120" height="80" />
          <rect x="120" y="240" width="110" height="120" />
          <rect x="230" y="270" width="90" height="90" />
          <rect x="320" y="200" width="120" height="160" />
          <rect x="440" y="240" width="100" height="120" />
          <rect x="540" y="160" width="120" height="200" />
          <rect x="660" y="210" width="100" height="150" />
          <rect x="760" y="120" width="130" height="240" />
          <rect x="890" y="180" width="110" height="180" />
          <rect x="1000" y="90" width="120" height="270" />
        </g>
        {/* lit window grid on the buildings */}
        <g className="mm2-windows" fill="#2fd2ff">
          <rect x="150" y="260" width="8" height="8" />
          <rect x="170" y="260" width="8" height="8" />
          <rect x="150" y="290" width="8" height="8" />
          <rect x="350" y="220" width="8" height="8" />
          <rect x="370" y="220" width="8" height="8" />
          <rect x="350" y="250" width="8" height="8" />
          <rect x="370" y="250" width="8" height="8" />
          <rect x="570" y="180" width="8" height="8" />
          <rect x="590" y="180" width="8" height="8" />
          <rect x="570" y="220" width="8" height="8" />
          <rect x="790" y="140" width="8" height="8" />
          <rect x="810" y="140" width="8" height="8" />
          <rect x="790" y="180" width="8" height="8" />
          <rect x="810" y="180" width="8" height="8" />
          <rect x="1030" y="110" width="8" height="8" />
          <rect x="1050" y="110" width="8" height="8" />
          <rect x="1030" y="150" width="8" height="8" />
        </g>
      </svg>

      {/* Tall foreground tower the hero stands beside, right edge */}
      <svg className="mm2-tower" viewBox="0 0 200 360" preserveAspectRatio="none">
        <rect x="40" y="0" width="120" height="360" fill="#0a1638" />
        <rect x="40" y="0" width="6" height="360" fill="#1e3a78" />
        {/* lit windows running up the tower */}
        <g className="mm2-windows" fill="#2fd2ff">
          <rect x="70" y="40" width="10" height="14" />
          <rect x="110" y="40" width="10" height="14" />
          <rect x="70" y="90" width="10" height="14" />
          <rect x="110" y="90" width="10" height="14" />
          <rect x="70" y="140" width="10" height="14" />
          <rect x="110" y="140" width="10" height="14" />
          <rect x="70" y="190" width="10" height="14" />
          <rect x="110" y="190" width="10" height="14" />
          <rect x="70" y="240" width="10" height="14" />
          <rect x="110" y="240" width="10" height="14" />
        </g>
        {/* roof beacon */}
        <rect x="92" y="-10" width="16" height="14" fill="#1e3a78" />
        <circle className="mm2-beacon" cx="100" cy="-10" r="5" fill="#7af6ff" />
      </svg>

      {/* High ledge the hero gazes from */}
      <svg className="mm2-ledge" viewBox="0 0 600 120" preserveAspectRatio="none">
        <path d="M0 120 L0 36 L600 20 L600 120 Z" fill="#081026" />
        <path d="M0 36 L600 20" stroke="#1e3a78" strokeWidth="3" />
      </svg>

      {/* Mega Man standing, looking out over the city */}
      <svg className="mm2-hero" viewBox="0 0 60 90">
        <g fill="#103a86">
          {/* torso */}
          <rect x="22" y="40" width="18" height="26" />
          {/* helmet */}
          <path d="M20 22 Q31 14 42 22 L42 38 L20 38 Z" />
          {/* legs */}
          <rect x="22" y="66" width="8" height="22" />
          <rect x="33" y="66" width="8" height="22" />
          {/* arm at side */}
          <rect x="40" y="42" width="7" height="20" rx="2" />
          <rect x="15" y="42" width="7" height="20" rx="2" />
        </g>
        {/* face */}
        <rect x="25" y="28" width="12" height="9" fill="#7ab4ff" />
        <rect x="27" y="30" width="3" height="5" fill="#0b1f4a" />
        <rect x="32" y="30" width="3" height="5" fill="#0b1f4a" />
        {/* helmet gem */}
        <rect x="29" y="18" width="4" height="4" fill="#2fd2ff" />
      </svg>
    </div>
  );
}
