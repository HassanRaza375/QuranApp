// The reader's pure logic: chapter validation, bismillah rules, the cache order and failure cases, the new keys, the legacy
// progress record, and the safety of the tafsir text. Chapters here are synthetic (right counts, obviously fake text).
import "fake-indexeddb/auto";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CHAPTERS, closeRevampDb, getCached, getRevampDb, putCached, REVAMP_DB_NAME, TAFSIRS } from "../app/db/revampDb";
import { bismillahFrom, ChapterError, parseAyahHash, parseChapter, parseSurahParam, parseTafsir, showsBismillah } from "../app/lib/chapter";
import { goalToday } from "../app/lib/goalToday";
import { GOALS_KEY, recordAyahsRead } from "../app/lib/goalLog";
import { PINS_KEY, readReadingPin, writeReadingPin } from "../app/lib/pins";
import { effectiveTranslationLang } from "../app/lib/preferences";
import { loadChapter, loadTafsir, type TextDeps } from "../app/lib/quranText";
import { READER_PREFS_KEY, readReaderPrefs, readerTranslation, setTranslationOff } from "../app/lib/readerPrefs";
import { PROGRESS_KEY, writeProgress } from "../app/lib/readingProgress";
import { markRead, markUnread, READ_SURAHS_KEY, readCompleted } from "../app/lib/readSurahs";
import { ayahShareText } from "../app/lib/shareText";
import { setStorageBackend, getJSON, getRaw, setRaw } from "../app/lib/storage";
import { tafsirHtml } from "../app/lib/tafsirHtml";
import { fakeChapter, fakeTafsir } from "../e2e/mocks";
import { memoryStore } from "./helpers";

afterEach(() => setStorageBackend(null));

describe("parseChapter", () => {
  it("accepts a complete response, using the bundled names, and a stored record in our own field names", () => {
    const c = parseChapter(fakeChapter(2), 2);
    expect(c).toMatchObject({ n: 2, name: "Al-Baqara", en: "The Cow", total: 286, place: "Madina", arLong: "TEST LONG 2" });
    expect(c.arabic1).toHaveLength(286);
    expect(parseChapter(c, 2)).toEqual(c); // what is stored reads back unchanged
  });
  it("rejects anything incomplete, with a reason, and never returns half a surah", () => {
    const good = fakeChapter(112);
    const bad: unknown[] = [
      null,
      "x",
      [],
      { ...good, surahNo: 111 },
      { ...good, totalAyah: 5 },
      { ...good, english: good.english.slice(1) },
      { ...good, urdu: undefined },
      { ...good, arabic1: [...good.arabic1.slice(0, 3), 7] },
      { ...good, bengali: "text" },
    ];
    for (const b of bad) expect(() => parseChapter(b, 112), JSON.stringify(b)?.slice(0, 60)).toThrow(ChapterError);
    expect(() => parseChapter(good, 0)).toThrow(ChapterError);
    expect(() => parseChapter(good, 115)).toThrow(ChapterError);
  });
});

describe("route and hash", () => {
  it("accepts surah 1 to 114 only", () => {
    expect(parseSurahParam("1")).toBe(1);
    expect(parseSurahParam("114")).toBe(114);
    for (const v of ["0", "115", "abc", "", "1.5", "-2", "02x", undefined, null, 7]) expect(parseSurahParam(v as never), String(v)).toBeNull();
    expect(parseSurahParam(["5"])).toBe(5);
  });
  it("accepts #ayah-N inside the surah and ignores anything else", () => {
    expect(parseAyahHash("#ayah-255", 286)).toBe(255);
    expect(parseAyahHash("#ayah-1", 7)).toBe(1);
    for (const h of ["#ayah-0", "#ayah-8", "#ayah-999", "#ayah-", "#ayah-x", "#other", "", "ayah-3"]) expect(parseAyahHash(h, 7), h).toBeNull();
  });
});

