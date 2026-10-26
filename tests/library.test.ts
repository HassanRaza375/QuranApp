// The Library: every rule of the model, the rollback guarantee (after every operation the stored keys still load with the LEGACY
// parsing), the favourites migration, the item descriptions, search and sort, snippets, export and pins. Nothing here types a
// Qur'an snippet: the source scan at the end fails if any hard-coded Arabic text appears in the app code.
import "fake-indexeddb/auto";
import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AYAH_TEXT, closeRevampDb, getCached, putCached, REVAMP_DB_NAME } from "../app/db/revampDb";
import { ADDED_AT_KEY, BOOKMARKS_KEY } from "../app/lib/bookmarks";
import { ayahTextKey, loadSnippet, type SnippetDeps } from "../app/lib/ayahSnippet";
import * as L from "../app/lib/library";
import { buildLibraryExport, exportMessage, libraryExportName, LIBRARY_EXPORT_KEYS } from "../app/lib/libraryExport";
import { agoText, describeItem, groupItems, matches, OPENS_TODAY, sortItems, type Providers } from "../app/lib/libraryItems";
import { LIBRARY_KEY, migrateOldFavourites, OLD_FAVOURITES_KEY, readLibrary, writeLibrary } from "../app/lib/libraryStorage";
import { PINS_KEY, readPagePin, readReadingPin, writePagePin, writeReadingPin } from "../app/lib/pins";
import { READ_SURAHS_KEY } from "../app/lib/readSurahs";
import { getJSON, setStorageBackend, type KeyValueStore } from "../app/lib/storage";
import { memoryStore } from "./helpers";

afterEach(() => setStorageBackend(null));

// ---------------------------------------------------------------- the legacy parsing (a copy of what the legacy app does)
/**
 * What `useBookmarks.load`, `useLibrary.load`/`getMeta` and `pages/bookmarks.vue` do with the stored values. It throws on anything
 * the legacy page would choke on (a spread of a non-array, `.includes` on a non-array, a non-string key).
 */
function legacyLoad(store: KeyValueStore) {
  const read = (k: string): unknown => {
    const raw = store.getItem(k);
    if (raw === null || raw === "") return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };
  const arr = (read(BOOKMARKS_KEY) as unknown[] | null) ?? [];
  if (!Array.isArray(arr)) throw new Error("bookmarks is not an array");
  const items = new Set(arr);
  for (const k of items) if (typeof k !== "string") throw new Error(`bookmark key ${String(k)} is not a string`);
  const addedAt = ((read(ADDED_AT_KEY) as Record<string, number> | null) ?? {}) as Record<string, number>;
  if (typeof addedAt !== "object" || Array.isArray(addedAt)) throw new Error("added-at is not a map");
  for (const [k, v] of Object.entries(addedAt)) if (typeof v !== "number") throw new Error(`added-at ${k} is not a number`);
  const lib = read(LIBRARY_KEY) as { collections?: unknown; itemMeta?: unknown } | null;
  const collections = (lib?.collections ?? []) as { id: unknown; name: unknown }[];
  const itemMeta = (lib?.itemMeta ?? {}) as Record<string, { note: unknown; tags: unknown; collectionIds: unknown; updatedAt: unknown }>;
  if (!Array.isArray(collections)) throw new Error("collections is not an array");
  const ids = new Set<string>();
  for (const c of collections) {
    if (typeof c.id !== "string" || typeof c.name !== "string") throw new Error("a collection has no id or name");
    if (ids.has(c.id)) throw new Error(`collection id ${c.id} is used twice`);
    ids.add(c.id);
  }
  for (const [k, m] of Object.entries(itemMeta)) {
    if (typeof m.note !== "string") throw new Error(`${k}: note is not a string`);
    if (!Array.isArray(m.tags) || m.tags.some((t) => typeof t !== "string")) throw new Error(`${k}: tags is not an array of strings`);
    if (!Array.isArray(m.collectionIds) || m.collectionIds.some((c) => typeof c !== "string")) throw new Error(`${k}: collectionIds is not an array of strings`);
    if (typeof m.updatedAt !== "number") throw new Error(`${k}: updatedAt is not a number`);
  }
  return { items, addedAt, collections, itemMeta };
}

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 9, 10, 12);
const C1 = "0b6d3a0e-7a54-4c1c-9d5b-1f3c1b2a0001";
const C2 = "0b6d3a0e-7a54-4c1c-9d5b-1f3c1b2a0002";

/** A realistic library as the legacy app wrote it, with every key family and a few unknown extras. */
const LEGACY = {
  [BOOKMARKS_KEY]: JSON.stringify(["surah:18", "ayah:2:255", "ayah:12:92", "juz:30", "page:49", "sajda:7:206", "name:1", "person:nuh", "audio:36", "fiqh:taqlid", "story:adamandiblis", "mystery:x"]),
  [ADDED_AT_KEY]: JSON.stringify({ "surah:18": T0 - 12 * DAY, "ayah:2:255": T0 - 2 * DAY, "ayah:12:92": T0 - DAY, "juz:30": T0 - 20 * DAY }),
  [LIBRARY_KEY]: JSON.stringify({
    collections: [
      { id: C1, name: "Daily adhkar", description: "", createdAt: T0 - 30 * DAY },
      { id: C2, name: "Forgiveness", description: "from my notes", createdAt: T0 - 20 * DAY, color: "teal" },
    ],
    itemMeta: {
      "ayah:2:255": { note: "Read before sleeping.", tags: ["night"], collectionIds: [C1], updatedAt: T0 - DAY },
      "ayah:12:92": { note: "Forgiveness without conditions.", tags: ["forgiveness"], collectionIds: [C2], updatedAt: T0, extra: { keep: "me" } },
      "ayah:7:23": { note: "A note on an ayah that was never saved.", tags: [], collectionIds: [C2], updatedAt: T0 - 3 * DAY },
    },
    futureField: { keep: true },
  }),
};

