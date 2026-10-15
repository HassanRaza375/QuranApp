import { useQuranApi } from "./api";

export const SurahsService = {
  getAllSurahs: () => useQuranApi()("/surah.json"),
  getOneSurah: (chapterNo: number) => useQuranApi()(`/${chapterNo}.json`),
};
