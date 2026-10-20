// AlAdhan (api.aladhan.com): a Hijri month with the Gregorian date of each day (`hToGCalendar`). Components go through `useRamadan`.
// A saved month is used first; the network is asked only when there is none (or a stale one and the user is online); a failed refresh keeps the saved one.
import { getCached, putCached, HIJRI_MONTHS } from "~/db/revampDb";
import { HIJRI_STALE_AFTER_MS, hijriMonthKey, hijriMonthUrl, normalizeHijriMonth, RAMADAN, type HijriMonthRecord } from "~/lib/hijriMonths";
import { ALADHAN_BASE, fetchJsonWithTimeout } from "./prayer.service";

export interface HijriDeps {
  get(key: string): Promise<HijriMonthRecord | undefined>;
  put(key: string, record: HijriMonthRecord): Promise<void>;
  fetchJson(url: string): Promise<unknown>;
  now(): number;
}
export const hijriDeps = (): HijriDeps => ({
  get: (k) => getCached<HijriMonthRecord>(HIJRI_MONTHS, k),
  put: (k, r) => putCached(HIJRI_MONTHS, k, r),
  fetchJson: fetchJsonWithTimeout,
  now: () => Date.now(),
});

export type HijriMonthResult = { status: "ok"; record: HijriMonthRecord; from: "saved" | "network" } | { status: "failed"; kind: "offline" | "error"; reason: string };

const inflight = new Map<string, Promise<HijriMonthResult>>();

/** Hijri month `hMonth` of `hYear` (Ramadan is 9): saved, else fetched and saved. One request per month at a time. */
export function getHijriMonth(deps: HijriDeps, hYear: number, hMonth = RAMADAN, opts: { network?: boolean } = {}): Promise<HijriMonthResult> {
  const key = hijriMonthKey(hYear, hMonth);
  const running = inflight.get(key);
  if (running) return running;
  const p = run(deps, hYear, hMonth, key, opts.network ?? true).finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

async function run(deps: HijriDeps, hYear: number, hMonth: number, key: string, network: boolean): Promise<HijriMonthResult> {
  const saved = await deps.get(key).catch(() => undefined);
  const fresh = saved && deps.now() - saved.fetchedAt < HIJRI_STALE_AFTER_MS;
  if (saved && (fresh || !network)) return { status: "ok", record: saved, from: "saved" };
  if (!network) return { status: "failed", kind: "offline", reason: "not saved on this device" }; // asked to use only what is saved
  let json: unknown;
  try {
    json = await deps.fetchJson(hijriMonthUrl(ALADHAN_BASE, hMonth, hYear));
  } catch (e) {
    if (saved) return { status: "ok", record: saved, from: "saved" };
    const offline = (typeof navigator !== "undefined" && navigator.onLine === false) || e instanceof TypeError;
    return { status: "failed", kind: offline ? "offline" : "error", reason: e instanceof Error ? e.message : String(e) };
  }
  const r = normalizeHijriMonth(json, hYear, hMonth, deps.now());
  if (!r.ok) return saved ? { status: "ok", record: saved, from: "saved" } : { status: "failed", kind: "error", reason: r.reason };
  await deps.put(key, r.record).catch(() => undefined);
  return { status: "ok", record: r.record, from: "network" };
}
