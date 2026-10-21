// Phase 9B: Tasbeeh. The LEGACY composable (app/composables/useTasbeeh.ts) is loaded as it is and run beside the revamp's code on the same
// legacy-shaped data; every operation must leave the same stored record. The legacy code must also tolerate the revamp's extra
// `name-<n>` counters, and the revamp must keep everything it does not know.
import { afterEach, describe, expect, it } from "vitest";
import { TASBEEH_PRESETS } from "../app/data/tasbeehPresets.generated";
import { getJSON, setStorageBackend } from "../app/lib/storage";
import * as T from "../app/lib/tasbeeh";
import { loadLegacyTasbeeh } from "../scripts/lib/legacy-tasbeeh.mjs";
import { memoryStore } from "./helpers";

afterEach(() => setStorageBackend(null));

/** The legacy `$storage` wrapper's behaviour: JSON in, JSON out, a default when missing. */
const legacyStorage = (data: Map<string, string>) => ({
  get: (k: string, d: unknown) => (data.has(k) ? JSON.parse(data.get(k)!) : d),
  set: (k: string, v: unknown) => void data.set(k, JSON.stringify(v)),
});

// a legacy-shaped record, with things the revamp adds or does not know
const START = {
  subhanallah: { count: 30, target: 33, cycles: 2, lifetime: 96 },
  alhamdulillah: { count: 5, target: 99, cycles: 0, lifetime: 5, note: "an unknown field" },
  "name-12": { count: 3, target: 33, cycles: 0, lifetime: 3 },
  futureCounter: { count: 1, target: 100, cycles: 4, lifetime: 401 },
};

async function both(start: Record<string, unknown>) {
  const legacyData = new Map([[T.TASBEEH_KEY, JSON.stringify(start)]]);
  const legacy = await loadLegacyTasbeeh(legacyStorage(legacyData));
  const lt = legacy.useTasbeeh();
  lt.load();
  const mine = memoryStore({ [T.TASBEEH_KEY]: JSON.stringify(start) });
  setStorageBackend(mine);
  return {
    legacy,
    lt,
    legacyRecord: () => JSON.parse(legacyData.get(T.TASBEEH_KEY)!) as Record<string, unknown>,
    myRecord: () => JSON.parse(mine.data.get(T.TASBEEH_KEY)!) as Record<string, unknown>,
  };
}

describe("the presets", () => {
  it("the generated file equals what the legacy composable holds: six counters, the legacy order, Arabic untouched, the colour left out", async () => {
    const legacy = await loadLegacyTasbeeh({ get: (_k: string, d: unknown) => d, set: () => {} });
    expect(TASBEEH_PRESETS).toEqual(legacy.tasbeehPresets.map((p: Record<string, string>) => ({ id: p.id, arabic: p.arabic, transliteration: p.transliteration, meaning: p.meaning })));
    expect(TASBEEH_PRESETS.map((p) => p.id)).toEqual(["subhanallah", "alhamdulillah", "allahuakbar", "lailahaillallah", "astaghfirullah", "custom"]);
    expect(TASBEEH_PRESETS.find((p) => p.id === "custom")!.arabic).toBe("");
    expect(Object.keys(TASBEEH_PRESETS[0]!)).toEqual(["id", "arabic", "transliteration", "meaning"]);
  });
  it("there is no After prayer sequence and no Tasbih of Fatima in the data", () => {
    expect(JSON.stringify(TASBEEH_PRESETS)).not.toMatch(/fatima|after prayer|sequence/i);
  });
});

