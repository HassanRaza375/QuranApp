// Ayah of the day: which ayah, and how it is stored so the legacy app can still read it.
//
// Legacy behaviour and its bugs (documented in docs/LEGACY_INVENTORY.md):
//  - the stored `date` is the UTC date (`toISOString().slice(0, 10)`), so the ayah changes at the wrong hour
//    (05:00 local in UTC+5, in the evening west of UTC);
//  - the pick is random ("ayah 1 to 7 of a random surah"), so it asks for ayahs that do not exist in short
//    surahs (for example ayah 5 of surah 108, which has 3) and the card stays empty.
//
// Here: the pick is deterministic from the LOCAL date, only valid ayahs, and only ayahs inside a length range.
import { legacyUtcDateKey, localDateKey } from "./dates";

/** An ayah is eligible if its Arabic text is at most this many characters (diacritics included): 5,817 of 6,236 ayahs. */
export const AYAH_MAX_CHARS = 250;
/** ...and at least this many, which leaves out the isolated-letter openings of some surahs. */
export const AYAH_MIN_CHARS = 15;

export interface AyahRef {
  surah: number;
  ayah: number;
}

/** Eligible ayahs as absolute positions (0-based, in Qur'an order). */
export function buildPool(lengths: number[][], max = AYAH_MAX_CHARS, min = AYAH_MIN_CHARS): number[] {
  const pool: number[] = [];
  let abs = 0;
  for (const surah of lengths) {
    for (const len of surah) {
      if (len >= min && len <= max) pool.push(abs);
      abs++;
    }
  }
  return pool;
}

/** Absolute position (0-based) to `{surah, ayah}` (1-based). */
export function refFromAbsolute(lengths: number[][], abs: number): AyahRef {
  let left = abs;
  for (let s = 0; s < lengths.length; s++) {
    const n = lengths[s]!.length;
    if (left < n) return { surah: s + 1, ayah: left + 1 };
    left -= n;
  }
  throw new RangeError(`ayah position ${abs} is outside the Qur'an`);
}

/** Total ayahs before the start of each surah: `sums[n]` = ayahs in surahs 1..n. */
export const prefixSums = (lengths: number[][]): number[] => {
  const sums = [0];
  for (const s of lengths) sums.push(sums[sums.length - 1]! + s.length);
  return sums;
};

// FNV-1a over the date string, then mulberry32: a small, stable, seedable generator (no Math.random).
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The ayah for a local date ("YYYY-MM-DD"). The same date always gives the same ayah, on every device. */
export function pickAyahForDate(localDate: string, lengths: number[][], pool = buildPool(lengths)): AyahRef {
  if (!pool.length) throw new RangeError("no eligible ayahs");
  const r = mulberry32(hash(`ayah-of-day:${localDate}`))();
  return refFromAbsolute(lengths, pool[Math.floor(r * pool.length)]!);
}

// ---- the stored entry (key `ayah-of-day`) ----

export interface AyahOfDayData {
  // fields the legacy component reads
  arabic: string;
  translation: string; // English
  urdu: string;
  surah_name: string; // legacy: the long Arabic name
  ayah_number: number;
  surah_number: number;
  // additive fields (the legacy app ignores them)
  bengali?: string;
  arabic2?: string;
  surah_name_en?: string;
}

export interface AyahOfDayEntry {
  /** UTC date, exactly what the legacy app compares against. Never used to decide "today" here. */
  date: string;
  /** Local calendar date the ayah was chosen for. Additive. */
  localDate?: string;
  data: AyahOfDayData;
}

export const AYAH_OF_DAY_KEY = "ayah-of-day";

export function makeEntry(data: AyahOfDayData, now: Date): AyahOfDayEntry {
  return { date: legacyUtcDateKey(now), localDate: localDateKey(now), data };
}

const num = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v > 0;

export function isAyahData(v: unknown): v is AyahOfDayData {
  const d = v as Partial<AyahOfDayData> | null;
  return !!d && typeof d.arabic === "string" && d.arabic.length > 0 && typeof d.translation === "string" && num(d.surah_number) && num(d.ayah_number);
}

/** Reads whatever is stored; returns null for anything that is not a usable entry. */
export function readEntry(raw: unknown): AyahOfDayEntry | null {
  const e = raw as Partial<AyahOfDayEntry> | null;
  if (!e || typeof e !== "object" || typeof e.date !== "string" || !isAyahData(e.data)) return null;
  return { date: e.date, localDate: typeof e.localDate === "string" ? e.localDate : undefined, data: e.data };
}

/**
 * Is this stored entry the one for `localToday`?
 * With `localDate` (written by the revamp) it must match. Without it (written by the legacy app, whose `date` is the
 * UTC date) it only counts if that date equals the local date, which can only ever lead to fetching a new ayah,
 * never to showing a stale one.
 */
export const isEntryFor = (entry: AyahOfDayEntry, localToday: string): boolean => (entry.localDate ?? entry.date) === localToday;

/** Builds the stored `data` from the verse service's JSON (same mapping as the legacy `pickRandomVerse`). */
export function dataFromVerse(json: Record<string, unknown>, surah: number, ayah: number): AyahOfDayData {
  const s = (k: string) => (typeof json[k] === "string" ? (json[k] as string) : "");
  return {
    arabic: s("arabic1"),
    translation: s("english"),
    urdu: s("urdu"),
    surah_name: s("surahNameArabicLong"),
    ayah_number: ayah,
    surah_number: surah,
    bengali: s("bengali") || undefined,
    arabic2: s("arabic2") || undefined,
    surah_name_en: s("surahName") || undefined,
  };
}

export type TranslationChoice = "english" | "urdu" | "bengali" | "arabic2" | null;

/** The translation to show: the user's `translationDefaultLang`, English when unset or missing. */
export function translationFor(data: AyahOfDayData, lang: TranslationChoice): { text: string; lang: "english" | "urdu" | "bengali" | "arabic2"; rtl: boolean } {
  const pick = (l: "urdu" | "bengali" | "arabic2", text: string | undefined) =>
    text ? { text, lang: l, rtl: l !== "bengali" } : { text: data.translation, lang: "english" as const, rtl: false };
  if (lang === "urdu") return pick("urdu", data.urdu);
  if (lang === "bengali") return pick("bengali", data.bengali);
  if (lang === "arabic2") return pick("arabic2", data.arabic2);
  return { text: data.translation, lang: "english", rtl: false };
}
