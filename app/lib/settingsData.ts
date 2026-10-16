// Data & privacy actions: Export, Reset settings (with Undo), Clear all. Pure over the storage wrapper, so each one
// is unit-tested by spying on exactly what it touches.
import { localDateKey } from "./dates";
import { clearAllKeys, getJSON, getRaw, listKeys, remove, setJSON, setRaw } from "./storage";
import { CALC_KEY } from "./calcMethods";

/* ---------------- Export ---------------- */

/**
 * Same content and format as the legacy export: one flat object with every localStorage key, the value parsed when it is
 * valid JSON and kept as a string otherwise (so raw keys like `prayerFiqh` stay strings). IndexedDB and Cache Storage
 * are not included. The revamp's own new keys (for example the saved place) are localStorage keys, so they are in it.
 */
export function buildExport(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of listKeys()) {
    const raw = getRaw(key);
    if (raw === null) continue;
    try {
      out[key] = JSON.parse(raw);
    } catch {
      out[key] = raw;
    }
  }
  return out;
}

/** `quran-app-data-<local date>.json`. The legacy name used the UTC date, which is the wrong day for part of the day in some zones. */
export const exportFileName = (now: Date): string => `quran-app-data-${localDateKey(now)}.json`;

/* ---------------- Reset settings ---------------- */

/** Keys that hold only settings: removing them restores the defaults. */
const WHOLE_KEYS = [
  "prayerFiqh",
  "themeMode",
  "translationDefaultLang",
  "tafsirDefaultAuthor",
  "reciter",
  "prayerSettings",
  "quran:additional-modules-enabled:v1",
  CALC_KEY,
  "quran:download-prefs:v1",
  "quran:hijri-adjust:v1",
  "quran:verse-layout:v1",
  "quran:reader-prefs:v1", // the reader's translation Off (Phase 4A)
] as const;

/** Shared objects: only the setting fields are removed; other fields (for example `repeatOne`) are kept. */
const SHARED_FIELDS: Record<string, readonly string[]> = {
  "quran:accessibility:v1": ["reducedMotion", "highContrast", "largeTouchTargets", "arabicFontScale"],
  "quran:audio-prefs:v1": ["playbackRate", "autoAdvance"],
};

/**
 * NOT touched by Reset: bookmarks, notes, goals, progress, Hifz, downloads, the saved place (`quran:location:v1`,
 * `last_location`), the Daily Fiqh marja' (`quran:fiqh-prefs:v1`), `preferredVerseDisplay` (read only), the nav state.
 */
export const RESET_KEYS: string[] = [...WHOLE_KEYS, ...Object.keys(SHARED_FIELDS)];

export type SettingsSnapshot = Record<string, string | null>;

/** The raw stored value of every key Reset can change (null = not stored). */
export function snapshotSettings(): SettingsSnapshot {
  return Object.fromEntries(RESET_KEYS.map((k) => [k, getRaw(k)]));
}

/** Restores the defaults. Returns the snapshot taken just before, for Undo. */
export function resetSettings(): SettingsSnapshot {
  const before = snapshotSettings();
  for (const k of WHOLE_KEYS) remove(k);
  for (const [key, fields] of Object.entries(SHARED_FIELDS)) {
    const current = getJSON<unknown>(key, null);
    if (!current || typeof current !== "object" || Array.isArray(current)) continue;
    const rest = Object.fromEntries(Object.entries(current as Record<string, unknown>).filter(([f]) => !fields.includes(f)));
    if (Object.keys(rest).length) setJSON(key, rest);
    else remove(key);
  }
  return before;
}

/** Undo for Reset: writes every snapshotted value back exactly as it was. */
export function restoreSettings(snapshot: SettingsSnapshot): void {
  for (const [k, v] of Object.entries(snapshot)) {
    if (v === null) remove(k);
    else setRaw(k, v);
  }
}

/* ---------------- Clear all ---------------- */

export const REVAMP_DB = "quran-revamp-db";

/**
 * Clear all local data = what the legacy app does (`localStorage.clear()`), plus deleting the revamp's own database
 * (`quran-revamp-db`: saved prayer times). Nothing else: not the legacy `quran-app-db`, not Cache Storage (downloaded
 * audio, text, the app shell), not the service worker, not cookies. `deleteDb` is injected so a test can spy on it.
 */
export async function clearAllLocalData(deleteDb: (name: string) => Promise<void>): Promise<{ storageCleared: boolean }> {
  const storageCleared = clearAllKeys();
  await deleteDb(REVAMP_DB);
  return { storageCleared };
}
