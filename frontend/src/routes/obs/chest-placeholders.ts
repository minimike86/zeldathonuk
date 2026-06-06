/**
 * Data-URI placeholder sprite sheets for the ChestAnnouncer.
 *
 * Crude pixel-art SVGs that match the real sprite-sheet contract
 * (frame count, frame dimensions, sheet layout) so the route works
 * end-to-end before real PNG art lands. When the artist drops PNGs into
 * `/assets/img/chest-announcer/` flip the `USE_REAL_SPRITES` constant in
 * ChestAnnouncer.tsx and these placeholders fall out.
 *
 * Each sheet: single horizontal row, transparent background, 32×32 frames,
 * shape-rendering="crispEdges" so the data-URI renders sharp pixels.
 *
 * Palette (matches NES HUD / Z2 / Oracle scenes — keeps the placeholder
 * art in the same visual register as the rest of the site):
 *   hat / tunic dark   #1f4d1f
 *   tunic light        #3a8a3a
 *   skin               #fcbcb0
 *   eye / outline      #000000
 *   belt / boot        #3a1a0a
 *   buckle             #fcd078
 *   chest body         #7a4a1a
 *   chest dark         #4a2a0a
 *   chest band         #fcd078
 *   chest glow         #fff3a0
 */

const PREFIX = 'data:image/svg+xml;utf8,';
function dataUri(svg: string): string {
  return PREFIX + encodeURIComponent(svg);
}

// ── Hero pieces (re-used across frames so all 4 walk frames look like
// the same character). Body bob and leg positions vary per frame; the
// torso, head and arms are the constants. ──────────────────────────────

