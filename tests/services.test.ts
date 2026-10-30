// The copied services build the same URLs as the legacy ones. This also catches a missing import: Nuxt does not
// auto-import from app/services, so a service that forgets to import `useQuranApi` fails with a ReferenceError
// that the Home page's error handling would otherwise hide.
import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  const g = globalThis as Record<string, unknown>;
  g.useRuntimeConfig = () => ({ public: { quranApiBase: "https://q1.example/api", quranApiBase2: "https://q2.example/v1" } });
  g.$fetch = { create: (o: { baseURL: string }) => (path: string) => `${o.baseURL}${path}` };
});

describe("services", () => {
  it("verse, chapters, surahs, tafsir use the first API", async () => {
    const { VerseService } = await import("../app/services/verse.service");
    const { ChaptersService } = await import("../app/services/chapters.service");
    const { SurahsService } = await import("../app/services/surahs.service");
    const { TafsirService } = await import("../app/services/tafsir.service");
    expect(VerseService.getVerseByNumber(30, 7)).toBe("https://q1.example/api/30/7.json");
    expect(ChaptersService.getChapterByNumber(2)).toBe("https://q1.example/api/2.json");
    expect(SurahsService.getAllSurahs()).toBe("https://q1.example/api/surah.json");
    expect(SurahsService.getOneSurah(18)).toBe("https://q1.example/api/18.json");
    expect(TafsirService.getTafsirByAyah(2, 255)).toBe("https://q1.example/api/tafsir/2_255.json");
  });

  it("juz, sajda and page use the second API, and the page call is relative (the legacy copy used an http:// URL)", async () => {
    const { JuzService } = await import("../app/services/juz.service");
    const { SajdaService } = await import("../app/services/sajda.service");
    const { PageService } = await import("../app/services/page.service");
    expect(JuzService.getJuzByNumber(30)).toBe("https://q2.example/v1/juz/30/quran-uthmani");
    expect(SajdaService.getAllSajdas()).toBe("https://q2.example/v1/sajda/quran-uthmani");
    expect(PageService.getPageByNumber(604)).toBe("https://q2.example/v1/page/604/quran-uthmani");
  });

  it("search uses the second API, encodes the text, and passes the scope and edition through (Phase 10)", async () => {
    const { SearchService } = await import("../app/services/search.service");
    expect(SearchService.search({ text: "mercy", scope: "all", edition: "en.pickthall" })).toBe("https://q2.example/v1/search/mercy/all/en.pickthall");
    expect(SearchService.search({ text: "a b/c?", scope: 2, edition: "ur.jalandhry" })).toBe("https://q2.example/v1/search/a%20b%2Fc%3F/2/ur.jalandhry");
  });
});
