// The Library model: bookmarks, notes, tags and collections, in the LEGACY storage format. Pure: every operation takes a state
// and returns a new one (plus what is needed to undo it), so each rule is unit-tested and the storage layer stays thin.
//
// Legacy formats (never changed here, and every unknown field is kept):
//   quran:bookmarks:v1             ["surah:2", "ayah:2:255", ...]
//   quran:bookmarks:added-at:v1    { "surah:2": 1760000000000, ... }
//   quran:library:v1               { collections: [{ id, name, description, createdAt }], itemMeta: { "<key>": { note, tags[], collectionIds[], updatedAt } } }
// The one deliberate difference from the legacy app: removing a saved item KEEPS its itemMeta when it has a note, tags or
// collections (the legacy app deleted it). The legacy app ignores meta for a key that is not bookmarked, so a rollback loses nothing.
import { isAyah } from "./quranMeta";

export interface Collection {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  [k: string]: unknown;
}

export interface ItemMeta {
  note: string;
  tags: string[];
  collectionIds: string[];
  updatedAt: number;
  [k: string]: unknown;
}

export interface LibraryState {
  bookmarks: string[];
  addedAt: Record<string, number>;
  collections: Collection[];
  itemMeta: Record<string, ItemMeta>;
  /** other top-level fields of the library record, kept as they were */
  libraryRest: Record<string, unknown>;
  /** ids of collections that were deleted: never handed out again */
  retiredCollectionIds: string[];
}

export const emptyState = (): LibraryState => ({ bookmarks: [], addedAt: {}, collections: [], itemMeta: {}, libraryRest: {}, retiredCollectionIds: [] });

export const NOTE_MAX = 5000;
export const TAG_MAX = 30;
export const TAGS_PER_ITEM = 12;
export const COLLECTION_NAME_MAX = 60;

export type Failure = { error: string };
export const isFailure = <T extends object>(r: T | Failure): r is Failure => "error" in r;

const hasContent = (m: ItemMeta | undefined): boolean => !!m && (m.note.trim() !== "" || m.tags.length > 0 || m.collectionIds.length > 0);
export const isSaved = (s: LibraryState, key: string): boolean => s.bookmarks.includes(key);

/** Meta as the legacy `getMeta` returns it (an empty one when there is none). */
export const metaOf = (s: LibraryState, key: string): ItemMeta => s.itemMeta[key] ?? { note: "", tags: [], collectionIds: [], updatedAt: 0 };

function withMeta(s: LibraryState, key: string, patch: Partial<ItemMeta>, now: number): LibraryState {
  const next: ItemMeta = { ...metaOf(s, key), ...patch, updatedAt: now };
  const itemMeta = { ...s.itemMeta };
  if (hasContent(next)) itemMeta[key] = next;
  else delete itemMeta[key]; // no note, no tags, no collections: no record
  return { ...s, itemMeta };
}

// ---------------------------------------------------------------- saving and removing

export function addBookmark(s: LibraryState, key: string, now: number): LibraryState {
  if (s.bookmarks.includes(key)) return s;
  return { ...s, bookmarks: [...s.bookmarks, key], addedAt: s.addedAt[key] ? s.addedAt : { ...s.addedAt, [key]: now } };
}

export interface RemovedItem {
  key: string;
  index: number;
  addedAt: number | undefined;
  /** the meta as it was, only when the removal dropped it (it had no content) */
  droppedMeta: ItemMeta | undefined;
}
export interface RemoveResult {
  state: LibraryState;
  undo: RemovedItem[];
  /** at least one removed item keeps a note (the toast says so) */
  keptNote: boolean;
}

export function removeItems(s: LibraryState, keys: string[]): RemoveResult {
  const undo: RemovedItem[] = [];
  let bookmarks = [...s.bookmarks];
  const addedAt = { ...s.addedAt };
  const itemMeta = { ...s.itemMeta };
  let keptNote = false;
  for (const key of keys) {
    const index = bookmarks.indexOf(key);
    if (index < 0) continue;
    bookmarks = bookmarks.filter((k) => k !== key);
    const when = addedAt[key];
    delete addedAt[key];
    const m = itemMeta[key];
    let droppedMeta: ItemMeta | undefined;
    if (m && !hasContent(m)) {
      droppedMeta = m;
      delete itemMeta[key];
    }
    if (m && m.note.trim()) keptNote = true;
    undo.push({ key, index, addedAt: when, droppedMeta });
  }
  return { state: { ...s, bookmarks, addedAt, itemMeta }, undo, keptNote };
}

