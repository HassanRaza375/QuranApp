// Phase 3: the Surah listing (Surah, Juz and Page tabs) in a real browser, on the production build. Every upstream is
// blocked or mocked, the clock is fixed, and the audio element is a stand-in that records what the page asked it to play.
// The listing itself makes no network request at all: that is asserted in the first test.
import fs from "node:fs";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { SURAH_ROWS } from "../app/data/quranMeta.generated";
import { lastRead } from "../app/lib/readingMarker";
import { loadAndControl } from "./helpers";
import { forbidRealApis, freezeClock, mockQuranText, readStorage, seed, stubAudio } from "./mocks";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });
let leaks: string[] = [];
test.beforeEach(async ({ context }) => {
  leaks = await forbidRealApis(context);
  await freezeClock(context);
  await stubAudio(context);
  await mockQuranText(context);
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

const audio = (page: Page) => page.evaluate(() => (window as unknown as { __audio: { srcs: string[]; rates: number[] } }).__audio);
const failAudio = (page: Page) => page.evaluate(() => ((window as unknown as { __audio: { fail: boolean } }).__audio.fail = true));

const RECITERS = ["Mishary Rashid Al Afasy", "Abu Bakr Al Shatri", "Nasser Al Qatami", "Yasser Al Dosari", "Hani Ar Rifai"];
const PROGRESS = { "quran:reading-progress:v1": JSON.stringify({ surahNo: 2, ayahNo: 285, surahName: "Al-Baqarah", surahNameArabic: "x", totalAyah: 286, updatedAt: 1 }) };
const LAST = lastRead({ surahNo: 2, ayahNo: 285 })!;

async function open(page: Page, path = "/surah-listing") {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("list-count")).toBeVisible();
}
const rows = (page: Page) => page.locator('[data-testid^="surah-row-"]');
const count = (page: Page) => page.getByTestId("list-count");

/** Open a ResponsiveMenu (a dropdown on desktop, a bottom sheet on mobile) and pick an option. */
async function choose(page: Page, trigger: RegExp, option: string) {
  await page.getByRole("button", { name: trigger }).click();
  await page.getByRole("menuitemradio", { name: option, exact: true }).or(page.getByRole("option", { name: option, exact: true })).click();
}

test("makes no network request of its own, and the three tabs show 114 surahs, 30 juz and 604 pages", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://localhost:3011") && !r.url().startsWith("data:")) external.push(r.url());
  });
  await open(page);
  await expect(count(page)).toHaveText("114 surahs");
  await expect(rows(page)).toHaveCount(114);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

  await page.getByTestId("tab-juz").click();
  await expect(page).toHaveURL(/\/juz$/);
  await expect(count(page)).toHaveText("30 juz");
  await expect(page.locator('[data-testid^="juz-row-"]')).toHaveCount(30);

  await page.getByTestId("tab-page").click();
  await expect(page).toHaveURL(/\/surah-listing\?tab=page$/);
  await expect(count(page)).toHaveText("604 pages");
  const pages = await page.locator("a[data-page]").evaluateAll((els) => els.map((e) => Number((e as HTMLElement).dataset.page)));
  expect(new Set(pages).size).toBe(604);
  expect(pages.length).toBe(604 + 4); // pages shared by two juz (4, 7, 11, 26) appear in both groups
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  expect(external, "the listing fetched something from outside").toEqual([]);
});

test("tabs are links with aria-current, and the legacy routes work", async ({ page }) => {
  await open(page, "/juz");
  await expect(page.getByTestId("tab-juz")).toHaveAttribute("aria-current", "page");
  await expect(page.getByTestId("tab-surah")).not.toHaveAttribute("aria-current", "page");
  await page.getByTestId("tab-surah").click();
  await expect(page.getByTestId("tab-surah")).toHaveAttribute("aria-current", "page");
  await expect(rows(page)).toHaveCount(114);
});

