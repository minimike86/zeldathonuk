import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { DonationPage } from '@/lib/obsApi';
import { useAccentDeck } from '@/lib/accentDeck';
import { resolveMediaUrl } from '@/lib/env';
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

  // Per-row shuffled accents — each donation platform tile inside
  // the modal picks a different theme colour so the picker reads as
  // the full PAL palette rather than uniform brand-coloured rows.
  // Hook must run unconditionally per rules-of-hooks, so it sits
  // above the early-return below. The deck re-rolls whenever the
  // modal closes + reopens (Home unmounts/remounts this component).
  const rowAccents = useAccentDeck(pages.length);

  if (!open || pages.length === 0) return null;

  const sorted = [...pages].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    if (a.platform !== b.platform) {
      if (a.platform === 'twitch') return -1;
      if (b.platform === 'twitch') return 1;
    }
    if (a.order !== b.order) return a.order - b.order;
    return a.id - b.id;
  });

  // Render through a portal to <body> so the fixed overlay covers the
  // viewport regardless of an ancestor's `transform`/`overflow` (e.g. the
  // hover-lifted, overflow-hidden raffle cards on /incentives would
  // otherwise trap and clip it inside the card).
  return createPortal(
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
          style={{
            borderBottom:
              'var(--theme-divider-thickness, 1px) solid var(--theme-line, rgba(231, 19, 71, 0.45))',
          }}
        >
          <h2
            className="m-0"
            style={{
              fontSize: '1.4rem',
              fontFamily: "var(--theme-font-heading, 'Bungee', sans-serif)",
              color: 'var(--theme-text, #fff)',
            }}
          >
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
              accent={rowAccents[idx]}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DonationRow({
  page,
  isFirst,
  currencySymbol,
  accent,
}: {
  page: DonationPage;
  isFirst: boolean;
  currencySymbol: string;
  accent?: number;
}) {
  const meta = PLATFORM_META[page.platform];
  // Always show the platform's display_label (controlled by the
  // DonationPlatformProfile); Twitch Charity rows also surface their
  // channel label because several channels can fundraise in one event.
  const title = page.display_label;
  const subtitle =
    page.platform === 'twitch' && page.label.trim() ? page.label.trim() : '';
  const emphasised = isFirst || page.is_primary;
  const minAmount = parseFloat(page.minimum_donation_amount || '0');
  const minDonation = minAmount > 0
    ? `${currencySymbol}${minAmount.toFixed(2).replace(/\.00$/, '')}`
    : null;
  return (
    <div
      className="p-3 rounded-3"
      data-accent={accent}
      style={{
        // Background + border tint via `--btn-tint` so each row picks
        // a different theme accent. Emphasised (primary platform) gets
        // a stronger mix so it still leads the eye.
        background: emphasised
          ? 'color-mix(in srgb, var(--btn-tint, var(--theme-primary, #e71347)) 18%, transparent)'
          : 'color-mix(in srgb, var(--btn-tint, transparent) 8%, rgba(255, 255, 255, 0.04))',
        border: emphasised
          ? '1px solid color-mix(in srgb, var(--btn-tint, var(--theme-primary, #e71347)) 60%, transparent)'
          : '1px solid color-mix(in srgb, var(--btn-tint, transparent) 40%, rgba(255, 255, 255, 0.1))',
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
          {/* Prefer the platform's configured logo (DonationPlatformProfile);
            * fall back to the built-in FontAwesome glyph when none is set. */}
          {page.logo_url ? (
            <img
              src={resolveMediaUrl(page.logo_url)}
              alt={`${title} logo`}
              style={{ maxWidth: 36, maxHeight: 36, objectFit: 'contain' }}
            />
          ) : (
            meta?.icon
          )}
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
          {subtitle && (
            <div className="small text-white-50 mt-1">
              {subtitle}
            </div>
          )}
          <div className="small text-white-50 d-flex gap-2 flex-wrap mt-1">
            {page.fees_url && (
              <a
                href={page.fees_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-decoration-none"
                style={{ color: 'var(--theme-link, #ffc107)' }}
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
                className="text-decoration-none"
                style={{ color: 'var(--theme-link, #ffc107)' }}
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
          data-accent={accent}
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
