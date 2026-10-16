// A surah's text as the reader uses it, and the check that a response is complete before it is shown or stored.
// The service returns one object per surah with five texts of the same length (`arabic1` with diacritics, `arabic2`
// plain, and the English, Urdu and Bengali translations). A response with a missing or short array is rejected (not
// rendered half-empty, and never cached). Pure.
import { SURAH_ROWS } from "~/data/quranMeta.generated";

export const TEXT_KEYS = ["arabic1", "arabic2", "english", "urdu", "bengali"] as const;
export type TextKey = (typeof TEXT_KEYS)[number];

export interface Chapter {
  n: number;
  /** the service's transliteration, for example "Al-Baqara" (from the bundled list) */
  name: string;
  /** the English meaning, for example "The Cow" */
  en: string;
  /** the Arabic name with the word surah, as the service gives it */
  arLong: string;
  place: string;
  total: number;
  arabic1: string[];
  arabic2: string[];
  english: string[];
  urdu: string[];
  bengali: string[];
}

export class ChapterError extends Error {
  constructor(
    message: string,
    readonly kind: "invalid" | "missing" | "unavailable",
  ) {
    super(message);
  }
}

const isStringArray = (v: unknown, length: number): v is string[] => Array.isArray(v) && v.length === length && v.every((x) => typeof x === "string");

/** Validates a service response (or a stored record) for surah `n`. Throws ChapterError("invalid") when anything is off. */
export function parseChapter(raw: unknown, n: number): Chapter {
  const row = SURAH_ROWS[n - 1];
  if (!row || !Number.isInteger(n)) throw new ChapterError(`Surah ${n} does not exist`, "missing");
  const r = raw as Record<string, unknown> | null;
  if (!r || typeof r !== "object") throw new ChapterError("The response is not an object", "invalid");
  // A stored record uses our own field names; a service response uses the service's. Accept either.
  const total = (r.total ?? r.totalAyah) as unknown;
  const number = (r.n ?? r.surahNo) as unknown;
  if (number !== n) throw new ChapterError(`The response is for surah ${String(number)}, not ${n}`, "invalid");
  if (total !== row.ayahs) throw new ChapterError(`The response has ${String(total)} ayahs, expected ${row.ayahs}`, "invalid");
  for (const k of TEXT_KEYS) if (!isStringArray(r[k], row.ayahs)) throw new ChapterError(`The "${k}" text is missing or incomplete`, "invalid");
  const arLong = (r.arLong ?? r.surahNameArabicLong) as unknown;
  return {
    n,
    name: row.name,
    en: row.en,
    arLong: typeof arLong === "string" && arLong ? arLong : row.arLong,
    place: row.place,
    total: row.ayahs,
    arabic1: r.arabic1 as string[],
    arabic2: r.arabic2 as string[],
    english: r.english as string[],
    urdu: r.urdu as string[],
    bengali: r.bengali as string[],
  };
}

export const isSurahNumber = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 114;

/** "2" -> 2; anything that is not a whole number from 1 to 114 -> null. */
export function parseSurahParam(param: unknown): number | null {
  const s = Array.isArray(param) ? param[0] : param;
  if (typeof s !== "string" || !/^\d+$/.test(s)) return null;
  const n = Number(s);
  return isSurahNumber(n) ? n : null;
}

/** "#ayah-255" -> 255 when it is an ayah of this surah, else null (a bad hash is ignored). */
export function parseAyahHash(hash: string, total: number): number | null {
  const m = /^#ayah-(\d+)$/.exec(hash);
  if (!m) return null;
  const a = Number(m[1]);
  return a >= 1 && a <= total ? a : null;
}

/** The bismillah is shown above surahs 2 to 114 except 9. Surah 1 has it as its first ayah; surah 9 has none. */
export const showsBismillah = (n: number): boolean => n >= 2 && n <= 114 && n !== 9;

/**
 * The bismillah text, taken from the real data (the first ayah of surah 1), never typed in code. Null when surah 1 has
 * not been loaded (first visit, offline): the line is then left out.
 */
export const bismillahFrom = (chapter1: Chapter | null | undefined): string | null => (chapter1 && chapter1.n === 1 ? (chapter1.arabic1[0] ?? null) : null);

export interface TafsirEntry {
  author: string;
  groupVerse: string | null;
  content: string;
}

/** The tafsir response's list, kept only when every entry is usable. */
export function parseTafsir(raw: unknown): TafsirEntry[] {
  const list = (raw as { tafsirs?: unknown } | null)?.tafsirs;
  if (!Array.isArray(list)) throw new ChapterError("The tafsir response has no list", "invalid");
  const out: TafsirEntry[] = [];
  for (const t of list as Array<Record<string, unknown>>) {
    if (!t || typeof t.author !== "string" || typeof t.content !== "string") throw new ChapterError("A tafsir entry is incomplete", "invalid");
    out.push({ author: t.author, groupVerse: typeof t.groupVerse === "string" && t.groupVerse ? t.groupVerse : null, content: t.content });
  }
  return out;
}
