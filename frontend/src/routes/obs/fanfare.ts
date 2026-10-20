/**
 * Short procedurally-generated fanfare for the ChestAnnouncer reveal.
 *
 * Plays an ascending major-triad arpeggio (root, third, fifth, octave)
 * followed by a held octave — generic music-theory building blocks,
 * synthesised on the fly via Web Audio oscillators; no sample files.
 *
 * Audio is lazily-initialised on the first `playFanfare` call so the
 * AudioContext isn't constructed before any user gesture happens (which
 * would trip Chrome's autoplay policy in a plain browser preview).
 *
 * **OBS note:** OBS's bundled Chromium needs the autoplay-policy flag
 * to allow audio without a user gesture. Recent OBS versions set this
 * by default; if the fanfare plays in a regular browser tab but not in
 * the OBS source, check Browser Source → Custom CSS / Properties or
 * launch OBS with `--autoplay-policy=no-user-gesture-required`. Also
 * make sure "Control audio via OBS" is enabled on the source so the
 * audio gets routed into your scene.
 */

let ctx: AudioContext | null = null;

/** Construct the shared AudioContext. Non-Chrome Browsers will refuse to 
 * build one before any user gesture in dev; Chrome it may start suspended; 
 * that's OK — we return null and the caller silent-fails. */
