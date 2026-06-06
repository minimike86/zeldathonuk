import { useMemo, useState } from 'react';
import { obsApi, usePolledQuery, type Game } from '@/lib/obsApi';
import { api } from '@/lib/api';

const platforms = ['NES', 'SNES', 'N64', 'GC', 'Wii', 'WiiU', 'Switch', 'Switch2', 'GB', 'GBC', 'GBA', 'DS', '3DS', 'Other'];
const layouts = ['16x9', '4x3', '3ds', 'ds-top', 'ds-both', 'fsa-split'];

type SortKey = 'title' | 'platform' | 'layout_type' | 'default_play_minutes' | 'items';
type SortDir = 'asc' | 'desc';

const fmtHours = (minutes: number): string => {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const sortValue = (g: Game, key: SortKey): string | number => {
  switch (key) {
    case 'items':
      return g.items.length;
    case 'default_play_minutes':
      return g.default_play_minutes;
    case 'title':
    case 'platform':
    case 'layout_type':
      return g[key].toLowerCase();
  }
};

export function GamesControl() {
  const { data: games } = usePolledQuery(obsApi.games, 5000);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const visibleGames = useMemo(() => {
    if (!games) return [];
    const q = filter.trim().toLowerCase();
    const filtered = q
      ? games.filter(
          (g) =>
            g.title.toLowerCase().includes(q) ||
            g.platform.toLowerCase().includes(q),
        )
      : games;
    const sorted = [...filtered].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [games, filter, sortKey, sortDir]);

  const remove = async (id: number) => {
    if (!confirm('Delete this game? Schedule entries using it must be removed first.')) return;
    try {
      await api(`/api/games/${id}/`, { method: 'DELETE' });
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div className="control-card">
      <header className="d-flex justify-content-between align-items-center gap-3 flex-wrap">
        <h2 className="m-0">Games catalogue</h2>
        <div className="d-flex align-items-center gap-2 ms-auto">
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by title or platform…"
            className="form-control form-control-sm"
            style={{ width: 240 }}
          />
          {!adding && (
            <button className="btn btn-bloodmoon btn-sm" onClick={() => setAdding(true)}>
              + Add game
            </button>
          )}
        </div>
      </header>

      {adding && (
        <AddGameForm onCancel={() => setAdding(false)} onAdded={() => setAdding(false)} />
      )}

      {err && <p className="text-danger">{err}</p>}

      <table className="control-table mt-3">
        <thead>
          <tr>
            <th style={{ width: 64 }}></th>
            <SortableTh label="Title" sortKey="title" current={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableTh label="Platform" sortKey="platform" current={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableTh label="Layout" sortKey="layout_type" current={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableTh label="Default min" sortKey="default_play_minutes" current={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableTh label="Hours" sortKey="default_play_minutes" current={sortKey} dir={sortDir} onClick={toggleSort} />
            <SortableTh label="Items" sortKey="items" current={sortKey} dir={sortDir} onClick={toggleSort} />
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visibleGames.map((g) => (
            <tr key={g.id}>
              <td>
                {g.box_art_url ? (
                  <img
                    src={g.box_art_url}
                    alt={`${g.title} box art`}
                    style={{
                      width: 48,
                      height: 64,
                      objectFit: 'cover',
                      borderRadius: 4,
                    }}
                  />
                ) : (
                  <div
                    aria-hidden
                    style={{
                      width: 48,
                      height: 64,
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      color: 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {g.title.charAt(0).toUpperCase()}
                  </div>
                )}
              </td>
              <td>
                <strong>{g.title}</strong>
                {g.release_year && (
                  <span className="text-white-50 small"> ({g.release_year})</span>
                )}
              </td>
              <td>{g.platform}</td>
              <td>
                <code>{g.layout_type}</code>
              </td>
              <td>{g.default_play_minutes}</td>
              <td className="text-white-50 small">{fmtHours(g.default_play_minutes)}</td>
              <td>{g.items.length}</td>
              <td>
                <button className="btn btn-sm btn-outline-danger" onClick={() => remove(g.id)}>
                  ✕
                </button>
              </td>
            </tr>
          ))}
          {games && games.length === 0 && (
            <tr>
              <td colSpan={8} className="text-white-50 text-center py-4">
                No games yet — add one above.
              </td>
            </tr>
          )}
          {games && games.length > 0 && visibleGames.length === 0 && (
            <tr>
              <td colSpan={8} className="text-white-50 text-center py-4">
                No games match “{filter}”.
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

function AddGameForm({
  onCancel,
  onAdded,
}: {
  onCancel: () => void;
  onAdded: () => void;
}) {
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('Switch');
  const [layoutType, setLayoutType] = useState('16x9');
  const [defaultPlayMinutes, setDefaultPlayMinutes] = useState('300');
  const [boxArtUrl, setBoxArtUrl] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await api('/api/games/', {
        method: 'POST',
        body: {
          title,
          platform,
          layout_type: layoutType,
          default_play_minutes: Number(defaultPlayMinutes),
          box_art_url: boxArtUrl,
          release_year: releaseYear ? Number(releaseYear) : null,
        },
      });
      onAdded();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 d-flex gap-2 flex-wrap align-items-end">
      <div style={{ minWidth: 240, flex: 1 }}>
        <label className="d-block small text-white-50">Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="form-control form-control-sm"
        />
      </div>
      <div>
        <label className="d-block small text-white-50">Platform</label>
        <select
          className="form-select form-select-sm"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          {platforms.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="d-block small text-white-50">Layout</label>
        <select
          className="form-select form-select-sm"
          value={layoutType}
          onChange={(e) => setLayoutType(e.target.value)}
        >
          {layouts.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="d-block small text-white-50">Default min</label>
        <input
          type="number"
          required
          min={1}
          value={defaultPlayMinutes}
          onChange={(e) => setDefaultPlayMinutes(e.target.value)}
          className="form-control form-control-sm"
          style={{ width: 100 }}
        />
      </div>
      <div>
        <label className="d-block small text-white-50">Year</label>
        <input
          type="number"
          value={releaseYear}
          onChange={(e) => setReleaseYear(e.target.value)}
          className="form-control form-control-sm"
          style={{ width: 100 }}
        />
      </div>
      <div style={{ minWidth: 240, flex: 1 }}>
        <label className="d-block small text-white-50">Box art URL</label>
        <input
          value={boxArtUrl}
          onChange={(e) => setBoxArtUrl(e.target.value)}
          className="form-control form-control-sm"
        />
      </div>
      <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
        Save
      </button>
      <button type="button" className="btn btn-outline-light btn-sm" onClick={onCancel}>
        Cancel
      </button>
      {err && <div className="text-danger w-100 mt-2">{err}</div>}
    </form>
  );
}
