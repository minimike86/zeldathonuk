import { useCallback, useEffect, useState } from 'react';
import {
  obsApi,
  usePolledQuery,
  type Game,
  type GameItem,
  type GameItemAsset,
  type GameObjective,
  type ObjectiveStatus,
  type ScheduleEntry,
} from '@/lib/obsApi';
import { onObjectivesChanged } from '@/lib/objectiveBus';

/**
 * Objective library editor. Per-game objectives are the run milestones used as
 * the timer's splits (`/control/timer`) and shown on the omnibar's
 * `objective-checklist` panel. Pick any game to curate its library; when the
 * picked game is the live ("Currently Playing") one, you can also mark its
 * objectives obtained/skipped for the run from here.
 *
 * The free-text "current objective" overlay control still lives in
 * `/control/omnibar`.
 */
export function ObjectivesControl() {
  // Bumped after any edit (and on cross-tab bus pings) to force an immediate
  // re-poll, so a change shows instantly instead of waiting up to 5s.
  const [refreshTick, setRefreshTick] = useState(0);
  const bump = useCallback(() => setRefreshTick((t) => t + 1), []);
  const { data: games } = usePolledQuery(obsApi.games, 5000, [refreshTick]);
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, 5000, [refreshTick]);
  const liveEntry = cp?.schedule_entry_detail ?? null;
  const liveGameId = liveEntry?.game?.id ?? null;

  // Edits from other tabs / the timer broadcast over the bus; refresh on those
  // too (the bus never notifies the originating tab — `bump` covers local ones).
  useEffect(() => onObjectivesChanged(bump), [bump]);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Default to the live game once data lands; the operator can switch to any
  // other game from the picker.
  useEffect(() => {
    if (selectedId != null) return;
    if (liveGameId != null) setSelectedId(liveGameId);
    else if (games && games.length) setSelectedId(games[0].id);
  }, [selectedId, liveGameId, games]);

  const game = games?.find((g) => g.id === selectedId) ?? null;
  // Per-run status marking only applies when the selected game is the live one.
  const entry = game && liveGameId === game.id ? liveEntry : null;

  return (
    <div className="control-card">
      <h2>Objective library</h2>
      <p className="text-white-50">
        Per-game run milestones (e.g. "Reach first dungeon", "Climb Death Mountain", "Beat
        Ganon"). Used as the timer's splits in{' '}
        <a className="text-info" href="/control/timer">
          Timer
        </a>{' '}
        and shown on the omnibar's <code>objective-checklist</code> panel.
        {entry && ' This game is live — clicking a tile marks it obtained for the run.'}
      </p>

      <label className="d-flex flex-column mb-3" style={{ maxWidth: 420 }}>
        <small className="text-white-50">Game</small>
        <select
          className="form-select"
          value={selectedId ?? ''}
          onChange={(e) => setSelectedId(Number(e.target.value))}
        >
          {!games && <option value="">Loading…</option>}
          {games?.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
              {g.id === liveGameId ? ' — LIVE' : ''}
            </option>
          ))}
        </select>
      </label>

      {game ? (
        <ObjectiveLibrary game={game} entry={entry} onChanged={bump} />
      ) : (
        <p className="text-white-50">
          No games yet. Add one in{' '}
          <a className="text-info" href="/control/games">
            Games
          </a>
          .
        </p>
      )}
    </div>
  );
}

const OBJECTIVE_CATEGORIES = [
  ['story', 'Story'],
  ['dungeon', 'Dungeon'],
  ['boss', 'Boss'],
  ['item-get', 'Item get'],
  ['side-quest', 'Side quest'],
  ['100%', '100%'],
  ['other', 'Other'],
] as const;

const categoryLabel = (cat: string): string =>
  OBJECTIVE_CATEGORIES.find(([v]) => v === cat)?.[1] || cat || 'Other';

/** Per-game objective library + (when live) per-run status grid. Tiles are
 *  coloured when obtained, greyed when outstanding, dimmed/struck when skipped.
 *  With a live `entry`, clicking a tile toggles obtained↔outstanding and a ⏭
 *  hover-action toggles skipped; without one, clicking opens the editor. ✎/⧉/✕
 *  manage the library definition itself. */
