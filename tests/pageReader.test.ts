// Phase 9A: the per-page reader's logic. A page's ayahs come ONLY from the generated page starts, and every page is checked against the
// service's own answer for that page (tests/fixtures/alquran-page-ranges.json: all 604 recorded real `/v1/page/<n>/quran-uthmani`
// responses reduced to [surah, firstAyah, lastAyah] runs, and six full responses). No page, surah or juz mapping is typed here.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SURAH_ROWS } from "../app/data/quranMeta.generated";
import { ayahBookmarkKey, pageBookmarkKey } from "../app/lib/bookmarks";
import { firstAyahOf, GO_TO_ERROR, isPageNumber, juzLine, PAGE_NOTE, pageSegments, pageSurahNumbers, parseGoTo, parsePageParam, surahNamesLine, westernDigits } from "../app/lib/pageReader";
import { AYAH_COUNTS, juzOfAyah, pageOfAyah, TOTAL_PAGES } from "../app/lib/quranMeta";

const FX = path.resolve(__dirname, "fixtures");
const recorded = JSON.parse(fs.readFileSync(path.join(FX, "alquran-page-ranges.json"), "utf8")) as { pages: Record<string, { count: number; segs: Array<[number, number, number]> }> };
const rawPage = (n: number) => JSON.parse(fs.readFileSync(path.join(FX, `alquran-page-${n}.json`), "utf8")) as { data: { ayahs: Array<{ numberInSurah: number; surah: { number: number } }> } };
const derived = (p: number) => pageSegments(p)!.map((g) => [g.surah, g.from, g.to]);

describe("the page ranges against the service's own pages", () => {
  it("all 604 pages: the ayahs derived from the page starts are exactly the ayahs the service returns for that page", () => {
    const mismatches: string[] = [];
    for (let p = 1; p <= TOTAL_PAGES; p++) {
      const want = recorded.pages[String(p)]!;
      const got = derived(p);
      if (JSON.stringify(got) !== JSON.stringify(want.segs)) mismatches.push(`page ${p}: derived ${JSON.stringify(got)} vs service ${JSON.stringify(want.segs)}`);
    }
    expect(mismatches).toEqual([]);
  });

  it("the recording is complete: 604 pages and 6,236 ayahs", () => {
    expect(Object.keys(recorded.pages)).toHaveLength(604);
    expect(Object.values(recorded.pages).reduce((s, x) => s + x.count, 0)).toBe(6236);
  });

  it("six full responses: the ayah list of the page equals the derived range, ayah by ayah", () => {
    for (const n of [1, 2, 50, 187, 582, 604]) {
      const fromService = rawPage(n).data.ayahs.map((a) => `${a.surah.number}:${a.numberInSurah}`);
      const fromRanges = pageSegments(n)!.flatMap((g) => Array.from({ length: g.to - g.from + 1 }, (_, i) => `${g.surah}:${g.from + i}`));
      expect(fromRanges, `page ${n}`).toEqual(fromService);
    }
  });
});

describe("the 604 pages as a whole", () => {
  it("are contiguous and cover every ayah of the Qur'an exactly once", () => {
    const seen: string[] = [];
    for (let p = 1; p <= TOTAL_PAGES; p++) for (const g of pageSegments(p)!) for (let a = g.from; a <= g.to; a++) seen.push(`${g.surah}:${a}`);
    expect(seen).toHaveLength(6236);
    expect(new Set(seen).size).toBe(6236);
    const all = SURAH_ROWS.flatMap((s) => Array.from({ length: s.ayahs }, (_, i) => `${s.n}:${i + 1}`));
    expect(seen).toEqual(all); // in reading order, none missing
  });

  it("each ayah sits on the page pageOfAyah says (the listing's Last read uses the same table)", () => {
    for (const p of [1, 2, 3, 49, 50, 187, 300, 582, 603, 604]) for (const g of pageSegments(p)!) for (const a of [g.from, g.to]) expect(pageOfAyah(g.surah, a)).toBe(p);
  });

  it("start and end", () => {
    expect(derived(1)).toEqual([[1, 1, 7]]);
    expect(derived(2)[0]).toEqual([2, 1, 5]);
    const last = pageSegments(604)!;
    expect(last[last.length - 1]).toMatchObject({ surah: 114, to: AYAH_COUNTS[113] });
    expect(pageSegments(0)).toBeNull();
    expect(pageSegments(605)).toBeNull();
    expect(pageSegments(1.5)).toBeNull();
  });
});

