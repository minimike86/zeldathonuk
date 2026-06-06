import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { obsApi } from '@/lib/obsApi';

export type Me = { clerk_user_id: string; email: string; role: 'viewer' | 'operator' };

type UseMeResult = { me: Me | null; loading: boolean; error: boolean };

/**
 * Fetch the signed-in user's local profile (identity + role) from /api/me/.
 * Only runs when `enabled` (i.e. signed in). The Clerk token is fetched and
 * passed explicitly to avoid a race with the ambient API token getter.
 */
export function useMe(enabled: boolean): UseMeResult {
  const { getToken } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setMe(null);
      setLoading(false);
      setError(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const token = await getToken();
        const data = await obsApi.me(token);
        if (!cancelled) setMe(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, getToken]);

  return { me, loading, error };
}
