// Dataset integrity checks for the Signs & Miracles module (Phase 8).
// Mirrors app/utils/eventsValidate.ts's pattern, extended with the one
// check specific to this module's own architecture: every Sign→Event
// link (`eventIds`) must be reciprocated by that Event's own `signIds`
// (and vice versa) — the relationship this phase deliberately kept
// bidirectional-but-simple rather than building a generic graph.
import type { QuranSign, SignClassification, OccurrenceType } from "~/data/quranSigns";
import type { IdentificationBasis } from "~/utils/quranReference";
import { getPersonById } from "~/data/quranPersons";
import { getCommunityById } from "~/data/quranPeoples";
import { getPlaceById } from "~/data/quranPlaces";
import { getStoryById } from "~/data/quranStories";
import { getThemeById } from "~/data/quranThemes";
import { getDuaById } from "~/data/quranDuas";
import { getEventById, type QuranEvent } from "~/data/quranEvents";

export interface SurahMeta {
  surahNo: number;
  totalAyah: number;
}

export interface ValidationIssue {
  signId: string;
  message: string;
}

const VALID_CLASSIFICATIONS: SignClassification[] = [
  "sign", "miracle", "divine_aid", "punishment_sign", "extraordinary_event",
];
const VALID_OCCURRENCE_TYPES: OccurrenceType[] = ["bounded", "recurring"];
const VALID_SOURCE_BASES: IdentificationBasis[] = [
  "quran_explicit", "quran_context", "traditional", "modern_identification", "disputed",
];

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

export const validateSign = (sign: QuranSign, surahs: SurahMeta[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const push = (message: string) => issues.push({ signId: sign.id, message });

  if (!sign.id) push("missing id");
  if (!sign.title) push("missing title");
  if (!sign.arabicTitle) push("missing arabicTitle");
  if (!sign.description) push("missing description");
  if (!sign.passage) push("missing passage");
  if (!VALID_CLASSIFICATIONS.includes(sign.classification)) push(`invalid classification "${sign.classification}"`);
  if (!VALID_OCCURRENCE_TYPES.includes(sign.occurrenceType)) push(`invalid occurrenceType "${sign.occurrenceType}"`);
  if (!VALID_SOURCE_BASES.includes(sign.sourceBasis)) push(`invalid sourceBasis "${sign.sourceBasis}"`);

  if (sign.passage) validatePassageBounds(sign.passage, surahs, "passage", push);
  for (const p of sign.parallelPassages ?? []) validatePassageBounds(p, surahs, `parallelPassages[${p.id}]`, push);

  for (const personId of sign.personIds ?? []) {
    if (!getPersonById(personId)) push(`personIds: "${personId}" does not resolve to a Persons-module entry`);
  }
  for (const communityId of sign.communityIds ?? []) {
    if (!getCommunityById(communityId)) push(`communityIds: "${communityId}" does not resolve to a Peoples & Nations entry`);
  }
  for (const placeId of sign.placeIds ?? []) {
    if (!getPlaceById(placeId)) push(`placeIds: "${placeId}" does not resolve to a Places entry`);
  }
  for (const storyId of sign.storyIds ?? []) {
    if (!getStoryById(storyId)) push(`storyIds: "${storyId}" does not resolve to a Stories entry`);
  }
  for (const themeId of sign.themeIds ?? []) {
    if (!getThemeById(themeId)) push(`themeIds: "${themeId}" does not resolve to a Themes entry`);
  }
  for (const duaId of sign.duaIds ?? []) {
    if (!getDuaById(duaId)) push(`duaIds: "${duaId}" does not resolve to a Duas entry`);
  }

  for (const eventId of sign.eventIds ?? []) {
    const event = getEventById(eventId);
    if (!event) {
      push(`eventIds: "${eventId}" does not resolve to an Events entry`);
      continue;
    }
    if (!event.signIds?.includes(sign.id)) {
      push(`eventIds: "${eventId}" does not reciprocate with signIds: "${sign.id}" on that Event`);
    }
  }

  return issues;
};

export const validateSignDataset = (signs: QuranSign[], surahs: SurahMeta[], events?: QuranEvent[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();

  for (const sign of signs) {
    if (ids.has(sign.id)) issues.push({ signId: sign.id, message: `duplicate sign id "${sign.id}"` });
    ids.add(sign.id);
  }

  for (const sign of signs) {
    issues.push(...validateSign(sign, surahs));
  }

  // Reverse direction: every Event.signIds entry must resolve to a real
  // Sign and that Sign must reciprocate with the Event in its own eventIds.
  if (events) {
    for (const event of events) {
      for (const signId of event.signIds ?? []) {
        const sign = signs.find((s) => s.id === signId);
        if (!sign) {
          issues.push({ signId: signId, message: `Event "${event.id}" references signIds: "${signId}", which does not resolve to a Signs entry` });
          continue;
        }
        if (!sign.eventIds?.includes(event.id)) {
          issues.push({ signId: sign.id, message: `Event "${event.id}" lists this sign in signIds, but this sign's own eventIds does not list "${event.id}" back` });
        }
      }
    }
  }

  return issues;
};
