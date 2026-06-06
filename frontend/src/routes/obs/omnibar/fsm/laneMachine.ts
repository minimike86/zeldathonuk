/**
 * Lane FSM. Each lane (top, bottom) owns one of these.
 *
 *   rotating  — cycling through its configured panel list
 *   pinned    — single panel held indefinitely
 *   suspended — OmnibarFSM has taken over (urgent/celebrating); panels
 *               frozen + dimmed
 *   takeover  — a single high-priority panel locked open (e.g. urgent
 *               banner). Outranks rotating + pinned.
 */

export type LaneState =
  | { kind: 'rotating'; index: number }
  | { kind: 'pinned'; panelId: string }
  | { kind: 'suspended' }
  | { kind: 'takeover'; panelId: string };

export type LaneAction =
  | { type: 'TICK' }
  | { type: 'SUSPEND' }
  | { type: 'RESUME'; mode: 'rotating' | 'pinned'; panelId?: string }
  | { type: 'TAKEOVER'; panelId: string }
  | { type: 'RELEASE_TAKEOVER' };

export function laneReducer(
  s: LaneState,
  a: LaneAction,
  ctx: { rotationLength: number },
): LaneState {
  switch (a.type) {
    case 'TICK':
      if (s.kind !== 'rotating') return s;
      if (ctx.rotationLength === 0) return s;
      return { kind: 'rotating', index: (s.index + 1) % ctx.rotationLength };
    case 'SUSPEND':
      if (s.kind === 'suspended') return s;
      return { kind: 'suspended' };
    case 'RESUME':
      // Pinned target: switch immediately (or no-op if already pinned
      // to the same panel).
      if (a.mode === 'pinned' && a.panelId) {
        if (s.kind === 'pinned' && s.panelId === a.panelId) return s;
        return { kind: 'pinned', panelId: a.panelId };
      }
      // Rotating target: preserve current index when we're ALREADY
      // rotating. Previously this always reset to 0, which meant any
      // upstream re-render that re-fired the RESUME effect (e.g. a
      // poll producing a fresh config.panels reference) would yank
      // the lane back to the first panel mid-cycle.
      if (s.kind === 'rotating') return s;
      return { kind: 'rotating', index: 0 };
    case 'TAKEOVER':
      return { kind: 'takeover', panelId: a.panelId };
    case 'RELEASE_TAKEOVER':
      if (s.kind === 'takeover') return { kind: 'rotating', index: 0 };
      return s;
  }
}
