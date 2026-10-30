// New versus returning user, the resume rows, today's goal, bookmarks (legacy format), location, qibla, nav state.
import { afterEach, describe, expect, it } from "vitest";
import { addBookmark, ADDED_AT_KEY, ayahBookmarkKey, BOOKMARKS_KEY, hasBookmark, removeBookmark } from "../app/lib/bookmarks";
import { goalToday } from "../app/lib/goalToday";
import { applyFix, distanceKm, LEGACY_LOCATION_KEY, LOCATION_KEY, readLocation, saveLocation } from "../app/lib/location";
import { groupForPath, isActive, NAV, titleForPath } from "../app/lib/nav";
import { normalizeNavOpen } from "../app/lib/navState";
import { qiblaBearing } from "../app/lib/qibla";
import { continueReadingHref, latestStudy, readingRow } from "../app/lib/resume";
import { setStorageBackend } from "../app/lib/storage";
import { detectUserState, HISTORY_KEYS } from "../app/lib/userState";
import { AYAH_LENGTHS } from "../app/data/ayahLengths.generated";
import { memoryStore } from "./helpers";

afterEach(() => setStorageBackend(null));
const COUNTS = AYAH_LENGTHS.map((s) => s.length);
const state = (values: Record<string, unknown>) => detectUserState((k) => values[k] ?? null);

describe("detectUserState (new vs returning, from the legacy keys)", () => {
  it("a first run is new", () => {
    expect(state({})).toMatchObject({ returning: false });
  });

  it("each kind of history makes the user returning", () => {
    expect(state({ [HISTORY_KEYS.readingProgress]: { surahNo: 2, ayahNo: 5 } }).returning).toBe(true);
    expect(state({ [HISTORY_KEYS.personsStudy]: { nuh: { lastSection: "notes" } } }).returning).toBe(true);
    expect(state({ [HISTORY_KEYS.bookmarks]: ["ayah:2:255"] }).returning).toBe(true);
    expect(state({ [HISTORY_KEYS.readingGoals]: { goals: [{ id: "g" }] } }).returning).toBe(true);
    expect(state({ [HISTORY_KEYS.hifzV2]: { targets: [{ id: "t" }] } }).returning).toBe(true);
    expect(state({ [HISTORY_KEYS.hifzV1]: [{ id: "old" }] }).returning).toBe(true);
    expect(state({ [HISTORY_KEYS.library]: { collections: [{ id: "c" }], itemMeta: {} } }).returning).toBe(true);
    expect(state({ [HISTORY_KEYS.library]: { collections: [], itemMeta: { "ayah:1:1": { note: "x" } } } }).returning).toBe(true);
    expect(state({ [HISTORY_KEYS.downloads]: [{ surahNo: 1 }] }).returning).toBe(true);
  });

  it("empty, corrupt and wrong-shaped values do not count", () => {
    expect(
      state({
        [HISTORY_KEYS.readingProgress]: null,
        [HISTORY_KEYS.personsStudy]: {},
        [HISTORY_KEYS.bookmarks]: [],
        [HISTORY_KEYS.readingGoals]: { goals: [] },
        [HISTORY_KEYS.hifzV2]: { targets: [] },
        [HISTORY_KEYS.library]: { collections: [], itemMeta: {} },
        [HISTORY_KEYS.downloads]: [],
      }).returning,
    ).toBe(false);
    expect(state({ [HISTORY_KEYS.readingProgress]: "oops" }).returning).toBe(false);
    expect(state({ [HISTORY_KEYS.readingProgress]: { surahNo: 999 } }).returning).toBe(false);
    expect(state({ [HISTORY_KEYS.bookmarks]: "x" }).returning).toBe(false);
    expect(state({ [HISTORY_KEYS.personsStudy]: [] }).returning).toBe(false);
  });

  it("reports which kinds exist (a mixed state)", () => {
    const s = state({ [HISTORY_KEYS.readingProgress]: { surahNo: 1, ayahNo: 3 } });
    expect(s.has).toMatchObject({ readingProgress: true, personsStudy: false, hifz: false, goal: false });
  });

  it("opening the app alone (the ayah-of-day entry) does not make a user returning", () => {
    expect(state({ "ayah-of-day": { date: "2026-10-15", data: {} } }).returning).toBe(false);
  });
});

