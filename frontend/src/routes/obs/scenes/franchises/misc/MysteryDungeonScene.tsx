import './misc.css';

/**
 * Pokémon Mystery Dungeon — a soft storybook dungeon room rendered in warm
 * pastels. Rounded cobble walls, a wooden Kangaskhan-style rescue sign, glowing
 * floor tiles, and gentle floating sparkles. `.pmd-` namespace.
 */
export function MysteryDungeonScene() {
  return (
    <div className="pmd-scene" aria-hidden="true">
      {/* Soft warm glow filling the room */}
      <div className="pmd-glow" />

      {/* Rounded cobble back wall */}
      <svg className="pmd-wall" viewBox="0 0 1200 360" preserveAspectRatio="none">
        <rect x="0" y="0" width="1200" height="360" fill="#caa6d8" />
        {/* soft cobble bricks */}
        <g fill="#b890c9" stroke="#a079b4" strokeWidth="3">
          <rect x="20" y="30" width="140" height="70" rx="18" />
          <rect x="190" y="30" width="160" height="70" rx="18" />
          <rect x="380" y="30" width="150" height="70" rx="18" />
          <rect x="560" y="30" width="160" height="70" rx="18" />
          <rect x="750" y="30" width="150" height="70" rx="18" />
          <rect x="930" y="30" width="160" height="70" rx="18" />
          <rect x="100" y="120" width="160" height="70" rx="18" />
          <rect x="290" y="120" width="150" height="70" rx="18" />
          <rect x="470" y="120" width="160" height="70" rx="18" />
          <rect x="660" y="120" width="150" height="70" rx="18" />
          <rect x="840" y="120" width="160" height="70" rx="18" />
        </g>
      </svg>

      {/* Storybook torches flickering on the wall */}
      <svg className="pmd-torch pmd-torch-left" viewBox="0 0 50 90">
        <rect x="20" y="30" width="10" height="56" rx="3" fill="#9c6a35" />
        <g className="pmd-flame">
          <ellipse cx="25" cy="22" rx="13" ry="20" fill="#ffb14a" />
          <ellipse cx="25" cy="26" rx="7" ry="13" fill="#ffe39a" />
        </g>
      </svg>
      <svg className="pmd-torch pmd-torch-right" viewBox="0 0 50 90">
        <rect x="20" y="30" width="10" height="56" rx="3" fill="#9c6a35" />
        <g className="pmd-flame pmd-flame-b">
          <ellipse cx="25" cy="22" rx="13" ry="20" fill="#ffb14a" />
          <ellipse cx="25" cy="26" rx="7" ry="13" fill="#ffe39a" />
        </g>
      </svg>

      {/* Wooden rescue-team sign post */}
      <svg className="pmd-sign" viewBox="0 0 120 150">
        <rect x="54" y="50" width="12" height="100" fill="#9c6a35" />
        <rect x="8" y="20" width="104" height="46" rx="8" fill="#d8a45e" stroke="#a06b2f" strokeWidth="4" />
        <rect x="16" y="28" width="88" height="30" rx="5" fill="#f3deae" />
        {/* friendly footprint glyph */}
        <g fill="#a06b2f">
          <ellipse cx="44" cy="43" rx="9" ry="11" />
          <circle cx="34" cy="33" r="3" />
          <circle cx="42" cy="30" r="3" />
          <circle cx="52" cy="31" r="3" />
        </g>
        <g fill="#a06b2f">
          <rect x="66" y="34" width="28" height="4" rx="2" />
          <rect x="66" y="42" width="20" height="4" rx="2" />
          <rect x="66" y="50" width="24" height="4" rx="2" />
        </g>
      </svg>

      {/* Glowing floor with tile grid */}
      <svg className="pmd-floor" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path d="M0 200 L0 40 L1200 40 L1200 200 Z" fill="#e3b9c9" />
        <g stroke="#d49db2" strokeWidth="3">
          <line x1="0" y1="90" x2="1200" y2="90" />
          <line x1="0" y1="140" x2="1200" y2="140" />
          <line x1="200" y1="40" x2="160" y2="200" />
          <line x1="450" y1="40" x2="430" y2="200" />
          <line x1="700" y1="40" x2="700" y2="200" />
          <line x1="950" y1="40" x2="980" y2="200" />
        </g>
        {/* a special glowing tile */}
        <rect className="pmd-tile" x="560" y="96" width="90" height="40" rx="6" fill="#ffe39a" opacity="0.8" />
      </svg>

      {/* Floating storybook sparkles */}
      <div className="pmd-sparkles" />
    </div>
  );
}