describe("bismillah", () => {
  it("shows above surahs 2 to 114 except 9, never above 1", () => {
    const shown = Array.from({ length: 114 }, (_, i) => i + 1).filter(showsBismillah);
    expect(shown).toHaveLength(112);
    expect(shown).not.toContain(1);
    expect(shown).not.toContain(9);
    expect(shown[0]).toBe(2);
    expect(shown.at(-1)).toBe(114);
  });
  it("is read from the data of surah 1, and is null when that is not loaded (never typed)", () => {
    const one = parseChapter(fakeChapter(1), 1);
    expect(bismillahFrom(one)).toBe("TEST ARABIC 1:1");
    expect(bismillahFrom(null)).toBeNull();
    expect(bismillahFrom(parseChapter(fakeChapter(2), 2))).toBeNull(); // only chapter 1 counts
    // no Arabic bismillah string exists anywhere in the app source
    const bism = "بِسْمِ";
    const root = path.resolve(__dirname, "../app");
    const hits: string[] = [];
    const walk = (d: string) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(vue|ts)$/.test(e.name) && !e.name.endsWith(".generated.ts") && fs.readFileSync(p, "utf8").includes(bism)) hits.push(p);
      }
    };
    walk(root);
    expect(hits).toEqual([]);
  });
});

describe("tafsir", () => {
  it("parses the three sources and the group note", () => {
    const t = parseTafsir(fakeTafsir(2, 255));
    expect(t.map((x) => x.author)).toEqual(["Ibn Kathir", "Maarif Ul Quran", "Tazkirul Quran"]);
    expect(t[0]!.groupVerse).toBeNull();
    expect(t[2]!.groupVerse).toContain("2:255 to 2:257");
    expect(() => parseTafsir({})).toThrow(ChapterError);
    expect(() => parseTafsir({ tafsirs: [{ author: "x" }] })).toThrow(ChapterError);
  });
  it("markup in the source text stays text (escape first), and our own tags are the only tags", () => {
    const html = tafsirHtml(fakeTafsir(2, 255).tafsirs[0]!.content);
    expect(html).not.toMatch(/<script/i);
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;b&gt;not markup&lt;/b&gt;");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain('<h5 class="tafsir-heading">');
    expect(tafsirHtml("")).toBe("");
    expect(tafsirHtml('<img src=x onerror="alert(1)">')).not.toContain("<img");
  });
});

/** Dependencies recorded in memory. */
function deps(over: Partial<TextDeps> = {}) {
  const calls: string[] = [];
  const store = new Map<string, unknown>();
  const d: TextDeps = {
    readChapter: async (n) => (calls.push(`read:${n}`), store.get(`c${n}`)),
    writeChapter: async (n, c) => (calls.push(`write:${n}`), void store.set(`c${n}`, c)),
    fetchChapter: async (n) => (calls.push(`fetch:${n}`), fakeChapter(n)),
    readTafsir: async (k) => (calls.push(`readT:${k}`), store.get(`t${k}`)),
    writeTafsir: async (k, e) => (calls.push(`writeT:${k}`), void store.set(`t${k}`, e)),
    fetchTafsir: async (s, a) => (calls.push(`fetchT:${s}_${a}`), fakeTafsir(s, a)),
    ...over,
  };
  return { d, calls, store };
}

describe("loading a surah (cache, network, cache fill)", () => {
  it("cold: reads the cache, fetches, then writes; warm: reads only (no request)", async () => {
    const { d, calls } = deps();
    const cold = await loadChapter(7, d);
    expect(cold.from).toBe("network");
    expect(calls).toEqual(["read:7", "fetch:7", "write:7"]);
    calls.length = 0;
    const warm = await loadChapter(7, d);
    expect(warm.from).toBe("cache");
    expect(calls).toEqual(["read:7"]);
    expect(warm.value).toEqual(cold.value);
  });
  it("a damaged cached record is replaced by a fresh fetch", async () => {
    const { d, calls, store } = deps();
    store.set("c3", { surahNo: 3, totalAyah: 200, english: ["short"] });
    const r = await loadChapter(3, d);
    expect(r.from).toBe("network");
    expect(calls).toEqual(["read:3", "fetch:3", "write:3"]);
  });
  it("an invalid response is rejected and NOT stored", async () => {
    const { d, calls } = deps({ fetchChapter: async () => ({ ...fakeChapter(5), english: [] }) });
    await expect(loadChapter(5, d)).rejects.toMatchObject({ kind: "invalid" });
    expect(calls).not.toContain("write:5");
  });
  it("no answer is 'unavailable'; a 404 is 'missing'; a cache that fails is only a miss; a failed write never throws", async () => {
    const offline = deps({ fetchChapter: async () => Promise.reject(new TypeError("Failed to fetch")) });
    await expect(loadChapter(2, offline.d)).rejects.toMatchObject({ kind: "unavailable" });
    const gone = deps({ fetchChapter: async () => Promise.reject(Object.assign(new Error("nf"), { statusCode: 404 })) });
    await expect(loadChapter(2, gone.d)).rejects.toMatchObject({ kind: "missing" });
    const brokenCache = deps({ readChapter: async () => Promise.reject(new Error("idb")), writeChapter: async () => Promise.reject(new Error("quota")) });
    const r = await loadChapter(2, brokenCache.d);
    expect(r.from).toBe("network");
    expect(r.value.total).toBe(286);
  });
  it("tafsir: the same order, one request per ayah, all sources in one response", async () => {
    const { d, calls } = deps();
    const a = await loadTafsir(2, 255, d);
    expect(a.from).toBe("network");
    expect(a.value).toHaveLength(3);
    expect(calls).toEqual(["readT:2_255", "fetchT:2_255", "writeT:2_255"]);
    calls.length = 0;
    expect((await loadTafsir(2, 255, d)).from).toBe("cache");
    expect(calls).toEqual(["readT:2_255"]);
  });
  it("tafsir failures are unavailable or missing, never a half result", async () => {
    const off = deps({ fetchTafsir: async () => Promise.reject(new TypeError("Failed to fetch")) });
    await expect(loadTafsir(1, 1, off.d)).rejects.toMatchObject({ kind: "unavailable" });
    const bad = deps({ fetchTafsir: async () => ({ tafsirs: "nope" }) });
    await expect(loadTafsir(1, 1, bad.d)).rejects.toMatchObject({ kind: "invalid" });
  });
});