describe("resume rows", () => {
  it("reading row: title, percent and link (Al-Baqarah ayah 285 of 286 is about 5%)", () => {
    const r = readingRow({ surahNo: 2, ayahNo: 285, surahName: "Al-Baqarah", totalAyah: 286 }, COUNTS)!;
    expect(r.title).toBe("Al-Baqarah · ayah 285 of 286");
    expect(r.meta).toBe("5% of the Qur’an completed");
    expect(r.href).toBe("/surah/2#ayah-285");
  });

  it("percent is position over 6,236 ayahs", () => {
    expect(readingRow({ surahNo: 114, ayahNo: 6, surahName: "x" }, COUNTS)!.meta).toBe("100% of the Qur’an completed");
    expect(readingRow({ surahNo: 1, ayahNo: 1, surahName: "x" }, COUNTS)!.meta).toBe("Just started");
  });

  it("a record that is not usable gives no row (so the new-user row shows)", () => {
    for (const bad of [null, "x", {}, { surahNo: 2 }, { surahNo: 200, ayahNo: 1 }, { surahNo: 2, ayahNo: 9999 }, { surahNo: 2, ayahNo: 0 }, { surahNo: 2.5, ayahNo: 1 }]) {
      expect(readingRow(bad, COUNTS), JSON.stringify(bad)).toBeNull();
    }
  });

  it("study row: the most recent state worth resuming, skipping a bare overview", () => {
    const rec = {
      adam: { personId: "adam", lastSection: "key-lessons", updatedAt: 100 },
      nuh: { personId: "nuh", lastSection: "notes", updatedAt: 300 },
      yusuf: { personId: "yusuf", lastSection: "overview", updatedAt: 900 }, // nothing meaningful yet: skipped
      musa: { personId: "musa", lastSection: "overview", lastSurahNo: 20, updatedAt: 200 },
    };
    expect(latestStudy(rec)).toMatchObject({ personId: "nuh", lastSection: "notes" });
    expect(latestStudy({ yusuf: rec.yusuf })).toBeNull();
    expect(latestStudy({})).toBeNull();
    expect(latestStudy(null)).toBeNull();
    expect(latestStudy([])).toBeNull();
    expect(latestStudy({ x: { lastSection: 3 } })).toBeNull();
  });

  it("continueReadingHref only with usable progress", () => {
    expect(continueReadingHref({ surahNo: 18, ayahNo: 10 })).toBe("/surah/18#ayah-10");
    expect(continueReadingHref(null)).toBeNull();
    expect(continueReadingHref({ surahNo: 0, ayahNo: 1 })).toBeNull();
    expect(continueReadingHref({ surahNo: 3 })).toBeNull();
  });
});

describe("goalToday: an ayah count only", () => {
  const goals = { goals: [{ id: "g1", status: "active", dailyAyahTarget: 494 }, { id: "g2", status: "paused", dailyAyahTarget: 10 }], activeGoalId: "g1", dailyLog: { "2026-10-15": ["2:1", "2:2", "2:3"], "2026-10-14": ["1:1"] } };
  it("today's unique ayahs over the active goal's own target", () => {
    expect(goalToday(goals, "2026-10-15")).toEqual({ count: 3, target: 494 });
    expect(goalToday(goals, "2026-10-16")).toEqual({ count: 0, target: 494 });
  });
  it("not set when there is no active goal or a bad target", () => {
    expect(goalToday(null, "2026-10-15")).toBeNull();
    expect(goalToday({ goals: [], activeGoalId: null }, "2026-10-15")).toBeNull();
    expect(goalToday({ ...goals, activeGoalId: "g2" }, "2026-10-15")).toBeNull(); // paused
    expect(goalToday({ ...goals, goals: [{ id: "g1", status: "active", dailyAyahTarget: 0 }] }, "2026-10-15")).toBeNull();
  });
  it("returns only a count and a target (no streak, no pace)", () => {
    expect(Object.keys(goalToday(goals, "2026-10-15")!).sort()).toEqual(["count", "target"]);
  });
});

