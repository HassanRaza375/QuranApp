// Phase 15: the reading-goals rules and the stored record (the legacy comparison is in tests/goalsParity.test.ts).
import { afterEach, describe, expect, it } from "vitest";
import { GOALS_KEY } from "../app/lib/goalLog";
import * as M from "../app/lib/goals/model";
import * as G from "../app/lib/goals/store";
import { absolute } from "../app/lib/quranMeta";
import { getJSON, setStorageBackend } from "../app/lib/storage";
import { memoryStore } from "./helpers";

afterEach(() => setStorageBackend(null));

const TODAY = "2026-10-15";
let n = 0;
const ctx = (position: number | null = null, today = TODAY): G.Context => ({ today, now: 1000 + ++n, newId: () => `g${++n}`, position });
const goal = (over: Partial<M.Goal> = {}): M.Goal => ({ id: "g", type: "ayahs-per-day", label: "x", startDate: TODAY, targetDate: null, dailyAyahTarget: 10, startAbsoluteAyah: 0, preferredDays: M.ALL_DAYS, status: "active", createdAt: 1, ...over });

describe("the amount for today", () => {
  it("a finish-by-date goal is worked out from the ayahs left and the days left", () => {
    const g = goal({ type: "finish-by-date", targetDate: "2027-02-07" }); // 115 days
    expect(M.todayFor(g, 812, TODAY)).toEqual({ kind: "amount", ayahs: Math.ceil((6236 - 812) / 115) });
    expect(M.todayFor(g, null, TODAY)).toEqual({ kind: "amount", ayahs: Math.ceil(6236 / 115) });
  });
  it("large amounts near the end are shown plainly, not softened", () => {
    const g = goal({ type: "finish-by-date", targetDate: "2026-10-17" });
    expect(M.todayFor(g, 3236, TODAY)).toEqual({ kind: "amount", ayahs: 1500 }); // 3,000 ayahs in 2 days
    expect(M.todayFor(g, 3236, "2026-10-16")).toEqual({ kind: "amount", ayahs: 3000 });
  });
  it("on the date, or after it, there is no amount: the date has passed", () => {
    const g = goal({ type: "finish-by-date", targetDate: TODAY });
    expect(M.todayFor(g, 812, TODAY)).toEqual({ kind: "passed" });
    expect(M.todayFor(g, 812, "2026-10-20")).toEqual({ kind: "passed" });
    expect(M.PASSED_LINE).toBe("Your date has passed. Choose a new date or keep reading.");
    expect(M.PASSED_LINE).not.toMatch(/behind|catch/i);
  });
  it("a finished Qur'an has nothing left to ask", () => {
    expect(M.todayFor(goal({ type: "finish-by-date", targetDate: "2027-01-01" }), 6236, TODAY)).toEqual({ kind: "done" });
  });
  it("other goals keep the amount they were made with, however far behind", () => {
    const g = goal({ dailyAyahTarget: 22 });
    expect(M.todayFor(g, 5, TODAY)).toEqual({ kind: "amount", ayahs: 22 });
    expect(M.todayFor(g, 5, "2027-03-01")).toEqual({ kind: "amount", ayahs: 22 });
  });
});

describe("progress, completion, the place", () => {
  it("progress is the saved place minus where the goal began (the legacy meaning)", () => {
    const g = goal({ startAbsoluteAyah: 1000 });
    expect(M.progressOf(g, 1100)).toEqual({ readSince: 100, total: 5236, percent: 2 });
    expect(M.progressOf(g, null)).toMatchObject({ readSince: 0 });
    expect(M.progressOf(g, 900).readSince).toBe(0); // going back never goes below zero
    expect(M.progressOf(g, 6236).percent).toBe(100);
  });
  it("only a finish-by-date goal can be complete, and only at the last ayah", () => {
    expect(M.isComplete(goal({ type: "finish-by-date", targetDate: "2027-01-01" }), 6236)).toBe(true);
    expect(M.isComplete(goal({ type: "finish-by-date", targetDate: "2027-01-01" }), 6235)).toBe(false);
    for (const type of ["ayahs-per-day", "pages-per-day", "juz-per-week", "custom"] as const) expect(M.isComplete(goal({ type }), 6236)).toBe(false);
    expect(M.isComplete(goal({ type: "finish-by-date", status: "paused" }), 6236)).toBe(false);
  });
  it("a saved place becomes a position, and back", () => {
    expect(M.positionOf({ surahNo: 1, ayahNo: 1 })).toBe(1);
    expect(M.positionOf({ surahNo: 2, ayahNo: 286 })).toBe(7 + 286);
    expect(M.positionOf({ surahNo: 0, ayahNo: 1 })).toBeNull();
    expect(M.ayahAt(1)).toEqual({ surah: 1, ayah: 1 });
    expect(M.ayahAt(8)).toEqual({ surah: 2, ayah: 1 });
    expect(M.ayahAt(6236)).toEqual({ surah: 114, ayah: 6 });
    expect(M.ayahAt(0)).toBeNull();
    expect(M.nextUp(null)).toEqual({ surah: 1, ayah: 1 });
    expect(M.nextUp(absolute(2, 5))).toEqual({ surah: 2, ayah: 6 });
    expect(M.nextUp(6236)).toBeNull();
  });
});

