// Phase 17C: whole conversations between "devices" and a server (the real push and pull rules over an in-memory repository): convergence, the Phase 6 note rule,
// tombstones, monotone values, the first merge with its snapshot and held push, stale pushes, categories turned on later, and a server that is down.
import { describe, expect, it } from "vitest";
import type { Store } from "../app/lib/sync/adapters";
import { categoriesAdapter, enabledCategories, writeChoice, type Choice } from "../app/lib/sync/categories";
import { emptyState, syncOnce, SyncHttpError, type Api, type SyncState, type SyncReport } from "../app/lib/sync/engine";
import { NEVER_KEYS } from "../app/lib/sync/inventory";
import { pull, push } from "../server/utils/syncHandlers";
import { memoryRepo, type MemoryRepo } from "./fakes/syncRepo";
import { FULL, mapStore, NEVER_MARK, type MapStore } from "./fakes/syncStorage";

const USER = "user-1";
const apiFor = (repo: MemoryRepo, userId = USER): Api => ({
  pull: (since, limit) => pull(repo, userId, BigInt(since), limit),
  push: async (ops) => (await push(repo, userId, ops)).results,
});

interface Device {
  store: MapStore;
  state: { current: SyncState };
  snapshots: string[][];
  sync(opts?: { hold?: boolean; api?: Api }): Promise<SyncReport>;
  choose(c: Partial<Choice>): void;
  json(key: string): any;
}
function device(repo: MemoryRepo, initial: Record<string, string> = {}, name = "d"): Device {
  const store = mapStore(initial);
  const holder = { current: emptyState(name) };
  const snapshots: string[][] = [];
  const api = apiFor(repo);
  return {
    store,
    state: holder,
    snapshots,
    sync: (opts) =>
      syncOnce({
        store,
        state: { load: async () => structuredClone(holder.current), save: async (s) => void (holder.current = structuredClone(s)) },
        api: opts?.api ?? api,
        categories: () => enabledCategories(store),
        extra: [categoriesAdapter],
        snapshot: (keys) => void snapshots.push(keys),
        holdFirstPush: opts?.hold,
      }),
    choose: (c) => writeChoice(store, { library: false, progress: false, settings: false, ...c } as Choice),
    json: (k) => (store.get(k) === null ? null : JSON.parse(store.get(k)!)),
  };
}
const ALL = { library: true, progress: true, settings: true };

