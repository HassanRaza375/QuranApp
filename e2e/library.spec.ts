// Phase 6: the Library in a real browser, on the production build. The per-ayah endpoint is mocked with SYNTHETIC text, every unmocked
// request to a real API fails the test, the clock is fixed. A seeded library is written the way the LEGACY app writes it.
// See docs/phases/phase-06-library.md.
import { expect, test, type Page } from "@playwright/test";
import { forbidRealApis, freezeClock, idbNames, mockQuranText, mockVerse, NOW_KARACHI, readStorage, seed, type VerseMock } from "./mocks";

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

const NOW = Date.parse(NOW_KARACHI);
const DAY = 86_400_000;
const C1 = "0b6d3a0e-7a54-4c1c-9d5b-1f3c1b2a0001";
const C2 = "0b6d3a0e-7a54-4c1c-9d5b-1f3c1b2a0002";
const KEYS = ["surah:18", "ayah:2:255", "ayah:12:92", "juz:30", "page:49", "sajda:7:206", "name:1", "person:adam", "audio:36", "fiqh:taqlid", "story:adamandiblis", "mystery:x"];
const LEGACY = {
  "quran:bookmarks:v1": JSON.stringify(KEYS),
  "quran:bookmarks:added-at:v1": JSON.stringify({ "surah:18": NOW - 12 * DAY, "ayah:2:255": NOW - 2 * DAY, "ayah:12:92": NOW - DAY, "juz:30": NOW - 20 * DAY }),
  "quran:library:v1": JSON.stringify({
    collections: [
      { id: C1, name: "Daily adhkar", description: "", createdAt: NOW - 30 * DAY },
      { id: C2, name: "Forgiveness", description: "", createdAt: NOW - 20 * DAY },
    ],
    itemMeta: {
      "ayah:2:255": { note: "Read before sleeping.", tags: ["night"], collectionIds: [C1], updatedAt: NOW - DAY },
      "ayah:12:92": { note: "Forgiveness without conditions.", tags: ["forgiveness"], collectionIds: [C2], updatedAt: NOW },
      "ayah:7:23": { note: "A note on an ayah that was never saved.", tags: [], collectionIds: [C2], updatedAt: NOW - 3 * DAY },
    },
  }),
};

const rows = (page: Page) => page.getByTestId("library-row");
const row = (page: Page, key: string) => page.locator(`[data-testid="library-row"][data-key="${key}"]`);
const toast = (page: Page, text: string) => page.locator("[data-sonner-toast]").filter({ hasText: text });
async function open(page: Page, path = "/bookmarks") {
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1, name: "Library" })).toBeVisible();
}
async function choose(page: Page, trigger: RegExp, option: string) {
  await page.getByRole("button", { name: trigger }).click();
  await page.getByRole("menuitemradio", { name: option, exact: true }).or(page.getByRole("option", { name: option, exact: true })).click();
}
/** What the LEGACY page does with the stored values; throws on anything it would choke on. */
async function assertLegacyLoads(page: Page) {
  const ls = await readStorage(page);
  const list = JSON.parse(ls["quran:bookmarks:v1"] ?? "[]") as unknown[];
  expect(Array.isArray(list) && list.every((k) => typeof k === "string")).toBe(true);
  const at = JSON.parse(ls["quran:bookmarks:added-at:v1"] ?? "{}") as Record<string, unknown>;
  expect(Object.values(at).every((v) => typeof v === "number")).toBe(true);
  const lib = JSON.parse(ls["quran:library:v1"] ?? '{"collections":[],"itemMeta":{}}') as { collections: { id: string; name: string }[]; itemMeta: Record<string, { note: string; tags: string[]; collectionIds: string[]; updatedAt: number }> };
  const ids = lib.collections.map((c) => c.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const m of Object.values(lib.itemMeta)) {
    expect(typeof m.note).toBe("string");
    expect(Array.isArray(m.tags) && Array.isArray(m.collectionIds)).toBe(true);
    expect(typeof m.updatedAt).toBe("number");
    for (const id of m.collectionIds) expect(ids).toContain(id);
  }
  return { list, at, lib, ls };
}

