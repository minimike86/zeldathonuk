import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';
import './home.css';

const FB_URL =
  'https://www.facebook.com/donate/5194665980557244/?fundraiser_source=https://www.zeldathon.co.uk/';
const TILTIFY_URL = 'https://donate.tiltify.com/@msec/zeldathonuk-gameblast22';
const JG_URL = 'https://www.justgiving.com/fundraising/zeldathonuk-gameblast2022';
const SPECIALEFFECT_URL = 'https://www.specialeffect.org.uk/what-we-do';
const GAMEBLAST_URL = 'https://www.gameblast.org.uk/about/';

// Pass every plausible parent so Twitch's iframe security check passes
// whether you're on localhost, the docker network, or the real domain.
const TWITCH_PARENTS = [
  'localhost',
  '127.0.0.1',
  'host.docker.internal',
  'zeldathon.co.uk',
  'www.zeldathon.co.uk',
];
const TWITCH_PARENT_QS = TWITCH_PARENTS.map((p) => `parent=${p}`).join('&');

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function useInnerWidth() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return w;
}

export function Home() {
  const innerWidth = useInnerWidth();
  const [jgWarnOpen, setJgWarnOpen] = useState(false);

  // currentVideoGame / nextVideoGame / startDate were sourced from Firebase
  // in the legacy app. With Firebase removed we render the equivalent of the
  // `notLive` and `checkSchedule` templates until the Django backend takes
  // over those reads.
  const currentVideoGame = null;
  const nextVideoGame = null;

  return (
    <div className="container-fluid">
      <div className="d-block card card-header mt-2 p-0">
        <div className="d-flex flex-row">
          <div className="ratio ratio-16x9" style={{ maxHeight: '60vh' }}>
            <iframe
              src={`https://player.twitch.tv/?channel=zeldathonuk&${TWITCH_PARENT_QS}&autoplay=false`}
              frameBorder="0"
              scrolling="no"
              allowFullScreen
              title="ZeldathonUK Twitch stream"
            />
          </div>
          {innerWidth >= 750 && (
            <iframe
              frameBorder="0"
              scrolling="no"
              id="chat_embed_widescreen"
              src={`https://www.twitch.tv/embed/zeldathonuk/chat?darkpopout&${TWITCH_PARENT_QS}`}
              width="33.5%"
              title="Twitch chat"
            />
          )}
        </div>
        {innerWidth < 750 && (
          <iframe
            frameBorder="0"
            scrolling="no"
            id="chat_embed_mobile"
            src={`https://www.twitch.tv/embed/zeldathonuk/chat?darkpopout&parent=${TWITCH_PARENT}`}
            height="250px"
            width="100%"
            title="Twitch chat"
          />
        )}
      </div>

      <div className="d-block bg-bloodmoon p-2 mb-2">
        <div
          className="row d-flex justify-content-evenly text-white mb-2"
          style={{ fontSize: '0.80em' }}
        >
          <div className="col-12 col-sm-6 col-md-4 pb-2 ps-3">
            <h6 className="text-bloodmoon">Currently Playing</h6>
            {currentVideoGame ? null : (
              <>
                <h5>ZeldathonUK is Offline</h5>
                <div className="mt-2" style={{ fontFamily: "'Bungee', cursive" }}>
                  <a
                    className="btn btn-sm btn-bloodmoon p-2 px-5"
                    title="Follow Us On Twitch"
                    href="https://www.twitch.tv/zeldathonuk"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Follow Us On Twitch
                  </a>
                </div>
              </>
            )}
          </div>

          <div className="col-12 col-sm-6 col-md-4 border-start border-2 border-danger pb-2 px-3">
            <h6 className="text-bloodmoon">Up Next</h6>
            {nextVideoGame ? null : (
              <>
                <h5>Check the schedule</h5>
                <div className="mt-2" style={{ fontFamily: "'Bungee', cursive" }}>
                  <Link
                    className="btn btn-sm btn-bloodmoon p-2 px-5"
                    title="Check The Schedule"
                    to="/schedule"
                  >
                    Check The Schedule
                  </Link>
                </div>
              </>
            )}
          </div>

          <div className="col-12 col-sm-12 col-md-4 border-start border-2 border-danger pb-2 ps-3">
            <h6 className="text-bloodmoon">Benefitting</h6>
            <div
              className="text-center"
              onClick={() => openExternal(SPECIALEFFECT_URL)}
              role="button"
              tabIndex={0}
            >
              <img
                src="/assets/img/specialeffect-logo.svg"
                alt="SpecialEffect logo"
                style={{ maxHeight: '2.5rem', cursor: 'pointer' }}
              />
            </div>
            <div className="row">
              <div className="col-7">
                <p className="text-specialeffect-blurb mb-0">
                  SpecialEffect is transforming the lives of people with physical
                  challenges; optimising their inclusion, enjoyment and quality of life
                  through accessible technology to control video games to the best of
                  their abilities.
                </p>
              </div>
              <div className="col align-self-center">
                <button
                  className="btn btn-specialeffect w-100"
                  onClick={() => openExternal(SPECIALEFFECT_URL)}
                >
                  CAN THEY HELP YOU?
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h6 className="text-bloodmoon" style={{ fontSize: '1.35em' }}>
            Make a donation
          </h6>
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-4">
            <DonationCard
              title="Donate"
              subtitle="using Facebook"
              feesUrl="https://www.facebook.com/help/901370616673951"
              giftAidUrl="https://www.facebook.com/help/728799837303698"
              onClick={() => openExternal(FB_URL)}
              icon={<FontAwesomeIcon icon={faFacebook} />}
              label="Facebook"
            />
            <DonationCard
              title="Donate"
              subtitle="using Tiltify"
              feesUrl="https://info.tiltify.com/support/solutions/articles/43000045885-what-are-the-fees-"
              giftAidUrl="https://www.gov.uk/claim-gift-aid/gift-aid-declarations"
              onClick={() => openExternal(TILTIFY_URL)}
              icon={
                <img
                  style={{
                    maxWidth: '.9em',
                    paddingBottom: '.25em',
                    filter: 'brightness(10)',
                  }}
                  src="/assets/img/Tiltify_Logo.png"
                  alt="Tiltify logo"
                />
              }
              label="Tiltify"
            />
            <DonationCard
              title="Donate"
              subtitle="using JustGiving"
              feesUrl="https://www.justgiving.com/info/fees"
              giftAidUrl="https://help.justgiving.com/hc/en-us/articles/200670391-A-guide-to-Gift-Aid-UK-only-"
              onClick={() => setJgWarnOpen(true)}
              icon={
                <img
                  style={{
                    maxWidth: '.9em',
                    paddingBottom: '.25em',
                    filter: 'brightness(10)',
                  }}
                  src="/assets/img/justgiving-g.svg"
                  alt="JustGiving logo"
                />
              }
              label="JustGiving"
            />

            <div className="col">
              <div
                className="d-flex btn btn-bloodmoon h-100"
                onClick={() => openExternal(GAMEBLAST_URL)}
                title="Find out more about the GameBlast event"
              >
                <div className="d-flex flex-column flex-md-row flex-fill">
                  <div className="flex-grow-1 align-self-center">
                    <h4 className="text-center">
                      <img
                        src="/assets/img/GB22_Logo_Linear_DarkBGs_Small.png"
                        alt="gameblast22 logo"
                        style={{ maxHeight: '2rem' }}
                      />
                    </h4>
                  </div>
                  <div className="align-self-center">
                    <div className="small text-white">
                      <span className="d-block small fw-bolder">
                        25-27<sup>th</sup> Feb 2022
                      </span>
                      <span className="d-block small">
                        The UK's Biggest Charity Gaming Weekend
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {jgWarnOpen && (
        <JustGivingFeeWarning
          onClose={() => setJgWarnOpen(false)}
          onConfirm={() => {
            setJgWarnOpen(false);
            openExternal(JG_URL);
          }}
        />
      )}
    </div>
  );
}

