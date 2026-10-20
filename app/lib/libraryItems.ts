// What a saved key is: its type, title, detail, where it opens, and how it is searched, sorted and grouped. Pure. Every title and
// detail comes from real data (the bundled surah list, the juz and page tables, the legacy people, names, stories and fiqh data
// passed in as providers); nothing is typed here, and a key that matches nothing still gets a readable row, never a dropped one.
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { type LibraryState, metaOf } from "./library";
import { normalize } from "./listingSearch";
import { JUZ, pageStart } from "./quranMeta";
import { juzHref, pageHref, READERS_READY, surahHref } from "./readerLinks";

export type ItemType = "ayah" | "surah" | "juz" | "page" | "person" | "story" | "name" | "sajda" | "fiqh" | "audio" | "unknown";

export const TYPE_LABEL: Record<ItemType, string> = {
  ayah: "Ayah",
  surah: "Surah",
  juz: "Juz",
  page: "Page",
  person: "Person",
  story: "Story",
  name: "Name",
  sajda: "Sajda verse",
  fiqh: "Fiqh topic",
  audio: "Reciters",
  unknown: "Saved item",
};
export const TYPE_PLURAL: Record<ItemType, string> = {
  ayah: "Ayahs",
  surah: "Surahs",
  juz: "Juz",
  page: "Pages",
  person: "People",
  story: "Stories",
  name: "Names",
  sajda: "Sajda verses",
  fiqh: "Fiqh topics",
  audio: "Reciters pages",
  unknown: "Other",
};
/** The common types come first in the Show menu; the rarer ones are grouped under "More types". */
export const COMMON_TYPES: ItemType[] = ["ayah", "surah", "juz", "person", "story"];
export const RARE_TYPES: ItemType[] = ["page", "name", "sajda", "fiqh", "audio", "unknown"];
export const TYPE_ORDER: ItemType[] = [...COMMON_TYPES, ...RARE_TYPES];

/** Which types open a page that exists in the revamp today. The others link to the "not rebuilt yet" page and the Library says so. */
export const OPENS_TODAY: Record<ItemType, boolean> = {
  ayah: READERS_READY.surah,
  surah: READERS_READY.surah,
  sajda: READERS_READY.surah,
  juz: READERS_READY.juz,
  page: READERS_READY.page,
  person: true, // Phase 7A
  story: true, // Phase 7B
  name: false, // Phase 9
  fiqh: false, // Phase 13
  audio: false, // Phase 15
  unknown: false,
};
export const PENDING_PHASE: Partial<Record<ItemType, string>> = { page: "the page reader", person: "People", story: "Stories", name: "Asma-ul-Husna", fiqh: "Daily Fiqh", audio: "Reciters" };

export interface Providers {
  person(id: string): { name: string; honorific?: string; arabicName?: string } | null;
  fiqhTopic(id: string): { title: string; category: string; categoryId: string; arabicTerm?: string } | null;
  name(id: string): { transliteration: string; english: string; arabic?: string } | null;
  story(id: string): { title: string } | null;
}
export const NO_PROVIDERS: Providers = { person: () => null, fiqhTopic: () => null, name: () => null, story: () => null };

export interface Item {
  key: string;
  type: ItemType;
  title: string;
  detail: string;
  /** a name in Arabic that comes from the data (a surah or a person), shown beside the title */
  arabicName?: string;
  /** surah order: surah and ayah numbers; everything else sorts after the Quran, by type and number */
  ord: number;
  href: string | null;
  /** the ayah whose Arabic text is shown as a snippet */
  ayah?: { surah: number; ayah: number };
}

const num = (s: string | undefined): number => (s && /^\d+$/.test(s) ? Number(s) : Number.NaN);
const surahName = (n: number) => SURAH_ROWS[n - 1]?.name ?? `Surah ${n}`;
const TAIL = 1_000_000;

