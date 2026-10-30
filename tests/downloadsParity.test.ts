// Phase 11: the list of saved surahs (`quran:downloads:v1`) must stay readable by the LEGACY app after a rollback, and the legacy app's own lists must be
// readable here. The legacy composable (vendored, unmodified) is run against what the revamp writes, and the revamp's reader against what the legacy
// code writes. Also: adopting legacy text and tafsir from the service worker's cache, with no network.
import { afterEach, describe, expect, it } from "vitest";
import { loadLegacyDownloads } from "../scripts/lib/legacy-downloads.mjs";
import { adoptLegacy, needsAdoption, type AdoptDeps } from "../app/lib/downloadAdopt";
import { MANIFEST_KEY, parseManifest, readManifest, upsertEntry, writeManifest, type ManifestEntry } from "../app/lib/downloadsManifest";
import { setStorageBackend } from "../app/lib/storage";
import { SURAH_ROWS } from "../app/data/quranMeta.generated";

type Legacy = { useDownloads: () => { manifest: { value: ManifestEntry[] }; load(): void; isDownloaded(n: number): boolean; getDownload(n: number): ManifestEntry | null; removeDownload(n: number): Promise<void>; downloadSurah(n: number, o?: object): Promise<void> } };
const mem = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    keys: () => [...m.keys()],
    raw: m,
  };
};
/** The legacy `$storage` wrapper's shape, over the same memory the revamp's storage wrapper uses. */
const legacyStorage = (s: ReturnType<typeof mem>) => ({
  get: (k: string, d: unknown) => {
    const v = s.getItem(k);
    if (v === null) return d;
    try {
      return JSON.parse(v);
    } catch {
      return d;
    }
  },
  set: (k: string, v: unknown) => s.setItem(k, JSON.stringify(v)),
});

const savedGlobals: Record<string, unknown> = {};
const setGlobal = (k: string, v: unknown) => {
  if (!(k in savedGlobals)) savedGlobals[k] = (globalThis as Record<string, unknown>)[k];
  (globalThis as Record<string, unknown>)[k] = v;
};
afterEach(() => {
  for (const [k, v] of Object.entries(savedGlobals)) {
    if (v === undefined) Reflect.deleteProperty(globalThis, k);
    else (globalThis as Record<string, unknown>)[k] = v;
  }
  setStorageBackend(null);
});

function fakeCaches() {
  const stores = new Map<string, Map<string, unknown>>();
  return {
    stores,
    open: async (n: string) => {
      const st = stores.get(n) ?? new Map();
      stores.set(n, st);
      return { put: async (k: string, v: unknown) => void st.set(k, v), delete: async (k: string) => st.delete(k) };
    },
    delete: async (n: string) => stores.delete(n),
  };
}

async function legacyWorld(storage: ReturnType<typeof mem>) {
  const caches = fakeCaches();
  const calls = { deletedChapters: [] as number[], deletedTafsirs: [] as [number, number][], tafsirGets: [] as string[] };
  setGlobal("caches", caches);
  setGlobal("window", globalThis);
  setGlobal("fetch", async () => ({ type: "opaque" }));
  Object.defineProperty(globalThis, "navigator", { value: { storage: { estimate: async () => ({ usage: 0, quota: 0 }) } }, configurable: true });
  const mod = (await loadLegacyDownloads({
    storage: legacyStorage(storage),
    chapters: { getChapter: async (n: number) => ({ surahNo: n, surahName: `S${n}`, surahNameArabicLong: `A${n}`, totalAyah: 3, audio: { "1": { url: `https://x.test/${n}.mp3`, reciter: "R1" } } }) },
    tafsir: { getTafsir: async (s: number, a: number) => void calls.tafsirGets.push(`${s}_${a}`) },
    db: { deleteChapter: async (n: number) => void calls.deletedChapters.push(n), deleteTafsirsForSurah: async (n: number, t: number) => void calls.deletedTafsirs.push([n, t]) },
  })) as Legacy;
  return { legacy: mod.useDownloads(), caches, calls };
}

const entry = (n: number, extra: Partial<ManifestEntry> = {}): ManifestEntry => ({ surahNo: n, surahName: "x", totalAyah: 3, hasTafsir: false, reciterKey: null, reciterName: null, audioUrl: null, sizeBytesEstimate: 10, downloadedAt: 1, ...extra });