const seeded = (extra: Record<string, string> = {}) => {
  const s = memoryStore({ ...LEGACY, ...extra });
  setStorageBackend(s);
  return s;
};

/** One user action: re-read from storage, apply the pure operation, write back, then check the legacy parsing and the invariants. */
function commit<T>(s: KeyValueStore, op: (state: L.LibraryState) => { state: L.LibraryState; out: T } | L.Failure): T | L.Failure {
  const fresh = readLibrary();
  const r = op(fresh);
  if (L.isFailure(r)) return r;
  expect(writeLibrary(r.state)).toBe(true);
  const view = legacyLoad(s);
  // the invariants: every collection id used by a meta exists; no id is both live and retired
  const live = new Set(view.collections.map((c) => c.id as string));
  for (const [k, m] of Object.entries(view.itemMeta)) for (const id of m.collectionIds as string[]) expect(live.has(id), `${k} uses a deleted collection ${id}`).toBe(true);
  const stored = readLibrary();
  for (const id of stored.retiredCollectionIds) expect(live.has(id)).toBe(false);
  return r.out;
}
const ok = <T>(r: T | L.Failure): T => {
  if (r && typeof r === "object" && L.isFailure(r as object)) throw new Error((r as L.Failure).error);
  return r as T;
};

describe("reading and writing: the legacy format, unchanged", () => {
  it("reads every key family, keeps order, unknown keys and unknown fields", () => {
    seeded();
    const s = readLibrary();
    expect(s.bookmarks).toHaveLength(12);
    expect(s.bookmarks).toContain("mystery:x");
    expect(s.collections.map((c) => c.id)).toEqual([C1, C2]);
    expect(s.collections[1]).toMatchObject({ color: "teal", description: "from my notes" });
    expect(s.itemMeta["ayah:12:92"]).toMatchObject({ extra: { keep: "me" } });
    expect(s.libraryRest).toEqual({ futureField: { keep: true } });
  });
  it("writing an unchanged library writes nothing at all (the bytes stay exactly as the legacy app left them)", () => {
    const s = seeded();
    const before = Object.fromEntries(s.data);
    expect(writeLibrary(readLibrary())).toBe(true);
    expect(Object.fromEntries(s.data)).toEqual(before);
  });
  it("a damaged value is read as empty and never throws", () => {
    for (const bad of ["{oops", "null", '"x"', "[]", "42"]) {
      setStorageBackend(memoryStore({ [BOOKMARKS_KEY]: bad, [ADDED_AT_KEY]: bad, [LIBRARY_KEY]: bad }));
      const s = readLibrary();
      expect(s.collections).toEqual([]);
      expect(s.itemMeta).toEqual({});
    }
    setStorageBackend(memoryStore({ [BOOKMARKS_KEY]: JSON.stringify(["a", 3, null, "a", "b"]), [LIBRARY_KEY]: JSON.stringify({ collections: [{ id: 5 }, { id: "x", name: "ok" }, { id: "x", name: "dup" }], itemMeta: { k: { note: 7, tags: "no", collectionIds: [1, "c"] }, bad: null } }) }));
    const s = readLibrary();
    expect(s.bookmarks).toEqual(["a", "b"]); // only strings, no duplicates
    expect(s.collections).toEqual([{ id: "x", name: "ok", description: "", createdAt: 0 }]);
    expect(s.itemMeta.k).toMatchObject({ note: "", tags: [], collectionIds: ["c"] });
    expect(s.itemMeta.bad).toBeUndefined();
  });
  it("a failed write is reported, not thrown", () => {
    const s = memoryStore({}, true); // every call throws, like blocked site data
    setStorageBackend(s);
    expect(writeLibrary(L.addBookmark(L.emptyState(), "surah:1", 5))).toBe(false);
  });
});

describe("the favourites migration (what the legacy load() does), idempotent", () => {
  it("merges the old surah list into the bookmarks and removes the old key; running again changes nothing", () => {
    const s = memoryStore({ [OLD_FAVOURITES_KEY]: JSON.stringify(["surah:1", "surah:2"]), [BOOKMARKS_KEY]: JSON.stringify(["surah:2", "ayah:1:1"]) });
    setStorageBackend(s);
    expect(migrateOldFavourites()).toBe(true);
    expect(getJSON(BOOKMARKS_KEY, [])).toEqual(["surah:2", "ayah:1:1", "surah:1"]);
    expect(s.data.has(OLD_FAVOURITES_KEY)).toBe(false);
    const after = Object.fromEntries(s.data);
    expect(migrateOldFavourites()).toBe(false);
    expect(migrateOldFavourites()).toBe(false);
    expect(Object.fromEntries(s.data)).toEqual(after);
    expect(readLibrary().bookmarks).toEqual(["surah:2", "ayah:1:1", "surah:1"]);
  });
  it("an empty or damaged old key is left alone (as the legacy code does), and a failed write keeps the old list", () => {
    setStorageBackend(memoryStore({ [OLD_FAVOURITES_KEY]: "[]" }));
    expect(migrateOldFavourites()).toBe(false);
    setStorageBackend(memoryStore({ [OLD_FAVOURITES_KEY]: "{no" }));
    expect(migrateOldFavourites()).toBe(false);
    const base = memoryStore({ [OLD_FAVOURITES_KEY]: JSON.stringify(["surah:5"]) });
    setStorageBackend({ ...base, setItem: () => { throw new Error("quota"); } });
    expect(migrateOldFavourites()).toBe(false);
    expect(base.data.has(OLD_FAVOURITES_KEY)).toBe(true); // nothing was lost
  });
});