describe("bookmarks keep the legacy format", () => {
  const use = (initial: Record<string, string> = {}) => {
    const s = memoryStore(initial);
    setStorageBackend(s);
    return s;
  };

  it("adds an ayah key to the array and the first-bookmarked time to the map, once", () => {
    const s = use({ [BOOKMARKS_KEY]: '["surah:2"]', [ADDED_AT_KEY]: '{"surah:2":1}' });
    addBookmark(ayahBookmarkKey(30, 7), 1000);
    addBookmark(ayahBookmarkKey(30, 7), 2000); // again: no duplicate, time kept
    expect(JSON.parse(s.data.get(BOOKMARKS_KEY)!)).toEqual(["surah:2", "ayah:30:7"]);
    expect(JSON.parse(s.data.get(ADDED_AT_KEY)!)).toEqual({ "surah:2": 1, "ayah:30:7": 1000 });
    expect(hasBookmark("ayah:30:7")).toBe(true);
  });

  it("removes from both, leaving other keys alone; undo (add again) restores it", () => {
    const s = use({ [BOOKMARKS_KEY]: '["surah:2","ayah:30:7"]', [ADDED_AT_KEY]: '{"surah:2":1,"ayah:30:7":5}' });
    removeBookmark("ayah:30:7");
    expect(JSON.parse(s.data.get(BOOKMARKS_KEY)!)).toEqual(["surah:2"]);
    expect(JSON.parse(s.data.get(ADDED_AT_KEY)!)).toEqual({ "surah:2": 1 });
    addBookmark("ayah:30:7", 9);
    expect(hasBookmark("ayah:30:7")).toBe(true);
  });

  it("starts from nothing, and from corrupt values", () => {
    const s = use({ [BOOKMARKS_KEY]: "{broken", [ADDED_AT_KEY]: "[1]" });
    addBookmark("ayah:1:1", 7);
    expect(JSON.parse(s.data.get(BOOKMARKS_KEY)!)).toEqual(["ayah:1:1"]);
    expect(JSON.parse(s.data.get(ADDED_AT_KEY)!)).toEqual({ "ayah:1:1": 7 });
  });

  it("the key format is ayah:<surah>:<ayah>", () => {
    expect(ayahBookmarkKey(2, 255)).toBe("ayah:2:255");
  });
});

