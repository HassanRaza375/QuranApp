// Hifz Mode — local-first adaptive memorization engine. Tracks state at the
// individual ayah AND ayah-to-ayah transition level (not just per-plan), so
// weakness/recovery/scheduling can be genuinely granular — see
// Hifz_Module_Specification.md for the full product spec this implements.
import surahList from "~/assets/data/surah.json";

const surahNameFor = (surahNo: number) =>
  surahList.find((s: any) => s.surahNo === surahNo)?.surahNameTranslation ?? `Surah ${surahNo}`;

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
  recentResults: Grade[]; // rolling window, capped at 5 — "current" weakness, never rewrites history
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

interface HifzStoreV2 {
  targets: HifzTarget[];
  ayahStates: HifzAyahState[];
  transitionStates: HifzTransitionState[];
  activity: HifzActivityDay[];
}

const STORAGE_KEY = "quran:hifz:v2";
const LEGACY_STORAGE_KEY = "quran:hifz:v1";
const RECENT_WINDOW = 5;

// Local-calendar-day keys — same convention as every other module
// (useReadingGoals/useRamadan/useReminders), avoiding the UTC-shift bug
// fixed in Pass 6/12.
const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const hifzTodayKey = () => toDateKey(new Date());
const parseDateKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const hifzAddDays = (key: string, days: number) => {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
};
export const hifzDaysBetween = (fromKey: string, toKey: string) =>
  Math.round((parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime()) / 86400000);

const recentAgainCount = (results: Grade[]) =>
  results.slice(-RECENT_WINDOW).filter((r) => r === "again").length;

const computeAyahStrength = (s: Pick<HifzAyahState, "reviewCount" | "interval" | "recentResults">): Strength => {
  if (s.reviewCount === 0) return "learning";
  if (recentAgainCount(s.recentResults) >= 2) return "weak";
  if (s.interval >= 21) return "strong";
  if (s.interval >= 3) return "memorized";
  return "learning";
};

const computeTransitionStrength = (t: Pick<HifzTransitionState, "recentResults">): Strength => {
  if (t.recentResults.length === 0) return "not-started";
  if (recentAgainCount(t.recentResults) >= 1) return "weak";
  if (t.recentResults.length >= 3) return "strong";
  return "memorized";
};

/** New-ayah introduction pressure backs off when a target already has weak
 * material — retention over accumulation, per the spec's "Revision First". */
const effectiveNewAyahBudget = (dailyNewTarget: number, weakCount: number) => {
  if (weakCount >= 3) return 0;
  if (weakCount >= 1) return Math.max(1, Math.floor(dailyNewTarget / 2));
  return dailyNewTarget;
};