describe("the revamp database, version 2", () => {
  beforeEach(async () => {
    await closeRevampDb();
    indexedDB.deleteDatabase(REVAMP_DB_NAME);
  });
  afterEach(async () => {
    await closeRevampDb();
  });

  it("upgrading from version 1 keeps the prayer months and adds the two text stores", async () => {
    // build a version-1 database the way Phase 1 did
    const { openDB } = await import("idb");
    const v1 = await openDB(REVAMP_DB_NAME, 1, { upgrade: (db) => void db.createObjectStore("prayer-months") });
    await v1.put("prayer-months", { key: "k", month: "2026-10" }, "k");
    v1.close();
    const db = await getRevampDb();
    expect(db.version).toBe(2);
    expect([...db.objectStoreNames].sort()).toEqual([CHAPTERS, "prayer-months", TAFSIRS].sort());
    expect(await db.get("prayer-months", "k")).toEqual({ key: "k", month: "2026-10" });
  });
  it("round-trips chapters and tafsirs; a miss is undefined", async () => {
    expect(await getCached(CHAPTERS, 2)).toBeUndefined();
    const c = parseChapter(fakeChapter(2), 2);
    await putCached(CHAPTERS, 2, c);
    expect(await getCached(CHAPTERS, 2)).toEqual(c);
    await putCached(TAFSIRS, "2_255", [{ author: "x", groupVerse: null, content: "y" }]);
    expect(await getCached(TAFSIRS, "2_255")).toEqual([{ author: "x", groupVerse: null, content: "y" }]);
  });
  it("never opens quran-app-db (the legacy database), at run time or in the source", async () => {
    const opened: string[] = [];
    const real = indexedDB.open.bind(indexedDB);
    indexedDB.open = ((name: string, version?: number) => (opened.push(name), real(name, version))) as typeof indexedDB.open;
    try {
      await putCached(CHAPTERS, 1, parseChapter(fakeChapter(1), 1));
      await getCached(TAFSIRS, "1_1");
    } finally {
      indexedDB.open = real;
    }
    expect(opened).toEqual([REVAMP_DB_NAME]);
    // and no line of code (outside comments) in the app mentions it
    const root = path.resolve(__dirname, "../app");
    const offenders: string[] = [];
    const walk = (d: string) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(vue|ts|js)$/.test(e.name)) {
          fs.readFileSync(p, "utf8")
            .split("\n")
            .forEach((l, i) => {
              if (l.includes("quran-app-db") && !/^\s*(\/\/|\*|\/\*)/.test(l)) offenders.push(`${path.relative(root, p)}:${i + 1}`);
            });
        }
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });
});

