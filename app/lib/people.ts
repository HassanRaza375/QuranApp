// Prophets & People: thin, pure adapters over the legacy data and utils (`@legacy/data/quranPersons`, `quranStories`,
// `utils/personsSearch`, `personsChronology`, `personsTimeline`). Nothing here is typed content about a person: every name, label,
// description and relationship comes from the data; the only wording written here is the small phrase table for relationship
// sentences and the legacy labels copied verbatim (see docs/phases/phase-07a-people.md).
import { QURAN_PERSONS, type PersonRelationship, type PrimaryCategory, type QuranPerson } from "@legacy/data/quranPersons";
import { QURAN_STORIES, type QuranStory } from "@legacy/data/quranStories";
import { chronologyText } from "@legacy/utils/personsChronology";
import { CATEGORY_FILTERS, type CategoryFilter } from "@legacy/utils/personsSearch";
import { normalize } from "./listingSearch";

export type { CategoryFilter, PersonRelationship, QuranPerson, QuranStory };
export const PEOPLE: QuranPerson[] = QURAN_PERSONS;
const BY_ID = new Map(PEOPLE.map((p) => [p.id, p]));
export const personById = (id: string): QuranPerson | undefined => BY_ID.get(id);
export const personKey = (id: string) => `person:${id}`;

export const CATEGORY_OPTIONS = CATEGORY_FILTERS;
export const categoryLabel = (c: PrimaryCategory): string => CATEGORY_FILTERS.find((f) => f.value === c)?.label ?? c;

/** The name as the legacy cards show it: "Ibrahim (AS)". */
export const displayName = (p: QuranPerson): string => (p.honorific?.short ? `${p.name} (${p.honorific.short})` : p.name);

/** The legacy prophetic-status chip, verbatim. Other person types show nothing. */
export const STATUS_LABELS: Partial<Record<QuranPerson["personType"], string>> = {
  prophet: "Prophet",
  messenger: "Messenger",
  prophet_and_messenger: "Prophet · Messenger",
};
/**
 * One flag per entry: add a person id here to hide their status chip while the classification is being reviewed (a wrong label is
 * worse than a missing one). Empty by default; the label comes from the data otherwise. See CONTENT_TO_VERIFY.md.
 */
export const HIDDEN_STATUS_CHIPS: ReadonlySet<string> = new Set<string>([]);
export const statusLabel = (p: QuranPerson): string | null => (HIDDEN_STATUS_CHIPS.has(p.id) ? null : (STATUS_LABELS[p.personType] ?? null));

export const SOURCE_LABELS: Record<string, string> = { quran: "Qur'an", authentic_hadith: "Authentic Hadith", traditional_account: "Traditional account" };
export const sourceLabel = (t: string): string => SOURCE_LABELS[t] ?? t;

/** The legacy story labels, verbatim (pages/stories/[id].vue). */
export const NARRATIVE_LABELS: Record<QuranStory["narrativeStatus"], string> = {
  quran_complete: "Fully told in the Qur'an",
  quran_primary_traditional_expansion: "Qur'an core, traditionally expanded",
  quran_fragmentary: "Pieced together across surahs",
};

// ---------------------------------------------------------------- chronology

export interface ChronologyInfo {
  text: string;
  /** anything that is not established gets a dashed chip (never colour alone) */
  dashed: boolean;
}
/** The legacy wording (`chronologyText`): an established label stands alone; everything else is qualified. */
export function chronologyInfo(p: QuranPerson): ChronologyInfo | null {
  const text = chronologyText(p.chronology);
  if (!text) return null;
  return { text, dashed: p.chronology?.status !== "strong" };
}

// ---------------------------------------------------------------- directory: search, category, saved

/** Searches names (English and Arabic, with the alternate names), the short description and the theme names. Not passage text. */
export function searchPeople(list: QuranPerson[], query: string): QuranPerson[] {
  const q = normalize(query);
  if (!q) return list;
  const squash = (s: string) => s.replace(/ /g, "");
  return list.filter((p) => {
    const h = normalize([p.name, p.arabicName, ...(p.alternateNames ?? []), p.shortDescription, ...(p.themes ?? [])].join(" "));
    return h.includes(q) || squash(h).includes(squash(q));
  });
}

/** primary OR secondary category, as the legacy filter does. */
export const filterCategory = (list: QuranPerson[], c: CategoryFilter): QuranPerson[] => (c === "all" ? list : list.filter((p) => p.primaryCategory === c || (p.secondaryCategories ?? []).includes(c as PrimaryCategory)));

export interface PeopleFilters {
  q: string;
  category: CategoryFilter;
  saved: boolean;
}
export const NO_FILTERS: PeopleFilters = { q: "", category: "all", saved: false };
export const isFiltered = (f: PeopleFilters) => !!f.q.trim() || f.category !== "all" || f.saved;

export function filterPeople(f: PeopleFilters, savedIds: ReadonlySet<string>, list: QuranPerson[] = PEOPLE): QuranPerson[] {
  let out = filterCategory(list, f.category);
  if (f.saved) out = out.filter((p) => savedIds.has(p.id));
  return searchPeople(out, f.q);
}

const CATEGORY_VALUES = new Set(CATEGORY_FILTERS.map((c) => c.value));
/** `?q=&category=&saved=1` to filters (anything unknown is ignored). */
export function filtersFromQuery(query: Record<string, unknown>): PeopleFilters {
  const one = (v: unknown) => (Array.isArray(v) ? v[0] : v);
  const q = one(query.q);
  const c = one(query.category);
  return { q: typeof q === "string" ? q : "", category: typeof c === "string" && CATEGORY_VALUES.has(c as CategoryFilter) ? (c as CategoryFilter) : "all", saved: one(query.saved) === "1" };
}
export function filtersToQuery(f: PeopleFilters): Record<string, string> {
  const out: Record<string, string> = {};
  if (f.q.trim()) out.q = f.q;
  if (f.category !== "all") out.category = f.category;
  if (f.saved) out.saved = "1";
  return out;
}

