import { describe, it, expect, vi } from 'vitest';
import { notifyEventChanged, onEventChanged } from './eventBus';
import { triggerTestSplash, onTestSplash } from './splashBus';

describe('eventBus', () => {
  it('delivers to local subscribers and unsubscribes', () => {
    const fn = vi.fn();
    const off = onEventChanged(fn);
    notifyEventChanged();
    expect(fn).toHaveBeenCalledTimes(1);
    off();
    notifyEventChanged();
    expect(fn).toHaveBeenCalledTimes(1); // no more after unsubscribe
  });
});

describe('splashBus', () => {
  it('delivers the payload to subscribers and unsubscribes', () => {
    const fn = vi.fn();
    const off = onTestSplash(fn);
    triggerTestSplash({ amount: 5, currency: 'GBP' });
    expect(fn).toHaveBeenCalledWith({ amount: 5, currency: 'GBP' });
    off();
    triggerTestSplash({ amount: 9, currency: 'USD' });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
