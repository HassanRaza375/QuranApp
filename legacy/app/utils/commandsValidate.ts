// Dataset integrity checks for the Commands & Prohibitions module
// (Phase 9). Mirrors app/utils/signsValidate.ts's pattern, adapted for
// this module's own shape: no reciprocal Event relationship to verify
// (Phase 9 keeps Commands -> Events one-directional, per approved
// decision — Events was not modified), an `audience` field, and the
// dedicated `CommandSourceBasis` vocabulary (not `IdentificationBasis`).
import type { QuranCommand, CommandType, CommandSourceBasis } from "~/data/quranCommands";
import { getPersonById } from "~/data/quranPersons";
import { getCommunityById } from "~/data/quranPeoples";
import { getPlaceById } from "~/data/quranPlaces";
import { getStoryById } from "~/data/quranStories";
import { getThemeById } from "~/data/quranThemes";
import { getDuaById } from "~/data/quranDuas";
import { getEventById } from "~/data/quranEvents";
import { getSignById } from "~/data/quranSigns";

export interface SurahMeta {
  surahNo: number;
  totalAyah: number;
}

export interface ValidationIssue {
  commandId: string;
  message: string;
}

const VALID_TYPES: CommandType[] = ["command", "prohibition"];
const VALID_SOURCE_BASES: CommandSourceBasis[] = [
  "quran_explicit", "quran_inferred", "derived_ruling", "scholarly_interpretation",
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

export const validateCommand = (command: QuranCommand, surahs: SurahMeta[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const push = (message: string) => issues.push({ commandId: command.id, message });

  if (!command.id) push("missing id");
  if (!command.title) push("missing title");
  if (!command.arabicTitle) push("missing arabicTitle");
  if (!command.description) push("missing description");
  if (!command.audience) push("missing audience");
  if (!command.passage) push("missing passage");
  if (!VALID_TYPES.includes(command.type)) push(`invalid type "${command.type}"`);
  if (!VALID_SOURCE_BASES.includes(command.sourceBasis)) push(`invalid sourceBasis "${command.sourceBasis}"`);

  if (command.passage) validatePassageBounds(command.passage, surahs, "passage", push);
  for (const p of command.parallelPassages ?? []) validatePassageBounds(p, surahs, `parallelPassages[${p.id}]`, push);

  for (const personId of command.personIds ?? []) {
    if (!getPersonById(personId)) push(`personIds: "${personId}" does not resolve to a Persons-module entry`);
  }
  for (const communityId of command.communityIds ?? []) {
    if (!getCommunityById(communityId)) push(`communityIds: "${communityId}" does not resolve to a Peoples & Nations entry`);
  }
  for (const placeId of command.placeIds ?? []) {
    if (!getPlaceById(placeId)) push(`placeIds: "${placeId}" does not resolve to a Places entry`);
  }
  for (const storyId of command.storyIds ?? []) {
    if (!getStoryById(storyId)) push(`storyIds: "${storyId}" does not resolve to a Stories entry`);
  }
  for (const themeId of command.themeIds ?? []) {
    if (!getThemeById(themeId)) push(`themeIds: "${themeId}" does not resolve to a Themes entry`);
  }
  for (const duaId of command.duaIds ?? []) {
    if (!getDuaById(duaId)) push(`duaIds: "${duaId}" does not resolve to a Duas entry`);
  }
  for (const eventId of command.eventIds ?? []) {
    if (!getEventById(eventId)) push(`eventIds: "${eventId}" does not resolve to an Events entry`);
  }
  for (const signId of command.signIds ?? []) {
    if (!getSignById(signId)) push(`signIds: "${signId}" does not resolve to a Signs & Miracles entry`);
  }

  return issues;
};

export const validateCommandDataset = (commands: QuranCommand[], surahs: SurahMeta[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();

  for (const command of commands) {
    if (ids.has(command.id)) issues.push({ commandId: command.id, message: `duplicate command id "${command.id}"` });
    ids.add(command.id);
  }

  for (const command of commands) {
    issues.push(...validateCommand(command, surahs));
  }

  return issues;
};
