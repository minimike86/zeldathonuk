/**
 * Currency helpers shared across the charity surfaces (the public
 * /charity impact ladder and the omnibar charity-info panel).
 *
 * Impact tiers store an ISO 4217 currency *code* (e.g. "GBP"); the
 * display layer picks the symbol from this small lookup. Anything not
 * in the table falls back to "<CODE> <amount>" so an unmapped currency
 * still renders something sensible rather than a bare number.
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£',
  USD: '$',
  EUR: '€',
  JPY: '¥',
};

/** Format an impact-tier amount (rounded to a whole unit) with its
 *  currency symbol, e.g. ("10.00", "GBP") → "£10". */
export function formatTierAmount(amount: string, currency: string): string {
  const n = Number(amount);
  const display = Number.isFinite(n) ? Math.round(n).toString() : amount;
  const symbol = CURRENCY_SYMBOLS[currency];
  return symbol ? `${symbol}${display}` : `${currency} ${display}`;
}
