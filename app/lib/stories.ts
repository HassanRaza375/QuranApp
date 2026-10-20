// Stories: thin, pure adapters over the legacy Stories data (`@legacy/data/quranStories`, places, peoples, events, persons). Chapters,
// labels, the derived Order line, the "Arranged for study" rule, search and the entity lookups all come from the data; the only wording
// written here is the one flagged sentence (ARRANGED_NOTICE) and the legacy labels copied verbatim. Nothing here is Qur'an text.
import { QURAN_EVENTS } from "@legacy/data/quranEvents";
import { QURAN_COMMUNITIES } from "@legacy/data/quranPeoples";
import { QURAN_PLACES } from "@legacy/data/quranPlaces";
import { QURAN_STORIES, type QuranLesson, type QuranStory } from "@legacy/data/quranStories";
import { filterByPersonId, filterByStoryType, searchStories, STORY_TYPE_FILTERS, type StoryTypeFilter } from "@legacy/utils/storiesSearch";
import { SURAH_ROWS } from "~/data/quranMeta.generated";
import { personById, displayName, NARRATIVE_LABELS } from "./people";

export type { QuranLesson, QuranStory, StoryTypeFilter };
export { NARRATIVE_LABELS, STORY_TYPE_FILTERS };
export const STORIES: QuranStory[] = QURAN_STORIES;
const BY_ID = new Map(STORIES.map((s) => [s.id, s]));
export const storyById = (id: string): QuranStory | undefined => BY_ID.get(id);
export const storyKey = (id: string) => `story:${id}`;

/** Flagged for review (CONTENT_TO_VERIFY.md): a plain description of what the app did, not a scholarly claim. */
export const ARRANGED_NOTICE = "This story is assembled from passages in several surahs, in an order chosen for reading.";
export const SUMMARY_LABEL = "Summary (written for this app)";

export const LESSON_BASIS_LABELS: Record<string, string> = { quran_explicit: "Qur'an explicit", derived_thematic: "Derived theme", traditional_interpretation: "Traditional interpretation" };
export const IDENTIFICATION_LABELS: Record<string, string> = {
  quran_explicit: "Explicitly identified in the Qur'an",
  quran_context: "Identified through Qur'anic context",
  traditional: "Traditional identification",
  modern_identification: "Modern/historical proposed identification",
  disputed: "Disputed identification",
};
export const SOURCE_LABELS: Record<string, string> = { quran: "Qur'an", authentic_hadith: "Authentic Hadith", traditional_account: "Traditional account" };

export const surahName = (n: number) => SURAH_ROWS[n - 1]?.name ?? `Surah ${n}`;
export const typeLabel = (s: QuranStory): string => STORY_TYPE_FILTERS.find((t) => t.value === s.storyType)?.label ?? s.storyType;

// ---------------------------------------------------------------- chapters, from the data only

export interface PassageRef {
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
}
export interface StoryChapter {
  /** 0-based */
  index: number;
  title: string;
  summary: string;
  passages: PassageRef[];
  ayahs: number;
}

const span = (p: PassageRef) => p.ayahEnd - p.ayahStart + 1;
export const refText = (p: PassageRef) => `${surahName(p.surahNumber)} ${p.surahNumber}:${p.ayahStart}${p.ayahEnd > p.ayahStart ? `–${p.ayahEnd}` : ""}`;
export const ayahCount = (ps: PassageRef[]) => ps.reduce((n, p) => n + span(p), 0);

/**
 * A chapter is an episode (its title, summary and passages) or, for a story with no episodes, one primary passage (its own title
 * and description). Nothing is split, merged or renamed.
 */
export function chaptersOf(s: QuranStory): StoryChapter[] {
  if (s.episodes?.length) {
    return s.episodes.map((e, i) => ({ index: i, title: e.title, summary: e.summary, passages: e.passages.map(({ surahNumber, ayahStart, ayahEnd }) => ({ surahNumber, ayahStart, ayahEnd })), ayahs: ayahCount(e.passages) }));
  }
  return s.primaryPassages.map((p, i) => ({ index: i, title: p.title ?? refText(p), summary: p.description ?? "", passages: [{ surahNumber: p.surahNumber, ayahStart: p.ayahStart, ayahEnd: p.ayahEnd }], ayahs: span(p) }));
}

