// Phase 15: where an old /juz/<n> link goes.
import { describe, expect, it } from "vitest";
import { juzTarget } from "../app/lib/juzRedirect";
import { JUZ } from "../app/lib/quranMeta";
import { surahHref } from "../app/lib/readerLinks";

describe("/juz/<n>", () => {
  it("opens the reader at the first ayah of each of the 30 juz, from the same table the Juz tab uses", () => {
    expect(juzTarget("1")).toBe("/surah/1#ayah-1");
    expect(juzTarget("2")).toBe(surahHref(2, 142));
    expect(juzTarget("30")).toBe(surahHref(78, 1));
    for (const j of JUZ) expect(juzTarget(String(j.n))).toBe(surahHref(j.startSurah, j.startAyah));
  });
  it("a juz that starts partway through a page still opens at its own first ayah", () => {
    const mid = JUZ.find((j) => j.midPageStart)!;
    expect(juzTarget(String(mid.n))).toBe(surahHref(mid.startSurah, mid.startAyah));
  });
  it("anything that is not 1 to 30 goes to the Juz tab", () => {
    for (const bad of ["0", "31", "99", "-1", "abc", "1.5", "01a", "", " 3", undefined, null, 7, ["x"]]) expect(juzTarget(bad), String(bad)).toBe("/juz");
  });
  it("takes the first of a repeated parameter", () => {
    expect(juzTarget(["5", "6"])).toBe(juzTarget("5"));
  });
});
