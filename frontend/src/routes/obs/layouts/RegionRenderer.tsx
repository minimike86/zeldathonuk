/**
 * Renders a configured layout region: an absolutely-positioned column on the
 * OBS stage that stacks the operator-chosen elements top-to-bottom. Each
 * `ElementId` maps to a small presentational component; most reuse the existing
 * stage primitives + data helpers from `Layout.tsx`, with a few new granular
 * ones (next objective, death count, cover art, title) so they can be placed
 * independently rather than only as the legacy combined cards.
 */
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSkull } from '@fortawesome/free-solid-svg-icons';
import { topSetpiece, type ScheduleEntry } from '@/lib/obsApi';
import { selectObjectiveSection } from '@/routes/obs/objectiveSection';
import { buildItemSections } from '@/routes/obs/itemClusters';
import type { Box, ElementId } from './useLayoutPresetConfig';
import type { RegionFeed } from './useRegionFeed';
import {
  AdPanel,
  RunnerChip,
  computeTimerMs,
  fmtEta,
  formatHms,
  formatHmsCs,
  parseBadges,
  splitOnColon,
  useNow,
} from './Layout';

/**
 * `entry` is fetched ONCE by the parent layout (Standard) and threaded down —
 * NOT polled per element. Each element polling `/api/currently-playing/`
 * independently (the old `useCurrentEntry()` per element) flooded the backend
 * with one heavy nested-payload request per element every 2s, which lagged the
 * whole app (incl. the control panel). Keep `entry` a prop.
 */
export function RegionRenderer({
  box,
  elements,
  entry,
  feed,
}: {
  box: Box;
  elements: ElementId[];
  entry: ScheduleEntry | null;
  feed: RegionFeed;
}) {
  if (elements.length === 0) return null;
  return (
    <div
      className="obs-region"
      style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
    >
      {elements.map((id) => (
        <LayoutElement key={id} id={id} entry={entry} feed={feed} />
      ))}
      {/* Flex-grow filler so the panel background extends to the bottom of the
       * stage. It's a SIBLING of the elements (incl. the camera), so the camera
       * + the region itself stay transparent — only this filler paints the lane
       * fill below the last element. */}
      <div className="obs-region-filler" aria-hidden />
    </div>
  );
}

function LayoutElement({
  id,
  entry,
  feed,
}: {
  id: ElementId;
  entry: ScheduleEntry | null;
  feed: RegionFeed;
}) {
  switch (id) {
    case 'game-info':
      return <GameInfoElement entry={entry} />;
    case 'runners':
      return <RunnersElement entry={entry} />;
    case 'timer':
      return <TimerElement entry={entry} />;
    case 'items-collected':
      return <ItemsElement entry={entry} />;
    case 'objective-checklist':
      return <ObjectiveChecklistElement entry={entry} />;
    case 'next-objective':
      return <NextObjectiveElement entry={entry} />;
    case 'death-count':
      return <DeathCountElement entry={entry} />;
    case 'camera':
      return <CameraElement />;
    case 'charity-ad':
      return <CharityAdElement />;
    // Fundraising
    case 'total-raised':
      return <TotalRaisedElement feed={feed} />;
    case 'donation-reel':
      return <DonationReelElement feed={feed} />;
    case 'incentives':
      return <IncentivesElement feed={feed} />;
    case 'milestones':
      return <MilestonesElement feed={feed} />;
    case 'raffle':
      return <RaffleElement feed={feed} />;
    // Run / stream info
    case 'schedule-next':
      return <ScheduleNextElement entry={entry} feed={feed} />;
    case 'custom-objective':
      return <CustomObjectiveElement entry={entry} />;
    case 'setpiece':
      return <SetpieceElement entry={entry} />;
    case 'local-time':
      return <LocalTimeElement />;
    case 'total-playtime':
      return <TotalPlaytimeElement feed={feed} />;
    // Media / misc
    case 'pre-stream':
      return <PreStreamElement entry={entry} feed={feed} />;
    case 'event-info':
      return <EventInfoElement feed={feed} />;
    case 'bid-war':
      return <BidWarElement feed={feed} />;
    default:
      return null;
  }
}

/** Shared titled card wrapper, matching the legacy `.panel-block`. */
function Block({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="panel-block obs-region-block">
      {title && <div className="panel-block-title">{title}</div>}
      {children}
    </div>
  );
}

/**
 * Single game-identity card: the cover art sits DIMMED behind the title (never
 * as a big image), with a compact one-line platform · year · ETA beneath. A
 * dark scrim keeps the title legible over any cover. Adapts to the region width
 * via container queries in obs.css. Replaces the old game-title / cover-art /
 * game-meta trio (folded in by parsePresetConfig's legacy aliases).
 */
