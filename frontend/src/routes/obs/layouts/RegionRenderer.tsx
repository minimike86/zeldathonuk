/**
 * Renders a configured layout region: an absolutely-positioned column on the
 * OBS stage that stacks the operator-chosen elements top-to-bottom. Each
 * `ElementId` maps to a small presentational component; most reuse the existing
 * stage primitives + data helpers from `Layout.tsx`, with a few new granular
 * ones (next objective, death count, cover art, title) so they can be placed
 * independently rather than only as the legacy combined cards.
 */
import type { ScheduleEntry } from '@/lib/obsApi';
import type { Box, ElementId } from './useLayoutPresetConfig';
import {
  AdPanel,
  ItemsGrid,
  RunnerChip,
  computeTimerSeconds,
  fmtEta,
  formatHms,
  parseBadges,
  splitOnColon,
  useCurrentEntry,
  useNow,
} from './Layout';

export function RegionRenderer({ box, elements }: { box: Box; elements: ElementId[] }) {
  if (elements.length === 0) return null;
  return (
    <div
      className="obs-region"
      style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
    >
      {elements.map((id) => (
        <LayoutElement key={id} id={id} />
      ))}
    </div>
  );
}

function LayoutElement({ id }: { id: ElementId }) {
  const entry = useCurrentEntry();
  switch (id) {
    case 'game-title':
      return <GameTitleElement entry={entry} />;
    case 'cover-art':
      return <CoverArtElement entry={entry} />;
    case 'game-meta':
      return <GameMetaElement entry={entry} />;
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

function GameTitleElement({ entry }: { entry: ScheduleEntry | null }) {
  const title = entry?.display_title || entry?.game?.title || '—';
  const [titleA, titleB] = splitOnColon(title);
  const badges = parseBadges(entry?.notes ?? '');
  return (
    <Block>
      <div className="obs-region-title">
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
    </Block>
  );
}

function CoverArtElement({ entry }: { entry: ScheduleEntry | null }) {
  const url = entry?.game?.box_art_url;
  if (!url) return null;
  return (
    <div className="obs-region-cover">
      <img src={url} alt="" aria-hidden />
    </div>
  );
}

function GameMetaElement({ entry }: { entry: ScheduleEntry | null }) {
  const game = entry?.game;
  return (
    <Block>
      <div className="obs-gd-meta">
        <div className="obs-gd-meta-cell obs-gd-meta-cell--left">
          <div className="obs-gd-meta-value">
            {game?.platform.replace('Nintendo', '').trim() || '—'}
          </div>
          <div className="obs-gd-meta-label">Platform</div>
        </div>
        <div className="obs-gd-meta-cell obs-gd-meta-cell--mid">
          <div className="obs-gd-meta-value">{game?.release_year ?? '—'}</div>
          <div className="obs-gd-meta-label">Release Year</div>
        </div>
        <div className="obs-gd-meta-cell obs-gd-meta-cell--right">
          <div className="obs-gd-meta-value">{fmtEta(entry?.effective_minutes ?? 0)}</div>
          <div className="obs-gd-meta-label">ETA to complete</div>
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

function TimerElement({ entry }: { entry: ScheduleEntry | null }) {
  const now = useNow(250);
  const seconds = computeTimerSeconds(entry?.timer ?? null, now);
  return (
    <Block title="Play time">
      <div className="panel-timer">{formatHms(seconds)}</div>
    </Block>
  );
}

function ItemsElement({ entry }: { entry: ScheduleEntry | null }) {
  // ItemsGrid already renders its own `.panel-block` + "Items" title (and
  // returns null when the game has no items), so don't wrap it in another
  // Block — that double-nested an Items card inside an Items card.
  return <ItemsGrid entry={entry} />;
}

/** Outstanding-vs-obtained checklist for the current game's objectives. */
function ObjectiveChecklistElement({ entry }: { entry: ScheduleEntry | null }) {
  const objectives = entry?.game?.objectives ?? [];
  if (objectives.length === 0) return null;
  const obtained = new Set(entry?.obtained_objective_ids ?? []);
  const skipped = new Set(entry?.skipped_objective_ids ?? []);
  const sorted = objectives
    .slice()
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  return (
    <Block title="Objectives">
      <ul className="obs-region-objectives">
        {sorted.map((o) => {
          const state = obtained.has(o.id)
            ? 'obtained'
            : skipped.has(o.id)
              ? 'skipped'
              : 'outstanding';
          return (
            <li key={o.id} className="obs-region-objective" data-state={state}>
              <span className="obs-region-objective-mark" aria-hidden>
                {state === 'obtained' ? '✓' : state === 'skipped' ? '✕' : '○'}
              </span>
              <span className="obs-region-objective-name">{o.name}</span>
            </li>
          );
        })}
      </ul>
    </Block>
  );
}

function NextObjectiveElement({ entry }: { entry: ScheduleEntry | null }) {
  const objectives = entry?.game?.objectives ?? [];
  const obtained = new Set(entry?.obtained_objective_ids ?? []);
  const skipped = new Set(entry?.skipped_objective_ids ?? []);
  const next = objectives
    .slice()
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
    .find((o) => !obtained.has(o.id) && !skipped.has(o.id));
  if (!next) return null;
  return (
    <Block title="Next objective">
      <div className="obs-region-next-objective">
        {next.image_url && <img src={next.image_url} alt="" aria-hidden />}
        <span>{next.name}</span>
      </div>
    </Block>
  );
}

function DeathCountElement({ entry }: { entry: ScheduleEntry | null }) {
  const deaths = entry?.death_count ?? 0;
  return (
    <Block title="Deaths">
      <div className="obs-region-deaths">{deaths}</div>
    </Block>
  );
}

function CameraElement() {
  // 16:9 webcam reservation; the OBS camera source sits behind the transparent
  // frame. Width follows the region; aspect keeps it from eating the column.
  return <div className="obs-region-camera panel-camera">CAMERA</div>;
}

function CharityAdElement() {
  return (
    <div className="obs-region-ad">
      <AdPanel style={{ position: 'relative', width: '100%', height: '100%' }} />
    </div>
  );
}
