// Phase 10: the one normaliser (fold) must give exactly what the earlier whole-string version gave, for every string the app feeds it,
// and highlight() must paint matches on the ORIGINAL text. See app/lib/searchFold.ts.
import { describe, expect, it } from "vitest";
import { SURAH_ROWS } from "../app/data/quranMeta.generated";
import { normalize } from "../app/lib/listingSearch";
import { PEOPLE } from "../app/lib/people";
import { STORIES } from "../app/lib/stories";
import { fold, foldWithMap, highlight } from "../app/lib/searchFold";

/** The implementation before Phase 10 (app/lib/listingSearch.ts), kept here as the reference. */
const ARABIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
function reference(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(ARABIC_MARKS, "")
    .replace(/[آأإٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .toLowerCase()
    .replace(/[-_'‘’`.,:;()]/g, " ")
    .replace(/(\p{L})\1+/gu, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const HAND = [
  "Yūsuf", "Yusuf", "Mohammed Marmaduke William Pickthall", "Al-Faatiha", "al fatiha", "Aal-i-Imraan", "An-Nisaa", "  spaced   out  ", "a--b", "Aa  bb  cc",
  "رَبِّ", "رب", "آل عمران", "ٱلْحَمْدُ لِلَّهِ", "اللَّه", "كــتاب",
  "Istanbul İstanbul", "café ÉCOLE", "tab nbsp", "yeى and ي", "", "   ", "12:4", "it's", "it’s", "(brackets), colons: semi;",
];
const surahStrings = SURAH_ROWS.flatMap((s) => [s.name, s.ar, s.arLong, s.en, `${s.name} ${s.en} ${s.ar} ${s.arLong}`]);
const peopleStrings = PEOPLE.flatMap((p) => [p.name, p.arabicName ?? "", ...(p.alternateNames ?? []), p.shortDescription ?? "", ...(p.themes ?? [])]);
const storyStrings = STORIES.flatMap((s) => [s.title, s.arabicTitle ?? ""]);

describe("fold is the earlier normaliser, exactly", () => {
  const corpus = [...HAND, ...surahStrings, ...peopleStrings, ...storyStrings];
  it(`gives the same text for all ${corpus.length} strings the app uses (names, Arabic names, descriptions, hand-picked edge cases)`, () => {
    expect(corpus.length).toBeGreaterThan(500);
    const differ = corpus.filter((t) => foldWithMap(t).folded !== reference(t) || fold(t) !== reference(t));
    expect(differ.map((t) => [t, fold(t), foldWithMap(t).folded, reference(t)])).toEqual([]);
  });

  it("fold is the Surah listing's normalize (one normaliser)", () => {
    expect(fold).toBe(normalize);
  });

  it("folds the cases the search relies on", () => {
    expect(fold("Yūsuf")).toBe("yusuf");
    expect(fold("رَبِّ")).toBe(fold("رب"));
    expect(fold("آل عمران")).toBe(fold("ال عمران"));
    expect(fold("Al-Faatiha")).toBe("al fatiha");
    expect(fold("  A--b  ")).toBe("a b");
  });

  it("does not fold ta marbuta into ha (two different words)", () => {
    expect(fold("رحمة")).not.toBe(fold("رحمه"));
  });

  it("maps every folded character back to the character that produced it", () => {
    const { folded, origin } = foldWithMap("Yūsuf  رَبِّ");
    expect(folded).toBe("yusuf رب");
    expect(origin).toHaveLength(folded.length);
    expect(origin[0]).toBe(0); // y
    expect([...origin].sort((a, b) => a - b)).toEqual(origin); // never goes backwards
  });
});

const text = (segs: ReturnType<typeof highlight>) => segs.map((s) => (s.hit ? `[${s.text}]` : s.text)).join("");

describe("highlight paints the original text", () => {
  it("matches ignoring case, accents and spelling variants: yusuf in Yūsuf", () => {
    expect(text(highlight("Peace upon Yūsuf, the truthful", "yusuf"))).toBe("Peace upon [Yūsuf], the truthful");
    expect(text(highlight("MERCY and mercy", "Mercy"))).toBe("[MERCY] and [mercy]");
  });

  it("an Arabic query without marks lights up the marked word, marks included", () => {
    const t = "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ";
    const segs = highlight(t, "رب");
    expect(segs.filter((s) => s.hit).map((s) => s.text)).toEqual(["رَبِّ"]); // the word with every mark on it
    expect(segs.map((s) => s.text).join("")).toBe(t); // nothing lost, nothing added
  });

  it("falls back to each word when the whole phrase is not there", () => {
    expect(text(highlight("the mercy of the Lord", "lord mercy"))).toBe("the [mercy] of the [Lord]");
  });

  it("a doubled letter inside the match stays inside it", () => {
    expect(text(highlight("Hallo and halo", "halo"))).toBe("[Hallo] and [halo]");
  });

  it("does not paint the punctuation or the space after a match", () => {
    expect(text(highlight("Lo! with hardship goeth ease;", "ease"))).toBe("Lo! with hardship goeth [ease];");
    expect(text(highlight("But ease, and ease.", "ease"))).toBe("But [ease], and [ease].");
    expect(text(highlight("(mercy) \"mercy\"", "mercy"))).toBe("([mercy]) \"[mercy]\"");
    expect(text(highlight("please", "ease"))).toBe("pl[ease]");
  });

  it("returns the text untouched when there is nothing to match, and never loses characters", () => {
    expect(text(highlight("nothing here", "zzz"))).toBe("nothing here");
    expect(text(highlight("abc", ""))).toBe("abc");
    for (const [t, q] of [["a b c", "b"], ["xال y", "ال"], ["💬 mercy 💬", "mercy"], ["mercy mercy", "mercy"]] as const) {
      expect(highlight(t, q).map((s) => s.text).join("")).toBe(t);
    }
  });

  it("is plain data: markup in the text comes back as text", () => {
    const segs = highlight("a <b>mercy</b> & c", "mercy");
    expect(segs.map((s) => s.text).join("")).toBe("a <b>mercy</b> & c");
    expect(segs.find((s) => s.hit)?.text).toBe("mercy");
  });
});
