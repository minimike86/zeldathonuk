import { WaveText } from '@/components/WaveText';
import { PanelRow } from './_shared/Row';
import type { Incentive, Milestone } from '@/lib/obsApi';

/**
 * Full-bar takeover banner shown for the duration of a `celebrating`
 * OmnibarFSM state — fired when an Incentive is unlocked or a
 * Milestone is reached. Until this existed the visual was only the
 * gold background mood, which conveyed "something happened" but
 * didn't tell viewers WHAT.
 *
 * Three flavours, switched on `reason.kind` (and on incentive shape):
 *
 *   bid-war (incentive-unlocked + payload.options)
 *                      → tag "BID WAR DECIDED!",
 *                        headline = winning option name (or "Tied: A & B"),
 *                        subhead = incentive name + total raised.
 *   incentive-unlocked → tag "INCENTIVE UNLOCKED",
 *                        headline = incentive.name,
 *                        subhead = description or goal amount.
 *   milestone-reached  → tag "MILESTONE!",
 *                        headline = milestone.name (or threshold),
 *                        subhead = celebration_message.
 *
 * Anything else (future celebration kinds) falls through to a generic
 * "ACHIEVEMENT UNLOCKED" rendering so a new reason kind doesn't
 * blank the bar.
 */

export type CelebrationReason = {
  kind: string;
  payload?: Record<string, unknown>;
};

export function CelebrationBanner({
  reason,
  currencySymbol,
}: {
  reason: CelebrationReason;
  currencySymbol: string;
}) {
  const view = parseReason(reason, currencySymbol);
  return (
    <PanelRow tag={view.tag} arrow flash>
      {/* Stacked headline + subhead so a long description doesn't run
        * off the right edge sitting beside the wave-text headline.
        * `.ob-celebrate-stack` is a flex-column inside the row body
        * with the headline on top and the subhead wrapping below. */}
      <span className="ob-celebrate-stack">
        <span className="ob-text-strong ob-celebrate-headline">
          {/* startDelayMs matches the subhead wipe-in delay in
            * omnibar.css (.ob-celebrate-sub) so headline characters
            * drop in WHILE the subhead wipes in from the left. Both
            * fire AFTER the tag arrow has fully landed (tag lands at
            * t=2400) so the reveal isn't competing with tag motion. */}
          <WaveText text={view.headline} staggerMs={32} startDelayMs={2500} />
        </span>
        {view.subhead && (
          <span className="ob-text-muted ob-celebrate-sub">{view.subhead}</span>
        )}
      </span>
    </PanelRow>
  );
}

interface BannerView {
  tag: string;
  headline: string;
  subhead: string;
}

function parseReason(reason: CelebrationReason, symbol: string): BannerView {
  const payload = (reason.payload ?? {}) as Record<string, unknown>;
  if (reason.kind === 'incentive-unlocked') {
    const incentive = payload.incentive as Incentive | undefined;
    if (incentive) {
      // Bid war: incentive.payload.options is a non-empty list of
      // {id, name, votes}. The winner is the option with the highest
      // votes total — tied if multiple share the top. Headline is the
      // winning name(s) so the omnibar tells viewers WHICH OPTION won,
      // not just THAT the bid war finished.
      const bidWar = readBidWarOptions(incentive);
      if (bidWar && bidWar.options.length > 0) {
        const top = bidWar.options[0].votes;
        const winners = bidWar.options.filter((o) => o.votes === top);
        const headline =
          winners.length === 1
            ? winners[0].name
            : `Tied: ${winners.map((w) => w.name).join(' & ')}`;
        return {
          tag: 'BID WAR DECIDED!',
          headline,
          subhead:
            `${incentive.name} · ${symbol}${incentive.goal_amount} raised`,
        };
      }
      // Plain donation-target incentive.
      return {
        tag: 'INCENTIVE UNLOCKED!',
        headline: incentive.name,
        subhead:
          incentive.description ||
          `${symbol}${incentive.goal_amount} reached`,
      };
    }
  }
  if (reason.kind === 'milestone-reached') {
    const m = payload.milestone as Milestone | undefined;
    if (m) {
      return {
        tag: 'MILESTONE!',
        headline: m.name || `${symbol}${m.threshold_amount} milestone`,
        subhead: m.celebration_message || `${symbol}${m.threshold_amount} raised`,
      };
    }
  }
  // Unknown kind — render something readable instead of blanking.
  return {
    tag: 'ACHIEVEMENT UNLOCKED!',
    headline: prettyKind(reason.kind),
    subhead: '',
  };
}

interface BidWarOption {
  id: string;
  name: string;
  votes: number;
}

/** Extract bid-war options from an Incentive's payload, sorted by
 *  votes descending. Returns null when the incentive isn't a bid war
 *  (no options array, or fewer than 2 valid entries). */
function readBidWarOptions(incentive: Incentive): {
  options: BidWarOption[];
} | null {
  const raw = (incentive.payload as { options?: unknown }).options;
  if (!Array.isArray(raw)) return null;
  const options: BidWarOption[] = raw
    .filter(
      (o): o is { id: unknown; name: unknown; votes?: unknown } =>
        !!o &&
        typeof (o as { id?: unknown }).id === 'string' &&
        typeof (o as { name?: unknown }).name === 'string',
    )
    .map((o) => ({
      id: String(o.id),
      name: String(o.name),
      votes: typeof o.votes === 'number' ? o.votes : Number(o.votes) || 0,
    }))
    .sort((a, b) => b.votes - a.votes);
  if (options.length < 2) return null;
  return { options };
}

function prettyKind(kind: string): string {
  return kind
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
