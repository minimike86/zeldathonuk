import { useMemo } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { ScheduleEntry } from '@/lib/obsApi';
import './schedule.css';

interface SlotMeta {
  label: string;
  icon: string;
}

const BREAK_META: Record<string, SlotMeta> = {
  start: { label: 'Stream start', icon: '🎬' },
  meal: { label: 'Meal break', icon: '🍽' },
  sleep: { label: 'Sleep break', icon: '💤' },
  break: { label: 'Break', icon: '☕' },
  end: { label: 'Stream end', icon: '🏁' },
};

interface Row {
  entry: ScheduleEntry;
  start: Date;
  end: Date;
  children: ScheduleEntry[];
}

export function Schedule() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 30_000);
  const { data: schedule } = usePolledQuery(
    () => (event ? obsApi.schedule(event.id) : Promise.resolve([] as ScheduleEntry[])),
    10_000,
    [event?.id],
  );
  const { data: currentlyPlaying } = usePolledQuery(obsApi.currentlyPlaying, 5000);
  const currentEntryId = currentlyPlaying?.schedule_entry ?? null;

  const rows = useMemo<Row[]>(() => {
    if (!event || !schedule) return [];
    const eventStart = new Date(event.start_time).getTime();
    const all = [...schedule];
    const topLevel = all
      .filter((e) => e.parent_entry == null)
      .sort((a, b) => a.order - b.order);
    const childrenByParent = new Map<number, ScheduleEntry[]>();
    for (const e of all) {
      if (e.parent_entry != null) {
        const arr = childrenByParent.get(e.parent_entry) ?? [];
        arr.push(e);
        childrenByParent.set(e.parent_entry, arr);
      }
    }
    for (const arr of childrenByParent.values()) {
      arr.sort((a, b) => a.start_offset_minutes - b.start_offset_minutes);
    }

    const out: Row[] = [];
    let cursor = eventStart;
    for (const top of topLevel) {
      const start = new Date(cursor);
      const children = childrenByParent.get(top.id) ?? [];
      const childMinutes = children.reduce((s, c) => s + c.effective_minutes, 0);
      const end = new Date(cursor + (top.effective_minutes + childMinutes) * 60_000);
      // Attached breaks aren't separate rows — they only surface as a live
      // banner inside the currently-playing row when their wall-clock window
      // has arrived. Stash them on the row so the renderer can find them.
      out.push({ entry: top, start, end, children });
      cursor = end.getTime();
    }
    return out;
  }, [event, schedule]);

  const totalMinutes = (schedule ?? []).reduce((s, e) => s + e.effective_minutes, 0);
  const eventEnd = event
    ? new Date(new Date(event.start_time).getTime() + totalMinutes * 60_000)
    : null;

  return (
    <div className="container p-3 min-vh-100 text-white text-center">
      <div className="my-3">
        <div className="mb-4">
          <h1 className="text-bloodmoon">Stream Schedule</h1>
          {event ? (
            <p className="text-light mt-2 mb-0">
              <strong>{event.name}</strong> · {fmtDateTime(new Date(event.start_time))}
              {eventEnd && (
                <>
                  {' '}→ {fmtDateTime(eventEnd)} · {fmtDuration(totalMinutes)} total
                </>
              )}
            </p>
          ) : (
            <p className="text-light mt-2 mb-0">
              No event is currently scheduled. Check back closer to the next stream.
            </p>
          )}
        </div>

        {rows.length === 0 ? (
          <p className="text-white-50">No games on the schedule yet.</p>
        ) : (
          <div className="table-responsive">
            <table
              className="table bg-bloodmoon text-white align-middle"
              style={{ fontSize: 13 }}
            >
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Time</th>
                  <th scope="col">
                    <div className="d-none d-md-block">Platform</div>
                  </th>
                  <th scope="col">Game</th>
                  <th scope="col">
                    <div className="d-none d-md-block">Runner(s)</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const { entry, start, end, children } = row;
                  const isPlaying = currentEntryId === entry.id;
                  const isCompleted = entry.is_completed;
                  const rowClass = isPlaying
                    ? 'table-currently-playing'
                    : isCompleted
                      ? 'table-played'
                      : '';
                  // Attached break currently in progress for the live game?
                  // Anchor break windows to the entry's real `started_at` if
                  // set, else fall back to the scheduled start.
                  const liveBreak =
                    isPlaying && children.length > 0
                      ? findActiveBreak(
                          children,
                          entry.started_at ? new Date(entry.started_at) : start,
                        )
                      : null;
                  return (
                    <tr key={entry.id} className={rowClass}>
                      <td className="align-middle">
                        <div>{start.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit' })}</div>
                        <div className="text-white-50">
                          {start.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="align-middle">
                        <div>{fmtTime(start)}</div>
                        <div className="text-white-50">→ {fmtTime(end)}</div>
                      </td>
                      <td className="align-middle text-center">
                        <div className="d-none d-md-block">
                          {entry.game ? (
                            <span className="badge rounded-pill bg-secondary p-2">
                              {entry.game.platform}
                            </span>
                          ) : (
                            <span className="text-white-50">—</span>
                          )}
                        </div>
                      </td>
                      <td className="align-middle">
                        <div className="d-flex justify-content-center align-items-center gap-2 flex-wrap">
                          {entry.game?.box_art_url && (
                            <img
                              src={entry.game.box_art_url}
                              alt={`${entry.display_title} cover art`}
                              title={`${entry.display_title} cover art`}
                              style={{ maxWidth: 50, borderRadius: 3 }}
                            />
                          )}
                          <div className="text-center">
                            <div>
                              {entry.display_title}
                              {entry.game?.release_year && (
                                <span className="text-white-50">
                                  {' '}
                                  ({entry.game.release_year})
                                </span>
                              )}
                            </div>
                            {isCompleted && (
                              <div className="d-flex justify-content-center">
                                <div className="rounded-pill bg-dark mt-1 px-3 small">
                                  COMPLETED
                                </div>
                              </div>
                            )}
                            {isPlaying && !liveBreak && (
                              <div className="d-inline-block mt-1">
                                <a
                                  className="badge bg-light text-dark fw-bold p-2 px-3"
                                  href="https://www.twitch.tv/zeldathonuk"
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Watch Livestream"
                                >
                                  LIVE NOW!{' '}
                                  <span style={{ color: 'red' }}>
                                    <span className="d-inline-block live-circle ms-1" />
                                  </span>
                                </a>
                              </div>
                            )}
                            {liveBreak && (
                              <div className="schedule-break-banner mt-2">
                                <div className="schedule-break-icon">
                                  {BREAK_META[liveBreak.entry.slot_type]?.icon ?? '☕'}
                                </div>
                                <div className="text-start">
                                  <strong className="d-block">
                                    On a {(
                                      BREAK_META[liveBreak.entry.slot_type]?.label ?? 'break'
                                    ).toLowerCase()}
                                  </strong>
                                  <div className="small text-white-50">
                                    Back at <strong>{fmtTime(liveBreak.end)}</strong>{' '}
                                    ({fmtDuration(liveBreak.entry.effective_minutes)})
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="mt-1">
                              <span className="badge bg-light text-dark">
                                {fmtDuration(entry.effective_minutes)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="align-middle text-center">
                        <div className="d-none d-md-block">
                          {entry.runners.length === 0 ? (
                            <span className="text-white-50">—</span>
                          ) : (
                            entry.runners.map((r) =>
                              r.is_streamer && r.channel_url ? (
                                <a
                                  key={r.id}
                                  href={r.channel_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="d-inline-block"
                                >
                                  <span className="badge rounded-pill bg-secondary p-2 m-1">
                                    {r.name}
                                  </span>
                                </a>
                              ) : (
                                <span
                                  key={r.id}
                                  className="badge rounded-pill bg-secondary p-2 m-1"
                                >
                                  {r.name}
                                </span>
                              ),
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function findActiveBreak(
  children: ScheduleEntry[],
  parentStart: Date,
): { entry: ScheduleEntry; start: Date; end: Date } | null {
  const now = Date.now();
  for (const child of children) {
    const start = parentStart.getTime() + child.start_offset_minutes * 60_000;
    const end = start + child.effective_minutes * 60_000;
    if (now >= start && now < end) {
      return { entry: child, start: new Date(start), end: new Date(end) };
    }
  }
  return null;
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtDateTime(d: Date): string {
  return d.toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
