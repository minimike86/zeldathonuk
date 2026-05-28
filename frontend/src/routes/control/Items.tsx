import { useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import { api } from '@/lib/api';

export function ItemsControl() {
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, 2000);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const entry = cp?.schedule_entry_detail ?? null;

  if (!entry) {
    return (
      <div className="control-card">
        <h2>Items collected</h2>
        <p className="text-warning">
          No game is currently set as "Currently Playing". Pick one in{' '}
          <a className="text-warning" href="/control/schedule">
            Schedule
          </a>{' '}
          first.
        </p>
      </div>
    );
  }

  const items = entry.game.items.slice().sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const collectedIds = new Set(entry.collected_item_ids);

  const toggle = async (itemId: number) => {
    setBusy(true);
    setErr(null);
    try {
      await obsApi.toggleCollected(entry.id, itemId);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="control-card">
      <header className="d-flex justify-content-between align-items-baseline">
        <h2 className="m-0">Items — {entry.game.title}</h2>
        {!adding && (
          <button className="btn btn-bloodmoon btn-sm" onClick={() => setAdding(true)}>
            + Add item
          </button>
        )}
      </header>

      {adding && (
        <AddItemForm
          gameId={entry.game.id}
          onCancel={() => setAdding(false)}
          onAdded={() => setAdding(false)}
        />
      )}

      {err && <p className="text-danger">{err}</p>}

      {items.length === 0 ? (
        <p className="text-white-50 mt-3">
          No items defined for this game yet — add some above, or import a default checklist later.
        </p>
      ) : (
        <div className="items-grid">
          {items.map((item) => {
            const collected = collectedIds.has(item.id);
            return (
              <button
                key={item.id}
                disabled={busy}
                onClick={() => toggle(item.id)}
                className="item-tile"
                data-collected={collected}
                title={item.name}
              >
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} />
                ) : (
                  <div className="item-placeholder">{item.name.slice(0, 3)}</div>
                )}
                <div className="item-name">{item.name}</div>
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 0.5rem;
          margin-top: 1rem;
        }
        .item-tile {
          background: rgba(0,0,0,0.3);
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          padding: 0.5rem;
          color: #fff;
          cursor: pointer;
          transition: all 0.15s;
        }
        .item-tile:hover {
          border-color: rgba(255,255,255,0.4);
        }
        .item-tile[data-collected="true"] {
          background: linear-gradient(45deg, rgba(20, 80, 30, 0.5), rgba(40, 120, 50, 0.5));
          border-color: #7fff7f;
          box-shadow: 0 0 12px rgba(127,255,127,0.3);
        }
        .item-tile[data-collected="false"] {
          opacity: 0.45;
          filter: grayscale(80%);
        }
        .item-tile img,
        .item-placeholder {
          width: 100%;
          aspect-ratio: 1;
          object-fit: contain;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Bungee', sans-serif;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
        }
        .item-name {
          font-size: 0.75rem;
          text-align: center;
          margin-top: 0.25rem;
          line-height: 1.1;
        }
      `}</style>
    </div>
  );
}

function AddItemForm({
  gameId,
  onCancel,
  onAdded,
}: {
  gameId: number;
  onCancel: () => void;
  onAdded: () => void;
}) {
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('key-item');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      // GameItem endpoint isn't routed on its own (admin handles CRUD);
      // do it via a direct fetch.
      await api('/api/games/', { method: 'GET' }); // smoke-check auth
      await api(`/admin/api/gameitem/add/`, { method: 'GET' }).catch(() => null);
      // For now, fall back to admin add view.
      window.open(
        `/admin/api/gameitem/add/?game=${gameId}&name=${encodeURIComponent(name)}&category=${category}&image_url=${encodeURIComponent(imageUrl)}`,
        '_blank',
      );
      onAdded();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 d-flex gap-2 flex-wrap align-items-end">
      <div style={{ minWidth: 200 }}>
        <label className="d-block small text-white-50">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="form-control form-control-sm"
        />
      </div>
      <div style={{ minWidth: 280, flex: 1 }}>
        <label className="d-block small text-white-50">Image URL</label>
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="form-control form-control-sm"
        />
      </div>
      <div>
        <label className="d-block small text-white-50">Category</label>
        <select
          className="form-select form-select-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="weapon">Weapon</option>
          <option value="song">Song</option>
          <option value="heart-piece">Heart piece</option>
          <option value="key-item">Key item</option>
          <option value="dungeon-item">Dungeon item</option>
          <option value="other">Other</option>
        </select>
      </div>
      <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
        Open admin
      </button>
      <button type="button" className="btn btn-outline-light btn-sm" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}