describe("two devices converge", () => {
  it("everything one device has reaches the other, in the legacy shapes, and the toggles follow the account", async () => {
    const repo = memoryRepo();
    const a = device(repo, FULL, "a");
    a.choose(ALL);
    const ra = await a.sync();
    expect(ra.status).toBe("ok");
    expect(ra.pushed).toBeGreaterThan(45);

    const b = device(repo, {}, "b"); // a new device: nothing chosen yet, nothing saved
    await b.sync(); // follows the account's toggles
    expect(enabledCategories(b.store)).toEqual(new Set(["library", "progress", "settings"]));
    await b.sync();
    expect(b.json("quran:bookmarks:v1")).toEqual(["ayah:2:255", "surah:18", "person:ibrahim"]);
    expect(b.store.get("prayerFiqh")).toBe("jafari");
    expect(b.json("quran:library:v1").itemMeta["ayah:2:255"].note).toBe("a note");
    expect(b.json("quran:library:v1").futureField).toEqual({ a: 1 });
    expect(b.json("quran:reading-goals:v1").goals[0].legacyField).toBe(1);
    expect(b.json("prayerSettings")).toEqual({ enabledPrayers: ["fajr", "maghrib"], reminderOffset: 10 });
    expect(b.json("quran:reminders:v1")).toEqual(a.json("quran:reminders:v1"));
    const again = await a.sync();
    expect(again.pushed).toBe(0); // and a settled device has nothing more to say
  });

  it("bookmarks added offline on both devices end up on both", async () => {
    const repo = memoryRepo();
    const a = device(repo, { "quran:bookmarks:v1": JSON.stringify(["surah:1"]), "quran:bookmarks:added-at:v1": JSON.stringify({ "surah:1": 10 }) });
    a.choose({ library: true });
    await a.sync();
    const b = device(repo);
    await b.sync();
    await b.sync();
    expect(b.json("quran:bookmarks:v1")).toEqual(["surah:1"]);
    a.store.set("quran:bookmarks:v1", JSON.stringify(["surah:1", "surah:2"]));
    a.store.set("quran:bookmarks:added-at:v1", JSON.stringify({ "surah:1": 10, "surah:2": 20 }));
    b.store.set("quran:bookmarks:v1", JSON.stringify(["surah:1", "surah:3"]));
    b.store.set("quran:bookmarks:added-at:v1", JSON.stringify({ "surah:1": 10, "surah:3": 30 }));
    await a.sync();
    await b.sync();
    await a.sync();
    expect(a.json("quran:bookmarks:v1")).toEqual(["surah:1", "surah:2", "surah:3"]);
    expect(b.json("quran:bookmarks:v1")).toEqual(["surah:1", "surah:2", "surah:3"]);
    expect(b.json("quran:bookmarks:added-at:v1")).toEqual({ "surah:1": 10, "surah:2": 20, "surah:3": 30 });
  });

  it("Phase 6 rule: an item removed on one device and its note edited on the other: the item goes, the note stays on both", async () => {
    const repo = memoryRepo();
    const start = {
      "quran:bookmarks:v1": JSON.stringify(["ayah:1:1"]),
      "quran:bookmarks:added-at:v1": JSON.stringify({ "ayah:1:1": 5 }),
      "quran:library:v1": JSON.stringify({ collections: [], itemMeta: { "ayah:1:1": { note: "old", tags: [], collectionIds: [], updatedAt: 1 } } }),
    };
    const a = device(repo, start);
    a.choose({ library: true });
    await a.sync();
    const b = device(repo);
    await b.sync();
    await b.sync();
    a.store.set("quran:bookmarks:v1", "[]");
    a.store.set("quran:bookmarks:added-at:v1", "{}");
    b.store.set("quran:library:v1", JSON.stringify({ collections: [], itemMeta: { "ayah:1:1": { note: "edited on B", tags: [], collectionIds: [], updatedAt: 9 } } }));
    await a.sync();
    await b.sync();
    await a.sync();
    for (const d of [a, b]) {
      expect(d.json("quran:bookmarks:v1")).toEqual([]);
      expect(d.json("quran:library:v1").itemMeta["ayah:1:1"].note).toBe("edited on B");
    }
  });

  it("a removal reaches the other device; an add on a device that did not see the removal wins", async () => {
    const repo = memoryRepo();
    const base = { "quran:read-surahs:v1": JSON.stringify({ v: 1, surahs: { "18": { completedAt: 5 } } }) };
    const a = device(repo, base);
    a.choose({ progress: true });
    await a.sync();
    const b = device(repo);
    await b.sync();
    await b.sync();
    expect(b.json("quran:read-surahs:v1").surahs["18"]).toEqual({ completedAt: 5 });
    // A marks it unread; B (not having seen that) marks it read again, later
    a.store.set("quran:read-surahs:v1", JSON.stringify({ v: 1, surahs: {} }));
    b.store.set("quran:read-surahs:v1", JSON.stringify({ v: 1, surahs: { "18": { completedAt: 99 } } }));
    await a.sync();
    await b.sync();
    await a.sync();
    expect(a.json("quran:read-surahs:v1").surahs["18"]).toEqual({ completedAt: 99 });
    expect(b.json("quran:read-surahs:v1").surahs["18"]).toEqual({ completedAt: 99 });
    // and a plain removal (nothing else changed) just removes it
    a.store.set("quran:read-surahs:v1", JSON.stringify({ v: 1, surahs: {} }));
    await a.sync();
    await b.sync();
    expect(b.json("quran:read-surahs:v1").surahs).toEqual({});
  });

  it("monotone values never go down: a day's log is a union, the Tasbeeh lifetime a maximum, Hifz slips a union", async () => {
    const repo = memoryRepo();
    const a = device(repo, {
      "quran:reading-goals:v1": JSON.stringify({ goals: [], activeGoalId: null, dailyLog: { "2026-11-02": ["1:1"] } }),
      "quran:tasbeeh:v1": JSON.stringify({ x: { count: 1, target: 33, cycles: 0, lifetime: 100 } }),
      "quran:hifz-words:v1": JSON.stringify({ v: 1, ayahs: { "67:1": { "0": { word: "w", slipDays: ["2026-11-01"], cleanDays: [], last: "2026-11-01" } } } }),
    });
    a.choose({ progress: true });
    await a.sync();
    const b = device(repo);
    await b.sync();
    await b.sync();
    a.store.set("quran:reading-goals:v1", JSON.stringify({ goals: [], activeGoalId: null, dailyLog: { "2026-11-02": ["1:1", "1:2"] } }));
    a.store.set("quran:tasbeeh:v1", JSON.stringify({ x: { count: 4, target: 33, cycles: 0, lifetime: 103 } }));
    b.store.set("quran:reading-goals:v1", JSON.stringify({ goals: [], activeGoalId: null, dailyLog: { "2026-11-02": ["1:1", "1:3"] } }));
    b.store.set("quran:tasbeeh:v1", JSON.stringify({ x: { count: 2, target: 33, cycles: 0, lifetime: 140 } }));
    b.store.set("quran:hifz-words:v1", JSON.stringify({ v: 1, ayahs: { "67:1": { "0": { word: "w", slipDays: ["2026-11-01", "2026-11-05"], cleanDays: [], last: "2026-11-05" } } } }));
    await a.sync();
    await b.sync();
    await a.sync();
    for (const d of [a, b]) {
      expect(d.json("quran:reading-goals:v1").dailyLog["2026-11-02"]).toEqual(["1:1", "1:2", "1:3"]);
      expect(d.json("quran:tasbeeh:v1").x.lifetime).toBe(140);
      expect(d.json("quran:hifz-words:v1").ayahs["67:1"]["0"].slipDays).toEqual(["2026-11-01", "2026-11-05"]);
    }
  });

  it("a stale push (another device got there first) is retried after a pull and merge, with no loss", async () => {
    const repo = memoryRepo();
    const a = device(repo, { themeMode: "dark" });
    a.choose({ settings: true });
    await a.sync();
    const b = device(repo);
    await b.sync();
    await b.sync();
    a.store.set("themeMode", "light");
    // while A is about to push, B pushes first: wrap A's api so that B's change lands between A's pull and A's push
    let raced = false;
    const racing: Api = {
      pull: (s, l) => apiFor(repo).pull(s, l),
      push: async (ops) => {
        if (!raced) {
          raced = true;
          b.store.set("themeMode", "system");
          await b.sync();
        }
        return apiFor(repo).push(ops);
      },
    };
    const r = await a.sync({ api: racing });
    expect(r.rounds).toBeGreaterThan(1);
    // both changed the same setting: last write wins, in the server's order; both devices end up equal
    await b.sync();
    expect(a.store.get("themeMode")).toBe(b.store.get("themeMode"));
  });
});

