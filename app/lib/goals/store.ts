// The goals record `quran:reading-goals:v1` = { goals, activeGoalId, dailyLog } in the legacy shape. The reader appends to `dailyLog` (lib/goalLog.ts) and
// this page edits the goals, so every change reads the stored record fresh and writes it back with everything it does not know kept. Pure functions
// over a record, plus a `mutate` wrapper over the storage wrapper.
import { daysBetweenKeys } from "../dayKeys";
import { GOALS_KEY } from "../goalLog";
import { getJSON, setJSON } from "../storage";
import { dailyAmount, isComplete, ALL_DAYS, TOTAL_AYAHS, KHATMAH_LABEL, type Goal, type GoalStatus, type GoalType } from "./model";

export { GOALS_KEY, KHATMAH_LABEL };

export interface GoalsRecord {
  goals: Goal[];
  activeGoalId: string | null;
  dailyLog: Record<string, string[]>;
  /** every other field of the stored object, kept as it was */
  rest: Record<string, unknown>;
}

export const emptyGoals = (): GoalsRecord => ({ goals: [], activeGoalId: null, dailyLog: {}, rest: {} });

const TYPES: GoalType[] = ["finish-by-date", "ayahs-per-day", "pages-per-day", "juz-per-week", "custom"];
const STATUSES: GoalStatus[] = ["active", "paused", "completed", "abandoned"];
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function goalFrom(x: unknown): Goal | null {
  if (!isObj(x) || typeof x.id !== "string" || !x.id) return null;
  const type = (TYPES as unknown[]).includes(x.type) ? (x.type as GoalType) : "custom";
  const status = (STATUSES as unknown[]).includes(x.status) ? (x.status as GoalStatus) : "active";
  const target = typeof x.dailyAyahTarget === "number" && Number.isFinite(x.dailyAyahTarget) && x.dailyAyahTarget > 0 ? x.dailyAyahTarget : 1;
  const days = Array.isArray(x.preferredDays) ? (x.preferredDays as unknown[]).filter((d): d is number => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6) : [];
  return {
    ...x,
    id: x.id,
    type,
    label: typeof x.label === "string" ? x.label : "",
    startDate: typeof x.startDate === "string" && DAY.test(x.startDate) ? x.startDate : "1970-01-01",
    targetDate: typeof x.targetDate === "string" && DAY.test(x.targetDate) ? x.targetDate : null,
    dailyAyahTarget: target,
    startAbsoluteAyah: typeof x.startAbsoluteAyah === "number" && x.startAbsoluteAyah >= 0 ? x.startAbsoluteAyah : 0,
    preferredDays: days.length ? days : ALL_DAYS,
    status,
    createdAt: typeof x.createdAt === "number" ? x.createdAt : 0,
  };
}

/** Reads and repairs the stored record. A damaged value reads as no goals (and is not written over until something is changed). */
export function readGoals(): GoalsRecord {
  const raw = getJSON<unknown>(GOALS_KEY, null);
  if (!isObj(raw)) return emptyGoals();
  const { goals, activeGoalId, dailyLog, ...rest } = raw;
  const log: Record<string, string[]> = {};
  if (isObj(dailyLog)) for (const [k, v] of Object.entries(dailyLog)) if (Array.isArray(v)) log[k] = v.filter((e): e is string => typeof e === "string");
  return {
    goals: Array.isArray(goals) ? goals.flatMap((g) => goalFrom(g) ?? []) : [],
    activeGoalId: typeof activeGoalId === "string" ? activeGoalId : null,
    dailyLog: log,
    rest,
  };
}

export const writeGoals = (rec: GoalsRecord): boolean => setJSON(GOALS_KEY, { ...rec.rest, goals: rec.goals, activeGoalId: rec.activeGoalId, dailyLog: rec.dailyLog });

/** Reads the stored record fresh, applies `fn`, writes it back. Returns what `fn` returned, or null when it wrote nothing. */
export function mutate<T>(fn: (rec: GoalsRecord) => { rec: GoalsRecord; out: T } | null): T | null {
  const r = fn(readGoals());
  if (!r) return null;
  return writeGoals(r.rec) ? r.out : null;
}

// ---------------------------------------------------------------- reading the record

