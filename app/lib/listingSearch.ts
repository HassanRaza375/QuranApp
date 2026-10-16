// Matching for the Surah, Juz and Page filter box. Pure.
//
// The legacy listing compared the typed text with the marked Arabic long name, so typing the plain name (الفاتحة)
// found nothing. Here both sides are normalised first: Latin accents, Arabic vowel marks and tatweel are removed,
// alef and yeh variants are folded, case is ignored, hyphens and apostrophes become spaces, and repeated letters
// collapse (the data spells "Al-Faatiha"; people type "fatiha"). A purely numeric query means "that number".
import type { SurahRow } from "~/data/quranMeta.generated";
import type { JuzInfo } from "./quranMeta";

const ARABIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(ARABIC_MARKS, "")
    .replace(/[آأإٱ]/g, "ا") // alef variants -> plain alef
    .replace(/ى/g, "ي") // alef maqsura -> yeh
    .toLowerCase()
    .replace(/[-_'‘’`.,:;()]/g, " ")
    .replace(/(\p{L})\1+/gu, "$1") // collapse repeated letters
    .replace(/\s+/g, " ")
    .trim();
}

const squash = (s: string) => s.replace(/ /g, "");

/** True when the normalised query is found in the text, or when every word of it is. */
export function textMatches(haystack: string, query: string): boolean {
  const h = normalize(haystack);
  const q = normalize(query);
  if (!q) return true;
  if (h.includes(q) || squash(h).includes(squash(q))) return true;
  return q.split(" ").every((w) => h.includes(w));
}

const PLACE_WORDS: Record<SurahRow["place"], string> = { Mecca: "Mecca Meccan Makki", Madina: "Madina Medina Medinan Madani" };

const isNumeric = (q: string) => /^\d+$/.test(q.trim());

export function surahMatches(s: SurahRow, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  if (isNumeric(q)) return s.n === Number(q);
  return textMatches(`${s.name} ${s.en} ${s.ar} ${s.arLong} ${PLACE_WORDS[s.place]}`, q);
}

export function juzMatches(j: JuzInfo, startName: string, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  if (isNumeric(q)) return j.n === Number(q);
  return textMatches(`juz ${j.n} ${startName}`, q);
}

/** "Go to page": the page number typed, or null when it is not a whole number from 1 to `max`. */
export function parsePage(text: string, max = 604): number | null {
  const t = text.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n >= 1 && n <= max ? n : null;
}
