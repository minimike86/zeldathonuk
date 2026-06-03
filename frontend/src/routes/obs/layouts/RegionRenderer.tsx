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
import type { ScheduleEntry } from '@/lib/obsApi';
import { selectObjectiveSection } from '@/routes/obs/objectiveSection';
import { buildItemClusters } from '@/routes/obs/itemClusters';
import type { Box, ElementId } from './useLayoutPresetConfig';
import {
  AdPanel,
  RunnerChip,
  computeTimerMs,
  fmtEta,
  formatHmsCs,
  parseBadges,
  splitOnColon,
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
}: {
  box: Box;
  elements: ElementId[];
  entry: ScheduleEntry | null;
}) {
  if (elements.length === 0) return null;
  return (
    <div
      className="obs-region"
      style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
    >
      {elements.map((id) => (
        <LayoutElement key={id} id={id} entry={entry} />
      ))}
      {/* Flex-grow filler so the panel background extends to the bottom of the
       * stage. It's a SIBLING of the elements (incl. the camera), so the camera
       * + the region itself stay transparent — only this filler paints the lane
       * fill below the last element. */}
      <div className="obs-region-filler" aria-hidden />
    </div>
  );
}

function LayoutElement({ id, entry }: { id: ElementId; entry: ScheduleEntry | null }) {
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

/** Collected-items board, clustered by item set (Pendants, Bottles, …) with
 *  upgrade chains collapsed to the current tier + capacity numbers, and
 *  operator-hidden sets (bottle contents) omitted. See buildItemClusters. */
function ItemsElement({ entry }: { entry: ScheduleEntry | null }) {
  const game = entry?.game;
  if (!game || game.items.length === 0) return null;
  const collected = new Set(entry?.collected_item_ids ?? []);
  const counts = entry?.collected_item_counts ?? {};
  const clusters = buildItemClusters(game, collected, counts);
  if (clusters.length === 0) return null;
  return (
    <Block title="Items">
      <div className="obs-region-itemsets">
        {clusters.map((cluster) => (
          <div key={cluster.label} className="obs-region-itemset">
            <div className="obs-region-itemset-label">{cluster.label}</div>
            <div className="obs-region-itemset-row">
              {cluster.slots.map((slot) => (
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
