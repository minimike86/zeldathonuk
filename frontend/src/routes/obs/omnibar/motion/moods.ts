/**
 * Named animation/lighting presets any panel can opt into. Built as a
 * registry (rather than an enum) so adding a new mood is "create a CSS
 * class + register a mood entry" — no rotator/orchestrator changes.
 *
 * Each mood maps to a CSS class (defined in moods.css) plus optional
 * fanfare audio. The omnibar root applies one mood class to its root
 * element while the OmnibarFSM is in a state that wants the mood
 * (urgent / celebrating). Individual panels can also opt into a mood
 * by adding the class to their root row.
 */

export interface Mood {
  id: string;
  className: string;
  durationMs: number;
  /** Optional fanfare audio. The omnibar plays this once when the
   *  mood becomes active; it's the responsibility of the caller to
   *  not re-trigger on every poll tick. */
  audioUrl?: string;
}

const REGISTRY = new Map<string, Mood>();

export function registerMood(mood: Mood): void {
  REGISTRY.set(mood.id, mood);
}

export function getMood(id: string): Mood | undefined {
  return REGISTRY.get(id);
}

export function listMoods(): Mood[] {
  return Array.from(REGISTRY.values());
}

// ── Built-in moods ────────────────────────────────────────────────────

registerMood({ id: 'celebrate', className: 'mood--celebrate', durationMs: 2400 });
registerMood({ id: 'urgent',    className: 'mood--urgent',    durationMs: 4000 });
registerMood({ id: 'ominous',   className: 'mood--ominous',   durationMs: 8000 });
registerMood({ id: 'cheer',     className: 'mood--cheer',     durationMs: 2000 });
