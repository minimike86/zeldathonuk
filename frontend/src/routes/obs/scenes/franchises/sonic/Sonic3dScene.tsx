import './sonic.css';

/**
 * Sonic 3D Blast — an isometric Flicky island floating in a soft green sky.
 * Diamond-tile ground plane in receding iso perspective, gentle rounded
 * hills, a ring loop, and little blue Flicky birds fluttering overhead.
 *
 * `.s3d-` namespace.
 */
export function Sonic3dScene() {
  return (
    <div className="s3d-scene" aria-hidden="true">
      {/* Soft cloud band */}
      <div className="s3d-clouds" />

      {/* The isometric island floating on a rocky base */}
      <svg className="s3d-island" viewBox="0 0 600 420">
        {/* rocky underside */}
        <path d="M120 250 L300 200 L480 250 L420 340 Q300 400 180 340 Z" fill="#6e4a2c" />
        <path d="M120 250 L300 200 L300 250 L180 300 Z" fill="#8a5e36" opacity="0.6" />

        {/* iso top plane (diamond) */}
        <path d="M300 120 L520 240 L300 360 L80 240 Z" fill="#4fbf5e" />
        {/* iso tile grid */}
        <g stroke="#2f9a44" strokeWidth="2" opacity="0.55">
          <path d="M190 180 L410 300" />
          <path d="M245 150 L465 270" />
          <path d="M135 210 L355 330" />
          <path d="M410 180 L190 300" />
          <path d="M355 150 L135 270" />
          <path d="M465 210 L245 330" />
        </g>
        {/* grassy top highlight */}
        <path d="M300 120 L520 240 L300 250 L80 240 Z" fill="#62d873" opacity="0.5" />

        {/* little rounded hill on the plane */}
        <ellipse cx="360" cy="232" rx="58" ry="34" fill="#3aa84e" />
        <ellipse cx="360" cy="224" rx="58" ry="30" fill="#54c668" />

        {/* a small ring loop standing on the tiles */}
        <ellipse cx="220" cy="250" rx="22" ry="40" fill="none" stroke="#caa24a" strokeWidth="10" transform="rotate(-20 220 250)" />

        {/* flower dots scattered on the grass */}
        <g fill="#ffd23a">
          <circle cx="280" cy="270" r="4" />
          <circle cx="330" cy="290" r="4" />
          <circle cx="250" cy="300" r="4" />
          <circle cx="400" cy="270" r="4" />
        </g>
      </svg>

      {/* Fluttering Flicky birds */}
      <svg className="s3d-flicky s3d-flicky-1" viewBox="0 0 40 32">
        <ellipse cx="20" cy="18" rx="12" ry="10" fill="#2f7ce0" />
        <circle cx="28" cy="12" r="7" fill="#2f7ce0" />
        <circle cx="30" cy="11" r="1.6" fill="#0a1a2c" />
        <path d="M33 12 L40 10 L34 15 Z" fill="#f5a623" />
        <path className="s3d-wing" d="M16 16 Q4 8 6 20 Q12 18 16 18 Z" fill="#1f5fc0" />
        <ellipse cx="14" cy="26" rx="6" ry="3" fill="#ffffff" />
      </svg>
      <svg className="s3d-flicky s3d-flicky-2" viewBox="0 0 40 32">
        <ellipse cx="20" cy="18" rx="12" ry="10" fill="#3a8cf0" />
        <circle cx="28" cy="12" r="7" fill="#3a8cf0" />
        <circle cx="30" cy="11" r="1.6" fill="#0a1a2c" />
        <path d="M33 12 L40 10 L34 15 Z" fill="#f5a623" />
        <path className="s3d-wing" d="M16 16 Q4 8 6 20 Q12 18 16 18 Z" fill="#2a6fd0" />
        <ellipse cx="14" cy="26" rx="6" ry="3" fill="#ffffff" />
      </svg>
      <svg className="s3d-flicky s3d-flicky-3" viewBox="0 0 40 32">
        <ellipse cx="20" cy="18" rx="12" ry="10" fill="#2f7ce0" />
        <circle cx="28" cy="12" r="7" fill="#2f7ce0" />
        <circle cx="30" cy="11" r="1.6" fill="#0a1a2c" />
        <path d="M33 12 L40 10 L34 15 Z" fill="#f5a623" />
        <path className="s3d-wing" d="M16 16 Q4 8 6 20 Q12 18 16 18 Z" fill="#1f5fc0" />
        <ellipse cx="14" cy="26" rx="6" ry="3" fill="#ffffff" />
      </svg>
    </div>
  );
}
