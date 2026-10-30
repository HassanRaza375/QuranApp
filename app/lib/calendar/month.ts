// The Calendar's month grid (Phase 15). A Hijri month is read from the calendar service's own days (`gToHCalendar`: every Gregorian day with its Hijri date,
// the records the Events page already saves); nothing here computes a Hijri date. The Settings Hijri adjustment moves a Hijri day's Gregorian date
// (+1 shows each Hijri day one Gregorian day earlier) for display only: it never touches a record or a cache key. Pure.
import { addDaysKey, daysBetweenKeys, weekdayOfKey } from "../dayKeys";
import { displayedDate, type GregorianMonthDay, type GregorianMonthRecord } from "../gregorianMonths";
import { visible, type EventDef } from "../islamicEvents";
import type { Reminder } from "../reminders";

export interface HijriId {
  y: number;
  m: number;
}
export const sameId = (a: HijriId, b: HijriId): boolean => a.y === b.y && a.m === b.m;
export const idKey = (id: HijriId): string => `${id.y}-${id.m}`;
export const nextId = (id: HijriId): HijriId => (id.m === 12 ? { y: id.y + 1, m: 1 } : { y: id.y, m: id.m + 1 });
export const prevId = (id: HijriId): HijriId => (id.m === 1 ? { y: id.y - 1, m: 12 } : { y: id.y, m: id.m - 1 });

export interface CalDay {
  /** the Gregorian day it is shown on (the adjustment applied) */
  date: string;
  /** the service's own Gregorian day for this Hijri day */
  serviceDate: string;
  hDay: number;
  weekday: number;
}
export interface CalMonth {
  id: HijriId;
  /** the service's name for the month (English, and Arabic when the saved record has it) */
  name: string | null;
  nameAr: string | null;
  method: string;
  days: CalDay[];
  /** first and last shown Gregorian day */
  start: string;
  end: string;
}

interface PoolDay extends GregorianMonthDay {
  method: string;
  name: string | undefined;
  nameAr: string | undefined;
}
/** Every service day in the saved Gregorian months, by its Gregorian day. */
export function poolOf(records: GregorianMonthRecord[]): Map<string, PoolDay> {
  const pool = new Map<string, PoolDay>();
  for (const r of records) for (const d of r.days) pool.set(d.date, { ...d, method: r.method, name: r.hijriNames[d.hMonth], nameAr: r.hijriNamesAr?.[d.hMonth] });
  return pool;
}
export type Pool = ReturnType<typeof poolOf>;

/** The Hijri month the Gregorian day `today` is in, once the adjustment is applied (the service day `adjust` days later). null when that day is not in the pool. */
export function idOfDate(pool: Pool, today: string, adjust: number): HijriId | null {
  const d = pool.get(addDaysKey(today, adjust));
  return d ? { y: d.hYear, m: d.hMonth } : null;
}

/** The month, only when the pool holds all of it (its day 1, and either its day 30 or the day after its last day, which starts another month). */
export function monthOf(pool: Pool, id: HijriId, adjust: number): CalMonth | null {
  const days = [...pool.values()].filter((d) => d.hYear === id.y && d.hMonth === id.m).sort((a, b) => a.date.localeCompare(b.date));
  const first = days[0];
  const last = days[days.length - 1];
  if (!first || !last || first.hDay !== 1) return null;
  for (let i = 1; i < days.length; i++) if (daysBetweenKeys(days[i - 1]!.date, days[i]!.date) !== 1 || days[i]!.hDay !== i + 1) return null;
  if (last.hDay < 29) return null;
  if (last.hDay !== 30) {
    const after = pool.get(addDaysKey(last.date, 1));
    if (!after || after.hDay !== 1) return null; // the month could still have a 30th day
  }
  const shown = days.map((d) => ({ date: displayedDate(d.date, adjust), serviceDate: d.date, hDay: d.hDay, weekday: weekdayOfKey(displayedDate(d.date, adjust)) }));
  return { id, name: first.name ?? null, nameAr: first.nameAr ?? null, method: first.method, days: shown, start: shown[0]!.date, end: shown[shown.length - 1]!.date };
}

/** The Gregorian months ("YYYY-MM") a step to the next (+1) or previous (-1) month needs saved: the day just past the month and a month beyond it. */
export function monthsToStep(cur: CalMonth, dir: 1 | -1): string[] {
  const dates = dir > 0 ? [addDaysKey(cur.days[cur.days.length - 1]!.serviceDate, 1), addDaysKey(cur.days[cur.days.length - 1]!.serviceDate, 32)] : [addDaysKey(cur.days[0]!.serviceDate, -1), addDaysKey(cur.days[0]!.serviceDate, -31)];
  return [...new Set(dates.map((d) => d.slice(0, 7)))];
}

