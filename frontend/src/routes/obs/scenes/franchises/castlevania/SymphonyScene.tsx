import './castlevania.css';

/**
 * Symphony of the Night — the iconic inverted castle hangs upside-down from the
 * heavens beneath a pale full moon, flanked by guttering candelabra, with
 * Alucard's caped silhouette standing in the foreground. Deep blue/gold palette.
 * `.sotn-` namespace.
 */
export function SymphonyScene() {
  return (
    <div className="sotn-scene" aria-hidden="true">
      {/* Pale full moon */}
      <svg className="sotn-moon" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="#f6efd2" />
        <g fill="#e2d8b0" opacity="0.7">
          <circle cx="40" cy="42" r="6" />
          <circle cx="60" cy="56" r="4" />
          <circle cx="52" cy="36" r="3" />
        </g>
        <circle cx="50" cy="50" r="40" fill="none" stroke="#fff6d6" strokeWidth="1" opacity="0.5" />
      </svg>

      {/* Inverted gothic castle hanging from the top of the frame */}
      <svg className="sotn-castle" viewBox="0 0 760 320" preserveAspectRatio="xMidYMin meet">
        {/* Main hanging body */}
        <path
          d="M120 0 L640 0 L640 90 L600 90 L600 150 L540 150 L540 210 L470 210
             L470 260 L380 300 L290 260 L290 210 L220 210 L220 150 L160 150
             L160 90 L120 90 Z"
          fill="rgba(26, 22, 56, 0.98)"
        />
        {/* Hanging spires (pointing down) */}
        <g fill="rgba(20, 16, 46, 0.99)">
          <path d="M180 90 L210 90 L195 170 Z" />
          <path d="M260 90 L300 90 L280 200 Z" />
          <path d="M360 90 L400 90 L380 230 Z" />
          <path d="M460 90 L500 90 L480 200 Z" />
          <path d="M550 90 L580 90 L565 170 Z" />
        </g>
        {/* Crenellations along the top edge */}
        <g fill="rgba(30, 26, 64, 0.98)">
          <rect x="140" y="0" width="24" height="18" />
          <rect x="200" y="0" width="24" height="18" />
          <rect x="320" y="0" width="24" height="18" />
          <rect x="416" y="0" width="24" height="18" />
          <rect x="536" y="0" width="24" height="18" />
          <rect x="596" y="0" width="24" height="18" />
        </g>
        {/* Tall central tower (also inverted, hanging) */}
        <path d="M340 0 L420 0 L420 110 L400 150 L360 150 L340 110 Z" fill="rgba(34, 28, 70, 0.99)" />
        <path d="M360 150 L400 150 L380 215 Z" fill="rgba(22, 18, 50, 0.99)" />
        {/* Lit windows — gold */}
        <g fill="#ffcf57">
          <rect x="200" y="40" width="8" height="16" rx="2" />
          <rect x="300" y="50" width="8" height="16" rx="2" />
          <rect x="372" y="40" width="8" height="18" rx="2" />
          <rect x="452" y="50" width="8" height="16" rx="2" />
          <rect x="556" y="40" width="8" height="16" rx="2" />
        </g>
        {/* Arched window on the central tower */}
        <path d="M368 70 Q380 58 392 70 L392 100 L368 100 Z" fill="#ffd86a" opacity="0.9" />
      </svg>

      {/* Candelabra left */}
      <svg className="sotn-candelabra sotn-candelabra-left" viewBox="0 0 60 120">
        <rect x="27" y="40" width="6" height="68" fill="#2a2030" />
        <path d="M14 108 L46 108 L40 118 L20 118 Z" fill="#2a2030" />
        <rect x="10" y="42" width="40" height="6" rx="3" fill="#2a2030" />
        {/* candles */}
        <rect x="12" y="30" width="6" height="14" fill="#d8cba0" />
        <rect x="27" y="22" width="6" height="22" fill="#d8cba0" />
        <rect x="42" y="30" width="6" height="14" fill="#d8cba0" />
        {/* flames */}
        <g className="sotn-flame" fill="#ffb347">
          <path d="M15 30 Q12 22 15 18 Q18 22 15 30 Z" />
          <path d="M30 22 Q26 12 30 6 Q34 12 30 22 Z" />
          <path d="M45 30 Q42 22 45 18 Q48 22 45 30 Z" />
        </g>
      </svg>

      {/* Candelabra right */}
      <svg className="sotn-candelabra sotn-candelabra-right" viewBox="0 0 60 120">
        <rect x="27" y="40" width="6" height="68" fill="#2a2030" />
        <path d="M14 108 L46 108 L40 118 L20 118 Z" fill="#2a2030" />
        <rect x="10" y="42" width="40" height="6" rx="3" fill="#2a2030" />
        <rect x="12" y="30" width="6" height="14" fill="#d8cba0" />
        <rect x="27" y="22" width="6" height="22" fill="#d8cba0" />
        <rect x="42" y="30" width="6" height="14" fill="#d8cba0" />
        <g className="sotn-flame" fill="#ffb347">
          <path d="M15 30 Q12 22 15 18 Q18 22 15 30 Z" />
          <path d="M30 22 Q26 12 30 6 Q34 12 30 22 Z" />
          <path d="M45 30 Q42 22 45 18 Q48 22 45 30 Z" />
        </g>
      </svg>

      {/* Alucard silhouette, cape billowing */}
      <svg className="sotn-alucard" viewBox="0 0 100 160">
        {/* billowing cape behind */}
        <g className="sotn-cape">
          <path
            d="M50 28 Q22 40 14 90 Q10 120 24 150 L50 132 L76 150 Q90 120 86 90 Q78 40 50 28 Z"
            fill="rgba(14, 10, 30, 0.98)"
          />
          {/* cape inner lining glint */}
          <path d="M50 36 Q34 50 30 100 Q28 124 38 144 L50 130 Z" fill="rgba(70, 40, 90, 0.5)" />
        </g>
        {/* body */}
        <path d="M40 56 L60 56 L58 120 L42 120 Z" fill="rgba(8, 6, 18, 1)" />
        {/* head */}
        <ellipse cx="50" cy="40" rx="11" ry="13" fill="rgba(8, 6, 18, 1)" />
        {/* long flowing hair */}
        <path d="M40 34 Q34 60 40 96 L46 96 Q42 60 46 36 Z" fill="rgba(225, 215, 180, 0.9)" />
        <path d="M60 34 Q66 60 60 96 L54 96 Q58 60 54 36 Z" fill="rgba(225, 215, 180, 0.9)" />
        {/* sword glint at side */}
        <rect x="62" y="78" width="2.5" height="46" fill="rgba(180, 200, 230, 0.7)" transform="rotate(12 63 100)" />
      </svg>
    </div>
  );
}
