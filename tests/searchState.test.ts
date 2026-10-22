// Phase 10: the editions (compared with the vendored legacy list), the URL state, and the ayah-reference jump.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseJump, isNumericQuery } from "../app/lib/ayahJump";
import { DEFAULT_EDITION, EDITION_GROUPS, editionById, editionsIn, isRtlGroup, SEARCH_EDITIONS } from "../app/lib/searchEditions";
import { activeFilterCount, DEFAULT_STATE, stateFromQuery, stateToQuery } from "../app/lib/searchQuery";

describe("editions", () => {
  it("are exactly the ten the legacy page offered, in the same order and groups (read from the vendored legacy file)", () => {
    const src = fs.readFileSync(path.resolve(__dirname, "../legacy/app/composables/useSearch.ts"), "utf8");
    const legacy = [...src.matchAll(/\{\s*id:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*group:\s*"([^"]+)"\s*\}/g)].map((m) => ({ id: m[1], title: m[2], group: m[3] }));
    expect(legacy).toHaveLength(10);
    expect(SEARCH_EDITIONS.map((e) => ({ id: e.id, title: e.title, group: e.group }))).toEqual(legacy);
  });

  it("the legacy groups and labels are kept, and each group's default is its first edition", () => {
    expect(EDITION_GROUPS.map((g) => g.label)).toEqual(["English", "Urdu", "Arabic (Quran text)", "Arabic Tafsir"]);
    for (const g of EDITION_GROUPS) expect(DEFAULT_EDITION[g.value]).toBe(editionsIn(g.value)[0]!.id);
    expect(DEFAULT_EDITION.english).toBe("en.pickthall"); // the reader's English is not an edition the upstream has (docs/DECISIONS.md)
    expect(DEFAULT_EDITION.urdu).toBe("ur.jalandhry");
    expect(editionById("nope")).toBeUndefined();
    expect(isRtlGroup("english")).toBe(false);
    for (const g of ["urdu", "arabic", "tafsir"] as const) expect(isRtlGroup(g)).toBe(true);
  });
});

describe("URL state", () => {
  it("a plain search is just ?q=, and the defaults are not written", () => {
    expect(stateToQuery({ ...DEFAULT_STATE, q: "mercy" })).toEqual({ q: "mercy" });
    expect(stateToQuery(DEFAULT_STATE)).toEqual({});
    expect(stateToQuery({ ...DEFAULT_STATE, q: "   " })).toEqual({});
  });

  it("round-trips every filter with the legacy parameter names", () => {
    const s = { q: "patience", scope: "ayahs" as const, group: "urdu" as const, edition: "ur.maududi", surah: 2, juz: 3, bookmarked: true };
    const query = stateToQuery(s);
    expect(query).toEqual({ q: "patience", t: "ayahs", g: "urdu", e: "ur.maududi", s: "2", j: "3", b: "1" });
    expect(stateFromQuery(query)).toEqual(s);
  });

  it("reads a legacy URL (always carried g and e)", () => {
    expect(stateFromQuery({ q: "mercy", g: "english", e: "en.pickthall", s: "2" })).toEqual({ ...DEFAULT_STATE, q: "mercy", surah: 2 });
    expect(stateFromQuery({ q: "x", g: "tafsir", e: "ar.jalalayn", j: "30", b: "1" })).toMatchObject({ group: "tafsir", edition: "ar.jalalayn", juz: 30, bookmarked: true });
  });

  it("ignores anything unknown or out of range, and an edition that is not in the group falls back to the group's first (the legacy dropdown could disagree)", () => {
    expect(stateFromQuery({ g: "urdu", e: "en.asad" })).toMatchObject({ group: "urdu", edition: "ur.jalandhry" });
    expect(stateFromQuery({ g: "klingon", e: "zz" })).toMatchObject({ group: "english", edition: "en.pickthall" });
    expect(stateFromQuery({ s: "0", j: "31", b: "yes", t: "everything" })).toMatchObject({ surah: null, juz: null, bookmarked: false, scope: "all" });
    expect(stateFromQuery({ s: "115" }).surah).toBeNull();
    expect(stateFromQuery({ s: "114", j: "30" })).toMatchObject({ surah: 114, juz: 30 });
    expect(stateFromQuery({ q: ["a", "b"], s: ["2"] })).toMatchObject({ q: "a", surah: 2 }); // a repeated parameter: the first
    expect(stateFromQuery({ s: "2abc", j: "-1" })).toMatchObject({ surah: null, juz: null });
  });

  it("counts the filters on", () => {
    expect(activeFilterCount(DEFAULT_STATE)).toBe(0);
    expect(activeFilterCount({ ...DEFAULT_STATE, edition: "en.asad" })).toBe(1);
    expect(activeFilterCount({ ...DEFAULT_STATE, group: "urdu", edition: "ur.jalandhry", surah: 2, juz: 3, bookmarked: true })).toBe(4);
  });
});

describe("ayah reference jump", () => {
  it("opens the ayah for 2:255, 2.255 and 2 255, with the legacy surah spelling and the reader link", () => {
    for (const t of ["2:255", " 2:255 ", "2.255", "2 255", "2 : 255"]) {
      expect(parseJump(t), t).toEqual({ kind: "open", surah: 2, ayah: 255, surahName: "Al-Baqara", href: "/surah/2#ayah-255" });
    }
    expect(parseJump("114:6")).toMatchObject({ kind: "open", surahName: "An-Naas" });
  });

  it("checks the numbers against the real table", () => {
    expect(parseJump("2:287")).toEqual({ kind: "no-ayah", surah: 2, surahName: "Al-Baqara", ayahs: 286 });
    expect(parseJump("2:0")).toMatchObject({ kind: "no-ayah" });
    expect(parseJump("115:1")).toEqual({ kind: "no-surah" });
    expect(parseJump("0:1")).toEqual({ kind: "no-surah" });
    expect(parseJump("200:1")).toEqual({ kind: "no-surah" });
  });

  it("is not shaped like a reference: plain text, one number, three parts", () => {
    for (const t of ["mercy", "2", "2:255:1", "al-kahf 18", "", "18:", ":5"]) expect(parseJump(t), t).toBeNull();
  });

  it("a query of only digits is never sent to the text search", () => {
    expect(isNumericQuery("18")).toBe(true);
    expect(isNumericQuery(" 114 ")).toBe(true);
    expect(isNumericQuery("18a")).toBe(false);
    expect(isNumericQuery("2:255")).toBe(false);
  });
});
