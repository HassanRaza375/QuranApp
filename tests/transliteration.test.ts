// Transliteration in the readers: the response check, the cache order and the failure cases, the lookup by ayah key across surahs, the setting's
// storage, and the new IndexedDB store. Real recorded answers (surahs 1 and 114) and synthetic ones (right counts, obviously fake text).
import "fake-indexeddb/auto";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { closeRevampDb, getCached, getRevampDb, putCached, REVAMP_DB_NAME, REVAMP_DB_VERSION, TRANSLITERATIONS } from "../app/db/revampDb";
import { READER_PREFS_KEY, readReaderPrefs, setTransliterationOn, setTranslationOff } from "../app/lib/readerPrefs";
import { getJSON, setStorageBackend } from "../app/lib/storage";
import { loadTransliteration, parseTransliteration, TransliterationError, transliterationByKey, transliterationOf, type TransliterationDeps } from "../app/lib/transliteration";
import { memoryStore } from "./helpers";

const fixture = (n: number): unknown => JSON.parse(fs.readFileSync(path.resolve(__dirname, "fixtures", `alquran-translit-surah-${n}.json`), "utf8"));
const synthetic = (n: number, total: number) => ({ code: 200, data: { number: n, ayahs: Array.from({ length: total }, (_, i) => ({ numberInSurah: i + 1, text: `Test ${n}:${i + 1} ` })) } });

describe("parseTransliteration", () => {
  it("reads the real answers for surah 1 (7 ayahs) and 114 (6 ayahs)", () => {
    const a = parseTransliteration(fixture(1), 1);
    expect(a).toHaveLength(7);
    expect(a.every((t) => t.length > 0)).toBe(true);
    expect(parseTransliteration(fixture(114), 114)).toHaveLength(6);
  });
  it("trims, and accepts a stored record (a plain array)", () => {
    expect(parseTransliteration(synthetic(112, 4), 112)).toEqual(["Test 112:1", "Test 112:2", "Test 112:3", "Test 112:4"]);
    expect(parseTransliteration(["a", "", "c", "d"], 112)).toEqual(["a", "", "c", "d"]);
  });
  it("rejects a wrong count, a wrong order, a non-string text, junk and a surah that does not exist", () => {
    expect(() => parseTransliteration(synthetic(112, 3), 112)).toThrow(TransliterationError);
    const swapped = synthetic(112, 4);
    swapped.data.ayahs.reverse();
    expect(() => parseTransliteration(swapped, 112)).toThrow(/out of order/);
    const num = synthetic(112, 4) as { data: { ayahs: Array<{ text: unknown }> } };
    num.data.ayahs[2]!.text = 5;
    expect(() => parseTransliteration(num, 112)).toThrow(TransliterationError);
    expect(() => parseTransliteration(null, 112)).toThrow(TransliterationError);
    expect(() => parseTransliteration({}, 112)).toThrow(TransliterationError);
    expect(() => parseTransliteration(["a"], 112)).toThrow(TransliterationError); // a stored record of the wrong length
    expect(() => parseTransliteration(synthetic(115, 3), 115)).toThrow(/does not exist/);
  });
});

