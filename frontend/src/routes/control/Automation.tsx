import { useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { EventSubSubscription, ScheduledJob } from '@/lib/obsApi';

export function AutomationControl() {
  return (
    <div className="control-card">
      <div className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
        <h2 className="m-0">Automation</h2>
        <SchedulerHeartbeat />
      </div>
      <ScheduledJobsSection />
      <JustGivingSection />
      <EventSubSection />
    </div>
  );
}

function SchedulerHeartbeat() {
  const { data } = usePolledQuery(obsApi.schedulerStatus, 5000);
  if (!data) return null;
  const alive = data.alive;
  const ago =
    data.seconds_ago == null
      ? 'never'
      : data.seconds_ago < 90
        ? `${data.seconds_ago}s ago`
        : `${Math.round(data.seconds_ago / 60)}m ago`;
  return (
    <span
      className={`badge d-inline-flex align-items-center gap-1 ${alive ? 'bg-success' : 'bg-danger'}`}
      title={
        alive
          ? 'The scheduler service is ticking.'
          : 'No recent tick — is the scheduler container running?'
      }
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#fff',
          opacity: alive ? 1 : 0.6,
        }}
      />
      Scheduler {alive ? 'live' : 'down'} · tick {ago}
    </span>
  );
}

// ── Scheduled jobs ───────────────────────────────────────────────────

function ScheduledJobsSection() {
  const [nonce, setNonce] = useState(0);
  const { data: jobs } = usePolledQuery(obsApi.scheduledJobs, 5000, [nonce]);
  const [err, setErr] = useState<string | null>(null);

  return (
    <section className="mt-3">
      <h5>Scheduled jobs</h5>
      <p className="small text-white-50">
        A single <code>run_scheduled_jobs</code> cron tick runs each enabled job
        when its interval elapses. Toggle, retime, or run on demand here.
      </p>
      {err && (
        <p className="small mb-1">
          <span className="badge bg-danger">Error</span>{' '}
          <span className="text-white-50">{err}</span>
        </p>
      )}
      {(jobs ?? []).map((job) => (
        <JobRow
          key={job.id}
          job={job}
          onChanged={() => setNonce((n) => n + 1)}
          onError={setErr}
        />
      ))}
    </section>
  );
}

function JobRow({
  job,
  onChanged,
  onError,
}: {
  job: ScheduledJob;
  onChanged: () => void;
  onError: (m: string | null) => void;
}) {
  const [interval, setIntervalSecs] = useState(job.interval_seconds);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

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

  const statusBadge =
    job.last_status === 'ok'
      ? 'bg-success'
      : job.last_status === 'error'
        ? 'bg-danger'
        : job.last_status === 'running'
          ? 'bg-warning text-dark'
          : 'bg-secondary';

  return (
    <div className="automation-tile p-2 mb-2">
      <div className="d-flex align-items-center gap-2 flex-wrap">
        <div className="form-check form-switch m-0">
          <input
            className="form-check-input"
            type="checkbox"
            id={`job-${job.id}`}
            checked={job.enabled}
            disabled={busy}
            onChange={(e) =>
              act(() => obsApi.updateScheduledJob(job.id, { enabled: e.target.checked }))
            }
          />
          <label className="form-check-label" htmlFor={`job-${job.id}`}>
            <strong>{job.label}</strong>
          </label>
        </div>
        {job.last_status && (
          <span className={`badge ${statusBadge}`}>{job.last_status}</span>
        )}
        <span className="small text-white-50">
          {job.last_run_at
            ? `last run ${new Date(job.last_run_at).toLocaleTimeString()}`
            : 'never run'}
        </span>
        <div className="ms-auto d-flex align-items-center gap-2">
          <div className="input-group input-group-sm" style={{ width: 150 }}>
            <span className="input-group-text">every</span>
            <input
              type="number"
              min={5}
              className="form-control"
              value={interval}
              onChange={(e) => setIntervalSecs(Number(e.target.value))}
              onBlur={() =>
                interval !== job.interval_seconds &&
                act(() => obsApi.updateScheduledJob(job.id, { interval_seconds: interval }))
              }
            />
            <span className="input-group-text">s</span>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-bloodmoon"
            disabled={busy}
            onClick={() => act(() => obsApi.runScheduledJob(job.id))}
          >
            Run now
          </button>
          {job.last_output && (
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? 'Hide' : 'Output'}
            </button>
          )}
        </div>
      </div>
      <div className="small text-white-50 mt-1">
        <code>{job.command}</code> — {job.description}
      </div>
      {open && job.last_output && (
        <pre
          className="small mt-2 mb-0 p-2"
          style={{
            background: 'rgba(0,0,0,0.4)',
            borderRadius: 6,
            maxHeight: 200,
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
          }}
        >
          {job.last_output}
        </pre>
      )}
    </div>
  );
}

// ── JustGiving ingestion ─────────────────────────────────────────────

