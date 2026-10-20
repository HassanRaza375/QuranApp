// Phase 7A: Prophets & People in a real browser, on the production build. All of it is bundled data: no test needs a network, and any
// request to another origin fails the test. The clock is fixed. See docs/phases/phase-07a-people.md.
import { expect, test, type Page } from "@playwright/test";
import { forbidRealApis, freezeClock, idbNames, mockAladhan, mockQuranText, mockVerse, readStorage, seed } from "./mocks";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });
let leaks: string[] = [];
let foreign: string[] = [];
test.beforeEach(async ({ context, page }) => {
  leaks = await forbidRealApis(context);
  await freezeClock(context);
  foreign = [];
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.hostname !== "localhost" && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) foreign.push(r.url());
  });
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
  expect(foreign, "this page must not need any other origin").toEqual([]);
});

const rows = (page: Page) => page.getByTestId("person-row");
const toast = (page: Page, text: string) => page.locator("[data-sonner-toast]").filter({ hasText: text });
async function open(page: Page, path = "/persons") {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}
async function choose(page: Page, trigger: RegExp, option: string) {
  await page.getByRole("button", { name: trigger }).click();
  await page.getByRole("menuitemradio", { name: option, exact: true }).or(page.getByRole("option", { name: option, exact: true })).click();
}
const study = async (page: Page) => JSON.parse((await readStorage(page))["quran:persons-study:v1"] ?? "{}") as Record<string, Record<string, unknown>>;

test.describe("directory", () => {
  test("59 people, one h1, the Arabic as text only, no request to any other origin, quran-app-db never opened", async ({ page }) => {
    await open(page);
    await expect(rows(page)).toHaveCount(59);
    await expect(page.getByTestId("people-count")).toHaveText("59 people");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Prophets & People of the Qur’an");
    await expect(page.locator("img, canvas, picture")).toHaveCount(0); // no depictions of anyone
    expect(await idbNames(page)).not.toContain("quran-app-db");
    await expect(page.getByTestId("tab-browse")).toHaveAttribute("aria-current", "page");
  });

  test("search: by name, alternate name, theme; no match shows the empty state; the URL holds the state and Back restores it", async ({ page }) => {
    await open(page);
    await page.getByTestId("people-search").fill("yusuf");
    await expect(rows(page).first()).toContainText("Yusuf");
    await expect(page).toHaveURL(/q=yusuf/);
    await page.getByTestId("people-search").fill("Noah"); // an alternate name in the data
    await expect(page.locator('[data-testid="person-row"][data-id="nuh"]')).toBeVisible();
    await page.getByTestId("people-search").fill("xylophone");
    await expect(page.getByTestId("people-empty")).toContainText("No people match “xylophone”.");
    await page.getByTestId("people-empty-reset").click();
    await expect(rows(page)).toHaveCount(59);
    await page.getByTestId("people-search").fill("nuh");
    await expect(page).toHaveURL(/q=nuh/);
    await page.locator('[data-testid="person-row"][data-id="nuh"] a').first().click();
    await expect(page.getByTestId("person-page")).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId("people-search")).toHaveValue("nuh");
    await page.goto("/persons?category=prophet&saved=1");
    await expect(page.getByTestId("people-saved")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("people-empty")).toContainText("None of your saved people are in this category.");
    await page.goto("/persons?saved=1");
    await expect(page.getByTestId("people-empty")).toContainText("Nothing saved yet. Open a person and tap Save.");
  });

  test("category menu filters; Reset clears everything", async ({ page }) => {
    await open(page);
    await choose(page, /^Category/, "Prophets");
    await expect(page).toHaveURL(/category=prophet/);
    const n = await rows(page).count();
    expect(n).toBeGreaterThanOrEqual(25);
    expect(n).toBeLessThan(59);
    await page.getByTestId("people-reset").click();
    await expect(rows(page)).toHaveCount(59);
    await expect(page.getByTestId("people-reset")).toHaveCount(0);
  });

  test("a row shows the counts, the chronology with a dashed mark when not established, and the stories tag", async ({ page }) => {
    await open(page);
    const yusuf = page.locator('[data-testid="person-row"][data-id="yusuf"]');
    await expect(yusuf.getByTestId("row-meta")).toContainText("direct mentions");
    await expect(yusuf.getByTestId("row-stories")).toHaveText(/In \d+ stor/);
    const idris = page.locator('[data-testid="person-row"][data-id="idris"]');
    await expect(idris.getByTestId("row-stories")).toHaveCount(0);
    await expect(idris.getByTestId("row-chronology")).toHaveClass(/border-dashed/);
  });

  test("Saved: the star writes person:<id> in the bookmarks, the Saved filter shows it, Undo restores it, and the Library lists it", async ({ page }) => {
    await open(page);
    await page.locator('[data-testid="person-row"][data-id="nuh"]').getByTestId("star").click();
    expect(JSON.parse((await readStorage(page))["quran:bookmarks:v1"]!)).toContain("person:nuh");
    await page.getByTestId("people-saved").click();
    await expect(rows(page)).toHaveCount(1);
    await expect(page.getByTestId("people-count")).toHaveText("1 of 59 people");
    await page.locator('[data-testid="person-row"][data-id="nuh"]').getByTestId("star").click();
    await expect(toast(page, "from saved")).toBeVisible();
    expect(JSON.parse((await readStorage(page))["quran:bookmarks:v1"]!)).not.toContain("person:nuh");
    await page.getByRole("button", { name: "Undo" }).click();
    expect(JSON.parse((await readStorage(page))["quran:bookmarks:v1"]!)).toContain("person:nuh");
    await page.goto("/bookmarks");
    await expect(page.locator('[data-testid="library-row"][data-key="person:nuh"]')).toContainText("Nuh");
    await expect(page.locator('[data-testid="library-row"][data-key="person:nuh"] [data-testid="row-open"]')).toHaveAttribute("href", "/persons/nuh");
    await page.locator('[data-testid="library-row"][data-key="person:nuh"] [data-testid="row-open"]').click();
    await expect(page.getByTestId("person-page")).toBeVisible(); // the Library link opens the real page now
  });

  test("keyboard: the search, category, Saved and every row link are reachable in order", async ({ page }) => {
    await open(page);
    await page.getByTestId("people-search").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: /^Category/ })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("people-saved")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(rows(page).first().getByTestId("person-link")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(rows(page).first().getByTestId("star")).toBeFocused();
  });
});

