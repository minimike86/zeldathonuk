import { describe, it, expect } from 'vitest';
import { derivePlaythroughPhase, phaseKey } from './playthroughMachine';

/* eslint-disable @typescript-eslint/no-explicit-any */
const entry = (over: Record<string, unknown> = {}): any => ({
  id: 1,
  is_completed: false,
  was_skipped: false,
  timer: null,
  setpieces: [],
  ...over,
});
const cp = (detail: unknown): any => ({ schedule_entry_detail: detail });

describe('derivePlaythroughPhase', () => {
  it('queued when nothing is playing', () => {
    expect(derivePlaythroughPhase(null, [])).toEqual({ state: 'queued' });
    expect(derivePlaythroughPhase(cp(null), [])).toEqual({ state: 'queued' });
  });

  it('completed / skipped', () => {
    expect(derivePlaythroughPhase(cp(entry({ is_completed: true })), []).state).toBe('completed');
    expect(
      derivePlaythroughPhase(cp(entry({ is_completed: true, was_skipped: true })), []).state,
    ).toBe('skipped');
  });

  it('break when an active child entry exists', () => {
    const e = entry();
    const child = { id: 9, parent_entry: 1, started_at: 't', finished_at: null } as any;
    const p = derivePlaythroughPhase(cp(e), [child]);
    expect(p.state).toBe('break');
  });

  it('paused / live(nominal) / preroll by timer state', () => {
    expect(
      derivePlaythroughPhase(cp(entry({ timer: { paused_at: 't', started_at: 't', ended_at: null } })), []).state,
    ).toBe('paused');
    expect(
      derivePlaythroughPhase(cp(entry({ timer: { paused_at: null, started_at: 't', ended_at: null } })), []).state,
    ).toBe('live');
    expect(derivePlaythroughPhase(cp(entry({ timer: null })), []).state).toBe('preroll');
  });

  it('live sub reflects the top setpiece stage', () => {
    const live = (stage: string) =>
      derivePlaythroughPhase(
        cp(entry({
          timer: { paused_at: null, started_at: 't', ended_at: null },
          setpieces: [{ kind: 'boss', name: 'Ganon', stage, priority: 0 }],
        })),
        [],
      );
    expect((live('imminent') as any).sub.kind).toBe('setpiece-imminent');
    expect((live('active') as any).sub.kind).toBe('setpiece-active');
    expect((live('cleared') as any).sub.kind).toBe('nominal');
  });
});

describe('phaseKey', () => {
  it('produces a stable identity per state', () => {
    const e = entry();
    expect(phaseKey({ state: 'queued' } as any)).toBe('queued');
    expect(phaseKey({ state: 'preroll', entry: e } as any)).toBe('preroll:1');
    expect(phaseKey({ state: 'paused', entry: e } as any)).toBe('paused:1');
    expect(phaseKey({ state: 'completed', entry: e } as any)).toBe('completed:1');
    expect(phaseKey({ state: 'skipped', entry: e } as any)).toBe('skipped:1');
    expect(phaseKey({ state: 'live', entry: e, sub: { kind: 'nominal' } } as any)).toBe('live:1:nominal');
    expect(phaseKey({ state: 'break', entry: e, child: { id: 9 } } as any)).toBe('break:1:9');
  });
});
