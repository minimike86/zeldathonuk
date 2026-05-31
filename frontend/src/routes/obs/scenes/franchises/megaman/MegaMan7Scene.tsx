import './megaman.css';

/**
 * Mega Man 7 — the brighter, chunkier 16-bit SNES leap. A vivid blue sky
 * over a colourful, detailed stage: big rounded background gears turning,
 * glossy candy-coloured platform blocks with bevelled highlights, a hovering
 * energy-tank pickup, and the redesigned chibi blue hero in a lively pose.
 * Saturated, high-contrast 16-bit palette.
 *
 * Namespace: `.mm7-`
 */
export function MegaMan7Scene() {
  return (
    <div className="mm7-scene" aria-hidden="true">
      {/* Big turning background gears */}
      <svg className="mm7-gear mm7-gear-a" viewBox="0 0 120 120">
        <g fill="#2f9be0">
          <circle cx="60" cy="60" r="40" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <rect key={a} x="54" y="6" width="12" height="22" transform={`rotate(${a} 60 60)`} />
          ))}
        </g>
        <circle cx="60" cy="60" r="20" fill="#1763c8" />
        <circle cx="60" cy="60" r="8" fill="#bfe4ff" />
      </svg>
      <svg className="mm7-gear mm7-gear-b" viewBox="0 0 120 120">
        <g fill="#2f9be0">
          <circle cx="60" cy="60" r="40" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <rect key={a} x="54" y="6" width="12" height="22" transform={`rotate(${a} 60 60)`} />
          ))}
        </g>
        <circle cx="60" cy="60" r="20" fill="#1763c8" />
        <circle cx="60" cy="60" r="8" fill="#bfe4ff" />
      </svg>

      {/* Glossy bevelled platform blocks */}
      <svg className="mm7-blocks" viewBox="0 0 1200 360" preserveAspectRatio="none">
        <g>
          {/* ground */}
          <rect x="0" y="300" width="1200" height="60" fill="#1b8ad8" />
          <rect x="0" y="300" width="1200" height="10" fill="#9fe0ff" />
          <rect x="0" y="346" width="1200" height="14" fill="#0d5aa0" />
          {/* floating blocks */}
          <rect x="140" y="210" width="150" height="70" fill="#e0521a" rx="6" />
          <rect x="140" y="210" width="150" height="10" fill="#ffb27a" rx="6" />
          <rect x="430" y="150" width="150" height="130" fill="#3ac06a" rx="6" />
          <rect x="430" y="150" width="150" height="10" fill="#bff5cf" rx="6" />
          <rect x="780" y="190" width="150" height="90" fill="#e0521a" rx="6" />
          <rect x="780" y="190" width="150" height="10" fill="#ffb27a" rx="6" />
          <rect x="1000" y="140" width="150" height="140" fill="#3ac06a" rx="6" />
          <rect x="1000" y="140" width="150" height="10" fill="#bff5cf" rx="6" />
        </g>
      </svg>

      {/* Hovering energy-tank pickup */}
      <svg className="mm7-etank" viewBox="0 0 40 50">
        <rect x="6" y="14" width="28" height="32" rx="4" fill="#e22a2a" />
        <rect x="6" y="14" width="28" height="32" rx="4" fill="none" stroke="#ffffff" strokeWidth="3" />
        <rect x="10" y="6" width="20" height="10" rx="2" fill="#bcc6d6" />
        <rect x="12" y="22" width="16" height="6" fill="#ffffff" />
        <rect x="12" y="32" width="16" height="6" fill="#ffffff" />
      </svg>

      {/* Chibi 16-bit hero in a lively pose */}
      <svg className="mm7-hero" viewBox="0 0 70 80">
        <g fill="#1763c8">
          {/* big head / helmet */}
          <path d="M14 14 Q35 0 56 14 L56 40 L14 40 Z" />
          {/* compact torso */}
          <rect x="22" y="40" width="26" height="20" />
          {/* short legs */}
          <rect x="22" y="60" width="11" height="16" />
          <rect x="37" y="60" width="11" height="16" />
          {/* buster arm */}
          <rect x="48" y="42" width="20" height="12" rx="3" />
        </g>
        {/* big face */}
        <rect x="22" y="20" width="22" height="16" fill="#bfe4ff" />
        <rect x="26" y="24" width="5" height="8" fill="#0b2a66" />
        <rect x="35" y="24" width="5" height="8" fill="#0b2a66" />
        {/* helmet ear pods */}
        <circle cx="16" cy="28" r="5" fill="#1763c8" />
        <circle cx="54" cy="28" r="5" fill="#1763c8" />
        {/* helmet gem */}
        <rect x="31" y="10" width="6" height="6" fill="#ffd23a" />
        {/* buster muzzle */}
        <circle className="mm7-buster" cx="68" cy="48" r="7" fill="#9fe0ff" />
      </svg>
    </div>
  );
}
