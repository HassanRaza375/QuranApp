import { useQuranApi2 } from "./api";

export const JuzService = {
  getJuzByNumber: (juzNo: number) => useQuranApi2()(`/juz/${juzNo}/quran-uthmani`),
};
