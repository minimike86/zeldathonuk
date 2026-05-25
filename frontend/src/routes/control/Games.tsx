import { useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import { api } from '@/lib/api';

const platforms = ['NES', 'SNES', 'N64', 'GC', 'Wii', 'WiiU', 'Switch', 'Switch2', 'GB', 'GBC', 'GBA', 'DS', '3DS', 'Other'];
const layouts = ['16x9', '4x3', '3ds', 'ds-top', 'ds-both', 'fsa-split'];

export function GamesControl() {
  const { data: games } = usePolledQuery(obsApi.games, 5000);
  const [adding, setAdding] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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
      <header className="d-flex justify-content-between align-items-baseline">
        <h2 className="m-0">Games catalogue</h2>
        {!adding && (
          <button className="btn btn-bloodmoon btn-sm" onClick={() => setAdding(true)}>
            + Add game
          </button>
        )}
      </header>

      {adding && (
        <AddGameForm onCancel={() => setAdding(false)} onAdded={() => setAdding(false)} />
      )}

      {err && <p className="text-danger">{err}</p>}

      <table className="control-table mt-3">
        <thead>
          <tr>
            <th>Title</th>
            <th>Platform</th>
            <th>Layout</th>
            <th>Default min</th>
            <th>Items</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {games?.map((g) => (
            <tr key={g.id}>
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
              <td>{g.items.length}</td>
              <td>
                <button className="btn btn-sm btn-outline-danger" onClick={() => remove(g.id)}>
                  ✕
                </button>
              </td>
            </tr>
          ))}
          {games?.length === 0 && (
            <tr>
              <td colSpan={6} className="text-white-50 text-center py-4">
                No games yet — add one above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
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
