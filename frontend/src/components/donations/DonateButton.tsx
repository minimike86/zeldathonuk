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
}: {
  pages: DonationPage[];
  currencySymbol?: string;
  className?: string;
  size?: 'sm' | 'lg';
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  if (pages.length === 0) return null;

  const sizeClass = size === 'lg' ? 'btn-lg' : 'btn-sm';
  return (
    <>
      <button
        type="button"
        className={`btn btn-bloodmoon ${sizeClass} ${className ?? ''}`.trim()}
        style={{ fontFamily: "'Bungee', cursive" }}
        onClick={() => setOpen(true)}
      >
        {label}
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
