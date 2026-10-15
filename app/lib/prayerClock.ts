// Time arithmetic for prayer times. Times are wall-clock times in the LOCATION's time zone, so "now", "today" and
// "next prayer" are all worked out in that zone, never in the device's.
import { PRAYERS, type PrayerDay, type PrayerName } from "./prayerMonth";

const partsFormatters = new Map<string, Intl.DateTimeFormat>();
function formatter(tz: string): Intl.DateTimeFormat {
  let f = partsFormatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    partsFormatters.set(tz, f);
  }
  return f;
}

function wallParts(instant: Date, tz: string) {
  const o: Record<string, number> = {};
  for (const p of formatter(tz).formatToParts(instant)) if (p.type !== "literal") o[p.type] = Number(p.value);
  return o as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** Offset of `tz` from UTC at `instant`, in ms (positive east of UTC). */
function offsetMs(instant: Date, tz: string): number {
  const w = wallParts(instant, tz);
  return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second) - Math.floor(instant.getTime() / 1000) * 1000;
}

/** "YYYY-MM-DD" of `instant` in `tz`. */
export function dateKeyInZone(instant: Date, tz: string): string {
  const w = wallParts(instant, tz);
  return `${w.year}-${String(w.month).padStart(2, "0")}-${String(w.day).padStart(2, "0")}`;
}

/** The instant at which the wall clock in `tz` reads `dateKey` `hhmm`. Settles across a DST change by re-checking the offset. */
export function zonedInstant(dateKey: string, hhmm: string, tz: string): Date {
  const [y, mo, d] = dateKey.split("-").map(Number) as [number, number, number];
  const h = Number(hhmm.slice(0, 2));
  const mi = Number(hhmm.slice(3, 5));
  const asUtc = Date.UTC(y, mo - 1, d, h, mi, 0);
  let guess = asUtc - offsetMs(new Date(asUtc), tz);
  guess = asUtc - offsetMs(new Date(guess), tz);
  return new Date(guess);
}

export type NextPrayer =
  | { name: PrayerName; at: Date; isTomorrow: boolean }
  | { name: "Fajr"; at: null; isTomorrow: true }; // tomorrow's times are not available (month end and offline): no countdown

/**
 * The next prayer after `now`. After Isha it is tomorrow's real Fajr. If tomorrow's times are not cached, it says
 * "Fajr, tomorrow" without a time rather than guessing (the legacy app reused today's Fajr time).
 */
export function nextPrayer(today: PrayerDay | null, tomorrow: PrayerDay | null, now: Date, tz: string): NextPrayer | null {
  if (!today) return null;
  for (const name of PRAYERS) {
    const at = zonedInstant(today.date, today.timings[name], tz);
    if (at.getTime() > now.getTime()) return { name, at, isTomorrow: false };
  }
  if (tomorrow) return { name: "Fajr", at: zonedInstant(tomorrow.date, tomorrow.timings.Fajr, tz), isTomorrow: true };
  return { name: "Fajr", at: null, isTomorrow: true };
}

/** "1h 34m", "34m", or "less than a minute". Minute precision on purpose (no seconds, no per-second updates). */
export function countdownText(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  if (totalMin < 1) return "less than a minute";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** "04:32" -> "4:32 AM". */
export function formatClock12(hhmm: string): string {
  const h = Number(hhmm.slice(0, 2));
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 === 0 ? 12 : h % 12}:${hhmm.slice(3, 5)} ${suffix}`;
}

/** "today at 9:14 AM", "yesterday at 9:14 AM" or "12 Oct", judged on the device's local calendar. */
export function lastUpdatedText(fetchedAt: number, now: Date): string {
  const t = new Date(fetchedAt);
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(t)) / 86400000);
  const clock = formatClock12(`${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`);
  if (diffDays === 0) return `today at ${clock}`;
  if (diffDays === 1) return `yesterday at ${clock}`;
  return t.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