describe("the 30 juz as one line", () => {
  it("nothing read, all read, and part-way", () => {
    expect(M.juzLine(null).done).toBe(0);
    expect(M.juzLine(null).cells.every((c) => c.state === "ahead")).toBe(true);
    expect(M.juzLine(6236).done).toBe(30);
    const mid = M.juzLine(812);
    expect(mid.cells).toHaveLength(30);
    expect(mid.cells.filter((c) => c.state === "current")).toHaveLength(1);
    const cur = mid.cells.find((c) => c.state === "current")!;
    expect(cur.part).toBeGreaterThan(0);
    expect(cur.part).toBeLessThan(100);
    expect(mid.cells.slice(0, cur.n - 1).every((c) => c.state === "done")).toBe(true);
    expect(mid.done).toBe(cur.n - 1);
  });
});

describe("the log", () => {
  const log = { "2026-10-15": ["2:1", "2:2"], "2026-10-14": ["manual:1:0"], "2026-10-09": ["1:1"] };
  it("seven bars ending today; days off the preferred days are marked", () => {
    const bars = M.weekBars(log, TODAY, [1, 2, 3, 4, 5]); // 15 Oct 2026 is a Thursday
    expect(bars.map((b) => b.date)).toEqual(["2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15"]);
    expect(bars.map((b) => b.count)).toEqual([1, 0, 0, 0, 0, 1, 2]);
    expect(bars.find((b) => b.date === "2026-10-10")!.off).toBe(true); // Saturday
    expect(bars.find((b) => b.date === "2026-10-12")!.off).toBe(false); // Monday
    expect(bars.at(-1)!.today).toBe(true);
  });
  it("the last-7-days average needs a goal a week old and something read", () => {
    expect(M.lastWeekAverage(goal({ startDate: "2026-10-12" }), log, TODAY)).toBeNull();
    expect(M.lastWeekAverage(goal({ startDate: "2026-10-01" }), log, TODAY)).toBe(Math.round(4 / 7));
    expect(M.lastWeekAverage(goal({ startDate: "2026-10-01" }), {}, TODAY)).toBeNull();
  });
});

describe("making and changing goals", () => {
  const start = (position: number | null = null) => G.createGoal(G.emptyGoals(), { type: "ayahs-per-day", amount: 12 }, ctx(position))!;

  it("a goal gets every legacy field, and becomes the main goal", () => {
    const { goal: g, rec } = start(absolute(2, 5));
    expect(g).toMatchObject({ type: "ayahs-per-day", label: "12 ayahs/day", startDate: TODAY, targetDate: null, dailyAyahTarget: 12, startAbsoluteAyah: 12, status: "active" });
    expect(g.preferredDays).toEqual(M.ALL_DAYS);
    expect(rec.activeGoalId).toBe(g.id);
  });
  it("what a goal needs: a day after today, or an amount", () => {
    expect(G.problemWith({ type: "finish-by-date", targetDate: TODAY }, TODAY)).toMatch(/after today/);
    expect(G.problemWith({ type: "finish-by-date", targetDate: null }, TODAY)).toMatch(/Choose the day/);
    expect(G.problemWith({ type: "finish-by-date", targetDate: "2026-10-16" }, TODAY)).toBeNull();
    expect(G.problemWith({ type: "pages-per-day", amount: 0 }, TODAY)).toMatch(/at least 1/);
    expect(G.createGoal(G.emptyGoals(), { type: "finish-by-date", targetDate: TODAY }, ctx())).toBeNull();
  });
  it("the preview is the amount the goal would get", () => {
    expect(G.previewDaily({ type: "pages-per-day", amount: 2 }, { today: TODAY, position: null })).toBe(Math.ceil(2 * (6236 / 604)));
    expect(G.previewDaily({ type: "juz-per-week", amount: 1 }, { today: TODAY, position: null })).toBe(Math.ceil(6236 / 30 / 7));
    expect(G.previewDaily({ type: "finish-by-date", targetDate: "2027-02-07" }, { today: TODAY, position: 812 })).toBe(Math.ceil((6236 - 812) / 115));
    expect(G.previewDaily({ type: "finish-by-date", targetDate: TODAY }, { today: TODAY, position: 0 })).toBeNull();
  });
  it("a local evening is still today (the date given is what is used, never a UTC date)", () => {
    const g = G.createGoal(G.emptyGoals(), { type: "finish-by-date", targetDate: "2026-10-16" }, ctx(0, "2026-10-15"))!;
    expect(g.goal.startDate).toBe("2026-10-15");
    expect(g.goal.dailyAyahTarget).toBe(6236);
  });
  it("Remove can be undone, in its old place, with its main place", () => {
    const a = start();
    const b = G.createGoal(a.rec, { type: "pages-per-day", amount: 3 }, ctx())!;
    const gone = G.removeGoal(b.rec, b.goal.id)!;
    expect(gone.rec.goals.map((g) => g.id)).toEqual([a.goal.id]);
    expect(gone.rec.activeGoalId).toBeNull();
    const back = G.restoreGoal(gone.rec, gone.removed);
    expect(back.goals.map((g) => g.id)).toEqual([a.goal.id, b.goal.id]);
    expect(back.activeGoalId).toBe(b.goal.id);
    expect(G.restoreGoal(back, gone.removed)).toBe(back); // twice is once
  });
  it("Resume makes a goal the main one and pauses the one that was; Undo puts it back", () => {
    const a = start();
    const b = G.createGoal(a.rec, { type: "pages-per-day", amount: 3 }, ctx())!; // a is paused, b is main
    const r = G.makeMain(b.rec, a.goal.id);
    expect(r.rec.activeGoalId).toBe(a.goal.id);
    expect(r.rec.goals.find((g) => g.id === a.goal.id)!.status).toBe("active");
    expect(r.rec.goals.find((g) => g.id === b.goal.id)!.status).toBe("paused");
    const undone = G.undoMakeMain(r.rec, a.goal.id, { status: "paused", activeGoalId: b.goal.id, pausedId: r.pausedId });
    expect(undone.goals.map((g) => g.status)).toEqual(["paused", "active"]);
    expect(undone.activeGoalId).toBe(b.goal.id);
  });
  it("a hand-logged count is added to today and can be taken back", () => {
    const r = G.logManual(G.emptyGoals(), 5, TODAY, 77)!;
    expect(r.rec.dailyLog[TODAY]).toHaveLength(5);
    expect(G.logManual(G.emptyGoals(), 0, TODAY, 1)).toBeNull();
    expect(G.logManual(G.emptyGoals(), 99999, TODAY, 1)).toBeNull();
    expect(G.unlogManual(r.rec, TODAY, r.keys).dailyLog[TODAY]).toBeUndefined();
  });
  it("finish-by-date goals (a Khatmah is one) complete at the last ayah; pace goals never do", () => {
    const fin = G.createGoal(G.emptyGoals(), { type: "finish-by-date", targetDate: "2027-02-07", label: M.KHATMAH_LABEL }, ctx())!;
    const both = G.createGoal(fin.rec, { type: "ayahs-per-day", amount: 5 }, ctx())!; // the khatmah is paused: not touched
    expect(G.completeFinished(both.rec, 6236).completed).toEqual([]);
    const only = G.completeFinished(fin.rec, 6236);
    expect(only.completed).toEqual([fin.goal.id]);
    expect(only.rec.goals[0]!.status).toBe("completed");
    expect(only.rec.activeGoalId).toBeNull();
    const pace = start();
    expect(G.completeFinished(pace.rec, 6236).completed).toEqual([]);
  });
});