describe("the first merge", () => {
  it("takes a snapshot of this device's values before writing the account's, reports both counts, and holds the push for the Undo window", async () => {
    const repo = memoryRepo();
    const account = device(repo, { "quran:bookmarks:v1": JSON.stringify(["surah:2"]), "quran:bookmarks:added-at:v1": JSON.stringify({ "surah:2": 5 }), themeMode: "dark" });
    account.choose({ library: true, settings: true });
    await account.sync();

    const mine = { "quran:bookmarks:v1": JSON.stringify(["surah:9"]), "quran:bookmarks:added-at:v1": JSON.stringify({ "surah:9": 7 }), themeMode: "light" };
    const d = device(repo, mine, "mine");
    d.choose({ library: true, settings: true });
    const before = { ...Object.fromEntries(d.store.map) };
    const r = await d.sync({ hold: true });
    expect(r.firstMerge).toBeTruthy();
    expect(r.firstMerge!.fromAccount).toBeGreaterThan(0);
    expect(r.held).toBe(true);
    expect(d.snapshots).toHaveLength(1);
    expect(d.snapshots[0]).toContain("quran:bookmarks:v1");
    // the account's bookmark arrived, this device's stayed
    expect(d.json("quran:bookmarks:v1")).toEqual(["surah:2", "surah:9"]);
    // nothing of this device's own was pushed yet: a second device sees the account exactly as it was
    const probe = device(repo);
    await probe.sync();
    await probe.sync();
    expect(probe.json("quran:bookmarks:v1")).toEqual(["surah:2"]);
    expect(before["quran:bookmarks:v1"]).toBe(mine["quran:bookmarks:v1"]); // (the snapshot callback ran before any write: the caller restores `before`)
    // after the window the push goes out
    const after = await d.sync();
    expect(after.pushed).toBeGreaterThan(0);
    await probe.sync();
    expect(probe.json("quran:bookmarks:v1")).toEqual(["surah:2", "surah:9"]);
  });

  it("a device that follows the account's toggles (nothing chosen here) still gets its snapshot and held push when the data merge comes in a later round", async () => {
    const repo = memoryRepo();
    const account = device(repo, { "quran:bookmarks:v1": JSON.stringify(["surah:2"]), "quran:bookmarks:added-at:v1": JSON.stringify({ "surah:2": 5 }) });
    account.choose({ library: true });
    await account.sync();
    const d = device(repo, { "quran:bookmarks:v1": JSON.stringify(["surah:9"]), "quran:bookmarks:added-at:v1": JSON.stringify({ "surah:9": 7 }) }, "mine");
    const r = await d.sync({ hold: true }); // nothing chosen on this device: round 1 follows the toggles, round 2 merges the Library
    expect(r.rounds).toBe(2);
    expect(r.firstMerge).toBeTruthy();
    expect(r.held).toBe(true);
    expect(d.snapshots).toHaveLength(1);
    expect(d.json("quran:bookmarks:v1")).toEqual(["surah:2", "surah:9"]);
    const probe = device(repo);
    await probe.sync();
    await probe.sync();
    expect(probe.json("quran:bookmarks:v1")).toEqual(["surah:2"]); // not yet pushed
    expect((await d.sync()).pushed).toBeGreaterThan(0);
  });

  it("on the first meeting the account's value wins for a setting both have, and a device with data and an empty account just uploads", async () => {
    const repo = memoryRepo();
    const a = device(repo, { themeMode: "dark", prayerFiqh: "sunni" });
    a.choose({ settings: true });
    await a.sync();
    const b = device(repo, { themeMode: "light" });
    b.choose({ settings: true });
    await b.sync();
    expect(b.store.get("themeMode")).toBe("dark");
    expect(b.store.get("prayerFiqh")).toBe("sunni");
    const repo2 = memoryRepo();
    const solo = device(repo2, FULL);
    solo.choose(ALL);
    const r = await solo.sync({ hold: true });
    expect(r.firstMerge).toBeUndefined(); // nothing came from the account: nothing to undo, so no hold
    expect(r.pushed).toBeGreaterThan(45);
  });
});

