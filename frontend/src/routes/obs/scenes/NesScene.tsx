/**
 * Original Legend of Zelda scene — top-down forest tile motif with the
 * triforce centred.
 */
export function NesScene() {
  return (
    <div className="nes-scene" aria-hidden="true">
      <div className="nes-tiles" />
      <svg className="nes-triforce" viewBox="-60 -55 120 110">
        <g fill="#ffd23a" stroke="#7a5a08" strokeWidth="1.5">
          <path d="M-30 30 L0 -22 L30 30 Z" opacity="0.18" />
          <path d="M-30 30 L-15 5 L0 30 Z" />
          <path d="M0 30 L15 5 L30 30 Z" />
          <path d="M-15 5 L0 -22 L15 5 Z" />
        </g>
      </svg>
    </div>
  );
}
