// Phase 15: reading goals and reminders against the LEGACY composables (vendored unmodified, run in memory by scripts/lib/legacy-goals.mjs). The goal
// arithmetic, the daily log, the status changes and the reminder lists must come out the same, on the same inputs, in the legacy storage shape. The
// one deliberate difference (a new goal pauses the main goal; the legacy left it active) is tested on its own at the end.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addDaysKey } from "../app/lib/dayKeys";
import { localDateKey } from "../app/lib/dates";
import { GOALS_KEY, recordAyahsRead } from "../app/lib/goalLog";
import * as G from "../app/lib/goals/store";
import { positionOf } from "../app/lib/goals/model";
import { absolute, AYAH_COUNTS } from "../app/lib/quranMeta";
import { addReminder, readReminders, REMINDERS_KEY, split } from "../app/lib/reminders";
import { setStorageBackend } from "../app/lib/storage";
import { loadLegacyGoals } from "../scripts/lib/legacy-goals.mjs";
import { memoryStore } from "./helpers";

const legacyStorage = (data: Map<string, string>) => ({
  get: (k: string, d: unknown) => (data.has(k) ? JSON.parse(data.get(k)!) : d),
  set: (k: string, v: unknown) => void data.set(k, JSON.stringify(v)),
});

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NOW = new Date(2026, 9, 15, 20, 30, 0).getTime(); // 8:30 pm local: the evening hours are where a UTC date goes wrong
let uuid = 0;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  uuid = 0;
  vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(() => `id-${++uuid}` as `${string}-${string}-${string}-${string}-${string}`);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  setStorageBackend(null);
});

const today = () => localDateKey(new Date());
const ctx = (position: number | null): G.Context => ({ today: today(), now: Date.now(), newId: () => `n-${++uuid}`, position });

async function both() {
  const data = new Map<string, string>();
  setStorageBackend(memoryStore());
  const legacy = await loadLegacyGoals(legacyStorage(data));
  return { data, goals: legacy.goals.useReadingGoals(), reminders: legacy.reminders.useReminders(), counts: legacy.counts };
}

describe("a new goal: the same ayahs a day, the same fields", () => {
  it("matches the legacy on random types, amounts, places and dates", async () => {
    const rand = rng(15);
    const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]!;
    for (let i = 0; i < 60; i++) {
      const { data, goals, counts } = await both();
      goals.load();
      const type = pick(["finish-by-date", "ayahs-per-day", "pages-per-day", "juz-per-week", "custom"] as const);
      const surah = rand() < 0.2 ? undefined : 1 + Math.floor(rand() * 114);
      const ayah = surah ? 1 + Math.floor(rand() * AYAH_COUNTS[surah - 1]!) : undefined;
      const amount = 1 + Math.floor(rand() * 30);
      const targetDate = addDaysKey(today(), 1 + Math.floor(rand() * 400));
      const days = rand() < 0.5 ? undefined : [0, 1, 2, 3, 4, 5, 6].filter(() => rand() < 0.6);
      const label = rand() < 0.3 ? "My goal" : undefined;

      await goals.createGoal({ type, dailyAmount: amount, targetDate: type === "finish-by-date" ? targetDate : null, preferredDays: days, label, currentSurahNo: surah, currentAyahNo: ayah });
      const theirs = JSON.parse(data.get(GOALS_KEY)!).goals.at(-1);

      const position = surah ? absolute(surah, ayah!) : null;
      const made = G.createGoal(G.emptyGoals(), { type, amount, targetDate: type === "finish-by-date" ? targetDate : null, preferredDays: days, label }, ctx(position))!;
      const mine = made.goal;

      expect(await counts.getAbsoluteAyahPosition(surah ?? 1, ayah ?? 0)).toBe(position ?? 0); // the legacy position is the revamp's
      for (const k of ["type", "dailyAyahTarget", "startAbsoluteAyah", "startDate", "targetDate", "preferredDays", "status"] as const) expect(mine[k], `${k} (${type}, ${surah}:${ayah}, amount ${amount})`).toEqual(theirs[k]);
      if (label) expect(mine.label).toBe(theirs.label);
    }
  });

  it("reads the place the way the legacy does (the saved place is the last ayah on screen)", () => {
    expect(positionOf({ surahNo: 2, ayahNo: 5 })).toBe(7 + 5);
    expect(positionOf({ surahNo: 114, ayahNo: 6 })).toBe(6236);
    expect(positionOf({ surahNo: 2, ayahNo: 287 })).toBeNull();
    expect(positionOf(null)).toBeNull();
  });
});

