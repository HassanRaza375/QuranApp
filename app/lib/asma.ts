// Asma-ul-Husna (Phase 9B). The 99 names come from the legacy data file (`@legacy/assets/data/names.json`), imported, never copied or typed.
// This module only reads that data: display typography, search, saved names and the hash that opens a name. Pure.
export interface AsmaName {
  id: number;
  arabic: string;
  transliteration: string;
  english: string;
  urdu: string;
  audio: string;
}

/**
 * The apostrophe in a name is typeset the same way everywhere (curly). The legacy data mixes straight and curly ones (for example
 * Al-Ba'ith and Al-Mu’min). Only this typography changes: letters, names and meanings are shown exactly as the data has them.
 */
export const typeset = (s: string): string => s.replace(/'/g, "’");

export interface ShownName extends AsmaName {
  /** display form: apostrophes typeset */
  shownTransliteration: string;
  shownEnglish: string;
}
export const shown = (n: AsmaName): ShownName => ({ ...n, shownTransliteration: typeset(n.transliteration), shownEnglish: typeset(n.english) });

/** Arabic and Urdu without vowel and recitation marks (by code point, so no Arabic is typed here), so a search matches either way. */
const MARK_RANGES: Array<[number, number]> = [[0x64b, 0x65f], [0x670, 0x670], [0x6d6, 0x6ed]];
const isMark = (c: number): boolean => MARK_RANGES.some(([a, b]) => c >= a && c <= b);
const stripMarks = (s: string): string => Array.from(s.normalize("NFKD")).filter((ch) => !isMark(ch.codePointAt(0)!)).join("");

/** Latin text for matching: lower case, apostrophes of either kind dropped, hyphens as spaces, one space. */
const plain = (s: string): string => s.toLowerCase().replace(/['’ʿʾ`]/g, "").replace(/-/g, " ").replace(/\s+/g, " ").trim();

/** The names that match a query: the number, the transliteration, the English meaning, the Arabic or the Urdu. An empty query matches all. */
export function searchNames(names: AsmaName[], query: string): AsmaName[] {
  const q = query.trim();
  if (!q) return names;
  if (/^\d{1,2}$/.test(q)) return names.filter((n) => n.id === Number(q));
  const lq = plain(q);
  const aq = stripMarks(q);
  return names.filter((n) => plain(n.transliteration).includes(lq) || plain(n.english).includes(lq) || stripMarks(n.arabic).includes(aq) || stripMarks(n.urdu).includes(aq));
}

/** The ids saved in the bookmark list (`name:<id>` keys). */
export function savedNameIds(keys: string[]): Set<number> {
  const out = new Set<number>();
  for (const k of keys) {
    const m = /^name:(\d+)$/.exec(k);
    if (m) out.add(Number(m[1]));
  }
  return out;
}

/** `#name-12` opens name 12; anything else (or a number that is not a name) is ignored. */
export function parseNameHash(hash: string, total: number): number | null {
  const m = /^#name-(\d+)$/.exec(hash);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= total ? n : null;
}

export const ASMA_FOOTER = "Lists of the 99 names differ slightly between sources. This is the list this app’s data uses.";
export const NO_SAVED_NAMES = "No names saved yet. Tap the star on a name.";
export const SEARCH_LABEL = "Search the names";
export const asmaCountLine = (shownCount: number, total: number): string => (shownCount === total ? `${total} names` : `${shownCount} of ${total} names`);
export const noMatchLine = (q: string): string => `No names match “${q.trim()}”.`;

/**
 * The names whose recording does not exist at the audio source today: its address answers 404 (checked 2026-10-22 against all 99; the other 96 answer
 * `200 audio/mpeg`). The Play button for these three says so instead of pretending; there is no fallback recording.
 */
export const NAMES_WITHOUT_RECORDING: readonly number[] = [53, 93, 97];
export const hasRecording = (id: number): boolean => !NAMES_WITHOUT_RECORDING.includes(id);
/** The clip's id in the player and its second line. */
export const nameClipId = (id: number): string => `name:${id}`;
export const NAME_CLIP_LINE = "Asma-ul-Husna";