test.describe("first run", () => {
  test("empty: the first-run message, three 'Not set' slots, one h1, no requests, quran-app-db never opened", async ({ page }) => {
    await open(page);
    await expect(page.getByTestId("first-run")).toContainText("Nothing saved yet");
    await expect(page.getByTestId("library-count")).toHaveText("0 saved");
    for (const s of ["reading", "page", "story"]) await expect(page.getByTestId(`slot-${s}`)).toContainText("Not set");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    expect(verse.calls).toEqual([]);
    expect(await idbNames(page)).not.toContain("quran-app-db");
    await page.getByTestId("tab-collections").click();
    await expect(page.getByTestId("no-collections")).toContainText("No collections yet");
    await page.getByTestId("tab-notes").click();
    await expect(page.getByTestId("no-notes")).toContainText("No notes yet");
  });
});

test.describe("a legacy library", () => {
  test.beforeEach(({ context }) => seed(context, LEGACY));

  test("every saved key renders as a row, with the right title, detail and link; unknown keys are shown, not dropped", async ({ page }) => {
    await open(page);
    await expect(rows(page)).toHaveCount(12);
    await expect(page.getByTestId("library-count")).toHaveText("12 saved");
    const text = async (k: string) => (await row(page, k).textContent()) ?? "";
    expect(await text("surah:18")).toContain("110 verses");
    expect(await text("surah:18")).toContain("saved 12 days ago");
    expect(await text("ayah:2:255")).toContain("Al-Baqara 2:255");
    expect(await text("ayah:2:255")).toContain("Read before sleeping.");
    expect(await text("ayah:2:255")).toContain("Daily adhkar");
    expect(await text("ayah:2:255")).toContain("#night");
    expect(await text("sajda:7:206")).toContain("Sajda verse");
    expect(await text("juz:30")).toContain("Pages 582–604");
    expect(await text("page:49")).toContain("Page 49");
    expect(await text("name:1")).toContain("Ar-Rahman");
    expect(await text("person:adam")).toContain("Adam");
    expect(await text("story:adamandiblis")).toContain("Adam and Iblis");
    expect(await text("fiqh:taqlid")).toContain("Taqlid");
    expect(await text("audio:36")).toContain("Yaseen");
    expect(await text("mystery:x")).toContain("mystery: x");
    await expect(row(page, "ayah:2:255").getByTestId("row-open")).toHaveAttribute("href", "/surah/2#ayah-255");
    await expect(row(page, "juz:30").getByTestId("row-open")).toHaveAttribute("href", "/surah/78#ayah-1");
    await expect(row(page, "person:adam").getByTestId("row-open")).toHaveAttribute("href", "/persons/adam");
    const notice = await page.getByTestId("pending-notice").textContent();
    for (const n of ["Asma-ul-Husna", "Daily Fiqh", "Reciters"]) expect(notice).toContain(n);
    await assertLegacyLoads(page);
  });

  test("the note-only ayah is under Notes (not in Saved); counts are real", async ({ page }) => {
    await open(page, "/bookmarks?view=notes");
    await expect(page.getByTestId("library-count")).toHaveText("3 notes");
    await expect(page.getByTestId("note-row")).toHaveCount(3);
    await expect(page.getByTestId("note-row").filter({ hasText: "Al-A'raaf 7:23" })).toContainText("not in Saved");
    await expect(page.getByTestId("notes-group").first().locator("h2")).toHaveText("Al-Baqara");
    await page.getByTestId("notes-search").fill("forgiveness");
    await expect(page.getByTestId("note-row")).toHaveCount(1); // note text and tags are searched (not collection names)
  });

  test("search covers title, note, tags and collection names; the Show menu lists only types present, rarer ones under a heading", async ({ page }) => {
    await open(page);
    await page.getByTestId("library-search").fill("sleeping");
    await expect(rows(page)).toHaveCount(1);
    await page.getByTestId("library-search").fill("adhkar");
    await expect(rows(page)).toHaveCount(1);
    await page.getByTestId("library-search").fill("xylophone");
    await expect(page.getByTestId("no-match")).toContainText("Nothing matches your search or filters.");
    await page.getByTestId("no-match-clear").click();
    await expect(rows(page)).toHaveCount(12);
    await page.getByRole("button", { name: /^Show/ }).click();
    await expect(page.getByTestId("menu-heading")).toHaveText("More types");
    for (const t of ["All types", "Ayahs", "Surahs", "Juz", "People", "Stories", "Pages", "Names", "Sajda verses", "Fiqh topics", "Reciters pages", "Other"]) {
      await expect(page.getByRole("menuitemradio", { name: t, exact: true })).toBeVisible();
    }
    await page.getByRole("menuitemradio", { name: "Ayahs", exact: true }).click();
    await expect(rows(page)).toHaveCount(2);
  });

  test("sort and group: recently saved first, surah order, group by collection (an item can be in several; No collection last), group by type", async ({ page }) => {
    await open(page);
    await expect(rows(page).first()).toHaveAttribute("data-key", "ayah:12:92");
    await choose(page, /^Sort and group/, "Surah order");
    await expect(rows(page).first()).toHaveAttribute("data-key", "ayah:2:255");
    await choose(page, /^Sort and group/, "Group by collection");
    await expect(page.getByTestId("group-label")).toHaveText(["Daily adhkar", "Forgiveness", "No collection"]);
    await choose(page, /^Sort and group/, "Group by type");
    await expect(page.getByTestId("group-label").first()).toHaveText("Ayahs");
    await expect(page.getByTestId("group-label").last()).toHaveText("Other");
  });

  test("snippets: only the ayah rows ask for text, one small request each, no chapter is fetched; the text is stored for next time", async ({ page }) => {
    await open(page);
    await expect(row(page, "ayah:2:255").getByTestId("row-snippet")).toHaveText("TEST ARABIC 2:255");
    expect(verse.calls).not.toContain("7:206"); // that row is below the fold: nothing is requested for rows nobody can see
    await row(page, "sajda:7:206").scrollIntoViewIfNeeded();
    await expect(row(page, "sajda:7:206").getByTestId("row-snippet")).toHaveText("TEST ARABIC 7:206");
    expect([...verse.calls].sort()).toEqual(["12:92", "2:255", "7:206"]);
    const stored = await page.evaluate(
      () =>
        new Promise<string[]>((res) => {
          const r = indexedDB.open("quran-revamp-db");
          r.onsuccess = () => {
            const q = r.result.transaction("ayah-text").objectStore("ayah-text").getAllKeys();
            q.onsuccess = () => res(q.result as string[]);
          };
        }),
    );
    expect(stored.sort()).toEqual(["12:92", "2:255", "7:206"]);
    verse.calls.length = 0;
    await page.reload();
    await expect(row(page, "ayah:2:255").getByTestId("row-snippet")).toHaveText("TEST ARABIC 2:255");
    await row(page, "sajda:7:206").scrollIntoViewIfNeeded();
    await expect(row(page, "sajda:7:206").getByTestId("row-snippet")).toHaveText("TEST ARABIC 7:206");
    expect(verse.calls).toEqual([]); // from the device now
  });

  test("a failed request says so with Try again; no cache and the request failing shows the reference and a clear line", async ({ page }) => {
    verse.mode = "http500";
    await open(page);
    const r = row(page, "ayah:2:255");
    await expect(r.getByTestId("row-snippet-missing")).toContainText("Text appears once you are online or have opened this surah.");
    await expect(r).toContainText("Al-Baqara 2:255");
    verse.mode = "ok";
    await r.getByTestId("row-retry").click();
    await expect(r.getByTestId("row-snippet")).toHaveText("TEST ARABIC 2:255");
  });

  test("offline with nothing cached: the reference and the clear line, no request and no spinner", async ({ page, context }) => {
    // nothing is cached: the first visit (online, but the per-ayah request fails) loads the page's code; then we go offline and come back in-app
    const push = (to: string) => page.evaluate((p) => (document.querySelector("#__nuxt") as unknown as { __vue_app__: { config: { globalProperties: { $router: { push(p: string): void } } } } }).__vue_app__.config.globalProperties.$router.push(p), to);
    verse.mode = "network";
    await open(page);
    await expect(row(page, "ayah:2:255").getByTestId("row-retry")).toBeVisible();
    await push("/settings");
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("Library");
    await context.setOffline(true);
    await push("/bookmarks");
    await expect(page.getByRole("heading", { level: 1, name: "Library" })).toBeVisible();
    await expect(row(page, "ayah:2:255").getByTestId("row-snippet-missing")).toBeVisible();
    await expect(row(page, "ayah:2:255").getByTestId("row-retry")).toHaveCount(0); // offline is not a failure to retry
    await expect(row(page, "ayah:2:255")).toContainText("Al-Baqara 2:255");
    await expect(page.getByTestId("row-snippet-loading")).toHaveCount(0);
    await expect(rows(page)).toHaveCount(12);
  });

  test("remove keeps the note; Undo restores the bookmark with its ORIGINAL saved time and place", async ({ page }) => {
    await open(page);
    const before = await assertLegacyLoads(page);
    await row(page, "ayah:2:255").getByTestId("row-more").click();
    await page.getByTestId("edit-remove").click();
    await expect(toast(page, "Your note is kept")).toBeVisible();
    await expect(row(page, "ayah:2:255")).toHaveCount(0);
    const mid = await assertLegacyLoads(page);
    expect(mid.list).not.toContain("ayah:2:255");
    expect(mid.at["ayah:2:255"]).toBeUndefined();
    expect(mid.lib.itemMeta["ayah:2:255"]).toEqual(before.lib.itemMeta["ayah:2:255"]); // note, tag, collection all kept
    await page.getByRole("button", { name: "Undo" }).click();
    const after = await assertLegacyLoads(page);
    expect(after.list).toEqual(before.list);
    expect(after.at["ayah:2:255"]).toBe(NOW - 2 * DAY);
    await expect(row(page, "ayah:2:255")).toHaveCount(1);
  });

  test("the edit panel: note autosaves with a status, closing mid-typing saves, tags (duplicates refused), collections toggle", async ({ page }) => {
    await open(page);
    await row(page, "surah:18").getByTestId("row-more").click();
    const sheet = page.getByTestId("edit-sheet");
    await expect(sheet).toContainText("Al-Kahf");
    await sheet.getByTestId("edit-note").fill("Friday");
    await expect(sheet.getByTestId("edit-status")).toHaveText("Saving…");
    await expect(sheet.getByTestId("edit-status")).toHaveText("Saved");
    expect(JSON.parse((await readStorage(page))["quran:library:v1"]!).itemMeta["surah:18"].note).toBe("Friday");
    await sheet.getByTestId("edit-note").fill("Friday evening"); // and close at once, before the 600 ms
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
    expect(JSON.parse((await readStorage(page))["quran:library:v1"]!).itemMeta["surah:18"].note).toBe("Friday evening");
    await expect(row(page, "surah:18")).toContainText("Friday evening");
    await row(page, "surah:18").getByTestId("row-more").click();
    await sheet.getByTestId("edit-tag-input").fill("#Weekly");
    await sheet.getByTestId("edit-tag-add").click();
    await sheet.getByTestId("edit-tag-input").fill("weekly");
    await sheet.getByTestId("edit-tag-add").click();
    await expect(sheet.getByTestId("edit-error")).toContainText("already a tag");
    await expect(sheet.getByTestId("edit-tag")).toHaveCount(1);
    const chip = sheet.getByTestId("edit-collection").filter({ hasText: "Daily adhkar" });
    await expect(chip).toHaveAttribute("aria-pressed", "false");
    await chip.click();
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await sheet.getByTestId("edit-collection-new").click();
    await sheet.getByTestId("edit-collection-name").fill("Fridays");
    await sheet.getByTestId("edit-collection-create").click();
    await expect(sheet.getByTestId("edit-collection").filter({ hasText: "Fridays" })).toHaveAttribute("aria-pressed", "true");
    await assertLegacyLoads(page);
  });

  test("Delete note clears only the note, with Undo; a note-only item can be saved too", async ({ page }) => {
    await open(page, "/bookmarks?view=notes");
    await page.locator('[data-testid="note-open"][data-key="ayah:7:23"]').click();
    const sheet = page.getByTestId("edit-sheet");
    await expect(sheet.getByTestId("edit-sub")).toContainText("Note only, not in Saved");
    await sheet.getByTestId("edit-delete-note").click();
    await expect(toast(page, "Note deleted")).toBeVisible(); // the panel closes so the Undo is reachable
    await expect(sheet).toHaveCount(0);
    expect(JSON.parse((await readStorage(page))["quran:library:v1"]!).itemMeta["ayah:7:23"]).toMatchObject({ note: "", collectionIds: [C2] });
    await page.getByRole("button", { name: "Undo" }).click();
    expect(JSON.parse((await readStorage(page))["quran:library:v1"]!).itemMeta["ayah:7:23"].note).toBe("A note on an ayah that was never saved.");
    await page.locator('[data-testid="note-open"][data-key="ayah:7:23"]').click();
    await page.getByTestId("edit-save-too").click();
    expect(JSON.parse((await readStorage(page))["quran:bookmarks:v1"]!)).toContain("ayah:7:23");
  });

  test("New note: valid; a bad reference is refused with a clear message; an ayah that already has a note opens that note", async ({ page }) => {
    await open(page);
    await page.getByTestId("new-note-open").click();
    const sheet = page.getByTestId("new-note-sheet");
    await sheet.getByTestId("new-note-ref").fill("2:999");
    await sheet.getByTestId("new-note-text").fill("x");
    await sheet.getByTestId("new-note-save").click();
    await expect(sheet.getByTestId("new-note-error")).toHaveText("Surah 2 does not have an ayah 999.");
    await sheet.getByTestId("new-note-ref").fill("115:1");
    await sheet.getByTestId("new-note-save").click();
    await expect(sheet.getByTestId("new-note-error")).toContainText("There is no surah 115");
    await sheet.getByTestId("new-note-ref").fill("112:1");
    await sheet.getByTestId("new-note-text").fill("");
    await sheet.getByTestId("new-note-save").click();
    await expect(sheet.getByTestId("new-note-error")).toHaveText("Write a note first.");
    await sheet.getByTestId("new-note-text").fill("Short and complete.");
    await sheet.getByTestId("new-note-save").click();
    await expect(sheet).toHaveCount(0);
    const { list, lib } = await assertLegacyLoads(page);
    expect(lib.itemMeta["ayah:112:1"]!.note).toBe("Short and complete.");
    expect(list).not.toContain("ayah:112:1"); // a note does not save the ayah
    await page.getByTestId("new-note-open").click();
    await page.getByTestId("new-note-ref").fill("2:255");
    await page.getByTestId("new-note-text").fill("a second note");
    await page.getByTestId("new-note-save").click();
    await expect(page.getByTestId("edit-note")).toHaveValue("Read before sleeping."); // opened the existing note, did not replace it
  });

  test("collections: create, duplicate refused, open lists note-only items too, delete with Undo, ids never reused", async ({ page }) => {
    await open(page, "/bookmarks?view=collections");
    await expect(page.getByTestId("collection-row")).toHaveCount(2);
    await expect(page.getByTestId("collection-row").filter({ hasText: "Forgiveness" })).toContainText("2 items");
    await page.getByTestId("collection-new").click();
    await page.getByTestId("collection-name").fill("forgiveness");
    await page.getByTestId("collection-create").click();
    await expect(page.getByTestId("collection-error")).toContainText("already a collection");
    await page.getByTestId("collection-name").fill("Short surahs");
    await page.getByTestId("collection-create").click();
    await expect(page.getByTestId("collection-row")).toHaveCount(3);
    await page.getByTestId("collection-open").filter({ hasText: "Forgiveness" }).click();
    await expect(page.getByTestId("collection-chip")).toContainText("Collection: Forgiveness");
    await expect(rows(page)).toHaveCount(2);
    await expect(row(page, "ayah:7:23")).toContainText("Note only");
    await page.getByTestId("collection-chip-clear").click();
    await expect(rows(page)).toHaveCount(12);
    await page.getByTestId("tab-collections").click();
    await page.getByRole("button", { name: "Delete collection Forgiveness" }).click();
    await expect(toast(page, "Collection “Forgiveness” deleted")).toBeVisible();
    const mid = await assertLegacyLoads(page);
    expect(mid.lib.collections.map((c) => c.id)).not.toContain(C2);
    expect(mid.lib.itemMeta["ayah:12:92"]!.collectionIds).toEqual([]);
    await page.getByRole("button", { name: "Undo" }).click();
    const back = await assertLegacyLoads(page);
    expect(back.lib.collections.map((c) => c.id)).toContain(C2);
    expect(back.lib.itemMeta["ayah:12:92"]!.collectionIds).toEqual([C2]);
    expect(back.lib.itemMeta["ayah:7:23"]!.collectionIds).toEqual([C2]);
    // delete again for good, then make a new one: its id is not the deleted one
    await page.getByRole("button", { name: "Delete collection Forgiveness" }).click();
    await page.getByTestId("collection-new").click();
    await page.getByTestId("collection-name").fill("Another");
    await page.getByTestId("collection-create").click();
    const ids = (await assertLegacyLoads(page)).lib.collections.map((c) => c.id);
    expect(ids).not.toContain(C2);
    expect(ids).toHaveLength(3);
  });

  test("select mode: real checkboxes with names, Space toggles, the count is announced, Escape leaves, bulk remove is ONE Undo", async ({ page }) => {
    await open(page);
    await page.getByTestId("select-toggle").click();
    const check = page.getByRole("checkbox", { name: "Select Al-Kahf" });
    await expect(check).toBeVisible();
    await expect(page.getByRole("checkbox")).toHaveCount(12);
    await check.focus();
    await page.keyboard.press("Space");
    await expect(check).toBeChecked();
    await expect(page.getByTestId("select-count")).toHaveText("1 selected");
    await expect(page.getByTestId("select-announce")).toHaveText("1 selected");
    await expect(page.getByTestId("select-announce")).toHaveAttribute("aria-live", "polite");
    await page.getByRole("checkbox", { name: "Select Juz 30" }).check();
    await expect(page.getByTestId("select-count")).toHaveText("2 selected");
    await page.getByTestId("select-remove").click();
    await expect(toast(page, "Removed 2 items from Saved")).toBeVisible();
    await expect(rows(page)).toHaveCount(10);
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(rows(page)).toHaveCount(12);
    expect((await assertLegacyLoads(page)).list).toEqual(KEYS);
    await page.getByTestId("select-toggle").click();
    await page.getByRole("checkbox", { name: "Select Al-Kahf" }).check();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("checkbox")).toHaveCount(0);
  });

  test("select mode: Add to collection (existing and new) from the bar", async ({ page }) => {
    await open(page);
    await page.getByTestId("select-toggle").click();
    await page.getByRole("checkbox", { name: "Select Al-Kahf" }).check();
    await page.getByRole("checkbox", { name: "Select Juz 30" }).check();
    await page.getByTestId("select-add").click();
    await page.getByRole("menuitemradio", { name: "Daily adhkar" }).or(page.getByRole("option", { name: "Daily adhkar" })).click();
    await expect(page.getByTestId("select-announce")).toHaveText("Added 2 items to the collection.");
    expect((await assertLegacyLoads(page)).lib.itemMeta["juz:30"]!.collectionIds).toEqual([C1]);
    await page.getByTestId("select-add").click();
    await page.getByRole("menuitemradio", { name: "New collection…" }).or(page.getByRole("option", { name: "New collection…" })).click();
    await page.getByTestId("select-new-name").fill("Both");
    await page.getByTestId("select-new-create").click();
    const lib = (await assertLegacyLoads(page)).lib;
    const both = lib.collections.find((c) => c.name === "Both")!;
    expect(lib.itemMeta["surah:18"]!.collectionIds).toContain(both.id);
  });

  test("the reader's star and pin appear in the Library without a reload (storage event, second tab)", async ({ page, context }) => {
    await open(page);
    await expect(rows(page)).toHaveCount(12);
    const other = await context.newPage();
    await other.goto("/settings");
    await other.evaluate(() => {
      const list = JSON.parse(localStorage.getItem("quran:bookmarks:v1")!);
      list.push("ayah:1:1");
      localStorage.setItem("quran:bookmarks:v1", JSON.stringify(list));
      localStorage.setItem("quran:pins:v1", JSON.stringify({ v: 1, reading: { surahNo: 2, ayahNo: 255, pinnedAt: 1 } }));
    });
    await expect(rows(page)).toHaveCount(13);
    await expect(page.getByTestId("slot-reading-link")).toHaveText("Al-Baqara, ayah 255");
    await other.close();
  });

  test("Export: the Library's keys only, named by the local date, with the real counts", async ({ page }) => {
    await open(page);
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("library-export").click()]);
    expect(download.suggestedFilename()).toBe("quran-library-2026-10-15.json");
    const path = await download.path();
    const body = JSON.parse(await (await import("node:fs")).promises.readFile(path, "utf8")) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(["quran:bookmarks:added-at:v1", "quran:bookmarks:v1", "quran:library:v1"].sort());
    await expect(toast(page, "Exported 12 saved items and 3 notes.")).toBeVisible();
  });

  test("Clear all in Settings empties the Library (and quran-app-db is never opened)", async ({ page }) => {
    await page.goto("/settings?section=data");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("clear").click();
    await Promise.all([page.waitForEvent("load"), page.getByTestId("clear-yes").click()]);
    await page.waitForLoadState("networkidle");
    await open(page);
    await expect(page.getByTestId("first-run")).toBeVisible();
    expect(await idbNames(page)).not.toContain("quran-app-db");
  });
});

