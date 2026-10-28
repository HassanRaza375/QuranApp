// Phase 14: Hifz. The LEGACY composables (useHifz.ts, useHifzSession.ts) are loaded as they are and run beside lib/hifz on the same histories; the
// stored record must be identical after every step. That covers the spacing, the strength rules, the new-ayah budget, the migration from the v1 plan
// model, the part of today's queue the simple mode keeps, and the grading of a whole session. It also checks the other direction: a record written by
// lib/hifz is read by the legacy code and graded the same.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { localDateKey } from "../app/lib/dates";
import * as E from "../app/lib/hifz/engine";
import * as S from "../app/lib/hifz/session";
import { HIFZ_KEY, HIFZ_V1_KEY, legacySurahName, loadHifz, saveHifz, SESSION_KEY } from "../app/lib/hifz/store";
import { getJSON, setStorageBackend } from "../app/lib/storage";
import { loadLegacyHifz } from "../scripts/lib/legacy-hifz.mjs";
import { memoryStore } from "./helpers";

const legacyStorage = (data: Map<string, string>) => ({
  get: (k: string, d: unknown) => (data.has(k) ? JSON.parse(data.get(k)!) : d),
  set: (k: string, v: unknown) => void data.set(k, JSON.stringify(v)),
});

/** A small seeded generator, so a failure can be replayed. */
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

const DAY0 = new Date(2026, 9, 1, 9, 0, 0).getTime();
const setDay = (n: number) => vi.setSystemTime(new Date(2026, 9, 1 + n, 9, 0, 0));
const today = () => localDateKey(new Date());

let uuid = 0;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(DAY0);
  uuid = 0;
  vi.spyOn(globalThis.crypto, "randomUUID").mockImplementation(() => `id-${++uuid}` as `${string}-${string}-${string}-${string}-${string}`);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  setStorageBackend(null);
});

const record = (data: Map<string, string>) => JSON.parse(data.get(HIFZ_KEY) ?? "null");

async function legacyWith(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const legacy = await loadLegacyHifz(legacyStorage(data));
  return { data, legacy, h: legacy.hifz.useHifz(), s: legacy.session.useHifzSession() };
}

describe("the grading, strength, introduction and budget equal the legacy, step by step", () => {
  it("random histories on three surahs: the stored record is identical after every step", async () => {
    for (let seed = 1; seed <= 40; seed++) {
      uuid = 0;
      setDay(0);
      const rand = rng(seed);
      const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]!;
      const { data, h } = await legacyWith();
      h.load();
      let mine = E.emptyData();
      const specs = [
        { surahNo: 67, surahName: "The Sovereignty", startAyah: 1, endAyah: 30, dailyNewTarget: pick([1, 2, 3]), dailyTimeGoalMinutes: 15 },
        { surahNo: 112, surahName: "Sincerity", startAyah: 1, endAyah: 4, dailyNewTarget: pick([1, 3]), dailyTimeGoalMinutes: 10 },
        { surahNo: 36, surahName: "Ya Sin", startAyah: 10, endAyah: 40, dailyNewTarget: 2, dailyTimeGoalMinutes: 15 },
      ];
      const ids: string[] = [];
      for (const spec of specs) {
        const lt = h.createTarget(spec);
        const made = E.createTarget(mine, spec, `id-${ids.length + 1}`, Date.now());
        mine = made.data;
        expect(lt.id).toBe(made.target.id);
        ids.push(lt.id);
      }
      expect(record(data)).toEqual(mine);

      let day = 0;
      for (let step = 0; step < 90; step++) {
        if (rand() < 0.25) {
          day += pick([1, 1, 2, 5, 30]);
          setDay(day);
        }
        const targetId = pick(ids);
        const t = mine.targets.find((x) => x.id === targetId)!;
        const r = rand();
        if (r < 0.2) {
          const n = pick([1, 2, 3]);
          h.introduceAyahs(t.id, n);
          mine = E.introduceAyahs(mine, t.id, n, today()).data;
        } else if (r < 0.7) {
          const started = mine.ayahStates.filter((a) => a.targetId === t.id);
          // grade a started ayah, or (as the legacy session does) an ayah that has no state yet
          const ayahNo = started.length && rand() < 0.85 ? pick(started).ayahNo : t.startAyah + Math.floor(rand() * 4);
          const grade = pick(["again", "good", "good", "easy"] as const);
          const hint = pick([0, 0, 1, 3]);
          h.gradeAyah(t.id, ayahNo, grade, hint);
          mine = E.gradeAyah(mine, t.id, ayahNo, grade, hint, today());
        } else if (r < 0.9) {
          const from = t.startAyah + Math.floor(rand() * 5);
          const grade = pick(["again", "good", "easy"] as const);
          h.gradeTransition(t.id, from, grade);
          mine = E.gradeTransition(mine, t.id, from, grade, today());
        } else if (r < 0.95) {
          h.updateTarget(t.id, { status: "paused" });
          mine = E.updateTarget(mine, t.id, { status: "paused" });
        } else {
          h.updateTarget(t.id, { status: "active" });
          mine = E.updateTarget(mine, t.id, { status: "active" });
        }
        expect(record(data), `seed ${seed}, step ${step}`).toEqual(mine);
        for (const target of mine.targets) expect(E.newAyahBudgetToday(mine, target), `budget, seed ${seed}, step ${step}`).toBe(h.newAyahBudgetToday(h.targets.value.find((x: { id: string }) => x.id === target.id)));
        expect(E.dueOrOverdue(mine, today()).map((a) => a.key), `due, seed ${seed}, step ${step}`).toEqual(h.dueOrOverdueAyahs.value.map((a: { key: string }) => a.key));
      }
      // removing a target removes its states, as the legacy does
      h.deleteTarget(ids[0]);
      mine = E.deleteTarget(mine, ids[0]!);
      expect(record(data)).toEqual(mine);
    }
  }, 60_000);

  it("the strength words and the interval cap come out the same at the edges (180 days, ease floor 1.3 and cap 2.8)", async () => {
    const { data, h } = await legacyWith();
    h.load();
    let mine = E.emptyData();
    const spec = { surahNo: 1, surahName: "The Opening", startAyah: 1, endAyah: 7, dailyNewTarget: 3, dailyTimeGoalMinutes: 15 };
    const lt = h.createTarget(spec);
    mine = E.createTarget(mine, spec, lt.id, Date.now()).data;
    for (let i = 0; i < 14; i++) {
      h.gradeAyah(lt.id, 1, "easy", 0);
      mine = E.gradeAyah(mine, lt.id, 1, "easy", 0, today());
    }
    expect(record(data)).toEqual(mine);
    expect(mine.ayahStates[0]!.interval).toBe(180);
    expect(mine.ayahStates[0]!.ease).toBe(2.8);
    for (let i = 0; i < 12; i++) {
      h.gradeAyah(lt.id, 1, "again", 0);
      mine = E.gradeAyah(mine, lt.id, 1, "again", 0, today());
    }
    expect(record(data)).toEqual(mine);
    expect(mine.ayahStates[0]!.ease).toBe(1.3);
    expect(mine.ayahStates[0]!.strength).toBe("weak");
  });
});

