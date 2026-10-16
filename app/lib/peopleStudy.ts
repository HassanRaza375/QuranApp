// The legacy study record `quran:persons-study:v1` ({ <personId>: { lastSection, passageView, lastSurahNo, lastAyahNo, updatedAt } }),
// written with the legacy pure helpers so its shape never changes: Home's resume row and the Library's Story slot read it as before.
import { clearStudyState, getStudyState, updatePassageView, updateReference, updateSection, type PassageView, type PersonStudyRecord, type PersonStudyState, type SectionId } from "@legacy/utils/personStudy";
import { getJSON, setJSON } from "./storage";

export const STUDY_KEY = "quran:persons-study:v1";

function readRecord(): PersonStudyRecord {
  const v = getJSON<unknown>(STUDY_KEY, {});
  return v && typeof v === "object" && !Array.isArray(v) ? (v as PersonStudyRecord) : {};
}
export const readStudy = (personId: string): PersonStudyState | null => getStudyState(readRecord(), personId);

export function recordSection(personId: string, section: SectionId, now = Date.now()): boolean {
  return setJSON(STUDY_KEY, updateSection(readRecord(), personId, section, now));
}
export function recordPassageView(personId: string, view: PassageView, now = Date.now()): boolean {
  return setJSON(STUDY_KEY, updatePassageView(readRecord(), personId, view, now));
}
export function recordReference(personId: string, surahNo: number, ayahNo: number, now = Date.now()): boolean {
  return setJSON(STUDY_KEY, updateReference(readRecord(), personId, surahNo, ayahNo, now));
}
export const forgetStudy = (personId: string): boolean => setJSON(STUDY_KEY, clearStudyState(readRecord(), personId));