describe("the stored record", () => {
  it("fields it does not know are kept, on the record and on each goal; the reader's log is kept", () => {
    setStorageBackend(memoryStore({ [GOALS_KEY]: JSON.stringify({ future: { a: 1 }, activeGoalId: "a", dailyLog: { "2026-10-15": ["2:1"] }, goals: [{ ...goal({ id: "a" }), color: "teal" }] }) }));
    const r = G.mutate((rec) => ({ rec: G.setStatus(rec, "a", "paused"), out: true }));
    expect(r).toBe(true);
    const saved = getJSON<Record<string, unknown>>(GOALS_KEY, {});
    expect(saved.future).toEqual({ a: 1 });
    expect((saved.goals as Array<Record<string, unknown>>)[0]).toMatchObject({ id: "a", status: "paused", color: "teal" });
    expect(saved.dailyLog).toEqual({ "2026-10-15": ["2:1"] });
  });
  it("a stored goal of the legacy `custom` kind, or with a missing field, is shown and kept", () => {
    setStorageBackend(memoryStore({ [GOALS_KEY]: JSON.stringify({ goals: [{ id: "c", type: "custom", label: "Mine", dailyAyahTarget: 7, status: "active" }], activeGoalId: "c", dailyLog: {} }) }));
    const rec = G.readGoals();
    expect(G.mainGoal(rec)).toMatchObject({ id: "c", type: "custom", dailyAyahTarget: 7, preferredDays: M.ALL_DAYS });
  });
  it("a damaged value reads as no goals and is not written over until something is changed", () => {
    const store = memoryStore({ [GOALS_KEY]: "{not json" });
    setStorageBackend(store);
    expect(G.readGoals().goals).toEqual([]);
    expect(store.data.get(GOALS_KEY)).toBe("{not json");
    setStorageBackend(memoryStore({ [GOALS_KEY]: JSON.stringify([1, 2]) }));
    expect(G.readGoals()).toEqual(G.emptyGoals());
  });
  it("main and other goals", () => {
    const a = G.createGoal(G.emptyGoals(), { type: "ayahs-per-day", amount: 5 }, ctx())!;
    const b = G.createGoal(a.rec, { type: "ayahs-per-day", amount: 6 }, ctx())!;
    expect(G.mainGoal(b.rec)!.id).toBe(b.goal.id);
    expect(G.otherGoals(b.rec).map((g) => g.id)).toEqual([a.goal.id]);
  });
});
