function required(key: keyof ImportMetaEnv): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required env var: ${key}. Set it in frontend/.env`);
  }
  return value;
}

/**
 * Resolve the API origin we should actually hit at runtime.
 *
 * Vite bakes `VITE_API_URL` in at build time. If a production deployment
 * is built with the local-dev value (e.g. `http://localhost:8000`) the
 * resulting bundle would otherwise try to call localhost from the
 * public HTTPS origin and fail with:
 *
 *   • Mixed-content blocking (http called from https)
 *   • Private Network Access denials ("permission denied for loopback
 *     address space") in modern Chromium browsers
 *
 * To stop that misconfiguration silently breaking the live site, this
 * helper detects the mismatch — the page is served from a non-loopback
 * host, but the configured API points at a loopback / private host. This
 * happens by design here: one Vite dev server is reached both locally
 * (localhost:5173 → wants localhost:8000) and publicly via the Cloudflare
 * tunnel (www.zeldathon.co.uk → wants api.zeldathon.co.uk). So when the page
 * is public but VITE_API_URL is loopback, we switch to `VITE_PUBLIC_API_URL`
 * (the public API origin). If that isn't set we fall back to same-origin
 * requests (which assumes the edge proxies `/api/*`) and warn once.
 */
function resolveApiUrl(): string {
  const raw = required('VITE_API_URL');
  if (typeof window === 'undefined') return raw;

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    // Relative or otherwise-malformed value — leave as-is and let the
    // caller's `new URL(path, raw)` surface the parse error.
    return raw;
  }

  const pageHost = window.location.hostname;
  const targetHost = target.hostname;

  const pageIsLoopback = isLoopback(pageHost);
  const targetIsLoopback = isLoopback(targetHost);

  // Public page, loopback API: served over the tunnel. Prefer the configured
  // public API origin; only fall back to same-origin (+ warn) if it's unset.
  if (!pageIsLoopback && targetIsLoopback) {
    const publicApi = import.meta.env.VITE_PUBLIC_API_URL;
    if (publicApi) return publicApi;
    if (!warnedAboutMismatch) {
      warnedAboutMismatch = true;
      // eslint-disable-next-line no-console
      console.warn(
        `[env] VITE_API_URL is set to ${raw} but the page is served from `
          + `${window.location.origin}, and VITE_PUBLIC_API_URL is not set. `
          + `Falling back to same-origin requests so the public site doesn't `
          + `try to reach a loopback address. Set VITE_PUBLIC_API_URL to the `
          + `public API origin (e.g. https://api.zeldathon.co.uk) to fix this.`,
      );
    }
    return window.location.origin;
  }

  return raw;
}

let warnedAboutMismatch = false;

/** Local / loopback / private hostnames the browser refuses to let a
 *  public-origin page reach without an explicit Private Network Access
 *  preflight. Covers IPv4 loopback / RFC1918, IPv6 loopback / link-local,
 *  the `.local` mDNS suffix, and obvious dev hostnames. */
function isLoopback(host: string): boolean {
  if (!host) return true;
  const lower = host.toLowerCase();
  if (lower === 'localhost') return true;
  if (lower === 'host.docker.internal') return true;
  if (lower.endsWith('.local')) return true;
  if (lower === '::1' || lower.startsWith('[::1]')) return true;
  // IPv4 loopback + RFC1918 private ranges.
  if (/^127\./.test(lower)) return true;
  if (/^10\./.test(lower)) return true;
  if (/^192\.168\./.test(lower)) return true;
  // 172.16.0.0/12 — second octet 16–31.
  const m172 = lower.match(/^172\.(\d+)\./);
  if (m172) {
    const oct = parseInt(m172[1], 10);
    if (oct >= 16 && oct <= 31) return true;
  }
  // IPv6 link-local (fe80::/10) — coarse check, anything starting fe8/fe9/fea/feb.
  if (/^fe[89ab]/.test(lower)) return true;
  return false;
}

/** Optional env var — empty string when unset (don't throw; public pages and
 *  OBS overlays must still boot when a key isn't configured). */
function optional(key: keyof ImportMetaEnv): string {
  return import.meta.env[key] ?? '';
}

/**
 * Pick the Clerk publishable key by page host, mirroring resolveApiUrl(): one
 * dev bundle serves both localhost (dev Clerk instance, pk_test_…) and the
 * public tunnel domain (prod instance, pk_live_…).
 *
 * No cross-fallback on purpose: a production (pk_live) key throws on localhost
 * ("Production Keys are only allowed for domain …") and a dev (pk_test) key
 * won't work on the public domain — so a wrong-host key never produces a
 * working state, only a crash. If the matching key is unset for this host we
 * return '' (auth disabled here) rather than loading the wrong one.
 */
function resolveClerkKey(): string {
  const localKey = optional('VITE_CLERK_PUBLISHABLE_KEY');
  const publicKey = optional('VITE_PUBLIC_CLERK_PUBLISHABLE_KEY');
  if (typeof window === 'undefined') return localKey || publicKey;
  return isLoopback(window.location.hostname) ? localKey : publicKey;
}

export const env = {
  VITE_API_URL: resolveApiUrl(),
  /** Resolved Clerk publishable key for this host. Empty => auth disabled. */
  CLERK_PUBLISHABLE_KEY: resolveClerkKey(),
} as const;