/** The main goal: the one `activeGoalId` names, if it is active. */
export const mainGoal = (rec: GoalsRecord): Goal | null => rec.goals.find((g) => g.id === rec.activeGoalId && g.status === "active") ?? null;
export const otherGoals = (rec: GoalsRecord): Goal[] => {
  const main = mainGoal(rec);
  return rec.goals.filter((g) => g !== main).sort((a, b) => b.createdAt - a.createdAt);
};

// ---------------------------------------------------------------- changes (pure)

const shortDay = (key: string): string => new Date(`${key}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export function defaultLabel(type: GoalType, amount: number, targetDate: string | null): string {
  switch (type) {
    case "finish-by-date":
      return targetDate ? `Finish by ${shortDay(targetDate)}` : "Finish the Quran";
    case "pages-per-day":
      return `${amount} pages/day`;
    case "juz-per-week":
      return `${amount} Juz/week`;
    case "ayahs-per-day":
      return `${amount} ayahs/day`;
    default:
      return "Custom goal";
  }
}

export interface NewGoal {
  type: GoalType;
  /** ayahs, pages or juz (not used by finish-by-date) */
  amount?: number;
  targetDate?: string | null;
  preferredDays?: number[];
  label?: string;
}
export interface Context {
  today: string;
  now: number;
  newId: () => string;
  /** where the reader is now (1 to 6,236), or null */
  position: number | null;
}

/** Why a new goal cannot be made, or null. */
export function problemWith(o: NewGoal, today: string): string | null {
  if (o.type === "finish-by-date") {
    if (!o.targetDate || !DAY.test(o.targetDate)) return "Choose the day to finish by.";
    if (daysBetweenKeys(today, o.targetDate) < 1) return "Choose a day after today.";
    return null;
  }
  if (!Number.isFinite(o.amount) || (o.amount ?? 0) < 1) return "Enter an amount of at least 1.";
  return null;
}

/** The ayahs a day a new goal would ask for (for the preview). null when the goal is not valid yet. */
export function previewDaily(o: NewGoal, ctx: Pick<Context, "today" | "position">): number | null {
  if (problemWith(o, ctx.today)) return null;
  const left = TOTAL_AYAHS - (ctx.position ?? 0);
  const days = o.type === "finish-by-date" ? daysBetweenKeys(ctx.today, o.targetDate!) : 0;
  return dailyAmount(o.type, o.amount ?? 1, left, days);
}

/** Makes a goal and puts it first. The goal that was the main one is paused (not deleted). */
export function createGoal(rec: GoalsRecord, o: NewGoal, ctx: Context): { rec: GoalsRecord; goal: Goal; pausedId: string | null } | null {
  if (problemWith(o, ctx.today)) return null;
  const start = ctx.position ?? 0;
  const amount = o.amount ?? 1;
  const goal: Goal = {
    id: ctx.newId(),
    type: o.type,
    label: o.label || defaultLabel(o.type, amount, o.targetDate ?? null),
    startDate: ctx.today,
    targetDate: o.type === "finish-by-date" ? (o.targetDate ?? null) : null,
    dailyAyahTarget: dailyAmount(o.type, amount, TOTAL_AYAHS - start, o.type === "finish-by-date" ? daysBetweenKeys(ctx.today, o.targetDate!) : 0),
    startAbsoluteAyah: start,
    preferredDays: o.preferredDays?.length ? [...o.preferredDays].sort() : [...ALL_DAYS],
    status: "active",
    createdAt: ctx.now,
  };
  const main = mainGoal(rec);
  const goals = rec.goals.map((g) => (main && g.id === main.id ? { ...g, status: "paused" as const } : g));
  return { rec: { ...rec, goals: [...goals, goal], activeGoalId: goal.id }, goal, pausedId: main?.id ?? null };
}

/** Takes a just-made goal back and makes the paused one the main goal again. */
export function undoCreate(rec: GoalsRecord, goalId: string, pausedId: string | null): GoalsRecord {
  const goals = rec.goals.filter((g) => g.id !== goalId).map((g) => (g.id === pausedId ? { ...g, status: "active" as const } : g));
  return { ...rec, goals, activeGoalId: pausedId && goals.some((g) => g.id === pausedId) ? pausedId : (goals.find((g) => g.status === "active")?.id ?? null) };
}

/** Pause (or stop, or complete) a goal. If it was the main goal, the next active goal takes over (the legacy rule). */
export function setStatus(rec: GoalsRecord, id: string, status: GoalStatus): GoalsRecord {
  const goals = rec.goals.map((g) => (g.id === id ? { ...g, status } : g));
  const activeGoalId = status !== "active" && rec.activeGoalId === id ? (goals.find((g) => g.status === "active")?.id ?? null) : rec.activeGoalId;
  return { ...rec, goals, activeGoalId };
}

/** Makes a goal the main one and active. The goal that was the main one is paused, as when a goal is made. */
export function makeMain(rec: GoalsRecord, id: string): { rec: GoalsRecord; pausedId: string | null } {
  const main = mainGoal(rec);
  const pausedId = main && main.id !== id ? main.id : null;
  const goals = rec.goals.map((g) => (g.id === id ? { ...g, status: "active" as const } : g.id === pausedId ? { ...g, status: "paused" as const } : g));
  return { rec: { ...rec, goals, activeGoalId: id }, pausedId };
}

/** Puts a goal back as it was before `makeMain`. */
export function undoMakeMain(rec: GoalsRecord, id: string, before: { status: GoalStatus; activeGoalId: string | null; pausedId: string | null }): GoalsRecord {
  const goals = rec.goals.map((g) => (g.id === id ? { ...g, status: before.status } : g.id === before.pausedId ? { ...g, status: "active" as const } : g));
  return { ...rec, goals, activeGoalId: before.activeGoalId };
}

/** Puts a goal's status and the main goal back as they were (Undo of a pause). */
export function restoreState(rec: GoalsRecord, id: string, before: { status: GoalStatus; activeGoalId: string | null }): GoalsRecord {
  return { ...rec, goals: rec.goals.map((g) => (g.id === id ? { ...g, status: before.status } : g)), activeGoalId: before.activeGoalId };
}

export interface Removed {
  goal: Goal;
  index: number;
  wasMain: boolean;
}
export function removeGoal(rec: GoalsRecord, id: string): { rec: GoalsRecord; removed: Removed } | null {
  const index = rec.goals.findIndex((g) => g.id === id);
  if (index < 0) return null;
  const goal = rec.goals[index]!;
  const wasMain = rec.activeGoalId === id;
  return { rec: { ...rec, goals: rec.goals.filter((g) => g.id !== id), activeGoalId: wasMain ? null : rec.activeGoalId }, removed: { goal, index, wasMain } };
}
export function restoreGoal(rec: GoalsRecord, r: Removed): GoalsRecord {
  if (rec.goals.some((g) => g.id === r.goal.id)) return rec;
  const goals = [...rec.goals];
  goals.splice(Math.min(r.index, goals.length), 0, r.goal);
  return { ...rec, goals, activeGoalId: r.wasMain && !rec.activeGoalId ? r.goal.id : rec.activeGoalId };
}

/** Ayahs read from a printed mushaf, added to today (the legacy `manual:<time>:<n>` entries). */
export function logManual(rec: GoalsRecord, count: number, today: string, now: number): { rec: GoalsRecord; keys: string[] } | null {
  const n = Math.floor(count);
  if (!Number.isFinite(n) || n < 1 || n > 6236) return null;
  const keys = Array.from({ length: n }, (_, i) => `manual:${now}:${i}`);
  return { rec: { ...rec, dailyLog: { ...rec.dailyLog, [today]: [...(rec.dailyLog[today] ?? []), ...keys] } }, keys };
}
export function unlogManual(rec: GoalsRecord, today: string, keys: string[]): GoalsRecord {
  const gone = new Set(keys);
  const left = (rec.dailyLog[today] ?? []).filter((k) => !gone.has(k));
  const dailyLog = Object.fromEntries(Object.entries(rec.dailyLog).filter(([day]) => day !== today));
  return { ...rec, dailyLog: left.length ? { ...dailyLog, [today]: left } : dailyLog };
}

/** Finish-by-date goals (a Ramadan Khatmah is one) are complete when the saved place is the last ayah. Returns the record and the ids that changed. */
export function completeFinished(rec: GoalsRecord, position: number | null): { rec: GoalsRecord; completed: string[] } {
  const done = rec.goals.filter((g) => isComplete(g, position)).map((g) => g.id);
  if (!done.length) return { rec, completed: [] };
  let next = rec;
  for (const id of done) next = setStatus(next, id, "completed");
  return { rec: next, completed: done };
}

