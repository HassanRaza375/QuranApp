// Phase 4A: the Surah reader in a real browser, on the production build. The upstream is mocked with SYNTHETIC chapters and
// tafsir (right counts, obviously fake text), every unmocked request to a real API fails the test, the clock is fixed, and the
// audio element is a stand-in. See docs/phases/phase-04a-surah-reader.md.
import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { forbidRealApis, freezeClock, mockQuranText, readStorage, seed, stubAudio, type QuranTextMock } from "./mocks";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });
let leaks: string[] = [];
let api: QuranTextMock;
test.beforeEach(async ({ context }) => {
  leaks = await forbidRealApis(context);
  await freezeClock(context);
  await stubAudio(context);
  api = await mockQuranText(context);
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByTestId("reader-title")).toBeVisible();
}
const ayah = (page: Page, n: number) => page.getByTestId(`ayah-${n}`);

/** Open a ResponsiveMenu (dropdown on desktop, sheet on mobile) and pick an option. */
async function choose(page: Page, trigger: RegExp, option: string) {
  await page.getByRole("button", { name: trigger }).click();
  await page.getByRole("menuitemradio", { name: option, exact: true }).or(page.getByRole("option", { name: option, exact: true })).click();
}

test.describe("loading", () => {
  test("cold load: skeleton, then the text; one h1; header facts; no bismillah above surah 1 (it is ayah 1)", async ({ page }) => {
    api.delayMs = 400;
    await page.goto("/surah/1");
    await expect(page.getByTestId("reader-skeleton")).toBeVisible();
    await expect(page.getByTestId("reader-title")).toHaveText("TEST LONG 1");
    await expect(page.getByTestId("reader-sub")).toHaveText("Surah 1 · 7 ayahs · Mecca");
    await expect(page.locator("article[data-n]")).toHaveCount(7);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByTestId("bismillah")).toHaveCount(0);
    expect(api.chapters).toEqual([1]);
  });

  test("bismillah: above surahs 2 and 114, never above 1 or 9; its text comes from the data of surah 1, never from the code", async ({ page }) => {
    await open(page, "/surah/2");
    await expect(page.getByTestId("bismillah")).toHaveText("TEST ARABIC 1:1");
    expect(api.chapters.sort()).toEqual([1, 2]);
    await open(page, "/surah/114");
    await expect(page.getByTestId("bismillah")).toHaveText("TEST ARABIC 1:1");
    await open(page, "/surah/9");
    await expect(page.getByTestId("bismillah")).toHaveCount(0);
    await open(page, "/surah/1");
    await expect(page.getByTestId("bismillah")).toHaveCount(0);
  });

  test("bismillah is left out (not invented) when surah 1 cannot be loaded", async ({ context, page }) => {
    await context.route(/quranapi\.pages\.dev\/api\/1\.json/, (r) => r.abort("internetdisconnected"));
    await open(page, "/surah/2");
    await expect(ayah(page, 1)).toBeVisible();
    await expect(page.getByTestId("bismillah")).toHaveCount(0);
  });

  test("warm load: a surah opened before makes no request", async ({ page }) => {
    await open(page, "/surah/112");
    expect(api.chapters).toContain(112);
    const before = api.chapters.length;
    await page.reload();
    await expect(page.getByTestId("reader-title")).toBeVisible();
    await expect(ayah(page, 4)).toBeVisible();
    expect(api.chapters.length).toBe(before);
  });

  test("a failed request shows a clear message and Retry loads it", async ({ page }) => {
    api.mode = "http500";
    await page.goto("/surah/3");
    await expect(page.getByTestId("load-error")).toHaveText("Couldn’t load this surah. Check your connection and try again.");
    await expect(page.getByTestId("reader-skeleton")).toHaveCount(0);
    api.mode = "ok";
    await page.getByTestId("load-retry").click();
    await expect(page.getByTestId("reader-title")).toHaveText("TEST LONG 3");
  });

  test("offline: a surah opened before reads from the device; one never opened says so, and Retry works once back online", async ({ context, page }) => {
    await open(page, "/surah/3");
    await page.getByTestId("back-link").click(); // in-app navigation keeps the app (and the reader's code) loaded
    await expect(page.getByTestId("list-count")).toBeVisible();
    await context.setOffline(true);
    api.mode = "network"; // mocked routes answer even when the page is offline, so make the mock refuse like a dead connection
    await page.getByTestId("surah-row-3").locator("a").click();
    await expect(page.getByTestId("reader-title")).toHaveText("TEST LONG 3"); // from quran-revamp-db
    await page.goBack();
    await page.getByTestId("surah-row-4").locator("a").click();
    await expect(page.getByTestId("load-error")).toHaveText("This surah isn’t saved on this device yet. Connect once to read it.");
    await expect(page.getByTestId("reader-skeleton")).toHaveCount(0);
    await context.setOffline(false);
    api.mode = "ok";
    await page.getByTestId("load-retry").click();
    await expect(page.getByTestId("reader-title")).toHaveText("TEST LONG 4");
  });

  test("a surah that does not exist, and a bad hash", async ({ page }) => {
    for (const bad of ["0", "115", "abc", "1.5"]) {
      await page.goto(`/surah/${bad}`);
      await expect(page.getByTestId("notfound-title")).toHaveText("That surah doesn’t exist");
    }
    await open(page, "/surah/3#ayah-999");
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await open(page, "/surah/3#nonsense");
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("never opens the legacy database", async ({ page }) => {
    const names: string[] = [];
    await page.exposeFunction("__rec", (n: string) => names.push(n));
    await page.addInitScript(() => {
      const real = indexedDB.open.bind(indexedDB);
      indexedDB.open = ((name: string, v?: number) => ((window as unknown as { __rec: (n: string) => void }).__rec(name), real(name, v))) as typeof indexedDB.open;
    });
    await open(page, "/surah/2");
    await ayah(page, 3).scrollIntoViewIfNeeded();
    await page.getByTestId("tafsir-toggle").first().click();
    await expect(page.getByTestId("tafsir-text")).toBeVisible();
    expect(names.length).toBeGreaterThan(0);
    expect(new Set(names)).toEqual(new Set(["quran-revamp-db"]));
  });
});

test.describe("opening at an ayah", () => {
  test("#ayah-N scrolls once the text is rendered, focuses the ayah and highlights it briefly", async ({ page }) => {
    await page.goto("/surah/2#ayah-255");
    const row = ayah(page, 255);
    await expect(row).toBeFocused();
    const top = await row.evaluate((e) => e.getBoundingClientRect().top);
    expect(top).toBeGreaterThan(40);
    expect(top).toBeLessThan(260);
    await expect(row).toHaveClass(/flash/);
    await expect(row).not.toHaveClass(/flash/, { timeout: 4000 });
  });
  test("moving between hashes on the same surah scrolls again", async ({ page }) => {
    await page.goto("/surah/2#ayah-10");
    await expect(ayah(page, 10)).toBeFocused();
    await page.evaluate(() => (location.hash = "#ayah-100"));
    await expect(ayah(page, 100)).toBeFocused();
  });
});

test.describe("text, layout and the translation menu", () => {
  test("default: English under the Arabic; the verse marker carries the number", async ({ page }) => {
    await open(page, "/surah/2");
    await expect(ayah(page, 5).getByTestId("ayah-arabic")).toContainText("TEST ARABIC 2:5");
    await expect(ayah(page, 5).getByTestId("ayah-translation")).toHaveText("Test English 2:5");
    await expect(ayah(page, 5).locator(".verse-mark")).toHaveText("5");
    expect(await ayah(page, 5).getByTestId("ayah-arabic").getAttribute("dir")).toBe("rtl");
  });

  test("layout: Translation first puts the translation above the Arabic in the page order", async ({ context, page }) => {
    await seed(context, { "quran:verse-layout:v1": JSON.stringify({ order: "tr" }) });
    await open(page, "/surah/112");
    const order = await ayah(page, 1).evaluate((row) => [...row.querySelectorAll("p")].map((p) => p.getAttribute("data-testid")));
    expect(order).toEqual(["ayah-translation", "ayah-arabic"]);
  });

  test("each language writes the legacy key; Off writes only the reader's own key and leaves the legacy one alone", async ({ page }) => {
    await open(page, "/surah/112");
    await choose(page, /^Translation:/, "Urdu");
    await expect(ayah(page, 1).getByTestId("ayah-translation")).toHaveText("Test Urdu 112:1");
    expect(await ayah(page, 1).getByTestId("ayah-translation").getAttribute("dir")).toBe("rtl");
    let ls = await readStorage(page);
    expect(ls["translationDefaultLang"]).toBe("urdu");
    await choose(page, /^Translation:/, "Off");
    await expect(page.getByTestId("ayah-translation")).toHaveCount(0);
    ls = await readStorage(page);
    expect(JSON.parse(ls["quran:reader-prefs:v1"]!)).toEqual({ translation: "off" });
    expect(ls["translationDefaultLang"]).toBe("urdu"); // untouched
    await page.reload();
    await expect(page.getByTestId("reader-title")).toBeVisible();
    await expect(page.getByTestId("ayah-translation")).toHaveCount(0); // remembered
    await choose(page, /^Translation:/, "Bengali");
    await expect(ayah(page, 1).getByTestId("ayah-translation")).toHaveText("Test Bengali 112:1");
    ls = await readStorage(page);
    expect(JSON.parse(ls["quran:reader-prefs:v1"]!).translation).toBeNull(); // Off cleared
    await choose(page, /^Translation:/, "Arabic (Alt)");
    await expect(ayah(page, 1).getByTestId("ayah-translation")).toHaveText("TEST ARABIC ALT 112:1");
  });

  test("the old reader's text tab (preferredVerseDisplay) is the default when nothing else is chosen", async ({ context, page }) => {
    await seed(context, { preferredVerseDisplay: "bengali" });
    await open(page, "/surah/112");
    await expect(ayah(page, 1).getByTestId("ayah-translation")).toHaveText("Test Bengali 112:1");
    await expect(page.getByRole("button", { name: "Translation: Bengali" })).toBeVisible();
  });
});

test.describe("tafsir", () => {
  test("opens one request per ayah with all three sources, the default from the legacy key, and the source choice sets it", async ({ context, page }) => {
    await seed(context, { tafsirDefaultAuthor: "Maarif Ul Quran" });
    await open(page, "/surah/2");
    await ayah(page, 255).scrollIntoViewIfNeeded();
    const row = ayah(page, 255);
    await row.getByTestId("tafsir-toggle").click();
    await expect(row.getByTestId("tafsir-text")).toContainText("Maarif test text for 2:255");
    expect(api.tafsirs).toEqual(["2_255"]);
    await expect(row.getByRole("button", { name: "Maarif Ul Quran" })).toHaveAttribute("aria-pressed", "true");

    await row.getByRole("button", { name: "Tazkirul Quran" }).click();
    await expect(row.getByTestId("tafsir-text")).toContainText("Tazkir test text for 2:255");
    await expect(row.getByTestId("tafsir-group")).toContainText("group of verses 2:255 to 2:257");
    await expect(row.getByTestId("tafsir-source-line")).toHaveText("Tazkirul Quran");
    expect((await readStorage(page))["tafsirDefaultAuthor"]).toBe("Tazkirul Quran");
    expect(api.tafsirs).toEqual(["2_255"]); // switching source asks for nothing

    await row.getByRole("button", { name: "Ibn Kathir" }).click();
    await expect(row.getByTestId("tafsir-group")).toHaveCount(0);
    await expect(row.getByTestId("tafsir-text")).toContainText("Ibn Kathir test text");

    await row.getByTestId("tafsir-toggle").click();
    await expect(row.getByTestId("tafsir-panel")).toHaveCount(0);
    await row.getByTestId("tafsir-toggle").click(); // reopen: cached, no new request
    await expect(row.getByTestId("tafsir-text")).toBeVisible();
    expect(api.tafsirs).toEqual(["2_255"]);
  });

  test("the text is escaped: markup in the source stays text and nothing runs", async ({ page }) => {
    await open(page, "/surah/112");
    await ayah(page, 1).getByTestId("tafsir-toggle").click();
    const body = ayah(page, 1).getByTestId("tafsir-text");
    await expect(body).toContainText("<script>window.__xss=1</script>");
    await expect(body).toContainText("<b>not markup</b>");
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
    expect(await body.locator("script, b").count()).toBe(0);
    await expect(body.locator("strong")).toHaveText("bold");
  });

  test("states the Ja’fari gap in the panel and in the Tafsir menu, and makes no claim about the schools", async ({ page }) => {
    await open(page, "/surah/112");
    await ayah(page, 1).getByTestId("tafsir-toggle").click();
    await expect(ayah(page, 1).getByTestId("tafsir-jafari-note")).toHaveText("No Ja’fari tafsir is available from this app’s data provider.");
    await page.getByRole("button", { name: /^Tafsir:/ }).click();
    await expect(page.getByTestId("menu-hint")).toHaveText("No Ja’fari tafsir is available from this app’s data provider.");
    await page.keyboard.press("Escape");
    expect(await page.locator("body").innerText()).not.toMatch(/sunni/i);
  });

  test("a failed request shows a message and Retry; offline and not saved says so", async ({ context, page }) => {
    await open(page, "/surah/112");
    api.mode = "http500";
    await ayah(page, 2).getByTestId("tafsir-toggle").click();
    await expect(ayah(page, 2).getByTestId("tafsir-error")).toContainText("Couldn’t load the tafsir. Check your connection and try again.");
    api.mode = "ok";
    await ayah(page, 2).getByTestId("tafsir-retry").click();
    await expect(ayah(page, 2).getByTestId("tafsir-text")).toBeVisible();

    await context.setOffline(true);
    api.mode = "network";
    await ayah(page, 3).getByTestId("tafsir-toggle").click();
    await expect(ayah(page, 3).getByTestId("tafsir-error")).toContainText("Tafsir for this ayah isn’t saved on this device. Connect to load it.");
    await expect(ayah(page, 3).getByTestId("tafsir-loading")).toHaveCount(0); // no spinner left running
    await expect(ayah(page, 2).getByTestId("tafsir-text")).toBeVisible(); // the one read before still works
  });

  test("the default tafsir menu writes the legacy key", async ({ page }) => {
    await open(page, "/surah/112");
    await choose(page, /^Tafsir:/, "Tazkirul Quran");
    expect((await readStorage(page))["tafsirDefaultAuthor"]).toBe("Tazkirul Quran");
    await ayah(page, 1).getByTestId("tafsir-toggle").click();
    await expect(ayah(page, 1).getByRole("button", { name: "Tazkirul Quran" })).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("save, pin, share", () => {
  test("save writes the legacy ayah key with an Undo that keeps the first-saved time", async ({ page }) => {
    await open(page, "/surah/112");
    await ayah(page, 2).getByTestId("ayah-save").click();
    let ls = await readStorage(page);
    expect(JSON.parse(ls["quran:bookmarks:v1"]!)).toEqual(["ayah:112:2"]);
    const at = JSON.parse(ls["quran:bookmarks:added-at:v1"]!)["ayah:112:2"];
    expect(typeof at).toBe("number");
    await expect(ayah(page, 2).getByTestId("ayah-save")).toHaveAttribute("aria-pressed", "true");
    await ayah(page, 2).getByTestId("ayah-save").click();
    expect(JSON.parse((await readStorage(page))["quran:bookmarks:v1"]!)).toEqual([]);
    await page.getByRole("button", { name: "Undo" }).click();
    ls = await readStorage(page);
    expect(JSON.parse(ls["quran:bookmarks:v1"]!)).toEqual(["ayah:112:2"]);
    expect(JSON.parse(ls["quran:bookmarks:added-at:v1"]!)["ayah:112:2"]).toBe(at);
  });

  test("saved ayahs of this surah show filled when the page opens", async ({ context, page }) => {
    await seed(context, { "quran:bookmarks:v1": JSON.stringify(["ayah:112:3", "ayah:2:5", "surah:112"]) });
    await open(page, "/surah/112");
    await expect(ayah(page, 3).getByTestId("ayah-save")).toHaveAttribute("aria-pressed", "true");
    await expect(ayah(page, 1).getByTestId("ayah-save")).toHaveAttribute("aria-pressed", "false");
  });

  test("pin writes quran:pins:v1, replaces an earlier pin, and Undo restores it", async ({ page }) => {
    await open(page, "/surah/112");
    await ayah(page, 2).getByTestId("ayah-pin").click();
    let pin = JSON.parse((await readStorage(page))["quran:pins:v1"]!);
    expect(pin).toMatchObject({ v: 1, reading: { surahNo: 112, ayahNo: 2 } });
    await expect(ayah(page, 2).getByTestId("ayah-pin")).toHaveAttribute("aria-pressed", "true");
    await ayah(page, 3).getByTestId("ayah-pin").click(); // moves the pin
    pin = JSON.parse((await readStorage(page))["quran:pins:v1"]!);
    expect(pin.reading.ayahNo).toBe(3);
    await expect(ayah(page, 2).getByTestId("ayah-pin")).toHaveAttribute("aria-pressed", "false");
    await page.getByRole("button", { name: "Undo" }).first().click();
    expect(JSON.parse((await readStorage(page))["quran:pins:v1"]!).reading.ayahNo).toBe(2);
    await ayah(page, 2).getByTestId("ayah-pin").click(); // unpin
    expect(JSON.parse((await readStorage(page))["quran:pins:v1"]!).reading).toBeNull();
    await page.getByRole("button", { name: "Undo" }).first().click();
    expect(JSON.parse((await readStorage(page))["quran:pins:v1"]!).reading.ayahNo).toBe(2);
  });

  test("share uses Web Share when the browser has it, with the Arabic, the shown translation and the reference", async ({ page }) => {
    await page.addInitScript(() => {
      (navigator as unknown as { share: (d: unknown) => Promise<void> }).share = async (d) => void ((window as unknown as { __shared: unknown }).__shared = d);
    });
    await open(page, "/surah/112");
    await ayah(page, 2).getByTestId("ayah-share").click();
    const shared = (await page.evaluate(() => (window as unknown as { __shared: { text: string; url: string; title: string } }).__shared))!;
    expect(shared.text).toBe("TEST ARABIC 112:2\n\nTest English 112:2\n\nAl-Ikhlaas 112:2");
    expect(shared.url).toMatch(/\/surah\/112#ayah-2$/);
  });

  test("without Web Share it copies and says Copied; with the translation Off only the Arabic and the reference are copied", async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(() => delete (navigator as unknown as { share?: unknown }).share);
    await open(page, "/surah/112");
    await choose(page, /^Translation:/, "Off");
    await ayah(page, 1).getByTestId("ayah-share").click();
    await expect(page.getByText("Copied", { exact: true })).toBeVisible();
    // Windows clipboards turn each line feed into a carriage return and a line feed
    const clip = (await page.evaluate(() => navigator.clipboard.readText())).split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
    expect(clip).toContain("TEST ARABIC 112:1\n\nAl-Ikhlaas 112:1");
    expect(clip).not.toContain("Test English");
    // no separate Copy button
    await expect(page.getByRole("button", { name: /^copy/i })).toHaveCount(0);
  });
});

test.describe("reading progress, the daily log and Completed", () => {
  test("opening a surah writes nothing; scrolling on writes exactly the legacy record", async ({ page }) => {
    await open(page, "/surah/2");
    await page.waitForTimeout(900);
    expect((await readStorage(page))["quran:reading-progress:v1"]).toBeUndefined();
    await ayah(page, 12).evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 100));
    await expect.poll(async () => (await readStorage(page))["quran:reading-progress:v1"], { timeout: 4000 }).toBeTruthy();
    const rec = JSON.parse((await readStorage(page))["quran:reading-progress:v1"]!);
    expect(Object.keys(rec).sort()).toEqual(["ayahNo", "surahName", "surahNameArabic", "surahNo", "totalAyah", "updatedAt"]);
    expect(rec).toMatchObject({ surahNo: 2, surahName: "The Cow", surahNameArabic: "TEST LONG 2", totalAyah: 286 });
    expect(rec.ayahNo).toBeGreaterThanOrEqual(11);
    expect(rec.ayahNo).toBeLessThanOrEqual(13);
  });

  test("the daily log gets every ayah that stayed on screen for 1.5 s, under the local day, and keeps the goals record's other fields", async ({ context, page }) => {
    await seed(context, { "quran:reading-goals:v1": JSON.stringify({ goals: [{ id: "g1", status: "active", dailyAyahTarget: 20 }], activeGoalId: "g1", dailyLog: { "2026-10-14": ["1:1"] } }) });
    await open(page, "/surah/2");
    await page.waitForTimeout(2300); // the first screen stays up for a while
    const log = JSON.parse((await readStorage(page))["quran:reading-goals:v1"]!);
    expect(log.goals).toHaveLength(1);
    expect(log.activeGoalId).toBe("g1");
    expect(log.dailyLog["2026-10-14"]).toEqual(["1:1"]);
    const today: string[] = log.dailyLog["2026-10-15"]; // the fixed clock: 15 Oct 2026, 09:14 in Karachi
    expect(today).toContain("2:1");
    expect(today.length).toBeGreaterThanOrEqual(2);
    expect(today.every((k) => /^2:\d+$/.test(k))).toBe(true);
    expect(today).not.toContain("2:200"); // not an ayah that was never on screen
  });

  test("a quick scroll past ayahs logs none of them", async ({ page }) => {
    await open(page, "/surah/2");
    await page.evaluate(() => window.scrollTo(0, 40000)); // straight down, then away
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(700);
    const log = (await readStorage(page))["quran:reading-goals:v1"];
    const today: string[] = log ? (JSON.parse(log).dailyLog?.["2026-10-15"] ?? []) : [];
    expect(today.filter((k) => Number(k.split(":")[1]) > 10)).toEqual([]);
  });

  test("a short surah read to the end completes automatically, with an Undo", async ({ page }) => {
    await open(page, "/surah/112");
    await page.waitForTimeout(1800);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.getByText("Marked Al-Ikhlaas as read")).toBeVisible({ timeout: 6000 });
    expect(JSON.parse((await readStorage(page))["quran:read-surahs:v1"]!).surahs["112"].completedAt).toBeGreaterThan(0);
    await expect(page.getByTestId("mark-read")).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Undo" }).click();
    expect(Object.keys(JSON.parse((await readStorage(page))["quran:read-surahs:v1"]!).surahs)).toEqual([]);
  });

  test("a link straight to the end of a long surah does not complete it", async ({ page }) => {
    await page.goto("/surah/2#ayah-286");
    await expect(ayah(page, 286)).toBeFocused();
    await page.waitForTimeout(3000);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1500);
    expect((await readStorage(page))["quran:read-surahs:v1"]).toBeUndefined();
    await expect(page.getByTestId("mark-read")).toHaveAttribute("aria-pressed", "false");
  });

  test("Mark as read and Mark as not read, each with Undo", async ({ page }) => {
    await open(page, "/surah/3");
    await page.getByTestId("mark-read").click();
    await expect(page.getByTestId("mark-read")).toHaveText("Marked as read");
    expect(Object.keys(JSON.parse((await readStorage(page))["quran:read-surahs:v1"]!).surahs)).toEqual(["3"]);
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("mark-read")).toHaveText("Mark as read");
    await page.getByTestId("mark-read").click();
    await page.getByTestId("mark-read").click(); // not read again
    expect(Object.keys(JSON.parse((await readStorage(page))["quran:read-surahs:v1"]!).surahs)).toEqual([]);
  });

  test("the listing then draws the Completed marker and its legend; a damaged value draws nothing", async ({ context, page }) => {
    await seed(context, { "quran:read-surahs:v1": JSON.stringify({ v: 1, surahs: { "2": { completedAt: 5 }, "0": { completedAt: 1 } } }) });
    await page.goto("/surah-listing");
    await expect(page.getByTestId("completed-marker")).toHaveCount(1);
    await expect(page.getByTestId("surah-row-2").getByTestId("completed-marker")).toBeVisible();
    await expect(page.getByTestId("legend")).toContainText("Completed");
  });
  test("a damaged Completed value is ignored", async ({ context, page }) => {
    await seed(context, { "quran:read-surahs:v1": "{nope" });
    await page.goto("/surah-listing");
    await expect(page.getByTestId("list-count")).toBeVisible();
    await expect(page.getByTestId("completed-marker")).toHaveCount(0);
  });
});

