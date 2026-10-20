// Ramadan: the legacy record `quran:ramadan:v1` ({ startOverride, fastingLog }) kept in its shape, and the plan for Ramadan (is it under
// way, which day, when does it begin) from the calendar service's Hijri month and the cached prayer days, with the Settings Hijri
// adjustment applied here and never in a cache key. No streak and no guilt wording anywhere. Pure over the storage wrapper.
import { addDaysKey, daysBetweenKeys, weekdayOfKey } from "./dayKeys";
import { hijriShown } from "./hijriAdjust";
import { adjustedStart, calendarBasis, type HijriMonthRecord } from "./hijriMonths";
import type { PrayerDay } from "./prayerMonth";
import { getJSON, setJSON } from "./storage";

export const RAMADAN_KEY = "quran:ramadan:v1";
/** The legacy start-date override is active for 30 days from the date (the longer month), so it never expires a day early. */
export const OVERRIDE_WINDOW_DAYS = 30;
/** A manual start date further ahead than this is ignored (a typo, not a plan). */
const OVERRIDE_LOOKAHEAD_DAYS = 90;

export type FastingStatus = "fasted" | "missed" | "planned";
/** The stored value `missed` stays (the legacy key); the label is neutral. */
export const FASTING_LABELS: Record<FastingStatus, string> = { fasted: "Fasted", missed: "Didn’t fast", planned: "Planned" };
const STATUSES = new Set<string>(["fasted", "missed", "planned"]);
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export interface RamadanRecord {
  startOverride: string | null;
  fastingLog: Record<string, FastingStatus>;
  /** other fields of the stored record, kept as they were */
  rest: Record<string, unknown>;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

export function readRamadan(): RamadanRecord {
  const raw = getJSON<unknown>(RAMADAN_KEY, null);
  if (!isObj(raw)) return { startOverride: null, fastingLog: {}, rest: {} };
  const { startOverride, fastingLog, ...rest } = raw;
  const log: Record<string, FastingStatus> = {};
  if (isObj(fastingLog)) for (const [k, v] of Object.entries(fastingLog)) if (DAY_KEY.test(k) && typeof v === "string" && STATUSES.has(v)) log[k] = v as FastingStatus;
  return { startOverride: typeof startOverride === "string" && DAY_KEY.test(startOverride) ? startOverride : null, fastingLog: log, rest };
}
export const writeRamadan = (r: RamadanRecord): boolean => setJSON(RAMADAN_KEY, { ...r.rest, startOverride: r.startOverride, fastingLog: r.fastingLog });

export const setStartOverride = (key: string | null): boolean => {
  const r = readRamadan();
  return writeRamadan({ ...r, startOverride: key && DAY_KEY.test(key) ? key : null });
};
export function setFastingStatus(date: string, status: FastingStatus | null): boolean {
  const r = readRamadan();
  const log = Object.fromEntries(Object.entries(r.fastingLog).filter(([k]) => k !== date)) as Record<string, FastingStatus>;
  if (status) log[date] = status;
  return writeRamadan({ ...r, fastingLog: log });
}
/** The legacy cycle: nothing, fasted, didn't fast, nothing. */
export const nextFastingStatus = (cur: FastingStatus | null | undefined): FastingStatus | null => (cur === "fasted" ? "missed" : cur === "missed" ? null : "fasted");
export const fastingCounts = (log: Record<string, FastingStatus>) => {
  const v = Object.values(log);
  return { fasted: v.filter((s) => s === "fasted").length, missed: v.filter((s) => s === "missed").length, planned: v.filter((s) => s === "planned").length };
};

// ---------------------------------------------------------------- the plan

export interface RamadanPlan {
  state: "before" | "during" | "over" | "unknown";
  /** the Gregorian date of day 1 as the app shows it (adjustment applied) */
  start: string | null;
  length: number | null;
  /** today's Ramadan day while it is under way */
  day: number | null;
  daysUntil: number | null;
  source: "manual" | "calendar" | null;
  /** the calendar the dates follow, in the service's words ("Hijri Calendar of Saudi Arabia (HJCoSA)") */
  basis: string | null;
}
const UNKNOWN: RamadanPlan = { state: "unknown", start: null, length: null, day: null, daysUntil: null, source: null, basis: null };

export interface PlanInput {
  today: string;
  adjust: number;
  override: string | null;
  /** the Ramadan month from the calendar service (saved or fetched), when there is one */
  month: HijriMonthRecord | null;
  /** every cached prayer day (each carries its Hijri date) */
  days: PrayerDay[];
}

export function planRamadan({ today, adjust, override, month, days }: PlanInput): RamadanPlan {
  const basis = month ? calendarBasis(month.method) : null;
  if (override) {
    const diff = daysBetweenKeys(override, today);
    const length = month?.length ?? OVERRIDE_WINDOW_DAYS;
    if (diff >= 0 && diff < OVERRIDE_WINDOW_DAYS) return { state: "during", start: override, length, day: diff + 1, daysUntil: null, source: "manual", basis };
    if (diff < 0 && -diff <= OVERRIDE_LOOKAHEAD_DAYS) return { state: "before", start: override, length, day: null, daysUntil: -diff, source: "manual", basis };
  }
  const shown = hijriShown(days, today, adjust);
  if (shown && shown.date.month === 9) {
    const start = addDaysKey(today, -(shown.date.day - 1));
    return { state: "during", start, length: month?.length ?? null, day: shown.date.day, daysUntil: null, source: "calendar", basis };
  }
  if (month) {
    const start = adjustedStart(month, adjust);
    const end = addDaysKey(start, month.length - 1);
    if (today < start) return { state: "before", start, length: month.length, day: null, daysUntil: daysBetweenKeys(today, start), source: "calendar", basis };
    if (today <= end) return { state: "during", start, length: month.length, day: daysBetweenKeys(start, today) + 1, daysUntil: null, source: "calendar", basis };
    return { state: "over", start, length: month.length, day: null, daysUntil: null, source: "calendar", basis };
  }
  return UNKNOWN;
}

/** The Gregorian dates of Ramadan days 1..length for a plan that knows its start. */
export function ramadanDates(plan: RamadanPlan): string[] {
  if (!plan.start) return [];
  const n = plan.length ?? OVERRIDE_WINDOW_DAYS;
  return Array.from({ length: n }, (_, i) => addDaysKey(plan.start!, i));
}

// ---------------------------------------------------------------- the timetable and the tracker strip

export interface TimetableRow {
  day: number;
  date: string;
  friday: boolean;
  today: boolean;
  /** "04:59"; null when that day's times are not saved */
  imsak: string | null;
  suhoorEnds: string | null;
  iftar: string | null;
}

export function timetableRows(plan: RamadanPlan, today: string, days: PrayerDay[]): TimetableRow[] {
  const byDate = new Map(days.map((d) => [d.date, d]));
  return ramadanDates(plan).map((date, i) => {
    const d = byDate.get(date);
    return { day: i + 1, date, friday: weekdayOfKey(date) === 5, today: date === today, imsak: d?.timings.Imsak ?? null, suhoorEnds: d?.timings.Fajr ?? null, iftar: d?.timings.Maghrib ?? null };
  });
}
export const missingRows = (rows: TimetableRow[]) => rows.filter((r) => !r.suhoorEnds || !r.iftar).length;

export interface StripDay {
  day: number;
  date: string;
  today: boolean;
  status: FastingStatus | null;
}
/** The last 7 Ramadan days up to today (fewer at the start of the month). */
export function trackerStrip(plan: RamadanPlan, today: string, log: Record<string, FastingStatus>): StripDay[] {
  if (plan.state !== "during" || !plan.start || !plan.day) return [];
  const first = Math.max(1, plan.day - 6);
  return Array.from({ length: plan.day - first + 1 }, (_, i) => {
    const day = first + i;
    const date = addDaysKey(plan.start!, day - 1);
    return { day, date, today: date === today, status: log[date] ?? null };
  });
}

// ---------------------------------------------------------------- when to fetch the Ramadan prayer months

/** Ramadan's prayer months are fetched ahead from 1 Sha'ban (about 30 days before it begins), or whenever the Timetable is opened online. */
export const PREFETCH_DAYS = 31;
export const shouldPrefetch = (plan: RamadanPlan): boolean => plan.state === "before" && plan.daysUntil !== null && plan.daysUntil <= PREFETCH_DAYS;
/** The "YYYY-MM" months the plan's dates fall in. */
export function monthsOf(plan: RamadanPlan): string[] {
  return [...new Set(ramadanDates(plan).map((d) => d.slice(0, 7)))];
}

// ---------------------------------------------------------------- Laylat al-Qadr (the legacy nights, shown for both fiqhs)

export const isQadrNight = (day: number | null, nights: readonly number[]): boolean => day !== null && nights.includes(day);
