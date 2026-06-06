import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  obsApi,
  usePolledQuery,
  type ChestAnnouncerSoundTrigger,
  type ChestAnnouncerSoundTriggerKind,
  type Game,
} from '@/lib/obsApi';
import { playFanfare } from '@/routes/obs/fanfare';
import { playSound } from '@/routes/obs/chestSoundTriggers';
import { useResizableColumns, ResizeHandle } from './resizableColumns';

// Sound trigger table column layout. Defaults chosen to give Name room
// to breathe (was content-sized before) while reclaiming whitespace
// from Active (just a checkbox) and Actions (the 280 px budget had
// ~60 px of slack around the four small buttons). Operators can drag
// any column to their own preference — widths persist via the shared
// hook in `resizableColumns.tsx`.
type TriggerColKey =
  | 'pri'
  | 'name'
  | 'kind'
  | 'match'
  | 'sound_url'
  | 'volume'
  | 'active'
  | 'actions';

const TRIGGER_COLUMN_DEFAULTS: Record<TriggerColKey, number> = {
  pri: 80,
  name: 220,
  kind: 110,
  match: 220,
  sound_url: 280,
  volume: 80,
  active: 64,
  actions: 220,
};

const TRIGGER_COLUMN_STORAGE_KEY =
  'control.chest-announcer.sound-triggers.column-widths';

/** Plain (non-sortable) resizable header cell. Mirrors the SortableTh
 *  pattern in /control/donations but without the sort indicator —
 *  trigger columns aren't sortable, the operator orders them via the
 *  `priority` field. */
function ResizableTh({
  width,
  onResizeStart,
  children,
  sortKey,
  activeSortKey,
  sortDir,
  onSort,
}: {
  width: number;
  onResizeStart: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  /** Make the header clickable to toggle sort. Pass a key that
   *  matches the table's `SortKey` union (here `TriggerSortKey`)
   *  along with the current active key + direction; omit `sortKey`
   *  to keep the column non-sortable. */
  sortKey?: string;
  activeSortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
}) {
  const sortable = sortKey != null && onSort != null;
  const active = sortable && sortKey === activeSortKey;
  const indicator = active ? (sortDir === 'asc' ? '▲' : '▼') : sortable ? '↕' : '';
  return (
    <th
      onClick={sortable ? () => onSort!(sortKey!) : undefined}
      style={{
        width,
        minWidth: width,
        // Needed so the absolutely-positioned ResizeHandle anchors
        // to the th's right edge instead of the table itself.
        position: 'relative',
        whiteSpace: 'nowrap',
        cursor: sortable ? 'pointer' : undefined,
        userSelect: sortable ? 'none' : undefined,
      }}
      aria-sort={
        active ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined
      }
    >
      {children}
      {indicator && (
        <span style={{ marginLeft: 6, opacity: active ? 1 : 0.35 }}>
          {indicator}
        </span>
      )}
      <ResizeHandle onMouseDown={onResizeStart} />
    </th>
  );
}

/**
 * /control/chest-announcer — operator surface for the donation chest
 * overlay at /obs/chest-announcer.
 *
 * Audio behaviour is persisted on the backend (singleton
 * ChestAnnouncerSettings row) rather than carried in a URL query
 * string, so flipping the toggle here takes effect on every running
 * OBS browser source within one settings-poll cycle (5 s).
 *
 * Also exposes a one-click `Test fanfare` button so the operator can
 * audition the sound without waiting for a real donation.
 */
