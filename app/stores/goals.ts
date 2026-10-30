// Reading goals (Phase 15): the stored record, where you stopped reading, and the changes the page makes. The rules are in `lib/goals/*` (pure, compared
// with the legacy composable in tests/goalsParity.test.ts). Every change reads the stored record fresh and writes it back with everything it does not know
// kept (the reader writes the same key), then reloads. Each change that removes or replaces something hands back an `undo`.
import { defineStore } from "pinia";
import { localDateKey } from "~/lib/dates";
import { countOn, juzLine, lastWeekAverage, nextUp, positionOf, progressOf, todayFor, weekBars } from "~/lib/goals/model";
import * as G from "~/lib/goals/store";
import { PROGRESS_KEY } from "~/lib/readingProgress";
import { getJSON } from "~/lib/storage";

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

export const useGoalsStore = defineStore("goals", () => {
  const rec = ref<G.GoalsRecord>(G.emptyGoals());
  const position = ref<number | null>(null);
  const today = ref(localDateKey(new Date()));
  const loaded = ref(false);

  const main = computed(() => G.mainGoal(rec.value));
  const others = computed(() => G.otherGoals(rec.value));
  const readToday = computed(() => countOn(rec.value.dailyLog, today.value));
  const ask = computed(() => (main.value ? todayFor(main.value, position.value, today.value) : null));
  const progress = computed(() => (main.value ? progressOf(main.value, position.value) : null));
  const juz = computed(() => juzLine(position.value));
  const week = computed(() => weekBars(rec.value.dailyLog, today.value, main.value?.preferredDays ?? []));
  const average = computed(() => (main.value ? lastWeekAverage(main.value, rec.value.dailyLog, today.value) : null));
  const next = computed(() => nextUp(position.value));

  /** Reads the record and the saved place; a finish-by-date goal whose place is the last ayah is marked complete. */
  function load() {
    today.value = localDateKey(new Date());
    position.value = positionOf(getJSON<unknown>(PROGRESS_KEY, null));
    G.mutate((r) => {
      const c = G.completeFinished(r, position.value);
      return c.completed.length ? { rec: c.rec, out: c.completed } : null;
    });
    rec.value = G.readGoals();
    loaded.value = true;
  }
  const refresh = () => {
    rec.value = G.readGoals();
  };
  const context = (): G.Context => {
    const t = localDateKey(new Date());
    today.value = t;
    return { today: t, now: Date.now(), newId, position: positionOf(getJSON<unknown>(PROGRESS_KEY, null)) };
  };
  const restore = (fn: (r: G.GoalsRecord) => G.GoalsRecord) => () => {
    G.mutate((r) => ({ rec: fn(r), out: true }));
    refresh();
  };

  /** Starts a goal; the main goal is paused. */
  function create(o: G.NewGoal): { goal: G.GoalsRecord["goals"][number]; paused: boolean; undo: () => void } | null {
    const made = G.mutate((r) => {
      const m = G.createGoal(r, o, context());
      return m ? { rec: m.rec, out: m } : null;
    });
    refresh();
    return made ? { goal: made.goal, paused: !!made.pausedId, undo: restore((r) => G.undoCreate(r, made.goal.id, made.pausedId)) } : null;
  }

  function pause(id: string): (() => void) | null {
    const before = { status: rec.value.goals.find((g) => g.id === id)?.status ?? ("active" as const), activeGoalId: rec.value.activeGoalId };
    const ok = G.mutate((r) => ({ rec: G.setStatus(r, id, "paused"), out: true }));
    refresh();
    return ok ? restore((r) => G.restoreState(r, id, before)) : null;
  }

  /** Resume a paused goal, or make a goal that is not the main one the main one. The goal that was the main one is paused. */
  function makeMain(id: string): (() => void) | null {
    const before = { status: rec.value.goals.find((g) => g.id === id)?.status ?? ("paused" as const), activeGoalId: rec.value.activeGoalId };
    const r = G.mutate((cur) => {
      const m = G.makeMain(cur, id);
      return { rec: m.rec, out: { pausedId: m.pausedId } };
    });
    refresh();
    return r === null ? null : restore((cur) => G.undoMakeMain(cur, id, { ...before, pausedId: r.pausedId }));
  }

  function remove(id: string): (() => void) | null {
    const gone = G.mutate((r) => {
      const x = G.removeGoal(r, id);
      return x ? { rec: x.rec, out: x.removed } : null;
    });
    refresh();
    return gone ? restore((r) => G.restoreGoal(r, gone)) : null;
  }

  /** Ayahs read from a printed mushaf, added to today. */
  function logManual(count: number): (() => void) | null {
    const t = context().today;
    const done = G.mutate((r) => {
      const l = G.logManual(r, count, t, Date.now());
      return l ? { rec: l.rec, out: l.keys } : null;
    });
    refresh();
    return done ? restore((r) => G.unlogManual(r, t, done)) : null;
  }

  return { rec, position, today, loaded, main, others, readToday, ask, progress, juz, week, average, next, load, refresh, create, pause, makeMain, remove, logManual };
});
