// Phase 9A: the per-page reader in a real browser, on the production build. The Qur'an text comes from the existing SYNTHETIC mock
// ("TEST ARABIC 2:6"), every unmocked request to a real API fails the test, the clock is fixed. The page boundaries are checked against
// the recorded real page responses in tests/pageReader.test.ts. See docs/phases/phase-09a-per-page.md.
import { expect, test, type Page } from "@playwright/test";
import { SURAH_ROWS } from "../app/data/quranMeta.generated";
import { JUZ } from "../app/lib/quranMeta";
import { pageSegments, pageSurahNumbers } from "../app/lib/pageReader";
import { forbidRealApis, freezeClock, idbNames, mockQuranText, readStorage, seed, type QuranTextMock } from "./mocks";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });
let leaks: string[] = [];
let api: QuranTextMock;
test.beforeEach(async ({ context }) => {
  leaks = await forbidRealApis(context);
  await freezeClock(context);
  api = await mockQuranText(context);
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

const toast = (page: Page, text: string) => page.locator("[data-sonner-toast]").filter({ hasText: text });
async function open(page: Page, q = "?page=3") {
  await page.goto(`/per-page-read${q}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByTestId("page-frame")).toBeVisible();
}
const store = async (page: Page, key: string) => {
  const v = (await readStorage(page))[key];
  return v ? (JSON.parse(v) as Record<string, unknown>) : null;
};
const noScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const twoSurahPage = Array.from({ length: 604 }, (_, i) => i + 1).find((p) => pageSurahNumbers(p).length === 2 && !pageSegments(p)![0]!.starts && pageSegments(p)![1]!.starts)!;

test.describe("a page", () => {
  test("page 3: the header from the data, the text from the surah's cache, one marker per ayah, one h1, no reading progress written", async ({ page }) => {
    await open(page, "?page=3");
    const segs = pageSegments(3)!;
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByTestId("per-page-title")).toHaveText("Page 3");
    await expect(page.getByTestId("page-sub")).toHaveText("Page 3 of 604 · Juz 1 · Al-Baqara");
    await expect(page.getByTestId("page-juz")).toHaveText("Juz 1");
    await expect(page.getByTestId("page-names")).toHaveText("Al-Baqara");
    await expect(page.getByTestId("page-no")).toHaveText("3");
    const g = segs[0]!;
    await expect(page.getByTestId("verse-mark")).toHaveCount(g.to - g.from + 1);
    const text = await page.getByTestId("page-text").textContent();
    expect(text).toContain(`TEST ARABIC ${g.surah}:${g.from}`);
    expect(text).toContain(`TEST ARABIC ${g.surah}:${g.to}`);
    expect(text).not.toContain(`TEST ARABIC ${g.surah}:${g.to + 1}`);
    await expect(page.getByTestId("surah-banner")).toHaveCount(0); // the page starts mid-surah
    await expect(page.getByTestId("page-bismillah")).toHaveCount(0);
    await expect(page.getByTestId("page-text")).toHaveAttribute("lang", "ar");
    await expect(page.getByTestId("page-text")).toHaveAttribute("dir", "rtl");
    expect(await page.getByTestId("page-text").evaluate((el) => getComputedStyle(el).letterSpacing)).toMatch(/^(0px|normal)$/);
    await expect(page.getByTestId("page-note")).toHaveText(/not a line-for-line copy/);
    expect(await store(page, "quran:reading-progress:v1")).toBeNull(); // opening a page is not reading it
    expect(await idbNames(page)).not.toContain("quran-app-db");
    expect(await noScroll(page)).toBe(true);
  });

  test("page 2 starts Al-Baqara: the banner and the Bismillah, which is read from surah 1's data (never typed)", async ({ page }) => {
    await open(page, "?page=2");
    await expect(page.getByTestId("surah-banner")).toHaveCount(1);
    await expect(page.getByTestId("page-bismillah")).toHaveText("TEST ARABIC 1:1");
    expect(api.chapters).toContain(1);
    expect(api.chapters).toContain(2);
  });

  test("page 1 starts Al-Fatiha: the banner, and no separate Bismillah (it is ayah 1)", async ({ page }) => {
    await open(page, "?page=1");
    await expect(page.getByTestId("surah-banner")).toHaveCount(1);
    await expect(page.getByTestId("page-bismillah")).toHaveCount(0);
    await expect(page.getByTestId("verse-mark")).toHaveCount(7);
  });

  test("a page that crosses into the next surah names both in the header and shows the new surah's banner", async ({ page }) => {
    await open(page, `?page=${twoSurahPage}`);
    const [a, b] = pageSurahNumbers(twoSurahPage) as [number, number];
    await expect(page.getByTestId("page-names")).toHaveText(`${SURAH_ROWS[a - 1]!.name}, ${SURAH_ROWS[b - 1]!.name}`);
    await expect(page.getByTestId("page-segment")).toHaveCount(2);
    await expect(page.getByTestId("surah-banner")).toHaveCount(1);
    await expect(page.getByTestId("page-segment").nth(1).getByTestId("surah-banner")).toHaveCount(1);
  });

  test("the last page holds several short surahs and is named plainly; Next is disabled there", async ({ page }) => {
    await open(page, "?page=604");
    await expect(page.getByTestId("page-names")).toHaveText(pageSurahNumbers(604).map((n) => SURAH_ROWS[n - 1]!.name).join(", "));
    await expect(page.getByTestId("next-page")).toHaveAttribute("aria-disabled", "true");
    await page.getByTestId("next-page").click({ force: true }); // aria-disabled, so Playwright needs force
    await expect(page).toHaveURL(/page=604$/);
  });

  test("the link into the surah reader goes to the first ayah of the page", async ({ page }) => {
    await open(page, "?page=3");
    const first = pageSegments(3)![0]!;
    await expect(page.getByTestId("open-in-reader")).toHaveAttribute("href", `/surah/${first.surah}#ayah-${first.from}`);
    await page.getByTestId("open-in-reader").click();
    await expect(page.getByTestId("reader-title")).toBeVisible();
  });

  test("a juz that starts partway down a page says so in the header (Juz 4 and 5)", async ({ page }) => {
    const p = Array.from({ length: 604 }, (_, i) => i + 1).find((n) => JUZ.some((j) => j.midPageStart && j.firstPage === n))!;
    await open(page, `?page=${p}`);
    await expect(page.getByTestId("page-juz")).toHaveText(/^Juz \d+ and \d+$/);
  });
});