export function ChestAnnouncerControl() {
  const { data: settings } = usePolledQuery(
    obsApi.chestAnnouncerSettings,
    5000,
  );

  // Local overrides so controls respond instantly while the PATCH is
  // in flight (and on the next poll for the rest of the page). Mirrors
  // the server values when a fresh response advances `updated_at`.
  const [audioOverride, setAudioOverride] = useState<boolean | null>(null);
  const [ttsOverride, setTtsOverride] = useState<boolean | null>(null);
  // Pacing — three numeric settings drafted together and saved as one
  // PATCH so the operator doesn't have to click Save three times.
  const [pacingBetween, setPacingBetween] = useState<number>(1500);
  const [pacingMinHold, setPacingMinHold] = useState<number>(2800);
  const [pacingMaxHold, setPacingMaxHold] = useState<number>(20_000);
  // Scene-size multiplier — same draft+save story as pacing.
  const [scaleDraft, setScaleDraft] = useState<number>(1);
  const lastUpdatedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!settings) return;
    if (settings.updated_at !== lastUpdatedRef.current) {
      lastUpdatedRef.current = settings.updated_at;
      setAudioOverride(null);
      setTtsOverride(null);
      setPacingBetween(settings.between_cards_ms);
      setPacingMinHold(settings.card_min_hold_ms);
      setPacingMaxHold(settings.card_max_hold_ms);
      setScaleDraft(settings.scale);
    }
  }, [settings]);

  const audioEnabled = audioOverride ?? settings?.audio_enabled ?? false;
  // TTS defaults true server-side (the omnibar no longer speaks), so the
  // fallback here is true too.
  const ttsEnabled = ttsOverride ?? settings?.tts_enabled ?? true;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const setAudioEnabled = async (next: boolean) => {
    setAudioOverride(next);
    setBusy(true);
    setErr(null);
    try {
      await obsApi.updateChestAnnouncerSettings({ audio_enabled: next });
    } catch (e) {
      setErr((e as Error).message);
      setAudioOverride(null);
    } finally {
      setBusy(false);
    }
  };

  const setTtsEnabled = async (next: boolean) => {
    setTtsOverride(next);
    setBusy(true);
    setErr(null);
    try {
      await obsApi.updateChestAnnouncerSettings({ tts_enabled: next });
    } catch (e) {
      setErr((e as Error).message);
      setTtsOverride(null);
    } finally {
      setBusy(false);
    }
  };

  const pacingDirty = settings
    ? pacingBetween !== settings.between_cards_ms ||
      pacingMinHold !== settings.card_min_hold_ms ||
      pacingMaxHold !== settings.card_max_hold_ms
    : false;
  const savePacing = async () => {
    // Clamp each value to the range the overlay enforces client-side,
    // and ensure max >= min so the safety cap stays above the floor.
    const between = Math.max(0, Math.min(10_000, Math.round(pacingBetween) || 0));
    const minHold = Math.max(500, Math.min(60_000, Math.round(pacingMinHold) || 0));
    const maxHold = Math.max(
      minHold,
      Math.min(300_000, Math.round(pacingMaxHold) || 0),
    );
    setPacingBetween(between);
    setPacingMinHold(minHold);
    setPacingMaxHold(maxHold);
    setBusy(true);
    setErr(null);
    try {
      await obsApi.updateChestAnnouncerSettings({
        between_cards_ms: between,
        card_min_hold_ms: minHold,
        card_max_hold_ms: maxHold,
      });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const scaleDirty = settings ? scaleDraft !== settings.scale : false;
  const saveScale = async () => {
    // Clamp to the same range the overlay enforces, rounded to a clean
    // 5% step so the persisted value matches the slider notches.
    const next = Math.max(0.25, Math.min(2, Math.round(scaleDraft * 20) / 20));
    setScaleDraft(next);
    setBusy(true);
    setErr(null);
    try {
      await obsApi.updateChestAnnouncerSettings({ scale: next });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const sourceUrl = `${window.location.origin}/obs/chest-announcer`;

  return (
    <div className="control-stack">
      <section className="control-card">
        <h2>Chest announcer</h2>
        <p className="text-white-50">
          Transparent OBS browser source that animates a pixel hero
          walking to a chest and pulling each incoming donation out as
          a card with the donor name + amount, then confetti. Scales to
          whatever rect you give it in OBS — drop it over the 3DS
          ad-panel, the full bottom strip, or the entire stage.
        </p>
        <p className="text-white-50">
          The omnibar (<code>/obs/omnibar</code>) already announces
          donations via TTS. Pair the two by leaving audio off here so
          this overlay stays silent. Turn it on when this is the only
          donation surface in the scene or you want the extra audio
          celebration.
        </p>
      </section>

      <section className="control-card">
        <h2>Audio</h2>
        <div className="control-btn-row" style={{ alignItems: 'center', gap: '1rem' }}>
          <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={audioEnabled}
              onChange={(e) => void setAudioEnabled(e.target.checked)}
              disabled={busy || !settings}
              style={{ width: 20, height: 20 }}
            />
            <span>
              <strong>Play fanfare on each donation card reveal</strong>
              <br />
              <small className="text-white-50">
                Short ascending arpeggio (~700 ms, square wave). Polled
                every 5 s — changes propagate to every running OBS
                browser source without a refresh.
              </small>
            </span>
          </label>
          <button
            type="button"
            className="btn btn-bloodmoon"
            onClick={() => playFanfare()}
          >
            Test fanfare
          </button>
        </div>
        <div className="control-btn-row mt-3" style={{ alignItems: 'center', gap: '1rem' }}>
          <label className="d-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={ttsEnabled}
              onChange={(e) => void setTtsEnabled(e.target.checked)}
              disabled={busy || !settings}
              style={{ width: 20, height: 20 }}
            />
            <span>
              <strong>Read donations aloud (TTS)</strong>
              <br />
              <small className="text-white-50">
                The character reads each donation — donor, amount and
                message — aloud via browser speech as the card is held up.
                This is the primary donation readout (the omnibar no longer
                speaks). Independent of the fanfare toggle above.
              </small>
            </span>
          </label>
        </div>
        {err && <div className="text-danger small mt-2">{err}</div>}
        {settings && (
          <div className="small text-white-50 mt-2">
            Last changed:{' '}
            {new Date(settings.updated_at).toLocaleTimeString('en-GB')}
          </div>
        )}
      </section>

      <section className="control-card">
        <h2>Size</h2>
        <p className="text-white-50">
          Scales the whole scene — hero, chest, donation card and
          confetti — relative to the OBS browser-source size. The default
          (1.0) is tuned for a short capture rect; a full 1920×1080 source
          makes the character huge, so dial this down until it sits right.
          The walking line stays pinned, so the scene shrinks toward the
          floor. Polled every 5 s — no OBS refresh needed.
        </p>
        <div
          className="control-btn-row"
          style={{ alignItems: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}
        >
          <label className="d-flex flex-column" style={{ flex: '1 1 220px' }}>
            <small className="text-white-50">
              Scene scale: <strong>{scaleDraft.toFixed(2)}×</strong>
            </small>
            <input
              type="range"
              min={0.25}
              max={2}
              step={0.05}
              value={scaleDraft}
              onChange={(e) => setScaleDraft(Number(e.target.value))}
              disabled={busy || !settings}
            />
            <small className="text-white-50" style={{ fontSize: '0.8em' }}>
              0.25× – 2.00×
            </small>
          </label>
          <label className="d-flex flex-column">
            <small className="text-white-50">Exact</small>
            <input
              type="number"
              min={0.25}
              max={2}
              step={0.05}
              value={scaleDraft}
              onChange={(e) => setScaleDraft(Number(e.target.value) || 0)}
              disabled={busy || !settings}
              style={{ width: 100 }}
            />
          </label>
          <button
            type="button"
            className="btn btn-sm btn-bloodmoon"
            disabled={!scaleDirty || busy || !settings}
            onClick={() => void saveScale()}
            style={{ minWidth: 72 }}
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </section>

      <section className="control-card">
        <h2>Pacing</h2>
        <p className="text-white-50">
          Timing knobs for the reveal sequence. <strong>Pause between
          cards</strong> is the idle gap after the confetti, before the
          hero reaches into the chest for the next donation.{' '}
          <strong>Min hold</strong> is the floor on how long a donor's
          card stays on screen, even if the sound was short.{' '}
          <strong>Max hold</strong> is the safety ceiling for a runaway
          long sting — once the card has been up this long, the queue
          moves on regardless of audio. All three are saved together.
        </p>
        <div className="control-btn-row" style={{ alignItems: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label className="d-flex flex-column">
            <small className="text-white-50">Pause between cards (ms)</small>
            <input
              type="number"
              min={0}
              max={10000}
              step={100}
              value={pacingBetween}
              onChange={(e) => setPacingBetween(Number(e.target.value) || 0)}
              disabled={busy || !settings}
              style={{ width: 140 }}
            />
            <small className="text-white-50" style={{ fontSize: '0.8em' }}>0–10000</small>
          </label>
          <label className="d-flex flex-column">
            <small className="text-white-50">Min card hold (ms)</small>
            <input
              type="number"
              min={500}
              max={60000}
              step={100}
              value={pacingMinHold}
              onChange={(e) => setPacingMinHold(Number(e.target.value) || 0)}
              disabled={busy || !settings}
              style={{ width: 140 }}
            />
            <small className="text-white-50" style={{ fontSize: '0.8em' }}>500–60000</small>
          </label>
          <label className="d-flex flex-column">
            <small className="text-white-50">Max card hold (ms)</small>
            <input
              type="number"
              min={500}
              max={300000}
              step={500}
              value={pacingMaxHold}
              onChange={(e) => setPacingMaxHold(Number(e.target.value) || 0)}
              disabled={busy || !settings}
              style={{ width: 140 }}
            />
            <small className="text-white-50" style={{ fontSize: '0.8em' }}>
              ≥ min, ≤ 300000
            </small>
          </label>
          <button
            type="button"
            className="btn btn-sm btn-bloodmoon"
            disabled={!pacingDirty || busy || !settings}
            onClick={() => void savePacing()}
            style={{ minWidth: 72 }}
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
        {pacingMaxHold < pacingMinHold && (
          <div className="text-warning small mt-2">
            Max hold is below min hold — it'll be coerced to{' '}
            {pacingMinHold} ms on save.
          </div>
        )}
      </section>

      <SoundTriggersSection />

      <section className="control-card">
        <h2>Source URL</h2>
        <p className="text-white-50">
          Same URL whether audio is on or off — the setting lives on
          the backend, so you don't need to maintain different URLs
          per scene.
        </p>
        <code className="d-block small text-warning mb-2 text-break">{sourceUrl}</code>
        <div className="control-btn-row">
          <Link
            to="/obs/chest-announcer"
            className="btn btn-sm btn-bloodmoon"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open preview
          </Link>
          <button
            type="button"
            className="btn btn-sm btn-outline-light"
            onClick={() => void navigator.clipboard.writeText(sourceUrl)}
          >
            Copy URL
          </button>
        </div>
      </section>

      <section className="control-card">
        <h2>Notes</h2>
        <ul className="text-white-50" style={{ paddingLeft: '1.2rem', margin: 0 }}>
          <li>
            Sound trigger URLs are loaded directly by the browser as
            standard <code>&lt;audio&gt;</code> elements — same MIME-type
            rules as any web audio (mp3 / wav / ogg / m4a). The
            streamer is responsible for ensuring any audio they
            reference here is properly licensed; nothing is bundled.
          </li>
          <li>
            Trigger evaluation order is by <code>priority</code>
            (lowest first). When multiple rules match the same
            donation, the highest-priority active rule wins. No match
            → procedural fanfare plays as the fallback.
          </li>
          <li>
            Cold-boot suppression is on: existing donations are marked
            "already seen" the first time the route loads, so reloading
            mid-stream doesn't replay the queue.
          </li>
          <li>
            Hero sprites default to inline-SVG placeholders. To swap in
            real character art, run{' '}
            <code>python frontend/tools/build-chest-sprites.py --with-hero</code>{' '}
            and flip <code>USE_REAL_HERO_SPRITES</code> in{' '}
            <code>ChestAnnouncer.tsx</code>.
          </li>
          <li>
            The chest sprite is procedurally generated by the same
            build script and committed as <code>chest.png</code> —
            already real, no opt-in required.
          </li>
        </ul>
      </section>
    </div>
  );
}

// ── Sound triggers section ─────────────────────────────────────────────
//
// CRUD for ChestAnnouncerSoundTrigger rows. Each trigger maps an
// incoming donation onto a specific audio file via game / amount /
// keyword matching. Triggers are evaluated in priority order at the
// moment a card pops in /obs/chest-announcer — no match → procedural
// fanfare fallback.

type TriggerSortKey = 'priority' | 'name' | 'kind' | 'match' | 'volume' | 'active';
type TriggerKindFilter = 'all' | ChestAnnouncerSoundTriggerKind;
type TriggerActiveFilter = 'all' | 'active' | 'inactive';

function SoundTriggersSection() {
  const { data: triggers } = usePolledQuery(
    obsApi.chestAnnouncerSoundTriggers,
    5000,
  );
  // Games rarely change during a stream; 60s is plenty for the dropdown.
  const { data: games } = usePolledQuery(obsApi.games, 60_000);
  const [creating, setCreating] = useState(false);
  const { widths, startResize } = useResizableColumns(
    TRIGGER_COLUMN_STORAGE_KEY,
    TRIGGER_COLUMN_DEFAULTS,
  );

  // Sort + filter state. Defaults preserve the previous behaviour
  // (priority ASC) so anyone landing on the page sees the same
  // evaluator-order layout they're used to.
  const [sortKey, setSortKey] = useState<TriggerSortKey>('priority');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState('');
  const [kindFilter, setKindFilter] = useState<TriggerKindFilter>('all');
  const [activeFilter, setActiveFilter] = useState<TriggerActiveFilter>('all');

  const toggleSort = (key: string) => {
    const k = key as TriggerSortKey;
    if (sortKey === k) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(k);
      // 'priority' / 'volume' default to ASC (small numbers first);
      // text columns default to ASC alphabetically; 'active' defaults
      // to DESC so true (1) bubbles to the top. Keeps the first click
      // showing what the operator usually wants.
      setSortDir(k === 'active' ? 'desc' : 'asc');
    }
  };

  const visibleTriggers = useMemo(() => {
    let list = triggers ?? [];
    if (kindFilter !== 'all') list = list.filter((t) => t.kind === kindFilter);
    if (activeFilter !== 'all') {
      const wantActive = activeFilter === 'active';
      list = list.filter((t) => t.is_active === wantActive);
    }
    const q = filter.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.match.toLowerCase().includes(q) ||
          (t.game_title || '').toLowerCase().includes(q) ||
          t.kind.toLowerCase().includes(q),
      );
    }
    const sorted = [...list].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      switch (sortKey) {
        case 'priority': av = a.priority; bv = b.priority; break;
        case 'name': av = a.name.toLowerCase(); bv = b.name.toLowerCase(); break;
        case 'kind': av = a.kind; bv = b.kind; break;
        case 'match': av = a.match.toLowerCase(); bv = b.match.toLowerCase(); break;
        case 'volume': av = a.volume; bv = b.volume; break;
        case 'active': av = a.is_active ? 1 : 0; bv = b.is_active ? 1 : 0; break;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      // Tiebreakers — always priority → kind → game title, regardless
      // of the active sort, so the list within a tier stays in the
      // evaluator's order. Stable Array.prototype.sort means ties on
      // every key keep the server-returned order.
      if (sortKey !== 'priority' && a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      if (sortKey !== 'kind' && a.kind !== b.kind) {
        return a.kind.localeCompare(b.kind);
      }
      return (a.game_title || '').localeCompare(b.game_title || '');
    });
    return sorted;
  }, [triggers, filter, kindFilter, activeFilter, sortKey, sortDir]);

  const totalCount = triggers?.length ?? 0;
  const visibleCount = visibleTriggers.length;
  const hasActiveFilter =
    filter.trim().length > 0 || kindFilter !== 'all' || activeFilter !== 'all';
  const clearFilters = () => {
    setFilter('');
    setKindFilter('all');
    setActiveFilter('all');
  };

  return (
    <section className="control-card">
      <h2>Sound triggers</h2>
      <p className="text-white-50">
        Rules that override the default fanfare with a specific audio
        file. Each donation evaluates triggers in priority order
        (lowest number first); the first active match plays its sound,
        otherwise the fanfare fires. Audio URLs are loaded directly by
        the OBS browser — the streamer is responsible for hosting and
        licensing whatever they point at.
      </p>

      <PatternExplainer />

      {/* Sort + filter controls. Sort is also driven by clicking any
       *  header (see ResizableTh `sortKey` props below); the filter
       *  row here is the only way to narrow the visible list. Counts
       *  show "visible / total" so the operator can tell at a glance
       *  whether they're looking at the full set. */}
      <div className="control-btn-row mt-2 align-items-center" style={{ gap: '0.5rem' }}>
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name, match, game, kind…"
          className="form-control form-control-sm"
          style={{ maxWidth: 280 }}
        />
        <select
          className="form-select form-select-sm"
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as TriggerKindFilter)}
          style={{ width: 'auto' }}
          title="Filter by trigger kind"
        >
          <option value="all">All kinds</option>
          <option value="amount">Amount</option>
          <option value="game">Game</option>
          <option value="keyword">Keyword</option>
        </select>
        <select
          className="form-select form-select-sm"
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as TriggerActiveFilter)}
          style={{ width: 'auto' }}
          title="Filter by active state"
        >
          <option value="all">Active + inactive</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        {hasActiveFilter && (
          <button
            type="button"
            className="btn btn-sm btn-outline-light"
            onClick={clearFilters}
            title="Reset all filters"
          >
            Clear filters
          </button>
        )}
        <span className="text-white-50 small ms-auto">
          {hasActiveFilter
            ? `${visibleCount} of ${totalCount} shown`
            : `${totalCount} trigger${totalCount === 1 ? '' : 's'}`}
        </span>
      </div>

      {/* `table-layout: fixed` is what makes drag-resize actually
       *  shrink the Match column. With the default `auto` layout
       *  the browser respects the <input>'s ~200px intrinsic
       *  min-width and refuses to honour a narrower <th> width;
       *  switching to fixed makes the <th> the single source of
       *  truth. Paired with the `chest-trigger-table` CSS overrides
       *  below that set `min-width: 0` on the inputs themselves.
       *
       *  The .control-table-scroll wrapper confines the table's
       *  ~1274px of fixed column widths to a horizontal scroller
       *  inside the card — without it the table forces the whole
       *  /control page wider than the viewport on narrow / mobile
       *  screens. Same pattern as the /control/donations table; it
       *  also pins the trailing actions column so Test/Save/Delete
       *  stay reachable however far the operator scrolls. */}
      <div className="control-table-scroll mt-2">
      <table className="control-table chest-trigger-table" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <ResizableTh
              width={widths.pri}
              onResizeStart={(e) => startResize('pri', e)}
              sortKey="priority"
              activeSortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
            >
              Pri
            </ResizableTh>
            <ResizableTh
              width={widths.name}
              onResizeStart={(e) => startResize('name', e)}
              sortKey="name"
              activeSortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
            >
              Name
            </ResizableTh>
            <ResizableTh
              width={widths.kind}
              onResizeStart={(e) => startResize('kind', e)}
              sortKey="kind"
              activeSortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
            >
              Kind
            </ResizableTh>
            <ResizableTh
              width={widths.match}
              onResizeStart={(e) => startResize('match', e)}
              sortKey="match"
              activeSortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
            >
              Match
            </ResizableTh>
            <ResizableTh
              width={widths.sound_url}
              onResizeStart={(e) => startResize('sound_url', e)}
            >
              Sound URL
            </ResizableTh>
            <ResizableTh
              width={widths.volume}
              onResizeStart={(e) => startResize('volume', e)}
              sortKey="volume"
              activeSortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
            >
              Volume
            </ResizableTh>
            <ResizableTh
              width={widths.active}
              onResizeStart={(e) => startResize('active', e)}
              sortKey="active"
              activeSortKey={sortKey}
              sortDir={sortDir}
              onSort={toggleSort}
            >
              Active
            </ResizableTh>
            <ResizableTh width={widths.actions} onResizeStart={(e) => startResize('actions', e)}>{''}</ResizableTh>
          </tr>
        </thead>
        <tbody>
          {!triggers && (
            <tr>
              <td colSpan={8} className="text-white-50">Loading…</td>
            </tr>
          )}
          {triggers && triggers.length === 0 && !creating && (
            <tr>
              <td colSpan={8} className="text-white-50">
                No triggers yet — click "+ Add trigger" to wire up your
                first one.
              </td>
            </tr>
          )}
          {triggers && triggers.length > 0 && visibleCount === 0 && (
            <tr>
              <td colSpan={8} className="text-white-50">
                No triggers match the current filters.{' '}
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </td>
            </tr>
          )}
          {visibleTriggers.map((t) => (
            <TriggerRow key={t.id} trigger={t} games={games ?? []} />
          ))}
          {creating && (
            <CreateTriggerRow
              games={games ?? []}
              onDone={() => setCreating(false)}
            />
          )}
        </tbody>
      </table>
      </div>

      {!creating && (
        <div className="control-btn-row mt-2">
          <button
            type="button"
            className="btn btn-sm btn-bloodmoon"
            onClick={() => setCreating(true)}
          >
            + Add trigger
          </button>
        </div>
      )}
    </section>
  );
}