describe("the daily log and the status changes", () => {
  it("an ayah is counted once a day; a hand-logged count adds that many entries", async () => {
    const { data, goals } = await both();
    goals.load();
    goals.recordAyahRead(2, 255);
    goals.recordAyahRead(2, 255);
    goals.recordAyahRead(2, 256);
    goals.recordManualAyahs(3);
    const theirs = JSON.parse(data.get(GOALS_KEY)!).dailyLog[today()] as string[];

    expect(recordAyahsRead(["2:255", "2:255", "2:256"])).toBe(2);
    expect(recordAyahsRead(["2:255"])).toBe(0);
    const rec = G.readGoals();
    const logged = G.logManual(rec, 3, today(), Date.now())!;
    const mine = logged.rec.dailyLog[today()]!;
    expect(mine.slice(0, 2)).toEqual(theirs.slice(0, 2));
    expect(mine).toHaveLength(theirs.length);
    expect(mine.slice(2).every((k) => /^manual:\d+:\d$/.test(k))).toBe(true);
    // Undo takes exactly those back
    expect(G.unlogManual(logged.rec, today(), logged.keys).dailyLog[today()]).toEqual(["2:255", "2:256"]);
  });

  it("pause, resume and remove move the main goal the way the legacy does", async () => {
    const rand = rng(7);
    for (let round = 0; round < 25; round++) {
      const { data, goals } = await both();
      goals.load();
      let mine = G.emptyGoals();
      const theirIds: string[] = [];
      const myIds: string[] = [];
      const alive = new Set([0, 1, 2, 3]);
      for (let i = 0; i < 4; i++) {
        await goals.createGoal({ type: "ayahs-per-day", dailyAmount: 5 + i });
        theirIds.push(JSON.parse(data.get(GOALS_KEY)!).goals.at(-1).id);
        const made = G.createGoal(mine, { type: "ayahs-per-day", amount: 5 + i }, ctx(null))!;
        myIds.push(made.goal.id);
        // the legacy leaves the older goals active; to compare the status rules alone, mine does the same here
        mine = { ...made.rec, goals: made.rec.goals.map((g) => ({ ...g, status: "active" as const })) };
      }
      for (let step = 0; step < 6; step++) {
        const i = Math.floor(rand() * 4);
        if (!alive.has(i)) continue;
        const op = rand();
        if (op < 0.4) {
          goals.updateGoalStatus(theirIds[i], "paused");
          mine = G.setStatus(mine, myIds[i]!, "paused");
        } else if (op < 0.7) {
          goals.updateGoalStatus(theirIds[i], "active");
          goals.setActiveGoal(theirIds[i]);
          mine = { ...G.setStatus(mine, myIds[i]!, "active"), activeGoalId: myIds[i]! };
        } else if (alive.size > 1) {
          goals.deleteGoal(theirIds[i]);
          mine = G.removeGoal(mine, myIds[i]!)!.rec;
          alive.delete(i);
        }
      }
      const theirs = JSON.parse(data.get(GOALS_KEY)!);
      const idx = (ids: string[], id: string | null) => (id === null ? null : ids.indexOf(id));
      expect(mine.goals.map((g) => [myIds.indexOf(g.id), g.status])).toEqual(theirs.goals.map((g: { id: string; status: string }) => [theirIds.indexOf(g.id), g.status]));
      expect(idx(myIds, mine.activeGoalId)).toBe(idx(theirIds, theirs.activeGoalId));
    }
  });

  it("a record written here is read by the legacy composable as it is, and the reader's log is kept", async () => {
    const { data, goals } = await both();
    setStorageBackend(memoryStore());
    const made = G.createGoal(G.emptyGoals(), { type: "finish-by-date", targetDate: addDaysKey(today(), 100) }, ctx(absolute(2, 10)))!;
    const logged = G.logManual(made.rec, 4, today(), Date.now())!;
    data.set(GOALS_KEY, JSON.stringify({ ...logged.rec.rest, goals: logged.rec.goals, activeGoalId: logged.rec.activeGoalId, dailyLog: logged.rec.dailyLog }));
    goals.load();
    expect(goals.goals.value).toHaveLength(1);
    expect(goals.activeGoal.value?.id).toBe(made.goal.id);
    expect(goals.todayCount.value).toBe(4);
  });
});