test.describe("filter, sort, saved", () => {
  test("a filter narrows the list, shows N of 114, and an empty result offers Clear", async ({ page }) => {
    await open(page);
    const input = page.getByTestId("filter-input");
    await input.fill("fatiha");
    await expect(count(page)).toHaveText("1 of 114 surahs");
    await expect(rows(page)).toHaveCount(1);
    await input.fill("xyzzy");
    await expect(page.getByTestId("empty-list")).toContainText("No surahs match “xyzzy”. Try a name or a number.");
    await expect(count(page)).toHaveText("0 of 114 surahs");
    await page.getByTestId("empty-clear").click();
    await expect(input).toHaveValue("");
    await expect(rows(page)).toHaveCount(114);
  });

  test("typing the Arabic name without marks finds the surah (the legacy search could not); a number finds that surah", async ({ page }) => {
    await open(page);
    const input = page.getByTestId("filter-input");
    await input.fill("الفاتحة");
    await expect(rows(page)).toHaveCount(1);
    await expect(page.getByTestId("surah-row-1")).toBeVisible();
    await input.fill("7");
    await expect(rows(page)).toHaveCount(1);
    await expect(page.getByTestId("surah-row-7")).toBeVisible();
    await input.fill("madina");
    const madina = SURAH_ROWS.filter((s) => s.place === "Madina").length;
    await expect(rows(page)).toHaveCount(madina);
  });

  test("sort by name, verse count and number; the place menu", async ({ page }) => {
    await open(page);
    await choose(page, /^Sort:/, "Verse count (most first)");
    await expect(rows(page).first()).toHaveAttribute("data-testid", "surah-row-2");
    await choose(page, /^Sort:/, "Verse count (fewest first)");
    expect(Number(((await rows(page).first().getAttribute("data-testid")) ?? "").replace("surah-row-", ""))).toBeGreaterThan(0);
    await choose(page, /^Sort:/, "Name (A to Z)");
    await expect(rows(page).first()).toContainText("Al-A'laa");
    await choose(page, /^Sort:/, "Surah number");
    await expect(rows(page).first()).toHaveAttribute("data-testid", "surah-row-1");
    await choose(page, /^Place:/, "Madina only");
    await expect(rows(page)).toHaveCount(SURAH_ROWS.filter((s) => s.place === "Madina").length);
    await expect(count(page)).toContainText(" of 114 surahs");
  });

  test("the star writes the legacy bookmark keys, with Undo on removal; the Saved toggle filters", async ({ page }) => {
    await open(page);
    await page.getByTestId("saved-toggle").click();
    await expect(page.getByTestId("empty-list")).toContainText("No saved surahs yet. Tap the star on a surah to save it.");
    await page.getByTestId("saved-toggle").click();

    await page.getByTestId("surah-row-18").getByTestId("star").click();
    let ls = await readStorage(page);
    expect(JSON.parse(ls["quran:bookmarks:v1"]!)).toEqual(["surah:18"]);
    const at = JSON.parse(ls["quran:bookmarks:added-at:v1"]!);
    expect(typeof at["surah:18"]).toBe("number");
    await expect(page.getByTestId("surah-row-18").getByTestId("star")).toHaveAttribute("aria-pressed", "true");

    await page.getByTestId("saved-toggle").click();
    await expect(rows(page)).toHaveCount(1);
    await page.getByTestId("surah-row-18").getByTestId("star").click();
    ls = await readStorage(page);
    expect(JSON.parse(ls["quran:bookmarks:v1"]!)).toEqual([]);
    await page.getByRole("button", { name: "Undo" }).click();
    ls = await readStorage(page);
    expect(JSON.parse(ls["quran:bookmarks:v1"]!)).toEqual(["surah:18"]);
    expect(JSON.parse(ls["quran:bookmarks:added-at:v1"]!)["surah:18"]).toBe(at["surah:18"]); // the first-saved time survives Undo
  });

  test("a juz can be saved too (legacy key juz:<n>)", async ({ page }) => {
    await open(page, "/juz");
    await page.getByTestId("juz-row-3").getByTestId("star").click();
    const ls = await readStorage(page);
    expect(JSON.parse(ls["quran:bookmarks:v1"]!)).toEqual(["juz:3"]);
  });
});

