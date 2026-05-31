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
        <nav>
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