describe("what changed on purpose", () => {
  it("a new goal pauses the main goal (the legacy left it active); Undo puts both back", () => {
    const first = G.createGoal(G.emptyGoals(), { type: "ayahs-per-day", amount: 10 }, ctx(null))!;
    const second = G.createGoal(first.rec, { type: "pages-per-day", amount: 2 }, ctx(null))!;
    expect(second.pausedId).toBe(first.goal.id);
    expect(second.rec.goals.find((g) => g.id === first.goal.id)!.status).toBe("paused");
    expect(second.rec.activeGoalId).toBe(second.goal.id);
    const undone = G.undoCreate(second.rec, second.goal.id, second.pausedId);
    expect(undone.goals).toEqual(first.rec.goals);
    expect(undone.activeGoalId).toBe(first.goal.id);
  });
});

describe("reminders", () => {
  it("a new reminder has the legacy fields; the upcoming and overdue lists come out the same; a field it does not know survives the legacy edits", async () => {
    const { data, reminders } = await both();
    setStorageBackend(memoryStore());
    reminders.load();
    const rand = rng(3);
    for (let i = 0; i < 12; i++) {
      const date = addDaysKey(today(), Math.floor(rand() * 40) - 15);
      reminders.createReminder({ title: ` Fast ${i} `, date, note: "n" });
      addReminder(`Fast ${i}`, date, Date.now(), i % 3 === 0 ? { by: "hijri", month: 9, day: 1 } : i % 3 === 1 ? { by: "gregorian" } : null);
    }
    const theirs = JSON.parse(data.get(REMINDERS_KEY)!) as Array<Record<string, unknown>>;
    const mine = readReminders();
    expect(mine.map((r) => [r.title, r.date, r.note === "" || r.note === "n", r.recurringYearly, r.done])).toEqual(theirs.map((r) => [r.title, r.date, true, r.recurringYearly, r.done]));
    expect(mine.every((r) => r.recurringYearly === false)).toBe(true); // the legacy field is left alone
    const lists = split(mine, today());
    expect(lists.upcoming.map((r) => r.date)).toEqual(reminders.upcoming.value.map((r: { date: string }) => r.date));
    expect(lists.overdue.map((r) => r.date)).toEqual(reminders.overdue.value.map((r: { date: string }) => r.date));
    // the legacy app edits our list (a rollback): the field it does not know is kept
    data.set(REMINDERS_KEY, JSON.stringify(mine));
    reminders.load();
    const withRepeat = mine.find((r) => r.repeat)!;
    reminders.toggleDone(withRepeat.id);
    const after = (JSON.parse(data.get(REMINDERS_KEY)!) as Array<{ id: string; repeat?: unknown; done: boolean }>).find((r) => r.id === withRepeat.id)!;
    expect(after.done).toBe(true);
    expect(after.repeat).toEqual(withRepeat.repeat);
  });
});