describe("the migration from the v1 plan model equals the legacy", () => {
  it("several plans, memorized and not, paused and not, with and without the optional fields", async () => {
    const plans = [
      { id: "p1", surahNo: 1, startAyah: 1, endAyah: 7, status: "memorized", planStatus: "active", interval: 6, ease: 2.2, nextReviewAt: "2026-10-05", reviewCount: 4, lastReviewedAt: "2026-10-01", createdAt: 1700000000000 },
      { id: "p2", surahNo: 112, startAyah: 1, endAyah: 4, status: "learning", planStatus: "paused" },
      { id: "p3", surahNo: 67, startAyah: 5, endAyah: 12, status: "learning", planStatus: "active", reviewCount: 0, interval: 1 },
    ];
    const { data, h } = await legacyWith({ [HIFZ_V1_KEY]: JSON.stringify(plans) });
    h.load();
    const mine = E.migrateFromV1(plans, { today: today(), now: Date.now(), surahName: legacySurahName })!;
    expect(record(data)).toEqual(mine);
    expect(mine.targets.map((t) => t.surahName)).toEqual(["The Opening", "Sincerity", "The Sovereignty"]);
  });

  it("nothing to migrate: an empty v1 list or none gives nothing, and the legacy writes nothing either", async () => {
    for (const v1 of [[], null, {}]) {
      const { data, h } = await legacyWith(v1 === null ? {} : { [HIFZ_V1_KEY]: JSON.stringify(v1) });
      h.load();
      expect(data.has(HIFZ_KEY)).toBe(false);
      expect(E.migrateFromV1(v1, { today: today(), now: 0, surahName: legacySurahName })).toBeNull();
    }
  });

  it("loadHifz migrates once, writes v2, never writes v1, and reads v2 afterwards", async () => {
    const plans = [{ id: "p1", surahNo: 112, startAyah: 1, endAyah: 4, status: "learning", planStatus: "active" }];
    const store = memoryStore({ [HIFZ_V1_KEY]: JSON.stringify(plans) });
    setStorageBackend(store);
    const first = loadHifz();
    expect(first.data.targets).toHaveLength(1);
    expect(store.data.get(HIFZ_V1_KEY)).toBe(JSON.stringify(plans));
    expect(JSON.parse(store.data.get(HIFZ_KEY)!).targets).toHaveLength(1);
    store.data.set(HIFZ_V1_KEY, "[]"); // v2 is authoritative from now on
    expect(loadHifz().data).toEqual(first.data);
  });
});

