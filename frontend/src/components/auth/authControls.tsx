import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router';
import { UserButton } from '@clerk/clerk-react';
import './authControls.css';

const BUNGEE: CSSProperties = { fontFamily: "'Bungee', cursive" };

/**
 * Amber/black hazard-striped button — the privileged-surface motif. Used for
 * the home navbar's CONTROL button and the control panel's HOME button so the
 * two mirror each other. Sized to match the navbar's Donate button.
 */
export function HazardButton({
  to,
  title,
  children,
}: {
  to: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="btn btn-sm p-2 px-5 hazard-btn"
      style={BUNGEE}
      title={title}
    >
      {children}
    </Link>
  );
}

/**
 * Clerk UserButton with the name shown and, for operators, an "Operator" chip
 * tucked under the name (via .user-identifier::after). Identical on the public
 * navbar and the control panel header.
 */
export function UserBadge({
  isOperator,
  afterSignOutUrl = '/',
}: {
  isOperator: boolean;
  afterSignOutUrl?: string;
}) {
  return (
    <UserButton
      showName
      afterSignOutUrl={afterSignOutUrl}
      appearance={{
        elements: {
          userButtonOuterIdentifier: isOperator
            ? 'user-identifier is-operator'
            : 'user-identifier',
        },
      }}
    />
  );
}
