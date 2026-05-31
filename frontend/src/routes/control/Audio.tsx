import { useMemo, useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { AudioTrack, VisualiserStyle } from '@/lib/obsApi';
import { api } from '@/lib/api';
import { themeFor } from '../obs/game-themes';
import { ScenePreview } from './ScenePreview';

/**
 * Music control for /obs/audio-countdown. Pick a specific track to play (pin),
 * pause/resume, skip to the next track (in-order when pinned, random when not),
 * and toggle individual tracks on/off in the random rotation.
 */
export function AudioControl() {
  const { data: tracks } = usePolledQuery(obsApi.audioPlaylist, 3000);
  const { data: now } = usePolledQuery(obsApi.nowPlayingAudio, 1500);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Game-name keys for which the OBS scene previews are expanded. Toggled
  // per-game because each scene runs its own animations and rendering them
  // all at once on this page would be wasteful.
  const [previewOpen, setPreviewOpen] = useState<Record<string, boolean>>({});
  // Scene component names that have just been unregistered. Used to hide
  // the tile immediately while we wait for Vite HMR to re-evaluate
  // the zelda franchise module and drop the entry from the cascade.
  const [removedScenes, setRemovedScenes] = useState<Set<string>>(new Set());
  // Library filters. With 240+ games the flat card list is unwieldy.
  const [franchise, setFranchise] = useState('');
  const [gameFilter, setGameFilter] = useState('');
  const [query, setQuery] = useState('');

  const wrap = async (fn: () => Promise<unknown>) => {
    setErr(null);
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Click ▶ Play on a row → pin that track explicitly.
  const playTrack = (trackId: number) =>
    wrap(() => obsApi.setNowPlayingAudio({ track_id: trackId, is_pinned: true, is_paused: false }));

  // Click ↻ Back to random → unpin + clear track so the audio-countdown
  // picks a random enabled track on next tick.
  const backToRandom = () =>
    wrap(() => obsApi.setNowPlayingAudio({ track_id: null, is_pinned: false, is_paused: false }));

  const togglePaused = () =>
    wrap(() => obsApi.setNowPlayingAudio({ is_paused: !now?.is_paused }));

  // Set the /obs/audio-countdown canvas visualiser style (global; 'auto'
  // rotates per track). The overlay picks it up on its next ~1.5s poll.
  const setVisualiser = (style: VisualiserStyle) =>
    wrap(() => obsApi.setNowPlayingAudio({ visualiser_style: style }));

  const enabled = useMemo(
    () => (tracks ?? []).filter((t) => t.enabled).sort((a, b) => a.order - b.order || a.id - b.id),
    [tracks],
  );

  // Skip behavior depends on pinned vs random mode.
  const skipNext = () =>
    wrap(async () => {
      if (enabled.length === 0) return;
      const currentId = now?.track_id;
      let nextTrack: AudioTrack;
      if (now?.is_pinned) {
        // Walk the list in order from the current track.
        const idx = enabled.findIndex((t) => t.id === currentId);
        nextTrack = idx >= 0 ? enabled[(idx + 1) % enabled.length] : enabled[0];
      } else {
        const pool =
          enabled.length > 1 ? enabled.filter((t) => t.id !== currentId) : enabled;
        nextTrack = pool[Math.floor(Math.random() * pool.length)];
      }
      // Preserve whichever mode we're in.
      await obsApi.setNowPlayingAudio({
        track_id: nextTrack.id,
        is_pinned: !!now?.is_pinned,
        is_paused: false,
      });
    });

  const toggleEnabled = (track: AudioTrack) =>
    wrap(() =>
      api(`/api/audio/track/${track.id}/`, {
        method: 'PATCH',
        body: { enabled: !track.enabled },
      }),
    );

  const unregisterScene = (sceneName: string) =>
    wrap(async () => {
      // Source-file edit + file delete — confirm so a misclick doesn't wipe
      // an authored scene.
      const ok = window.confirm(
        `Unregister ${sceneName}?\n\n` +
          'This rewrites the zelda franchise module and deletes the .tsx file. ' +
          'Undo with git checkout.',
      );
      if (!ok) return;
      await obsApi.unregisterScene(sceneName);
      setRemovedScenes((prev) => {
        const next = new Set(prev);
        next.add(sceneName);
        return next;
      });
    });

  const allGames = useMemo(
    () =>
      Object.keys(groupByGame(tracks ?? [])).sort((a, b) =>
        cleanGameName(a).localeCompare(cleanGameName(b)),
      ),
    [tracks],
  );
  // Franchises present, with how many games each holds, for the dropdown.
  const franchiseOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of allGames) counts.set(franchiseOf(g), (counts.get(franchiseOf(g)) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [allGames]);
  // Game dropdown narrows to the selected franchise.
  const gameOptions = useMemo(
    () => allGames.filter((g) => !franchise || franchiseOf(g) === franchise),
    [allGames, franchise],
  );
  const q = query.trim().toLowerCase();
  // Apply franchise + game + search, then group the survivors into cards
  // (alphabetical so the long list is navigable).
  const groups = useMemo(() => {
    const matched = (tracks ?? []).filter((t) => {
      const g = t.game || 'Unknown';
      if (franchise && franchiseOf(g) !== franchise) return false;
      if (gameFilter && g !== gameFilter) return false;
      if (q && !`${t.title} ${t.artist} ${g}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return Object.fromEntries(
      Object.entries(groupByGame(matched)).sort((a, b) =>
        cleanGameName(a[0]).localeCompare(cleanGameName(b[0])),
      ),
    );
  }, [tracks, franchise, gameFilter, q]);
  const shownGameCount = Object.keys(groups).length;
  const shownTrackCount = Object.values(groups).reduce((n, ts) => n + ts.length, 0);
  const enabledCount = enabled.length;
  const isPaused = !!now?.is_paused;
  const isPinned = !!now?.is_pinned;

  return (
    <>
      <div className="control-card">
        <header className="d-flex justify-content-between align-items-baseline flex-wrap gap-2">
          <h2 className="m-0">Music</h2>
          <div className="small text-white-50">
            {enabledCount} / {tracks?.length ?? 0} tracks enabled · mode:{' '}
            <strong>{isPinned ? 'pinned' : 'random'}</strong>
            {isPaused && <span className="badge bg-warning text-dark ms-2">PAUSED</span>}
          </div>
        </header>

        <div className="mt-3 d-flex flex-wrap gap-2 align-items-center">
          <div>
            <div className="small text-white-50">Now playing</div>
            <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: '1.3rem' }}>
              {now?.track ? (
                <>
                  {now.track.title}{' '}
                  {now.track.artist && (
                    <span className="text-white-50">— {now.track.artist}</span>
                  )}
                </>
              ) : (
                <span className="text-white-50">Nothing pinned — random rotation</span>
              )}
            </div>
          </div>
          <div className="ms-auto control-btn-row">
            <button
              className={`btn btn-sm ${isPaused ? 'btn-success' : 'btn-warning'}`}
              disabled={busy || !now?.track_id}
              onClick={togglePaused}
              title={isPaused ? 'Resume playback' : 'Pause playback'}
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button
              className="btn btn-bloodmoon btn-sm"
              disabled={busy || enabledCount === 0}
              onClick={skipNext}
              title={
                isPinned
                  ? 'Advance to the next track in the list'
                  : 'Pick a different random track'
              }
            >
              ⏭ Next {isPinned ? '(in list)' : '(random)'}
            </button>
            <button
              className="btn btn-outline-light btn-sm"
              disabled={busy || (!isPinned && !now?.track_id)}
              onClick={backToRandom}
              title="Clear the pinned track and resume random rotation"
            >
              ↻ Back to random
            </button>
          </div>
        </div>

        <div className="mt-3 d-flex flex-wrap gap-2 align-items-center">
          <span className="small text-white-50 me-1">Visualiser</span>
          {VIS_STYLES.map(([val, label]) => {
            const active = (now?.visualiser_style ?? 'bars') === val;
            return (
              <button
                key={val}
                className={`btn btn-sm ${active ? 'btn-bloodmoon' : 'btn-outline-light'}`}
                disabled={busy}
                onClick={() => setVisualiser(val)}
                title={`Use the ${label} visualiser on /obs/audio-countdown`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {err && <p className="text-danger mt-2">{err}</p>}
      </div>

      <div className="control-card">
        <div className="d-flex flex-wrap gap-3 align-items-end">
          <div>
            <label className="small text-white-50 d-block mb-1">Franchise</label>
            <select
              className="form-select form-select-sm"
              value={franchise}
              onChange={(e) => {
                setFranchise(e.target.value);
                setGameFilter('');
              }}
            >
              <option value="">All franchises</option>
              {franchiseOptions.map(([f, n]) => (
                <option key={f} value={f}>
                  {f} ({n})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="small text-white-50 d-block mb-1">Game</label>
            <select
              className="form-select form-select-sm"
              value={gameFilter}
              onChange={(e) => setGameFilter(e.target.value)}
            >
              <option value="">All games</option>
              {gameOptions.map((g) => (
                <option key={g} value={g}>
                  {cleanGameName(g)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-grow-1" style={{ minWidth: 180 }}>
            <label className="small text-white-50 d-block mb-1">Search</label>
            <input
              className="form-control form-control-sm"
              type="search"
              placeholder="Title, artist or game…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {(franchise || gameFilter || query) && (
            <button
              className="btn btn-outline-light btn-sm"
              onClick={() => {
                setFranchise('');
                setGameFilter('');
                setQuery('');
              }}
            >
              Clear
            </button>
          )}
          <div className="small text-white-50 ms-auto">
            {shownGameCount} game{shownGameCount === 1 ? '' : 's'} · {shownTrackCount} track
            {shownTrackCount === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {shownGameCount === 0 && (
        <div className="control-card">
          <p className="m-0 text-white-50">No tracks match your filters.</p>
        </div>
      )}

      {Object.entries(groups).map(([game, gameTracks]) => {
        const theme = themeFor(game);
        const scenes = (theme.scenes ?? []).filter(
          (S) => !removedScenes.has(S.displayName || S.name),
        );
        const isOpen = !!previewOpen[game];
        return (
        <div className="control-card" key={game}>
          <header className="d-flex justify-content-between align-items-baseline flex-wrap gap-2">
            <h2 style={{ fontSize: '1.2rem' }} className="m-0">{cleanGameName(game)}</h2>
            <button
              className="btn btn-outline-light btn-sm"
              onClick={() =>
                setPreviewOpen((s) => ({ ...s, [game]: !s[game] }))
              }
              title="Preview the OBS audio-countdown scenes registered to this game"
            >
              {isOpen ? 'Hide scenes' : `Preview scenes (${scenes.length})`}
            </button>
          </header>
          {isOpen && (
            scenes.length === 0 ? (
              <p className="scene-preview-empty">
                No custom scene registered — falls back to the default Bloodmoon look.
              </p>
            ) : (
              <div className="scene-preview-row">
                {scenes.map((Scene, i) => {
                  const sceneName = Scene.displayName || Scene.name || '';
                  const canDelete = /^[A-Z][A-Za-z0-9]+Scene$/.test(sceneName);
                  return (
                    <div className="scene-preview-tile" key={sceneName || i}>
                      <ScenePreview Scene={Scene} theme={theme} width={320} />
                      <div className="scene-preview-tile-footer">
                        <span className="scene-preview-label">
                          {sceneName || `Scene ${i + 1}`}
                        </span>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          disabled={busy || !canDelete}
                          onClick={() => unregisterScene(sceneName)}
                          title={
                            canDelete
                              ? 'Delete this scene file and remove it from the zelda franchise module'
                              : 'Scene name not detectable (likely a minified build)'
                          }
                        >
                          🗑 Delete Scene
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
          <table className="control-table">
            <thead>
              <tr>
                <th></th>
                <th>Title</th>
                <th>Artist</th>
                <th>OCR ID</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {gameTracks.map((t) => {
                const isNow = now?.track_id === t.id;
                return (
                  <tr
                    key={t.id}
                    style={
                      isNow ? { background: 'rgba(231,19,71,0.25)' } : undefined
                    }
                  >
                    <td>
                      <button
                        className={`btn btn-sm ${isNow ? 'btn-warning' : 'btn-bloodmoon'}`}
                        disabled={busy || !t.enabled}
                        onClick={() => playTrack(t.id)}
                        title={t.enabled ? 'Pin and play this track' : 'Track is disabled'}
                      >
                        {isNow ? '♫ Playing' : '▶ Play'}
                      </button>
                    </td>
                    <td>
                      <strong>{t.title}</strong>
                    </td>
                    <td className="text-white-50">{t.artist || '—'}</td>
                    <td>
                      <code className="text-white-50">{t.ocr_id}</code>
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${t.enabled ? 'btn-outline-light' : 'btn-outline-danger'}`}
                        disabled={busy}
                        onClick={() => toggleEnabled(t)}
                      >
                        {t.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        );
      })}

      <div className="control-card">
        <h2 style={{ fontSize: '1.2rem' }}>Add more music</h2>
        <p>Pull more Zelda OCRemix tracks by scraping a game's OCRemix page:</p>
        <code style={{ display: 'block', padding: '0.5rem', background: 'rgba(0,0,0,0.4)' }}>
          docker compose exec backend python manage.py scrape_ocremix --all-zelda
        </code>
        <p className="small text-white-50 mt-2">
          Or scrape one specific game by id:{' '}
          <code>--game-id 95359</code>. Find ids on{' '}
          <a className="text-warning" href="https://ocremix.org/" target="_blank" rel="noreferrer">
            ocremix.org
          </a>{' '}
          — the number in the URL is what you want.
        </p>
      </div>
    </>
  );
}

function groupByGame(tracks: AudioTrack[]): Record<string, AudioTrack[]> {
  const out: Record<string, AudioTrack[]> = {};
  for (const t of tracks) {
    const key = t.game || 'Unknown';
    (out[key] ??= []).push(t);
  }
  return out;
}

function cleanGameName(raw: string): string {
  return raw.split('[')[0].trim();
}

// Visualiser styles offered on the control page (label per value). 'auto'
// rotates through the concrete styles per track on the overlay.
const VIS_STYLES: Array<[VisualiserStyle, string]> = [
  ['bars', 'Bars'],
  ['mirror', 'Mirror'],
  ['waveform', 'Waveform'],
  ['radial', 'Radial'],
  ['wave', 'Wave'],
  ['auto', 'Auto'],
];

// Coarse franchise buckets for the library filter. First keyword hit wins;
// keys are matched as lowercase substrings of the game label. Anything that
// matches nothing lands in "Other". (Zelda labels all carry "zelda".)
const FRANCHISES: Array<[string, string[]]> = [
  ['Zelda', ['zelda']],
  ['Final Fantasy', ['final fantasy']],
  ['Chrono', ['chrono']],
  ['Mega Man', ['mega man', 'rockman']],
  ['Sonic', ['sonic']],
  ['Mario', ['mario']],
  ['Donkey Kong', ['donkey kong', 'diddy kong']],
  ['Metroid', ['metroid']],
  ['Castlevania', ['castlevania', 'akumajo', 'akumajō', 'dracula']],
  ['Street Fighter', ['street fighter']],
  ['EarthBound', ['earthbound', 'mother']],
  ['DuckTales', ['ducktales']],
  ['Kirby', ['kirby']],
  ['Pokémon', ['pokémon', 'pokemon', 'pokkén', 'pokken']],
  ['Metal Gear', ['metal gear']],
  ['Star Fox', ['star fox', 'starfox']],
  ['Smash Bros.', ['smash bros']],
];

function franchiseOf(game: string): string {
  const g = game.toLowerCase();
  for (const [label, keys] of FRANCHISES) {
    if (keys.some((k) => g.includes(k))) return label;
  }
  return 'Other';
}
