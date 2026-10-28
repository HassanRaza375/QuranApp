// The Hifz engine (Phase 14): the LEGACY rules, ported as pure functions over one plain record. Every function takes the record and "today"
// and returns a new record; nothing here reads a clock or storage. tests/hifzParity.test.ts runs the legacy composable (useHifz.ts) and these
// functions on the same histories and compares the stored result, so the spacing, the strength rules, the new-ayah budget and the migration
// from the v1 plan model are the legacy's, not a lookalike.
//
// The record is `quran:hifz:v2` in the legacy shape. Dates are local-calendar-day strings ("YYYY-MM-DD").
import { localDateKey } from "../dates";

export type Strength = "not-started" | "learning" | "memorized" | "strong" | "weak";
export type Grade = "again" | "good" | "easy";

export interface HifzTarget {
  id: string;
  surahNo: number;
  surahName: string;
  startAyah: number;
  endAyah: number;
  dailyNewTarget: number;
  dailyTimeGoalMinutes: number;
  status: "active" | "paused" | "completed";
  /** Highest ayah number introduced so far. `startAyah - 1` means nothing introduced yet. */
  lastPosition: number;
  lastAssessmentAt: string | null;
  createdAt: number;
}

export interface HifzAyahState {
  key: string; // `${targetId}:${ayahNo}`
  targetId: string;
  ayahNo: number;
  strength: Strength;
  interval: number;
  ease: number;
  nextReviewAt: string;
  reviewCount: number;
  historicalMistakes: number;
  recentResults: Grade[];
  hintsUsed: number;
  lastHintLevel: number;
  lastReviewedAt: string | null;
}

export interface HifzTransitionState {
  key: string; // `${targetId}:${fromAyah}`
  targetId: string;
  fromAyah: number;
  toAyah: number;
  strength: Strength;
  mistakes: number;
  recentResults: Grade[];
  lastReviewedAt: string | null;
}

export interface HifzActivityDay {
  date: string;
  newAyahs: number;
  revisions: number;
  recoveredAyahs: number;
  recoveredTransitions: number;
  assessments: number;
}

export interface HifzData {
  targets: HifzTarget[];
  ayahStates: HifzAyahState[];
  transitionStates: HifzTransitionState[];
  activity: HifzActivityDay[];
}

export const RECENT_WINDOW = 5;
export const MAX_INTERVAL_DAYS = 180;

export const emptyData = (): HifzData => ({ targets: [], ayahStates: [], transitionStates: [], activity: [] });

/* ---------------- Dates (local calendar days) ---------------- */

export const todayKey = (): string => localDateKey(new Date());
const parseDateKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
};
export const addDays = (key: string, days: number): string => {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return localDateKey(d);
};
export const daysBetween = (fromKey: string, toKey: string): number => Math.round((parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime()) / 86400000);

/* ---------------- Strength ---------------- */

export const recentAgainCount = (results: Grade[]): number => results.slice(-RECENT_WINDOW).filter((r) => r === "again").length;

export const ayahStrength = (s: Pick<HifzAyahState, "reviewCount" | "interval" | "recentResults">): Strength => {
  if (s.reviewCount === 0) return "learning";
  if (recentAgainCount(s.recentResults) >= 2) return "weak";
  if (s.interval >= 21) return "strong";
  if (s.interval >= 3) return "memorized";
  return "learning";
};

export const transitionStrength = (t: Pick<HifzTransitionState, "recentResults">): Strength => {
  if (t.recentResults.length === 0) return "not-started";
  if (recentAgainCount(t.recentResults) >= 1) return "weak";
  if (t.recentResults.length >= 3) return "strong";
  return "memorized";
};

/** The new-ayah budget backs off when a target already has weak material (retention over accumulation). */
export const effectiveNewAyahBudget = (dailyNewTarget: number, weakCount: number): number => {
  if (weakCount >= 3) return 0;
  if (weakCount >= 1) return Math.max(1, Math.floor(dailyNewTarget / 2));
  return dailyNewTarget;
};

/* ---------------- Reading the record ---------------- */

