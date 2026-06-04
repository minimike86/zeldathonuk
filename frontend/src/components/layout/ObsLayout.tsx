import { Outlet } from 'react-router';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useRouteTitle } from '@/lib/usePageTitle';

/**
 * Bare layout for OBS overlays and the /obs index. No navbar/footer — what
 * the browser source sees is exactly the route's element. We add a scroll
 * container so long pages (the /obs index, /control panel) can scroll while
 * the actual OBS layout pages (which pin themselves to 100vh) still fit.
 */
export function ObsLayout() {
  useRouteTitle();
  return (
    <div className="router-outlet-obs">
      {/* OBS is a separate browser, so the themeBus BroadcastChannel can't reach
        * it — poll fast (2.5s) so theme switches land on the overlays promptly
        * instead of waiting up to the 30s same-browser default. */}
      <ThemeProvider pollMs={2500} />
      <Outlet />
    </div>
  );
}
