// Pure "resume study" state logic for the Prophets & Qur'anic Persons feature
// (prophets-quran-feature.md §17 "Saved person state"). Kept dependency-free
// (no Nuxt/Vue) so the update logic is unit-testable in isolation — wrapped
// with useState/$storage persistence in app/composables/usePersonStudy.ts.
export type SectionId = "overview" | "key-lessons" | "direct-mentions" | "related-passages" | "family" | "notes";

export const SECTION_LABELS: Record<SectionId, string> = {
  overview: "Overview",
  "key-lessons": "Key Lessons",
  "direct-mentions": "Direct Mentions",
  "related-passages": "Related Passages",
  family: "Family & Relationships",
  notes: "Scholarly & Traditional Notes",
};

export type PassageView = "surah" | "story";

export interface PersonStudyState {
  personId: string;
  lastSection: SectionId;
  passageView: PassageView;
  lastSurahNo?: number;
  lastAyahNo?: number;
  updatedAt: number;
}

export type PersonStudyRecord = Record<string, PersonStudyState>;

const emptyState = (personId: string, now: number): PersonStudyState => ({
  personId,
  lastSection: "overview",
  passageView: "surah",
  updatedAt: now,
});

export const getStudyState = (record: PersonStudyRecord, personId: string): PersonStudyState | null =>
  record[personId] ?? null;

export const updateSection = (
  record: PersonStudyRecord,
  personId: string,
  section: SectionId,
  now: number
): PersonStudyRecord => ({
  ...record,
  [personId]: { ...(record[personId] ?? emptyState(personId, now)), lastSection: section, updatedAt: now },
});

export const updatePassageView = (
  record: PersonStudyRecord,
  personId: string,
  view: PassageView,
  now: number
): PersonStudyRecord => ({
  ...record,
  [personId]: { ...(record[personId] ?? emptyState(personId, now)), passageView: view, updatedAt: now },
});

export const updateReference = (
  record: PersonStudyRecord,
  personId: string,
  surahNo: number,
  ayahNo: number,
  now: number
): PersonStudyRecord => ({
  ...record,
  [personId]: {
    ...(record[personId] ?? emptyState(personId, now)),
    lastSurahNo: surahNo,
    lastAyahNo: ayahNo,
    updatedAt: now,
  },
});

export const clearStudyState = (record: PersonStudyRecord, personId: string): PersonStudyRecord => {
  if (!(personId in record)) return record;
  const { [personId]: _removed, ...rest } = record;
  return rest;
};

/** Finds the study record with the most recent `updatedAt`, or null if there
 * are none. Ignores any entry whose `updatedAt` is missing or not a finite
 * number (e.g. hand-edited or corrupted storage) rather than letting it win
 * a comparison via `undefined`/`NaN`, which would otherwise silently produce
 * the wrong "most recent" person. Deliberately dataset-agnostic — whether
 * the person that record points to still exists is the caller's concern
 * (this file has no dependency on the person dataset by design). */
export const getMostRecentlyStudied = (record: PersonStudyRecord): PersonStudyState | null => {
  let best: PersonStudyState | null = null;
  for (const state of Object.values(record)) {
    if (!state || typeof state.updatedAt !== "number" || !Number.isFinite(state.updatedAt)) continue;
    if (!best || state.updatedAt > best.updatedAt) best = state;
  }
  return best;
};
