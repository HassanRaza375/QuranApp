// Fetch, validate, atomic swap, and the guarantees around the cache. Uses real AlAdhan fixtures and fake-indexeddb.
import "fake-indexeddb/auto";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPrayerMonth, getRevampDb, pruneOldPrayerMonths, putPrayerMonth, resetRevampDbForTests, REVAMP_DB_NAME, REVAMP_DB_VERSION } from "../app/db/revampDb";
import { normalizeMonthResponse, prayerMonthKey, type PrayerMonthRecord, type PrayerRequest } from "../app/lib/prayerMonth";
import { STALE_AFTER_MS, syncMonth, type SyncDeps } from "../app/lib/prayerSync";
import { setStorageBackend } from "../app/lib/storage";
import { memoryStore } from "./helpers";

const fixture = (name: string) => JSON.parse(fs.readFileSync(path.resolve(__dirname, "fixtures", name), "utf8"));
const REQ: PrayerRequest = { lat: 31.5204, lon: 74.3587, method: 2, school: 0, midnightMode: 0, month: "2026-10" };
const KEY = prayerMonthKey(REQ);

function makeDeps(over: Partial<SyncDeps> = {}) {
  const store = new Map<string, PrayerMonthRecord>();
  let clock = 1_000_000;
  const deps: SyncDeps & { store: Map<string, PrayerMonthRecord>; setNow(n: number): void; fetchJson: ReturnType<typeof vi.fn> } = {
    base: "https://api.aladhan.com/v1",
    fetchJson: vi.fn(async () => fixture("aladhan-lahore-2026-10-sunni.json")),
    get: async (k) => store.get(k),
    put: async (r) => void store.set(r.key, r),
    now: () => clock,
    store,
    setNow: (n) => (clock = n),
    ...over,
  } as never;
  return deps;
}

describe("syncMonth", () => {
  it("fetches, validates and stores a month; the second call uses the cache without fetching", async () => {
    const deps = makeDeps();
    const a = await syncMonth(deps, REQ);
    expect(a.status).toBe("updated");
    expect(deps.store.get(KEY)).toBeTruthy();
    expect(deps.fetchJson).toHaveBeenCalledTimes(1);
    expect(deps.fetchJson.mock.calls[0]![0]).toContain("/calendar/2026/10?latitude=31.52&longitude=74.36&method=2");
    const b = await syncMonth(deps, REQ);
    expect(b.status).toBe("cached");
    expect(deps.fetchJson).toHaveBeenCalledTimes(1);
  });

  it("refetches a month older than 30 days, and when forced", async () => {
    const deps = makeDeps();
    await syncMonth(deps, REQ);
    deps.setNow(1_000_000 + STALE_AFTER_MS + 1);
    expect((await syncMonth(deps, REQ)).status).toBe("updated");
    expect((await syncMonth(deps, REQ, { force: true })).status).toBe("updated");
    expect(deps.fetchJson).toHaveBeenCalledTimes(3);
  });

  it("offline: the old month stays, nothing is written, the failure says offline", async () => {
    const deps = makeDeps();
    await syncMonth(deps, REQ);
    const before = deps.store.get(KEY)!;
    deps.fetchJson.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const out = await syncMonth(deps, REQ, { force: true });
    expect(out).toMatchObject({ status: "failed", kind: "offline" });
    expect(out.status === "failed" && out.record).toBe(before);
    expect(deps.store.get(KEY)).toBe(before);
  });

  it("a bad response (short month, wrong code, out-of-order times) never replaces good times", async () => {
    const deps = makeDeps();
    await syncMonth(deps, REQ);
    const before = deps.store.get(KEY)!;
    const short = fixture("aladhan-lahore-2026-10-sunni.json");
    short.data.pop();
    const wrongCode = { ...fixture("aladhan-lahore-2026-10-sunni.json"), code: 500 };
    const swapped = fixture("aladhan-lahore-2026-10-sunni.json");
    [swapped.data[4].timings.Fajr, swapped.data[4].timings.Isha] = [swapped.data[4].timings.Isha, swapped.data[4].timings.Fajr];
    for (const bad of [short, wrongCode, swapped, null, "html error page"]) {
      deps.fetchJson.mockResolvedValueOnce(bad);
      const out = await syncMonth(deps, REQ, { force: true });
      expect(out.status).toBe("failed");
      expect(deps.store.get(KEY)).toBe(before);
    }
  });

  it("HTTP errors (rate limit, server error) keep the old month", async () => {
    const deps = makeDeps();
    await syncMonth(deps, REQ);
    const before = deps.store.get(KEY)!;
    deps.fetchJson.mockRejectedValueOnce(new Error("HTTP 429"));
    const out = await syncMonth(deps, REQ, { force: true });
    expect(out).toMatchObject({ status: "failed", kind: "error", reason: "HTTP 429" });
    expect(deps.store.get(KEY)).toBe(before);
  });

  it("a failed save keeps the old month and reports it", async () => {
    const deps = makeDeps();
    await syncMonth(deps, REQ);
    const before = deps.store.get(KEY)!;
    deps.put = async () => {
      throw new Error("quota exceeded");
    };
    const out = await syncMonth(deps, REQ, { force: true });
    expect(out).toMatchObject({ status: "failed", reason: expect.stringContaining("quota exceeded") });
    expect(deps.store.get(KEY)).toBe(before);
  });

  it("no data at all and a failure: failed with no record (the UI shows 'needs a connection once')", async () => {
    const deps = makeDeps({ fetchJson: vi.fn(async () => Promise.reject(new TypeError("offline"))) as never });
    const out = await syncMonth(deps, REQ);
    expect(out).toMatchObject({ status: "failed", kind: "offline" });
    expect(out.status === "failed" && out.record).toBeUndefined();
  });

  it("one request per key at a time (two calls, one fetch)", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const deps = makeDeps({ fetchJson: vi.fn(async () => (await gate, fixture("aladhan-lahore-2026-10-sunni.json"))) as never });
    const p1 = syncMonth(deps, REQ);
    const p2 = syncMonth(deps, REQ);
    release();
    const [a, b] = await Promise.all([p1, p2]);
    expect(a).toBe(b);
    expect(deps.fetchJson).toHaveBeenCalledTimes(1);
  });

  it("different months or methods are different keys and fetch separately", async () => {
    const deps = makeDeps();
    await syncMonth(deps, REQ);
    deps.fetchJson.mockResolvedValueOnce(fixture("aladhan-lahore-2026-10-jafari.json"));
    await syncMonth(deps, { ...REQ, method: 0, midnightMode: 1 });
    expect(deps.store.size).toBe(2);
  });
});

