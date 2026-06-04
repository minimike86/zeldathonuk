import { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@clerk/clerk-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHouse,
  faPalette,
  faHandHoldingHeart,
  faCalendarDays,
  faUsers,
  faHandHoldingDollar,
  faTicket,
  faGamepad,
  faListOl,
  faGem,
  faBullseye,
  faStopwatch,
  faMusic,
  faTableCells,
  faGripLines,
  faBoxOpen,
  faRobot,
  faClipboardList,
} from '@fortawesome/free-solid-svg-icons';
import { faTwitch } from '@fortawesome/free-brands-svg-icons';
import { ControlOverview } from './Overview';
import { ThemeProvider } from '@/components/ThemeProvider';
import { HazardButton, UserBadge } from '@/components/auth/authControls';
import { useRouteTitle } from '@/lib/usePageTitle';
import { useMe } from '@/lib/useMe';
import { env } from '@/lib/env';
import './control.css';

const sections = [
  { to: '/control', label: 'Overview', end: true, icon: faHouse },
  // Visual / branding
  { to: '/control/theme', label: 'Theme', icon: faPalette },
  // Pre-event setup
  { to: '/control/charities', label: 'Charities', icon: faHandHoldingHeart },
  { to: '/control/events', label: 'Events', icon: faCalendarDays },
  { to: '/control/runners', label: 'Runners', icon: faUsers },
  { to: '/control/donations', label: 'Donations', icon: faHandHoldingDollar },
  { to: '/control/raffles', label: 'Raffles', icon: faTicket },
  // Gameplay related
  { to: '/control/games', label: 'Games', icon: faGamepad },
  { to: '/control/schedule', label: 'Schedule', icon: faListOl },
  { to: '/control/items', label: 'Items', icon: faGem },
  { to: '/control/objectives', label: 'Objectives', icon: faBullseye },
  // Live show
  { to: '/control/timer', label: 'Timer', icon: faStopwatch },
  // All Twitch tooling (chat, predictions, shoutouts, rewards) in one section.
  { to: '/control/twitch', label: 'Twitch', icon: faTwitch },
  // OBS Screens
  { to: '/control/audio', label: 'Music', icon: faMusic },
  { to: '/control/layouts', label: 'Layouts', icon: faTableCells },
  { to: '/control/omnibar', label: 'Omnibar', icon: faGripLines },
  { to: '/control/chest-announcer', label: 'Chest announcer', icon: faBoxOpen },
  // Fault triage :)
  { to: '/control/automation', label: 'Automation', icon: faRobot },
  { to: '/control/logs', label: 'Logs & Queue', icon: faClipboardList },
];

/**
 * Route Component for /control. Pure guard wrapper (calls no hooks itself) so it
 * can short-circuit before any Clerk hook runs when auth is disabled.
 *
 * Access model (operators only):
 *   - Clerk not configured  → home ("/")
 *   - not signed in         → /login
 *   - signed in, not operator (viewer) → home ("/")
 *   - signed in operator    → the control panel
 */
export function ControlLayout() {
  if (!env.CLERK_PUBLISHABLE_KEY) {
    return <Navigate to="/" replace />;
  }
  return <ControlGuard />;
}

function ControlGuard() {
  const { isLoaded, isSignedIn } = useAuth();
  const { me, error } = useMe(isSignedIn === true);

  if (!isLoaded) {
    return <ControlGate message="Checking access…" />;
  }
  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }
  if (error) {
    return <ControlGate message="Couldn’t verify your access. Try reloading." />;
  }
  // Signed in but the profile hasn't resolved yet — keep waiting rather than
  // evicting. `me` is the source of truth for the redirect below: redirecting
  // on a transient null would bounce operators home during the render window
  // after isSignedIn flips true but before useMe's fetch completes.
  if (!me) {
    return <ControlGate message="Checking access…" />;
  }
  if (me.role !== 'operator') {
    // Signed-in viewers (and any non-operator) aren't allowed in — send home.
    return <Navigate to="/" replace />;
  }
  return <ControlShell />;
}

/** Minimal full-screen status panel shown while access is resolving / blocked. */
function ControlGate({ message }: { message: string }) {
  return (
    <div className="control-shell">
      <ThemeProvider renderBackgroundMedia />
      <div className="control-gate" role="status">
        {message}
      </div>
    </div>
  );
}

function ControlShell() {
  useRouteTitle();
  const location = useLocation();
  const isRoot = location.pathname === '/control' || location.pathname === '/control/';
  // Mobile nav (≤768px): the link row collapses behind a hamburger that shows
  // the current section. CSS hides the toggle + shows the row on wide screens.
  const [navOpen, setNavOpen] = useState(false);

  // Collapse the dropdown whenever the route changes (incl. tapping the
  // already-active section), so picking a section closes the menu.
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  // Current section label for the collapsed toggle — longest matching `to`
  // wins so a sub-path beats the `/control` Overview root. Mirrors NavLink's
  // active rule (exact match for the `end` root, prefix match otherwise).
  const path = location.pathname.replace(/\/$/, '') || '/control';
  const current =
    [...sections]
      .filter((s) =>
        s.end ? path === s.to.replace(/\/$/, '') : path.startsWith(s.to),
      )
      .sort((a, b) => b.to.length - a.to.length)[0] ?? null;
  const currentLabel = current?.label ?? 'Menu';
  const currentIcon = current?.icon ?? null;

  return (
    <div className="control-shell">
      <ThemeProvider renderBackgroundMedia />
      <header className="control-header">
        {/* Title row carries the page heading next to an "Operator"
          * hazard pill so the privileged-access register is visible
          * the moment you land — the matching amber stripe sits along
          * the very top edge of the header (see .control-header
          * background in control.css). */}
        <div className="control-header-row">
          <h1>Control Panel</h1>
          <span className="control-operator-pill" aria-label="Operator access">
            Operator
          </span>
          {/* Right cluster mirrors the public navbar: a hazard HOME button
            * (the counterpart of the home page's CONTROL button) to the left of
            * the same UserBadge (avatar + name + "Operator" chip). */}
          <span className="control-user-cluster">
            <HazardButton to="/" title="Back to the public site">
              Home
            </HazardButton>
            <UserBadge isOperator afterSignOutUrl="/" />
          </span>
        </div>
        {/* Hamburger toggle — only visible ≤768px (see control.css). Shows the
          * current section so the collapsed state is still informative. */}
        <button
          type="button"
          className="control-nav-toggle"
          aria-expanded={navOpen}
          aria-controls="control-nav"
          onClick={() => setNavOpen((v) => !v)}
        >
          <span className="control-nav-toggle-label">
            <span aria-hidden="true">☰</span>{' '}
            {currentIcon && <FontAwesomeIcon icon={currentIcon} fixedWidth />}{' '}
            {currentLabel}
          </span>
          <span className="control-nav-toggle-caret" aria-hidden="true">▾</span>
        </button>
        <nav id="control-nav" className={`control-nav${navOpen ? ' is-open' : ''}`}>
          {sections.map((s) => (
            <NavLink
              key={s.to}
              to={s.to}
              end={s.end}
              className={({ isActive }) =>
                `control-nav-link${isActive ? ' active' : ''}`
              }
            >
              <FontAwesomeIcon icon={s.icon} fixedWidth className="control-nav-icon" />
              {s.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="control-main">{isRoot ? <ControlOverview /> : <Outlet />}</main>
    </div>
  );
}