describe("today's queue: the part the simple mode keeps equals the legacy", () => {
  it("weak ayahs and joins, then due revision round-robin, then new ayahs within the budget", async () => {
    for (let seed = 100; seed < 130; seed++) {
      uuid = 0;
      setDay(0);
      const rand = rng(seed);
      const { h, s } = await legacyWith();
      h.load();
      const a = h.createTarget({ surahNo: 67, surahName: "x", startAyah: 1, endAyah: 30, dailyNewTarget: 3, dailyTimeGoalMinutes: 15 });
      const b = h.createTarget({ surahNo: 112, surahName: "x", startAyah: 1, endAyah: 4, dailyNewTarget: 2, dailyTimeGoalMinutes: 15 });
      for (const t of [a, b]) {
        h.introduceAyahs(t.id, 1 + Math.floor(rand() * 3));
        for (const st of [...h.ayahStatesForTarget(t.id)]) {
          const times = Math.floor(rand() * 4);
          for (let i = 0; i < times; i++) h.gradeAyah(t.id, st.ayahNo, rand() < 0.35 ? "again" : "good", 0);
          if (rand() < 0.3) h.gradeTransition(t.id, st.ayahNo, rand() < 0.5 ? "again" : "good");
        }
      }
      setDay(1 + Math.floor(rand() * 20));
      const legacyItems = s.buildDailyItems().filter((i: S.SessionItem) => i.type !== "warmup" && i.type !== "final-mixed");
      const mineData = loadHifzFrom(h);
      const mineItems = S.buildDailyItems(mineData, today(), () => "x");
      const strip = (i: S.SessionItem) => ({ type: i.type, targetId: i.targetId, ayahNo: i.ayahNo, fromAyah: i.fromAyah, toAyah: i.toAyah, isNew: i.isNew, gradedTest: i.gradedTest });
      expect(mineItems.map(strip), `seed ${seed}`).toEqual(legacyItems.map(strip));
    }
  });
});

/** The legacy composable's current state as a plain record (what it would write). */
const loadHifzFrom = (h: { targets: { value: unknown }; ayahStates: { value: unknown }; transitionStates: { value: unknown }; activity: { value: unknown } }): E.HifzData =>
  JSON.parse(JSON.stringify({ targets: h.targets.value, ayahStates: h.ayahStates.value, transitionStates: h.transitionStates.value, activity: h.activity.value }));

describe("grading a whole session equals the legacy", () => {
  it("a daily session graded item by item leaves the same record, and the same results in the stored session", async () => {
    for (let seed = 200; seed < 215; seed++) {
      uuid = 0;
      setDay(0);
      const rand = rng(seed);
      const { data, h, s } = await legacyWith();
      h.load();
      const t = h.createTarget({ surahNo: 67, surahName: "x", startAyah: 1, endAyah: 30, dailyNewTarget: 3, dailyTimeGoalMinutes: 15 });
      let mine = loadHifzFrom(h);
      for (let day = 1; day <= 6; day++) {
        setDay(day);
        s.startDailySession();
        // the revamp builds the same queue minus the warm-up and the final test, so remove those from the legacy session before grading
        const legacySession = { ...s.session.value, items: s.session.value.items.filter((i: S.SessionItem) => i.type !== "warmup" && i.type !== "final-mixed") };
        s.session.value = legacySession;
        let mySession = S.startSession("daily", S.buildDailyItems(mine, today(), () => `i${Math.random()}`), [t.id], "s", Date.now());
        expect(mySession.items.map((i) => [i.type, i.ayahNo, i.fromAyah])).toEqual(legacySession.items.map((i: S.SessionItem) => [i.type, i.ayahNo, i.fromAyah]));
        while (S.currentItem(mySession)) {
          const grade = rand() < 0.3 ? "again" : rand() < 0.15 ? "easy" : "good";
          const hint = rand() < 0.2 ? 1 : 0;
          s.gradeCurrent(grade, hint);
          const r = S.gradeCurrent(mine, mySession, grade, hint, today(), Date.now());
          mine = r.data;
          mySession = r.session;
        }
        expect(record(data), `seed ${seed}, day ${day}`).toEqual(mine);
        expect(s.session.value.items.map((i: S.SessionItem) => [i.result, i.hintLevel])).toEqual(mySession.items.map((i) => [i.result, i.hintLevel]));
        expect(s.session.value.stats).toEqual(mySession.stats);
        expect(s.session.value.status).toBe("completed");
      }
    }
  });

  it("skipping an item leaves the record alone and marks the item, as the legacy does", async () => {
    const { data, h, s } = await legacyWith();
    h.load();
    const t = h.createTarget({ surahNo: 112, surahName: "x", startAyah: 1, endAyah: 4, dailyNewTarget: 2, dailyTimeGoalMinutes: 15 });
    s.startDailySession();
    s.session.value = { ...s.session.value, items: s.session.value.items.filter((i: S.SessionItem) => i.type === "new") };
    const before = JSON.stringify(record(data));
    s.skipCurrent();
    expect(JSON.stringify(record(data))).toBe(before);
    const mine = loadHifzFrom(h);
    const session = S.startSession("daily", S.buildDailyItems(mine, today(), () => "x"), [t.id], "s", 0);
    const r = S.skipCurrent(mine, session, today(), 0);
    expect(r.data).toEqual(mine);
    expect(r.session.items[0]!.result).toBe("skipped");
    expect(r.session.currentIndex).toBe(1);
  });

  it("a new ayah graded `again` still counts as introduced (kept for parity with the legacy)", async () => {
    const { h, s } = await legacyWith();
    h.load();
    const t = h.createTarget({ surahNo: 112, surahName: "x", startAyah: 1, endAyah: 4, dailyNewTarget: 1, dailyTimeGoalMinutes: 15 });
    s.startDailySession();
    s.gradeCurrent("again", 0);
    expect(h.targets.value[0].lastPosition).toBe(1);
    const r = S.gradeCurrent(E.createTarget(E.emptyData(), { surahNo: 112, surahName: "x", startAyah: 1, endAyah: 4, dailyNewTarget: 1, dailyTimeGoalMinutes: 15 }, t.id, 0).data, S.startSession("daily", [{ id: "a", type: "new", targetId: t.id, ayahNo: 1, isNew: true, gradedTest: true, testMode: "full", result: null, hintLevel: 0 }], [t.id], "s", 0), "again", 0, today(), 0);
    expect(r.data.targets[0]!.lastPosition).toBe(1);
    expect(r.data.ayahStates[0]!.recentResults).toEqual(["again"]);
  });
});