test.describe("audio", () => {
  test("Play starts that surah by the chosen reciter; the row, the mini player and Pause agree; audio keeps playing on another page", async ({ page }) => {
    await open(page);
    await page.getByTestId("surah-row-1").getByTestId("row-play").click();
    await expect(page.getByTestId("surah-row-1")).toHaveAttribute("data-playing", "true");
    await expect(page.getByTestId("mini-player")).toBeVisible();
    await expect(page.getByTestId("mini-title")).toHaveText("Al-Faatiha");
    await expect(page.getByTestId("mini-status")).toHaveText("Recited by Mishary Rashid Al Afasy");
    const a = await audio(page);
    expect(a.srcs).toHaveLength(1);
    expect(a.srcs[0]).toMatch(/\/1\/1\.mp3$/); // reciter 1, surah 1
    await expect(page.getByTestId("surah-row-1").getByTestId("row-play")).toHaveAccessibleName("Pause Al-Faatiha");

    // a second surah replaces the first
    await page.getByTestId("surah-row-2").getByTestId("row-play").click();
    await expect(page.getByTestId("surah-row-2")).toHaveAttribute("data-playing", "true");
    await expect(page.getByTestId("surah-row-1")).not.toHaveAttribute("data-playing", "true");

    // pause from the row
    await page.getByTestId("surah-row-2").getByTestId("row-play").click();
    await expect(page.getByTestId("surah-row-2")).not.toHaveAttribute("data-playing", "true");
    await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Play");

    // resume from the mini player, then leave the page: it keeps going
    await page.getByTestId("mini-toggle").click();
    await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Pause");
    await page.getByRole("link", { name: "Settings" }).first().click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page.getByTestId("mini-title")).toHaveText("Al-Baqara");
    await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Pause");
  });

  test("changing the reciter writes {reciter} like Settings does and switches the playing surah to that reciter", async ({ page }) => {
    await open(page);
    await page.getByTestId("surah-row-1").getByTestId("row-play").click();
    await expect(page.getByTestId("surah-row-1")).toHaveAttribute("data-playing", "true");
    await choose(page, /^Reciter:/, "Hani Ar Rifai");
    const ls = await readStorage(page);
    expect(JSON.parse(ls["reciter"]!)).toEqual({ reciter: "Hani Ar Rifai" });
    await expect(page.getByTestId("mini-status")).toHaveText("Recited by Hani Ar Rifai");
    const a = await audio(page);
    expect(a.srcs).toHaveLength(2);
    expect(a.srcs[1]).toMatch(/\/5\/1\.mp3$/);
    // an existing legacy value (the whole entry, as the old listing stored it) is read by name
    await expect(page.getByRole("button", { name: "Reciter: Hani Ar Rifai" })).toBeVisible();
  });

  test("a stored legacy reciter entry selects that reciter; the playback speed from Settings is used", async ({ context, page }) => {
    await seed(context, { reciter: JSON.stringify({ reciter: RECITERS[3], url: "https://x/y.mp3", id: "4" }), "quran:audio-prefs:v1": JSON.stringify({ playbackRate: 1.5, repeatOne: false, autoAdvance: false }) });
    await open(page);
    await expect(page.getByRole("button", { name: `Reciter: ${RECITERS[3]}` })).toBeVisible();
    await page.getByTestId("surah-row-3").getByTestId("row-play").click();
    await expect(page.getByTestId("surah-row-3")).toHaveAttribute("data-playing", "true");
    const a = await audio(page);
    expect(a.srcs[0]).toMatch(/\/4\/3\.mp3$/);
    expect(a.rates[0]).toBe(1.5);
  });

  test("a file that cannot play shows a clear message, not a spinner, and never claims offline playback", async ({ page }) => {
    await open(page);
    await failAudio(page);
    await page.getByTestId("surah-row-1").getByTestId("row-play").click();
    await expect(page.getByTestId("row-error")).toHaveText("Couldn’t play. Audio needs a connection unless it was downloaded.");
    await expect(page.getByTestId("mini-status")).toHaveText("Couldn’t play. Audio needs a connection unless it was downloaded.");
    await expect(page.getByTestId("surah-row-1")).not.toHaveAttribute("data-playing", "true");
    await expect(page.getByTestId("surah-row-1").getByTestId("row-play")).toHaveAccessibleName("Play Al-Faatiha");
    expect(await page.locator("body").innerText()).not.toMatch(/plays? offline|works offline|available offline/i);
  });
});

