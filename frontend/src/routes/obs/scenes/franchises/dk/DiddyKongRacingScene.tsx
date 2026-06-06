/**
 * Diddy Kong Racing — Timber's Island. A tropical N64 racing hub: sunny
 * teal sky, the Wizpig-face mountain brooding in the distance, palm-lined
 * shore, a chequered race ribbon sweeping through the foreground with a little
 * prop-plane skimming it, and the series' signature coloured power-up balloons
 * (red/blue/green/yellow/rainbow) drifting up. `.dkr-` namespace.
 */
export function DiddyKongRacingScene() {
  return (
    <div className="dkr-scene" aria-hidden="true">
      <div className="dkr-sun" />

      {/* Wizpig mountain — pig-face carved into the far peak */}
      <svg className="dkr-mountain" viewBox="0 0 420 240" preserveAspectRatio="none">
        <path d="M0 240 L60 120 L130 70 L210 40 L300 80 L370 130 L420 240 Z" fill="#5a6f8a" />
        <path d="M130 70 L210 40 L300 80 L260 150 L170 150 Z" fill="#48586f" />
        {/* snout + nostrils + eyes (Wizpig) */}
        <ellipse cx="215" cy="120" rx="34" ry="22" fill="#3a4757" />
        <circle cx="203" cy="120" r="5" fill="#1f2731" />
        <circle cx="227" cy="120" r="5" fill="#1f2731" />
        <ellipse cx="190" cy="92" rx="9" ry="6" fill="#1f2731" />
        <ellipse cx="240" cy="92" rx="9" ry="6" fill="#1f2731" />
      </svg>

      {/* Distant sea band */}
      <svg className="dkr-sea" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0 0 L1200 0 L1200 120 L0 120 Z" fill="#1f86b8" />
        <path className="dkr-glint" d="M120 40 H320 M520 70 H760 M880 30 H1080" stroke="#bfe9ff" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      </svg>

      {/* Palm trees flanking the shore */}
      <svg className="dkr-palm dkr-palm-l" viewBox="0 0 80 160">
        <path d="M38 160 Q34 90 40 40" stroke="#6a4a22" strokeWidth="7" fill="none" strokeLinecap="round" />
        <g fill="#2f9e4a">
          <path d="M40 40 Q12 28 0 38 Q22 36 40 48 Z" />
          <path d="M40 40 Q68 28 80 38 Q58 36 40 48 Z" />
          <path d="M40 40 Q24 14 30 2 Q40 22 44 42 Z" />
          <path d="M40 40 Q56 14 50 2 Q40 22 36 42 Z" />
        </g>
      </svg>
      <svg className="dkr-palm dkr-palm-r" viewBox="0 0 80 160">
        <path d="M42 160 Q46 90 40 40" stroke="#6a4a22" strokeWidth="7" fill="none" strokeLinecap="round" />
        <g fill="#37b257">
          <path d="M40 40 Q12 28 0 38 Q22 36 40 48 Z" />
          <path d="M40 40 Q68 28 80 38 Q58 36 40 48 Z" />
          <path d="M40 40 Q24 14 30 2 Q40 22 44 42 Z" />
          <path d="M40 40 Q56 14 50 2 Q40 22 36 42 Z" />
        </g>
      </svg>

      {/* Chequered race ribbon sweeping across the foreground */}
      <svg className="dkr-track" viewBox="0 0 1200 260" preserveAspectRatio="none">
        <path
          d="M-20 260 Q200 150 480 180 Q760 210 980 120 Q1120 60 1240 90 L1240 260 Z"
          fill="#caa23a"
        />
        <path
          d="M-20 250 Q200 145 480 172 Q760 200 980 116 Q1120 58 1240 86"
          stroke="#fff"
          strokeWidth="5"
          strokeDasharray="26 22"
          fill="none"
          opacity="0.85"
        />
      </svg>

      {/* Prop plane skimming the track */}
      <svg className="dkr-plane" viewBox="0 0 90 50">
        <ellipse cx="44" cy="28" rx="30" ry="11" fill="#e0341a" />
        <path d="M58 28 L84 22 L84 34 Z" fill="#b81f10" />
        <rect x="30" y="14" width="26" height="9" rx="4" fill="#ffd23a" />
        <path d="M30 28 L8 16 L18 30 Z" fill="#1f86b8" />
        <path d="M30 28 L8 40 L18 26 Z" fill="#1f86b8" />
        <g className="dkr-prop">
          <rect x="2" y="20" width="4" height="16" rx="2" fill="#2a2a30" />
        </g>
      </svg>

      {/* Signature DKR power-up balloons drifting up */}
      <div className="dkr-balloons">
        {[
          ['dkr-b1', '#e0341a'],
          ['dkr-b2', '#1f86b8'],
          ['dkr-b3', '#2f9e4a'],
          ['dkr-b4', '#ffd23a'],
        ].map(([cls, c]) => (
          <svg key={cls} className={`dkr-balloon ${cls}`} viewBox="0 0 24 34">
            <ellipse cx="12" cy="12" rx="10" ry="12" fill={c} />
            <ellipse cx="8" cy="8" rx="3" ry="4" fill="#ffffff" opacity="0.5" />
            <path d="M12 24 L9 30 L15 30 Z" fill={c} />
            <path d="M12 30 V34" stroke="#ffffff" strokeWidth="1" opacity="0.6" />
          </svg>
        ))}
      </div>
    </div>
  );
}
