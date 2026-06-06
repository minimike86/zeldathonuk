import './streetfighter.css';

/**
 * Street Fighter III (Third Strike) — gritty urban back-alley beside a subway
 * entrance at dusk. Layered concrete walls in muddy greys, a chain-link fence,
 * a flickering subway sign, scattered graffiti tags in bold spray accents, a
 * lone fighter parrying with a flash, and drifting newspaper litter.
 * `.sf3-` namespace.
 */
export function ThirdStrikeScene() {
  return (
    <div className="sf3-scene" aria-hidden="true">
      {/* Far brick wall with grime gradient */}
      <svg className="sf3-backwall" viewBox="0 0 1200 400" preserveAspectRatio="none">
        <rect x="0" y="0" width="1200" height="400" fill="rgba(46, 46, 50, 1)" />
        {/* brick courses */}
        <g stroke="rgba(28, 28, 32, 0.7)" strokeWidth="2">
          <line x1="0" y1="60" x2="1200" y2="60" />
          <line x1="0" y1="120" x2="1200" y2="120" />
          <line x1="0" y1="180" x2="1200" y2="180" />
          <line x1="0" y1="240" x2="1200" y2="240" />
          <line x1="0" y1="300" x2="1200" y2="300" />
        </g>
        {/* grime stains */}
        <g fill="rgba(20, 20, 24, 0.45)">
          <path d="M120 0 Q140 80 110 200 Q150 120 160 0 Z" />
          <path d="M860 0 Q880 100 850 260 Q900 140 910 0 Z" />
        </g>
      </svg>

      {/* Subway entrance railing + glowing sign on the left */}
      <svg className="sf3-subway" viewBox="0 0 240 320">
        {/* stair void */}
        <path d="M20 320 L20 200 L220 160 L220 320 Z" fill="rgba(10, 10, 12, 1)" />
        {/* railing */}
        <g stroke="rgba(70, 72, 78, 1)" strokeWidth="6" strokeLinecap="round">
          <line x1="30" y1="206" x2="30" y2="150" />
          <line x1="210" y1="166" x2="210" y2="110" />
          <line x1="30" y1="150" x2="210" y2="110" />
          <line x1="120" y1="178" x2="120" y2="130" />
        </g>
        {/* signpost */}
        <rect x="160" y="20" width="8" height="96" fill="rgba(60, 62, 68, 1)" />
        {/* sign box */}
        <rect x="110" y="14" width="110" height="40" rx="4" fill="rgba(18, 40, 70, 1)"
          stroke="rgba(90, 130, 200, 0.8)" strokeWidth="3" />
        <text className="sf3-sign-text" x="165" y="42" textAnchor="middle"
          fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold" fill="#7fd0ff">SUBWAY</text>
      </svg>

      {/* Chain-link fence panel on the right */}
      <svg className="sf3-fence" viewBox="0 0 320 360" preserveAspectRatio="none">
        <g stroke="rgba(120, 122, 128, 0.5)" strokeWidth="2">
          {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((x) => (
            <line key={`a${x}`} x1={x} y1="0" x2={x + 60} y2="360" />
          ))}
          {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((x) => (
            <line key={`b${x}`} x1={x + 60} y1="0" x2={x} y2="360" />
          ))}
        </g>
        {/* posts */}
        <rect x="6" y="0" width="8" height="360" fill="rgba(80, 82, 88, 0.9)" />
        <rect x="300" y="0" width="8" height="360" fill="rgba(80, 82, 88, 0.9)" />
      </svg>

      {/* Graffiti tags sprayed on the wall */}
      <svg className="sf3-graffiti" viewBox="0 0 400 160">
        {/* bold tag stroke */}
        <path d="M20 110 Q40 40 70 90 Q90 120 110 60 L130 110 Q150 30 180 100"
          fill="none" stroke="#ff3d7f" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M210 100 Q240 40 270 100 Q300 40 330 100"
          fill="none" stroke="#36e0a6" strokeWidth="8" strokeLinecap="round" />
        {/* drip */}
        <line x1="70" y1="92" x2="70" y2="130" stroke="#ff3d7f" strokeWidth="4" strokeLinecap="round" />
        <line x1="270" y1="100" x2="270" y2="134" stroke="#36e0a6" strokeWidth="3" strokeLinecap="round" />
        {/* spray halo */}
        <circle cx="360" cy="60" r="22" fill="none" stroke="#ffd23a" strokeWidth="6" />
      </svg>

      {/* Wet asphalt ground */}
      <svg className="sf3-ground" viewBox="0 0 1200 160" preserveAspectRatio="none">
        <rect x="0" y="0" width="1200" height="160" fill="rgba(22, 22, 26, 1)" />
        <g stroke="rgba(120, 130, 150, 0.16)" strokeWidth="3">
          <line x1="0" y1="50" x2="1200" y2="40" />
          <line x1="0" y1="100" x2="1200" y2="92" />
        </g>
        {/* puddle reflections */}
        <ellipse cx="380" cy="120" rx="120" ry="14" fill="rgba(120, 160, 220, 0.12)" />
        <ellipse cx="840" cy="100" rx="90" ry="10" fill="rgba(255, 210, 120, 0.1)" />
      </svg>

      {/* Fighter mid-parry, lit by the subway glow */}
      <svg className="sf3-fighter" viewBox="0 0 100 160">
        <g fill="rgba(14, 14, 18, 1)">
          {/* legs in a wide ready base */}
          <path d="M40 92 L24 150 L34 152 L50 100 Z" />
          <path d="M56 92 L74 150 L64 152 L48 100 Z" />
          {/* torso slightly crouched */}
          <path d="M38 52 L62 52 Q70 76 60 98 L40 98 Q30 76 38 52 Z" />
          {/* lead arm raised in parry */}
          <path d="M40 60 L20 48 L18 58 L40 70 Z" />
          {/* rear arm low guard */}
          <path d="M60 64 L78 74 L76 82 L58 74 Z" />
          {/* head */}
          <ellipse cx="50" cy="44" rx="9" ry="10" />
        </g>
        {/* parry flash on lead hand */}
        <circle className="sf3-parry" cx="19" cy="52" r="9" fill="rgba(140, 200, 255, 0.9)" />
      </svg>

      {/* Drifting newspaper / litter */}
      <div className="sf3-litter" />

      {/* Flickering overhead vignette */}
      <div className="sf3-flicker" />
    </div>
  );
}
