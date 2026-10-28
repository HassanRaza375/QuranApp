// Dataset integrity checks for the Themes module (Phase 5). Mirrors
// app/utils/storiesValidate.ts's pattern (independent file, zero risk to
// earlier phases' validators), plus cross-module id resolution against
// Persons/Peoples/Places/Stories, same strictness rationale as Stories'
// own validator (this dataset was authored in one complete pass, so
// dangling forward-references are not expected the way Phase 1's
// intentionally-incremental seed allowed for).
import type { QuranTheme, ThemeCategory, ConceptualBasis } from "~/data/quranThemes";
import { getPersonById } from "~/data/quranPersons";
import { getCommunityById } from "~/data/quranPeoples";
import { getPlaceById } from "~/data/quranPlaces";
import { getStoryById } from "~/data/quranStories";

export interface SurahMeta {
  surahNo: number;
  totalAyah: number;
}

export interface ValidationIssue {
  themeId: string;
  message: string;
}

const VALID_CATEGORIES: ThemeCategory[] = [
  "belief", "worship_spirituality", "character", "moral_warning", "social_civilizational", "trials_human_experience",
];
const VALID_CONCEPTUAL_BASES: ConceptualBasis[] = [
  "quran_explicit_concept", "quran_derived_concept", "scholarly_interpretation",
];
const VALID_SOURCE_TYPES = ["quran", "authentic_hadith", "traditional_account"];

const isValidSurah = (surahNumber: number, surahs: SurahMeta[]): SurahMeta | undefined =>
  surahs.find((s) => s.surahNo === surahNumber);

export const validateTheme = (theme: QuranTheme, surahs: SurahMeta[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const push = (message: string) => issues.push({ themeId: theme.id, message });

  if (!theme.id) push("missing id");
  if (!theme.name) push("missing name");
  if (!theme.arabicName) push("missing arabicName");
  if (!theme.definition) push("missing definition");
  if (!theme.description) push("missing description");
  if (!VALID_CATEGORIES.includes(theme.category)) push(`invalid category "${theme.category}"`);
  if (!VALID_CONCEPTUAL_BASES.includes(theme.conceptualBasis)) {
    push(`invalid conceptualBasis "${theme.conceptualBasis}"`);
  }
  if (!theme.representativePassages.length) push("must have at least one representative passage");

  for (const passage of theme.representativePassages) {
    const surah = isValidSurah(passage.surahNumber, surahs);
    if (!surah) {
      push(`representativePassages[${passage.id}]: surah ${passage.surahNumber} does not exist`);
      continue;
    }
    if (passage.ayahStart < 1 || passage.ayahEnd > surah.totalAyah) {
      push(`representativePassages[${passage.id}]: range ${passage.ayahStart}-${passage.ayahEnd} is out of bounds (surah ${passage.surahNumber} has ${surah.totalAyah} ayahs)`);
    }
    if (passage.ayahStart > passage.ayahEnd) {
      push(`representativePassages[${passage.id}]: ayahStart (${passage.ayahStart}) is after ayahEnd (${passage.ayahEnd})`);
    }
  }

  for (const personId of theme.personIds ?? []) {
    if (!getPersonById(personId)) push(`personIds: "${personId}" does not resolve to a Persons-module entry`);
  }
  for (const communityId of theme.communityIds ?? []) {
    if (!getCommunityById(communityId)) push(`communityIds: "${communityId}" does not resolve to a Peoples & Nations entry`);
  }
  for (const placeId of theme.placeIds ?? []) {
    if (!getPlaceById(placeId)) push(`placeIds: "${placeId}" does not resolve to a Places entry`);
  }
  for (const storyId of theme.storyIds ?? []) {
    if (!getStoryById(storyId)) push(`storyIds: "${storyId}" does not resolve to a Stories entry`);
  }

  if ((theme.relatedThemeIds ?? []).includes(theme.id)) {
    push("relatedThemeIds must not include the theme's own id (self-reference)");
  }

  for (const source of theme.sources ?? []) {
    if (!VALID_SOURCE_TYPES.includes(source.type)) push(`sources: invalid type "${source.type}"`);
  }

  return issues;
};

/** Cross-theme checks: unique ids, and every relatedThemeIds entry
 * resolves within this same dataset. No hierarchy/circularity check is
 * needed — themes are a flat list tagged by `category`, not a
 * self-referential parent/child tree (see quranThemes.ts's own
 * architecture-decision header for why). */
export const validateThemeDataset = (themes: QuranTheme[], surahs: SurahMeta[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();

  for (const theme of themes) {
    if (ids.has(theme.id)) issues.push({ themeId: theme.id, message: `duplicate theme id "${theme.id}"` });
    ids.add(theme.id);
    issues.push(...validateTheme(theme, surahs));
  }

  for (const theme of themes) {
    for (const relatedId of theme.relatedThemeIds ?? []) {
      if (!ids.has(relatedId)) {
        issues.push({ themeId: theme.id, message: `relatedThemeIds: "${relatedId}" does not resolve to a Theme in this dataset` });
      }
    }
  }

  return issues;
};