describe("reader preferences and the translation shown", () => {
  it("Off is its own key, separate from translationDefaultLang", () => {
    setStorageBackend(memoryStore({ translationDefaultLang: "urdu" }));
    expect(readReaderPrefs()).toEqual({});
    setTranslationOff(true);
    expect(getJSON(READER_PREFS_KEY, null)).toEqual({ translation: "off" });
    expect(getRaw("translationDefaultLang")).toBe("urdu"); // untouched
    expect(readReaderPrefs()).toEqual({ translation: "off" });
    setTranslationOff(false);
    expect(readReaderPrefs()).toEqual({});
  });
  it("keeps other fields in the record, and reads damage as empty", () => {
    setStorageBackend(memoryStore({ [READER_PREFS_KEY]: JSON.stringify({ translation: "off", other: 1 }) }));
    setTranslationOff(false);
    expect(getJSON(READER_PREFS_KEY, null)).toEqual({ translation: null, other: 1 });
    setStorageBackend(memoryStore({ [READER_PREFS_KEY]: "{broken" }));
    expect(readReaderPrefs()).toEqual({});
  });
  it("Off wins; else the explicit choice; else the old reader tab; else English", () => {
    const p = (translationLang: never, verseDisplay: never) => ({ translationLang, verseDisplay });
    expect(readerTranslation(p("urdu", "arabic1"), { translation: "off" })).toBeNull();
    expect(readerTranslation(p("urdu", "english"), {})).toBe("urdu");
    expect(readerTranslation(p(null, "bengali"), {})).toBe("bengali");
    expect(readerTranslation(p(null, "arabic1"), {})).toBe("english");
    expect(effectiveTranslationLang(p(null, "arabic2"))).toBeNull();
    expect(readerTranslation(p(null, "arabic2"), {})).toBe("english");
  });
});

describe("the Completed marker (quran:read-surahs:v1)", () => {
  it("marks and unmarks, keeps the first time, and ignores damage", () => {
    setStorageBackend(memoryStore());
    expect(readCompleted().size).toBe(0);
    expect(markRead(2, 1000)).toBe(true);
    markRead(2, 9999);
    markRead(114, 2000);
    expect(readCompleted().get(2)).toBe(1000);
    expect(getJSON(READ_SURAHS_KEY, null)).toEqual({ v: 1, surahs: { "2": { completedAt: 1000 }, "114": { completedAt: 2000 } } });
    markUnread(2);
    expect([...readCompleted().keys()]).toEqual([114]);
    expect(markRead(0)).toBe(false);
    expect(markRead(115)).toBe(false);
  });
  it("drops entries that are not a real surah with a time, and keeps unknown fields", () => {
    setStorageBackend(memoryStore({ [READ_SURAHS_KEY]: JSON.stringify({ v: 1, future: "x", surahs: { "2": { completedAt: 5 }, "0": { completedAt: 1 }, "999": { completedAt: 1 }, "3": { completedAt: "no" }, "4": null } }) }));
    expect([...readCompleted()]).toEqual([[2, 5]]);
    markRead(5, 7);
    expect(getJSON<Record<string, unknown>>(READ_SURAHS_KEY, {}).future).toBe("x");
    setStorageBackend(memoryStore({ [READ_SURAHS_KEY]: "garbage" }));
    expect(readCompleted().size).toBe(0);
    expect(markRead(1, 3)).toBe(true);
  });
});

describe("the pin (quran:pins:v1)", () => {
  it("writes one reading pin, replaces it, clears it, and validates what it reads", () => {
    setStorageBackend(memoryStore());
    expect(readReadingPin()).toBeNull();
    writeReadingPin({ surahNo: 2, ayahNo: 255, pinnedAt: 10 });
    expect(readReadingPin()).toEqual({ surahNo: 2, ayahNo: 255, pinnedAt: 10 });
    writeReadingPin({ surahNo: 18, ayahNo: 10, pinnedAt: 11 });
    expect(readReadingPin()?.surahNo).toBe(18);
    writeReadingPin(null);
    expect(readReadingPin()).toBeNull();
    expect(getJSON(PINS_KEY, null)).toEqual({ v: 1, reading: null });
    setStorageBackend(memoryStore({ [PINS_KEY]: JSON.stringify({ v: 1, study: { x: 1 }, reading: { surahNo: 2, ayahNo: 999, pinnedAt: 1 } }) }));
    expect(readReadingPin()).toBeNull(); // not a real ayah
    writeReadingPin({ surahNo: 1, ayahNo: 1, pinnedAt: 1 });
    expect(getJSON<Record<string, unknown>>(PINS_KEY, {}).study).toEqual({ x: 1 }); // other fields kept
  });
});

