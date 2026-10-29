export type GoalType =
  | "finish-by-date"
  | "ayahs-per-day"
  | "pages-per-day"
  | "juz-per-week"
  | "custom";

export type GoalStatus = "active" | "paused" | "completed" | "abandoned";

export interface ReadingGoal {
  id: string;
  type: GoalType;
  label: string;
  startDate: string; // ISO yyyy-mm-dd
  targetDate: string | null; // only meaningful for "finish-by-date"
  dailyAyahTarget: number; // everything normalized to ayahs/day internally
  startAbsoluteAyah: number; // absolute position in the Quran when created
  preferredDays: number[]; // 0=Sun..6=Sat, days the user intends to read
  status: GoalStatus;
  createdAt: number;
}

const STORAGE_KEY = "quran:reading-goals:v1";

interface GoalsState {
  goals: ReadingGoal[];
  activeGoalId: string | null;
  dailyLog: Record<string, string[]>; // date -> unique "surah:ayah" (or "manual:n") keys
}

// Local-calendar-day keys, not UTC (`toISOString().slice(0,10)` shifts the
// date for any timezone ahead of UTC — local midnight in Pakistan (UTC+5),
// this app's evident audience, would resolve to the *previous* day's UTC
// date, silently breaking "today" for effectively every real user).
const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const todayKey = () => toDateKey(new Date());

// "YYYY-MM-DD" -> local Date at midnight. Deliberately not `new
// Date(dateString)`: that parses bare date strings as UTC midnight, which
// re-introduces the same cross-timezone skew `toDateKey` exists to avoid.
const parseDateKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const formatDateKey = (key: string) =>
  parseDateKey(key).toLocaleDateString(undefined, { month: "short", day: "numeric" });

const daysBetween = (fromKey: string, toKey: string) => {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
};

// Counts only the goal's preferred days of week between two dates (inclusive
// of `fromKey`, exclusive of `toKey`) — so catch-up targets don't punish
// someone for not reading on a day they never intended to. Deliberately NOT
// floored to a minimum of 1: this feeds "expected progress by now" in
// adjustedDailyTarget, and a goal created *today* has had zero elapsed
// days to fall behind on — flooring to 1 was making every brand-new goal
// show a "behind pace, catching up" state before the user had read a
// single ayah.
const countPreferredDays = (fromKey: string, toKey: string, preferredDays: number[]) => {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  const set = new Set(preferredDays.length ? preferredDays : [0, 1, 2, 3, 4, 5, 6]);
  let count = 0;
  for (let d = new Date(from); d < to; d.setDate(d.getDate() + 1)) {
    if (set.has(d.getDay())) count++;
  }
  return count;
};

