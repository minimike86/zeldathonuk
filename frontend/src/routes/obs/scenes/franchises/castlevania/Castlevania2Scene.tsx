import './castlevania.css';

/**
 * Castlevania II: Simon's Quest — a hushed night town at the edge of a
 * graveyard, drifting ground fog, a sickly green moon and a lone bat. Eerie
 * green/purple palette. `.cv2-` namespace.
 */
export function Castlevania2Scene() {
  return (
    <div className="cv2-scene" aria-hidden="true">
      {/* Sickly green moon */}
      <svg className="cv2-moon" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="38" fill="#bff0c4" />
        <g fill="#8fd49a" opacity="0.6">
          <circle cx="42" cy="44" r="6" />
          <circle cx="60" cy="58" r="4" />
        </g>
      </svg>

      {/* Town rooftops / silhouetted houses */}
      <svg className="cv2-town" viewBox="0 0 1200 240" preserveAspectRatio="none">
        <g fill="rgba(16, 24, 28, 0.98)">
          {/* house 1 */}
          <rect x="60" y="120" width="160" height="120" />
          <path d="M50 120 L140 60 L230 120 Z" />
          {/* house 2 */}
          <rect x="280" y="100" width="140" height="140" />
          <path d="M270 100 L350 50 L430 100 Z" />
          {/* tall house */}
          <rect x="480" y="70" width="110" height="170" />
          <path d="M472 70 L535 26 L598 70 Z" />
          {/* house 4 */}
          <rect x="660" y="110" width="150" height="130" />
          <path d="M650 110 L735 56 L820 110 Z" />
          {/* house 5 */}
          <rect x="880" y="130" width="140" height="110" />
          <path d="M870 130 L950 76 L1030 130 Z" />
          {/* chapel */}
          <rect x="1080" y="90" width="90" height="150" />
          <path d="M1072 90 L1125 44 L1178 90 Z" />
        </g>
        {/* dim window glow */}
        <g fill="#d4a23a" opacity="0.55">
          <rect x="110" y="150" width="14" height="20" />
          <rect x="330" y="140" width="14" height="20" />
          <rect x="520" y="110" width="12" height="18" />
          <rect x="720" y="150" width="14" height="20" />
        </g>
        {/* chapel cross window */}
        <g fill="#9fd8b0" opacity="0.6">
          <rect x="1120" y="110" width="6" height="26" />
          <rect x="1112" y="118" width="22" height="6" />
        </g>
      </svg>

      {/* Drifting ground fog */}
      <div className="cv2-fog" />

      {/* Graveyard headstones in the foreground */}
      <svg className="cv2-graves" viewBox="0 0 1200 160" preserveAspectRatio="none">
        <path d="M0 160 L0 70 Q300 50 600 64 Q900 78 1200 58 L1200 160 Z" fill="rgba(8, 14, 12, 1)" />
        <g fill="rgba(18, 26, 24, 0.98)">
          {/* rounded headstones */}
          <path d="M120 110 L120 72 Q145 52 170 72 L170 110 Z" />
          <path d="M360 116 L360 80 Q382 62 404 80 L404 116 Z" />
          <path d="M820 112 L820 76 Q842 58 864 76 L864 112 Z" />
          {/* cross headstones */}
          <rect x="560" y="60" width="12" height="58" />
          <rect x="546" y="72" width="40" height="12" />
          <rect x="1000" y="66" width="10" height="52" />
          <rect x="988" y="76" width="34" height="10" />
        </g>
        {/* dead tree */}
        <g stroke="rgba(10, 16, 14, 1)" strokeWidth="6" fill="none" strokeLinecap="round">
          <path d="M680 160 L688 70" />
          <path d="M686 96 L660 70" />
          <path d="M687 84 L714 64" />
          <path d="M662 70 L650 56" />
        </g>
      </svg>

      {/* Lone bat fluttering through */}
      <svg className="cv2-bats" viewBox="0 0 60 30" style={{ position: 'absolute', top: '24%', left: 0, width: '5%', maxWidth: '60px' }}>
        <path d="M30 16 Q20 4 6 12 Q16 14 22 22 Q26 14 30 16 Z" fill="rgba(10, 8, 14, 0.95)" />
        <path d="M30 16 Q40 4 54 12 Q44 14 38 22 Q34 14 30 16 Z" fill="rgba(10, 8, 14, 0.95)" />
        <circle cx="30" cy="14" r="3" fill="rgba(10, 8, 14, 0.95)" />
      </svg>
    </div>
  );
}