export function describeItem(key: string, p: Providers = NO_PROVIDERS): Item {
  const [kind, a, b] = key.split(":");
  const readable: Item = { key, type: "unknown", title: key.replace(":", ": "), detail: TYPE_LABEL.unknown, ord: TAIL * 9, href: null };
  switch (kind) {
    case "surah": {
      const n = num(a);
      const row = SURAH_ROWS[n - 1];
      if (!row) return readable;
      return { key, type: "surah", title: row.name, detail: `${row.ayahs} verses · ${row.place}`, arabicName: row.ar, ord: n * 1000, href: surahHref(n) };
    }
    case "ayah":
    case "sajda": {
      const s = num(a);
      const ay = num(b);
      const row = SURAH_ROWS[s - 1];
      if (!row || !(ay >= 1 && ay <= row.ayahs)) return readable;
      return { key, type: kind, title: `${row.name} ${s}:${ay}`, detail: "", ord: s * 1000 + ay, href: surahHref(s, ay), ayah: { surah: s, ayah: ay } };
    }
    case "juz": {
      const j = JUZ[num(a) - 1];
      if (!j) return readable;
      return { key, type: "juz", title: `Juz ${j.n}`, detail: `Starts at ${surahName(j.startSurah)} ${j.startSurah}:${j.startAyah} · Pages ${j.firstPage}–${j.lastPage}`, ord: TAIL + j.n, href: juzHref(j.startSurah, j.startAyah) };
    }
    case "page": {
      const n = num(a);
      const st = pageStart(n);
      if (!st) return readable;
      return { key, type: "page", title: `Page ${n}`, detail: `Begins at ${surahName(st[0])} ${st[0]}:${st[1]}`, ord: TAIL * 2 + n, href: pageHref(n) };
    }
    case "audio": {
      const n = num(a);
      if (!SURAH_ROWS[n - 1]) return readable;
      return { key, type: "audio", title: surahName(n), detail: "Reciters", ord: TAIL * 6 + n, href: `/surah-audios/${n}` };
    }
    case "person": {
      const x = a ? p.person(a) : null;
      if (!x) return { ...readable, type: "person", title: `Person: ${a}`, detail: "Prophets & People", href: `/persons/${a}` };
      return { key, type: "person", title: x.honorific ? `${x.name} (${x.honorific})` : x.name, detail: "Prophets & People", arabicName: x.arabicName, ord: TAIL * 3, href: `/persons/${a}` };
    }
    case "story": {
      const x = a ? p.story(a) : null;
      return { key, type: "story", title: x ? x.title : `Story: ${a}`, detail: "Story", ord: TAIL * 4, href: `/stories/${a}` };
    }
    case "name": {
      const x = a ? p.name(a) : null;
      if (!x) return { ...readable, type: "name", title: `Name ${a}`, detail: "Asma-ul-Husna", href: "/asma-ul-husna" };
      return { key, type: "name", title: x.transliteration, detail: x.english, arabicName: x.arabic, ord: TAIL * 5 + num(a), href: "/asma-ul-husna" };
    }
    case "fiqh": {
      const x = a ? p.fiqhTopic(a) : null;
      if (!x) return { ...readable, type: "fiqh", title: `Fiqh topic: ${a}`, detail: "Daily Fiqh", href: "/fiqh" };
      return { key, type: "fiqh", title: x.title, detail: `Daily Fiqh · ${x.category}`, arabicName: x.arabicTerm, ord: TAIL * 7, href: `/fiqh/${x.categoryId}/${a}` };
    }
    default:
      return readable;
  }
}

export const agoText = (when: number | undefined, now: Date): string => {
  if (!when) return "saved earlier";
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((day(now) - day(new Date(when))) / 86_400_000);
  if (diff <= 0) return "saved today";
  if (diff === 1) return "saved yesterday";
  if (diff < 31) return `saved ${diff} days ago`;
  return `saved on ${new Date(when).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
};

// ---------------------------------------------------------------- search, sort, group

export type SortKey = "recent" | "ord" | "name" | "group-collection" | "group-type";
export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Recently saved" },
  { value: "ord", label: "Surah order" },
  { value: "name", label: "Name (A–Z)" },
  { value: "group-collection", label: "Group by collection" },
  { value: "group-type", label: "Group by type" },
];

export interface Filters {
  query: string;
  type: ItemType | "all";
  collectionId: string | null;
}

/** The text a row is searched in: title, detail, type, the note, the tags, the collection names, the Arabic name. */
export function haystack(item: Item, s: LibraryState): string {
  const m = metaOf(s, item.key);
  const names = m.collectionIds.map((id) => s.collections.find((c) => c.id === id)?.name ?? "");
  return [item.title, item.detail, item.arabicName ?? "", TYPE_LABEL[item.type], m.note, ...m.tags, ...names].join(" ");
}

export function matches(item: Item, s: LibraryState, f: Filters): boolean {
  if (f.type !== "all" && item.type !== f.type) return false;
  if (f.collectionId && !metaOf(s, item.key).collectionIds.includes(f.collectionId)) return false;
  const q = normalize(f.query);
  if (!q) return true;
  const h = normalize(haystack(item, s));
  return h.includes(q) || h.replace(/ /g, "").includes(q.replace(/ /g, ""));
}

export function sortItems(items: Item[], s: LibraryState, key: SortKey): Item[] {
  const out = [...items];
  const byKey = (a: Item, b: Item) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);
  out.sort((a, b) => {
    if (key === "ord") return a.ord - b.ord || byKey(a, b);
    if (key === "name") return normalize(a.title).localeCompare(normalize(b.title), "en") || byKey(a, b);
    // recent (and the order inside a group): newest first; an item with no saved time sorts last
    return (s.addedAt[b.key] ?? 0) - (s.addedAt[a.key] ?? 0) || a.ord - b.ord || byKey(a, b);
  });
  return out;
}

export interface Group {
  label: string;
  items: Item[];
}

/** Groups already-sorted items. An item in several collections appears under each; "No collection" comes last. */
export function groupItems(items: Item[], s: LibraryState, by: "collection" | "type"): Group[] {
  if (by === "type") {
    return TYPE_ORDER.map((t) => ({ label: TYPE_PLURAL[t], items: items.filter((i) => i.type === t) })).filter((g) => g.items.length);
  }
  const groups: Group[] = s.collections.map((c) => ({ label: c.name, items: items.filter((i) => metaOf(s, i.key).collectionIds.includes(c.id)) })).filter((g) => g.items.length);
  const none = items.filter((i) => !metaOf(s, i.key).collectionIds.some((id) => s.collections.some((c) => c.id === id)));
  if (none.length) groups.push({ label: "No collection", items: none });
  return groups;
}
