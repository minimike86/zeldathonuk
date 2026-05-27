import { useEffect } from 'react';
import type { DonationPage } from '@/lib/obsApi';
import { PLATFORM_META } from './platforms';

/**
 * Modal that lists every DonationPage attached to an event. The primary
 * page (is_primary=true) is rendered first with a badge; the rest follow in
 * their stored `order`. Each row exposes fees/Gift Aid chips (when their
 * respective URLs are set on the page) and an inline yellow warning banner
 * (when `fee_warning` is set).
 */
export function DonationPicker({
  pages,
  currencySymbol = '£',
  open,
  onClose,
}: {
  pages: DonationPage[];
  currencySymbol?: string;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || pages.length === 0) return null;

  const sorted = [...pages].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    if (a.order !== b.order) return a.order - b.order;
    return a.id - b.id;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose a donation platform"
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: 'rgba(0, 0, 0, 0.65)', zIndex: 1080, padding: '1rem' }}
      onClick={onClose}
    >
      <div
        className="rounded-3 shadow-lg position-relative text-white"
        style={{
          maxWidth: 640,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'var(--theme-bg-from, #2b1b25)',
          border: 'var(--theme-divider-thickness, 1px) solid var(--theme-line, rgba(231, 19, 71, 0.45))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className="d-flex justify-content-between align-items-center p-3"
          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)' }}
        >
          <h2 className="m-0" style={{ fontSize: '1.4rem' }}>
            Choose how to donate
          </h2>
          <button
            type="button"
            className="btn-close btn-close-white"
            aria-label="Close"
            onClick={onClose}
          />
        </header>

        <div className="p-3 d-flex flex-column gap-3">
          {sorted.map((page, idx) => (
            <DonationRow
              key={page.id}
              page={page}
              isFirst={idx === 0}
              currencySymbol={currencySymbol}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DonationRow({
  page,
  isFirst,
  currencySymbol,
}: {
  page: DonationPage;
  isFirst: boolean;
  currencySymbol: string;
}) {
  const meta = PLATFORM_META[page.platform];
  // Always show the platform's display_label (controlled by the
  // DonationPlatformProfile); the per-page `label` field is kept for
  // internal/admin use but doesn't override the user-facing heading.
  const title = page.display_label;
  const emphasised = isFirst || page.is_primary;
  const minAmount = parseFloat(page.minimum_donation_amount || '0');
  const minDonation = minAmount > 0
    ? `${currencySymbol}${minAmount.toFixed(2).replace(/\.00$/, '')}`
    : null;
  return (
    <div
      className="p-3 rounded-3"
      style={{
        background: emphasised
          ? 'var(--theme-line, rgba(231, 19, 71, 0.12))'
          : 'rgba(255, 255, 255, 0.04)',
        border: emphasised
          ? '1px solid var(--theme-primary, rgba(231, 19, 71, 0.55))'
          : '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="d-flex align-items-start gap-3 flex-wrap">
        <div
          className="d-flex align-items-center justify-content-center flex-shrink-0"
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            background: 'rgba(0, 0, 0, 0.4)',
            fontSize: 28,
            color: '#fff',
          }}
        >
          {meta?.icon}
        </div>
        <div className="flex-grow-1" style={{ minWidth: 0 }}>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <strong style={{ fontSize: '1.1rem' }}>{title}</strong>
            {minDonation && (
              <span className="badge bg-dark border border-secondary">
                Min {minDonation}
              </span>
            )}
          </div>
          <div className="small text-white-50 d-flex gap-2 flex-wrap mt-1">
            {page.fees_url && (
              <a
                href={page.fees_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-warning text-decoration-none"
                title={`Fees on ${page.display_label}`}
              >
                Fees ↗
              </a>
            )}
            {page.gift_aid_url && (
              <a
                href={page.gift_aid_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-warning text-decoration-none"
                title="Gift Aid info"
              >
                Gift Aid ↗
              </a>
            )}
          </div>
        </div>
        <a
          href={page.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-bloodmoon"
          style={{ fontFamily: "'Bungee', cursive" }}
        >
          Donate
        </a>
      </div>

      {page.fee_warning && (
        <div className="mt-2 small text-white-50" style={{ whiteSpace: 'pre-line' }}>
          <strong className="text-white">Heads up about fees:</strong>{' '}
          {page.fee_warning}
        </div>
      )}
    </div>
  );
}
