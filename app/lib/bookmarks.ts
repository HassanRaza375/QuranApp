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
