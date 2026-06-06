import './dk.css';

/**
 * Donkey Kong (fallback) — the arcade construction-site classic. A black
 * stage with red riveted girders stepping up the screen, yellow ladders
 * connecting them, a rolling barrel descending the slope, a tiny princess
 * marker up top, and the big ape silhouette stationed at the summit. Bold
 * arcade red / yellow on black.
 *
 * Namespace: `.dk-`
 */
export function DonkeyKongScene() {
  return (
    <div className="dk-scene" aria-hidden="true">
      {/* Stepped red girders */}
      <svg className="dk-girders" viewBox="0 0 1200 540" preserveAspectRatio="none">
        <g fill="#e0341a">
          {/* slightly sloped girders, alternating lean */}
          <path d="M0 480 L1200 460 L1200 500 L0 520 Z" />
          <path d="M0 360 L1200 380 L1200 420 L0 400 Z" />
          <path d="M0 280 L1200 260 L1200 300 L0 320 Z" />
          <path d="M0 160 L1200 180 L1200 220 L0 200 Z" />
          <path d="M0 70 L1200 50 L1200 90 L0 110 Z" />
        </g>
        {/* girder rivets */}
        <g fill="#ff7a5a">
          <circle cx="120" cy="500" r="5" /><circle cx="400" cy="494" r="5" /><circle cx="700" cy="488" r="5" /><circle cx="1000" cy="482" r="5" />
          <circle cx="160" cy="382" r="5" /><circle cx="460" cy="388" r="5" /><circle cx="760" cy="394" r="5" /><circle cx="1040" cy="398" r="5" />
          <circle cx="140" cy="298" r="5" /><circle cx="440" cy="292" r="5" /><circle cx="740" cy="286" r="5" /><circle cx="1020" cy="280" r="5" />
          <circle cx="180" cy="182" r="5" /><circle cx="480" cy="188" r="5" /><circle cx="780" cy="194" r="5" /><circle cx="1060" cy="198" r="5" />
        </g>
      </svg>

      {/* Yellow ladders connecting the girders */}
      <svg className="dk-ladders" viewBox="0 0 1200 540" preserveAspectRatio="none">
        <g stroke="#ffd23a" strokeWidth="6">
          {/* ladder 1 */}
          <line x1="280" y1="400" x2="290" y2="500" />
          <line x1="310" y1="400" x2="320" y2="500" />
          <line x1="282" y1="430" x2="318" y2="428" /><line x1="286" y1="470" x2="322" y2="468" />
          {/* ladder 2 */}
          <line x1="820" y1="300" x2="812" y2="400" />
          <line x1="850" y1="300" x2="842" y2="400" />
          <line x1="816" y1="330" x2="848" y2="330" /><line x1="814" y1="370" x2="846" y2="370" />
          {/* ladder 3 */}
          <line x1="420" y1="200" x2="428" y2="300" />
          <line x1="450" y1="200" x2="458" y2="300" />
          <line x1="423" y1="232" x2="455" y2="232" /><line x1="425" y1="270" x2="457" y2="270" />
        </g>
      </svg>

      {/* Rolling barrel descending the slope */}
      <svg className="dk-barrel" viewBox="0 0 60 60">
        <ellipse cx="30" cy="30" rx="26" ry="22" fill="#9a5a28" />
        <ellipse cx="30" cy="30" rx="26" ry="22" fill="none" stroke="#5a3216" strokeWidth="4" />
        <line x1="30" y1="8" x2="30" y2="52" stroke="#caa23a" strokeWidth="4" />
        <line x1="14" y1="14" x2="14" y2="46" stroke="#caa23a" strokeWidth="3" />
        <line x1="46" y1="14" x2="46" y2="46" stroke="#caa23a" strokeWidth="3" />
      </svg>

      {/* Princess marker up top */}
      <svg className="dk-pauline" viewBox="0 0 40 60">
        <ellipse cx="20" cy="14" rx="9" ry="10" fill="#f0c08a" />
        <path d="M11 24 L29 24 L26 56 L14 56 Z" fill="#e63a8a" />
        <circle cx="17" cy="13" r="1.5" fill="#1a1a1a" />
        <circle cx="23" cy="13" r="1.5" fill="#1a1a1a" />
      </svg>

      {/* The big ape stationed at the summit */}
      <svg className="dk-ape" viewBox="0 0 120 120">
        <g fill="#5a3418">
          <ellipse cx="60" cy="70" rx="38" ry="40" />
          <ellipse cx="60" cy="34" rx="24" ry="22" />
          <path d="M26 50 Q8 34 16 18 L32 36 Z" />
          <path d="M94 50 Q112 34 104 18 L88 36 Z" />
          <ellipse cx="42" cy="110" rx="13" ry="12" />
          <ellipse cx="78" cy="110" rx="13" ry="12" />
        </g>
        <ellipse cx="60" cy="42" rx="16" ry="11" fill="#caa07a" />
        <circle cx="52" cy="30" r="3" fill="#fff" />
        <circle cx="68" cy="30" r="3" fill="#fff" />
        <circle cx="52" cy="30" r="1.5" fill="#1a1a1a" />
        <circle cx="68" cy="30" r="1.5" fill="#1a1a1a" />
      </svg>
    </div>
  );
}