function hero(opts: {
  x: number;
  bobY?: number;            // vertical offset for body bob (0/-1/-2…)
  legs: 'together' | 'leftFwd' | 'rightFwd' | 'apartWide';
  armL?: 'down' | 'reach' | 'up' | 'reachDeep';
  armR?: 'down' | 'reach' | 'up' | 'reachDeep';
  smile?: boolean;          // joyful expression for the hold frame
}): string {
  const { x, bobY = 0, legs, armL = 'down', armR = 'down', smile = false } = opts;
  const dy = bobY;

  // Head + tunic stay put across walk frames (only legs/arms vary).
  const head = `
    <rect x="${x + 11}" y="${3 + dy}" width="10" height="3" fill="#1f4d1f"/>
    <rect x="${x + 9}" y="${6 + dy}" width="14" height="2" fill="#1f4d1f"/>
    <rect x="${x + 9}" y="${8 + dy}" width="14" height="1" fill="#3a8a3a"/>
    <rect x="${x + 11}" y="${9 + dy}" width="10" height="5" fill="#fcbcb0"/>
    <rect x="${x + 14}" y="${11 + dy}" width="1" height="1" fill="#000"/>
    <rect x="${x + 17}" y="${11 + dy}" width="1" height="1" fill="#000"/>
    ${smile
      ? `<rect x="${x + 14}" y="${13 + dy}" width="4" height="1" fill="#000"/>`
      : `<rect x="${x + 15}" y="${13 + dy}" width="2" height="1" fill="#000"/>`}
  `;
  const torso = `
    <rect x="${x + 9}" y="${14 + dy}" width="14" height="8" fill="#3a8a3a"/>
    <rect x="${x + 9}" y="${21 + dy}" width="14" height="2" fill="#5a3a1a"/>
    <rect x="${x + 15}" y="${21 + dy}" width="2" height="2" fill="#fcd078"/>
  `;

  // Arms — `down` is along the torso, `reach` is extended right, `up` is
  // overhead, `reachDeep` is plunged forward into the chest.
  const armPos = (which: 'L' | 'R', kind: 'down' | 'reach' | 'up' | 'reachDeep') => {
    if (kind === 'down') {
      const ax = which === 'L' ? x + 7 : x + 23;
      return `<rect x="${ax}" y="${14 + dy}" width="2" height="7" fill="#fcbcb0"/>`;
    }
    if (kind === 'up') {
      const ax = which === 'L' ? x + 8 : x + 22;
      return `
        <rect x="${ax}" y="${5 + dy}" width="2" height="9" fill="#fcbcb0"/>
        <rect x="${ax - 1}" y="${3 + dy}" width="4" height="3" fill="#fcd078"/>
      `;
    }
    if (kind === 'reach') {
      return `<rect x="${x + 23}" y="${15 + dy}" width="6" height="2" fill="#fcbcb0"/>`;
    }
    // reachDeep
    return `<rect x="${x + 23}" y="${17 + dy}" width="8" height="2" fill="#fcbcb0"/>`;
  };
  const arms = `${armPos('L', armL)}${armPos('R', armR)}`;

  // Legs — paired rectangles with boots; layout shifts per frame to fake a
  // walk cycle. `apartWide` is the pose used for the held/up frame so the
  // hero looks balanced.
  let legBlock = '';
  if (legs === 'together') {
    legBlock = `
      <rect x="${x + 11}" y="${23 + dy}" width="4" height="6" fill="#3a8a3a"/>
      <rect x="${x + 17}" y="${23 + dy}" width="4" height="6" fill="#3a8a3a"/>
      <rect x="${x + 11}" y="${29 + dy}" width="4" height="2" fill="#3a1a0a"/>
      <rect x="${x + 17}" y="${29 + dy}" width="4" height="2" fill="#3a1a0a"/>
    `;
  } else if (legs === 'leftFwd') {
    legBlock = `
      <rect x="${x + 9}" y="${23 + dy}" width="4" height="6" fill="#3a8a3a"/>
      <rect x="${x + 19}" y="${23 + dy}" width="4" height="6" fill="#3a8a3a"/>
      <rect x="${x + 8}" y="${29 + dy}" width="5" height="2" fill="#3a1a0a"/>
      <rect x="${x + 19}" y="${29 + dy}" width="5" height="2" fill="#3a1a0a"/>
    `;
  } else if (legs === 'rightFwd') {
    legBlock = `
      <rect x="${x + 19}" y="${23 + dy}" width="4" height="6" fill="#3a8a3a"/>
      <rect x="${x + 9}" y="${23 + dy}" width="4" height="6" fill="#3a8a3a"/>
      <rect x="${x + 19}" y="${29 + dy}" width="5" height="2" fill="#3a1a0a"/>
      <rect x="${x + 8}" y="${29 + dy}" width="5" height="2" fill="#3a1a0a"/>
    `;
  } else {
    // apartWide
    legBlock = `
      <rect x="${x + 10}" y="${23 + dy}" width="4" height="6" fill="#3a8a3a"/>
      <rect x="${x + 18}" y="${23 + dy}" width="4" height="6" fill="#3a8a3a"/>
      <rect x="${x + 9}" y="${29 + dy}" width="5" height="2" fill="#3a1a0a"/>
      <rect x="${x + 18}" y="${29 + dy}" width="5" height="2" fill="#3a1a0a"/>
    `;
  }

  return `${legBlock}${torso}${arms}${head}`;
}

// ── Chest pieces. ──────────────────────────────────────────────────────