function GameInfoElement({ entry }: { entry: ScheduleEntry | null }) {
  const game = entry?.game;
  const title = entry?.display_title || game?.title || '—';
  const [titleA, titleB] = splitOnColon(title);
  const badges = parseBadges(entry?.notes ?? '');
  const meta = [
    game?.platform.replace('Nintendo', '').trim(),
    game?.release_year ? String(game.release_year) : null,
    entry?.effective_minutes ? `ETA ${fmtEta(entry.effective_minutes)}` : null,
  ].filter(Boolean);
  return (
    <Block>
      <div className="obs-region-gameinfo">
        {game?.box_art_url && (
          <div
            className="obs-region-gameinfo-bg"
            style={{ backgroundImage: `url("${game.box_art_url}")` }}
            aria-hidden
          />
        )}
        <div className="obs-region-gameinfo-content">
          <div className="obs-region-gameinfo-title">
            <div className="obs-region-title-line">{titleA}</div>
            {titleB && <div className="obs-region-title-line">{titleB}</div>}
          </div>
          {badges.length > 0 && (
            <div className="obs-region-badges">
              {badges.map((b) => (
                <span key={b} className="obs-gd-badge">{b}</span>
              ))}
            </div>
          )}
          {meta.length > 0 && (
            <div className="obs-region-gameinfo-meta">{meta.join(' · ')}</div>
          )}
        </div>
      </div>
    </Block>
  );
}

function RunnersElement({ entry }: { entry: ScheduleEntry | null }) {
  const runners = entry?.runners ?? [];
  return (
    <Block title={runners.length > 1 ? 'Runners' : 'Runner'}>
      <div className="obs-region-runners">
        {runners.length === 0 ? (
          <span className="obs-rt-runner-name">—</span>
        ) : (
          runners.map((r) => <RunnerChip key={r.id} runner={r} />)
        )}
      </div>
    </Block>
  );
}

/** Play-time clock matching /control/timer: HH:MM:SS.cc with the timer state
 *  beneath. Ticks via rAF while running so the centiseconds advance smoothly;
 *  idle when paused/stopped (the 2s currently-playing poll covers state flips). */
