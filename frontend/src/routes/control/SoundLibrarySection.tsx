import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { SoundAsset } from '@/lib/obsApi';
import { useTableControls, type TableColumn } from './useTableControls';

const SOUND_COLUMNS: TableColumn<SoundAsset>[] = [
  { id: 'name',   header: 'Name',   sortValue: (a) => a.name,   initialWidth: 220 },
  { id: 'url',    header: 'URL',    sortValue: (a) => a.url },
  { id: 'volume', header: 'Volume', sortValue: (a) => a.volume, initialWidth: 100 },
  { id: 'actions', header: '',                                   initialWidth: 360 },
];

/**
 * Reusable Sound library section. Lives in its own file so both
 * /control/omnibar and /control/schedule can render the same widget
 * without duplicating CRUD logic.
 *
 * Capabilities:
 *  - Add new sound (name + url + volume).
 *  - Edit existing rows inline: name, url, volume all commit on blur
 *    so the user can correct typos without clicking through a modal.
 *  - ▶ Test plays the asset locally at the configured volume.
 *  - Delete (with confirm). Backend uses on_delete=PROTECT so a
 *    deletion attempt while triggers still reference the asset is
 *    surfaced as an API error and the row stays.
 *
 * All writes hit the same `/api/sound-assets/` endpoint, so changes
 * made here on /control/schedule appear on /control/omnibar's view
 * after the 5s poll, and vice versa.
 */

const TEST_FAILED_MS = 1500;