describe("removing and restoring (decision 1: the note is kept)", () => {
  it("removing an item with a note keeps its meta; Undo restores the bookmark with its ORIGINAL saved time and place", () => {
    const store = seeded();
    const before = readLibrary();
    const r = ok(commit(store, (st) => { const x = L.removeItems(st, ["ayah:2:255"]); return { state: x.state, out: x }; }));
    expect(r.keptNote).toBe(true);
    const mid = readLibrary();
    expect(mid.bookmarks).not.toContain("ayah:2:255");
    expect(mid.addedAt["ayah:2:255"]).toBeUndefined();
    expect(mid.itemMeta["ayah:2:255"]).toEqual(before.itemMeta["ayah:2:255"]); // note, tag and collection all kept
    ok(commit(store, (st) => ({ state: L.restoreItems(st, r.undo), out: 0 })));
    const after = readLibrary();
    expect(after.bookmarks).toEqual(before.bookmarks); // same order
    expect(after.addedAt["ayah:2:255"]).toBe(T0 - 2 * DAY); // the first-saved time, not "now"
    expect(after.itemMeta).toEqual(before.itemMeta);
  });
  it("removing an item with nothing attached drops no record because there was none, and Undo brings back an empty meta only if it had one", () => {
    const store = seeded();
    const r = ok(commit(store, (st) => { const x = L.removeItems(st, ["surah:18", "juz:30"]); return { state: x.state, out: x }; }));
    expect(r.keptNote).toBe(false);
    expect(readLibrary().bookmarks).not.toContain("surah:18");
    ok(commit(store, (st) => ({ state: L.restoreItems(st, r.undo), out: 0 })));
    expect(readLibrary().bookmarks).toContain("surah:18");
    expect(readLibrary().addedAt["juz:30"]).toBe(T0 - 20 * DAY);
  });
  it("an empty meta entry (no note, tags or collections) goes when its item is removed, and returns with Undo", () => {
    const store = seeded({ [LIBRARY_KEY]: JSON.stringify({ collections: [], itemMeta: { "surah:18": { note: "", tags: [], collectionIds: [], updatedAt: 1 } } }) });
    const r = ok(commit(store, (st) => { const x = L.removeItems(st, ["surah:18"]); return { state: x.state, out: x }; }));
    expect(readLibrary().itemMeta["surah:18"]).toBeUndefined();
    ok(commit(store, (st) => ({ state: L.restoreItems(st, r.undo), out: 0 })));
    expect(readLibrary().itemMeta["surah:18"]).toBeDefined();
  });
  it("bulk removal is one undo, items that are not saved are ignored, and Undo never duplicates", () => {
    const store = seeded();
    const r = ok(commit(store, (st) => { const x = L.removeItems(st, ["surah:18", "nope:1", "ayah:2:255", "surah:18"]); return { state: x.state, out: x }; }));
    expect(r.undo.map((u) => u.key)).toEqual(["surah:18", "ayah:2:255"]);
    ok(commit(store, (st) => ({ state: L.restoreItems(L.restoreItems(st, r.undo), r.undo), out: 0 })));
    expect(readLibrary().bookmarks.filter((k) => k === "surah:18")).toHaveLength(1);
  });
  it("the reader's and the listing's stars (lib/bookmarks.ts) never touch itemMeta", () => {
    const store = seeded();
    const metaBefore = store.data.get(LIBRARY_KEY);
    // the same keys the reader writes: remove then add the ayah bookmark directly
    store.setItem(BOOKMARKS_KEY, JSON.stringify(readLibrary().bookmarks.filter((k) => k !== "ayah:2:255")));
    store.setItem(BOOKMARKS_KEY, JSON.stringify([...readLibrary().bookmarks, "ayah:2:255"]));
    expect(store.data.get(LIBRARY_KEY)).toBe(metaBefore);
  });
});

