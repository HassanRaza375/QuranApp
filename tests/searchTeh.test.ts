// Phase 10 (decided 2026-10-22): in Search, teh marbuta and heh count as one letter in the LOCAL groups and in highlighting only. The app's
// normaliser (used by the Surah listing, the Library and the other filters) still tells them apart, and the upstream's ayah search is unchanged.
import { describe, expect, it } from "vitest";
import { SURAH_ROWS } from "../app/data/quranMeta.generated";
import { normalize } from "../app/lib/listingSearch";
import { editionLabel } from "../app/lib/searchEditions";
import { highlight } from "../app/lib/searchFold";
import { queryVariants, searchLocal } from "../app/lib/searchLocal";

const TEH = String.fromCodePoint(0x629);
const HEH = String.fromCodePoint(0x647);
const FATHA = String.fromCodePoint(0x64e);
const ALEF = String.fromCodePoint(0x627);
const NONE = { notes: [] };
const endsWith = (s: string, c: string) => s.endsWith(c);
const swapEnd = (s: string, from: string, to: string) => s.slice(0, s.length - from.length) + to;

describe("queryVariants", () => {
  it("a heh that ends a word may be a teh marbuta; a teh marbuta may have been meant as heh; the text as typed always comes first", () => {
    const typed = `x${HEH}`;
    expect(queryVariants(typed)[0]).toBe(typed);
    expect(queryVariants(typed)).toContain(`x${TEH}`);
    expect(queryVariants(`x${TEH}`)).toContain(`x${HEH}`);
    expect(queryVariants("mercy")).toEqual(["mercy"]);
  });

  it("a heh inside a word is left alone, and a heh with a vowel mark before a space is still word-final", () => {
    const inside = `${HEH}${ALEF}x`;
    expect(queryVariants(inside)).toEqual([inside]);
    expect(queryVariants(`a${HEH}${FATHA} b`)).toContain(`a${TEH}${FATHA} b`);
    expect(queryVariants(`${HEH}${ALEF}${HEH} ${HEH}${ALEF}`)).toContain(`${HEH}${ALEF}${TEH} ${HEH}${ALEF}`); // only the word-final one changes
  });
});

describe("the local groups read teh marbuta and heh as one letter", () => {
  const withTeh = SURAH_ROWS.filter((s) => endsWith(s.ar, TEH));
  const withHeh = SURAH_ROWS.filter((s) => endsWith(s.ar, HEH));

  it("the real surah table has names ending in each letter (so these cases are not made up)", () => {
    expect(withTeh.length).toBeGreaterThan(5);
    expect(withHeh.length).toBeGreaterThan(0);
  });

  it("every surah whose Arabic name ends in teh marbuta is found by typing it with heh", () => {
    for (const s of withTeh) {
      const typed = swapEnd(s.ar, TEH, HEH);
      const ids = searchLocal(typed, NONE).find((g) => g.group === "surahs")?.hits.map((h) => h.id) ?? [];
      expect(ids, s.name).toContain(String(s.n));
    }
  });

  it("and every surah whose name ends in heh is found by typing it with teh marbuta", () => {
    for (const s of withHeh) {
      const typed = swapEnd(s.ar, HEH, TEH);
      const ids = searchLocal(typed, NONE).find((g) => g.group === "surahs")?.hits.map((h) => h.id) ?? [];
      expect(ids, s.name).toContain(String(s.n));
    }
  });

  it("a hit is listed once however many forms found it, and the exact spelling still ranks first", () => {
    const s = withTeh[0]!;
    const hits = searchLocal(s.ar, NONE).find((g) => g.group === "surahs")!.hits;
    expect(hits.filter((h) => h.id === String(s.n))).toHaveLength(1);
    expect(hits[0]!.id).toBe(String(s.n));
  });

  it("notes are matched the same way", () => {
    const note = { key: "ayah:1:1", title: "Al-Faatiha 1:1", note: `a note with ${TEH}`.replace(" with ", ` x${TEH} `), tags: [], href: "/surah/1#ayah-1" };
    const hits = searchLocal(`x${HEH}`, { notes: [note] }).find((g) => g.group === "notes")?.hits ?? [];
    expect(hits.map((h) => h.id)).toEqual(["ayah:1:1"]);
  });
});

describe("what is not changed", () => {
  it("the app's normaliser still tells the two letters apart (the Surah listing and the Library are unaffected)", () => {
    expect(normalize(`x${TEH}`)).not.toBe(normalize(`x${HEH}`));
  });

  it("highlighting treats them as one letter only when asked", () => {
    const word = SURAH_ROWS[1]!.ar;
    expect(endsWith(word, TEH)).toBe(true);
    const typed = swapEnd(word, TEH, HEH);
    const on = highlight(word, typed, { teh: true });
    expect(on.filter((s) => s.hit).map((s) => s.text).join("")).toBe(word);
    expect(highlight(word, typed).some((s) => s.hit)).toBe(false);
    expect(on.map((s) => s.text).join("")).toBe(word); // nothing lost
  });
});

describe("the label the Ayahs group shows", () => {
  it("names the group and the edition searched", () => {
    expect(editionLabel("en.pickthall")).toBe("English: Pickthall");
    expect(editionLabel("en.asad")).toBe("English: Muhammad Asad");
    expect(editionLabel("ur.jalandhry")).toBe("Urdu: Jalandhry");
    expect(editionLabel("quran-simple")).toBe("Arabic: Quran text");
    expect(editionLabel("ar.muyassar")).toBe("Tafsir: Muyassar");
    expect(editionLabel("ar.jalalayn")).toBe("Tafsir: Al-Jalalayn");
    expect(editionLabel("nope")).toBeUndefined();
  });
});
