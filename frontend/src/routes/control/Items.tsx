import { Fragment, useEffect, useState } from 'react';
import { obsApi, usePolledQuery, type GameItem, type GameItemAsset } from '@/lib/obsApi';

const CATEGORIES = [
  ['weapon', 'Weapon'],
  ['song', 'Song'],
  ['heart-piece', 'Heart piece'],
  ['key-item', 'Key item'],
  ['dungeon-item', 'Dungeon item'],
  ['other', 'Other'],
] as const;

const LINK_KINDS = [
  ['', '— not linked'],
  ['upgrade', 'Upgrade chain'],
  ['trade', 'Trade sequence'],
  ['set', 'Related set'],
] as const;

export function ItemsControl() {
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, 2000);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<GameItem | null>(null);

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

  const game = entry.game;
  if (!game) {
    return (
      <div className="control-card">
        <h2>Items collected</h2>
        <p className="text-warning">
          The current schedule entry has no game attached, so it has no item checklist.
        </p>
      </div>
    );
  }

  const items = game.items.slice().sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const collectedIds = new Set(entry.collected_item_ids);
  const collectedCounts = entry.collected_item_counts ?? {};
  const nextOrder = items.reduce((max, i) => Math.max(max, i.order), -1) + 1;

  // Cluster items into sections: by their `group` label, falling back to the
  // category label when blank. Map insertion order follows item.order, so
  // groups appear in the order their first item was added/imported.
  const groupLabel = (i: GameItem) =>
    i.group.trim() ||
    CATEGORIES.find(([v]) => v === i.category)?.[1] ||
    i.category ||
    'Other';
  const groups: { label: string; items: GameItem[] }[] = [];
  const byLabel = new Map<string, GameItem[]>();
  for (const it of items) {
    const key = groupLabel(it);
    let bucket = byLabel.get(key);
    if (!bucket) {
      bucket = [];
      byLabel.set(key, bucket);
      groups.push({ label: key, items: bucket });
    }
    bucket.push(it);
  }
  // Distinct existing group / link-group names, for the form's autocomplete.
  const existingGroups = Array.from(
    new Set(items.map((i) => i.group.trim()).filter(Boolean)),
  );
  const existingLinkGroups = Array.from(
    new Set(items.map((i) => i.link_group.trim()).filter(Boolean)),
  );

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

  const adjust = async (itemId: number, delta: number) => {
    setBusy(true);
    setErr(null);
    try {
      await obsApi.adjustCollected(entry.id, itemId, delta);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: GameItem) => {
    if (!confirm(`Delete "${item.name}" from ${game.title}? This also clears it from any run.`)) return;
    setBusy(true);
    setErr(null);
    try {
      await obsApi.deleteGameItem(item.id);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Clone an item server-side (all fields, under a unique "(copy)" name) and
  // immediately open the edit form on the new copy so the operator can tweak it.
  const duplicate = async (item: GameItem) => {
    setBusy(true);
    setErr(null);
    try {
      const copy = await obsApi.duplicateGameItem(item.id);
      setAdding(false);
      setEditing(copy);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const renderTile = (item: GameItem) => {
    const count = collectedCounts[String(item.id)] ?? 0;
    const collected = item.countable ? count > 0 : collectedIds.has(item.id);
    return (
      <div key={item.id} className="item-cell">
        <button
          disabled={busy}
          onClick={() => (item.countable ? adjust(item.id, 1) : toggle(item.id))}
          className="item-tile"
          data-collected={collected}
          title={
            item.countable
              ? `${item.name} — click to add one (×${count})`
              : `${item.name} — click to toggle collected`
          }
        >
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} />
          ) : (
            <div className="item-placeholder">{item.name.slice(0, 3)}</div>
          )}
          <div className="item-name">{item.name}</div>
          {item.countable && count > 0 && <div className="item-count">×{count}</div>}
        </button>
        <div className="item-actions">
          {item.countable && (
            <button
              type="button"
              className="item-action"
              title="Remove one"
              disabled={busy || count === 0}
              onClick={() => adjust(item.id, -1)}
            >
              −
            </button>
          )}
          <button
            type="button"
            className="item-action"
            title="Edit item"
            onClick={() => {
              setAdding(false);
              setEditing(item);
            }}
          >
            ✎
          </button>
          <button
            type="button"
            className="item-action"
            title="Duplicate item"
            disabled={busy}
            onClick={() => duplicate(item)}
          >
            ⧉
          </button>
          <button
            type="button"
            className="item-action"
            title="Delete item"
            disabled={busy}
            onClick={() => remove(item)}
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="control-card">
      <header className="d-flex justify-content-between align-items-baseline">
        <h2 className="m-0">
          Items — {game.title}{' '}
          <span className="text-white-50 fs-6">
            ({collectedIds.size} / {items.length} collected)
          </span>
        </h2>
        {!adding && !editing && (
          <button className="btn btn-bloodmoon btn-sm" onClick={() => setAdding(true)}>
            + Add item
          </button>
        )}
      </header>

      {(adding || editing) && (
        <ItemForm
          gameId={game.id}
          nextOrder={nextOrder}
          initial={editing}
          groups={existingGroups}
          linkGroups={existingLinkGroups}
          onCancel={() => {
            setAdding(false);
            setEditing(null);
          }}
          onDone={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      )}

      {err && <p className="text-danger mt-2">{err}</p>}

      {items.length === 0 ? (
        <p className="text-white-50 mt-3">
          No items defined for this game yet — add some above, or run{' '}
          <code>python manage.py import_zelda_items</code> to import a checklist.
        </p>
      ) : (
        groups.map((g) => {
          const got = g.items.filter((i) => collectedIds.has(i.id)).length;
          const emitted = new Set<string>();
          return (
            <section key={g.label} className="item-group">
              <h3 className="item-group-head">
                {g.label}{' '}
                <span className="text-white-50">
                  ({got}/{g.items.length})
                </span>
              </h3>
              <div className="items-flow">
                {g.items.map((item) => {
                  const lg = item.link_group.trim();
                  if (!lg) return renderTile(item);
                  // Emit the whole linked family once, at its first member.
                  if (emitted.has(lg)) return null;
                  emitted.add(lg);
                  const members = g.items.filter((m) => m.link_group.trim() === lg);
                  const kind = members.find((m) => m.link_kind)?.link_kind || 'set';
                  const ordered = kind === 'upgrade' || kind === 'trade';
                  return (
                    <div key={`lg:${lg}`} className="link-cluster" data-kind={kind}>
                      <div className="link-cluster-head">
                        {lg}
                        {kind === 'set' ? ' · set' : ''}
                      </div>
                      <div className="link-cluster-body">
                        {members.map((m, idx) => (
                          <Fragment key={m.id}>
                            {ordered && idx > 0 && (
                              <span className="link-arrow" aria-hidden>
                                →
                              </span>
                            )}
                            {renderTile(m)}
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      <style>{`
        .item-group {
          margin-top: 1.25rem;
        }
        .item-group-head {
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 0.25rem;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }
        .items-flow {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .item-cell {
          position: relative;
          width: 110px;
        }
        .link-cluster {
          border: 1px dashed rgba(255,255,255,0.25);
          border-radius: 8px;
          padding: 0.35rem 0.5rem 0.5rem;
        }
        .link-cluster[data-kind="upgrade"] { border-color: rgba(127,180,255,0.55); }
        .link-cluster[data-kind="trade"] { border-color: rgba(255,200,120,0.55); }
        .link-cluster[data-kind="set"] { border-color: rgba(200,150,255,0.55); }
        .link-cluster-head {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: rgba(255,255,255,0.6);
          margin-bottom: 0.3rem;
        }
        .link-cluster-body {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.4rem;
        }
        .link-arrow {
          color: rgba(255,255,255,0.55);
          font-size: 1.1rem;
          line-height: 1;
        }
        .item-tile {
          width: 100%;
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
          opacity: 0.4;
          filter: grayscale(100%) brightness(0.8);
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
        .item-count {
          position: absolute;
          bottom: 4px;
          left: 4px;
          min-width: 22px;
          padding: 0 5px;
          border-radius: 11px;
          background: #7fff7f;
          color: #04210a;
          font-family: 'Bungee', sans-serif;
          font-size: 0.8rem;
          line-height: 1.4;
          text-align: center;
        }
        .item-actions {
          position: absolute;
          top: 2px;
          right: 2px;
          display: flex;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .item-cell:hover .item-actions {
          opacity: 1;
        }
        .item-action {
          width: 22px;
          height: 22px;
          line-height: 1;
          padding: 0;
          border: none;
          border-radius: 4px;
          background: rgba(0,0,0,0.65);
          color: #fff;
          cursor: pointer;
          font-size: 0.8rem;
        }
        .item-action:hover {
          background: rgba(180,30,30,0.9);
        }
        .asset-picker {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
          gap: 0.35rem;
          max-height: 220px;
          overflow-y: auto;
          padding: 0.4rem;
          background: rgba(0,0,0,0.25);
          border-radius: 6px;
          margin-top: 0.25rem;
        }
        .asset-swatch {
          background: rgba(255,255,255,0.05);
          border: 2px solid transparent;
          border-radius: 4px;
          padding: 2px;
          cursor: pointer;
        }
        .asset-swatch[data-selected="true"] {
          border-color: #7fff7f;
        }
        .asset-swatch img {
          width: 100%;
          aspect-ratio: 1;
          object-fit: contain;
        }
      `}</style>
    </div>
  );
}

function ItemForm({
  gameId,
  nextOrder,
  initial,
  groups,
  linkGroups,
  onCancel,
  onDone,
}: {
  gameId: number;
  nextOrder: number;
  initial: GameItem | null;
  groups: string[];
  linkGroups: string[];
  onCancel: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '');
  const [category, setCategory] = useState(initial?.category || 'key-item');
  const [group, setGroup] = useState(initial?.group ?? '');
  const [linkGroup, setLinkGroup] = useState(initial?.link_group ?? '');
  const [linkKind, setLinkKind] = useState<GameItem['link_kind']>(initial?.link_kind ?? '');
  const [countable, setCountable] = useState(initial?.countable ?? false);
  const [assets, setAssets] = useState<GameItemAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    obsApi
      .itemAssets(gameId)
      .then((res) => {
        if (!cancelled) setAssets(res.images);
      })
      .catch(() => {
        /* picker is optional — the free-text URL field still works */
      });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const lg = linkGroup.trim();
      const lk = lg ? linkKind : '';
      if (initial) {
        await obsApi.updateGameItem(initial.id, {
          name: name.trim(),
          image_url: imageUrl.trim(),
          category,
          group: group.trim(),
          link_group: lg,
          link_kind: lk,
          countable,
        });
      } else {
        await obsApi.createGameItem({
          game: gameId,
          name: name.trim(),
          image_url: imageUrl.trim(),
          category,
          group: group.trim(),
          link_group: lg,
          link_kind: lk,
          countable,
          order: nextOrder,
        });
      }
      onDone();
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 p-3" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
      <div className="d-flex gap-2 flex-wrap align-items-end">
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
            placeholder="/assets/img/game-franchise/legend-of-zelda/…"
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
            {CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ minWidth: 160 }}>
          <label className="d-block small text-white-50">Group</label>
          <input
            list="item-group-options"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="e.g. Equipment"
            className="form-control form-control-sm"
          />
          <datalist id="item-group-options">
            {groups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>
        <div style={{ minWidth: 150 }}>
          <label className="d-block small text-white-50">Linked group</label>
          <input
            list="item-link-options"
            value={linkGroup}
            onChange={(e) => setLinkGroup(e.target.value)}
            placeholder="e.g. Sword, Masks"
            className="form-control form-control-sm"
          />
          <datalist id="item-link-options">
            {linkGroups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="d-block small text-white-50">Link kind</label>
          <select
            className="form-select form-select-sm"
            value={linkKind}
            disabled={!linkGroup.trim()}
            onChange={(e) => setLinkKind(e.target.value as GameItem['link_kind'])}
          >
            {LINK_KINDS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-check align-self-center mt-3" title="Track as an up/down tally (keys, maps, compasses)">
          <input
            id="item-countable"
            type="checkbox"
            className="form-check-input"
            checked={countable}
            onChange={(e) => setCountable(e.target.checked)}
          />
          <label className="form-check-label small text-white-50" htmlFor="item-countable">
            Countable (tally)
          </label>
        </div>
        <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
          {initial ? 'Save' : 'Add item'}
        </button>
        <button type="button" className="btn btn-outline-light btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>

      {err && <p className="text-danger small mt-2 mb-0">{err}</p>}

      {assets.length > 0 && (
        <div className="mt-2">
          <label className="d-block small text-white-50">
            Pick a bundled sprite ({assets.length} available)
          </label>
          <div className="asset-picker">
            {assets.map((a) => (
              <button
                type="button"
                key={a.url}
                className="asset-swatch"
                data-selected={a.url === imageUrl}
                title={a.filename}
                onClick={() => setImageUrl(a.url)}
              >
                <img src={a.url} alt={a.filename} />
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
