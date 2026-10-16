// The filter box (Arabic marks, accents, numbers), the sort orders, the last-read marker and audio-URL resolution.
import { describe, expect, it } from "vitest";
import legacy from "../../app/assets/data/surah.json";
import reciters from "../../app/assets/data/reciters.json";
import { SURAH_ROWS } from "../app/data/quranMeta.generated";
import { juzMatches, normalize, parsePage, surahMatches } from "../app/lib/listingSearch";
import { filterPlace, sortName, sortSurahs } from "../app/lib/listingSort";
import { JUZ } from "../app/lib/quranMeta";
import { lastRead } from "../app/lib/readingMarker";
import { audioUrlFor, DEFAULT_RECITER, RECITER_NAMES, reciterName, type AudioMap } from "../app/lib/surahAudio";

const find = (q: string) => SURAH_ROWS.filter((s) => surahMatches(s, q)).map((s) => s.n);

describe("normalize", () => {
  it("removes Arabic marks and tatweel, folds alef and yeh, lowercases and collapses repeats", () => {
    expect(normalize("سُورَةُ ٱلْفَاتِحَةِ")).toBe(normalize("سورة الفاتحة"));
    expect(normalize("آل عمران")).toBe(normalize("ال عمران"));
    expect(normalize("Al-Faatiha")).toBe("al fatiha");
    expect(normalize("  Ā  l-Fātiḥa ")).toContain("fatiha");
    expect(normalize("الـــفاتحة")).toBe(normalize("الفاتحة"));
  });
});

describe("surah filter", () => {
  it("typing the plain Arabic name finds the surah (the legacy search could not)", () => {
    expect(find("الفاتحة")).toEqual([1]);
    expect(find("البقرة")).toEqual([2]);
  });
  it("finds it with marks, with the long name, and by the English spellings", () => {
    expect(find("ٱلْفَاتِحَةِ")).toEqual([1]);
    expect(find("سورة الفاتحة")).toEqual([1]);
    expect(find("fatiha")).toEqual([1]);
    expect(find("Al-Faatiha")).toEqual([1]);
    expect(find("alfatiha")).toEqual([1]);
    expect(find("opening")).toEqual([1]);
    expect(find("baqara")).toEqual([2]);
  });
  it("treats a number as that surah number only", () => {
    expect(find("7")).toEqual([7]);
    expect(find("114")).toEqual([114]);
    expect(find("115")).toEqual([]);
  });
  it("matches the place, and returns everything for an empty query", () => {
    const madina = legacy.filter((s) => s.revelationPlace === "Madina").length;
    expect(find("madina")).toHaveLength(madina);
    expect(find("medinan")).toHaveLength(madina);
    expect(find("mecca")).toHaveLength(114 - madina);
    expect(find("")).toHaveLength(114);
    expect(find("   ")).toHaveLength(114);
  });
  it("finds every surah by each of its own names, and a nonsense word finds none", () => {
    for (const s of SURAH_ROWS) {
      for (const text of [s.name, s.ar, s.arLong, s.en]) expect(find(text), `${s.n} by "${text}"`).toContain(s.n);
    }
    expect(find("xyzzy")).toEqual([]);
  });
  it("does not over-match: the plain Arabic name of each surah finds a small set", () => {
    // (the three surahs named by a single letter, ص ق ن, are letters inside other names too, as a substring search finds)
    for (const s of SURAH_ROWS.filter((r) => normalize(r.ar).length > 1)) expect(find(s.ar).length, `${s.n} ${s.ar}`).toBeLessThanOrEqual(6);
  });
});

describe("juz filter and Go to page", () => {
  it("finds a juz by number or by its start surah", () => {
    const hit = (q: string) => JUZ.filter((j) => juzMatches(j, SURAH_ROWS[j.startSurah - 1]!.name, q)).map((j) => j.n);
    expect(hit("2")).toEqual([2]);
    expect(hit("juz 30")).toEqual([30]);
    expect(hit("an-naba")).toEqual([30]);
    expect(hit("")).toHaveLength(30);
  });
  it("accepts only whole pages from 1 to 604", () => {
    expect(parsePage("1")).toBe(1);
    expect(parsePage(" 604 ")).toBe(604);
    for (const bad of ["0", "605", "-3", "1.5", "abc", "", "12a"]) expect(parsePage(bad)).toBeNull();
  });
});