/** "Order: the surah's own sequence (Yusuf 12:4–101)", only when every chapter is in one surah and they ascend; otherwise null. */
export function orderLine(chs: StoryChapter[]): string | null {
  const all = chs.flatMap((c) => c.passages);
  if (!all.length) return null;
  const surah = all[0]!.surahNumber;
  if (!all.every((p) => p.surahNumber === surah)) return null;
  for (let i = 1; i < all.length; i++) if (all[i]!.ayahStart < all[i - 1]!.ayahStart) return null;
  const first = all[0]!;
  const last = all.reduce((m, p) => Math.max(m, p.ayahEnd), 0);
  return `Order: the surah's own sequence (${surahName(surah)} ${surah}:${first.ayahStart}–${last})`;
}

/** Shown for every story whose narrative status is not "fully told in the Qur'an" (8 stories). */
export const isArranged = (s: QuranStory): boolean => s.narrativeStatus !== "quran_complete";

// ---------------------------------------------------------------- also told in (story level; no per-chapter mapping in the data)

export interface TellingRow {
  kind: "Primary" | "Supporting";
  title: string | null;
  ref: PassageRef;
  ayahs: number;
  /** the data's description, or null (the drawer then says "No description recorded yet.") */
  description: string | null;
}
export function tellings(s: QuranStory): TellingRow[] {
  const row = (p: QuranStory["primaryPassages"][number], kind: TellingRow["kind"]): TellingRow => ({ kind, title: p.title ?? null, ref: { surahNumber: p.surahNumber, ayahStart: p.ayahStart, ayahEnd: p.ayahEnd }, ayahs: span(p), description: p.description?.trim() ? p.description : null });
  return [...s.primaryPassages.map((p) => row(p, "Primary")), ...(s.supportingPassages ?? []).map((p) => row(p, "Supporting"))];
}
export const hasSupporting = (s: QuranStory) => !!s.supportingPassages?.length;

// ---------------------------------------------------------------- directory

export interface StoryFilters {
  q: string;
  type: StoryTypeFilter;
  person: string;
  saved: boolean;
}
export const NO_STORY_FILTERS: StoryFilters = { q: "", type: "all", person: "", saved: false };
export const isFilteredStories = (f: StoryFilters) => !!f.q.trim() || f.type !== "all" || !!f.person || f.saved;

export function filterStories(f: StoryFilters, savedIds: ReadonlySet<string>, list: QuranStory[] = STORIES): QuranStory[] {
  let out = filterByStoryType(list, f.type);
  if (f.person) out = filterByPersonId(out, f.person);
  if (f.saved) out = out.filter((s) => savedIds.has(s.id));
  return searchStories(out, f.q);
}
const TYPE_VALUES = new Set(STORY_TYPE_FILTERS.map((t) => t.value));
export function storyFiltersFromQuery(query: Record<string, unknown>): StoryFilters {
  const one = (v: unknown) => (Array.isArray(v) ? v[0] : v);
  const t = one(query.type);
  const p = one(query.person);
  const q = one(query.q);
  return { q: typeof q === "string" ? q : "", type: typeof t === "string" && TYPE_VALUES.has(t as StoryTypeFilter) ? (t as StoryTypeFilter) : "all", person: typeof p === "string" && personById(p) ? p : "", saved: one(query.saved) === "1" };
}
export function storyFiltersToQuery(f: StoryFilters): Record<string, string> {
  const out: Record<string, string> = {};
  if (f.q.trim()) out.q = f.q;
  if (f.type !== "all") out.type = f.type;
  if (f.person) out.person = f.person;
  if (f.saved) out.saved = "1";
  return out;
}
export const storyCountLine = (shown: number, total: number) => (shown === total ? `${total} stories` : `${shown} of ${total} stories`);
/** People that appear in at least one story, for the person filter. */
export const peopleInStories = (): { id: string; name: string }[] =>
  [...new Set(STORIES.flatMap((s) => s.personIds ?? []))].flatMap((id) => {
    const p = personById(id);
    return p ? [{ id, name: displayName(p) }] : [];
  });

