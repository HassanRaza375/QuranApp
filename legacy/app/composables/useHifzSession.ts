// Builds and runs a Hifz practice/test session — the "Today's Hifz" /
// "Weak Ayahs" / "Quick Test" / "Free Practice" / "Full-range Assessment"
// entry points all just construct a different item queue and hand it to the
// same runner, per Hifz_Module_Specification.md §18/§21/§23/§26/§33/§34.
import type { Grade } from "./useHifz";

export type SessionItemType =
  | "warmup"
  | "weak-ayah"
  | "weak-transition"
  | "revision"
  | "new"
  | "final-mixed"
  | "assessment";

export type TestMode = "full" | "continue" | "previous" | "next" | "random" | "transition";

export interface SessionItem {
  id: string;
  type: SessionItemType;
  targetId: string;
  ayahNo?: number;
  fromAyah?: number;
  toAyah?: number;
  isNew?: boolean; // progressive practice happens before the test
  gradedTest: boolean; // false for free-practice items — SRS untouched
  testMode: TestMode;
  result: Grade | "skipped" | null;
  hintLevel: number;
}

export type SessionKind = "daily" | "weak" | "quick-test" | "free-practice" | "assessment";

export interface HifzSessionState {
  id: string;
  kind: SessionKind;
  targetIds: string[];
  items: SessionItem[];
  currentIndex: number;
  status: "in-progress" | "completed" | "abandoned";
  startedAt: number;
  completedAt: number | null;
  stats: { mistakes: number; hints: number };
}

const SESSION_STORAGE_KEY = "quran:hifz-session:v1";
const AVG_SECONDS_PER_ITEM = 45;

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const makeItem = (partial: Omit<SessionItem, "id" | "result" | "hintLevel" | "gradedTest"> & { gradedTest?: boolean }): SessionItem => ({
  id: crypto.randomUUID(),
  result: null,
  hintLevel: 0,
  gradedTest: partial.gradedTest ?? true,
  ...partial,
});

export const estimateSessionMinutes = (itemCount: number) => Math.max(1, Math.round((itemCount * AVG_SECONDS_PER_ITEM) / 60));