describe("categories", () => {
  it("the toggles belong to the account: a second device follows them, and turning a category on later pulls its records from the start", async () => {
    const repo = memoryRepo();
    const a = device(repo, FULL);
    a.choose({ library: true });
    await a.sync();
    const b = device(repo);
    await b.sync(); // follows the account: only the Library
    await b.sync();
    expect(enabledCategories(b.store)).toEqual(new Set(["library"]));
    expect(b.json("quran:bookmarks:v1")).toEqual(["ayah:2:255", "surah:18", "person:ibrahim"]);
    expect(b.store.get("themeMode")).toBeNull();
    // A turns Settings on: B follows, and pulls the settings that were pushed before B asked for them
    a.choose({ library: true, settings: true });
    await a.sync();
    await b.sync();
    await b.sync();
    expect(enabledCategories(b.store)).toEqual(new Set(["library", "settings"]));
    expect(b.store.get("themeMode")).toBe("dark");
    expect(b.store.get("quran:reading-goals:v1")).toBeNull(); // Progress is still off
    // A turns Settings off again: B stops syncing it, and a change on B is not pushed
    a.choose({ library: true });
    await a.sync();
    await b.sync();
    expect(enabledCategories(b.store)).toEqual(new Set(["library"]));
    b.store.set("themeMode", "light");
    const r = await b.sync();
    expect(r.pushed).toBe(0);
  });

  it("with all three off nothing but the toggles travels", async () => {
    const repo = memoryRepo();
    const a = device(repo, FULL);
    a.choose({});
    await a.sync();
    expect([...repo.rows.keys()].every((k) => k.includes("account.categories"))).toBe(true);
  });
});

