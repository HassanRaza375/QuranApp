// Phase 9B: the verses of prostration in a real browser, on the production build. The 15 references are bundled; the Arabic is the SYNTHETIC
// mock ("TEST ARABIC 7:206"). Every unmocked request to a real API (including the service's own /sajda endpoint) fails the test; the clock is
// fixed. See docs/phases/phase-09b-asma-sajda-tasbeeh.md.
import { expect, test, type Page } from "@playwright/test";
import { sajdaRows } from "../app/lib/sajda";
import { forbidRealApis, freezeClock, idbNames, mockQuranText, mockVerse, readStorage, seed, type VerseMock } from "./mocks";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });
let leaks: string[] = [];
let verse: VerseMock;
test.beforeEach(async ({ context }) => {
  leaks = await forbidRealApis(context);
  await freezeClock(context);
  await mockQuranText(context);
  verse = await mockVerse(context);
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

const ROWS = sajdaRows();
const toast = (page: Page, text: string) => page.locator("[data-sonner-toast]").filter({ hasText: text });
const rows = (page: Page) => page.getByTestId("sajda-row");
const row = (page: Page, s: number, a: number) => page.locator(`[data-testid="sajda-row"][data-surah="${s}"][data-ayah="${a}"]`);
async function open(page: Page) {
  await page.goto("/sajda");
  await expect(page.getByRole("heading", { level: 1, name: "Verses of prostration" })).toBeVisible();
  await expect(rows(page).first()).toBeVisible();
}
const bookmarks = async (page: Page) => JSON.parse((await readStorage(page))["quran:bookmarks:v1"] ?? "[]") as string[];
const push = (page: Page, to: string) => page.evaluate((p) => (document.querySelector("#__nuxt") as unknown as { __vue_app__: { config: { globalProperties: { $router: { push(p: string): void } } } } }).__vue_app__.config.globalProperties.$router.push(p), to);
const noScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test.describe("the list", () => {
  test("15 verses in Qur'an order with the surah, ayah, juz and page from the data; the Arabic from the reader's source; no ruling words; no request to the service's own list", async ({ page }) => {
    await open(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(rows(page)).toHaveCount(15);
    await expect(page.getByTestId("sajda-count")).toHaveText("15 verses, as listed by this app’s data.");
    await expect(page.getByTestId("sajda-ref")).toHaveText(ROWS.map((r) => `${r.surahName} ${r.surah}:${r.ayah}`));
    await expect(page.getByTestId("sajda-where")).toHaveText(ROWS.map((r) => `Juz ${r.juz} · Page ${r.page}`));
    await expect(row(page, 32, 15).getByTestId("sajda-text")).toHaveText("TEST ARABIC 32:15");
    await expect(row(page, 7, 206).getByTestId("sajda-text")).toHaveAttribute("lang", "ar");
    await expect(row(page, 7, 206).getByTestId("sajda-text")).toHaveAttribute("dir", "rtl");
    const body = (await page.getByTestId("sajda-page").textContent())!;
    expect(body).not.toMatch(/obligatory|recommended|wajib|hanafi|ja.?fari|marja/i);
    await expect(page.getByTestId("sajda-text")).toHaveCount(15);
    expect(verse.calls.sort()).toEqual(ROWS.map((r) => `${r.surah}:${r.ayah}`).sort());
    expect(await idbNames(page)).not.toContain("quran-app-db");
  });

  test("each row opens the surah reader at its ayah", async ({ page }) => {
    await open(page);
    await expect(row(page, 53, 62).getByTestId("sajda-open")).toHaveAttribute("href", "/surah/53#ayah-62");
    await row(page, 53, 62).getByTestId("sajda-open").click();
    await expect(page.getByTestId("reader-title")).toBeVisible();
    await expect(page).toHaveURL(/surah\/53#ayah-62$/);
  });
});

test.describe("Save", () => {
  test("the star writes the legacy sajda:<surah>:<ayah> key and its added-at, with Undo, and it reads back", async ({ page }) => {
    await open(page);
    await row(page, 32, 15).getByTestId("sajda-star").click();
    await expect(row(page, 32, 15).getByTestId("sajda-star")).toHaveAttribute("aria-pressed", "true");
    expect(await bookmarks(page)).toEqual(["sajda:32:15"]);
    expect(Object.keys(JSON.parse((await readStorage(page))["quran:bookmarks:added-at:v1"]!))).toEqual(["sajda:32:15"]);
    await toast(page, "Saved").getByRole("button", { name: "Undo" }).click();
    expect(await bookmarks(page)).toEqual([]);
    await row(page, 32, 15).getByTestId("sajda-star").click();
    await row(page, 7, 206).getByTestId("sajda-star").click();
    await row(page, 7, 206).getByTestId("sajda-star").click();
    await toast(page, "Removed").getByRole("button", { name: "Undo" }).click();
    expect((await bookmarks(page)).sort()).toEqual(["sajda:32:15", "sajda:7:206"]);
    await page.reload();
    await expect(row(page, 32, 15).getByTestId("sajda-star")).toHaveAttribute("aria-pressed", "true");
  });

  test("a saved sajda verse shows in the Library under Sajda verses and opens the reader at that ayah", async ({ page, context }) => {
    await seed(context, { "quran:bookmarks:v1": JSON.stringify(["sajda:7:206", "surah:18"]) });
    await page.goto("/bookmarks");
    await expect(page.getByRole("heading", { level: 1, name: "Library" })).toBeVisible();
    await page.getByRole("button", { name: /^Show/ }).click();
    await page.getByRole("menuitemradio", { name: "Sajda verses", exact: true }).click();
    await expect(page.getByTestId("library-row")).toHaveCount(1);
    await expect(page.locator('[data-testid="library-row"][data-key="sajda:7:206"]').getByTestId("row-open")).toHaveAttribute("href", "/surah/7#ayah-206");
  });
});

test.describe("the text on the device", () => {
  test("a failed request shows a message and Try again loads it; the references stay", async ({ page }) => {
    verse.mode = "http500";
    await open(page);
    await expect(row(page, 7, 206).getByTestId("sajda-failed")).toContainText("Couldn’t load the text.");
    await expect(row(page, 7, 206).getByTestId("sajda-ref")).toBeVisible();
    verse.mode = "ok";
    await row(page, 7, 206).getByTestId("sajda-retry").click();
    await expect(row(page, 7, 206).getByTestId("sajda-text")).toHaveText("TEST ARABIC 7:206");
  });

  test("offline with nothing saved: the references are there and the text says to connect once (bundled list, level A)", async ({ page, context }) => {
    verse.mode = "network"; // the text is never saved on this device in this test
    await open(page); // the page's code is loaded now (a service worker would hold it in the real app)
    await push(page, "/asma-ul-husna");
    await expect(page.getByTestId("name-card").first()).toBeVisible();
    await context.setOffline(true);
    await push(page, "/sajda"); // in-app navigation (the page itself is bundled, so it needs no network)
    await expect(rows(page)).toHaveCount(15);
    await expect(row(page, 7, 206).getByTestId("sajda-none")).toHaveText("Connect once to see the text.");
    await expect(row(page, 96, 19).getByTestId("sajda-ref")).toHaveText("Al-Alaq 96:19");
  });

  test("text that was loaded once is read from the device after a reload while the service refuses", async ({ page }) => {
    await open(page);
    await expect(row(page, 41, 38).getByTestId("sajda-text")).toBeVisible();
    verse.mode = "network";
    await page.reload();
    await expect(row(page, 41, 38).getByTestId("sajda-text")).toHaveText("TEST ARABIC 41:38");
  });
});

test.describe("the sign on the Per-page reader", () => {
  test("every one of the 15 verses carries the sign on its own page, and only those ayahs do", async ({ page }) => {
    test.setTimeout(120_000);
    const byPage = new Map<number, typeof ROWS>();
    for (const r of ROWS) byPage.set(r.page, [...(byPage.get(r.page) ?? []), r]);
    for (const [p, list] of byPage) {
      await page.goto(`/per-page-read?page=${p}`);
      await expect(page.getByTestId("page-frame")).toBeVisible();
      const signs = page.getByTestId("sajda-sign");
      await expect(signs, `page ${p}`).toHaveCount(list.length);
      for (const r of list) {
        const s = page.locator(`[data-testid="sajda-sign"][data-surah="${r.surah}"][data-ayah="${r.ayah}"]`);
        await expect(s, `${r.surah}:${r.ayah}`).toHaveCount(1);
        await expect(s).toHaveAttribute("aria-label", "Prostration verse");
        // the sign follows its own ayah's marker
        await expect(s.locator("xpath=preceding-sibling::*[1]")).toHaveAttribute("data-ayah", String(r.ayah));
      }
    }
  });

  test("pages without a verse of prostration show no sign (page 1, 3 and 604)", async ({ page }) => {
    for (const p of [1, 3, 604]) {
      await page.goto(`/per-page-read?page=${p}`);
      await expect(page.getByTestId("page-frame")).toBeVisible();
      await expect(page.getByTestId("sajda-sign")).toHaveCount(0);
    }
  });
});

test.describe("dark mode and a phone", () => {
  test("dark theme", async ({ page, context }) => {
    await seed(context, { themeMode: "dark" });
    await open(page);
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
  });
  test.describe("375px", () => {
    test.use({ viewport: { width: 375, height: 800 } });
    test("one h1, no horizontal scroll, 44px targets", async ({ page }) => {
      await open(page);
      expect(await noScroll(page)).toBe(true);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      const r = row(page, 7, 206);
      expect((await r.getByTestId("sajda-star").boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      expect((await r.getByTestId("sajda-star").boundingBox())!.width).toBeGreaterThanOrEqual(43.5);
      expect((await r.getByTestId("sajda-open").boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      await expect(r.getByTestId("sajda-text")).toBeVisible();
      expect(await noScroll(page)).toBe(true);
    });
  });
});
