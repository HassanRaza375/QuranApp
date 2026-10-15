// AlAdhan monthly calendar: key, time parsing, validation. Pure and unit-tested.
//
// Real response facts (checked against the live API):
//  - times in the monthly endpoint carry a suffix: "04:59 (PKT)". The daily endpoint returns "04:59".
//    The legacy parser (`split(":").map(Number)`) turns the minutes of the suffixed form into NaN.
//  - times are local to the LOCATION's time zone (`meta.timezone`), not the device's.
import { daysInMonth } from "./dates";

export const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
export type PrayerName = (typeof PRAYERS)[number];
const EXTRAS = ["Sunrise", "Sunset", "Imsak", "Midnight"] as const;

export interface PrayerDay {
  /** "YYYY-MM-DD" (the location's calendar day) */
  date: string;
  timings: Record<PrayerName, string> & Partial<Record<(typeof EXTRAS)[number], string>>;
  hijri: { day: number; month: number; year: number; monthNameEn: string };
}

export interface PrayerMonthRecord {
  key: string;
  lat: number;
  lon: number;
  method: number;
  school: number;
  midnightMode: number;
  /** "YYYY-MM" */
  month: string;
  fetchedAt: number;
  timezone: string;
  /** from the response, e.g. "Islamic Society of North America (ISNA)" */
  methodName: string;
  days: PrayerDay[];
}

export interface PrayerRequest {
  lat: number;
  lon: number;
  method: number;
  school: number;
  midnightMode: number;
  /** "YYYY-MM" */
  month: string;
}

/**
 * "04:59", "4:59", "04:59 (PKT)", "04:59 (+05)" -> "04:59". Anything else -> null.
 * Only the leading clock time counts; a suffix is ignored.
 */
export function parseClock(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const m = /^\s*(\d{1,2}):(\d{2})(?!\d)/.exec(raw);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
}

export const clockToMinutes = (hhmm: string): number => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Rounds a coordinate to 2 decimals (about 1 km) for the cache key; never "-0.00". */
export function roundCoord(n: number): string {
  const r = Math.round(n * 100) / 100;
  return (Object.is(r, -0) || r === 0 ? 0 : r).toFixed(2);
}

/** `prayer:v1:<lat2>:<lon2>:<method>:<school>:<YYYY-MM>` (docs/PLAN.md). */
export const prayerMonthKey = (r: Pick<PrayerRequest, "lat" | "lon" | "method" | "school" | "month">): string =>
  `prayer:v1:${roundCoord(r.lat)}:${roundCoord(r.lon)}:${r.method}:${r.school}:${r.month}`;

export type NormalizeResult = { ok: true; record: PrayerMonthRecord } | { ok: false; reason: string };

/**
 * Checks a raw AlAdhan monthly response against what was asked for and turns it into the record that is stored.
 * Nothing is stored unless every check passes (so a bad response can never replace good cached times).
 */
export function normalizeMonthResponse(json: unknown, req: PrayerRequest, fetchedAt: number): NormalizeResult {
  const fail = (reason: string): NormalizeResult => ({ ok: false, reason });
  const j = json as { code?: unknown; data?: unknown } | null;
  if (!j || typeof j !== "object") return fail("the response is not an object");
  if (j.code !== 200) return fail(`the service answered code ${String(j.code)}`);
  if (!Array.isArray(j.data)) return fail("the response has no days");

  const [yearStr, monthStr] = req.month.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const expectedDays = daysInMonth(year, month);
  if (j.data.length !== expectedDays) return fail(`expected ${expectedDays} days, got ${j.data.length}`);

  let timezone = "";
  let methodName = "";
  const days: PrayerDay[] = [];
  for (let i = 0; i < j.data.length; i++) {
    const d = j.data[i] as {
      timings?: Record<string, unknown>;
      date?: { gregorian?: { date?: unknown }; hijri?: { day?: unknown; month?: { number?: unknown; en?: unknown }; year?: unknown } };
      meta?: { timezone?: unknown; method?: { id?: unknown; name?: unknown } };
    };
    const dd = String(i + 1).padStart(2, "0");
    const mm = String(month).padStart(2, "0");
    if (d?.date?.gregorian?.date !== `${dd}-${mm}-${year}`) return fail(`day ${i + 1} has the wrong date`);

    const t = d.timings;
    if (!t || typeof t !== "object") return fail(`day ${i + 1} has no times`);
    const timings: Partial<PrayerDay["timings"]> = {};
    let last = -1;
    for (const p of PRAYERS) {
      const c = parseClock(t[p]);
      if (!c) return fail(`day ${i + 1}: ${p} is not a time`);
      const mins = clockToMinutes(c);
      if (mins <= last) return fail(`day ${i + 1}: the prayers are not in order`);
      last = mins;
      timings[p] = c;
    }
    for (const e of EXTRAS) {
      const c = parseClock(t[e]);
      if (c) timings[e] = c;
    }

    const h = d.date?.hijri;
    const hDay = Number(h?.day);
    const hMonth = Number(h?.month?.number);
    const hYear = Number(h?.year);
    if (![hDay, hMonth, hYear].every((n) => Number.isInteger(n) && n > 0)) return fail(`day ${i + 1} has no Hijri date`);

    const tz = d.meta?.timezone;
    if (typeof tz !== "string" || !tz) return fail(`day ${i + 1} has no time zone`);
    if (timezone && tz !== timezone) return fail("the time zone changes inside the month");
    timezone = tz;
    if (d.meta?.method?.id !== req.method) return fail("the calculation method is not the one requested");
    if (typeof d.meta.method.name === "string") methodName = d.meta.method.name;

    days.push({
      date: `${year}-${mm}-${dd}`,
      timings: timings as PrayerDay["timings"],
      hijri: { day: hDay, month: hMonth, year: hYear, monthNameEn: typeof h?.month?.en === "string" ? h.month.en : "" },
    });
  }

  return {
    ok: true,
    record: {
      key: prayerMonthKey(req),
      lat: Number(roundCoord(req.lat)),
      lon: Number(roundCoord(req.lon)),
      method: req.method,
      school: req.school,
      midnightMode: req.midnightMode,
      month: req.month,
      fetchedAt,
      timezone,
      methodName,
      days,
    },
  };
}

/** The AlAdhan monthly URL for a request (coordinates rounded exactly as the cache key is). */
export function monthUrl(base: string, r: PrayerRequest): string {
  const [year, month] = r.month.split("-");
  const q = new URLSearchParams({
    latitude: roundCoord(r.lat),
    longitude: roundCoord(r.lon),
    method: String(r.method),
    school: String(r.school),
    midnightMode: String(r.midnightMode),
  });
  return `${base}/calendar/${year}/${Number(month)}?${q.toString()}`;
}
