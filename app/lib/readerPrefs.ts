// Reader-only preferences, in a NEW additive key the legacy app ignores: `quran:reader-prefs:v1` = { translation?: "off" }.
// Kept apart from the legacy `translationDefaultLang`, which the legacy reader and Settings keep using. Pure.
import { effectiveTranslationLang, type Preferences, type TranslationLang } from "./preferences";
import { getJSON, mergeJSON } from "./storage";

export const READER_PREFS_KEY = "quran:reader-prefs:v1";

/** The names shown for the translation languages (the same words Settings uses). */
export const TRANSLATION_LABELS: Record<TranslationLang, string> = { english: "English", urdu: "Urdu", bengali: "Bengali", arabic2: "Arabic (Alt)" };

export interface ReaderPrefs {
  translation?: "off";
  /** the transliteration line under the Arabic (additive field; absent = off) */
  transliteration?: true;
}

export function readReaderPrefs(): ReaderPrefs {
  const v = getJSON<unknown>(READER_PREFS_KEY, null);
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const r = v as ReaderPrefs;
  return { ...(r.translation === "off" ? { translation: "off" as const } : {}), ...(r.transliteration === true ? { transliteration: true as const } : {}) };
}

/** Turns the transliteration line on or off, keeping any other field in the record. */
export function setTransliterationOn(on: boolean): void {
  mergeJSON(READER_PREFS_KEY, { transliteration: on ? true : null });
}

/** Turns "Off" on or off, keeping any other field in the record. */
export function setTranslationOff(off: boolean): void {
  mergeJSON(READER_PREFS_KEY, { translation: off ? "off" : null });
}

/**
 * Which translation the reader shows. Off wins. Otherwise the explicit choice, else the translation of the old reader's
 * text tab (`preferredVerseDisplay`), else English (as Home does).
 */
export function readerTranslation(p: Pick<Preferences, "translationLang" | "verseDisplay">, rp: ReaderPrefs): TranslationLang | null {
  if (rp.translation === "off") return null;
  return effectiveTranslationLang(p) ?? "english";
}
