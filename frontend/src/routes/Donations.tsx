import { Link } from 'react-router';
import { DonationCards } from '@/components/DonationCards';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { Donation } from '@/lib/obsApi';
import './donations.css';

const benefitRows = [
  {
    amount: '£5',
    img: '/assets/img/donation-items/xbox-controller-technology-games-design_dezeen_2364_col_23_1_-removebg-preview.png',
    alt: 'Flexible Fixings',
    desc: 'Can buy flexible fixings to enable a correct and firm hold of controller, joystick or button for safe and comfortable use.',
  },
  {
    amount: '£10',
    img: '/assets/img/donation-items/infinity4ps-thumbstick-heights-removebg-preview.png',
    alt: 'Joystick Extensions',
    desc: 'Could purchase joystick extensions, to potentially enable greater control of a thumbstick, with its increased leverage.',
  },
  {
    amount: '£25',
    img: '/assets/img/donation-items/sasha_setup-e1628153142123-removebg-preview.png',
    alt: 'Deliver Adaptive Gaming Setup',
    desc: 'Will enable us to deliver an adapted gaming setup quickly and directly to someone who needs it.',
  },
  {
    amount: '£50',
    img: '/assets/img/donation-items/2_ALT_MiniJoystick-min-removebg-preview.png',
    alt: 'Low Force Joysticks',
    desc: 'Will buy a gamepad to be modified in the workshop with low force joysticks and buttons for a gamer with weak hand muscles to use.',
  },
  {
    amount: '£75',
    img: '/assets/img/donation-items/3f2cd0bf-3b0e-402d-9c59-a8fdbd73ff47.png',
    alt: 'Xbox Adaptive Controller',
    descHtml:
      'Will buy an interface box like an <a class="text-danger" href="https://www.xbox.com/en-GB/accessories/controllers/xbox-adaptive-controller" target="_blank" rel="noreferrer">Xbox Adaptive Controller</a> for use as part of a gaming setup.',
  },
  {
    amount: '£100',
    img: '/assets/img/donation-items/monstertech_table_mount_warthog_joystick_hero_1_-removebg-preview.png',
    alt: 'Mounting System',
    desc: 'Can enable us to buy a mounting system which will hold a joystick and position it for optimum use by a gamer to control it.',
  },
  {
    amount: '£200',
    img: '/assets/img/donation-items/img_01-removebg-preview.png',
    alt: 'Single Handed Controller',
    desc: 'Could buy a single handed controller to enable a disabled gamer to play with just one hand.',
  },
];

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

  return (
    <div className="d-flex flex-row min-vh-100">
      <div className="container donation-list-container p-3">
        <div className="h-100">
          <h3 className="text-bloodmoon mb-3">Thank you to all our donors!</h3>
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
                    <h6 className="text-bloodmoon">Make a donation</h6>
                  </div>
                  <DonationCards />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 d-none d-xl-block">
        <div className="card bg-bloodmoon" style={{ width: '28rem' }}>
          <div className="text-center card card-header text-light">
            <h5 className="card-title text-bloodmoon mb-0" style={{ fontSize: '1.5em' }}>
              What could your donation do?
            </h5>
          </div>
          <div className="text-center card card-body small">
            <div className="text-light mb-3">
              <Link className="link-warning" to="/charity">
                SpecialEffect
              </Link>{' '}
              don't charge anything at all for their help. That's why your donations,
              large or small, really do count. Without your support they wouldn't be
              able to help people with physical disabilities to enjoy a better quality
              of life through their assessments, online resources and collaboration
              with key developers.
            </div>
            <table className="table text-white small mb-0">
              <tbody>
                {benefitRows.map((row) => (
                  <tr key={row.amount}>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div className="donation-benefit-amount">{row.amount}</div>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <img className="donation-benefit-img" src={row.img} alt={row.alt} />
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      {row.descHtml ? (
                        <span
                          className="donation-benefit-desc"
                          dangerouslySetInnerHTML={{ __html: row.descHtml }}
                        />
                      ) : (
                        <span className="donation-benefit-desc">{row.desc}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
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
  const initial = (d.donor_name || 'A').charAt(0).toUpperCase();
  const when = new Date(d.donated_at);
  return (
    <div className="col-12 col-md-6">
      <div
        style={{
          background:
            'linear-gradient(160deg, rgba(231,19,71,0.08) 0%, rgba(0,0,0,0.35) 100%)',
          border: '1px solid rgba(231, 19, 71, 0.35)',
          borderRadius: 10,
          padding: '14px 16px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            aria-hidden
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background:
                'linear-gradient(135deg, #e71347 0%, #731c37 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <div className="text-light" style={{ fontWeight: 600 }}>
              {d.donor_name || 'Anonymous'}
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
          <div
            style={{
              fontFamily: "'Bungee', sans-serif",
              fontSize: 22,
              background: 'linear-gradient(45deg, #e71347, #da4471, #e7364b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              flexShrink: 0,
            }}
          >
            {currency}
            {Number(d.amount).toFixed(2)}
          </div>
        </div>

        {d.message && (
          <blockquote
            className="text-light small m-0"
            style={{
              paddingLeft: 12,
              borderLeft: '3px solid rgba(231,19,71,0.55)',
              fontStyle: 'italic',
              whiteSpace: 'pre-line',
            }}
          >
            {d.message}
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
      <div
        style={{
          background: 'rgba(0,0,0,0.25)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8,
          padding: '10px 14px',
          height: '100%',
        }}
      >
        <div
          className="small text-white-50 text-uppercase"
          style={{ letterSpacing: 0.5 }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: accent ? 28 : 22,
            fontWeight: 700,
            lineHeight: 1.1,
            ...(accent && {
              fontFamily: "'Bungee', sans-serif",
              background: 'linear-gradient(45deg, #e71347, #da4471, #e7364b)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }),
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
