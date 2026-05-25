import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { AudioTrack } from '@/lib/obsApi';
import { env } from '@/lib/env';
import { themeFor, themeToCssVars } from './zelda-themes';
import './audio-countdown.css';

/**
 * Pre-stream countdown with a frequency-bar visualiser fed by a Zelda OCRemix
 * playlist (proxied through Django for CORS).
 *
 * Track selection logic:
 *   - Poll /api/audio/now-playing/ — if the control panel has pinned a track,
 *     play that one.
 *   - Otherwise pick a random enabled track.
 *   - On `ended`, advance to the next random track AND PUT it back to
 *     /now-playing/ so the control panel reflects what's actually playing.
 */
export function AudioCountdown() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 5000);
  const { data: pinned } = usePolledQuery(obsApi.nowPlayingAudio, 1500);
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [current, setCurrent] = useState<AudioTrack | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [started, setStarted] = useState(false);
  const [trackRemaining, setTrackRemaining] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  // Mirrors `pinned?.is_paused` so callbacks (e.g. the canplay handler) can
  // read the latest paused state without re-subscribing the effect every
  // time pause is toggled — re-subscribing would call audio.load() and
  // restart the track from zero.
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = !!pinned?.is_paused;
  }, [pinned?.is_paused]);

  // Countdown tick.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  // Load playlist once.
  useEffect(() => {
    void obsApi.audioPlaylist().then((list) => {
      const enabled = list.filter((t) => t.enabled);
      const absolute = enabled.map((t) => ({
        ...t,
        url: new URL(t.url, env.VITE_API_URL).toString(),
      }));
      setTracks(absolute);
    });
  }, []);

  // Honour the pinned track from the control panel; otherwise pick random.
  useEffect(() => {
    if (tracks.length === 0) return;
    const pinnedId = pinned?.track_id;
    if (pinnedId != null) {
      // Switch only if it's a different track.
      if (current?.id !== pinnedId) {
        const next = tracks.find((t) => t.id === pinnedId);
        if (next) setCurrent(next);
      }
    } else if (!current) {
      setCurrent(tracks[Math.floor(Math.random() * tracks.length)]);
    }
  }, [tracks, pinned, current]);

  const pickNext = (curr: AudioTrack | null): AudioTrack | null => {
    if (tracks.length === 0) return null;
    if (tracks.length === 1) return tracks[0];
    let next = curr;
    while (!next || next.id === curr?.id) {
      next = tracks[Math.floor(Math.random() * tracks.length)];
    }
    return next;
  };

  const pickNextInList = (curr: AudioTrack | null): AudioTrack | null => {
    if (tracks.length === 0) return null;
    const sorted = [...tracks].sort((a, b) => a.order - b.order || a.id - b.id);
    if (!curr) return sorted[0];
    const idx = sorted.findIndex((t) => t.id === curr.id);
    return idx >= 0 ? sorted[(idx + 1) % sorted.length] : sorted[0];
  };

  // Auto-advance on `ended` / `error`. Behaviour depends on the pinned flag:
  //   - pinned: walk the playlist in order, keep pinned=true
  //   - random: pick another random track, keep pinned=false
  // Either way we PUT back to /now-playing/ so the control panel reflects what's
  // actually playing.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const advance = () => {
      setCurrent((c) => {
        const wasPinned = !!pinned?.is_pinned;
        const next = wasPinned ? pickNextInList(c) : pickNext(c);
        if (next) {
          void obsApi
            .setNowPlayingAudio({ track_id: next.id, is_pinned: wasPinned, is_paused: false })
            .catch(() => {});
        }
        return next;
      });
    };
    const onEnded = () => advance();
    const onError = () => {
      console.warn('Audio failed for track', current?.title);
      advance();
    };
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks, current, pinned]);

  // Respond to is_paused from the control panel.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !started) return;
    if (pinned?.is_paused) {
      audio.pause();
    } else if (audio.paused && current) {
      void audio.play().catch(() => {});
    }
  }, [pinned?.is_paused, current, started]);

  // When `current` changes, force a fresh load on the audio element and wait
  // for `canplay` before kicking play(). Calling play() immediately after a
  // src swap is a race the bigger MP3s can lose — the element rejects with
  // "no supported sources" because metadata hasn't been fetched yet.
  useEffect(() => {
    if (!started) return;
    const audio = audioRef.current;
    if (!audio || !current) return;

    // React already updated the src attribute via the JSX prop. Force load()
    // so the element starts fetching the new source immediately.
    audio.load();

    const onCanPlay = () => {
      // Read from the ref so we honour pauses that landed *during* load
      // without making `is_paused` a dependency of this effect.
      if (pausedRef.current) return;
      void audioCtxRef.current?.resume();
      audio.play().catch((err) => {
        // Real failures (404, decode error, autoplay block) bubble here.
        console.warn(`audio.play() rejected for "${current.title}":`, err);
      });
    };

    audio.addEventListener('canplay', onCanPlay, { once: true });
    return () => audio.removeEventListener('canplay', onCanPlay);
  }, [started, current]);

  // Track playback progress so the top-of-screen bar reflects time remaining.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const update = () => {
      const dur = audio.duration;
      if (!Number.isFinite(dur) || dur <= 0) {
        setTrackRemaining(1);
        return;
      }
      const left = Math.max(0, (dur - audio.currentTime) / dur);
      setTrackRemaining(left);
    };
    audio.addEventListener('timeupdate', update);
    audio.addEventListener('loadedmetadata', update);
    audio.addEventListener('durationchange', update);
    audio.addEventListener('emptied', () => setTrackRemaining(1));
    return () => {
      audio.removeEventListener('timeupdate', update);
      audio.removeEventListener('loadedmetadata', update);
      audio.removeEventListener('durationchange', update);
    };
  }, [current]);

  // Detect OBS browser source (it sets a custom UA) and treat it as a gesture.
  useEffect(() => {
    if (/OBS\//i.test(navigator.userAgent)) {
      setStarted(true);
    }
  }, []);

  const handleStart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audioCtxRef.current) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AC();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceNodeRef.current = source;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
    void audioCtxRef.current.resume();
    void audio.play().catch(() => {});
    setStarted(true);
  };

  // Visualiser RAF loop. Reads the live --ac-primary / --ac-secondary CSS
  // vars from .ac-stage each frame so the bars retint as the theme crossfades.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const tick = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const bars = 96;
      const bw = w / bars;
      const stage =
        canvas.closest('.ac-stage') ?? document.documentElement;
      const css = window.getComputedStyle(stage as Element);
      const top = css.getPropertyValue('--ac-primary').trim() || '#e71347';
      const bottom = css.getPropertyValue('--ac-secondary').trim() || '#62182f';
      const analyser = analyserRef.current;
      const data = dataRef.current;
      if (analyser && data) {
        analyser.getByteFrequencyData(data as unknown as Uint8Array<ArrayBuffer>);
        const step = data.length / bars;
        for (let i = 0; i < bars; i++) {
          const value = data[Math.floor(i * step)] / 255;
          const bh = Math.max(value * h, 4);
          paintBar(ctx, i * bw + 1, h - bh, bw - 2, bh, value, top, bottom);
        }
      } else {
        for (let i = 0; i < bars; i++) {
          const amp = (Math.sin(Date.now() / 200 + i / 3) + 1) / 2;
          const bh = (amp * h) / 2 + 6;
          paintBar(ctx, i * bw + 1, h - bh, bw - 2, bh, amp * 0.5, top, bottom);
        }
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };
    tick();
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  let remaining = 0;
  if (event?.start_time) {
    remaining = Math.max(
      0,
      Math.floor((Date.parse(event.start_time) - now) / 1000),
    );
  }

  // Theme from the pinned track first (arrives via 1.5s poll) and fall back
  // to `current.game` (3s playlist poll). Picking the faster source means
  // the scene appears within ~1.5s of pinning, not 3-6s later.
  const themedGame = pinned?.track?.game ?? current?.game;
  const theme = useMemo(() => themeFor(themedGame), [themedGame]);
  // When the theme provides multiple scenes, pick one at random and stick
  // with it for as long as this theme is active. Re-rolls on theme change.
  const SceneComponent = useMemo(() => {
    if (!theme.scenes || theme.scenes.length === 0) return undefined;
    return theme.scenes[Math.floor(Math.random() * theme.scenes.length)];
  }, [theme]);

  return (
    <div className="ac-stage" style={themeToCssVars(theme)}>
      <div
        className="ac-track-progress"
        style={{ transform: `scaleX(${trackRemaining})` }}
        aria-hidden
      />
      <SceneCrossfade themeKey={theme.label} Scene={SceneComponent} />
      <h1 className="ac-title">{event?.name ?? 'ZeldathonUK'}</h1>
      <div className="ac-clock">{formatDhms(remaining)}</div>
      <div className="ac-sub">until stream start</div>
      {current && (
        <div className="ac-nowplaying">
          <div className="ac-np-label">Now playing</div>
          <div className="ac-np-title">
            {current.title}
            <span className="ac-np-theme">{theme.label}</span>
          </div>
          <div className="ac-np-artist">
            {current.artist || 'OC ReMix'}
            {current.game && (
              <>
                {' · '}
                <em>{cleanGameName(current.game)}</em>
              </>
            )}
          </div>
        </div>
      )}
      <canvas ref={canvasRef} width={1920} height={300} className="ac-visualiser" />
      <audio ref={audioRef} src={current?.url} crossOrigin="anonymous" autoPlay />
      {!started && (
        <button
          type="button"
          className="ac-start-gesture"
          onClick={handleStart}
          aria-label="Start audio"
        >
          <span className="ac-start-icon">▶</span>
          <span className="ac-start-label">Click to start audio</span>
          <span className="ac-start-hint">
            Browsers require a user gesture before audio can play. OBS browser
            sources start automatically.
          </span>
        </button>
      )}
    </div>
  );
}

function paintBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  intensity: number,
  topColor: string,
  bottomColor: string,
) {
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, bottomColor);
  ctx.fillStyle = grad;
  ctx.globalAlpha = 0.6 + intensity * 0.4;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
}

function formatDhms(totalSeconds: number): string {
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const ss = String(s).padStart(2, '0');
  if (d > 0) {
    return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${ss}s`;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${ss}`;
}

function cleanGameName(raw: string): string {
  return raw.split('[')[0].trim();
}

interface SceneLayer {
  key: string;
  Scene?: ComponentType;
  state: 'entering' | 'active' | 'exiting';
}

const SCENE_FADE_MS = 1200;

/**
 * Crossfades between game-specific scenes. When `themeKey` changes we mark the
 * current layer as `exiting`, append a new `entering` layer, then promote it
 * to `active` on the next animation frame so the CSS opacity transition runs.
 * Old layers are cleaned up after the fade completes.
 */
function SceneCrossfade({
  themeKey,
  Scene,
}: {
  themeKey: string;
  Scene?: ComponentType;
}) {
  const [layers, setLayers] = useState<SceneLayer[]>(() => [
    { key: `${themeKey}-init`, Scene, state: 'active' },
  ]);
  const lastKey = useRef(themeKey);

  useEffect(() => {
    if (themeKey === lastKey.current) return;
    lastKey.current = themeKey;
    const newKey = `${themeKey}-${Date.now()}`;
    setLayers((prev) => [
      ...prev.map((l) => ({ ...l, state: 'exiting' as const })),
      { key: newKey, Scene, state: 'entering' as const },
    ]);
    // Promote entering → active on next frame so the transition fires.
    const promote = window.requestAnimationFrame(() => {
      setLayers((prev) =>
        prev.map((l) => (l.key === newKey ? { ...l, state: 'active' } : l)),
      );
    });
    const cleanup = window.setTimeout(() => {
      setLayers((prev) => prev.filter((l) => l.state !== 'exiting'));
    }, SCENE_FADE_MS + 100);
    return () => {
      window.cancelAnimationFrame(promote);
      window.clearTimeout(cleanup);
    };
  }, [themeKey, Scene]);

  return (
    <>
      {layers.map(({ key, Scene, state }) => (
        <div key={key} className="ac-scene-layer" data-state={state}>
          {Scene && <Scene />}
        </div>
      ))}
    </>
  );
}