describe("the list of saved surahs, between the legacy app and this one", () => {
  it("the legacy composable reads what this app writes (extra fields and all) and lists the surahs as downloaded", async () => {
    const s = mem();
    setStorageBackend(s);
    writeManifest([entry(36, { hasTafsir: true, revamp: 1, bytes: { text: 5, tafsir: 6 } }), entry(1, { reciterKey: "1", reciterName: "R1", audioUrl: "https://x.test/1.mp3" })]);
    const { legacy } = await legacyWorld(s);
    legacy.load();
    expect(legacy.manifest.value.map((e) => e.surahNo)).toEqual([1, 36]);
    expect(legacy.isDownloaded(36)).toBe(true);
    expect(legacy.getDownload(36)).toMatchObject({ hasTafsir: true, revamp: 1 });
    expect(legacy.isDownloaded(2)).toBe(false);
  });

  it("the legacy Remove still works on an entry written here: it asks for the audio under the entry's URL, which is where this app keeps it", async () => {
    const s = mem();
    setStorageBackend(s);
    writeManifest([entry(1, { totalAyah: 7, hasTafsir: true, reciterKey: "1", reciterName: "R1", audioUrl: "https://x.test/1.mp3", revamp: 1 })]);
    const { legacy, caches, calls } = await legacyWorld(s);
    (await caches.open("quran-downloads-audio-cache")).put("https://x.test/1.mp3", {});
    legacy.load();
    await legacy.removeDownload(1);
    expect(calls.deletedChapters).toEqual([1]);
    expect(calls.deletedTafsirs).toEqual([[1, 7]]);
    expect(caches.stores.get("quran-downloads-audio-cache")!.has("https://x.test/1.mp3")).toBe(false);
    expect(JSON.parse(s.raw.get(MANIFEST_KEY)!)).toEqual([]);
  });

  it("this app reads what the legacy composable writes after a real legacy download", async () => {
    const s = mem();
    setStorageBackend(s);
    const { legacy } = await legacyWorld(s);
    await legacy.downloadSurah(2, { includeTafsir: true, reciterKey: "1" });
    const list = readManifest();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ surahNo: 2, surahName: "A2", totalAyah: 3, hasTafsir: true, reciterKey: "1", reciterName: "R1", audioUrl: "https://x.test/2.mp3" });
    expect(list[0]!.revamp).toBeUndefined(); // a legacy entry is not yet checked by this app
    expect(needsAdoption(list)).toBe(true);
  });

  it("a later legacy download of another surah keeps this app's extra fields on its own entries", async () => {
    const s = mem();
    setStorageBackend(s);
    writeManifest([entry(36, { revamp: 1, bytes: { text: 9 } })]);
    const { legacy } = await legacyWorld(s);
    legacy.load();
    await legacy.downloadSurah(2, {});
    expect(readManifest().find((e) => e.surahNo === 36)).toMatchObject({ revamp: 1, bytes: { text: 9 } });
  });
});

describe("reading the list", () => {
  it("is tolerant: damage gives an empty list or skips the entry, and extra fields are kept", () => {
    expect(parseManifest(null)).toEqual([]);
    expect(parseManifest({ a: 1 })).toEqual([]);
    expect(parseManifest([null, 3, { surahNo: 0 }, { surahNo: 115 }, { surahNo: "2" }, { surahNo: 2, mystery: true }])).toEqual([expect.objectContaining({ surahNo: 2, mystery: true, hasTafsir: false })]);
  });
  it("keeps the list sorted and replaces an entry for the same surah", () => {
    const l = upsertEntry(upsertEntry([], entry(5)), entry(2));
    expect(l.map((e) => e.surahNo)).toEqual([2, 5]);
    expect(upsertEntry(l, entry(2, { sizeBytesEstimate: 99 })).find((e) => e.surahNo === 2)!.sizeBytesEstimate).toBe(99);
  });
});

describe("adopting legacy text and tafsir from the service worker's cache (no network)", () => {
  const BASE = "https://quranapi.pages.dev/api";
  const chapterJson = (n: number) => {
    const total = SURAH_ROWS[n - 1]!.ayahs;
    const arr = (p: string) => Array.from({ length: total }, (_, i) => `${p}${n}:${i + 1}`);
    return { surahName: SURAH_ROWS[n - 1]!.name, surahNameArabicLong: "x", surahNameTranslation: "t", revelationPlace: "Mecca", totalAyah: total, surahNo: n, arabic1: arr("a"), arabic2: arr("b"), english: arr("e"), urdu: arr("u"), bengali: arr("g") };
  };
  const tafsirJson = () => ({ tafsirs: [{ author: "A", content: "c" }] });
  function world(cache: Record<string, unknown>, have: { chapters?: number[]; tafsir?: string[] } = {}) {
    const puts = { chapters: [] as number[], tafsirs: [] as string[] };
    const reads: string[] = [];
    const deps: AdoptDeps = {
      apiBase: BASE,
      cached: async (u) => {
        reads.push(u);
        return cache[u];
      },
      hasChapter: (n) => (have.chapters ?? []).includes(n),
      hasTafsir: (s, a) => (have.tafsir ?? []).includes(`${s}_${a}`),
      putChapter: async (n) => void puts.chapters.push(n),
      putTafsir: async (k) => void puts.tafsirs.push(k),
    };
    return { deps, puts, reads };
  }
  it("copies the text and every ayah's tafsir that the cache holds, marks the entry checked, and reads nothing else", async () => {
    const n = 112; // 4 ayahs
    const cache: Record<string, unknown> = { [`${BASE}/${n}.json`]: chapterJson(n) };
    for (let a = 1; a <= 4; a++) cache[`${BASE}/tafsir/${n}_${a}.json`] = tafsirJson();
    const w = world(cache);
    const out = await adoptLegacy([entry(n, { totalAyah: 4, hasTafsir: true })], w.deps);
    expect(w.puts).toEqual({ chapters: [112], tafsirs: ["112_1", "112_2", "112_3", "112_4"] });
    expect(out[0]).toMatchObject({ surahNo: 112, revamp: 1 });
    expect(needsAdoption(out)).toBe(false);
  });
  it("what the cache does not hold stays missing, damaged data is not stored, and an entry is never adopted twice", async () => {
    const cache: Record<string, unknown> = { [`${BASE}/112.json`]: { nonsense: true }, [`${BASE}/tafsir/112_1.json`]: tafsirJson() };
    const w = world(cache);
    const out = await adoptLegacy([entry(112, { totalAyah: 4, hasTafsir: true }), entry(114, { revamp: 1 })], w.deps);
    expect(w.puts).toEqual({ chapters: [], tafsirs: ["112_1"] });
    expect(out.map((e) => e.revamp)).toEqual([1, 1]);
    const again = world({});
    await adoptLegacy(out, again.deps);
    expect(again.reads).toEqual([]);
  });
  it("does not read the cache for what the reader's store already has", async () => {
    const w = world({}, { chapters: [112], tafsir: ["112_1", "112_2", "112_3", "112_4"] });
    await adoptLegacy([entry(112, { totalAyah: 4, hasTafsir: true })], w.deps);
    expect(w.reads).toEqual([]);
  });
});
