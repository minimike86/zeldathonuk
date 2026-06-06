/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  /** Public API origin used when this same bundle is served from a public host
   *  (e.g. via the Cloudflare tunnel) while VITE_API_URL still points at a
   *  loopback dev address. See resolveApiUrl() in lib/env.ts. */
  readonly VITE_PUBLIC_API_URL?: string;
  /** Clerk publishable key for LOCAL/dev (pk_test_…, used on localhost).
   *  Optional: when neither key is set, auth is disabled and the control panel
   *  is unreachable. See resolveClerkKey() in lib/env.ts. */
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
  /** Clerk publishable key for the PUBLIC host (pk_live_…, used when served from
   *  the public domain via the tunnel). */
  readonly VITE_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
