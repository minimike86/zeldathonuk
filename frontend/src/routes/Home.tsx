import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { DonateButton } from '@/components/donations/DonateButton';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { ScheduleEntry } from '@/lib/obsApi';
import './home.css';

const SPECIALEFFECT_URL = 'https://www.specialeffect.org.uk/what-we-do';

// Pass every plausible parent so Twitch's iframe security check passes
// whether you're on localhost, the docker network, or the real domain.
const TWITCH_PARENTS = [
  'localhost',
  '127.0.0.1',
  'host.docker.internal',
  'zeldathon.co.uk',
  'www.zeldathon.co.uk',
];
const TWITCH_PARENT_QS = TWITCH_PARENTS.map((p) => `parent=${p}`).join('&');

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function useInnerWidth() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return w;
}

export function Home() {
  const innerWidth = useInnerWidth();
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000);
  const donationPages = event?.donation_pages ?? [];
  const { data: currentlyPlaying } = usePolledQuery(
    obsApi.currentlyPlaying,
    5000,
  );
  const { data: schedule } = usePolledQuery(
    () => (event ? obsApi.schedule(event.id) : Promise.resolve([])),
    10_000,
    [event?.id],
  );
  const currentEntry = currentlyPlaying?.schedule_entry_detail ?? null;
  // Upcoming queue = every top-level game (skip breaks + attached children)
  // that isn't completed and is ordered after the live entry — sorted by
  // schedule order so the homepage can cycle through them.
  const upcoming = (schedule ?? [])
    .filter((e) => e.parent_entry == null && e.slot_type === 'game' && !e.is_completed)
    .sort((a, b) => a.order - b.order)
    .filter((e) => !currentEntry || e.order > currentEntry.order);

  // Rotate through the queue so the page feels alive — header text adapts
  // to position (Up Next → Coming up → Also playing → The rest of the
  // line-up). Auto-advances every 5s and wraps around.
  const [upcomingIdx, setUpcomingIdx] = useState(0);
  useEffect(() => {
    if (upcoming.length <= 1) {
      setUpcomingIdx(0);
      return;
    }
    setUpcomingIdx((i) => (i >= upcoming.length ? 0 : i));
    const t = window.setInterval(() => {
      setUpcomingIdx((i) => (i + 1) % upcoming.length);
    }, 5000);
    return () => window.clearInterval(t);
  }, [upcoming.length]);
  const nextEntry = upcoming[upcomingIdx] ?? null;
  const nextLabel = labelForQueuePosition(upcomingIdx);

  // Cumulative scheduled start times per top-level entry. Each slot's wall-
  // clock span includes any attached child breaks so subsequent entries
  // correctly reflect the pushed start.
  const startTimes = new Map<number, Date>();
  if (event && schedule) {
    const eventStart = new Date(event.start_time).getTime();
    const topLevel = schedule
      .filter((e) => e.parent_entry == null)
      .sort((a, b) => a.order - b.order);
    const childTotals = new Map<number, number>();
    for (const e of schedule) {
      if (e.parent_entry != null) {
        childTotals.set(
          e.parent_entry,
          (childTotals.get(e.parent_entry) ?? 0) + e.effective_minutes,
        );
      }
    }
    let cursor = eventStart;
    for (const e of topLevel) {
      startTimes.set(e.id, new Date(cursor));
      cursor += (e.effective_minutes + (childTotals.get(e.id) ?? 0)) * 60_000;
    }
  }

  // Current entry ETA — prefer the real started_at, else fall back to the
  // scheduled cumulative start.
  const currentStart = currentEntry
    ? currentEntry.started_at
      ? new Date(currentEntry.started_at)
      : startTimes.get(currentEntry.id) ?? null
    : null;
  const currentEnd =
    currentEntry && currentStart
      ? new Date(currentStart.getTime() + currentEntry.effective_minutes * 60_000)
      : null;
  const nextStart = nextEntry ? startTimes.get(nextEntry.id) ?? null : null;

  return (
    <div className="container-fluid">
      <div className="d-block card card-header mt-2 p-0">
        <div className="d-flex flex-row">
          <div className="ratio ratio-16x9" style={{ maxHeight: '60vh' }}>
            <iframe
              src={`https://player.twitch.tv/?channel=zeldathonuk&${TWITCH_PARENT_QS}&autoplay=false`}
              frameBorder="0"
              scrolling="no"
              allowFullScreen
              title="ZeldathonUK Twitch stream"
            />
          </div>
          {innerWidth >= 750 && (
            <iframe
              frameBorder="0"
              scrolling="no"
              id="chat_embed_widescreen"
              src={`https://www.twitch.tv/embed/zeldathonuk/chat?darkpopout&${TWITCH_PARENT_QS}`}
              width="33.5%"
              title="Twitch chat"
            />
          )}
        </div>
        {innerWidth < 750 && (
          <iframe
            frameBorder="0"
            scrolling="no"
            id="chat_embed_mobile"
            src={`https://www.twitch.tv/embed/zeldathonuk/chat?darkpopout&parent=${TWITCH_PARENT}`}
            height="250px"
            width="100%"
            title="Twitch chat"
          />
        )}
      </div>

      <div className="d-block bg-bloodmoon p-3 mb-2">
        <div className="row g-4 text-white" style={{ fontSize: '0.85em' }}>
          {/* Left column: Currently Playing on top, Up Next stacked beneath. */}
          <div className="col-lg-5 d-flex flex-column gap-3">
            <div className="ps-3">
              <h6 className="text-bloodmoon">Currently Playing</h6>
              {currentEntry ? (
                <ScheduleEntryCard
                  entry={currentEntry}
                  etaLabel="Estimated end"
                  etaTime={currentEnd}
                />
              ) : (
                <>
                  <h5>ZeldathonUK is Offline</h5>
                  <div className="mt-2" style={{ fontFamily: "'Bungee', cursive" }}>
                    <a
                      className="btn btn-sm btn-bloodmoon p-2 px-5"
                      title="Follow Us On Twitch"
                      href="https://www.twitch.tv/zeldathonuk"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Follow Us On Twitch
                    </a>
                  </div>
                </>
              )}
            </div>

            <div
              className="ps-3"
              style={{ borderTop: '2px solid var(--bs-danger)', paddingTop: '0.75rem' }}
            >
              {nextEntry ? (
                <>
                  <h6 className="text-bloodmoon">
                    <WaveText text={nextLabel} />
                  </h6>
                  <div key={nextEntry.id} className="upnext-card">
                    <ScheduleEntryCard
                      entry={nextEntry}
                      etaLabel="Expected start"
                      etaTime={nextStart}
                    />
                  </div>
                </>
              ) : (
                <>
                  <h6 className="text-bloodmoon">Up Next</h6>
                  <h5>Check the schedule</h5>
                  <div className="mt-2" style={{ fontFamily: "'Bungee', cursive" }}>
                    <Link
                      className="btn btn-sm btn-bloodmoon p-2 px-5"
                      title="Check The Schedule"
                      to="/schedule"
                    >
                      Check The Schedule
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right column: Benefitting / SpecialEffect with a prominent Donate CTA. */}
          <div
            className="col-lg-7 ps-3"
            style={{ borderLeft: '2px solid var(--bs-danger)' }}
          >
            <h6 className="text-bloodmoon">Benefitting</h6>
            <div className="benefitting-card">
              <a
                href={SPECIALEFFECT_URL}
                target="_blank"
                rel="noreferrer"
                className="benefitting-logo"
                title="SpecialEffect — what we do"
              >
                <img
                  src="/assets/img/specialeffect-logo.svg"
                  alt="SpecialEffect logo"
                />
              </a>
              <div className="benefitting-body">
                <p className="text-specialeffect-blurb mb-3">
                  <strong className="text-light">SpecialEffect</strong> is transforming
                  the lives of people with physical challenges — optimising their
                  inclusion, enjoyment, and quality of life through accessible
                  technology that helps them play video games to the best of their
                  abilities.
                </p>
                <button
                  className="btn btn-specialeffect"
                  onClick={() => openExternal(SPECIALEFFECT_URL)}
                >
                  CAN THEY HELP YOU?
                </button>
              </div>
            </div>

            {donationPages.length > 0 && (
              <div className="mt-4">
                <h6 className="text-bloodmoon" style={{ fontSize: '1.35em' }}>
                  Make a donation
                </h6>
                <DonateButton
                  pages={donationPages}
                  currencySymbol={event?.currency_symbol}
                  size="lg"
                  className="w-100"
                  label="Donate now"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduleEntryCard({
  entry,
  etaLabel,
  etaTime,
}: {
  entry: ScheduleEntry;
  etaLabel?: string;
  etaTime?: Date | null;
}) {
  const game = entry.game;
  const title = entry.display_title || game?.title;
  return (
    <div className="d-flex align-items-center gap-3 mt-2">
      {game?.box_art_url ? (
        <img
          src={game.box_art_url}
          alt={`${title} box art`}
          style={{
            width: 56,
            height: 76,
            objectFit: 'cover',
            borderRadius: 4,
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          aria-hidden
          style={{
            width: 56,
            height: 76,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            color: 'rgba(255,255,255,0.5)',
            flexShrink: 0,
          }}
        >
          {(title ?? '?').charAt(0).toUpperCase()}
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <h5 className="mb-1">{title}</h5>
        {game && (
          <div className="small text-white-50">{game.platform}</div>
        )}
        {entry.runners.length > 0 && (
          <div className="small text-white-50">
            with{' '}
            {entry.runners.map((r, i) => (
              <span key={r.id}>
                {i > 0 && ', '}
                {r.is_streamer && r.channel_url ? (
                  <a
                    href={r.channel_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-warning"
                    title={`Watch ${r.name} on their channel`}
                  >
                    {r.name}
                  </a>
                ) : (
                  r.name
                )}
              </span>
            ))}
          </div>
        )}
        {etaLabel && etaTime && (
          <div className="small text-white-50 mt-1">
            {etaLabel}:{' '}
            <strong className="text-light">{fmtRelativeTime(etaTime)}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

function WaveText({ text }: { text: string }) {
  // Bump a counter whenever the text changes so React remounts the per-char
  // spans (via the key) and each one's staggered animation replays from
  // scratch. The label visibly "wave-rewrites" itself across the row.
  const [version, setVersion] = useState(0);
  const lastTextRef = useRef(text);
  useEffect(() => {
    if (lastTextRef.current !== text) {
      lastTextRef.current = text;
      setVersion((v) => v + 1);
    }
  }, [text]);
  return (
    <span className="wave-text">
      {Array.from(text).map((ch, i) => (
        <span key={`${version}-${i}`} style={{ animationDelay: `${i * 45}ms` }}>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}

const QUEUE_LABELS: string[] = [
  'Up Next',
  'Coming Up',
  'Then…',
  'Also Playing',
  'Later On',
  'On Deck',
  'Stay Tuned For',
  "Don't Miss",
  'Plus…',
  'And Then…',
  'Watch Out For',
  'Saving For Last',
];

function labelForQueuePosition(idx: number): string {
  if (idx < QUEUE_LABELS.length) return QUEUE_LABELS[idx];
  return 'The Rest Of The Line-up';
}

function fmtRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = date.getTime() - now;
  const absMin = Math.abs(diffMs) / 60_000;
  const abs = (() => {
    if (absMin < 60) return `${Math.round(absMin)}m`;
    const h = Math.floor(absMin / 60);
    const m = Math.round(absMin % 60);
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  })();
  const clock = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const sameDay = new Date(now).toDateString() === date.toDateString();
  const dayLabel = sameDay
    ? clock
    : `${date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      })} ${clock}`;
  if (diffMs >= 0) return `in ${abs} (${dayLabel})`;
  return `${abs} ago (${dayLabel})`;
}