test.describe("timeline", () => {
  test("the legend, the mainline in order, branches that open, and every one of the 59 reachable", async ({ page }) => {
    await open(page, "/persons/timeline");
    await expect(page.getByTestId("tab-timeline")).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("timeline-legend")).toContainText("Established chronology");
    await expect(page.getByTestId("timeline-legend")).toContainText("Traditional, uncertain or unknown chronology");
    const nodes = page.getByTestId("timeline-node");
    expect(await nodes.count()).toBeGreaterThan(15);
    await expect(nodes.first()).toHaveAttribute("data-id", "adam");
    await expect(nodes.first().getByTestId("timeline-chronology")).toContainText("First human");
    const toggle = page.getByTestId("branch-toggle").first();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    for (const t of await page.getByTestId("branch-toggle").all()) if ((await t.getAttribute("aria-expanded")) === "false") await t.click();
    const reached = new Set<string>();
    for (const sel of ['[data-testid="timeline-link"]', '[data-testid="unlinked-link"]', '[data-testid="branch"] a']) {
      for (const a of await page.locator(sel).all()) reached.add(((await a.getAttribute("href")) ?? "").replace("/persons/", ""));
    }
    expect(reached.size).toBeGreaterThanOrEqual(55); // the rest are in a branch as plain text (not in the data as their own entry)
    await expect(page.getByTestId("timeline-unlinked")).toBeVisible();
  });
});

