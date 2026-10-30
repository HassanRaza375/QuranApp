// A Gregorian month with the Hijri date of every day, from the calendar service (AlAdhan `/v1/gToHCalendar/{month}/{year}`). Phase 8B uses it
// to place Islamic events (a Hijri month and day) on Gregorian days. Nothing here computes a date by a formula: the service's own Hijri
// day is the only source. The Settings Hijri adjustment is applied by the caller, never to this record or its key. Pure.
import { addDaysKey } from "./dayKeys";

export interface GregorianMonthDay {
  /** "YYYY-MM-DD" */
  date: string;
  hDay: number;
  hMonth: number;
  hYear: number;
}
export interface GregorianMonthRecord {
  /** "g:YYYY-MM" (a separate key space in the same store as the Ramadan month) */
  key: string;
  /** "YYYY-MM" */
  month: string;
  method: string;
  fetchedAt: number;
  days: GregorianMonthDay[];
  /** the service's own English name for each Hijri month it reports in this Gregorian month */
  hijriNames: Record<number, string>;
  /** the service's own Arabic name for each of them (Phase 15, for the Calendar); absent in a month saved before then */
  hijriNamesAr?: Record<number, string>;
}

export const gregorianMonthKey = (month: string) => `g:${month}`;
export const gregorianMonthUrl = (base: string, month: string) => {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return `${base}/gToHCalendar/${m}/${y}`;
};

const isoOf = (raw: unknown): string | null => {
  if (typeof raw !== "string") return null;
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(raw);
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const probe = new Date(Date.UTC(y, mo - 1, d, 12));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

export type GregorianNormalize = { ok: true; record: GregorianMonthRecord } | { ok: false; reason: string };

/** Validates a service response for Gregorian month "YYYY-MM". Anything off is rejected (never shown, never stored). */
export function normalizeGregorianMonth(json: unknown, month: string, fetchedAt: number): GregorianNormalize {
  const j = json as { code?: unknown; data?: unknown } | null;
  if (!j || typeof j !== "object" || j.code !== 200 || !Array.isArray(j.data)) return { ok: false, reason: "The calendar response was not in the expected shape." };
  const [y, m] = month.split("-").map(Number) as [number, number];
  const length = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const data = j.data as Array<{ hijri?: Record<string, unknown>; gregorian?: Record<string, unknown> }>;
  if (data.length !== length) return { ok: false, reason: `The month has ${data.length} days; expected ${length}.` };
  const days: GregorianMonthDay[] = [];
  const hijriNames: Record<number, string> = {};
  const hijriNamesAr: Record<number, string> = {};
  let method = "";
  for (let i = 0; i < data.length; i++) {
    const h = data[i]?.hijri as { day?: unknown; year?: unknown; method?: unknown; month?: { number?: unknown; en?: unknown; ar?: unknown } } | undefined;
    const date = isoOf((data[i]?.gregorian as { date?: unknown } | undefined)?.date);
    if (!h || !date) return { ok: false, reason: `Day ${i + 1} has no usable date.` };
    if (date !== `${y}-${String(m).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`) return { ok: false, reason: `Day ${i + 1} is dated ${date}.` };
    const hDay = Number(h.day);
    const hMonth = Number(h.month?.number);
    const hYear = Number(h.year);
    if (!Number.isInteger(hDay) || hDay < 1 || hDay > 30 || !Number.isInteger(hMonth) || hMonth < 1 || hMonth > 12 || !Number.isInteger(hYear)) return { ok: false, reason: `Day ${i + 1} has an unusable Hijri date.` };
    const prev = days[i - 1];
    if (prev) {
      const sameMonth = prev.hMonth === hMonth && prev.hYear === hYear && hDay === prev.hDay + 1;
      const nextMonth = hDay === 1 && ((hMonth === prev.hMonth + 1 && hYear === prev.hYear) || (prev.hMonth === 12 && hMonth === 1 && hYear === prev.hYear + 1));
      if (!sameMonth && !nextMonth) return { ok: false, reason: `Day ${i + 1} does not follow day ${i} on the Hijri calendar.` };
    }
    if (typeof h.method === "string" && h.method) method = h.method;
    if (typeof h.month?.en === "string" && h.month.en) hijriNames[hMonth] = h.month.en;
    if (typeof h.month?.ar === "string" && h.month.ar) hijriNamesAr[hMonth] = h.month.ar;
    days.push({ date, hDay, hMonth, hYear });
  }
  if (!method) return { ok: false, reason: "The calendar response does not say which calendar it uses." };
  return { ok: true, record: { key: gregorianMonthKey(month), month, method, fetchedAt, days, hijriNames, ...(Object.keys(hijriNamesAr).length ? { hijriNamesAr } : {}) } };
}

/** The "YYYY-MM" keys from `from` for `count` months. */
export function monthRange(from: string, count: number): string[] {
  const [y, m] = from.split("-").map(Number) as [number, number];
  return Array.from({ length: count }, (_, i) => {
    const idx = y * 12 + (m - 1) + i;
    return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
  });
}
export function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const idx = y * 12 + (m - 1) + by;
  return `${Math.floor(idx / 12)}-${String((idx % 12) + 1).padStart(2, "0")}`;
}

/** The last Gregorian day (inclusive) of the window of `count` months that starts at the month of `today`. */
export const windowEnd = (today: string, count: number): string => {
  const last = monthRange(today.slice(0, 7), count)[count - 1]!;
  const [y, m] = last.split("-").map(Number) as [number, number];
  return `${last}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, "0")}`;
};

/** Where an event on service day `date` is shown once the adjustment is applied: +1 shows it a day earlier. */
export const displayedDate = (date: string, adjust: number): string => addDaysKey(date, -adjust);
