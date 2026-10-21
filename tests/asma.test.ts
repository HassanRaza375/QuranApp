// Phase 9B: Asma-ul-Husna. The names are the legacy data file; nothing is typed here. These tests pin what the data is, that only apostrophe
// typography is normalised, and the search and saved-name rules.
import names from "@legacy/assets/data/names.json";
import { describe, expect, it } from "vitest";
import { ASMA_FOOTER, asmaCountLine, noMatchLine, NO_SAVED_NAMES, parseNameHash, savedNameIds, SEARCH_LABEL, searchNames, shown, typeset, type AsmaName } from "../app/lib/asma";
import { nameBookmarkKey } from "../app/lib/bookmarks";

const NAMES = names as AsmaName[];
const marks = (s: string) => Array.from(s.normalize("NFKD")).filter((ch) => { const c = ch.codePointAt(0)!; return !((c >= 0x64b && c <= 0x65f) || c === 0x670 || (c >= 0x6d6 && c <= 0x6ed)); }).join("");

describe("the data file", () => {
  it("has 99 names with ids 1 to 99 in order, every field present, no duplicate Arabic or transliteration", () => {
    expect(NAMES).toHaveLength(99);
    expect(NAMES.map((n) => n.id)).toEqual(Array.from({ length: 99 }, (_, i) => i + 1));
    for (const n of NAMES) for (const k of ["arabic", "transliteration", "english", "urdu", "audio"] as const) expect(typeof n[k] === "string" && n[k].length > 0, `${n.id} ${k}`).toBe(true);
    expect(new Set(NAMES.map((n) => n.arabic)).size).toBe(99);
    expect(new Set(NAMES.map((n) => n.transliteration)).size).toBe(99);
  });

  it("the points the user reviews are pinned, so any change in the data shows up: the apostrophes and the repeated English meanings", () => {
    const withApostrophe = NAMES.filter((n) => /['’]/.test(n.transliteration)).map((n) => [n.id, /’/.test(n.transliteration) ? "curly" : "straight"]);
    expect(withApostrophe).toEqual([[6, "curly"], [24, "curly"], [49, "straight"], [59, "straight"], [72, "curly"], [78, "straight"], [83, "curly"]]);
    const counts = new Map<string, number[]>();
    for (const n of NAMES) counts.set(n.english, [...(counts.get(n.english) ?? []), n.id]);
    const repeated = [...counts].filter(([, ids]) => ids.length > 1).map(([e, ids]) => [e, ids]);
    expect(repeated).toEqual([["The Sustainer", [39, 63]], ["The Originator", [58, 95]]]);
  });
});

describe("typography only", () => {
  it("every apostrophe is typeset curly, and nothing else about any name or meaning changes", () => {
    for (const n of NAMES) {
      const s = shown(n);
      expect(s.shownTransliteration.replace(/’/g, "'"), `${n.id}`).toBe(n.transliteration.replace(/’/g, "'"));
      expect(s.shownEnglish.replace(/’/g, "'"), `${n.id}`).toBe(n.english.replace(/’/g, "'"));
      expect(s.shownTransliteration).not.toContain("'");
      expect(s.arabic).toBe(n.arabic);
      expect(s.urdu).toBe(n.urdu);
      expect(s.audio).toBe(n.audio);
    }
    expect(typeset("Al-Ba'ith")).toBe("Al-Ba’ith");
    expect(typeset("Ar-Rahman")).toBe("Ar-Rahman");
  });
  it("the data itself is not modified", () => {
    const before = JSON.stringify(NAMES);
    NAMES.map(shown);
    searchNames(NAMES, "mercy");
    expect(JSON.stringify(NAMES)).toBe(before);
  });
});

describe("search", () => {
  it("an empty query shows all 99; a number finds that name", () => {
    expect(searchNames(NAMES, "")).toHaveLength(99);
    expect(searchNames(NAMES, "   ")).toHaveLength(99);
    expect(searchNames(NAMES, "6").map((n) => n.id)).toEqual([6]);
    expect(searchNames(NAMES, "99").map((n) => n.id)).toEqual([99]);
    expect(searchNames(NAMES, "100")).toEqual([]);
  });
  it("the transliteration matches with or without hyphens, apostrophes and case", () => {
    expect(searchNames(NAMES, "ar-rahman").map((n) => n.id)).toContain(1);
    expect(searchNames(NAMES, "ar rahman").map((n) => n.id)).toContain(1);
    expect(searchNames(NAMES, "AR-RAHMAN").map((n) => n.id)).toContain(1);
    expect(searchNames(NAMES, "mumin").map((n) => n.id)).toContain(6); // Al-Mu’min
    expect(searchNames(NAMES, "mu'min").map((n) => n.id)).toContain(6);
    expect(searchNames(NAMES, "ba'ith").map((n) => n.id)).toContain(49); // data has a straight apostrophe
    expect(searchNames(NAMES, "ba’ith").map((n) => n.id)).toContain(49);
  });
  it("the English meaning matches", () => {
    expect(searchNames(NAMES, "merciful").map((n) => n.id)).toEqual(expect.arrayContaining([1, 2]));
    expect(searchNames(NAMES, "sustainer").map((n) => n.id)).toEqual([39, 63]);
  });
  it("the Arabic and the Urdu match, with or without vowel marks", () => {
    const n = NAMES[0]!;
    expect(searchNames(NAMES, n.arabic).map((x) => x.id)).toContain(1);
    expect(searchNames(NAMES, marks(n.arabic)).map((x) => x.id)).toContain(1);
    expect(searchNames(NAMES, marks(n.urdu)).map((x) => x.id)).toContain(1);
  });
  it("a query that matches nothing returns nothing", () => {
    expect(searchNames(NAMES, "zzzz")).toEqual([]);
  });
});

describe("saved names and the address", () => {
  it("the saved ids are read from the legacy name: keys only", () => {
    expect(nameBookmarkKey(12)).toBe("name:12");
    expect([...savedNameIds(["name:12", "name:3", "ayah:2:255", "name:", "names:5", "name:x", "surah:1"])].sort((a, b) => a - b)).toEqual([3, 12]);
  });
  it("#name-N opens a real name and nothing else", () => {
    expect(parseNameHash("#name-12", 99)).toBe(12);
    expect(parseNameHash("#name-99", 99)).toBe(99);
    for (const bad of ["", "#name-0", "#name-100", "#name-x", "#ayah-3", "name-3"]) expect(parseNameHash(bad, 99), bad).toBeNull();
  });
});

describe("the page's own wording", () => {
  it("is plain, and the search is labelled as a search of names (the legacy page said 'Search Surah')", () => {
    expect(SEARCH_LABEL).toBe("Search the names");
    expect(SEARCH_LABEL).not.toMatch(/surah/i);
    expect(NO_SAVED_NAMES).toBe("No names saved yet. Tap the star on a name.");
    expect(asmaCountLine(99, 99)).toBe("99 names");
    expect(asmaCountLine(3, 99)).toBe("3 of 99 names");
    expect(noMatchLine(" xyz ")).toBe("No names match “xyz”.");
    expect(ASMA_FOOTER).toContain("differ slightly between sources");
  });
});
