import { Fragment, useState } from 'react';
import { usePolledQuery, obsApi } from '@/lib/obsApi';
import type {
  ActivityLogEntry,
  ActivityCategory,
  ActivityLevel,
  QueueItem,
  QueueAction,
} from '@/lib/obsApi';
import { useTableControls } from './useTableControls';
import type { TableColumn } from './useTableControls';

const CATEGORIES: { value: ActivityCategory | ''; label: string }[] = [
  { value: '', label: 'All categories' },
  { value: 'operator-action', label: 'Operator actions' },
  { value: 'event-trigger', label: 'Event triggers' },
  { value: 'sound-trigger', label: 'Sound triggers' },
  { value: 'webhook', label: 'Webhooks' },
  { value: 'external-event', label: 'External events' },
  { value: 'system', label: 'System' },
];

const LEVELS: { value: ActivityLevel | ''; label: string }[] = [
  { value: '', label: 'All levels' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
];

function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function relativeEta(iso: string | null): string {
  if (!iso) return '—';
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return iso;
  const s = Math.round(ms / 1000);
  if (s <= 0) return 'due';
  if (s < 60) return `in ${s}s`;
  if (s < 3600) return `in ${Math.round(s / 60)}m`;
  return `in ${Math.round(s / 3600)}h`;
}

export function LogsQueueControl() {
  const [tab, setTab] = useState<'queue' | 'log'>('queue');

  return (
    <div className="control-card">
      <h2>Logs &amp; Queue</h2>
      <p className="text-white-50">
        Live view of the event queue and a full audit trail of everything the app
        does — operator actions, event &amp; sound triggers, webhook intake, and errors.
      </p>
      <div className="d-flex gap-2 mb-3">
        <button
          type="button"
          className={`btn btn-sm ${tab === 'queue' ? 'btn-bloodmoon' : 'btn-outline-secondary'}`}
          onClick={() => setTab('queue')}
        >
          Queue
        </button>
        <button
          type="button"
          className={`btn btn-sm ${tab === 'log' ? 'btn-bloodmoon' : 'btn-outline-secondary'}`}
          onClick={() => setTab('log')}
        >
          Audit log
        </button>
      </div>
      {tab === 'queue' ? <QueuePanel /> : <AuditLogPanel />}
    </div>
  );
}

// ── Queue ────────────────────────────────────────────────────────────────
function QueuePanel() {
  // `bump` lets a management action force an immediate refetch instead of
  // waiting out the 2s poll interval.
  const [bump, setBump] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const { data: snap } = usePolledQuery(() => obsApi.queue(), 2000, [bump]);

  const runAction = async (action: QueueAction) => {
    setErr(null);
    try {
      await obsApi.runQueueAction(action);
      setBump((n) => n + 1);
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  if (!snap) return <p className="text-white-50">Loading queue…</p>;

  return (
    <>
      {err && <div className="alert alert-danger py-2">{err}</div>}
      <div className="control-queue-lanes">
        <QueueLane
          title="Awaiting"
          subtitle="Queued, not yet processed"
          items={snap.awaiting}
          tone="awaiting"
          onAction={runAction}
        />
        <QueueLane
          title="Processing"
          subtitle="Live on the bar right now"
          items={snap.processing}
          tone="processing"
          onAction={runAction}
        />
        <QueueLane
          title="Failed"
          subtitle="Errors in the last 30 min"
          items={snap.failed}
          tone="failed"
          onAction={runAction}
        />
      </div>
    </>
  );
}

function QueueLane({
  title,
  subtitle,
  items,
  tone,
  onAction,
}: {
  title: string;
  subtitle: string;
  items: QueueItem[];
  tone: 'awaiting' | 'processing' | 'failed';
  onAction: (a: QueueAction) => void;
}) {
  return (
    <section className={`control-queue-lane control-queue-lane-${tone}`}>
      <header className="control-queue-lane-head">
        <span className="control-queue-lane-title">{title}</span>
        <span className={`control-queue-count control-queue-count-${tone}`}>{items.length}</span>
      </header>
      <p className="control-queue-lane-sub text-white-50">{subtitle}</p>
      {items.length === 0 ? (
        <p className="text-white-50 fst-italic m-0">Nothing here.</p>
      ) : (
        <ul className="control-queue-list">
          {items.map((item) => (
            <li key={item.id} className="control-queue-item">
              <div className="control-queue-item-top">
                <div className="control-queue-item-main">
                  <span className="control-queue-item-label">{item.label}</span>
                  <span className="control-queue-item-meta">
                    <code>{item.kind}</code>
                    {item.eta && tone === 'awaiting' && (
                      <span className="control-queue-eta"> · {relativeEta(item.eta)}</span>
                    )}
                    {item.occurred_at && (
                      <span> · {fmtTime(item.occurred_at)}</span>
                    )}
                  </span>
                </div>
                {item.actions.length > 0 && (
                  <div className="control-queue-item-actions">
                    {item.actions.map((a) => (
                      <button
                        key={a.endpoint}
                        type="button"
                        className="btn btn-outline-light btn-sm"
                        onClick={() => onAction(a)}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {item.hint && <p className="control-queue-item-hint">{item.hint}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Audit log ──────────────────────────────────────────────────────────────
const LOG_COLUMNS: TableColumn<ActivityLogEntry>[] = [
  { id: 'time', header: 'Time', sortValue: (r) => r.created_at, initialWidth: 100 },
  { id: 'category', header: 'Category', sortValue: (r) => r.category, initialWidth: 130 },
  { id: 'level', header: 'Level', sortValue: (r) => r.level, initialWidth: 80 },
  { id: 'source', header: 'Source', sortValue: (r) => r.source, initialWidth: 110 },
  { id: 'summary', header: 'Summary', sortValue: (r) => r.summary, initialWidth: 420 },
  { id: 'target', header: 'Target', sortValue: (r) => `${r.target_type} ${r.target_id}`, initialWidth: 150 },
];

function AuditLogPanel() {
  const [category, setCategory] = useState<ActivityCategory | ''>('');
  const [level, setLevel] = useState<ActivityLevel | ''>('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: logs } = usePolledQuery(
    () => obsApi.activityLog({ category, level, search, limit: 300 }),
    3000,
    [category, level, search],
  );

  const { rows, headerProps, sortIndicator, resizeHandle, colStyle } = useTableControls(
    logs ?? [],
    LOG_COLUMNS,
    'control:logs-queue:audit',
  );

  return (
    <>
      <div className="d-flex flex-wrap gap-2 mb-3">
        <select
          className="form-select form-select-sm"
          style={{ maxWidth: 200 }}
          value={category}
          onChange={(e) => setCategory(e.target.value as ActivityCategory | '')}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          className="form-select form-select-sm"
          style={{ maxWidth: 160 }}
          value={level}
          onChange={(e) => setLevel(e.target.value as ActivityLevel | '')}
        >
          {LEVELS.map((l) => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
        <input
          type="search"
          className="form-control form-control-sm"
          style={{ maxWidth: 280 }}
          placeholder="Search summary / action…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {!logs ? (
        <p className="text-white-50">Loading audit log…</p>
      ) : rows.length === 0 ? (
        <p className="text-white-50 fst-italic">No matching entries.</p>
      ) : (
        <div className="control-table-scroll">
          <table className="control-table">
            <colgroup>
              {LOG_COLUMNS.map((c) => (
                <col key={c.id} style={colStyle(c.id)} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {LOG_COLUMNS.map((c) => (
                  <th key={c.id} {...headerProps(c.id)}>
                    {c.header}
                    {sortIndicator(c.id)}
                    {resizeHandle(c.id)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Fragment key={row.id}>
                  <tr
                    onClick={() => setExpanded((id) => (id === row.id ? null : row.id))}
                    style={{ cursor: 'pointer' }}
                  >
                    <td title={row.created_at}>{fmtTime(row.created_at)}</td>
                    <td>{row.category}</td>
                    <td>
                      <span className={`control-log-level control-log-level-${row.level}`}>
                        {row.level}
                      </span>
                    </td>
                    <td>{row.source}</td>
                    <td>{row.summary}</td>
                    <td className="text-white-50">
                      {row.target_type ? `${row.target_type} ${row.target_id}` : '—'}
                    </td>
                  </tr>
                  {expanded === row.id && (
                    <tr className="control-log-detail-row">
                      <td colSpan={LOG_COLUMNS.length}>
                        <div className="control-log-detail">
                          {row.request_method && (
                            <div className="text-white-50">
                              {row.request_method} {row.request_path}
                              {row.status_code != null && ` → ${row.status_code}`}
                            </div>
                          )}
                          <pre className="m-0">{JSON.stringify(row.detail, null, 2)}</pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
