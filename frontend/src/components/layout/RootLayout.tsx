import { Outlet } from 'react-router';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';
import { useRouteTitle } from '@/lib/usePageTitle';

/**
 * Default site shell — navbar, page content, footer.
 * Mirrors the structure of legacy/src/app/app.component.html (non-API/non-obs branch).
 */
export function RootLayout() {
  useRouteTitle();
  return (
    <div className="d-flex flex-column flex-fill zeldathon-bg">
      <ThemeProvider renderBackgroundMedia />
      <div className="header">
        <Navbar />
      </div>
      <div className="overflow-auto router-outlet">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