test.describe("last read marker", () => {
  test.beforeEach(async ({ context }) => {
    await seed(context, PROGRESS);
  });

  test("the surah, the juz and the page that hold the last place are marked, and nothing else", async ({ page }) => {
    await open(page);
    await expect(page.getByTestId("last-read-marker")).toHaveCount(1);
    await expect(page.getByTestId("surah-row-2").getByTestId("last-read-marker")).toBeVisible();
    await expect(page.getByTestId("surah-row-2").getByTestId("last-read-text")).toHaveText("Last read: ayah 285 of 286");
    await expect(page.getByTestId("last-read-line").getByRole("link")).toHaveAttribute("href", "/surah/2#ayah-285");

    await page.getByTestId("tab-juz").click();
    await expect(page.getByTestId("last-read-marker")).toHaveCount(1);
    await expect(page.getByTestId(`juz-row-${LAST.juz}`).getByTestId("last-read-marker")).toBeVisible();

    await page.getByTestId("tab-page").click();
    const current = page.locator('a[aria-current="true"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute("data-page", String(LAST.page));
    await expect(page.getByTestId("jump-current")).toHaveText(`Jump to page ${LAST.page}, where you stopped`);
  });

  test("a damaged record shows no marker and no error", async ({ context, page }) => {
    await seed(context, { "quran:reading-progress:v1": "{not json" });
    await open(page);
    await expect(page.getByTestId("last-read-marker")).toHaveCount(0);
    await expect(rows(page)).toHaveCount(114);
  });
});

test.describe("Go to page", () => {
  test("a valid page scrolls to the chip and flashes it; an invalid one says why", async ({ page }) => {
    await open(page, "/surah-listing?tab=page");
    await expect(page.getByTestId("filter-input")).toHaveCount(0);
    const input = page.getByTestId("page-input");
    await input.fill("300");
    await input.press("Enter");
    const chip = page.locator('a[data-page="300"]');
    await expect(chip).toBeInViewport();
    await expect(chip).toHaveClass(/flash/);
    await expect(chip).toBeFocused();
    await expect(chip).not.toHaveClass(/flash/, { timeout: 4000 });
    await expect(page.getByTestId("page-error")).toHaveCount(0);

    for (const bad of ["0", "605", "abc", "", "12.5"]) {
      await input.fill(bad);
      await page.getByTestId("page-go").click();
      await expect(page.getByTestId("page-error")).toHaveText("Enter a page from 1 to 604");
    }
    await input.fill("604");
    await input.press("Enter");
    await expect(page.getByTestId("page-error")).toHaveCount(0);
    await expect(page.locator('a[data-page="604"]')).toBeInViewport();
  });

  test("a page shared by two juz is flashed in both groups", async ({ page }) => {
    await open(page, "/surah-listing?tab=page");
    const shared = await page.locator("a[data-page]").evaluateAll((els) => {
      const seen = new Map<string, number>();
      els.forEach((e) => seen.set((e as HTMLElement).dataset.page!, (seen.get((e as HTMLElement).dataset.page!) ?? 0) + 1));
      return [...seen].filter(([, n]) => n > 1).map(([p]) => Number(p));
    });
    expect(shared).toHaveLength(4);
    await page.getByTestId("page-input").fill(String(shared[0]));
    await page.getByTestId("page-go").click();
    await expect(page.locator(`a[data-page="${shared[0]}"].flash`)).toHaveCount(2);
  });
});

test.describe("every row opens a route that exists", () => {
  test("surah, juz and page links use real numbers; each kind of target loads a page, not a blank screen", async ({ page }) => {
    await open(page);
    const surahLinks = await page.locator('[data-testid^="surah-row-"] a').evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!));
    expect(surahLinks).toHaveLength(114);
    surahLinks.forEach((h, i) => expect(h).toBe(`/surah/${i + 1}`));

    await page.getByTestId("tab-juz").click();
    await expect(count(page)).toHaveText("30 juz");
    const juzLinks = await page.locator('[data-testid^="juz-row-"] a').evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!));
    expect(juzLinks).toHaveLength(30);
    for (const h of juzLinks) {
      const m = /^\/surah\/(\d+)#ayah-(\d+)$/.exec(h);
      expect(m, h).not.toBeNull();
      const [s, a] = [Number(m![1]), Number(m![2])];
      expect(s).toBeGreaterThanOrEqual(1);
      expect(s).toBeLessThanOrEqual(114);
      expect(a).toBeGreaterThanOrEqual(1);
      expect(a).toBeLessThanOrEqual(SURAH_ROWS[s - 1]!.ayahs);
    }

    await page.getByTestId("tab-page").click();
    await expect(count(page)).toHaveText("604 pages");
    const pageLinks = await page.locator("a[data-page]").evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!));
    for (const h of pageLinks) {
      const m = /^\/per-page-read\?page=(\d+)$/.exec(h);
      expect(m, h).not.toBeNull();
      expect(Number(m![1])).toBeGreaterThanOrEqual(1);
      expect(Number(m![1])).toBeLessThanOrEqual(604);
    }

    // follow one of each: surah and juz rows open the reader; a page chip opens the placeholder until Phase 9
    for (const target of [surahLinks[0]!, juzLinks[3]!]) {
      await page.goto(target);
      await expect(page.getByTestId("reader-title")).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    }
    await page.goto(pageLinks[10]!);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("not rebuilt yet");
  });

  test("only the Page tab says its reader is not built yet (the surah and juz rows open the reader)", async ({ page }) => {
    for (const path of ["/surah-listing", "/juz"]) {
      await open(page, path);
      await expect(page.getByTestId("readers-notice")).toHaveCount(0);
    }
    await open(page, "/surah-listing?tab=page");
    await expect(page.getByTestId("readers-notice")).toContainText("page reader is still being moved");
  });

  test("a click on a page chip navigates inside the app (no full reload)", async ({ page }) => {
    await open(page, "/surah-listing?tab=page");
    await page.evaluate(() => ((window as unknown as { __marker: number }).__marker = 1));
    await page.locator('a[data-page="12"]').click();
    await expect(page).toHaveURL(/\/per-page-read\?page=12$/);
    expect(await page.evaluate(() => (window as unknown as { __marker?: number }).__marker)).toBe(1);
  });
});