test.describe("Where I stopped", () => {
  test("a pin shows with a Clear button and Undo; a damaged pin is ignored; the last-read place is the fallback without a clear button", async ({ page, context }) => {
    await seed(context, { "quran:pins:v1": JSON.stringify({ v: 1, reading: { surahNo: 2, ayahNo: 255, pinnedAt: 1 }, page: { pageNo: 49, pinnedAt: 2 }, other: { keep: 1 } }) });
    await open(page);
    await expect(page.getByTestId("slot-reading-link")).toHaveText("Al-Baqara, ayah 255");
    await expect(page.getByTestId("slot-reading-link")).toHaveAttribute("href", "/surah/2#ayah-255");
    await expect(page.getByTestId("slot-page-link")).toHaveText("Page 49");
    await page.getByRole("button", { name: "Clear the reading pin" }).click();
    await expect(page.getByTestId("slot-reading")).toContainText("Not set");
    expect(JSON.parse((await readStorage(page))["quran:pins:v1"]!)).toMatchObject({ reading: null, page: { pageNo: 49 }, other: { keep: 1 } });
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("slot-reading-link")).toHaveText("Al-Baqara, ayah 255");
  });
  test("damaged pins show Not set; with reading progress the slot says Last read and has no clear button", async ({ page, context }) => {
    await seed(context, { "quran:pins:v1": JSON.stringify({ v: 1, reading: { surahNo: 2, ayahNo: 999 }, page: { pageNo: "x" } }), "quran:reading-progress:v1": JSON.stringify({ surahNo: 18, ayahNo: 10, timestamp: NOW }) });
    await open(page);
    await expect(page.getByTestId("slot-reading")).toContainText("Last read");
    await expect(page.getByTestId("slot-reading-link")).toHaveText("Al-Kahf, ayah 10");
    await expect(page.getByRole("button", { name: "Clear the reading pin" })).toHaveCount(0);
    await expect(page.getByTestId("slot-page")).toContainText("Not set");
  });
});

