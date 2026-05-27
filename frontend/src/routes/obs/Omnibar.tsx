import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { Donation, EventModel, ScheduleEntry } from '@/lib/obsApi';
import { WaveText } from '@/components/WaveText';
import { MarqueeText } from './MarqueeText';
import { useTTS } from '@/lib/useTTS';
import { cleanForDisplay, cleanForTTS } from '@/lib/profanity';
import { onEventChanged } from '@/lib/eventBus';
import './omnibar.css';

/**
 * Bottom-of-screen ticker (1920×56). Architecture:
 *
 *   ┌─ ob-brand ─┬──────────── ob-content ────────────┬─ ob-total ─┐
 *   │  logo      │  one active card (mounts/unmounts)  │  £ total   │
 *   │            │  rotation: schedule / cta / plea    │  + charity │
 *   │            │  interrupt: live donations w/ TTS   │  logos     │
 *   └────────────┴─────────────────────────────────────┴────────────┘
 *
 * Card queue model:
 *   - baseQueue cycles deterministically: upcoming games (3) + cta + plea
 *     + last-donor recap (when donations exist). Indices advance on
 *     completion. Same payload reads the same way each loop, so an OBS
 *     scene change doesn't desync the visible card.
 *   - liveQueue holds fresh donations not yet announced. When a new
 *     donation appears in /api/donations/ that we haven't seen, it's
 *     enqueued. The next time the active card completes, the live queue
 *     gets priority — the donation card appears, TTS reads it, the
 *     message tickers across, and the queue advances only when both
 *     signals finish.
 *
 * Cold-boot: existing donations are marked "already seen" so reloading
 * mid-stream doesn't TTS-spam the entire donor history.
 *
 * Animations all share the `--ob-enter-*` timing tokens declared in
 * omnibar.css so the tag-pill slide, body wave-in, and donation flash
 * stay in beat with each other.
 */

const POLL_DONATIONS_MS = 3000;
const POLL_SCHEDULE_MS = 8000;
const POLL_EVENT_MS = 15_000;
const POLL_CURRENT_MS = 3000;
const POLL_THEME_MS = 60_000;

const DEFAULT_BRAND_LOGO = '/assets/img/Zeldathon-Logo-WW-white.svg';

const CHARITY_SWAP_MS = 12_000;
const COUNTER_TWEEN_MS = 900;

// Per-card minimum visible time. Donation cards override these — they
// hold until both the TTS utterance and the marquee finish, whichever
// is later. Numbers tuned to feel rhythmic, not rushed.
const SCHEDULE_CARD_MS = 6000;
const CTA_CARD_MS = 4500;
const PLEA_CARD_MS = 4500;
const LAST_DONOR_CARD_MS = 5000;
const DONATION_NO_MESSAGE_HOLD_MS = 4500;

// Mirrors `--ob-enter-ms` in omnibar.css. The body content's CSS fades
// in at this delay; per-character WaveText animations want the same
// offset so the text waves in *after* the tag pill lands rather than
// concurrently. Keep these two values in lock-step.
const BODY_REVEAL_DELAY_MS = 520;

/** SpecialEffect's logo is constant. The GameBlast logo rebrands each
 *  year (GB22 → GB23 → …), so it's pulled per-event from
 *  `Event.gameblast_logo_url` and only falls back to the bundled GB22
 *  asset when the event hasn't set one yet. */
const SPECIALEFFECT_LOGO = '/assets/img/specialeffect-logo.svg';
const DEFAULT_GAMEBLAST_LOGO = '/assets/img/GB22_Logo_Linear_DarkBGs_Small.png';

// ── Card types ─────────────────────────────────────────────────────────

type CardKind = 'schedule-game' | 'cta' | 'plea' | 'last-donor' | 'live-donation';

interface BaseCard {
  uid: string;
  kind: CardKind;
}
interface ScheduleGameCard extends BaseCard {
  kind: 'schedule-game';
  entry: ScheduleEntry;
  position: number; // 1st upcoming, 2nd upcoming, …
}
interface CtaCard extends BaseCard {
  kind: 'cta';
  event: EventModel | null;
  yearTag: string;
}
interface PleaCard extends BaseCard {
  kind: 'plea';
  yearTag: string;
}
interface LastDonorCard extends BaseCard {
  kind: 'last-donor';
  donation: Donation;
  fallbackCurrency: string;
}
interface LiveDonationCard extends BaseCard {
  kind: 'live-donation';
  donation: Donation;
  fallbackCurrency: string;
}
type Card =
  | ScheduleGameCard
  | CtaCard
  | PleaCard
  | LastDonorCard
  | LiveDonationCard;

