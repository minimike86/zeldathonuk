import type { CSSProperties } from 'react';
import { WaveText } from '@/components/WaveText';
import { PanelRow } from './_shared/Row';
import type { GameObjective, Incentive, Milestone } from '@/lib/obsApi';
import { objectiveImageUrl } from '@/routes/obs/objectiveSection';

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
  // Per-fire colour overrides — schedule-entry-sound triggers (and any
  // future kind that wants to colour-code its banner) can ship these
  // alongside their tag/message/subhead on the payload. Inline styles
  // win over the theme defaults set on :root, which in turn win over
  // the baked-in gold-flash mood. Empty payload → all defaults.
  const colours = readColourOverrides(reason);
  // Tag pill background: a gradient pair wins, then a single colour,
  // otherwise leave the CSS default (theme mesh or baked-in brand).
  const tagStyle: CSSProperties | undefined =
    colours.tagFrom && colours.tagTo
      ? { background: buildCelebrationTagMesh(colours.tagFrom, colours.tagTo) }
      : colours.tag
        ? { background: colours.tag }
        : undefined;
  const headlineStyle: CSSProperties | undefined = colours.heading
    ? { color: colours.heading }
    : undefined;
  const subStyle: CSSProperties | undefined = colours.sub
    ? { color: colours.sub }
    : undefined;
  return (
    <PanelRow tag={view.tag} arrow flash tagStyle={tagStyle}>
      {/* Optional sprite (e.g. the obtained objective's icon) sits before
        * the text so viewers see WHAT was achieved at a glance. */}
      {view.image && (
        <span className="ob-item-icon" aria-hidden>
          <img src={view.image} alt="" />
        </span>
      )}
      {/* Stacked headline + subhead so a long description doesn't run
        * off the right edge sitting beside the wave-text headline.
        * `.ob-celebrate-stack` is a flex-column inside the row body
        * with the headline on top and the subhead wrapping below. */}
      <span className="ob-celebrate-stack">
        <span className="ob-text-strong ob-celebrate-headline" style={headlineStyle}>
          {/* startDelayMs matches the subhead wipe-in delay in
            * omnibar.css (.ob-celebrate-sub) so headline characters
            * drop in WHILE the subhead wipes in from the left. Both
            * fire AFTER the tag arrow has fully landed (tag lands at
            * t=2400) so the reveal isn't competing with tag motion. */}
          <WaveText text={view.headline} staggerMs={32} startDelayMs={2500} />
        </span>
        {view.subhead && (
          <span className="ob-text-muted ob-celebrate-sub" style={subStyle}>
            {view.subhead}
          </span>
        )}
      </span>
    </PanelRow>
  );
}

/** Pull colour overrides off the trigger payload. All optional —
 *  the empty result lets the theme defaults / baked-in mood drive
 *  the look.
 *
 *  Tag pill: a `tag_color_from` + `tag_color_to` pair gets rendered
 *  as the full lit-pill gradient mesh; a lone `tag_color` paints as
 *  a single solid background. Mixing only one of from/to is treated
 *  as no gradient (falls back to single `tag_color` if set, else
 *  CSS default). */
function readColourOverrides(reason: CelebrationReason): {
  tag?: string;
  tagFrom?: string;
  tagTo?: string;
  heading?: string;
  sub?: string;
} {
  const payload = (reason.payload ?? {}) as Record<string, unknown>;
  const pick = (key: string): string | undefined => {
    const v = payload[key];
    return typeof v === 'string' && v.trim() ? v.trim() : undefined;
  };
  return {
    tag: pick('tag_color'),
    tagFrom: pick('tag_color_from'),
    tagTo: pick('tag_color_to'),
    heading: pick('heading_color'),
    sub: pick('sub_color'),
  };
}

/** Build the lit-pill mesh background string (top sheen + bottom
 *  shoulder + linear wash) from a from / to colour pair. Mirrors the
 *  `--ob-bloodmoon-*` recipe in omnibar.css so an inline-styled
 *  per-fire tag pill reads as the same family of UI element as the
 *  themeable section pills. */
function buildCelebrationTagMesh(from: string, to: string): string {
  return (
    `radial-gradient(` +
      `ellipse 90% 140% at 15% -25%,` +
      `color-mix(in srgb, ${from} 70%, #fff 35%) 0%,` +
      `color-mix(in srgb, ${from} 70%, #fff 0%) 45%,` +
      `transparent 70%` +
    `),` +
    `radial-gradient(` +
      `ellipse 120% 180% at 100% 110%,` +
      `color-mix(in srgb, ${to} 88%, #000 15%) 0%,` +
      `transparent 65%` +
    `),` +
    `linear-gradient(180deg, ${from} 0%, ${to} 100%)`
  );
}

interface BannerView {
  tag: string;
  headline: string;
  subhead: string;
  /** Optional sprite shown left of the text (e.g. the obtained objective). */
  image?: string;
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
  if (reason.kind === 'objective-obtained') {
    const o = payload.objective as GameObjective | undefined;
    if (o) {
      return {
        tag: 'OBJECTIVE COMPLETE!',
        headline: o.name,
        subhead: objectiveSubhead(o.category),
        image: objectiveImageUrl(o) || undefined,
      };
    }
  }
  if (reason.kind === 'schedule-entry-sound') {
    // Schedule-entry sound triggers carry their banner copy in
    // `payload.tag` / `.message` / `.subhead`. Tag falls back to
    // "NOW PLAYING" when the operator didn't customise it. The
    // sound itself plays from Omnibar.tsx's override-arrived
    // subscription; this branch is just the visual.
    const tag = typeof payload.tag === 'string' ? payload.tag.trim() : '';
    const message = typeof payload.message === 'string' ? payload.message.trim() : '';
    const sub = typeof payload.subhead === 'string' ? payload.subhead.trim() : '';
    return {
      tag: tag || 'NOW PLAYING',
      headline: message || 'Schedule cue',
      subhead: sub,
    };
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

/** Livelier flavour line under the objective headline, keyed by category.
 *  Unknown categories fall back to the Title-Cased category, blank to ''. */
function objectiveSubhead(category: string): string {
  const FLAVOUR: Record<string, string> = {
    'item-get': 'Got the goods! ⚔️',
    boss: 'Boss defeated!',
    dungeon: 'Dungeon conquered!',
    story: 'The story advances…',
    'side-quest': 'Side quest done!',
    '100%': 'Completionist!',
  };
  return FLAVOUR[category] ?? (category ? prettyKind(category) : '');
}

function prettyKind(kind: string): string {
  return kind
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