export const useHifz = () => {
  const targets = useState<HifzTarget[]>("hifz-targets", () => []);
  const ayahStates = useState<HifzAyahState[]>("hifz-ayah-states", () => []);
  const transitionStates = useState<HifzTransitionState[]>("hifz-transition-states", () => []);
  const activity = useState<HifzActivityDay[]>("hifz-activity", () => []);

  const getStorage = () => useNuxtApp().$storage;

  /** Best-effort migration from the shipped v1 plan-only model — expands
   * each plan into a target plus per-ayah/transition state across its whole
   * range, seeded from the plan's own SRS fields since v1 tracked at plan
   * granularity. Runs once; v2 storage is authoritative after that. */
  const migrateFromV1 = ($storage: any) => {
    const legacy = $storage.get(LEGACY_STORAGE_KEY, null);
    if (!Array.isArray(legacy) || !legacy.length) return null;

    const migratedTargets: HifzTarget[] = [];
    const migratedAyahs: HifzAyahState[] = [];
    const migratedTransitions: HifzTransitionState[] = [];

    for (const plan of legacy) {
      const introducedTo = plan.status === "memorized" ? plan.endAyah : plan.startAyah;
      const target: HifzTarget = {
        id: plan.id,
        surahNo: plan.surahNo,
        surahName: surahNameFor(plan.surahNo),
        startAyah: plan.startAyah,
        endAyah: plan.endAyah,
        dailyNewTarget: 3,
        dailyTimeGoalMinutes: 15,
        status: plan.planStatus === "paused" ? "paused" : "active",
        lastPosition: introducedTo,
        lastAssessmentAt: null,
        createdAt: plan.createdAt ?? Date.now(),
      };
      migratedTargets.push(target);

      for (let ayahNo = plan.startAyah; ayahNo <= introducedTo; ayahNo++) {
        const recentResults: Grade[] = plan.reviewCount > 0 ? ["good"] : [];
        migratedAyahs.push({
          key: `${target.id}:${ayahNo}`,
          targetId: target.id,
          ayahNo,
          strength: plan.status === "memorized" ? "memorized" : "learning",
          interval: plan.interval ?? 1,
          ease: plan.ease ?? 2.0,
          nextReviewAt: plan.nextReviewAt ?? hifzTodayKey(),
          reviewCount: plan.reviewCount ?? 0,
          historicalMistakes: 0,
          recentResults,
          hintsUsed: 0,
          lastHintLevel: 0,
          lastReviewedAt: plan.lastReviewedAt ?? null,
        });
        if (ayahNo > plan.startAyah) {
          migratedTransitions.push({
            key: `${target.id}:${ayahNo - 1}`,
            targetId: target.id,
            fromAyah: ayahNo - 1,
            toAyah: ayahNo,
            strength: "not-started",
            mistakes: 0,
            recentResults: [],
            lastReviewedAt: null,
          });
        }
      }
    }

    return {
      targets: migratedTargets,
      ayahStates: migratedAyahs,
      transitionStates: migratedTransitions,
      activity: [],
    } satisfies HifzStoreV2;
  };

  const load = () => {
    if (!import.meta.client) return;
    const $storage = getStorage();
    if (!$storage) return;

    let store: HifzStoreV2 | null = $storage.get(STORAGE_KEY, null);
    if (!store) {
      store = migrateFromV1($storage);
      if (store) $storage.set(STORAGE_KEY, store);
    }

    targets.value = store?.targets ?? [];
    ayahStates.value = store?.ayahStates ?? [];
    transitionStates.value = store?.transitionStates ?? [];
    activity.value = store?.activity ?? [];
  };

  const persist = () => {
    if (!import.meta.client) return;
    getStorage()?.set(STORAGE_KEY, {
      targets: targets.value,
      ayahStates: ayahStates.value,
      transitionStates: transitionStates.value,
      activity: activity.value,
    } satisfies HifzStoreV2);
  };

  /* ---------------- Targets ---------------- */

  const createTarget = (opts: {
    surahNo: number;
    surahName: string;
    startAyah: number;
    endAyah: number;
    dailyNewTarget: number;
    dailyTimeGoalMinutes: number;
  }) => {
    const target: HifzTarget = {
      id: crypto.randomUUID(),
      surahNo: opts.surahNo,
      surahName: opts.surahName,
      startAyah: opts.startAyah,
      endAyah: opts.endAyah,
      dailyNewTarget: opts.dailyNewTarget,
      dailyTimeGoalMinutes: opts.dailyTimeGoalMinutes,
      status: "active",
      lastPosition: opts.startAyah - 1,
      lastAssessmentAt: null,
      createdAt: Date.now(),
    };
    targets.value = [...targets.value, target];
    persist();
    return target;
  };

  const updateTarget = (id: string, patch: Partial<HifzTarget>) => {
    targets.value = targets.value.map((t) => (t.id === id ? { ...t, ...patch } : t));
    persist();
  };

  const deleteTarget = (id: string) => {
    targets.value = targets.value.filter((t) => t.id !== id);
    ayahStates.value = ayahStates.value.filter((a) => a.targetId !== id);
    transitionStates.value = transitionStates.value.filter((t) => t.targetId !== id);
    persist();
  };

  const activeTargets = computed(() => targets.value.filter((t) => t.status === "active"));

  /* ---------------- Ayah / transition state access ---------------- */

  const getAyahState = (targetId: string, ayahNo: number) =>
    ayahStates.value.find((a) => a.targetId === targetId && a.ayahNo === ayahNo) ?? null;

  const getTransitionState = (targetId: string, fromAyah: number) =>
    transitionStates.value.find((t) => t.targetId === targetId && t.fromAyah === fromAyah) ?? null;

  const ensureAyahState = (targetId: string, ayahNo: number): HifzAyahState => {
    const existing = getAyahState(targetId, ayahNo);
    if (existing) return existing;
    const fresh: HifzAyahState = {
      key: `${targetId}:${ayahNo}`,
      targetId,
      ayahNo,
      strength: "learning",
      interval: 1,
      ease: 2.0,
      nextReviewAt: hifzTodayKey(),
      reviewCount: 0,
      historicalMistakes: 0,
      recentResults: [],
      hintsUsed: 0,
      lastHintLevel: 0,
      lastReviewedAt: null,
    };
    ayahStates.value = [...ayahStates.value, fresh];
    return fresh;
  };

  const ensureTransitionState = (targetId: string, fromAyah: number, toAyah: number): HifzTransitionState => {
    const existing = getTransitionState(targetId, fromAyah);
    if (existing) return existing;
    const fresh: HifzTransitionState = {
      key: `${targetId}:${fromAyah}`,
      targetId,
      fromAyah,
      toAyah,
      strength: "not-started",
      mistakes: 0,
      recentResults: [],
      lastReviewedAt: null,
    };
    transitionStates.value = [...transitionStates.value, fresh];
    return fresh;
  };

  /* ---------------- Progression (new-ayah introduction) ---------------- */

  const ayahStatesForTarget = (targetId: string) => ayahStates.value.filter((a) => a.targetId === targetId);
  const transitionStatesForTarget = (targetId: string) =>
    transitionStates.value.filter((t) => t.targetId === targetId);

  const weakAyahsForTarget = (targetId: string) =>
    ayahStatesForTarget(targetId).filter((a) => a.strength === "weak");
  const weakTransitionsForTarget = (targetId: string) =>
    transitionStatesForTarget(targetId).filter((t) => t.strength === "weak");

  const newAyahBudgetToday = (target: HifzTarget) => {
    const weakCount = weakAyahsForTarget(target.id).length + weakTransitionsForTarget(target.id).length;
    const budget = effectiveNewAyahBudget(target.dailyNewTarget, weakCount);
    const remaining = target.endAyah - target.lastPosition;
    return Math.max(0, Math.min(budget, remaining));
  };

  /** Introduces up to `count` new ayahs into learning, extending
   * `lastPosition` and creating the transition linking each newly-introduced
   * ayah back to the one before it. Returns the ayah numbers introduced. */
  const introduceAyahs = (targetId: string, count: number) => {
    const target = targets.value.find((t) => t.id === targetId);
    if (!target || count <= 0) return [];

    const start = target.lastPosition + 1;
    const end = Math.min(target.endAyah, target.lastPosition + count);
    const introduced: number[] = [];

    for (let ayahNo = start; ayahNo <= end; ayahNo++) {
      ensureAyahState(targetId, ayahNo);
      introduced.push(ayahNo);
      if (ayahNo > target.startAyah) ensureTransitionState(targetId, ayahNo - 1, ayahNo);
    }

    if (introduced.length) {
      updateTarget(targetId, { lastPosition: end });
    }
    return introduced;
  };

  /* ---------------- Activity ---------------- */

  const recordActivity = (patch: Partial<Omit<HifzActivityDay, "date">>) => {
    const date = hifzTodayKey();
    const existing = activity.value.find((a) => a.date === date);
    if (existing) {
      activity.value = activity.value.map((a) =>
        a.date === date
          ? {
              ...a,
              newAyahs: a.newAyahs + (patch.newAyahs ?? 0),
              revisions: a.revisions + (patch.revisions ?? 0),
              recoveredAyahs: a.recoveredAyahs + (patch.recoveredAyahs ?? 0),
              recoveredTransitions: a.recoveredTransitions + (patch.recoveredTransitions ?? 0),
              assessments: a.assessments + (patch.assessments ?? 0),
            }
          : a
      );
    } else {
      activity.value = [
        ...activity.value,
        {
          date,
          newAyahs: patch.newAyahs ?? 0,
          revisions: patch.revisions ?? 0,
          recoveredAyahs: patch.recoveredAyahs ?? 0,
          recoveredTransitions: patch.recoveredTransitions ?? 0,
          assessments: patch.assessments ?? 0,
        },
      ];
    }
  };

  /* ---------------- Grading (SM-2-lite, per ayah / per transition) ---------------- */

  const gradeAyah = (targetId: string, ayahNo: number, grade: Grade, hintLevel = 0) => {
    const state = ensureAyahState(targetId, ayahNo);
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
    interval = Math.min(interval, 180);

    const recentResults = [...state.recentResults, grade].slice(-RECENT_WINDOW);
    const updated: HifzAyahState = {
      ...state,
      interval,
      ease,
      historicalMistakes,
      recentResults,
      nextReviewAt: hifzAddDays(hifzTodayKey(), interval),
      lastReviewedAt: hifzTodayKey(),
      reviewCount: state.reviewCount + 1,
      hintsUsed: state.hintsUsed + (hintLevel > 0 ? 1 : 0),
      lastHintLevel: hintLevel,
    };
    updated.strength = computeAyahStrength(updated);

    ayahStates.value = ayahStates.value.map((a) => (a.key === updated.key ? updated : a));

    recordActivity({
      newAyahs: wasFirstReview ? 1 : 0,
      revisions: wasFirstReview ? 0 : 1,
      recoveredAyahs: wasWeak && updated.strength !== "weak" ? 1 : 0,
    });
    persist();
    return updated;
  };

  const gradeTransition = (targetId: string, fromAyah: number, grade: Grade) => {
    const toAyah = fromAyah + 1;
    const state = ensureTransitionState(targetId, fromAyah, toAyah);
    const wasWeak = state.strength === "weak";

    const recentResults = [...state.recentResults, grade].slice(-RECENT_WINDOW);
    const updated: HifzTransitionState = {
      ...state,
      recentResults,
      mistakes: state.mistakes + (grade === "again" ? 1 : 0),
      lastReviewedAt: hifzTodayKey(),
    };
    updated.strength = computeTransitionStrength(updated);

    transitionStates.value = transitionStates.value.map((t) => (t.key === updated.key ? updated : t));

    recordActivity({ recoveredTransitions: wasWeak && updated.strength !== "weak" ? 1 : 0 });
    persist();
    return updated;
  };

  /* ---------------- Derived queues ---------------- */

  const weakAyahs = computed(() => ayahStates.value.filter((a) => a.strength === "weak"));
  const weakTransitions = computed(() => transitionStates.value.filter((t) => t.strength === "weak"));

  const dueOrOverdueAyahs = computed(() =>
    ayahStates.value
      .filter((a) => a.strength !== "weak" && a.nextReviewAt <= hifzTodayKey())
      .sort((a, b) => a.nextReviewAt.localeCompare(b.nextReviewAt))
  );

  /* ---------------- Coverage / health (for Mastery view) ---------------- */

  const targetCoverage = (targetId: string) => {
    const states = ayahStatesForTarget(targetId);
    const target = targets.value.find((t) => t.id === targetId);
    const total = target ? target.endAyah - target.startAyah + 1 : 0;
    return {
      total,
      introduced: states.length,
      strong: states.filter((s) => s.strength === "strong").length,
      memorized: states.filter((s) => s.strength === "memorized").length,
      learning: states.filter((s) => s.strength === "learning").length,
      weak: states.filter((s) => s.strength === "weak").length,
    };
  };

  const weakestAyah = (targetId: string) => {
    const weak = weakAyahsForTarget(targetId);
    if (!weak.length) return null;
    return [...weak].sort((a, b) => b.historicalMistakes - a.historicalMistakes)[0];
  };

  /** A transparent, explainable 0-100 score — never presented as a bare
   * number without the signals behind it, per the spec's "Why Is This Weak"
   * and "Hifz Health" sections. */
  const targetHealth = (targetId: string) => {
    const states = ayahStatesForTarget(targetId);
    const coverage = targetCoverage(targetId);
    if (!states.length) return { score: 0, signals: { coverage: 0, recall: 0, consistency: 0 } };

    const coveragePct = coverage.total ? Math.round((coverage.introduced / coverage.total) * 100) : 0;
    const strongOrMemorized = states.filter((s) => s.strength === "strong" || s.strength === "memorized").length;
    const recallPct = Math.round((strongOrMemorized / states.length) * 100);
    const totalRecent = states.flatMap((s) => s.recentResults.slice(-RECENT_WINDOW));
    const consistencyPct = totalRecent.length
      ? Math.round((totalRecent.filter((r) => r !== "again").length / totalRecent.length) * 100)
      : 100;

    const score = Math.round(coveragePct * 0.2 + recallPct * 0.5 + consistencyPct * 0.3);
    return { score, signals: { coverage: coveragePct, recall: recallPct, consistency: consistencyPct } };
  };

  /** Explains *why* a specific ayah is currently weak — the signals behind
   * the state, not just the label. */
  const whyWeak = (targetId: string, ayahNo: number) => {
    const s = getAyahState(targetId, ayahNo);
    if (!s) return null;
    const recentMistakes = recentAgainCount(s.recentResults);
    const daysSinceReview = s.lastReviewedAt ? hifzDaysBetween(s.lastReviewedAt, hifzTodayKey()) : null;
    let reason = "Recent recall difficulty";
    if (s.hintsUsed > 0 && s.lastHintLevel >= 3) reason = "Needed a strong hint on the last attempt";
    else if (daysSinceReview !== null && daysSinceReview > s.interval + 3) reason = "Overdue for review";
    return {
      historicalMistakes: s.historicalMistakes,
      recentMistakes,
      recentHints: s.hintsUsed,
      lastReviewedDaysAgo: daysSinceReview,
      reason,
    };
  };

  return {
    // state
    targets,
    activeTargets,
    ayahStates,
    transitionStates,
    activity,
    // persistence
    load,
    persist,
    // targets
    createTarget,
    updateTarget,
    deleteTarget,
    // ayah/transition access
    getAyahState,
    getTransitionState,
    ensureAyahState,
    ensureTransitionState,
    ayahStatesForTarget,
    transitionStatesForTarget,
    // progression
    newAyahBudgetToday,
    introduceAyahs,
    // grading
    gradeAyah,
    gradeTransition,
    // derived
    weakAyahs,
    weakTransitions,
    weakAyahsForTarget,
    weakTransitionsForTarget,
    dueOrOverdueAyahs,
    // reporting
    targetCoverage,
    weakestAyah,
    targetHealth,
    whyWeak,
    recordActivity,
    // date helpers (re-exported so consumers don't duplicate them)
    todayKey: hifzTodayKey,
    addDays: hifzAddDays,
    daysBetween: hifzDaysBetween,
  };
};
