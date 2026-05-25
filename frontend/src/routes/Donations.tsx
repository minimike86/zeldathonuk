import { Link } from 'react-router';
import { DonationCards } from '@/components/DonationCards';
import './donations.css';

/**
 * Real donor data was sourced from Firebase. Until the Django backend is
 * wired up the donor list is empty and the page renders the legacy
 * "empty state" view (donate-cards + SpecialEffect benefits sidebar).
 */
const trackedDonations: unknown[] = [];

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
  return (
    <div className="d-flex flex-row min-vh-100">
      <div className="container donation-list-container p-3">
        <div className="h-100">
          <h3 className="text-bloodmoon mb-3">Thank you to all our donors!</h3>
          <p className="text-light">
            On behalf of everyone in the ZeldathonUK team we would like to thank all of
            the donors below for their generous donations:
          </p>

          {trackedDonations.length === 0 && (
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
