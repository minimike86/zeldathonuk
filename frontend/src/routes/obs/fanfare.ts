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

/** Lazily construct the shared AudioContext. Browsers will refuse to
 *  build one before any user gesture in dev; that's OK — we return null
 *  and the caller silent-fails. */
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

/**
 * Fire-and-forget fanfare. Caller doesn't need to await — the function
 * resolves once the notes have been *scheduled*, not played. Returns a
 * promise mostly so we can `void playFanfare()` from a click handler
 * and let the async resume settle.
 */
export async function playFanfare(options: FanfareOptions = {}): Promise<void> {
  const { volume = 0.18, waveform = 'square' } = options;
  const ac = getCtx();
  if (!ac) return;

  // Properly *await* resume. Previously this was fire-and-forget, which
  // meant `ac.currentTime` was read while the context was still
  // suspended; the timestamps we scheduled at were already in the past
  // once resume finally completed, and the first notes silent-dropped.
  if (ac.state === 'suspended') {
    try {
      await ac.resume();
    } catch {
      // Autoplay policy blocked us — caller can't recover without a
      // user gesture. Silent fail.
      return;
    }
  }
  // Belt-and-braces: if resume succeeded but the context still isn't
  // running (some engines leave it in 'interrupted' on background tabs),
  // bail rather than schedule into the void.
  if (ac.state !== 'running') return;

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
  const now = ac.currentTime + 0.06;
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
  }
}

/**
 * Eagerly construct the AudioContext so it's ready when the first
 * donation arrives. Must be called from a user-gesture handler to
 * satisfy autoplay policy in dev browsers — for OBS browser sources,
 * the autoplay-policy launch flag means it works on mount.
 */
export async function warmUpFanfare(): Promise<boolean> {
  const ac = getCtx();
  if (!ac) return false;
  if (ac.state === 'suspended') {
    try {
      await ac.resume();
    } catch {
      return false;
    }
  }
  return ac.state === 'running';
}