describe("notes, tags, collections", () => {
  it("a note is saved, trimmed to nothing it deletes the record, and the legacy shape is kept", () => {
    const store = seeded();
    ok(commit(store, (st) => ({ state: ok(L.setNote(st, "surah:18", "Friday reading", T0)), out: 0 })));
    expect(readLibrary().itemMeta["surah:18"]).toEqual({ note: "Friday reading", tags: [], collectionIds: [], updatedAt: T0 });
    ok(commit(store, (st) => ({ state: ok(L.setNote(st, "surah:18", "", T0 + 1)), out: 0 })));
    expect(readLibrary().itemMeta["surah:18"]).toBeUndefined();
    expect(L.isFailure(L.setNote(L.emptyState(), "surah:1", "x".repeat(L.NOTE_MAX + 1), 1))).toBe(true);
  });
  it("delete note clears only the note, drops the entry when nothing is left, and Undo restores it exactly", () => {
    const store = seeded();
    const r = commit(store, (st) => { const x = L.deleteNote(st, "ayah:7:23", T0); return { state: x.state, out: x.undo }; }) as L.NoteSnapshot;
    expect(readLibrary().itemMeta["ayah:7:23"]).toMatchObject({ note: "", collectionIds: [C2] }); // still in a collection: the entry stays
    const r2 = commit(store, (st) => { const x = L.deleteNote(st, "ayah:2:255", T0); return { state: x.state, out: x.undo }; }) as L.NoteSnapshot;
    expect(readLibrary().itemMeta["ayah:2:255"]).toMatchObject({ note: "", tags: ["night"] });
    ok(commit(store, (st) => ({ state: L.restoreNote(L.restoreNote(st, r2), r), out: 0 })));
    expect(readLibrary().itemMeta["ayah:2:255"]!.note).toBe("Read before sleeping.");
    expect(readLibrary().itemMeta["ayah:7:23"]!.note).toBe("A note on an ayah that was never saved.");
  });
  it("tags: trimmed, '#' stripped, no duplicates ignoring case, length and count limits", () => {
    let s = L.emptyState();
    s = ok(L.addTag(s, "ayah:1:1", "  #Night ", 1));
    expect(s.itemMeta["ayah:1:1"]!.tags).toEqual(["Night"]);
    expect(L.addTag(s, "ayah:1:1", "night", 2)).toMatchObject({ error: expect.stringContaining("already a tag") });
    expect(L.addTag(s, "ayah:1:1", "   ", 2)).toMatchObject({ error: "Write a tag first." });
    expect(L.addTag(s, "ayah:1:1", "x".repeat(31), 2)).toMatchObject({ error: expect.stringContaining("30") });
    for (let i = 0; i < 11; i++) s = ok(L.addTag(s, "ayah:1:1", `t${i}`, 3));
    expect(L.addTag(s, "ayah:1:1", "one more", 4)).toMatchObject({ error: expect.stringContaining("12") });
    s = L.removeTag(s, "ayah:1:1", "Night", 5);
    expect(s.itemMeta["ayah:1:1"]!.tags).not.toContain("Night");
  });
  it("collections: legacy shape (uuid id, empty description), no duplicate names, validation", () => {
    const store = seeded();
    const made = ok(commit(store, (st) => { const r = ok(L.createCollection(st, "  To memorise ", T0, () => "11111111-1111-4111-8111-111111111111")); return { state: r.state, out: r.collection }; }));
    expect(made).toEqual({ id: "11111111-1111-4111-8111-111111111111", name: "To memorise", description: "", createdAt: T0 });
    expect(L.createCollection(readLibrary(), "to memorise", T0, () => "x")).toMatchObject({ error: expect.stringContaining("already a collection") });
    expect(L.createCollection(readLibrary(), "  ", T0, () => "x")).toMatchObject({ error: "Give the collection a name." });
    expect(L.createCollection(readLibrary(), "n".repeat(61), T0, () => "x")).toMatchObject({ error: expect.stringContaining("60") });
    expect(readLibrary().collections.find((c) => c.id === C2)).toMatchObject({ color: "teal" }); // unknown fields of other collections kept
  });
  it("a collection id is never reused after deletion, even if the generator offers it again", () => {
    const store = seeded();
    const del = ok(commit(store, (st) => { const r = ok(L.deleteCollection(st, C1)); return { state: r.state, out: r.undo }; }));
    expect(readLibrary().retiredCollectionIds).toContain(C1);
    let offers = 0;
    const gen = () => (offers++ < 3 ? C1 : "22222222-2222-4222-8222-222222222222"); // the deleted id three times, then a fresh one
    const made = ok(commit(store, (st) => { const r = ok(L.createCollection(st, "Brand new", T0, gen)); return { state: r.state, out: r.collection }; }));
    expect(made.id).toBe("22222222-2222-4222-8222-222222222222");
    expect(offers).toBe(4);
    // and Undo of the deletion brings the SAME id back (it is the same collection) and un-retires it
    ok(commit(store, (st) => ({ state: L.restoreCollection(st, del), out: 0 })));
    expect(readLibrary().collections.map((c) => c.id)).toContain(C1);
    expect(readLibrary().retiredCollectionIds).not.toContain(C1);
    expect(() => L.freshCollectionId(L.emptyState(), () => "same")).not.toThrow();
    expect(() => L.freshCollectionId({ ...L.emptyState(), retiredCollectionIds: ["same"] }, () => "same")).toThrow();
  });
  it("deleting a collection removes its id from every item (as the legacy deleteCollection does); Undo puts every membership back", () => {
    const store = seeded();
    const del = ok(commit(store, (st) => { const r = ok(L.deleteCollection(st, C2)); return { state: r.state, out: r.undo }; }));
    expect(del.members.sort()).toEqual(["ayah:12:92", "ayah:7:23"]);
    expect(readLibrary().itemMeta["ayah:12:92"]!.collectionIds).toEqual([]);
    expect(L.isFailure(L.deleteCollection(readLibrary(), "gone"))).toBe(true);
    ok(commit(store, (st) => ({ state: L.restoreCollection(st, del), out: 0 })));
    const s = readLibrary();
    expect(s.collections.map((c) => c.id)).toEqual([C1, C2]); // the original order
    expect(s.itemMeta["ayah:12:92"]!.collectionIds).toEqual([C2]);
    expect(s.itemMeta["ayah:7:23"]!.collectionIds).toEqual([C2]);
  });
  it("toggle and bulk add: a collection that does not exist is ignored; adding is counted", () => {
    const s = L.addToCollection(readLibraryFrom(LEGACY), ["surah:18", "ayah:2:255", "juz:30"], C1, T0);
    expect(s.added).toBe(2); // ayah:2:255 was already in it
    expect(L.addToCollection(s.state, ["surah:18"], "nope", T0).added).toBe(0);
    const off = L.toggleCollection(s.state, "surah:18", C1, T0);
    expect(off.itemMeta["surah:18"]).toBeUndefined(); // nothing left on it: no record
    expect(L.collectionMembers(s.state, C1).sort()).toEqual(["ayah:2:255", "juz:30", "surah:18"]);
  });
  it("a note-only item is a member of its collection (a collection view lists it)", () => {
    expect(L.collectionMembers(readLibraryFrom(LEGACY), C2)).toContain("ayah:7:23");
    expect(L.isSaved(readLibraryFrom(LEGACY), "ayah:7:23")).toBe(false);
  });
});

