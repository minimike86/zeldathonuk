import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faBox, faEnvelope, faKey, faGift } from '@fortawesome/free-solid-svg-icons';
import { faTwitch, faDiscord } from '@fortawesome/free-brands-svg-icons';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type {
  DonationPage,
  Incentive as ApiIncentive,
  Raffle,
  RaffleDeliveryMethodKey,
} from '@/lib/obsApi';
import { DonateButton } from '@/components/donations/DonateButton';
import './incentives.css';

/** A bid-war option parsed off an incentive's `payload.options`. */
interface BidWarOption {
  id: string;
  name: string;
  votes: number;
}

/** Pull bid-war options off an incentive payload, mirroring the shape the
 *  control panel writes. Returns null unless there are at least two valid
 *  options (a single option isn't a contest). */
function readBidWarOptions(incentive: ApiIncentive): BidWarOption[] | null {
  const opts = (incentive.payload as { options?: unknown }).options;
  if (!Array.isArray(opts) || opts.length < 2) return null;
  return opts
    .filter(
      (o): o is { id: string; name: string; votes?: unknown } =>
        !!o &&
        typeof (o as { id?: unknown }).id === 'string' &&
        typeof (o as { name?: unknown }).name === 'string',
    )
    .map((o) => ({
      id: o.id,
      name: o.name,
      votes: typeof o.votes === 'number' ? o.votes : Number(o.votes) || 0,
    }));
}

/** Normalised view model shared by the always-on freebie card and the
 *  database-backed incentive cards so they render through one component. */
interface IncentiveCard {
  key: string;
  name: string;
  imageUrl?: string;
  badge: { label: string; tone: 'free' | 'open' | 'unlocked' };
  /** Trusted HTML (freebie copy with links). Mutually exclusive with `text`. */
  html?: string;
  /** Plain operator-entered text (real incentives). */
  text?: string;
  goal?: number;
  current?: number;
  pct?: number;
  options?: BidWarOption[];
}

/** The Twitch viewership card is a freebie that's always available — it
 *  isn't a donation goal, so it lives here rather than in the database. */
function freebieCard(twitchChannel: string): IncentiveCard {
  const channelHref = `https://www.twitch.tv/${twitchChannel}/`;
  const link = (label: string) =>
    `<a href="${channelHref}" target="_blank" rel="noreferrer" class="incentive-inline-link">${label}</a>`;
  return {
    key: 'twitch-viewership',
    name: 'Twitch Viewership',
    imageUrl: '/assets/img/challenges/twitch-views.jpg',
    badge: { label: 'Always free', tone: 'free' },
    html:
      `${link('Raid')}, ${link('Host')}, ${link('Share')}, and ${link('Watch')} ` +
      'the stream — it is the single best free thing you can do to support us. ' +
      'More views means more donations for ' +
      '<a href="https://www.specialeffect.org.uk/what-we-do" target="_blank" rel="noreferrer" class="incentive-inline-link">SpecialEffect</a>.',
  };
}

function toCard(i: ApiIncentive): IncentiveCard {
  const goal = parseFloat(i.goal_amount) || 0;
  const current = parseFloat(i.current_amount) || 0;
  return {
    key: `incentive-${i.id}`,
    name: i.name,
    imageUrl: i.image_url || undefined,
    badge: i.is_reached
      ? { label: 'Unlocked!', tone: 'unlocked' }
      : { label: `${Math.round(i.progress_pct)}% funded`, tone: 'open' },
    text: i.description || undefined,
    goal,
    current,
    pct: i.progress_pct,
    options: readBidWarOptions(i) ?? undefined,
  };
}

/** Icon + short label per delivery method, shown on each raffle card so
 *  viewers know how a prize is handed over. */
const DELIVERY_META: Record<RaffleDeliveryMethodKey, { label: string; icon: IconDefinition }> = {
  physical: { label: 'Postal', icon: faBox },
  email: { label: 'Email', icon: faEnvelope },
  twitch: { label: 'Twitch', icon: faTwitch },
  discord: { label: 'Discord', icon: faDiscord },
  code: { label: 'Digital code', icon: faKey },
  other: { label: 'Other', icon: faGift },
};

