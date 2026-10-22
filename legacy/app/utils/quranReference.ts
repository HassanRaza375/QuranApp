// Shared Qur'an-citation primitives, reused across every content-catalog
// module of the Qur'anic Knowledge Platform (see
// quranic_knowledge_platform_phased_plan.md and MODULE_BLUEPRINT.md's
// "Qur'anic Knowledge Platform — Shared Foundation (Phase 0)" section).
//
// Originally defined inline in app/data/quranPersons.ts (Module 17 / Phase
// 1). Phase 0 deliberately left them there — "extract into a shared
// location the first time a second module needs them" — rather than
// pre-emptively generalizing with only one consumer. Phase 2 (Peoples &
// Nations) is that second consumer, so the extraction happens now.
// quranPersons.ts re-exports these unchanged so no existing import breaks.
export type QuranReference = {
  surahNumber: number;
  ayahNumber?: number;
  ayahStart?: number;
  ayahEnd?: number;
  contentId?: string;
};

export type RelatedPassage = {
  id: string;
  surahNumber: number;
  ayahStart: number;
  ayahEnd: number;
  title?: string;
  description?: string;
  storyOrder?: number;
  source: "quran";
  verificationStatus: "verified";
};

export type SourceType = "quran" | "authentic_hadith" | "traditional_account";

export type SourceReference = {
  type: SourceType;
  citation: string;
  note?: string;
};

export const asRef = (surahNumber: number, ayahNumber: number): QuranReference => ({ surahNumber, ayahNumber });

// Added in Phase 3 (Places) — originally a 4-level `IdentificationBasis` was
// defined locally in app/data/quranPeoples.ts (Phase 2). Phase 3 needs a
// 5th level ("modern_identification" — a proposed present-day geographic
// identification, distinct from a classical/traditional exegetical one) and
// is the second consumer, so it moves here per this file's own established
// pattern. Phase 2's four original values are unchanged; no existing
// QuranCommunity entry uses the new 5th value, so this is purely additive.
export type IdentificationBasis =
  | "quran_explicit" // the Qur'an itself names/designates this directly
  | "quran_context" // identity established by the Qur'an's own surrounding context, not a direct label
  | "traditional" // a later tafsir/historical identification, not stated in the Qur'an text
  | "modern_identification" // a proposed present-day/archaeological identification, distinct from classical tafsir
  | "disputed"; // scholars differ and the Qur'an does not settle the matter
