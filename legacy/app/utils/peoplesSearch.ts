// Pure search/filter/grouping logic for the Peoples & Nations module (Phase
// 2). Mirrors app/utils/personsSearch.ts's pattern deliberately (per
// MODULE_BLUEPRINT.md's Phase 0 foundation: "one dependency-free
// {module}Search.ts per module") rather than sharing implementation with
// it — the haystack fields genuinely differ (communityType vs
// primaryCategory, no secondaryCategories concept here), so a parallel file
// following the same shape was judged clearer than forcing a shared
// generic function for logic this thin.
import type { QuranCommunity, CommunityType } from "~/data/quranPeoples";

export type CommunityTypeFilter = CommunityType | "all";

export const COMMUNITY_TYPE_FILTERS: { value: CommunityTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "nation", label: "Nations" },
  { value: "tribe", label: "Tribes" },
  { value: "community", label: "Communities" },
  { value: "religious_community", label: "Religious Communities" },
  { value: "historical_population", label: "Historical Populations" },
  { value: "narrative_group", label: "Narrative Groups" },
];

const stripTashkeel = (s: string) => s.replace(/[ً-ٰٟ]/g, "");
const normalize = (s: string) => stripTashkeel(s).toLowerCase().trim();

/** Parses an exact "11:25" style reference the user might type into search
 * — identical shape/behavior to personsSearch.ts's own parseExactReference,
 * duplicated rather than imported since it's a tiny, dependency-free,
 * module-agnostic 6-line function, not worth a cross-module import for. */
export const parseExactReference = (query: string): { surahNumber: number; ayahNumber: number } | null => {
  const match = query.trim().match(/^(\d{1,3}):(\d{1,3})$/);
  if (!match) return null;
  const surahNumber = Number(match[1]);
  const ayahNumber = Number(match[2]);
  if (surahNumber < 1 || surahNumber > 114 || ayahNumber < 1) return null;
  return { surahNumber, ayahNumber };
};

const referenceMatchesExact = (
  community: QuranCommunity,
  ref: { surahNumber: number; ayahNumber: number }
): boolean => {
  const inDirectMentions = community.directMentions.some(
    (m) => m.surahNumber === ref.surahNumber && m.ayahNumber === ref.ayahNumber
  );
  if (inDirectMentions) return true;
  return community.relatedPassages.some(
    (p) => p.surahNumber === ref.surahNumber && ref.ayahNumber >= p.ayahStart && ref.ayahNumber <= p.ayahEnd
  );
};

/** Full-text search across name/arabicName/alternateNames/description/
 * themes/communityType, plus the same exact "surah:ayah" shortcut as
 * personsSearch.ts's searchPersons. */
export const searchCommunities = (communities: QuranCommunity[], query: string): QuranCommunity[] => {
  const trimmed = query.trim();
  if (!trimmed) return communities;

  const exactRef = parseExactReference(trimmed);
  if (exactRef) {
    const matches = communities.filter((c) => referenceMatchesExact(c, exactRef));
    if (matches.length) return matches;
  }

  const q = normalize(trimmed);

  return communities.filter((c) => {
    const haystacks = [
      c.name,
      c.arabicName,
      ...(c.alternateNames ?? []),
      c.shortDescription,
      c.detailedDescription ?? "",
      ...(c.themes ?? []),
      c.communityType,
    ].map(normalize);

    if (haystacks.some((h) => h.includes(q))) return true;

    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber) && asNumber > 0) {
      const inMentions = c.directMentions.some((m) => m.surahNumber === asNumber);
      const inPassages = c.relatedPassages.some((rp) => rp.surahNumber === asNumber);
      if (inMentions || inPassages) return true;
    }

    return false;
  });
};

export const filterByCommunityType = (
  communities: QuranCommunity[],
  type: CommunityTypeFilter
): QuranCommunity[] => {
  if (type === "all") return communities;
  return communities.filter((c) => c.communityType === type);
};

export interface SurahGroup<T> {
  surahNumber: number;
  references: T[];
}

export const groupDirectMentionsBySurah = (community: QuranCommunity) => {
  const bySurah = new Map<number, QuranCommunity["directMentions"]>();
  for (const ref of community.directMentions) {
    const list = bySurah.get(ref.surahNumber) ?? [];
    list.push(ref);
    bySurah.set(ref.surahNumber, list);
  }
  return Array.from(bySurah.entries())
    .sort(([a], [b]) => a - b)
    .map(([surahNumber, references]) => ({
      surahNumber,
      references: [...references].sort((a, b) => (a.ayahNumber ?? 0) - (b.ayahNumber ?? 0)),
    }));
};

export const groupRelatedPassagesBySurah = (community: QuranCommunity) => {
  const bySurah = new Map<number, QuranCommunity["relatedPassages"]>();
  for (const passage of community.relatedPassages) {
    const list = bySurah.get(passage.surahNumber) ?? [];
    list.push(passage);
    bySurah.set(passage.surahNumber, list);
  }
  return Array.from(bySurah.entries())
    .sort(([a], [b]) => a - b)
    .map(([surahNumber, references]) => ({
      surahNumber,
      references: [...references].sort((a, b) => a.ayahStart - b.ayahStart),
    }));
};