export const useReadingGoals = () => {
  const goals = useState<ReadingGoal[]>("reading-goals", () => []);
  const activeGoalId = useState<string | null>("reading-goals-active-id", () => null);
  const dailyLog = useState<Record<string, string[]>>("reading-goals-daily-log", () => ({}));

  const getStorage = () => useNuxtApp().$storage;

  const load = () => {
    if (!import.meta.client) return;
    const $storage = getStorage();
    if (!$storage) return;
    const saved: GoalsState | null = $storage.get(STORAGE_KEY, null);
    goals.value = saved?.goals ?? [];
    activeGoalId.value = saved?.activeGoalId ?? null;
    dailyLog.value = saved?.dailyLog ?? {};
  };

  const persist = () => {
    if (!import.meta.client) return;
    const $storage = getStorage();
    if (!$storage) return;
    $storage.set(STORAGE_KEY, {
      goals: goals.value,
      activeGoalId: activeGoalId.value,
      dailyLog: dailyLog.value,
    });
  };

  const activeGoal = computed(
    () => goals.value.find((g) => g.id === activeGoalId.value && g.status === "active") ?? null
  );

  const todayCount = computed(() => dailyLog.value[todayKey()]?.length ?? 0);

  const streak = computed(() => {
    let count = 0;
    const cursor = new Date();
    // Today doesn't have to be logged yet for the streak to still be "alive".
    if (!(dailyLog.value[toDateKey(cursor)]?.length > 0)) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (dailyLog.value[toDateKey(cursor)]?.length > 0) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  });

  /** Called from the surah reader as the user actually scrolls through ayahs. */
  const recordAyahRead = (surahNo: number, ayahNo: number) => {
    const key = `${surahNo}:${ayahNo}`;
    const day = todayKey();
    const list = dailyLog.value[day] ?? [];
    if (list.includes(key)) return;
    dailyLog.value = { ...dailyLog.value, [day]: [...list, key] };
    persist();
  };

  /** Manual fallback (e.g. reading offline from a physical mushaf) — a
   * supplement to real tracking, not the primary mechanism. */
  const recordManualAyahs = (count: number) => {
    if (count <= 0) return;
    const day = todayKey();
    const list = dailyLog.value[day] ?? [];
    const stamped = Array.from({ length: count }, (_, i) => `manual:${Date.now()}:${i}`);
    dailyLog.value = { ...dailyLog.value, [day]: [...list, ...stamped] };
    persist();
  };

  const computeDailyAyahTarget = (
    type: GoalType,
    dailyAmount: number,
    remainingAyahsFromStart: number,
    daysUntilTarget: number
  ) => {
    switch (type) {
      case "finish-by-date":
        return Math.ceil(remainingAyahsFromStart / Math.max(1, daysUntilTarget));
      case "pages-per-day":
        return Math.ceil(dailyAmount * AYAHS_PER_PAGE);
      case "juz-per-week":
        return Math.ceil((dailyAmount * AYAHS_PER_JUZ) / 7);
      case "ayahs-per-day":
      case "custom":
      default:
        return Math.max(1, Math.round(dailyAmount));
    }
  };

  const createGoal = async (opts: {
    type: GoalType;
    dailyAmount?: number;
    targetDate?: string | null;
    preferredDays?: number[];
    label?: string;
    currentSurahNo?: number;
    currentAyahNo?: number;
  }) => {
    const startAbsoluteAyah = opts.currentSurahNo
      ? await getAbsoluteAyahPosition(opts.currentSurahNo, opts.currentAyahNo ?? 1)
      : 0;

    const remainingAyahs = TOTAL_QURAN_AYAHS - startAbsoluteAyah;
    const daysUntilTarget = opts.targetDate ? Math.max(1, daysBetween(todayKey(), opts.targetDate)) : 0;

    const dailyAyahTarget = computeDailyAyahTarget(
      opts.type,
      opts.dailyAmount ?? 1,
      remainingAyahs,
      daysUntilTarget
    );

    const goal: ReadingGoal = {
      id: crypto.randomUUID(),
      type: opts.type,
      label: opts.label || defaultLabel(opts.type, opts.dailyAmount, opts.targetDate),
      startDate: todayKey(),
      targetDate: opts.type === "finish-by-date" ? opts.targetDate ?? null : null,
      dailyAyahTarget,
      startAbsoluteAyah,
      preferredDays: opts.preferredDays?.length ? opts.preferredDays : [0, 1, 2, 3, 4, 5, 6],
      status: "active",
      createdAt: Date.now(),
    };

    goals.value = [...goals.value, goal];
    activeGoalId.value = goal.id; // newly created goal becomes primary
    persist();
    return goal;
  };

  const setActiveGoal = (id: string) => {
    activeGoalId.value = id;
    persist();
  };

  const updateGoalStatus = (id: string, status: GoalStatus) => {
    goals.value = goals.value.map((g) => (g.id === id ? { ...g, status } : g));
    if (status !== "active" && activeGoalId.value === id) {
      activeGoalId.value = goals.value.find((g) => g.status === "active")?.id ?? null;
    }
    persist();
  };

  const deleteGoal = (id: string) => {
    goals.value = goals.value.filter((g) => g.id !== id);
    if (activeGoalId.value === id) activeGoalId.value = null;
    persist();
  };

  /**
   * Progress + pacing for the active goal, computed against the reader's
   * real current position (`useReadingProgress`) rather than the daily log
   * alone, so it stays accurate even across days the log wasn't checked.
   */
  const useGoalStats = (goal: Ref<ReadingGoal | null>) => {
    const { progress } = useReadingProgress();
    const currentAbsoluteAyah = ref(0);

    watch(
      [goal, progress],
      async () => {
        if (!goal.value) {
          currentAbsoluteAyah.value = 0;
          return;
        }
        if (!progress.value) {
          currentAbsoluteAyah.value = goal.value.startAbsoluteAyah;
          return;
        }
        currentAbsoluteAyah.value = await getAbsoluteAyahPosition(
          progress.value.surahNo,
          progress.value.ayahNo
        );
      },
      { immediate: true }
    );

    const readSinceStart = computed(() =>
      goal.value ? Math.max(0, currentAbsoluteAyah.value - goal.value.startAbsoluteAyah) : 0
    );

    const totalGoalAmount = computed(() =>
      goal.value ? TOTAL_QURAN_AYAHS - goal.value.startAbsoluteAyah : 0
    );

    const progressPercent = computed(() => {
      if (!goal.value || totalGoalAmount.value <= 0) return 0;
      return Math.min(100, Math.round((readSinceStart.value / totalGoalAmount.value) * 100));
    });

    const adjustedDailyTarget = computed(() => {
      if (!goal.value) return 0;
      const daysSinceStart = countPreferredDays(goal.value.startDate, todayKey(), goal.value.preferredDays);
      const expectedByNow = goal.value.dailyAyahTarget * daysSinceStart;
      const deficit = Math.max(0, expectedByNow - readSinceStart.value);
      if (deficit <= 0) return goal.value.dailyAyahTarget;

      const remainingDays = goal.value.targetDate
        ? Math.max(1, daysBetween(todayKey(), goal.value.targetDate))
        : 7; // open-ended pace goals: spread catch-up over the coming week
      return goal.value.dailyAyahTarget + Math.ceil(deficit / remainingDays);
    });

    const isBehindPace = computed(() => adjustedDailyTarget.value > (goal.value?.dailyAyahTarget ?? 0));

    const projectedFinishDate = computed(() => {
      if (!goal.value) return null;
      const daysSinceStart = Math.max(1, daysBetween(goal.value.startDate, todayKey()));
      const pace = readSinceStart.value / daysSinceStart;
      if (pace <= 0) return null;
      const remaining = totalGoalAmount.value - readSinceStart.value;
      if (remaining <= 0) return "today";
      const daysToGo = Math.ceil(remaining / pace);
      const d = new Date();
      d.setDate(d.getDate() + daysToGo);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    });

    return {
      currentAbsoluteAyah,
      readSinceStart,
      totalGoalAmount,
      progressPercent,
      adjustedDailyTarget,
      isBehindPace,
      projectedFinishDate,
    };
  };

  return {
    goals,
    activeGoal,
    todayCount,
    streak,
    load,
    createGoal,
    setActiveGoal,
    updateGoalStatus,
    deleteGoal,
    recordAyahRead,
    recordManualAyahs,
    useGoalStats,
  };
};

function defaultLabel(type: GoalType, dailyAmount?: number, targetDate?: string | null) {
  switch (type) {
    case "finish-by-date":
      return targetDate ? `Finish by ${formatDateKey(targetDate)}` : "Finish the Quran";
    case "pages-per-day":
      return `${dailyAmount ?? 1} pages/day`;
    case "juz-per-week":
      return `${dailyAmount ?? 1} Juz/week`;
    case "ayahs-per-day":
      return `${dailyAmount ?? 1} ayahs/day`;
    default:
      return "Custom goal";
  }
}