test.describe("keyboard and themes", () => {
  test("Tab order inside a row is the open link, the star, then Play; Enter on Play plays", async ({ page }) => {
    await open(page);
    await page.getByTestId("surah-row-1").locator("a").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("surah-row-1").getByTestId("star")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("surah-row-1").getByTestId("row-play")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("surah-row-1")).toHaveAttribute("data-playing", "true");
  });

  test("the filter takes focus by Tab from the tabs, and Escape-free typing works", async ({ page }) => {
    await open(page);
    await page.getByTestId("tab-page").focus();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("filter-input")).toBeFocused();
  });

  test("every control in a row is a real button or link with a name; Enter and Space work (the delegated handler loses nothing)", async ({ page }) => {
    await open(page);
    const bad = await page.evaluate(() => {
      const out: string[] = [];
      document.querySelectorAll<HTMLElement>('[data-testid="surah-list"] a, [data-testid="surah-list"] button, [data-testid="page-groups"] a').forEach((el) => {
        const tag = el.tagName.toLowerCase();
        if (tag !== "a" && tag !== "button") out.push(`${tag} is not a link or button`);
        if (tag === "a" && !el.getAttribute("href")) out.push("link without href");
        if (el.hasAttribute("tabindex") && el.getAttribute("tabindex") !== "0") out.push("odd tabindex");
        const name = (el.getAttribute("aria-label") || el.textContent || "").trim();
        if (!name) out.push(`${el.dataset.testid ?? tag} has no name`);
      });
      // nothing clickable that is neither a link nor a button (a div or span with a click role)
      document.querySelectorAll<HTMLElement>('[data-testid="surah-list"] [role="button"], [data-testid="surah-list"] [onclick]').forEach(() => out.push("a role=button element"));
      return out;
    });
    expect(bad).toEqual([]);

    // Space and Enter on the star, Space on Play, Enter on the open link
    const row = page.getByTestId("surah-row-5");
    await row.getByTestId("star").focus();
    await page.keyboard.press("Space");
    await expect(row.getByTestId("star")).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Enter");
    await expect(row.getByTestId("star")).toHaveAttribute("aria-pressed", "false");
    await row.getByTestId("row-play").focus();
    await page.keyboard.press("Space");
    await expect(row).toHaveAttribute("data-playing", "true");
    await page.keyboard.press("Enter");
    await expect(row).not.toHaveAttribute("data-playing", "true");
    await row.locator("a").focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/surah\/5$/);
  });

  test("page chips are links: Enter opens the page in the app, and Go to page works from the keyboard", async ({ page }) => {
    await open(page, "/surah-listing?tab=page");
    await page.locator('a[data-page="7"]').focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/per-page-read\?page=7$/);
    await page.goBack();
    await page.getByTestId("page-input").focus();
    await page.keyboard.type("90");
    await page.keyboard.press("Enter");
    await expect(page.locator('a[data-page="90"]')).toBeFocused();
  });

  test("the sort menu: wide enough for one-line labels, with the article rule stated", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: /^Sort:/ }).click();
    await expect(page.getByTestId("menu-hint")).toHaveText("Name ignores Al-, An-");
    const wrapped = await page.getByRole("menuitemradio").evaluateAll((els) => els.filter((e) => (e as HTMLElement).getBoundingClientRect().height > 36).length);
    expect(wrapped).toBe(0);
  });

  for (const theme of ["light", "dark"]) {
    test(`renders in the ${theme} theme with the marker, the playing row and the page chips legible`, async ({ context, page }) => {
      await seed(context, { ...PROGRESS, themeMode: theme });
      await open(page);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^((?!dark).)*$/);
      await expect(page.getByTestId("surah-row-2").getByTestId("last-read-text")).toBeVisible();
      await page.getByTestId("surah-row-1").getByTestId("row-play").click();
      await expect(page.getByTestId("surah-row-1")).toHaveAttribute("data-playing", "true");
    });
  }
});

