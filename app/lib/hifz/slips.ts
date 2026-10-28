// Which words you slipped on (Phase 14): `quran:hifz-words:v1`, NEW and additive (the legacy app ignores it).
//
//   { v: 1, ayahs: { "<surah>:<ayah>": { "<wordIndex>": { word, slipDays, cleanDays, last } } } }
//
// Keyed by surah and ayah (not by target), so removing a surah and adding it again keeps what is known about its tricky words. `word` is the word as
// it was shown: if the text ever changes so that an index points at another word, that entry is dropped instead of showing the wrong word.
//
// The rule (owner decision, 2026-10-28): a word is TRICKY once you have slipped on it on 2 different days, and stops being tricky after 3 different days on
// which its ayah was recited without a slip on that word. A slip starts the clean count again. Free practice never calls any of this.
import { getJSON, setJSON } from "../storage";
import { sameWord } from "./words";

export const WORDS_KEY = "quran:hifz-words:v1";
export const TRICKY_AFTER_SLIP_DAYS = 2;
export const CLEARED_AFTER_CLEAN_DAYS = 3;
const KEEP_DAYS = 8;

export interface WordEntry {
  word: string;
  /** distinct days with a slip on this word, oldest first */
  slipDays: string[];
  /** distinct days its ayah was recited without a slip on it, since the last slip */
  cleanDays: string[];
  last: string;
}
export type AyahWords = Record<string, WordEntry>;
export interface WordsRecord {
  v: 1;
  ayahs: Record<string, AyahWords>;
}

export const emptyWords = (): WordsRecord => ({ v: 1, ayahs: {} });
export const ayahKey = (surah: number, ayah: number): string => `${surah}:${ayah}`;

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const dayList = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

/** A stored value repaired for use: anything that is not the expected shape is dropped, never thrown on. */
export function parseWords(raw: unknown): WordsRecord {
  const out = emptyWords();
  if (!isObject(raw) || !isObject(raw.ayahs)) return out;
  for (const [key, ayah] of Object.entries(raw.ayahs)) {
    if (!isObject(ayah)) continue;
    const entries: AyahWords = {};
    for (const [idx, e] of Object.entries(ayah)) {
      if (!isObject(e) || typeof e.word !== "string" || !/^\d+$/.test(idx)) continue;
      entries[idx] = { word: e.word, slipDays: dayList(e.slipDays), cleanDays: dayList(e.cleanDays), last: typeof e.last === "string" ? e.last : "" };
    }
    if (Object.keys(entries).length) out.ayahs[key] = entries;
  }
  return out;
}

export const isTricky = (e: Pick<WordEntry, "slipDays" | "cleanDays">): boolean => e.slipDays.length >= TRICKY_AFTER_SLIP_DAYS && e.cleanDays.length < CLEARED_AFTER_CLEAN_DAYS;

const tail = (days: string[]): string[] => days.slice(-KEEP_DAYS);

/**
 * One graded recitation of an ayah: `words` is the ayah as shown, `slipped` the indices slipped on. Slipped words get today's slip (and a fresh clean
 * count); every other word that has an entry gets a clean day (unless it was slipped on today). An entry whose word no longer matches is dropped.
 */
export function recordRecitation(rec: WordsRecord, key: string, words: readonly string[], slipped: readonly number[], today: string): WordsRecord {
  const slips = new Set(slipped.filter((i) => i >= 0 && i < words.length));
  const before = rec.ayahs[key] ?? {};
  const next: AyahWords = {};
  for (const [idx, e] of Object.entries(before)) {
    const i = Number(idx);
    if (i >= words.length || !sameWord(e.word, words[i]!)) continue; // the text changed under this index
    next[idx] = e;
  }
  for (const i of slips) {
    const prev = next[String(i)];
    next[String(i)] = {
      word: words[i]!,
      slipDays: tail(prev?.slipDays.includes(today) ? prev.slipDays : [...(prev?.slipDays ?? []), today]),
      cleanDays: [],
      last: today,
    };
  }
  for (const [idx, e] of Object.entries(next)) {
    if (slips.has(Number(idx)) || e.slipDays.includes(today) || e.cleanDays.includes(today)) continue;
    next[idx] = { ...e, cleanDays: tail([...e.cleanDays, today]), last: today };
  }
  const others = Object.fromEntries(Object.entries(rec.ayahs).filter(([k]) => k !== key));
  return { v: 1, ayahs: Object.keys(next).length ? { ...others, [key]: next } : others };
}

/** The tricky words of one ayah in the text as shown: their indices and the words. Entries that no longer match the text are left out. */
export function trickyIn(rec: WordsRecord, key: string, words: readonly string[]): Array<{ index: number; word: string }> {
  const out: Array<{ index: number; word: string }> = [];
  for (const [idx, e] of Object.entries(rec.ayahs[key] ?? {})) {
    const i = Number(idx);
    if (i < words.length && sameWord(e.word, words[i]!) && isTricky(e)) out.push({ index: i, word: words[i]! });
  }
  return out.sort((a, b) => a.index - b.index);
}

/** Every tricky word of a surah, in reading order, with the ayah and on how many days it was slipped on. Uses the words as stored (no text needed). */
export function trickyOfSurah(rec: WordsRecord, surah: number): Array<{ ayah: number; index: number; word: string; days: number }> {
  const out: Array<{ ayah: number; index: number; word: string; days: number }> = [];
  for (const [key, entries] of Object.entries(rec.ayahs)) {
    const [s, a] = key.split(":").map(Number);
    if (s !== surah) continue;
    for (const [idx, e] of Object.entries(entries)) if (isTricky(e)) out.push({ ayah: a!, index: Number(idx), word: e.word, days: e.slipDays.length });
  }
  return out.sort((a, b) => a.ayah - b.ayah || a.index - b.index);
}

/** The words of one ayah slipped on at least once and not yet cleared, for "Slipped on <word> twice". */
export function slippedIn(rec: WordsRecord, key: string): Array<{ index: number; word: string; days: number }> {
  return Object.entries(rec.ayahs[key] ?? {})
    .filter(([, e]) => e.slipDays.length > 0 && e.cleanDays.length < CLEARED_AFTER_CLEAN_DAYS)
    .map(([idx, e]) => ({ index: Number(idx), word: e.word, days: e.slipDays.length }))
    .sort((a, b) => a.index - b.index);
}

export function readWords(): WordsRecord {
  return parseWords(getJSON<unknown>(WORDS_KEY, null));
}
export function writeWords(rec: WordsRecord): boolean {
  return setJSON(WORDS_KEY, rec);
}
