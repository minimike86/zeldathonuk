import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
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
} from '@/lib/obsApi';
import { triggerTestSplash } from '@/lib/splashBus';
import {
  ALL_PANEL_IDS,
  DEFAULT_DONATION_REEL,
  DEFAULT_LAYOUT,
  parseLayout,
  readDonationReelConfig,
  REEL_CYCLE_MAX_MS,
  REEL_CYCLE_MIN_MS,
  REEL_LENGTH_MAX,
  REEL_LENGTH_MIN,
  REEL_SWITCH_MAX_MS,
  REEL_SWITCH_MIN_MS,
  type DonationReelConfig,
  type DonationReelDirection,
  type PanelId,
} from '@/routes/obs/omnibar/hooks/useLayoutConfig';
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
export function OmnibarControl() {
  return (
    <div className="control-stack" style={{ display: 'grid', gap: '1.5rem' }}>
      <SandboxSection />
      <LayoutSection />
      <TransitionsSection />
      <DonationReelSection />
      <SplashSection />
      <CharitySlidesSection />
      <OverridesSection />
      <ObjectiveSection />
      <SetpieceSection />
      <PlaythroughEventsSection />
      <IncentivesSection />
      <MilestonesSection />
      <ExternalEventsSection />
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
                placeholder="/assets/img/specialeffect-logo.svg"
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

      <table className="control-table mt-3">
        <thead>
          <tr>
            <th>#</th>
            <th>Kind</th>
            <th>Preview</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr><td colSpan={5} className="text-white-50">
              No slides — using bundled defaults.
            </td></tr>
          )}
          {sorted.map((s, i) => (
            <CharitySlideRow
              key={s.id}
              slide={s}
              first={i === 0}
              last={i === sorted.length - 1}
              prev={sorted[i - 1]}
              next={sorted[i + 1]}
            />
          ))}
        </tbody>
      </table>
    </section>
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
                placeholder="/assets/img/specialeffect-logo.svg"
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

