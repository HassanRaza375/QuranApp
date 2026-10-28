// Reading goals (Phase 15): the rules. Pure. A goal is stored in the LEGACY shape (`quran:reading-goals:v1`, see store.ts) and everything is turned into
// ayahs a day when the goal is made, exactly as the legacy `useReadingGoals.ts` does (tests/goalsParity.test.ts runs the legacy composable beside this).
// What differs on purpose (owner decisions of 2026-10-28, docs/phases/phase-15-goals-calendar-plan.md):
//   * today's amount for a finish-by-date goal is worked out from the ayahs left and the days left, and says so plainly when the date has passed;
//   * no streak, no "behind pace", no catch-up amount;
//   * "complete" is only for finish-by-date goals (a Ramadan Khatmah is one).
import { addDaysKey, daysBetweenKeys, weekdayOfKey } from "../dayKeys";
import { TOTAL_AYAHS_IN_QURAN } from "../quranCounts";
import { absolute, AYAH_COUNTS, JUZ, TOTAL_JUZ, TOTAL_PAGES } from "../quranMeta";

export type GoalType = "finish-by-date" | "ayahs-per-day" | "pages-per-day" | "juz-per-week" | "custom";
export type GoalStatus = "active" | "paused" | "completed" | "abandoned";

export interface Goal {
  id: string;
  type: GoalType;
  label: string;
  /** local day, "YYYY-MM-DD" */
  startDate: string;
  /** only for finish-by-date */
  targetDate: string | null;
  dailyAyahTarget: number;
  /** where the reader was when the goal began (1 to 6,236; 0 when it had not started) */
  startAbsoluteAyah: number;
  /** 0 = Sunday ... 6 = Saturday */
  preferredDays: number[];
  status: GoalStatus;
  createdAt: number;
  [k: string]: unknown;
}

export const TOTAL_AYAHS = TOTAL_AYAHS_IN_QURAN;
export const AYAHS_PER_PAGE = TOTAL_AYAHS / TOTAL_PAGES;
export const AYAHS_PER_JUZ = TOTAL_AYAHS / TOTAL_JUZ;
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const KHATMAH_LABEL = "Ramadan Khatmah";

/** The goal types the New goal sheet offers. (A stored `custom` goal is still shown and kept.) */
export const OFFERED_TYPES: Array<{ type: GoalType; title: string; hint: string }> = [
  { type: "finish-by-date", title: "Finish by a date", hint: "Pick the day; the daily amount is worked out from where you are." },
  { type: "ayahs-per-day", title: "Ayahs a day", hint: "A steady number every day." },
  { type: "pages-per-day", title: "Pages a day", hint: "Counted by mushaf page (604 pages)." },
  { type: "juz-per-week", title: "Juz a week", hint: "Spread over the week." },
];

/** Ayahs a day for a new goal. The same arithmetic as the legacy `computeDailyAyahTarget`. */
export function dailyAmount(type: GoalType, amount: number, remainingAyahs: number, daysUntilTarget: number): number {
  switch (type) {
    case "finish-by-date":
      return Math.ceil(remainingAyahs / Math.max(1, daysUntilTarget));
    case "pages-per-day":
      return Math.ceil(amount * AYAHS_PER_PAGE);
    case "juz-per-week":
      return Math.ceil((amount * AYAHS_PER_JUZ) / 7);
    default:
      return Math.max(1, Math.round(amount));
  }
}

/** A saved place as a position in the Qur'an (1 to 6,236), or null when there is no usable place. */
export function positionOf(progress: unknown): number | null {
  const p = progress as { surahNo?: unknown; ayahNo?: unknown } | null;
  if (!p || typeof p !== "object") return null;
  const s = p.surahNo;
  const a = p.ayahNo;
  if (typeof s !== "number" || typeof a !== "number" || !Number.isInteger(s) || !Number.isInteger(a)) return null;
  if (s < 1 || s > 114 || a < 1 || a > (AYAH_COUNTS[s - 1] ?? 0)) return null;
  return absolute(s, a);
}

/** The surah and ayah at a position (1 to 6,236). */
export function ayahAt(position: number): { surah: number; ayah: number } | null {
  if (!Number.isInteger(position) || position < 1 || position > TOTAL_AYAHS) return null;
  let left = position;
  for (let i = 0; i < AYAH_COUNTS.length; i++) {
    if (left <= AYAH_COUNTS[i]!) return { surah: i + 1, ayah: left };
    left -= AYAH_COUNTS[i]!;
  }
  return null;
}

/** The ayah to read next, after the saved place (the first ayah when there is none; null at the very end). */
export function nextUp(position: number | null): { surah: number; ayah: number } | null {
  return ayahAt((position ?? 0) + 1);
}

// ---------------------------------------------------------------- what a goal asks today

export type Today = { kind: "amount"; ayahs: number } | { kind: "passed" } | { kind: "done" };

