import { DonateButton } from '@/components/donations/DonateButton';
import { obsApi, usePolledQuery } from '@/lib/obsApi';

/**
 * Thin wrapper around the unified DonationPicker, kept under its original name
 * so existing call sites (Charity.tsx, Donations.tsx) keep working. Fetches
 * the active event itself so callers don't need to thread `donation_pages`
 * through. Renders nothing when no donation pages are configured.
 */
export function DonationCards() {
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000);
  const pages = event?.donation_pages ?? [];
  if (pages.length === 0) return null;
  return (
    <div className="d-flex justify-content-center my-3">
      <DonateButton
        pages={pages}
        currencySymbol={event?.currency_symbol}
        size="lg"
        label="Donate now"
      />
    </div>
  );
}
