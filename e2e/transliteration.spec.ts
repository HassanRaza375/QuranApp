// The transliteration line in the Surah reader and the Page reader (and so the Juz tab, which opens the Surah reader), in a real browser on the production
// build. Surahs 1 and 114 answer with REAL recorded transliteration (tests/fixtures); every other surah gets obviously fake text. The Qur'an text is the
// existing SYNTHETIC mock. Every unmocked request to a real API fails the test.
import { expect, test, type Page } from "@playwright/test";
import { pageSegments, pageSurahNumbers } from "../app/lib/pageReader";
import { JUZ } from "../app/lib/quranMeta";
import { forbidRealApis, freezeClock, mockQuranText, mockTransliterationSurah, readStorage, realTransliteration, seed, type QuranTextMock, type TransliterationSurahMock } from "./mocks";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });
let leaks: string[] = [];
let api: QuranTextMock;
let tl: TransliterationSurahMock;
test.beforeEach(async ({ context }) => {
  leaks = await forbidRealApis(context);
  await freezeClock(context);
  api = await mockQuranText(context);
  tl = await mockTransliterationSurah(context);
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

const real = (n: number): string[] => realTransliteration(n as 1 | 114);
const prefs = async (page: Page) => {
  const v = (await readStorage(page))["quran:reader-prefs:v1"];
  return v ? (JSON.parse(v) as Record<string, unknown>) : null;
};
const noScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const openSurah = async (page: Page, n: number, hash = "") => {
  await page.goto(`/surah/${n}${hash}`);
  await expect(page.getByTestId("reader-title")).toBeVisible();
};
const toggle = (page: Page) => page.getByTestId("translit-toggle");
const twoSurahPage = Array.from({ length: 604 }, (_, i) => i + 1).find((p) => pageSurahNumbers(p).length === 2 && !pageSegments(p)![0]!.starts && pageSegments(p)![1]!.starts)!;

test.describe("Surah reader", () => {
  test("off by default: no line and no request; on: one line under each Arabic ayah, in order, LTR; the choice is saved and survives a reload", async ({ page }) => {
    await openSurah(page, 1);
    await expect(toggle(page)).toHaveAttribute("aria-checked", "false");
    await expect(page.getByTestId("ayah-translit")).toHaveCount(0);
    expect(tl.calls).toEqual([]);
    expect(await prefs(page)).toBeNull();

    await toggle(page).click();
    const lines = real(1);
    await expect(page.getByTestId("ayah-translit")).toHaveCount(7);
    for (let i = 0; i < 7; i++) await expect(page.getByTestId(`ayah-${i + 1}`).getByTestId("ayah-translit")).toHaveText(lines[i]!);
    expect(tl.calls).toEqual([1]);
    expect(await prefs(page)).toEqual({ transliteration: true });

    const row = page.getByTestId("ayah-1");
    const ar = await row.getByTestId("ayah-arabic").boundingBox();
    const tr = await row.getByTestId("ayah-translit").boundingBox();
    expect(tr!.y).toBeGreaterThan(ar!.y + ar!.height - 1); // under the Arabic
    const trans = await row.getByTestId("ayah-translation").boundingBox();
    expect(trans!.y).toBeGreaterThan(tr!.y); // and above the translation
    await expect(row.getByTestId("ayah-translit")).toHaveAttribute("dir", "ltr");
    await expect(row.getByTestId("ayah-translit")).toHaveAttribute("lang", "ar-Latn");
    expect(await row.getByTestId("ayah-translit").evaluate((el) => getComputedStyle(el).letterSpacing)).toMatch(/^(0px|normal)$/);

    await page.reload();
    await expect(page.getByTestId("ayah-translit")).toHaveCount(7);
    await expect(toggle(page)).toHaveAttribute("aria-checked", "true");

    await toggle(page).click();
    await expect(page.getByTestId("ayah-translit")).toHaveCount(0);
    expect(await prefs(page)).toEqual({ transliteration: null });
  });

  test("surah 2 (286 ayahs): one request, every ayah has its line", async ({ page }) => {
    await seed(page.context(), { "quran:reader-prefs:v1": JSON.stringify({ transliteration: true }) });
    await openSurah(page, 2);
    await expect(page.getByTestId("ayah-286").getByTestId("ayah-translit")).toHaveText("Test transliteration 2:286");
    await expect(page.getByTestId("ayah-translit")).toHaveCount(286);
    expect(tl.calls).toEqual([2]);
  });

  test("turning it on keeps the translation setting (Off stays Off) and the two do not disturb each other", async ({ page }) => {
    await seed(page.context(), { "quran:reader-prefs:v1": JSON.stringify({ translation: "off" }) });
    await openSurah(page, 114);
    await expect(page.getByTestId("ayah-translation")).toHaveCount(0);
    await toggle(page).click();
    await expect(page.getByTestId("ayah-translit")).toHaveCount(6);
    expect(await prefs(page)).toEqual({ translation: "off", transliteration: true });
  });

  test("a second visit reads the surah from the device: no new request, and it works with the service gone", async ({ page }) => {
    await openSurah(page, 114);
    await toggle(page).click();
    await expect(page.getByTestId("ayah-translit")).toHaveCount(6);
    expect(tl.calls).toEqual([114]);
    tl.mode = "network"; // from now on the transliteration service is unreachable (a reload drops the in-memory copy, so only the device's copy can answer)
    api.mode = "network";
    await page.reload();
    await expect(page.getByTestId("ayah-translit")).toHaveCount(6);
    for (let i = 0; i < 6; i++) await expect(page.getByTestId(`ayah-${i + 1}`).getByTestId("ayah-translit")).toHaveText(real(114)[i]!);
    await expect(page.getByTestId("translit-unavailable")).toHaveCount(0);
    expect(tl.calls).toEqual([114]);
  });

  test("never loaded and the service is down: the text still shows, the control says so, Try again works", async ({ page }) => {
    tl.mode = "http500";
    await openSurah(page, 114);
    await toggle(page).click();
    await expect(page.getByTestId("translit-unavailable")).toBeVisible();
    await expect(page.getByTestId("ayah-arabic")).toHaveCount(6);
    await expect(page.getByTestId("ayah-translit")).toHaveCount(0);
    tl.mode = "ok";
    await page.getByTestId("translit-retry").click();
    await expect(page.getByTestId("ayah-translit")).toHaveCount(6);
    await expect(page.getByTestId("translit-unavailable")).toHaveCount(0);
  });

  test("the Juz tab's reader (a juz opens at its first ayah) has it too", async ({ page }) => {
    await seed(page.context(), { "quran:reader-prefs:v1": JSON.stringify({ transliteration: true }) });
    const j = JUZ[29]!; // juz 30
    await page.goto(`/juz/30`);
    await expect(page).toHaveURL(new RegExp(`/surah/${j.startSurah}`));
    await expect(page.getByTestId(`ayah-${j.startAyah}`).getByTestId("ayah-translit")).toBeVisible();
  });

  test("phone width and dark: no sideways scroll, the toggle is a 44px target, the line is readable", async ({ page }) => {
    await seed(page.context(), { themeMode: "dark", "quran:reader-prefs:v1": JSON.stringify({ transliteration: true }) });
    await page.setViewportSize({ width: 375, height: 800 });
    await openSurah(page, 1);
    await expect(page.getByTestId("ayah-translit")).toHaveCount(7);
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(await noScroll(page)).toBe(true);
    const box = await page.getByTestId("translit-toggle").locator("xpath=ancestor::label").boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    const color = await page.getByTestId("ayah-translit").first().evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe(await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor));
  });
});

test.describe("Page reader", () => {
  test("a page that crosses two surahs shows each ayah's own line, looked up by surah and ayah", async ({ page }) => {
    await page.goto(`/per-page-read?page=${twoSurahPage}`);
    await expect(page.getByTestId("page-frame")).toBeVisible();
    await expect(page.getByTestId("ayah-translit")).toHaveCount(0); // off: the page flows as before
    await expect(page.getByTestId("page-text")).toHaveCount(2);
    await toggle(page).click();
    const segs = pageSegments(twoSurahPage)!;
    const total = segs.reduce((n, g) => n + (g.to - g.from + 1), 0);
    await expect(page.getByTestId("ayah-translit")).toHaveCount(total);
    for (const g of segs) {
      const seg = page.locator(`[data-testid="page-segment"][data-surah="${g.surah}"]`);
      await expect(seg.getByTestId("ayah-translit").first()).toHaveText(g.surah === 114 || g.surah === 1 ? real(g.surah)[g.from - 1]! : `Test transliteration ${g.surah}:${g.from}`);
      await expect(seg.getByTestId("ayah-translit").last()).toHaveText(g.surah === 114 || g.surah === 1 ? real(g.surah)[g.to - 1]! : `Test transliteration ${g.surah}:${g.to}`);
    }
    expect([...new Set(tl.calls)].sort((a, b) => a - b)).toEqual(pageSurahNumbers(twoSurahPage).sort((a, b) => a - b));
    expect(tl.calls.length).toBe(pageSurahNumbers(twoSurahPage).length); // one request per surah, not per ayah
    await expect(page.getByTestId("verse-mark")).toHaveCount(total); // markers kept in the ayah-by-ayah layout
    expect(await prefs(page)).toEqual({ transliteration: true });
  });

  test("the choice is shared with the Surah reader, and turning it off restores the flowing page", async ({ page }) => {
    await page.goto("/per-page-read?page=604");
    await expect(page.getByTestId("page-frame")).toBeVisible();
    await toggle(page).click();
    await expect(page.getByTestId("ayah-translit").first()).toBeVisible();
    await page.goto("/surah/114");
    await expect(page.getByTestId("ayah-translit")).toHaveCount(6);
    await page.goto("/per-page-read?page=604");
    await expect(toggle(page)).toHaveAttribute("aria-checked", "true");
    await toggle(page).click();
    await expect(page.getByTestId("ayah-translit")).toHaveCount(0);
    await expect(page.getByTestId("page-text").first()).toBeVisible();
  });

  test("phone width: no sideways scroll with the line on", async ({ page }) => {
    await seed(page.context(), { "quran:reader-prefs:v1": JSON.stringify({ transliteration: true }) });
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`/per-page-read?page=${twoSurahPage}`);
    await expect(page.getByTestId("ayah-translit").first()).toBeVisible();
    expect(await noScroll(page)).toBe(true);
  });

  test("the service is down: the page still reads (flowing), with the control's message", async ({ page }) => {
    tl.mode = "http500";
    await page.goto("/per-page-read?page=604");
    await expect(page.getByTestId("page-frame")).toBeVisible();
    await toggle(page).click();
    await expect(page.getByTestId("translit-unavailable")).toBeVisible();
    await expect(page.getByTestId("page-text").first()).toBeVisible();
    await expect(page.getByTestId("ayah-translit")).toHaveCount(0);
  });
});