test.describe("offline", () => {
  test.use({ serviceWorkers: "allow" });

  test("after one visit the three tabs work offline, and Play says audio needs a connection", async ({ context, page }) => {
    await loadAndControl(page, "/surah-listing");
    await context.setOffline(true);
    await page.reload();
    await expect(rows(page)).toHaveCount(114);
    await page.getByTestId("tab-juz").click();
    await expect(page.locator('[data-testid^="juz-row-"]')).toHaveCount(30);
    await page.getByTestId("tab-page").click();
    await expect(page.locator("a[data-page]")).toHaveCount(608);
    await page.getByTestId("tab-surah").click();
    await failAudio(page); // a stand-in for the network refusing the file
    await page.getByTestId("surah-row-1").getByTestId("row-play").click();
    await expect(page.getByTestId("row-error")).toContainText("needs a connection unless it was downloaded");
  });
});

// ---- Rendering cost: a mid-range phone is a narrow screen with a 4x slower CPU. The numbers are written to
// test-results/listing-perf.json and recorded in docs/phases/phase-03-surah-listing.md.
test.describe("mid-range phone: 375px, CPU 4x slower", () => {
  test.use({ viewport: { width: 375, height: 800 }, hasTouch: true });

  const BUDGET = { firstRenderMs: 3000, keystrokeMs: 600, longTaskMs: 250, listExtraMs: 150, layoutShift: 0.01 };

  async function throttled(context: BrowserContext, page: Page) {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      const w = window as unknown as { __long: number[]; __cls: number };
      w.__long = [];
      w.__cls = 0;
      new PerformanceObserver((l) => l.getEntries().forEach((e) => w.__long.push(e.duration))).observe({ type: "longtask", buffered: true });
      new PerformanceObserver((l) => l.getEntries().forEach((e) => ((w.__cls += (e as unknown as { hadRecentInput: boolean; value: number }).hadRecentInput ? 0 : (e as unknown as { value: number }).value)))).observe({ type: "layout-shift", buffered: true });
    });
  }

  test("each tab renders, filters and scrolls within budget", async ({ context, page }) => {
    await seed(context, PROGRESS);
    await throttled(context, page);
    const report: Record<string, Record<string, number>> = {};
    for (const [name, path, ready] of [
      // a control: the same boot cost with no list, so the list's own cost can be read off the difference
      ["control-settings", "/settings", "main"],
      ["surah", "/surah-listing", '[data-testid="surah-row-114"]'],
      ["juz", "/juz", '[data-testid="juz-row-30"]'],
      ["page", "/surah-listing?tab=page", '[data-testid="page-group-30"]'],
    ] as const) {
      const t0 = Date.now();
      await page.goto(path);
      await page.locator(ready).waitFor({ state: "attached" });
      if (name !== "control-settings") await expect(page.getByTestId("list-count")).toBeVisible();
      const firstRenderMs = Date.now() - t0;

      let keystrokeMs = 0;
      if (name === "surah" || name === "juz") {
        const input = page.getByTestId("filter-input");
        await input.click();
        const t1 = Date.now();
        await input.pressSequentially(name === "surah" ? "al" : "1");
        await expect(count(page)).toContainText(" of ");
        keystrokeMs = Date.now() - t1;
        await input.fill("");
      }
      // scroll to the bottom and back, as a person skimming would
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 1200) {
          window.scrollTo(0, y);
          await new Promise((r) => requestAnimationFrame(() => r(null)));
        }
        window.scrollTo(0, 0);
      });
      const m = await page.evaluate(() => {
        const w = window as unknown as { __long: number[]; __cls: number };
        return { longTaskMs: Math.max(0, ...w.__long), longTasks: w.__long.length, layoutShift: Math.round(w.__cls * 1000) / 1000, nodes: document.getElementsByTagName("*").length };
      });
      report[name] = { firstRenderMs, keystrokeMs, ...m };
    }
    fs.mkdirSync("test-results", { recursive: true });
    fs.writeFileSync("test-results/listing-perf.json", JSON.stringify({ viewport: "375x800", cpuThrottle: "4x", budget: BUDGET, report }, null, 2));
    console.log("LISTING PERF", JSON.stringify(report));
    for (const name of ["surah", "juz", "page"]) {
      const m = report[name]!;
      expect(m.firstRenderMs, `${name} first render`).toBeLessThan(BUDGET.firstRenderMs);
      expect(m.keystrokeMs, `${name} keystroke`).toBeLessThan(BUDGET.keystrokeMs);
      // the longest task includes starting the app itself, which the control page shows is already 270 to 430 ms at 4x
      expect(m.longTaskMs, `${name} longest task`).toBeLessThan(Math.max(report["control-settings"]!.longTaskMs!, BUDGET.longTaskMs) + BUDGET.listExtraMs);
      expect(m.layoutShift, `${name} layout shift`).toBeLessThan(BUDGET.layoutShift);
    }
  });

  test("no horizontal scroll, and every control in a row is at least 44px", async ({ page }) => {
    await open(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const small = await page.evaluate(() => {
      const bad: string[] = [];
      document.querySelectorAll<HTMLElement>('[data-testid="surah-row-1"] a, [data-testid="surah-row-1"] button, [data-testid="surah-row-114"] button, [data-testid="filter-input"], [data-testid="saved-toggle"], [data-testid^="tab-"]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.height < 43.5 || r.width < 43.5) bad.push(`${el.getAttribute("data-testid") ?? el.tagName} ${Math.round(r.width)}x${Math.round(r.height)}`);
      });
      return bad;
    });
    expect(small).toEqual([]);
    await page.getByTestId("tab-page").click();
    const chips = await page.locator("a[data-page]").evaluateAll((els) => els.slice(0, 40).map((e) => Math.min((e as HTMLElement).getBoundingClientRect().width, (e as HTMLElement).getBoundingClientRect().height)));
    expect(Math.min(...chips)).toBeGreaterThanOrEqual(43.5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("the Arabic names are not clipped on a small screen, and the reciter name does not overflow its button", async ({ page }) => {
    await open(page);
    const clipped = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-testid^="surah-row-"] .ar')].filter((e) => e.scrollWidth > e.clientWidth + 1).length);
    expect(clipped).toBe(0);
    const overflow = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("main button")].filter((b) => b.scrollWidth > b.clientWidth + 1).length);
    expect(overflow).toBe(0);
  });
});
