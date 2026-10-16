// The "last read" marker for the listing, from `quran:reading-progress:v1` (a single record: the last place read).
// That record cannot say which surahs were finished, so this is the ONLY marker drawn: no Completed, no Not started.
import { AYAH_COUNTS, isAyah, juzOfAyah, pageOfAyah } from "./quranMeta";

export interface LastRead {
  surahNo: number;
  ayahNo: number;
  total: number;
  juz: number;
  page: number;
  /** how far through the surah the place is, 0 to 100 */
  surahPct: number;
  href: string;
}

export function lastRead(raw: unknown): LastRead | null {
  const p = raw as { surahNo?: unknown; ayahNo?: unknown } | null;
  if (!p || typeof p !== "object") return null;
  const { surahNo, ayahNo } = p;
  if (typeof surahNo !== "number" || typeof ayahNo !== "number" || !isAyah(surahNo, ayahNo)) return null;
  const total = AYAH_COUNTS[surahNo - 1]!;
  return {
    surahNo,
    ayahNo,
    total,
    juz: juzOfAyah(surahNo, ayahNo)!,
    page: pageOfAyah(surahNo, ayahNo)!,
    surahPct: Math.round((ayahNo / total) * 100),
    href: `/surah/${surahNo}#ayah-${ayahNo}`,
  };
}