function chestFrame(opts: {
  x: number;
  lid: 'closed' | 'tilt30' | 'tilt60' | 'open';
}): string {
  const { x, lid } = opts;
  const body = `
    <rect x="${x + 5}" y="20" width="22" height="11" fill="#7a4a1a"/>
    <rect x="${x + 5}" y="20" width="22" height="1" fill="#4a2a0a"/>
    <rect x="${x + 5}" y="30" width="22" height="1" fill="#4a2a0a"/>
    <rect x="${x + 5}" y="20" width="1" height="11" fill="#4a2a0a"/>
    <rect x="${x + 26}" y="20" width="1" height="11" fill="#4a2a0a"/>
    <rect x="${x + 14}" y="24" width="4" height="3" fill="#fcd078"/>
    <rect x="${x + 15}" y="25" width="2" height="1" fill="#4a2a0a"/>
  `;

  let lidShape = '';
  if (lid === 'closed') {
    lidShape = `
      <rect x="${x + 5}" y="15" width="22" height="5" fill="#7a4a1a"/>
      <rect x="${x + 5}" y="15" width="22" height="1" fill="#4a2a0a"/>
      <rect x="${x + 5}" y="19" width="22" height="1" fill="#fcd078"/>
      <rect x="${x + 5}" y="15" width="1" height="5" fill="#4a2a0a"/>
      <rect x="${x + 26}" y="15" width="1" height="5" fill="#4a2a0a"/>
    `;
  } else if (lid === 'tilt30') {
    lidShape = `
      <rect x="${x + 5}" y="11" width="22" height="2" fill="#7a4a1a"/>
      <rect x="${x + 6}" y="13" width="20" height="2" fill="#7a4a1a"/>
      <rect x="${x + 7}" y="15" width="18" height="2" fill="#7a4a1a"/>
      <rect x="${x + 5}" y="17" width="22" height="2" fill="#fcd078"/>
    `;
  } else if (lid === 'tilt60') {
    lidShape = `
      <rect x="${x + 8}" y="7" width="16" height="2" fill="#7a4a1a"/>
      <rect x="${x + 7}" y="9" width="18" height="2" fill="#7a4a1a"/>
      <rect x="${x + 6}" y="11" width="20" height="2" fill="#7a4a1a"/>
      <rect x="${x + 5}" y="13" width="22" height="2" fill="#7a4a1a"/>
      <rect x="${x + 5}" y="17" width="22" height="2" fill="#fcd078"/>
      <ellipse cx="${x + 16}" cy="22" rx="9" ry="2" fill="#fff3a0" opacity="0.5"/>
    `;
  } else {
    // open
    lidShape = `
      <rect x="${x + 5}" y="5" width="22" height="2" fill="#7a4a1a"/>
      <rect x="${x + 5}" y="7" width="22" height="2" fill="#7a4a1a"/>
      <rect x="${x + 5}" y="9" width="22" height="2" fill="#7a4a1a"/>
      <rect x="${x + 5}" y="11" width="22" height="2" fill="#fcd078"/>
      <ellipse cx="${x + 16}" cy="20" rx="11" ry="3" fill="#fff3a0" opacity="0.7"/>
      <rect x="${x + 12}" y="19" width="2" height="1" fill="#fff3a0"/>
      <rect x="${x + 18}" y="19" width="2" height="1" fill="#fff3a0"/>
    `;
  }
  return `${body}${lidShape}`;
}

// ── Assembled sheets. ──────────────────────────────────────────────────

const HERO_WALK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="32" viewBox="0 0 128 32" shape-rendering="crispEdges">
${hero({ x: 0, legs: 'together' })}
${hero({ x: 32, bobY: -1, legs: 'leftFwd' })}
${hero({ x: 64, legs: 'together' })}
${hero({ x: 96, bobY: -1, legs: 'rightFwd' })}
</svg>`;

const HERO_IDLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32" viewBox="0 0 64 32" shape-rendering="crispEdges">
${hero({ x: 0, legs: 'together' })}
${hero({ x: 32, bobY: -1, legs: 'together' })}
</svg>`;

const HERO_REACH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32" viewBox="0 0 64 32" shape-rendering="crispEdges">
${hero({ x: 0, legs: 'together', armR: 'reach' })}
${hero({ x: 32, legs: 'together', armR: 'reachDeep' })}
</svg>`;

const HERO_HOLD_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges">
${hero({ x: 0, legs: 'apartWide', armL: 'up', armR: 'up', smile: true })}
</svg>`;

const CHEST_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="32" viewBox="0 0 128 32" shape-rendering="crispEdges">
${chestFrame({ x: 0, lid: 'closed' })}
${chestFrame({ x: 32, lid: 'tilt30' })}
${chestFrame({ x: 64, lid: 'tilt60' })}
${chestFrame({ x: 96, lid: 'open' })}
</svg>`;

export const HERO_WALK_SRC = dataUri(HERO_WALK_SVG);
export const HERO_IDLE_SRC = dataUri(HERO_IDLE_SVG);
export const HERO_REACH_SRC = dataUri(HERO_REACH_SVG);
export const HERO_HOLD_SRC = dataUri(HERO_HOLD_SVG);
export const CHEST_SRC = dataUri(CHEST_SVG);