/**
 * What to read today. A finish-by-date goal is worked out from the ayahs left and the days left (so it always keeps the date); on the date, or after
 * it, there is no amount, only a plain sentence. Other goals keep the amount stored when they were made. Never a "catch-up".
 */
export function todayFor(goal: Goal, position: number | null, today: string): Today {
  if (goal.type === "finish-by-date" && goal.targetDate) {
    const left = TOTAL_AYAHS - Math.max(position ?? 0, goal.startAbsoluteAyah);
    if (left <= 0) return { kind: "done" };
    const days = daysBetweenKeys(today, goal.targetDate);
    if (days <= 0) return { kind: "passed" };
    return { kind: "amount", ayahs: Math.ceil(left / days) };
  }
  return { kind: "amount", ayahs: Math.max(1, Math.round(goal.dailyAyahTarget)) };
}

export const PASSED_LINE = "Your date has passed. Choose a new date or keep reading.";

export interface Progress {
  /** ayahs of the Qur'an read since the goal began */
  readSince: number;
  /** ayahs that were left when the goal began */
  total: number;
  percent: number;
}
/** Where a goal stands: the saved place minus the place when it began (the legacy meaning, so a goal made in the old app reads the same). */
export function progressOf(goal: Goal, position: number | null): Progress {
  const total = Math.max(0, TOTAL_AYAHS - goal.startAbsoluteAyah);
  const at = position ?? goal.startAbsoluteAyah;
  const readSince = Math.max(0, Math.min(total, at - goal.startAbsoluteAyah));
  return { readSince, total, percent: total > 0 ? Math.min(100, Math.round((readSince / total) * 100)) : 0 };
}

/** Only a finish-by-date goal (a Ramadan Khatmah is one) can be complete, and only when the saved place is the last ayah. */
export const isComplete = (goal: Goal, position: number | null): boolean => goal.type === "finish-by-date" && goal.status === "active" && (position ?? 0) >= TOTAL_AYAHS;

// ---------------------------------------------------------------- the 30 juz as one line

export interface JuzCell {
  n: number;
  state: "done" | "current" | "ahead";
  /** 0 to 100, for the current one */
  part: number;
}
const JUZ_ABS = JUZ.map((j) => absolute(j.startSurah, j.startAyah));
/** Which juz are done and how far into the current one the saved place is. */
export function juzLine(position: number | null): { cells: JuzCell[]; done: number } {
  const at = position ?? 0;
  let done = 0;
  const cells = JUZ_ABS.map((start, i) => {
    const end = (JUZ_ABS[i + 1] ?? TOTAL_AYAHS + 1) - 1;
    if (at >= end) {
      done++;
      return { n: i + 1, state: "done" as const, part: 100 };
    }
    if (at >= start) return { n: i + 1, state: "current" as const, part: Math.round(((at - start + 1) / (end - start + 1)) * 100) };
    return { n: i + 1, state: "ahead" as const, part: 0 };
  });
  return { cells, done };
}

// ---------------------------------------------------------------- the log

/** Ayahs counted on a day (the reader's entries and the ones logged by hand). */
export const countOn = (log: Record<string, string[]>, day: string): number => (Array.isArray(log[day]) ? log[day]!.length : 0);

export interface WeekBar {
  date: string;
  count: number;
  /** a day outside the goal's preferred days */
  off: boolean;
  today: boolean;
  /** "S M T W T F S" letter index (weekday, 0 = Sunday) */
  weekday: number;
}
/** The seven days ending today. */
export function weekBars(log: Record<string, string[]>, today: string, preferredDays: number[]): WeekBar[] {
  const set = new Set(preferredDays.length ? preferredDays : ALL_DAYS);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDaysKey(today, i - 6);
    const weekday = weekdayOfKey(date);
    return { date, count: countOn(log, date), off: !set.has(weekday), today: date === today, weekday };
  });
}

/** Your last 7 days as a plain average, once the goal is at least a week old and something was read. null otherwise. */
export function lastWeekAverage(goal: Goal, log: Record<string, string[]>, today: string): number | null {
  if (daysBetweenKeys(goal.startDate, today) < 7) return null;
  let sum = 0;
  for (let i = 0; i < 7; i++) sum += countOn(log, addDaysKey(today, -i));
  return sum > 0 ? Math.round(sum / 7) : null;
}

// ---------------------------------------------------------------- labels

export const typeLabel = (g: Pick<Goal, "type">): string =>
  ({ "finish-by-date": "Finish by a date", "ayahs-per-day": "Ayahs a day", "pages-per-day": "Pages a day", "juz-per-week": "Juz a week", custom: "Custom" })[g.type] ?? "Goal";

export const STATUS_LABEL: Record<GoalStatus, string> = { active: "Not your main goal", paused: "Paused", completed: "Complete", abandoned: "Stopped" };
