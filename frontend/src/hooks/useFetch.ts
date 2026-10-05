import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../services/api';

// Public catalogue data (banners, settings, products) is remembered per URL so a repeat visit renders instantly
// instead of waiting ~50 s for the free-tier Render API to wake up. The fresh response always replaces it.
const cacheKey = (url: string) => `mw_cache:${url}`;
function readCache<T>(url: string | null): T | null {
  if (!url) return null;
  try { return JSON.parse(localStorage.getItem(cacheKey(url)) || 'null'); } catch { return null; }
}

/** GET `url` (skipped when null). Re-fetches when url changes; `reload()` refetches on demand. `persist` = public data only. */
export function useFetch<T>(url: string | null, persist = false) {
  const [data, setData] = useState<T | null>(() => (persist ? readCache<T>(url) : null));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(url) && data === null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!url) return;
    const ctrl = new AbortController();
    const cached = persist ? readCache<T>(url) : null;
    if (cached) setData(cached);
    setLoading(!cached);
    setError(null);
    api
      // Cap the wait so a hung request (e.g. Render waking from sleep) ends in the error/retry state, never an endless spinner.
      .get<T>(url, { signal: ctrl.signal, timeout: 60_000 })
      .then((r) => {
        setData(r.data);
        if (persist) try { localStorage.setItem(cacheKey(url), JSON.stringify(r.data)); } catch { /* storage unavailable */ }
      })
      // A cached copy is still on screen, so a failed refresh stays silent.
      .catch((e) => !ctrl.signal.aborted && !cached && setError(errorMessage(e)))
      .finally(() => !ctrl.signal.aborted && setLoading(false));
    return () => ctrl.abort();
  }, [url, tick, persist]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, setData, error, loading, reload };
}
