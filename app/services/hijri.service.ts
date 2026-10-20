// AlAdhan (api.aladhan.com): the calendar months used for Ramadan (`hToGCalendar`, a Hijri month with each day's Gregorian date) and for events
// (`gToHCalendar`, a Gregorian month with each day's Hijri date). Components go through `useRamadan` and `useEvents`. A saved month is used first;
// the network is asked only when there is none (or a stale one and the user is online); a failed refresh keeps the saved one. One store
// (`hijri-months`), two key spaces ("<hijri year>-<month>" and "g:YYYY-MM").
import { getCached, putCached, HIJRI_MONTHS } from "~/db/revampDb";
import { gregorianMonthKey, gregorianMonthUrl, normalizeGregorianMonth, type GregorianMonthRecord } from "~/lib/gregorianMonths";
import { HIJRI_STALE_AFTER_MS, hijriMonthKey, hijriMonthUrl, normalizeHijriMonth, RAMADAN, type HijriMonthRecord } from "~/lib/hijriMonths";
import { ALADHAN_BASE, fetchJsonWithTimeout } from "./prayer.service";

export interface HijriDeps {
  get(key: string): Promise<HijriMonthRecord | GregorianMonthRecord | undefined>;
  put(key: string, record: HijriMonthRecord | GregorianMonthRecord): Promise<void>;
  fetchJson(url: string): Promise<unknown>;
  now(): number;
}
export const hijriDeps = (): HijriDeps => ({
  get: (k) => getCached<HijriMonthRecord | GregorianMonthRecord>(HIJRI_MONTHS, k),
  put: (k, r) => putCached(HIJRI_MONTHS, k, r),
  fetchJson: fetchJsonWithTimeout,
  now: () => Date.now(),
});

export type MonthResult<R> = { status: "ok"; record: R; from: "saved" | "network" } | { status: "failed"; kind: "offline" | "error"; reason: string };
export type HijriMonthResult = MonthResult<HijriMonthRecord>;
export type GregorianMonthResult = MonthResult<GregorianMonthRecord>;

const inflight = new Map<string, Promise<MonthResult<never>>>();

function once<R>(key: string, make: () => Promise<MonthResult<R>>): Promise<MonthResult<R>> {
  const running = inflight.get(key);
  if (running) return running as unknown as Promise<MonthResult<R>>;
  const p = make().finally(() => inflight.delete(key));
  inflight.set(key, p as unknown as Promise<MonthResult<never>>);
  return p;
}

async function load<R extends { fetchedAt: number }>(deps: HijriDeps, key: string, url: string, normalize: (json: unknown, fetchedAt: number) => { ok: true; record: R } | { ok: false; reason: string }, network: boolean): Promise<MonthResult<R>> {
  const saved = (await deps.get(key).catch(() => undefined)) as R | undefined;
  const fresh = saved && deps.now() - saved.fetchedAt < HIJRI_STALE_AFTER_MS;
  if (saved && (fresh || !network)) return { status: "ok", record: saved, from: "saved" };
  if (!network) return { status: "failed", kind: "offline", reason: "not saved on this device" }; // asked to use only what is saved
  let json: unknown;
  try {
    json = await deps.fetchJson(url);
  } catch (e) {
    if (saved) return { status: "ok", record: saved, from: "saved" };
    const offline = (typeof navigator !== "undefined" && navigator.onLine === false) || e instanceof TypeError;
    return { status: "failed", kind: offline ? "offline" : "error", reason: e instanceof Error ? e.message : String(e) };
  }
  const r = normalize(json, deps.now());
  if (!r.ok) return saved ? { status: "ok", record: saved, from: "saved" } : { status: "failed", kind: "error", reason: r.reason };
  await deps.put(key, r.record as unknown as HijriMonthRecord).catch(() => undefined);
  return { status: "ok", record: r.record, from: "network" };
}

/** Hijri month `hMonth` of `hYear` (Ramadan is 9): saved, else fetched and saved. One request per month at a time. */
export function getHijriMonth(deps: HijriDeps, hYear: number, hMonth = RAMADAN, opts: { network?: boolean } = {}): Promise<HijriMonthResult> {
  const key = hijriMonthKey(hYear, hMonth);
  return once(key, () => load(deps, key, hijriMonthUrl(ALADHAN_BASE, hMonth, hYear), (j, at) => normalizeHijriMonth(j, hYear, hMonth, at), opts.network ?? true));
}

/** Gregorian month "YYYY-MM" with each day's Hijri date: saved, else fetched and saved. */
export function getGregorianMonth(deps: HijriDeps, month: string, opts: { network?: boolean } = {}): Promise<GregorianMonthResult> {
  const key = gregorianMonthKey(month);
  return once(key, () => load(deps, key, gregorianMonthUrl(ALADHAN_BASE, month), (j, at) => normalizeGregorianMonth(j, month, at), opts.network ?? true));
}