export const activeTargets = (d: HifzData): HifzTarget[] => d.targets.filter((t) => t.status === "active");
export const ayahStatesFor = (d: HifzData, targetId: string): HifzAyahState[] => d.ayahStates.filter((a) => a.targetId === targetId);
export const transitionStatesFor = (d: HifzData, targetId: string): HifzTransitionState[] => d.transitionStates.filter((t) => t.targetId === targetId);
export const getAyahState = (d: HifzData, targetId: string, ayahNo: number): HifzAyahState | null => d.ayahStates.find((a) => a.targetId === targetId && a.ayahNo === ayahNo) ?? null;
export const getTransitionState = (d: HifzData, targetId: string, fromAyah: number): HifzTransitionState | null => d.transitionStates.find((t) => t.targetId === targetId && t.fromAyah === fromAyah) ?? null;
export const weakAyahsFor = (d: HifzData, targetId: string): HifzAyahState[] => ayahStatesFor(d, targetId).filter((a) => a.strength === "weak");
export const weakTransitionsFor = (d: HifzData, targetId: string): HifzTransitionState[] => transitionStatesFor(d, targetId).filter((t) => t.strength === "weak");

/** Not weak, due today or overdue, oldest first (all targets; callers filter to the targets they want). */
export const dueOrOverdue = (d: HifzData, today: string): HifzAyahState[] =>
  d.ayahStates.filter((a) => a.strength !== "weak" && a.nextReviewAt <= today).sort((a, b) => a.nextReviewAt.localeCompare(b.nextReviewAt));

export const newAyahBudgetToday = (d: HifzData, target: HifzTarget): number => {
  const weakCount = weakAyahsFor(d, target.id).length + weakTransitionsFor(d, target.id).length;
  const budget = effectiveNewAyahBudget(target.dailyNewTarget, weakCount);
  const remaining = target.endAyah - target.lastPosition;
  return Math.max(0, Math.min(budget, remaining));
};

/* ---------------- Targets ---------------- */

export interface NewTarget {
  surahNo: number;
  surahName: string;
  startAyah: number;
  endAyah: number;
  dailyNewTarget: number;
  dailyTimeGoalMinutes: number;
}

export function createTarget(d: HifzData, opts: NewTarget, id: string, now: number): { data: HifzData; target: HifzTarget } {
  const target: HifzTarget = {
    id,
    surahNo: opts.surahNo,
    surahName: opts.surahName,
    startAyah: opts.startAyah,
    endAyah: opts.endAyah,
    dailyNewTarget: opts.dailyNewTarget,
    dailyTimeGoalMinutes: opts.dailyTimeGoalMinutes,
    status: "active",
    lastPosition: opts.startAyah - 1,
    lastAssessmentAt: null,
    createdAt: now,
  };
  return { data: { ...d, targets: [...d.targets, target] }, target };
}

export const updateTarget = (d: HifzData, id: string, patch: Partial<HifzTarget>): HifzData => ({ ...d, targets: d.targets.map((t) => (t.id === id ? { ...t, ...patch } : t)) });

/** Removes the target and its ayah and join states. (The activity days stay: they are counts per day, not per target.) */
export const deleteTarget = (d: HifzData, id: string): HifzData => ({
  ...d,
  targets: d.targets.filter((t) => t.id !== id),
  ayahStates: d.ayahStates.filter((a) => a.targetId !== id),
  transitionStates: d.transitionStates.filter((t) => t.targetId !== id),
});

/* ---------------- Ayah and join states ---------------- */

const freshAyah = (targetId: string, ayahNo: number, today: string): HifzAyahState => ({
  key: `${targetId}:${ayahNo}`,
  targetId,
  ayahNo,
  strength: "learning",
  interval: 1,
  ease: 2.0,
  nextReviewAt: today,
  reviewCount: 0,
  historicalMistakes: 0,
  recentResults: [],
  hintsUsed: 0,
  lastHintLevel: 0,
  lastReviewedAt: null,
});

const freshTransition = (targetId: string, fromAyah: number, toAyah: number): HifzTransitionState => ({
  key: `${targetId}:${fromAyah}`,
  targetId,
  fromAyah,
  toAyah,
  strength: "not-started",
  mistakes: 0,
  recentResults: [],
  lastReviewedAt: null,
});