function SetpieceSection() {
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, 2000);
  const entry = cp?.schedule_entry_detail ?? null;
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState('boss');
  const [name, setName] = useState('');

  // Sync local kind/name with entry on entry change.
  const lastEntryRef = useRef<number | null>(null);
  useEffect(() => {
    if (entry && entry.id !== lastEntryRef.current) {
      lastEntryRef.current = entry.id;
      setKind(entry.setpiece_kind || 'boss');
      setName(entry.setpiece_name || '');
    }
  }, [entry]);

  const setStage = async (stage: 'imminent' | 'active') => {
    if (!entry) return;
    setBusy(true);
    try {
      await obsApi.setSetpiece(entry.id, { stage, kind, name: name || undefined });
    } finally {
      setBusy(false);
    }
  };

  const clear = async (resultKind?: string) => {
    if (!entry) return;
    setBusy(true);
    try {
      await obsApi.setSetpiece(entry.id, { stage: 'cleared', result_kind: resultKind });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="control-card">
      <h2>Setpiece</h2>
      {!entry ? (
        <p className="text-warning">No "Currently Playing" entry.</p>
      ) : (
        <>
          <p className="text-white-50">
            Imminent → Active → Cleared flow for boss fights, shrines,
            dungeons. The omnibar's <code>setpiece</code> panel surfaces
            stage + name; clearing fires a PlaythroughEvent
            (<code>boss-defeated</code> etc.) that triggers a celebration
            animation.
          </p>

          <div className="text-white-50 mb-2">
            Current: {entry.setpiece_stage
              ? <><strong>{entry.setpiece_stage}</strong> · <code>{entry.setpiece_kind}</code>{entry.setpiece_name && ` · "${entry.setpiece_name}"`}</>
              : <em>none</em>}
          </div>

          <div className="control-btn-row" style={{ flexWrap: 'wrap' }}>
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
              <small>Name (optional)</small>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ganondorf"
              />
            </label>
            <button
              className="btn btn-bloodmoon"
              disabled={busy || !kind.trim()}
              onClick={() => setStage('imminent')}
            >
              Imminent
            </button>
            <button
              className="btn btn-bloodmoon"
              disabled={busy || !kind.trim()}
              onClick={() => setStage('active')}
            >
              Active
            </button>
          </div>

          <div className="control-btn-row mt-2" style={{ flexWrap: 'wrap' }}>
            <small className="text-white-50 align-self-end">Quick presets:</small>
            {SETPIECE_PRESETS.map((p) => (
              <button
                key={p.kind}
                className="btn btn-sm btn-outline-light"
                disabled={busy}
                onClick={() => {
                  setKind(p.kind);
                  // Immediately stage as imminent so the omnibar shows
                  // the build-up tag without a second click.
                  obsApi.setSetpiece(entry.id, {
                    stage: 'imminent', kind: p.kind, name: name || undefined,
                  });
                }}
              >
                {p.label} → imminent
              </button>
            ))}
            <button
              className="btn btn-sm btn-outline-success"
              disabled={busy || !entry.setpiece_stage}
              onClick={() => clear(
                SETPIECE_PRESETS.find((p) => p.kind === entry.setpiece_kind)?.resultKind,
              )}
            >
              Defeated / Cleared
            </button>
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
          return (
            <label key={id} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', cursor: 'pointer' }}>
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
    <input
      type="number"
      min={min}
      max={max}
      step={20}
      value={transition[field]}
      onChange={(e) => {
        const n = Math.max(min, Math.min(max, Number(e.target.value) || min));
        onChange({ [field]: n });
      }}
      style={{ width: 80 }}
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

      <div className="control-btn-row" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label className="d-flex flex-column">
          <small>Switch direction</small>
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
          <small title="Duration of the switch animation between donors">Switch ms</small>
          <input
            type="number"
            min={REEL_SWITCH_MIN_MS}
            max={REEL_SWITCH_MAX_MS}
            step={20}
            value={draft.switchMs}
            onChange={(e) =>
              update(
                'switchMs',
                clampN(Number(e.target.value), REEL_SWITCH_MIN_MS, REEL_SWITCH_MAX_MS),
              )
            }
            style={{ width: 100 }}
          />
        </label>
        <label className="d-flex flex-column">
          <small title="How often the reel advances to the next donor">Cycle ms</small>
          <input
            type="number"
            min={REEL_CYCLE_MIN_MS}
            max={REEL_CYCLE_MAX_MS}
            step={100}
            value={draft.cycleMs}
            onChange={(e) =>
              update(
                'cycleMs',
                clampN(Number(e.target.value), REEL_CYCLE_MIN_MS, REEL_CYCLE_MAX_MS),
              )
            }
            style={{ width: 110 }}
          />
        </label>
        <label className="d-flex flex-column">
          <small title="How many of the most-recent donors the reel rotates through">Reel length</small>
          <input
            type="number"
            min={REEL_LENGTH_MIN}
            max={REEL_LENGTH_MAX}
            step={1}
            value={draft.reelLength}
            onChange={(e) =>
              update(
                'reelLength',
                clampN(Number(e.target.value), REEL_LENGTH_MIN, REEL_LENGTH_MAX),
              )
            }
            style={{ width: 90 }}
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
        </>
      )}
    </section>
  );
}

// ── 1. Overrides ─────────────────────────────────────────────────────────

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

      <table className="control-table mt-3">
        <thead>
          <tr>
            <th>Kind</th>
            <th>Lane</th>
            <th>Message</th>
            <th>Priority</th>
            <th>Window</th>
            <th>State</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(overrides ?? []).length === 0 && (
            <tr><td colSpan={7} className="text-white-50">No overrides yet.</td></tr>
          )}
          {(overrides ?? []).map((o) => (
            <OverrideRow key={o.id} o={o} />
          ))}
        </tbody>
      </table>
    </section>
  );
}