describe("the revamp database (fake-indexeddb)", () => {
  const wipe = () =>
    new Promise<void>((done) => {
      const r = indexedDB.deleteDatabase(REVAMP_DB_NAME);
      r.onsuccess = r.onerror = r.onblocked = () => done();
    });
  beforeEach(async () => {
    await resetRevampDbForTests();
    await wipe();
  });
  afterEach(() => resetRevampDbForTests());

  const record = (over: Partial<PrayerMonthRecord> = {}): PrayerMonthRecord => {
    const r = normalizeMonthResponse(fixture("aladhan-lahore-2026-10-sunni.json"), REQ, 1);
    if (!r.ok) throw new Error(r.reason);
    return { ...r.record, ...over };
  };

  it("stores and reads a month", async () => {
    await putPrayerMonth(record());
    const got = await getPrayerMonth(KEY);
    expect(got?.days).toHaveLength(31);
  });

  it("a failing write leaves the old month exactly as it was (atomic swap)", async () => {
    const good = record({ fetchedAt: 111 });
    await putPrayerMonth(good);
    const poisoned = record({ fetchedAt: 222 }) as PrayerMonthRecord & { boom?: unknown };
    poisoned.boom = () => undefined; // a function cannot be stored: the transaction fails
    await expect(putPrayerMonth(poisoned)).rejects.toThrow();
    const after = await getPrayerMonth(KEY);
    expect(after?.fetchedAt).toBe(111);
    expect(after?.days).toHaveLength(31);
  });

  it("opens ONLY quran-revamp-db: the legacy quran-app-db is never opened, created or version-bumped", async () => {
    const opened: Array<[string, number | undefined]> = [];
    const realOpen = indexedDB.open.bind(indexedDB);
    const spy = vi.spyOn(indexedDB, "open").mockImplementation(((name: string, version?: number) => (opened.push([name, version]), realOpen(name, version))) as never);
    await putPrayerMonth(record());
    await getPrayerMonth(KEY);
    await pruneOldPrayerMonths("2026-01");
    spy.mockRestore();
    expect(new Set(opened.map(([n]) => n))).toEqual(new Set([REVAMP_DB_NAME]));
    expect(opened.every(([, v]) => v === REVAMP_DB_VERSION)).toBe(true);
    const dbs = await indexedDB.databases();
    expect(dbs.map((d) => d.name)).not.toContain("quran-app-db");
  });

  it("prunes months older than the cut-off and keeps the rest", async () => {
    await putPrayerMonth(record({ key: "prayer:v1:a", month: "2026-05" }));
    await putPrayerMonth(record({ key: "prayer:v1:b", month: "2026-09" }));
    await putPrayerMonth(record({ key: "prayer:v1:c", month: "2026-10" }));
    expect(await pruneOldPrayerMonths("2026-08")).toBe(1);
    expect(await getPrayerMonth("prayer:v1:a")).toBeUndefined();
    expect(await getPrayerMonth("prayer:v1:b")).toBeTruthy();
  });

  it("an unreadable database gives undefined, never a throw", async () => {
    await getRevampDb();
    await resetRevampDbForTests();
    const real = indexedDB.open;
    indexedDB.open = (() => {
      throw new Error("blocked");
    }) as never;
    try {
      expect(await getPrayerMonth(KEY)).toBeUndefined();
    } finally {
      indexedDB.open = real;
    }
  });
});

describe("the legacy day-keyed prayer_* keys are never written", () => {
  it("a full sync, with a storage backend that throws on any prayer_* or calendar_v2_* write", async () => {
    const guarded = memoryStore();
    const set = guarded.setItem;
    guarded.setItem = (k, v) => {
      if (/^(prayer_|calendar_v2_|last_location)/.test(k)) throw new Error(`illegal write to legacy key ${k}`);
      set(k, v);
    };
    setStorageBackend(guarded);
    try {
      const deps = makeDeps();
      expect((await syncMonth(deps, REQ)).status).toBe("updated");
      expect((await syncMonth(deps, REQ, { force: true })).status).toBe("updated");
      expect([...guarded.data.keys()]).toEqual([]); // the sync touches no localStorage at all
    } finally {
      setStorageBackend(null);
    }
  });
});