export function ensureAyahState(d: HifzData, targetId: string, ayahNo: number, today: string): HifzData {
  if (getAyahState(d, targetId, ayahNo)) return d;
  return { ...d, ayahStates: [...d.ayahStates, freshAyah(targetId, ayahNo, today)] };
}

export function ensureTransitionState(d: HifzData, targetId: string, fromAyah: number, toAyah: number): HifzData {
  if (getTransitionState(d, targetId, fromAyah)) return d;
  return { ...d, transitionStates: [...d.transitionStates, freshTransition(targetId, fromAyah, toAyah)] };
}

/**
 * Introduces up to `count` new ayahs into learning, moving `lastPosition` on and creating the join to the ayah before each one.
 * Returns the new record and the ayah numbers introduced.
 */
export function introduceAyahs(d: HifzData, targetId: string, count: number, today: string): { data: HifzData; introduced: number[] } {
  const target = d.targets.find((t) => t.id === targetId);
  if (!target || count <= 0) return { data: d, introduced: [] };
  const start = target.lastPosition + 1;
  const end = Math.min(target.endAyah, target.lastPosition + count);
  const introduced: number[] = [];
  let next = d;
  for (let ayahNo = start; ayahNo <= end; ayahNo++) {
    next = ensureAyahState(next, targetId, ayahNo, today);
    introduced.push(ayahNo);
    if (ayahNo > target.startAyah) next = ensureTransitionState(next, targetId, ayahNo - 1, ayahNo);
  }
  if (introduced.length) next = updateTarget(next, targetId, { lastPosition: end });
  return { data: next, introduced };
}

/* ---------------- Activity (counted in the legacy shape so a rollback sees it; the revamp does not show it) ---------------- */

export function recordActivity(d: HifzData, patch: Partial<Omit<HifzActivityDay, "date">>, today: string): HifzData {
  const exists = d.activity.some((a) => a.date === today);
  if (exists) {
    return {
      ...d,
      activity: d.activity.map((a) =>
        a.date === today
          ? {
              ...a,
              newAyahs: a.newAyahs + (patch.newAyahs ?? 0),
              revisions: a.revisions + (patch.revisions ?? 0),
              recoveredAyahs: a.recoveredAyahs + (patch.recoveredAyahs ?? 0),
              recoveredTransitions: a.recoveredTransitions + (patch.recoveredTransitions ?? 0),
              assessments: a.assessments + (patch.assessments ?? 0),
            }
          : a,
      ),
    };
  }
  return {
    ...d,
    activity: [
      ...d.activity,
      {
        date: today,
        newAyahs: patch.newAyahs ?? 0,
        revisions: patch.revisions ?? 0,
        recoveredAyahs: patch.recoveredAyahs ?? 0,
        recoveredTransitions: patch.recoveredTransitions ?? 0,
        assessments: patch.assessments ?? 0,
      },
    ],
  };
}

/* ---------------- Grading (SM-2-lite, per ayah and per join) ---------------- */

export function gradeAyah(d: HifzData, targetId: string, ayahNo: number, grade: Grade, hintLevel: number, today: string): HifzData {
  const withState = ensureAyahState(d, targetId, ayahNo, today);
  const state = getAyahState(withState, targetId, ayahNo)!;
  const wasWeak = state.strength === "weak";
  const wasFirstReview = state.reviewCount === 0;

  let interval = state.interval;
  let ease = state.ease;
  let historicalMistakes = state.historicalMistakes;
  if (grade === "again") {
    interval = 1;
    ease = Math.max(1.3, ease - 0.2);
    historicalMistakes += 1;
  } else if (grade === "good") {
    interval = Math.max(1, Math.round(interval * ease));
  } else {
    interval = Math.max(1, Math.round(interval * ease * 1.3));
    ease = Math.min(2.8, ease + 0.1);
  }
  interval = Math.min(interval, MAX_INTERVAL_DAYS);

  const updated: HifzAyahState = {
    ...state,
    interval,
    ease,
    historicalMistakes,
    recentResults: [...state.recentResults, grade].slice(-RECENT_WINDOW),
    nextReviewAt: addDays(today, interval),
    lastReviewedAt: today,
    reviewCount: state.reviewCount + 1,
    hintsUsed: state.hintsUsed + (hintLevel > 0 ? 1 : 0),
    lastHintLevel: hintLevel,
  };
  updated.strength = ayahStrength(updated);

  const next: HifzData = { ...withState, ayahStates: withState.ayahStates.map((a) => (a.key === updated.key ? updated : a)) };
  return recordActivity(
    next,
    { newAyahs: wasFirstReview ? 1 : 0, revisions: wasFirstReview ? 0 : 1, recoveredAyahs: wasWeak && updated.strength !== "weak" ? 1 : 0 },
    today,
  );
}