describe("location: no default city; the legacy key is read, never written", () => {
  const use = (initial: Record<string, string> = {}) => {
    const writes: string[] = [];
    const s = memoryStore(initial);
    const wrapped = { ...s, setItem: (k: string, v: string) => (writes.push(k), s.setItem(k, v)) };
    setStorageBackend(wrapped);
    return { s, writes };
  };

  it("none saved: null (the tiles say Set location; there is no fallback city)", () => {
    use();
    expect(readLocation()).toBeNull();
  });

  it("reads the legacy last_location ({lat, lng}) read-only", () => {
    const { writes } = use({ [LEGACY_LOCATION_KEY]: '{"lat":31.5204,"lng":74.3587}' });
    expect(readLocation()).toMatchObject({ lat: 31.5204, lon: 74.3587, source: "legacy" });
    expect(writes).toEqual([]);
  });

  it("the revamp's own saved location wins over the legacy one", () => {
    use({ [LOCATION_KEY]: '{"lat":51.5,"lon":-0.12,"source":"device","updatedAt":5}', [LEGACY_LOCATION_KEY]: '{"lat":31.5,"lng":74.3}' });
    expect(readLocation()).toMatchObject({ lat: 51.5, lon: -0.12, source: "device" });
  });

  it("ignores corrupt or out-of-range values", () => {
    for (const v of ["{oops", '{"lat":"a","lng":1}', '{"lat":999,"lng":1}', "null", "[]"]) {
      use({ [LEGACY_LOCATION_KEY]: v });
      expect(readLocation(), v).toBeNull();
    }
  });

  it("saving writes only the new key", () => {
    const { writes } = use({ [LEGACY_LOCATION_KEY]: '{"lat":1,"lng":1}' });
    saveLocation({ lat: 10, lon: 20, source: "device", updatedAt: 1 });
    expect(writes).toEqual([LOCATION_KEY]);
  });

  it("a new fix inside 10 km keeps the saved place (so GPS jitter never changes the cache key); beyond 10 km replaces it", () => {
    const here = { lat: 31.5204, lon: 74.3587, source: "device" as const, updatedAt: 1 };
    expect(applyFix(here, { lat: 31.5204 + 0.05, lon: 74.3587 }, 2)).toBe(here); // about 5.5 km
    const moved = applyFix(here, { lat: 31.5204 + 0.2, lon: 74.3587 }, 3); // about 22 km
    expect(moved).not.toBe(here);
    expect(moved.updatedAt).toBe(3);
    expect(applyFix(null, { lat: 1, lon: 2 }, 4)).toMatchObject({ lat: 1, lon: 2, source: "device" });
  });

  it("distanceKm: Lahore to Karachi is about 1,030 km", () => {
    const d = distanceKm({ lat: 31.5204, lon: 74.3587 }, { lat: 24.8607, lon: 67.0011 });
    expect(d).toBeGreaterThan(1000);
    expect(d).toBeLessThan(1060);
  });
});

describe("qiblaBearing", () => {
  it("matches published bearings", () => {
    expect(qiblaBearing(51.5074, -0.1278)).toBeCloseTo(118.99, 0); // London
    expect(qiblaBearing(40.7128, -74.006)).toBeCloseTo(58.48, 0); // New York
    expect(qiblaBearing(-6.2088, 106.8456)).toBeGreaterThan(294); // Jakarta, about 295
    expect(qiblaBearing(-6.2088, 106.8456)).toBeLessThan(296);
  });
  it("is within 0 to 360", () => {
    for (const [la, lo] of [[0, 0], [89, 10], [-89, -170], [31.5, 74.3]] as const) {
      const b = qiblaBearing(la, lo);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThan(360);
    }
  });
});

describe("nav structure and state", () => {
  it("Read is open by default; nothing else is", () => {
    expect(normalizeNavOpen(null)).toEqual({ read: true });
    expect(normalizeNavOpen({ read: false, study: true, bogus: true })).toEqual({ read: false, study: true });
    expect(normalizeNavOpen("x")).toEqual({ read: true });
  });
  it("Study holds Library and Downloads; four groups (Poets is deferred, no nav row)", () => {
    expect(NAV.map((g) => g.id)).toEqual(["read", "study", "knowledge", "worship"]);
    const study = NAV.find((g) => g.id === "study")!.items.map((i) => i.label);
    expect(study).toContain("Library");
    expect(study).toContain("Downloads");
  });
  it("finds the group of the current page and a header title for every route", () => {
    expect(groupForPath("/bookmarks")).toBe("study");
    expect(groupForPath("/surah/2")).toBeNull(); // not a nav row of its own
    expect(groupForPath("/persons/nuh")).toBe("knowledge");
    expect(groupForPath("/")).toBeNull();
    expect(titleForPath("/")).toBe("Home");
    expect(titleForPath("/persons/nuh")).toBe("Prophets & People");
    expect(titleForPath("/settings")).toBe("Settings");
    expect(titleForPath("/foundation")).toBe("Foundation check");
    expect(titleForPath("/nope")).toBe("Quran App");
    expect(isActive("/", "/about")).toBe(false);
  });
});
