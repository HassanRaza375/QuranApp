// Dataset integrity checks for the Events module (Phase 7). Mirrors
// app/utils/duasValidate.ts's pattern, extended with checks specific to
// this module's own shape: relativeChronology ids must resolve (a
// Person for duringPersonId, another Event for before/afterEventId), and
// every one of the six cross-module id arrays (person/community/place/
// story/theme/dua) must resolve against its real dataset — the same
// discipline that has twice caught the group-vs-community id confusion
// bug in earlier phases (Stories, Duas); this validator is written to
// catch it a third time if it recurs here.
import type { QuranEvent, EventCategory, EventSourceBasis } from "~/data/quranEvents";
import type { ChronologyStatus } from "~/data/quranPersons";
import { getPersonById } from "~/data/quranPersons";
import { getCommunityById } from "~/data/quranPeoples";
import { getPlaceById } from "~/data/quranPlaces";
import { getStoryById } from "~/data/quranStories";
import { getThemeById } from "~/data/quranThemes";
import { getDuaById } from "~/data/quranDuas";

export interface SurahMeta {
  surahNo: number;
  totalAyah: number;
}

export interface ValidationIssue {
  eventId: string;
  message: string;
}

const VALID_CATEGORIES: EventCategory[] = [
  "creation", "birth", "migration", "journey", "confrontation", "battle",
  "miracle", "trial", "rescue", "destruction", "revelation", "covenant",
  "worship", "communal_transformation",
];
const VALID_SOURCE_BASES: EventSourceBasis[] = ["quran_explicit", "quran_context", "traditional", "disputed"];
const VALID_CHRONOLOGY_STATUSES: ChronologyStatus[] = ["strong", "traditional", "uncertain", "unknown"];

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

export const validateEvent = (event: QuranEvent, surahs: SurahMeta[], allEventIds?: Set<string>): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const push = (message: string) => issues.push({ eventId: event.id, message });

  if (!event.id) push("missing id");
  if (!event.title) push("missing title");
  if (!event.arabicTitle) push("missing arabicTitle");
  if (!event.description) push("missing description");
  if (!event.passage) push("missing passage");
  if (!VALID_CATEGORIES.includes(event.category)) push(`invalid category "${event.category}"`);
  if (!VALID_SOURCE_BASES.includes(event.sourceBasis)) push(`invalid sourceBasis "${event.sourceBasis}"`);
  if (!VALID_CHRONOLOGY_STATUSES.includes(event.chronologyStatus)) push(`invalid chronologyStatus "${event.chronologyStatus}"`);

  if (event.passage) validatePassageBounds(event.passage, surahs, "passage", push);
  for (const p of event.parallelPassages ?? []) validatePassageBounds(p, surahs, `parallelPassages[${p.id}]`, push);

  for (const personId of event.personIds ?? []) {
    if (!getPersonById(personId)) push(`personIds: "${personId}" does not resolve to a Persons-module entry`);
  }
  for (const communityId of event.communityIds ?? []) {
    if (!getCommunityById(communityId)) push(`communityIds: "${communityId}" does not resolve to a Peoples & Nations entry`);
  }
  for (const placeId of event.placeIds ?? []) {
    if (!getPlaceById(placeId)) push(`placeIds: "${placeId}" does not resolve to a Places entry`);
  }
  for (const storyId of event.storyIds ?? []) {
    if (!getStoryById(storyId)) push(`storyIds: "${storyId}" does not resolve to a Stories entry`);
  }
  for (const themeId of event.themeIds ?? []) {
    if (!getThemeById(themeId)) push(`themeIds: "${themeId}" does not resolve to a Themes entry`);
  }
  for (const duaId of event.duaIds ?? []) {
    if (!getDuaById(duaId)) push(`duaIds: "${duaId}" does not resolve to a Duas entry`);
  }

  if (allEventIds) {
    for (const relatedId of event.relatedEventIds ?? []) {
      if (!allEventIds.has(relatedId)) push(`relatedEventIds: "${relatedId}" does not resolve to another Event`);
    }
    const rc = event.relativeChronology;
    if (rc?.duringPersonId && !getPersonById(rc.duringPersonId)) {
      push(`relativeChronology.duringPersonId: "${rc.duringPersonId}" does not resolve to a Persons-module entry`);
    }
    if (rc?.beforeEventId && !allEventIds.has(rc.beforeEventId)) {
      push(`relativeChronology.beforeEventId: "${rc.beforeEventId}" does not resolve to another Event`);
    }
    if (rc?.afterEventId && !allEventIds.has(rc.afterEventId)) {
      push(`relativeChronology.afterEventId: "${rc.afterEventId}" does not resolve to another Event`);
    }
    if (rc?.beforeEventId && rc.beforeEventId === event.id) push("relativeChronology.beforeEventId references itself");
    if (rc?.afterEventId && rc.afterEventId === event.id) push("relativeChronology.afterEventId references itself");
  }

  return issues;
};

export const validateEventDataset = (events: QuranEvent[], surahs: SurahMeta[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();

  for (const event of events) {
    if (ids.has(event.id)) issues.push({ eventId: event.id, message: `duplicate event id "${event.id}"` });
    ids.add(event.id);
  }

  for (const event of events) {
    issues.push(...validateEvent(event, surahs, ids));
  }

  return issues;
};
