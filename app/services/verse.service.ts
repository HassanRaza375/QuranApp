export const VerseService = {
  getVerseByNumber: (surahNo: number, ayahNo: number) => useQuranApi()(`/${surahNo}/${ayahNo}.json`),
};
