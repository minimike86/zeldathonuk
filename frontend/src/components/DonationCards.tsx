import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';

const FB_URL =
  'https://www.facebook.com/donate/5194665980557244/?fundraiser_source=https://www.zeldathon.co.uk/';
const TILTIFY_URL = 'https://donate.tiltify.com/@msec/zeldathonuk-gameblast22';
const JG_URL = 'https://www.justgiving.com/fundraising/zeldathonuk-gameblast2022';
const GAMEBLAST_URL = 'https://www.gameblast.org.uk/about/';

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * The four donation cards reused by Home and Charity:
 * Facebook | Tiltify | JustGiving (with fee-warning popup) | GameBlast.
 */
export function DonationCards() {
  const [jgWarnOpen, setJgWarnOpen] = useState(false);
  return (
    <>
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

      {jgWarnOpen && (
        <JustGivingFeeWarning
          onClose={() => setJgWarnOpen(false)}
          onConfirm={() => {
            setJgWarnOpen(false);
            openExternal(JG_URL);
          }}
        />
      )}
    </>
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
              <span
                className="d-inline-block"
                style={{ position: 'relative', width: '.9em' }}
              >
                {icon}
              </span>{' '}
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
