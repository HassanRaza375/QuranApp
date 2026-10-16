// The Hijri date shown on the Prayer page, from the cached prayer months, with the Settings adjustment applied in the app.
// The adjustment never touches the cache or its key: it reads the cached day at (today + adjustment), so month lengths of
// 29 or 30 days never have to be guessed. Pure.
import type { HijriDate } from "./hijri";
import type { PrayerDay } from "./prayerMonth";

export interface HijriShown {
  date: HijriDate;
  /** the adjustment that was actually applied (0 when it is off, or when the neighbouring day is not cached) */
  applied: number;
  /** an adjustment was asked for but could not be applied because that day is not in the cache */
  unavailable: boolean;
}

const shift = (key: string, days: number): string => {
  const t = new Date(`${key}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() + days);
  return t.toISOString().slice(0, 10);
};

export function hijriShown(days: PrayerDay[], todayKey: string, adjust: number): HijriShown | null {
  const find = (key: string) => days.find((d) => d.date === key)?.hijri ?? null;
  const today = find(todayKey);
  if (!today) return null;
  if (!adjust) return { date: today, applied: 0, unavailable: false };
  const adjusted = find(shift(todayKey, adjust));
  return adjusted ? { date: adjusted, applied: adjust, unavailable: false } : { date: today, applied: 0, unavailable: true };
}

/** "Adjusted by +1 day" / "Adjusted by −2 days". */
export const adjustNote = (n: number): string => `Adjusted by ${n > 0 ? "+" : "−"}${Math.abs(n)} day${Math.abs(n) === 1 ? "" : "s"}`;
