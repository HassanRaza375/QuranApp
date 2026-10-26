// Phase 12, stage 1: the shared knowledge list and detail, on Peoples & Nations, in a real browser on the production build. The reader's text is the usual
// synthetic one (so the page's Arabic and translation are provably the reader's, never the data's), the audio is the usual recorder, and every request to a
// real API fails the test. See docs/phases/phase-12-knowledge-plan.md.
import { expect, test, type Page } from "@playwright/test";
import { forbidRealApis, freezeClock, mockQuranText, mockVerse, readStorage, seed, stubAudio } from "./mocks";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });

let leaks: string[] = [];
test.beforeEach(async ({ context }) => {
  leaks = await forbidRealApis(context);
  await freezeClock(context);
  await stubAudio(context);
  await mockQuranText(context);
  await mockVerse(context);
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

const A = (page: Page) => page.evaluate(() => ({ ...(window as unknown as { __audio: { srcs: string[] } }).__audio }));
const bookmarks = async (page: Page) => JSON.parse((await readStorage(page))["quran:bookmarks:v1"] ?? "[]") as string[];
const card = (page: Page, id: string) => page.locator(`[data-testid="k-card"][data-id="${id}"]`);
async function openList(page: Page, query = "") {
  await page.goto(`/peoples${query}`);
  await expect(page.getByTestId("k-grid")).toBeVisible();
}
async function openDetail(page: Page, id: string) {
  await page.goto(`/peoples/${id}`);
  await expect(page.getByTestId("k-name")).toBeVisible();
}

test.describe("the list", () => {
  test("14 entries from the data, each with its Arabic name, summary, kind and where it appears; the tab strip marks the module; no request of its own", async ({ page }) => {
    const external: string[] = [];
    page.on("request", (r) => {
      if (!r.url().startsWith("http://localhost:3011") && !r.url().startsWith("data:")) external.push(r.url());
    });
    await openList(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Peoples & Nations");
    await expect(page.locator('[data-testid="k-card"]')).toHaveCount(14);
    await expect(page.getByTestId("k-count")).toHaveText("14 entries");
    await expect(page.getByTestId("ktab-peoples")).toHaveAttribute("aria-current", "page");
    const ad = card(page, "ad");
    await expect(ad).toContainText("'Ad");
    await expect(ad.getByTestId("k-type")).toHaveText("Tribes");
    await expect(ad.getByTestId("k-ayahs")).toHaveText("28 ayahs in 7 surahs");
    await expect(ad.locator(".ar")).not.toBeEmpty();
    await expect(ad.getByTestId("thread")).toBeVisible();
    await expect(ad.getByTestId("k-basis")).toHaveCount(0); // "the Qur'an states it" is not tagged
    await expect(card(page, "sabbathbreakers").getByTestId("k-basis")).toHaveText("Identified through Qur'anic context");
    expect(external).toEqual([]); // the list reads bundled data only
    expect(await page.locator("body").innerText()).not.toMatch(/verified|reviewed/i);
  });

  test("the filter box reads names, Arabic, themes and references; the kind menu and Reset work; the state is in the URL and survives a reload", async ({ page }) => {
    await openList(page);
    const filter = page.getByTestId("k-filter");
    await filter.fill("thamud");
    await expect(page.locator('[data-testid="k-card"]')).toHaveCount(1);
    await expect(card(page, "thamud")).toBeVisible();
    await expect(page).toHaveURL(/q=thamud/);
    await page.reload();
    await expect(filter).toHaveValue("thamud");
    await expect(page.locator('[data-testid="k-card"]')).toHaveCount(1);

    await filter.fill("destruction by wind"); // a theme
    await expect(card(page, "ad")).toBeVisible();
    await filter.fill("7:65"); // a reference
    await expect(card(page, "ad")).toBeVisible();
    await expect(page.getByTestId("k-count")).toContainText("of 14");
    await filter.fill("7:65-72"); // a range
    await expect(card(page, "ad")).toBeVisible();
    await filter.fill("2:999"); // an ayah that does not exist is not a reference: plain text, nothing found
    await expect(page.getByTestId("k-empty")).toContainText("Nothing matches “2:999”");
    await filter.fill("69:5"); // an ayah that exists but none of the entries points at... or does
    await expect(page.getByTestId("k-count")).toBeVisible();

    await page.getByTestId("k-reset").click();
    await expect(page.locator('[data-testid="k-card"]')).toHaveCount(14);
    await page.getByRole("button", { name: /^All$|Kind/ }).first().click();
    await page.getByRole("menuitemradio", { name: "Tribes", exact: true }).or(page.getByRole("option", { name: "Tribes", exact: true })).click();
    await expect(page.locator('[data-testid="k-card"]')).toHaveCount(3);
    await expect(page).toHaveURL(/t=tribe/);
  });

  test("a reference with no entry says so, and Reset brings everything back", async ({ page }) => {
    await page.goto("/peoples?q=114:6");
    await expect(page.getByTestId("k-empty")).toContainText("Nothing here points at 114:6");
    await page.getByTestId("k-empty-reset").click();
    await expect(page.locator('[data-testid="k-card"]')).toHaveCount(14);
  });

  test("Save stars an entry under its legacy key (community:ad), with Undo; the Saved filter shows only saved ones", async ({ page }) => {
    await openList(page);
    await card(page, "ad").getByTestId("star").click();
    expect(await bookmarks(page)).toEqual(["community:ad"]);
    await page.getByTestId("k-saved").click();
    await expect(page.locator('[data-testid="k-card"]')).toHaveCount(1);
    await expect(page).toHaveURL(/saved=1/);
    await card(page, "ad").getByTestId("star").click(); // remove: with Saved on, nothing is left
    expect(await bookmarks(page)).toEqual([]);
    await expect(page.getByTestId("k-empty")).toContainText("Nothing saved yet");
    await page.getByRole("button", { name: "Undo" }).click();
    expect(await bookmarks(page)).toEqual(["community:ad"]);
    await expect(card(page, "ad")).toBeVisible();
  });

  test("a card opens its page; the card is one link, the star is another control, and both work from the keyboard", async ({ page }) => {
    await openList(page);
    await card(page, "ad").getByTestId("k-card-link").focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/peoples\/ad$/);
    await expect(page.getByTestId("k-name")).toHaveText("'Ad");
    await expect(page).toHaveTitle("'Ad · Peoples & Nations · Quran App");
  });
});

test.describe("the detail page", () => {
  test("the head, where it appears (thread and direct mentions that open the reader), the kind, Save and Play all", async ({ page }) => {
    await openDetail(page, "ad");
    await expect(page.getByTestId("k-summary")).toContainText("An ancient people");
    await expect(page.getByTestId("k-arabic")).not.toBeEmpty();
    await expect(page.getByTestId("k-type")).toHaveText("Tribes");
    await expect(page.getByTestId("k-basis")).toHaveCount(0);
    await expect(page.getByTestId("k-where-count")).toHaveText("28 ayahs in 7 surahs");
    await expect(page.getByTestId("thread-mark")).toHaveCount(28);
    const first = page.getByTestId("k-mention").first();
    await expect(first).toContainText("7:65");
    await expect(first).toHaveAttribute("href", "/surah/7#ayah-65");
    await expect(page.getByTestId("k-back")).toHaveAttribute("href", "/peoples");
    await page.getByTestId("k-save").click();
    expect(await bookmarks(page)).toEqual(["community:ad"]);
    await expect(page.getByTestId("k-save")).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Undo" }).click();
    expect(await bookmarks(page)).toEqual([]);
  });

  test("the ayahs: a short passage is open and shows the reader's Arabic and translation; a long one waits behind a button; nothing comes from the data files", async ({ page }) => {
    await openDetail(page, "ad");
    const passages = page.getByTestId("k-passage");
    await expect(passages).toHaveCount(3);
    await expect(passages.nth(0)).toContainText("Hud's Mission to 'Ad");
    await expect(passages.nth(0).getByTestId("k-passage-open")).toHaveText(/Show the 8 ayahs/);
    await expect(passages.nth(2).getByTestId("k-ayah")).toHaveCount(5); // 69:4-8 is short: open
    await expect(passages.nth(2).getByTestId("k-ayah").first().locator(".ar")).toContainText("TEST ARABIC 69:4"); // the mock reader's text
    await expect(passages.nth(2).getByTestId("k-translation").first()).toHaveText("Test English 69:4");
    await passages.nth(0).getByTestId("k-passage-open").click();
    await expect(passages.nth(0).getByTestId("k-ayah")).toHaveCount(8);
    await expect(passages.nth(0).getByTestId("k-ayah").first().locator(".ar")).toContainText("TEST ARABIC 7:65");
    await expect(passages.nth(0).getByTestId("k-open-ayah").first()).toHaveAttribute("href", "/surah/7#ayah-65");
    expect(await page.locator("body").innerText()).not.toMatch(/verified|reviewed|manually|directMentions/i);
  });

  test("Play on an ayah plays that ayah; Play all plays the passages in order as one queue", async ({ page }) => {
    await openDetail(page, "ad");
    await page.getByTestId("k-passage").nth(2).getByTestId("k-play-ayah").first().click();
    await expect.poll(async () => (await A(page)).srcs.at(-1)).toBe("https://audio.test/Data/1/69_4.mp3");
    await page.getByTestId("k-play-all").click();
    await expect.poll(async () => (await A(page)).srcs.at(-1)).toBe("https://audio.test/Data/1/7_65.mp3");
    await expect(page.getByTestId("k-play-all")).toHaveText(/Pause/);
    await expect(page.getByTestId("mini-title")).toHaveText("'Ad");
  });

  test("Connected (what this entry's own data names) and Referenced by (only another entry's data names this one); every link opens its page", async ({ page }) => {
    await openDetail(page, "ad");
    await expect(page.getByTestId("k-connected-persons").getByTestId("k-link")).toHaveAttribute("href", "/persons/hud");
    await expect(page.getByTestId("k-connected-places").getByTestId("k-link").first()).toHaveAttribute("href", /^\/places\//); // every module has its page now
    await expect(page.getByTestId("k-referenced-section")).toContainText("Entries whose own data names 'Ad. 'Ad’s data does not name them back.");
    await expect(page.getByTestId("k-referenced-themes")).toContainText("Arrogance");
    await expect(page.getByTestId("k-referenced-events")).toContainText("Destruction of 'Ad");
    await page.getByTestId("k-connected-persons").getByTestId("k-link").click();
    await expect(page).toHaveURL(/\/persons\/hud$/);
  });

  test("a weaker basis is labelled in the legacy's words; the module's own sections and the sources show", async ({ page }) => {
    await openDetail(page, "sabbathbreakers");
    await expect(page.getByTestId("k-basis")).toHaveText("Identified through Qur'anic context");
    await openDetail(page, "ad");
    await expect(page.getByTestId("k-section-outcome")).toContainText("Destroyed by a violent wind");
    await expect(page.getByTestId("k-section-details")).toBeVisible();
    await expect(page.getByTestId("k-themes")).toContainText("Destruction by wind");
    await expect(page.getByTestId("k-sources")).toContainText("Qur'an");
  });

  test("offline and not saved: the text says so with Try again, and everything else on the page still works", async ({ page, context }) => {
    await page.route(/quranapi\.pages\.dev\/api\/\d+\.json/, (route) => route.abort("internetdisconnected"));
    await openDetail(page, "ad");
    const unavailable = page.getByTestId("k-passage-unavailable").first();
    await expect(unavailable).toContainText("Couldn’t load this text.");
    await expect(page.getByTestId("k-where-count")).toBeVisible();
    await context.setOffline(true);
    await unavailable.getByTestId("k-passage-retry").click();
    await expect(unavailable).toContainText("This text isn’t on your device yet. Connect to load it.");
    await expect(page.getByTestId("k-connected-section")).toBeVisible();
  });

  test("an id that is not in the data says so instead of a blank page", async ({ page }) => {
    await page.goto("/peoples/nobody");
    await expect(page.getByTestId("k-missing")).toContainText("No such entry");
    await expect(page.getByRole("link", { name: "Back to Peoples & Nations" })).toBeVisible();
  });
});

test.describe("what links to it", () => {
  test("a story's people-group chip opens the page, and a person's page lists what references them", async ({ page }) => {
    await page.goto("/stories/nuhflood");
    await page.locator('[data-testid="entity-chip"][data-kind="community"]').first().click();
    await expect(page.getByTestId("entity-open")).toHaveAttribute("href", "/peoples/peopleofnuh");
    await page.getByTestId("entity-open").click();
    await expect(page).toHaveURL(/\/peoples\/peopleofnuh$/);
    await page.goto("/persons/hud?tab=family");
    await expect(page.getByTestId("referenced-section")).toContainText("Referenced by");
  });

  test("the Library opens legacy bookmarks of this kind (community:<id>) with the name and the module", async ({ page, context }) => {
    await seed(context, { "quran:bookmarks:v1": JSON.stringify(["community:ad", "community:nobody"]) });
    await page.goto("/bookmarks");
    const row = page.locator('[data-testid="library-row"][data-key="community:ad"]');
    await expect(row).toBeVisible();
    await expect(row.getByTestId("row-open")).toHaveText("'Ad");
    await expect(row.getByTestId("row-open")).toHaveAttribute("href", "/peoples/ad");
    await expect(row.getByTestId("row-detail")).toContainText("Peoples & Nations");
    await expect(page.locator('[data-testid="library-row"][data-key="community:nobody"]')).toBeVisible(); // an id the data lacks still gets a row
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test("375 px: no sideways scroll on the list or the detail, and the controls are 44 px", async ({ page }) => {
    await openList(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    for (const id of ["k-saved"]) expect((await page.getByTestId(id).boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    expect((await card(page, "ad").getByTestId("star").boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    await openDetail(page, "ad");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    for (const id of ["k-save", "k-play-all"]) expect((await page.getByTestId(id).boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    // the Arabic name comes first on a phone, above the English name
    const arabicY = (await page.getByTestId("k-arabic").boundingBox())!.y;
    const nameY = (await page.getByTestId("k-name").boundingBox())!.y;
    expect(arabicY).toBeLessThan(nameY);
  });
});
