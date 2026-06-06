import { useCallback, useEffect, useRef, useState } from 'react';
import { useBusSubscription } from '../bus/EventBus';
import { onTestSplash } from '@/lib/splashBus';

/**
 * Pixelated "+£N" splashes that float over the running donation total
 * each time a fresh donation arrives.
 *
 * Behaviour:
 *   - Listens to `donation-arrived` bus events.
 *   - When several events arrive together (poll burst, queued
 *     sandbox triggers, etc.) the splashes are buffered and spawned
 *     STAGGER_MS apart so the eye sees a sequence instead of a
 *     simultaneous blast that all fades together.
 *   - Each splash has random x/y/rotate/scale jitter so a burst
 *     reads as confetti, not a stacked column.
 *   - Auto-removed after LIFETIME_MS once the animation ends.
 *   - `colorMode` drives the visual treatment — 'theme' (default,
 *     uses the active theme accent), 'gold' (classic money colour),
 *     or 'rainbow' (per-splash random hue for chaos energy).
 */

export type SplashColorMode = 'theme' | 'gold' | 'rainbow';

type Splash = {
  id: number;
  label: string;
  symbol: string;
  xPct: number;
  yPct: number;
  rotateDeg: number;
  scale: number;
  /** Per-splash hue override for rainbow mode. -1 = use mode default. */
  hueDeg: number;
};

const LIFETIME_MS = 1600;
// Spacing between splash spawns. Longer = each "+£N" gets its own
// moment on screen instead of overlapping into the next. With the
// 1600ms lifetime, a 420ms stagger leaves ~3-4 splashes on screen
// at once during a sustained burst.
const STAGGER_MS = 420;
const MAX_SIMULTANEOUS = 6;
const MAX_QUEUED = 12;

export function DonationSplash({
  colorMode = 'theme',
}: {
  colorMode?: SplashColorMode;
}) {
  const [splashes, setSplashes] = useState<Splash[]>([]);
  const seqRef = useRef(0);
  const queueRef = useRef<Array<{ label: string; symbol: string }>>([]);
  const drainTimerRef = useRef<number | null>(null);
  const colorModeRef = useRef(colorMode);
  colorModeRef.current = colorMode;

  // Spawn one splash from the buffered queue. Re-arms itself via
  // setTimeout while items remain so a burst of donations rolls out
  // one-at-a-time with STAGGER_MS between each entrance.
  const drainOne = useCallback(() => {
    drainTimerRef.current = null;
    const next = queueRef.current.shift();
    if (!next) return;
    const id = ++seqRef.current;
    const splash: Splash = {
      id,
      label: next.label,
      symbol: next.symbol,
      xPct: 10 + Math.random() * 80,
      yPct: 15 + Math.random() * 70,
      rotateDeg: (Math.random() - 0.5) * 18,
      scale: 0.9 + Math.random() * 0.35,
      // Hue is fixed (-1) outside rainbow mode; in rainbow mode a
      // fresh random hue per splash keeps the burst lively. Use 360
      // so the full spectrum is in play.
      hueDeg: colorModeRef.current === 'rainbow' ? Math.floor(Math.random() * 360) : -1,
    };
    setSplashes((current) => {
      const next = [...current, splash];
      return next.length > MAX_SIMULTANEOUS
        ? next.slice(next.length - MAX_SIMULTANEOUS)
        : next;
    });
    window.setTimeout(() => {
      setSplashes((cur) => cur.filter((s) => s.id !== id));
    }, LIFETIME_MS);
    if (queueRef.current.length > 0) {
      drainTimerRef.current = window.setTimeout(drainOne, STAGGER_MS);
    }
  }, []);

  // Enqueue a splash from any source (real donation OR test splash).
  // Buffered + capped at MAX_QUEUED so a one-time flood doesn't spam
  // the overlay for minutes.
  const enqueue = useCallback(
    (amount: number, currency: string) => {
      const label = formatAmount(amount);
      const symbol = currencySymbol(currency);
      queueRef.current.push({ label, symbol });
      if (queueRef.current.length > MAX_QUEUED) {
        queueRef.current = queueRef.current.slice(-MAX_QUEUED);
      }
      if (drainTimerRef.current === null) {
        drainOne();
      }
    },
    [drainOne],
  );

  useBusSubscription('donation-arrived', (e) => {
    enqueue(Number(e.donation.amount) || 0, e.donation.currency);
  });

  // Test splash trigger from /control/omnibar (BroadcastChannel-based).
  // Same enqueue path so the stagger / cap / animation logic doesn't
  // need a separate code path for fake splashes.
  useEffect(() => onTestSplash((p) => enqueue(p.amount, p.currency)), [enqueue]);

  // Pause animations when the tab is hidden so reopening doesn't
  // process a backlog of timers all at once.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        setSplashes([]);
        queueRef.current = [];
        if (drainTimerRef.current !== null) {
          window.clearTimeout(drainTimerRef.current);
          drainTimerRef.current = null;
        }
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  if (splashes.length === 0) return null;

  return (
    <div className={`ob-splash-layer ob-splash-layer--${colorMode}`} aria-hidden>
      {splashes.map((s) => (
        <span
          key={s.id}
          className="ob-splash"
          style={{
            left: `${s.xPct}%`,
            top: `${s.yPct}%`,
            ['--ob-splash-rotate' as string]: `${s.rotateDeg}deg`,
            ['--ob-splash-scale' as string]: String(s.scale),
            // Rainbow mode passes a per-splash hue rotation; theme/
            // gold modes leave the var unset and inherit the layer's
            // base colour.
            ...(s.hueDeg >= 0
              ? ({ ['--ob-splash-hue' as string]: `${s.hueDeg}deg` })
              : {}),
          }}
        >
          +{s.symbol}{s.label}
        </span>
      ))}
    </div>
  );
}

function formatAmount(amount: number): string {
  if (amount < 1) return '<1';
  return String(Math.round(amount));
}

function currencySymbol(code: string): string {
  switch (code) {
    case 'GBP': return '£';
    case 'USD': return '$';
    case 'EUR': return '€';
    default: return '£';
  }
}
