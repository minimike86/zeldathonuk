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
 * host, but the configured API points at a loopback / private host —
 * and falls back to same-origin requests instead. Logs a one-time
 * warning so the deployer sees the problem in DevTools.
 *
 * Same-origin fallback assumes the production stack proxies `/api/*`
 * (and any other paths the frontend hits) to the Django backend at
 * the edge (Nginx, Caddy, Cloud Run rewrites, etc.) — which is the
 * standard layout for a Vite-built SPA + Django backend pair.
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

  // The dangerous case: a real public domain trying to call back to
  // localhost / 127.0.0.1 / a *.local / private RFC1918 IP.
  if (!pageIsLoopback && targetIsLoopback) {
    if (!warnedAboutMismatch) {
      warnedAboutMismatch = true;
      // eslint-disable-next-line no-console
      console.warn(
        `[env] VITE_API_URL is set to ${raw} but the page is served from `
          + `${window.location.origin}. Falling back to same-origin requests `
          + `so the public site doesn't try to reach a loopback address. `
          + `Rebuild the frontend with VITE_API_URL pointing at the public `
          + `API origin to remove this warning.`,
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

export const env = {
  VITE_API_URL: resolveApiUrl(),
} as const;
