import { useQuranApi } from "./api";

export const ChaptersService = {
  getChapterByNumber: (chNo: number) => useQuranApi()(`/${chNo}.json`),
};
