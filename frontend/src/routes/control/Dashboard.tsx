import { NavLink, Outlet, useLocation } from 'react-router';
import { ControlOverview } from './Overview';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useRouteTitle } from '@/lib/usePageTitle';
import './control.css';

const sections = [
  { to: '/control', label: 'Overview', end: true },
  // Pre-event setup
  { to: '/control/events', label: 'Events' },
  { to: '/control/games', label: 'Games' },
  { to: '/control/runners', label: 'Runners' },
  { to: '/control/schedule', label: 'Schedule' },
  // Live show
  { to: '/control/timer', label: 'Timer' },
  { to: '/control/items', label: 'Items' },
  { to: '/control/donations', label: 'Donations' },
  { to: '/control/audio', label: 'Music' },
  { to: '/control/brb', label: 'BRB' },
  { to: '/control/omnibar', label: 'Omnibar' },
  { to: '/control/chest-announcer', label: 'Chest announcer' },
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
        <h1>Control Panel</h1>
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
