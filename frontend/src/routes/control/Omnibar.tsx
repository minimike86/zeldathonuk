import { useEffect, useRef, useState } from 'react';
import {
  obsApi,
  usePolledQuery,
  type ExternalEvent,
  type Incentive,
  type Milestone,
  type OmnibarLane,
  type OmnibarOverride,
  type PlaythroughEvent,
} from '@/lib/obsApi';

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
      <OverridesSection />
      <ObjectiveSection />
      <PlaythroughEventsSection />
      <IncentivesSection />
      <MilestonesSection />
      <ExternalEventsSection />
    </div>
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
  const [form, setForm] = useState({ name: '', goal_amount: '50.00', description: '' });

  const create = async () => {
    if (!event || !form.name.trim()) return;
    setBusy(true);
    try {
      await obsApi.createIncentive({
        event: event.id,
        name: form.name.trim(),
        goal_amount: form.goal_amount,
        description: form.description,
      });
      setForm({ name: '', goal_amount: '50.00', description: '' });
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

function IncentiveRow({ incentive }: { incentive: Incentive }) {
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState('5.00');
  const [flash, setFlash] = useState(false);

  const contribute = async () => {
    setBusy(true);
    try {
      const res = await obsApi.contributeToIncentive(incentive.id, amount);
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
        <div className="control-btn-row">
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: 90 }}
          />
          <button className="btn btn-sm btn-bloodmoon" disabled={busy} onClick={contribute}>
            +£{amount}
          </button>
        </div>
      </td>
      <td>
        <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={remove}>
          Delete
        </button>
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
