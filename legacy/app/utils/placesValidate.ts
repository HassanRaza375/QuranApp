// Dataset integrity checks for the Places module (Phase 3). Mirrors
// app/utils/peoplesValidate.ts's pattern and rationale (independent file,
// not a refactor of existing validators — zero risk to Phase 1/2's already
// -tested code).
import type { QuranPlace, PlaceType } from "~/data/quranPlaces";
import type { IdentificationBasis } from "~/utils/quranReference";

export interface SurahMeta {
  surahNo: number;
  totalAyah: number;
}

export interface ValidationIssue {
  placeId: string;
  message: string;
}

const VALID_PLACE_TYPES: PlaceType[] = [
  "city", "settlement", "region", "mountain", "valley", "land_territory",
  "body_of_water", "sanctuary_site", "battlefield", "other",
];
const VALID_IDENTIFICATION_BASES: IdentificationBasis[] = [
  "quran_explicit", "quran_context", "traditional", "modern_identification", "disputed",
];
const VALID_SOURCE_TYPES = ["quran", "authentic_hadith", "traditional_account"];
const VALID_VERIFICATION_STATUSES = ["verified", "traditional", "uncertain"];

const isValidSurah = (surahNumber: number, surahs: SurahMeta[]): SurahMeta | undefined =>
  surahs.find((s) => s.surahNo === surahNumber);

export const validatePlace = (place: QuranPlace, surahs: SurahMeta[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const push = (message: string) => issues.push({ placeId: place.id, message });

  if (!place.id) push("missing id");
  if (!place.name) push("missing name");
  if (!place.arabicName) push("missing arabicName");
  if (!place.shortDescription) push("missing shortDescription");
  if (!VALID_PLACE_TYPES.includes(place.placeType)) push(`invalid placeType "${place.placeType}"`);
  if (!VALID_IDENTIFICATION_BASES.includes(place.identificationBasis)) {
    push(`invalid identificationBasis "${place.identificationBasis}"`);
  }
  if (!place.directMentions.length && !place.relatedPassages.length) {
    push("has neither directMentions nor relatedPassages — must have at least one Qur'an reference");
  }

  for (const ref of place.directMentions) {
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
  for (const ref of place.directMentions) {
    const key = `${ref.surahNumber}:${ref.ayahNumber}`;
    if (seen.has(key)) push(`directMentions: duplicate entry ${key}`);
    seen.add(key);
  }

  for (const passage of place.relatedPassages) {
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

  for (const rel of place.relationships ?? []) {
    if (!VALID_SOURCE_TYPES.includes(rel.sourceType)) push(`relationships[${rel.personId}]: invalid sourceType "${rel.sourceType}"`);
    if (!VALID_VERIFICATION_STATUSES.includes(rel.verificationStatus)) {
      push(`relationships[${rel.personId}]: invalid verificationStatus "${rel.verificationStatus}"`);
    }
  }

  return issues;
};

export const validatePlaceDataset = (places: QuranPlace[], surahs: SurahMeta[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();

  for (const place of places) {
    if (ids.has(place.id)) issues.push({ placeId: place.id, message: `duplicate place id "${place.id}"` });
    ids.add(place.id);
    issues.push(...validatePlace(place, surahs));
  }

  return issues;
};
