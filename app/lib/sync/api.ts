// Phase 17C: the browser's side of /api/sync. Same-origin, cookies only (the session is an httpOnly cookie, never in storage). A failure becomes a
// `SyncHttpError` with the status (401 = signed out, anything else = "can't reach the server right now"). The fetch function is injected for the tests.
import { SyncHttpError, type Api } from "./engine";

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export function syncApi(fetchFn: Fetch = (u, i) => fetch(u, i)): Api {
  const call = async <T>(url: string, init?: RequestInit): Promise<T> => {
    let res: Response;
    try {
      res = await fetchFn(url, { credentials: "same-origin", headers: { accept: "application/json", ...(init?.body ? { "content-type": "application/json" } : {}) }, ...init });
    } catch {
      throw new SyncHttpError(0);
    }
    if (!res.ok) throw new SyncHttpError(res.status);
    return (await res.json()) as T;
  };
  return {
    pull: (since, limit) => call(`/api/sync/pull?since=${encodeURIComponent(since)}&limit=${limit}`),
    push: async (ops) => (await call<{ results: Awaited<ReturnType<Api["push"]>> }>("/api/sync/push", { method: "POST", body: JSON.stringify({ ops }) })).results,
  };
}
