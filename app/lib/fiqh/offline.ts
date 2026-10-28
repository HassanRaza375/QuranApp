// Daily Fiqh offline (level B): the data chunks (`wajibat-data-*`, see nuxt.config.ts) are not in the install-time precache. A category the reader has opened is written to
// Cache Storage ("wajibat-data-cache", the legacy app's cache name) and served from there by the service worker's CacheFirst rule; "Save all for offline" loads every
// category first and then does the same, and records what was saved. Ported from the legacy `useFiqhOfflineCache`: it writes the files itself instead of trusting the
// service worker to catch a module's own fetch, which a real browser did not do for a preloaded chunk.
import { loadedChunkUrls } from "./data";

export const CACHE_NAME = "wajibat-data-cache";
const MARKER = "/__wajibat-offline-saved__";
const NAME_RE = /\/(wajibat-data-[a-z]+)-[^/]+\.js$/;

/** The data chunk files of this build that have been loaded in this tab. */
const currentUrls = (): string[] => {
  const fromRuntime = loadedChunkUrls().filter((u) => NAME_RE.test(u));
  if (fromRuntime.length || typeof performance === "undefined") return fromRuntime;
  return [...new Set(performance.getEntriesByType("resource").map((e) => e.name))].filter((u) => NAME_RE.test(u));
};

const markerRequest = () => new Request(new URL(MARKER, location.origin).href);

export const offlineSupported = () => typeof caches !== "undefined";

/** True only when every chunk of THIS build was saved by "Save all for offline" (a copy from an earlier build does not count). */
export async function isAllSaved(buildId: string): Promise<boolean> {
  if (!offlineSupported()) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const res = await cache.match(markerRequest());
    if (!res) return false;
    const saved = (await res.json()) as { buildId: string; urls: string[] };
    if (saved.buildId !== buildId || !saved.urls.length) return false;
    for (const url of saved.urls) if (!(await cache.match(url))) return false;
    return true;
  } catch {
    return false;
  }
}

/** Best effort and idempotent: caches the chunks loaded so far, then drops older builds' copies of the same chunks (a corrected ruling ships under a new file name). */
export async function cacheLoadedChunks(): Promise<boolean> {
  if (!offlineSupported()) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const urls = currentUrls();
    let ok = true;
    for (const url of urls) {
      if (await cache.match(url)) continue;
      const res = await fetch(url);
      if (res.ok) await cache.put(url, res.clone());
      else ok = false;
    }
    if (ok) {
      const nameOf = (u: string) => NAME_RE.exec(u)?.[1];
      const live = new Map(urls.map((u) => [nameOf(u), u]));
      for (const req of await cache.keys()) {
        const n = nameOf(req.url);
        if (n && live.has(n) && live.get(n) !== req.url) await cache.delete(req);
      }
    }
    return ok;
  } catch {
    return false;
  }
}

/** "Save all for offline": loads every category's chunk, caches them all, and records what was saved. */
export async function saveAll(loadAll: () => Promise<void>, buildId: string): Promise<boolean> {
  try {
    await loadAll();
    if (!(await cacheLoadedChunks())) return false;
    const cache = await caches.open(CACHE_NAME);
    await cache.put(markerRequest(), new Response(JSON.stringify({ buildId, urls: currentUrls() }), { headers: { "content-type": "application/json" } }));
    return true;
  } catch {
    return false;
  }
}
