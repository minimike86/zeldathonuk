import { Link } from 'react-router';
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react';
import { useMe } from '@/lib/useMe';
import { HazardButton, UserBadge } from '@/components/auth/authControls';

// Login matches the navbar DonateButton (btn btn-bloodmoon btn-sm + p-2 px-5,
// Bungee face) so the signed-out CTA pair reads as one button set.
const LOGIN_BTN = 'btn btn-bloodmoon btn-sm p-2 px-5';
const BTN_STYLE: React.CSSProperties = { fontFamily: "'Bungee', cursive" };

/**
 * Auth controls for the public navbar:
 *   - signed out → a Login link (bloodmoon, matches Donate)
 *   - signed in  → the UserBadge (avatar + name; operators get an "Operator"
 *     chip under the name). Operators also get a hazard-striped Control button
 *     that opens /control. Non-operators just see the UserBadge.
 *
 * Rendered only when Clerk is enabled (the Navbar guards on
 * env.CLERK_PUBLISHABLE_KEY), so these Clerk components/hooks always run inside
 * <ClerkProvider>.
 */
export function NavAuth() {
  const { isSignedIn } = useAuth();
  const { me } = useMe(isSignedIn === true);
  const isOperator = me?.role === 'operator';

  return (
    <div className="d-flex align-items-center gap-2 me-3">
      <SignedOut>
        <Link to="/login" className={LOGIN_BTN} style={BTN_STYLE}>
          Login
        </Link>
      </SignedOut>
      <SignedIn>
        {isOperator && (
          <HazardButton to="/control" title="Open the control panel">
            Control
          </HazardButton>
        )}
        <UserBadge isOperator={isOperator} />
      </SignedIn>
    </div>
  );
}
