import { useMemo, useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { AudioTrack } from '@/lib/obsApi';
import { api } from '@/lib/api';

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

  const groups = groupByGame(tracks ?? []);
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

        {err && <p className="text-danger mt-2">{err}</p>}
      </div>

      {Object.entries(groups).map(([game, gameTracks]) => (
        <div className="control-card" key={game}>
          <h2 style={{ fontSize: '1.2rem' }}>{cleanGameName(game)}</h2>
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
      ))}

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
