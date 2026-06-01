import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { ControlOverview } from './Overview';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useRouteTitle } from '@/lib/usePageTitle';
import './control.css';

const sections = [
  { to: '/control', label: 'Overview', end: true },
  // Pre-event setup
  { to: '/control/events', label: 'Events' },
  { to: '/control/charities', label: 'Charities' },
  { to: '/control/games', label: 'Games' },
  { to: '/control/objectives', label: 'Objectives' },
  { to: '/control/runners', label: 'Runners' },
  { to: '/control/schedule', label: 'Schedule' },
  // Live show
  { to: '/control/timer', label: 'Timer' },
  { to: '/control/items', label: 'Items' },
  { to: '/control/donations', label: 'Donations' },
  { to: '/control/raffles', label: 'Raffles' },
  { to: '/control/audio', label: 'Music' },
  { to: '/control/brb', label: 'BRB' },
  { to: '/control/omnibar', label: 'Omnibar' },
  { to: '/control/chest-announcer', label: 'Chest announcer' },
  { to: '/control/logs', label: 'Logs & Queue' },
  // Visual / branding
  { to: '/control/theme', label: 'Theme' },
];

export function ControlLayout() {
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
            <span aria-hidden="true">☰</span> {currentLabel}
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
              {s.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="control-main">{isRoot ? <ControlOverview /> : <Outlet />}</main>
    </div>
  );
}