export function gradeTransition(d: HifzData, targetId: string, fromAyah: number, grade: Grade, today: string): HifzData {
  const withState = ensureTransitionState(d, targetId, fromAyah, fromAyah + 1);
  const state = getTransitionState(withState, targetId, fromAyah)!;
  const wasWeak = state.strength === "weak";
  const updated: HifzTransitionState = {
    ...state,
    recentResults: [...state.recentResults, grade].slice(-RECENT_WINDOW),
    mistakes: state.mistakes + (grade === "again" ? 1 : 0),
    lastReviewedAt: today,
  };
  updated.strength = transitionStrength(updated);
  const next: HifzData = { ...withState, transitionStates: withState.transitionStates.map((t) => (t.key === updated.key ? updated : t)) };
  return recordActivity(next, { recoveredTransitions: wasWeak && updated.strength !== "weak" ? 1 : 0 }, today);
}

/* ---------------- Migration from the older plan-only model (`quran:hifz:v1`) ---------------- */

/** One plan of the older `quran:hifz:v1` store (only the fields the migration reads). */
interface V1Plan {
  id: string;
  surahNo: number;
  startAyah: number;
  endAyah: number;
  status?: string;
  planStatus?: string;
  interval?: number;
  ease?: number;
  nextReviewAt?: string;
  reviewCount?: number;
  lastReviewedAt?: string;
  createdAt?: number;
}

/** Expands each v1 plan into a target plus ayah and join states across its whole range, as the legacy does. Null when there is nothing to migrate. */
export function migrateFromV1(legacy: unknown, o: { today: string; now: number; surahName: (surahNo: number) => string }): HifzData | null {
  if (!Array.isArray(legacy) || !legacy.length) return null;
  const targets: HifzTarget[] = [];
  const ayahStates: HifzAyahState[] = [];
  const transitionStates: HifzTransitionState[] = [];
  for (const plan of legacy as V1Plan[]) {
    const introducedTo = plan.status === "memorized" ? plan.endAyah : plan.startAyah;
    const target: HifzTarget = {
      id: plan.id,
      surahNo: plan.surahNo,
      surahName: o.surahName(plan.surahNo),
      startAyah: plan.startAyah,
      endAyah: plan.endAyah,
      dailyNewTarget: 3,
      dailyTimeGoalMinutes: 15,
      status: plan.planStatus === "paused" ? "paused" : "active",
      lastPosition: introducedTo,
      lastAssessmentAt: null,
      createdAt: plan.createdAt ?? o.now,
    };
    targets.push(target);
    for (let ayahNo = plan.startAyah; ayahNo <= introducedTo; ayahNo++) {
      ayahStates.push({
        key: `${target.id}:${ayahNo}`,
        targetId: target.id,
        ayahNo,
        strength: plan.status === "memorized" ? "memorized" : "learning",
        interval: plan.interval ?? 1,
        ease: plan.ease ?? 2.0,
        nextReviewAt: plan.nextReviewAt ?? o.today,
        reviewCount: plan.reviewCount ?? 0,
        historicalMistakes: 0,
        recentResults: (plan.reviewCount ?? 0) > 0 ? ["good"] : [],
        hintsUsed: 0,
        lastHintLevel: 0,
        lastReviewedAt: plan.lastReviewedAt ?? null,
      });
      if (ayahNo > plan.startAyah) transitionStates.push(freshTransition(target.id, ayahNo - 1, ayahNo));
    }
  }
  return { targets, ayahStates, transitionStates, activity: [] };
}
