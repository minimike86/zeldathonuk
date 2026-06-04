import { useEffect, useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { ShoutoutConfig, ShoutoutRequest } from '@/lib/obsApi';

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-secondary',
  sent: 'bg-success',
  skipped: 'bg-dark',
  canceled: 'bg-dark',
  failed: 'bg-danger',
};

export function ShoutoutsPanel() {
  const { data: config } = usePolledQuery(obsApi.shoutoutConfig, 10_000);
  const [nonce, setNonce] = useState(0);
  const refetch = () => setNonce((n) => n + 1);
  const { data: requests } = usePolledQuery(
    () => obsApi.shoutoutRequests(),
    4000,
    [nonce],
  );
  const [err, setErr] = useState<string | null>(null);

  const pending = (requests ?? []).filter((r) => r.status === 'pending');
  const recent = (requests ?? []).filter((r) => r.status !== 'pending').slice(0, 20);

  return (
    <div>
      <header className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
        <h5 className="m-0">Shoutouts</h5>
        <span className="text-white-50 small">
          Drained by the <code>process_shoutouts</code> job, ~1 every 2 min
          (Twitch limit)
        </span>
      </header>

      {err && <p className="text-danger mt-2">{err}</p>}

      {config && <ConfigForm config={config} onError={setErr} />}

      <ManualShoutout
        onAdded={() => {
          setErr(null);
          refetch();
        }}
        onError={setErr}
      />

      <section className="mt-4">
        <h5>Queue ({pending.length})</h5>
        {pending.length === 0 ? (
          <p className="text-white-50 small">Nothing queued.</p>
        ) : (
          <ul className="list-unstyled m-0">
            {pending.map((r) => (
              <ShoutoutRow key={r.id} req={r} onChanged={refetch} onError={setErr} />
            ))}
          </ul>
        )}
      </section>

      {recent.length > 0 && (
        <section className="mt-4">
          <h5 className="text-white-50">Recent</h5>
          <ul className="list-unstyled m-0">
            {recent.map((r) => (
              <ShoutoutRow key={r.id} req={r} onChanged={refetch} onError={setErr} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ConfigForm({
  config,
  onError,
}: {
  config: ShoutoutConfig;
  onError: (m: string | null) => void;
}) {
  const [c, setC] = useState(config);
  useEffect(() => setC(config), [config]);

  const patch = async (p: Partial<ShoutoutConfig>) => {
    onError(null);
    setC((prev) => ({ ...prev, ...p }));
    try {
      await obsApi.updateShoutoutConfig(p);
    } catch (e) {
      onError((e as Error).message);
      setC(config); // revert
    }
  };

  return (
    <div
      className="mt-3 p-3"
      style={{
        background: 'rgba(0,0,0,0.25)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
      }}
    >
      <div className="d-flex gap-3 flex-wrap align-items-center">
        <Toggle id="so-enabled" label="Auto shoutouts" checked={c.enabled}
          onChange={(v) => patch({ enabled: v })} />
        <Toggle id="so-don" label="Donors" checked={c.shout_donations}
          onChange={(v) => patch({ shout_donations: v })} />
        <Toggle id="so-raid" label="Raiders" checked={c.shout_raids}
          onChange={(v) => patch({ shout_raids: v })} />
        <Toggle id="so-live" label="Only when live" checked={c.only_when_live}
          onChange={(v) => patch({ only_when_live: v })} />
        <div>
          <label className="d-block small text-white-50">Min donation</label>
          <input
            type="number"
            step="0.01"
            className="form-control form-control-sm"
            style={{ width: 110 }}
            value={c.min_donation_amount}
            onChange={(e) => setC({ ...c, min_donation_amount: e.target.value })}
            onBlur={(e) => patch({ min_donation_amount: e.target.value })}
          />
        </div>
      </div>
      <p className="small text-white-50 m-0 mt-2">
        Cooldowns: {c.global_cooldown_seconds}s between any two,{' '}
        {Math.round(c.target_cooldown_seconds / 60)} min per channel; queue drops
        entries older than {c.max_age_minutes} min.
      </p>
    </div>
  );
}

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="form-check form-switch m-0">
      <input
        className="form-check-input"
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label className="form-check-label small" htmlFor={id}>
        {label}
      </label>
    </div>
  );
}

function ManualShoutout({
  onAdded,
  onError,
}: {
  onAdded: () => void;
  onError: (m: string | null) => void;
}) {
  const [login, setLogin] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = login.trim().toLowerCase();
    if (!target) return;
    setBusy(true);
    try {
      await obsApi.createShoutout({ target_login: target, note: 'manual' });
      setLogin('');
      onAdded();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="d-flex gap-2 align-items-end mt-3 flex-wrap">
      <div>
        <label className="d-block small text-white-50">Manual shoutout</label>
        <div className="input-group input-group-sm">
          <span className="input-group-text">twitch.tv/</span>
          <input
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="form-control form-control-sm"
            placeholder="channel"
            style={{ width: 180 }}
          />
        </div>
      </div>
      <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy || !login.trim()}>
        {busy ? 'Queuing…' : 'Queue shoutout'}
      </button>
    </form>
  );
}

function ShoutoutRow({
  req,
  onChanged,
  onError,
}: {
  req: ShoutoutRequest;
  onChanged: () => void;
  onError: (m: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const cancel = async () => {
    setBusy(true);
    onError(null);
    try {
      await obsApi.cancelShoutout(req.id);
      onChanged();
    } catch (e) {
      onError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li
      className="d-flex align-items-center gap-2 flex-wrap py-2 px-2"
      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <code className="text-warning">twitch.tv/{req.target_login}</code>
      <span className={`badge ${STATUS_BADGE[req.status] ?? 'bg-secondary'}`}>
        {req.status_display}
      </span>
      <span className="badge bg-dark">{req.reason_display}</span>
      {req.note && <span className="small text-white-50">{req.note}</span>}
      {req.detail && <span className="small text-danger">{req.detail}</span>}
      {req.status === 'pending' && (
        <button
          type="button"
          className="btn btn-sm btn-outline-danger ms-auto"
          disabled={busy}
          onClick={cancel}
        >
          Cancel
        </button>
      )}
    </li>
  );
}