export function Incentives() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 30_000);
  const { data: incentives } = usePolledQuery(
    () =>
      event
        ? obsApi.incentives({ eventId: event.id, activeOnly: true })
        : Promise.resolve([] as ApiIncentive[]),
    15_000,
    [event?.id],
  );
  const { data: raffles } = usePolledQuery(
    () =>
      event
        ? obsApi.raffles({ eventId: event.id, activeOnly: true })
        : Promise.resolve([] as Raffle[]),
    15_000,
    [event?.id],
  );

  const twitchChannel = event?.twitch_channel || 'zeldathonuk';
  const symbol = event?.currency_symbol || '£';
  const donationPages = event?.donation_pages ?? [];

  // Freebie always leads; real incentives follow in their stored order.
  const cards: IncentiveCard[] = [
    freebieCard(twitchChannel),
    ...(incentives ?? []).map(toCard),
  ];

  return (
    <div className="container p-3 min-vh-100 text-white">
      <div className="my-3">
        <header className="text-center mb-5">
          <h1 className="incentives-hero-title">Incentives For Donors</h1>
          <p className="text-light mt-3 mx-auto" style={{ maxWidth: '46rem' }}>
            Our donor incentives are here to inspire and motivate more people to start
            donating, give a little more than they normally would, and stay engaged with
            our chosen charity all event long.
          </p>
          <div className="d-flex justify-content-center mt-4">
            <DonateButton
              pages={donationPages}
              currencySymbol={symbol}
              size="lg"
              className="px-4 py-2"
              label="Donate now"
            />
          </div>
        </header>

        <section className="mb-5">
          <h2 className="incentives-section-title">Donation Incentives</h2>
          <p className="text-light mb-4">
            Hit a goal together and we make it happen on stream. Every contribution
            nudges the bar — when it fills, the incentive unlocks live.
          </p>
          <div className="incentive-grid">
            {cards.map((card) => (
              <IncentiveCardView key={card.key} card={card} symbol={symbol} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="incentives-section-title">Raffle Prizes</h2>
          <p className="text-light mb-4">
            Donate while a raffle is open and you are automatically entered — bigger
            donations mean better odds. Raffles are drawn on stream throughout the
            marathon, so stay tuned to win!
          </p>
          {(raffles ?? []).length === 0 ? (
            <p className="text-white-50">No raffles are running right now — check back soon!</p>
          ) : (
            <div className="incentive-grid">
              {(raffles ?? []).map((raffle) => (
                <RaffleCardView
                  key={raffle.id}
                  raffle={raffle}
                  symbol={symbol}
                  donationPages={donationPages}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const currencyFmt = (symbol: string, value: number) =>
  `${symbol}${value.toFixed(2).replace(/\.00$/, '')}`;

function IncentiveCardView({ card, symbol }: { card: IncentiveCard; symbol: string }) {
  const reached = card.badge.tone === 'unlocked';
  const hasGoal = typeof card.goal === 'number' && card.goal > 0;
  const pct = Math.min(100, Math.max(0, card.pct ?? 0));
  return (
    <article className={`incentive-card${reached ? ' incentive-card--reached' : ''}`}>
      {card.imageUrl && (
        <img className="incentive-card-media" src={card.imageUrl} alt={card.name} />
      )}
      <div className="incentive-card-body">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <h3 className="incentive-card-title">{card.name}</h3>
          <span className={`incentive-badge incentive-badge--${card.badge.tone}`}>
            {card.badge.label}
          </span>
        </div>

        {card.html ? (
          <p
            className="incentive-card-desc"
            dangerouslySetInnerHTML={{ __html: card.html }}
          />
        ) : card.text ? (
          <p className="incentive-card-desc">{card.text}</p>
        ) : null}

        {card.options && card.options.length > 0 && (
          <BidWarOptions options={card.options} />
        )}

        {hasGoal && (
          <div className="mt-auto pt-2">
            <div
              className="incentive-progress"
              style={{ ['--pct' as string]: `${pct}%` }}
              role="progressbar"
              aria-valuenow={Math.round(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
            <div className="incentive-amounts mt-2">
              <span className="incentive-amount-current">
                {currencyFmt(symbol, card.current ?? 0)}
              </span>
              <span className="incentive-amount-goal">
                of {currencyFmt(symbol, card.goal ?? 0)}
              </span>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function BidWarOptions({ options }: { options: BidWarOption[] }) {
  const total = options.reduce((sum, o) => sum + o.votes, 0);
  const ranked = [...options].sort((a, b) => b.votes - a.votes);
  return (
    <div className="incentive-options">
      {ranked.map((o, idx) => {
        const share = total > 0 ? (o.votes / total) * 100 : 0;
        return (
          <div
            key={o.id}
            className={`incentive-option${idx === 0 && total > 0 ? ' incentive-option--leading' : ''}`}
            style={{ ['--share' as string]: `${share}%` }}
          >
            <span className="incentive-option-name">{o.name}</span>
            <span className="incentive-option-pct">{Math.round(share)}%</span>
          </div>
        );
      })}
    </div>
  );
}

function RaffleCardView({
  raffle,
  symbol,
  donationPages,
}: {
  raffle: Raffle;
  symbol: string;
  donationPages: DonationPage[];
}) {
  const drawn = raffle.status === 'drawn';
  const pot = parseFloat(raffle.total_weight) || 0;
  // Status badge mirrors the incentive tones: drawn → unlocked, open → open.
  const badge = drawn
    ? { label: 'Drawn', tone: 'unlocked' as const }
    : raffle.is_open
      ? { label: 'Open', tone: 'open' as const }
      : { label: 'Coming soon', tone: 'free' as const };
  return (
    <article className={`incentive-card${drawn ? ' incentive-card--reached' : ''}`}>
      {raffle.image_url && (
        <div className="incentive-prize-media">
          {/* Blurred, zoomed copy of the same art fills the letterbox gaps
            * around the contained image — the "ambient backdrop" trick
            * video apps use for vertical clips in a landscape frame. */}
          <img
            src={raffle.image_url}
            alt=""
            aria-hidden
            className="incentive-prize-backdrop"
          />
          <img src={raffle.image_url} alt={raffle.name} className="incentive-prize-img" />
          <span
            className={`incentive-card-status incentive-badge incentive-badge--${badge.tone}`}
          >
            {badge.label}
          </span>
        </div>
      )}
      <div className="incentive-card-body">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <h3 className="incentive-card-title">{raffle.name}</h3>
          {/* With no image there's no media corner to pin the status to,
            * so fall back to the title row. */}
          {!raffle.image_url && (
            <span className={`incentive-badge incentive-badge--${badge.tone}`}>
              {badge.label}
            </span>
          )}
        </div>

        <div className="d-flex gap-2 flex-wrap align-items-center">
          <span className="incentive-delivery-label">Delivery method:</span>
          <span className="incentive-badge incentive-badge--free">
            <FontAwesomeIcon icon={DELIVERY_META[raffle.delivery_method].icon} />
            {DELIVERY_META[raffle.delivery_method].label}
          </span>
          {raffle.quantity > 1 && (
            <span className="incentive-badge incentive-badge--free">
              ×{raffle.quantity} winners
            </span>
          )}
        </div>

        {raffle.description && (
          <p
            className="incentive-card-desc"
            dangerouslySetInnerHTML={{ __html: raffle.description }}
          />
        )}

        {drawn && raffle.winner_names.length > 0 && (
          <p className="incentive-card-desc mb-0">
            <strong>Winner{raffle.winner_names.length > 1 ? 's' : ''}:</strong>{' '}
            {raffle.winner_names.join(', ')}
          </p>
        )}

        <div className="incentive-amounts mt-auto pt-2">
          <span className="incentive-amount-current">
            {raffle.entrant_count} {raffle.entrant_count === 1 ? 'entry' : 'entries'}
          </span>
          <span className="incentive-amount-goal">
            {currencyFmt(symbol, pot)} in the pot
          </span>
        </div>

        {/* Entering a raffle means donating while it's open, so the CTA
          * opens the shared donation picker. Only shown for open raffles. */}
        {raffle.is_open && (
          <DonateButton
            pages={donationPages}
            currencySymbol={symbol}
            className="w-100 mt-2"
            label="Enter now"
          />
        )}
      </div>
    </article>
  );
}
