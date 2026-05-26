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
import { faAccessibleIcon } from '@fortawesome/free-brands-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';
import { cn } from '@/lib/utils';
import { DonateButton } from '@/components/donations/DonateButton';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
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

export function Navbar() {
  const [collapsed, setCollapsed] = useState(true);
  const navigate = useNavigate();
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000);
  const donationPages = event?.donation_pages ?? [];

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
            {donationPages.length > 0 && (
              <div className={cn('me-3', !collapsed && 'p-1')}>
                <DonateButton
                  pages={donationPages}
                  currencySymbol={event?.currency_symbol}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
