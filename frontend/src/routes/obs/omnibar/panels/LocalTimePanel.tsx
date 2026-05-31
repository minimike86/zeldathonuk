import { useEffect, useReducer, type CSSProperties } from 'react';
import { PanelRow } from './_shared/Row';
import { registerPanel, type PanelProps } from './registry';

/**
 * Wall-clock time + total event elapsed, with the live run timer parked on the
 * right when a game is currently playing. Useful on long marathons so the
 * chat / runner can see "yep, we've been at this for 18 hours" alongside the
 * current game's run clock and its state. Updates every second via the feed's
 * `now`; the run clock additionally ticks locally for centisecond precision.
 */
type RunState = 'running' | 'paused' | 'finished' | 'ready';

interface Data {
  /** Time-of-day portion without AM/PM (e.g. "02:34:56"). */
  localTime: string;
  /** Day period suffix when the locale uses 12h ("AM" / "PM").
   *  Empty when the locale renders 24h. */
  localPeriod: string;
  eventElapsedH: string | null;
  /** Raw run-timer inputs so the panel can tick centiseconds locally (the feed
   *  only refreshes once per second). null when nothing is playing. */
  run: {
    state: RunState;
    label: string;
    /** Banked ms excluding the live segment. */
    baseMs: number;
    /** Epoch ms the live segment started, or null when not running. */
    runningSinceMs: number | null;
  } | null;
}

// Sleek HUD monospace ("Share Tech Mono") so the wall clock reads like a
// sci-fi status readout while keeping fixed-width digits. Sized to match the
// strong body text of the other panels (.ob-text-strong is 1.2rem). Its
// baseline sits close to the surrounding Bungee, so only a small nudge is
// needed to land it on the same visual baseline as the suffix.
const MONO_STYLE: CSSProperties = {
  fontFamily: '"Share Tech Mono", ui-monospace, monospace',
  fontSize: '1.45rem',
  // Share Tech Mono ships a single weight; 700 makes the browser synth-bold it
  // so the digits + AM/PM read thicker.
  fontWeight: 700,
  letterSpacing: '0.04em',
  lineHeight: 1,
  display: 'inline-block',
  transform: 'translateY(0.04em)',
};

// Status-pill fill per state — a CSS `background` value. Saturated hues read
// on both light and dark theme lanes; "ready" falls back to the muted lane
// text colour; "finished" is a checkered-flag pattern.
const STATE_PILL: Record<RunState, string> = {
  running: '#46d369',
  paused: '#f5b841',
  // Racing checkered flag: two offset diagonal squares over white.
  finished:
    'repeating-conic-gradient(#111 0 25%, #fafafa 0 50%) 0 0 / 0.34em 0.34em',
  ready: 'color-mix(in srgb, currentColor 45%, transparent)',
};

// Text shown next to the run clock for each state. Rendered verbatim — this is
// the single place to edit the wording.
const STATE_LABEL: Record<RunState, string> = {
  running: 'Play time',
  paused: 'Paused',
  finished: 'Finished',
  ready: 'Press Start',
};