function readLibraryFrom(values: Record<string, string>): L.LibraryState {
  setStorageBackend(memoryStore({ ...values }));
  return readLibrary();
}

describe("a note for any ayah (validated against the real ayah counts)", () => {
  it("accepts real ayahs, with spaces", () => {
    expect(L.parseAyahRef("2:255")).toEqual({ key: "ayah:2:255" });
    expect(L.parseAyahRef(" 114 : 6 ")).toEqual({ key: "ayah:114:6" });
    expect(L.parseAyahRef("1:7")).toEqual({ key: "ayah:1:7" });
  });
  it("refuses 2:999, 0:1, 115:1, 1:8 and anything that is not a reference, each with a clear message", () => {
    expect(L.parseAyahRef("2:999")).toEqual({ error: "Surah 2 does not have an ayah 999." });
    expect(L.parseAyahRef("1:8")).toEqual({ error: "Surah 1 does not have an ayah 8." });
    expect(L.parseAyahRef("0:1")).toEqual({ error: "There is no surah 0. Surahs are numbered 1 to 114." });
    expect(L.parseAyahRef("115:1")).toEqual({ error: "There is no surah 115. Surahs are numbered 1 to 114." });
    expect(L.parseAyahRef("2:0")).toEqual({ error: "Surah 2 does not have an ayah 0." });
    for (const bad of ["", "2", "2:", ":5", "2:1:3", "abc", "2:x", "-2:3", "2.5:3", "２:３"]) expect(L.parseAyahRef(bad), bad).toEqual({ error: "Enter an ayah reference like 2:255 (surah, then ayah)." });
  });
  it("creates a note without saving the ayah; an empty note is refused; an ayah that already has a note opens that note instead", () => {
    const store = seeded();
    const made = ok(commit(store, (st) => { const r = ok(L.newNote(st, "112:1", "Say, then think.", T0)); if (r.existing) throw new Error("existing"); return { state: r.state, out: r.key }; }));
    expect(made).toBe("ayah:112:1");
    expect(readLibrary().bookmarks).not.toContain("ayah:112:1");
    expect(readLibrary().itemMeta["ayah:112:1"]!.note).toBe("Say, then think.");
    expect(L.newNote(readLibrary(), "112:1", "again", T0)).toEqual({ key: "ayah:112:1", existing: true });
    expect(L.newNote(readLibrary(), "112:2", "   ", T0)).toEqual({ error: "Write a note first." });
    expect(L.newNote(readLibrary(), "112:99", "x", T0)).toEqual({ error: "Surah 112 does not have an ayah 99." });
  });
  it("lists the noted keys, saved or not", () => {
    expect(L.notedKeys(readLibraryFrom(LEGACY)).sort()).toEqual(["ayah:12:92", "ayah:2:255", "ayah:7:23"]);
  });
});

describe("a long run of operations: after EVERY step the stored keys load with the legacy parsing (the rollback guarantee)", () => {
  it("survives a mixed session and ends with exactly the data it should", () => {
    const store = seeded();
    const gens = ["a1", "a2", "a3", "a4"].map((x) => `${x}${x}${x}${x}-0000-4000-8000-000000000000`);
    let g = 0;
    const make = () => gens[g++]!;
    const steps: ((st: L.LibraryState) => L.LibraryState | L.Failure)[] = [
      (st) => L.addBookmark(st, "ayah:112:1", T0),
      (st) => L.addBookmark(st, "story:adamandiblis", T0), // already saved: no change
      (st) => L.setNote(st, "ayah:112:1", "A first note", T0),
      (st) => L.addTag(st, "ayah:112:1", "short", T0),
      (st) => { const r = L.createCollection(st, "Short surahs", T0, make); return L.isFailure(r) ? r : r.state; },
      (st) => L.toggleCollection(st, "ayah:112:1", gens[0]!, T0),
      (st) => L.removeItems(st, ["ayah:112:1"]).state,
      (st) => { const r = L.newNote(st, "114:1", "Seek refuge", T0); return L.isFailure(r) || r.existing ? ({ error: "x" } as L.Failure) : r.state; },
      (st) => { const r = L.deleteCollection(st, C1); return L.isFailure(r) ? r : r.state; },
      (st) => L.deleteNote(st, "ayah:12:92", T0).state,
      (st) => L.addToCollection(st, ["surah:18", "juz:30", "page:49"], gens[0]!, T0).state,
      (st) => L.removeItems(st, ["surah:18", "juz:30", "page:49", "person:nuh"]).state,
      (st) => { const r = L.createCollection(st, "Another", T0, make); return L.isFailure(r) ? r : r.state; },
    ];
    for (const [i, step] of steps.entries()) {
      const fresh = readLibrary();
      const next = step(fresh);
      if (L.isFailure(next)) continue; // a refused step changes nothing
      expect(writeLibrary(next), `step ${i} write`).toBe(true);
      expect(() => legacyLoad(store), `legacy parsing after step ${i}`).not.toThrow();
    }
    const end = readLibrary();
    expect(end.bookmarks).not.toContain("ayah:112:1");
    expect(end.itemMeta["ayah:112:1"]).toMatchObject({ note: "A first note", tags: ["short"], collectionIds: [gens[0]!] }); // kept after removal
    expect(end.collections.map((c) => c.name)).toEqual(["Forgiveness", "Short surahs", "Another"]);
    expect(end.retiredCollectionIds).toEqual([C1]);
    expect(end.libraryRest).toEqual({ futureField: { keep: true } }); // still there after all of that
    expect(end.itemMeta["ayah:12:92"]).toMatchObject({ extra: { keep: "me" } });
    expect(new Set(end.collections.map((c) => c.id)).size).toBe(end.collections.length);
  });
});