function getCtx(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

// Chrome's resume() never settles (rather than rejecting) when autoplay
// policy blocks it, so an unguarded await hangs the caller forever.
// 250 ms is far longer than a permitted resume takes.
const RESUME_TIMEOUT_MS = 250;

// Read through a call so TS doesn't carry a stale narrowing across the 
// await - resume() changes `state` underneath us.
const isRunning = (ac: AudioContext): boolean => ac.state === 'running';

async function resumeWithTimeout(ac: AudioContext): Promise<boolean> {
  if (isRunning(ac)) return true;
  try {
    await Promise.race([
      ac.resume(),
      new Promise((r) => window.setTimeout(r, RESUME_TIMEOUT_MS)),
    ]);
  } catch {
    // Some engines do reject - same outcome.
  }
  return isRunning(ac);
}

interface FanfareOptions {
  /** Peak gain per note (0–1). Default 0.18 — louder is jarring under TTS. */
  volume?: number;
  /** Oscillator waveform. Square = chiptune, triangle = softer. */
  waveform?: OscillatorType;
}

interface Note {
  /** Frequency in Hz. */
  freq: number;
  /** Time offset from playback start, in seconds. */
  start: number;
  /** Note duration in seconds. */
  dur: number;
}

// Quarter-note ≈ 130 ms — quick, triumphant pulse. First three notes
// are a 16th-note climb; the final note is a held quarter at the octave
// that sustains over the card-pop animation.
const ARPEGGIO: Note[] = [
  { freq: 523.25, start: 0.00, dur: 0.10 }, // C5
  { freq: 659.25, start: 0.09, dur: 0.10 }, // E5
  { freq: 783.99, start: 0.18, dur: 0.10 }, // G5
  { freq: 1046.5, start: 0.28, dur: 0.42 }, // C6 (held)
];

// Lookahead offset applied to every note (see comment in playFanfare).
const FANFARE_LOOKAHEAD_S = 0.06;

// Total audible duration in milliseconds: lookahead + last-note end.
// The chest announcer uses this to wait for the fanfare to finish
// before advancing to the next donation card.
const FANFARE_END_MS = Math.round(
  (FANFARE_LOOKAHEAD_S + ARPEGGIO[ARPEGGIO.length - 1].start
    + ARPEGGIO[ARPEGGIO.length - 1].dur) * 1000,
);

/**
 * Handle for an in-flight audio playback. Callers can wait on `ended`
 * to know when the sound is fully done, or `cancel()` to stop it early.
 * Re-used by `playSound` in chestSoundTriggers.ts so the chest
 * announcer can handle fanfare and trigger sounds with one code path.
 */
export interface PlaybackHandle {
  /** Resolves when playback finishes (naturally or via cancel). Never rejects. */
  ended: Promise<void>;
  /** Stop playback immediately. Idempotent. */
  cancel: () => void;
}

/**
 * Schedule the fanfare and return a handle the caller can wait on.
 * `ended` resolves once the last note has decayed — the chest announcer
 * uses this to hold the donation card until playback is fully done
 * before transitioning to confetti.
 *
 * Returns `null` if audio can't start at all (no AudioContext, autoplay
 * policy blocked the resume, or context stuck non-running) so the
 * caller can fall back to a fixed-duration timer.
 */
export async function playFanfare(
  options: FanfareOptions = {},
): Promise<PlaybackHandle | null> {
  const { volume = 0.18, waveform = 'square' } = options;
  const ac = getCtx();
  if (!ac) return null;
  if (!(await resumeWithTimeout(ac))) return null;

  // Master gain → low-pass softens the square wave so it doesn't sound
  // brittle on streaming speakers.
  const master = ac.createGain();
  master.gain.value = 1;
  const lowpass = ac.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 4000;
  lowpass.Q.value = 0.5;
  master.connect(lowpass);
  lowpass.connect(ac.destination);

  // 60 ms lookahead so the first note isn't scheduled in the past on
  // engines where resume() returns slightly before the clock starts
  // ticking. Audible latency is fine — the card-pop animation runs for
  // 260 ms, plenty of room.
  const now = ac.currentTime + FANFARE_LOOKAHEAD_S;
  const oscillators: OscillatorNode[] = [];
  for (const n of ARPEGGIO) {
    const osc = ac.createOscillator();
    osc.type = waveform;
    osc.frequency.value = n.freq;

    const g = ac.createGain();
    const noteStart = now + n.start;
    const noteEnd = noteStart + n.dur;
    // Exponential ramps require a non-zero target — start at 0.0001 then
    // ramp to peak in 15 ms, decay back to 0.001 over the note duration.
    g.gain.setValueAtTime(0.0001, noteStart);
    g.gain.exponentialRampToValueAtTime(volume, noteStart + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, noteEnd);

    osc.connect(g);
    g.connect(master);

    osc.start(noteStart);
    osc.stop(noteEnd + 0.05);
    oscillators.push(osc);
  }

  let endResolve: (() => void) | null = null;
  const ended = new Promise<void>((resolve) => {
    endResolve = resolve;
  });
  let cancelled = false;
  const endTimer = window.setTimeout(() => {
    if (endResolve) endResolve();
  }, FANFARE_END_MS);

  return {
    ended,
    cancel: () => {
      if (cancelled) return;
      cancelled = true;
      window.clearTimeout(endTimer);
      for (const osc of oscillators) {
        try {
          osc.stop();
        } catch {
          /* already stopped */
        }
      }
      if (endResolve) endResolve();
    },
  };
}

/**
 * Eagerly construct the AudioContext so it's ready when the first
 * donation arrives. Must be called from a user-gesture handler to
 * satisfy autoplay policy in dev browsers — for OBS browser sources,
 * the autoplay-policy launch flag means it works on mount.
 */
export async function warmUpFanfare(): Promise<boolean> {
  const ac = getCtx();
  return ac ? resumeWithTimeout(ac) : false;
}

/**
 * Wether audio can play right now, without a user gesture. Safe to call on
 * mount: constructing the context without a gesture is allowed (it starts 
 * suspended), and resume() succeeds only if autoplay policy permits - true
 * in OBS's browser source, false in a fresh browser tab until a click.
 */
export const probeAudioUnlocked = warmUpFanfare;

export function onAudioStateChange(cb: (running: boolean) => void): () => void {
  const ac = getCtx();
  if (!ac) return () => {};
  const h = () => cb(isRunning(ac));
  ac.addEventListener('statechange', h);
  return () => ac.removeEventListener('statechange', h);
}