describe("never", () => {
  it("nothing from a never key, or notificationsEnabled, ever reaches the server", async () => {
    const repo = memoryRepo();
    const a = device(repo, FULL);
    a.choose(ALL);
    await a.sync();
    const stored = JSON.stringify([...repo.rows.values()].map((r) => r.payload));
    expect(stored).not.toContain(NEVER_MARK);
    expect(stored).not.toContain("notificationsEnabled");
    expect(stored).not.toContain("31.5");
    for (const k of NEVER_KEYS) expect(stored).not.toContain(k);
  });
});

describe("failures", () => {
  const down = (status: number): Api => ({
    pull: async () => {
      throw new SyncHttpError(status);
    },
    push: async () => {
      throw new SyncHttpError(status);
    },
  });
  it("a server that cannot be reached leaves the device exactly as it was and says so", async () => {
    const repo = memoryRepo();
    const a = device(repo, FULL);
    a.choose(ALL);
    const before = JSON.stringify([...a.store.map]);
    const r = await a.sync({ api: down(503) });
    expect(r.status).toBe("unavailable");
    expect(JSON.stringify([...a.store.map])).toBe(before);
    const net = await a.sync({ api: down(0) });
    expect(net.status).toBe("unavailable");
  });
  it("a signed-out answer (401) is reported as unauthorized", async () => {
    const a = device(memoryRepo(), FULL);
    a.choose(ALL);
    expect((await a.sync({ api: down(401) })).status).toBe("unauthorized");
  });
  it("a record the server refuses is not sent again with the same bytes", async () => {
    const repo = memoryRepo();
    const a = device(repo, { "quran:read-surahs:v1": JSON.stringify({ v: 1, surahs: { "200": { completedAt: 1 }, "5": { completedAt: 2 } } }) });
    a.choose({ progress: true });
    const first = await a.sync();
    expect(first.pushed).toBe(2); // surah 5 and the toggles record; surah 200 is refused as an invalid key
    const second = await a.sync();
    expect(second.pushed).toBe(0);
    expect(Object.keys(a.state.current.rejected)).toHaveLength(1);
  });
});

describe("a user's data is theirs alone", () => {
  it("another user's pull never returns it", async () => {
    const repo = memoryRepo();
    const a = device(repo, FULL);
    a.choose(ALL);
    await a.sync();
    const other = await pull(repo, "someone-else", 0n, 500);
    expect(other.records).toEqual([]);
  });
});
