import './mario.css';

/**
 * Super Mario Bros. 3 — World 8 airship armada under a bright sky. NES-style
 * wooden airships with bolted hulls, propellers, and cannon ports drift across
 * a warm blue sky dotted with the game's signature round white clouds, while a
 * Tanooki leaf spins lazily down through the air. `.smb3-` namespace.
 */
export function SuperMarioBros3Scene() {
  return (
    <div className="smb3-scene" aria-hidden="true">
      {/* Round storybook clouds drifting */}
      <svg className="smb3-cloud smb3-cloud-a" viewBox="0 0 120 60">
        <g fill="#ffffff">
          <ellipse cx="40" cy="38" rx="26" ry="18" />
          <ellipse cx="64" cy="32" rx="24" ry="20" />
          <ellipse cx="86" cy="40" rx="22" ry="16" />
          <ellipse cx="58" cy="46" rx="34" ry="14" />
        </g>
        <g fill="#dfeeff">
          <ellipse cx="44" cy="44" rx="20" ry="6" />
          <ellipse cx="80" cy="46" rx="16" ry="5" />
        </g>
      </svg>
      <svg className="smb3-cloud smb3-cloud-b" viewBox="0 0 120 60">
        <g fill="#ffffff">
          <ellipse cx="40" cy="38" rx="26" ry="18" />
          <ellipse cx="64" cy="32" rx="24" ry="20" />
          <ellipse cx="86" cy="40" rx="22" ry="16" />
          <ellipse cx="58" cy="46" rx="34" ry="14" />
        </g>
      </svg>
      <svg className="smb3-cloud smb3-cloud-c" viewBox="0 0 120 60">
        <g fill="#ffffff">
          <ellipse cx="40" cy="38" rx="26" ry="18" />
          <ellipse cx="64" cy="32" rx="24" ry="20" />
          <ellipse cx="86" cy="40" rx="22" ry="16" />
        </g>
      </svg>

      {/* Spinning Tanooki leaf drifting down */}
      <svg className="smb3-leaf" viewBox="0 0 40 48">
        <path d="M20 2 Q34 14 30 32 Q24 46 20 46 Q16 46 10 32 Q6 14 20 2 Z" fill="#e8a23a" />
        <path d="M20 6 L20 44" stroke="#9a5e16" strokeWidth="1.5" />
        <g stroke="#9a5e16" strokeWidth="1" fill="none">
          <path d="M20 16 L28 12" />
          <path d="M20 24 L30 22" />
          <path d="M20 32 L26 34" />
          <path d="M20 16 L12 12" />
          <path d="M20 24 L10 22" />
        </g>
      </svg>

      {/* Large foreground airship */}
      <svg className="smb3-airship smb3-airship-main" viewBox="0 0 260 140">
        {/* propeller at the stern */}
        <g className="smb3-prop">
          <circle cx="14" cy="74" r="4" fill="#7a4a1c" />
          <rect x="11" y="48" width="6" height="52" rx="3" fill="#caa23a" />
          <rect x="-12" y="71" width="52" height="6" rx="3" fill="#caa23a" />
        </g>
        {/* wooden hull */}
        <path
          d="M40 60 L210 60 Q240 60 248 84 Q240 108 210 108 L60 108 Q40 108 36 90 Z"
          fill="#9a6326"
          stroke="#5e3a14"
          strokeWidth="3"
        />
        {/* hull planks */}
        <g stroke="#7a4a1c" strokeWidth="2">
          <path d="M44 74 L240 74" />
          <path d="M44 88 L236 88" />
        </g>
        {/* bolts / rivets */}
        <g fill="#3a240e">
          <circle cx="56" cy="67" r="2.4" />
          <circle cx="96" cy="67" r="2.4" />
          <circle cx="136" cy="67" r="2.4" />
          <circle cx="176" cy="67" r="2.4" />
          <circle cx="216" cy="67" r="2.4" />
        </g>
        {/* cannon ports */}
        <g fill="#241608">
          <circle cx="90" cy="96" r="6" />
          <circle cx="140" cy="96" r="6" />
          <circle cx="190" cy="96" r="6" />
        </g>
        {/* deck rail + masts */}
        <rect x="60" y="44" width="140" height="6" fill="#7a4a1c" />
        <rect x="80" y="20" width="6" height="26" fill="#5e3a14" />
        <rect x="170" y="20" width="6" height="26" fill="#5e3a14" />
        {/* spiked tail at bow */}
        <path d="M248 70 L264 60 L262 88 Z" fill="#7a4a1c" stroke="#5e3a14" strokeWidth="2" />
      </svg>

      {/* Smaller distant airship */}
      <svg className="smb3-airship smb3-airship-far" viewBox="0 0 200 100">
        <g className="smb3-prop-slow">
          <rect x="8" y="36" width="5" height="36" rx="2" fill="#caa23a" />
          <rect x="-8" y="52" width="36" height="5" rx="2" fill="#caa23a" />
        </g>
        <path
          d="M32 44 L160 44 Q184 44 190 62 Q184 80 160 80 L48 80 Q32 80 28 64 Z"
          fill="#a87332"
          stroke="#5e3a14"
          strokeWidth="2.5"
        />
        <g fill="#1c1006">
          <circle cx="80" cy="70" r="4" />
          <circle cx="120" cy="70" r="4" />
        </g>
        <rect x="60" y="30" width="100" height="5" fill="#7a4a1c" />
      </svg>

      {/* Brick ground line with a single ? block */}
      <svg className="smb3-ground" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <rect x="0" y="40" width="1200" height="80" fill="#c8702a" />
        <g stroke="#8a4a16" strokeWidth="3">
          <path d="M0 64 L1200 64" />
          <path d="M0 88 L1200 88" />
          <path d="M40 40 L40 64 M120 64 L120 88 M200 40 L200 64 M280 64 L280 88 M360 40 L360 64 M440 64 L440 88 M520 40 L520 64 M600 64 L600 88 M680 40 L680 64 M760 64 L760 88 M840 40 L840 64 M920 64 L920 88 M1000 40 L1000 64 M1080 64 L1080 88 M1160 40 L1160 64" />
        </g>
      </svg>
    </div>
  );
}
