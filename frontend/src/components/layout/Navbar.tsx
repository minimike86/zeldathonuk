import { useEffect, useReducer, useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { FontAwesomeIcon, type FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
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
import { NavAuth } from '@/components/auth/NavAuth';
import { env } from '@/lib/env';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import { onThemeChanged } from '@/lib/themeBus';
import { useAccentDeck } from '@/lib/accentDeck';
import './navbar.css';

const DEFAULT_LOGO = '/assets/img/brand/logo/Zeldathon-Logo-2026-Gold-Flash.svg';

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
  // Listen to themeBus so /control/theme edits land in roughly one
  // render frame (same browser, BroadcastChannel) instead of waiting
  // on the poll cadence. The 3s floor is for cross-browser refresh
  // (e.g. OBS source picking up the new logo) and matches the cadence
  // already used by ThemeProvider + useOmnibarFeed.
  const [themeBump, dispatchThemeBump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => onThemeChanged(dispatchThemeBump), []);
  // cacheKey seeds the last theme on mount so the logo renders correct first
  // paint instead of flashing DEFAULT_LOGO until the fetch lands.
  const { data: theme } = usePolledQuery(obsApi.themeSettings, 30000, [themeBump], {
    cacheKey: 'zeldathon-theme',
  });
  const donationPages = event?.donation_pages ?? [];
  const logoSrc = theme?.logo_url || DEFAULT_LOGO;
  // Per-mount shuffled deck — each nav item picks one of the four
  // theme accents (primary + accent_1/2/3) so the bar shows off the
  // whole palette rather than painting all seven items the same
  // colour. Re-rolls on page refresh, stays stable while navigating.
  const navAccents = useAccentDeck(navItems.length);

  return (
    <nav className="navbar navbar-expand-lg">
      <NavLink
        to="/"
        className={({ isActive }) =>
          cn('navbar-brand ms-3 me-4', isActive && 'active-link')
        }
        onClick={() => navigate('/')}
      >
        {/* Logo + flag are wrapped in their own stacking context
          * (`isolation: isolate`) so the flag's `z-index: -1` only
          * ducks behind the logo, not behind the navbar itself.
          * Anchoring to this wrapper means the flag tracks the logo's
          * actual rendered right edge — no more hardcoded `left: 115`
          * that broke when the 2026 wordmark grew wider than the
          * previous year's mark. */}
        <span
          style={{
            position: 'relative',
            display: 'inline-block',
            isolation: 'isolate',
            lineHeight: 0,
          }}
        >
          <img
            src={logoSrc}
            style={{
              minWidth: 140,
              maxHeight: '2em',
              filter: 'opacity(0.95)',
              position: 'relative',
              zIndex: 1,
            }}
            title="ZeldathonUK"
            alt="ZeldathonUK"
          />
          {/* `right: -10` pushes ~22px of the 32px flag behind the
            * logo's right edge with 10px poking out, matching the
            * original visual when the legacy logo was 140px wide. */}
          <img
            src="/assets/img/brand/1gxaef91xpst0u.png"
            style={{
              position: 'absolute',
              top: 0,
              right: -6,
              width: 32,
              height: 32,
              filter: 'opacity(0.75)',
              transform: 'rotate(10deg)',
              zIndex: -1,
              pointerEvents: 'none',
            }}
            title="GB Flag"
            alt="GB Flag"
          />
        </span>
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
              {navItems.map((item, i) => (
                <li
                  key={item.to}
                  className="nav-item nav-item-bloodmoon"
                  data-accent={navAccents[i]}
                >
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
                {/* `p-2 px-5` matches the "Follow Us On Twitch" CTA on the
                  * home page so every donate-flavoured button across the
                  * app shares the same padding + size. */}
                <DonateButton
                  pages={donationPages}
                  currencySymbol={event?.currency_symbol}
                  className="p-2 px-5"
                />
              </div>
            )}
            {/* Login / profile + operator Control link. Only when Clerk is
              * configured (NavAuth uses Clerk hooks → must be inside the
              * provider, which only wraps the app when a key is set). */}
            {env.CLERK_PUBLISHABLE_KEY && <NavAuth />}
          </div>
        </div>
      </div>
    </nav>
  );
}
