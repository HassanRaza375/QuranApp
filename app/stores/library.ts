// The Library store. Every change re-reads the three legacy keys first (so a second tab's different items are not overwritten), applies
// one pure operation from lib/library.ts, and writes back. It also re-reads when another tab or the reader changes a key (the
// `storage` event) and when this tab becomes visible again. Nothing here throws: a blocked storage shows one message.
import { defineStore } from "pinia";
import { describeItem, NO_PROVIDERS, type Item, type ItemType, type Providers } from "~/lib/libraryItems";
import * as L from "~/lib/library";
import { LIBRARY_KEY, OLD_FAVOURITES_KEY, readLibrary, writeLibrary } from "~/lib/libraryStorage";
import { ADDED_AT_KEY, BOOKMARKS_KEY } from "~/lib/bookmarks";
import { PINS_KEY, readPagePin, readReadingPin, writePagePin, writeReadingPin, type PagePin, type ReadingPin } from "~/lib/pins";

export const BLOCKED_MESSAGE = "Couldn’t save. Your browser is blocking storage for this site.";

const uuid = (): string => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);

export const useLibraryStore = defineStore("library", () => {
  const lib = ref<L.LibraryState>(L.emptyState());
  const loaded = ref(false);
  const blocked = ref(false);
  const readingPin = ref<ReadingPin | null>(null);
  const pagePin = ref<PagePin | null>(null);
  const providers = shallowRef<Providers>(NO_PROVIDERS);
  const loadedKinds = new Set<string>();
  const undo = useUndoToast();

  function reload() {
    lib.value = readLibrary();
    readingPin.value = readReadingPin();
    pagePin.value = readPagePin();
    loaded.value = true;
  }

  /** Lazily loads the legacy data tables for the kinds of item that exist (people, names, stories, fiqh), never all of them. */
  async function ensureProviders() {
    const kinds = new Set(lib.value.bookmarks.concat(Object.keys(lib.value.itemMeta)).map((k) => k.split(":")[0]!));
    const next: Providers = { ...providers.value };
    let changed = false;
    if (kinds.has("person") && !loadedKinds.has("person")) {
      loadedKinds.add("person");
      const { QURAN_PERSONS } = await import("@legacy/data/quranPersons");
      const byId = new Map(QURAN_PERSONS.map((p) => [p.id, p]));
      next.person = (id) => {
        const p = byId.get(id);
        return p ? { name: p.name, arabicName: p.arabicName } : null;
      };
      changed = true;
    }
    if (kinds.has("name") && !loadedKinds.has("name")) {
      loadedKinds.add("name");
      const names = (await import("@legacy/assets/data/names.json")).default as { id: number; arabic: string; transliteration: string; english: string }[];
      next.name = (id) => {
        const n = names.find((x) => String(x.id) === id);
        return n ? { transliteration: n.transliteration, english: n.english, arabic: n.arabic } : null;
      };
      changed = true;
    }
    if (kinds.has("story") && !loadedKinds.has("story")) {
      loadedKinds.add("story");
      const { QURAN_STORIES } = await import("@legacy/data/quranStories");
      next.story = (id) => {
        const s = QURAN_STORIES.find((x) => x.id === id);
        return s ? { title: s.title } : null;
      };
      changed = true;
    }
    if (kinds.has("fiqh") && !loadedKinds.has("fiqh")) {
      loadedKinds.add("fiqh");
      const [{ WAJIBAT_TOPICS }, { WAJIBAT_CATEGORIES }] = await Promise.all([import("@legacy/data/wajibat/topics"), import("@legacy/data/wajibat/categories")]);
      next.fiqhTopic = (id) => {
        const t = WAJIBAT_TOPICS.find((x) => x.id === id);
        if (!t) return null;
        const c = WAJIBAT_CATEGORIES.find((x) => x.id === t.categoryId);
        return { title: t.title.en, category: c?.title.en ?? t.categoryId, categoryId: t.categoryId, arabicTerm: t.arabicTerm };
      };
      changed = true;
    }
    if (changed) providers.value = next;
  }

  /** Applies one operation to a fresh read. Returns what the operation returned, or a failure (including a blocked write). */
  function apply<T>(op: (s: L.LibraryState) => { state: L.LibraryState; out: T } | L.Failure): T | L.Failure {
    const r = op(readLibrary());
    if (L.isFailure(r)) return r;
    const saved = writeLibrary(r.state);
    blocked.value = !saved;
    lib.value = r.state;
    if (!saved) return { error: BLOCKED_MESSAGE };
    void ensureProviders();
    return r.out;
  }
  const fail = (r: unknown): r is L.Failure => !!r && typeof r === "object" && "error" in r;
  const now = () => Date.now();

  /** The items the Library lists: everything saved, as described rows (a note-only item is not in this list). */
  const savedItems = computed<Item[]>(() => lib.value.bookmarks.map((k) => describeItem(k, providers.value)));
  const describe = (key: string): Item => describeItem(key, providers.value);
  const typesPresent = computed(() => new Set<ItemType>(savedItems.value.map((i) => i.type)));
  const notes = computed(() => L.notedKeys(lib.value));
  const meta = (key: string) => L.metaOf(lib.value, key);

  // ---------------------------------------------------------------- actions (each returns a failure or undefined)
  function save(key: string): L.Failure | undefined {
    const r = apply((s) => ({ state: L.addBookmark(s, key, now()), out: 0 }));
    return fail(r) ? r : undefined;
  }

  function remove(keys: string[], label: string): L.Failure | undefined {
    const r = apply((s) => {
      const x = L.removeItems(s, keys);
      return { state: x.state, out: x };
    });
    if (fail(r)) return r;
    if (!r.undo.length) return;
    undo.withUndo(r.keptNote ? `${label}. Your note is kept.` : `${label}.`, () => {
      apply((s) => ({ state: L.restoreItems(s, r.undo), out: 0 }));
    });
  }

  function setNote(key: string, text: string): L.Failure | undefined {
    const r = apply((s) => {
      const x = L.setNote(s, key, text, now());
      return L.isFailure(x) ? x : { state: x, out: 0 };
    });
    return fail(r) ? r : undefined;
  }

  function deleteNote(key: string): L.Failure | undefined {
    const r = apply((s) => {
      const x = L.deleteNote(s, key, now());
      return { state: x.state, out: x.undo };
    });
    if (fail(r)) return r;
    undo.withUndo("Note deleted.", () => void apply((s) => ({ state: L.restoreNote(s, r), out: 0 })));
  }

  function addTag(key: string, tag: string): L.Failure | undefined {
    const r = apply((s) => {
      const x = L.addTag(s, key, tag, now());
      return L.isFailure(x) ? x : { state: x, out: 0 };
    });
    return fail(r) ? r : undefined;
  }
  const removeTag = (key: string, tag: string) => void apply((s) => ({ state: L.removeTag(s, key, tag, now()), out: 0 }));
  const toggleCollection = (key: string, id: string) => void apply((s) => ({ state: L.toggleCollection(s, key, id, now()), out: 0 }));

  function createCollection(name: string): L.Collection | L.Failure {
    return apply((s) => {
      const x = L.createCollection(s, name, now(), uuid);
      return L.isFailure(x) ? x : { state: x.state, out: x.collection };
    });
  }

  function deleteCollection(id: string): L.Failure | undefined {
    const name = lib.value.collections.find((c) => c.id === id)?.name ?? "Collection";
    const r = apply((s) => {
      const x = L.deleteCollection(s, id);
      return L.isFailure(x) ? x : { state: x.state, out: x.undo };
    });
    if (fail(r)) return r;
    undo.withUndo(`Collection “${name}” deleted.`, () => void apply((s) => ({ state: L.restoreCollection(s, r), out: 0 })));
  }

  function addToCollection(keys: string[], id: string): number | L.Failure {
    return apply((s) => {
      const x = L.addToCollection(s, keys, id, now());
      return { state: x.state, out: x.added };
    });
  }

  function newNote(ref: string, text: string): { key: string; existing: boolean } | L.Failure {
    return apply((s) => {
      const x = L.newNote(s, ref, text, now());
      if (L.isFailure(x)) return x;
      return x.existing ? { state: s, out: { key: x.key, existing: true } } : { state: x.state, out: { key: x.key, existing: false } };
    });
  }

  // ---------------------------------------------------------------- pins
  function clearReadingPin() {
    const before = readReadingPin();
    if (!before) return;
    writeReadingPin(null);
    readingPin.value = null;
    undo.withUndo("Reading pin cleared.", () => {
      writeReadingPin(before);
      readingPin.value = before;
    });
  }
  function clearPagePin() {
    const before = readPagePin();
    if (!before) return;
    writePagePin(null);
    pagePin.value = null;
    undo.withUndo("Page pin cleared.", () => {
      writePagePin(before);
      pagePin.value = before;
    });
  }

  /** Follows other tabs, the reader's star and pin, and the tab coming back to the foreground. Returns the stop function. */
  function listen(): () => void {
    const watched = new Set([BOOKMARKS_KEY, ADDED_AT_KEY, LIBRARY_KEY, OLD_FAVOURITES_KEY, PINS_KEY]);
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || watched.has(e.key)) reload();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") reload();
    };
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }

  return { lib, loaded, blocked, readingPin, pagePin, providers, savedItems, typesPresent, notes, reload, ensureProviders, describe, meta, save, remove, setNote, deleteNote, addTag, removeTag, toggleCollection, createCollection, deleteCollection, addToCollection, newNote, clearReadingPin, clearPagePin, listen };
});
