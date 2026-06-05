import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, ApiError, setAuthTokenGetter, getAuthToken } from './api';

function mockFetch(impl: (url: string, init: RequestInit) => Partial<Response>) {
  return vi.fn(async (url: string, init: RequestInit) => {
    const r = impl(url, init);
    return {
      ok: r.ok ?? true,
      status: r.status ?? 200,
      statusText: r.statusText ?? 'OK',
      text: async () => (r as { _text?: string })._text ?? '',
    } as Response;
  });
}

describe('api()', () => {
  beforeEach(() => setAuthTokenGetter(null));
  afterEach(() => vi.unstubAllGlobals());

  it('parses a JSON response', async () => {
    vi.stubGlobal('fetch', mockFetch(() => ({ _text: '{"hello":"world"}' } as never)));
    await expect(api('/api/x/')).resolves.toEqual({ hello: 'world' });
  });

  it('attaches the ambient token, overridable per-call', async () => {
    setAuthTokenGetter(async () => 'ambient');
    const f = mockFetch((_u, init) => ({
      _text: JSON.stringify((init.headers as Record<string, string>).Authorization || ''),
    } as never));
    vi.stubGlobal('fetch', f);
    await expect(api('/api/x/')).resolves.toBe('Bearer ambient');
    // Explicit token wins.
    await expect(api('/api/x/', { token: 'explicit' })).resolves.toBe('Bearer explicit');
    // Explicit null forces anonymous.
    await expect(api('/api/x/', { token: null })).resolves.toBe('');
  });

  it('serialises a body to JSON (echoed back + re-parsed)', async () => {
    const f = mockFetch((_u, init) => ({ _text: String(init.body) } as never));
    vi.stubGlobal('fetch', f);
    await expect(api('/api/x/', { method: 'POST', body: { a: 1 } })).resolves.toEqual({ a: 1 });
  });

  it('throws ApiError with a formatted message on a non-OK response', async () => {
    vi.stubGlobal('fetch', mockFetch(() => ({
      ok: false, status: 400, statusText: 'Bad Request',
      _text: '{"detail":"nope"}',
    } as never)));
    await expect(api('/api/x/')).rejects.toBeInstanceOf(ApiError);
    await expect(api('/api/x/')).rejects.toThrow('nope');
  });

  it('formats field + non_field errors and falls back for HTML/empty', async () => {
    const cases: Array<[string, string]> = [
      ['{"name":["required","too long"]}', 'name: required'],
      ['{"non_field_errors":["boom"]}', 'boom'],
      ['["a","b"]', 'a; b'],
      ['', 'API 500'],
      ['<!doctype html><html></html>', 'API 500'],
    ];
    for (const [text, contains] of cases) {
      vi.stubGlobal('fetch', mockFetch(() => ({
        ok: false, status: 500, statusText: 'Error', _text: text,
      } as never)));
      await expect(api('/api/x/')).rejects.toThrow(new RegExp(contains.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });

  it('getAuthToken returns the token or null and swallows getter errors', async () => {
    setAuthTokenGetter(null);
    expect(await getAuthToken()).toBeNull();
    setAuthTokenGetter(async () => 'tok');
    expect(await getAuthToken()).toBe('tok');
    setAuthTokenGetter(async () => {
      throw new Error('x');
    });
    expect(await getAuthToken()).toBeNull();
  });
});