function JustGivingSection() {
  const { data: status } = usePolledQuery(obsApi.justGivingStatus, 10_000);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const fetchNow = async () => {
    setBusy(true);
    setErr(null);
    setResult(null);
    try {
      const res = await obsApi.runJustGivingFetch();
      const per = res.pages
        .map((p) => `${p.short_name}: ${p.ingested}/${p.fetched}`)
        .join(', ');
      setResult(
        `Ingested ${res.total_ingested} donation${res.total_ingested === 1 ? '' : 's'}` +
          (per ? ` (${per})` : ''),
      );
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const pages = status?.pages ?? [];
  const job = status?.poll_job ?? null;
  const lastRun = job?.last_run_at
    ? new Date(job.last_run_at).toLocaleTimeString()
    : 'never';

  return (
    <section className="mt-4">
      <h5>JustGiving ingestion</h5>
      <p className="small text-white-50">
        Polling-only — JustGiving has no real-time webhooks. The{' '}
        <code>poll_donations</code> job above pulls the active event&apos;s
        JustGiving page donations on each tick.
      </p>

      {/* Same panel treatment as a JobRow above so it reads as part of the
          scheduled-jobs family. Status uses solid badges (guaranteed
          contrast on any theme) rather than Bootstrap's low-contrast
          text-success/-danger hues. */}
      <div className="automation-tile p-2 mb-2">
        <div className="d-flex flex-column gap-2">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="small text-white-50">API</span>
            <code>{status?.api_base ?? '…'}</code>
            <span className="badge bg-secondary">{status?.env ?? '…'}</span>
            {status &&
              (status.app_id_present ? (
                <span className="badge bg-success">App ID set</span>
              ) : (
                <span className="badge bg-danger">App ID missing</span>
              ))}
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="small text-white-50">Page(s)</span>
            {pages.length > 0 ? (
              pages.map((p) => (
                <code key={p.short_name}>
                  {p.short_name}
                  {p.is_primary ? ' ★' : ''}
                </code>
              ))
            ) : (
              <>
                <span className="badge bg-warning text-dark">no page linked</span>
                <span className="small text-white-50">
                  add a JustGiving Donation Page (with its page short name) to the
                  active event in <a href="/control/events">Events</a>.
                </span>
              </>
            )}
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="small text-white-50">Poll job</span>
            {job ? (
              <>
                <span className={`badge ${job.enabled ? 'bg-success' : 'bg-secondary'}`}>
                  {job.enabled ? 'enabled' : 'disabled'}
                </span>
                <span className="small text-white-50">
                  last run {lastRun}
                  {job.last_status ? ` (${job.last_status})` : ''}
                </span>
              </>
            ) : (
              <span className="small text-white-50">not configured</span>
            )}
          </div>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 flex-wrap">
        <button
          type="button"
          className="btn btn-sm btn-bloodmoon"
          onClick={() => void fetchNow()}
          disabled={busy || !status?.app_id_present || pages.length === 0}
        >
          {busy ? 'Fetching…' : 'Fetch now'}
        </button>
        {result && (
          <span className="small">
            <span className="badge bg-success">Done</span>{' '}
            <span className="text-white-50">{result}</span>
          </span>
        )}
        {err && (
          <span className="small">
            <span className="badge bg-danger">Error</span>{' '}
            <span className="text-white-50">{err}</span>
          </span>
        )}
      </div>
    </section>
  );
}

// ── Twitch EventSub ──────────────────────────────────────────────────

function EventSubSection() {
  const [nonce, setNonce] = useState(0);
  const { data, error } = usePolledQuery(obsApi.eventsubSubscriptions, 15_000, [nonce]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const sync = async (prune: boolean) => {
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const res = await obsApi.eventsubSync(prune);
      setMsg(res.output.trim().split('\n').slice(-1)[0] || 'Done.');
      setNonce((n) => n + 1);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-4">
      <h5>Twitch EventSub</h5>
      <p className="small text-white-50">
        Push subscriptions (follows, subs, cheers, raids, charity, redemptions).
        Sync registers any missing ones; prune also drops stale/failed.
      </p>
      <div className="d-flex gap-2 align-items-center flex-wrap mb-2">
        <button
          type="button"
          className="btn btn-sm btn-bloodmoon"
          disabled={busy}
          onClick={() => sync(false)}
        >
          {busy ? 'Syncing…' : 'Sync subscriptions'}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-light"
          disabled={busy}
          onClick={() => sync(true)}
        >
          Sync &amp; prune
        </button>
        {data?.counts && (
          <span className="small text-white-50">
            {Object.entries(data.counts)
              .map(([k, v]) => `${v} ${k}`)
              .join(', ')}
          </span>
        )}
      </div>
      {msg && (
        <p className="small mb-1">
          <span className="badge bg-success">Done</span>{' '}
          <span className="text-white-50">{msg}</span>
        </p>
      )}
      {err && (
        <p className="small mb-1">
          <span className="badge bg-danger">Error</span>{' '}
          <span className="text-white-50">{err}</span>
        </p>
      )}
      {error && (
        <p className="small mb-1">
          <span className="badge bg-danger">Error</span>{' '}
          <span className="text-white-50">
            Couldn’t list subscriptions: {error.message}
          </span>
        </p>
      )}

      {data?.subscriptions && data.subscriptions.length > 0 && (
        <table className="control-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Type</th>
              <th>Callback</th>
            </tr>
          </thead>
          <tbody>
            {data.subscriptions.map((s: EventSubSubscription) => (
              <tr key={s.id}>
                <td>
                  <span
                    className={`badge ${s.status === 'enabled' ? 'bg-success' : 'bg-danger'}`}
                  >
                    {s.status}
                  </span>
                </td>
                <td>
                  <code>{s.type}</code>
                </td>
                <td className="small text-white-50 text-truncate" style={{ maxWidth: 320 }}>
                  {s.callback}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
