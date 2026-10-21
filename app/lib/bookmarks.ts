// Bookmarks, in the legacy storage format: `quran:bookmarks:v1` (JSON array of keys) and
// `quran:bookmarks:added-at:v1` (JSON map key -> first-bookmarked timestamp). Same behaviour as the legacy
// `useBookmarks` add/remove (a key is added once; the timestamp is set once; removing deletes both).
import { getJSON, setJSON } from "./storage";

export const BOOKMARKS_KEY = "quran:bookmarks:v1";
export const ADDED_AT_KEY = "quran:bookmarks:added-at:v1";

export const ayahBookmarkKey = (surah: number, ayah: number) => `ayah:${surah}:${ayah}`;

const readList = (): string[] => {
  const v = getJSON<unknown>(BOOKMARKS_KEY, []);
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
};
const readAddedAt = (): Record<string, number> => {
  const v = getJSON<unknown>(ADDED_AT_KEY, {});
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, number>) : {};
};

/** When the key was first saved (milliseconds), so an Undo can put the original time back. */
export const bookmarkAddedAt = (key: string): number | undefined => readAddedAt()[key];
export const listBookmarks = (): string[] => readList();
export const surahBookmarkKey = (surah: number) => `surah:${surah}`;
export const juzBookmarkKey = (juz: number) => `juz:${juz}`;
/** The legacy page bookmark (`page:49`), as the legacy per-page reader and Bookmarks write and read it. */
/** The legacy name bookmark (`name:12`), as the legacy Asma-ul-Husna page writes it and the Library lists it. */
export const nameBookmarkKey = (id: number) => `name:${id}`;
/** The legacy sajda bookmark (`sajda:32:15`). */
export const sajdaBookmarkKey = (surah: number, ayah: number) => `sajda:${surah}:${ayah}`;
export const pageBookmarkKey = (page: number) => `page:${page}`;

export const hasBookmark = (key: string): boolean => readList().includes(key);

export function addBookmark(key: string, now = Date.now()): void {
  const list = readList();
  if (!list.includes(key)) setJSON(BOOKMARKS_KEY, [...list, key]);
  const added = readAddedAt();
  if (!added[key]) setJSON(ADDED_AT_KEY, { ...added, [key]: now });
}

export function removeBookmark(key: string): void {
  setJSON(BOOKMARKS_KEY, readList().filter((k) => k !== key));
  const { [key]: _removed, ...rest } = readAddedAt();
  setJSON(ADDED_AT_KEY, rest);
}
