// The generated juz/page tables and the lookups built on them. The fixture is a recorded GET /v1/meta response.
import { describe, expect, it } from "vitest";
import legacy from "../../app/assets/data/surah.json";
import { JUZ_STARTS, PAGE_STARTS, SURAH_ROWS } from "../app/data/quranMeta.generated";
import { absolute, AYAH_COUNTS, isAyah, JUZ, juzOfAyah, pageOfAyah, pageStart, TOTAL_JUZ, TOTAL_PAGES } from "../app/lib/quranMeta";
import meta from "./fixtures/alquran-meta.json";

type Ref = { surah: number; ayah: number };
const fixtureJuz = (meta.data.juzs.references as Ref[]).map((r) => [r.surah, r.ayah]);
const fixturePages = (meta.data.pages.references as Ref[]).map((r) => [r.surah, r.ayah]);

describe("generated tables", () => {
  it("have 30 juz and 604 pages, strictly increasing, all real ayahs", () => {
    expect(JUZ_STARTS).toHaveLength(30);
    expect(PAGE_STARTS).toHaveLength(604);
    for (const list of [JUZ_STARTS, PAGE_STARTS]) {
      let prev = 0;
      for (const [s, a] of list) {
        expect(isAyah(s, a)).toBe(true);
        const abs = absolute(s, a);
        expect(abs).toBeGreaterThan(prev);
        prev = abs;
      }
    }
  });
  it("equal the recorded /v1/meta response", () => {
    expect(JUZ_STARTS.map((x) => [...x])).toEqual(fixtureJuz);
    expect(PAGE_STARTS.map((x) => [...x])).toEqual(fixturePages);
  });
  it("hold exactly the legacy surah list (names, place, counts), 6236 ayahs, no audio map", () => {
    expect(SURAH_ROWS).toHaveLength(114);
    SURAH_ROWS.forEach((r, i) => {
      const l = legacy[i]!;
      expect(r).toEqual({ n: l.surahNo, name: l.surahName, ar: l.surahNameArabic, arLong: l.surahNameArabicLong, en: l.surahNameTranslation, place: l.revelationPlace, ayahs: l.totalAyah });
    });
    expect(AYAH_COUNTS.reduce((a, b) => a + b, 0)).toBe(6236);
    expect(JSON.stringify(SURAH_ROWS)).not.toContain("http");
  });
  it("agree with the service's place for every surah", () => {
    (meta.data.surahs.references as { number: number; revelationType: string }[]).forEach((s) => {
      expect(SURAH_ROWS[s.number - 1]!.place).toBe(s.revelationType === "Meccan" ? "Mecca" : "Madina");
    });
  });
});

describe("page and juz lookups", () => {
  it("find the page and juz of known ayahs", () => {
    expect(pageOfAyah(1, 1)).toBe(1);
    expect(pageOfAyah(2, 1)).toBe(2);
    expect(pageOfAyah(114, 6)).toBe(604);
    expect(pageOfAyah(112, 1)).toBe(604);
    expect(juzOfAyah(1, 1)).toBe(1);
    expect(juzOfAyah(2, 142)).toBe(2);
    expect(juzOfAyah(2, 141)).toBe(1);
    expect(juzOfAyah(78, 1)).toBe(30);
    expect(juzOfAyah(114, 6)).toBe(30);
  });
  it("reject anything that is not an ayah", () => {
    expect(pageOfAyah(0, 1)).toBeNull();
    expect(pageOfAyah(115, 1)).toBeNull();
    expect(pageOfAyah(1, 8)).toBeNull();
    expect(juzOfAyah(2, 1.5)).toBeNull();
    expect(pageStart(0)).toBeNull();
    expect(pageStart(605)).toBeNull();
    expect(pageStart(2)).toEqual([2, 1]);
  });
  it("every page start maps back to its own page", () => {
    PAGE_STARTS.forEach(([s, a], i) => expect(pageOfAyah(s, a)).toBe(i + 1));
    JUZ_STARTS.forEach(([s, a], i) => expect(juzOfAyah(s, a)).toBe(i + 1));
  });
});

describe("juz page ranges", () => {
  it("cover 1 to 604, each juz continuing from the one before", () => {
    expect(JUZ).toHaveLength(TOTAL_JUZ);
    expect(JUZ[0]!.firstPage).toBe(1);
    expect(JUZ[29]!.lastPage).toBe(TOTAL_PAGES);
    for (let i = 1; i < JUZ.length; i++) {
      // the next juz starts on the page the last one ended on (mid-page start) or on the page after it
      expect([JUZ[i - 1]!.lastPage, JUZ[i - 1]!.lastPage + 1]).toContain(JUZ[i]!.firstPage);
    }
  });
  it("only juz 4, 7, 11 and 26 start partway down a page, and those share their page with the juz before", () => {
    const mid = JUZ.filter((j) => j.midPageStart).map((j) => j.n);
    expect(mid).toEqual([4, 7, 11, 26]);
    for (const n of mid) expect(JUZ[n - 2]!.lastPage).toBe(JUZ[n - 1]!.firstPage);
  });
  it("are not the prototype's placeholder of 20 pages each", () => {
    const sizes = new Set(JUZ.map((j) => j.lastPage - j.firstPage + 1));
    expect(sizes.size).toBeGreaterThan(1);
  });
});
