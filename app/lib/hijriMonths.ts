// A Hijri month from the calendar service, with each day's Gregorian date (AlAdhan `/v1/hToGCalendar/{month}/{year}`). Phase 8A uses it for
// Ramadan: when it begins, how long it lasts, and the Gregorian date of each Ramadan day. The calendar basis is the service's own (the
// `method` it returns, for example "HJCoSA"); nothing here computes a date by a formula. The one estimate below only chooses WHICH year
// to ask for, and a wrong guess is corrected from the response. The Settings Hijri adjustment is applied by the caller, never to this
// record. Pure; the network and the store are injected.
import { addDaysKey, daysBetweenKeys } from "./dayKeys";

export interface HijriMonthDay {
  /** "YYYY-MM-DD" (Gregorian) */
  date: string;
  hDay: number;
}
export interface HijriMonthRecord {
  /** "<hijri year>-<hijri month>" */
  key: string;
  hYear: number;
  hMonth: number;
  /** the service's calendar method, e.g. "HJCoSA" */
  method: string;
  fetchedAt: number;
  length: number;
  days: HijriMonthDay[];
}

export const hijriMonthKey = (hYear: number, hMonth: number) => `${hYear}-${hMonth}`;
export const hijriMonthUrl = (base: string, hMonth: number, hYear: number) => `${base}/hToGCalendar/${hMonth}/${hYear}`;
export const RAMADAN = 9;

/** A saved record is refreshed (when online) after this long; a failed refresh keeps it. */
export const HIJRI_STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

/** "08-02-2027" to "2027-02-08", or null. */
function gregorianKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(raw);
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const probe = new Date(Date.UTC(y, mo - 1, d, 12));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export type HijriNormalize = { ok: true; record: HijriMonthRecord } | { ok: false; reason: string };

/** Validates a service response for Hijri month `hMonth` of `hYear`. Anything off is rejected (never shown, never stored). */
export function normalizeHijriMonth(json: unknown, hYear: number, hMonth: number, fetchedAt: number): HijriNormalize {
  const j = json as { code?: unknown; data?: unknown } | null;
  if (!j || typeof j !== "object" || j.code !== 200 || !Array.isArray(j.data)) return { ok: false, reason: "The calendar response was not in the expected shape." };
  const data = j.data as Array<{ hijri?: Record<string, unknown>; gregorian?: Record<string, unknown> }>;
  if (data.length < 29 || data.length > 30) return { ok: false, reason: `The month has ${data.length} days; expected 29 or 30.` };
  const days: HijriMonthDay[] = [];
  let method = "";
  for (let i = 0; i < data.length; i++) {
    const h = data[i]?.hijri as { day?: unknown; year?: unknown; month?: { number?: unknown; days?: unknown }; method?: unknown } | undefined;
    const date = gregorianKey((data[i]?.gregorian as { date?: unknown } | undefined)?.date);
    if (!h || !date) return { ok: false, reason: `Day ${i + 1} has no usable date.` };
    if (Number(h.day) !== i + 1) return { ok: false, reason: `Day ${i + 1} is numbered ${String(h.day)}.` };
    if (Number(h.month?.number) !== hMonth) return { ok: false, reason: `Day ${i + 1} is in month ${String(h.month?.number)}, not ${hMonth}.` };
    if (Number(h.year) !== hYear) return { ok: false, reason: `Day ${i + 1} is in year ${String(h.year)}, not ${hYear}.` };
    if (Number(h.month?.days) !== data.length) return { ok: false, reason: "The month length does not match the days listed." };
    if (i > 0 && daysBetweenKeys(days[i - 1]!.date, date) !== 1) return { ok: false, reason: `Day ${i + 1} does not follow day ${i} on the calendar.` };
    if (typeof h.method === "string" && h.method) method = h.method;
    days.push({ date, hDay: i + 1 });
  }
  if (!method) return { ok: false, reason: "The calendar response does not say which calendar it uses." };
  return { ok: true, record: { key: hijriMonthKey(hYear, hMonth), hYear, hMonth, method, fetchedAt, length: data.length, days } };
}

/** The names the service uses for its calendar codes (shown as the basis of a date). An unknown code is shown as it came. */
export const CALENDAR_METHOD_NAMES: Record<string, string> = { HJCoSA: "Hijri Calendar of Saudi Arabia", UAQ: "Umm al-Qura", DIYANET: "Diyanet", MATHEMATICAL: "Mathematical" };
export const calendarBasis = (method: string): string => (CALENDAR_METHOD_NAMES[method] ? `${CALENDAR_METHOD_NAMES[method]} (${method})` : method);

export const recordStart = (r: HijriMonthRecord): string => r.days[0]!.date;
export const recordEnd = (r: HijriMonthRecord): string => r.days[r.days.length - 1]!.date;

/**
 * Which Hijri year's Ramadan to ask for first: an estimate from the day count since the Hijri epoch (16 July 622), good to one year.
 * It only picks a request; `findRamadan` corrects a wrong pick from what the service returns.
 */
export function estimateRamadanYear(today: string): number {
  const epoch = Date.UTC(622, 6, 16, 12);
  const [y, m, d] = today.split("-").map(Number) as [number, number, number];
  const days = (Date.UTC(y, m - 1, d, 12) - epoch) / 86_400_000;
  const years = days / 354.36707;
  const hy = Math.floor(years);
  return (years - hy) * 12 >= 9 ? hy + 2 : hy + 1; // past month 9 of the year: the next year's Ramadan
}

export type FindOutcome = { status: "found"; record: HijriMonthRecord } | { status: "unavailable" };

/** The Ramadan that is under way today or the next one to come. `getMonth(year)` returns the Ramadan record for that Hijri year (saved or fetched), or null. */
export async function findRamadan(today: string, getMonth: (hYear: number) => Promise<HijriMonthRecord | null>): Promise<FindOutcome> {
  let year = estimateRamadanYear(today);
  const tried = new Set<number>();
  for (let n = 0; n < 4; n++) {
    if (tried.has(year)) break;
    tried.add(year);
    const rec = await getMonth(year);
    if (!rec) return { status: "unavailable" };
    if (recordEnd(rec) < today) year += 1; // that Ramadan is over: the next one
    else if (daysBetweenKeys(today, recordStart(rec)) > 380) year -= 1; // far too late: it was the year before
    else return { status: "found", record: rec };
  }
  return { status: "unavailable" };
}

/** The Gregorian date of Ramadan day `n` once the Hijri adjustment is applied: the adjustment moves the Hijri date a day shows, so day 1 falls `adjust` days earlier. */
export const adjustedStart = (record: HijriMonthRecord, adjust: number): string => addDaysKey(recordStart(record), -adjust);
