import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { DonateButton } from '@/components/donations/DonateButton';
import { WaveText } from '@/components/WaveText';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { EventCharityLink, ScheduleEntry } from '@/lib/obsApi';
import './home.css';

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
  const twitchChannel = event?.twitch_channel || 'zeldathonuk';
  // Display version of the channel login for headers like "<x> is
  // Offline" — Twitch logins are forced lowercase, but a capitalised
  // form reads better in body copy. Preserves the rest of the handle
  // so mixed-case channel names (rendered lowercase by Twitch) still
  // look intentional.
  const twitchChannelDisplay =
    twitchChannel.charAt(0).toUpperCase() + twitchChannel.slice(1);
  // Poll Twitch directly so "Offline" reflects the channel's actual
  // live state, not just whether a schedule entry is marked currently-
  // playing in /control. 30s cadence keeps Helix usage trivial.
  const { data: streamStatus } = usePolledQuery(
    () => obsApi.twitchStreamStatus(twitchChannel),
    30_000,
    [twitchChannel],
  );
  const isLive = !!streamStatus?.is_live;
  // Beneficiaries ordered primary-first, then by curator-set `order`.
  // Hidden entirely when the event has no linked charities yet so the
  // home page doesn't show a stale SpecialEffect card during seeding.
  const benefitting = [...(event?.event_charities ?? [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.order - b.order;
  });
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

  // Active break attached to the currently-playing entry. Children come
  // from the full schedule (the detail object on `currentlyPlaying` doesn't
  // include them) — find the one whose wall-clock window contains "now".
  const currentChildren = (schedule ?? []).filter(
    (e) => currentEntry && e.parent_entry === currentEntry.id,
  );
  const liveBreak =
    currentEntry && currentStart && currentChildren.length > 0
      ? findActiveBreak(currentChildren, currentStart)
      : null;

  return (
    <div className="container-fluid">
      <div className="d-block card card-header mt-2 p-0">
        <div className="d-flex flex-row">
          <div className="ratio ratio-16x9 twitch-player-ratio">
            <iframe
              src={`https://player.twitch.tv/?channel=${twitchChannel}&${TWITCH_PARENT_QS}&autoplay=false`}
              frameBorder="0"
              scrolling="no"
              allowFullScreen
              title={`${twitchChannelDisplay} Twitch stream`}
            />
          </div>
          {innerWidth >= 750 && (
            <iframe
              frameBorder="0"
              scrolling="no"
              id="chat_embed_widescreen"
              src={`https://www.twitch.tv/embed/${twitchChannel}/chat?darkpopout&${TWITCH_PARENT_QS}`}
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
            src={`https://www.twitch.tv/embed/${twitchChannel}/chat?darkpopout&${TWITCH_PARENT_QS}`}
            height="250px"
            width="100%"
            title="Twitch chat"
          />
        )}
      </div>

      <div className="d-block bg-bloodmoon p-2 mb-2">
        <div className="row g-3 text-white" style={{ fontSize: '0.8em' }}>
          {/* Left column: Currently Playing on top, Up Next stacked beneath. */}
          <div className="col-lg-5 d-flex flex-column gap-2">
            <div className="ps-3">
              <h6 className="text-bloodmoon mb-1">Currently Playing</h6>
              {currentEntry ? (
                <ScheduleEntryCard
                  entry={currentEntry}
                  etaLabel="Estimated end"
                  etaTime={currentEnd}
                  liveBreak={liveBreak}
                />
              ) : isLive ? (
                // Channel is live on Twitch but no schedule entry is set
                // as currently-playing in /control. 2×2 grid:
                //   row 1: <DisplayName> Live   |   Watch → button
                //   row 2: <game name>          |   <n> viewers
                // Plus an optional italicised stream title spanning both
                // columns underneath. Display name comes from Helix's
                // `user_name` which preserves the broadcaster's preferred
                // casing (e.g. "MSec"), falling back to the lowercased
                // login if the Twitch API didn't return it.
                (() => {
                  const displayName =
                    streamStatus?.user_name?.trim() || twitchChannelDisplay;
                  const hasGame = !!streamStatus?.game_name;
                  const hasViewers =
                    typeof streamStatus?.viewer_count === 'number' && streamStatus.viewer_count > 0;
                  return (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        columnGap: '1rem',
                        rowGap: '0.3rem',
                        alignItems: 'center',
                      }}
                    >
                      <div className="d-flex align-items-center" style={{ gap: '0.6rem' }}>
                        <a
                          href={`https://www.twitch.tv/${twitchChannel}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-white text-decoration-none"
                          style={{ fontWeight: 700, fontSize: '1.15rem' }}
                          title="Watch on Twitch"
                        >
                          {displayName}
                        </a>
                        <span className="live-pill" aria-label="Live now">
                          <span className="live-pill-dot" aria-hidden />
                          Live
                        </span>
                      </div>
                      <a
                        className="btn btn-bloodmoon"
                        style={{
                          padding: '0.1rem 1.25rem',
                          fontSize: '0.95rem',
                          fontFamily: "'Bungee', cursive",
                          letterSpacing: '0.03em',
                          justifySelf: 'end',
                        }}
                        href={`https://www.twitch.tv/${twitchChannel}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Watch →
                      </a>
                      <div
                        className="text-white-50"
                        style={{
                          fontSize: '0.9rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          minWidth: 0,
                        }}
                        title={streamStatus?.game_name || ''}
                      >
                        {hasGame ? (
                          <b className="text-light">{streamStatus!.game_name}</b>
                        ) : (
                          <span style={{ opacity: 0.5 }}>—</span>
                        )}
                      </div>
                      <div
                        className="text-white-50"
                        style={{ fontSize: '0.9rem', textAlign: 'right', whiteSpace: 'nowrap' }}
                      >
                        {hasViewers ? (
                          <>{streamStatus!.viewer_count!.toLocaleString('en-GB')} viewers</>
                        ) : (
                          <span style={{ opacity: 0.5 }}>—</span>
                        )}
                      </div>
                      {streamStatus?.title && (
                        <div
                          className="text-white-50"
                          style={{
                            gridColumn: '1 / -1',
                            fontStyle: 'italic',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={streamStatus.title}
                        >
                          "{streamStatus.title}"
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <>
                  <h5>{twitchChannelDisplay} is Offline</h5>
                  <div className="mt-2" style={{ fontFamily: "'Bungee', cursive" }}>
                    <a
                      className="btn btn-sm btn-bloodmoon p-2 px-5"
                      title="Follow Us On Twitch"
                      href={`https://www.twitch.tv/${twitchChannel}`}
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
              style={{
                borderTop:
                  'var(--theme-divider-thickness, 2px) solid var(--theme-primary, var(--bs-danger))',
                paddingTop: '0.35rem',
              }}
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

          {/* Right column: Benefitting charities (read from the active
            * event's EventCharity links) + a prominent Donate CTA. */}
          <div
            className="col-lg-7 ps-3"
            style={{
              borderLeft:
                'var(--theme-divider-thickness, 2px) solid var(--theme-primary, var(--bs-danger))',
            }}
          >
            {benefitting.length > 0 && (
              <>
                <h6 className="text-bloodmoon">
                  Benefitting{benefitting.length > 1 ? ` (${benefitting.length})` : ''}
                </h6>
                <div className="d-flex flex-column gap-3">
                  {benefitting.map((link) => (
                    <BenefittingCard
                      key={link.id}
                      link={link}
                      showPrimaryBadge={benefitting.length > 1}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Fallback when there's an event with donation pages but
              * no linked charities — the operator hasn't set
              * beneficiaries yet, so attach the CTA to the column
              * directly so the home page still has a donate path. */}
            {benefitting.length === 0 && donationPages.length > 0 && (
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

function BenefittingCard({
  link,
  showPrimaryBadge,
}: {
  link: EventCharityLink;
  /** Only true when the event has more than one beneficiary attached
   *  — a single-charity event needs no "primary" pill. */
  showPrimaryBadge: boolean;
}) {
  const charity = link.charity_detail;
  // Help CTA — prefer the charity's own "how can they help you?" link;
  // fall back to the primary website so a charity that hasn't filled
  // the CTA in still has somewhere to send viewers.
  const helpUrl =
    charity.help_cta_url?.trim() || charity.primary_website_url?.trim() || '';
  const helpLabel = (charity.help_cta_headline?.trim()
    || 'Can they help you?').toUpperCase();
  // Donate CTA — built straight from the charity's `donate_cta_*`
  // fields so each beneficiary points at its own evergreen donation
  // page rather than the event-wide DonationPicker. Empty URL hides
  // the button (consistent with how the help CTA behaves). The body
  // text is surfaced as the button tooltip so curators can write a
  // longer pitch without taking up card space.
  const donateUrl = charity.donate_cta_url?.trim() || '';
  const donateLabel = (charity.donate_cta_headline?.trim()
    || 'Donate now').toUpperCase();
  const donateTooltip = charity.donate_cta_body?.trim() || undefined;
  // Reuse SpecialEffect's bespoke blue/orange button for that one
  // charity — preserves the existing brand look without forcing every
  // beneficiary to ship custom colours. Other charities fall back to
  // the site theme's primary button.
  const ctaClass =
    charity.slug === 'specialeffect' ? 'btn-specialeffect' : 'btn-bloodmoon';
  const blurb =
    charity.mission_statement?.trim() || 'No mission statement yet.';

  return (
    <div className="benefitting-card">
      {charity.logo_url ? (
        <a
          href={helpUrl || undefined}
          target={helpUrl ? '_blank' : undefined}
          rel="noreferrer"
          className="benefitting-logo"
          title={charity.name}
        >
          <img src={charity.logo_url} alt={`${charity.name} logo`} />
        </a>
      ) : null}
      <div className="benefitting-body">
        {showPrimaryBadge && link.is_primary && benefittingPrimaryBadge()}
        <p className="text-specialeffect-blurb mb-3">
          <strong className="text-light">{charity.name}</strong>{' '}
          {blurbBody(charity.name, blurb)}
        </p>
        {(helpUrl || donateUrl) && (
          <div className="d-flex flex-wrap gap-2 align-items-center">
            {helpUrl && (
              <button
                className={`btn ${ctaClass}`}
                onClick={() => openExternal(helpUrl)}
              >
                {helpLabel}
              </button>
            )}
            {donateUrl && (
              // Styled to match the "Follow Us On Twitch" button verbatim
              // (`btn btn-sm btn-bloodmoon p-2 px-5` + Bungee) so every
              // donate-flavoured CTA in the app — this card button, the
              // navbar Donate button, the Twitch follow button — reads
              // as one cohesive theme primary action.
              <button
                className="btn btn-sm btn-bloodmoon p-2 px-5"
                style={{ fontFamily: "'Bungee', cursive" }}
                title={donateTooltip}
                onClick={() => openExternal(donateUrl)}
              >
                {donateLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Strip a leading "{charity name} " prefix from the mission text when
 *  present so the bolded name + body don't end up with a duplicate of
 *  the name in the visible sentence. Pure cosmetic — the body still
 *  reads correctly without it. */
function blurbBody(name: string, mission: string): string {
  const prefix = `${name} `;
  if (mission.toLowerCase().startsWith(prefix.toLowerCase())) {
    return mission.slice(prefix.length);
  }
  return mission;
}

/** Small "PRIMARY" pill shown above multi-charity beneficiary cards so
 *  viewers know which org is the headline campaign for this event.
 *  Only rendered when more than one charity is attached and this card
 *  is the primary — single-charity events don't need the noise. */
function benefittingPrimaryBadge() {
  return (
    <span
      className="badge mb-2"
      style={{
        background: 'var(--theme-primary, #e71347)',
        color: '#fff',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        fontSize: '0.7em',
      }}
    >
      Primary beneficiary
    </span>
  );
}

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

function ScheduleEntryCard({
  entry,
  etaLabel,
  etaTime,
  liveBreak,
}: {
  entry: ScheduleEntry;
  etaLabel?: string;
  etaTime?: Date | null;
  liveBreak?: { entry: ScheduleEntry; start: Date; end: Date } | null;
}) {
  const game = entry.game;
  const title = entry.display_title || game?.title;
  return (
    <div className="d-flex align-items-center gap-3">
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
        {liveBreak && (
          <div
            className="mt-2 d-inline-flex align-items-center gap-2 px-2 py-1"
            style={{
              background: 'rgba(255, 193, 7, 0.18)',
              border: '1px solid rgba(255, 193, 7, 0.6)',
              borderRadius: 999,
              color: '#ffe69b',
            }}
          >
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>
              {BREAK_META[liveBreak.entry.slot_type]?.icon ?? '☕'}
            </span>
            <span className="small">
              <strong>
                On a{' '}
                {(BREAK_META[liveBreak.entry.slot_type]?.label ?? 'break').toLowerCase()}
              </strong>
              {' · '}
              back at <strong>{fmtTime(liveBreak.end)}</strong>
            </span>
          </div>
        )}
        {!liveBreak && etaLabel && etaTime && (
          <div className="small text-white-50 mt-1">
            {etaLabel}:{' '}
            <strong className="text-light">{fmtRelativeTime(etaTime)}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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