// ── Top-level Omnibar component ────────────────────────────────────────

export function Omnibar() {
  // Bumping `eventBump` forces the active-event poll to re-fetch the
  // moment another tab broadcasts an event mutation (e.g. an organiser
  // updates the GameBlast logo in /control/events). The charity-logo
  // carousel below picks up the new URL in the next render.
  const [eventBump, setEventBump] = useState(0);
  useEffect(() => onEventChanged(() => setEventBump((b) => b + 1)), []);

  // ── Data sources ────────────────────────────────────────────────
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, POLL_CURRENT_MS);
  const { data: event } = usePolledQuery(obsApi.activeEvent, POLL_EVENT_MS, [eventBump]);
  const { data: schedule } = usePolledQuery(
    () => (event ? obsApi.schedule(event.id) : Promise.resolve([])),
    POLL_SCHEDULE_MS,
    [event?.id],
  );
  const { data: donations } = usePolledQuery(
    () => (event ? obsApi.donations(event.id) : Promise.resolve([])),
    POLL_DONATIONS_MS,
    [event?.id],
  );
  const { data: theme } = usePolledQuery(obsApi.themeSettings, POLL_THEME_MS);
  const brandLogo = theme?.logo_url || DEFAULT_BRAND_LOGO;
  const { data: totals } = usePolledQuery(
    () =>
      event
        ? obsApi.donationTotals(event.id)
        : Promise.resolve({ by_platform: [], grand_total: '0', donation_count: 0 }),
    POLL_DONATIONS_MS,
    [event?.id],
  );

  const currency = event?.currency_symbol ?? '£';
  const yearTag = `#GameBlast${new Date().getFullYear()}`;
  const grandTotal = Number(totals?.grand_total ?? 0);
  const tweenedTotal = useTweenedNumber(grandTotal, COUNTER_TWEEN_MS);

  // ── Base queue assembly ─────────────────────────────────────────
  const upcoming = useMemo(
    () => upcomingGames(schedule ?? [], cp?.schedule_entry_detail ?? null, 3),
    // include all schedule object refs so re-fetches refresh the queue
    [schedule, cp?.schedule_entry_detail?.id, cp?.schedule_entry_detail?.order],
  );
  const recentDonations = useMemo(() => (donations ?? []).slice(0, 5), [donations]);

  const baseQueue = useMemo<Card[]>(
    () => buildBaseQueue(upcoming, recentDonations, event ?? null, yearTag, currency),
    [upcoming, recentDonations, event, yearTag, currency],
  );

  // ── Live donation interrupt ─────────────────────────────────────
  // seenIdsRef holds every donation id we've ever observed in /donations
  // (whether we played a TTS for it or not). On cold boot we seed it
  // with the initial response so the announcer doesn't replay history.
  const seenIdsRef = useRef<Set<number>>(new Set());
  const initialisedRef = useRef(false);
  const [liveQueue, setLiveQueue] = useState<LiveDonationCard[]>([]);

  useEffect(() => {
    if (!donations) return;
    if (!initialisedRef.current) {
      donations.forEach((d) => seenIdsRef.current.add(d.id));
      initialisedRef.current = true;
      return;
    }
    const fresh = donations.filter((d) => !seenIdsRef.current.has(d.id));
    if (fresh.length === 0) return;
    fresh.forEach((d) => seenIdsRef.current.add(d.id));
    setLiveQueue((prev) => [
      ...prev,
      ...fresh.map<LiveDonationCard>((d) => ({
        uid: `live-${d.id}`,
        kind: 'live-donation',
        donation: d,
        fallbackCurrency: currency,
      })),
    ]);
  }, [donations, currency]);

  // ── Active card selection ───────────────────────────────────────
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const baseIndexRef = useRef(0);

  // Pick the next card. Live donations take priority — they consume
  // their slot in liveQueue when picked. Otherwise advance the base
  // rotation modulo its length so it loops forever.
  const pickNext = useCallback(() => {
    setLiveQueue((prev) => {
      if (prev.length > 0) {
        const [head, ...rest] = prev;
        setActiveCard(head);
        return rest;
      }
      if (baseQueue.length === 0) {
        setActiveCard(null);
        return prev;
      }
      const idx = baseIndexRef.current % baseQueue.length;
      baseIndexRef.current = idx + 1;
      setActiveCard(baseQueue[idx]);
      return prev;
    });
  }, [baseQueue]);

  // Bootstrap when content first becomes available.
  useEffect(() => {
    if (activeCard) return;
    if (baseQueue.length === 0 && liveQueue.length === 0) return;
    pickNext();
  }, [activeCard, baseQueue.length, liveQueue.length, pickNext]);

  // Auto-advance non-donation cards on a fixed timer. Donation cards
  // call onComplete themselves once TTS + marquee both finish.
  useEffect(() => {
    if (!activeCard) return;
    if (activeCard.kind === 'live-donation') return;
    const dur = cardDuration(activeCard);
    const id = window.setTimeout(pickNext, dur);
    return () => window.clearTimeout(id);
  }, [activeCard, pickNext]);

  // ── Charity logo rotation ───────────────────────────────────────
  // SpecialEffect (constant) alternates with the active event's
  // GameBlast logo. Falls back to the bundled GB22 asset until an
  // organiser sets `gameblast_logo_url` on the current event.
  const charityLogos = useMemo(
    () => [
      SPECIALEFFECT_LOGO,
      event?.gameblast_logo_url || DEFAULT_GAMEBLAST_LOGO,
    ],
    [event?.gameblast_logo_url],
  );
  const charityIndex = useRotation(charityLogos.length, CHARITY_SWAP_MS);

  return (
    <div className="omnibar" aria-hidden>
      <div className="ob-brand">
        <img src={brandLogo} alt="" />
      </div>

      <div className="ob-content">
        {activeCard && (
          <div key={activeCard.uid} className="ob-slot" data-kind={activeCard.kind}>
            <CardRenderer card={activeCard} onComplete={pickNext} />
          </div>
        )}
      </div>

      <div className={`ob-total${liveQueue.length > 0 ? ' is-pending' : ''}`}>
        <div className="ob-total-amount-wrap">
          <span className="ob-total-currency">{currency}</span>
          <span className="ob-total-amount">{formatMoney(tweenedTotal)}</span>
        </div>
        <div className="ob-charity">
          {charityLogos.map((src, i) => (
            <img
              key={src}
              src={src}
              alt=""
              className="ob-charity-logo"
              data-visible={i === charityIndex}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Card renderer dispatch ─────────────────────────────────────────────

function CardRenderer({ card, onComplete }: { card: Card; onComplete: () => void }) {
  switch (card.kind) {
    case 'schedule-game':
      return <ScheduleGameSlot card={card} />;
    case 'cta':
      return <CtaSlot card={card} />;
    case 'plea':
      return <PleaSlot card={card} />;
    case 'last-donor':
      return <LastDonorSlot card={card} />;
    case 'live-donation':
      return <LiveDonationSlot card={card} onComplete={onComplete} />;
  }
}

// ── Card components ────────────────────────────────────────────────────

function ScheduleGameSlot({ card }: { card: ScheduleGameCard }) {
  const { entry, position } = card;
  const runnerNames = entry.runners.map((r) => r.name).join(', ');
  const game = entry.game;
  const tagLabel = position === 1 ? 'UP NEXT' : position === 2 ? 'THEN' : `LATER #${position}`;
  return (
    <Row tag={tagLabel} arrow={position === 1}>
      <span className="ob-text-strong">
        <WaveText
          text={entry.display_title}
          staggerMs={28}
          startDelayMs={BODY_REVEAL_DELAY_MS}
        />
      </span>
      {game && (
        <span className="ob-meta-chip">
          {game.platform}
          {game.release_year ? ` · ${game.release_year}` : ''}
        </span>
      )}
      {runnerNames && (
        <span className="ob-text-muted">with {runnerNames}</span>
      )}
    </Row>
  );
}

function CtaSlot({ card }: { card: CtaCard }) {
  const eventName = card.event?.name ?? 'ZeldathonUK';
  return (
    <Row centered>
      <span className="ob-text-accent">{eventName}</span>
      <span className="ob-text-strong">
        <WaveText
          text="benefits the charity SpecialEffect"
          staggerMs={22}
          startDelayMs={BODY_REVEAL_DELAY_MS}
        />
      </span>
      <span className="ob-text-soft">{card.yearTag}</span>
    </Row>
  );
}

function PleaSlot({ card }: { card: PleaCard }) {
  return (
    <Row centered>
      <span className="ob-text-strong">
        <WaveText
          text="Consider making a donation at"
          staggerMs={22}
          startDelayMs={BODY_REVEAL_DELAY_MS}
        />
      </span>
      <span className="ob-text-accent">zeldathon.co.uk/charity</span>
      <span className="ob-text-soft">{card.yearTag}</span>
    </Row>
  );
}

function LastDonorSlot({ card }: { card: LastDonorCard }) {
  const { donation } = card;
  const symbol = currencySymbol(donation.currency, card.fallbackCurrency);
  return (
    <Row tag="RECENT DONOR">
      <div className="ob-donor-line">
        <span className="ob-donor-name">{donation.donor_name || 'Anonymous'}</span>
        <span className="ob-donor-amount">
          {symbol}
          {Number(donation.amount).toFixed(2)}
        </span>
      </div>
      {donation.message && (
        <span className="ob-text-muted">
          “{truncate(cleanForDisplay(donation.message), 80)}”
        </span>
      )}
    </Row>
  );
}

function LiveDonationSlot({
  card,
  onComplete,
}: {
  card: LiveDonationCard;
  onComplete: () => void;
}) {
  const { donation } = card;
  const symbol = currencySymbol(donation.currency, card.fallbackCurrency);
  const displayName = donation.donor_name?.trim() || 'An anonymous donor';
  const amountStr = `${symbol}${Number(donation.amount).toFixed(2)}`;
  const hasMessage = Boolean(donation.message && donation.message.trim());
  const displayMessage = hasMessage ? cleanForDisplay(donation.message) : '';
  const spokenMessage = hasMessage ? cleanForTTS(donation.message) : '';

  // What the TTS will read. Compose announcer-style narration so the
  // viewer hears who donated and how much before the message itself.
  const utterance = useMemo(() => {
    const intro = `${displayName} just donated ${amountStr}`;
    return hasMessage && spokenMessage
      ? `${intro} and says: ${spokenMessage}`
      : `${intro}. Thank you!`;
  }, [displayName, amountStr, spokenMessage, hasMessage]);

  const { speak } = useTTS({ rate: 1.0, pitch: 1.0, volume: 1.0 });

  // Coordinate TTS-end and marquee-end. Whichever finishes last drives
  // the queue advance. Refs avoid stale closures across the two async
  // signals; the parent's onComplete is also stable enough to call once.
  const ttsDoneRef = useRef(false);
  const marqueeDoneRef = useRef(!hasMessage); // no-message → no marquee needed
  const advancedRef = useRef(false);

  const maybeAdvance = useCallback(() => {
    if (advancedRef.current) return;
    if (ttsDoneRef.current && marqueeDoneRef.current) {
      advancedRef.current = true;
      onComplete();
    }
  }, [onComplete]);

  useEffect(() => {
    let cancelled = false;
    speak(utterance).then((res) => {
      if (cancelled) return;
      ttsDoneRef.current = true;
      // If TTS isn't supported or the synth is silent for some reason,
      // we still want the card to leave — fall back to a min hold time
      // so the viewer at least sees the celebration before advancing.
      if (!res.spoken && !hasMessage) {
        window.setTimeout(maybeAdvance, DONATION_NO_MESSAGE_HOLD_MS);
        return;
      }
      maybeAdvance();
    });
    return () => {
      cancelled = true;
    };
    // utterance is derived from donation.id — re-running on prop change
    // would cancel the in-flight TTS. donation.id never changes for a
    // mounted instance (uid is stable), so the empty dep array is safe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safety net: if for any reason neither signal arrives (e.g. silent
  // TTS + no message), guarantee we advance after a maximum hold.
  useEffect(() => {
    const id = window.setTimeout(() => {
      ttsDoneRef.current = true;
      marqueeDoneRef.current = true;
      maybeAdvance();
    }, 25_000);
    return () => window.clearTimeout(id);
  }, [maybeAdvance]);

  return (
    <Row tag="DONATION!" arrow flash>
      <div className="ob-live-donation">
        <div className="ob-live-headline">
          <WaveText
            text={displayName}
            staggerMs={28}
            startDelayMs={BODY_REVEAL_DELAY_MS}
          />
          <span className="ob-live-amount">{amountStr}</span>
        </div>
        {hasMessage ? (
          <MarqueeText
            className="ob-live-message"
            pxPerSecond={110}
            minHoldMs={2500}
            startDelayMs={BODY_REVEAL_DELAY_MS}
            onComplete={() => {
              marqueeDoneRef.current = true;
              maybeAdvance();
            }}
          >
            “{displayMessage}”
          </MarqueeText>
        ) : (
          <span className="ob-text-muted">Thank you!</span>
        )}
      </div>
    </Row>
  );
}

// ── Shared primitives ──────────────────────────────────────────────────

function TagPill({
  label,
  arrow,
  flash,
}: {
  label: string;
  arrow?: boolean;
  flash?: boolean;
}) {
  const cls =
    'ob-tag' +
    (arrow ? ' ob-tag--arrow' : '') +
    (flash ? ' ob-tag--flash' : '');
  return <span className={cls}>{label}</span>;
}

function Row({
  tag,
  arrow,
  flash,
  centered,
  children,
}: {
  tag?: string;
  arrow?: boolean;
  flash?: boolean;
  centered?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="ob-row">
      {tag && <TagPill label={tag} arrow={arrow} flash={flash} />}
      <div className={`ob-row-body${centered ? ' ob-row-body--center' : ''}`}>{children}</div>
    </div>
  );
}

// ── Hooks ──────────────────────────────────────────────────────────────

function useRotation(count: number, intervalMs: number) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (count <= 1) {
      setIndex(0);
      return;
    }
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => window.clearInterval(id);
  }, [count, intervalMs]);
  return count > 0 ? index % count : 0;
}

/**
 * Smooth easeOutCubic tween toward a target. Skips the tween when
 * jumping from zero so a page-load doesn't replay the whole donation
 * total as if it just happened.
 */
function useTweenedNumber(target: number, durationMs: number) {
  const [value, setValue] = useState(target);
  const currentRef = useRef(target);
  currentRef.current = value;
  useEffect(() => {
    const from = currentRef.current;
    if (from === target) return;
    if (from === 0) {
      setValue(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

// ── Pure helpers ───────────────────────────────────────────────────────

function cardDuration(card: Card): number {
  switch (card.kind) {
    case 'schedule-game':
      return SCHEDULE_CARD_MS;
    case 'cta':
      return CTA_CARD_MS;
    case 'plea':
      return PLEA_CARD_MS;
    case 'last-donor':
      return LAST_DONOR_CARD_MS;
    case 'live-donation':
      // donation slot drives its own advance — but if anything goes
      // wrong upstream and we end up here, we still hand back a value.
      return DONATION_NO_MESSAGE_HOLD_MS;
  }
}

function upcomingGames(
  schedule: ScheduleEntry[],
  current: ScheduleEntry | null,
  limit: number,
): ScheduleEntry[] {
  const upcoming = schedule
    .filter((s) => s.parent_entry == null && s.slot_type === 'game' && !s.is_completed)
    .sort((a, b) => a.order - b.order);
  const after = current
    ? upcoming.filter((s) => s.order > current.order)
    : upcoming;
  return after.slice(0, limit);
}

function buildBaseQueue(
  upcoming: ScheduleEntry[],
  recentDonations: Donation[],
  event: EventModel | null,
  yearTag: string,
  currency: string,
): Card[] {
  const cards: Card[] = [];
  upcoming.forEach((entry, i) => {
    cards.push({
      uid: `sched-${entry.id}-${i}`,
      kind: 'schedule-game',
      entry,
      position: i + 1,
    });
  });
  cards.push({ uid: 'cta', kind: 'cta', event, yearTag });
  cards.push({ uid: 'plea', kind: 'plea', yearTag });
  // Sprinkle in one or two donor recaps if we have donations. Picking
  // up to two ensures the rotation gets warmer over time without
  // becoming all-donations once the event matures.
  recentDonations.slice(0, 2).forEach((d) => {
    cards.push({
      uid: `recap-${d.id}`,
      kind: 'last-donor',
      donation: d,
      fallbackCurrency: currency,
    });
  });
  // If absolutely nothing is configured (no event, no schedule, no
  // donations), keep the CTA + plea as a minimum so the omnibar never
  // sits empty during stream prep.
  if (cards.length === 0) {
    cards.push({ uid: 'cta', kind: 'cta', event: null, yearTag });
    cards.push({ uid: 'plea', kind: 'plea', yearTag });
  }
  return cards;
}

function currencySymbol(code: string, fallback: string) {
  switch (code) {
    case 'GBP':
      return '£';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    default:
      return fallback;
  }
}

function formatMoney(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}
