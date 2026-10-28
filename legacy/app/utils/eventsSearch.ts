// Pure search/filter logic for the Events module (Phase 7). Mirrors
// app/utils/duasSearch.ts's pattern. Same standing gap as every prior
// phase: separate from the site-wide `/search` page, not unified here
// either — see MODULE_BLUEPRINT.md's Phase 0 section.
import type { QuranEvent, EventCategory } from "~/data/quranEvents";

export type EventCategoryFilter = EventCategory | "all";

export const EVENT_CATEGORY_FILTERS: { value: EventCategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "creation", label: "Creation" },
  { value: "birth", label: "Birth" },
  { value: "migration", label: "Migration" },
  { value: "journey", label: "Journey" },
  { value: "confrontation", label: "Confrontation" },
  { value: "battle", label: "Battle" },
  { value: "miracle", label: "Miracle" },
  { value: "trial", label: "Trial" },
  { value: "rescue", label: "Rescue" },
  { value: "destruction", label: "Destruction" },
  { value: "revelation", label: "Revelation" },
  { value: "covenant", label: "Covenant" },
  { value: "worship", label: "Worship" },
  { value: "communal_transformation", label: "Communal Transformation" },
];

const stripTashkeel = (s: string) => s.replace(/[ً-ٰٟ]/g, "");
const normalize = (s: string) => stripTashkeel(s).toLowerCase().trim();

export const parseExactReference = (query: string): { surahNumber: number; ayahNumber: number } | null => {
  const match = query.trim().match(/^(\d{1,3}):(\d{1,3})$/);
  if (!match) return null;
  const surahNumber = Number(match[1]);
  const ayahNumber = Number(match[2]);
  if (surahNumber < 1 || surahNumber > 114 || ayahNumber < 1) return null;
  return { surahNumber, ayahNumber };
};

const allPassages = (event: QuranEvent) => [event.passage, ...(event.parallelPassages ?? [])];

const referenceMatchesExact = (event: QuranEvent, ref: { surahNumber: number; ayahNumber: number }): boolean =>
  allPassages(event).some(
    (p) => p.surahNumber === ref.surahNumber && ref.ayahNumber >= p.ayahStart && ref.ayahNumber <= p.ayahEnd
  );

/** Full-text search across title/arabicTitle/description/category, plus
 * the exact "surah:ayah" shortcut. Does not search Arabic ayah text or
 * translation directly — this dataset stores neither (identical
 * architecture to Duas/Themes/Stories); those are fetched live for
 * display only, not indexed here. */
export const searchEvents = (events: QuranEvent[], query: string): QuranEvent[] => {
  const trimmed = query.trim();
  if (!trimmed) return events;

  const exactRef = parseExactReference(trimmed);
  if (exactRef) {
    const matches = events.filter((e) => referenceMatchesExact(e, exactRef));
    if (matches.length) return matches;
  }

  const q = normalize(trimmed);

  return events.filter((e) => {
    const haystacks = [e.title, e.arabicTitle, e.description, e.category].map(normalize);
    return haystacks.some((h) => h.includes(q));
  });
};

export const filterByEventCategory = (events: QuranEvent[], category: EventCategoryFilter): QuranEvent[] => {
  if (category === "all") return events;
  return events.filter((e) => e.category === category);
};

export const filterByEventPerson = (events: QuranEvent[], personId: string): QuranEvent[] =>
  events.filter((e) => e.personIds?.includes(personId));

export const filterByEventPlace = (events: QuranEvent[], placeId: string): QuranEvent[] =>
  events.filter((e) => e.placeIds?.includes(placeId));

export const filterByEventCommunity = (events: QuranEvent[], communityId: string): QuranEvent[] =>
  events.filter((e) => e.communityIds?.includes(communityId));

export const filterByEventStory = (events: QuranEvent[], storyId: string): QuranEvent[] =>
  events.filter((e) => e.storyIds?.includes(storyId));