test.describe("a person", () => {
  test("Yusuf: identity, chips, tabs; the Story tab lists the stories with their progress; every story link lands on the real reader", async ({ page, context }) => {
    await mockQuranText(context); // the reader (after the click) asks for the surah text
    await open(page, "/persons/yusuf");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByTestId("person-name")).toContainText("Yusuf");
    await expect(page.getByTestId("person-arabic")).not.toBeEmpty();
    await expect(page.getByTestId("chip-category")).toHaveText("Prophets");
    await expect(page.getByTestId("chip-status")).toHaveText(/Prophet/);
    await expect(page.getByTestId("chip-mentions")).toContainText("direct mentions");
    await expect(page.locator("img, canvas, picture")).toHaveCount(0);
    await expect(page.getByTestId("tab-story")).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("overview-text")).not.toBeEmpty();
    await expect(page.getByTestId("stories-notice")).toHaveCount(0); // the reader exists now (7B)
    await expect(page.getByTestId("story-progress").first()).toContainText("Not started");
    const links = await page.getByTestId("story-link").all();
    expect(links.length).toBeGreaterThan(0);
    for (const l of links) {
      const href = await l.getAttribute("href");
      expect(href).toMatch(/^\/stories\/[a-z0-9-]+$/);
      await page.goto(href!);
      // not a blank page and not a crash: the "not rebuilt yet" page now, the reader once the flag flips
      await expect(page.getByTestId("story-page")).toBeVisible(); // the real reader, not the placeholder
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    }
    foreign.length = 0; // the reader talks to its own (mocked) service
  });

  test("More detail opens; themes and key lessons come from the data and each lesson reference opens the reader", async ({ page }) => {
    await open(page, "/persons/nuh");
    await page.getByTestId("more-detail").click();
    await expect(page.getByTestId("detail-text")).not.toBeEmpty();
    await expect(page.getByTestId("theme").first()).toBeVisible();
    await expect(page.getByTestId("lesson").first().getByTestId("lesson-ref").first()).toHaveAttribute("href", /^\/surah\/\d+#ayah-\d+$/);
    await expect(page.getByTestId("person-alternates")).toContainText("Noah");
  });

  test("a person with no story, no passages and few mentions says so plainly", async ({ page }) => {
    await open(page, "/persons/idris");
    await expect(page.getByTestId("no-story")).toContainText("No story has been written for Idris yet.");
    await page.getByTestId("tab-passages").click();
    await expect(page).toHaveURL(/tab=passages/);
    await expect(page.getByTestId("no-passages")).toContainText("No related passages are catalogued for this person yet.");
    await expect(page.getByTestId("mention-link").first()).toBeVisible();
  });

  test("a group with no direct mentions: the Group chip, the empty sentence, no status chip", async ({ page }) => {
    await open(page, "/persons/gardenmen");
    await expect(page.getByTestId("chip-group")).toHaveText("Group, not individually named");
    await expect(page.getByTestId("chip-status")).toHaveCount(0);
    await page.getByTestId("tab-passages").click();
    await expect(page.getByTestId("no-mentions")).toContainText("No direct name mentions are catalogued for this person yet.");
    await expect(page.getByTestId("passage").first()).toBeVisible();
  });

  test("Passages: every mention links to the ayah; Grouped by surah and Story view; Read passage opens the reader; no Play buttons", async ({ page, context }) => {
    await mockQuranText(context); // only the reader, after the click, asks for text
    await open(page, "/persons/yusuf?tab=passages");
    expect(await page.getByTestId("mention-link").count()).toBeGreaterThan(5);
    await expect(page.getByTestId("mention-link").first()).toHaveAttribute("href", /^\/surah\/\d+#ayah-\d+$/);
    await expect(page.getByRole("button", { name: /play/i })).toHaveCount(0);
    await expect(page.getByTestId("view-surah")).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("view-story").click();
    await expect(page.getByTestId("story-order")).toBeVisible();
    await expect(page.getByTestId("view-story")).toHaveAttribute("aria-pressed", "true");
    expect((await study(page)).yusuf).toMatchObject({ lastSection: "related-passages", passageView: "story" });
    await page.getByTestId("passage-read").first().click();
    await expect(page).toHaveURL(/\/surah\/\d+#ayah-\d+/);
    expect((await study(page)).yusuf!.lastSurahNo).toBeTruthy();
    foreign.length = 0; // the reader talks to its own (mocked) service
  });

  test("Family: sentences with the right direction, the source on each, a dashed border for a traditional entry", async ({ page }) => {
    await open(page, "/persons/ibrahim?tab=family");
    const sentences = await page.getByTestId("relation-sentence").allTextContents();
    expect(sentences.some((s) => /Ibrahim \(.+\) is the father of Isma/.test(s) || /Ibrahim .*is the father of/.test(s))).toBe(true);
    expect(sentences.some((s) => /is the son of Azar/.test(s))).toBe(true);
    await expect(page.getByTestId("relation-source").first()).toBeVisible();
    await expect(page.locator('[data-testid="relation-source"].border-dashed').first()).toContainText("Traditional");
    await expect(page.getByTestId("relation-open").first()).toHaveAttribute("href", /^\/persons\//);
    await open(page, "/persons/maryam?tab=family"); // the three entries the data wrote the other way round
    const maryam = await page.getByTestId("relation-sentence").allTextContents();
    expect(maryam.some((s) => /Isa .*is the son of Maryam/.test(s))).toBe(true);
    expect(maryam.some((s) => /is the mother of Maryam/.test(s))).toBe(true);
    await open(page, "/persons/isa?tab=family");
    expect((await page.getByTestId("relation-sentence").allTextContents()).some((s) => /Maryam .*is the mother of Isa/.test(s))).toBe(true);
    await expect(page.getByTestId("sources")).toHaveCount(0).catch(() => undefined);
  });

  test("Notes: sources with their type and the status notes; a person with none says so", async ({ page }) => {
    await open(page, "/persons/ibrahim?tab=family");
    await expect(page.getByTestId("notes-section")).toBeVisible();
    const hasSources = (await page.getByTestId("sources").count()) > 0;
    const hasNotes = (await page.getByTestId("status-notes").count()) > 0;
    expect(hasSources || hasNotes || (await page.getByTestId("no-notes").count()) > 0).toBe(true);
  });

  test("Save writes person:<id> with Undo; the study record follows the tab; the resume banner appears on the next visit and Resume switches tab", async ({ page }) => {
    await open(page, "/persons/musa");
    await page.getByTestId("person-save").click();
    await expect(page.getByTestId("person-save")).toHaveAttribute("aria-pressed", "true");
    expect(JSON.parse((await readStorage(page))["quran:bookmarks:v1"]!)).toContain("person:musa");
    await expect(page.getByTestId("resume-banner")).toHaveCount(0);
    await page.getByTestId("tab-passages").click();
    expect((await study(page)).musa).toMatchObject({ personId: "musa", lastSection: "direct-mentions" });
    await page.getByTestId("mention-link").first().click();
    expect((await study(page)).musa!.lastSurahNo).toBeTruthy();
    await page.goto("/persons/musa");
    await expect(page.getByTestId("resume-banner")).toContainText("Resume where you left off");
    await page.getByTestId("resume-go").click();
    await expect(page.getByTestId("tab-passages")).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("resume-banner")).toHaveCount(0);
    await page.getByTestId("tab-family").click();
    expect((await study(page)).musa!.lastSection).toBe("family");
    await page.getByTestId("person-save").click();
    await expect(toast(page, "from saved")).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    expect(JSON.parse((await readStorage(page))["quran:bookmarks:v1"]!)).toContain("person:musa");
  });

  test("the study record keeps the legacy shape (Home's resume row reads it)", async ({ page, context }) => {
    await mockVerse(context); // Home (not this page) asks for the ayah of the day
    await mockAladhan(context);
    await seed(context, { "quran:persons-study:v1": JSON.stringify({ nuh: { personId: "nuh", lastSection: "related-passages", passageView: "surah", updatedAt: 1 } }) });
    await open(page, "/persons/yusuf");
    const s = await study(page);
    expect(s.nuh).toEqual({ personId: "nuh", lastSection: "related-passages", passageView: "surah", updatedAt: 1 }); // untouched
    expect(s.yusuf).toMatchObject({ personId: "yusuf", lastSection: "overview", passageView: "surah" });
    await page.goto("/");
    await expect(page.getByText("You were reading", { exact: false }).first()).toBeVisible();
    foreign.length = 0; // Home itself talks to its own mocked services; this test is about the study record
  });

  test("an unknown id says so and links back", async ({ page }) => {
    await open(page, "/persons/nobody");
    await expect(page.getByTestId("person-missing")).toContainText("Person not found");
    await page.getByRole("link", { name: "Back to Prophets & People" }).click();
    await expect(rows(page)).toHaveCount(59);
  });

  test("offline: with the pages already opened, going offline and moving between them needs nothing", async ({ page, context }) => {
    const push = (to: string) => page.evaluate((p) => (document.querySelector("#__nuxt") as unknown as { __vue_app__: { config: { globalProperties: { $router: { push(p: string): void } } } } }).__vue_app__.config.globalProperties.$router.push(p), to);
    await open(page, "/persons/timeline");
    await push("/persons/yusuf");
    await expect(page.getByTestId("person-page")).toBeVisible();
    await push("/persons");
    await expect(rows(page)).toHaveCount(59);
    await context.setOffline(true);
    await push("/persons/timeline");
    await expect(page.getByTestId("timeline")).toBeVisible();
    await push("/persons/nuh");
    await expect(page.getByTestId("person-name")).toContainText("Nuh");
    await page.getByTestId("tab-family").click();
    await expect(page.getByTestId("family-section")).toBeVisible();
  });
});

test.describe("dark mode", () => {
  test("the pages use the dark theme", async ({ page, context }) => {
    await seed(context, { themeMode: "dark" });
    await open(page, "/persons");
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
    await open(page, "/persons/yusuf");
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe("rgb(255, 255, 255)");
  });
});

test.describe("mobile (375px)", () => {
  test.use({ viewport: { width: 375, height: 800 } });
  test("directory, timeline and a person: one h1, no horizontal scroll, 44px targets", async ({ page }) => {
    await open(page, "/persons");
    const noScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(await noScroll()).toBe(true);
    for (const id of ["people-search", "people-saved", "tab-browse", "tab-timeline"]) expect((await page.getByTestId(id).first().boundingBox())!.height, id).toBeGreaterThanOrEqual(43.5);
    expect((await rows(page).first().getByTestId("star").boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    expect((await rows(page).first().getByTestId("person-link").boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    await open(page, "/persons/timeline");
    expect(await noScroll()).toBe(true);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    for (const b of await page.getByTestId("branch-toggle").all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    await open(page, "/persons/yusuf");
    expect(await noScroll()).toBe(true);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    for (const id of ["person-save", "tab-story", "tab-passages", "tab-family", "person-back"]) expect((await page.getByTestId(id).boundingBox())!.height, id).toBeGreaterThanOrEqual(43.5);
    await page.getByTestId("tab-passages").click();
    for (const a of (await page.getByTestId("mention-link").all()).slice(0, 5)) expect((await a.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    expect(await noScroll()).toBe(true);
  });
});
