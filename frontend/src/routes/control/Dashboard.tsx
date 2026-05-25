import { NavLink, Outlet, useLocation } from 'react-router';
import { ControlOverview } from './Overview';
import './control.css';

const sections = [
  { to: '/control', label: 'Overview', end: true },
  { to: '/control/schedule', label: 'Schedule' },
  { to: '/control/timer', label: 'Timer' },
  { to: '/control/items', label: 'Items' },
  { to: '/control/donations', label: 'Donations' },
  { to: '/control/brb', label: 'BRB' },
  { to: '/control/audio', label: 'Music' },
  { to: '/control/games', label: 'Games' },
];

export function ControlLayout() {
  const location = useLocation();
  const isRoot = location.pathname === '/control' || location.pathname === '/control/';

  return (
    <div className="control-shell">
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