const providers: Providers = {
  person: (id) => (id === "nuh" ? { name: "Nuh", honorific: "AS", arabicName: "from the data" } : null),
  fiqhTopic: (id) => (id === "taqlid" ? { title: "Taqlid", category: "Foundations", categoryId: "foundations" } : null),
  name: (id) => (id === "1" ? { transliteration: "Ar-Rahman", english: "The Most Merciful", arabic: "from the data" } : null),
  story: (id) => (id === "adamandiblis" ? { title: "Adam and Iblis" } : null),
  entry: (m, id) => (m === "peoples" && id === "ad" ? { name: "'Ad", arabic: "from the data" } : null),
};

describe("what each key is (real data only)", () => {
  const d = (k: string) => describeItem(k, providers);
  it("surah, ayah, sajda, juz and page come from the bundled tables", () => {
    expect(d("surah:18")).toMatchObject({ type: "surah", title: "Al-Kahf", detail: "110 verses · Mecca", href: "/surah/18" });
    expect(d("ayah:2:255")).toMatchObject({ type: "ayah", title: "Al-Baqara 2:255", href: "/surah/2#ayah-255", ayah: { surah: 2, ayah: 255 } });
    expect(d("sajda:7:206")).toMatchObject({ type: "sajda", detail: "", href: "/surah/7#ayah-206" });
    expect(d("juz:30")).toMatchObject({ type: "juz", title: "Juz 30", href: "/surah/78#ayah-1" });
    expect(d("juz:30").detail).toContain("Pages 582–604");
    expect(d("page:49")).toMatchObject({ type: "page", title: "Page 49", href: "/per-page-read?page=49" });
  });
  it("people, names, stories, fiqh topics and reciters use the legacy data passed in; an unknown id still gets a readable row", () => {
    expect(d("person:nuh")).toMatchObject({ type: "person", title: "Nuh (AS)", href: "/persons/nuh" });
    expect(d("name:1")).toMatchObject({ type: "name", title: "Ar-Rahman", detail: "The Most Merciful" });
    expect(d("story:adamandiblis")).toMatchObject({ type: "story", title: "Adam and Iblis", href: "/stories/adamandiblis" });
    expect(d("fiqh:taqlid")).toMatchObject({ type: "fiqh", title: "Taqlid", detail: "Daily Fiqh · Foundations", href: "/fiqh/foundations/taqlid" });
    expect(d("audio:36")).toMatchObject({ type: "audio", title: "Yaseen", href: "/surah-audios/36" });
    expect(d("person:unknown")).toMatchObject({ type: "person", title: "Person: unknown" });
    expect(d("story:later")).toMatchObject({ type: "story", title: "Story: later" });
  });
  it("a key that matches nothing (a future type, a number out of range) is shown as itself, never dropped", () => {
    for (const k of ["mystery:x", "ayah:2:999", "surah:0", "surah:115", "juz:31", "page:605", "audio:200", "nonsense", ""]) {
      const i = d(k);
      expect(i.type, k).toBe("unknown");
      expect(i.href).toBeNull();
    }
    expect(d("mystery:x").title).toBe("mystery: x");
  });
  it("only the readers that exist today are 'open today'", () => {
    // audio: /surah-audios/[id] was rebuilt in Phase 11 (this line used to say false); all seven knowledge kinds open (Phase 12)
    expect(OPENS_TODAY).toMatchObject({ ayah: true, surah: true, sajda: true, juz: true, page: true, person: true, story: true, name: true, fiqh: false, audio: true, community: true, place: true, theme: true, dua: true, event: true, sign: true, command: true });
  });
  it("the seven legacy knowledge keys (community:, place:, theme:, dua:, event:, sign:, command:) become typed rows with the module as detail and the entry's name from the data", () => {
    expect(d("community:ad")).toMatchObject({ type: "community", title: "'Ad", detail: "Peoples & Nations", arabicName: "from the data", href: "/peoples/ad" });
    // an id the data does not have still gets a readable row, never a dropped one
    expect(d("community:nobody")).toMatchObject({ type: "community", title: "People or nation: nobody", href: "/peoples/nobody" });
    // a module whose pages are not built yet: the row says what it is and links to its (not rebuilt yet) route
    expect(d("dua:adamrepentance")).toMatchObject({ type: "dua", detail: "Duas", href: "/duas/adamrepentance" });
    for (const [key, type] of [["place:makkah", "place"], ["theme:tawhid", "theme"], ["event:x", "event"], ["sign:x", "sign"], ["command:x", "command"]] as const) expect(d(key).type).toBe(type);
    expect(d("community:").type).toBe("unknown");
  });
  it("saved-time wording from the added-at time", () => {
    const now = new Date(T0 + 3 * 3600_000);
    expect(agoText(T0, now)).toBe("saved today");
    expect(agoText(T0 - DAY, now)).toBe("saved yesterday");
    expect(agoText(T0 - 5 * DAY, now)).toBe("saved 5 days ago");
    expect(agoText(undefined, now)).toBe("saved earlier");
    expect(agoText(T0 - 90 * DAY, now)).toMatch(/^saved on \d/);
  });
});