describe("where a surah starts: the banner and the Bismillah follow the surah reader's rule", () => {
  it("a surah's first page gets the banner; the Bismillah only for surahs 2 to 114 except 9, and only where the surah starts", () => {
    const starts: Array<{ page: number; surah: number; bismillah: boolean }> = [];
    for (let p = 1; p <= TOTAL_PAGES; p++) for (const g of pageSegments(p)!) if (g.starts) starts.push({ page: p, surah: g.surah, bismillah: g.bismillah });
    expect(starts).toHaveLength(114); // every surah starts on exactly one page
    expect(new Set(starts.map((s) => s.surah)).size).toBe(114);
    for (const s of starts) expect(s.bismillah, `surah ${s.surah}`).toBe(s.surah !== 1 && s.surah !== 9);
    expect(starts.find((s) => s.surah === 1)).toMatchObject({ page: 1, bismillah: false });
    expect(starts.find((s) => s.surah === 9)!.bismillah).toBe(false);
    for (let p = 1; p <= TOTAL_PAGES; p++) for (const g of pageSegments(p)!) if (!g.starts) expect(g.bismillah).toBe(false);
  });

  it("pages that begin partway into a surah have no banner and no Bismillah", () => {
    const g = pageSegments(3)![0]!;
    expect(g).toMatchObject({ surah: 2, starts: false, bismillah: false });
  });
});

describe("the header lines come from the data", () => {
  it("a page with two surahs names both, in order; a page with one names one", () => {
    const two = Array.from({ length: TOTAL_PAGES }, (_, i) => i + 1).filter((p) => pageSurahNumbers(p).length === 2);
    expect(two.length).toBeGreaterThan(10);
    const p = two[0]!;
    const [a, b] = pageSurahNumbers(p) as [number, number];
    expect(surahNamesLine(p)).toBe(`${SURAH_ROWS[a - 1]!.name}, ${SURAH_ROWS[b - 1]!.name}`);
    expect(surahNamesLine(1)).toBe(SURAH_ROWS[0]!.name);
    expect(surahNamesLine(604).split(", ").length).toBe(pageSurahNumbers(604).length); // the last page holds several short surahs
    expect(pageSurahNumbers(604).length).toBeGreaterThan(2);
  });

  it("the juz line is one juz, or two when a juz begins partway down the page", () => {
    expect(juzLine(1)).toBe("Juz 1");
    const one = new Set<string>();
    const two: number[] = [];
    for (let p = 1; p <= TOTAL_PAGES; p++) {
      const l = juzLine(p);
      if (/ and /.test(l)) two.push(p);
      else one.add(l);
    }
    expect(two).toHaveLength(4); // juz 4, 7, 11 and 26 start in the middle of a page (quranMeta.ts)
    for (const p of two) {
      const m = /^Juz (\d+) and (\d+)$/.exec(juzLine(p))!;
      expect(Number(m[2])).toBe(Number(m[1]) + 1);
    }
    const first = pageSegments(2)![0]!;
    expect(juzLine(2)).toBe(`Juz ${juzOfAyah(first.surah, first.from)}`);
  });

  it("the link into the surah reader is the first ayah on the page", () => {
    expect(firstAyahOf(1)).toEqual({ surah: 1, ayah: 1 });
    expect(firstAyahOf(3)).toEqual({ surah: 2, ayah: pageSegments(3)![0]!.from });
    expect(firstAyahOf(0)).toBeNull();
  });
});

describe("the address and the Go-to box", () => {
  it("?page=N: a real page opens; none opens page 1 quietly; a page that does not exist opens page 1 with a short notice", () => {
    expect(parsePageParam("49")).toEqual({ page: 49, notice: null });
    expect(parsePageParam(["7", "8"])).toEqual({ page: 7, notice: null });
    expect(parsePageParam(undefined)).toEqual({ page: 1, notice: null });
    expect(parsePageParam("")).toEqual({ page: 1, notice: null });
    expect(parsePageParam("604")).toEqual({ page: 604, notice: null });
    expect(parsePageParam("700")).toEqual({ page: 1, notice: "Page 700 doesn’t exist. Showing page 1." });
    expect(parsePageParam("0")).toEqual({ page: 1, notice: "Page 0 doesn’t exist. Showing page 1." });
    expect(parsePageParam("605").notice).toBe("Page 605 doesn’t exist. Showing page 1.");
    for (const bad of ["abc", "3.5", "-4", "1e2", "12abc"]) expect(parsePageParam(bad), bad).toEqual({ page: 1, notice: "That page doesn’t exist. Showing page 1." });
  });

  it("the Go-to box takes 1 to 604, with Arabic-Indic and Persian digits, and nothing else", () => {
    expect(parseGoTo("49")).toBe(49);
    expect(parseGoTo(" 604 ")).toBe(604);
    expect(parseGoTo("٤٩")).toBe(49);
    expect(parseGoTo("۴۹")).toBe(49);
    expect(westernDigits("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
    for (const bad of ["", "0", "605", "9999", "12345", "1.5", "-1", "ab", "4 9"]) expect(parseGoTo(bad), bad).toBeNull();
    expect(GO_TO_ERROR).toBe("Enter a page from 1 to 604.");
    expect(isPageNumber(604)).toBe(true);
    expect(isPageNumber(605)).toBe(false);
  });
});

describe("the page's own wording and keys", () => {
  it("says plainly that this is not a line-for-line copy", () => {
    expect(PAGE_NOTE).toContain("not a line-for-line copy");
    expect(PAGE_NOTE).not.toMatch(/mushaf layout/i);
  });
  it("the page bookmark is the legacy key, beside the ayah key", () => {
    expect(pageBookmarkKey(49)).toBe("page:49");
    expect(ayahBookmarkKey(2, 255)).toBe("ayah:2:255");
  });
});
