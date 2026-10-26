// Dataset integrity checks for the Peoples & Nations module (Phase 2).
// Mirrors app/utils/personsValidate.ts's pattern and checks (ayah bounds
// against real surah data, duplicate references, duplicate ids) plus the
// extra fields this module's data model actually has (communityType,
// identificationBasis, relationship source/verification values) — written
// as an independent file rather than by modifying/widening
// personsValidate.ts, to keep zero risk to Module 17's already-tested
// validator (see MODULE_BLUEPRINT.md Phase 0 foundation notes).
import type { QuranCommunity, CommunityType, IdentificationBasis } from "~/data/quranPeoples";

export interface SurahMeta {
  surahNo: number;
  totalAyah: number;
}

export interface ValidationIssue {
  communityId: string;
  message: string;
}

const VALID_COMMUNITY_TYPES: CommunityType[] = [
  "nation", "tribe", "community", "religious_community", "historical_population", "narrative_group",
];
const VALID_IDENTIFICATION_BASES: IdentificationBasis[] = [
  "quran_explicit", "quran_context", "traditional", "disputed",
];
const VALID_SOURCE_TYPES = ["quran", "authentic_hadith", "traditional_account"];
const VALID_VERIFICATION_STATUSES = ["verified", "traditional", "uncertain"];

const isValidSurah = (surahNumber: number, surahs: SurahMeta[]): SurahMeta | undefined =>
  surahs.find((s) => s.surahNo === surahNumber);

export const validateCommunity = (community: QuranCommunity, surahs: SurahMeta[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const push = (message: string) => issues.push({ communityId: community.id, message });

  if (!community.id) push("missing id");
  if (!community.name) push("missing name");
  if (!community.arabicName) push("missing arabicName");
  if (!community.shortDescription) push("missing shortDescription");
  if (!VALID_COMMUNITY_TYPES.includes(community.communityType)) {
    push(`invalid communityType "${community.communityType}"`);
  }
  if (!VALID_IDENTIFICATION_BASES.includes(community.identificationBasis)) {
    push(`invalid identificationBasis "${community.identificationBasis}"`);
  }
  if (!community.directMentions.length && !community.relatedPassages.length) {
    push("has neither directMentions nor relatedPassages — must have at least one Qur'an reference");
  }

  for (const ref of community.directMentions) {
    const surah = isValidSurah(ref.surahNumber, surahs);
    if (!surah) {
      push(`directMentions: surah ${ref.surahNumber} does not exist`);
      continue;
    }
    if (ref.ayahNumber == null) {
      push(`directMentions: surah ${ref.surahNumber} entry is missing ayahNumber`);
    } else if (ref.ayahNumber < 1 || ref.ayahNumber > surah.totalAyah) {
      push(`directMentions: ${ref.surahNumber}:${ref.ayahNumber} is out of range (surah ${ref.surahNumber} has ${surah.totalAyah} ayahs)`);
    }
  }

  const seen = new Set<string>();
  for (const ref of community.directMentions) {
    const key = `${ref.surahNumber}:${ref.ayahNumber}`;
    if (seen.has(key)) push(`directMentions: duplicate entry ${key}`);
    seen.add(key);
  }

  for (const passage of community.relatedPassages) {
    const surah = isValidSurah(passage.surahNumber, surahs);
    if (!surah) {
      push(`relatedPassages[${passage.id}]: surah ${passage.surahNumber} does not exist`);
      continue;
    }
    if (passage.ayahStart < 1 || passage.ayahEnd > surah.totalAyah) {
      push(`relatedPassages[${passage.id}]: range ${passage.ayahStart}-${passage.ayahEnd} is out of bounds (surah ${passage.surahNumber} has ${surah.totalAyah} ayahs)`);
    }
    if (passage.ayahStart > passage.ayahEnd) {
      push(`relatedPassages[${passage.id}]: ayahStart (${passage.ayahStart}) is after ayahEnd (${passage.ayahEnd})`);
    }
  }

  for (const rel of community.relationships ?? []) {
    if (!VALID_SOURCE_TYPES.includes(rel.sourceType)) {
      push(`relationships[${rel.personId}]: invalid sourceType "${rel.sourceType}"`);
    }
    if (!VALID_VERIFICATION_STATUSES.includes(rel.verificationStatus)) {
      push(`relationships[${rel.personId}]: invalid verificationStatus "${rel.verificationStatus}"`);
    }
  }

  return issues;
};

/**
 * Cross-community checks: unique ids only. Deliberately does NOT require
 * `relationships[].personId` to resolve against the Persons module dataset
 * here — that cross-module resolution is the UI layer's job (only link a
 * relationship chip that actually resolves via `getPersonById`), same
 * discipline as personsValidate.ts already applies within its own module.
 */
export const validateCommunityDataset = (communities: QuranCommunity[], surahs: SurahMeta[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();

  for (const community of communities) {
    if (ids.has(community.id)) {
      issues.push({ communityId: community.id, message: `duplicate community id "${community.id}"` });
    }
    ids.add(community.id);
    issues.push(...validateCommunity(community, surahs));
  }

  return issues;
};
