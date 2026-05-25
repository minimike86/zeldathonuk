import { useEffect, useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { ScheduleEntry } from '@/lib/obsApi';

/**
 * Timer control. Targets the schedule entry that's currently set as
 * "Currently Playing". Falls back to entry picker if none is set.
 */
export function TimerControl() {
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, 1500);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 500);
    return () => window.clearInterval(id);
  }, []);

  const entry = cp?.schedule_entry_detail ?? null;

  const run = async (fn: () => Promise<unknown>) => {
    setErr(null);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!entry) {
    return (
      <div className="control-card">
        <h2>Timer</h2>
        <p className="text-warning">
          No game is currently set as "Currently Playing". Pick one in{' '}
          <a className="text-warning" href="/control/schedule">
            Schedule
          </a>{' '}
          first.
        </p>
      </div>
    );
  }

  const t = entry.timer;
  const displaySeconds = computeTimerSeconds(t, tick);

  return (
    <div className="control-card">
      <h2>Timer</h2>
      <p>
        Tracking:{' '}
        <strong>{entry.game.title}</strong>{' '}
        <span className="text-white-50">
          ({entry.game.platform}
          {entry.game.release_year ? ` · ${entry.game.release_year}` : ''})
        </span>
      </p>

      <div
        style={{
          fontFamily: "'VT323', monospace",
          fontSize: '6rem',
          textAlign: 'center',
          lineHeight: 1,
          color: t?.is_running ? '#7fff7f' : t?.paused_at ? '#ffcc00' : '#fff',
          textShadow: '0 0 20px rgba(231, 19, 71, 0.6)',
          margin: '1.5rem 0',
        }}
      >
        {formatHms(displaySeconds)}
      </div>

      <div className="control-btn-row" style={{ justifyContent: 'center' }}>
        <button
          className="btn btn-success"
          disabled={busy || t?.is_running}
          onClick={() => run(() => obsApi.startTimer(entry.id))}
        >
          ▶ Start
        </button>
        <button
          className="btn btn-warning"
          disabled={busy || !t?.is_running}
          onClick={() => run(() => obsApi.pauseTimer(entry.id))}
        >
          ⏸ Pause
        </button>
        <button
          className="btn btn-secondary"
          disabled={busy}
          onClick={() => run(() => obsApi.resetTimer(entry.id))}
        >
          ⟲ Reset
        </button>
        <button
          className="btn btn-danger"
          disabled={busy}
          onClick={() => {
            if (!confirm('Stop the timer? This marks the run as completed.')) return;
            void run(() => obsApi.stopTimer(entry.id));
          }}
        >
          ⏹ Stop & save
        </button>
      </div>

      {err && <p className="text-danger mt-3">{err}</p>}

      <div className="mt-4 small text-white-50">
        Estimated run time: <strong>{entry.effective_minutes} min</strong>{' '}
        {entry.is_completed && <span className="badge bg-success ms-2">COMPLETED</span>}
      </div>
    </div>
  );
}

function computeTimerSeconds(
  timer: ScheduleEntry['timer'],
  _tick: number,
): number {
  if (!timer) return 0;
  if (timer.is_running && timer.started_at) {
    const startedMs = Date.parse(timer.started_at);
    return (
      timer.accumulated_seconds +
      Math.max(0, Math.floor((Date.now() - startedMs) / 1000))
    );
  }
  return timer.accumulated_seconds;
}

function formatHms(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
