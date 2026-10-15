import { useQuranApi } from "./api";

export const TafsirService = {
  getTafsirByAyah: (surahNo: number, ayahNo: number) => useQuranApi()(`/tafsir/${surahNo}_${ayahNo}.json`),
};
