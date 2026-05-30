import { useMemo } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { EventModel, ScheduleEntry } from '@/lib/obsApi';
import { useAccentDeck } from '@/lib/accentDeck';
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
  other: { label: 'Other', icon: '⭐' },
};

interface Slot {
  entry: ScheduleEntry;
  start: Date;
  end: Date;
  children: ScheduleEntry[];
}

interface DaySlot {
  slot: Slot;
  /**
   * True when this card represents a slot that started on a previous day
   * but is still actively running into the current day. The actual playable
   * card has migrated to today's group; this stays behind as a faded
   * placeholder so visitors can see the slot began on the prior date.
   */
  isGhost: boolean;
}

interface DayGroup {
  dayKey: string;
  dayLabel: string;
  dateLabel: string;
  slots: DaySlot[];
}

function dayKeyOf(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function parseDayKey(key: string): number {
  const [y, m, d] = key.split('-').map((n) => parseInt(n, 10));
  return new Date(y, m, d).getTime();
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

  const slots = useMemo<Slot[]>(() => {
    if (!event || !schedule) return [];
    const eventStart = new Date(event.start_time).getTime();
    const topLevel = [...schedule]
      .filter((e) => e.parent_entry == null)
      .sort((a, b) => a.order - b.order);
    const childrenByParent = new Map<number, ScheduleEntry[]>();
    for (const e of schedule) {
      if (e.parent_entry != null) {
        const arr = childrenByParent.get(e.parent_entry) ?? [];
        arr.push(e);
        childrenByParent.set(e.parent_entry, arr);
      }
    }
    for (const arr of childrenByParent.values()) {
      arr.sort((a, b) => a.start_offset_minutes - b.start_offset_minutes);
    }
    const out: Slot[] = [];
    let cursor = eventStart;
    for (const top of topLevel) {
      const start = new Date(cursor);
      const children = childrenByParent.get(top.id) ?? [];
      const childMinutes = children.reduce((s, c) => s + c.effective_minutes, 0);
      const end = new Date(cursor + (top.effective_minutes + childMinutes) * 60_000);
      out.push({ entry: top, start, end, children });
      cursor = end.getTime();
    }
    return out;
  }, [event, schedule]);

  const days = useMemo<DayGroup[]>(() => {
    const groups = new Map<string, DayGroup>();
    const ensure = (d: Date): DayGroup => {
      const key = dayKeyOf(d);
      let group = groups.get(key);
      if (!group) {
        group = {
          dayKey: key,
          dayLabel: d.toLocaleDateString('en-GB', { weekday: 'long' }),
          dateLabel: d.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          }),
          slots: [],
        };
        groups.set(key, group);
      }
      return group;
    };

    const now = new Date();
    const nowKey = dayKeyOf(now);
    for (const slot of slots) {
      const startKey = dayKeyOf(slot.start);
      const isLive = currentEntryId === slot.entry.id;
      // Live overnight slot has crossed into a new calendar day → primary
      // card hops to today's group, ghost stays in the start day's group.
      const jumped = isLive && nowKey !== startKey && now <= slot.end;
      if (jumped) {
        ensure(now).slots.push({ slot, isGhost: false });
        ensure(slot.start).slots.push({ slot, isGhost: true });
      } else {
        ensure(slot.start).slots.push({ slot, isGhost: false });
      }
    }
    // Days are inserted in slot order which is also chronological — preserve
    // that ordering by sorting on the keys' underlying timestamps.
    return Array.from(groups.values()).sort(
      (a, b) => parseDayKey(a.dayKey) - parseDayKey(b.dayKey),
    );
  }, [slots, currentEntryId]);

  const games = slots.filter((s) => s.entry.slot_type === 'game');
  const totalPlay = games.reduce((s, g) => s + g.entry.effective_minutes, 0);
  const completed = games.filter((s) => s.entry.is_completed).length;
  const eventEnd =
    slots.length > 0 ? slots[slots.length - 1].end : null;
  // One shuffled deck for every slot card across the whole page —
  // tracking a global index across day groups so e.g. day 1 → 2 doesn't
  // restart the cycle and accidentally put two same-colour cards next
  // to each other at the day boundary.
  const cardAccents = useAccentDeck(slots.length);

  return (
    <div className="schedule-page">
      <ScheduleHero
        event={event}
        eventEnd={eventEnd}
        totalPlayMinutes={totalPlay}
        totalGames={games.length}
        completedGames={completed}
      />

      {slots.length === 0 ? (
        <div className="container py-5 text-center text-white-50">
          <p>The line-up will appear here as soon as it's locked in.</p>
        </div>
      ) : (
        <div className="container schedule-timeline py-4">
          {days.map((day) => (
            <section key={day.dayKey} className="schedule-day">
              <header className="schedule-day-header">
                <div className="schedule-day-weekday">{day.dayLabel}</div>
                <div className="schedule-day-date">{day.dateLabel}</div>
              </header>
              <div className="schedule-day-slots">
                {day.slots.map(({ slot, isGhost }) => {
                  // Globally-positioned index so the deck stays in sync
                  // across day groups (slots is the flat ordered list).
                  const globalIdx = slots.findIndex(
                    (s) => s.entry.id === slot.entry.id,
                  );
                  return (
                    <GameCard
                      key={`${slot.entry.id}-${isGhost ? 'ghost' : 'live'}`}
                      slot={slot}
                      isPlaying={!isGhost && currentEntryId === slot.entry.id}
                      isGhost={isGhost}
                      twitchChannel={event?.twitch_channel || 'zeldathonuk'}
                      accent={cardAccents[globalIdx]}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleHero({
  event,
  eventEnd,
  totalPlayMinutes,
  totalGames,
  completedGames,
}: {
  event: EventModel | null;
  eventEnd: Date | null;
  totalPlayMinutes: number;
  totalGames: number;
  completedGames: number;
}) {
  const start = event ? new Date(event.start_time) : null;
  const banner = event?.banner_url || '';
  const logo = event?.logo_url || '';
  const name = event?.name ?? 'Stream Schedule';

  return (
    <header
      className="schedule-hero"
      style={
        banner
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(76,19,36,0.6) 0%, rgba(11,4,8,0.92) 100%), url(${banner})`,
            }
          : undefined
      }
    >
      <div className="container schedule-hero-inner">
        {logo && (
          <img src={logo} alt={`${name} logo`} className="schedule-hero-logo" />
        )}
        <h1 className="schedule-hero-title">
          {event ? renderTitleWithLogo(name) : 'Stream Schedule'}
        </h1>
        {start && eventEnd && (
          <div className="schedule-hero-dates">
            <span>{fmtDateTime(start)}</span>
            <span aria-hidden className="schedule-hero-dash">→</span>
            <span>{fmtDateTime(eventEnd)}</span>
          </div>
        )}
        {!event && (
          <p className="text-white-50 mt-3">
            No event scheduled — check back closer to the next stream.
          </p>
        )}
        {event && (
          <div className="schedule-hero-kpis">
            <HeroKpi label="Games" value={String(totalGames)} />
            <HeroKpi
              label="Play time"
              value={fmtDuration(totalPlayMinutes)}
            />
            <HeroKpi
              label="Progress"
              value={`${completedGames} / ${totalGames}`}
            />
          </div>
        )}
      </div>
    </header>
  );
}

function HeroKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="schedule-hero-kpi">
      <div className="schedule-hero-kpi-value">{value}</div>
      <div className="schedule-hero-kpi-label">{label}</div>
    </div>
  );
}

function GameCard({
  slot,
  isPlaying,
  isGhost,
  twitchChannel,
  accent,
}: {
  slot: Slot;
  isPlaying: boolean;
  isGhost: boolean;
  twitchChannel: string;
  accent?: number;
}) {
  const { entry, start, end, children } = slot;
  const isCompleted = entry.is_completed;
  const game = entry.game;
  const daysSpanned = daysBetween(start, end);
  // End time crosses midnight (or further) into a later calendar day.
  const crossesMidnight = daysSpanned >= 1;
  const liveBreak =
    isPlaying && children.length > 0
      ? findActiveBreak(
          children,
          entry.started_at ? new Date(entry.started_at) : start,
        )
      : null;

  const cardClass = [
    'schedule-card',
    isPlaying ? 'is-live' : '',
    isCompleted ? 'is-completed' : '',
    isGhost ? 'is-ghost' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      className={cardClass}
      data-accent={accent}
      style={
        game?.box_art_url
          ? {
              backgroundImage: `linear-gradient(105deg, rgba(11,4,8,0.92) 0%, rgba(11,4,8,0.78) 45%, rgba(11,4,8,0.55) 100%), url(${game.box_art_url})`,
            }
          : undefined
      }
    >
      <div className="schedule-card-time">
        <div className="schedule-card-time-start">{fmtTime(start)}</div>
        <div className="schedule-card-time-end">
          → {fmtTime(end)}
          {crossesMidnight && (
            <span
              className="schedule-moon"
              title="Ends after midnight"
              aria-label="Ends after midnight"
            >
              🌙
            </span>
          )}
        </div>
        {daysSpanned >= 1 && (
          <div className="schedule-card-time-overnight">
            ends {end.toLocaleDateString('en-GB', { weekday: 'short' })}
          </div>
        )}
      </div>

      {game?.box_art_url ? (
        <img
          src={game.box_art_url}
          alt={`${entry.display_title} cover art`}
          className="schedule-card-art"
        />
      ) : (
        <div
          className="schedule-card-art schedule-card-art--break"
          aria-hidden
        >
          {BREAK_META[entry.slot_type]?.icon ?? '⭐'}
        </div>
      )}

      <div className="schedule-card-body">
        <div className="schedule-card-meta">
          {game?.platform && (
            <span className="schedule-pill">{game.platform}</span>
          )}
          <span className="schedule-pill schedule-pill--duration">
            {fmtDuration(entry.effective_minutes)}
          </span>
          {daysSpanned >= 1 && (
            <span
              className="schedule-pill schedule-pill--overnight"
              title={`Runs across ${daysSpanned + 1} days`}
            >
              🌙 spans {daysSpanned + 1} days
            </span>
          )}
          {isGhost && (
            <span
              className="schedule-pill schedule-pill--ghost"
              title={`Continues into ${end.toLocaleDateString('en-GB', { weekday: 'long' })}`}
            >
              ⤳ continues into{' '}
              {end.toLocaleDateString('en-GB', { weekday: 'short' })}
            </span>
          )}
          {isCompleted && (
            <span className="schedule-pill schedule-pill--done">
              Completed
            </span>
          )}
          {isPlaying && !liveBreak && (
            <a
              href={`https://www.twitch.tv/${twitchChannel}`}
              target="_blank"
              rel="noreferrer"
              className="schedule-pill schedule-pill--live"
            >
              <span className="schedule-live-dot" />
              LIVE NOW
            </a>
          )}
        </div>

        <h2 className="schedule-card-title">
          {entry.display_title}
          {game?.release_year && (
            <span className="schedule-card-year">{game.release_year}</span>
          )}
        </h2>

        {entry.runners.length > 0 && (
          <div className="schedule-card-runners">
            {entry.runners.map((r) =>
              r.is_streamer && r.channel_url ? (
                <a
                  key={r.id}
                  href={r.channel_url}
                  target="_blank"
                  rel="noreferrer"
                  className="schedule-runner schedule-runner--linked"
                >
                  {r.profile_image_url && (
                    <img src={r.profile_image_url} alt="" />
                  )}
                  <span>{r.name}</span>
                </a>
              ) : (
                <span key={r.id} className="schedule-runner">
                  {r.profile_image_url && (
                    <img src={r.profile_image_url} alt="" />
                  )}
                  <span>{r.name}</span>
                </span>
              ),
            )}
          </div>
        )}

        {liveBreak && (
          <div className="schedule-break-banner mt-2">
            <div className="schedule-break-icon">
              {BREAK_META[liveBreak.entry.slot_type]?.icon ?? '☕'}
            </div>
            <div className="text-start">
              <strong className="d-block">
                On a{' '}
                {(
                  BREAK_META[liveBreak.entry.slot_type]?.label ?? 'break'
                ).toLowerCase()}
              </strong>
              <div className="small text-white-50">
                Back at <strong>{fmtTime(liveBreak.end)}</strong> (
                {fmtDuration(liveBreak.entry.effective_minutes)})
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function daysBetween(start: Date, end: Date): number {
  // Difference in calendar days between two timestamps (rounded down on the
  // start, up on the end). Returns 0 when start and end share the same date.
  const startDay = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  ).getTime();
  const endDay = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
  ).getTime();
  return Math.max(0, Math.round((endDay - startDay) / (24 * 60 * 60 * 1000)));
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

/**
 * Render an event name, swapping the "ZeldathonUK" substring with the
 * gold-flash wordmark SVG when present. Falls back to plain text otherwise.
 */
function renderTitleWithLogo(name: string): React.ReactNode {
  const match = name.match(/zeldathonuk/i);
  if (!match) return name;
  const before = name.slice(0, match.index).trim();
  const after = name.slice(match.index! + match[0].length).trim();
  const remainder = [before, after].filter(Boolean).join(' ');
  return (
    <>
      <img
        src="/assets/img/brand/logo/Zeldathon-Logo-2026-Gold-Flash.svg"
        alt="ZeldathonUK"
        className="schedule-hero-logo-inline"
      />
      {remainder && <span className="schedule-hero-title-remainder">{remainder}</span>}
    </>
  );
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
