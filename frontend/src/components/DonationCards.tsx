import { DonateButton } from '@/components/donations/DonateButton';
import { eventDonationOptions, obsApi, usePolledQuery } from '@/lib/obsApi';
import type { EventModel } from '@/lib/obsApi';

/**
 * Thin wrapper around the unified DonationPicker, kept under its original name
 * so existing call sites (Charity.tsx, Donations.tsx) keep working. Prefers
 * the currently-active event but falls back to the most recently-started
 * event that has at least one donation option configured — that way the
 * Charity / Donations CTAs stay visible between streams.
 */
export function DonationCards({ children }: { children?: React.ReactNode }) {
  const { data: events } = usePolledQuery(obsApi.events, 30_000);
  const hasDonationOptions = (event: EventModel) =>
    eventDonationOptions(event).length > 0;
  const event =
    events?.find((e) => e.is_active && hasDonationOptions(e)) ??
    // The events viewset orders by -start_time, so the first match is the
    // most recently-started event that still has donation options attached.
    events?.find(hasDonationOptions) ??
    null;
  const pages = eventDonationOptions(event);
  if (pages.length === 0) return null;
  // Callers can pass children to replace the default Donate-now button with
  // their own clickable trigger (e.g. a styled card on /charity).
  if (children) {
    return (
      <DonateButton
        pages={pages}
        currencySymbol={event?.currency_symbol}
        className="donate-trigger-reset"
      >
        {children}
      </DonateButton>
    );
  }
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