function ObjectiveLibrary({
  game,
  entry,
  onChanged,
}: {
  game: Game;
  entry: ScheduleEntry | null;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<GameObjective | null>(null);

  const objectives = game.objectives
    .slice()
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  const obtainedIds = new Set(entry?.obtained_objective_ids ?? []);
  const skippedIds = new Set(entry?.skipped_objective_ids ?? []);
  const nextOrder = objectives.reduce((max, o) => Math.max(max, o.order), -1) + 1;
  const obtainedCount = objectives.filter((o) => obtainedIds.has(o.id)).length;
  const activeCount = objectives.filter((o) => !skippedIds.has(o.id)).length;

  // Cluster into run-sections by `group`, falling back to the category label
  // when blank. Insertion order follows objective order, so sections appear in
  // the order their first objective does.
  const groupLabel = (o: GameObjective) => o.group.trim() || categoryLabel(o.category);
  const sections: { label: string; items: GameObjective[] }[] = [];
  const byLabel = new Map<string, GameObjective[]>();
  for (const o of objectives) {
    const key = groupLabel(o);
    let bucket = byLabel.get(key);
    if (!bucket) {
      bucket = [];
      byLabel.set(key, bucket);
      sections.push({ label: key, items: bucket });
    }
    bucket.push(o);
  }
  // Distinct existing group names for the form's autocomplete.
  const existingGroups = Array.from(
    new Set(objectives.map((o) => o.group.trim()).filter(Boolean)),
  );

  const statusOf = (id: number): ObjectiveStatus =>
    obtainedIds.has(id) ? 'obtained' : skippedIds.has(id) ? 'skipped' : 'outstanding';

  const setStatus = async (objectiveId: number, status: ObjectiveStatus) => {
    if (!entry) return;
    setBusy(true);
    setErr(null);
    try {
      await obsApi.setObjectiveStatus(entry.id, objectiveId, status);
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (o: GameObjective) => {
    if (!confirm(`Delete "${o.name}" from ${game.title}? This also clears it from any run.`)) {
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await obsApi.deleteObjective(o.id);
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Clone an objective server-side (all fields, unique "(copy)" name) and open
  // the edit form on the copy so the operator can tweak it.
  const duplicate = async (o: GameObjective) => {
    setBusy(true);
    setErr(null);
    try {
      const copy = await obsApi.duplicateObjective(o.id);
      setAdding(false);
      setEditing(copy);
      onChanged();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const renderTile = (o: GameObjective) => {
    const status = statusOf(o.id);
    return (
      <div key={o.id} className="obj-cell">
        <button
          disabled={busy}
          onClick={() =>
            entry
              ? setStatus(o.id, status === 'obtained' ? 'outstanding' : 'obtained')
              : setEditing(o)
          }
          className="obj-tile"
          data-status={status}
          title={
            entry
              ? `${o.name} — click to ${status === 'obtained' ? 'clear' : 'mark obtained'}`
              : `${o.name} — click to edit`
          }
        >
          {o.image_url ? (
            <img src={o.image_url} alt={o.name} />
          ) : (
            <div className="obj-placeholder">{o.name.slice(0, 3)}</div>
          )}
          <div className="obj-name">
            {o.linked_item ? '🔗 ' : ''}
            {o.name}
          </div>
        </button>
        <div className="obj-actions">
          {entry && (
            <button
              type="button"
              className="obj-action"
              title={status === 'skipped' ? 'Un-skip' : 'Skip this run'}
              disabled={busy}
              onClick={() => setStatus(o.id, status === 'skipped' ? 'outstanding' : 'skipped')}
            >
              ⏭
            </button>
          )}
          <button
            type="button"
            className="obj-action"
            title="Edit objective"
            onClick={() => {
              setAdding(false);
              setEditing(o);
            }}
          >
            ✎
          </button>
          <button
            type="button"
            className="obj-action"
            title="Duplicate objective"
            disabled={busy}
            onClick={() => duplicate(o)}
          >
            ⧉
          </button>
          <button
            type="button"
            className="obj-action"
            title="Delete objective"
            disabled={busy}
            onClick={() => remove(o)}
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <header className="d-flex justify-content-between align-items-baseline">
        <h3 className="m-0 fs-6">
          {game.title}{' '}
          <span className="text-white-50">
            {entry
              ? `(${obtainedCount} / ${activeCount} obtained)`
              : `(${objectives.length} objective${objectives.length === 1 ? '' : 's'})`}
          </span>
        </h3>
        {!adding && !editing && (
          <button className="btn btn-bloodmoon btn-sm" onClick={() => setAdding(true)}>
            + Add objective
          </button>
        )}
      </header>
      <p className="text-white-50 small mt-1 mb-2">
        {entry
          ? 'Click a tile to mark it obtained (fires a pickup celebration); use ⏭ to skip one that isn’t needed this run.'
          : 'This game isn’t live — editing the library only. Mark objectives obtained/skipped from the Timer or when the game is Currently Playing.'}
      </p>

      {(adding || editing) && (
        <ObjectiveForm
          gameId={game.id}
          nextOrder={nextOrder}
          groups={existingGroups}
          items={game.items}
          initial={editing}
          onCancel={() => {
            setAdding(false);
            setEditing(null);
          }}
          onDone={() => {
            setAdding(false);
            setEditing(null);
            onChanged();
          }}
        />
      )}

      {err && <p className="text-danger small mt-2">{err}</p>}

      {objectives.length === 0 ? (
        <p className="text-white-50 small mt-2">
          No objectives defined for this game yet — add one above.
        </p>
      ) : (
        sections.map((sec) => (
          <section key={sec.label} className="obj-section">
            <h4 className="obj-section-head">
              {sec.label}
              <span className="text-white-50"> · {sec.items.length}</span>
            </h4>
            <div className="obj-grid">{sec.items.map(renderTile)}</div>
          </section>
        ))
      )}

      <style>{`
        .obj-section { margin-top: 0.75rem; }
        .obj-section-head {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #ffcc00;
          margin: 0 0 0.25rem;
          padding-bottom: 0.2rem;
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }
        .obj-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .obj-cell { position: relative; }
        .obj-tile {
          width: 100%;
          background: rgba(0,0,0,0.3);
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          padding: 0.5rem;
          color: #fff;
          cursor: pointer;
          transition: all 0.15s;
        }
        .obj-tile:hover { border-color: rgba(255,255,255,0.4); }
        .obj-tile[data-status="obtained"] {
          background: linear-gradient(45deg, rgba(20, 80, 30, 0.5), rgba(40, 120, 50, 0.5));
          border-color: #7fff7f;
          box-shadow: 0 0 12px rgba(127,255,127,0.3);
        }
        .obj-tile[data-status="outstanding"] {
          opacity: 0.45;
          filter: grayscale(80%);
        }
        .obj-tile[data-status="skipped"] {
          opacity: 0.3;
          border-style: dashed;
        }
        .obj-tile[data-status="skipped"] .obj-name {
          text-decoration: line-through;
        }
        .obj-tile img, .obj-placeholder {
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
        .obj-name { font-size: 0.75rem; text-align: center; margin-top: 0.25rem; line-height: 1.1; }
        .obj-actions {
          position: absolute;
          top: 2px;
          right: 2px;
          display: flex;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .obj-cell:hover .obj-actions { opacity: 1; }
        .obj-action {
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
        .obj-action:hover { background: rgba(180,30,30,0.9); }
        .obj-asset-picker {
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
        .obj-asset-swatch {
          background: rgba(255,255,255,0.05);
          border: 2px solid transparent;
          border-radius: 4px;
          padding: 2px;
          cursor: pointer;
        }
        .obj-asset-swatch[data-selected="true"] { border-color: #7fff7f; }
        .obj-asset-swatch img { width: 100%; aspect-ratio: 1; object-fit: contain; }
      `}</style>
    </div>
  );
}

function ObjectiveForm({
  gameId,
  nextOrder,
  groups,
  items,
  initial,
  onCancel,
  onDone,
}: {
  gameId: number;
  nextOrder: number;
  groups: string[];
  items: GameItem[];
  initial: GameObjective | null;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '');
  const [category, setCategory] = useState(initial?.category || 'story');
  const [group, setGroup] = useState(initial?.group ?? '');
  const [linkedItem, setLinkedItem] = useState<number | null>(initial?.linked_item ?? null);
  const [assets, setAssets] = useState<GameItemAsset[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    obsApi
      .objectiveAssets(gameId)
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
      // Only "item get" objectives carry a linked item; clear it otherwise.
      const linked = category === 'item-get' ? linkedItem : null;
      if (initial) {
        await obsApi.updateObjective(initial.id, {
          name: name.trim(),
          image_url: imageUrl.trim(),
          category,
          group: group.trim(),
          linked_item: linked,
        });
      } else {
        await obsApi.createObjective({
          game: gameId,
          name: name.trim(),
          image_url: imageUrl.trim(),
          category,
          group: group.trim(),
          linked_item: linked,
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
    <form onSubmit={submit} className="mt-2 p-3" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
      <div className="d-flex gap-2 flex-wrap align-items-end">
        <div style={{ minWidth: 200, flex: 1 }}>
          <label className="d-block small text-white-50">Objective</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Collect all heart pieces"
            className="form-control form-control-sm"
          />
        </div>
        <div style={{ minWidth: 260, flex: 1 }}>
          <label className="d-block small text-white-50">Image URL (optional)</label>
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
            {OBJECTIVE_CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="d-block small text-white-50">Group (section)</label>
          <input
            list="objective-group-options"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="e.g. The Dark World"
            className="form-control form-control-sm"
          />
          <datalist id="objective-group-options">
            {groups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>
        {category === 'item-get' && (
          <div style={{ minWidth: 220 }}>
            <label className="d-block small text-white-50">Linked item</label>
            <select
              className="form-select form-select-sm"
              value={linkedItem ?? ''}
              onChange={(e) => setLinkedItem(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">— none —</option>
              {items
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
            </select>
          </div>
        )}
        <button type="submit" className="btn btn-bloodmoon btn-sm" disabled={busy}>
          {initial ? 'Save' : 'Add objective'}
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
          <div className="obj-asset-picker">
            {assets.map((a) => (
              <button
                type="button"
                key={a.url}
                className="obj-asset-swatch"
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
