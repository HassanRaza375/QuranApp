// Dataset integrity checks for the Duas module (Phase 6). Mirrors
// app/utils/themesValidate.ts's pattern (independent file, zero risk to
// earlier phases' validators), plus the checks specific to this module's
// own shape: speaker consistency (personId only set when speakerType is
// "person," and vice versa) and Arabic-source integrity (every passage —
// primary and parallel — validated against real ayah bounds, since this
// dataset carries no Arabic text of its own to check directly; bounds-
// checking the reference IS the integrity check here).
import type { QuranDua, DuaCategory, DuaSourceBasis, DuaSpeakerType } from "~/data/quranDuas";
import { getPersonById } from "~/data/quranPersons";
import { getCommunityById } from "~/data/quranPeoples";
import { getPlaceById } from "~/data/quranPlaces";
import { getStoryById } from "~/data/quranStories";
import { getThemeById } from "~/data/quranThemes";

export interface SurahMeta {
  surahNo: number;
  totalAyah: number;
}

export interface ValidationIssue {
  duaId: string;
  message: string;
}

const VALID_SOURCE_BASES: DuaSourceBasis[] = ["quran_explicit", "quran_narrative", "quran_instruction"];
const VALID_CATEGORIES: DuaCategory[] = [
  "forgiveness", "guidance", "protection", "mercy", "family", "provision", "patience",
  "gratitude", "knowledge", "worship", "repentance", "help", "faith", "hereafter",
];
const VALID_SPEAKER_TYPES: DuaSpeakerType[] = ["person", "believers_general", "unspecified_narrative"];

const isValidSurah = (surahNumber: number, surahs: SurahMeta[]): SurahMeta | undefined =>
  surahs.find((s) => s.surahNo === surahNumber);

const validatePassageBounds = (
  passage: { surahNumber: number; ayahStart: number; ayahEnd: number },
  surahs: SurahMeta[],
  label: string,
  push: (message: string) => void
) => {
  const surah = isValidSurah(passage.surahNumber, surahs);
  if (!surah) {
    push(`${label}: surah ${passage.surahNumber} does not exist`);
    return;
  }
  if (passage.ayahStart < 1 || passage.ayahEnd > surah.totalAyah) {
    push(`${label}: range ${passage.ayahStart}-${passage.ayahEnd} is out of bounds (surah ${passage.surahNumber} has ${surah.totalAyah} ayahs)`);
  }
  if (passage.ayahStart > passage.ayahEnd) {
    push(`${label}: ayahStart (${passage.ayahStart}) is after ayahEnd (${passage.ayahEnd})`);
  }
};

export const validateDua = (dua: QuranDua, surahs: SurahMeta[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const push = (message: string) => issues.push({ duaId: dua.id, message });

  if (!dua.id) push("missing id");
  if (!dua.title) push("missing title");
  if (!dua.arabicTitle) push("missing arabicTitle");
  if (!dua.context) push("missing context");
  if (!dua.askingFor) push("missing askingFor");
  if (!dua.passage) push("missing passage");
  if (!VALID_SOURCE_BASES.includes(dua.sourceBasis)) push(`invalid sourceBasis "${dua.sourceBasis}"`);
  if (!VALID_CATEGORIES.includes(dua.category)) push(`invalid category "${dua.category}"`);
  if (!VALID_SPEAKER_TYPES.includes(dua.speakerType)) push(`invalid speakerType "${dua.speakerType}"`);

  if (dua.passage) validatePassageBounds(dua.passage, surahs, "passage", push);
  for (const p of dua.parallelPassages ?? []) validatePassageBounds(p, surahs, `parallelPassages[${p.id}]`, push);

  if (dua.isPartialAyah && !dua.segmentNote) {
    push("isPartialAyah is true but segmentNote is missing — a partial-ayah dua must explain which portion is the actual dua");
  }

  // Speaker consistency — the specific check this module's own type design
  // exists to enforce (see quranDuas.ts's header on speakerType).
  if (dua.speakerType === "person") {
    if (!dua.personId) push("speakerType is 'person' but personId is not set");
    else if (!getPersonById(dua.personId)) push(`personId: "${dua.personId}" does not resolve to a Persons-module entry`);
    if (dua.speakerLabel) push("speakerType is 'person' but speakerLabel is also set — set only one");
  } else {
    if (dua.personId) push(`speakerType is "${dua.speakerType}" but personId is also set — a generic speaker must not reference a Person`);
    if (!dua.speakerLabel) push(`speakerType is "${dua.speakerType}" but speakerLabel is missing`);
  }

  for (const communityId of dua.communityIds ?? []) {
    if (!getCommunityById(communityId)) push(`communityIds: "${communityId}" does not resolve to a Peoples & Nations entry`);
  }
  for (const placeId of dua.placeIds ?? []) {
    if (!getPlaceById(placeId)) push(`placeIds: "${placeId}" does not resolve to a Places entry`);
  }
  if (dua.storyId && !getStoryById(dua.storyId)) push(`storyId: "${dua.storyId}" does not resolve to a Stories entry`);
  for (const themeId of dua.themeIds ?? []) {
    if (!getThemeById(themeId)) push(`themeIds: "${themeId}" does not resolve to a Themes entry`);
  }

  return issues;
};

export const validateDuaDataset = (duas: QuranDua[], surahs: SurahMeta[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();

  for (const dua of duas) {
    if (ids.has(dua.id)) issues.push({ duaId: dua.id, message: `duplicate dua id "${dua.id}"` });
    ids.add(dua.id);
    issues.push(...validateDua(dua, surahs));
  }

  return issues;
};
