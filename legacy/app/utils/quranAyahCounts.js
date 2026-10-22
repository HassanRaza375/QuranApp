// Shared ayah-counting helpers, used by both the reading-progress tracker
// and the reading-goals module so "how far through the Quran is this
// position" is computed identically everywhere.
export const TOTAL_QURAN_AYAHS = 6236;
export const TOTAL_QURAN_PAGES = 604; // standard 15-line Madani mushaf
export const TOTAL_QURAN_JUZ = 30;

// Rough, display-only conversions — page/juz boundaries don't align exactly
// to ayah counts, but this is close enough for goal pacing (the actual
// per-page reader already handles exact pages via the real API).
export const AYAHS_PER_PAGE = TOTAL_QURAN_AYAHS / TOTAL_QURAN_PAGES;
export const AYAHS_PER_JUZ = TOTAL_QURAN_AYAHS / TOTAL_QURAN_JUZ;

// Cached across the whole app lifetime — surah.json only needs to be
// fetched once to compute cumulative ayah counts.
let prefixSumsPromise = null;
export const getAyahPrefixSums = () => {
  if (!prefixSumsPromise) {
    prefixSumsPromise = import("~/assets/data/surah.json").then(
      ({ default: list }) => {
        const sums = [0];
        for (const s of list) {
          sums.push(sums[sums.length - 1] + s.totalAyah);
        }
        return sums; // sums[n] = total ayahs across surahs 1..n
      }
    );
  }
  return prefixSumsPromise;
};

// Absolute ayah index (1-based, across the whole Quran) for a given
// surah/ayah position — the common currency goals/progress are computed in.
export const getAbsoluteAyahPosition = async (surahNo, ayahNo) => {
  const sums = await getAyahPrefixSums();
  return (sums[surahNo - 1] ?? 0) + ayahNo;
};