function Panel({ data }: PanelProps<Data>) {
  const { run } = data;
  const ticking = run?.runningSinceMs != null;
  // Drive sub-second re-renders while the run clock is live — the feed itself
  // only refreshes once per second, too coarse for centiseconds.
  const [, tick] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!ticking) return;
    let raf = 0;
    const loop = () => {
      tick();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ticking]);

  const runMs = run
    ? run.baseMs + (run.runningSinceMs != null ? Math.max(0, Date.now() - run.runningSinceMs) : 0)
    : 0;

  return (
    <PanelRow tag="LOCAL TIME">
      <span className="ob-text-strong" style={MONO_STYLE}>
        {data.localTime}
        {data.localPeriod && (
          // Derive from the inherited lane text colour (theme-aware) instead of
          // a hardcoded white, so the AM/PM stays readable on light themes.
          <span style={{ color: 'color-mix(in srgb, currentColor 55%, transparent)', marginLeft: '0.4em' }}>
            {data.localPeriod}
          </span>
        )}
      </span>
      {data.eventElapsedH != null && (
        <>
          <span className="ob-text-muted">·</span>
          <span className="ob-text-muted" style={MONO_STYLE}>
            {data.eventElapsedH}
          </span>
          <span className="ob-text-muted">into the stream</span>
        </>
      )}

      {run && (
        // Second tag pill (same look as the LOCAL TIME tag) + run clock,
        // centered in the lane's free space. Auto margins on both sides float
        // the group between the local-time content and the right edge.
        <span
          style={{
            marginLeft: 'auto',
            marginRight: 'auto',
            height: '100%',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6em',
            flexShrink: 0,
          }}
        >
          <span
            className="ob-tag"
            // Flat left edge — drop the chevron notch (and the negative margin
            // / extra left padding that exist only to seat that chevron).
            style={{ clipPath: 'none', marginLeft: 0, paddingLeft: '1rem' }}
          >
            <span
              aria-hidden
              // Status pill — capsule, coloured per state — sat inside the tag.
              style={{
                display: 'inline-block',
                width: '1.6em',
                height: '0.55em',
                borderRadius: '999px',
                background: STATE_PILL[run.state],
                marginRight: '0.55em',
              }}
            />
            {run.label}
          </span>
          <span className="ob-text-strong" style={MONO_STYLE}>
            {formatRunTime(runMs)}
          </span>
        </span>
      )}
    </PanelRow>
  );
}

/** H:MM:SS.cc (centiseconds; hours dropped until needed). */
function formatRunTime(totalMs: number): string {
  const totalSeconds = Math.floor(totalMs / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const cs = Math.floor((totalMs % 1000) / 10);
  const pad = (n: number) => String(n).padStart(2, '0');
  const base = h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  return `${base}.${pad(cs)}`;
}

registerPanel<Data>({
  id: 'local-time',
  component: Panel,
  selectData: (feed) => {
    // formatToParts lets us split the locale-formatted time into
    // the digit segments and the AM/PM `dayPeriod` so they can be
    // styled independently (period is rendered greyed-out to match
    // the unit letters in the countdown panel).
    const fmt = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const parts = fmt.formatToParts(feed.now);
    const localTime = parts
      .filter((p) => p.type !== 'dayPeriod' && !(p.type === 'literal' && p.value.trim() === ''))
      .map((p) => p.value)
      .join('')
      .trim();
    const localPeriod = parts.find((p) => p.type === 'dayPeriod')?.value ?? '';

    let eventElapsedH: string | null = null;
    if (feed.event?.start_time) {
      const elapsedMs = feed.now.getTime() - new Date(feed.event.start_time).getTime();
      if (elapsedMs > 0) {
        const hours = elapsedMs / 1000 / 3600;
        eventElapsedH = hours < 1
          ? `${Math.round(hours * 60)}m`
          : `${hours.toFixed(1)}h`;
      }
    }

    // Live run timer for the current game, if one is set as Currently Playing.
    // Pass the raw inputs (banked ms + segment start) so the panel ticks the
    // centiseconds itself rather than relying on the 1s feed.
    let run: Data['run'] = null;
    const timer = feed.currentlyPlaying?.schedule_entry_detail?.timer ?? null;
    if (timer) {
      const state: RunState = timer.is_running
        ? 'running'
        : timer.ended_at
          ? 'finished'
          : timer.is_paused
            ? 'paused'
            : 'ready';
      run = {
        state,
        label: STATE_LABEL[state],
        baseMs: timer.accumulated_ms,
        runningSinceMs:
          timer.is_running && timer.started_at ? Date.parse(timer.started_at) : null,
      };
    }

    return { localTime, localPeriod, eventElapsedH, run };
  },
  minDurationMs: 5000,
});
