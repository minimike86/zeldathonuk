import { useMemo, useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { TwitchPrediction } from '@/lib/obsApi';

// Quick-start presets for the gameplay bets the operator runs most. Each fills
// the title + outcomes; the operator can still tweak before opening.
const PRESETS: { label: string; title: string; outcomes: string[] }[] = [
  { label: 'Beat boss first try?', title: 'Beat the boss first try?', outcomes: ['Yes', 'No'] },
  { label: 'Deaths this dungeon', title: 'How many deaths this dungeon?', outcomes: ['0–2', '3–5', '6+'] },
  { label: 'Clear under estimate?', title: 'Clear under the estimate?', outcomes: ['Yes', 'No'] },
];

const WINDOWS = [60, 120, 180, 300, 600];

const OPEN_STATUSES = ['ACTIVE', 'LOCKED'];

export function PredictionsPanel() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000);
  // Bump to force an immediate re-fetch after create/resolve/cancel rather than
  // waiting for the next poll tick.
  const [nonce, setNonce] = useState(0);
  const refetch = () => setNonce((n) => n + 1);
  const { data: predictions } = usePolledQuery(
    () => (event ? obsApi.twitchPredictions(event.id) : Promise.resolve([])),
    5000,
    [event?.id, nonce],
  );
  const [err, setErr] = useState<string | null>(null);

  const open = useMemo(
    () => (predictions ?? []).filter((p) => OPEN_STATUSES.includes(p.status)),
    [predictions],
  );
  const past = useMemo(
    () => (predictions ?? []).filter((p) => !OPEN_STATUSES.includes(p.status)),
    [predictions],
  );

  return (
    <div>
      <header className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
        <h5 className="m-0">Predictions</h5>
        {event && (
          <span className="text-white-50 small">
            Opens on{' '}
            <code>{event.primary_twitch_channel || '(no primary channel)'}</code>
          </span>
        )}
      </header>

      {!event && (
        <p className="text-warning mt-3">No active event — activate one first.</p>
      )}
      {err && <p className="text-danger mt-2">{err}</p>}

      {event && (
        <CreatePredictionForm
          onCreated={() => {
            setErr(null);
            refetch();
          }}
          onError={setErr}
        />
      )}

      {open.length > 0 && (
        <section className="mt-4">
          <h5>Open</h5>
          {open.map((p) => (
            <PredictionCard key={p.id} prediction={p} onChanged={refetch} onError={setErr} />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section className="mt-4">
          <h5 className="text-white-50">Recent</h5>
          {past.map((p) => (
            <PredictionCard key={p.id} prediction={p} onChanged={refetch} onError={setErr} />
          ))}
        </section>
      )}

      {predictions && predictions.length === 0 && (
        <p className="text-white-50 mt-4">No predictions yet.</p>
      )}
    </div>
  );
}

function CreatePredictionForm({
  onCreated,
  onError,
}: {
  onCreated: () => void;
  onError: (msg: string | null) => void;
}) {
  const [title, setTitle] = useState('');
  const [outcomes, setOutcomes] = useState<string[]>(['Yes', 'No']);
  const [windowSeconds, setWindowSeconds] = useState(120);
  const [busy, setBusy] = useState(false);

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setTitle(p.title);
    setOutcomes(p.outcomes);
  };

  const setOutcome = (i: number, v: string) =>
    setOutcomes((prev) => prev.map((o, idx) => (idx === i ? v : o)));
  const addOutcome = () =>
    setOutcomes((prev) => (prev.length >= 10 ? prev : [...prev, '']));
  const removeOutcome = (i: number) =>
    setOutcomes((prev) => (prev.length <= 2 ? prev : prev.filter((_, idx) => idx !== i)));

  const valid =
    title.trim().length > 0 &&
    outcomes.filter((o) => o.trim()).length >= 2;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onError(null);
    setBusy(true);
    try {
      await obsApi.createTwitchPrediction({
        title: title.trim(),
        outcomes: outcomes.map((o) => o.trim()).filter(Boolean),
        window_seconds: windowSeconds,
      });
      setTitle('');
      setOutcomes(['Yes', 'No']);
      onCreated();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mt-3 p-3"
      style={{
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
      }}
    >
      <div className="d-flex gap-2 flex-wrap mb-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className="btn btn-sm btn-outline-light"
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <label className="d-block small text-white-50">Title (≤45 chars)</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="form-control form-control-sm mb-2"
        maxLength={45}
        placeholder="Will they beat the boss first try?"
      />

      <label className="d-block small text-white-50">Outcomes (2–10, ≤25 chars each)</label>
      {outcomes.map((o, i) => (
        <div key={i} className="input-group input-group-sm mb-1">
          <input
            value={o}
            onChange={(e) => setOutcome(i, e.target.value)}
            className="form-control form-control-sm"
            maxLength={25}
            placeholder={`Outcome ${i + 1}`}
          />
          {outcomes.length > 2 && (
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => removeOutcome(i)}
            >
              ✕
            </button>
          )}
        </div>
      ))}
      {outcomes.length < 10 && (
        <button
          type="button"
          className="btn btn-sm btn-outline-light mb-2"
          onClick={addOutcome}
        >
          + Outcome
        </button>
      )}

      <div className="d-flex gap-2 align-items-end mt-2 flex-wrap">
        <div>
          <label className="d-block small text-white-50">Window</label>
          <select
            className="form-select form-select-sm"
            value={windowSeconds}
            onChange={(e) => setWindowSeconds(Number(e.target.value))}
            style={{ width: 120 }}
          >
            {WINDOWS.map((w) => (
              <option key={w} value={w}>
                {w < 60 ? `${w}s` : `${w / 60} min`}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="btn btn-bloodmoon btn-sm"
          disabled={busy || !valid}
        >
          {busy ? 'Opening…' : 'Open prediction'}
        </button>
      </div>
    </form>
  );
}

function PredictionCard({
  prediction,
  onChanged,
  onError,
}: {
  prediction: TwitchPrediction;
  onChanged: () => void;
  onError: (msg: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const isOpen = OPEN_STATUSES.includes(prediction.status);

  const act = async (fn: () => Promise<unknown>) => {
    onError(null);
    setBusy(true);
    try {
      await fn();
      onChanged();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="p-3 mb-2"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
      }}
    >
      <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
        <strong>{prediction.title}</strong>
        <span className="badge bg-secondary">{prediction.status}</span>
      </div>
      <div className="d-flex flex-column gap-1">
        {prediction.outcomes.map((o) => {
          const won = prediction.winning_outcome_id === o.id;
          return (
            <div key={o.id} className="d-flex align-items-center gap-2 flex-wrap">
              <span style={{ minWidth: 140 }}>
                {won && '🏆 '}
                {o.title}
              </span>
              {typeof o.channel_points === 'number' && (
                <span className="small text-white-50">
                  {o.channel_points.toLocaleString()} pts · {o.users ?? 0} users
                </span>
              )}
              {isOpen && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success ms-auto"
                  disabled={busy}
                  onClick={() => act(() => obsApi.resolveTwitchPrediction(prediction.id, o.id))}
                >
                  Resolve as winner
                </button>
              )}
            </div>
          );
        })}
      </div>
      {isOpen && (
        <div className="control-btn-row mt-2">
          {prediction.status === 'ACTIVE' && (
            <button
              type="button"
              className="btn btn-sm btn-outline-warning"
              disabled={busy}
              onClick={() => act(() => obsApi.lockTwitchPrediction(prediction.id))}
            >
              Lock
            </button>
          )}
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            disabled={busy}
            onClick={() => act(() => obsApi.cancelTwitchPrediction(prediction.id))}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