describe("sort", () => {
  it("by number is the data order; every order is stable, total and keeps 114 rows", () => {
    expect(sortSurahs(SURAH_ROWS, "number").map((s) => s.n)).toEqual(SURAH_ROWS.map((s) => s.n));
    for (const key of ["number", "name", "most", "fewest"] as const) {
      const out = sortSurahs(SURAH_ROWS, key);
      expect(new Set(out.map((s) => s.n)).size).toBe(114);
      expect(sortSurahs(out, key)).toEqual(out);
    }
  });
  it("by verse count, longest and shortest first, ties by number", () => {
    const most = sortSurahs(SURAH_ROWS, "most");
    expect(most[0]!.n).toBe(2);
    expect(most[1]!.n).toBe(26);
    const fewest = sortSurahs(SURAH_ROWS, "fewest");
    expect(fewest[0]!.ayahs).toBe(3);
    for (let i = 1; i < fewest.length; i++) expect(fewest[i]!.ayahs).toBeGreaterThanOrEqual(fewest[i - 1]!.ayahs);
    // the surahs with 3 verses come out in number order
    const threes = fewest.filter((s) => s.ayahs === 3).map((s) => s.n);
    expect(threes).toEqual([...threes].sort((a, b) => a - b));
  });
  it("by name ignores the article, so Al-Faatiha is under F and Aal-i-Imraan under A", () => {
    expect(sortName("Al-Faatiha")).toBe("fatiha");
    expect(sortName("An-Nisaa")).toBe("nisa");
    expect(sortName("Ash-Shuaraa")).toBe("shuara");
    expect(sortName("Aal-i-Imraan")).toBe("al i imran");
    const names = sortSurahs(SURAH_ROWS, "name").map((s) => sortName(s.name));
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en")));
  });
  it("filters by place", () => {
    expect(filterPlace(SURAH_ROWS, "all")).toHaveLength(114);
    expect(filterPlace(SURAH_ROWS, "Madina").every((s) => s.place === "Madina")).toBe(true);
    expect(filterPlace(SURAH_ROWS, "Mecca").length + filterPlace(SURAH_ROWS, "Madina").length).toBe(114);
  });
});

describe("last-read marker", () => {
  it("maps a stored record to its surah, juz and page", () => {
    const r = lastRead({ surahNo: 2, ayahNo: 285, surahName: "x", totalAyah: 286, updatedAt: 1 })!;
    expect(r.surahNo).toBe(2);
    expect(r.total).toBe(286);
    expect(r.juz).toBe(3);
    expect(r.page).toBeGreaterThan(40);
    expect(r.surahPct).toBe(100);
    expect(r.href).toBe("/surah/2#ayah-285");
  });
  it("is null for anything unusable", () => {
    for (const bad of [null, undefined, "x", 3, [], {}, { surahNo: 2 }, { surahNo: "2", ayahNo: 1 }, { surahNo: 2, ayahNo: 287 }, { surahNo: 115, ayahNo: 1 }, { surahNo: 2, ayahNo: 0 }, { surahNo: 2.5, ayahNo: 1 }]) {
      expect(lastRead(bad)).toBeNull();
    }
  });
});

describe("audio resolution by reciter name", () => {
  const names = (reciters as { reciter: string }[]).map((r) => r.reciter);
  it("lists the five legacy reciters and defaults to the first", () => {
    expect(RECITER_NAMES).toEqual(names);
    expect(RECITER_NAMES).toHaveLength(5);
    expect(DEFAULT_RECITER).toBe(names[0]);
    expect(reciterName(null)).toBe(DEFAULT_RECITER);
    expect(reciterName({ reciter: "Someone Unknown" })).toBe(DEFAULT_RECITER);
    expect(reciterName({ reciter: names[3] })).toBe(names[3]);
    // the legacy listing stored the whole audio entry; only the name is read
    expect(reciterName({ reciter: names[2], url: "https://x/y.mp3" })).toBe(names[2]);
  });
  it("every surah has a file for every reciter, found by name in that surah's own map", () => {
    for (const s of legacy as { surahNo: number; audio: AudioMap }[]) {
      for (const n of names) expect(audioUrlFor(s.audio, n), `${s.surahNo} ${n}`).toMatch(/^https:\/\/.+\.mp3$/);
    }
  });
  it("returns null when there is no file for the reciter", () => {
    expect(audioUrlFor(undefined, names[0]!)).toBeNull();
    expect(audioUrlFor({ "1": { reciter: "A", url: "https://x/1.mp3" } }, "B")).toBeNull();
    expect(audioUrlFor({ "1": { reciter: "A", url: "" } }, "A")).toBeNull();
  });
});
