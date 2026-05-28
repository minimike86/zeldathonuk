import { Link } from 'react-router';
import { DonationCards } from '@/components/DonationCards';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { CharityImpactTier, Donation } from '@/lib/obsApi';
import { cleanForDisplay } from '@/lib/profanity';
import './donations.css';

/** ISO 4217 → display symbol for impact-tier amounts. Falls back to the
 *  raw code when an unmapped currency appears. */
const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
};

/** Format a tier's amount as e.g. "£5" (whole) or "£7.50" (with pence). */
function fmtTierAmount(tier: CharityImpactTier): string {
  const symbol = CURRENCY_SYMBOLS[tier.currency] ?? tier.currency;
  const amount = Number(tier.amount);
  const body =
    Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `${symbol}${body}`;
}

export function Donations() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000);
  const { data: donations } = usePolledQuery(
    () => (event ? obsApi.donations(event.id) : Promise.resolve([] as Donation[])),
    5000,
    [event?.id],
  );
  const { data: totals } = usePolledQuery(
    () =>
      event
        ? obsApi.donationTotals(event.id)
        : Promise.resolve({ by_platform: [], grand_total: '0', donation_count: 0 }),
    5000,
    [event?.id],
  );
  const currency = event?.currency_symbol ?? '£';
  const hasDonations = (donations?.length ?? 0) > 0;

  // The impact ("what could your donation do?") tiers live on the
  // primary beneficiary — same primary-first ordering the home page
  // uses for its Benefitting list.
  const benefitting = [...(event?.event_charities ?? [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.order - b.order;
  });
  const primaryCharity = benefitting[0]?.charity_detail ?? null;
  const impactTiers = primaryCharity?.impact_tiers ?? [];
  const charityName =
    primaryCharity?.short_name || primaryCharity?.name || 'The charity';

  return (
    <div className="d-flex flex-row min-vh-100">
      <div className="container donation-list-container p-3">
        <div className="h-100">
          <h3 className="donation-heading">Thank you to all our donors!</h3>
          <p className="text-light">
            On behalf of everyone in the ZeldathonUK team we would like to thank all of
            the donors below for their generous donations:
          </p>

          {hasDonations && (
            <>
              <div className="row g-2 mb-3">
                <DonationKpi
                  label="Raised so far"
                  value={`${currency}${Number(totals?.grand_total ?? 0).toFixed(2)}`}
                  accent
                />
                <DonationKpi
                  label="Donations"
                  value={String(totals?.donation_count ?? 0)}
                />
              </div>

              <div className="row g-3">
                {donations!.map((d) => (
                  <DonationTile key={d.id} donation={d} currency={currency} />
                ))}
              </div>

              <div className="d-flex justify-content-center mt-3">
                <DonationCards />
              </div>
            </>
          )}

          {!hasDonations && (
            <div className="d-flex justify-content-center h-75">
              <div className="d-flex align-self-center">
                <div className="my-5">
                  <div className="d-flex justify-content-start">
                    <h6 className="donation-heading">Make a donation</h6>
                  </div>
                  <DonationCards />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {impactTiers.length > 0 && (
        <div className="p-3 d-none d-xl-block">
          <div className="card bg-bloodmoon" style={{ width: '28rem' }}>
            <div className="text-center card card-header text-light">
              <h5 className="card-title donation-heading mb-0" style={{ fontSize: '1.5em' }}>
                Your donation's impact
              </h5>
            </div>
            <div className="text-center card card-body small">
              <div className="text-light text-start mb-3">
                Every donation to{' '}
                <Link className="link-warning" to="/charity">
                  {charityName}
                </Link>{' '}
                makes a real difference.
                <br />
                Here's what yours could do:
              </div>
              <table className="table text-white small mb-0">
                <tbody>
                  {impactTiers.map((tier) => (
                    <tr key={tier.id}>
                      <td style={{ verticalAlign: 'middle' }}>
                        <div className="donation-benefit-amount">
                          {fmtTierAmount(tier)}
                        </div>
                      </td>
                      {tier.image_url && (
                        <td style={{ verticalAlign: 'middle' }}>
                          <img
                            className="donation-benefit-img"
                            src={tier.image_url}
                            alt={tier.alt_text}
                          />
                        </td>
                      )}
                      <td style={{ verticalAlign: 'middle' }}>
                        {tier.description_html ? (
                          <span
                            className="donation-benefit-desc"
                            dangerouslySetInnerHTML={{ __html: tier.description_html }}
                          />
                        ) : (
                          <span className="donation-benefit-desc">
                            {tier.description}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DonationTile({
  donation: d,
  currency,
}: {
  donation: Donation;
  currency: string;
}) {
  // Donor names and messages are donor-supplied free text, so scrub them
  // through the LDNOOBW filter before they hit the public donor wall.
  const donorName = d.donor_name ? cleanForDisplay(d.donor_name) : '';
  const initial = (donorName || 'A').charAt(0).toUpperCase();
  const message = d.message ? cleanForDisplay(d.message) : '';
  const when = new Date(d.donated_at);
  return (
    <div className="col-12 col-md-6">
      <div className="donation-tile">
        <div className="d-flex align-items-center gap-3">
          <div aria-hidden className="donation-tile-avatar">
            {initial}
          </div>
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <div className="text-light donation-tile-name">
              {donorName || 'Anonymous'}
            </div>
            <div className="small text-white-50">
              {when.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
          <div className="donation-tile-amount">
            {currency}
            {Number(d.amount).toFixed(2)}
          </div>
        </div>

        {message && (
          <blockquote className="text-light small m-0 donation-tile-message">
            {message}
          </blockquote>
        )}
      </div>
    </div>
  );
}

function DonationKpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="col-6 col-md-3">
      <div className="donation-kpi">
        <div className="small text-white-50 text-uppercase donation-kpi-label">
          {label}
        </div>
        <div
          className={`donation-kpi-value${accent ? ' donation-kpi-value--accent' : ''}`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