function TimerElement({ entry }: { entry: ScheduleEntry | null }) {
  const timer = entry?.timer ?? null;
  const running = timer?.is_running ?? false;
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const loop = () => {
      setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const state = timer?.is_running
    ? 'Running'
    : timer?.is_paused
      ? 'Paused'
      : entry?.is_completed
        ? 'Finished'
        : 'Stopped';

  return (
    <Block title="Play time">
      <div className="obs-region-timer">{formatHmsCs(computeTimerMs(timer))}</div>
      <div className="obs-region-timer-state">{state}</div>
    </Block>
  );
}

/** Collected-items board mirroring /control/items exactly: group sections →
 *  set clusters (+ a standalone bucket) → item slots. Upgrade chains collapse to
 *  the current tier with capacity numbers, operator-hidden sets (bottle
 *  contents) are omitted. See buildItemSections. */
function ItemsElement({ entry }: { entry: ScheduleEntry | null }) {
  const game = entry?.game;
  if (!game || game.items.length === 0) return null;
  const collected = new Set(entry?.collected_item_ids ?? []);
  const counts = entry?.collected_item_counts ?? {};
  const sections = buildItemSections(game, collected, counts);
  if (sections.length === 0) return null;
  return (
    <Block title="Items">
      <div className="obs-region-itemsections">
        {sections.map((section) => (
          <div key={section.label} className="obs-region-itemsection">
            <div className="obs-region-itemsection-label">{section.label}</div>
            {/* All of the section's slots flow into ONE continuous grid (set
              * order preserved by clusters → slots), so icons tessellate
              * edge-to-edge instead of each set forming its own ragged block.
              * Set names drop to the per-slot tooltip. */}
            <div className="obs-region-itemgrid">
              {section.clusters
                .flatMap((cluster) => cluster.slots)
                .map((slot) => (
                  <div
                    key={slot.key}
                    className="obs-item"
                    data-collected={slot.collected}
                    title={slot.name}
                  >
                    {slot.imageUrl ? (
                      <img src={slot.imageUrl} alt={slot.name} />
                    ) : (
                      <span className="obs-item-fallback">{slot.name.slice(0, 2)}</span>
                    )}
                    {slot.capacity != null && slot.collected && (
                      <span className="obs-item-capacity">{slot.capacity}</span>
                    )}
                    {slot.count != null && slot.count > 0 && (
                      <span className="obs-item-tally">×{slot.count}</span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </Block>
  );
}

// Cap the checklist so it never runs off the bottom of the region. We window
// the current section around the next-up objective: a row of context before it,
// then the upcoming ones, with the rest collapsed into "N done" / "+N more".
const OBJ_MAX_ROWS = 8;
const OBJ_CONTEXT_BEFORE = 1;

/** Objectives checklist scoped to the CURRENT run-section (shared with the
 *  omnibar via selectObjectiveSection), windowed + capped to the most relevant
 *  upcoming objectives so completed ones can't pile up off-screen. */
function ObjectiveChecklistElement({ entry }: { entry: ScheduleEntry | null }) {
  const section = selectObjectiveSection(entry);
  if (!section) return null;
  const { sectionLabel, obtainedCount, total } = section;
  // Drop per-dungeon tallies (small keys etc.) — they don't belong in the
  // checklist. They carry a non-null `count`; the obtained/total figures from
  // the selector already exclude them.
  const rows = section.rows.filter((r) => r.count == null);
  if (rows.length === 0) return null;

  // Anchor on the first outstanding row; start one earlier for momentum, but
  // clamp so a full window always renders when the section is long.
  const anchor = rows.findIndex((r) => !r.done);
  const a = anchor < 0 ? rows.length : anchor;
  const start = Math.max(0, Math.min(a - OBJ_CONTEXT_BEFORE, Math.max(0, rows.length - OBJ_MAX_ROWS)));
  const windowRows = rows.slice(start, start + OBJ_MAX_ROWS);
  const hiddenBefore = start;
  const hiddenAfter = rows.length - (start + windowRows.length);

  // The next-up row = first outstanding in the window; it gets the accent
  // node + NEXT pill so the viewer's eye lands on what's happening now.
  const nextId = windowRows.find((r) => !r.done)?.objective.id ?? null;

  return (
    <Block title="Objectives">
      {(sectionLabel || total > 0) && (
        <div className="obs-region-objectives-head">
          {sectionLabel && <span className="obs-region-objectives-section">{sectionLabel}</span>}
          {total > 0 && (
            <span className="obs-region-objectives-count">{obtainedCount}/{total}</span>
          )}
        </div>
      )}
      {/* Summaries sit OUTSIDE the rail so the connector line's first/last
       * endpoints land on real objective nodes. */}
      {hiddenBefore > 0 && (
        <div className="obs-region-objectives-summary">✓ {hiddenBefore} done</div>
      )}
      <ul className="obs-region-objectives">
        {windowRows.map(({ objective, done }) => {
          const isNext = objective.id === nextId;
          const state = done ? 'obtained' : isNext ? 'next' : 'outstanding';
          return (
            <li key={objective.id} className="obs-region-objective" data-state={state}>
              <span className="obs-obj-node" aria-hidden>
                {!done && objective.image_url && (
                  <img className="obs-obj-icon" src={objective.image_url} alt="" />
                )}
              </span>
              <span className="obs-region-objective-name">{objective.name}</span>
              {isNext && <span className="obs-obj-next">Next</span>}
            </li>
          );
        })}
      </ul>
      {hiddenAfter > 0 && (
        <div className="obs-region-objectives-summary">+{hiddenAfter} more</div>
      )}
    </Block>
  );
}

/** The single "up next" objective. Mirrors the omnibar NextObjectivePanel:
 *  skipped AND tally objectives (small keys etc. — they stay outstanding by
 *  nature) are excluded so they can't get stuck as the perpetual "next". */
function NextObjectiveElement({ entry }: { entry: ScheduleEntry | null }) {
  const objectives = entry?.game?.objectives ?? [];
  const obtained = new Set(entry?.obtained_objective_ids ?? []);
  const skipped = new Set(entry?.skipped_objective_ids ?? []);
  const active = objectives
    .filter((o) => !skipped.has(o.id) && o.link_mode !== 'tally')
    .slice()
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const next = active.find((o) => !obtained.has(o.id));
  if (!next) return null;
  const position = active.findIndex((o) => o.id === next.id) + 1;
  return (
    <Block title="Next objective">
      <div className="obs-region-next-objective">
        {next.image_url && <img src={next.image_url} alt="" aria-hidden />}
        <span className="obs-region-next-objective-name">{next.name}</span>
        <span className="obs-region-next-objective-pos">#{position} of {active.length}</span>
      </div>
    </Block>
  );
}

function DeathCountElement({ entry }: { entry: ScheduleEntry | null }) {
  const deaths = entry?.death_count ?? 0;
  return (
    <Block title="Deaths">
      <div className="obs-region-deaths">
        <FontAwesomeIcon icon={faSkull} className="obs-region-deaths-icon" aria-hidden />
        <span>{deaths}</span>
      </div>
    </Block>
  );
}

function CameraElement() {
  // 16:9 webcam reservation. MUST stay transparent so an OBS camera source
  // placed BEHIND this browser source shows through — only the frame border +
  // corner labels paint. No opaque background.
  return (
    <div className="obs-region-camera" aria-hidden>
      <span className="obs-region-camera-tag">CAMERA</span>
      <span className="obs-region-camera-live">
        <span className="obs-region-camera-dot" /> LIVE
      </span>
    </div>
  );
}

function CharityAdElement() {
  return (
    <div className="obs-region-ad">
      <AdPanel style={{ position: 'relative', width: '100%', height: '100%' }} />
    </div>
  );
}

// ── Fundraising elements ────────────────────────────────────────────────────

const cur = (feed: RegionFeed) => feed.event?.currency_symbol || '£';

function TotalRaisedElement({ feed }: { feed: RegionFeed }) {
  if (!feed.totals) return null;
  return (
    <Block title="Raised">
      <div className="obs-region-total">
        <span className="obs-region-total-cur">{cur(feed)}</span>
        {feed.totals.grand_total}
      </div>
      <div className="obs-region-total-sub">{feed.totals.donation_count} donations</div>
    </Block>
  );
}

function DonationReelElement({ feed }: { feed: RegionFeed }) {
  const donations = feed.donations;
  if (!donations || donations.length === 0) return null;
  const recent = donations
    .slice()
    .sort((a, b) => Date.parse(b.donated_at) - Date.parse(a.donated_at))
    .slice(0, 5);
  return (
    <Block title="Recent donations">
      <ul className="obs-region-donations">
        {recent.map((d) => (
          <li key={d.id} className="obs-region-donation">
            <span className="obs-region-donation-name">{d.donor_name || 'Anonymous'}</span>
            <span className="obs-region-donation-amt">{cur(feed)}{d.amount}</span>
          </li>
        ))}
      </ul>
    </Block>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="obs-region-progress">
      <div className="obs-region-progress-bar" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

function IncentivesElement({ feed }: { feed: RegionFeed }) {
  const list = (feed.incentives ?? []).filter((i) => i.is_active && !i.is_reached);
  if (list.length === 0) return null;
  return (
    <Block title="Incentives">
      <ul className="obs-region-goals">
        {list.slice(0, 4).map((i) => (
          <li key={i.id} className="obs-region-goal">
            <div className="obs-region-goal-head">
              <span className="obs-region-goal-name">{i.name}</span>
              <span className="obs-region-goal-amt">
                {cur(feed)}{i.current_amount} / {cur(feed)}{i.goal_amount}
              </span>
            </div>
            <ProgressBar pct={i.progress_pct} />
          </li>
        ))}
      </ul>
    </Block>
  );
}

function MilestonesElement({ feed }: { feed: RegionFeed }) {
  const next = (feed.milestones ?? [])
    .filter((m) => !m.is_reached)
    .sort((a, b) => a.order - b.order || Number(a.threshold_amount) - Number(b.threshold_amount))[0];
  if (!next) return null;
  const raised = feed.totals ? Number(feed.totals.grand_total) : null;
  const threshold = Number(next.threshold_amount);
  const pct = raised != null && threshold > 0 ? (raised / threshold) * 100 : null;
  return (
    <Block title="Next milestone">
      <div className="obs-region-goal-head">
        <span className="obs-region-goal-name">{next.name}</span>
        <span className="obs-region-goal-amt">{cur(feed)}{next.threshold_amount}</span>
      </div>
      {pct != null && <ProgressBar pct={pct} />}
    </Block>
  );
}

function RaffleElement({ feed }: { feed: RegionFeed }) {
  const open = (feed.raffles ?? []).filter((r) => r.is_open);
  if (open.length === 0) return null;
  const r = open[0];
  return (
    <Block title="Raffle">
      <div className="obs-region-raffle-name">{r.name}</div>
      <div className="obs-region-raffle-sub">{r.entrant_count} entries</div>
    </Block>
  );
}

// ── Run / stream info elements ──────────────────────────────────────────────

function ScheduleNextElement({ entry, feed }: { entry: ScheduleEntry | null; feed: RegionFeed }) {
  const schedule = feed.schedule;
  if (!schedule) return null;
  const upcoming = schedule
    .filter((s) => s.parent_entry == null && s.slot_type === 'game' && !s.is_completed)
    .sort((a, b) => a.order - b.order);
  const next = entry ? upcoming.find((s) => s.order > entry.order) ?? null : upcoming[0] ?? null;
  if (!next) return null;
  return (
    <Block title="Up next">
      <div className="obs-region-upnext">
        {next.game?.box_art_url && (
          <img className="obs-region-upnext-art" src={next.game.box_art_url} alt="" aria-hidden />
        )}
        <div className="obs-region-upnext-body">
          <div className="obs-region-upnext-title">{next.display_title || next.title}</div>
          {next.game && (
            <div className="obs-region-upnext-meta">
              {next.game.platform.replace('Nintendo', '').trim()}
              {next.game.release_year ? ` · ${next.game.release_year}` : ''}
            </div>
          )}
        </div>
      </div>
    </Block>
  );
}

function CustomObjectiveElement({ entry }: { entry: ScheduleEntry | null }) {
  const text = entry?.current_objective?.trim();
  if (!text) return null;
  return (
    <Block title="Objective">
      <div className="obs-region-customobj">{text}</div>
    </Block>
  );
}

function SetpieceElement({ entry }: { entry: ScheduleEntry | null }) {
  const sp = topSetpiece(entry?.setpieces);
  if (!sp) return null;
  return (
    <Block title={sp.kind || 'Setpiece'}>
      <div className="obs-region-setpiece" data-stage={sp.stage}>
        <span className="obs-region-setpiece-name">{sp.name}</span>
        <span className="obs-region-setpiece-stage">{sp.stage}</span>
      </div>
    </Block>
  );
}

function LocalTimeElement() {
  const now = useNow(1000);
  const t = new Date(now).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  return (
    <Block title="Local time">
      <div className="obs-region-clock">{t}</div>
    </Block>
  );
}

function TotalPlaytimeElement({ feed }: { feed: RegionFeed }) {
  const now = useNow(1000);
  if (!feed.event) return null;
  const secs = Math.max(0, Math.floor((now - Date.parse(feed.event.start_time)) / 1000));
  return (
    <Block title="Total play time">
      <div className="obs-region-clock">{formatHms(secs)}</div>
    </Block>
  );
}

// ── Media / misc elements ───────────────────────────────────────────────────

/** Countdown as `Nd HH:MM:SS` (days only when non-zero). */
function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const d = Math.floor(s / 86400);
  const hms = formatHms(s % 86400);
  return d > 0 ? `${d}d ${hms}` : hms;
}

function PreStreamElement({ entry, feed }: { entry: ScheduleEntry | null; feed: RegionFeed }) {
  const now = useNow(1000);
  if (!feed.event || entry) return null; // hide once a game is live
  const delta = Date.parse(feed.event.start_time) - now;
  return (
    <Block title="Starts in">
      <div className="obs-region-clock">
        {delta > 0 ? formatCountdown(delta / 1000) : 'Setting up…'}
      </div>
    </Block>
  );
}

function EventInfoElement({ feed }: { feed: RegionFeed }) {
  const now = useNow(60000);
  const ev = feed.event;
  if (!ev) return null;
  const start = Date.parse(ev.start_time);
  const dayNum = Math.floor((now - start) / 86400000) + 1;
  return (
    <Block title="Event">
      <div className="obs-region-event-name">{ev.name}</div>
      {now >= start && <div className="obs-region-event-day">Day {Math.max(1, dayNum)}</div>}
    </Block>
  );
}

function BidWarElement({ feed }: { feed: RegionFeed }) {
  const candidate = (feed.incentives ?? []).find((i) => {
    if (!i.is_active || i.is_reached) return false;
    const opts = (i.payload as { options?: unknown }).options;
    return Array.isArray(opts) && opts.length >= 2;
  });
  if (!candidate) return null;
  const raw = ((candidate.payload as { options: unknown[] }).options ?? []) as Array<{
    id?: string;
    name?: string;
    votes?: number | string;
  }>;
  const options = raw
    .filter((o) => o && typeof o.name === 'string')
    .map((o, i) => ({
      id: o.id ?? String(i),
      name: o.name as string,
      votes: typeof o.votes === 'number' ? o.votes : Number(o.votes) || 0,
    }))
    .sort((a, b) => b.votes - a.votes);
  if (options.length < 2) return null;
  return (
    <Block title="Bid war">
      <div className="obs-region-bidwar-name">{candidate.name}</div>
      <ul className="obs-region-bidwar">
        {options.slice(0, 5).map((o, i) => (
          <li key={o.id} className="obs-region-bidwar-opt" data-leading={i === 0}>
            <span className="obs-region-bidwar-label">{o.name}</span>
            <span className="obs-region-bidwar-amt">{cur(feed)}{o.votes.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </Block>
  );
}