describe("reading progress: exactly the legacy record", () => {
  it("has the same fields and values the legacy reader wrote", () => {
    setStorageBackend(memoryStore());
    const c = parseChapter(fakeChapter(2), 2);
    writeProgress(c, 285, 1760000000000);
    const rec = getJSON<Record<string, unknown>>(PROGRESS_KEY, {});
    expect(Object.keys(rec).sort()).toEqual(["ayahNo", "surahName", "surahNameArabic", "surahNo", "totalAyah", "updatedAt"]);
    // legacy: surahName = surahNameTranslation ("The Cow"), surahNameArabic = surahNameArabicLong, totalAyah, Date.now()
    expect(rec).toEqual({ surahNo: 2, ayahNo: 285, surahName: "The Cow", surahNameArabic: "TEST LONG 2", totalAyah: 286, updatedAt: 1760000000000 });
  });
});

describe("the daily reading log (quran:reading-goals:v1)", () => {
  const day = new Date(2026, 9, 15, 23, 59); // local 15 Oct 23:59: toISOString could already say the 16th in a zone ahead of UTC
  it("appends unique keys to the local day and counts the new ones", () => {
    setStorageBackend(memoryStore());
    expect(recordAyahsRead(["2:1", "2:2", "2:2"], day)).toBe(2);
    expect(recordAyahsRead(["2:2", "2:3"], day)).toBe(1);
    expect(getJSON<{ dailyLog: Record<string, string[]> }>(GOALS_KEY, { dailyLog: {} }).dailyLog["2026-10-15"]).toEqual(["2:1", "2:2", "2:3"]);
    expect(recordAyahsRead([], day)).toBe(0);
  });
  it("keeps goals, the active goal, other days and unknown fields exactly as they were", () => {
    const goals = [{ id: "g1", status: "active", dailyAyahTarget: 20 }];
    setStorageBackend(memoryStore({ [GOALS_KEY]: JSON.stringify({ goals, activeGoalId: "g1", dailyLog: { "2026-10-14": ["1:1"] }, future: { a: 1 } }) }));
    recordAyahsRead(["2:5"], day);
    const s = getJSON<Record<string, unknown>>(GOALS_KEY, {});
    expect(s.goals).toEqual(goals);
    expect(s.activeGoalId).toBe("g1");
    expect(s.future).toEqual({ a: 1 });
    expect((s.dailyLog as Record<string, string[]>)["2026-10-14"]).toEqual(["1:1"]);
    expect(goalToday(s, "2026-10-15")).toEqual({ count: 1, target: 20 }); // Home reads it
  });
  it("starts the legacy shape when there is nothing, and survives damage", () => {
    setStorageBackend(memoryStore({ [GOALS_KEY]: "not json" }));
    recordAyahsRead(["1:1"], day);
    expect(getJSON(GOALS_KEY, null)).toEqual({ goals: [], activeGoalId: null, dailyLog: { "2026-10-15": ["1:1"] } });
  });
  it("does not use the UTC date", () => {
    setStorageBackend(memoryStore());
    const lateLocal = new Date(2026, 0, 31, 23, 30);
    recordAyahsRead(["1:1"], lateLocal);
    expect(Object.keys(getJSON<{ dailyLog: object }>(GOALS_KEY, { dailyLog: {} }).dailyLog)).toEqual(["2026-01-31"]);
  });
});

describe("share text", () => {
  it("is the Arabic, the translation when shown, then the reference", () => {
    expect(ayahShareText({ arabic: "A", translation: "T", name: "Al-Baqara", surah: 2, ayah: 255 })).toBe("A\n\nT\n\nAl-Baqara 2:255");
    expect(ayahShareText({ arabic: "A", translation: null, name: "Al-Baqara", surah: 2, ayah: 255 })).toBe("A\n\nAl-Baqara 2:255");
  });
});

describe("storage sanity", () => {
  it("raw keys are untouched by the reader's JSON helpers", () => {
    setStorageBackend(memoryStore({ tafsirDefaultAuthor: "Ibn Kathir" }));
    setRaw("x", "y");
    markRead(1, 1);
    expect(getRaw("tafsirDefaultAuthor")).toBe("Ibn Kathir");
    expect(getRaw("x")).toBe("y");
  });
});

