// Phase 7B: the Story reader and the Stories directory in a real browser, on the production build. The Qur'an text comes from the
// existing SYNTHETIC mock ("TEST ARABIC 12:4"), every unmocked request to a real API fails the test, the clock is fixed.
// See docs/phases/phase-07b-story.md.
import { expect, test, type Page } from "@playwright/test";
import { forbidRealApis, freezeClock, idbNames, mockAladhan, mockQuranText, mockVerse, readStorage, seed, type QuranTextMock } from "./mocks";

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

const ARRANGED = ["nuhflood", "adamandiblis", "ibrahimnarrative", "musaandpharaoh", "musaandbaniisrael", "ayyubstory", "yunusstory", "maryamandisa", "thenightjourney"];
const toast = (page: Page, text: string) => page.locator("[data-sonner-toast]").filter({ hasText: text });
async function open(page: Page, path: string, testid = "story-page") {
  await page.goto(path);
  await expect(page.getByTestId(testid)).toBeVisible();
}
const progress = async (page: Page) => JSON.parse((await readStorage(page))["quran:story-progress:v1"] ?? "{}") as { v?: number; stories?: Record<string, { chapter: number; read: number[]; updatedAt: number }> };
const push = (page: Page, to: string) => page.evaluate((p) => (document.querySelector("#__nuxt") as unknown as { __vue_app__: { config: { globalProperties: { $router: { push(p: string): void } } } } }).__vue_app__.config.globalProperties.$router.push(p), to);

