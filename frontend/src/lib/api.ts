import { env } from '@/lib/env';

type FetchOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  /**
   * Bearer token to attach as Authorization. Get it from
   * Clerk's `useAuth().getToken()` and pass it through.
   */
  token?: string | null;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown,
  ) {
    super(formatApiError(status, statusText, body));
    this.name = 'ApiError';
  }
}

/**
 * Build a human-readable error message from a failed-response body so
 * `(e as Error).message` surfaces what actually went wrong rather than
 * a generic "API 400 Bad Request".
 *
 * Django REST returns several shapes — handle the common ones:
 *   {"detail": "..."}                  → "..."
 *   {"field": ["msg1", "msg2"]}        → "field: msg1; field: msg2"
 *   {"non_field_errors": ["..."]}      → "..."  (drop the synthetic key)
 *   ["msg1", "msg2"]                   → "msg1; msg2"
 *   "raw string"                       → "raw string"
 *   null / empty / unparseable         → "API <status> <statusText>"
 *
 * Nested objects/arrays are walked recursively so serializer errors on
 * write-nested fields (e.g. `{"runners": [{"name": ["required"]}]}`)
 * still produce something legible.
 */
const MAX_ERROR_MESSAGE = 400;

function formatApiError(status: number, statusText: string, body: unknown): string {
  const fallback = `API ${status} ${statusText || 'Error'}`;
  const raw = formatErrorBody(body);
  if (!raw) return fallback;
  // Django debug 500s return a full HTML page; don't paste that into a
  // toast. Detect and fall back to the generic message.
  if (looksLikeHtml(raw)) return fallback;
  return raw.length > MAX_ERROR_MESSAGE
    ? `${raw.slice(0, MAX_ERROR_MESSAGE - 1)}…`
    : raw;
}

function looksLikeHtml(s: string): boolean {
  const trimmed = s.trimStart().slice(0, 200).toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

function formatErrorBody(body: unknown): string {
  if (body == null) return '';
  if (typeof body === 'string') return body.trim();
  if (typeof body === 'number' || typeof body === 'boolean') return String(body);

  if (Array.isArray(body)) {
    return body
      .map((item) => formatErrorBody(item))
      .filter(Boolean)
      .join('; ');
  }

  if (typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    // Django REST conventional keys — surface their value directly.
    if (typeof obj.detail === 'string') return obj.detail.trim();
    if (typeof obj.message === 'string') return obj.message.trim();
    if (typeof obj.error === 'string') return obj.error.trim();

    const parts: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const child = formatErrorBody(value);
      if (!child) continue;
      // Drop the synthetic "non_field_errors" wrapper — it just means
      // "this validation isn't tied to a specific field".
      const label = key === 'non_field_errors' ? '' : key;
      parts.push(label ? `${label}: ${child}` : child);
    }
    return parts.join('; ');
  }

  return '';
}

/**
 * Thin fetch wrapper around the Django REST API.
 *
 * `path` is joined onto `VITE_API_URL` — pass routes like '/api/schedule/'.
 * `token` (optional) is forwarded as `Authorization: Bearer <token>`. Get it
 * from Clerk's `useAuth().getToken()` on the calling component.
 */
export async function api<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, token, headers, ...rest } = options;

  const url = new URL(path, env.VITE_API_URL).toString();
  const init: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  const response = await fetch(url, init);
  const text = await response.text();
  const parsed: unknown = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, response.statusText, parsed);
  }
  return parsed as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
