// Phase 10: the groups of Search that need no network (Surahs, People, Stories, Notes) and the registry later phases add to.
import { describe, expect, it } from "vitest";
import { SURAH_ROWS } from "../app/data/quranMeta.generated";
import { personById } from "../app/lib/people";
import { noteSnippet, PROVIDERS, searchLocal, type LocalContext, type LocalProvider } from "../app/lib/searchLocal";
import { storyById } from "../app/lib/stories";

const NONE: LocalContext = { notes: [] };
const group = (r: ReturnType<typeof searchLocal>, id: string) => r.find((g) => g.group === id);

describe("searchLocal", () => {
  it("gives the groups in registry order: Surahs, People, Stories, Notes (only the non-empty ones)", () => {
    expect(PROVIDERS.map((p) => p.group)).toEqual(["surahs", "people", "stories", "notes"]);
    const r = searchLocal("yusuf", { notes: [{ key: "ayah:12:4", title: "Yusuf 12:4", note: "A dream", tags: [], href: "/surah/12#ayah-12" }] });
    expect(r.map((g) => g.group)).toEqual(["surahs", "people", "stories", "notes"]);
    expect(group(r, "surahs")!.hits[0]).toMatchObject({ title: "Yusuf", arabic: SURAH_ROWS[11]!.ar, href: "/surah/12" });
  });

  it("matches from one character, and an empty or blank query matches nothing", () => {
    expect(searchLocal("y", NONE).length).toBeGreaterThan(0);
    expect(searchLocal("", NONE)).toEqual([]);
    expect(searchLocal("   ", NONE)).toEqual([]);
    expect(searchLocal("zzzzqqqq", NONE)).toEqual([]);
  });

  it("ignores marks and spelling variants, like every other search box", () => {
    const withMark = searchLocal("Yūsuf", NONE); // a macron on the u
    expect(group(withMark, "surahs")?.hits.map((h) => h.id)).toContain("12");
    expect(group(searchLocal("fatiha", NONE), "surahs")!.hits[0]).toMatchObject({ id: "1", title: "Al-Faatiha" });
  });

  it("ranks a title that starts with the query before one that only contains it", () => {
    const hits = group(searchLocal("an", NONE), "surahs")!.hits;
    const first = hits.findIndex((h) => !h.title.toLowerCase().startsWith("an"));
    const lastStarts = hits.map((h) => h.title.toLowerCase().startsWith("an")).lastIndexOf(true);
    expect(first === -1 || lastStarts < first).toBe(true);
  });

  it("a number is that surah", () => {
    const hits = group(searchLocal("18", NONE), "surahs")!.hits;
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ id: "18", title: SURAH_ROWS[17]!.name });
  });

  it("every hit opens a page that exists", () => {
    for (const term of ["a", "e", "i", "o", "yusuf", "musa", "the"]) {
      for (const g of searchLocal(term, NONE)) {
        for (const h of g.hits) {
          expect(h.href, `${term} ${h.title}`).toMatch(/^\/(surah|persons|stories)\//);
          if (g.group === "surahs") expect(SURAH_ROWS[Number(h.id) - 1]).toBeTruthy();
          if (g.group === "people") expect(personById(h.id)).toBeTruthy();
          if (g.group === "stories") expect(storyById(h.id)).toBeTruthy();
        }
      }
    }
  });

  it("caps a group at 50", () => {
    for (const g of searchLocal("a", NONE)) expect(g.hits.length).toBeLessThanOrEqual(50);
  });

  it("finds notes by their text, tags or the item they are on, with a one-line snippet, and opens the item", () => {
    const notes = [
      { key: "ayah:94:5", title: "Ash-Sharh 94:5", note: "Ease comes with\nthe hardship.", tags: ["hope"], href: "/surah/94#ayah-5" },
      { key: "person:ibrahim", title: "Ibrahim", note: "Read again", tags: ["exam"], href: "/persons/ibrahim" },
      { key: "fiqh:wudu", title: "Fiqh topic: wudu", note: "ask", tags: [], href: null },
    ];
    expect(group(searchLocal("hardship", { notes }), "notes")!.hits).toEqual([{ group: "notes", id: "ayah:94:5", title: "Ash-Sharh 94:5", subtitle: "Ease comes with the hardship.", href: "/surah/94#ayah-5" }]);
    expect(group(searchLocal("exam", { notes }), "notes")!.hits.map((h) => h.id)).toEqual(["person:ibrahim"]); // a tag
    expect(group(searchLocal("wudu", { notes }), "notes")!.hits[0]!.href).toBeNull(); // an item without a page: shown, not linked
  });

  it("a long note is cut to one line", () => {
    const s = noteSnippet(`${"word ".repeat(100)}`);
    expect(s.length).toBeLessThanOrEqual(140);
    expect(s.endsWith("…")).toBe(true);
    expect(noteSnippet("short\n\nnote")).toBe("short note");
  });

  it("a later phase can register its own provider and its group appears in the order given", () => {
    const duas: LocalProvider = { group: "duas", label: "Duas", search: (q) => (q === "dua" ? [{ group: "duas", id: "d1", title: "A dua", subtitle: "", href: "/duas/d1" }] : []) };
    const r = searchLocal("dua", NONE, [...PROVIDERS, duas]);
    expect(r.at(-1)).toEqual({ group: "duas", label: "Duas", hits: [{ group: "duas", id: "d1", title: "A dua", subtitle: "", href: "/duas/d1" }] });
  });
});
