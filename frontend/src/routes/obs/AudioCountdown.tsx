import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { AudioTrack, VisualiserStyle } from '@/lib/obsApi';
import { env } from '@/lib/env';
import { themeFor, themeToCssVars } from './game-themes';
import { onThemeChanged } from '@/lib/themeBus';
import './audio-countdown.css';

/** Fallback when the active sitewide theme hasn't set its own logo. The
 *  animated gold-flash Zeldathon wordmark gives the pre-stream screen a
 *  living, theatrical feel; the static gold mark is reserved for places
 *  that need a calmer brand (header, favicon, social). */
const DEFAULT_AC_LOGO = '/assets/img/brand/logo/Zeldathon-Logo-2026-Gold-Flash.svg';

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
  // Theme push: re-fetch the moment another tab swaps themes so the
  // wordmark in the title swaps with it. See `lib/themeBus.ts`.
  const [themeBump, setThemeBump] = useState(0);
  useEffect(() => onThemeChanged(() => setThemeBump((b) => b + 1)), []);

  const { data: event } = usePolledQuery(obsApi.activeEvent, 5000);
  const { data: themeSettings } = usePolledQuery(
    obsApi.themeSettings,
    60_000,
    [themeBump],
    { cacheKey: 'zeldathon-theme' },
  );
  const titleLogo = themeSettings?.logo_url || DEFAULT_AC_LOGO;
  const { data: pinned } = usePolledQuery(obsApi.nowPlayingAudio, 1500);
  const { data: currentlyPlaying } = usePolledQuery(obsApi.currentlyPlaying, 4000);
  const { data: schedule } = usePolledQuery(
    () => (event ? obsApi.schedule(event.id) : Promise.resolve([])),
    10_000,
    [event?.id],
  );
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
  const timeDataRef = useRef<Uint8Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  // Visualiser style, mirrored from the now-playing poll so the RAF loop (which
  // mounts once) can switch renderers live without re-subscribing. 'auto' is
  // resolved to a concrete style per track id below.
  const styleRef = useRef<VisualiserStyle>('bars');
  // Bass-reactive particles for the 'wave' style — kept across frames.
  const particlesRef = useRef<Particle[]>([]);
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

  // When a track is pinned and finishes, advance to the next track *from
  // the same game* (not the entire playlist). Wraps within the game so a
  // pinned game keeps looping its own tracks instead of jumping to a
  // random/other game.
  const pickNextInList = (curr: AudioTrack | null): AudioTrack | null => {
    if (tracks.length === 0) return null;
    if (!curr) {
      const sorted = [...tracks].sort((a, b) => a.order - b.order || a.id - b.id);
      return sorted[0];
    }
    const sameGame = tracks
      .filter((t) => t.game === curr.game)
      .sort((a, b) => a.order - b.order || a.id - b.id);
    if (sameGame.length === 0) return null;
    if (sameGame.length === 1) return sameGame[0];
    const idx = sameGame.findIndex((t) => t.id === curr.id);
    return idx >= 0 ? sameGame[(idx + 1) % sameGame.length] : sameGame[0];
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

  // Detect a broadcaster browser-source UA and treat it as a gesture so
  // production overlays auto-play without a manual click. Each app sets
  // its own marker in the User-Agent:
  //   • OBS Studio        → "OBS/<ver>"
  //   • Streamlabs Desktop → "slobs/<ver>"
  //   • XSplit Broadcaster → "XSplit/<ver>" or "XSP/<ver>"
  //   • vMix              → "vMix/<ver>"
  // Match any of them so the visualiser starts unattended in whichever
  // tool the streamer is using. Browsers (Chrome/Firefox/Safari) still
  // fall through to the click-to-start gate so we don't bypass the
  // autoplay policy when an operator opens the overlay for QA.
  useEffect(() => {
    if (/OBS\/|slobs\/|XSplit\/|XSP\/|vMix\//i.test(navigator.userAgent)) {
      setStarted(true);
    }
  }, []);

  // AudioContext + analyser bring-up. Runs whenever `started` flips
  // true, regardless of how it was triggered:
  //   • Manual click → handleStart()
  //   • Broadcaster auto-start (OBS / Streamlabs / XSplit / vMix)
  // Previously this lived inline in handleStart, which meant the
  // broadcaster path set `started=true` but skipped the analyser
  // setup — audio played fine, but the RAF loop saw `analyser === null`
  // and fell back to the synthetic sine wave instead of reacting to
  // the real audio. Wiring it from a `started`-effect keeps both
  // paths consistent.
  useEffect(() => {
    if (!started) return;
    if (audioCtxRef.current) return; // one-shot
    const audio = audioRef.current;
    if (!audio) return;
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
    timeDataRef.current = new Uint8Array(analyser.fftSize);
    void ctx.resume();
  }, [started]);

  // Keep styleRef in sync with the control-panel selection. 'auto' rotates
  // through the concrete styles keyed by the current track id, so it holds
  // steady while a track plays and changes when the track does.
  useEffect(() => {
    const sel = pinned?.visualiser_style ?? 'bars';
    if (sel === 'auto') {
      const id = pinned?.track_id ?? current?.id ?? 0;
      styleRef.current = AUTO_CYCLE[Math.abs(id) % AUTO_CYCLE.length];
    } else {
      styleRef.current = sel;
    }
  }, [pinned?.visualiser_style, pinned?.track_id, current?.id]);

  const handleStart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    // The AudioContext effect above handles setup once `started` is
    // true; here we just preserve the gesture intent by kicking off
    // play() directly (the canplay handoff in the [started, current]
    // effect would also catch it, but starting straight away gives the
    // most responsive feel for a click).
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
      const stage = canvas.closest('.ac-stage') ?? document.documentElement;
      const css = window.getComputedStyle(stage as Element);
      const top = css.getPropertyValue('--ac-primary').trim() || '#e71347';
      const bottom = css.getPropertyValue('--ac-secondary').trim() || '#62182f';

      const analyser = analyserRef.current;
      const freq = dataRef.current;
      const time = timeDataRef.current;
      let freqData: Uint8Array;
      let timeData: Uint8Array;
      if (analyser && freq && time) {
        analyser.getByteFrequencyData(freq as unknown as Uint8Array<ArrayBuffer>);
        analyser.getByteTimeDomainData(time as unknown as Uint8Array<ArrayBuffer>);
        freqData = freq;
        timeData = time;
      } else {
        // No live audio yet (pre-Start): synthesize so every style animates.
        const t = Date.now() / 1000;
        freqData = synthFreq(t);
        timeData = synthTime(t);
      }

      const v: VizContext = {
        ctx, w, h, top, bottom,
        freq: freqData, time: timeData, particles: particlesRef.current,
      };
      switch (styleRef.current) {
        case 'mirror': drawMirror(v); break;
        case 'waveform': drawWaveform(v); break;
        case 'radial': drawRadial(v); break;
        case 'wave': drawWave(v); break;
        default: drawBars(v);
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };
    tick();
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const eventStartMs = event ? Date.parse(event.start_time) : 0;
  const eventStarted = !!event && eventStartMs <= now;
  let remaining = 0;
  if (event?.start_time && !eventStarted) {
    remaining = Math.max(0, Math.floor((eventStartMs - now) / 1000));
  }

  // Live entry from the schedule (matches what the control panel marks as
  // currently playing). Picks the next still-pending top-level game as
  // up-next so the countdown screen always has context.
  const currentEntry = currentlyPlaying?.schedule_entry_detail ?? null;
  const upcoming = (schedule ?? [])
    .filter(
      (e) =>
        e.parent_entry == null && e.slot_type === 'game' && !e.is_completed,
    )
    .sort((a, b) => a.order - b.order);
  const nextEntry =
    upcoming.find((e) => !currentEntry || e.order > currentEntry.order) ?? null;

  // Countdown to the end of the currently-playing game. Prefer the entry's
  // real `started_at`; fall back to cumulative schedule time.
  let currentEndMs = 0;
  if (currentEntry) {
    if (currentEntry.started_at) {
      currentEndMs =
        Date.parse(currentEntry.started_at) +
        currentEntry.effective_minutes * 60_000;
    } else {
      // Cumulative schedule fallback — walk top-level entries until we hit
      // the live one, accounting for attached break minutes per slot.
      let cursor = eventStartMs;
      const topLevel = (schedule ?? [])
        .filter((e) => e.parent_entry == null)
        .sort((a, b) => a.order - b.order);
      const childMins = new Map<number, number>();
      for (const e of schedule ?? []) {
        if (e.parent_entry != null) {
          childMins.set(
            e.parent_entry,
            (childMins.get(e.parent_entry) ?? 0) + e.effective_minutes,
          );
        }
      }
      for (const top of topLevel) {
        if (top.id === currentEntry.id) {
          currentEndMs = cursor + currentEntry.effective_minutes * 60_000;
          break;
        }
        cursor += (top.effective_minutes + (childMins.get(top.id) ?? 0)) * 60_000;
      }
    }
  }
  const currentRemaining = currentEntry
    ? Math.max(0, Math.floor((currentEndMs - now) / 1000))
    : 0;

  // Active break (meal, sleep, etc.) attached to the live entry — when its
  // wall-clock window contains "now" we surface a break panel instead of
  // the game countdown.
  const liveBreak = (() => {
    if (!currentEntry) return null;
    const children = (schedule ?? []).filter(
      (e) => e.parent_entry === currentEntry.id,
    );
    if (children.length === 0) return null;
    const parentStartMs = currentEntry.started_at
      ? Date.parse(currentEntry.started_at)
      : currentEndMs - currentEntry.effective_minutes * 60_000;
    for (const child of children) {
      const start = parentStartMs + child.start_offset_minutes * 60_000;
      const end = start + child.effective_minutes * 60_000;
      if (now >= start && now < end) {
        return { entry: child, start, end };
      }
    }
    return null;
  })();
  const breakRemaining = liveBreak
    ? Math.max(0, Math.floor((liveBreak.end - now) / 1000))
    : 0;
  const breakMeta: Record<string, { label: string; icon: string }> = {
    start: { label: 'Stream start', icon: '🎬' },
    meal: { label: 'Meal break', icon: '🍽' },
    sleep: { label: 'Sleep break', icon: '💤' },
    break: { label: 'Break', icon: '☕' },
    end: { label: 'Stream end', icon: '🏁' },
    other: { label: 'Other', icon: '⭐' },
  };

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
      <h1 className="ac-title">
        <img
          className="ac-title-logo"
          src={titleLogo}
          alt={event?.name ?? 'ZeldathonUK'}
        />
        {event?.name && (
          /* Event-specific tagline (e.g. "15TH ANNIVERSARY") rendered
           * beneath the wordmark. The logo replaces the brand name; the
           * tagline keeps the event context the wordmark alone can't
           * convey. */
          <span className="ac-title-event">{stripBrand(event.name)}</span>
        )}
      </h1>
      {eventStarted && currentEntry && liveBreak ? (
        <>
          <div className="ac-now-game ac-now-game--break">
            <span className="ac-break-icon">
              {breakMeta[liveBreak.entry.slot_type]?.icon ?? '☕'}
            </span>
            {liveBreak.entry.display_title}
          </div>
          <div className="ac-clock"><DhmsClock seconds={breakRemaining} /></div>
          <div className="ac-sub">until we're back</div>
          <div className="ac-up-next">
            <span className="ac-up-next-label">Resuming</span>
            <span className="ac-up-next-title">{currentEntry.display_title}</span>
          </div>
        </>
      ) : eventStarted && currentEntry ? (
        <>
          <div className="ac-now-game">{currentEntry.display_title}</div>
          <div className="ac-clock"><DhmsClock seconds={currentRemaining} /></div>
          <div className="ac-sub">remaining on this game</div>
          {nextEntry && (
            <div className="ac-up-next">
              <span className="ac-up-next-label">Up next</span>
              <span className="ac-up-next-title">{nextEntry.display_title}</span>
            </div>
          )}
        </>
      ) : eventStarted ? (
        <>
          <div className="ac-clock ac-clock-small">LIVE</div>
          <div className="ac-sub">stream is in progress</div>
        </>
      ) : (
        <>
          <div className="ac-clock"><DhmsClock seconds={remaining} /></div>
          <div className="ac-sub">until stream start</div>
        </>
      )}
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
      {/*
        Deliberately no `autoPlay` here. The component gates playback on
        the `started` flag (toggled by `handleStart` after a click, or by
        the OBS-UA detection effect) and the `[started, current]` effect
        above wires up the canplay → play() handoff with the AudioContext
        resume. Adding `autoPlay` would race those gates and start the
        track before the user gesture (or before AudioContext is
        resumed), which is the bug we're avoiding.
       */}
      <audio ref={audioRef} src={current?.url} crossOrigin="anonymous" />
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

// ── Visualiser styles ──────────────────────────────────────────────────────
// Each renderer draws one frame onto the canvas from `freq` (0..255 frequency
// magnitudes) and/or `time` (0..255 time-domain, 128 = silence), tinted with
// the live theme colours. They're pure given the VizContext (particles carry
// the only cross-frame state). 'auto' rotates through these per track.
const AUTO_CYCLE: VisualiserStyle[] = ['bars', 'mirror', 'waveform', 'radial', 'wave'];

interface Particle {
  x: number;
  y: number;
  vy: number;
  r: number;
  life: number;
}

interface VizContext {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  top: string;
  bottom: string;
  freq: Uint8Array;
  time: Uint8Array;
  particles: Particle[];
}

// Reusable scratch buffers for the pre-Start synthetic animation (sized to the
// analyser's frequencyBinCount=128 / fftSize=256) so we don't allocate per frame.
const SYNTH_FREQ = new Uint8Array(128);
const SYNTH_TIME = new Uint8Array(256);

function synthFreq(t: number): Uint8Array {
  for (let i = 0; i < SYNTH_FREQ.length; i++) {
    const base = Math.sin(t * 2 + i / 6) * 0.5 + 0.5;
    const decay = 1 - i / SYNTH_FREQ.length; // bass-weighted like real spectra
    SYNTH_FREQ[i] = Math.max(0, Math.min(255, base * decay * 230));
  }
  return SYNTH_FREQ;
}

function synthTime(t: number): Uint8Array {
  for (let i = 0; i < SYNTH_TIME.length; i++) {
    const x = i / SYNTH_TIME.length;
    const wv = Math.sin(x * Math.PI * 6 + t * 4) * Math.sin(t * 1.3) * 0.5;
    SYNTH_TIME[i] = 128 + wv * 110;
  }
  return SYNTH_TIME;
}

function avg(arr: Uint8Array, from: number, to: number): number {
  let s = 0;
  const a = Math.max(0, from);
  const b = Math.min(arr.length, to);
  for (let i = a; i < b; i++) s += arr[i];
  return b > a ? s / (b - a) / 255 : 0;
}

function drawBars(v: VizContext): void {
  const { ctx, w, h, top, bottom, freq } = v;
  const bars = 96;
  const bw = w / bars;
  const step = freq.length / bars;
  for (let i = 0; i < bars; i++) {
    const value = freq[Math.floor(i * step)] / 255;
    const bh = Math.max(value * h, 4);
    paintBar(ctx, i * bw + 1, h - bh, bw - 2, bh, value, top, bottom);
  }
}

function drawMirror(v: VizContext): void {
  const { ctx, w, h, top, bottom, freq } = v;
  const bars = 80;
  const bw = w / bars;
  const cy = h / 2;
  const step = freq.length / bars;
  for (let i = 0; i < bars; i++) {
    const value = freq[Math.floor(i * step)] / 255;
    const bh = Math.max(value * (h / 2), 2);
    const x = i * bw + 1;
    const grad = ctx.createLinearGradient(0, cy - bh, 0, cy + bh);
    grad.addColorStop(0, top);
    grad.addColorStop(0.5, bottom);
    grad.addColorStop(1, top);
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.55 + value * 0.45;
    ctx.fillRect(x, cy - bh, bw - 2, bh * 2);
  }
  ctx.globalAlpha = 1;
  // centre seam glow
  ctx.strokeStyle = top;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(w, cy);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawWaveform(v: VizContext): void {
  const { ctx, w, h, top, bottom, time } = v;
  const n = time.length;
  const mid = h / 2;
  const amp = h * 0.42;
  const trace = (color: string, width: number, blur: number, alpha: number) => {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * w;
      const y = mid + ((time[i] - 128) / 128) * amp;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = blur;
    ctx.globalAlpha = alpha;
    ctx.stroke();
  };
  trace(bottom, 7, 4, 0.4); // soft underlay
  trace(top, 3, 18, 1); // bright core
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawRadial(v: VizContext): void {
  const { ctx, w, h, top, bottom, freq } = v;
  const cx = w / 2;
  const cy = h / 2;
  const base = Math.min(h * 0.34, 120);
  const bass = avg(freq, 0, 8);
  // pulsing core
  const coreR = base * 0.5 * (0.85 + bass * 0.5);
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
  core.addColorStop(0, top);
  core.addColorStop(1, bottom);
  ctx.fillStyle = core;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // spokes
  const N = 96;
  const inner = base * 0.55;
  ctx.lineCap = 'round';
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2 - Math.PI / 2;
    const value = freq[Math.floor((i * freq.length) / N)] / 255;
    const len = inner + value * base * 0.95;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    ctx.beginPath();
    ctx.moveTo(cx + ca * inner, cy + sa * inner);
    ctx.lineTo(cx + ca * len, cy + sa * len);
    ctx.strokeStyle = top;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.4 + value * 0.6;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawWave(v: VizContext): void {
  const { ctx, w, h, top, bottom, freq, particles } = v;
  const n = 96;
  const step = freq.length / n;
  // filled spectrum area
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * w;
    const value = freq[Math.floor(i * step)] / 255;
    const y = h - Math.max(value * h * 0.9, 3);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.globalAlpha = 0.55;
  ctx.fill();
  ctx.globalAlpha = 1;

  // bass-reactive particles rising off the curve
  const bass = avg(freq, 0, 6);
  if (bass > 0.55 && particles.length < 70) {
    const spawn = Math.round(bass * 3);
    for (let k = 0; k < spawn; k++) {
      particles.push({
        x: Math.random() * w,
        y: h - 10,
        vy: -(1 + bass * 4 + Math.random() * 2),
        r: 2 + Math.random() * 3,
        life: 1,
      });
    }
  }
  ctx.fillStyle = top;
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.y += p.vy;
    p.vy *= 0.99;
    p.life -= 0.012;
    if (p.life <= 0 || p.y < -10) {
      particles.splice(i, 1);
      continue;
    }
    ctx.globalAlpha = Math.max(0, p.life) * 0.85;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * Per-unit colour scheme mirrored from PreStreamPanel — each d/h/m/s
 * column takes a different theme slot so the countdown reads as a
 * little palette rather than a flat white digit run. Each entry falls
 * through `obs-accent → theme-*` so an unset CSS var never blanks the
 * column. The countdown's NUMBERS stay white; only the unit-letter
 * suffixes pick up these tints.
 */
const AC_UNIT_COLOR: Record<'d' | 'h' | 'm' | 's', string> = {
  h: 'var(--obs-accent, var(--theme-primary-bright, #3848a5))',
  d: 'var(--theme-accent-1, var(--theme-primary, #3d7d3d))',
  m: 'var(--theme-accent-2, var(--theme-secondary, #ddc24d))',
  s: 'var(--theme-accent-3, var(--theme-primary-bright, #b1322c))',
};

interface DhmsPart {
  value: string;
  unit: 'd' | 'h' | 'm' | 's';
}

/**
 * Always-suffix form of dhms, used so the per-unit colour scheme
 * above is visible regardless of how much time remains. Days drop
 * out of the result when they're zero (no "0d" prefix) but hours,
 * minutes, and seconds are always present so the layout doesn't
 * jump when a day rolls over.
 */
function dhmsParts(totalSeconds: number): DhmsPart[] {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  if (d > 0) {
    return [
      { value: String(d), unit: 'd' },
      { value: hh, unit: 'h' },
      { value: mm, unit: 'm' },
      { value: ss, unit: 's' },
    ];
  }
  return [
    { value: hh, unit: 'h' },
    { value: mm, unit: 'm' },
    { value: ss, unit: 's' },
  ];
}

/**
 * Pre-stream countdown clock renderer — keeps the numbers white and
 * tints each suffix (`d` / `h` / `m` / `s`) via AC_UNIT_COLOR so the
 * countdown reads as a multi-colour stat strip without the digits
 * themselves changing colour.
 */
function DhmsClock({ seconds }: { seconds: number }) {
  const parts = dhmsParts(seconds);
  return (
    <>
      {parts.map((p, i) => (
        <span key={p.unit}>
          <span style={{ color: '#fff' }}>{p.value}</span>
          <span style={{ color: AC_UNIT_COLOR[p.unit] }}>{p.unit}</span>
          {/* Flipped comparison + parens so the SWC JSX parser can't
            * mistake `<parts` for the start of a `<parts>` tag — using
            * `<` directly here tokenised as JSX and ran the file off
            * the cliff. */}
          {i === parts.length - 1 ? '' : ' '}
        </span>
      ))}
    </>
  );
}

function cleanGameName(raw: string): string {
  return raw.split('[')[0].trim();
}

/** Strip the "ZeldathonUK" / "Zeldathon" prefix from an event name when
 *  the wordmark logo already says it — leaves only the descriptive part
 *  (e.g. "ZeldathonUK 15th Anniversary" → "15th Anniversary"). Returns
 *  the original string when no brand prefix is present so non-standard
 *  event names render verbatim. */
function stripBrand(name: string): string {
  const trimmed = name.trim();
  const stripped = trimmed.replace(/^zeldathon(uk)?\b[\s:–—-]*/i, '').trim();
  return stripped || trimmed;
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
