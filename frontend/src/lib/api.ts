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
    super(`API ${status} ${statusText}`);
    this.name = 'ApiError';
  }
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