function OverrideRow({ o }: { o: OmnibarOverride }) {
  const [busy, setBusy] = useState(false);
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
    setBusy(true);
    try { await obsApi.deleteOverride(o.id); } finally { setBusy(false); }
  };
  return (
    <tr>
      <td><code>{o.kind}</code></td>
      <td><code>{o.target_lane}</code></td>
      <td>{String(o.payload?.message ?? '')}</td>
      <td>{o.priority}</td>
      <td className="text-white-50" style={{ fontSize: '0.85em' }}>
        {fmtTimeRange(o.starts_at, o.expires_at)}
      </td>
      <td>
        {o.is_live ? <span className="text-success">LIVE</span> :
          o.is_active ? <span className="text-warning">queued</span> :
            <span className="text-white-50">paused</span>}
      </td>
      <td className="control-btn-row">
        <button className="btn btn-sm btn-outline-light" disabled={busy} onClick={toggle}>
          {o.is_active ? 'Deactivate' : 'Activate'}
        </button>
        <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={remove}>
          Delete
        </button>
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

          <table className="control-table mt-3">
            <thead>
              <tr>
                <th>Kind</th>
                <th>Payload</th>
                <th>Created</th>
                <th>Expires</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(events ?? []).length === 0 && (
                <tr><td colSpan={5} className="text-white-50">No events yet.</td></tr>
              )}
              {(events ?? []).map((e) => (
                <PlaythroughEventRow key={e.id} ev={e} />
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
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

          <table className="control-table mt-3">
            <thead>
              <tr>
                <th>Name</th>
                <th>Progress</th>
                <th>State</th>
                <th>Contribute</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(incentives ?? []).length === 0 && (
                <tr><td colSpan={5} className="text-white-50">No incentives yet.</td></tr>
              )}
              {(incentives ?? []).map((i) => (
                <IncentiveRow key={i.id} incentive={i} />
              ))}
            </tbody>
          </table>
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

function IncentiveRow({ incentive }: { incentive: Incentive }) {
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState('5.00');
  const [flash, setFlash] = useState(false);
  const options = readBidWarOptions(incentive);

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
    setBusy(true);
    try { await obsApi.deleteIncentive(incentive.id); } finally { setBusy(false); }
  };

  const reset = async () => {
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

  return (
    <tr style={flash ? { background: 'rgba(255, 210, 58, 0.18)' } : undefined}>
      <td>
        <div>{incentive.name}</div>
        {incentive.description && (
          <small className="text-white-50">{incentive.description}</small>
        )}
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
        {incentive.is_reached
          ? <span className="text-success">REACHED</span>
          : incentive.is_active
            ? <span>active</span>
            : <span className="text-white-50">paused</span>}
      </td>
      <td>
        <div className="control-btn-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: 90 }}
          />
          {options ? (
            options.map((o) => (
              <button
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
            <button className="btn btn-sm btn-bloodmoon" disabled={busy} onClick={() => contribute()}>
              +£{amount}
            </button>
          )}
        </div>
      </td>
      <td>
        <div className="d-flex gap-1">
          <button
            type="button"
            className="btn btn-sm btn-outline-warning"
            disabled={busy}
            onClick={reset}
            title="Reset progress to £0 (clears reached, zeros bid-war votes)"
          >
            ⟲ Reset
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

  const create = async () => {
    if (!event) return;
    setBusy(true);
    try {
      await obsApi.createMilestone({
        event: event.id,
        name: form.name,
        threshold_amount: form.threshold_amount,
        celebration_message: form.celebration_message,
      });
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

          <table className="control-table mt-3">
            <thead>
              <tr>
                <th>Name</th>
                <th>Threshold</th>
                <th>Message</th>
                <th>State</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(milestones ?? []).length === 0 && (
                <tr><td colSpan={5} className="text-white-50">No milestones yet.</td></tr>
              )}
              {(milestones ?? []).map((m) => (
                <MilestoneRow key={m.id} milestone={m} />
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

function MilestoneRow({ milestone }: { milestone: Milestone }) {
  const [busy, setBusy] = useState(false);
  const mark = async () => {
    setBusy(true);
    try { await obsApi.markMilestoneReached(milestone.id); } finally { setBusy(false); }
  };
  const reset = async () => {
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
    setBusy(true);
    try { await obsApi.deleteMilestone(milestone.id); } finally { setBusy(false); }
  };
  return (
    <tr>
      <td>{milestone.name}</td>
      <td>£{milestone.threshold_amount}</td>
      <td className="text-white-50">{milestone.celebration_message || '—'}</td>
      <td>
        {milestone.is_reached
          ? <span className="text-success">REACHED · {fmtTime(milestone.reached_at!)}</span>
          : <span>pending</span>}
      </td>
      <td className="control-btn-row">
        <button
          className="btn btn-sm btn-bloodmoon"
          disabled={busy || milestone.is_reached}
          onClick={mark}
        >
          Mark reached
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-warning"
          disabled={busy || !milestone.is_reached}
          onClick={reset}
          title={
            milestone.is_reached
              ? 'Reset to pending so the celebration can fire again'
              : 'Milestone is already pending — nothing to reset'
          }
        >
          ⟲ Reset
        </button>
        <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={remove}>
          Delete
        </button>
      </td>
    </tr>
  );
}

// ── 5. External events ───────────────────────────────────────────────────

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
      <table className="control-table">
        <thead>
          <tr>
            <th>Source</th>
            <th>Kind</th>
            <th>Payload</th>
            <th>Occurred</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {(events ?? []).length === 0 && (
            <tr><td colSpan={5} className="text-white-50">No pending external events.</td></tr>
          )}
          {(events ?? []).map((e) => (
            <ExternalEventRow key={e.id} ev={e} />
          ))}
        </tbody>
      </table>
    </section>
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
