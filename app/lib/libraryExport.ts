// The Library's own export: only the Library's keys, in the same flat format as the Settings export (each value parsed when it is
// JSON). Settings, Data & privacy has the full export of everything.
import { ADDED_AT_KEY, BOOKMARKS_KEY } from "./bookmarks";
import { localDateKey } from "./dates";
import { notedKeys, type LibraryState } from "./library";
import { LIBRARY_KEY } from "./libraryStorage";
import { PINS_KEY } from "./pins";
import { READ_SURAHS_KEY } from "./readSurahs";
import { getRaw } from "./storage";

export const LIBRARY_EXPORT_KEYS = [BOOKMARKS_KEY, ADDED_AT_KEY, LIBRARY_KEY, PINS_KEY, READ_SURAHS_KEY] as const;

export function buildLibraryExport(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of LIBRARY_EXPORT_KEYS) {
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

export const libraryExportName = (now: Date): string => `quran-library-${localDateKey(now)}.json`;

export function exportMessage(s: LibraryState): string {
  const saved = s.bookmarks.length;
  const notes = notedKeys(s).length;
  return `Exported ${saved} saved item${saved === 1 ? "" : "s"} and ${notes} note${notes === 1 ? "" : "s"}.`;
}
