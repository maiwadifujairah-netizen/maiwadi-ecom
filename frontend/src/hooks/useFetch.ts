import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../services/api';

/** GET `url` (skipped when null). Re-fetches when url changes; `reload()` refetches on demand. */
export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!url) return;
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    api
      // Cap the wait so a hung request (e.g. Render waking from sleep) ends in the error/retry state, never an endless spinner.
      .get<T>(url, { signal: ctrl.signal, timeout: 60_000 })
      .then((r) => setData(r.data))
      .catch((e) => !ctrl.signal.aborted && setError(errorMessage(e)))
      .finally(() => !ctrl.signal.aborted && setLoading(false));
    return () => ctrl.abort();
  }, [url, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data, setData, error, loading, reload };
}