test.describe("moving between pages", () => {
  test("Previous and Next: the address follows (replace, so Back leaves the reader), focus moves to the title, the live region announces", async ({ page }) => {
    await page.goto("/surah-listing?tab=page");
    await page.locator('a[data-page="12"]').click();
    await expect(page.getByTestId("per-page-title")).toHaveText("Page 12");
    await expect(page.getByTestId("page-frame")).toBeVisible();
    await page.getByTestId("next-page").click();
    await expect(page).toHaveURL(/per-page-read\?page=13$/);
    await expect(page.getByTestId("per-page-title")).toHaveText("Page 13");
    await expect(page.getByTestId("per-page-title")).toBeFocused();
    await expect(page.getByTestId("page-live")).toHaveText("Page 13 of 604");
    await page.getByTestId("prev-page").click();
    await expect(page.getByTestId("per-page-title")).toHaveText("Page 12");
    await page.goBack(); // replace: one Back returns to the listing
    await expect(page).toHaveURL(/surah-listing/);
  });

  test("Previous is disabled (aria-disabled, still in the order) on page 1 and does nothing", async ({ page }) => {
    await open(page, "?page=1");
    await expect(page.getByTestId("prev-page")).toHaveAttribute("aria-disabled", "true");
    await page.getByTestId("prev-page").click({ force: true });
    await expect(page).toHaveURL(/page=1$/);
    await expect(page.getByTestId("prev-page")).toBeVisible();
  });

  test("the slider: its value text names the page, and a keyboard change goes to that page", async ({ page }) => {
    await open(page, "?page=3");
    const slider = page.getByTestId("page-slider");
    await expect(slider).toHaveAttribute("aria-valuetext", "Page 3 of 604");
    await expect(slider).toHaveAttribute("min", "1");
    await expect(slider).toHaveAttribute("max", "604");
    await slider.focus();
    await page.keyboard.press("End");
    await expect(page).toHaveURL(/page=604$/);
    await expect(page.getByTestId("per-page-title")).toHaveText("Page 604");
    await expect(slider).toHaveAttribute("aria-valuetext", "Page 604 of 604");
    await expect(slider).toBeFocused();
  });

  test("Go to page: a valid number, Arabic-Indic digits and Enter work; a bad value says so and goes nowhere", async ({ page }) => {
    await open(page, "?page=3");
    await page.getByTestId("go-input").fill("90");
    await page.getByTestId("go-button").click();
    await expect(page.getByTestId("per-page-title")).toHaveText("Page 90");
    await page.getByTestId("go-input").fill("٤٩");
    await page.getByTestId("go-input").press("Enter");
    await expect(page.getByTestId("per-page-title")).toHaveText("Page 49");
    await page.getByTestId("go-input").fill("700");
    await page.getByTestId("go-button").click();
    await expect(page.getByTestId("go-error")).toHaveText("Enter a page from 1 to 604.");
    await expect(page.getByTestId("go-input")).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL(/page=49$/);
    await page.getByTestId("go-input").fill("abc");
    await page.getByTestId("go-button").click();
    await expect(page.getByTestId("go-error")).toHaveText("Enter a page from 1 to 604.");
    await page.getByTestId("go-input").fill("50");
    await page.getByTestId("go-button").click();
    await expect(page.getByTestId("per-page-title")).toHaveText("Page 50");
    await expect(page.getByTestId("go-error")).toHaveText("");
  });

  test("the Tab order: tools, text, reader link, Previous, slider, Next, Go to page, Go", async ({ page }) => {
    await open(page, "?page=3");
    await page.getByTestId("play-page").focus();
    const order: string[] = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      order.push((await page.evaluate(() => document.activeElement?.getAttribute("data-testid") ?? "")) as string);
    }
    expect(order).toEqual(["open-in-reader", "prev-page", "page-slider", "next-page", "go-input", "go-button"]);
  });

  test("no arrow-key shortcut: ArrowLeft and ArrowRight do not change the page", async ({ page }) => {
    await open(page, "?page=10");
    await page.getByTestId("per-page-title").focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(/page=10$/);
  });
});

