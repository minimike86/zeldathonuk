import './misc.css';

/**
 * Super Smash Bros. — a dramatic crossover starfield with a glowing
 * Smash-emblem-style burst (a circle crossed by a hard diagonal slash) pulsing
 * at centre, radiating light rays and a rotating ring of impact sparks.
 * Dramatic blue/white. `.smb-` namespace.
 */
export function SmashBrosScene() {
  return (
    <div className="smb-scene" aria-hidden="true">
      {/* Deep starfield */}
      <div className="smb-stars" />

      {/* Radiating light rays behind the emblem */}
      <svg className="smb-rays" viewBox="-100 -100 200 200">
        <g fill="rgba(150, 200, 255, 0.18)">
          {[...Array(12)].map((_, i) => (
            <path
              key={i}
              d="M0 0 L-14 -120 L14 -120 Z"
              transform={`rotate(${i * 30})`}
            />
          ))}
        </g>
      </svg>

      {/* Rotating ring of impact sparks */}
      <svg className="smb-sparks" viewBox="-100 -100 200 200">
        <g fill="#dff0ff">
          {[...Array(8)].map((_, i) => (
            <path
              key={i}
              d="M0 -78 L5 -64 L0 -50 L-5 -64 Z"
              transform={`rotate(${i * 45})`}
            />
          ))}
        </g>
      </svg>

      {/* Smash-emblem-style burst — circle crossed by a diagonal slash */}
      <svg className="smb-emblem" viewBox="-60 -60 120 120">
        <circle cx="0" cy="0" r="46" fill="none" stroke="#eaf4ff" strokeWidth="8" />
        <circle cx="0" cy="0" r="46" fill="rgba(60, 130, 230, 0.25)" />
        {/* the crossing slash — two prongs */}
        <g fill="#eaf4ff" stroke="#9fc6ff" strokeWidth="1.5" strokeLinejoin="round">
          <path d="M-44 -10 L-6 -48 L12 -30 L-26 8 Z" />
          <path d="M44 10 L6 48 L-12 30 L26 -8 Z" />
          <path d="M-6 -48 L12 -30 L0 -18 L-18 -36 Z" />
        </g>
        {/* central core glow */}
        <circle className="smb-core" cx="0" cy="0" r="10" fill="#ffffff" />
      </svg>

      {/* Crossover comets streaking past */}
      <div className="smb-comet smb-comet-1" />
      <div className="smb-comet smb-comet-2" />
      <div className="smb-comet smb-comet-3" />

      {/* Central bloom */}
      <div className="smb-bloom" />
    </div>
  );
}
