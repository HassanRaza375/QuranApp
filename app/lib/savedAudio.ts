// Finding the saved copy of a surah's audio when it is played. If the file was saved (Downloads) and the service worker is in charge of this
// page, the player is given the file's URL with the offline marker; the service worker answers it from the downloads cache, with range support,
// and never from the network. In every other case the player gets the plain URL, exactly as before. Nothing here can make playback worse: a
// failed lookup is "not saved", and a marked URL that fails is retried plain by the engine (`unmarked`).
import { DOWNLOADS_AUDIO_CACHE, isOfflineUrl, offlineUrl, plainUrl } from "./downloadPlan";

export interface SavedEnv {
  /** Whether a service worker controls this page (a hard reload bypasses it). */
  controlled(): boolean;
  has(url: string): Promise<boolean>;
}

export const browserSavedEnv = (): SavedEnv => ({
  controlled: () => typeof navigator !== "undefined" && !!navigator.serviceWorker?.controller,
  has: async (url) => {
    if (typeof caches === "undefined") return false;
    if (!(await caches.has(DOWNLOADS_AUDIO_CACHE))) return false; // asking never creates the cache
    const hit = await (await caches.open(DOWNLOADS_AUDIO_CACHE)).match(url);
    return !!hit && hit.type !== "opaque"; // a copy saved by the legacy app is opaque: it cannot be played from the device
  },
});

export async function withSavedCopy(url: string, env: SavedEnv = browserSavedEnv()): Promise<string> {
  try {
    if (!env.controlled()) return url;
    return (await env.has(plainUrl(url))) ? offlineUrl(url) : url;
  } catch {
    return url;
  }
}

/** For the engine: the plain URL behind a marked one, null for any other URL. */
export const unmarked = (url: string): string | null => (isOfflineUrl(url) ? plainUrl(url) : null);
