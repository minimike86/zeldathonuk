import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFloppyDisk,
  faRotateLeft,
  faPlay,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import {
  obsApi,
  usePolledQuery,
  type CharitySlide,
  type CharitySlideKind,
  type ExternalEvent,
  type Incentive,
  type Milestone,
  type OmnibarLane,
  type OmnibarOverride,
  type PlaythroughEvent,
  type ScheduleEntry,
  type ScheduleEntrySoundTrigger,
  type SoundAsset,
  type TriggerAnchor,
} from '@/lib/obsApi';
import { triggerTestSplash } from '@/lib/splashBus';
import { DonationSplash } from '@/routes/obs/omnibar/panels/DonationSplash';
import { EventBusProvider } from '@/routes/obs/omnibar/bus/EventBus';
import {
  ALL_PANEL_IDS,
  DEFAULT_DONATION_REEL,
  DEFAULT_LAYOUT,
  parseLayout,
  readDonationReelConfig,
  REEL_ANIM_MAX_MS,
  REEL_ANIM_MIN_MS,
  REEL_DWELL_MAX_MS,
  REEL_DWELL_MIN_MS,
  REEL_LEAD_IN_MAX_MS,
  REEL_LEAD_IN_MIN_MS,
  REEL_LENGTH_MAX,
  REEL_LENGTH_MIN,
  type DonationReelConfig,
  type DonationReelDirection,
  type PanelId,
} from '@/routes/obs/omnibar/hooks/useLayoutConfig';
import { SoundLibrarySection } from './SoundLibrarySection';
import { useTableControls, type TableColumn } from './useTableControls';
import {
  DEFAULT_TRANSITION,
  DELAY_MAX_MS,
  DELAY_MIN_MS,
  DURATION_MAX_MS,
  DURATION_MIN_MS,
  DWELL_MAX_MS,
  DWELL_MIN_MS,
  parseTransitions,
  type AnimDirection,
  type PanelTransition,
} from '@/routes/obs/omnibar/hooks/useTransitionsConfig';

/**
 * Operator test surface for the new omnibar pipeline.
 *
 * Five sections, each backed by one of the new endpoints:
 *   1. Overrides         — urgent/spotlight banners
 *   2. Playthrough events — boss-defeated / item-collected / death / …
 *   3. Incentives        — donation targets with progress
 *   4. Milestones        — event-wide donation thresholds
 *   5. External events   — Twitch / Discord webhook stream
 *
 * Every action hits a single endpoint so an operator can verify the
 * pipeline end-to-end without leaving the page: fire an event here, see
 * it show up on /obs/omnibar within 1–3 s of poll latency.
 */
interface OmnibarTab {
  id: string;
  label: string;
  render: () => ReactNode;
}

const OMNIBAR_TABS: OmnibarTab[] = [
  { id: 'sandbox',           label: 'Sandbox',           render: () => <SandboxSection /> },
  { id: 'layout',            label: 'Lane layout',       render: () => <LayoutSection /> },
  { id: 'transitions',       label: 'Panel transitions', render: () => <TransitionsSection /> },
  { id: 'donation-reel',     label: 'Donation reel',     render: () => <DonationReelSection /> },
  { id: 'sound-library',     label: 'Sound library',     render: () => <SoundLibrarySection /> },
  { id: 'schedule-triggers', label: 'Schedule sounds',   render: () => <ScheduleSoundTriggersSection /> },
  { id: 'splash',            label: 'Donation splash',   render: () => <SplashSection /> },
  { id: 'charity',           label: 'Charity slides',    render: () => <CharitySlidesSection /> },
  { id: 'overrides',         label: 'Overrides',         render: () => <OverridesSection /> },
  { id: 'objective',         label: 'Objective',         render: () => <ObjectiveSection /> },
  { id: 'setpiece',          label: 'Setpiece',          render: () => <SetpieceSection /> },
  { id: 'playthrough',       label: 'Playthrough events', render: () => <PlaythroughEventsSection /> },
  { id: 'incentives',        label: 'Incentives',        render: () => <IncentivesSection /> },
  { id: 'milestones',        label: 'Milestones',        render: () => <MilestonesSection /> },
  { id: 'external',          label: 'External events',   render: () => <ExternalEventsSection /> },
];

const DEFAULT_TAB_ID = OMNIBAR_TABS[0].id;