describe("the revamp's counting equals the legacy counting, operation by operation", () => {
  it("count, count to the goal (a cycle), reset, a new goal, and a counter that was never used: the stored record is identical after each step", async () => {
    const { lt, legacyRecord, myRecord } = await both(START);
    const steps: Array<[string, () => void, () => void]> = [
      ["count", () => lt.increment("subhanallah"), () => T.tap("subhanallah")],
      ["count", () => lt.increment("subhanallah"), () => T.tap("subhanallah")],
      ["count (the 33rd: a cycle)", () => lt.increment("subhanallah"), () => T.tap("subhanallah")],
      ["count after the cycle", () => lt.increment("subhanallah"), () => T.tap("subhanallah")],
      ["count a counter with an unknown field", () => lt.increment("alhamdulillah"), () => T.tap("alhamdulillah")],
      ["count a counter never used", () => lt.increment("allahuakbar"), () => T.tap("allahuakbar")],
      ["goal 99 (the count returns to 0)", () => lt.setTarget("subhanallah", 99), () => T.setTarget("subhanallah", 99)],
      ["count with goal 99", () => lt.increment("subhanallah"), () => T.tap("subhanallah")],
      ["reset", () => lt.reset("subhanallah"), () => T.resetCount("subhanallah")],
      ["reset a counter never used", () => lt.reset("custom"), () => T.resetCount("custom")],
      ["goal 100 on a counter never used", () => lt.setTarget("astaghfirullah", 100), () => T.setTarget("astaghfirullah", 100)],
      ["goal 33", () => lt.setTarget("alhamdulillah", 33), () => T.setTarget("alhamdulillah", 33)],
    ];
    for (const [label, legacyStep, mineStep] of steps) {
      legacyStep();
      mineStep();
      expect(myRecord(), label).toEqual(legacyRecord());
    }
    // 100 counts on the goal of 33: three full cycles and a remainder, the same in both
    for (let i = 0; i < 100; i++) {
      lt.increment("lailahaillallah");
      T.tap("lailahaillallah");
    }
    expect(myRecord()).toEqual(legacyRecord());
    expect(myRecord().lailahaillallah).toEqual({ count: 1, target: 33, cycles: 3, lifetime: 100 });
  });

  it("lifetime and cycles keep their legacy meaning: lifetime counts every tap, a cycle is one goal reached, reset keeps both", () => {
    setStorageBackend(memoryStore());
    for (let i = 0; i < 70; i++) T.tap("subhanallah");
    expect(T.readEntry("subhanallah")).toEqual({ count: 4, target: 33, cycles: 2, lifetime: 70 });
    T.resetCount("subhanallah");
    expect(T.readEntry("subhanallah")).toEqual({ count: 0, target: 33, cycles: 2, lifetime: 70 });
    T.setTarget("subhanallah", 99);
    expect(T.readEntry("subhanallah")).toEqual({ count: 0, target: 99, cycles: 2, lifetime: 70 });
  });
});

describe("the legacy page code tolerates the revamp's extra counters, and existing counts stay intact", () => {
  it("the legacy composable loads a record with name-<n> counters, counts another dhikr, and writes the name counters back untouched", async () => {
    const { lt, legacy, legacyRecord } = await both(START);
    expect(lt.peekEntry("name-12")).toEqual(START["name-12"]);
    lt.increment("subhanallah");
    lt.reset("alhamdulillah");
    lt.setTarget("allahuakbar", 99);
    const rec = legacyRecord();
    expect(rec["name-12"]).toEqual(START["name-12"]);
    expect(rec.futureCounter).toEqual(START.futureCounter);
    expect(rec.subhanallah).toEqual({ count: 31, target: 33, cycles: 2, lifetime: 97 });
    // and the legacy counter page itself opens a name counter: it is just a counter named by its id
    expect(legacy.getTasbeehPreset("name-12")).toMatchObject({ id: "name-12", transliteration: "name-12", arabic: "" });
    lt.increment("name-12");
    expect(legacyRecord()["name-12"]).toEqual({ count: 4, target: 33, cycles: 0, lifetime: 4 });
  });

  it("the legacy index lists only its own presets, so a name counter is invisible there and harmless", async () => {
    const { legacy } = await both(START);
    expect(legacy.tasbeehPresets.map((p: { id: string }) => p.id)).not.toContain("name-12");
  });

  it("the revamp keeps other counters, unknown fields in an entry, and unknown fields at the top, through every operation", () => {
    const start = { ...START, topLevelFuture: { a: 1 } };
    const store = memoryStore({ [T.TASBEEH_KEY]: JSON.stringify(start) });
    setStorageBackend(store);
    T.tap("alhamdulillah");
    T.resetCount("subhanallah");
    T.setTarget("futureCounter", 33);
    const rec = getJSON<Record<string, unknown>>(T.TASBEEH_KEY, {});
    expect(rec["name-12"]).toEqual(START["name-12"]);
    expect(rec.topLevelFuture).toEqual({ a: 1 });
    expect(rec.alhamdulillah).toEqual({ count: 6, target: 99, cycles: 0, lifetime: 6, note: "an unknown field" });
    expect(rec.futureCounter).toEqual({ count: 0, target: 33, cycles: 4, lifetime: 401 });
  });
});