export function SoundLibrarySection() {
  const { data: assets } = usePolledQuery(obsApi.soundAssets, 5000);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<{ name: string; url: string; volume: string }>({
    name: '',
    url: '',
    volume: '0.85',
  });

  const create = async () => {
    if (!draft.name.trim() || !draft.url.trim()) return;
    setBusy(true);
    try {
      const volume = Math.max(0, Math.min(1, Number(draft.volume) || 0.85));
      await obsApi.createSoundAsset({
        name: draft.name.trim(),
        url: draft.url.trim(),
        volume,
      });
      setDraft({ name: '', url: '', volume: '0.85' });
    } finally {
      setBusy(false);
    }
  };

  const list = assets ?? [];

  return (
    <section className="control-card">
      <h2>Sound library</h2>
      <p className="text-white-50">
        Reusable audio files referenced by schedule-entry sound
        triggers. The same file can be wired to multiple triggers
        (e.g. a single bell sounded at -30s / -20s / -10s before an
        entry's start). Volume applies every time the sound plays.
        Edits stage locally — hit <strong>Save</strong> on the row
        to commit, or <strong>Reset</strong> to discard.
      </p>

      <div className="control-btn-row" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <label className="d-flex flex-column">
          <small>Name</small>
          <input
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="MM Clock Tower Bell"
            style={{ width: 200 }}
          />
        </label>
        <label className="d-flex flex-column flex-grow-1" style={{ minWidth: 280 }}>
          <small>URL</small>
          <input
            value={draft.url}
            onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
            placeholder="https://… or /assets/audio/foo.mp3"
          />
        </label>
        <label className="d-flex flex-column">
          <small>Volume (0–1)</small>
          <input
            type="number"
            step={0.05}
            min={0}
            max={1}
            value={draft.volume}
            onChange={(e) => setDraft((d) => ({ ...d, volume: e.target.value }))}
            style={{ width: 100 }}
          />
        </label>
        <button
          type="button"
          className="btn btn-bloodmoon"
          disabled={busy || !draft.name.trim() || !draft.url.trim()}
          onClick={create}
        >
          Add sound
        </button>
      </div>

      <SoundLibraryTable rows={list} />
    </section>
  );
}

function SoundLibraryTable({ rows }: { rows: SoundAsset[] }) {
  const ctrl = useTableControls(rows, SOUND_COLUMNS, 'control:sound-library-v1');
  return (
    <div className="mt-3">
      <ctrl.FilterInput placeholder="Filter sounds…" />
      <div style={{ overflowX: 'auto' }}>
        <table className="control-table" style={{ minWidth: 900, tableLayout: 'fixed' }}>
          <colgroup>
            {SOUND_COLUMNS.map((c) => <col key={c.id} style={ctrl.colStyle(c.id)} />)}
          </colgroup>
          <thead>
            <tr>
              {SOUND_COLUMNS.map((c) => (
                <th key={c.id} {...ctrl.headerProps(c.id)}>
                  {c.header}
                  {ctrl.sortIndicator(c.id)}
                  {ctrl.resizeHandle(c.id)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ctrl.rows.length === 0 && (
              <tr><td colSpan={SOUND_COLUMNS.length} className="text-white-50">No sounds match.</td></tr>
            )}
            {ctrl.rows.map((a) => (
              <SoundLibraryRow key={a.id} asset={a} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface RowDraft {
  name: string;
  url: string;
  volume: string;
}

function draftFromAsset(a: SoundAsset): RowDraft {
  return { name: a.name, url: a.url, volume: a.volume.toFixed(2) };
}

function SoundLibraryRow({ asset }: { asset: SoundAsset }) {
  const [busy, setBusy] = useState(false);
  const [testFailed, setTestFailed] = useState(false);
  const [draft, setDraft] = useState<RowDraft>(() => draftFromAsset(asset));
  const [dirty, setDirty] = useState(false);

  // Re-seed from the canonical asset on every poll, but only when the
  // row is CLEAN. If the user has unsaved edits, leave their drafts
  // alone — a background poll shouldn't blow away typed input.
  useEffect(() => {
    if (dirty) return;
    setDraft(draftFromAsset(asset));
  }, [asset, dirty]);

  const patch = <K extends keyof RowDraft>(key: K, value: RowDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  const parsedVolume = (): number => {
    const n = Number(draft.volume);
    if (!Number.isFinite(n)) return asset.volume;
    return Math.max(0, Math.min(1, n));
  };

  const canSave =
    dirty &&
    !busy &&
    draft.name.trim() !== '' &&
    draft.url.trim() !== '';

  const save = async () => {
    setBusy(true);
    try {
      const next = {
        name: draft.name.trim(),
        url: draft.url.trim(),
        volume: parsedVolume(),
      };
      await obsApi.updateSoundAsset(asset.id, next);
      // Let the next poll re-seed; clear dirty so it actually does.
      setDirty(false);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setDraft(draftFromAsset(asset));
    setDirty(false);
  };

  const test = () => {
    try {
      // Use whatever's typed right now so the operator can audition a
      // URL change BEFORE committing it. Falls back to the saved
      // values if the drafts are empty.
      const audio = new Audio(draft.url.trim() || asset.url);
      audio.volume = parsedVolume();
      audio.play().catch(() => {
        setTestFailed(true);
        window.setTimeout(() => setTestFailed(false), TEST_FAILED_MS);
      });
    } catch {
      setTestFailed(true);
      window.setTimeout(() => setTestFailed(false), TEST_FAILED_MS);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete sound "${asset.name}"? Any triggers using it will block deletion.`)) return;
    setBusy(true);
    try {
      await obsApi.deleteSoundAsset(asset.id);
    } catch (e) {
      alert(`Delete failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const rowStyle: CSSProperties | undefined = dirty
    ? { background: 'rgba(255, 210, 58, 0.06)' }
    : undefined;

  return (
    <tr style={rowStyle}>
      <td>
        <input
          type="text"
          disabled={busy}
          value={draft.name}
          onChange={(e) => patch('name', e.target.value)}
          placeholder="Name"
          style={{ width: '100%' }}
        />
      </td>
      <td>
        <input
          type="text"
          disabled={busy}
          value={draft.url}
          onChange={(e) => patch('url', e.target.value)}
          placeholder="https://… or /assets/audio/…"
          style={{ width: '100%' }}
        />
      </td>
      <td>
        <input
          type="number"
          disabled={busy}
          min={0}
          max={1}
          step={0.05}
          value={draft.volume}
          onChange={(e) => patch('volume', e.target.value)}
          style={{ width: 80, fontVariantNumeric: 'tabular-nums' }}
        />
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-flex', gap: '0.35rem', flexWrap: 'nowrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-sm btn-bloodmoon"
            disabled={!canSave}
            onClick={save}
            title={dirty ? 'Commit pending edits' : 'No changes'}
          >
            Save
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-light"
            disabled={!dirty || busy}
            onClick={reset}
            title="Discard pending edits"
          >
            Reset
          </button>
          <button type="button" className="btn btn-sm btn-outline-light" onClick={test}>
            ▶ Test
          </button>
          {testFailed && (
            <small className="text-warning align-self-center">blocked</small>
          )}
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            disabled={busy}
            onClick={remove}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