test.describe("an address that is not a page", () => {
  test("?page=700 opens page 1 with a short notice; ?page=abc says so too; no page and a real page have none", async ({ page }) => {
    await open(page, "?page=700");
    await expect(page.getByTestId("per-page-title")).toHaveText("Page 1");
    await expect(page.getByTestId("page-notice")).toHaveText("Page 700 doesn’t exist. Showing page 1.");
    await page.getByTestId("next-page").click();
    await expect(page.getByTestId("per-page-title")).toHaveText("Page 2");
    await expect(page.getByTestId("page-notice")).toHaveCount(0); // the notice belongs to the address that caused it
    await open(page, "?page=abc");
    await expect(page.getByTestId("page-notice")).toHaveText("That page doesn’t exist. Showing page 1.");
    await open(page, "");
    await expect(page.getByTestId("per-page-title")).toHaveText("Page 1");
    await expect(page.getByTestId("page-notice")).toHaveCount(0);
    await open(page, "?page=0");
    await expect(page.getByTestId("page-notice")).toHaveText("Page 0 doesn’t exist. Showing page 1.");
    await open(page, "?page=49");
    await expect(page.getByTestId("page-notice")).toHaveCount(0);
  });
});

test.describe("text size: the global Arabic size", () => {
  test("A+ and A− write the setting the Settings slider uses, and the Settings slider moves this control", async ({ page, context }) => {
    await seed(context, { "quran:accessibility:v1": JSON.stringify({ arabicFontScale: 1.2, futureField: "keep" }) });
    await open(page, "?page=3");
    await expect(page.getByTestId("text-scale")).toHaveText("1.2×");
    await page.getByTestId("text-bigger").click();
    await expect(page.getByTestId("text-scale")).toHaveText("1.3×");
    expect(await store(page, "quran:accessibility:v1")).toMatchObject({ arabicFontScale: 1.3, futureField: "keep" });
    expect(await page.evaluate(() => document.documentElement.style.getPropertyValue("--arabic-font-scale"))).toBe("1.3");
    await page.getByTestId("text-smaller").click();
    await page.getByTestId("text-smaller").click();
    await expect(page.getByTestId("text-scale")).toHaveText("1.1×");
    await page.goto("/settings?section=reading"); // the same value in Settings
    await expect(page.getByTestId("scale-value")).toHaveText("1.1×");
    await page.getByTestId("scale-value").scrollIntoViewIfNeeded();
    await page.goto("/per-page-read?page=3");
    await expect(page.getByTestId("text-scale")).toHaveText("1.1×");
  });

  test("the limits are 0.8 and 1.6; the buttons are disabled there", async ({ page, context }) => {
    await seed(context, { "quran:accessibility:v1": JSON.stringify({ arabicFontScale: 1.6 }) });
    await open(page, "?page=3");
    await expect(page.getByTestId("text-bigger")).toBeDisabled();
    await expect(page.getByTestId("text-smaller")).toBeEnabled();
    expect(await noScroll(page)).toBe(true);
    await page.getByTestId("text-smaller").click({ clickCount: 1 });
    await expect(page.getByTestId("text-scale")).toHaveText("1.5×");
    await page.evaluate(() => localStorage.setItem("quran:accessibility:v1", JSON.stringify({ arabicFontScale: 0.8 })));
    await page.reload();
    await expect(page.getByTestId("text-smaller")).toBeDisabled();
  });

  test("the text really gets larger", async ({ page }) => {
    await open(page, "?page=3");
    const size = () => page.getByTestId("page-text").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    const before = await size();
    await page.getByTestId("text-bigger").click();
    await page.getByTestId("text-bigger").click();
    expect(await size()).toBeGreaterThan(before);
  });
});

