import { useEffect, useState } from "react";
import { api } from "./lib/api";

// Like useApi, but quietly refreshes every few seconds (used for chat and unread counts).
// Pass null to pause. `refresh()` fetches again right away.
export function usePolling(url, intervalMs = 5000) {
  const [state, setState] = useState({ url: null, data: null, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!url) return undefined;
    let cancelled = false;
    const load = () =>
      api
        .get(url)
        .then((data) => !cancelled && setState({ url, data, error: null }))
        .catch((error) => !cancelled && setState((s) => ({ url, data: s.url === url ? s.data : null, error })));
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load(); // don't poll hidden tabs
    }, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [url, intervalMs, tick]);

  const settled = state.url === url;
  return {
    data: settled ? state.data : null,
    error: settled ? state.error : null,
    loading: Boolean(url) && !settled,
    refresh: () => setTick((t) => t + 1),
  };
}
