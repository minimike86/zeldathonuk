import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { usePageTitle, useRouteTitle } from './usePageTitle';

describe('usePageTitle', () => {
  it('sets a specific title, or the base when null', () => {
    renderHook(() => usePageTitle('Widgets'));
    expect(document.title).toBe('Zeldathon | Widgets');
    renderHook(() => usePageTitle(null));
    expect(document.title).toBe('Zeldathon');
  });
});

describe('useRouteTitle', () => {
  const at = (path: string) => {
    renderHook(() => useRouteTitle(), {
      wrapper: ({ children }) =>
        createElement(MemoryRouter, { initialEntries: [path] }, children),
    });
    return document.title;
  };

  it('maps known routes, prefixes, and trailing slashes', () => {
    expect(at('/schedule')).toBe('Zeldathon | Schedule');
    expect(at('/control/items')).toBe('Zeldathon | Control · Items');
    expect(at('/control/')).toBe('Zeldathon | Control'); // trailing slash trimmed
    expect(at('/obs/layout/4x3')).toBe('Zeldathon | OBS · Layout'); // prefix match
    expect(at('/tracking/zelda')).toBe('Zeldathon | Tracking');
    expect(at('/totally-unknown')).toBe('Zeldathon'); // fallback
  });
});