test.describe("Pin page, Save, Play page", () => {
  test("Pin writes the Page slot of quran:pins:v1 and keeps the other fields; Undo restores; a second pin replaces the first; Unpin has Undo", async ({ page, context }) => {
    await seed(context, { "quran:pins:v1": JSON.stringify({ v: 1, reading: { surahNo: 2, ayahNo: 255, pinnedAt: 5 }, other: { keep: 1 } }) });
    await open(page, "?page=49");
    await page.getByTestId("pin-page").click();
    await expect(page.getByTestId("pin-page")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("pin-page")).toHaveText(/Pinned/);
    expect(await store(page, "quran:pins:v1")).toMatchObject({ v: 1, reading: { surahNo: 2, ayahNo: 255 }, page: { pageNo: 49 }, other: { keep: 1 } });
    await toast(page, "Pinned page 49").getByRole("button", { name: "Undo" }).click();
    expect((await store(page, "quran:pins:v1"))!.page).toBeNull();
    await expect(page.getByTestId("pin-page")).toHaveAttribute("aria-pressed", "false");
    await page.getByTestId("pin-page").click();
    await page.getByTestId("next-page").click();
    await expect(page.getByTestId("pin-page")).toHaveAttribute("aria-pressed", "false"); // page 50 is not the pinned page
    await page.getByTestId("pin-page").click();
    expect(await store(page, "quran:pins:v1")).toMatchObject({ page: { pageNo: 50 }, reading: { surahNo: 2 } });
    await toast(page, "Pinned page 50").getByRole("button", { name: "Undo" }).click();
    expect(await store(page, "quran:pins:v1")).toMatchObject({ page: { pageNo: 49 } }); // Undo restores the earlier pin
    await page.getByTestId("prev-page").click();
    await expect(page.getByTestId("pin-page")).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("pin-page").click();
    expect((await store(page, "quran:pins:v1"))!.page).toBeNull();
    await toast(page, "Unpinned").getByRole("button", { name: "Undo" }).click();
    expect(await store(page, "quran:pins:v1")).toMatchObject({ page: { pageNo: 49 } });
  });

  test("the Library's Page slot shows the pin and opens the reader at that page; the slot said Not set before", async ({ page }) => {
    await page.goto("/bookmarks");
    await expect(page.getByTestId("slot-page")).toContainText("Not set. Pin a page from the page reader.");
    await open(page, "?page=49");
    await page.getByTestId("pin-page").click();
    await page.goto("/bookmarks");
    await expect(page.getByTestId("slot-page")).toContainText("Pinned");
    await expect(page.getByTestId("slot-page-link")).toHaveText("Page 49");
    await page.getByTestId("slot-page-link").click();
    await expect(page.getByTestId("per-page-title")).toHaveText("Page 49");
  });

  test("Save writes the legacy page:N bookmark with its added-at, Undo reverses it, and the Library lists it and opens the reader", async ({ page }) => {
    await open(page, "?page=49");
    await page.getByTestId("save-page").click();
    await expect(page.getByTestId("save-page")).toHaveAttribute("aria-pressed", "true");
    expect(JSON.parse((await readStorage(page))["quran:bookmarks:v1"]!)).toEqual(["page:49"]);
    expect(Object.keys(JSON.parse((await readStorage(page))["quran:bookmarks:added-at:v1"]!))).toEqual(["page:49"]);
    await toast(page, "Saved page 49").getByRole("button", { name: "Undo" }).click();
    expect(JSON.parse((await readStorage(page))["quran:bookmarks:v1"]!)).toEqual([]);
    await page.getByTestId("save-page").click();
    await page.goto("/bookmarks");
    const row = page.locator('[data-testid="library-row"][data-key="page:49"]');
    await expect(row.getByTestId("row-open")).toHaveAttribute("href", "/per-page-read?page=49");
    await row.getByTestId("row-open").click();
    await expect(page.getByTestId("per-page-title")).toHaveText("Page 49");
    await expect(page.getByTestId("save-page")).toHaveAttribute("aria-pressed", "true"); // the state is read back
    await page.getByTestId("save-page").click(); // removing has its own Undo
    await toast(page, "Removed page 49").getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("save-page")).toHaveAttribute("aria-pressed", "true");
  });

  test("the listing's Last read marker is unaffected by opening, pinning, saving and moving between pages", async ({ page, context }) => {
    const progress = JSON.stringify({ surahNo: 2, ayahNo: 285, surahName: "The Cow", surahNameArabic: "x", totalAyah: 286, updatedAt: 1 });
    await seed(context, { "quran:reading-progress:v1": progress });
    await open(page, "?page=300");
    await page.getByTestId("pin-page").click();
    await page.getByTestId("save-page").click();
    await page.getByTestId("next-page").click();
    await page.getByTestId("next-page").click();
    expect((await readStorage(page))["quran:reading-progress:v1"]).toBe(progress); // byte for byte
    await page.goto("/surah-listing");
    await expect(page.getByTestId("last-read-line").getByRole("link")).toHaveAttribute("href", "/surah/2#ayah-285");
    await page.goto("/surah-listing?tab=page");
    await expect(page.getByTestId("jump-current")).toContainText("Jump to page 49"); // pageOfAyah(2, 285) from the same table
  });

  test("Play page is a visible, real button with aria-disabled and its reason; it does nothing", async ({ page }) => {
    await open(page, "?page=3");
    const play = page.getByTestId("play-page");
    await expect(play).toBeVisible();
    expect(await play.evaluate((el) => el.tagName)).toBe("BUTTON");
    await expect(play).toHaveAttribute("aria-disabled", "true");
    await expect(play).toHaveAttribute("aria-describedby", "play-reason");
    await expect(page.getByTestId("play-reason")).toHaveText("Coming with the player");
    await play.click({ force: true });
    await expect(page).toHaveURL(/page=3$/);
    await expect(page.getByTestId("mini-player")).toHaveCount(0);
  });
});

