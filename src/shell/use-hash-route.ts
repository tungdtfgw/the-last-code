import { useCallback, useEffect, useState } from "react";
import type { Route } from "../story/progression";
import { parseRoute, routeHash } from "./route";

/**
 * Hash routing without a library. Player actions push a history entry;
 * redirects and finished stories replace it, so Back never replays a story.
 * `replaceState` fires no `hashchange`, so the state is updated by hand.
 */
export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.hash));

  useEffect(() => {
    const onHash = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((next: Route, opts: { replace?: boolean } = {}) => {
    const hash = routeHash(next);
    if (opts.replace) {
      window.history.replaceState(null, "", hash);
      setRoute(parseRoute(hash));
    } else if (window.location.hash !== hash) {
      window.location.hash = hash;
    } else {
      setRoute(parseRoute(hash));
    }
  }, []);

  return { route, navigate };
}
