import './ff.css';

/**
 * Final Fantasy VI — a Magitek armour walker striding the snow beneath an
 * airship crossing a twilight sky over jagged white mountains, with the
 * opera-house silhouette nestled in the valley. Twilight purples and magenta.
 * `.ff6-` namespace.
 */
export function Ff6Scene() {
  return (
    <div className="ff6-scene" aria-hidden="true">
      {/* Cold moon glow behind the peaks */}
      <div className="ff6-moon" />

      {/* Drifting snow */}
      <div className="ff6-snow" />

      {/* Far snowy mountains */}
      <svg className="ff6-mountains" viewBox="0 0 1200 260" preserveAspectRatio="none">
        <path
          d="M0 260 L120 110 L210 170 L330 70 L440 150 L560 60 L690 160 L820 90
             L960 170 L1080 100 L1200 160 L1200 260 Z"
          fill="rgba(58, 46, 84, 0.95)"
        />
        {/* snow caps */}
        <g fill="rgba(214, 206, 240, 0.9)">
          <path d="M330 70 L300 110 L360 110 Z" />
          <path d="M560 60 L532 100 L590 100 Z" />
          <path d="M820 90 L794 128 L848 128 Z" />
        </g>
      </svg>

      {/* The airship crossing the sky */}
      <svg className="ff6-airship" viewBox="0 0 220 100">
        {/* hull */}
        <path d="M30 50 Q60 30 150 36 Q190 40 200 52 Q190 64 150 66 Q60 70 30 50 Z"
              fill="rgba(70, 54, 96, 0.99)" />
        {/* deck cabin */}
        <path d="M80 38 L150 40 L142 24 L96 24 Z" fill="rgba(54, 42, 78, 0.99)" />
        {/* paddle wheel at the stern */}
        <circle cx="36" cy="50" r="16" fill="none" stroke="rgba(90, 70, 118, 0.99)" strokeWidth="4" />
        <g stroke="rgba(90, 70, 118, 0.99)" strokeWidth="3">
          <path d="M36 36 L36 64" />
          <path d="M22 50 L50 50" />
          <path d="M26 40 L46 60" />
        </g>
        {/* warm cabin windows */}
        <g fill="#ffcf8a">
          <rect x="100" y="28" width="6" height="8" />
          <rect x="116" y="28" width="6" height="8" />
          <rect x="132" y="28" width="6" height="8" />
        </g>
        {/* prow flag */}
        <path d="M200 52 L214 46 L210 54 L214 60 Z" fill="#d65aa0" />
      </svg>

      {/* Opera house silhouette nestled in the valley */}
      <svg className="ff6-opera" viewBox="0 0 200 140">
        {/* main hall */}
        <rect x="30" y="70" width="140" height="70" fill="rgba(44, 32, 60, 0.98)" />
        {/* grand dome */}
        <path d="M70 70 Q100 26 130 70 Z" fill="rgba(52, 38, 70, 0.99)" />
        <rect x="96" y="14" width="8" height="14" fill="rgba(52, 38, 70, 0.99)" />
        <circle cx="100" cy="12" r="4" fill="#ffcf8a" />
        {/* side towers */}
        <rect x="20" y="58" width="20" height="82" fill="rgba(40, 30, 56, 0.99)" />
        <rect x="160" y="58" width="20" height="82" fill="rgba(40, 30, 56, 0.99)" />
        <path d="M20 58 L30 40 L40 58 Z" fill="rgba(40, 30, 56, 0.99)" />
        <path d="M160 58 L170 40 L180 58 Z" fill="rgba(40, 30, 56, 0.99)" />
        {/* glowing arched windows */}
        <g fill="#ffd98a">
          <rect x="56" y="92" width="10" height="20" rx="5" />
          <rect x="86" y="92" width="10" height="20" rx="5" />
          <rect x="116" y="92" width="10" height="20" rx="5" />
        </g>
      </svg>

      {/* Magitek armour walker striding in the foreground snow */}
      <svg className="ff6-magitek" viewBox="0 0 160 160">
        {/* cockpit body */}
        <path d="M50 60 Q80 44 110 60 L116 96 L44 96 Z" fill="rgba(86, 66, 116, 0.99)" />
        {/* canopy glow */}
        <path d="M64 60 Q80 50 96 60 L92 78 L68 78 Z" fill="#9be8ff" opacity="0.85" />
        {/* head turret + cannon */}
        <rect x="70" y="40" width="20" height="18" rx="3" fill="rgba(70, 52, 98, 0.99)" />
        <rect x="88" y="44" width="34" height="7" rx="2" fill="rgba(60, 44, 84, 0.99)" />
        <circle cx="122" cy="47" r="5" className="ff6-cannon" fill="#ff7adf" />
        {/* mechanical bird legs */}
        <g stroke="rgba(70, 52, 98, 0.99)" strokeWidth="8" fill="none" strokeLinecap="round">
          <path d="M58 96 L40 124 L24 150" />
          <path d="M102 96 L120 124 L136 150" />
        </g>
        {/* foot claws */}
        <g fill="rgba(70, 52, 98, 0.99)">
          <path d="M24 150 L12 156 L24 142 L34 152 Z" />
          <path d="M136 150 L148 156 L136 142 L126 152 Z" />
        </g>
      </svg>

      {/* Foreground snow drift */}
      <svg className="ff6-foreground" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0 120 L0 60 Q200 30 400 56 Q600 80 800 50 Q1000 26 1200 60 L1200 120 Z"
              fill="rgba(206, 198, 234, 0.95)" />
      </svg>
    </div>
  );
}
