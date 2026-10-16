// Juz and page lookups, derived from the generated start points (app/data/quranMeta.generated.ts). Pure.
//
// A juz or a page "starts" at a [surah, ayah]. 26 of the 30 juz start exactly where a page starts; juz 4, 7, 11 and 26
// start in the middle of a page, so that page belongs to two juz. A juz's page range therefore runs from the page that
// CONTAINS its first ayah to the page that contains the ayah before the next juz.
import { JUZ_STARTS, PAGE_STARTS, SURAH_ROWS } from "~/data/quranMeta.generated";

export type Start = readonly [number, number];

export const TOTAL_PAGES = PAGE_STARTS.length;
export const TOTAL_JUZ = JUZ_STARTS.length;
export const AYAH_COUNTS: number[] = SURAH_ROWS.map((s) => s.ayahs);

/** A position as one number, so two ayahs can be compared. */
export function absolute(surah: number, ayah: number, counts: number[] = AYAH_COUNTS): number {
  let n = ayah;
  for (let i = 0; i < surah - 1; i++) n += counts[i]!;
  return n;
}

const PAGE_ABS = PAGE_STARTS.map(([s, a]) => absolute(s, a));
const JUZ_ABS = JUZ_STARTS.map(([s, a]) => absolute(s, a));

/** Index of the last entry whose start is at or before `abs` (binary search over increasing starts). */
function lastAtOrBefore(starts: number[], abs: number): number {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid]! <= abs) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export const isAyah = (surah: number, ayah: number): boolean =>
  Number.isInteger(surah) && Number.isInteger(ayah) && surah >= 1 && surah <= 114 && ayah >= 1 && ayah <= (AYAH_COUNTS[surah - 1] ?? 0);

/** The page (1 to 604) that contains the ayah, or null when it is not a real ayah. */
export function pageOfAyah(surah: number, ayah: number): number | null {
  return isAyah(surah, ayah) ? lastAtOrBefore(PAGE_ABS, absolute(surah, ayah)) + 1 : null;
}

/** The juz (1 to 30) that contains the ayah, or null when it is not a real ayah. */
export function juzOfAyah(surah: number, ayah: number): number | null {
  return isAyah(surah, ayah) ? lastAtOrBefore(JUZ_ABS, absolute(surah, ayah)) + 1 : null;
}

export interface JuzInfo {
  n: number;
  startSurah: number;
  startAyah: number;
  firstPage: number;
  lastPage: number;
  /** true when the juz starts partway down its first page (that page is shared with the juz before it) */
  midPageStart: boolean;
}

function buildJuz(): JuzInfo[] {
  return JUZ_STARTS.map(([s, a], i) => {
    const firstPage = pageOfAyah(s, a)!;
    let lastPage = TOTAL_PAGES;
    if (i < JUZ_STARTS.length - 1) {
      const lastAyahOfJuz = JUZ_ABS[i + 1]! - 1;
      lastPage = lastAtOrBefore(PAGE_ABS, lastAyahOfJuz) + 1;
    }
    return { n: i + 1, startSurah: s, startAyah: a, firstPage, lastPage, midPageStart: PAGE_ABS[firstPage - 1] !== JUZ_ABS[i] };
  });
}
export const JUZ: JuzInfo[] = buildJuz();

/** Where a page begins, as [surah, ayah]; null when the page number is out of range. */
export const pageStart = (page: number): Start | null => (Number.isInteger(page) && page >= 1 && page <= TOTAL_PAGES ? PAGE_STARTS[page - 1]! : null);