export const useHifzSession = () => {
  const hifz = useHifz();
  const session = useState<HifzSessionState | null>("hifz-active-session", () => null);

  const getStorage = () => useNuxtApp().$storage;

  const loadSession = () => {
    if (!import.meta.client) return;
    session.value = getStorage()?.get(SESSION_STORAGE_KEY, null) ?? null;
  };

  const persistSession = () => {
    if (!import.meta.client) return;
    getStorage()?.set(SESSION_STORAGE_KEY, session.value);
  };

  const resumeAvailable = computed(() => session.value?.status === "in-progress");

  const currentItem = computed(() => {
    if (!session.value || session.value.status !== "in-progress") return null;
    return session.value.items[session.value.currentIndex] ?? null;
  });

  const progress = computed(() => {
    if (!session.value) return { done: 0, total: 0 };
    return { done: session.value.currentIndex, total: session.value.items.length };
  });

  /* ---------------- Queue builders ---------------- */

  const pickRevisionTestMode = (targetId: string, ayahNo: number): TestMode => {
    const options: TestMode[] = ["full", "continue"];
    if (hifz.getAyahState(targetId, ayahNo - 1)) options.push("previous");
    if (hifz.getAyahState(targetId, ayahNo + 1)) options.push("next");
    return pick(options);
  };

  const buildDailyItems = (targetIds?: string[]): SessionItem[] => {
    const targets = hifz.activeTargets.value.filter((t) => !targetIds || targetIds.includes(t.id));
    const items: SessionItem[] = [];

    // 1. Warm-up — one strong, already-confident ayah per target.
    for (const t of targets) {
      const strong = hifz.ayahStatesForTarget(t.id).find((a) => a.strength === "strong");
      if (strong) {
        items.push(makeItem({ type: "warmup", targetId: t.id, ayahNo: strong.ayahNo, testMode: "full" }));
      }
    }

    // 2. Weak ayahs + weak transitions (retention over accumulation).
    for (const t of targets) {
      for (const a of hifz.weakAyahsForTarget(t.id)) {
        items.push(makeItem({ type: "weak-ayah", targetId: t.id, ayahNo: a.ayahNo, testMode: "full" }));
      }
      for (const tr of hifz.weakTransitionsForTarget(t.id)) {
        items.push(
          makeItem({ type: "weak-transition", targetId: t.id, fromAyah: tr.fromAyah, toAyah: tr.toAyah, testMode: "transition" })
        );
      }
    }

    // 3. Due / overdue revision, round-robin across targets.
    const dueByTarget = targets.map((t) =>
      hifz.dueOrOverdueAyahs.value.filter((a) => a.targetId === t.id)
    );
    let more = true;
    while (more) {
      more = false;
      for (const bucket of dueByTarget) {
        const next = bucket.shift();
        if (next) {
          more = true;
          items.push(
            makeItem({
              type: "revision",
              targetId: next.targetId,
              ayahNo: next.ayahNo,
              testMode: pickRevisionTestMode(next.targetId, next.ayahNo),
            })
          );
        }
      }
    }

    // 4. New memorization — respects the Revision-First backoff in useHifz.
    for (const t of targets) {
      const budget = hifz.newAyahBudgetToday(t);
      if (budget > 0) {
        const start = t.lastPosition + 1;
        for (let ayahNo = start; ayahNo < start + budget && ayahNo <= t.endAyah; ayahNo++) {
          items.push(makeItem({ type: "new", targetId: t.id, ayahNo, isNew: true, testMode: "full" }));
        }
      }
    }

    // 5. Mixed final test — re-test a random sample of what's already covered today, in a random mode.
    const alreadyCovered = items.filter((i) => i.ayahNo != null);
    const sample = shuffle(alreadyCovered).slice(0, Math.min(4, alreadyCovered.length));
    for (const s of sample) {
      const modes: TestMode[] = ["full", "continue", "random"];
      items.push(
        makeItem({ type: "final-mixed", targetId: s.targetId, ayahNo: s.ayahNo, testMode: pick(modes) })
      );
    }

    return items;
  };

  const buildWeakItems = (targetIds?: string[]): SessionItem[] => {
    const targets = hifz.activeTargets.value.filter((t) => !targetIds || targetIds.includes(t.id));
    const items: SessionItem[] = [];
    for (const t of targets) {
      for (const a of hifz.weakAyahsForTarget(t.id)) {
        items.push(makeItem({ type: "weak-ayah", targetId: t.id, ayahNo: a.ayahNo, testMode: "full" }));
      }
      for (const tr of hifz.weakTransitionsForTarget(t.id)) {
        items.push(
          makeItem({ type: "weak-transition", targetId: t.id, fromAyah: tr.fromAyah, toAyah: tr.toAyah, testMode: "transition" })
        );
      }
    }
    return items;
  };

  const buildQuickTestItems = (minutes: number, targetIds?: string[]): SessionItem[] => {
    const budget = Math.max(2, Math.round((minutes * 60) / AVG_SECONDS_PER_ITEM));
    const targets = hifz.activeTargets.value.filter((t) => !targetIds || targetIds.includes(t.id));

    const pool: SessionItem[] = [];
    for (const t of targets) {
      for (const a of hifz.weakAyahsForTarget(t.id)) {
        pool.push(makeItem({ type: "weak-ayah", targetId: t.id, ayahNo: a.ayahNo, testMode: "full" }));
      }
    }
    for (const t of targets) {
      for (const a of hifz.dueOrOverdueAyahs.value.filter((s) => s.targetId === t.id)) {
        pool.push(makeItem({ type: "revision", targetId: t.id, ayahNo: a.ayahNo, testMode: pickRevisionTestMode(t.id, a.ayahNo) }));
      }
    }
    // Fill remaining budget with random already-introduced ayahs for useful variety.
    for (const t of targets) {
      const introduced = hifz.ayahStatesForTarget(t.id);
      for (const a of shuffle(introduced)) {
        pool.push(makeItem({ type: "revision", targetId: t.id, ayahNo: a.ayahNo, testMode: "random" }));
      }
    }

    return shuffle(pool).slice(0, budget);
  };

  const buildFreePracticeItems = (targetId: string, startAyah: number, endAyah: number): SessionItem[] => {
    const items: SessionItem[] = [];
    for (let ayahNo = startAyah; ayahNo <= endAyah; ayahNo++) {
      items.push(makeItem({ type: "revision", targetId, ayahNo, testMode: "full", gradedTest: false }));
    }
    return items;
  };

  const buildAssessmentItems = (targetId: string): SessionItem[] => {
    const target = hifz.targets.value.find((t) => t.id === targetId);
    if (!target) return [];
    const items: SessionItem[] = [];
    const modes: TestMode[] = ["full", "continue", "previous", "next", "random"];
    for (let ayahNo = target.startAyah; ayahNo <= target.lastPosition; ayahNo++) {
      items.push(makeItem({ type: "assessment", targetId, ayahNo, testMode: pick(modes) }));
      if (ayahNo > target.startAyah) {
        items.push(makeItem({ type: "assessment", targetId, fromAyah: ayahNo - 1, toAyah: ayahNo, testMode: "transition" }));
      }
    }
    return items;
  };

  /* ---------------- Lifecycle ---------------- */

  const startSession = (kind: SessionKind, items: SessionItem[], targetIds: string[]) => {
    session.value = {
      id: crypto.randomUUID(),
      kind,
      targetIds,
      items,
      currentIndex: 0,
      status: "in-progress",
      startedAt: Date.now(),
      completedAt: null,
      stats: { mistakes: 0, hints: 0 },
    };
    persistSession();
    return session.value;
  };

  const startDailySession = () => startSession("daily", buildDailyItems(), hifz.activeTargets.value.map((t) => t.id));
  const startWeakSession = (targetIds?: string[]) =>
    startSession("weak", buildWeakItems(targetIds), targetIds ?? hifz.activeTargets.value.map((t) => t.id));
  const startQuickTest = (minutes: number, targetIds?: string[]) =>
    startSession(
      "quick-test",
      buildQuickTestItems(minutes, targetIds),
      targetIds ?? hifz.activeTargets.value.map((t) => t.id)
    );
  const startFreePractice = (targetId: string, startAyah: number, endAyah: number) =>
    startSession("free-practice", buildFreePracticeItems(targetId, startAyah, endAyah), [targetId]);
  const startAssessment = (targetId: string) => startSession("assessment", buildAssessmentItems(targetId), [targetId]);

  const finishSession = () => {
    if (!session.value) return;
    session.value = { ...session.value, status: "completed", completedAt: Date.now() };
    if (session.value.kind === "assessment") {
      hifz.recordActivity({ assessments: 1 });
      hifz.updateTarget(session.value.targetIds[0], { lastAssessmentAt: hifz.todayKey() });
    }
    persistSession();
  };

  const advance = () => {
    if (!session.value) return;
    const nextIndex = session.value.currentIndex + 1;
    if (nextIndex >= session.value.items.length) {
      finishSession();
      return;
    }
    session.value = { ...session.value, currentIndex: nextIndex };
    persistSession();
  };

  const skipCurrent = () => {
    if (!session.value || !currentItem.value) return;
    const item = currentItem.value;
    session.value = {
      ...session.value,
      items: session.value.items.map((i) => (i.id === item.id ? { ...i, result: "skipped" } : i)),
    };
    persistSession();
    advance();
  };

  /** Grades the current item (ayah or transition), updates SRS via useHifz
   * unless it's an ungraded free-practice item, then moves to the next item. */
  const gradeCurrent = (grade: Grade, hintLevel = 0) => {
    if (!session.value || !currentItem.value) return;
    const item = currentItem.value;

    if (item.gradedTest) {
      if (item.type === "weak-transition" && item.fromAyah != null) {
        hifz.gradeTransition(item.targetId, item.fromAyah, grade);
      } else if (item.ayahNo != null) {
        hifz.gradeAyah(item.targetId, item.ayahNo, grade, hintLevel);
      }
      // A "new" item is the target's next not-yet-introduced ayah (built
      // from `target.lastPosition + 1` in buildDailyItems). Advancing
      // lastPosition here — once the ayah has actually been graded, not
      // merely queued — is what lets the next session offer the ayah
      // after it instead of re-offering this same one forever. Also
      // creates the ayah-to-ayah transition state so it can be tracked
      // for weakness like every other transition.
      if (item.type === "new" && item.ayahNo != null) {
        hifz.introduceAyahs(item.targetId, 1);
      }
    }

    session.value = {
      ...session.value,
      items: session.value.items.map((i) => (i.id === item.id ? { ...i, result: grade, hintLevel } : i)),
      stats: {
        mistakes: session.value.stats.mistakes + (grade === "again" ? 1 : 0),
        hints: session.value.stats.hints + (hintLevel > 0 ? 1 : 0),
      },
    };
    persistSession();
    advance();
  };

  /** Advances past an ungraded (free-practice) item — no SRS change, not
   * recorded as a skip since the user did complete it. */
  const completeUngraded = () => advance();

  const abandonSession = () => {
    if (!session.value) return;
    session.value = null;
    persistSession();
  };

  const sessionSummary = computed(() => {
    if (!session.value) return null;
    const items = session.value.items;
    const newCount = items.filter((i) => i.isNew).length;
    const revisionCount = items.filter((i) => !i.isNew && i.result && i.result !== "skipped").length;
    const needsAttention = items.filter((i) => i.result === "again");
    return {
      total: items.length,
      newCount,
      revisionCount,
      mistakes: session.value.stats.mistakes,
      hints: session.value.stats.hints,
      needsAttention,
    };
  });

  return {
    session,
    loadSession,
    resumeAvailable,
    currentItem,
    progress,
    sessionSummary,
    startDailySession,
    startWeakSession,
    startQuickTest,
    startFreePractice,
    startAssessment,
    gradeCurrent,
    skipCurrent,
    completeUngraded,
    abandonSession,
    buildDailyItems,
  };
};
