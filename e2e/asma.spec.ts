// Phase 9B: Asma-ul-Husna in a real browser, on the production build. The 99 names are the legacy data file (bundled, offline level A). Every
// unmocked request to a real API fails the test; the clock is fixed. See docs/phases/phase-09b-asma-sajda-tasbeeh.md.
import { expect, test, type Page } from "@playwright/test";
import { forbidRealApis, freezeClock, idbNames, mockQuranText, readStorage, seed } from "./mocks";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });
let leaks: string[] = [];
test.beforeEach(async ({ context }) => {
  leaks = await forbidRealApis(context);
  await freezeClock(context);
  await mockQuranText(context);
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

const toast = (page: Page, text: string) => page.locator("[data-sonner-toast]").filter({ hasText: text });
const cards = (page: Page) => page.getByTestId("name-card");
const card = (page: Page, id: number) => page.locator(`[data-testid="name-card"][data-id="${id}"]`);
async function open(page: Page, q = "") {
  await page.goto(`/asma-ul-husna${q}`);
  await expect(page.getByRole("heading", { level: 1, name: "Asma-ul-Husna" })).toBeVisible();
  await expect(cards(page).first()).toBeVisible();
}
const bookmarks = async (page: Page) => JSON.parse((await readStorage(page))["quran:bookmarks:v1"] ?? "[]") as string[];
const noScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
/** WCAG contrast of an element's text against the first non-transparent background behind it. */
const contrast = (el: import("@playwright/test").Locator) =>
  el.evaluate((node) => {
    const parse = (s: string) => (s.match(/[\d.]+/g) ?? []).map(Number);
    const lum = (rgb: number[]) => {
      const [r, g, b] = rgb.slice(0, 3).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
      return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
    };
    const fg = parse(getComputedStyle(node).color);
    let bg = [0, 0, 0, 0];
    for (let e: Element | null = node; e; e = e.parentElement) {
      const c = parse(getComputedStyle(e).backgroundColor);
      if (c.length >= 3 && (c.length === 3 || c[3]! > 0.9)) { bg = c; break; }
    }
    const [a, b] = [lum(fg), lum(bg)];
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  });

test.describe("the list", () => {
  test("99 names from the data, one h1, the footer, no embedded video, no external request, quran-app-db never opened", async ({ page }) => {
    const external: string[] = [];
    page.on("request", (r) => { if (!r.url().startsWith("http://localhost")) external.push(r.url()); });
    await open(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(cards(page)).toHaveCount(99);
    await expect(page.getByTestId("asma-count")).toHaveText("99 names");
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.getByTestId("asma-footer")).toHaveText("Lists of the 99 names differ slightly between sources. This is the list this app’s data uses.");
    const first = card(page, 1);
    await expect(first.getByTestId("name-translit")).toHaveText("Ar-Rahman");
    await expect(first.getByTestId("name-english")).toHaveText("The Most Merciful");
    await expect(first.getByTestId("name-number")).toHaveText("#1");
    await expect(first.getByTestId("name-arabic")).toHaveAttribute("lang", "ar");
    await expect(first.getByTestId("name-arabic")).toHaveAttribute("dir", "rtl");
    await expect(card(page, 6).getByTestId("name-translit")).toHaveText("Al-Mu’min"); // typography only
    await expect(card(page, 49).getByTestId("name-translit")).toHaveText("Al-Ba’ith"); // the data's straight apostrophe is typeset
    expect(external).toEqual([]);
    expect(await idbNames(page)).not.toContain("quran-app-db");
  });

  test("the search box is labelled for names (the legacy page said Search Surah); it finds by name, meaning, Arabic and number", async ({ page }) => {
    await open(page);
    const search = page.getByRole("searchbox", { name: "Search the names" });
    await expect(search).toBeVisible();
    const arabic = (await card(page, 3).getByTestId("name-arabic").textContent())!;
    await search.fill("rahman");
    await expect(page.getByTestId("asma-count")).toHaveText(/^\d+ of 99 names$/);
    await expect(card(page, 1)).toBeVisible();
    await search.fill("mumin");
    await expect(cards(page)).toHaveCount(1);
    await expect(card(page, 6)).toBeVisible();
    await search.fill("merciful");
    await expect(cards(page).first()).toBeVisible();
    await search.fill("12");
    await expect(cards(page)).toHaveCount(1);
    await expect(card(page, 12)).toBeVisible();
    await search.fill(arabic);
    await expect(card(page, 3)).toBeVisible();
    await search.fill("zzzz");
    await expect(page.getByTestId("asma-empty")).toHaveText("No names match “zzzz”.");
    await search.fill("");
    await expect(cards(page)).toHaveCount(99);
  });

  test("the English line is readable in the light theme (the legacy page had near-white text): contrast of at least 4.5, also for the other lines and in dark", async ({ page, context }) => {
    await open(page);
    for (const id of ["name-english", "name-translit", "name-number", "name-urdu"]) expect(await contrast(card(page, 1).getByTestId(id)), `light ${id}`).toBeGreaterThanOrEqual(4.5);
    expect(await contrast(page.getByTestId("asma-footer"))).toBeGreaterThanOrEqual(4.5);
    const dark = await context.newPage();
    await seed(context, { themeMode: "dark" });
    await dark.goto("/asma-ul-husna");
    await expect(card(dark, 1)).toBeVisible();
    expect(await dark.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
    for (const id of ["name-english", "name-translit", "name-number", "name-urdu"]) expect(await contrast(card(dark, 1).getByTestId(id)), `dark ${id}`).toBeGreaterThanOrEqual(4.5);
  });
});

test.describe("Saved", () => {
  test("the star writes the legacy name:<id> key and its added-at, with Undo; Saved filters; an empty Saved says so", async ({ page }) => {
    await open(page);
    await page.getByTestId("asma-saved").click();
    await expect(page.getByTestId("asma-empty")).toHaveText("No names saved yet. Tap the star on a name.");
    await page.getByTestId("asma-saved").click();
    await card(page, 12).getByTestId("name-star").click();
    await expect(card(page, 12).getByTestId("name-star")).toHaveAttribute("aria-pressed", "true");
    expect(await bookmarks(page)).toEqual(["name:12"]);
    expect(Object.keys(JSON.parse((await readStorage(page))["quran:bookmarks:added-at:v1"]!))).toEqual(["name:12"]);
    await toast(page, "Saved").getByRole("button", { name: "Undo" }).click();
    expect(await bookmarks(page)).toEqual([]);
    await card(page, 12).getByTestId("name-star").click();
    await card(page, 3).getByTestId("name-star").click();
    await page.getByTestId("asma-saved").click();
    await expect(cards(page)).toHaveCount(2);
    await card(page, 3).getByTestId("name-star").click();
    await toast(page, "Removed").getByRole("button", { name: "Undo" }).click();
    expect((await bookmarks(page)).sort()).toEqual(["name:12", "name:3"]);
    await page.reload();
    await page.getByTestId("asma-saved").click();
    await expect(cards(page)).toHaveCount(2); // read back from storage
  });

  test("a saved name:<n> from the legacy app shows in the Library's Names filter, and its row opens that name", async ({ page, context }) => {
    await seed(context, { "quran:bookmarks:v1": JSON.stringify(["name:12", "surah:18"]) });
    await page.goto("/bookmarks");
    await expect(page.getByRole("heading", { level: 1, name: "Library" })).toBeVisible();
    await expect(page.getByTestId("library-row")).toHaveCount(2);
    await page.getByRole("button", { name: /^Show/ }).click();
    await page.getByRole("menuitemradio", { name: "Names", exact: true }).click();
    await expect(page.getByTestId("library-row")).toHaveCount(1);
    const row = page.locator('[data-testid="library-row"][data-key="name:12"]');
    await expect(row.getByTestId("row-open")).toHaveAttribute("href", "/asma-ul-husna#name-12");
    await expect(page.getByTestId("pending-notice")).toHaveCount(0); // the name opens today, so nothing is pending
    await row.getByTestId("row-open").click();
    await expect(page.getByTestId("name-sheet")).toBeVisible();
    await expect(page.getByTestId("sheet-number")).toHaveText("Name 12 of 99");
  });
});

test.describe("a name", () => {
  test("a card opens a sheet with the Arabic, the number, the meaning and the Urdu; the address holds it; Escape closes it and clears it", async ({ page }) => {
    await open(page);
    await card(page, 12).getByTestId("name-open").click();
    await expect(page.getByTestId("name-sheet")).toBeVisible();
    await expect(page).toHaveURL(/#name-12$/);
    await expect(page.getByTestId("sheet-number")).toHaveText("Name 12 of 99");
    await expect(page.getByTestId("sheet-name")).toHaveText(await card(page, 12).getByTestId("name-translit").textContent() as string);
    await expect(page.getByTestId("sheet-english")).toHaveText(await card(page, 12).getByTestId("name-english").textContent() as string);
    await expect(page.getByTestId("sheet-arabic")).toHaveAttribute("lang", "ar");
    await expect(page.getByTestId("sheet-urdu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("name-sheet")).toHaveCount(0);
    await expect(page).not.toHaveURL(/#name-/);
    await expect(card(page, 12).getByTestId("name-open")).toBeFocused(); // focus returns to the card
  });

  test("#name-5 opens that name directly; a bad number opens nothing", async ({ page }) => {
    await page.goto("/asma-ul-husna#name-5");
    await expect(page.getByTestId("sheet-number")).toHaveText("Name 5 of 99");
    await page.goto("/asma-ul-husna#name-500");
    await expect(page.getByRole("heading", { level: 1, name: "Asma-ul-Husna" })).toBeVisible();
    await expect(cards(page).first()).toBeVisible();
    await expect(page.getByTestId("name-sheet")).toHaveCount(0);
  });

  test("Save in the sheet writes the same key with Undo", async ({ page }) => {
    await page.goto("/asma-ul-husna#name-7");
    await expect(page.getByTestId("name-sheet")).toBeVisible();
    await page.getByTestId("sheet-save").click();
    expect(await bookmarks(page)).toEqual(["name:7"]);
    await expect(page.getByTestId("sheet-save")).toHaveAttribute("aria-pressed", "true");
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
    test("one h1, no horizontal scroll, 44px targets, the sheet is a bottom sheet", async ({ page }) => {
      await open(page);
      expect(await noScroll(page)).toBe(true);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      for (const id of ["asma-search", "asma-saved"]) expect((await page.getByTestId(id).boundingBox())!.height, id).toBeGreaterThanOrEqual(43.5);
      const c = card(page, 1);
      expect((await c.getByTestId("name-star").boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      expect((await c.getByTestId("name-star").boundingBox())!.width).toBeGreaterThanOrEqual(43.5);
      expect((await c.getByTestId("name-open").boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      await c.getByTestId("name-open").click();
      await expect(page.getByTestId("name-sheet")).toHaveAttribute("data-side", "bottom");
      for (const id of ["sheet-save", "sheet-play"]) expect((await page.getByTestId(id).boundingBox())!.height, id).toBeGreaterThanOrEqual(43.5);
      expect(await noScroll(page)).toBe(true);
    });
  });
});
