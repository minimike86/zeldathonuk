import { useEffect } from 'react';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { Outlet, useNavigate } from 'react-router';
import { env } from '@/lib/env';
import { setAuthTokenGetter } from '@/lib/api';

/**
 * Wraps the public + control route groups in Clerk so they can use auth, and
 * registers the signed-in token with the API layer. Deliberately does NOT wrap
 * the /obs/* overlays — those are loaded by OBS browser sources (no login) and
 * stay Clerk-free / lean.
 *
 * Degrades gracefully: when VITE_CLERK_PUBLISHABLE_KEY is unset, auth is
 * disabled and we just render the routes (the control panel guards itself shut
 * — see ControlLayout). This keeps the public site booting before Clerk is
 * configured.
 */
export function ClerkProviderLayout() {
  const navigate = useNavigate();
  const publishableKey = env.CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return <Outlet />;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      // Route Clerk's internal redirects through React Router (no full reloads).
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      afterSignOutUrl="/"
    >
      <ApiTokenBridge />
      <Outlet />
    </ClerkProvider>
  );
}

/**
 * Feeds Clerk's `getToken` into the API layer so every `api()` call carries the
 * signed-in user's bearer token automatically. Renders nothing.
 */
function ApiTokenBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    return () => setAuthTokenGetter(null);
  }, [getToken]);
  return null;
}