describe("the two directions of storage", () => {
  it("a record written by lib/hifz is read by the legacy composable, and grading it gives the same result in both", async () => {
    for (let seed = 300; seed < 310; seed++) {
      uuid = 0;
      setDay(0);
      const rand = rng(seed);
      let mine = E.createTarget(E.emptyData(), { surahNo: 36, surahName: "Ya Sin", startAyah: 1, endAyah: 83, dailyNewTarget: 2, dailyTimeGoalMinutes: 15 }, "t1", Date.now()).data;
      mine = E.introduceAyahs(mine, "t1", 5, today()).data;
      for (let i = 0; i < 12; i++) mine = E.gradeAyah(mine, "t1", 1 + Math.floor(rand() * 5), rand() < 0.4 ? "again" : "good", 0, today());
      const store = memoryStore();
      setStorageBackend(store);
      saveHifz(mine);
      const { data, h } = await legacyWith({ [HIFZ_KEY]: store.data.get(HIFZ_KEY)! });
      h.load();
      expect(loadHifzFrom(h)).toEqual(mine);
      setDay(3);
      h.gradeAyah("t1", 2, "good", 0);
      mine = E.gradeAyah(mine, "t1", 2, "good", 0, today());
      expect(record(data)).toEqual(mine);
    }
  });

  it("lib/hifz keeps the fields of the stored record it does not know, and reads a session the legacy wrote", async () => {
    const store = memoryStore({ [HIFZ_KEY]: JSON.stringify({ targets: [], ayahStates: [], transitionStates: [], activity: [], futureField: { keep: true } }) });
    setStorageBackend(store);
    saveHifz(E.createTarget(E.emptyData(), { surahNo: 1, surahName: "The Opening", startAyah: 1, endAyah: 7, dailyNewTarget: 1, dailyTimeGoalMinutes: 15 }, "a", 1).data);
    const written = JSON.parse(store.data.get(HIFZ_KEY)!);
    expect(written.futureField).toEqual({ keep: true });
    expect(written.targets).toHaveLength(1);

    const { data, h, s } = await legacyWith({ [HIFZ_KEY]: store.data.get(HIFZ_KEY)! });
    h.load();
    s.startDailySession();
    const session = JSON.parse(data.get(SESSION_KEY)!);
    setStorageBackend(memoryStore({ [SESSION_KEY]: JSON.stringify(session) }));
    const read = getJSON<S.HifzSession | null>(SESSION_KEY, null);
    expect(S.isResumable(read)).toBe(true);
    expect(read!.items[0]!.type).toBe("new");
  });

  it("a stored record that cannot be read is shown as empty and is not written over until the user acts", () => {
    const store = memoryStore({ [HIFZ_KEY]: "{not json" });
    setStorageBackend(store);
    const loaded = loadHifz();
    expect(loaded.damaged).toBe(true);
    expect(loaded.data).toEqual(E.emptyData());
    expect(store.data.get(HIFZ_KEY)).toBe("{not json");
  });
});
