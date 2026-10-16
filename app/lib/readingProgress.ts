// Writes `quran:reading-progress:v1` in exactly the legacy shape and values, so a rollback to the legacy app reads it unchanged:
// { surahNo, ayahNo, surahName: <English meaning, e.g. "The Cow">, surahNameArabic: <long Arabic name>, totalAyah, updatedAt }.
import type { Chapter } from "./chapter";
import { setJSON } from "./storage";

export const PROGRESS_KEY = "quran:reading-progress:v1";

export function writeProgress(chapter: Chapter, ayahNo: number, now = Date.now()): boolean {
  return setJSON(PROGRESS_KEY, { surahNo: chapter.n, ayahNo, surahName: chapter.en, surahNameArabic: chapter.arLong, totalAyah: chapter.total, updatedAt: now });
}
