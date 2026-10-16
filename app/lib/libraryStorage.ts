// Reading and writing the Library in the legacy storage keys. Reads tolerate anything (a damaged value is read as empty and
// never thrown); every write re-reads first (the stores call `readLibrary()` before each operation), so a second tab's
// different items are not overwritten. Unknown fields are kept. Pure over the storage wrapper.
import { ADDED_AT_KEY, BOOKMARKS_KEY } from "./bookmarks";
import { emptyState, type Collection, type ItemMeta, type LibraryState } from "./library";
import { getJSON, remove, setJSON } from "./storage";

export const LIBRARY_KEY = "quran:library:v1";
/** The pre-library surah-only list. The legacy `load()` merges it into the bookmarks and deletes it. */
export const OLD_FAVOURITES_KEY = "quran:favorites:surah:v1";

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown): v is string => typeof v === "string";

function readMeta(raw: unknown): ItemMeta | null {
  if (!isObject(raw)) return null;
  const tags = Array.isArray(raw.tags) ? raw.tags.filter(str) : [];
  const collectionIds = Array.isArray(raw.collectionIds) ? raw.collectionIds.filter(str) : [];
  return { ...raw, note: str(raw.note) ? raw.note : "", tags, collectionIds, updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : 0 };
}

function readCollection(raw: unknown): Collection | null {
  if (!isObject(raw) || !str(raw.id) || !raw.id || !str(raw.name)) return null;
  return { ...raw, id: raw.id, name: raw.name, description: str(raw.description) ? raw.description : "", createdAt: typeof raw.createdAt === "number" ? raw.createdAt : 0 };
}

/**
 * The migration the legacy `load()` does: a non-empty `quran:favorites:surah:v1` is merged into the bookmarks and the old key
 * is removed. Running it again changes nothing (the old key is gone).
 */
export function migrateOldFavourites(): boolean {
  const old = getJSON<unknown>(OLD_FAVOURITES_KEY, null);
  if (!Array.isArray(old) || !old.length) return false;
  const current = getJSON<unknown>(BOOKMARKS_KEY, []);
  const list = Array.isArray(current) ? current.filter(str) : [];
  for (const k of old.filter(str)) if (!list.includes(k)) list.push(k);
  if (!setJSON(BOOKMARKS_KEY, list)) return false; // do not delete the old list when the new one could not be written
  remove(OLD_FAVOURITES_KEY);
  return true;
}

export function readLibrary(): LibraryState {
  migrateOldFavourites();
  const s = emptyState();
  const b = getJSON<unknown>(BOOKMARKS_KEY, []);
  s.bookmarks = Array.isArray(b) ? b.filter(str).filter((k, i, a) => a.indexOf(k) === i) : [];
  const a = getJSON<unknown>(ADDED_AT_KEY, {});
  if (isObject(a)) for (const [k, v] of Object.entries(a)) if (typeof v === "number" && Number.isFinite(v)) s.addedAt[k] = v;
  const lib = getJSON<unknown>(LIBRARY_KEY, null);
  if (isObject(lib)) {
    const { collections, itemMeta, retiredCollectionIds, ...rest } = lib;
    s.libraryRest = rest;
    if (Array.isArray(collections)) {
      const seen = new Set<string>();
      for (const c of collections) {
        const col = readCollection(c);
        if (col && !seen.has(col.id)) {
          seen.add(col.id);
          s.collections.push(col);
        }
      }
    }
    if (isObject(itemMeta)) for (const [k, v] of Object.entries(itemMeta)) {
      const m = readMeta(v);
      if (m) s.itemMeta[k] = m;
    }
    s.retiredCollectionIds = Array.isArray(retiredCollectionIds) ? retiredCollectionIds.filter(str) : [];
  }
  return s;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Writes only what changed. Returns false when a write failed (storage blocked or full). */
export function writeLibrary(s: LibraryState): boolean {
  let ok = true;
  if (!same(getJSON<unknown>(BOOKMARKS_KEY, []), s.bookmarks)) ok = setJSON(BOOKMARKS_KEY, s.bookmarks) && ok;
  if (!same(getJSON<unknown>(ADDED_AT_KEY, {}), s.addedAt)) ok = setJSON(ADDED_AT_KEY, s.addedAt) && ok;
  const record: Record<string, unknown> = { collections: s.collections, itemMeta: s.itemMeta, ...s.libraryRest };
  if (s.retiredCollectionIds.length) record.retiredCollectionIds = s.retiredCollectionIds;
  const had = getJSON<unknown>(LIBRARY_KEY, null) !== null;
  const empty = !s.collections.length && !Object.keys(s.itemMeta).length && !s.retiredCollectionIds.length && !Object.keys(s.libraryRest).length;
  if ((had || !empty) && !same(getJSON<unknown>(LIBRARY_KEY, null), record)) ok = setJSON(LIBRARY_KEY, record) && ok;
  return ok;
}
