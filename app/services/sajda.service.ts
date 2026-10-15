import { useQuranApi2 } from "./api";

export const SajdaService = {
  getAllSajdas: () => useQuranApi2()("/sajda/quran-uthmani"),
};
