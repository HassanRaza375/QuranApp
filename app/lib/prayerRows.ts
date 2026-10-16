// The rows of the prayer schedule and what each one is. Pure.
//
// "Latest" is the most recent prayer whose start time has passed. It says nothing about when a prayer time ENDS (that is a
// ruling that differs between traditions and scholars; the app makes none). "Next" is the next start time still to come
// today; after Isha there is no "Next" row (tomorrow's Fajr is on the card).
import { zonedInstant, type NextPrayer } from "./prayerClock";
import { PRAYERS, type PrayerDay, type PrayerName } from "./prayerMonth";

export type RowKey = PrayerName | "Sunrise";
export type RowStatus = "past" | "latest" | "next" | "upcoming";

export interface ScheduleRow {
  key: RowKey;
  /** "04:32" */
  time: string;
  /** Sunrise is information, not a prayer: no tag and no bell */
  isPrayer: boolean;
  status: RowStatus;
  /** "Jumu’ah" under Dhuhr on a Friday (the location's calendar day) */
  note?: string;
}

/** Friday at the LOCATION, from the day key of the cached month (never from the device's clock). */
export const isFriday = (dateKey: string): boolean => new Date(`${dateKey}T12:00:00Z`).getUTCDay() === 5;

const ORDER: RowKey[] = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];

export function buildRows(day: PrayerDay, now: Date, tz: string, next: NextPrayer | null): ScheduleRow[] {
  const at = (hhmm: string) => zonedInstant(day.date, hhmm, tz).getTime();
  const rows: ScheduleRow[] = [];
  let latest: PrayerName | null = null;
  for (const p of PRAYERS) if (at(day.timings[p]) <= now.getTime()) latest = p;
  for (const key of ORDER) {
    const time = key === "Sunrise" ? day.timings.Sunrise : day.timings[key];
    if (!time) continue; // a response without Sunrise simply has no Sunrise row
    const passed = at(time) <= now.getTime();
    let status: RowStatus = passed ? "past" : "upcoming";
    if (key !== "Sunrise") {
      if (key === latest) status = "latest";
      else if (next && !next.isTomorrow && next.name === key) status = "next";
    }
    const row: ScheduleRow = { key, time, isPrayer: key !== "Sunrise", status };
    if (key === "Dhuhr" && isFriday(day.date)) row.note = "Jumu’ah";
    rows.push(row);
  }
  return rows;
}
