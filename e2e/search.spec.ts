// Phase 10: Search in a real browser, on the production build. The upstream search API is answered from REAL recorded responses
// (tests/fixtures/alquran-search-*.json), every unmocked request to a real API fails the test, and the reader's text is the synthetic mock.
// See docs/phases/phase-10-search.md.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { juzOfAyah } from "../app/lib/quranMeta";
import { SURAH_ROWS } from "../app/data/quranMeta.generated";
import { forbidRealApis, freezeClock, idbNames, mockQuranText, mockSearch, RABBI_TEXT, RAHMAT_TEXT, readStorage, seed, type SearchMock } from "./mocks";

const HERE = path.dirname(fileURLToPath(import.meta.url));
type Match = { surah: { number: number }; numberInSurah: number; text: string };
const matchesOf = (file: string) => (JSON.parse(fs.readFileSync(path.resolve(HERE, "../tests/fixtures", file), "utf8")) as { data: { matches: Match[] } }).data.matches;
const MERCY = matchesOf("alquran-search-mercy-all-pickthall.json");
const EASE = matchesOf("alquran-search-ease-all-pickthall.json");
const HISTORY = "quran:search-history:v1";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });
let leaks: string[] = [];
let api: SearchMock;
test.beforeEach(async ({ context }) => {
  leaks = await forbidRealApis(context);
  await freezeClock(context);
  await mockQuranText(context);
  api = await mockSearch(context);
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

const input = (page: Page) => page.getByTestId("search-input");
const chip = (page: Page, scope: string) => page.locator(`[data-testid="scope-chip"][data-scope="${scope}"]`);
const toast = (page: Page, text: string) => page.locator("[data-sonner-toast]").filter({ hasText: text });
const history = async (page: Page) => JSON.parse((await readStorage(page))[HISTORY] ?? "null") as string[] | null;
const push = (page: Page, to: string) =>
  page.evaluate((p) => (document.querySelector("#__nuxt") as unknown as { __vue_app__: { config: { globalProperties: { $router: { push(p: string): void } } } } }).__vue_app__.config.globalProperties.$router.push(p), to);
async function open(page: Page, url = "/search") {
  await page.goto(url);
  await expect(page.getByTestId("search-page")).toBeVisible();
  await expect(input(page)).toBeVisible();
}

test.describe("the first view", () => {
  test("one h1, the box has focus on desktop, six type chips, the legacy suggestions, no request is made", async ({ page }) => {
    await open(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Search");
    await expect(input(page)).toBeFocused();
    await expect(page.getByTestId("scope-chip")).toHaveText(["All", "Ayahs", "Surahs", "People", "Stories", "Notes"]);
    await expect(chip(page, "all")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("suggested-chip")).toHaveText(["patience", "mercy", "forgiveness", "gratitude", "prayer", "fasting", "charity", "guidance"]);
    await expect(page.getByTestId("history-empty")).toHaveText("Your searches appear here, on this device only.");
    await expect(page.getByTestId("filters-count")).toHaveCount(0);
    expect(api.calls).toEqual([]);
    expect(await idbNames(page)).not.toContain("quran-app-db");
  });

  test("a suggestion fills the box and searches", async ({ page }) => {
    await open(page);
    await page.getByTestId("suggested-chip").filter({ hasText: "mercy" }).click();
    await expect(input(page)).toHaveValue("mercy");
    await expect(page.getByTestId("ayah-row").first()).toBeVisible();
    expect(api.calls).toEqual(["mercy|all|en.pickthall"]);
  });
});

test.describe("the local groups: instant, from one character, no request", () => {
  test("one character finds surahs, people and stories at once; the ayah search waits for two", async ({ page }) => {
    await open(page);
    await input(page).fill("y");
    await expect(page.getByTestId("group-surahs")).toBeVisible();
    await expect(page.getByTestId("group-people")).toBeVisible();
    await page.waitForTimeout(600); // longer than the pause before an ayah search
    expect(api.calls).toEqual([]);
    await expect(page.getByTestId("group-ayahs")).toHaveCount(0);
  });

  test("yusuf: the surah (legacy spelling), the person and the story; the ayah search runs and finds none in this edition", async ({ page }) => {
    await open(page);
    await input(page).fill("yusuf");
    await expect(page.locator('[data-testid="group-surahs"] [data-testid="local-row"]').first()).toContainText("Yusuf");
    await expect(page.locator('[data-testid="group-people"] a').first()).toHaveAttribute("href", "/persons/yusuf");
    await expect(page.locator('[data-testid="group-stories"] a').first()).toHaveAttribute("href", /^\/stories\//);
    await expect(page.getByTestId("ayah-none")).toContainText("No ayahs match “yusuf” in Pickthall");
    await expect(page.getByTestId("scope-count").first()).toBeVisible();
  });

  test("a surah opens in the reader; marks and spelling are ignored (fatiha finds Al-Faatiha)", async ({ page }) => {
    await open(page);
    await input(page).fill("fatiha");
    const row = page.locator('[data-testid="group-surahs"] a').first();
    await expect(row).toContainText("Al-Faatiha");
    await expect(row).toHaveAttribute("href", "/surah/1");
    await expect(row.locator("mark")).toHaveCount(1);
    await row.click();
    await expect(page).toHaveURL(/\/surah\/1$/);
  });

  test("opening a result right after typing is not undone by the URL sync: a slow route does not turn the click into /search?q=… again", async ({ page }) => {
    await open(page);
    // From now on every NEW script the page asks for (the reader's code) arrives 1.2 s late, so the navigation started by the click is still pending
    // when the 400 ms timer that writes ?q= into the URL fires (this is what a slow phone or a loaded machine does).
    await page.route(/\/_nuxt\/.*\.js$/, async (route) => {
      await new Promise((r) => setTimeout(r, 1200));
      await route.continue();
    });
    await input(page).fill("fatiha");
    const row = page.locator('[data-testid="group-surahs"] a').first();
    await expect(row).toContainText("Al-Faatiha");
    await row.click();
    await expect(page).toHaveURL(/\/surah\/1$/, { timeout: 15000 });
    await page.waitForTimeout(1500); // and it stays there: nothing writes the search URL back afterwards
    await expect(page).toHaveURL(/\/surah\/1$/);
  });

  test("a number is that surah and is never sent to the text search", async ({ page }) => {
    await open(page);
    await input(page).fill("18");
    const rows = page.locator('[data-testid="group-surahs"] [data-testid="local-row"]');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Al-Kahf");
    await page.waitForTimeout(600);
    expect(api.calls).toEqual([]);
  });

  test("a group shows four in All with Show all, and the chip narrows to that group", async ({ page }) => {
    await open(page);
    await input(page).fill("an");
    const rows = page.locator('[data-testid="group-surahs"] [data-testid="local-row"]');
    await expect(rows).toHaveCount(4);
    await page.getByTestId("show-all").first().click();
    await expect(chip(page, "surahs")).toHaveAttribute("aria-pressed", "true");
    expect(await rows.count()).toBeGreaterThan(4);
    await expect(page.getByTestId("group-people")).toHaveCount(0);
    await chip(page, "all").click();
    await expect(rows).toHaveCount(4);
  });
});

test.describe("the ayah search", () => {
  test("mercy: one request after a pause, 60 shown of 155, the edition named, matches marked, the strip drawn", async ({ page }) => {
    await open(page);
    // five keystrokes inside one browser task, so the result does not depend on how fast the test machine is: no request for "me", "mer", ...
    await input(page).evaluate((el: HTMLInputElement) => {
      for (const v of ["m", "me", "mer", "merc", "mercy"]) {
        el.value = v;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    await expect(page.getByTestId("ayah-row")).toHaveCount(60);
    expect(api.calls).toEqual(["mercy|all|en.pickthall"]);
    await expect(page.getByTestId("ayah-status")).toHaveText("Showing the first 60 of 155 ayahs");
    await expect(page.getByTestId("group-ayahs").getByTestId("group-count")).toHaveText("155");
    await expect(page.getByTestId("ayah-edition")).toHaveText("English: Pickthall"); // the group names the edition searched
    await expect(page.getByTestId("ayah-row-edition").first()).toHaveText("Pickthall");
    await expect(page.getByTestId("ayah-row-edition").first()).toHaveAttribute("title", "Mohammed Marmaduke William Pickthall");
    const first = page.getByTestId("ayah-row").first();
    await expect(first.locator("a")).toHaveAttribute("href", `/surah/${MERCY[0]!.surah.number}#ayah-${MERCY[0]!.numberInSurah}`);
    await expect(first).toContainText("Al-Baqara 2:64");
    expect(await first.locator("mark").count()).toBeGreaterThan(0);
    expect((await first.locator("mark").first().textContent())!.toLowerCase()).toBe("mercy");
    await expect(page.getByTestId("thread-mark")).toHaveCount(60);
    await expect(page.getByTestId("thread")).toHaveAttribute("aria-label", "Where the 60 ayahs shown fall in the Qur’an");
  });

  test("opening a result goes to the reader at that ayah", async ({ page }) => {
    await open(page, "/search?q=mercy");
    await page.getByTestId("ayah-row").first().locator("a").click();
    await expect(page).toHaveURL(/\/surah\/2#ayah-64$/);
  });

  test("a repeated search comes from the session cache, whatever the letter case", async ({ page }) => {
    await open(page);
    await input(page).fill("mercy");
    await expect(page.getByTestId("ayah-row").first()).toBeVisible();
    await input(page).fill("");
    await input(page).fill("MERCY");
    await expect(page.getByTestId("ayah-row").first()).toBeVisible();
    await page.waitForTimeout(500);
    expect(api.calls).toEqual(["mercy|all|en.pickthall"]);
  });

  test("two characters are enough in any script (go), one is not; a request is made only for the text that stayed", async ({ page }) => {
    await open(page);
    await input(page).fill("g");
    await page.waitForTimeout(500);
    expect(api.calls).toEqual([]);
    await input(page).fill("go");
    await expect.poll(() => api.calls).toEqual(["go|all|en.pickthall"]);
  });

  test("the box shows Searching… while it waits, with a placeholder, then the answer", async ({ page }) => {
    api.delays.mercy = 1200;
    await open(page);
    await input(page).fill("mercy");
    await expect(page.getByTestId("ayah-loading")).toBeVisible();
    await expect(page.getByTestId("group-ayahs")).toHaveAttribute("aria-busy", "true");
    await expect(page.getByTestId("ayah-row").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("group-ayahs")).toHaveAttribute("aria-busy", "false");
  });

  test("an older, slower answer never replaces a newer one (the legacy page let it)", async ({ page }) => {
    api.delays.mercy = 1500;
    await open(page);
    await input(page).fill("mercy");
    await expect.poll(() => api.calls.length).toBe(1); // in flight
    await input(page).fill("ease");
    await expect(page.getByTestId("ayah-status")).toHaveText(`Showing the first 60 of ${EASE.length} ayahs`);
    await page.waitForTimeout(1900); // the mercy answer would have arrived by now
    await expect(page.getByTestId("ayah-status")).toHaveText(`Showing the first 60 of ${EASE.length} ayahs`);
    await expect(page.getByTestId("group-ayahs").getByTestId("group-count")).toHaveText(String(EASE.length));
    expect(api.calls).toEqual(["mercy|all|en.pickthall", "ease|all|en.pickthall"]);
  });

  test("the upstream matches inside words, and the highlight follows (ease finds eased and please)", async ({ page }) => {
    await open(page, "/search?q=ease&s=94");
    await expect(page.getByTestId("ayah-row")).toHaveCount(4);
    const marks = await page.getByTestId("ayah-row-text").locator("mark").allTextContents();
    expect(marks.map((m) => m.toLowerCase())).toEqual(["ease", "ease", "ease", "ease"]);
  });

  test("Urdu: right to left, in the Urdu face, never truncated, the group says Urdu: Jalandhry", async ({ page }) => {
    await open(page, `/search?q=${encodeURIComponent(RAHMAT_TEXT)}&g=urdu&e=ur.jalandhry`);
    await expect(page.getByTestId("ayah-row")).toHaveCount(60);
    await expect(page.getByTestId("ayah-status")).toHaveText("Showing the first 60 of 103 ayahs");
    await expect(page.getByTestId("ayah-edition")).toHaveText("Urdu: Jalandhry");
    const text = page.getByTestId("ayah-row-text").first();
    await expect(text).toHaveAttribute("dir", "rtl");
    await expect(text).toHaveAttribute("lang", "ur");
    await expect(text).toHaveClass(/\bur\b/);
    expect(await text.locator("mark").count()).toBeGreaterThan(0);
    expect(await text.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    await expect(page.getByTestId("ayah-row").first().locator("a")).toHaveAttribute("href", /^\/surah\/\d+#ayah-\d+$/); // each result opens the reader at that ayah
  });

  test("Arabic: a bare root finds marked words, which are highlighted whole, right to left", async ({ page }) => {
    await open(page, `/search?q=${encodeURIComponent(RABBI_TEXT)}&g=arabic&e=quran-simple`);
    await expect(page.getByTestId("ayah-row")).toHaveCount(60);
    await expect(page.getByTestId("ayah-status")).toHaveText("Showing the first 60 of 140 ayahs");
    const text = page.getByTestId("ayah-row-text").first();
    await expect(text).toHaveAttribute("dir", "rtl");
    await expect(text).toHaveAttribute("lang", "ar");
    expect(await text.locator("mark").count()).toBeGreaterThan(0);
    await expect(page.getByTestId("ayah-row-edition").first()).toHaveText("Arabic Quran Text");
    await expect(page.getByTestId("ayah-edition")).toHaveText("Arabic: Quran text");
    expect(await text.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true); // never truncated
  });
});

test.describe("teh marbuta and heh are one letter in the device groups and in highlighting", () => {
  test("a surah is found by typing its Arabic name with heh in place of teh marbuta, and the name is highlighted", async ({ page }) => {
    const baqara = SURAH_ROWS[1]!.ar;
    expect(baqara.endsWith(String.fromCodePoint(0x629))).toBe(true);
    const typed = baqara.slice(0, -1) + String.fromCodePoint(0x647);
    await open(page);
    await input(page).fill(typed);
    const row = page.locator('[data-testid="group-surahs"] [data-testid="local-row"]').filter({ hasText: "Al-Baqara" });
    await expect(row).toHaveCount(1);
    await expect(row.locator("mark")).toHaveText(baqara); // the Arabic name, whole
  });
});

test.describe("filters, and the URL", () => {
  test("one Filters button holds the legacy filters; the count shows; Reset clears them", async ({ page }) => {
    await open(page, "/search?q=mercy");
    await expect(page.getByTestId("ayah-row").first()).toBeVisible();
    await page.getByTestId("filters-open").click();
    const sheet = page.getByTestId("filters-sheet");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("radio")).toHaveCount(4 + 3); // four groups, then the English editions
    await sheet.getByRole("radio", { name: "Urdu" }).click();
    await expect(sheet.getByRole("radio", { name: "Jalandhry" })).toBeChecked(); // the group's first edition
    await expect(page.getByTestId("filters-count")).toHaveText("1");
    await expect(page).toHaveURL(/g=urdu&e=ur\.jalandhry|e=ur\.jalandhry&g=urdu/);
    await expect.poll(() => api.calls.at(-1)).toBe("mercy|all|ur.jalandhry");
    await expect(page.getByTestId("ayah-none")).toContainText("No ayahs match “mercy” in Jalandhry.");
    await expect(page.getByTestId("ayah-edition")).toHaveText("Urdu: Jalandhry");
    await expect(page.getByTestId("filters-summary")).toContainText("Jalandhry");
    await sheet.getByTestId("filters-reset").click();
    await expect(page.getByTestId("filters-count")).toHaveCount(0);
    await expect(page.getByTestId("ayah-row").first()).toBeVisible();
    await sheet.getByTestId("filters-done").click();
    await expect(sheet).toBeHidden();
  });

  test("the ten legacy editions are all there, in four groups, and tafsir carries its note", async ({ page }) => {
    await open(page, "/search?q=mercy");
    await page.getByTestId("filters-open").click();
    const sheet = page.getByTestId("filters-sheet");
    const names: Record<string, string[]> = {
      English: ["Pickthall", "Yusuf Ali", "Muhammad Asad"],
      Urdu: ["Jalandhry", "Maududi"],
      "Arabic (Quran text)": ["Arabic Quran Text"],
      "Arabic Tafsir": ["Tafsir Muyassar", "Tafsir Al-Jalalayn", "Tafsir Al-Qurtubi", "Tafsir Al-Baghawi"],
    };
    let total = 0;
    for (const [group, editions] of Object.entries(names)) {
      await sheet.getByRole("radio", { name: group, exact: true }).click();
      await expect(sheet.getByTestId("filter-edition").getByRole("radio")).toHaveText(editions);
      total += editions.length;
    }
    expect(total).toBe(10);
    await expect(sheet.getByTestId("filter-tafsir-note")).toHaveText("Sunni tafsir sources, Arabic only.");
  });

  test("one surah is sent to the upstream; the URL carries it; a legacy URL (with g and e) opens the same search", async ({ page }) => {
    await open(page, "/search?q=mercy&g=english&e=en.pickthall&s=2");
    const inSurah2 = MERCY.filter((m) => m.surah.number === 2).length;
    await expect(page.getByTestId("ayah-status")).toHaveText(inSurah2 > 60 ? `Showing the first 60 of ${inSurah2} ayahs` : `${inSurah2} ayahs`);
    await expect(page.getByTestId("filters-count")).toHaveText("1");
    expect(api.calls).toEqual(["mercy|2|en.pickthall"]);
    for (const href of await page.getByTestId("ayah-row").locator("a").evaluateAll((els) => els.map((e) => e.getAttribute("href")))) expect(href).toMatch(/^\/surah\/2#ayah-/);
    await expect(input(page)).toHaveValue("mercy");
  });

  test("a juz filter applies to ALL matches, not just the first 60, and needs no second request", async ({ page }) => {
    await open(page, "/search?q=mercy&j=30");
    const inJuz = MERCY.filter((m) => juzOfAyah(m.surah.number, m.numberInSurah) === 30).length;
    const inFirst60 = MERCY.slice(0, 60).filter((m) => juzOfAyah(m.surah.number, m.numberInSurah) === 30).length;
    expect(inJuz).toBeGreaterThan(inFirst60); // the legacy page would have shown only inFirst60
    await expect(page.getByTestId("ayah-status")).toHaveText(`${inJuz} ${inJuz === 1 ? "ayah" : "ayahs"}`);
    await expect(page.getByTestId("ayah-row")).toHaveCount(inJuz);
    expect(api.calls).toEqual(["mercy|all|en.pickthall"]); // the juz is worked out on the device
  });

  test("saved ayahs only keeps the ayahs you saved, and says so when none of the matches pass", async ({ page, context }) => {
    const keys = [MERCY[0]!, MERCY[1]!].map((m) => `ayah:${m.surah.number}:${m.numberInSurah}`);
    await seed(context, { "quran:bookmarks:v1": JSON.stringify(keys) });
    await open(page, "/search?q=mercy&b=1");
    await expect(page.getByTestId("ayah-status")).toHaveText("2 ayahs");
    await expect(page.getByTestId("ayah-row")).toHaveCount(2);
    await page.getByTestId("filters-open").click();
    await page.getByTestId("filters-sheet").getByTestId("filter-juz").selectOption("30");
    await expect(page.getByTestId("ayah-filtered-out")).toContainText("None of the 155 matches pass your filters.");
    await page.getByTestId("filters-sheet").getByTestId("filters-reset").click();
    await expect(page.getByTestId("ayah-status")).toHaveText("Showing the first 60 of 155 ayahs");
  });

  test("the URL follows the search and a reload brings it back; a bad value is ignored", async ({ page }) => {
    await open(page);
    await input(page).fill("mercy");
    await expect(page).toHaveURL(/\/search\?q=mercy$/);
    await page.reload();
    await expect(input(page)).toHaveValue("mercy");
    await expect(page.getByTestId("ayah-row").first()).toBeVisible();
    await open(page, "/search?q=mercy&s=999&j=0&g=klingon&t=everything");
    await expect(page.getByTestId("filters-count")).toHaveCount(0);
    await expect(chip(page, "all")).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("an ayah number is a way to open it", () => {
  test("2:255 offers to open it in the reader and makes no request", async ({ page }) => {
    await open(page);
    await input(page).fill("2:255");
    const card = page.getByTestId("jump-card");
    await expect(card).toContainText("Open Al-Baqara 2:255");
    await expect(card).toHaveAttribute("href", "/surah/2#ayah-255");
    await page.waitForTimeout(600);
    expect(api.calls).toEqual([]);
    await card.click();
    await expect(page).toHaveURL(/\/surah\/2#ayah-255$/);
  });

  test("an impossible number says what is possible", async ({ page }) => {
    await open(page);
    await input(page).fill("2:999");
    await expect(page.getByTestId("jump-message")).toHaveText("Al-Baqara has 286 ayahs.");
    await input(page).fill("200:1");
    await expect(page.getByTestId("jump-message")).toHaveText("There are 114 surahs.");
    expect(api.calls).toEqual([]);
  });
});

test.describe("recent searches (the legacy key, a list of strings)", () => {
  test("saved after a search that found something has settled, as plain strings, newest first", async ({ page }) => {
    await open(page);
    await input(page).fill("mercy");
    await expect(page.getByTestId("ayah-row").first()).toBeVisible();
    await expect.poll(() => history(page), { timeout: 6000 }).toEqual(["mercy"]);
    await input(page).fill("ease");
    await expect(page.getByTestId("ayah-status")).toHaveText(`Showing the first 60 of ${EASE.length} ayahs`);
    await expect.poll(() => history(page), { timeout: 6000 }).toEqual(["ease", "mercy"]);
  });

  test("Enter saves at once; typing and clearing without settling saves nothing", async ({ page }) => {
    await open(page);
    await input(page).fill("mercy");
    await expect(page.getByTestId("ayah-row").first()).toBeVisible();
    await input(page).press("Enter");
    await expect.poll(() => history(page), { timeout: 1000 }).toEqual(["mercy"]);
    await input(page).fill("ease");
    await input(page).fill("");
    await page.waitForTimeout(2200);
    expect(await history(page)).toEqual(["mercy"]);
  });

  test("a search that found nothing, or failed, is never saved", async ({ page }) => {
    await open(page);
    await input(page).fill("zzzzqqq");
    await expect(page.getByTestId("ayah-none")).toBeVisible();
    api.mode = "http500";
    await input(page).fill("mercy");
    await expect(page.getByTestId("ayah-failed")).toBeVisible();
    await page.waitForTimeout(2400);
    expect(await history(page)).toBeNull();
  });

  test("the saved searches show when the box is empty; one can be reused, removed with Undo, and all cleared with Undo", async ({ page, context }) => {
    await seed(context, { [HISTORY]: JSON.stringify(["patience", "mercy", "Ayat al-Kursi"]) });
    await open(page);
    await expect(page.getByTestId("history-chip")).toHaveText(["patience", "mercy", "Ayat al-Kursi"]);
    await page.getByTestId("history-chip").nth(1).getByTestId("history-remove").click();
    await expect(page.getByTestId("history-chip")).toHaveText(["patience", "Ayat al-Kursi"]);
    expect(await history(page)).toEqual(["patience", "Ayat al-Kursi"]);
    await toast(page, "Removed “mercy”").getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("history-chip")).toHaveText(["patience", "mercy", "Ayat al-Kursi"]);
    expect(await history(page)).toEqual(["patience", "mercy", "Ayat al-Kursi"]);
    await page.getByTestId("history-clear").click();
    await expect(page.getByTestId("history-chip")).toHaveCount(0);
    expect(await history(page)).toEqual([]);
    await toast(page, "Search history cleared").getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("history-chip")).toHaveCount(3);
    await page.getByTestId("history-use").first().click();
    await expect(input(page)).toHaveValue("patience");
  });

  test("damaged history is read as empty and never crashes the page", async ({ page, context }) => {
    await seed(context, { [HISTORY]: JSON.stringify([{ id: 1, q: "patience", at: 1 }, null, 5]) });
    await open(page);
    await expect(page.getByTestId("history-chip")).toHaveCount(0);
    await expect(page.getByTestId("history-empty")).toBeVisible();
  });
});

test.describe("when the ayah search cannot answer", () => {
  test("no connection: said plainly, the rest still works, Try again recovers", async ({ page }) => {
    api.mode = "network";
    await open(page);
    await input(page).fill("yusuf");
    await expect(page.getByTestId("ayah-offline")).toContainText("Searching ayah text needs a connection.");
    await expect(page.getByTestId("ayah-offline")).toContainText("What is on your device still works");
    await expect(page.locator('[data-testid="group-people"] a').first()).toBeVisible(); // device groups unaffected
    await input(page).fill("mercy");
    await expect(page.getByTestId("ayah-offline")).toBeVisible();
    api.mode = "ok";
    await page.getByTestId("ayah-retry").click();
    await expect(page.getByTestId("ayah-row").first()).toBeVisible();
    await expect(page.getByTestId("ayah-offline")).toHaveCount(0);
  });

  test("the browser says it is offline: no request is made at all, and an ayah number still opens", async ({ page, context }) => {
    await open(page);
    await context.setOffline(true);
    await input(page).fill("mercy");
    await expect(page.getByTestId("ayah-offline")).toBeVisible();
    expect(api.calls).toEqual([]);
    await input(page).fill("2:255");
    await expect(page.getByTestId("jump-card")).toBeVisible();
  });

  test("a server error is a different message from offline, with Try again", async ({ page }) => {
    api.mode = "http500";
    await open(page, "/search?q=mercy");
    await expect(page.getByTestId("ayah-failed")).toContainText("didn’t give an answer");
    await expect(page.getByTestId("ayah-offline")).toHaveCount(0);
    api.mode = "ok";
    await page.getByTestId("ayah-retry").click();
    await expect(page.getByTestId("ayah-row").first()).toBeVisible();
  });

  test("nothing at all: one clear message", async ({ page }) => {
    await open(page);
    await input(page).fill("zzzzqqq");
    await expect(page.getByTestId("search-empty")).toContainText("Nothing matches “zzzzqqq”.");
  });
});

test.describe("notes", () => {
  const LIB = JSON.stringify({ collections: [], itemMeta: { "ayah:94:5": { note: "Ease comes with the hardship, not only after it.", tags: ["hope"], collectionIds: [], updatedAt: 5 }, "surah:1": { note: "Learn by heart first", tags: [], collectionIds: [], updatedAt: 4 } } });

  test("a note is found by its words or its tag, shows a one-line snippet, and opens the item", async ({ page, context }) => {
    await seed(context, { "quran:library:v1": LIB });
    await open(page);
    await input(page).fill("hardship");
    const row = page.locator('[data-testid="group-notes"] [data-testid="local-row"]');
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("Ash-Sharh");
    await expect(row.locator("mark")).toHaveText("hardship");
    await expect(row.locator("a")).toHaveAttribute("href", "/surah/94#ayah-5");
    await input(page).fill("hope");
    await expect(page.locator('[data-testid="group-notes"] [data-testid="local-row"]')).toHaveCount(1);
    await chip(page, "notes").click();
    await expect(page.getByTestId("group-ayahs")).toHaveCount(0);
  });
});

test.describe("keyboard", () => {
  test("/ opens Search from another page and puts the cursor in the box; inside the box it types a slash", async ({ page }) => {
    await page.goto("/stories");
    await expect(page.getByTestId("stories-list")).toBeVisible();
    await page.keyboard.press("/");
    await expect(page).toHaveURL(/\/search$/);
    await expect(input(page)).toBeFocused();
    await input(page).pressSequentially("a/b");
    await expect(input(page)).toHaveValue("a/b");
    await expect(page).toHaveURL(/\/search/);
  });

  test("/ is left alone while a sheet is open", async ({ page }) => {
    await open(page);
    await page.getByTestId("filters-open").click();
    await expect(page.getByTestId("filters-sheet")).toBeVisible();
    await page.keyboard.press("/");
    await expect(input(page)).not.toBeFocused();
  });

  test("the box, Filters and the chips are reached in order with Tab, and Escape closes the sheet", async ({ page }) => {
    await open(page);
    await expect(input(page)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("filters-open")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(chip(page, "all")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("filters-sheet")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("filters-sheet")).toBeHidden();
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test("no sideways scroll, 44 px touch targets, the box is not focused for you, the Filters sheet rises from the bottom", async ({ page, context }) => {
    await seed(context, { [HISTORY]: JSON.stringify(["patience", "mercy"]) });
    await open(page);
    await expect(input(page)).not.toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    for (const sel of ['[data-testid="scope-chip"]', '[data-testid="history-use"]', '[data-testid="history-remove"]', '[data-testid="suggested-chip"]', '[data-testid="filters-open"]']) {
      for (const el of await page.locator(sel).all()) expect((await el.boundingBox())!.height, sel).toBeGreaterThanOrEqual(44);
    }
    await input(page).fill("mercy");
    await expect(page.getByTestId("ayah-row").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByTestId("filters-open").click();
    await expect(page.getByTestId("filters-sheet")).toHaveAttribute("data-side", "bottom");
    for (const sel of ['[data-testid="filter-surah"]', '[data-testid="filter-juz"]', '[data-testid="filters-done"]']) expect((await page.locator(sel).boundingBox())!.height, sel).toBeGreaterThanOrEqual(44);
  });
});

test.describe("quality", () => {
  test("no console errors or warnings through a whole visit, and quran-app-db is never opened", async ({ page }) => {
    const problems: string[] = [];
    // (this file blocks service workers so mocked routes stay in charge; Chromium logs that as a warning, which is not the app)
    page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && !/Service Worker registration blocked/.test(m.text()) && problems.push(`${m.type()}: ${m.text()}`));
    page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
    await open(page);
    await input(page).fill("mercy");
    await expect(page.getByTestId("ayah-row").first()).toBeVisible();
    await page.getByTestId("filters-open").click();
    await page.getByTestId("filters-sheet").getByRole("radio", { name: "Urdu" }).click();
    await page.getByTestId("filters-done").click();
    await input(page).fill("y"); // device groups only: a text search the upstream answers with 404 ("nothing found") is logged by Chromium as a failed load, which a page cannot silence
    await chip(page, "people").click();
    await push(page, "/stories");
    await expect(page.getByTestId("stories-list")).toBeVisible();
    expect(problems).toEqual([]);
    expect(await idbNames(page)).not.toContain("quran-app-db");
  });
});