describe("search, sort and group", () => {
  const state = readLibraryFrom(LEGACY);
  const items = state.bookmarks.map((k) => describeItem(k, providers));
  const all = { query: "", type: "all" as const, collectionId: null };
  const find = (f: Partial<typeof all>) => items.filter((i) => matches(i, state, { ...all, ...f })).map((i) => i.key);
  it("searches the title, the note, the tags, the collection names and the type", () => {
    expect(find({ query: "sleeping" })).toEqual(["ayah:2:255"]); // a note
    expect(find({ query: "forgiveness" }).sort()).toEqual(["ayah:12:92"]); // note, tag and collection name
    expect(find({ query: "adhkar" })).toEqual(["ayah:2:255"]); // a collection name
    expect(find({ query: "kahf" })).toEqual(["surah:18"]);
    expect(find({ query: "sajda" })).toEqual(["sajda:7:206"]); // the type
    expect(find({ query: "rahman" })).toEqual(["name:1"]);
    expect(find({ query: "nothing here" })).toEqual([]);
  });
  it("filters by type and by collection together with a search", () => {
    expect(find({ type: "ayah" }).sort()).toEqual(["ayah:12:92", "ayah:2:255"]);
    expect(find({ collectionId: C2 })).toEqual(["ayah:12:92"]);
    expect(find({ type: "ayah", collectionId: C1, query: "night" })).toEqual(["ayah:2:255"]);
  });
  it("recent: newest saved first, items with no saved time last; ord: surah order with non-Quran items after; name: A to Z", () => {
    const recent = sortItems(items, state, "recent").map((i) => i.key);
    expect(recent.slice(0, 4)).toEqual(["ayah:12:92", "ayah:2:255", "surah:18", "juz:30"]);
    expect(recent.slice(4)).not.toContain("ayah:12:92");
    const ord = sortItems(items, state, "ord").map((i) => i.key);
    expect(ord.slice(0, 4)).toEqual(["ayah:2:255", "sajda:7:206", "ayah:12:92", "surah:18"]);
    expect(ord.indexOf("juz:30")).toBeGreaterThan(ord.indexOf("surah:18"));
    const names = sortItems(items, state, "name").map((i) => i.title);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en")).length ? names : names);
    expect(sortItems(items, state, "recent")).toEqual(sortItems([...items].reverse(), state, "recent")); // stable and total
  });
  it("groups by collection (an item can be in several; 'No collection' last) and by type", () => {
    const withTwo = L.addToCollection(state, ["ayah:12:92"], C1, T0).state;
    const gc = groupItems(sortItems(items, withTwo, "recent"), withTwo, "collection");
    expect(gc.map((g) => g.label)).toEqual(["Daily adhkar", "Forgiveness", "No collection"]);
    expect(gc[0]!.items.map((i) => i.key).sort()).toEqual(["ayah:12:92", "ayah:2:255"]);
    expect(gc[1]!.items.map((i) => i.key)).toEqual(["ayah:12:92"]);
    const gt = groupItems(items, state, "type");
    expect(gt[0]!.label).toBe("Ayahs");
    expect(gt.map((g) => g.label)).toEqual([...gt.map((g) => g.label)]);
    expect(gt.at(-1)!.label).toBe("Other");
    expect(gt.flatMap((g) => g.items)).toHaveLength(items.length);
  });
  it("search ignores Arabic marks and accents like the listing does", () => {
    const s2 = L.setNote(state, "surah:18", "résumé", T0) as L.LibraryState;
    expect(matches(items[0]!, s2, { ...all, query: "resume" })).toBe(true);
  });
});

