import { describe, it, expect } from 'vitest';
import { CURRENCY_SYMBOLS, formatTierAmount } from './currency';

describe('currency', () => {
  it('maps known currency codes to symbols', () => {
    expect(CURRENCY_SYMBOLS.GBP).toBe('£');
    expect(CURRENCY_SYMBOLS.USD).toBe('$');
    expect(CURRENCY_SYMBOLS.EUR).toBe('€');
    expect(CURRENCY_SYMBOLS.JPY).toBe('¥');
  });

  it('formats a known currency with its symbol, rounded', () => {
    expect(formatTierAmount('10.00', 'GBP')).toBe('£10');
    expect(formatTierAmount('10.60', 'USD')).toBe('$11');
  });

  it('falls back to "<CODE> <amount>" for unknown currencies', () => {
    expect(formatTierAmount('25', 'AUD')).toBe('AUD 25');
  });

  it('keeps the raw amount when it is not numeric', () => {
    expect(formatTierAmount('lots', 'GBP')).toBe('£lots');
  });
});
