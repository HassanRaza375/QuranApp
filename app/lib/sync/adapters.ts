// Phase 17C: how each synced storage key becomes records and back. One adapter per kind of key, built from a few helpers. Every adapter reads and writes the
// key in its EXISTING legacy shape: it reads the whole value, changes only the entries it owns, and writes the whole value back, so unknown fields stay and a
// rollback to the legacy app reads everything as before (CLAUDE.md rule 4). Raw keys stay raw strings. Nothing here touches a key in `inventory.ts`' never list.
// Pure over a `Store` (the real one is `lib/storage.ts`; tests use a Map).
import { NAMESPACES, type Category } from "./namespaces";
import type { Payload } from "./merge";

export interface Store {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export interface Adapter {
  ns: string;
  category: Category | "account";
  /** the storage keys this adapter reads and writes */
  keys: string[];
  project(s: Store): Map<string, Payload>;
  /** writes the given records (null = remove) into storage; returns the keys that were rewritten */
  apply(s: Store, changes: Map<string, Payload>): string[];
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

function readJson(s: Store, key: string): unknown {
  const raw = s.get(key);
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined; // damaged: treated as absent, and replaced by the next write
  }
}
const writeJson = (s: Store, key: string, v: unknown) => s.set(key, JSON.stringify(v));

/** `obj` at a path of keys, or undefined. */
function at(root: unknown, path: string[]): unknown {
  let cur = root;
  for (const p of path) {
    if (!isObj(cur)) return undefined;
    cur = cur[p];
  }
  return cur;
}
/** a copy of `root` with `value` set at `path` (undefined removes it), creating objects on the way */
function withAt(root: unknown, path: string[], value: unknown): Obj {
  const base: Obj = isObj(root) ? { ...root } : {};
  if (!path.length) return base;
  const [head, ...rest] = path;
  if (rest.length) base[head!] = withAt(base[head!], rest, value);
  else if (value === undefined) delete base[head!];
  else base[head!] = value;
  return base;
}

// ---- helpers that make adapters

/** a raw string key = one record in `settings` */
const rawSetting = (name: string, key: string): Adapter => ({
  ns: "settings",
  category: "settings",
  keys: [key],
  project: (s) => {
    const v = s.get(key);
    return new Map([[name, v === null ? null : { raw: v }]]);
  },
  apply: (s, ch) => {
    const p = ch.get(name);
    if (p === undefined) return [];
    if (p === null) s.remove(key);
    else if (typeof p.raw === "string") s.set(key, p.raw);
    else return [];
    return [key];
  },
});

/** one field of a JSON object key = one record in `settings`; `path` empty means the whole value */
const jsonSetting = (name: string, key: string, path: string[]): Adapter => ({
  ns: "settings",
  category: "settings",
  keys: [key],
  project: (s) => {
    const v = at(readJson(s, key), path);
    return new Map([[name, v === undefined || v === null ? null : { v }]]); // a stored null is the same as no value
  },
  apply: (s, ch) => {
    const p = ch.get(name);
    if (p === undefined) return [];
    const root = readJson(s, key);
    if (p === null && at(root, path) === undefined) return [];
    if (p !== null && !("v" in p)) return [];
    if (!path.length) {
      if (p === null) s.remove(key);
      else writeJson(s, key, p.v);
      return [key];
    }
    writeJson(s, key, withAt(root, path, p === null ? undefined : p.v));
    return [key];
  },
});

/** the entries of an object at `path` = records keyed by the entry's key; `wrap` turns a non-object entry into a payload and back */
const mapEntries = (ns: string, category: Category, key: string, path: string[], wrap?: { to: (v: unknown) => Payload; from: (p: Obj) => unknown }): Adapter => ({
  ns,
  category,
  keys: [key],
  project: (s) => {
    const out = new Map<string, Payload>();
    const m = at(readJson(s, key), path);
    if (isObj(m)) for (const [k, v] of Object.entries(m)) out.set(k, wrap ? wrap.to(v) : isObj(v) ? v : null);
    for (const [k, v] of [...out]) if (v === null) out.delete(k);
    return out;
  },
  apply: (s, ch) => {
    if (!ch.size) return [];
    const root = readJson(s, key);
    const cur = at(root, path);
    const next: Obj = isObj(cur) ? { ...cur } : {};
    for (const [k, p] of ch) {
      if (p === null) delete next[k];
      else next[k] = wrap ? wrap.from(p) : p;
    }
    writeJson(s, key, path.length ? withAt(root, path, next) : { ...next });
    return [key];
  },
});

/** the elements of an array at `path` = records keyed by `idField` */
const arrayById = (ns: string, category: Category, key: string, path: string[], idField: string): Adapter => ({
  ns,
  category,
  keys: [key],
  project: (s) => {
    const out = new Map<string, Payload>();
    const a = at(readJson(s, key), path);
    if (Array.isArray(a)) for (const e of a) if (isObj(e) && typeof e[idField] === "string" && e[idField]) out.set(e[idField] as string, e);
    return out;
  },
  apply: (s, ch) => {
    if (!ch.size) return [];
    const root = readJson(s, key);
    const cur = at(root, path);
    const list: unknown[] = Array.isArray(cur) ? [...cur] : [];
    for (const [id, p] of ch) {
      const i = list.findIndex((e) => isObj(e) && e[idField] === id);
      if (p === null) {
        if (i >= 0) list.splice(i, 1);
      } else if (i >= 0) list[i] = p;
      else list.push(p);
    }
    writeJson(s, key, withAt(root, path, list));
    return [key];
  },
});

/** one named field of a JSON object = one record, present or absent (the pins) */
const fieldRecords = (ns: string, category: Category, key: string, fields: string[]): Adapter => ({
  ns,
  category,
  keys: [key],
  project: (s) => {
    const out = new Map<string, Payload>();
    const root = readJson(s, key);
    for (const f of fields) {
      const v = at(root, [f]);
      if (isObj(v)) out.set(f, v);
    }
    return out;
  },
  apply: (s, ch) => {
    if (!ch.size) return [];
    let root: unknown = readJson(s, key);
    for (const [f, p] of ch) if (fields.includes(f)) root = withAt(root, [f], p === null ? undefined : p);
    writeJson(s, key, isObj(root) && root.v === undefined ? { v: 1, ...root } : root);
    return [key];
  },
});

/** one field of a JSON object, as a singleton record with a payload built from it */
const singletonField = (ns: string, category: Category, key: string, field: string, to: (v: unknown) => Payload, from: (p: Obj) => unknown, absent?: unknown): Adapter => ({
  ns,
  category,
  keys: [key],
  project: (s) => {
    const v = at(readJson(s, key), [field]);
    const p = v === undefined ? null : to(v);
    return new Map(p === null ? [] : [["singleton", p]]);
  },
  apply: (s, ch) => {
    const p = ch.get("singleton");
    if (p === undefined) return [];
    writeJson(s, key, withAt(readJson(s, key), [field], p === null ? absent : from(p)));
    return [key];
  },
});

/** a whole JSON value as one record */
const singleton = (ns: string, category: Category, key: string): Adapter => ({
  ns,
  category,
  keys: [key],
  project: (s) => {
    const v = readJson(s, key);
    return new Map(isObj(v) ? [["singleton", v]] : []);
  },
  apply: (s, ch) => {
    const p = ch.get("singleton");
    if (p === undefined) return [];
    if (p === null) s.remove(key);
    else writeJson(s, key, p);
    return [key];
  },
});

// ---- the two adapters that are not one of the above

const BOOKMARKS = "quran:bookmarks:v1";
const ADDED_AT = "quran:bookmarks:added-at:v1";
/** the saved items: the list of keys plus the map of when each was added are ONE record per item */
const bookmarks: Adapter = {
  ns: "library.item",
  category: "library",
  keys: [BOOKMARKS, ADDED_AT],
  project: (s) => {
    const list = readJson(s, BOOKMARKS);
    const at_ = readJson(s, ADDED_AT);
    const out = new Map<string, Payload>();
    if (Array.isArray(list)) for (const k of list) if (typeof k === "string" && k) out.set(k, { addedAt: isObj(at_) && typeof at_[k] === "number" ? (at_[k] as number) : 0 });
    return out;
  },
  apply: (s, ch) => {
    if (!ch.size) return [];
    const listRaw = readJson(s, BOOKMARKS);
    let list: string[] = Array.isArray(listRaw) ? listRaw.filter((k): k is string => typeof k === "string") : [];
    const addedRaw = readJson(s, ADDED_AT);
    const added: Obj = isObj(addedRaw) ? { ...addedRaw } : {};
    for (const [k, p] of ch) {
      if (p === null) {
        list = list.filter((x) => x !== k);
        delete added[k];
      } else {
        if (!list.includes(k)) list.push(k);
        added[k] = p.addedAt;
      }
    }
    // the list order is the order they were added (oldest first), as the Library reads it
    list = list.map((k, i) => ({ k, i })).sort((a, b) => ((added[a.k] as number) ?? 0) - ((added[b.k] as number) ?? 0) || a.i - b.i).map((x) => x.k);
    writeJson(s, BOOKMARKS, list);
    writeJson(s, ADDED_AT, added);
    return [BOOKMARKS, ADDED_AT];
  },
};

const LIBRARY = "quran:library:v1";
/** every field of `quran:library:v1` that is not the collections or the per-item notes, kept so that nothing is lost */
const libraryRest: Adapter = {
  ns: "library.rest",
  category: "library",
  keys: [LIBRARY],
  project: (s) => {
    const v = readJson(s, LIBRARY);
    if (!isObj(v)) return new Map();
    const { collections: _c, itemMeta: _m, ...rest } = v;
    return new Map(Object.keys(rest).length ? [["singleton", rest]] : []);
  },
  apply: (s, ch) => {
    const p = ch.get("singleton");
    if (p === undefined) return [];
    const root = readJson(s, LIBRARY);
    const base: Obj = isObj(root) ? root : {};
    const kept: Obj = {};
    if (base.collections !== undefined) kept.collections = base.collections;
    if (base.itemMeta !== undefined) kept.itemMeta = base.itemMeta;
    writeJson(s, LIBRARY, { ...(p ?? {}), ...kept });
    return [LIBRARY];
  },
};

const GOALS = "quran:reading-goals:v1";
const RAMADAN = "quran:ramadan:v1";

export const ADAPTERS: Adapter[] = [
  // Library
  bookmarks,
  arrayById("library.collection", "library", LIBRARY, ["collections"], "id"),
  mapEntries("library.meta", "library", LIBRARY, ["itemMeta"]),
  libraryRest,
  // Progress
  singleton("progress.lastRead", "progress", "quran:reading-progress:v1"),
  mapEntries("progress.readSurah", "progress", "quran:read-surahs:v1", ["surahs"]),
  fieldRecords("progress.pin", "progress", "quran:pins:v1", ["reading", "page"]),
  arrayById("progress.goal", "progress", GOALS, ["goals"], "id"),
  singletonField("progress.goalActive", "progress", GOALS, "activeGoalId", (v) => (typeof v === "string" ? { id: v } : { id: null }), (p) => p.id ?? null, null),
  mapEntries("progress.goalLog", "progress", GOALS, ["dailyLog"], { to: (v) => (Array.isArray(v) ? { ayahs: v.filter((x) => typeof x === "string") } : null), from: (p) => p.ayahs }),
  arrayById("progress.hifzTarget", "progress", "quran:hifz:v2", ["targets"], "id"),
  arrayById("progress.hifzAyah", "progress", "quran:hifz:v2", ["ayahStates"], "key"),
  arrayById("progress.hifzJoin", "progress", "quran:hifz:v2", ["transitionStates"], "key"),
  arrayById("progress.hifzActivity", "progress", "quran:hifz:v2", ["activity"], "date"),
  mapEntries("progress.hifzWords", "progress", "quran:hifz-words:v1", ["ayahs"]),
  mapEntries("progress.tasbeeh", "progress", "quran:tasbeeh:v1", []),
  mapEntries("progress.story", "progress", "quran:story-progress:v1", ["stories"]),
  mapEntries("progress.personStudy", "progress", "quran:persons-study:v1", []),
  singletonField("progress.ramadanStart", "progress", RAMADAN, "startOverride", (v) => ({ startOverride: typeof v === "string" ? v : null }), (p) => p.startOverride ?? null, null),
  mapEntries("progress.fast", "progress", RAMADAN, ["fastingLog"], { to: (v) => (typeof v === "string" ? { status: v } : null), from: (p) => p.status }),
  arrayById("progress.reminder", "progress", "quran:reminders:v1", [], "id"),
  // Settings: religious choices (the Sunni or Ja'fari setting, the marja' and the language of rulings) are part of this toggle, and its text says so
  rawSetting("fiqh", "prayerFiqh"),
  jsonSetting("marja", "quran:fiqh-prefs:v1", ["marjaId"]),
  jsonSetting("fiqhLang", "quran:fiqh-prefs:v1", ["lang"]),
  rawSetting("theme", "themeMode"),
  rawSetting("translationLang", "translationDefaultLang"),
  rawSetting("tafsirAuthor", "tafsirDefaultAuthor"),
  jsonSetting("reciter", "reciter", []),
  ...["reducedMotion", "highContrast", "largeTouchTargets", "arabicFontScale"].map((f) => jsonSetting(`accessibility.${f}`, "quran:accessibility:v1", [f])),
  ...["playbackRate", "repeatOne", "autoAdvance"].map((f) => jsonSetting(`audio.${f}`, "quran:audio-prefs:v1", [f])),
  jsonSetting("followAyah", "quran:player-prefs:v1", ["followAyah"]),
  jsonSetting("readerTranslation", "quran:reader-prefs:v1", ["translation"]),
  jsonSetting("readerTransliteration", "quran:reader-prefs:v1", ["transliteration"]),
  jsonSetting("verseLayout", "quran:verse-layout:v1", ["order"]),
  jsonSetting("hijriAdjust", "quran:hijri-adjust:v1", ["days"]),
  ...["sunniMethod", "jafariMethod", "asr"].map((f) => jsonSetting(`prayerCalc.${f}`, "quran:prayer-calc:v1", [f])),
  jsonSetting("calendarFirst", "quran:calendar-prefs:v1", ["first"]),
  // `notificationsEnabled` of `prayerSettings` never syncs: notification permission belongs to each device's browser
  jsonSetting("prayer.enabledPrayers", "prayerSettings", ["enabledPrayers"]),
  jsonSetting("prayer.reminderOffset", "prayerSettings", ["reminderOffset"]),
];

/** values a pulled setting must have before it is written (a name that is not here is accepted as any JSON value or string) */
const SETTING_RULES: Record<string, (p: Obj) => boolean> = {
  fiqh: (p) => p.raw === "sunni" || p.raw === "jafari",
  theme: (p) => p.raw === "light" || p.raw === "dark" || p.raw === "system",
  verseLayout: (p) => p.v === "ar" || p.v === "tr",
  fiqhLang: (p) => p.v === "en" || p.v === "ur" || p.v === "both",
  readerTranslation: (p) => p.v === "off",
  readerTransliteration: (p) => p.v === true,
  "accessibility.arabicFontScale": (p) => typeof p.v === "number" && p.v >= 0.5 && p.v <= 3,
  "audio.playbackRate": (p) => typeof p.v === "number" && p.v >= 0.25 && p.v <= 4,
  hijriAdjust: (p) => typeof p.v === "number" && Number.isInteger(p.v) && p.v >= -3 && p.v <= 3,
};
export const settingAcceptable = (name: string, p: Payload): boolean => p === null || !SETTING_RULES[name] || SETTING_RULES[name](p);

/** Which adapters belong to a category. */
export const adaptersFor = (cats: ReadonlySet<Category>): Adapter[] => ADAPTERS.filter((a) => a.category !== "account" && cats.has(a.category));

/** Every storage key that sync reads or writes (the guard test compares it with the inventory). */
export const SYNCED_KEYS: string[] = [...new Set(ADAPTERS.flatMap((a) => a.keys))];

// an adapter's namespace must be one the server accepts
for (const a of ADAPTERS) if (!NAMESPACES[a.ns]) throw new Error(`adapter for unknown namespace ${a.ns}`);