function DonationCard({
  title,
  subtitle,
  feesUrl,
  giftAidUrl,
  onClick,
  icon,
  label,
}: {
  title: string;
  subtitle: string;
  feesUrl: string;
  giftAidUrl: string;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="col">
      <div
        className="d-flex btn btn-bloodmoon"
        onClick={onClick}
        title={`Donate via ${label}`}
      >
        <div className="d-flex flex-column flex-md-row flex-fill">
          <div className="flex-grow-1 justify-content-center align-self-center">
            <h4 className="text-nowrap mb-0" style={{ fontFamily: "'Bungee', cursive" }}>
              {typeof icon === 'string' ? (
                <span>{icon}</span>
              ) : (
                <span
                  className="d-inline-block"
                  style={{ position: 'relative', width: '.9em' }}
                >
                  {icon}
                </span>
              )}{' '}
              {title}
            </h4>
            <div className="text-center small">
              <span className="d-block font-italic small">{subtitle}</span>
            </div>
          </div>
          <div>
            <div className="d-flex flex-row flex-md-column justify-content-evenly">
              <div className="mb-md-1">
                <a
                  className="btn btn-outline-light btn-sm"
                  href={feesUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={`More info on ${label} Fundraising Fees`}
                  style={{ fontSize: '0.65em' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Fees
                </a>
              </div>
              <div>
                <a
                  className="btn btn-outline-light btn-sm"
                  href={giftAidUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="More info on GiftAid"
                  style={{ fontSize: '0.65em' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  GiftAid
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JustGivingFeeWarning({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1080 }}
      onClick={onClose}
    >
      <div
        className="bg-white text-dark rounded p-4 mx-3"
        style={{ maxWidth: 540 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-3">
          Don't be fooled by JustGiving's "0% Platform Fee"! JustGiving charges
          non-profits a £39 (+VAT) monthly charge in addition to deducting a "Platform
          Processing Fee" of 1.9% + £0.20 from every donation. JustGiving will further
          deduct 5% from any GiftAid added by eligible UK tax payers.
        </p>
        <div className="d-flex justify-content-end gap-2">
          <button className="btn btn-outline-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-warning" onClick={onConfirm}>
            Donate Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