export const countLine = (shown: number, total: number) => (shown === total ? `${total} people` : `${shown} of ${total} people`);

// ---------------------------------------------------------------- stories that involve a person

export const STORIES_READY = { reader: true } as const;
export const storyHref = (id: string) => `/stories/${id}`;

export const storiesFor = (personId: string): QuranStory[] => QURAN_STORIES.filter((s) => s.personIds?.includes(personId));

// ---------------------------------------------------------------- relationships as sentences

/**
 * In the data a relationship `{personId: B, relationshipType: t}` on person A describes **A's own role toward B**
 * ("Ibrahim: Isma'il, father" means Ibrahim is the father of Isma'il). Three entries were written the other way round (the type
 * describes B). They are listed here until the data is corrected, so the sentences are still right (docs/phases/phase-07a-people.md).
 */
export const REVERSED_ENTRIES: ReadonlySet<string> = new Set(["isa>maryam", "maryam>isa", "maryam>maryammother"]);

interface Phrase {
  one: string;
  many?: string;
}
const DIRECTED: Record<string, Phrase> = {
  father: { one: "is the father of" },
  mother: { one: "is the mother of" },
  son: { one: "is the son of", many: "are sons of" },
  daughter: { one: "is the daughter of", many: "are daughters of" },
  brother: { one: "is a brother of", many: "are brothers of" },
  sister: { one: "is a sister of", many: "are sisters of" },
  descendant: { one: "is a descendant of" },
  ancestor: { one: "is an ancestor of" },
};
const UNDIRECTED: Record<string, string> = {
  spouse: "spouses",
  contemporary: "contemporaries",
  opponent: "opponents",
  supporter: "supporters",
  teacher_student: "teacher and student",
  other: "other relationship",
};
const parentLike = new Set(["father", "mother"]);
const childLike = new Set(["son", "daughter"]);

export interface RelationLine {
  /** "Ibrahim (AS) is the father of Isma'il (AS)" */
  sentence: string;
  related: { id: string; name: string; href: string | null };
  source: string;
  /** a traditional or uncertain entry gets a dashed chip */
  dashed: boolean;
  status: PersonRelationship["verificationStatus"];
}

const nameOf = (id: string): string => {
  const p = BY_ID.get(id);
  return p ? displayName(p) : id;
};

export function relationSentence(subjectId: string, rel: PersonRelationship): string {
  const reversed = REVERSED_ENTRIES.has(`${subjectId}>${rel.personId}`);
  const [a, b] = reversed ? [rel.personId, subjectId] : [subjectId, rel.personId];
  const group = BY_ID.get(a)?.entityType === "group";
  const directed = DIRECTED[rel.relationshipType];
  if (directed && (!group || directed.many)) return `${nameOf(a)} ${group ? directed.many : directed.one} ${nameOf(b)}`;
  const label = UNDIRECTED[rel.relationshipType] ?? rel.relationshipType.replace(/_/g, " ");
  return `${nameOf(subjectId)} and ${nameOf(rel.personId)}: ${label}`;
}

export function relationLines(person: QuranPerson): RelationLine[] {
  return (person.relationships ?? []).map((rel) => {
    const target = BY_ID.get(rel.personId);
    return {
      sentence: relationSentence(person.id, rel),
      related: { id: rel.personId, name: nameOf(rel.personId), href: target ? `/persons/${target.id}` : null },
      source: sourceLabel(rel.sourceType),
      dashed: rel.verificationStatus !== "verified",
      status: rel.verificationStatus,
    };
  });
}

/** The fact a directed kinship entry states, independent of which side wrote it: `parent|ancestor` and who is older. */
export function kinshipFact(subjectId: string, rel: PersonRelationship): { kind: "parent" | "ancestor"; elder: string; younger: string } | null {
  const t = rel.relationshipType;
  const reversed = REVERSED_ENTRIES.has(`${subjectId}>${rel.personId}`);
  const [a, b] = reversed ? [rel.personId, subjectId] : [subjectId, rel.personId];
  if (parentLike.has(t)) return { kind: "parent", elder: a, younger: b };
  if (childLike.has(t)) return { kind: "parent", elder: b, younger: a };
  if (t === "ancestor") return { kind: "ancestor", elder: a, younger: b };
  if (t === "descendant") return { kind: "ancestor", elder: b, younger: a };
  return null;
}

// ---------------------------------------------------------------- person page tabs and the legacy study record

export type PersonTab = "story" | "passages" | "family";
export const PERSON_TABS: { id: PersonTab; label: string }[] = [
  { id: "story", label: "Story" },
  { id: "passages", label: "Passages" },
  { id: "family", label: "Family & notes" },
];
export const tabFromQuery = (v: unknown): PersonTab => (v === "passages" || v === "family" ? v : "story");

type SectionId = "overview" | "key-lessons" | "direct-mentions" | "related-passages" | "family" | "notes";
/** The legacy study record keeps its six section ids; each tab is written as one of them. */
export function sectionForTab(tab: PersonTab, passageView: "surah" | "story" | null = null): SectionId {
  if (tab === "passages") return passageView ? "related-passages" : "direct-mentions";
  return tab === "family" ? "family" : "overview";
}
export function tabForSection(section: string): PersonTab {
  if (section === "direct-mentions" || section === "related-passages") return "passages";
  return section === "family" || section === "notes" ? "family" : "story";
}