// ---------------------------------------------------------------- the chapter in the URL

/** `?chapter=3` is chapter 3 (1-based); `end` is the end page; anything else opens chapter 1. Returns a 0-based index or "end". */
export function chapterFromQuery(v: unknown, total: number): number | "end" {
  const raw = Array.isArray(v) ? v[0] : v;
  if (raw === "end") return "end";
  if (typeof raw === "string" && /^\d+$/.test(raw)) {
    const n = Number(raw);
    if (n >= 1 && n <= total) return n - 1;
  }
  return 0;
}
export const chapterQuery = (c: number | "end"): Record<string, string> => (c === 0 ? {} : { chapter: c === "end" ? "end" : String(c + 1) });
export const chapterHref = (id: string, c: number | "end") => `/stories/${id}${c === 0 ? "" : `?chapter=${c === "end" ? "end" : c + 1}`}`;

// ---------------------------------------------------------------- long chapters

export const FIRST_AYAHS = 8;
export const visibleAyahs = (c: StoryChapter, showAll: boolean): PassageRef[] => {
  if (showAll || c.ayahs <= FIRST_AYAHS) return c.passages;
  const out: PassageRef[] = [];
  let left = FIRST_AYAHS;
  for (const p of c.passages) {
    if (left <= 0) break;
    const take = Math.min(left, span(p));
    out.push({ surahNumber: p.surahNumber, ayahStart: p.ayahStart, ayahEnd: p.ayahStart + take - 1 });
    left -= take;
  }
  return out;
};

// ---------------------------------------------------------------- entities (data only)

export type EntityKind = "person" | "community" | "place" | "event";
export interface Entity {
  kind: EntityKind;
  id: string;
  name: string;
  arabicName: string | null;
  /** a short line from the data: the category, the type, or the identification basis in the legacy words */
  chips: string[];
  description: string;
  /** a link only where the page exists (people since 7A); places, peoples and events arrive in Phase 12 */
  href: string | null;
}
const PLACE_TYPE = (t: string) => t.replace(/_/g, " ");
export function entitiesOf(s: QuranStory) {
  const people: Entity[] = (s.personIds ?? []).flatMap((id) => {
    const p = personById(id);
    return p ? [{ kind: "person" as const, id, name: displayName(p), arabicName: p.arabicName, chips: [p.primaryCategory.replace(/_/g, " ")], description: p.shortDescription, href: `/persons/${id}` }] : [];
  });
  const communities: Entity[] = (s.communityIds ?? []).flatMap((id) => {
    const c = QURAN_COMMUNITIES.find((x) => x.id === id);
    return c ? [{ kind: "community" as const, id, name: c.name, arabicName: c.arabicName, chips: [c.communityType.replace(/_/g, " "), IDENTIFICATION_LABELS[c.identificationBasis] ?? c.identificationBasis], description: c.shortDescription, href: null }] : [];
  });
  const places: Entity[] = (s.placeIds ?? []).flatMap((id) => {
    const p = QURAN_PLACES.find((x) => x.id === id);
    return p ? [{ kind: "place" as const, id, name: p.name, arabicName: p.arabicName, chips: [PLACE_TYPE(p.placeType), IDENTIFICATION_LABELS[p.identificationBasis] ?? p.identificationBasis], description: p.shortDescription, href: null }] : [];
  });
  const events: Entity[] = QURAN_EVENTS.filter((e) => e.storyIds?.includes(s.id)).map((e) => ({ kind: "event" as const, id: e.id, name: e.title, arabicName: null, chips: [], description: e.description, href: null }));
  return { people, communities, places, events };
}
/** Ids a story names that the data does not resolve (reported by a test; the page shows only what resolves). */
export function unresolvedIds(s: QuranStory): string[] {
  const e = entitiesOf(s);
  const miss = (ids: string[] | undefined, got: Entity[], tag: string) => (ids ?? []).filter((id) => !got.some((g) => g.id === id)).map((id) => `${tag}:${id}`);
  return [...miss(s.personIds, e.people, "person"), ...miss(s.communityIds, e.communities, "community"), ...miss(s.placeIds, e.places, "place")];
}
