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
      return { kind: 'suspended' };
    case 'RESUME':
      if (a.mode === 'pinned' && a.panelId) return { kind: 'pinned', panelId: a.panelId };
      return { kind: 'rotating', index: 0 };
    case 'TAKEOVER':
      return { kind: 'takeover', panelId: a.panelId };
    case 'RELEASE_TAKEOVER':
      if (s.kind === 'takeover') return { kind: 'rotating', index: 0 };
      return s;
  }
}