/** Leading blanks before day 1 so the grid starts on Sunday. */
export const leadBlanks = (m: CalMonth): number => m.days[0]!.weekday;

/** "27 Rajab 1448" for the Gregorian day shown, from the service's own days. null when the day is not in the pool. */
export function hijriLabel(pool: Pool, date: string, adjust: number): { day: number; month: number; year: number; text: string } | null {
  const d = pool.get(addDaysKey(date, adjust));
  if (!d) return null;
  return { day: d.hDay, month: d.hMonth, year: d.hYear, text: `${d.hDay} ${d.name ?? `month ${d.hMonth}`} ${d.hYear}` };
}

// ---------------------------------------------------------------- events and reminders on a day

/** The events of a Hijri day that the view shows (the fiqh view as on the Events page). */
export const eventsOn = (events: EventDef[], hMonth: number, hDay: number, tradition: "sunni" | "jafari" | null): EventDef[] => events.filter((e) => e.month === hMonth && e.day === hDay && visible(e, tradition));

/** Whether a reminder falls on the Gregorian day `date` (whose Hijri date is `h`, when the pool knows it). Done reminders do not. A repeat starts on its own day. */
export function remindsOn(r: Reminder, date: string, h: { month: number; day: number } | null): boolean {
  if (r.done) return false;
  if (r.date === date) return true;
  if (date < r.date || !r.repeat) return false;
  if (r.repeat.by === "gregorian") return r.date.slice(5) === date.slice(5);
  return !!h && r.repeat.month === h.month && r.repeat.day === h.day;
}
export const remindersOn = (list: Reminder[], date: string, h: { month: number; day: number } | null): Reminder[] => list.filter((r) => remindsOn(r, date, h));

/** The next Gregorian day on or after `from` with the month and day of `key` ("YYYY-MM-DD"); a 29 February waits for a leap year. */
export function nextAnniversary(key: string, from: string): string | null {
  const mmdd = key.slice(5);
  let y = Number(from.slice(0, 4));
  for (let i = 0; i < 9; i++, y++) {
    const cand = `${y}-${mmdd}`;
    const probe = new Date(`${cand}T12:00:00Z`);
    if (Number.isNaN(probe.getTime()) || probe.toISOString().slice(0, 10) !== cand) continue;
    if (cand >= from && cand >= key) return cand;
  }
  return null;
}

export interface Upcoming {
  date: string;
  title: string;
  /** "27 Rajab 1448" or similar; "Your reminder" for a reminder */
  sub: string;
  kind: "event" | "reminder";
  daysUntil: number;
  /** a reminder's id */
  id?: string;
  repeats?: boolean;
}
export interface UpcomingInput {
  /** events already placed on Gregorian days (Events' `placed`), filtered for the view */
  events: Array<{ event: EventDef; date: string; hijriLabel: string; daysUntil: number }>;
  reminders: Reminder[];
  pool: Pool;
  adjust: number;
  today: string;
  /** the last day to look at (inclusive); beyond it nothing is known */
  end: string;
  limit: number;
}
/** The next events and reminders, nearest first. Repeating reminders are placed from the saved days (Hijri) or the calendar (Gregorian). */
export function comingUp({ events, reminders, pool, adjust, today, end, limit }: UpcomingInput): Upcoming[] {
  const out: Upcoming[] = events.map((p) => ({ date: p.date, title: p.event.name, sub: p.hijriLabel, kind: "event" as const, daysUntil: p.daysUntil }));
  for (const r of reminders) {
    if (r.done) continue;
    const dates = new Set<string>();
    if (r.date >= today && r.date <= end) dates.add(r.date);
    if (r.repeat?.by === "gregorian") {
      let from = today > r.date ? today : r.date;
      for (let i = 0; i < 4; i++) {
        const next = nextAnniversary(r.date, from);
        if (!next || next > end) break;
        dates.add(next);
        from = addDaysKey(next, 1);
      }
    } else if (r.repeat?.by === "hijri") {
      for (const d of pool.values()) {
        if (d.hMonth !== r.repeat.month || d.hDay !== r.repeat.day) continue;
        const shown = displayedDate(d.date, adjust);
        if (shown >= today && shown >= r.date && shown <= end) dates.add(shown);
      }
    }
    for (const date of dates) out.push({ date, title: r.title, sub: "Your reminder", kind: "reminder", daysUntil: daysBetweenKeys(today, date), id: r.id, repeats: !!r.repeat });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || (a.kind === b.kind ? 0 : a.kind === "event" ? -1 : 1)).slice(0, limit);
}

/** The Hijri month and day for a reminder set on Gregorian day `date`, or null when the saved days do not cover it. */
export function hijriOfDate(pool: Pool, date: string, adjust: number): { month: number; day: number } | null {
  const h = hijriLabel(pool, date, adjust);
  return h ? { month: h.month, day: h.day } : null;
}