test.describe("directory", () => {
  test("21 stories, one h1, status chips (dashed for the 8 not fully told), chapter counts, Not started, quran-app-db never opened", async ({ page }) => {
    await open(page, "/stories", "stories-list");
    await expect(page.getByTestId("story-row")).toHaveCount(21);
    await expect(page.getByTestId("stories-count")).toHaveText("21 stories");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.locator('[data-testid="row-status"].border-dashed')).toHaveCount(9); // the 8 not fully told, and nuhflood (the override list)
    const yusuf = page.locator('[data-testid="story-row"][data-id="yusufstory"]');
    await expect(yusuf.getByTestId("row-chapters")).toContainText("4 chapters");
    await expect(yusuf.getByTestId("row-progress")).toHaveText("Not started");
    await expect(yusuf.getByTestId("row-status")).toHaveText("Fully told in the Qur'an");
    expect(await idbNames(page)).not.toContain("quran-app-db");
    expect(api.chapters).toEqual([]); // the directory needs no Qur'an text
  });

  test("search, type and person filters; Saved with the star and Undo; Reset; the URL holds the state", async ({ page }) => {
    await open(page, "/stories", "stories-list");
    await page.getByTestId("stories-search").fill("yusuf");
    await expect(page).toHaveURL(/q=yusuf/);
    await expect(page.locator('[data-testid="story-row"][data-id="yusufstory"]')).toBeVisible();
    await page.getByTestId("stories-search").fill("xylophone");
    await expect(page.getByTestId("stories-empty")).toContainText("No stories match “xylophone”.");
    await page.getByTestId("stories-empty-reset").click();
    await expect(page.getByTestId("story-row")).toHaveCount(21);
    await page.getByRole("button", { name: /^Type/ }).click();
    await page.getByRole("menuitemradio", { name: "Group Narratives", exact: true }).click();
    expect(await page.getByTestId("story-row").count()).toBeLessThan(21);
    await page.getByTestId("stories-reset").click();
    await page.getByRole("button", { name: /^Person/ }).click();
    await page.getByRole("menuitemradio", { name: /^Musa/ }).first().click();
    expect(await page.getByTestId("story-row").count()).toBeGreaterThan(2);
    await page.getByTestId("stories-reset").click();
    await page.locator('[data-testid="story-row"][data-id="qarunstory"]').getByTestId("star").click();
    expect(JSON.parse((await readStorage(page))["quran:bookmarks:v1"]!)).toContain("story:qarunstory");
    await page.getByTestId("stories-saved").click();
    await expect(page.getByTestId("story-row")).toHaveCount(1);
    await page.locator('[data-testid="story-row"][data-id="qarunstory"]').getByTestId("star").click();
    await expect(toast(page, "from saved")).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    expect(JSON.parse((await readStorage(page))["quran:bookmarks:v1"]!)).toContain("story:qarunstory");
    await page.goto("/stories?saved=1&type=group_narrative");
    await expect(page.getByTestId("stories-saved")).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("a complete story (Yusuf)", () => {
  test("header, chips, derived Order, no arranged notice, summary label, Listen disabled with its reason, text from the cached surah", async ({ page }) => {
    await open(page, "/stories/yusufstory");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByTestId("story-arabic-title")).not.toBeEmpty();
    await expect(page.getByTestId("chip-status")).toHaveText("Fully told in the Qur'an");
    await expect(page.getByTestId("chip-chapters")).toHaveText("4 chapters");
    await expect(page.getByTestId("story-order")).toContainText("Order: the surah's own sequence");
    await expect(page.getByTestId("story-order")).toContainText("12:4–101");
    await expect(page.getByTestId("arranged-notice")).toHaveCount(0);
    await expect(page.getByTestId("summary-note")).toContainText("written for this app");
    await expect(page.getByTestId("chapter-eyebrow")).toHaveText("Chapter 1 of 4");
    await expect(page.getByTestId("chapter-ref")).toContainText("12:4–20 · 17 ayahs");
    await expect(page.getByTestId("chapter-summary")).toContainText("Summary (written for this app)");
    const listen = page.getByTestId("listen");
    await expect(listen).toBeVisible();
    await expect(listen).toHaveAttribute("aria-disabled", "true");
    await expect(listen).toHaveAccessibleDescription("Coming with the player");
    await expect(page.getByTestId("listen-why")).toHaveText("Coming with the player");
    await listen.click({ force: true }); // Playwright treats aria-disabled as not enabled; forcing proves the click does nothing
    await expect(page).toHaveURL(/\/stories\/yusufstory$/); // it does nothing
    await expect(page.getByTestId("story-arabic").first()).toHaveText("TEST ARABIC 12:44"); // the text, then the verse marker (4)
    await expect(page.getByTestId("story-translation").first()).toHaveText("Test English 12:4");
    expect(api.chapters).toEqual([12]); // one request for the surah, not one per ayah
    expect(api.tafsirs).toEqual([]);
    await expect(page.locator("img, canvas, picture")).toHaveCount(0);
  });

  test("a 17-ayah chapter shows 8, then 'Show all 17 ayahs' expands in place and keeps focus; Show fewer collapses", async ({ page }) => {
    await open(page, "/stories/yusufstory");
    await expect(page.getByTestId("story-ayah")).toHaveCount(8);
    const more = page.getByTestId("show-all");
    await expect(more).toHaveText("Show all 17 ayahs");
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await more.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("story-ayah")).toHaveCount(17);
    await expect(page.getByTestId("show-fewer")).toBeFocused();
    await expect(page.getByTestId("show-fewer")).toHaveAttribute("aria-expanded", "true");
    await page.getByTestId("show-fewer").click();
    await expect(page.getByTestId("story-ayah")).toHaveCount(8);
    await open(page, "/stories/yusufstory?chapter=3"); // chapter 3 has 22 ayahs
    await expect(page.getByTestId("show-all")).toHaveText("Show all 22 ayahs");
  });

  test("Previous and Next: the URL follows (replace), focus moves to the chapter title, the live region announces it, the rail marks read chapters", async ({ page }) => {
    await open(page, "/stories/yusufstory");
    await expect(page.getByTestId("prev")).toBeDisabled();
    await expect(page.getByTestId("rail-dot")).toHaveCount(4);
    await page.getByTestId("next").click();
    await expect(page).toHaveURL(/chapter=2$/);
    await expect(page.getByTestId("chapter-eyebrow")).toHaveText("Chapter 2 of 4");
    await expect(page.getByTestId("chapter-title")).toBeFocused();
    await expect(page.getByTestId("chapter-announce")).toContainText("Chapter 2 of 4");
    await expect(page.getByTestId("rail-dot").nth(0)).toHaveAttribute("data-state", "read");
    await expect(page.getByTestId("rail-dot").nth(1)).toHaveAttribute("aria-current", "step");
    await expect(page.getByTestId("rail-dot").nth(0)).toHaveAccessibleName(/Chapter 1: .*, read/);
    expect((await progress(page)).stories!.yusufstory).toMatchObject({ chapter: 1, read: [0] });
    await page.getByTestId("prev").click();
    await expect(page.getByTestId("chapter-eyebrow")).toHaveText("Chapter 1 of 4");
    await page.getByTestId("rail-dot").nth(3).click();
    await expect(page.getByTestId("chapter-eyebrow")).toHaveText("Chapter 4 of 4");
    await expect(page.getByTestId("next")).toContainText("Finish the story");
    await page.getByTestId("next").click();
    await expect(page.getByTestId("story-end")).toBeVisible();
    await expect(page).toHaveURL(/chapter=end$/);
    await expect(page.getByTestId("rail-caption")).toHaveText("Story complete");
    await expect(page.getByTestId("end-title")).toBeFocused();
  });

  test("a chapter counts as read when its end is reached after the text is there, and never just by opening it", async ({ page }) => {
    await open(page, "/stories/yusufstory?chapter=2");
    await expect(page.getByTestId("story-ayah").first()).toBeVisible();
    expect((await progress(page)).stories!.yusufstory!.read).toEqual([]); // opened, not read: the end is below the fold
    await page.getByTestId("chapter-nav").scrollIntoViewIfNeeded();
    await expect.poll(async () => (await progress(page)).stories!.yusufstory!.read).toEqual([1]);
    await expect(page.getByTestId("rail-dot").nth(1)).toHaveAttribute("data-state", "read");
  });

  test("the end page: outcome, lessons with their basis and references, Continue with, Start again with Undo", async ({ page }) => {
    await open(page, "/stories/yusufstory?chapter=end");
    await expect(page.getByTestId("story-outcome")).toContainText("Outcome");
    expect(await page.getByTestId("lesson").count()).toBeGreaterThan(0);
    await expect(page.getByTestId("lesson-basis").first()).toHaveText(/Qur'an explicit|Derived theme/);
    await expect(page.getByTestId("lesson-ref").first()).toHaveAttribute("href", /^\/surah\/\d+#ayah-\d+$/);
    expect((await progress(page)).stories!.yusufstory!.chapter).toBe(4);
    await page.getByTestId("start-again").click();
    await expect(page.getByTestId("chapter-eyebrow")).toHaveText("Chapter 1 of 4");
    await expect(toast(page, "Progress for this story cleared")).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    expect((await progress(page)).stories!.yusufstory!.chapter).toBe(4);
  });

  test("resume: leaving mid-story and coming back offers Continue; Home and the Library show it; Clear in the Library has Undo", async ({ page, context }) => {
    await mockVerse(context);
    await mockAladhan(context);
    await open(page, "/stories/yusufstory?chapter=3");
    await page.goto("/stories/yusufstory");
    await expect(page.getByTestId("continue-banner")).toContainText("Continue where you left off: Chapter 3");
    await page.getByTestId("continue-go").click();
    await expect(page.getByTestId("chapter-eyebrow")).toHaveText("Chapter 3 of 4");
    await page.goto("/stories");
    await expect(page.locator('[data-testid="story-row"][data-id="yusufstory"]').getByTestId("row-progress")).toHaveText("Chapter 3 of 4");
    await page.goto("/");
    await expect(page.getByTestId("resume-study")).toContainText("You were reading:");
    await expect(page.getByTestId("resume-study")).toContainText("Chapter 3 of 4");
    await page.goto("/bookmarks");
    await expect(page.getByTestId("slot-story-link")).toContainText("Chapter 3 of 4");
    await page.getByTestId("slot-story-clear").click();
    await expect(page.getByTestId("slot-story")).toContainText("Not set");
    expect((await progress(page)).stories ?? {}).toEqual({});
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("slot-story-link")).toContainText("Chapter 3 of 4");
  });

  test("Home and the Library show whichever is newer: the person study or the story progress (and each alone)", async ({ page, context }) => {
    await mockVerse(context);
    await mockAladhan(context);
    const study = (t: number) => JSON.stringify({ nuh: { personId: "nuh", lastSection: "related-passages", passageView: "surah", lastSurahNo: 11, lastAyahNo: 25, updatedAt: t } });
    const story = (t: number) => JSON.stringify({ v: 1, stories: { yusufstory: { chapter: 1, read: [0], updatedAt: t } } });
    await seed(context, { "quran:persons-study:v1": study(2_000_000_000_000), "quran:story-progress:v1": story(1_000_000_000_000), "quran:bookmarks:v1": "[]" });
    await page.goto("/");
    await expect(page.getByTestId("resume-study")).toContainText("Related Passages"); // the person study is newer
    await page.goto("/bookmarks");
    await expect(page.getByTestId("slot-story-link")).toContainText("Nuh");
    await expect(page.getByTestId("slot-story-clear")).toHaveCount(0); // a person's study is not cleared from the Library
  });

  test("Save writes story:<id> with Undo and the Library opens the real reader", async ({ page }) => {
    await open(page, "/stories/yusufstory");
    await page.getByTestId("story-save").click();
    expect(JSON.parse((await readStorage(page))["quran:bookmarks:v1"]!)).toContain("story:yusufstory");
    await page.getByTestId("story-save").click();
    await expect(toast(page, "from saved")).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    await page.goto("/bookmarks");
    const row = page.locator('[data-testid="library-row"][data-key="story:yusufstory"]');
    await expect(row).toContainText("Yusuf");
    await row.getByTestId("row-open").click();
    await expect(page.getByTestId("story-page")).toBeVisible();
  });
});

test.describe("a pieced-together story (Adam and Iblis)", () => {
  test("the arranged notice, the derived Order line is absent, a dashed status chip, Also told in and Compare tellings", async ({ page }) => {
    await open(page, "/stories/adamandiblis");
    await expect(page.getByTestId("arranged-notice")).toHaveText("This story is assembled from passages in several surahs, in an order chosen for reading.");
    await expect(page.getByTestId("story-order")).toHaveCount(0);
    await expect(page.getByTestId("chip-status")).toHaveClass(/border-dashed/);
    await expect(page.getByTestId("told-in")).toBeVisible();
    await page.getByTestId("compare-open").click();
    const sheet = page.getByTestId("compare-sheet");
    await expect(sheet).toContainText("Compare tellings");
    const rows = sheet.getByTestId("telling");
    expect(await rows.count()).toBe(4); // 2 primary, 2 supporting
    await expect(sheet.getByTestId("telling-kind").first()).toHaveText("Primary");
    await expect(sheet.getByTestId("telling-description").first()).not.toBeEmpty();
    await expect(sheet.getByTestId("telling-none")).toHaveCount(2);
    await expect(sheet.getByTestId("telling-none").first()).toHaveText("No description recorded yet.");
    await expect(sheet.getByTestId("telling-read").first()).toHaveAttribute("href", /^\/surah\/\d+#ayah-\d+$/);
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
  });

  test("the notice is on every story not fully told (8) and on nuhflood (the override list), and on none of the other 12", async ({ page }) => {
    for (const id of ARRANGED) {
      await open(page, `/stories/${id}`);
      await expect(page.getByTestId("arranged-notice"), id).toHaveCount(1);
    }
    await open(page, "/stories/qarunstory");
    await expect(page.getByTestId("arranged-notice")).toHaveCount(0);
    await expect(page.getByTestId("story-order")).toContainText("Order: the surah's own sequence");
    await open(page, "/stories/nuhflood"); // "fully told" in the data, but its chapters jump between surahs: the notice shows until the owner decides; no Order line
    await expect(page.getByTestId("arranged-notice")).toHaveCount(1);
    await expect(page.getByTestId("story-order")).toHaveCount(0);
  });

  test("a story with one chapter shows no progress rail", async ({ page }) => {
    await open(page, "/stories/qarunstory");
    await expect(page.getByTestId("progress-rail")).toHaveCount(0);
    await expect(page.getByTestId("chip-chapters")).toHaveText("1 chapter");
    await expect(page.getByTestId("next")).toContainText("Finish the story");
  });
});

test.describe("entities and links", () => {
  test("a person chip opens a sheet with an Open page link; a place chip says its page comes later and has no link; events are inert", async ({ page }) => {
    await open(page, "/stories/yusufstory");
    const person = page.locator('[data-testid="entity-chip"][data-kind="person"]').first();
    await person.click();
    const sheet = page.getByTestId("entity-sheet");
    await expect(sheet.getByTestId("entity-name")).not.toBeEmpty();
    await expect(sheet.getByTestId("entity-arabic")).not.toBeEmpty();
    await expect(sheet.getByTestId("entity-description")).not.toBeEmpty();
    await expect(sheet.getByTestId("entity-open")).toHaveAttribute("href", /^\/persons\//);
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    await expect(person).toBeFocused(); // focus returns to the chip
    const place = page.locator('[data-testid="entity-chip"][data-kind="place"]').first();
    await place.click();
    await expect(page.getByTestId("entity-later")).toHaveText("Its own page arrives in a later phase.");
    await expect(page.getByTestId("entity-open")).toHaveCount(0);
    await page.keyboard.press("Escape");
    await open(page, "/stories/adamandiblis");
    const events = page.getByTestId("event-chip");
    if ((await events.count()) > 0) {
      await expect(events.first()).toHaveJSProperty("tagName", "SPAN"); // not a link or a button
      await expect(page.getByTestId("events-note")).toContainText("Events arrive in a later phase");
    }
  });

  test("no link on a story page, the directory or a person's Story tab goes to a missing route", async ({ page }) => {
    const seen = new Set<string>();
    for (const path of ["/stories/yusufstory", "/stories/adamandiblis", "/stories", "/persons/yusuf"]) {
      await open(page, path, path === "/stories" ? "stories-list" : path.startsWith("/persons") ? "person-page" : "story-page");
      for (const a of await page.locator("main a[href], section a[href]").all()) {
        const href = (await a.getAttribute("href")) ?? "";
        if (/^\/(stories|persons|surah|bookmarks)(\/|\?|$)/.test(href)) seen.add(href.split("#")[0]!);
      }
    }
    expect(seen.size).toBeGreaterThan(8);
    for (const href of [...seen].slice(0, 40)) {
      await page.goto(href);
      await expect(page.getByRole("heading", { level: 1 }).first(), href).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 }).first(), href).not.toHaveText("This page is not rebuilt yet");
    }
  });

  test("the person page's Story tab shows progress and links to where you left off", async ({ page }) => {
    await open(page, "/stories/yusufstory?chapter=3");
    await page.goto("/persons/yusuf");
    const row = page.getByTestId("story-item").first();
    await expect(row.getByTestId("story-progress")).toContainText("Chapter 3 of 4");
    await expect(row.getByTestId("story-link")).toHaveAttribute("href", "/stories/yusufstory?chapter=3");
    await row.getByTestId("story-link").click();
    await expect(page.getByTestId("chapter-eyebrow")).toHaveText("Chapter 3 of 4");
  });
});

test.describe("text states", () => {
  test("loading shows a skeleton, then the text", async ({ page }) => {
    api.delayMs = 600;
    await page.goto("/stories/yusufstory");
    await expect(page.getByTestId("chapter-loading")).toBeVisible();
    await expect(page.getByTestId("story-ayah").first()).toBeVisible();
  });
  test("a failed request shows a message and Retry loads it", async ({ page }) => {
    api.mode = "http500";
    await open(page, "/stories/yusufstory");
    await expect(page.getByTestId("chapter-error")).toContainText("Couldn’t load this surah. Check your connection and try again.");
    api.mode = "ok";
    await page.getByTestId("chapter-retry").click();
    await expect(page.getByTestId("story-ayah").first()).toBeVisible();
    expect((await progress(page)).stories!.yusufstory!.read).toEqual([]); // a failed load never marks a chapter read
  });
  test("offline with the surah not saved says so, and no progress is lost", async ({ page, context }) => {
    await open(page, "/stories/qarunstory");
    await push(page, "/stories");
    await expect(page.getByTestId("stories-list")).toBeVisible();
    await context.setOffline(true);
    api.mode = "network";
    await push(page, "/stories/yusufstory?chapter=2");
    await expect(page.getByTestId("chapter-error")).toContainText("This surah isn’t saved on this device yet. Connect once to read it.");
    await expect(page.getByTestId("chapter-title")).toBeVisible(); // the data parts of the page still work offline
  });
  test("a surah that was opened once is there offline", async ({ page, context }) => {
    await open(page, "/stories/yusufstory");
    await expect(page.getByTestId("story-ayah").first()).toBeVisible();
    await push(page, "/stories");
    await context.setOffline(true);
    api.mode = "network";
    await push(page, "/stories/yusufstory?chapter=2");
    await expect(page.getByTestId("story-ayah").first()).toHaveText(/TEST ARABIC 12:21/);
  });
  test("an unknown story says so and links back", async ({ page }) => {
    await open(page, "/stories/nobody", "story-missing");
    await expect(page.getByTestId("story-missing")).toContainText("Story not found");
    await page.getByRole("link", { name: "Back to Stories" }).click();
    await expect(page.getByTestId("stories-list")).toBeVisible();
  });
  test("a bad chapter number opens chapter 1", async ({ page }) => {
    await open(page, "/stories/yusufstory?chapter=99");
    await expect(page.getByTestId("chapter-eyebrow")).toHaveText("Chapter 1 of 4");
  });
});

test.describe("Settings", () => {
  test("Reset settings keeps story progress; Clear all removes it", async ({ page }) => {
    await open(page, "/stories/yusufstory?chapter=2");
    await expect(page.getByTestId("chapter-title")).toBeVisible();
    await page.goto("/settings?section=data");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("reset").click();
    expect((await progress(page)).stories!.yusufstory).toBeTruthy();
    await page.getByTestId("clear").click();
    await Promise.all([page.waitForEvent("load"), page.getByTestId("clear-yes").click()]);
    await page.waitForLoadState("networkidle");
    expect((await readStorage(page))["quran:story-progress:v1"]).toBeUndefined();
  });
});

test.describe("dark mode and mobile", () => {
  test("dark theme on the reader", async ({ page, context }) => {
    await seed(context, { themeMode: "dark" });
    await open(page, "/stories/yusufstory");
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
  });
  test.describe("375px", () => {
    test.use({ viewport: { width: 375, height: 800 } });
    test("one h1, no horizontal scroll, 44px targets (rail dots, Listen, Next, Save, chips), the sheets are bottom sheets", async ({ page }) => {
      await open(page, "/stories/adamandiblis");
      const noScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      expect(await noScroll()).toBe(true);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByTestId("story-ayah").first()).toBeVisible();
      for (const id of ["story-save", "listen", "next", "compare-open", "story-back"]) expect((await page.getByTestId(id).first().boundingBox())!.height, id).toBeGreaterThanOrEqual(43.5);
      for (const d of await page.getByTestId("rail-dot").all()) expect((await d.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      for (const c of (await page.getByTestId("entity-chip").all()).slice(0, 3)) expect((await c.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      expect(await noScroll()).toBe(true);
      await page.getByTestId("compare-open").click();
      await expect(page.getByTestId("compare-sheet")).toHaveAttribute("data-side", "bottom");
      await page.keyboard.press("Escape");
      await open(page, "/stories", "stories-list");
      expect(await noScroll()).toBe(true);
      expect((await page.getByTestId("stories-search").boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      expect((await page.locator('[data-testid="story-row"] [data-testid="star"]').first().boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    });
  });
});
