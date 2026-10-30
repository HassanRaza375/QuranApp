// Automated mismatch check (decision A1): compares the numbers, ordinal words and negation words of
// two language versions of one ruling. Pure and dependency-free. This is the TypeScript twin of
// scripts/wajibat/mismatch.py (which also reads the Persian originals from the downloaded pages);
// the test run requires both to agree on every English/Urdu pair. Word tables are shared.
import WORDS from "./wajibatMismatchWords.json";

export type MismatchLang = "en" | "ur" | "fa";
export type MismatchKind = "numbers" | "ordinals" | "negation";
export interface Mismatch {
  kind: MismatchKind;
  severity: "high" | "low";
  left: (number | string)[] | number;
  right: (number | string)[] | number;
}

const DIGITS: Record<string, string> = {};
"۰۱۲۳۴۵۶۷۸۹".split("").forEach((c, i) => (DIGITS[c] = String(i)));
"٠١٢٣٤٥٦٧٨٩".split("").forEach((c, i) => (DIGITS[c] = String(i)));
const TOKEN = /\d+(?:[.,/]\d+)?(?:st|nd|rd|th)?|\p{L}+(?:[-’']\p{L}+)*/gu;
const LIST_NO = /^\s*(?:\(?\d+[.)۔:\-–]|\(?[a-zA-Z][.)])\s+/gm;
const REF = new RegExp(WORDS.referenceStrip, "gi");
const NFC = (s: string) => s.normalize("NFC");

const tokens = (text: string, lang: MismatchLang): string[] => {
  let t = NFC(text).replace(/[۰-۹٠-٩]/g, (c) => DIGITS[c]).toLowerCase();
  t = t.replace(LIST_NO, "");
  for (const [a, b] of Object.entries(WORDS.normalize)) t = t.split(a).join(b);
  t = t.replace(/\[\d+\]/g, " ").replace(REF, " ");
  const extra = (WORDS.stripByLang as Record<string, string>)[lang];
  if (extra) t = t.replace(new RegExp(extra, "g"), " ");
  t = t.split("سی‌ام").join("سیم").split("‌").join(" ");
  return t.match(TOKEN) ?? [];
};

const key = (x: number | string) => String(x);
const sortKeys = (a: (number | string)[]) => [...a].sort((x, y) => (key(x) < key(y) ? -1 : key(x) > key(y) ? 1 : 0));

/** Numbers and ordinals (sorted: order is ignored) and the count of negation words. */
export const signals = (text: string, lang: MismatchLang) => {
  const card: (number | string)[] = [];
  const ordn: (number | string)[] = [];
  let neg = 0;
  const C = WORDS.cardinals[lang] as Record<string, number>;
  const O = WORDS.ordinals[lang] as Record<string, number>;
  const N = new Set(WORDS.negations[lang]);
  const NP = (WORDS.negationPrefixes as Record<string, string>)[lang];
  for (const tok of tokens(text, lang)) {
    const m = /^(\d+(?:[.,/]\d+)?)(st|nd|rd|th)?$/.exec(tok);
    if (m) {
      const v: number | string = /^\d+$/.test(m[1]) ? parseInt(m[1], 10) : m[1];
      (m[2] ? ordn : card).push(v);
    } else if (tok in O) ordn.push(O[tok]);
    else if (tok in C) card.push(C[tok]);
    if (N.has(tok) || (lang === "en" && /n['’]t$/.test(tok)) || (NP && new RegExp(NP).test(tok))) neg += 1;
  }
  return { numbers: sortKeys(card), ordinals: sortKeys(ordn), negation: neg };
};

const same = (a: (number | string)[], b: (number | string)[]) => a.length === b.length && a.every((x, i) => key(x) === key(b[i]));
const setOf = (a: (number | string)[]) => [...new Set(a.map(key))].sort().join(",");

/** "high": a number/ordinal on one side only, or a negation on one side only. "low": same values or presence, different count. */
export const compareVersions = (a: string, langA: MismatchLang, b: string, langB: MismatchLang): Mismatch[] => {
  const x = signals(a, langA);
  const y = signals(b, langB);
  const out: Mismatch[] = [];
  if (!same(x.numbers, y.numbers)) out.push({ kind: "numbers", severity: setOf(x.numbers) !== setOf(y.numbers) ? "high" : "low", left: x.numbers, right: y.numbers });
  if (!same(x.ordinals, y.ordinals)) out.push({ kind: "ordinals", severity: setOf(x.ordinals) !== setOf(y.ordinals) ? "high" : "low", left: x.ordinals, right: y.ordinals });
  if (x.negation !== y.negation) out.push({ kind: "negation", severity: (x.negation === 0) !== (y.negation === 0) ? "high" : "low", left: x.negation, right: y.negation });
  return out;
};
