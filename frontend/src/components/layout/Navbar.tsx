import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faListOl,
  faPoundSign,
  faHandHolding,
  faCarrot,
  faGamepad,
  faHistory,
  faCaretUp,
} from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faAccessibleIcon } from '@fortawesome/free-brands-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import { cn } from '@/lib/utils';
import './navbar.css';

type Glyph = FontAwesomeIconProps['icon'];

type NavItem = {
  to: string;
  label: string;
  layers: { icon: Glyph; style?: React.CSSProperties }[];
};

const navItems: NavItem[] = [
  { to: '/', label: 'Home', layers: [{ icon: faHeart, style: { marginTop: '-0.25em' } }] },
  {
    to: '/schedule',
    label: 'Schedule',
    layers: [{ icon: faListOl, style: { marginTop: '-0.25em' } }],
  },
  {
    to: '/donations',
    label: 'Donations',
    layers: [
      { icon: faPoundSign, style: { marginTop: '-0.45em', fontSize: '0.5em' } },
      { icon: faHandHolding, style: { marginTop: '-0.25em' } },
    ],
  },
  {
    to: '/incentives',
    label: 'Incentives',
    layers: [{ icon: faCarrot, style: { marginTop: '-0.25em' } }],
  },
  {
    to: '/charity',
    label: 'Charity',
    layers: [
      { icon: faGamepad, style: { marginTop: '-0.05em' } },
      { icon: faAccessibleIcon, style: { marginTop: '-0.25em' } },
    ],
  },
  {
    to: '/history',
    label: 'History',
    layers: [{ icon: faHistory, style: { marginTop: '-0.25em' } }],
  },
  {
    to: '/about',
    label: 'About',
    layers: [
      { icon: faCaretUp, style: { marginTop: '-0.45em' } },
      { icon: faCaretUp, style: { marginTop: '-0.15em', marginLeft: '0.45em' } },
      { icon: faCaretUp, style: { marginTop: '-0.15em', marginRight: '0.42em' } },
    ],
  },
];

const FB_URL =
  'https://www.facebook.com/donate/5194665980557244/?fundraiser_source=https://www.zeldathon.co.uk/';
const TILTIFY_URL = 'https://donate.tiltify.com/@msec/zeldathonuk-gameblast22';
const JG_URL = 'https://www.justgiving.com/fundraising/zeldathonuk-gameblast2022';

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function Navbar() {
  const [collapsed, setCollapsed] = useState(true);
  const [jgWarnOpen, setJgWarnOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="navbar navbar-expand-lg">
      <NavLink
        to="/"
        className={({ isActive }) =>
          cn('navbar-brand ms-3 me-4', isActive && 'active-link')
        }
        onClick={() => navigate('/')}
      >
        <img
          src="/assets/img/1gxaef91xpst0u.png"
          className="position-absolute"
          style={{
            maxWidth: 32,
            maxHeight: 32,
            top: 8,
            left: 115,
            filter: 'opacity(0.75)',
            transform: 'rotate(10deg)',
          }}
          title="GB Flag"
          alt="GB Flag"
        />
        <img
          src="/assets/img/Zeldathon-Logo-WW-white.svg"
          style={{ minWidth: 120, maxHeight: '1.5em', filter: 'opacity(0.95)' }}
          title="ZeldathonUK"
          alt="ZeldathonUK"
        />
      </NavLink>

      <button
        className="navbar-toggler border border-dark"
        type="button"
        aria-controls="navbarToggleExternalContent"
        aria-expanded={!collapsed}
        aria-label="Toggle navigation"
        onClick={() => setCollapsed((c) => !c)}
      >
        <span className="navbar-toggler-icon text-white">
          <FontAwesomeIcon icon={faBars} style={{ marginTop: '0.25em' }} />
        </span>
      </button>

      <div
        className={cn('collapse navbar-collapse', !collapsed && 'show')}
        id="navbarToggleExternalContent"
      >
        <div className="d-flex flex-fill justify-content-around">
          <div className="d-flex flex-shrink-0 justify-content-center mx-2">
            <ul className="navbar-nav">
              {navItems.map((item) => (
                <li key={item.to} className="nav-item nav-item-bloodmoon">
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn('nav-link nav-link-dark pb-0', isActive && 'active-link')
                    }
                  >
                    <div
                      className="nav-icon-bloodmoon text-center"
                      style={{ fontSize: '2em' }}
                    >
                      <span className="fa-layers">
                        {item.layers.map((layer, i) => (
                          <FontAwesomeIcon
                            key={i}
                            icon={layer.icon}
                            transform="shrink-4"
                            style={layer.style}
                          />
                        ))}
                      </span>
                    </div>
                    <div className="position-relative" style={{ marginTop: '-1.1em' }}>
                      {item.label}
                    </div>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="d-flex flex-grow-1 justify-content-center">
            <div className="d-flex align-items-center me-3" />
          </div>

          <div className="d-flex flex-shrink-0 align-items-center">
            <ul className="navbar-nav">
              <li className={cn('nav-item d-flex ms-2', !collapsed && 'p-1')}>
                <div className="align-self-center">
                  <button
                    className="btn btn-sm btn-bloodmoon"
                    onClick={() => openExternal(FB_URL)}
                    style={{ fontFamily: "'Bungee', cursive" }}
                  >
                    <div className="d-flex" title="Donate via Facebook!">
                      <div
                        className="d-flex align-self-center"
                        style={{ width: '.9em' }}
                      >
                        <FontAwesomeIcon
                          icon={faFacebook}
                          style={{ position: 'relative', top: 2 }}
                        />
                      </div>
                      <span style={{ position: 'relative', top: 2 }}>&nbsp;Donate</span>
                    </div>
                  </button>
                </div>
              </li>
              <li className={cn('nav-item d-flex ms-2', !collapsed && 'p-1')}>
                <div className="align-self-center">
                  <button
                    className="btn btn-sm btn-bloodmoon"
                    onClick={() => openExternal(TILTIFY_URL)}
                    style={{ fontFamily: "'Bungee', cursive" }}
                  >
                    <div className="d-flex" title="Donate via Tiltify!">
                      <div
                        className="d-flex align-self-center"
                        style={{ width: '.9em' }}
                      >
                        <img
                          style={{ maxWidth: '.9em', filter: 'brightness(10)' }}
                          src="/assets/img/Tiltify_Logo.png"
                          alt="Tiltify logo"
                        />
                      </div>
                      <span style={{ position: 'relative', top: 1 }}>&nbsp;Donate</span>
                    </div>
                  </button>
                </div>
              </li>
              <li className={cn('nav-item d-flex ms-2', !collapsed && 'p-1')}>
                <div className="align-self-center">
                  <button
                    className="btn btn-sm btn-bloodmoon"
                    onClick={() => setJgWarnOpen(true)}
                    style={{ fontFamily: "'Bungee', cursive" }}
                  >
                    <div className="d-flex" title="Donate via JustGiving!">
                      <div
                        className="d-flex align-self-center"
                        style={{ width: '.9em' }}
                      >
                        <img
                          style={{ maxWidth: '.9em', filter: 'brightness(10)' }}
                          src="/assets/img/justgiving-g.svg"
                          alt="JustGiving logo"
                        />
                      </div>
                      <span style={{ position: 'relative', top: 1 }}>&nbsp;Donate</span>
                    </div>
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <JustGivingFeeWarning
        open={jgWarnOpen}
        onClose={() => setJgWarnOpen(false)}
        onConfirm={() => {
          setJgWarnOpen(false);
          openExternal(JG_URL);
        }}
      />
    </nav>
  );
}

function JustGivingFeeWarning({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
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