/** Puts removed items back with their ORIGINAL first-saved time, in their original places where possible. */
export function restoreItems(s: LibraryState, undo: RemovedItem[]): LibraryState {
  let bookmarks = [...s.bookmarks];
  const addedAt = { ...s.addedAt };
  const itemMeta = { ...s.itemMeta };
  for (const u of [...undo].reverse()) {
    if (bookmarks.includes(u.key)) continue;
    bookmarks.splice(Math.min(u.index, bookmarks.length), 0, u.key);
    if (u.addedAt !== undefined) addedAt[u.key] = u.addedAt;
    if (u.droppedMeta && !itemMeta[u.key]) itemMeta[u.key] = u.droppedMeta;
  }
  bookmarks = [...bookmarks];
  return { ...s, bookmarks, addedAt, itemMeta };
}

// ---------------------------------------------------------------- notes and tags

export function setNote(s: LibraryState, key: string, note: string, now: number): LibraryState | Failure {
  if (note.length > NOTE_MAX) return { error: `A note can be up to ${NOTE_MAX} characters.` };
  if (metaOf(s, key).note === note) return s;
  return withMeta(s, key, { note }, now);
}

export interface NoteSnapshot {
  key: string;
  before: ItemMeta | undefined;
}

/** Clears only the note; the entry goes if nothing else is left in it. */
export function deleteNote(s: LibraryState, key: string, now: number): { state: LibraryState; undo: NoteSnapshot } {
  return { state: withMeta(s, key, { note: "" }, now), undo: { key, before: s.itemMeta[key] } };
}

export function restoreNote(s: LibraryState, u: NoteSnapshot): LibraryState {
  const itemMeta = { ...s.itemMeta };
  if (u.before) itemMeta[u.key] = u.before;
  else delete itemMeta[u.key];
  return { ...s, itemMeta };
}

