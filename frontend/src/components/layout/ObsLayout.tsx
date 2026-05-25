import { Outlet } from 'react-router';

/**
 * Bare layout for OBS overlays and the /obs index. No navbar/footer — what
 * the browser source sees is exactly the route's element. We add a scroll
 * container so long pages (the /obs index, /control panel) can scroll while
 * the actual OBS layout pages (which pin themselves to 100vh) still fit.
 */
export function ObsLayout() {
  return (
    <div className="router-outlet-obs">
      <Outlet />
    </div>
  );
}
