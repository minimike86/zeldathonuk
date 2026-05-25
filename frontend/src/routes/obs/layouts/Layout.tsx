/**
 * Shared layout primitives used by every game-layout OBS source.
 */
import { useEffect, useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { ScheduleEntry, TimerRun } from '@/lib/obsApi';

export function Stage({ children }: { children: React.ReactNode }) {
  return <div className="obs-stage">{children}</div>;
}

export function GameFrame({
  style,
  src,
}: {
  style: React.CSSProperties;
  src?: string | null;
}) {
  return (
    <div className="game-frame" style={style}>
      {src ? (
        <iframe
          src={src}
          title="game capture"
          style={{ width: '100%', height: '100%', border: 0 }}
          allowFullScreen
        />
      ) : (
        <div className="game-placeholder">
          <div>Game capture</div>
          <div style={{ fontSize: '0.7em', opacity: 0.7 }}>(set source in OBS)</div>
        </div>
      )}
    </div>
  );
}

export function SidePanel({
  position,
}: {
  position: { top?: string; left?: string; right?: string; bottom?: string; width: string; height?: string };
}) {
  const { data } = usePolledQuery(obsApi.currentlyPlaying, 2000);
  const entry = data?.schedule_entry_detail ?? null;
  return (
    <aside className="side-panel" style={position}>
      <GameDescription entry={entry} />
      <RunnerNames entry={entry} />
      <Camera />
      <Timer entry={entry} />
      <ItemsGrid entry={entry} />
    </aside>
  );
}

export function GameDescription({ entry }: { entry: ScheduleEntry | null }) {
  if (!entry) {
    return (
      <div className="panel-block">
        <div className="panel-block-title">Currently playing</div>
        <div className="text-white-50">No game selected.</div>
      </div>
    );
  }
  return (
    <div className="panel-block">
      <div className="panel-block-title">Currently playing</div>
      <div className="d-flex gap-2 align-items-center">
        {entry.game.box_art_url && (
          <img
            src={entry.game.box_art_url}
            alt={entry.game.title}
            style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4 }}
          />
        )}
        <div>
          <div style={{ fontWeight: 600 }}>{entry.game.title}</div>
          <div className="small text-white-50">
            {entry.game.platform}
            {entry.game.release_year ? ` · ${entry.game.release_year}` : ''}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RunnerNames({ entry }: { entry: ScheduleEntry | null }) {
  if (!entry || entry.runners.length === 0) {
    return (
      <div className="panel-block">
        <div className="panel-block-title">Runners</div>
        <div className="text-white-50">—</div>
      </div>
    );
  }
  return (
    <div className="panel-block">
      <div className="panel-block-title">Runners</div>
      <div className="panel-runners">
        {entry.runners.map((r) => r.name).join(' · ')}
      </div>
    </div>
  );
}

export function Camera() {
  return (
    <div className="panel-block">
      <div className="panel-block-title">Camera</div>
      <div className="panel-camera">CAMERA</div>
    </div>
  );
}

export function Timer({ entry }: { entry: ScheduleEntry | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);
  const seconds = computeTimerSeconds(entry?.timer ?? null, now);
  return (
    <div className="panel-block">
      <div className="panel-block-title">Run time</div>
      <div className="panel-timer">{formatHms(seconds)}</div>
    </div>
  );
}

/**
 * Per-game item checklist. Collected items glow, uncollected items show
 * grayed/faded. Mirrors the toggle state from /control/items so OBS viewers
 * see progress live.
 */
export function ItemsGrid({ entry }: { entry: ScheduleEntry | null }) {
  if (!entry) return null;
  const items = entry.game.items.slice().sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  if (items.length === 0) return null;
  const collected = new Set(entry.collected_item_ids);
  return (
    <div className="panel-block">
      <div className="panel-block-title">Items</div>
      <div className="obs-items-grid">
        {items.map((it) => (
          <div
            key={it.id}
            className="obs-item"
            data-collected={collected.has(it.id)}
            title={it.name}
          >
            {it.image_url ? (
              <img src={it.image_url} alt={it.name} />
            ) : (
              <span className="obs-item-fallback">{it.name.slice(0, 2)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function computeTimerSeconds(timer: TimerRun | null, now: number): number {
  if (!timer) return 0;
  if (timer.is_running && timer.started_at) {
    const startedMs = Date.parse(timer.started_at);
    return timer.accumulated_seconds + Math.max(0, Math.floor((now - startedMs) / 1000));
  }
  return timer.accumulated_seconds;
}

function formatHms(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