test.describe("legacy migration and a blocked storage", () => {
  test("the old favourites list is merged once and removed", async ({ page, context }) => {
    await seed(context, { "quran:favorites:surah:v1": JSON.stringify(["surah:1", "surah:2"]), "quran:bookmarks:v1": JSON.stringify(["surah:2", "ayah:1:1"]) });
    await open(page);
    await expect(rows(page)).toHaveCount(3);
    const ls = await readStorage(page);
    expect(JSON.parse(ls["quran:bookmarks:v1"]!)).toEqual(["surah:2", "ayah:1:1", "surah:1"]);
    expect(ls["quran:favorites:surah:v1"]).toBeUndefined();
  });
});

test.describe("mobile (375px)", () => {
  test.use({ viewport: { width: 375, height: 800 } });
  test("one h1, no horizontal scroll, 44px targets, the edit panel is a bottom sheet", async ({ page, context }) => {
    await seed(context, LEGACY);
    await open(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    for (const id of ["select-toggle", "new-note-open", "library-export", "library-search", "tab-saved", "tab-collections", "tab-notes"]) {
      const box = (await page.getByTestId(id).first().boundingBox())!;
      expect(box.height, id).toBeGreaterThanOrEqual(43.5);
    }
    for (const b of await row(page, "ayah:2:255").getByRole("button").all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    await row(page, "ayah:2:255").getByTestId("row-more").click();
    const sheet = page.getByTestId("edit-sheet");
    await expect(sheet).toHaveAttribute("data-side", "bottom");
    for (const b of await sheet.getByRole("button").all()) {
      const box = await b.boundingBox();
      if (box) expect(box.height, (await b.textContent()) ?? "").toBeGreaterThanOrEqual(43.5);
    }
    await page.keyboard.press("Escape");
    await page.getByTestId("select-toggle").click();
    for (const c of await page.getByTestId("row-check").all()) expect((await c.evaluate((el) => el.parentElement!.getBoundingClientRect().height))).toBeGreaterThanOrEqual(43.5);
  });
});