function readTabFromHash(): string {
  if (typeof window === 'undefined') return DEFAULT_TAB_ID;
  const hash = window.location.hash.replace(/^#/, '');
  return OMNIBAR_TABS.some((t) => t.id === hash) ? hash : DEFAULT_TAB_ID;
}

export function OmnibarControl() {
  const [activeTab, setActiveTab] = useState<string>(() => readTabFromHash());

  // Cross-tab + back/forward sync via the URL hash, so deep links to
  // a specific section work and the browser history records moves
  // through the control surface.
  useEffect(() => {
    const onHash = () => setActiveTab(readTabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const selectTab = (id: string) => {
    setActiveTab(id);
    if (typeof window !== 'undefined') {
      // Replace so each tab click doesn't pile up the history stack —
      // back-button still navigates to wherever the user came from
      // rather than walking through every tab they sampled.
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  const active = OMNIBAR_TABS.find((t) => t.id === activeTab) ?? OMNIBAR_TABS[0];

  return (
    <div className="control-stack" style={{ display: 'grid', gap: '1.5rem' }}>
      <nav
        className="control-card"
        style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', padding: '0.85rem' }}
        aria-label="Omnibar control sections"
      >
        {OMNIBAR_TABS.map((tab) => {
          const isActive = tab.id === active.id;
          return (
            <button
              type="button"
              key={tab.id}
              className={`btn btn-sm ${isActive ? 'btn-bloodmoon' : 'btn-outline-light'}`}
              onClick={() => selectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
      {active.render()}
    </div>
  );
}

// ── Donation splash colour mode ─────────────────────────────────────

type SplashColorMode = 'theme' | 'gold' | 'rainbow';

function readSplashMode(layout: unknown): SplashColorMode {
  if (!layout || typeof layout !== 'object') return 'theme';
  const splash = (layout as { splash?: unknown }).splash;
  if (!splash || typeof splash !== 'object') return 'theme';
  const m = (splash as { color_mode?: unknown }).color_mode;
  if (m === 'gold' || m === 'rainbow' || m === 'theme') return m;
  return 'theme';
}

// Pool of amounts the test splash button picks from. Mirrors the
// "+£5 / +£10 / +£20" feel the user asked for, with a few outliers
// so a burst test exercises both short and long labels.
const TEST_SPLASH_AMOUNTS = [1, 2, 5, 5, 10, 10, 10, 20, 20, 50, 100];
// Matches the overlay's own STAGGER_MS so the splashes from a
// "Fire N" button click drip at the same cadence as a real burst.
const TEST_SPLASH_STAGGER_MS = 420;

function SplashSection() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [testCount, setTestCount] = useState(5);
  const current = readSplashMode(event?.omnibar_layout);

  const fireTestSplashes = () => {
    const n = Math.max(1, Math.min(50, Math.floor(testCount) || 1));
    // Stagger from the control side too — sending N postMessages all
    // at once works (the overlay's own queue would stagger them
    // anyway) but spreading the sends gives the operator a nicer
    // "click and watch them rain in" feel.
    for (let i = 0; i < n; i++) {
      const amount = TEST_SPLASH_AMOUNTS[
        Math.floor(Math.random() * TEST_SPLASH_AMOUNTS.length)
      ];
      window.setTimeout(() => {
        triggerTestSplash({
          amount,
          currency: event?.currency_symbol === '£' ? 'GBP' : 'GBP',
        });
      }, i * TEST_SPLASH_STAGGER_MS);
    }
  };

  const change = async (mode: SplashColorMode) => {
    if (!event) return;
    setBusy(true);
    try {
      // Shallow-merge into the existing omnibar_layout JSON so we
      // don't blow away the lanes config.
      const existing =
        event.omnibar_layout && typeof event.omnibar_layout === 'object'
          ? event.omnibar_layout
          : {};
      const existingSplash =
        (existing as { splash?: Record<string, unknown> }).splash &&
        typeof (existing as { splash?: Record<string, unknown> }).splash === 'object'
          ? ((existing as { splash?: Record<string, unknown> }).splash as Record<string, unknown>)
          : {};
      await obsApi.updateEvent(event.id, {
        omnibar_layout: {
          ...existing,
          splash: { ...existingSplash, color_mode: mode },
        },
      });
      setSavedAt(new Date());
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="control-card">
      <h2>Donation splash</h2>
      {!event ? (
        <p className="text-warning">No active event.</p>
      ) : (
        <>
          <p className="text-white-50">
            Colour of the pixelated "+£N" badges that pop over the
            donation total when fresh donations arrive. Stored on
            <code> Event.omnibar_layout.splash.color_mode</code>.
          </p>
          <SplashPreview colorMode={current} />
          <div className="control-btn-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
            {(['theme', 'gold', 'rainbow'] as SplashColorMode[]).map((mode) => (
              <button
                key={mode}
                className={
                  'btn btn-sm ' +
                  (current === mode ? 'btn-bloodmoon' : 'btn-outline-light')
                }
                disabled={busy}
                onClick={() => change(mode)}
              >
                {modeLabel(mode)}
              </button>
            ))}
            {savedAt && (
              <small className="text-white-50 ms-2">
                saved {fmtTime(savedAt.toISOString())}
              </small>
            )}
          </div>

          <div
            className="control-btn-row mt-3"
            style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}
          >
            <label className="d-flex flex-column">
              <small>Test splashes (count)</small>
              <input
                type="number"
                min={1}
                max={50}
                value={testCount}
                onChange={(e) => setTestCount(Number(e.target.value))}
                style={{ width: 90 }}
              />
            </label>
            <button className="btn btn-outline-light" onClick={fireTestSplashes}>
              Fire {Math.max(1, Math.min(50, Math.floor(testCount) || 1))} splash
              {testCount === 1 ? '' : 'es'}
            </button>
            <small className="text-white-50 align-self-end">
              Local-only: broadcasts to /obs/omnibar in this browser via
              <code> BroadcastChannel</code>. No donation rows created.
            </small>
          </div>
        </>
      )}
    </section>
  );
}

/** Inline preview for the Donation splash section. Renders a mini
 *  mock of the omnibar's right-cluster total with a live
 *  DonationSplash overlay, plus a "Fire preview" button that flashes
 *  a single splash badge so the operator can see what each color
 *  mode actually looks like before saving.
 *
 *  DonationSplash calls `useBusSubscription('donation-arrived', …)`
 *  internally, so we mount a local `<EventBusProvider>` here — the
 *  bus is just for the splash to subscribe to; no real donation
 *  events will flow through it on the control page, but the
 *  contract is satisfied. The splashBus (BroadcastChannel + local
 *  listeners) is what actually drives the preview button. */
function SplashPreview({ colorMode }: { colorMode: SplashColorMode }) {
  const fire = () => {
    triggerTestSplash({ amount: 10, currency: 'GBP' });
  };
  return (
    <EventBusProvider>
      <div className="mt-2 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div
          className="omnibar omnibar--v2"
          style={{
            ['--obs-stage-width' as keyof CSSProperties]: '320px' as never,
            position: 'relative',
            width: 320,
            height: 64,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div className="ob-total" style={{ width: '100%', height: '100%', justifyContent: 'center' }}>
            <div
              className="ob-total-amount-wrap"
              style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <DonationSplash colorMode={colorMode} />
              <span className="ob-total-currency" style={{ fontSize: '1.4rem' }}>£</span>
              <span className="ob-total-amount" style={{ fontSize: '1.4rem' }}>1234</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-bloodmoon"
          onClick={fire}
        >
          Fire preview
        </button>
      </div>
    </EventBusProvider>
  );
}

function modeLabel(mode: SplashColorMode): string {
  switch (mode) {
    case 'theme':   return 'Theme — active accent colour';
    case 'gold':    return 'Gold — classic money colour';
    case 'rainbow': return 'Rainbow — random hue per splash';
  }
}

// ── Charity slides ──────────────────────────────────────────────────

function CharitySlidesSection() {
  const { data: slides } = usePolledQuery(obsApi.charitySlides, 5000);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{
    kind: CharitySlideKind;
    title: string;
    body: string;
    image_url: string;
    alt_text: string;
  }>({
    kind: 'blurb',
    title: '',
    body: '',
    image_url: '',
    alt_text: '',
  });

  const create = async () => {
    if (form.kind === 'logo' && !form.image_url.trim()) return;
    if (form.kind === 'blurb' && !form.body.trim()) return;
    setBusy(true);
    try {
      const maxOrder = (slides ?? []).reduce((m, s) => Math.max(m, s.order), -1);
      await obsApi.createCharitySlide({
        kind: form.kind,
        title: form.title.trim(),
        body: form.body.trim(),
        image_url: form.image_url.trim(),
        alt_text: form.alt_text.trim(),
        order: maxOrder + 1,
      });
      setForm({ kind: form.kind, title: '', body: '', image_url: '', alt_text: '' });
    } finally {
      setBusy(false);
    }
  };

  const sorted = (slides ?? []).slice().sort((a, b) => a.order - b.order);

  return (
    <section className="control-card">
      <h2>Charity cluster</h2>
      <p className="text-white-50">
        Rotates in the right-hand cluster of the omnibar next to the
        running total. Mix logos (SpecialEffect, GameBlast, sponsors)
        with short blurbs (who they help, how to donate). Order drives
        the rotation sequence; only <strong>active</strong> slides
        appear in the omnibar. With zero active slides the omnibar
        falls back to a bundled default set so it never goes blank.
      </p>

      <div className="control-btn-row" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label className="d-flex flex-column">
          <small>Kind</small>
          <select
            value={form.kind}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as CharitySlideKind }))}
          >
            <option value="blurb">Blurb (text)</option>
            <option value="logo">Logo (image)</option>
          </select>
        </label>
        {form.kind === 'blurb' ? (
          <>
            <label className="d-flex flex-column">
              <small>Title (optional)</small>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="100% goes through"
                style={{ width: 200 }}
              />
            </label>
            <label className="d-flex flex-column flex-grow-1" style={{ minWidth: 260 }}>
              <small>Body</small>
              <input
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Every pound raised goes directly to SpecialEffect."
              />
            </label>
          </>
        ) : (
          <>
            <label className="d-flex flex-column flex-grow-1" style={{ minWidth: 260 }}>
              <small>Image URL</small>
              <input
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                placeholder="/assets/img/charity/specialeffect/specialeffect-logo.svg"
              />
            </label>
            <label className="d-flex flex-column">
              <small>Alt text</small>
              <input
                value={form.alt_text}
                onChange={(e) => setForm((f) => ({ ...f, alt_text: e.target.value }))}
                placeholder="SpecialEffect"
                style={{ width: 200 }}
              />
            </label>
          </>
        )}
        <button className="btn btn-bloodmoon" disabled={busy} onClick={create}>
          Add slide
        </button>
      </div>

      <CharitySlidesTable rows={sorted} />
    </section>
  );
}

const CHARITY_COLUMNS: TableColumn<CharitySlide>[] = [
  // Order column is intentionally non-sortable — moves are managed
  // by the per-row ↑/↓ buttons, and click-sorting here would
  // visually decouple ↑/↓ from row identity. Filter only.
  { id: 'order',   header: '#',         filterValue: (s) => String(s.order),                initialWidth: 60 },
  { id: 'kind',    header: 'Kind',      sortValue: (s) => s.kind,                          initialWidth: 90 },
  { id: 'preview', header: 'Preview',   filterValue: (s) => `${s.title} ${s.body} ${s.alt_text}` },
  { id: 'active',  header: 'Active',    sortValue: (s) => (s.is_active ? 0 : 1),           initialWidth: 110 },
  { id: 'actions', header: '',                                                              initialWidth: 240 },
];

function CharitySlidesTable({ rows }: { rows: CharitySlide[] }) {
  const ctrl = useTableControls(rows, CHARITY_COLUMNS, 'control:charity-slides-v1');
  return (
    <div className="mt-3">
      <ctrl.FilterInput placeholder="Filter slides…" />
      <div style={{ overflowX: 'auto' }}>
        <table className="control-table" style={{ minWidth: 880, tableLayout: 'fixed' }}>
          <colgroup>
            {CHARITY_COLUMNS.map((c) => <col key={c.id} style={ctrl.colStyle(c.id)} />)}
          </colgroup>
          <thead>
            <tr>
              {CHARITY_COLUMNS.map((c) => (
                <th key={c.id} {...ctrl.headerProps(c.id)}>
                  {c.header}
                  {ctrl.sortIndicator(c.id)}
                  {ctrl.resizeHandle(c.id)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ctrl.rows.length === 0 && (
              <tr><td colSpan={CHARITY_COLUMNS.length} className="text-white-50">
                No slides — using bundled defaults.
              </td></tr>
            )}
            {ctrl.rows.map((s, i) => (
              <CharitySlideRow
                key={s.id}
                slide={s}
                first={i === 0}
                last={i === ctrl.rows.length - 1}
                prev={ctrl.rows[i - 1]}
                next={ctrl.rows[i + 1]}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface CharitySlideDraft {
  kind: CharitySlideKind;
  title: string;
  body: string;
  image_url: string;
  alt_text: string;
}

function draftFromSlide(s: CharitySlide): CharitySlideDraft {
  return {
    kind: s.kind,
    title: s.title,
    body: s.body,
    image_url: s.image_url,
    alt_text: s.alt_text,
  };
}

function CharitySlideRow({
  slide,
  first,
  last,
  prev,
  next,
}: {
  slide: CharitySlide;
  first: boolean;
  last: boolean;
  prev: CharitySlide | undefined;
  next: CharitySlide | undefined;
}) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CharitySlideDraft>(() => draftFromSlide(slide));
  // Re-sync the draft when the slide's identity changes externally
  // (poll refresh, another tab edited it, etc.) — but only when NOT
  // editing, so the operator's in-progress edits aren't wiped by a
  // background poll.
  useEffect(() => {
    if (editing) return;
    setDraft(draftFromSlide(slide));
  }, [
    editing,
    slide.kind, slide.title, slide.body,
    slide.image_url, slide.alt_text,
  ]);

  const toggleActive = async () => {
    setBusy(true);
    try { await obsApi.updateCharitySlide(slide.id, { is_active: !slide.is_active }); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try { await obsApi.deleteCharitySlide(slide.id); } finally { setBusy(false); }
  };
  // Swap orders with the neighbour to nudge up/down — simpler than
  // re-numbering the whole list. The poll picks up the new sort
  // automatically.
  const move = async (neighbour: CharitySlide | undefined) => {
    if (!neighbour) return;
    setBusy(true);
    try {
      await obsApi.updateCharitySlide(slide.id, { order: neighbour.order });
      await obsApi.updateCharitySlide(neighbour.id, { order: slide.order });
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    try {
      // Server-side ignores fields that aren't relevant to the kind,
      // but trimming whitespace here keeps the live preview tidy.
      await obsApi.updateCharitySlide(slide.id, {
        kind: draft.kind,
        title: draft.title.trim(),
        body: draft.body.trim(),
        image_url: draft.image_url.trim(),
        alt_text: draft.alt_text.trim(),
      });
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const cancel = () => {
    setDraft(draftFromSlide(slide));
    setEditing(false);
  };

  const update = <K extends keyof CharitySlideDraft>(key: K, value: CharitySlideDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <tr>
      <td style={{ fontVariantNumeric: 'tabular-nums' }}>{slide.order}</td>
      <td>
        {editing ? (
          <select
            value={draft.kind}
            onChange={(e) => update('kind', e.target.value as CharitySlideKind)}
          >
            <option value="blurb">blurb</option>
            <option value="logo">logo</option>
          </select>
        ) : (
          <code>{slide.kind}</code>
        )}
      </td>
      <td>
        {editing ? (
          draft.kind === 'logo' ? (
            <div className="d-flex flex-column gap-1" style={{ minWidth: 280 }}>
              <input
                value={draft.image_url}
                onChange={(e) => update('image_url', e.target.value)}
                placeholder="/assets/img/charity/specialeffect/specialeffect-logo.svg"
              />
              <input
                value={draft.alt_text}
                onChange={(e) => update('alt_text', e.target.value)}
                placeholder="Alt text (e.g. SpecialEffect)"
              />
            </div>
          ) : (
            <div className="d-flex flex-column gap-1" style={{ minWidth: 280 }}>
              <input
                value={draft.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="Title (optional)"
              />
              <input
                value={draft.body}
                onChange={(e) => update('body', e.target.value)}
                placeholder="Body — up to ~3 short lines"
              />
            </div>
          )
        ) : slide.kind === 'logo' ? (
          <div className="d-flex align-items-center gap-2">
            {slide.image_url && (
              <img
                src={slide.image_url}
                alt={slide.alt_text}
                style={{ height: 28, width: 'auto', background: 'rgba(0,0,0,0.3)', borderRadius: 3 }}
              />
            )}
            <small className="text-white-50">{slide.alt_text || slide.image_url}</small>
          </div>
        ) : (
          <div>
            {slide.title && <div><strong style={{ color: '#ffd23a' }}>{slide.title}</strong></div>}
            <small className="text-white-50">{slide.body}</small>
          </div>
        )}
      </td>
      <td>
        <button
          className={`btn btn-sm ${slide.is_active ? 'btn-outline-success' : 'btn-outline-secondary'}`}
          disabled={busy || editing}
          onClick={toggleActive}
        >
          {slide.is_active ? 'Active' : 'Paused'}
        </button>
      </td>
      <td className="control-btn-row">
        {editing ? (
          <>
            <button className="btn btn-sm btn-bloodmoon" disabled={busy} onClick={save}>
              Save
            </button>
            <button className="btn btn-sm btn-outline-light" disabled={busy} onClick={cancel}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              className="btn btn-sm btn-outline-light"
              disabled={busy}
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
            <button className="btn btn-sm btn-outline-light" disabled={busy || first} onClick={() => move(prev)}>↑</button>
            <button className="btn btn-sm btn-outline-light" disabled={busy || last} onClick={() => move(next)}>↓</button>
            <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={remove}>
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
  );
}

// ── Sandbox triggers ────────────────────────────────────────────────────

const TWITCH_PRESETS: { kind: string; label: string }[] = [
  { kind: 'twitch-follow', label: 'Follow' },
  { kind: 'twitch-sub', label: 'Sub' },
  { kind: 'twitch-sub-gift', label: 'Gift sub' },
  { kind: 'twitch-resub', label: 'Resub' },
  { kind: 'twitch-raid', label: 'Raid' },
  { kind: 'twitch-bits', label: 'Bits' },
];

function SandboxSection() {
  const [busy, setBusy] = useState(false);
  const [lastFired, setLastFired] = useState<string | null>(null);
  const [donor, setDonor] = useState('TestDonor');
  const [amount, setAmount] = useState('10.00');
  const [message, setMessage] = useState('Thanks for streaming! Cadence of Hyrule is amazing.');

  const fireTwitch = async (kind: string) => {
    setBusy(true);
    try {
      const res = await obsApi.sandboxTwitchEvent({ kind });
      setLastFired(`${res.kind} #${res.id}`);
    } finally {
      setBusy(false);
    }
  };

  const fireDonation = async () => {
    setBusy(true);
    try {
      const res = await obsApi.sandboxDonation({
        donor_name: donor.trim() || undefined,
        amount,
        message: message.trim() || undefined,
      });
      setLastFired(`donation #${res.id}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="control-card">
      <h2>Sandbox</h2>
      <p className="text-white-50">
        Fabricate Twitch events and donations for visual rehearsal.
        Hits <code>/api/sandbox/*</code> which is DEBUG-only (returns
        404 in production), so these buttons are safe to keep on screen
        during the live show — they just won't do anything once the
        backend ships with DEBUG=False.
      </p>

      <div className="control-btn-row" style={{ flexWrap: 'wrap' }}>
        <small className="text-white-50 align-self-end">Fire fake Twitch event:</small>
        {TWITCH_PRESETS.map((p) => (
          <button
            key={p.kind}
            className="btn btn-sm btn-bloodmoon"
            disabled={busy}
            onClick={() => fireTwitch(p.kind)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="control-btn-row mt-3" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label className="d-flex flex-column">
          <small>Donor</small>
          <input value={donor} onChange={(e) => setDonor(e.target.value)} style={{ width: 160 }} />
        </label>
        <label className="d-flex flex-column">
          <small>Amount</small>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: 100 }}
          />
        </label>
        <label className="d-flex flex-column flex-grow-1" style={{ minWidth: 260 }}>
          <small>Message</small>
          <input value={message} onChange={(e) => setMessage(e.target.value)} />
        </label>
        <button className="btn btn-bloodmoon" disabled={busy} onClick={fireDonation}>
          Fire fake donation
        </button>
      </div>

      {lastFired && (
        <small className="text-white-50 mt-2 d-block">Last fired: {lastFired}</small>
      )}
    </section>
  );
}

// ── Setpiece controls ───────────────────────────────────────────────────

const SETPIECE_PRESETS = [
  { kind: 'boss', label: 'Boss', resultKind: 'boss-defeated' },
  { kind: 'shrine', label: 'Shrine', resultKind: 'shrine-cleared' },
  { kind: 'dungeon', label: 'Dungeon', resultKind: 'dungeon-complete' },
  { kind: 'cutscene', label: 'Cutscene', resultKind: 'setpiece-cleared' },
];

const PIN_TOP_PRIORITY = 1000;

function resultKindFor(kind: string): string {
  return SETPIECE_PRESETS.find((p) => p.kind === kind)?.resultKind ?? 'setpiece-cleared';
}

function SetpieceSection() {
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, 2000);
  const entry = cp?.schedule_entry_detail ?? null;
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState('boss');
  const [name, setName] = useState('');

  const setpieces = entry?.setpieces ?? [];
  const nameTrimmed = name.trim();
  const canStage = !!entry && !busy && !!kind.trim() && !!nameTrimmed;

  // Mutations rely on the 2s currently-playing poll to refresh the list.
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const add = (stage: 'imminent' | 'active', presetKind?: string) => {
    if (!entry || !nameTrimmed) return;
    const k = (presetKind ?? kind).trim();
    if (!k) return;
    if (presetKind) setKind(presetKind);
    void run(() => obsApi.addSetpiece(entry.id, { kind: k, name: nameTrimmed, stage }));
    setName('');
  };

  return (
    <section className="control-card">
      <h2>Setpiece</h2>
      {!entry ? (
        <p className="text-warning">No "Currently Playing" entry.</p>
      ) : (
        <>
          <p className="text-white-50">
            Dungeon &amp; boss setpieces fire automatically off objective
            completion (configure objective roles in the Objectives editor).
            Add bespoke setpieces below. The omnibar shows the
            highest-priority one; <strong>Pin to top</strong> forces a setpiece
            above everything (including auto bosses).
          </p>

          {/* Live setpieces */}
          {setpieces.length === 0 ? (
            <div className="text-white-50 mb-2"><em>No live setpieces.</em></div>
          ) : (
            <ul className="setpiece-list">
              {setpieces.map((sp) => (
                <li key={sp.id} className="setpiece-row">
                  <span className="setpiece-row-info">
                    <code>{sp.kind}</code> <strong>{sp.name}</strong>{' '}
                    <span className={`setpiece-badge setpiece-badge--${sp.stage}`}>
                      {sp.stage}
                    </span>
                    {sp.is_auto && (
                      <span className="setpiece-badge setpiece-badge--auto">auto</span>
                    )}
                    <span className="text-white-50"> · p{sp.priority}</span>
                  </span>
                  <span className="control-btn-row">
                    <button
                      className="btn btn-sm btn-outline-light"
                      disabled={busy || sp.stage === 'imminent'}
                      onClick={() => run(() => obsApi.updateSetpiece(entry.id, { setpiece_id: sp.id, stage: 'imminent' }))}
                    >
                      Imminent
                    </button>
                    <button
                      className="btn btn-sm btn-outline-light"
                      disabled={busy || sp.stage === 'active'}
                      onClick={() => run(() => obsApi.updateSetpiece(entry.id, { setpiece_id: sp.id, stage: 'active' }))}
                    >
                      Active
                    </button>
                    <button
                      className="btn btn-sm btn-outline-light"
                      disabled={busy || sp.priority >= PIN_TOP_PRIORITY}
                      onClick={() => run(() => obsApi.updateSetpiece(entry.id, { setpiece_id: sp.id, priority: PIN_TOP_PRIORITY }))}
                    >
                      Pin to top
                    </button>
                    <button
                      className="btn btn-sm btn-setpiece-clear"
                      disabled={busy}
                      onClick={() => run(() => obsApi.clearSetpiece(entry.id, { setpiece_id: sp.id, result_kind: resultKindFor(sp.kind) }))}
                    >
                      Defeated / Cleared
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Add a bespoke setpiece */}
          <div className="control-btn-row setpiece-add" style={{ flexWrap: 'wrap' }}>
            <label className="d-flex flex-column">
              <small>Kind</small>
              <input
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                placeholder="boss"
                list="setpiece-kinds"
                style={{ width: 140 }}
              />
              <datalist id="setpiece-kinds">
                {SETPIECE_PRESETS.map((p) => <option key={p.kind} value={p.kind} />)}
              </datalist>
            </label>
            <label className="d-flex flex-column flex-grow-1" style={{ minWidth: 220 }}>
              <small>Name (required)</small>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ganondorf"
              />
            </label>
            <button
              className="btn btn-bloodmoon setpiece-stage-btn"
              disabled={!canStage}
              onClick={() => add('imminent')}
            >
              Imminent
            </button>
            <button
              className="btn btn-bloodmoon setpiece-stage-btn"
              disabled={!canStage}
              onClick={() => add('active')}
            >
              Active
            </button>
          </div>

          <div className="control-btn-row mt-2" style={{ flexWrap: 'wrap' }}>
            <small className="text-white-50 align-self-center">
              Quick presets (need a name):
            </small>
            {SETPIECE_PRESETS.map((p) => (
              <button
                key={p.kind}
                className="btn btn-sm btn-outline-light"
                disabled={busy || !nameTrimmed}
                onClick={() => add('imminent', p.kind)}
              >
                {p.label} → imminent
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ── Layout editor ───────────────────────────────────────────────────────

interface LaneDraft {
  panels: Set<PanelId>;
  order: PanelId[];
}

interface LayoutDraft {
  top: LaneDraft;
  bottom: LaneDraft;
}

function makeDraft(layoutJson: unknown): LayoutDraft {
  const parsed = parseLayout(layoutJson);
  const toDraft = (config: typeof DEFAULT_LAYOUT.top): LaneDraft => ({
    panels: new Set(config.panels as PanelId[]),
    order: config.panels as PanelId[],
  });
  return { top: toDraft(parsed.top), bottom: toDraft(parsed.bottom) };
}

function draftToJson(draft: LayoutDraft) {
  return {
    lanes: [
      { id: 'top', mode: 'rotating', panels: draft.top.order },
      { id: 'bottom', mode: 'rotating', panels: draft.bottom.order },
    ],
  };
}

function LayoutSection() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000);
  const [draft, setDraft] = useState<LayoutDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const lastEventIdRef = useRef<number | null>(null);

  // Initialise the draft from the event's layout. Don't blow away
  // unsaved edits on every poll — only reset when the event changes.
  useEffect(() => {
    if (!event) return;
    if (event.id === lastEventIdRef.current) return;
    lastEventIdRef.current = event.id;
    setDraft(makeDraft(event.omnibar_layout));
  }, [event]);

  const togglePanel = (lane: 'top' | 'bottom', id: PanelId) => {
    setDraft((d) => {
      if (!d) return d;
      const next = { ...d, [lane]: { ...d[lane] } } as LayoutDraft;
      const panels = new Set(d[lane].panels);
      const order = d[lane].order.slice();
      if (panels.has(id)) {
        panels.delete(id);
        next[lane].panels = panels;
        next[lane].order = order.filter((p) => p !== id);
      } else {
        panels.add(id);
        next[lane].panels = panels;
        next[lane].order = [...order, id];
      }
      return next;
    });
  };

  const save = async () => {
    if (!event || !draft) return;
    setBusy(true);
    try {
      // Shallow-merge into the existing JSON so a layout save
      // doesn't clobber sibling keys (e.g. `splash.color_mode` from
      // the Donation splash section).
      const existing =
        event.omnibar_layout && typeof event.omnibar_layout === 'object'
          ? event.omnibar_layout
          : {};
      await obsApi.updateEvent(event.id, {
        omnibar_layout: { ...existing, ...draftToJson(draft) },
      });
      setSavedAt(new Date());
    } finally {
      setBusy(false);
    }
  };

  const reset = () => setDraft(makeDraft(DEFAULT_LAYOUT));

  if (!event || !draft) {
    return (
      <section className="control-card">
        <h2>Lane layout</h2>
        <p className="text-warning">No active event.</p>
      </section>
    );
  }

  return (
    <section className="control-card">
      <h2>Lane layout</h2>
      <p className="text-white-50">
        Drives which panels appear in each lane. Rotation speed is now
        per-panel — set each panel's <code>Dwell ms</code> in the
        <strong> Panel transitions</strong> section below. Saves to{' '}
        <code>Event.omnibar_layout</code>; unknown panel ids are
        silently dropped so a future client upgrade won't break the
        layout. Reload <code>/obs/omnibar</code> after saving.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <LanePanelEditor
          title="Top lane"
          lane="top"
          draft={draft.top}
          onToggle={(id) => togglePanel('top', id)}
        />
        <LanePanelEditor
          title="Bottom lane"
          lane="bottom"
          draft={draft.bottom}
          onToggle={(id) => togglePanel('bottom', id)}
        />
      </div>

      <div className="control-btn-row mt-3">
        <button className="btn btn-bloodmoon" disabled={busy} onClick={save}>
          Save layout
        </button>
        <button className="btn btn-outline-light" disabled={busy} onClick={reset}>
          Reset to defaults
        </button>
        {savedAt && (
          <small className="text-white-50 align-self-end">
            saved {fmtTime(savedAt.toISOString())}
          </small>
        )}
      </div>
    </section>
  );
}

/**
 * Hover-tooltip copy for each panel id rendered in the lane editor.
 * Many panels gate themselves on data (e.g. `objective` returns null
 * when `current_objective` is blank, `bid-war` returns null when no
 * incentive carries a bid-war payload). Without these hints, ticking
 * a panel and seeing nothing change in the omnibar feels broken when
 * actually the operator just needs to populate the underlying field.
 *
 * Keep entries short — they render as native browser tooltips, so
 * length isn't a hard limit but anything long enough to wrap reads
 * awkwardly in the tooltip box.
 */
const PANEL_DESCRIPTIONS: Record<PanelId, string> = {
  // Status / top-lane panels
  'current-game': 'Currently-playing game title + runners. Hidden when no entry is set as currently-playing.',
  'playtime': 'Live playtime for the current game. Hidden when no entry is currently-playing.',
  'custom-objective': 'Operator-set free-text objective from the live entry — use this for ad-hoc objectives that aren\'t in the per-game library. Hidden when the "Current objective" text field is blank — set it in the Live Show tab below.',
  'next-objective': 'Next outstanding objective from the game library, in list order. Hidden when every objective is obtained or the game has none.',
  'objective-checklist': 'Icon strip of the current run-section\'s objectives (coloured = obtained, greyed = outstanding). Auto-advances to the next section once everything in this one is done. Hidden when the game has no objectives.',
  'setpiece': 'Boss / raid / setpiece banner — hidden unless the live entry has a setpiece in progress.',
  'items-collected': 'Item icon strip for the live game. Hidden when the game has no items defined.',
  'death-count': 'Player deaths for the current game (with its game chip) plus a running event total across all games. Bumped from the Stream Deck (death-inc/death-dec); each death also fires a brief "KO" flash. Hidden when no entry is currently-playing.',
  'pre-stream': 'Pre-event countdown + upcoming cards. Auto-shows when no entry is currently-playing; auto-hides once one is.',

  // Ticker / bottom-lane panels
  'schedule-next': 'The next upcoming schedule entry. Hidden once the lineup is empty.',
  'donation-reel': 'Most-recent donor reel (donor name + amount). Hidden when the event has no donations.',
  'incentives': 'Active incentive progress bar. Hidden when no incentive is currently open.',
  'bid-war': 'Bid-war option stack. Hidden unless an incentive payload carries ≥2 options.',
  'milestones': 'Next un-reached milestone + progress. Hidden once every milestone is reached.',
  'raffle': 'Active raffle name + entry count. Hidden when no raffle is open.',
  'total-raised': 'Cumulative event total — always shown when an event is active.',
  'charity-info': 'Rotating charity blurbs from the linked beneficiaries.',
  'local-time': 'Wall-clock local time — always renders.',
};

function LanePanelEditor({
  title,
  lane,
  draft,
  onToggle,
}: {
  title: string;
  lane: 'top' | 'bottom';
  draft: LaneDraft;
  onToggle: (id: PanelId) => void;
}) {
  const description = useMemo(
    () =>
      lane === 'top'
        ? 'Status zone — persistent info (current game, playtime, …).'
        : 'Ticker zone — mixes schedule, donations, incentives, etc.',
    [lane],
  );
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: 6 }}>
      <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{title}</h3>
      <small className="text-white-50">{description}</small>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.2rem 0.6rem', marginTop: '0.6rem' }}>
        {ALL_PANEL_IDS.map((id) => {
          const checked = draft.panels.has(id);
          const description = PANEL_DESCRIPTIONS[id];
          return (
            <label
              key={id}
              style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', cursor: 'pointer' }}
              title={description ?? id}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(id)}
              />
              <code style={{ fontSize: '0.82em' }}>{id}</code>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ── Panel transitions editor ─────────────────────────────────────────────

const DIRECTION_OPTIONS: { value: AnimDirection; label: string }[] = [
  { value: 'left',   label: 'Slide from/to left' },
  { value: 'right',  label: 'Slide from/to right' },
  { value: 'top',    label: 'Slide from/to top' },
  { value: 'bottom', label: 'Slide from/to bottom' },
  { value: 'fade',   label: 'Fade only' },
];

function TransitionsSection() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000);
  const [defaults, setDefaults] = useState<PanelTransition>(DEFAULT_TRANSITION);
  const [overrides, setOverrides] = useState<Partial<Record<PanelId, PanelTransition>>>({});
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const lastEventIdRef = useRef<number | null>(null);

  // Initialise the draft from the event's transitions. Don't blow
  // away unsaved edits on every poll — only reset when the event
  // identity changes.
  useEffect(() => {
    if (!event) return;
    if (event.id === lastEventIdRef.current) return;
    lastEventIdRef.current = event.id;
    const parsed = parseTransitions(event.omnibar_transitions);
    setDefaults(parsed.default);
    // Promote partial overrides to full PanelTransitions for editing
    // (each row shows all 5 fields). Saving emits them as-is, which
    // the parser accepts.
    const promoted: Partial<Record<PanelId, PanelTransition>> = {};
    for (const [id, partial] of Object.entries(parsed.overrides)) {
      promoted[id as PanelId] = { ...parsed.default, ...partial };
    }
    setOverrides(promoted);
  }, [event]);

  const setOverride = (panelId: PanelId, patch: Partial<PanelTransition>) =>
    setOverrides((o) => ({
      ...o,
      [panelId]: { ...(o[panelId] ?? defaults), ...patch },
    }));

  const clearOverride = (panelId: PanelId) =>
    setOverrides((o) => {
      const next = { ...o };
      delete next[panelId];
      return next;
    });

  const save = async () => {
    if (!event) return;
    setBusy(true);
    try {
      // Shallow-merge into existing JSON to preserve sibling fields.
      const existing =
        event.omnibar_transitions && typeof event.omnibar_transitions === 'object'
          ? event.omnibar_transitions
          : {};
      await obsApi.updateEvent(event.id, {
        omnibar_transitions: {
          ...existing,
          default: defaults,
          panels: overrides,
        },
      });
      setSavedAt(new Date());
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setDefaults(DEFAULT_TRANSITION);
    setOverrides({});
  };

  if (!event) {
    return (
      <section className="control-card">
        <h2>Panel transitions</h2>
        <p className="text-warning">No active event.</p>
      </section>
    );
  }

  return (
    <section className="control-card">
      <h2>Panel transitions</h2>
      <p className="text-white-50">
        Per-panel enter direction, exit direction, animation durations,
        and the delay between the previous panel's exit and this panel's
        enter. Panels without an override use the <strong>Default</strong> row.
        Saves to <code>Event.omnibar_transitions</code>.
      </p>

      <PanelTransitionPreview transition={defaults} />

      <h3 style={{
        fontFamily: 'Bungee, sans-serif',
        fontSize: '0.95rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#ffd23a',
        margin: '1rem 0 0.35rem',
      }}>Enter</h3>
      <table className="control-table" style={{ fontSize: '0.85em' }}>
        <thead>
          <tr>
            <th>Panel</th>
            <th title="Pause between the previous panel's exit ending and this panel's enter starting (ms)">
              Lead-in ms
            </th>
            <th title="Direction the tag pill enters from">Tag enter</th>
            <th title="Duration of the tag's enter animation (ms)">Tag enter ms</th>
            <th title="Direction the body row enters from">Body enter</th>
            <th title="Duration of the body's enter animation (ms)">Body enter ms</th>
            <th title="Gap after the tag lands before the body starts entering (ms)">
              Body delay (in)
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <TransitionRow
            half="enter"
            label={<strong style={{ color: '#ffd23a' }}>Default</strong>}
            transition={defaults}
            onChange={(patch) => setDefaults((d) => ({ ...d, ...patch }))}
          />
          {ALL_PANEL_IDS.map((id) => {
            const ov = overrides[id];
            const effective = ov ?? defaults;
            return (
              <TransitionRow
                key={id}
                half="enter"
                label={<code>{id}</code>}
                transition={effective}
                hasOverride={!!ov}
                onChange={(patch) => setOverride(id, patch)}
                onClear={() => clearOverride(id)}
              />
            );
          })}
        </tbody>
      </table>

      <h3 style={{
        fontFamily: 'Bungee, sans-serif',
        fontSize: '0.95rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#ffd23a',
        margin: '1.25rem 0 0.35rem',
      }}>Dwell + Exit</h3>
      <table className="control-table" style={{ fontSize: '0.85em' }}>
        <thead>
          <tr>
            <th>Panel</th>
            <th title="Time the panel sits fully on-screen between its enter ending and its exit starting (ms)">
              Dwell ms
            </th>
            <th title="Direction the body row exits to">Body exit</th>
            <th title="Duration of the body's exit animation (ms)">Body exit ms</th>
            <th title="Gap after the body finishes exiting before the tag starts exiting (ms)">
              Body delay (out)
            </th>
            <th title="Direction the tag pill exits to">Tag exit</th>
            <th title="Duration of the tag's exit animation (ms)">Tag exit ms</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <TransitionRow
            half="exit"
            label={<strong style={{ color: '#ffd23a' }}>Default</strong>}
            transition={defaults}
            onChange={(patch) => setDefaults((d) => ({ ...d, ...patch }))}
          />
          {ALL_PANEL_IDS.map((id) => {
            const ov = overrides[id];
            const effective = ov ?? defaults;
            return (
              <TransitionRow
                key={id}
                half="exit"
                label={<code>{id}</code>}
                transition={effective}
                hasOverride={!!ov}
                onChange={(patch) => setOverride(id, patch)}
                onClear={() => clearOverride(id)}
              />
            );
          })}
        </tbody>
      </table>

      <div className="control-btn-row mt-3">
        <button className="btn btn-bloodmoon" disabled={busy} onClick={save}>
          Save transitions
        </button>
        <button className="btn btn-outline-light" disabled={busy} onClick={reset}>
          Reset all to defaults
        </button>
        {savedAt && (
          <small className="text-white-50 align-self-end">
            saved {fmtTime(savedAt.toISOString())}
          </small>
        )}
      </div>
    </section>
  );
}

/** Live preview for Panel transitions. Renders a single-lane mini
 *  omnibar with a sample panel that cycles through enter → dwell →
 *  exit → lead-in using the editor's current Default row config.
 *  Re-keying the wrapper on each phase change re-mounts the slot,
 *  which forces the CSS animations to restart so the preview keeps
 *  looping without manual intervention. */
function PanelTransitionPreview({ transition }: { transition: PanelTransition }) {
  type Phase = 'enter' | 'dwell' | 'exit' | 'gap';
  const [phase, setPhase] = useState<Phase>('enter');
  const [cycle, setCycle] = useState(0);

  const fullEnterMs =
    transition.tagEnterMs + transition.bodyEnterDelayMs + transition.bodyEnterMs;
  const fullExitMs =
    transition.bodyExitMs + transition.bodyExitDelayMs + transition.tagExitMs;

  useEffect(() => {
    let nextMs: number;
    let nextPhase: Phase;
    switch (phase) {
      case 'enter': nextMs = fullEnterMs; nextPhase = 'dwell'; break;
      case 'dwell': nextMs = Math.max(800, Math.min(3000, transition.dwellMs)); nextPhase = 'exit'; break;
      case 'exit':  nextMs = fullExitMs; nextPhase = 'gap'; break;
      case 'gap':   nextMs = transition.leadInMs + 300; nextPhase = 'enter'; break;
    }
    const t = window.setTimeout(() => {
      if (nextPhase === 'enter') setCycle((c) => c + 1);
      setPhase(nextPhase);
    }, nextMs);
    return () => window.clearTimeout(t);
  }, [phase, transition, fullEnterMs, fullExitMs]);

  const slotStyle: CSSProperties = {
    ['--ob-tag-enter-ms' as keyof CSSProperties]: `${transition.tagEnterMs}ms` as never,
    ['--ob-tag-exit-ms' as keyof CSSProperties]: `${transition.tagExitMs}ms` as never,
    ['--ob-body-enter-ms' as keyof CSSProperties]: `${transition.bodyEnterMs}ms` as never,
    ['--ob-body-exit-ms' as keyof CSSProperties]: `${transition.bodyExitMs}ms` as never,
    ['--ob-body-enter-delay-ms' as keyof CSSProperties]:
      `${transition.bodyEnterDelayMs}ms` as never,
    ['--ob-body-exit-delay-ms' as keyof CSSProperties]:
      `${transition.bodyExitDelayMs}ms` as never,
  };

  return (
    <div
      className="omnibar omnibar--v2 mb-3"
      style={{
        ['--obs-stage-width' as keyof CSSProperties]: '600px' as never,
        width: 600,
        height: 48,
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
      }}
      aria-label="Panel transition preview"
    >
      <div className="ob-lanes" style={{ height: '100%' }}>
        <div className="ob-lane ob-lane--top" style={{ height: '100%' }}>
          {phase !== 'gap' && (
            <div
              key={`${cycle}:${phase}`}
              className={`ob-slot${phase === 'exit' ? ' is-leaving' : ''}`}
              data-tag-enter={transition.tagEnter}
              data-tag-exit={transition.tagExit}
              data-body-enter={transition.bodyEnter}
              data-body-exit={transition.bodyExit}
              style={slotStyle}
            >
              <div className="ob-row">
                <span className="ob-tag ob-tag--arrow">SAMPLE</span>
                <div className="ob-row-body">
                  <span className="ob-text-strong">Preview panel</span>
                  <span className="ob-text-muted">applies the Default row</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TransitionRow({
  label,
  transition,
  half,
  hasOverride,
  onChange,
  onClear,
}: {
  label: ReactNode;
  transition: PanelTransition;
  /** Which half of the panel's lifecycle this row covers — drives
   *  which columns are rendered. The same panel appears in both the
   *  Enter table and the Dwell+Exit table; the Clear button only
   *  renders on the exit half so it's not duplicated. */
  half: 'enter' | 'exit';
  hasOverride?: boolean;
  onChange: (patch: Partial<PanelTransition>) => void;
  onClear?: () => void;
}) {
  const numInput = (
    field:
      | 'tagEnterMs'
      | 'tagExitMs'
      | 'bodyEnterMs'
      | 'bodyExitMs'
      | 'leadInMs'
      | 'dwellMs'
      | 'bodyEnterDelayMs'
      | 'bodyExitDelayMs',
    min: number,
    max: number,
  ) => (
    // ClampedNumberInput commits on blur / Enter rather than per
    // keystroke, so typing "700" doesn't get stomped to "1000" by an
    // intermediate "7" hitting the min-clamp.
    <ClampedNumberInput
      value={transition[field]}
      min={min}
      max={max}
      step={20}
      onCommit={(v) => onChange({ [field]: v })}
      style={{ width: 90 }}
    />
  );
  const dirSelect = (field: 'tagEnter' | 'tagExit' | 'bodyEnter' | 'bodyExit') => (
    <select
      value={transition[field]}
      onChange={(e) => onChange({ [field]: e.target.value as AnimDirection })}
    >
      {DIRECTION_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
  const rowStyle = hasOverride ? { background: 'rgba(255, 210, 58, 0.05)' } : undefined;
  const clearCell = (
    <td>
      {onClear && (
        <button
          className="btn btn-sm btn-outline-light"
          disabled={!hasOverride}
          onClick={onClear}
          title={hasOverride ? "Remove this panel's override" : 'No override set'}
        >
          Use default
        </button>
      )}
    </td>
  );
  if (half === 'enter') {
    return (
      <tr style={rowStyle}>
        <td>{label}</td>
        <td>{numInput('leadInMs', DELAY_MIN_MS, DELAY_MAX_MS)}</td>
        <td>{dirSelect('tagEnter')}</td>
        <td>{numInput('tagEnterMs', DURATION_MIN_MS, DURATION_MAX_MS)}</td>
        <td>{dirSelect('bodyEnter')}</td>
        <td>{numInput('bodyEnterMs', DURATION_MIN_MS, DURATION_MAX_MS)}</td>
        <td>{numInput('bodyEnterDelayMs', DELAY_MIN_MS, DELAY_MAX_MS)}</td>
        {clearCell}
      </tr>
    );
  }
  return (
    <tr style={rowStyle}>
      <td>{label}</td>
      <td>{numInput('dwellMs', DWELL_MIN_MS, DWELL_MAX_MS)}</td>
      <td>{dirSelect('bodyExit')}</td>
      <td>{numInput('bodyExitMs', DURATION_MIN_MS, DURATION_MAX_MS)}</td>
      <td>{numInput('bodyExitDelayMs', DELAY_MIN_MS, DELAY_MAX_MS)}</td>
      <td>{dirSelect('tagExit')}</td>
      <td>{numInput('tagExitMs', DURATION_MIN_MS, DURATION_MAX_MS)}</td>
      {clearCell}
    </tr>
  );
}

// ── Donation reel editor ───────────────────────────────────────────────

const REEL_DIRECTION_OPTIONS: { value: DonationReelDirection; label: string }[] = [
  { value: 'up',    label: 'Slide up (newer rises from below)' },
  { value: 'down',  label: 'Slide down (newer drops from above)' },
  { value: 'left',  label: 'Slide left (newer comes in from the right)' },
  { value: 'right', label: 'Slide right (newer comes in from the left)' },
  { value: 'fade',  label: 'Fade only' },
];

const REEL_PREVIEW_DONORS: { name: string; amount: string }[] = [
  { name: 'Ada Lovelace',  amount: '50.00' },
  { name: 'Grace Hopper',  amount: '25.00' },
  { name: 'Linus Torvalds', amount: '10.00' },
];

/** Live preview for the Donation reel section. Cycles through three
 *  fake donors using the draft cycle config so the operator can see
 *  the configured enter → dwell → exit → lead-in beat before saving. */
function DonationReelPreview({ cycle }: { cycle: DonationReelConfig }) {
  type Phase = 'enter' | 'rest' | 'exit' | 'gap';
  const [phase, setPhase] = useState<Phase>('enter');
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let nextPhase: Phase;
    let nextMs: number;
    let advance = false;
    switch (phase) {
      case 'enter': nextPhase = 'rest'; nextMs = cycle.enterMs; break;
      case 'rest':  nextPhase = 'exit'; nextMs = cycle.dwellMs; break;
      case 'exit':  nextPhase = 'gap';  nextMs = cycle.exitMs; break;
      case 'gap':   nextPhase = 'enter'; nextMs = cycle.leadInMs + 200; advance = true; break;
    }
    const t = window.setTimeout(() => {
      if (advance) setIdx((i) => (i + 1) % REEL_PREVIEW_DONORS.length);
      setPhase(nextPhase);
    }, nextMs);
    return () => window.clearTimeout(t);
  }, [phase, cycle]);

  const rowStyle: CSSProperties = {
    ['--ob-donor-enter-ms' as keyof CSSProperties]: `${cycle.enterMs}ms` as never,
    ['--ob-donor-exit-ms' as keyof CSSProperties]: `${cycle.exitMs}ms` as never,
  };

  const d = REEL_PREVIEW_DONORS[idx];

  return (
    <div
      className="omnibar omnibar--v2 mb-3"
      style={{
        ['--obs-stage-width' as keyof CSSProperties]: '480px' as never,
        width: 480,
        height: 48,
        borderRadius: 6,
        overflow: 'hidden',
        position: 'relative',
      }}
      aria-label="Donation reel preview"
    >
      <div className="ob-lanes" style={{ height: '100%' }}>
        <div className="ob-lane ob-lane--bottom" style={{ height: '100%' }}>
          <div className="ob-slot">
            <div className="ob-row">
              <span className="ob-tag">RECENT</span>
              <div className="ob-row-body">
                <div className="ob-donor-reel">
                  {phase !== 'gap' && (
                    <div
                      key={idx}
                      className="ob-donor-row"
                      data-phase={phase}
                      data-cycle-dir={cycle.direction}
                      style={rowStyle}
                    >
                      <span className="ob-donor-rank">#{idx + 1}</span>
                      <span className="ob-donor-name">{d.name}</span>
                      <span className="ob-donor-amount">£{d.amount}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DonationReelSection() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000);
  const [draft, setDraft] = useState<DonationReelConfig>(DEFAULT_DONATION_REEL);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const lastEventIdRef = useRef<number | null>(null);

  // Re-seed from the event only when the event identity changes, so
  // a background poll doesn't clobber in-progress edits.
  useEffect(() => {
    if (!event) return;
    if (event.id === lastEventIdRef.current) return;
    lastEventIdRef.current = event.id;
    setDraft(readDonationReelConfig(event.omnibar_layout));
  }, [event]);

  const update = <K extends keyof DonationReelConfig>(
    key: K,
    value: DonationReelConfig[K],
  ) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    if (!event) return;
    setBusy(true);
    try {
      // Shallow-merge into the existing omnibar_layout JSON so the
      // splash / lanes config aren't blown away.
      const existing =
        event.omnibar_layout && typeof event.omnibar_layout === 'object'
          ? event.omnibar_layout
          : {};
      await obsApi.updateEvent(event.id, {
        omnibar_layout: { ...existing, donationReel: draft },
      });
      setSavedAt(new Date());
    } finally {
      setBusy(false);
    }
  };

  const reset = () => setDraft(DEFAULT_DONATION_REEL);

  if (!event) {
    return (
      <section className="control-card">
        <h2>Donation reel</h2>
        <p className="text-warning">No active event.</p>
      </section>
    );
  }

  return (
    <section className="control-card">
      <h2>Donation reel</h2>
      <p className="text-white-50">
        Controls the bottom-lane <code>donation-reel</code> panel — how
        many recent donors it shows, how fast it cycles between them,
        and which direction each donor enters from. Saves to{' '}
        <code>Event.omnibar_layout.donationReel</code>.
      </p>

      <p className="text-white-50" style={{ fontSize: '0.85em', marginTop: 0 }}>
        Each donor's cycle plays in order:{' '}
        <strong>Enter → Dwell → Exit → Lead-in</strong> (empty reel),
        then the next donor enters. Tuning the four timings lets you
        pick anything from a snappy ticker to a deliberate broadcast
        crawl. The two donors never overlap — the outgoing one fully
        exits before the next begins entering.
      </p>

      <DonationReelPreview cycle={draft} />

      <div className="control-btn-row" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label className="d-flex flex-column">
          <small>Direction</small>
          <select
            value={draft.direction}
            onChange={(e) => update('direction', e.target.value as DonationReelDirection)}
          >
            {REEL_DIRECTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label className="d-flex flex-column">
          <small>Enter ms</small>
          <ClampedNumberInput
            min={REEL_ANIM_MIN_MS}
            max={REEL_ANIM_MAX_MS}
            step={20}
            value={draft.enterMs}
            onCommit={(v) => update('enterMs', v)}
            style={{ width: 90 }}
            title="Duration of the donor row's enter animation"
          />
        </label>
        <label className="d-flex flex-column">
          <small>Dwell ms</small>
          <ClampedNumberInput
            min={REEL_DWELL_MIN_MS}
            max={REEL_DWELL_MAX_MS}
            step={100}
            value={draft.dwellMs}
            onCommit={(v) => update('dwellMs', v)}
            style={{ width: 100 }}
            title="Time the donor row sits fully on-screen between enter and exit"
          />
        </label>
        <label className="d-flex flex-column">
          <small>Exit ms</small>
          <ClampedNumberInput
            min={REEL_ANIM_MIN_MS}
            max={REEL_ANIM_MAX_MS}
            step={20}
            value={draft.exitMs}
            onCommit={(v) => update('exitMs', v)}
            style={{ width: 90 }}
            title="Duration of the donor row's exit animation"
          />
        </label>
        <label className="d-flex flex-column">
          <small>Lead-in ms</small>
          <ClampedNumberInput
            min={REEL_LEAD_IN_MIN_MS}
            max={REEL_LEAD_IN_MAX_MS}
            step={20}
            value={draft.leadInMs}
            onCommit={(v) => update('leadInMs', v)}
            style={{ width: 100 }}
            title="Empty-reel pause between one donor exiting and the next entering"
          />
        </label>
        <label className="d-flex flex-column">
          <small>Reel length</small>
          <ClampedNumberInput
            min={REEL_LENGTH_MIN}
            max={REEL_LENGTH_MAX}
            step={1}
            value={draft.reelLength}
            onCommit={(v) => update('reelLength', v)}
            style={{ width: 90 }}
            title="How many of the most-recent donors the reel rotates through"
          />
        </label>
      </div>

      <div className="control-btn-row mt-3">
        <button className="btn btn-bloodmoon" disabled={busy} onClick={save}>
          Save reel settings
        </button>
        <button className="btn btn-outline-light" disabled={busy} onClick={reset}>
          Reset to defaults
        </button>
        {savedAt && (
          <small className="text-white-50 align-self-end">
            saved {fmtTime(savedAt.toISOString())}
          </small>
        )}
      </div>
    </section>
  );
}

function clampN(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

/**
 * Numeric `<input>` that lets the user TYPE freely (no per-keystroke
 * clamping that snaps `4` to `100` mid-edit) and only commits the
 * clamped value on blur or Enter. The draft state mirrors what the
 * user has typed so far; if it ends up out of range or empty when
 * they leave the field, we clamp to the bounds and push the value
 * back up to the parent.
 */
function ClampedNumberInput({
  value,
  min,
  max,
  step,
  onCommit,
  style,
  title,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onCommit: (v: number) => void;
  style?: CSSProperties;
  title?: string;
}) {
  const [draft, setDraft] = useState<string>(String(value));
  const lastExternalRef = useRef(value);
  // Re-seed the draft when the canonical value changes from outside
  // (e.g. reset button, fresh poll after the event identity changed).
  useEffect(() => {
    if (value !== lastExternalRef.current) {
      lastExternalRef.current = value;
      setDraft(String(value));
    }
  }, [value]);
  const commit = () => {
    const parsed = Number(draft);
    const clamped = Number.isFinite(parsed) ? clampN(parsed, min, max) : value;
    setDraft(String(clamped));
    lastExternalRef.current = clamped;
    if (clamped !== value) onCommit(clamped);
  };
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit();
          (e.target as HTMLInputElement).blur();
        }
      }}
      style={style}
      title={title}
    />
  );
}


// ── Schedule sound triggers ──────────────────────────────────────────────

const ANCHOR_OPTIONS: { value: TriggerAnchor; label: string }[] = [
  { value: 'start', label: 'Entry start' },
  { value: 'end',   label: 'Entry end' },
];

function ScheduleSoundTriggersSection() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000);
  const { data: schedule } = usePolledQuery(
    () => event ? obsApi.schedule(event.id) : Promise.resolve([] as ScheduleEntry[]),
    5000,
    [event?.id],
  );
  const { data: triggers } = usePolledQuery(
    () => obsApi.scheduleEntrySoundTriggers(),
    3000,
  );
  const { data: assets } = usePolledQuery(obsApi.soundAssets, 10_000);
  const [busy, setBusy] = useState(false);
  const [draftEntryId, setDraftEntryId] = useState<number | ''>('');
  const [draftSoundId, setDraftSoundId] = useState<number | ''>('');

  // Include child entries (parent_entry != null) — e.g. an "other" slot
  // nested inside a game row like "Dawn of the First Day" under Hyrule
  // Warriors. Sort by the parent's order so children render next to
  // their parent rather than at the top.
  const entries = useMemo(() => {
    const all = (schedule ?? []).slice();
    const byId = new Map(all.map((e) => [e.id, e]));
    const orderOf = (e: ScheduleEntry): number => {
      if (e.parent_entry == null) return e.order * 1000;
      const parent = byId.get(e.parent_entry);
      return (parent ? parent.order * 1000 : e.order * 1000) + e.start_offset_minutes;
    };
    return all.sort((a, b) => orderOf(a) - orderOf(b));
  }, [schedule]);
  const labelForEntry = (entry: ScheduleEntry): string => {
    const base = entry.display_title || entry.title;
    if (entry.parent_entry == null) return base;
    const parent = (schedule ?? []).find((s) => s.id === entry.parent_entry);
    const parentLabel = parent?.display_title || parent?.title || `#${entry.parent_entry}`;
    return `↳ ${base}  (in ${parentLabel})`;
  };
  const triggersByEntry = useMemo(() => {
    const map = new Map<number, ScheduleEntrySoundTrigger[]>();
    for (const t of triggers ?? []) {
      const arr = map.get(t.schedule_entry) ?? [];
      arr.push(t);
      map.set(t.schedule_entry, arr);
    }
    return map;
  }, [triggers]);

  const addTrigger = async () => {
    if (!draftEntryId || !draftSoundId) return;
    setBusy(true);
    try {
      await obsApi.createScheduleEntrySoundTrigger({
        schedule_entry: Number(draftEntryId),
        sound: Number(draftSoundId),
        anchor: 'start',
        offset_seconds: 0,
        message: '',
        priority: 5,
        duration_seconds: 6,
        show_banner: true,
        is_active: true,
      });
      setDraftSoundId('');
    } finally {
      setBusy(false);
    }
  };

  const resetAll = async () => {
    if (!confirm('Clear last-fired timestamps on every trigger of the active event?')) return;
    setBusy(true);
    try {
      await obsApi.resetScheduleEntrySoundTriggers();
    } finally {
      setBusy(false);
    }
  };

  if (!event) {
    return (
      <section className="control-card">
        <h2>Schedule sound triggers</h2>
        <p className="text-warning">No active event.</p>
      </section>
    );
  }

  const entriesWithTriggers = entries.filter((e) => (triggersByEntry.get(e.id) ?? []).length > 0);
  const soundOptions = assets ?? [];

  return (
    <section className="control-card" style={{ minWidth: 0 }}>
      <h2>Schedule sound triggers</h2>
      <p className="text-white-50">
        Wire sounds from the library to schedule entries at signed
        offsets from the entry's start or end ETA. <strong>Anchor</strong>{' '}
        picks start or end; <strong>Offset</strong> is signed seconds —
        negative fires before, 0 at, positive after.{' '}
        <strong>Show banner</strong> off → audio plays alone, no
        celebration takeover (use for ambient cues like warning bells).
        Bell example: 3 rows, anchor=start, offsets <code>-30</code>,{' '}
        <code>-20</code>, <code>-10</code>, Show banner off; plus a
        4th row at <code>0</code> with the start sting and Show banner
        on.
      </p>

      <div className="control-btn-row" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label className="d-flex flex-column">
          <small>Add trigger to entry</small>
          <select
            value={draftEntryId}
            onChange={(e) => setDraftEntryId(e.target.value ? Number(e.target.value) : '')}
            style={{ minWidth: 280 }}
          >
            <option value="">Pick a schedule entry…</option>
            {entries.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.parent_entry == null ? `#${entry.order} ` : ''}{labelForEntry(entry)}
              </option>
            ))}
          </select>
        </label>
        <label className="d-flex flex-column">
          <small>Sound</small>
          <select
            value={draftSoundId}
            onChange={(e) => setDraftSoundId(e.target.value ? Number(e.target.value) : '')}
            style={{ minWidth: 200 }}
          >
            <option value="">Pick a sound…</option>
            {soundOptions.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <button
          className="btn btn-bloodmoon"
          disabled={busy || !draftEntryId || !draftSoundId}
          onClick={addTrigger}
        >
          Add trigger
        </button>
        <button
          className="btn btn-outline-light"
          disabled={busy}
          onClick={resetAll}
          style={{ marginLeft: 'auto' }}
          title="Clears last_fired_at on every trigger so the show can be re-run"
        >
          Reset all (re-arm)
        </button>
      </div>

      {entriesWithTriggers.length === 0 && (
        <p className="text-white-50 mt-3">No triggers yet.</p>
      )}

      {entriesWithTriggers.map((entry) => {
        const entryTriggers = (triggersByEntry.get(entry.id) ?? [])
          .slice()
          .sort((a, b) => {
            if (a.anchor !== b.anchor) return a.anchor === 'start' ? -1 : 1;
            return a.offset_seconds - b.offset_seconds;
          });
        return (
          <div key={entry.id} className="mt-3">
            <h3 style={{ fontSize: '0.95rem', margin: '0 0 0.35rem' }}>
              <code>#{entry.order}</code> {labelForEntry(entry)}
            </h3>
            <table
              className="control-table trigger-table"
              style={{ fontSize: '0.8em', width: '100%', tableLayout: 'fixed' }}
            >
              <colgroup>
                <col style={{ width: 84 }} />
                <col style={{ width: 64 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 56 }} />
                <col style={{ width: 130 }} />
                <col />
                <col />
                <col style={{ width: 52 }} />
                <col style={{ width: 52 }} />
                <col style={{ width: 48 }} />
                <col style={{ width: 70 }} />
                <col style={{ width: 132 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Anchor</th>
                  <th title="Offset in seconds — signed">Off (s)</th>
                  <th>Sound</th>
                  <th title="Show banner">Bnr</th>
                  <th>Tag</th>
                  <th>Message</th>
                  <th>Subhead</th>
                  <th title="Priority">Pri</th>
                  <th title="Duration in seconds">Dur</th>
                  <th title="Active">On</th>
                  <th>Fired</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entryTriggers.map((t) => (
                  <TriggerRow key={t.id} trigger={t} sounds={soundOptions} />
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </section>
  );
}

interface OmnibarTriggerDraft {
  anchor: TriggerAnchor;
  sound: number;
  offset_seconds: string;
  show_banner: boolean;
  tag: string;
  message: string;
  subhead: string;
  priority: string;
  duration_seconds: string;
  is_active: boolean;
}

function omnibarTriggerDraft(t: ScheduleEntrySoundTrigger): OmnibarTriggerDraft {
  return {
    anchor: t.anchor,
    sound: t.sound,
    offset_seconds: String(t.offset_seconds),
    show_banner: t.show_banner,
    tag: t.tag,
    message: t.message,
    subhead: t.subhead,
    priority: String(t.priority),
    duration_seconds: String(t.duration_seconds),
    is_active: t.is_active,
  };
}

function TriggerRow({
  trigger,
  sounds,
}: {
  trigger: ScheduleEntrySoundTrigger;
  sounds: SoundAsset[];
}) {
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<OmnibarTriggerDraft>(() => omnibarTriggerDraft(trigger));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (dirty) return;
    setDraft(omnibarTriggerDraft(trigger));
  }, [trigger, dirty]);

  const patch = <K extends keyof OmnibarTriggerDraft>(key: K, value: OmnibarTriggerDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  const clampInt = (s: string, lo: number, hi: number, fallback: number) => {
    const n = Number(s);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(lo, Math.min(hi, Math.round(n)));
  };

  const save = async () => {
    setBusy(true);
    try {
      await obsApi.updateScheduleEntrySoundTrigger(trigger.id, {
        anchor: draft.anchor,
        sound: draft.sound,
        offset_seconds: clampInt(draft.offset_seconds, -3600, 3600, trigger.offset_seconds),
        show_banner: draft.show_banner,
        tag: draft.tag,
        message: draft.message,
        subhead: draft.subhead,
        priority: clampInt(draft.priority, 0, 100, trigger.priority),
        duration_seconds: clampInt(draft.duration_seconds, 1, 120, trigger.duration_seconds),
        is_active: draft.is_active,
      });
      setDirty(false);
    } finally {
      setBusy(false);
    }
  };

  const resetDraft = () => {
    setDraft(omnibarTriggerDraft(trigger));
    setDirty(false);
  };

  const test = () => {
    const asset = sounds.find((s) => s.id === draft.sound);
    if (!asset?.url) return;
    try {
      const audio = new Audio(asset.url);
      audio.volume = Math.max(0, Math.min(1, asset.volume));
      audio.play().catch(() => {});
    } catch { /* ignore */ }
  };

  const remove = async () => {
    if (!confirm('Delete this trigger?')) return;
    setBusy(true);
    try {
      await obsApi.deleteScheduleEntrySoundTrigger(trigger.id);
    } finally {
      setBusy(false);
    }
  };

  // Visual dimming on the banner-only columns when show_banner is off.
  const dimWhenSilent = !draft.show_banner ? { opacity: 0.55 as const } : undefined;
  const rowStyle = dirty ? { background: 'rgba(255, 210, 58, 0.06)' } : undefined;

  const inputFill: CSSProperties = { width: '100%', boxSizing: 'border-box', minWidth: 0 };
  return (
    <tr style={rowStyle}>
      <td>
        <select
          disabled={busy}
          value={draft.anchor}
          onChange={(e) => patch('anchor', e.target.value as TriggerAnchor)}
          style={inputFill}
        >
          {ANCHOR_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </td>
      <td>
        <input
          type="number"
          disabled={busy}
          min={-3600}
          max={3600}
          step={5}
          value={draft.offset_seconds}
          onChange={(e) => patch('offset_seconds', e.target.value)}
          style={inputFill}
        />
      </td>
      <td>
        <select
          disabled={busy}
          value={draft.sound}
          onChange={(e) => patch('sound', Number(e.target.value))}
          style={inputFill}
        >
          {sounds.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </td>
      <td style={{ textAlign: 'center' }}>
        <input
          type="checkbox"
          disabled={busy}
          checked={draft.show_banner}
          onChange={(e) => patch('show_banner', e.target.checked)}
        />
      </td>
      <td style={dimWhenSilent}>
        <input
          type="text"
          disabled={busy}
          value={draft.tag}
          onChange={(e) => patch('tag', e.target.value)}
          placeholder="NOW PLAYING"
          maxLength={64}
          style={inputFill}
        />
      </td>
      <td style={dimWhenSilent}>
        <input
          type="text"
          disabled={busy}
          value={draft.message}
          onChange={(e) => patch('message', e.target.value)}
          placeholder="Banner headline"
          style={inputFill}
        />
      </td>
      <td style={dimWhenSilent}>
        <input
          type="text"
          disabled={busy}
          value={draft.subhead}
          onChange={(e) => patch('subhead', e.target.value)}
          placeholder="Optional subline"
          style={inputFill}
        />
      </td>
      <td style={dimWhenSilent}>
        <input
          type="number"
          disabled={busy}
          min={0}
          max={100}
          step={1}
          value={draft.priority}
          onChange={(e) => patch('priority', e.target.value)}
          style={inputFill}
        />
      </td>
      <td style={dimWhenSilent}>
        <input
          type="number"
          disabled={busy}
          min={1}
          max={120}
          step={1}
          value={draft.duration_seconds}
          onChange={(e) => patch('duration_seconds', e.target.value)}
          style={inputFill}
        />
      </td>
      <td style={{ textAlign: 'center' }}>
        <input
          type="checkbox"
          disabled={busy}
          checked={draft.is_active}
          onChange={(e) => patch('is_active', e.target.checked)}
        />
      </td>
      <td className="text-white-50" style={{ fontSize: '0.85em' }}>
        {trigger.last_fired_at ? fmtTime(trigger.last_fired_at) : '—'}
      </td>
      <td style={{ whiteSpace: 'nowrap', padding: '0.25rem' }}>
        <div style={{ display: 'inline-flex', gap: '0.2rem', flexWrap: 'nowrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-sm btn-bloodmoon trigger-icon-btn"
            disabled={!dirty || busy}
            onClick={save}
            title={dirty ? 'Save pending edits' : 'No changes'}
            aria-label="Save"
          >
            <FontAwesomeIcon icon={faFloppyDisk} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-light trigger-icon-btn"
            disabled={!dirty || busy}
            onClick={resetDraft}
            title="Discard pending edits"
            aria-label="Reset"
          >
            <FontAwesomeIcon icon={faRotateLeft} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-light trigger-icon-btn"
            disabled={busy}
            onClick={test}
            title="Play the wired sound asset locally"
            aria-label="Test sound"
          >
            <FontAwesomeIcon icon={faPlay} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger trigger-icon-btn"
            disabled={busy}
            onClick={remove}
            title="Delete trigger"
            aria-label="Delete"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Objective editor ─────────────────────────────────────────────────────

function ObjectiveSection() {
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, 3000);
  const entry = cp?.schedule_entry_detail ?? null;
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const lastSeenIdRef = useRef<number | null>(null);

  // Sync local draft when the active entry changes (don't blow away
  // unsaved edits if the same entry comes back from a poll).
  useEffect(() => {
    if (entry && entry.id !== lastSeenIdRef.current) {
      lastSeenIdRef.current = entry.id;
      setDraft(entry.current_objective || '');
    }
  }, [entry]);

  const save = async () => {
    if (!entry) return;
    setBusy(true);
    try {
      await obsApi.updateScheduleEntry(entry.id, {
        current_objective: draft.trim(),
      });
      setSavedAt(new Date());
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    if (!entry) return;
    setBusy(true);
    try {
      await obsApi.updateScheduleEntry(entry.id, { current_objective: '' });
      setDraft('');
      setSavedAt(new Date());
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="control-card">
      <h2>Current objective</h2>
      {!entry ? (
        <p className="text-warning">
          No "Currently Playing" entry. Pick one in /control/schedule first.
        </p>
      ) : (
        <>
          <p className="text-white-50">
            Free-text snippet shown on the omnibar's <code>objective</code> panel
            (e.g. "Find the Master Sword", "Beat Ganondorf, second phase").
            Blank = hide the panel from rotation.
          </p>
          <div className="control-btn-row" style={{ flexWrap: 'wrap' }}>
            <label className="d-flex flex-column flex-grow-1" style={{ minWidth: 320 }}>
              <small>Objective for {entry.display_title}</small>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="What's the runner trying to do RIGHT NOW?"
                maxLength={240}
              />
            </label>
            <button className="btn btn-bloodmoon" disabled={busy} onClick={save}>
              Save
            </button>
            <button className="btn btn-outline-light" disabled={busy} onClick={clear}>
              Clear
            </button>
            {savedAt && (
              <small className="text-white-50 align-self-end">
                saved {fmtTime(savedAt.toISOString())}
              </small>
            )}
          </div>

          <hr className="my-4" style={{ borderColor: 'rgba(255,255,255,0.12)' }} />
          <p className="text-white-50 mb-0">
            The per-game objective library (the timer's splits + the omnibar
            objective checklist) is managed on its own page:{' '}
            <a className="text-info" href="/control/objectives">
              Objectives
            </a>
            .
          </p>
        </>
      )}
    </section>
  );
}

// ── 1. Overrides ─────────────────────────────────────────────────────────

const OVERRIDE_COLUMNS: TableColumn<OmnibarOverride>[] = [
  { id: 'kind',     header: 'Kind',     sortValue: (o) => o.kind, initialWidth: 140 },
  { id: 'lane',     header: 'Lane',     sortValue: (o) => o.target_lane, initialWidth: 100 },
  { id: 'message',  header: 'Message',  sortValue: (o) => String(o.payload?.message ?? '') },
  { id: 'priority', header: 'Priority', sortValue: (o) => o.priority, initialWidth: 90 },
  { id: 'window',   header: 'Window',   sortValue: (o) => new Date(o.starts_at).getTime(), initialWidth: 180 },
  { id: 'state',    header: 'State',    sortValue: (o) => (o.is_live ? 0 : o.is_active ? 1 : 2), initialWidth: 100 },
  { id: 'actions',  header: '',         initialWidth: 360 },
];

function OverridesSection() {
  const { data: overrides } = usePolledQuery(obsApi.overrides, 3000);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{
    kind: string;
    message: string;
    target_lane: OmnibarLane;
    duration_s: number;
    priority: number;
  }>({
    kind: 'urgent',
    message: 'Big moment incoming!',
    target_lane: 'bottom',
    duration_s: 30,
    priority: 5,
  });

  const create = async () => {
    setBusy(true);
    try {
      const expiresAt = new Date(Date.now() + form.duration_s * 1000).toISOString();
      await obsApi.createOverride({
        kind: form.kind,
        payload: { message: form.message },
        target_lane: form.target_lane,
        expires_at: expiresAt,
        priority: form.priority,
        is_active: true,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="control-card">
      <h2>Overrides</h2>
      <p className="text-white-50">
        Active overrides push the omnibar into <strong>urgent</strong> mode.
        Higher <code>priority</code> wins when multiple overlap.
      </p>

      <div className="control-btn-row" style={{ flexWrap: 'wrap' }}>
        <label className="d-flex flex-column">
          <small>Kind</small>
          <select
            value={form.kind}
            onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}
          >
            <option value="urgent">urgent</option>
            <option value="announcement">announcement</option>
            <option value="sponsor-shout">sponsor-shout</option>
            <option value="raid-alert">raid-alert</option>
            <option value="raffle">raffle</option>
          </select>
        </label>
        <label className="d-flex flex-column flex-grow-1" style={{ minWidth: 240 }}>
          <small>Message</small>
          <input
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          />
        </label>
        <label className="d-flex flex-column">
          <small>Target lane</small>
          <select
            value={form.target_lane}
            onChange={(e) =>
              setForm((f) => ({ ...f, target_lane: e.target.value as OmnibarLane }))
            }
          >
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="both">Both</option>
          </select>
        </label>
        <label className="d-flex flex-column">
          <small>Duration (s)</small>
          <input
            type="number"
            min={5}
            value={form.duration_s}
            onChange={(e) => setForm((f) => ({ ...f, duration_s: Number(e.target.value) }))}
            style={{ width: 90 }}
          />
        </label>
        <label className="d-flex flex-column">
          <small>Priority</small>
          <input
            type="number"
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
            style={{ width: 80 }}
          />
        </label>
        <button className="btn btn-bloodmoon" disabled={busy} onClick={create}>
          Trigger override
        </button>
      </div>

      <OverridesTable rows={overrides ?? []} />
    </section>
  );
}

function OverridesTable({ rows }: { rows: OmnibarOverride[] }) {
  const ctrl = useTableControls(rows, OVERRIDE_COLUMNS, 'control:overrides-v1');
  return (
    <div className="mt-3">
      <ctrl.FilterInput placeholder="Filter overrides…" />
      <div style={{ overflowX: 'auto' }}>
        <table className="control-table" style={{ minWidth: 1080, tableLayout: 'fixed' }}>
          <colgroup>
            {OVERRIDE_COLUMNS.map((c) => <col key={c.id} style={ctrl.colStyle(c.id)} />)}
          </colgroup>
          <thead>
            <tr>
              {OVERRIDE_COLUMNS.map((c) => (
                <th key={c.id} {...ctrl.headerProps(c.id)}>
                  {c.header}
                  {ctrl.sortIndicator(c.id)}
                  {ctrl.resizeHandle(c.id)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ctrl.rows.length === 0 && (
              <tr><td colSpan={OVERRIDE_COLUMNS.length} className="text-white-50">No overrides match.</td></tr>
            )}
            {ctrl.rows.map((o) => (
              <OverrideRow key={o.id} o={o} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface OverrideDraft {
  kind: string;
  target_lane: OmnibarLane;
  message: string;
  priority: string;
}

function overrideDraft(o: OmnibarOverride): OverrideDraft {
  return {
    kind: o.kind,
    target_lane: o.target_lane,
    message: String(o.payload?.message ?? ''),
    priority: String(o.priority),
  };
}

function OverrideRow({ o }: { o: OmnibarOverride }) {
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<OverrideDraft>(() => overrideDraft(o));
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (dirty) return;
    setDraft(overrideDraft(o));
  }, [o, dirty]);

  const patch = <K extends keyof OverrideDraft>(key: K, value: OverrideDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      const priority = Number(draft.priority);
      // Merge the message into the existing payload so other JSON
      // keys (sound_url for schedule-entry-sound, etc.) survive.
      const existingPayload = (o.payload && typeof o.payload === 'object') ? o.payload : {};
      await obsApi.updateOverride(o.id, {
        kind: draft.kind.trim(),
        target_lane: draft.target_lane,
        payload: { ...existingPayload, message: draft.message },
        priority: Number.isFinite(priority) ? Math.round(priority) : o.priority,
      });
      setDirty(false);
    } finally {
      setBusy(false);
    }
  };
  const reset = () => {
    setDraft(overrideDraft(o));
    setDirty(false);
  };
  const toggle = async () => {
    setBusy(true);
    try {
      if (o.is_active) await obsApi.deactivateOverride(o.id);
      else await obsApi.activateOverride(o.id);
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!confirm(`Delete override "${o.kind}"?`)) return;
    setBusy(true);
    try { await obsApi.deleteOverride(o.id); } finally { setBusy(false); }
  };

  const rowStyle = dirty ? { background: 'rgba(255, 210, 58, 0.06)' } : undefined;
  return (
    <tr style={rowStyle}>
      <td>
        <input
          type="text"
          disabled={busy}
          value={draft.kind}
          onChange={(e) => patch('kind', e.target.value)}
          style={{ width: '100%', minWidth: 120 }}
        />
      </td>
      <td>
        <select
          disabled={busy}
          value={draft.target_lane}
          onChange={(e) => patch('target_lane', e.target.value as OmnibarLane)}
        >
          <option value="top">top</option>
          <option value="bottom">bottom</option>
          <option value="both">both</option>
        </select>
      </td>
      <td>
        <input
          type="text"
          disabled={busy}
          value={draft.message}
          onChange={(e) => patch('message', e.target.value)}
          style={{ width: '100%', minWidth: 200 }}
        />
      </td>
      <td>
        <input
          type="number"
          disabled={busy}
          min={0}
          step={1}
          value={draft.priority}
          onChange={(e) => patch('priority', e.target.value)}
          style={{ width: 70 }}
        />
      </td>
      <td className="text-white-50" style={{ fontSize: '0.85em' }}>
        {fmtTimeRange(o.starts_at, o.expires_at)}
      </td>
      <td>
        {o.is_live ? <span className="text-success">LIVE</span> :
          o.is_active ? <span className="text-warning">queued</span> :
            <span className="text-white-50">paused</span>}
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'nowrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-sm btn-bloodmoon"
            disabled={!dirty || busy}
            onClick={save}
            title={dirty ? 'Commit pending edits' : 'No changes'}
          >
            Save
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-light"
            disabled={!dirty || busy}
            onClick={reset}
          >
            Reset
          </button>
          <button type="button" className="btn btn-sm btn-outline-light" disabled={busy} onClick={toggle}>
            {o.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button type="button" className="btn btn-sm btn-outline-danger" disabled={busy} onClick={remove}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── 2. Playthrough events ────────────────────────────────────────────────

const QUICK_EVENTS: { kind: string; label: string; payload?: Record<string, unknown> }[] = [
  { kind: 'boss-defeated', label: 'Boss defeated' },
  { kind: 'shrine-cleared', label: 'Shrine cleared' },
  { kind: 'dungeon-complete', label: 'Dungeon complete' },
  { kind: 'item-collected', label: 'Item collected' },
  { kind: 'player-death', label: 'Player died' },
  { kind: 'segment-complete', label: 'Segment complete' },
  { kind: 'runner-swap', label: 'Runner swap' },
];

function PlaythroughEventsSection() {
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, 3000);
  const entry = cp?.schedule_entry_detail ?? null;
  const { data: events } = usePolledQuery(
    () => entry
      ? obsApi.playthroughEvents({ scheduleEntryId: entry.id })
      : Promise.resolve([] as PlaythroughEvent[]),
    3000,
    [entry?.id],
  );
  const [busy, setBusy] = useState(false);
  const [customKind, setCustomKind] = useState('');
  const [customPayload, setCustomPayload] = useState('{}');

  const fire = async (kind: string, payload: Record<string, unknown> = {}) => {
    if (!entry) return;
    setBusy(true);
    try {
      await obsApi.createPlaythroughEvent({
        schedule_entry: entry.id,
        kind,
        payload,
        expires_at: new Date(Date.now() + 10_000).toISOString(),
      });
    } finally {
      setBusy(false);
    }
  };

  const fireCustom = async () => {
    if (!entry || !customKind.trim()) return;
    let payload: Record<string, unknown> = {};
    try { payload = JSON.parse(customPayload || '{}'); } catch { /* ignore */ }
    await fire(customKind.trim(), payload);
    setCustomKind('');
    setCustomPayload('{}');
  };

  return (
    <section className="control-card">
      <h2>Playthrough events</h2>
      {!entry ? (
        <p className="text-warning">
          No "Currently Playing" entry. Pick one in /control/schedule first.
        </p>
      ) : (
        <>
          <p className="text-white-50">
            Firing against: <strong>{entry.display_title}</strong> (entry #{entry.id}).
            Events fire-and-forget — the omnibar plays an animation, no state change.
          </p>

          <div className="control-btn-row" style={{ flexWrap: 'wrap' }}>
            {QUICK_EVENTS.map((q) => (
              <button
                key={q.kind}
                className="btn btn-sm btn-bloodmoon"
                disabled={busy}
                onClick={() => fire(q.kind, q.payload ?? {})}
              >
                {q.label}
              </button>
            ))}
          </div>

          <div className="control-btn-row mt-3" style={{ flexWrap: 'wrap' }}>
            <label className="d-flex flex-column">
              <small>Custom kind</small>
              <input
                value={customKind}
                onChange={(e) => setCustomKind(e.target.value)}
                placeholder="e.g. cutscene-start"
              />
            </label>
            <label className="d-flex flex-column flex-grow-1" style={{ minWidth: 240 }}>
              <small>Payload (JSON)</small>
              <input
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                placeholder='{"name":"Demise"}'
              />
            </label>
            <button
              className="btn btn-sm btn-outline-light"
              disabled={busy || !customKind.trim()}
              onClick={fireCustom}
            >
              Fire custom
            </button>
          </div>

          <PayloadHelp onPickExample={setCustomPayload} />

          <PlaythroughEventsTable rows={events ?? []} />
        </>
      )}
    </section>
  );
}

const PLAYTHROUGH_COLUMNS: TableColumn<PlaythroughEvent>[] = [
  { id: 'kind',    header: 'Kind',    sortValue: (e) => e.kind,                                                  initialWidth: 180 },
  { id: 'payload', header: 'Payload', filterValue: (e) => JSON.stringify(e.payload) },
  { id: 'created', header: 'Created', sortValue: (e) => new Date(e.created_at).getTime(),                       initialWidth: 130 },
  { id: 'expires', header: 'Expires', sortValue: (e) => (e.expires_at ? new Date(e.expires_at).getTime() : 0),  initialWidth: 130 },
  { id: 'actions', header: '',                                                                                   initialWidth: 110 },
];

function PlaythroughEventsTable({ rows }: { rows: PlaythroughEvent[] }) {
  const ctrl = useTableControls(rows, PLAYTHROUGH_COLUMNS, 'control:playthrough-events-v1');
  return (
    <div className="mt-3">
      <ctrl.FilterInput placeholder="Filter events…" />
      <div style={{ overflowX: 'auto' }}>
        <table className="control-table" style={{ minWidth: 840, tableLayout: 'fixed' }}>
          <colgroup>
            {PLAYTHROUGH_COLUMNS.map((c) => <col key={c.id} style={ctrl.colStyle(c.id)} />)}
          </colgroup>
          <thead>
            <tr>
              {PLAYTHROUGH_COLUMNS.map((c) => (
                <th key={c.id} {...ctrl.headerProps(c.id)}>
                  {c.header}
                  {ctrl.sortIndicator(c.id)}
                  {ctrl.resizeHandle(c.id)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ctrl.rows.length === 0 && (
              <tr><td colSpan={PLAYTHROUGH_COLUMNS.length} className="text-white-50">No events match.</td></tr>
            )}
            {ctrl.rows.map((e) => (
              <PlaythroughEventRow key={e.id} ev={e} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Inline documentation for the Payload (JSON) input. The omnibar's
 * EventFlashPanel currently reads exactly one optional key —
 * `name` — and falls back to a humanised version of the `kind` when
 * it's missing. That's it. Everything else in the JSON is stored on
 * the event row but never surfaced (yet), so don't promise more than
 * what actually paints. Each example is clickable: copies the JSON
 * into the input so the operator doesn't have to retype it.
 */
function PayloadHelp({ onPickExample }: { onPickExample: (json: string) => void }) {
  const examples: { kind: string; json: string; note: string }[] = [
    { kind: 'boss-defeated', json: '{"name":"Demise"}', note: 'Tag → "BOSS DEFEATED", body → "Demise"' },
    { kind: 'shrine-cleared', json: '{"name":"Toh Yahsa Shrine"}', note: 'Tag → "SHRINE CLEARED", body → shrine name' },
    { kind: 'dungeon-complete', json: '{"name":"Forest Temple"}', note: 'Tag → "DUNGEON CLEARED", body → dungeon name' },
    { kind: 'item-collected', json: '{"name":"Master Sword"}', note: 'Tag → "ITEM GET", body → item name' },
    { kind: 'player-death', json: '{"name":"To a Bokoblin"}', note: 'Tag → "KO", body → cause (optional)' },
    { kind: 'segment-complete', json: '{"name":"Death Mountain"}', note: 'Tag → "SPLIT", body → segment name' },
    { kind: 'runner-swap', json: '{"name":"MSec → Jasper"}', note: 'Tag → "RUNNER SWAP", body → handoff label' },
  ];

  return (
    <details className="mt-2 text-white-50" style={{ fontSize: '0.85em' }}>
      <summary style={{ cursor: 'pointer' }}>
        What goes in <code>Payload (JSON)</code>?
      </summary>
      <div className="mt-2" style={{ paddingLeft: '0.5rem' }}>
        <p className="mb-2">
          The omnibar currently reads exactly one optional key —{' '}
          <code>name</code> (string) — which overrides the auto-generated
          body text. When omitted, the body falls back to a humanised
          version of <code>kind</code>. Other JSON keys are stored on
          the event row but never rendered; safe to add, but don't
          expect them to show up yet.
        </p>
        <p className="mb-2">
          The <code>kind</code> string drives the tag label (the gold
          pill on the left) via a switch in{' '}
          <code>EventFlashPanel.tsx</code>. Unknown kinds get a
          humanised fallback (<code>cutscene-start</code> →{' '}
          <code>CUTSCENE START</code>).
        </p>
        <table className="control-table" style={{ fontSize: '0.9em' }}>
          <thead>
            <tr>
              <th>Kind</th>
              <th>Example payload</th>
              <th>What renders</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {examples.map((ex) => (
              <tr key={ex.kind}>
                <td><code>{ex.kind}</code></td>
                <td><code>{ex.json}</code></td>
                <td>{ex.note}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-light"
                    onClick={() => onPickExample(ex.json)}
                    title="Copy this JSON into the payload input"
                  >
                    Use
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 mb-0">
          To make a new key actually render in the omnibar, add a
          handler in <code>EventFlashPanel.tsx</code> (or, longer term,
          register a per-kind handler — see the comment block above{' '}
          <code>PlaythroughEvent</code> in <code>models.py</code>).
        </p>
      </div>
    </details>
  );
}

function PlaythroughEventRow({ ev }: { ev: PlaythroughEvent }) {
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    setBusy(true);
    try { await obsApi.deletePlaythroughEvent(ev.id); } finally { setBusy(false); }
  };
  return (
    <tr>
      <td><code>{ev.kind}</code></td>
      <td className="text-white-50" style={{ fontSize: '0.85em' }}>
        {Object.keys(ev.payload).length ? JSON.stringify(ev.payload) : '—'}
      </td>
      <td className="text-white-50" style={{ fontSize: '0.85em' }}>{fmtTime(ev.created_at)}</td>
      <td className="text-white-50" style={{ fontSize: '0.85em' }}>
        {ev.expires_at ? fmtTime(ev.expires_at) : '—'}
      </td>
      <td>
        <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={remove}>
          Delete
        </button>
      </td>
    </tr>
  );
}

// ── 3. Incentives ────────────────────────────────────────────────────────

const INCENTIVE_COLUMNS: TableColumn<Incentive>[] = [
  { id: 'name',     header: 'Name',     sortValue: (i) => i.name,                                       initialWidth: 220 },
  { id: 'goal',     header: 'Goal (£)', sortValue: (i) => Number(i.goal_amount) || 0,                   initialWidth: 110 },
  { id: 'progress', header: 'Progress', sortValue: (i) => i.progress_pct,                               initialWidth: 220 },
  { id: 'state',    header: 'State',    sortValue: (i) => (i.is_reached ? 0 : i.is_active ? 1 : 2),     initialWidth: 110 },
  { id: 'contribute', header: 'Contribute',                                                              initialWidth: 320 },
  { id: 'actions',  header: '',                                                                          initialWidth: 360 },
];

function IncentivesSection() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000);
  const { data: incentives } = usePolledQuery(
    () => event ? obsApi.incentives({ eventId: event.id }) : Promise.resolve([] as Incentive[]),
    3000,
    [event?.id],
  );
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '', goal_amount: '50.00', description: '', options: '',
  });

  const create = async () => {
    if (!event || !form.name.trim()) return;
    setBusy(true);
    try {
      // Parse "Option A | Option B | Option C" into the bid-war
      // payload shape. Empty input → no payload, regular incentive.
      const optionNames = form.options
        .split(/[|\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const payload =
        optionNames.length >= 2
          ? {
              options: optionNames.map((name, i) => ({
                id: `opt-${i + 1}`,
                name,
                votes: 0,
              })),
            }
          : undefined;
      await obsApi.createIncentive({
        event: event.id,
        name: form.name.trim(),
        goal_amount: form.goal_amount,
        description: form.description,
        ...(payload ? { payload } : {}),
      });
      setForm({ name: '', goal_amount: '50.00', description: '', options: '' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="control-card">
      <h2>Incentives</h2>
      {!event ? (
        <p className="text-warning">No active event.</p>
      ) : (
        <>
          <p className="text-white-50">
            Donation targets. Contribute hits <code>POST /contribute/</code>.
            When the goal is crossed, the response carries{' '}
            <code>newly_reached: true</code> — the omnibar fires{' '}
            <code>incentive-unlocked</code> and plays a fanfare.
          </p>

          <div className="control-btn-row" style={{ flexWrap: 'wrap' }}>
            <label className="d-flex flex-column flex-grow-1" style={{ minWidth: 240 }}>
              <small>Name</small>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Buy the runner a coffee"
              />
            </label>
            <label className="d-flex flex-column">
              <small>Goal (£)</small>
              <input
                type="number"
                step="0.01"
                value={form.goal_amount}
                onChange={(e) => setForm((f) => ({ ...f, goal_amount: e.target.value }))}
                style={{ width: 110 }}
              />
            </label>
            <label className="d-flex flex-column flex-grow-1" style={{ minWidth: 220 }}>
              <small>Description (optional)</small>
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </label>
            <label className="d-flex flex-column flex-grow-1" style={{ minWidth: 220 }}>
              <small>Bid-war options (optional, pipe-separated)</small>
              <input
                value={form.options}
                onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
                placeholder="Wind Waker | Twilight Princess | Skyward Sword"
              />
            </label>
            <button className="btn btn-bloodmoon" disabled={busy || !form.name.trim()} onClick={create}>
              Add incentive
            </button>
          </div>

          <IncentivesTable rows={incentives ?? []} />
        </>
      )}
    </section>
  );
}

interface BidWarOption {
  id: string;
  name: string;
  votes: number;
}

function readBidWarOptions(incentive: Incentive): BidWarOption[] | null {
  const opts = (incentive.payload as { options?: unknown }).options;
  if (!Array.isArray(opts) || opts.length < 2) return null;
  return opts
    .filter((o): o is { id: string; name: string; votes?: unknown } =>
      !!o && typeof (o as { id?: unknown }).id === 'string'
      && typeof (o as { name?: unknown }).name === 'string',
    )
    .map((o) => ({
      id: o.id,
      name: o.name,
      votes: typeof o.votes === 'number' ? o.votes : Number(o.votes) || 0,
    }));
}

function IncentivesTable({ rows }: { rows: Incentive[] }) {
  const ctrl = useTableControls(rows, INCENTIVE_COLUMNS, 'control:incentives-v1');
  return (
    <div className="mt-3">
      <ctrl.FilterInput placeholder="Filter incentives…" />
      <div style={{ overflowX: 'auto' }}>
        <table className="control-table" style={{ minWidth: 1180, tableLayout: 'fixed' }}>
          <colgroup>
            {INCENTIVE_COLUMNS.map((c) => <col key={c.id} style={ctrl.colStyle(c.id)} />)}
          </colgroup>
          <thead>
            <tr>
              {INCENTIVE_COLUMNS.map((c) => (
                <th key={c.id} {...ctrl.headerProps(c.id)}>
                  {c.header}
                  {ctrl.sortIndicator(c.id)}
                  {ctrl.resizeHandle(c.id)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ctrl.rows.length === 0 && (
              <tr><td colSpan={INCENTIVE_COLUMNS.length} className="text-white-50">No incentives match.</td></tr>
            )}
            {ctrl.rows.map((i) => (
              <IncentiveRow key={i.id} incentive={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface IncentiveDraft {
  name: string;
  goal_amount: string;
  description: string;
  is_active: boolean;
}

function incentiveDraft(i: Incentive): IncentiveDraft {
  return {
    name: i.name,
    goal_amount: i.goal_amount,
    description: i.description,
    is_active: i.is_active,
  };
}

function IncentiveRow({ incentive }: { incentive: Incentive }) {
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState('5.00');
  const [flash, setFlash] = useState(false);
  const [draft, setDraft] = useState<IncentiveDraft>(() => incentiveDraft(incentive));
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (dirty) return;
    setDraft(incentiveDraft(incentive));
  }, [incentive, dirty]);

  const patch = <K extends keyof IncentiveDraft>(key: K, value: IncentiveDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  const options = readBidWarOptions(incentive);

  const save = async () => {
    setBusy(true);
    try {
      await obsApi.updateIncentive(incentive.id, {
        name: draft.name.trim(),
        goal_amount: draft.goal_amount.trim(),
        description: draft.description,
        is_active: draft.is_active,
      });
      setDirty(false);
    } finally {
      setBusy(false);
    }
  };
  const resetDraft = () => {
    setDraft(incentiveDraft(incentive));
    setDirty(false);
  };

  const contribute = async (optionId?: string) => {
    setBusy(true);
    try {
      const res = await obsApi.contributeToIncentive(incentive.id, amount, optionId);
      if (res.newly_reached) {
        setFlash(true);
        setTimeout(() => setFlash(false), 2000);
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete incentive "${incentive.name}"?`)) return;
    setBusy(true);
    try { await obsApi.deleteIncentive(incentive.id); } finally { setBusy(false); }
  };

  const resetProgress = async () => {
    if (
      !confirm(
        `Reset "${incentive.name}" back to £0?\n\n` +
          'Clears the current amount, the "reached" flag (so the ' +
          'celebration can fire again), and any bid-war option votes. ' +
          'The active/paused state is preserved.',
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await obsApi.resetIncentive(incentive.id);
    } catch (e) {
      alert(`Reset failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const rowStyle = flash
    ? { background: 'rgba(255, 210, 58, 0.18)' }
    : dirty
      ? { background: 'rgba(255, 210, 58, 0.06)' }
      : undefined;

  return (
    <tr style={rowStyle}>
      <td>
        <input
          type="text"
          disabled={busy}
          value={draft.name}
          onChange={(e) => patch('name', e.target.value)}
          style={{ width: '100%', minWidth: 180 }}
        />
        <input
          type="text"
          disabled={busy}
          value={draft.description}
          onChange={(e) => patch('description', e.target.value)}
          placeholder="Description (optional)"
          className="mt-1"
          style={{ width: '100%', minWidth: 180, fontSize: '0.85em' }}
        />
      </td>
      <td>
        <input
          type="number"
          disabled={busy}
          step="0.01"
          min="0"
          value={draft.goal_amount}
          onChange={(e) => patch('goal_amount', e.target.value)}
          style={{ width: 110 }}
        />
      </td>
      <td style={{ minWidth: 220 }}>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.12)' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, incentive.progress_pct)}%`,
              background: 'var(--theme-primary, #e71347)',
              borderRadius: 3,
              transition: 'width 300ms ease',
            }}
          />
        </div>
        <small className="text-white-50">
          £{incentive.current_amount} / £{incentive.goal_amount} ({incentive.progress_pct.toFixed(1)}%)
        </small>
      </td>
      <td>
        <label className="d-inline-flex align-items-center gap-1">
          <input
            type="checkbox"
            disabled={busy}
            checked={draft.is_active}
            onChange={(e) => patch('is_active', e.target.checked)}
          />
          <small>active</small>
        </label>
        <div className="text-white-50" style={{ fontSize: '0.8em' }}>
          {incentive.is_reached
            ? <span className="text-success">REACHED</span>
            : null}
        </div>
      </td>
      <td>
        <div style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: 80 }}
          />
          {options ? (
            options.map((o) => (
              <button
                type="button"
                key={o.id}
                className="btn btn-sm btn-outline-light"
                disabled={busy}
                onClick={() => contribute(o.id)}
                title={`Vote for ${o.name}`}
              >
                {o.name} <small className="text-white-50">+£{amount}</small>
                <small className="text-warning ms-1">({o.votes.toFixed(0)})</small>
              </button>
            ))
          ) : (
            <button type="button" className="btn btn-sm btn-bloodmoon" disabled={busy} onClick={() => contribute()}>
              +£{amount}
            </button>
          )}
        </div>
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'nowrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-sm btn-bloodmoon"
            disabled={!dirty || busy}
            onClick={save}
            title={dirty ? 'Commit pending edits' : 'No changes'}
          >
            Save
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-light"
            disabled={!dirty || busy}
            onClick={resetDraft}
          >
            Reset
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-warning"
            disabled={busy}
            onClick={resetProgress}
            title="Reset progress to £0 (clears reached, zeros bid-war votes)"
          >
            ⟲ Re-arm
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            disabled={busy}
            onClick={remove}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── 4. Milestones ────────────────────────────────────────────────────────

const MILESTONE_COLUMNS: TableColumn<Milestone>[] = [
  // Initial widths trimmed so the row fits a typical control-panel
  // viewport (~1280px) without needing horizontal scroll. Audio URL
  // and message column widths now lean on the operator's resize-bar
  // adjustments (persisted via useTableControls's storage key) if they
  // want longer URLs to be more visible by default.
  { id: 'name',      header: 'Name',       sortValue: (m) => m.name,                            initialWidth: 150 },
  { id: 'threshold', header: 'Threshold',  sortValue: (m) => Number(m.threshold_amount) || 0,   initialWidth: 100 },
  { id: 'message',   header: 'Message',    sortValue: (m) => m.celebration_message,             initialWidth: 180 },
  { id: 'audio_url', header: 'Audio URL',  sortValue: (m) => m.audio_url,                       initialWidth: 170 },
  // Colour pickers cluster — five small swatches per row. Sort by
  // "has any colour set" so themed milestones float to the top of the
  // sort.
  { id: 'colours',   header: 'Colours',    sortValue: (m) =>
      (m.tag_color_from || m.tag_color_to || m.heading_color
        || m.sub_color || m.flash_color) ? 0 : 1,                                                initialWidth: 170 },
  { id: 'order',     header: '#',          sortValue: (m) => m.order,                           initialWidth: 56 },
  { id: 'state',     header: 'State',      sortValue: (m) => (m.is_reached ? 0 : 1),            initialWidth: 110 },
  { id: 'actions',   header: '',                                                                initialWidth: 220 },
];

/** localStorage slot for the per-browser default celebration colours
 *  the operator wants every new milestone to pick up. Persisting keeps
 *  the defaults stable across page refreshes / tab swaps so the
 *  operator only configures the palette once per session. */
const MILESTONE_DEFAULTS_KEY = 'control:milestone-default-colours-v1';

const EMPTY_DEFAULTS = {
  tag_color_from: '',
  tag_color_to: '',
  heading_color: '',
  sub_color: '',
  flash_color: '',
};

type MilestoneDefaults = typeof EMPTY_DEFAULTS;

/** Read the saved defaults out of localStorage. Tolerant of malformed
 *  / older shapes — anything that doesn't look like the expected
 *  string-keyed record gets ignored and the empty defaults returned. */
function loadDefaults(): MilestoneDefaults {
  if (typeof window === 'undefined') return EMPTY_DEFAULTS;
  try {
    const raw = window.localStorage.getItem(MILESTONE_DEFAULTS_KEY);
    if (!raw) return EMPTY_DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<MilestoneDefaults>;
    return {
      tag_color_from: typeof parsed.tag_color_from === 'string' ? parsed.tag_color_from : '',
      tag_color_to:   typeof parsed.tag_color_to   === 'string' ? parsed.tag_color_to   : '',
      heading_color:  typeof parsed.heading_color  === 'string' ? parsed.heading_color  : '',
      sub_color:      typeof parsed.sub_color      === 'string' ? parsed.sub_color      : '',
      flash_color:    typeof parsed.flash_color    === 'string' ? parsed.flash_color    : '',
    };
  } catch {
    return EMPTY_DEFAULTS;
  }
}

function MilestonesSection() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000);
  const { data: milestones } = usePolledQuery(
    () => event ? obsApi.milestones({ eventId: event.id }) : Promise.resolve([] as Milestone[]),
    3000,
    [event?.id],
  );
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '£1k Milestone',
    threshold_amount: '1000.00',
    celebration_message: 'Halfway to the moon!',
  });
  // Default celebration colours — applied to every new milestone the
  // operator creates and (via the "Apply to empty" button below)
  // optionally back-filled onto existing milestones with unset slots.
  // Persisted in localStorage so the operator's palette survives a
  // refresh / cross-tab nav.
  const [defaults, setDefaultsState] = useState<MilestoneDefaults>(() => loadDefaults());
  const setDefaults = (next: MilestoneDefaults | ((prev: MilestoneDefaults) => MilestoneDefaults)) => {
    setDefaultsState((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      try {
        window.localStorage.setItem(MILESTONE_DEFAULTS_KEY, JSON.stringify(resolved));
      } catch { /* ignore storage failures */ }
      return resolved;
    });
  };
  // Bridge so the existing <MilestoneColourCluster> (which expects a
  // MilestoneDraft-keyed onChange) can write into the defaults state.
  // The cluster only ever writes the five colour keys we care about,
  // so casting through Partial<MilestoneDraft> is safe.
  const setDefaultColour = <K extends keyof MilestoneDefaults>(key: K, value: MilestoneDefaults[K]) => {
    setDefaults((d) => ({ ...d, [key]: value }));
  };
  // A MilestoneDraft-shaped object so <MilestoneColourCluster> can
  // render the defaults — only the five colour keys are read.
  const defaultsAsDraft = {
    name: '',
    threshold_amount: '',
    celebration_message: '',
    audio_url: '',
    ...defaults,
    order: '',
  } as MilestoneDraft;
  const hasDefaults =
    !!defaults.tag_color_from || !!defaults.tag_color_to ||
    !!defaults.heading_color || !!defaults.sub_color || !!defaults.flash_color;

  const create = async () => {
    if (!event) return;
    setBusy(true);
    try {
      await obsApi.createMilestone({
        event: event.id,
        name: form.name,
        threshold_amount: form.threshold_amount,
        celebration_message: form.celebration_message,
        // Per-create-form colour overrides come straight from the
        // saved defaults. Empty strings are spread but the backend
        // model defaults the fields to '' anyway so they're no-ops.
        tag_color_from: defaults.tag_color_from,
        tag_color_to:   defaults.tag_color_to,
        heading_color:  defaults.heading_color,
        sub_color:      defaults.sub_color,
        flash_color:    defaults.flash_color,
      });
    } finally {
      setBusy(false);
    }
  };

  /**
   * Reset every milestone to pending in one bulk action.
   *
   * Calls `obsApi.resetMilestone(id)` in parallel on every milestone
   * — the same operation as the per-row ⟲ Re-arm button, just
   * applied across the whole list. Clears `reached_at` on each row
   * AND drops it from the omnibar's local `reachedIdsRef` set on
   * the next poll, so the next time the running total crosses each
   * threshold the celebration fires fresh.
   *
   * Use it for QA / preview, or to wipe the slate between events.
   * Confirms before doing anything.
   */
  const resetAll = async () => {
    if (!milestones?.length) return;
    const reachedCount = milestones.filter((m) => m.is_reached).length;
    if (
      !confirm(
        `Reset ALL ${milestones.length} milestone${
          milestones.length === 1 ? '' : 's'
        } back to pending?\n\n` +
          (reachedCount > 0
            ? `${reachedCount} of them are currently reached — those clear their timestamps and become eligible to celebrate again the next time the running total crosses each threshold.`
            : "None are reached right now, so this won't change anything visible — it just nudges the omnibar's local state to match."),
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await Promise.all(milestones.map((m) => obsApi.resetMilestone(m.id)));
    } finally {
      setBusy(false);
    }
  };

  /** Fill blank colour slots on existing milestones from the saved
   *  defaults. Each row is patched independently — a row with all
   *  five slots already populated is skipped, a row with some blanks
   *  gets only those slots written. */
  const applyDefaultsToEmpty = async () => {
    if (!milestones?.length || !hasDefaults) return;
    const updates = milestones.flatMap((m) => {
      const patch: Partial<{
        tag_color_from: string;
        tag_color_to: string;
        heading_color: string;
        sub_color: string;
        flash_color: string;
      }> = {};
      if (!m.tag_color_from && defaults.tag_color_from) patch.tag_color_from = defaults.tag_color_from;
      if (!m.tag_color_to   && defaults.tag_color_to)   patch.tag_color_to   = defaults.tag_color_to;
      if (!m.heading_color  && defaults.heading_color)  patch.heading_color  = defaults.heading_color;
      if (!m.sub_color      && defaults.sub_color)      patch.sub_color      = defaults.sub_color;
      if (!m.flash_color    && defaults.flash_color)    patch.flash_color    = defaults.flash_color;
      if (Object.keys(patch).length === 0) return [];
      return [{ id: m.id, patch }];
    });
    if (updates.length === 0) {
      alert('Every milestone already has its colour slots set — nothing to back-fill.');
      return;
    }
    if (!confirm(
      `Apply default colours to ${updates.length} milestone${updates.length === 1 ? '' : 's'}? ` +
        `Only EMPTY colour slots are overwritten; existing per-milestone colours are left alone.`,
    )) {
      return;
    }
    setBusy(true);
    try {
      await Promise.all(
        updates.map(({ id, patch }) => obsApi.updateMilestone(id, patch)),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="control-card">
      <h2>Milestones</h2>
      {!event ? (
        <p className="text-warning">No active event.</p>
      ) : (
        <>
          <p className="text-white-50">
            Fixed donation thresholds. <code>Mark reached</code> sets the
            timestamp and the omnibar fires a celebration.
          </p>

          {/* Bulk reset every milestone to pending — same operation as
            * the per-row ⟲ Re-arm button, applied across the whole
            * list. Confirms before doing anything; disabled when no
            * milestones are loaded or a row save is in flight. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-sm btn-outline-warning"
              disabled={busy || !milestones?.length}
              onClick={resetAll}
              title={
                milestones?.length
                  ? 'Clear reached_at on every milestone so they re-fire next time the total crosses each threshold.'
                  : 'No milestones to reset'
              }
            >
              ⟲ Reset all to pending
            </button>
          </div>

          {/* Default celebration colours. The five swatches mirror the
            * per-row cluster below; whatever's set here is applied to
            * every new milestone the operator creates. The "Apply to
            * empty" button back-fills any blank slot on existing
            * milestones without touching slots that already have a
            * per-row override. Persists in localStorage so the
            * defaults survive a refresh / tab swap. */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 0.75rem',
              marginBottom: '0.85rem',
              borderRadius: 6,
              background: 'rgba(0, 0, 0, 0.18)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <span className="text-white-50" style={{ fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Default colours
              </span>
              <span className="text-white-50" style={{ fontSize: '0.75rem', maxWidth: 280 }}>
                Applied to every new milestone you add below.
              </span>
            </div>
            <MilestoneColourCluster
              busy={busy}
              draft={defaultsAsDraft}
              onChange={(key, value) => {
                if (
                  key === 'tag_color_from' || key === 'tag_color_to' ||
                  key === 'heading_color' || key === 'sub_color' || key === 'flash_color'
                ) {
                  setDefaultColour(key, value as string);
                }
              }}
            />
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              disabled={busy || !hasDefaults || !(milestones?.length)}
              onClick={applyDefaultsToEmpty}
              title={
                hasDefaults
                  ? 'Copy each default colour into any milestone that has THAT slot blank. Slots already set are not overwritten.'
                  : 'Pick at least one default colour first'
              }
            >
              Apply to empty rows
            </button>
            {hasDefaults && (
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                disabled={busy}
                onClick={() => setDefaults(EMPTY_DEFAULTS)}
                title="Clear all five default slots — new milestones will fall back to the theme defaults"
              >
                Clear defaults
              </button>
            )}
          </div>

          <div className="control-btn-row" style={{ flexWrap: 'wrap' }}>
            <label className="d-flex flex-column flex-grow-1" style={{ minWidth: 200 }}>
              <small>Name</small>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="d-flex flex-column">
              <small>Threshold (£)</small>
              <input
                type="number"
                step="0.01"
                value={form.threshold_amount}
                onChange={(e) => setForm((f) => ({ ...f, threshold_amount: e.target.value }))}
                style={{ width: 130 }}
              />
            </label>
            <label className="d-flex flex-column flex-grow-1" style={{ minWidth: 240 }}>
              <small>Celebration message</small>
              <input
                value={form.celebration_message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, celebration_message: e.target.value }))
                }
              />
            </label>
            <button className="btn btn-bloodmoon" disabled={busy} onClick={create}>
              Add milestone
            </button>
          </div>

          <p className="text-white-50 small mt-3 mb-1">
            Edits stage locally on each row — hit <strong>Save</strong> to
            commit or <strong>Reset</strong> to discard. Audio URL is
            optional fanfare audio that plays alongside the celebration
            banner when the milestone is reached.
          </p>
          <MilestonesTable rows={milestones ?? []} />
        </>
      )}
    </section>
  );
}

function MilestonesTable({ rows }: { rows: Milestone[] }) {
  const ctrl = useTableControls(rows, MILESTONE_COLUMNS, 'control:milestones-v2');
  return (
    <div>
      <ctrl.FilterInput placeholder="Filter milestones…" />
      <div style={{ overflowX: 'auto' }}>
        {/* No minWidth on the table — the column widths above are
          * sized to fit a ~1280px viewport without horizontal scroll,
          * and `tableLayout: fixed` keeps the column widths honoured
          * so a long Audio URL doesn't stretch the row. Bumping the
          * storage key (v1 → v2) drops any prior persisted widths
          * that were set against the old 480px-actions layout. */}
        <table className="control-table" style={{ width: '100%', tableLayout: 'fixed' }}>
          <colgroup>
            {MILESTONE_COLUMNS.map((c) => <col key={c.id} style={ctrl.colStyle(c.id)} />)}
          </colgroup>
          <thead>
            <tr>
              {MILESTONE_COLUMNS.map((c) => (
                <th key={c.id} {...ctrl.headerProps(c.id)}>
                  {c.header}
                  {ctrl.sortIndicator(c.id)}
                  {ctrl.resizeHandle(c.id)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ctrl.rows.length === 0 && (
              <tr><td colSpan={MILESTONE_COLUMNS.length} className="text-white-50">No milestones match.</td></tr>
            )}
            {ctrl.rows.map((m) => (
              <MilestoneRow key={m.id} milestone={m} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface MilestoneDraft {
  name: string;
  threshold_amount: string;
  celebration_message: string;
  audio_url: string;
  tag_color_from: string;
  tag_color_to: string;
  heading_color: string;
  sub_color: string;
  flash_color: string;
  order: string;
}

/** Five-swatch colour cluster rendered inside each milestone row.
 *  Each slot pairs a native `<input type="color">` with a small clear-X
 *  button so the operator can blank a slot back to "use theme default"
 *  without typing an empty string by hand. The colour input only
 *  accepts hex; blank fields render with a transparent-looking
 *  checker so it's obvious nothing is set. */
function MilestoneColourCluster({
  busy,
  draft,
  onChange,
}: {
  busy: boolean;
  draft: MilestoneDraft;
  onChange: <K extends keyof MilestoneDraft>(key: K, value: MilestoneDraft[K]) => void;
}) {
  const slots: Array<{ key: keyof MilestoneDraft; title: string; label: string }> = [
    { key: 'tag_color_from', title: 'Tag pill — top stop',    label: 'Tag from' },
    { key: 'tag_color_to',   title: 'Tag pill — bottom stop', label: 'Tag to' },
    { key: 'heading_color',  title: 'Headline colour',         label: 'Head' },
    { key: 'sub_color',      title: 'Subhead colour',          label: 'Sub' },
    { key: 'flash_color',    title: 'Flash overlay colour',    label: 'Flash' },
  ];
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, auto)',
        columnGap: '0.18rem',
        rowGap: '0.18rem',
        alignItems: 'center',
        // The set-state X button overlays the swatch corner so the
        // cluster keeps its 5-swatch row even on narrow columns
        // rather than wrapping to a second line.
      }}
    >
      {slots.map(({ key, title, label }) => {
        const value = String(draft[key] ?? '');
        const set = value.length > 0;
        return (
          <div
            key={key}
            title={title}
            style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}
          >
            <input
              type="color"
              disabled={busy}
              // Default the picker to a safe value so it opens on something
              // rather than the browser-default black when the field is
              // empty. Changing the picker always WRITES a real value.
              value={set ? value : '#ffd23a'}
              onChange={(e) => onChange(key, e.target.value as MilestoneDraft[typeof key])}
              style={{
                width: 26,
                height: 22,
                padding: 0,
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 3,
                cursor: 'pointer',
                // Faded when unset so the operator can scan a row and
                // see at a glance which slots have colour customised.
                opacity: set ? 1 : 0.4,
              }}
              aria-label={title}
            />
            {set && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onChange(key, '' as MilestoneDraft[typeof key])}
                title={`Clear ${label}`}
                aria-label={`Clear ${label}`}
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 12,
                  height: 12,
                  padding: 0,
                  border: '1px solid rgba(0,0,0,0.55)',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.78)',
                  color: '#fff',
                  cursor: 'pointer',
                  lineHeight: 1,
                  fontSize: '0.65rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function milestoneDraft(m: Milestone): MilestoneDraft {
  return {
    name: m.name,
    threshold_amount: m.threshold_amount,
    celebration_message: m.celebration_message,
    audio_url: m.audio_url,
    tag_color_from: m.tag_color_from,
    tag_color_to: m.tag_color_to,
    heading_color: m.heading_color,
    sub_color: m.sub_color,
    flash_color: m.flash_color,
    order: String(m.order),
  };
}

function MilestoneRow({ milestone }: { milestone: Milestone }) {
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<MilestoneDraft>(() => milestoneDraft(milestone));
  const [dirty, setDirty] = useState(false);

  // Re-seed from the canonical milestone on every poll, but only
  // when the row is CLEAN. If the operator has staged unsaved edits,
  // leave the drafts alone so a background poll doesn't wipe them.
  useEffect(() => {
    if (dirty) return;
    setDraft(milestoneDraft(milestone));
  }, [milestone, dirty]);

  const patch = <K extends keyof MilestoneDraft>(key: K, value: MilestoneDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  const canSave =
    dirty &&
    !busy &&
    draft.name.trim() !== '' &&
    draft.threshold_amount.trim() !== '';

  const save = async () => {
    setBusy(true);
    try {
      const orderN = Number(draft.order);
      await obsApi.updateMilestone(milestone.id, {
        name: draft.name.trim(),
        threshold_amount: draft.threshold_amount.trim(),
        celebration_message: draft.celebration_message,
        audio_url: draft.audio_url.trim(),
        tag_color_from: draft.tag_color_from.trim(),
        tag_color_to: draft.tag_color_to.trim(),
        heading_color: draft.heading_color.trim(),
        sub_color: draft.sub_color.trim(),
        flash_color: draft.flash_color.trim(),
        order: Number.isFinite(orderN) ? Math.max(0, Math.round(orderN)) : milestone.order,
      });
      setDirty(false);
    } finally {
      setBusy(false);
    }
  };

  const resetDraft = () => {
    setDraft(milestoneDraft(milestone));
    setDirty(false);
  };

  const mark = async () => {
    setBusy(true);
    try { await obsApi.markMilestoneReached(milestone.id); } finally { setBusy(false); }
  };
  const resetReached = async () => {
    if (
      !confirm(
        `Reset "${milestone.name}" back to pending?\n\n` +
          'Clears the reached timestamp so the celebration banner will ' +
          'fire again the next time the running donation total crosses ' +
          `£${milestone.threshold_amount}.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await obsApi.resetMilestone(milestone.id);
    } catch (e) {
      alert(`Reset failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!confirm(`Delete milestone "${milestone.name}"?`)) return;
    setBusy(true);
    try { await obsApi.deleteMilestone(milestone.id); } finally { setBusy(false); }
  };

  // Subtle gold tint on dirty rows so it's obvious which rows have
  // pending edits awaiting Save.
  const rowStyle = dirty ? { background: 'rgba(255, 210, 58, 0.06)' } : undefined;

  return (
    <tr style={rowStyle}>
      <td>
        <input
          type="text"
          disabled={busy}
          value={draft.name}
          onChange={(e) => patch('name', e.target.value)}
          placeholder="Name"
          style={{ width: '100%' }}
        />
      </td>
      <td>
        <input
          type="number"
          disabled={busy}
          step="0.01"
          min="0"
          value={draft.threshold_amount}
          onChange={(e) => patch('threshold_amount', e.target.value)}
          style={{ width: '100%' }}
        />
      </td>
      <td>
        <input
          type="text"
          disabled={busy}
          value={draft.celebration_message}
          onChange={(e) => patch('celebration_message', e.target.value)}
          placeholder="Halfway to the moon!"
          style={{ width: '100%' }}
        />
      </td>
      <td>
        <input
          type="text"
          disabled={busy}
          value={draft.audio_url}
          onChange={(e) => patch('audio_url', e.target.value)}
          placeholder="https://… (optional)"
          style={{ width: '100%' }}
        />
      </td>
      <td>
        {/* Per-milestone celebration colour overrides — five tiny
          * swatch pickers laid out in a single row. Each is a native
          * <input type="color"> with a clear-X next to it so the
          * operator can unset a slot to fall back to the theme
          * default. Order matches the CelebrationBanner cascade:
          * tag-from, tag-to (pair makes a gradient), heading, sub,
          * flash. */}
        <MilestoneColourCluster
          busy={busy}
          draft={draft}
          onChange={patch}
        />
      </td>
      <td>
        <input
          type="number"
          disabled={busy}
          step="1"
          min="0"
          value={draft.order}
          onChange={(e) => patch('order', e.target.value)}
          style={{ width: '100%' }}
        />
      </td>
      <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {milestone.is_reached
          ? <span className="text-success" title={`Reached ${fmtTime(milestone.reached_at!)}`}>
              ✓ Reached
            </span>
          : <span>pending</span>}
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        {/* Action cluster compressed to icon-only buttons with title
          * tooltips. "Mark reached" and "Re-arm" toggle each other
          * based on `is_reached` so only one shows per row, halving
          * the column width without losing functionality. */}
        <div style={{ display: 'inline-flex', gap: '0.2rem', flexWrap: 'nowrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-sm btn-bloodmoon trigger-icon-btn"
            disabled={!canSave}
            onClick={save}
            title={dirty ? 'Save pending edits' : 'No changes'}
            aria-label="Save"
          >
            ✓
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-light trigger-icon-btn"
            disabled={!dirty || busy}
            onClick={resetDraft}
            title="Discard pending edits"
            aria-label="Reset edits"
          >
            ↺
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-light trigger-icon-btn"
            disabled={busy || !draft.audio_url.trim()}
            onClick={() => {
              try {
                const audio = new Audio(draft.audio_url.trim());
                audio.volume = 0.85;
                audio.play().catch(() => {});
              } catch { /* ignore */ }
            }}
            title={draft.audio_url ? 'Play the fanfare audio locally' : 'Set an Audio URL to test'}
            aria-label="Test audio"
          >
            ▶
          </button>
          {milestone.is_reached ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-warning trigger-icon-btn"
              disabled={busy}
              onClick={resetReached}
              title="Reset to pending so the celebration can fire again"
              aria-label="Re-arm milestone"
            >
              ⟲
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-sm btn-outline-light trigger-icon-btn"
              disabled={busy}
              onClick={mark}
              title="Mark this milestone reached now"
              aria-label="Mark reached"
            >
              ★
            </button>
          )}
          <button
            type="button"
            className="btn btn-sm btn-outline-danger trigger-icon-btn"
            disabled={busy}
            title="Delete milestone"
            aria-label="Delete milestone"
            onClick={remove}
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── 5. External events ───────────────────────────────────────────────────

const EXTERNAL_COLUMNS: TableColumn<ExternalEvent>[] = [
  { id: 'source',   header: 'Source',   sortValue: (e) => e.source,                            initialWidth: 110 },
  { id: 'kind',     header: 'Kind',     sortValue: (e) => e.kind,                              initialWidth: 160 },
  { id: 'payload',  header: 'Payload',  filterValue: (e) => JSON.stringify(e.payload) },
  { id: 'occurred', header: 'Occurred', sortValue: (e) => new Date(e.occurred_at).getTime(),   initialWidth: 130 },
  { id: 'actions',  header: '',                                                                initialWidth: 120 },
];

function ExternalEventsSection() {
  const { data: events } = usePolledQuery(
    () => obsApi.externalEvents({ unconsumed: true }),
    5000,
  );
  return (
    <section className="control-card">
      <h2>External events</h2>
      <p className="text-white-50">
        Unconsumed inbound events from Twitch / Discord webhooks. The
        omnibar polls these and marks them consumed once shown.
      </p>
      <ExternalEventsTable rows={events ?? []} />
    </section>
  );
}

function ExternalEventsTable({ rows }: { rows: ExternalEvent[] }) {
  const ctrl = useTableControls(rows, EXTERNAL_COLUMNS, 'control:external-events-v1');
  return (
    <div className="mt-3">
      <ctrl.FilterInput placeholder="Filter events…" />
      <div style={{ overflowX: 'auto' }}>
        <table className="control-table" style={{ minWidth: 820, tableLayout: 'fixed' }}>
          <colgroup>
            {EXTERNAL_COLUMNS.map((c) => <col key={c.id} style={ctrl.colStyle(c.id)} />)}
          </colgroup>
          <thead>
            <tr>
              {EXTERNAL_COLUMNS.map((c) => (
                <th key={c.id} {...ctrl.headerProps(c.id)}>
                  {c.header}
                  {ctrl.sortIndicator(c.id)}
                  {ctrl.resizeHandle(c.id)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ctrl.rows.length === 0 && (
              <tr><td colSpan={EXTERNAL_COLUMNS.length} className="text-white-50">No pending external events.</td></tr>
            )}
            {ctrl.rows.map((e) => (
              <ExternalEventRow key={e.id} ev={e} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExternalEventRow({ ev }: { ev: ExternalEvent }) {
  const [busy, setBusy] = useState(false);
  const consume = async () => {
    setBusy(true);
    try { await obsApi.consumeExternalEvent(ev.id); } finally { setBusy(false); }
  };
  return (
    <tr>
      <td><code>{ev.source}</code></td>
      <td><code>{ev.kind}</code></td>
      <td className="text-white-50" style={{ fontSize: '0.85em' }}>
        {JSON.stringify(ev.payload)}
      </td>
      <td className="text-white-50" style={{ fontSize: '0.85em' }}>{fmtTime(ev.occurred_at)}</td>
      <td>
        <button className="btn btn-sm btn-outline-light" disabled={busy} onClick={consume}>
          Mark consumed
        </button>
      </td>
    </tr>
  );
}

// ── Utilities ────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function fmtTimeRange(startIso: string, endIso: string): string {
  return `${fmtTime(startIso)} → ${fmtTime(endIso)}`;
}

// Silence "useEffect unused" if it ever gets imported but not needed.
void useEffect;
