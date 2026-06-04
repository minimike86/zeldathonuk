import { SignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import { Navigate } from 'react-router';
import { env } from '@/lib/env';

/**
 * Sign-in page. Renders Clerk's hosted <SignIn> widget; on success it returns
 * to the homepage — operators reach the panel via the navbar's "Control" link,
 * and non-operators (viewers) simply stay on the public site rather than being
 * bounced off /control. Already-signed-in users are sent home too.
 *
 * `routing="hash"` keeps Clerk's multi-step flow on this single /login route
 * (no catch-all splat needed). When Clerk isn't configured, there's nothing to
 * sign into — send visitors home.
 */
export function Login() {
  if (!env.CLERK_PUBLISHABLE_KEY) {
    return <Navigate to="/" replace />;
  }
  return (
    <div className="container mt-4 d-flex justify-content-center">
      <SignedOut>
        <SignIn routing="hash" forceRedirectUrl="/" signUpForceRedirectUrl="/" />
      </SignedOut>
      <SignedIn>
        <Navigate to="/" replace />
      </SignedIn>
    </div>
  );
}