describe("loadTransliteration", () => {
  const make = (over: Partial<TransliterationDeps> = {}) => {
    const log: string[] = [];
    const deps: TransliterationDeps = {
      read: async (n) => (log.push(`read ${n}`), undefined),
      write: async (n) => void log.push(`write ${n}`),
      fetch: async (n) => (log.push(`fetch ${n}`), synthetic(n, 4)),
      ...over,
    };
    return { deps, log };
  };
  it("cache first: a stored surah makes no request", async () => {
    const { deps, log } = make({ read: async () => ["x", "y", "z", "w"] });
    const r = await loadTransliteration(112, deps);
    expect(r).toEqual({ value: ["x", "y", "z", "w"], from: "cache" });
    expect(log).toEqual([]);
  });
  it("on a miss it asks the service once, stores the checked lines and says where they came from", async () => {
    const { deps, log } = make();
    const r = await loadTransliteration(112, deps);
    expect(r.from).toBe("network");
    expect(r.value).toHaveLength(4);
    expect(log).toEqual(["read 112", "fetch 112", "write 112"]);
  });
  it("a damaged record is a miss and is replaced", async () => {
    const { deps, log } = make({ read: async () => ["only one"] });
    const r = await loadTransliteration(112, deps);
    expect(r.from).toBe("network");
    expect(log).toContain("write 112");
  });
  it("a cache that throws is a miss, and a write that throws is ignored", async () => {
    const { deps } = make({ read: async () => Promise.reject(new Error("idb")), write: async () => Promise.reject(new Error("full")) });
    await expect(loadTransliteration(112, deps)).resolves.toMatchObject({ from: "network" });
  });
  it("a failed request is 'unavailable', an incomplete answer is 'invalid', and neither is stored", async () => {
    const a = make({ fetch: async () => Promise.reject(new Error("offline")) });
    await expect(loadTransliteration(112, a.deps)).rejects.toMatchObject({ kind: "unavailable" });
    const b = make({ fetch: async () => synthetic(112, 2) });
    await expect(loadTransliteration(112, b.deps)).rejects.toMatchObject({ kind: "invalid" });
    expect(a.log.concat(b.log).some((l) => l.startsWith("write"))).toBe(false);
  });
});

describe("the lookup by ayah key", () => {
  const lines = { 1: ["one", "two", "three"], 2: ["a", "", "c"] };
  it("finds an ayah of any loaded surah, so a page that crosses two surahs reads from both", () => {
    expect(transliterationOf(lines, 1, 3)).toBe("three");
    expect(transliterationOf(lines, 2, 1)).toBe("a");
    expect(transliterationByKey(lines, "2:3")).toBe("c");
  });
  it("gives null for an ayah with no text, a surah that is not loaded, an ayah out of range or a bad key", () => {
    expect(transliterationOf(lines, 2, 2)).toBeNull();
    expect(transliterationOf(lines, 3, 1)).toBeNull();
    expect(transliterationOf(lines, 1, 9)).toBeNull();
    expect(transliterationOf(lines, 1, 0)).toBeNull();
    expect(transliterationByKey(lines, "1")).toBeNull();
    expect(transliterationByKey(lines, "1:2:3")).toBeNull();
  });
});

describe("the setting (quran:reader-prefs:v1, field transliteration)", () => {
  it("is off by default, turns on and off, and keeps the translation's own field", () => {
    setStorageBackend(memoryStore());
    expect(readReaderPrefs()).toEqual({});
    setTransliterationOn(true);
    expect(getJSON(READER_PREFS_KEY, null)).toEqual({ transliteration: true });
    expect(readReaderPrefs()).toEqual({ transliteration: true });
    setTranslationOff(true);
    expect(readReaderPrefs()).toEqual({ translation: "off", transliteration: true });
    setTransliterationOn(false);
    expect(readReaderPrefs()).toEqual({ translation: "off" });
    expect(getJSON(READER_PREFS_KEY, null)).toEqual({ translation: "off", transliteration: null });
  });
  it("reads anything that is not exactly true as off, and damage as empty", () => {
    setStorageBackend(memoryStore({ [READER_PREFS_KEY]: JSON.stringify({ transliteration: "yes", other: 1 }) }));
    expect(readReaderPrefs()).toEqual({});
    setStorageBackend(memoryStore({ [READER_PREFS_KEY]: "{broken" }));
    expect(readReaderPrefs()).toEqual({});
  });
});

describe("the transliterations store in quran-revamp-db", () => {
  beforeEach(async () => {
    await closeRevampDb();
    indexedDB.deleteDatabase(REVAMP_DB_NAME);
  });
  afterEach(closeRevampDb);
  it("is version 5 and keeps a surah's lines (and the older stores are still there)", async () => {
    expect(REVAMP_DB_VERSION).toBe(5);
    const db = await getRevampDb();
    expect([...db.objectStoreNames]).toEqual(expect.arrayContaining(["prayer-months", "chapters", "tafsirs", "ayah-text", "hijri-months", TRANSLITERATIONS]));
    await putCached(TRANSLITERATIONS, 112, ["a", "b", "c", "d"]);
    expect(await getCached(TRANSLITERATIONS, 112)).toEqual(["a", "b", "c", "d"]);
    expect(await getCached(TRANSLITERATIONS, 113)).toBeUndefined();
  });
});
