// Pure search/filter/grouping logic for the Stories module (Phase 4).
// Mirrors app/utils/placesSearch.ts's pattern (per Phase 0's established
// "one dependency-free {module}Search.ts per module" rule). Phase 0's own
// documented gap remains true here too: this is a separate, local search
// from the site-wide `/search` page (raw ayah/tafsir text search against
// the external API) — not unified, not attempted in this phase either;
// see MODULE_BLUEPRINT.md's Phase 0 section for that standing decision.
import type { QuranStory, StoryType } from "~/data/quranStories";

export type StoryTypeFilter = StoryType | "all";

export const STORY_TYPE_FILTERS: { value: StoryTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "prophetic_narrative", label: "Prophetic Narratives" },
  { value: "individual_narrative", label: "Individual Narratives" },
  { value: "group_narrative", label: "Group Narratives" },
  { value: "communal_narrative", label: "Communal Narratives" },
  { value: "journey_narrative", label: "Journey Narratives" },
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

const allPassages = (story: QuranStory) => [
  ...story.primaryPassages,
  ...(story.supportingPassages ?? []),
  ...(story.episodes ?? []).flatMap((e) => e.passages),
];

const referenceMatchesExact = (story: QuranStory, ref: { surahNumber: number; ayahNumber: number }): boolean =>
  allPassages(story).some(
    (p) => p.surahNumber === ref.surahNumber && ref.ayahNumber >= p.ayahStart && ref.ayahNumber <= p.ayahEnd
  );

/** Full-text search across title/arabicTitle/alternateTitles/description/
 * themes/storyType — same shape as every other module's search, plus the
 * same exact "surah:ayah" shortcut, checked against every passage
 * (primary, supporting, and nested inside episodes). */
export const searchStories = (stories: QuranStory[], query: string): QuranStory[] => {
  const trimmed = query.trim();
  if (!trimmed) return stories;

  const exactRef = parseExactReference(trimmed);
  if (exactRef) {
    const matches = stories.filter((s) => referenceMatchesExact(s, exactRef));
    if (matches.length) return matches;
  }

  const q = normalize(trimmed);

  return stories.filter((s) => {
    const haystacks = [
      s.title,
      s.arabicTitle,
      ...(s.alternateTitles ?? []),
      s.shortDescription,
      s.detailedDescription ?? "",
      ...(s.themes ?? []),
      s.storyType,
    ].map(normalize);

    if (haystacks.some((h) => h.includes(q))) return true;

    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber) && asNumber > 0) {
      if (allPassages(s).some((p) => p.surahNumber === asNumber)) return true;
    }

    return false;
  });
};

export const filterByStoryType = (stories: QuranStory[], type: StoryTypeFilter): QuranStory[] => {
  if (type === "all") return stories;
  return stories.filter((s) => s.storyType === type);
};

/** Filters stories to ones connected to a given Person id — used for the
 * "prophet/person" directory filter (Phase 4's own UX requirement). */
export const filterByPersonId = (stories: QuranStory[], personId: string): QuranStory[] =>
  stories.filter((s) => (s.personIds ?? []).includes(personId));
