// Pure search/filter/grouping logic for the Prophets & Qur'anic Persons
// feature (prophets-quran-feature.md §16, §4, §9, §11). Kept dependency-free
// (no Nuxt/Vue imports) so it can be unit-tested directly and reused from
// usePersons.ts.
import type { PrimaryCategory, QuranPerson, QuranReference, RelatedPassage } from "~/data/quranPersons";

export type CategoryFilter = PrimaryCategory | "all";

export const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "prophet", label: "Prophets" },
  { value: "woman", label: "Women" },
  { value: "man", label: "Men" },
  { value: "ruler_leader", label: "Rulers & Leaders" },
  { value: "companion", label: "Companions" },
  { value: "family_relative", label: "Families & Relatives" },
  { value: "other", label: "Other Persons" },
];

/** Strips Arabic diacritics (tashkeel) so search matches regardless of whether
 * either side of the comparison carries vowel marks. */
const stripTashkeel = (s: string) => s.replace(/[ً-ٰٟ]/g, "");

const normalize = (s: string) => stripTashkeel(s).toLowerCase().trim();

/** Parses an exact "11:25" style reference the user might type into search. */
export const parseExactReference = (query: string): { surahNumber: number; ayahNumber: number } | null => {
  const match = query.trim().match(/^(\d{1,3}):(\d{1,3})$/);
  if (!match) return null;
  const surahNumber = Number(match[1]);
  const ayahNumber = Number(match[2]);
  if (surahNumber < 1 || surahNumber > 114 || ayahNumber < 1) return null;
  return { surahNumber, ayahNumber };
};

const referenceMatchesExact = (
  person: QuranPerson,
  ref: { surahNumber: number; ayahNumber: number }
): boolean => {
  const inDirectMentions = person.directMentions.some(
    (m) => m.surahNumber === ref.surahNumber && m.ayahNumber === ref.ayahNumber
  );
  if (inDirectMentions) return true;
  return person.relatedPassages.some(
    (p) =>
      p.surahNumber === ref.surahNumber &&
      ref.ayahNumber >= p.ayahStart &&
      ref.ayahNumber <= p.ayahEnd
  );
};

/**
 * Full-text search across name/arabicName/alternateNames/description/themes/
 * categories/references per prophets-quran-feature.md §16. Supports partial
 * matches and an exact "surah:ayah" reference lookup.
 */
export const searchPersons = (persons: QuranPerson[], query: string): QuranPerson[] => {
  const trimmed = query.trim();
  if (!trimmed) return persons;

  const exactRef = parseExactReference(trimmed);
  if (exactRef) {
    const matches = persons.filter((p) => referenceMatchesExact(p, exactRef));
    if (matches.length) return matches;
    // fall through to text search if nothing matched the exact reference
  }

  const q = normalize(trimmed);

  return persons.filter((p) => {
    const haystacks = [
      p.name,
      p.arabicName,
      ...(p.alternateNames ?? []),
      p.shortDescription,
      p.detailedDescription ?? "",
      ...(p.themes ?? []),
      p.primaryCategory,
      ...(p.secondaryCategories ?? []),
    ].map(normalize);

    if (haystacks.some((h) => h.includes(q))) return true;

    // surah/ayah numeric matches, e.g. searching "12" surfaces Yusuf (surah 12)
    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber) && asNumber > 0) {
      const inMentions = p.directMentions.some((m) => m.surahNumber === asNumber);
      const inPassages = p.relatedPassages.some((rp) => rp.surahNumber === asNumber);
      if (inMentions || inPassages) return true;
    }

    return false;
  });
};

/** primaryCategory OR secondaryCategories match, per §4 "Filtering should use both". */
export const filterByCategory = (persons: QuranPerson[], category: CategoryFilter): QuranPerson[] => {
  if (category === "all") return persons;
  return persons.filter(
    (p) => p.primaryCategory === category || (p.secondaryCategories ?? []).includes(category)
  );
};

export interface SurahGroup<T> {
  surahNumber: number;
  references: T[];
}

/** Groups direct mentions by Surah, each surah's ayahs ascending — §9 "Group direct mentions by Surah". */
export const groupDirectMentionsBySurah = (person: QuranPerson): SurahGroup<QuranReference>[] => {
  const bySurah = new Map<number, QuranReference[]>();
  for (const ref of person.directMentions) {
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

/** Groups Related Passages by Surah — the "Grouped by Surah" view (§11). */
export const groupRelatedPassagesBySurah = (person: QuranPerson): SurahGroup<RelatedPassage>[] => {
  const bySurah = new Map<number, RelatedPassage[]>();
  for (const passage of person.relatedPassages) {
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

/** Sorts Related Passages into a narrative sequence — the "Story View" (§11).
 * Falls back to surah/ayah order for passages without an explicit storyOrder,
 * so an incompletely-curated person still renders a sensible sequence. */
export const sortRelatedPassagesForStoryView = (person: QuranPerson): RelatedPassage[] =>
  [...person.relatedPassages].sort((a, b) => {
    if (a.storyOrder != null && b.storyOrder != null) return a.storyOrder - b.storyOrder;
    if (a.storyOrder != null) return -1;
    if (b.storyOrder != null) return 1;
    return a.surahNumber - b.surahNumber || a.ayahStart - b.ayahStart;
  });