// ── A row that displays + edits an existing trigger ────────────────────
//
// Per-row local draft state with a `Save` button that's only enabled
// when the draft differs from the server value. Test plays the sound,
// Delete prompts then removes. Polling reconciles the draft when the
// server changes from elsewhere.

function TriggerRow({
  trigger,
  games,
}: {
  trigger: ChestAnnouncerSoundTrigger;
  games: Game[];
}) {
  // Two pieces of state:
  //   draft       — what the inputs currently show (operator-controlled).
  //   savedDraft  — the most recent server-confirmed value. Compared
  //                 against `draft` for the dirty check, so the Save
  //                 button toggles to "no unsaved changes" the instant
  //                 the PATCH resolves instead of waiting for the
  //                 parent's 5-second poll to refresh the `trigger` prop.
  const [draft, setDraft] = useState<ChestAnnouncerSoundTrigger>(trigger);
  const [savedDraft, setSavedDraft] = useState<ChestAnnouncerSoundTrigger>(trigger);
  const lastUpdatedRef = useRef(trigger.updated_at);
  useEffect(() => {
    // If the server-side updated_at advanced past whatever we last
    // confirmed locally (another tab edited this trigger, or the
    // post-PATCH poll caught up), sync both draft + savedDraft to the
    // fresh value. Otherwise keep the operator's unsaved local edits.
    if (trigger.updated_at !== lastUpdatedRef.current) {
      lastUpdatedRef.current = trigger.updated_at;
      setDraft(trigger);
      setSavedDraft(trigger);
    }
  }, [trigger]);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(savedDraft);

  const set = <K extends keyof ChestAnnouncerSoundTrigger>(
    key: K,
    value: ChestAnnouncerSoundTrigger[K],
  ) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      const updated = await obsApi.updateChestAnnouncerSoundTrigger(trigger.id, {
        name: draft.name,
        kind: draft.kind,
        match: draft.match,
        game: draft.game,
        sound_url: draft.sound_url,
        volume: draft.volume,
        priority: draft.priority,
        is_active: draft.is_active,
      });
      // Pin both draft and savedDraft to the server response so the
      // dirty check flips false immediately — no waiting for the next
      // 5-second poll to clear the "unsaved" indicator.
      setDraft(updated);
      setSavedDraft(updated);
      lastUpdatedRef.current = updated.updated_at;
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete trigger "${trigger.name}"?`)) return;
    setBusy(true);
    setErr(null);
    try {
      await obsApi.deleteChestAnnouncerSoundTrigger(trigger.id);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  const duplicate = async () => {
    setBusy(true);
    setErr(null);
    try {
      await obsApi.duplicateChestAnnouncerSoundTrigger(trigger.id);
      // The polling loop will surface the new row in the table; no
      // local state update needed here.
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr>
      <td>
        <input
          type="number"
          min={0}
          value={draft.priority}
          onChange={(e) => set('priority', Number(e.target.value) || 0)}
          style={{ width: 70 }}
        />
      </td>
      <td>
        <input
          value={draft.name}
          onChange={(e) => set('name', e.target.value)}
          style={{ width: '100%' }}
        />
      </td>
      <td>
        <select
          value={draft.kind}
          onChange={(e) =>
            set('kind', e.target.value as ChestAnnouncerSoundTriggerKind)
          }
        >
          <option value="game">Game</option>
          <option value="amount">Amount</option>
          <option value="keyword">Keyword</option>
        </select>
      </td>
      <td>
        <MatchCell
          kind={draft.kind}
          match={draft.match}
          game={draft.game}
          games={games}
          onChangeMatch={(v) => set('match', v)}
          onChangeGame={(v) => set('game', v)}
        />
      </td>
      <td>
        <input
          value={draft.sound_url}
          onChange={(e) => set('sound_url', e.target.value)}
          placeholder="https://… or /assets/snd/…"
          style={{ width: '100%' }}
        />
      </td>
      <td>
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={draft.volume}
          onChange={(e) => set('volume', Number(e.target.value) || 0)}
          style={{ width: 65 }}
        />
      </td>
      <td>
        <input
          type="checkbox"
          checked={draft.is_active}
          onChange={(e) => set('is_active', e.target.checked)}
        />
      </td>
      <td className="control-btn-row" style={{ flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
        <button
          type="button"
          className="btn btn-sm btn-outline-light"
          disabled={busy || !draft.sound_url}
          onClick={() => void playSound(draft.sound_url, draft.volume)}
          title="Play the configured sound now"
        >
          Test
        </button>
        <button
          type="button"
          className="btn btn-sm btn-bloodmoon"
          disabled={busy || !dirty}
          onClick={() => void save()}
          style={{ minWidth: 72 }}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-light"
          disabled={busy}
          onClick={() => void duplicate()}
          title="Clone this trigger (starts inactive, priority +1)"
        >
          ⎘
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          disabled={busy}
          onClick={() => void remove()}
        >
          ✕
        </button>
        {err && <span className="text-danger small ms-2">{err}</span>}
      </td>
    </tr>
  );
}

// ── The "add new trigger" row ──────────────────────────────────────────
//
// Lives at the bottom of the table when expanded. Same shape as
// TriggerRow but commits via POST and disappears on success.

function CreateTriggerRow({
  games,
  onDone,
}: {
  games: Game[];
  onDone: () => void;
}) {
  const [draft, setDraft] = useState<Partial<ChestAnnouncerSoundTrigger>>({
    name: '',
    kind: 'amount',
    match: '',
    game: null,
    sound_url: '',
    volume: 0.6,
    priority: 10,
    is_active: true,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof ChestAnnouncerSoundTrigger>(
    key: K,
    value: ChestAnnouncerSoundTrigger[K],
  ) => setDraft((d) => ({ ...d, [key]: value }));

  const create = async () => {
    if (!draft.name?.trim() || !draft.sound_url?.trim()) {
      setErr('Name and sound URL are required.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await obsApi.createChestAnnouncerSoundTrigger(draft);
      onDone();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
      <td>
        <input
          type="number"
          min={0}
          value={draft.priority ?? 10}
          onChange={(e) => set('priority', Number(e.target.value) || 0)}
          style={{ width: 70 }}
        />
      </td>
      <td>
        <input
          value={draft.name ?? ''}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. £6.70 sting"
          style={{ width: '100%' }}
        />
      </td>
      <td>
        <select
          value={draft.kind ?? 'keyword'}
          onChange={(e) =>
            set('kind', e.target.value as ChestAnnouncerSoundTriggerKind)
          }
        >
          <option value="game">Game</option>
          <option value="amount">Amount</option>
          <option value="keyword">Keyword</option>
        </select>
      </td>
      <td>
        <MatchCell
          kind={draft.kind ?? 'keyword'}
          match={draft.match ?? ''}
          game={draft.game ?? null}
          games={games}
          onChangeMatch={(v) => set('match', v)}
          onChangeGame={(v) => set('game', v)}
        />
      </td>
      <td>
        <input
          value={draft.sound_url ?? ''}
          onChange={(e) => set('sound_url', e.target.value)}
          placeholder="https://… or /assets/snd/…"
          style={{ width: '100%' }}
        />
      </td>
      <td>
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={draft.volume ?? 0.6}
          onChange={(e) => set('volume', Number(e.target.value) || 0)}
          style={{ width: 65 }}
        />
      </td>
      <td>
        <input
          type="checkbox"
          checked={draft.is_active ?? true}
          onChange={(e) => set('is_active', e.target.checked)}
        />
      </td>
      <td className="control-btn-row" style={{ flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
        <button
          type="button"
          className="btn btn-sm btn-bloodmoon"
          disabled={busy}
          onClick={() => void create()}
        >
          Create
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-light"
          disabled={busy}
          onClick={onDone}
        >
          Cancel
        </button>
        {err && <span className="text-danger small ms-2">{err}</span>}
      </td>
    </tr>
  );
}

// ── Match-condition cell ───────────────────────────────────────────────
//
// Renders the right input depending on the trigger kind:
//   game     → <select> from the games list (writes the FK id).
//   amount   → text input for "6.70".
//   keyword  → text input for comma-separated terms.

function MatchCell({
  kind,
  match,
  game,
  games,
  onChangeMatch,
  onChangeGame,
}: {
  kind: ChestAnnouncerSoundTriggerKind;
  match: string;
  game: number | null;
  games: Game[];
  onChangeMatch: (v: string) => void;
  onChangeGame: (v: number | null) => void;
}) {
  if (kind === 'game') {
    // Show the selected game's box art next to the dropdown so the
    // operator can see at a glance which title each game-kind trigger
    // is bound to. `<select>` can't render images in its options
    // (browser limitation), so the thumbnail lives outside the select
    // and reflects whichever game is currently chosen. A dashed
    // placeholder occupies the same footprint when no game is picked
    // (or the picked game has no `box_art_url`) so the row layout
    // doesn't shift when the operator changes selection.
    const selected = game != null ? games.find((g) => g.id === game) : null;
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          minWidth: 0,
        }}
      >
        {selected?.box_art_url ? (
          <img
            src={selected.box_art_url}
            alt=""
            style={{
              width: 24,
              height: 32,
              objectFit: 'cover',
              borderRadius: 2,
              flexShrink: 0,
              background: 'rgba(0, 0, 0, 0.25)',
            }}
          />
        ) : (
          <div
            style={{
              width: 24,
              height: 32,
              borderRadius: 2,
              border: '1px dashed rgba(255, 255, 255, 0.2)',
              background: 'rgba(255, 255, 255, 0.04)',
              flexShrink: 0,
            }}
            aria-hidden
          />
        )}
        <select
          value={game ?? ''}
          onChange={(e) =>
            onChangeGame(e.target.value ? Number(e.target.value) : null)
          }
          style={{ flex: 1, minWidth: 0 }}
          title={selected?.title}
        >
          <option value="">— pick a game —</option>
          {games.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
      </div>
    );
  }
  return (
    <input
      value={match}
      onChange={(e) => onChangeMatch(e.target.value)}
      placeholder={
        kind === 'amount'
          ? '69 or ^69\\.00$ (regex on amount)'
          : 'happy|birthday|zelda (regex on message)'
      }
      style={{ width: '100%' }}
    />
  );
}

// ── Pattern explainer ──────────────────────────────────────────────────
//
// Collapsible reference card spelling out how each trigger kind's
// `match` value is interpreted, with concrete example patterns. Lives
// inside the Sound triggers section so it's discoverable but not
// always-on noise. Mirrors the omnibar control's PayloadHelp pattern.

const AMOUNT_EXAMPLES: { pattern: string; matches: string }[] = [
  { pattern: '69',            matches: 'Any amount containing the digits "69" anywhere — 69.00, 0.69, 23.69, 169.00.' },
  { pattern: '^69\\.00$',     matches: 'Exactly 69.00. Nothing else.' },
  { pattern: '.*69\\.00$',    matches: 'Anything ending in 69.00 pounds — 69.00, 169.00, 269.00.' },
  { pattern: '\\.69$',        matches: 'Anything ending in 69 pence — 0.69, 1.69, 42.69.' },
  { pattern: '^[0-9]+\\.69$', matches: 'Stricter "ends in 69 pence" — only valid amounts, no extra chars.' },
  { pattern: '^(13|31|42)\\.', matches: 'Pounds is 13, 31, or 42 — anchor matches any pence.' },
];

function PatternExplainer() {
  return (
    <details
      className="mt-2 mb-3 text-white-50"
      style={{ fontSize: '0.9em' }}
    >
      <summary style={{ cursor: 'pointer' }}>
        How does <code>Match</code> work?
      </summary>

      <div className="mt-2" style={{ paddingLeft: '0.5rem' }}>
        <h4 style={{ fontSize: '1em', margin: '0.5rem 0 0.25rem', color: 'var(--theme-text, #fff)' }}>
          Game
        </h4>
        <p className="mb-2">
          The <code>Match</code> column is unused — pick the game from
          the dropdown instead. Trigger fires while that game is the
          currently-playing schedule entry (see{' '}
          <code>/control/schedule</code> for which entry is live).
        </p>

        <h4 style={{ fontSize: '1em', margin: '0.5rem 0 0.25rem', color: 'var(--theme-text, #fff)' }}>
          Amount
        </h4>
        <p className="mb-2">
          The <code>Match</code> string is compiled as a JavaScript regex
          and tested against the bare amount string — e.g.{' '}
          <code>69.00</code>, <code>0.69</code>, <code>23.69</code>.
          Currency glyphs (<code>£</code>, <code>$</code>, <code>€</code>,{' '}
          <code>¥</code>) are stripped from the pattern automatically,
          so <code>^£69\.00$</code> works the same as{' '}
          <code>^69\.00$</code> — don't worry if you copy a pattern
          with a currency symbol in it. Invalid regex silently skips
          the rule. Common patterns:
        </p>
        <table className="control-table" style={{ fontSize: '0.95em' }}>
          <thead>
            <tr>
              <th style={{ width: 220 }}>Pattern</th>
              <th>Matches</th>
            </tr>
          </thead>
          <tbody>
            {AMOUNT_EXAMPLES.map((ex) => (
              <tr key={ex.pattern}>
                <td><code>{ex.pattern}</code></td>
                <td>{ex.matches}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mb-2 mt-2">
          A few regex notes for operators who haven't met it before:{' '}
          <code>^</code> anchors to the start, <code>$</code> to the end;{' '}
          <code>\.</code> matches a literal dot (without the backslash{' '}
          <code>.</code> means "any single character"); <code>[0-9]+</code>{' '}
          means "one or more digits"; <code>(a|b|c)</code> matches any of{' '}
          a, b, or c.
        </p>

        <h4 style={{ fontSize: '1em', margin: '0.5rem 0 0.25rem', color: 'var(--theme-text, #fff)' }}>
          Keyword
        </h4>
        <p className="mb-2">
          The <code>Match</code> string is compiled as a
          case-insensitive JavaScript regex and tested against the
          donation message. Use <code>|</code> for alternation —{' '}
          <code>boss|master sword|ganon</code> matches a message
          containing any of those substrings. Anchors (<code>^</code>,{' '}
          <code>$</code>), character classes (<code>[a-z]</code>),
          quantifiers (<code>+</code>, <code>*</code>, <code>?</code>),
          and word boundaries (<code>\b</code>) all work. Invalid regex
          silently skips the rule.
        </p>
        <p className="mb-2">
          <strong>Backward compat:</strong> a pattern that contains
          commas and no <code>|</code> is treated as the old comma-
          separated list and converted to alternation under the hood,
          so an existing <code>happy,birthday,zelda</code> rule keeps
          firing without any edit needed.
        </p>
        <table className="control-table" style={{ fontSize: '0.95em' }}>
          <thead>
            <tr>
              <th style={{ width: 220 }}>Pattern</th>
              <th>Matches</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>boss|master sword</code></td>
              <td>Messages mentioning either "boss" or "master sword" anywhere.</td>
            </tr>
            <tr>
              <td><code>\bgg\b</code></td>
              <td>"gg" as a standalone word — won't match "eggs" or "egg".</td>
            </tr>
            <tr>
              <td><code>^thanks</code></td>
              <td>Message starts with "thanks" (case-insensitive).</td>
            </tr>
            <tr>
              <td><code>happy,birthday,zelda</code></td>
              <td>Auto-converted to <code>happy|birthday|zelda</code> (legacy form).</td>
            </tr>
          </tbody>
        </table>

        <p className="mb-0">
          <strong>Priority:</strong> the lowest-numbered active trigger
          that matches wins. Use small numbers (0, 1, 2…) for
          high-priority surprises and larger numbers for fallbacks.
        </p>
      </div>
    </details>
  );
}
