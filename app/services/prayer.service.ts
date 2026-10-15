// AlAdhan (api.aladhan.com): the monthly calendar. Components never call this directly; they go through
// `usePrayerTimes`. CORS is open on this API, so it is called from the browser.
import { getPrayerMonth, putPrayerMonth } from "~/db/revampDb";
import type { SyncDeps } from "~/lib/prayerSync";

export const ALADHAN_BASE = "https://api.aladhan.com/v1";
const TIMEOUT_MS = 10_000;

export async function fetchJsonWithTimeout(url: string): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw new Error("the request timed out", { cause: e });
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export const prayerSyncDeps = (): SyncDeps => ({
  base: ALADHAN_BASE,
  fetchJson: fetchJsonWithTimeout,
  get: getPrayerMonth,
  put: putPrayerMonth,
  now: () => Date.now(),
});
