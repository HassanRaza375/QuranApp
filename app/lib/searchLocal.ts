// The groups of Search that need no network: Surahs, People, Stories, Duas, the Knowledge base and Notes. Each group is one provider (query in, hits out),
// kept in a registry; Phase 12 registered Duas and the Knowledge base (loaded after the page opens: `loadKnowledgeGroups`), and Phase 13 adds Daily Fiqh
// the same way (a result must never open "This page is not rebuilt yet"). Pure; everything shown comes from the app's own data tables.
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { surahMatches } from "./listingSearch";
import { categoryLabel, displayName, PEOPLE, searchPeople } from "./people";
import { fold, isArabicMark } from "./searchFold";
import { surahHref } from "./readerLinks";
import { chaptersOf, filterStories, NO_STORY_FILTERS } from "./stories";

export type LocalGroupId = "surahs" | "people" | "stories" | "notes" | (string & {});

export interface LocalHit {
  group: LocalGroupId;
  id: string;
  title: string;
  /** a second line: what it is, in the data's own terms */
  subtitle: string;
  /** a name in Arabic from the data, shown beside the title */
  arabic?: string;
  /** where it opens; null for a note whose item has no page */
  href: string | null;
}

export interface NoteEntry {
  key: string;
  /** the item the note is on, described (a surah, an ayah, a person …) */
  title: string;
  note: string;
  tags: string[];
  href: string | null;
}

export interface LocalContext {
  notes: readonly NoteEntry[];
}

export interface LocalProvider {
  group: LocalGroupId;
  label: string;
  search(query: string, ctx: LocalContext): LocalHit[];
}

export const LOCAL_LIMIT = 50;

const TEH_MARBUTA = String.fromCodePoint(0x629);
const HEH = String.fromCodePoint(0x647);

/**
 * The query as typed, and the forms it takes if teh marbuta and heh are read as one letter: a heh that ends a word may be a teh marbuta,
 * and a teh marbuta may have been meant as heh. Searching all of them is how the local groups treat the two as the same without changing
 * the app's normaliser (decided 2026-10-22; the ayah search is the upstream's own and is not changed).
 */
export function queryVariants(query: string): string[] {
  const chars = [...query];
  let wordFinal = "";
  chars.forEach((c, i) => {
    if (c !== HEH) return void (wordFinal += c);
    let j = i + 1;
    while (j < chars.length && isArabicMark(chars[j]!.codePointAt(0)!)) j++; // marks on the heh
    const next = chars[j];
    wordFinal += next === undefined || !/\p{L}/u.test(next) ? TEH_MARBUTA : c;
  });
  return [...new Set([query, wordFinal, query.split(TEH_MARBUTA).join(HEH)])];
}

/** 0: the title starts with the query; 1: a word of it does; 2: it appears inside the title; 3: matched on another field. */
function rank(title: string, queries: readonly string[]): number {
  const t = fold(title);
  let best = 3;
  for (const query of queries) {
    const q = fold(query);
    if (!q) continue;
    if (t.startsWith(q)) return 0;
    if (t.split(" ").some((w) => w.startsWith(q))) best = Math.min(best, 1);
    else if (t.includes(q)) best = Math.min(best, 2);
  }
  return best;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const surahs: LocalProvider = {
  group: "surahs",
  label: "Surahs",
  search: (q) =>
    SURAH_ROWS.filter((s) => surahMatches(s, q)).map((s) => ({
      group: "surahs",
      id: String(s.n),
      title: s.name,
      subtitle: `Surah ${s.n} · ${plural(s.ayahs, "ayah", "ayahs")} · ${s.en}`,
      arabic: s.ar,
      href: surahHref(s.n),
    })),
};

const people: LocalProvider = {
  group: "people",
  label: "People",
  search: (q) =>
    searchPeople(PEOPLE, q).map((p) => ({
      group: "people",
      id: p.id,
      title: displayName(p),
      subtitle: categoryLabel(p.primaryCategory),
      arabic: p.arabicName || undefined,
      href: `/persons/${p.id}`,
    })),
};

const stories: LocalProvider = {
  group: "stories",
  label: "Stories",
  search: (q) =>
    filterStories({ ...NO_STORY_FILTERS, q }, new Set()).map((s) => ({
      group: "stories",
      id: s.id,
      title: s.title,
      subtitle: plural(chaptersOf(s).length, "chapter", "chapters"),
      arabic: s.arabicTitle || undefined,
      href: `/stories/${s.id}`,
    })),
};

/** One line of the note, trimmed, for the second line of a result. */
export function noteSnippet(note: string, max = 140): string {
  const one = note.replace(/\s+/g, " ").trim();
  return one.length > max ? `${one.slice(0, max - 1).trimEnd()}…` : one;
}

const notes: LocalProvider = {
  group: "notes",
  label: "Notes",
  search: (q, ctx) => {
    const fq = fold(q);
    return ctx.notes
      .filter((n) => fold(`${n.title} ${n.note} ${n.tags.join(" ")}`).includes(fq))
      .map((n) => ({ group: "notes", id: n.key, title: n.title, subtitle: noteSnippet(n.note), href: n.href }));
  },
};

/** The order is the order the groups appear in. Duas and the Knowledge base are inserted before Notes by `loadKnowledgeGroups`; Phase 13 adds Daily Fiqh the same way. */
export const PROVIDERS: LocalProvider[] = [surahs, people, stories, notes];

let knowledgeLoaded = false;
/** Registers the Duas and Knowledge base groups (their data is a separate chunk, so this is asked for once the Search page is open). Safe to call twice. */
export async function loadKnowledgeGroups(): Promise<void> {
  if (knowledgeLoaded) return;
  const { KNOWLEDGE_SEARCH_PROVIDERS } = await import("./knowledge/searchProviders");
  if (knowledgeLoaded) return;
  knowledgeLoaded = true;
  PROVIDERS.splice(PROVIDERS.indexOf(notes), 0, ...KNOWLEDGE_SEARCH_PROVIDERS);
}

export interface LocalGroup {
  group: LocalGroupId;
  label: string;
  hits: LocalHit[];
}

/** The non-empty groups, in registry order, each ranked (title starts with the query first) and cut to `LOCAL_LIMIT`. Teh marbuta and heh count as one letter (`queryVariants`). */
export function searchLocal(query: string, ctx: LocalContext, providers: readonly LocalProvider[] = PROVIDERS): LocalGroup[] {
  if (!fold(query)) return [];
  const variants = queryVariants(query);
  const out: LocalGroup[] = [];
  for (const p of providers) {
    const seen = new Set<string>();
    const found = variants.flatMap((v) => p.search(v, ctx)).filter((h) => !seen.has(h.id) && !!seen.add(h.id));
    const hits = found
      .map((h, i) => ({ h, i, r: rank(h.title, variants) }))
      .sort((a, b) => a.r - b.r || a.i - b.i)
      .slice(0, LOCAL_LIMIT)
      .map((x) => x.h);
    if (hits.length) out.push({ group: p.group, label: p.label, hits });
  }
  return out;
}