const sameTag = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export function addTag(s: LibraryState, key: string, raw: string, now: number): LibraryState | Failure {
  const tag = raw.trim().replace(/^#+/, "").trim();
  if (!tag) return { error: "Write a tag first." };
  if (tag.length > TAG_MAX) return { error: `A tag can be up to ${TAG_MAX} characters.` };
  const tags = metaOf(s, key).tags;
  if (tags.some((t) => sameTag(t, tag))) return { error: `“${tag}” is already a tag on this item.` };
  if (tags.length >= TAGS_PER_ITEM) return { error: `An item can have up to ${TAGS_PER_ITEM} tags.` };
  return withMeta(s, key, { tags: [...tags, tag] }, now);
}

export const removeTag = (s: LibraryState, key: string, tag: string, now: number): LibraryState =>
  withMeta(s, key, { tags: metaOf(s, key).tags.filter((t) => t !== tag) }, now);

// ---------------------------------------------------------------- collections

/** A new unique id: never one in use and never one that was used before and deleted. */
export function freshCollectionId(s: LibraryState, make: () => string): string {
  const taken = new Set([...s.collections.map((c) => c.id), ...s.retiredCollectionIds]);
  for (let i = 0; i < 20; i++) {
    const id = make();
    if (!taken.has(id)) return id;
  }
  throw new Error("Could not make a unique collection id");
}

export function createCollection(s: LibraryState, rawName: string, now: number, make: () => string): { state: LibraryState; collection: Collection } | Failure {
  const name = rawName.trim();
  if (!name) return { error: "Give the collection a name." };
  if (name.length > COLLECTION_NAME_MAX) return { error: `A collection name can be up to ${COLLECTION_NAME_MAX} characters.` };
  if (s.collections.some((c) => c.name.toLowerCase() === name.toLowerCase())) return { error: `There is already a collection called “${name}”.` };
  const collection: Collection = { id: freshCollectionId(s, make), name, description: "", createdAt: now };
  return { state: { ...s, collections: [...s.collections, collection] }, collection };
}

export interface CollectionUndo {
  collection: Collection;
  index: number;
  members: string[];
}

export function deleteCollection(s: LibraryState, id: string): { state: LibraryState; undo: CollectionUndo } | Failure {
  const index = s.collections.findIndex((c) => c.id === id);
  if (index < 0) return { error: "That collection no longer exists." };
  const members = Object.keys(s.itemMeta).filter((k) => s.itemMeta[k]!.collectionIds.includes(id));
  const itemMeta: Record<string, ItemMeta> = {};
  for (const [k, m] of Object.entries(s.itemMeta)) itemMeta[k] = m.collectionIds.includes(id) ? { ...m, collectionIds: m.collectionIds.filter((c) => c !== id) } : m;
  return {
    state: { ...s, collections: s.collections.filter((c) => c.id !== id), itemMeta, retiredCollectionIds: s.retiredCollectionIds.includes(id) ? s.retiredCollectionIds : [...s.retiredCollectionIds, id] },
    undo: { collection: s.collections[index]!, index, members },
  };
}

export function restoreCollection(s: LibraryState, u: CollectionUndo): LibraryState {
  if (s.collections.some((c) => c.id === u.collection.id)) return s;
  const collections = [...s.collections];
  collections.splice(Math.min(u.index, collections.length), 0, u.collection);
  const itemMeta = { ...s.itemMeta };
  for (const k of u.members) {
    const m = itemMeta[k];
    if (m && !m.collectionIds.includes(u.collection.id)) itemMeta[k] = { ...m, collectionIds: [...m.collectionIds, u.collection.id] };
  }
  return { ...s, collections, itemMeta, retiredCollectionIds: s.retiredCollectionIds.filter((id) => id !== u.collection.id) };
}

export function toggleCollection(s: LibraryState, key: string, collectionId: string, now: number): LibraryState {
  if (!s.collections.some((c) => c.id === collectionId)) return s;
  const ids = metaOf(s, key).collectionIds;
  return withMeta(s, key, { collectionIds: ids.includes(collectionId) ? ids.filter((c) => c !== collectionId) : [...ids, collectionId] }, now);
}

/** Adds every key to the collection (those already in it stay). Returns how many were newly added. */
export function addToCollection(s: LibraryState, keys: string[], collectionId: string, now: number): { state: LibraryState; added: number } {
  if (!s.collections.some((c) => c.id === collectionId)) return { state: s, added: 0 };
  let state = s;
  let added = 0;
  for (const k of keys) {
    const ids = metaOf(state, k).collectionIds;
    if (ids.includes(collectionId)) continue;
    state = withMeta(state, k, { collectionIds: [...ids, collectionId] }, now);
    added++;
  }
  return { state, added };
}

export const collectionMembers = (s: LibraryState, collectionId: string): string[] => Object.keys(s.itemMeta).filter((k) => s.itemMeta[k]!.collectionIds.includes(collectionId));

// ---------------------------------------------------------------- a note for any ayah, saved or not

export type RefResult = { key: string } | Failure;

/** "2:255" against the REAL ayah counts: "2:999", "0:1", "115:1", "2", "2:1:3" and anything that is not numbers are refused. */
export function parseAyahRef(text: string): RefResult {
  const m = /^\s*(\d{1,3})\s*:\s*(\d{1,3})\s*$/.exec(text);
  if (!m) return { error: "Enter an ayah reference like 2:255 (surah, then ayah)." };
  const s = Number(m[1]);
  const a = Number(m[2]);
  if (s < 1 || s > 114) return { error: `There is no surah ${s}. Surahs are numbered 1 to 114.` };
  if (!isAyah(s, a)) return { error: `Surah ${s} does not have an ayah ${a}.` };
  return { key: `ayah:${s}:${a}` };
}

export type NewNoteResult = { state: LibraryState; key: string; existing: false } | { key: string; existing: true } | Failure;

export function newNote(s: LibraryState, ref: string, text: string, now: number): NewNoteResult {
  const r = parseAyahRef(ref);
  if (isFailure(r)) return r;
  if (!text.trim()) return { error: "Write a note first." };
  if (metaOf(s, r.key).note.trim()) return { key: r.key, existing: true }; // that ayah already has a note: edit it instead
  const out = setNote(s, r.key, text, now);
  if (isFailure(out)) return out;
  return { state: out, key: r.key, existing: false };
}

// ---------------------------------------------------------------- lists

export const notedKeys = (s: LibraryState): string[] => Object.keys(s.itemMeta).filter((k) => s.itemMeta[k]!.note.trim() !== "");

/** Keys in the order the legacy app stored them. */
export const savedKeys = (s: LibraryState): string[] => [...s.bookmarks];