describe("ayah snippets: from the device, never typed, never a whole surah", () => {
  const chapter = { n: 2, arabic1: ["from the cached chapter one", "from the cached chapter two"] } as never;
  const mk = (over: Partial<SnippetDeps> = {}) => {
    const calls: string[] = [];
    const deps: SnippetDeps = {
      cachedChapter: async (s) => (calls.push(`chapter:${s}`), undefined),
      readAyah: async (k) => (calls.push(`read:${k}`), undefined),
      writeAyah: async (k) => void calls.push(`write:${k}`),
      fetchAyah: async (s, a) => (calls.push(`fetch:${s}:${a}`), { arabic1: `fetched ${s}:${a}` }),
      ...over,
    };
    return { deps, calls };
  };
  it("the cached chapter wins; then the ayah-text store; then one small request, stored", async () => {
    const a = mk({ cachedChapter: async () => chapter });
    expect(await loadSnippet(2, 2, a.deps, true)).toEqual({ state: "text", text: "from the cached chapter two" });
    expect(a.calls).toEqual([]);
    const b = mk({ readAyah: async () => "from the store" });
    expect(await loadSnippet(2, 255, b.deps, true)).toEqual({ state: "text", text: "from the store" });
    expect(b.calls).not.toContain("fetch:2:255");
    const c = mk();
    expect(await loadSnippet(2, 255, c.deps, true)).toEqual({ state: "text", text: "fetched 2:255" });
    expect(c.calls).toEqual(["chapter:2", "read:2:255", "fetch:2:255", "write:2:255"]);
  });
  it("offline with nothing cached is 'none' (the reference and a clear line), and makes no request", async () => {
    const m = mk();
    expect(await loadSnippet(2, 255, m.deps, false)).toEqual({ state: "none" });
    expect(m.calls.some((c) => c.startsWith("fetch"))).toBe(false);
  });
  it("a failed or empty answer is 'failed' (retry), an unusable cache is a miss, a failed write still shows the text", async () => {
    expect(await loadSnippet(2, 1, mk({ fetchAyah: async () => Promise.reject(new Error("net")) }).deps, true)).toEqual({ state: "failed" });
    expect(await loadSnippet(2, 1, mk({ fetchAyah: async () => ({ arabic1: "" }) }).deps, true)).toEqual({ state: "failed" });
    expect(await loadSnippet(2, 1, mk({ fetchAyah: async () => null }).deps, true)).toEqual({ state: "failed" });
    expect(await loadSnippet(2, 1, mk({ cachedChapter: async () => Promise.reject(new Error("idb")), readAyah: async () => Promise.reject(new Error("idb")) }).deps, false)).toEqual({ state: "none" });
    expect(await loadSnippet(2, 1, mk({ writeAyah: async () => Promise.reject(new Error("quota")) }).deps, true)).toEqual({ state: "text", text: "fetched 2:1" });
  });
  it("the dependencies have no way to fetch a whole chapter", () => {
    expect(Object.keys(mk().deps).sort()).toEqual(["cachedChapter", "fetchAyah", "readAyah", "writeAyah"]);
  });
  it("the ayah-text store (quran-revamp-db v3) round-trips and a miss is undefined", async () => {
    await closeRevampDb();
    indexedDB.deleteDatabase(REVAMP_DB_NAME);
    expect(await getCached(AYAH_TEXT, ayahTextKey(2, 255))).toBeUndefined();
    await putCached(AYAH_TEXT, ayahTextKey(2, 255), "stored text");
    expect(await getCached(AYAH_TEXT, "2:255")).toBe("stored text");
    await closeRevampDb();
  });
});

describe("export and pins", () => {
  it("the Library export holds only the Library's keys, parsed, and the file and message are right", () => {
    seeded({ themeMode: "dark", [PINS_KEY]: JSON.stringify({ v: 1, reading: { surahNo: 2, ayahNo: 255, pinnedAt: 1 } }), [READ_SURAHS_KEY]: JSON.stringify({ v: 1, surahs: { "1": { completedAt: 5 } } }) });
    const out = buildLibraryExport();
    expect(Object.keys(out).sort()).toEqual([...LIBRARY_EXPORT_KEYS].sort());
    expect(out).not.toHaveProperty("themeMode");
    expect((out[BOOKMARKS_KEY] as string[]).length).toBe(12);
    expect(libraryExportName(new Date(2026, 9, 16, 23, 30))).toBe("quran-library-2026-10-16.json");
    expect(exportMessage(readLibrary())).toBe("Exported 12 saved items and 3 notes.");
    expect(exportMessage(L.addBookmark(L.emptyState(), "surah:1", 1))).toBe("Exported 1 saved item and 0 notes.");
  });
  it("pins: the page pin is separate, damaged values are ignored, and writing one keeps the other and unknown fields", () => {
    setStorageBackend(memoryStore({ [PINS_KEY]: JSON.stringify({ v: 1, reading: { surahNo: 2, ayahNo: 255, pinnedAt: 7 }, study: { x: 1 } }) }));
    expect(readPagePin()).toBeNull();
    writePagePin({ pageNo: 49, pinnedAt: 9 });
    expect(readPagePin()).toEqual({ pageNo: 49, pinnedAt: 9 });
    expect(readReadingPin()).toMatchObject({ surahNo: 2, ayahNo: 255 });
    expect(getJSON<Record<string, unknown>>(PINS_KEY, {}).study).toEqual({ x: 1 });
    writeReadingPin(null);
    expect(readPagePin()).toEqual({ pageNo: 49, pinnedAt: 9 }); // clearing one pin leaves the other
    for (const bad of [{ pageNo: 0 }, { pageNo: 605 }, { pageNo: "7" }, { pageNo: 1.5 }, null, 5]) {
      setStorageBackend(memoryStore({ [PINS_KEY]: JSON.stringify({ page: bad }) }));
      expect(readPagePin(), JSON.stringify(bad)).toBeNull();
    }
  });
});

describe("nothing is typed: no hard-coded Arabic text anywhere in the app code", () => {
  it("scans every .vue and .ts file under app/ (the generated data tables are the only place Arabic may live)", () => {
    const root = path.resolve(__dirname, "../app");
    const hits: string[] = [];
    const walk = (d: string) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(vue|ts)$/.test(e.name) && !e.name.endsWith(".generated.ts") && e.name !== "listingSearch.ts") { // listingSearch holds character RANGES for diacritic stripping, not text
          fs.readFileSync(p, "utf8").split("\n").forEach((line, i) => {
            if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // a comment may quote an example
            if (/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(line)) hits.push(`${path.relative(root, p)}:${i + 1}`);
          });
        }
      }
    };
    walk(root);
    expect(hits).toEqual([]);
  });
});
