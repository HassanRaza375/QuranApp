// Phase 9B: the verses of prostration. The 15 [surah, ayah] pairs are generated from the recorded real response of the service the legacy page
// uses (tests/fixtures/alquran-sajda.json); these tests fail if the bundled list drifts from it, and check that nothing states a ruling.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SURAH_ROWS } from "../app/data/quranMeta.generated";
import { SAJDA_AYAHS } from "../app/data/sajda.generated";
import { pageSegments } from "../app/lib/pageReader";
import { AYAH_COUNTS, juzOfAyah, pageOfAyah, TOTAL_PAGES } from "../app/lib/quranMeta";
import { isSajdaAyah, SAJDA_NO_TEXT, SAJDA_SIGN_LABEL, SAJDA_TEXT_FAILED, SAJDA_TITLE, sajdaCountLine, sajdaRows } from "../app/lib/sajda";
import { sajdaBookmarkKey } from "../app/lib/bookmarks";

const root = path.resolve(__dirname, "..");
type Rec = { number: number; numberInSurah: number; juz: number; page: number; surah: { number: number } };
const recorded = (JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/alquran-sajda.json"), "utf8")) as { data: { ayahs: Rec[] } }).data.ayahs;

describe("the bundled list against the recorded service response", () => {
  it("is exactly the service's 15 ayahs, in the service's order", () => {
    expect(recorded).toHaveLength(15);
    expect(SAJDA_AYAHS.map(([s, a]) => [s, a])).toEqual(recorded.map((r) => [r.surah.number, r.numberInSurah]));
  });
  it("holds pairs of numbers only: no text and no flags", () => {
    for (const p of SAJDA_AYAHS) {
      expect(p).toHaveLength(2);
      expect(p.every((n) => Number.isInteger(n))).toBe(true);
    }
  });
  it("every pair is a real ayah, in Qur'an order, without repeats", () => {
    let last = 0;
    for (const [s, a] of SAJDA_AYAHS) {
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(AYAH_COUNTS[s - 1]!);
      const k = s * 1000 + a;
      expect(k).toBeGreaterThan(last);
      last = k;
    }
  });
  it("the juz and page derived from the app's own tables equal the ones the service reports for each ayah", () => {
    const rows = sajdaRows();
    expect(rows).toHaveLength(15);
    rows.forEach((r, i) => {
      expect(r.page, `${r.surah}:${r.ayah}`).toBe(recorded[i]!.page);
      expect(r.juz, `${r.surah}:${r.ayah}`).toBe(recorded[i]!.juz);
      expect(r.page).toBe(pageOfAyah(r.surah, r.ayah));
      expect(r.juz).toBe(juzOfAyah(r.surah, r.ayah));
      expect(r.surahName).toBe(SURAH_ROWS[r.surah - 1]!.name);
      expect(r.href).toBe(`/surah/${r.surah}#ayah-${r.ayah}`);
    });
  });
});

describe("the sign on the Per-page reader", () => {
  it("isSajdaAyah is true for the 15 and false for their neighbours", () => {
    for (const [s, a] of SAJDA_AYAHS) {
      expect(isSajdaAyah(s, a)).toBe(true);
      expect(isSajdaAyah(s, a + 1)).toBe(false);
      if (a > 1) expect(isSajdaAyah(s, a - 1)).toBe(false);
    }
    expect(isSajdaAyah(1, 1)).toBe(false);
  });
  it("across all 604 pages the sign belongs to exactly the 15 ayahs, each on exactly one page, and the page is the one the data says", () => {
    const found: string[] = [];
    for (let p = 1; p <= TOTAL_PAGES; p++) {
      for (const g of pageSegments(p)!) for (let a = g.from; a <= g.to; a++) if (isSajdaAyah(g.surah, a)) found.push(`${g.surah}:${a}@${p}`);
    }
    expect(found).toEqual(sajdaRows().map((r) => `${r.surah}:${r.ayah}@${r.page}`));
  });
});

describe("no ruling is stated", () => {
  it("the page's words and the library's are plain: no obligatory, recommended, wajib, Hanafi, Ja'fari or marja'", () => {
    const words = /obligatory|recommended|wajib|fard|hanafi|ja.?fari|shafi|marja|scholar/i;
    for (const s of [SAJDA_TITLE, sajdaCountLine(15), SAJDA_NO_TEXT, SAJDA_TEXT_FAILED, SAJDA_SIGN_LABEL]) expect(s).not.toMatch(words);
    const page = fs.readFileSync(path.join(root, "app/pages/sajda.vue"), "utf8");
    const template = page.slice(page.indexOf("<template>"));
    expect(template).not.toMatch(words);
  });
  it("the page title and count follow the data", () => {
    expect(SAJDA_TITLE).toBe("Verses of prostration");
    expect(sajdaCountLine(SAJDA_AYAHS.length)).toBe("15 verses, as listed by this app’s data.");
  });
  it("the bookmark key is the legacy one the Library already lists", () => {
    expect(sajdaBookmarkKey(32, 15)).toBe("sajda:32:15");
  });
});
