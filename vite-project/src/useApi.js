import { useCallback, useEffect, useState } from "react";
import { api } from "./lib/api";

// const { data, error, loading, reload } = useApi("/api/products/abc")
// Pass null to skip the request. Re-fetches whenever the url changes.
export function useApi(url) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const key = url ? `${url}#${version}` : null;

  useEffect(() => {
    if (!key) return undefined;
    let cancelled = false;
    api
      .get(url)
      .then((data) => !cancelled && setResult({ key, data, error: null }))
      .catch((error) => !cancelled && setResult({ key, data: null, error }));
    return () => {
      cancelled = true; // ignore answers for a page the shopper already left
    };
  }, [url, key]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const settled = result.key === key;
  return {
    data: settled ? result.data : null,
    error: settled ? result.error : null,
    loading: Boolean(key) && !settled,
    reload,
  };
}