test.describe("audio, navigation and the listing's links", () => {
  test("Play surah uses the Phase 3 player and the chosen reciter; Pause; the mini player agrees", async ({ page }) => {
    await open(page, "/surah/112");
    await page.getByTestId("play-surah").click();
    await expect(page.getByTestId("play-surah")).toContainText("Pause surah");
    await expect(page.getByTestId("mini-title")).toHaveText("Al-Ikhlaas");
    await choose(page, /^Reciter:/, "Hani Ar Rifai");
    await expect(page.getByTestId("mini-status")).toHaveText("Recited by Hani Ar Rifai");
    const a = await page.evaluate(() => (window as unknown as { __audio: { srcs: string[] } }).__audio.srcs);
    expect(a[0]).toMatch(/\/1\/112\.mp3$/);
    expect(a.at(-1)).toMatch(/\/5\/112\.mp3$/);
    await page.getByTestId("play-surah").click();
    await expect(page.getByTestId("play-surah")).toContainText("Play surah");
  });

  test("a file that cannot play says so in the reader, never claims offline playback", async ({ page }) => {
    await open(page, "/surah/112");
    await page.evaluate(() => ((window as unknown as { __audio: { fail: boolean } }).__audio.fail = true));
    await page.getByTestId("play-surah").click();
    await expect(page.getByTestId("player-error")).toHaveText("Couldn’t play. Audio needs a connection unless it was downloaded.");
    expect(await page.locator("body").innerText()).not.toMatch(/plays? offline|works offline/i);
  });

  test("previous and next surah", async ({ page }) => {
    await open(page, "/surah/2");
    await page.getByTestId("next-surah").click();
    await expect(page).toHaveURL(/\/surah\/3$/);
    await expect(page.getByTestId("reader-title")).toHaveText("TEST LONG 3");
    await page.getByTestId("prev-surah").click();
    await expect(page.getByTestId("reader-title")).toHaveText("TEST LONG 2");
    await open(page, "/surah/114");
    await expect(page.getByTestId("next-surah")).toHaveCount(0);
    await open(page, "/surah/1");
    await expect(page.getByTestId("prev-surah")).toHaveCount(0);
  });

  test("links from the listing (surah and juz rows), Home's Continue reading and the nav all reach the reader", async ({ context, page }) => {
    await seed(context, { "quran:reading-progress:v1": JSON.stringify({ surahNo: 112, ayahNo: 3, surahName: "x", surahNameArabic: "x", totalAyah: 4, updatedAt: 1 }), last_location: JSON.stringify({ lat: 31.5, lng: 74.3 }) });
    await page.goto("/surah-listing");
    await page.getByTestId("surah-row-112").locator("a").click();
    await expect(ayah(page, 1)).toBeVisible();
    await page.goto("/juz");
    await page.getByTestId("juz-row-2").locator("a").click();
    await expect(page).toHaveURL(/\/surah\/2#ayah-142$/);
    await expect(ayah(page, 142)).toBeFocused();
    await page.getByRole("link", { name: "Continue reading" }).first().click();
    await expect(page).toHaveURL(/\/surah\/112#ayah-3$/);
    await expect(page.getByTestId("reader-title")).toHaveText("TEST LONG 112");
  });
});

test.describe("keyboard", () => {
  test("every control in an ayah is a real button with a name; Enter and Space work", async ({ page }) => {
    await open(page, "/surah/112");
    const bad = await page.evaluate(() => {
      const out: string[] = [];
      document.querySelectorAll<HTMLElement>('[data-testid="ayah-list"] button').forEach((b) => {
        if (!(b.getAttribute("aria-label") || b.textContent || "").trim()) out.push("no name");
        if (b.hasAttribute("tabindex") && b.getAttribute("tabindex") !== "0") out.push("odd tabindex");
      });
      document.querySelectorAll('[data-testid="ayah-list"] [role="button"], [data-testid="ayah-list"] [onclick]').forEach(() => out.push("fake button"));
      return out;
    });
    expect(bad).toEqual([]);
    const row = ayah(page, 2);
    await row.getByTestId("tafsir-toggle").focus();
    await page.keyboard.press("Enter");
    await expect(row.getByTestId("tafsir-toggle")).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Space");
    await expect(row.getByTestId("tafsir-toggle")).toHaveAttribute("aria-expanded", "false");
    await row.getByTestId("ayah-save").focus();
    await page.keyboard.press("Space");
    await expect(row.getByTestId("ayah-save")).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Enter");
    await expect(row.getByTestId("ayah-save")).toHaveAttribute("aria-pressed", "false");
    await row.getByTestId("ayah-pin").focus();
    await page.keyboard.press("Space");
    await expect(row.getByTestId("ayah-pin")).toHaveAttribute("aria-pressed", "true");
  });

  test("tab order inside an ayah: Tafsir, Save, Pin, Share", async ({ page }) => {
    await open(page, "/surah/112");
    await ayah(page, 1).getByTestId("tafsir-toggle").focus();
    for (const id of ["ayah-save", "ayah-pin", "ayah-share"]) {
      await page.keyboard.press("Tab");
      await expect(ayah(page, 1).getByTestId(id)).toBeFocused();
    }
  });
});

test.describe("themes", () => {
  for (const theme of ["light", "dark"]) {
    test(`renders in the ${theme} theme`, async ({ context, page }) => {
      await seed(context, { themeMode: theme });
      await open(page, "/surah/112");
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^((?!dark).)*$/);
      await expect(ayah(page, 1).getByTestId("ayah-arabic")).toBeVisible();
    });
  }
});

test.describe("a phone: 375px", () => {
  test.use({ viewport: { width: 375, height: 800 }, hasTouch: true });

  test("no horizontal scroll; the header and ayah controls are at least 44px; the Arabic is not clipped", async ({ page }) => {
    await open(page, "/surah/2");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const small = await page.evaluate(() => {
      const bad: string[] = [];
      document.querySelectorAll<HTMLElement>('main header button, main header a, [data-testid="ayah-1"] button, [data-testid="ayah-286"] button').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.height < 43.5 || r.width < 43.5) bad.push(`${el.getAttribute("data-testid") ?? el.tagName} ${Math.round(r.width)}x${Math.round(r.height)}`);
      });
      return bad;
    });
    expect(small).toEqual([]);
    const clipped = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-testid="ayah-arabic"]')].filter((e) => e.scrollWidth > e.clientWidth + 1).length);
    expect(clipped).toBe(0);
  });

  test("the Translation menu is a bottom sheet with 46px rows", async ({ page }) => {
    await open(page, "/surah/112");
    await page.getByRole("button", { name: /^Translation:/ }).click();
    const row = page.getByRole("option", { name: "Urdu", exact: true });
    await expect(row).toBeVisible();
    expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(45);
  });

  // ---- rendering cost: 4x slower CPU, the largest surah. Numbers go to test-results/reader-perf.json and the phase doc.
  const BUDGET = { firstRenderMs: 4000, tafsirOpenMs: 800, longTaskMs: 250, listExtraMs: 250, layoutShift: 0.02 };
  test("Al-Baqarah (286 ayahs) renders and scrolls within budget at 4x CPU", async ({ context, page }) => {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.addInitScript(() => {
      const w = window as unknown as { __long: number[]; __cls: number };
      w.__long = [];
      w.__cls = 0;
      new PerformanceObserver((l) => l.getEntries().forEach((e) => w.__long.push(e.duration))).observe({ type: "longtask", buffered: true });
      new PerformanceObserver((l) => l.getEntries().forEach((e) => (w.__cls += (e as unknown as { hadRecentInput: boolean; value: number }).hadRecentInput ? 0 : (e as unknown as { value: number }).value))).observe({ type: "layout-shift", buffered: true });
    });
    const measure = () =>
      page.evaluate(() => {
        const w = window as unknown as { __long: number[]; __cls: number };
        return { longTaskMs: Math.max(0, ...w.__long), longTasks: w.__long.length, layoutShift: Math.round(w.__cls * 1000) / 1000, nodes: document.getElementsByTagName("*").length };
      });
    // control: the app's own start-up with no reader
    await page.goto("/settings");
    await page.locator("main").waitFor();
    const control = await measure();
    // the reader, cold (the text arrives over the mocked network, then is stored)
    const t0 = Date.now();
    await page.goto("/surah/2");
    await expect(ayah(page, 286)).toBeAttached();
    await expect(page.getByTestId("reader-title")).toBeVisible();
    const firstRenderMs = Date.now() - t0;
    await page.waitForTimeout(600); // let the bismillah arrive and the page settle
    const loadShift = (await measure()).layoutShift; // the shift while the page loads
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 4000) {
        window.scrollTo(0, y);
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      }
      window.scrollTo(0, 0);
    });
    const t1 = Date.now();
    await ayah(page, 1).getByTestId("tafsir-toggle").click();
    await expect(ayah(page, 1).getByTestId("tafsir-text")).toBeVisible();
    const tafsirOpenMs = Date.now() - t1;
    const reader = await measure();
    // the same surah warm (from the device)
    const t2 = Date.now();
    await page.reload();
    await expect(ayah(page, 286)).toBeAttached();
    const warmRenderMs = Date.now() - t2;
    // A scripted scroll that jumps 4,000 px at a time is not a reader's scroll: rows that swap from their estimated height to their real one
    // as they are reached count as shifts when the machine is busy, so the budget applies to the load, and the scroll figure is only recorded.
    const report = { control, reader: { firstRenderMs, warmRenderMs, tafsirOpenMs, ...reader, loadShift, scrollShift: Math.round((reader.layoutShift - loadShift) * 1000) / 1000 } };
    fs.mkdirSync("test-results", { recursive: true });
    fs.writeFileSync("test-results/reader-perf.json", JSON.stringify({ viewport: "375x800", cpuThrottle: "4x", budget: BUDGET, report }, null, 2));
    console.log("READER PERF", JSON.stringify(report));
    expect(firstRenderMs, "cold render").toBeLessThan(BUDGET.firstRenderMs);
    expect(warmRenderMs, "warm render").toBeLessThan(BUDGET.firstRenderMs);
    expect(tafsirOpenMs, "opening a tafsir").toBeLessThan(BUDGET.tafsirOpenMs);
    expect(reader.longTaskMs, "longest task").toBeLessThan(Math.max(control.longTaskMs, BUDGET.longTaskMs) + BUDGET.listExtraMs);
    expect(loadShift, "layout shift while loading").toBeLessThan(BUDGET.layoutShift);
  });
});
