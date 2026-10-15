// Hijri date preview for the "Hijri date adjustment" setting. The adjusted date is read from the neighbouring day of
// the cached prayer months (each day carries its Hijri date from the service), so month lengths of 29 or 30 days
// never have to be guessed. If the neighbouring day is not cached, there is no preview.
import type { PrayerDay } from "./prayerMonth";

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthNameEn: string;
}

const shiftDate = (date: string, days: number): string => {
  const t = new Date(`${date}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() + days);
  return t.toISOString().slice(0, 10);
};

export function hijriPreview(days: PrayerDay[], todayKey: string, adjust: number): { today: HijriDate; adjusted: HijriDate } | null {
  const find = (date: string) => days.find((d) => d.date === date)?.hijri ?? null;
  const today = find(todayKey);
  const adjusted = find(shiftDate(todayKey, adjust));
  return today && adjusted ? { today, adjusted } : null;
}

export const formatHijri = (h: HijriDate): string => `${h.day} ${h.monthNameEn || `month ${h.month}`} ${h.year}`;
