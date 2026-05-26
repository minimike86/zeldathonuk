import { useState } from 'react';
import type { DonationPage } from '@/lib/obsApi';
import { DonationPicker } from './DonationPicker';

/**
 * Single donate CTA that opens the unified DonationPicker modal. Renders
 * nothing when no pages are configured (no active event, or event with no
 * DonationPage rows) so callers don't have to do the `pages.length === 0`
 * check themselves.
 */
export function DonateButton({
  pages,
  currencySymbol,
  className,
  size = 'sm',
  label = 'Donate',
  children,
}: {
  pages: DonationPage[];
  currencySymbol?: string;
  className?: string;
  size?: 'sm' | 'lg';
  label?: string;
  /**
   * Render-as-children — when supplied, the children replace the default
   * Bungee `Donate` button content. The outer element stays a real
   * `<button>` so click + keyboard semantics are preserved. Used by the
   * Charity page to make the whole "Make a donation" tile the trigger.
   */
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (pages.length === 0) return null;

  const sizeClass = size === 'lg' ? 'btn-lg' : 'btn-sm';
  const buttonClass = children
    ? className ?? ''
    : `btn btn-bloodmoon ${sizeClass} ${className ?? ''}`.trim();
  const buttonStyle: React.CSSProperties | undefined = children
    ? undefined
    : { fontFamily: "'Bungee', cursive" };
  return (
    <>
      <button
        type="button"
        className={buttonClass}
        style={buttonStyle}
        onClick={() => setOpen(true)}
      >
        {children ?? label}
      </button>
      <DonationPicker
        pages={pages}
        currencySymbol={currencySymbol}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