test.describe("loading and failing", () => {
  test("a slow request shows the skeleton, then the text", async ({ page }) => {
    api.delayMs = 400;
    await page.goto("/per-page-read?page=3");
    await expect(page.getByTestId("page-skeleton")).toBeVisible();
    await expect(page.getByTestId("page-frame")).toBeVisible();
    await expect(page.getByTestId("page-skeleton")).toHaveCount(0);
  });

  test("a failed request says so, keeps the controls, and Try again loads the page", async ({ page }) => {
    api.mode = "http500";
    await page.goto("/per-page-read?page=3");
    await expect(page.getByTestId("load-error")).toHaveText("Couldn’t load this page. Check your connection and try again.");
    await expect(page.getByTestId("page-nav")).toBeVisible();
    api.mode = "ok";
    await page.getByTestId("load-retry").click();
    await expect(page.getByTestId("page-frame")).toBeVisible();
  });

  test("a surah opened once is read from the device after a reload with the service refusing; an unsaved one offline says to connect once, and the controls still reach a saved page", async ({ page, context }) => {
    await open(page, "?page=3"); // saves surah 2 on the device
    api.mode = "network"; // from now on the service does not answer
    await page.reload();
    await expect(page.getByTestId("page-frame")).toBeVisible();
    await expect(page.getByTestId("page-text")).toContainText("TEST ARABIC 2:");
    await context.setOffline(true);
    await page.getByTestId("go-input").fill("300");
    await page.getByTestId("go-button").click();
    await expect(page.getByTestId("load-error")).toHaveText("This page’s text isn’t saved on this device yet. Connect once to read it.");
    await expect(page.getByTestId("page-nav")).toBeVisible();
    await page.getByTestId("go-input").fill("5");
    await page.getByTestId("go-button").click();
    await expect(page.getByTestId("page-frame")).toBeVisible();
    await context.setOffline(false);
    api.mode = "ok";
    await page.getByTestId("go-input").fill("300");
    await page.getByTestId("go-button").click();
    await expect(page.getByTestId("page-frame")).toBeVisible();
  });

  test("Next quietly has the next page's surah ready, so a page that crosses a surah boundary does not stall", async ({ page }) => {
    const [a, b] = pageSurahNumbers(twoSurahPage) as [number, number];
    await open(page, `?page=${twoSurahPage - 1}`);
    await expect.poll(() => api.chapters.includes(b)).toBe(true);
    expect(api.chapters).toContain(a);
  });
});

