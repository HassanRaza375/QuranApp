export type SearchEditionGroup = "english" | "urdu" | "arabic" | "tafsir";

export interface SearchEdition {
  id: string;
  title: string;
  group: SearchEditionGroup;
}

// alquran.cloud's /search endpoint accepts any registered edition
// identifier — confirmed directly (not assumed) that this includes Arabic
// Quran text and Arabic tafsir editions, not just translations, despite
// the old UI only ever having offered 3 English options.
export const SEARCH_EDITIONS: SearchEdition[] = [
  { id: "en.pickthall", title: "Pickthall", group: "english" },
  { id: "en.yusufali", title: "Yusuf Ali", group: "english" },
  { id: "en.asad", title: "Muhammad Asad", group: "english" },
  { id: "ur.jalandhry", title: "Jalandhry", group: "urdu" },
  { id: "ur.maududi", title: "Maududi", group: "urdu" },
  { id: "quran-simple", title: "Arabic Quran Text", group: "arabic" },
  { id: "ar.muyassar", title: "Tafsir Muyassar", group: "tafsir" },
  { id: "ar.jalalayn", title: "Tafsir Al-Jalalayn", group: "tafsir" },
  { id: "ar.qurtubi", title: "Tafsir Al-Qurtubi", group: "tafsir" },
  { id: "ar.baghawi", title: "Tafsir Al-Baghawi", group: "tafsir" },
];

export interface SearchResult {
  id: string;
  surahNo: number;
  surahNameEnglish: string;
  surahNameArabic: string;
  ayahNo: number;
  text: string;
  editionName: string;
  to: string;
}

const MAX_RESULTS = 60;

/**
 * Wraps alquran.cloud's search API behind a normalized shape so no
 * provider-specific field names (`ayah.surah.englishName`, etc.) leak into
 * page/component code.
 */
export const useSearch = () => {
  const results = useState<SearchResult[]>("search-results", () => []);
  const totalCount = useState<number>("search-total-count", () => 0);
  const pending = useState<boolean>("search-pending", () => false);
  const error = useState<string | null>("search-error", () => null);

  const cache = new Map<string, { results: SearchResult[]; totalCount: number }>();

  const search = async (query: string, editionId: string, surahScope: number | "all" = "all") => {
    error.value = null;
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      results.value = [];
      totalCount.value = 0;
      return;
    }

    const key = `${trimmed}|${surahScope}|${editionId}`;
    const cached = cache.get(key);
    if (cached) {
      results.value = cached.results;
      totalCount.value = cached.totalCount;
      return;
    }

    pending.value = true;
    try {
      const res: any = await $fetch(
        `https://api.alquran.cloud/v1/search/${encodeURIComponent(trimmed)}/${surahScope}/${editionId}`
      );

      const matches = res?.data?.matches || [];
      const mapped: SearchResult[] = matches.slice(0, MAX_RESULTS).map((m: any) => ({
        id: `${m.surah.number}:${m.numberInSurah}:${m.edition.identifier}`,
        surahNo: m.surah.number,
        surahNameEnglish: m.surah.englishName,
        surahNameArabic: m.surah.name,
        ayahNo: m.numberInSurah,
        text: m.text,
        editionName: m.edition.englishName || m.edition.name,
        to: `/surah/${m.surah.number}#ayah-${m.numberInSurah}`,
      }));

      totalCount.value = res?.data?.count || 0;
      results.value = mapped;
      cache.set(key, { results: mapped, totalCount: totalCount.value });
    } catch (e: any) {
      // This API returns a 404 for "no matches", not a real failure.
      if (e?.response?.status === 404 || e?.statusCode === 404) {
        results.value = [];
        totalCount.value = 0;
      } else {
        error.value = "Search failed. Please try again.";
        results.value = [];
        totalCount.value = 0;
      }
    } finally {
      pending.value = false;
    }
  };

  return { results, totalCount, pending, error, search };
};
