import { useMemo, useState } from 'react';
import { usePolledQuery } from '@/lib/obsApi';
import type { Runner } from '@/lib/obsApi';
import { api } from '@/lib/api';

type SortKey = 'name' | 'channel_url' | 'is_streamer';
type SortDir = 'asc' | 'desc';

const sortValue = (r: Runner, key: SortKey): string | number => {
  switch (key) {
    case 'is_streamer':
      return r.is_streamer ? 1 : 0;
    case 'name':
    case 'channel_url':
      return r[key].toLowerCase();
  }
};

export function RunnersControl() {
  const { data: runners } = usePolledQuery(() => api<Runner[]>('/api/runners/'), 5000);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const visibleRunners = useMemo(() => {
    if (!runners) return [];
    const q = filter.trim().toLowerCase();
    const filtered = q
      ? runners.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.channel_url.toLowerCase().includes(q),
        )
      : runners;
    const sorted = [...filtered].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [runners, filter, sortKey, sortDir]);

  const remove = async (id: number) => {
    if (!confirm('Delete this runner? They will be unassigned from any schedule entries.')) {
      return;
    }
    try {
      await api(`/api/runners/${id}/`, { method: 'DELETE' });
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  const refreshProfile = async (id: number) => {
    try {
      await api(`/api/runners/${id}/refresh_profile/`, { method: 'POST' });
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div className="control-card">
      <header className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
        <h2 className="m-0">Runners</h2>
        <div className="d-flex align-items-center gap-2 ms-auto">
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name or channel…"
            className="form-control form-control-sm"
            style={{ width: 240 }}
          />
          {!adding && (
            <button className="btn btn-bloodmoon btn-sm" onClick={() => setAdding(true)}>
              + Add runner
            </button>
          )}
        </div>
      </header>

      {adding && (
        <RunnerForm onCancel={() => setAdding(false)} onSaved={() => setAdding(false)} />
      )}

      {err && <p className="text-danger">{err}</p>}

      <table className="control-table mt-3">
        <thead>
          <tr>
            <th style={{ width: 56 }}></th>
            <SortableTh label="Name" sortKey="name" current={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableTh label="Channel" sortKey="channel_url" current={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableTh label="Streamer?" sortKey="is_streamer" current={sortKey} dir={sortDir} onClick={toggleSort} />
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visibleRunners.map((r) =>
            editingId === r.id ? (
              <tr key={r.id}>
                <td colSpan={5}>
                  <RunnerForm
                    runner={r}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => setEditingId(null)}
                  />
                </td>
              </tr>
            ) : (
              <tr key={r.id}>
                <td>
                  {r.profile_image_url ? (
                    <img
                      src={r.profile_image_url}
                      alt={`${r.name} avatar`}
                      width={40}
                      height={40}
                      style={{ borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      aria-hidden
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        color: 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {r.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </td>
                <td>
                  <strong>{r.name}</strong>
                </td>
                <td>
                  {r.channel_url ? (
                    <a
                      className="text-warning"
                      href={r.channel_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {r.channel_url}
                    </a>
                  ) : (
                    <span className="text-white-50">—</span>
                  )}
                </td>
                <td>{r.is_streamer ? 'Yes' : 'No'}</td>
                <td>
                  <div className="control-btn-row">
                    <button
                      className="btn btn-sm btn-outline-light"
                      onClick={() => setEditingId(r.id)}
                    >
                      Edit
                    </button>
                    {r.channel_url.includes('twitch.tv') && (
                      <button
                        className="btn btn-sm btn-outline-light"
                        onClick={() => refreshProfile(r.id)}
                        title="Re-fetch Twitch profile image"
                      >
                        ⟳
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => remove(r.id)}
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ),
          )}
          {runners && runners.length === 0 && (
            <tr>
              <td colSpan={5} className="text-white-50 text-center py-4">
                No runners yet — add one above.
              </td>
            </tr>
          )}
          {runners && runners.length > 0 && visibleRunners.length === 0 && (
            <tr>
              <td colSpan={5} className="text-white-50 text-center py-4">
                No runners match “{filter}”.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SortableTh({
  label,
  sortKey,
  current,
  dir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
}) {
  const active = current === sortKey;
  const indicator = active ? (dir === 'asc' ? '▲' : '▼') : '';
  return (
    <th
      onClick={() => onClick(sortKey)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}
      <span style={{ marginLeft: 6, opacity: active ? 1 : 0.35 }}>
        {indicator || '↕'}
      </span>
    </th>
  );
}

function RunnerForm({
  runner,
  onCancel,
  onSaved,
}: {
  runner?: Runner;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const isEdit = runner !== undefined;
  const [name, setName] = useState(runner?.name ?? '');
  const [channelUrl, setChannelUrl] = useState(runner?.channel_url ?? '');
  const [isStreamer, setIsStreamer] = useState(runner?.is_streamer ?? false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const formId = `runner-form-${runner?.id ?? 'new'}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const body = {
        name: name.trim(),
        channel_url: channelUrl.trim(),
        is_streamer: isStreamer,
      };
      if (isEdit) {
        await api(`/api/runners/${runner.id}/`, { method: 'PATCH', body });
      } else {
        await api('/api/runners/', { method: 'POST', body });
      }
      onSaved();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 d-flex gap-2 flex-wrap align-items-end">
      <div style={{ minWidth: 200, flex: 1 }}>
        <label className="d-block small text-white-50">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="form-control form-control-sm"
        />
      </div>
      <div style={{ minWidth: 260, flex: 2 }}>
        <label className="d-block small text-white-50">Channel URL</label>
        <input
          type="url"
          value={channelUrl}
          onChange={(e) => setChannelUrl(e.target.value)}
          className="form-control form-control-sm"
          placeholder="https://twitch.tv/…"
        />
      </div>
      <div className="form-check mb-1">
        <input
          id={`${formId}-streamer`}
          type="checkbox"
          className="form-check-input"
          checked={isStreamer}
          onChange={(e) => setIsStreamer(e.target.checked)}
        />
        <label htmlFor={`${formId}-streamer`} className="form-check-label small">
          Streamer
        </label>
      </div>
      <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
        {isEdit ? 'Update' : 'Save'}
      </button>
      <button type="button" className="btn btn-outline-light btn-sm" onClick={onCancel}>
        Cancel
      </button>
      {err && <div className="text-danger w-100 mt-2">{err}</div>}
    </form>
  );
}
