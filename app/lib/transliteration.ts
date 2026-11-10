// Transliteration (a Roman-script reading of the Arabic) for the reader. The text comes ONLY from the service (api.alquran.cloud, edition
// `en.transliteration`, one request per surah) and is cached whole per surah in quran-revamp-db. A response is checked before it is shown or stored:
// the right number of ayahs in order, every text a string. An ayah with an empty text is kept as "" and simply shows no line. Pure.
import { AYAH_COUNTS } from "./quranMeta";

export const TRANSLITERATION_EDITION = "en.transliteration";

export class TransliterationError extends Error {
  constructor(
    message: string,
    readonly kind: "invalid" | "unavailable",
  ) {
    super(message);
  }
}

/** The surah's transliteration, one string per ayah (index 0 is ayah 1). */
export type SurahTransliteration = string[];

/** Validates a service response (`{ data: { ayahs: [{ numberInSurah, text }] } }`) for surah `n`, or a stored record (a plain array). Throws "invalid" when anything is off. */
export function parseTransliteration(raw: unknown, n: number): SurahTransliteration {
  const total = AYAH_COUNTS[n - 1];
  if (!total || !Number.isInteger(n)) throw new TransliterationError(`Surah ${n} does not exist`, "invalid");
  if (Array.isArray(raw) && raw.length === total && raw.every((x) => typeof x === "string")) return raw as string[]; // a stored record
  const ayahs = (raw as { data?: { ayahs?: unknown } } | null)?.data?.ayahs;
  if (!Array.isArray(ayahs) || ayahs.length !== total) throw new TransliterationError(`The transliteration of surah ${n} is incomplete`, "invalid");
  const out: string[] = [];
  for (let i = 0; i < total; i++) {
    const a = ayahs[i] as { numberInSurah?: unknown; text?: unknown } | null;
    if (!a || a.numberInSurah !== i + 1 || typeof a.text !== "string") throw new TransliterationError(`The transliteration of surah ${n} is out of order`, "invalid");
    out.push(a.text.trim());
  }
  return out;
}

export interface TransliterationDeps {
  read(n: number): Promise<unknown | undefined>;
  write(n: number, lines: SurahTransliteration): Promise<void>;
  fetch(n: number): Promise<unknown>;
}

export interface LoadedTransliteration {
  value: SurahTransliteration;
  from: "cache" | "network";
}

/** The device's copy first, then the service (and the copy is stored). A cache that fails is a miss; a failed request is "unavailable" and is not remembered. */
export async function loadTransliteration(n: number, deps: TransliterationDeps): Promise<LoadedTransliteration> {
  const stored = await deps.read(n).catch(() => undefined);
  if (stored !== undefined) {
    try {
      return { value: parseTransliteration(stored, n), from: "cache" };
    } catch {
      /* damaged: fetched again and replaced below */
    }
  }
  let lines: SurahTransliteration;
  try {
    lines = parseTransliteration(await deps.fetch(n), n);
  } catch (e) {
    throw e instanceof TransliterationError ? e : new TransliterationError(`The transliteration of surah ${n} could not be loaded`, "unavailable");
  }
  await deps.write(n, lines).catch(() => undefined);
  return { value: lines, from: "network" };
}

/** One ayah's line, looked up by its key across surahs (a page or a juz spans several). Null when the surah is not loaded or the ayah has no text. */
export function transliterationOf(lines: Record<number, SurahTransliteration | undefined>, surah: number, ayah: number): string | null {
  return lines[surah]?.[ayah - 1] || null;
}

/** "2:255" -> the same lookup. A key that is not `surah:ayah` gives null. */
export function transliterationByKey(lines: Record<number, SurahTransliteration | undefined>, key: string): string | null {
  const m = /^(\d{1,3}):(\d{1,3})$/.exec(key);
  return m ? transliterationOf(lines, Number(m[1]), Number(m[2])) : null;
}