describe("reading", () => {
  it("never writes: a counter that has never been counted reads as the legacy default", () => {
    const store = memoryStore();
    setStorageBackend(store);
    expect(T.readEntry("subhanallah")).toEqual({ count: 0, target: 33, cycles: 0, lifetime: 0 });
    expect(store.data.has(T.TASBEEH_KEY)).toBe(false);
  });
  it("a damaged record or entry falls back to the defaults instead of breaking", () => {
    for (const bad of ["{not json", "[]", "7", JSON.stringify({ subhanallah: "x" }), JSON.stringify({ subhanallah: { count: "3", target: 0, cycles: -1, lifetime: null } })]) {
      setStorageBackend(memoryStore({ [T.TASBEEH_KEY]: bad }));
      expect(T.readEntry("subhanallah"), bad).toEqual({ count: 0, target: 33, cycles: 0, lifetime: 0 });
      T.tap("subhanallah"); // and counting still works
      expect(T.readEntry("subhanallah").lifetime).toBe(1);
    }
  });
  it("blocked storage never throws", () => {
    setStorageBackend(memoryStore({}, true));
    expect(T.readEntry("x")).toEqual(T.emptyEntry());
    expect(() => T.tap("x")).not.toThrow();
  });
});

describe("Undo", () => {
  it("restoreEntry puts a counter back exactly as it was, after a reset and after a goal change", () => {
    setStorageBackend(memoryStore({ [T.TASBEEH_KEY]: JSON.stringify(START) }));
    const a = T.resetCount("subhanallah");
    expect(T.readEntry("subhanallah").count).toBe(0);
    T.restoreEntry("subhanallah", a.before);
    expect(T.readEntry("subhanallah")).toEqual(START.subhanallah);
    const b = T.setTarget("subhanallah", 100);
    expect(T.readEntry("subhanallah")).toEqual({ count: 0, target: 100, cycles: 2, lifetime: 96 });
    T.restoreEntry("subhanallah", b.before);
    expect(T.readEntry("subhanallah")).toEqual(START.subhanallah);
  });
});

describe("name counters", () => {
  it("name-<n> is a counter of the n-th name; anything else is not", () => {
    expect(T.parseNameCounterId("name-12")).toBe(12);
    expect(T.parseNameCounterId("name-99")).toBe(99);
    for (const bad of ["name-0", "name-100", "name-", "name-x", "subhanallah", "name-1-2", "Name-1"]) expect(T.parseNameCounterId(bad), bad).toBeNull();
    expect(T.nameCounterId(7)).toBe("name-7");
  });
  it("a preset is found by its id", () => {
    expect(T.presetOf("subhanallah")?.transliteration).toBe("SubhanAllah");
    expect(T.presetOf("name-12")).toBeUndefined();
  });
});

describe("vibration", () => {
  it("is on by default where the browser can, off when the user turned it off, and never when Reduce motion is on or it is unsupported", () => {
    const env = { supported: true, reducedMotion: false };
    expect(T.vibrationOn({}, env)).toBe(true);
    expect(T.vibrationOn({ vibrate: true }, env)).toBe(true);
    expect(T.vibrationOn({ vibrate: false }, env)).toBe(false);
    expect(T.vibrationOn({}, { ...env, reducedMotion: true })).toBe(false);
    expect(T.vibrationOn({}, { ...env, supported: false })).toBe(false);
    expect(T.vibrateWanted({})).toBe(true);
  });
  it("the switch is stored in its own key, additive, keeping other fields; the counts record is untouched", () => {
    const store = memoryStore({ [T.PREFS_KEY]: JSON.stringify({ other: 1 }) });
    setStorageBackend(store);
    expect(T.readPrefs()).toEqual({ other: 1 });
    T.setVibrate(false);
    expect(JSON.parse(store.data.get(T.PREFS_KEY)!)).toEqual({ other: 1, vibrate: false });
    expect(T.readPrefs().vibrate).toBe(false);
    expect(store.data.has(T.TASBEEH_KEY)).toBe(false);
  });
  it("the patterns are the legacy ones", () => {
    expect(T.TAP_PATTERN).toBe(15);
    expect(T.CYCLE_PATTERN).toEqual([120, 60, 120, 60, 120]);
  });
});

describe("wording", () => {
  it("the announcements are plain", () => {
    expect(T.countAnnouncement({ count: 12, target: 33, cycles: 0, lifetime: 12 })).toBe("12 of 33");
    expect(T.cycleAnnouncement({ count: 0, target: 33, cycles: 1, lifetime: 33 })).toBe("Goal of 33 reached. 1 cycle completed.");
    expect(T.cycleAnnouncement({ count: 0, target: 33, cycles: 3, lifetime: 99 })).toBe("Goal of 33 reached. 3 cycles completed.");
    expect(T.RESET_ANNOUNCEMENT).toBe("Count reset to 0.");
    expect(T.fraction({ count: 11, target: 33, cycles: 0, lifetime: 11 })).toBeCloseTo(1 / 3);
    expect(T.GOALS).toEqual([33, 99, 100]);
  });
});
