import { describe, it, expect } from 'vitest';
import { LOGO_CATALOG } from './logoCatalog';

describe('logoCatalog', () => {
  it('is a non-empty list of {label,url} options', () => {
    expect(Array.isArray(LOGO_CATALOG)).toBe(true);
    expect(LOGO_CATALOG.length).toBeGreaterThan(0);
    for (const opt of LOGO_CATALOG) {
      expect(typeof opt.url).toBe('string');
      expect(typeof opt.label).toBe('string');
      expect(opt.url.length).toBeGreaterThan(0);
    }
  });

  it('has unique urls', () => {
    const urls = LOGO_CATALOG.map((o) => o.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});