test.describe("the listing", () => {
  test("every Page tab chip target renders the page reader: the first and last chip of each juz group in the browser, all 604 by their address", async ({ page }) => {
    test.setTimeout(150_000); // 56 page loads
    await page.goto("/surah-listing?tab=page");
    await expect(page.locator("a[data-page]").first()).toBeVisible();
    const all = await page.locator("a[data-page]").evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!));
    expect(new Set(all).size).toBe(604);
    const pick = new Set<string>();
    for (const g of await page.locator('[data-testid^="page-group-"]').all()) {
      const hrefs = await g.locator("a[data-page]").evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!));
      pick.add(hrefs[0]!);
      pick.add(hrefs[hrefs.length - 1]!);
    }
    expect(pick.size).toBe(56); // 30 groups x 2, less the 4 pages that two juz share (juz 4, 7, 11 and 26 start mid-page)
    for (const h of pick) {
      const n = Number(/page=(\d+)$/.exec(h)![1]);
      await page.goto(h);
      await expect(page.getByTestId("per-page-title"), h).toHaveText(`Page ${n}`);
      await expect(page.getByTestId("page-notice"), h).toHaveCount(0);
      await expect(page.getByTestId("page-frame"), h).toBeVisible();
    }
  });

  test("the 'not rebuilt yet' notice and page are gone for per-page-read", async ({ page }) => {
    await open(page, "?page=3");
    await expect(page.getByText("This page is not rebuilt yet")).toHaveCount(0);
    await page.goto("/surah-listing?tab=page");
    await expect(page.getByTestId("readers-notice")).toHaveCount(0);
  });
});

test.describe("dark mode and a phone", () => {
  test("dark theme", async ({ page, context }) => {
    await seed(context, { themeMode: "dark" });
    await open(page, "?page=3");
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
  });

  test.describe("375px", () => {
    test.use({ viewport: { width: 375, height: 800 } });
    test("one h1, no horizontal scroll (also at the largest Arabic size), 44px targets", async ({ page, context }) => {
      await seed(context, { "quran:accessibility:v1": JSON.stringify({ arabicFontScale: 1.6 }) });
      await open(page, `?page=${twoSurahPage}`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      expect(await noScroll(page)).toBe(true);
      for (const id of ["text-smaller", "text-bigger", "pin-page", "save-page", "play-page", "prev-page", "next-page", "go-input", "go-button", "page-slider", "open-in-reader", "back-link"]) {
        expect((await page.getByTestId(id).first().boundingBox())!.height, id).toBeGreaterThanOrEqual(43.5);
      }
      expect((await page.getByTestId("text-smaller").boundingBox())!.width).toBeGreaterThanOrEqual(43.5);
      expect(await page.getByTestId("page-text").first().evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    });
  });
});
