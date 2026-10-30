// Phase 13 (Daily Fiqh) in a real browser on the production build, on the REAL ruling data. The rules under test: a reader sees his own marja's text or nothing (never another marja's);
// held, withheld and on-hold rulings show a pointer and no text in any language; "Both" keeps each language with its own source line; a ruling with no entry says
// "Not added yet for <marja'>. Refer to his risala."; nothing is fetched (the data is bundled and chunked); Settings and these pages share one record.
import { expect, test, type Locator, type Page } from "@playwright/test";
import { loadAndControl } from "./helpers";
import { forbidRealApis, freezeClock, LAHORE_LEGACY, mockAladhan, mockQuranText, readStorage, seed } from "./mocks";

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

const PREFS = "quran:fiqh-prefs:v1";
const follow = (context: Parameters<typeof seed>[0], marjaId: string | null, lang = "en") => seed(context, { [PREFS]: JSON.stringify({ marjaId, lang, updatedAt: 1 }) });
const ruling = (page: Page, id: string) => page.locator(`[data-testid="ruling"][data-ruling="${id}"]`);
async function openTopic(page: Page, category: string, topic: string) {
  await page.goto(`/fiqh/${category}/${topic}`);
  await expect(page.getByTestId("fiqh-topic-title")).toBeVisible();
  await expect(page.getByText("Loading the rulings…")).toHaveCount(0);
  if (await page.getByTestId("fiqh-show-all").count()) await page.getByTestId("fiqh-show-all").click(); // the first ten are shown; these tests look for a particular ruling
}
const prefs = async (page: Page) => JSON.parse((await readStorage(page))[PREFS] ?? "null") as { marjaId: string | null; lang: string; updatedAt: number } | null;
const noOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe("the hub", () => {
  test("nothing is shown until a marja' is chosen; choosing one is saved on the legacy record and shows the topics; the other categories say Coming later", async ({ page }) => {
    const external: string[] = [];
    page.on("request", (r) => {
      if (!r.url().startsWith("http://localhost:3011") && !r.url().startsWith("data:")) external.push(r.url());
    });
    await page.goto("/fiqh");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Daily Fiqh");
    await expect(page.getByTestId("fiqh-gate")).toContainText("Choose your marja'");
    await expect(page.getByTestId("marja-bar")).toHaveCount(0);
    await expect(page.getByTestId("fiqh-unreviewed")).toHaveText("Not scholar-reviewed");
    await page.getByTestId("marja-sistani").click();
    await expect(page.getByTestId("marja-bar")).toContainText("Ayatullah al-Sayyid Ali al-Husayni al-Sistani");
    await expect(page.getByTestId("fiqh-gate")).toHaveCount(0);
    expect(await prefs(page)).toMatchObject({ marjaId: "sistani" }); // `lang` is written when it is first chosen; the reader defaults to English
    const counts = await page.getByTestId("fiqh-category-count").allTextContents();
    expect(counts).toEqual(["5 topics", "8 topics", "20 topics", "13 topics", "14 topics", "7 topics", "Coming later", "Coming later", "Coming later"]);
    await expect(page.getByTestId("fiqh-category-hajj")).not.toHaveAttribute("href", /.*/);
    await expect(page.getByTestId("fiqh-category-salat")).toHaveAttribute("href", "/fiqh/salat");
    expect(external).toEqual([]);
  });

  test("the marja' and the language are one record with Settings: a choice here is read there, and the record keeps the legacy shape", async ({ page, context }) => {
    await seed(context, { [PREFS]: JSON.stringify({ marjaId: "khamenei", lang: "ur", updatedAt: 5, other: "kept" }) });
    await page.goto("/fiqh/choose-marja");
    await expect(page.getByTestId("marja-khamenei")).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("fiqh-lang").getByRole("radio", { name: "اردو" })).toBeChecked();
    await page.getByTestId("fiqh-lang").getByRole("radio", { name: "Both" }).click();
    expect(await prefs(page)).toMatchObject({ marjaId: "khamenei", lang: "both", other: "kept" });
    await page.getByTestId("marja-sistani").click(); // choosing sends you back to the hub
    await expect(page).toHaveURL(/\/fiqh$/);
    expect(await prefs(page)).toMatchObject({ marjaId: "sistani", lang: "both" });
  });

  test("Makarem Shirazi can be chosen, and says his rulings are not added yet", async ({ page }) => {
    await page.goto("/fiqh/choose-marja");
    await expect(page.getByTestId("marja-pending")).toContainText("not added yet");
    await page.getByTestId("marja-makarem").click();
    expect((await prefs(page))!.marjaId).toBe("makarem");
  });

  test("the Sunni setting shows the Ja'fari-only note; a Ja'fari setting does not", async ({ page, context }) => {
    await follow(context, "sistani");
    await page.goto("/fiqh");
    await expect(page.getByTestId("fiqh-sunni")).toContainText("Fiqh Ja'fari only for now");
    await seed(context, { prayerFiqh: "jafari" });
    await page.reload();
    await expect(page.getByTestId("fiqh-sunni")).toHaveCount(0);
  });

  test("the search box finds topics, rulings and glossary terms, in English and by Urdu and Arabic spelling; nonsense says so", async ({ page, context }) => {
    await follow(context, "sistani");
    await page.goto("/fiqh");
    await page.getByTestId("fiqh-search").fill("wudu");
    await expect(page.getByTestId("fiqh-results").locator('a[href="/fiqh/taharat/wudu"]')).toBeVisible();
    await page.getByTestId("fiqh-search").fill("ihtiyat");
    await expect(page.getByTestId("fiqh-results")).toContainText("Glossary");
    await page.getByTestId("fiqh-search").fill("qqzzxx");
    await expect(page.getByTestId("fiqh-search-empty")).toContainText("No topics, rulings or terms match");
  });
});

test.describe("a category", () => {
  test("each topic says how many of its rulings are shown for the chosen marja', from the real data", async ({ page, context }) => {
    await follow(context, "sistani");
    await page.goto("/fiqh/foundations");
    await expect(page.getByTestId("fiqh-topics")).toBeVisible();
    await expect(page.locator('[data-testid="fiqh-topic-card"][data-id="taqlid"] [data-testid="fiqh-topic-count"]')).toContainText(/\d+ of \d+ rulings shown for Sistani/);
    await expect(page.getByTestId("fiqh-topic-card")).toHaveCount(5);
  });

  test("a category with no topics says Coming later; a section that does not exist says so", async ({ page, context }) => {
    await follow(context, "sistani");
    await page.goto("/fiqh/hajj");
    await expect(page.getByTestId("fiqh-category-empty")).toContainText("Coming later");
    await page.goto("/fiqh/nothing");
    await expect(page.getByTestId("fiqh-category-missing")).toContainText("No such section");
  });

  test("for Makarem Shirazi every topic shows 0 shown, and for Khamenei the zakat topics show none", async ({ page, context }) => {
    await follow(context, "makarem");
    await page.goto("/fiqh/foundations");
    for (const c of await page.getByTestId("fiqh-topic-count").allTextContents()) if (/ of /.test(c)) expect(c).toMatch(/^0 of \d+ rulings shown for Makarem Shirazi$/);
    await seed(context, { [PREFS]: JSON.stringify({ marjaId: "khamenei", lang: "en", updatedAt: 2 }) });
    await page.goto("/fiqh/zakat");
    await expect(page.locator('[data-testid="fiqh-topic-card"][data-id="zakatcrops"] [data-testid="fiqh-topic-count"]')).toContainText("0 of 32 rulings shown for Khamenei");
  });
});

test.describe("a topic: the marja's own text, or nothing", () => {
  test("Sistani: a ruling is quoted exactly with its book, number and a link to the official text; badges carry words", async ({ page, context }) => {
    await follow(context, "sistani");
    await openTopic(page, "foundations", "taqlid");
    const r = ruling(page, "obtainingfatwa");
    await expect(r.getByTestId("ruling-text")).toContainText("There are four ways to obtain a fatwa");
    await expect(r.getByTestId("ruling-basis")).toContainText("Fatwa");
    const source = r.getByTestId("fiqh-source").first();
    await expect(source).toContainText("According to Ayatullah al-Sayyid Ali al-Husayni al-Sistani");
    await expect(source).toContainText("Islamic Laws");
    await expect(source).toContainText("Ruling 4");
    await expect(source.getByRole("link", { name: /official website/ })).toHaveAttribute("href", "https://www.sistani.org/english/book/48/2117/");
    await expect(page.getByTestId("fiqh-overview")).toContainText("Written by the app, not a ruling");
    await expect(page.getByTestId("fiqh-disclaimer")).toContainText("study aid");
  });

  test("Khamenei in the same topic: a ruling he has no entry for says 'Not added yet for Khamenei. Refer to his risala.' and shows no text of Sistani's", async ({ page, context }) => {
    await follow(context, "khamenei");
    await openTopic(page, "foundations", "taqlid");
    const r = ruling(page, "obtainingfatwa");
    await expect(r.getByTestId("ruling-missing")).toContainText("Not added yet for Khamenei. Refer to his risala.");
    await expect(r).not.toContainText("There are four ways to obtain a fatwa");
    await expect(page.locator("main")).not.toContainText("Islamic Laws");
  });

  test("Makarem Shirazi: every ruling says Not added yet, and no ruling text of either marja' appears", async ({ page, context }) => {
    await follow(context, "makarem");
    await openTopic(page, "foundations", "taqlid");
    await expect(page.getByTestId("fiqh-nothing-for-marja")).toContainText("Not added yet for Makarem Shirazi. Refer to his risala.");
    await expect(page.getByTestId("ruling-text")).toHaveCount(0);
  });

  test("Khamenei in a Zakat topic (he has none): one notice, never Sistani's zakat text", async ({ page, context }) => {
    await follow(context, "khamenei");
    await openTopic(page, "zakat", "zakatcrops");
    await expect(page.getByTestId("fiqh-nothing-for-marja")).toContainText("Not added yet for Khamenei. Refer to his risala.");
    await expect(page.getByTestId("ruling-text")).toHaveCount(0);
    await expect(page.getByTestId("ruling-text-ur")).toHaveCount(0);
    await openTopic(page, "sawm", "zakatfitrah");
    await expect(page.getByTestId("fiqh-nothing-for-marja")).toBeVisible();
  });

  test("Sistani in the same Zakat topic does get his text", async ({ page, context }) => {
    await follow(context, "sistani");
    await openTopic(page, "zakat", "zakatcrops");
    await expect(page.getByTestId("ruling-text").first()).toBeVisible();
  });

  test("a ruling the legacy holds for review shows a pointer to his own book and no text, in English, Urdu and Both", async ({ page, context }) => {
    for (const lang of ["en", "ur", "both"]) {
      await follow(context, "khamenei", lang);
      await openTopic(page, "salat", "prayertimes");
      const r = ruling(page, "zuhrasrtime");
      await expect(r.getByTestId("ruling-pointer")).toHaveAttribute("data-reason", "held");
      await expect(r.getByTestId("ruling-pointer")).toContainText("Refer to his risala");
      await expect(r.getByRole("link", { name: /official website/ })).toHaveAttribute("href", /^https:\/\/www\.leader\.ir\//);
      await expect(r.getByTestId("ruling-text")).toHaveCount(0);
      await expect(r.getByTestId("ruling-text-ur")).toHaveCount(0);
    }
  });

  test("English withheld because it differs from his Persian original: a pointer, no English and no Urdu substitute", async ({ page, context }) => {
    for (const lang of ["en", "ur"]) {
      await follow(context, "khamenei", lang);
      await openTopic(page, "salat", "clothing");
      const r = ruling(page, "goldmen");
      await expect(r.getByTestId("ruling-pointer")).toHaveAttribute("data-reason", "english-differs");
      await expect(r.getByTestId("ruling-text")).toHaveCount(0);
      await expect(r.getByTestId("ruling-text-ur")).toHaveCount(0);
    }
  });

  test("a ruling the check could not settle (needs-human) is held behind the same pointer, for him only", async ({ page, context }) => {
    await follow(context, "khamenei", "en");
    await openTopic(page, "taharat", "mutahhirat");
    await expect(ruling(page, "asphalt").getByTestId("ruling-pointer")).toHaveAttribute("data-reason", "check-pending");
    await expect(ruling(page, "asphalt").getByTestId("ruling-text")).toHaveCount(0);
    await follow(context, "sistani", "en");
    await openTopic(page, "taharat", "mutahhirat");
    await expect(ruling(page, "asphalt").getByTestId("ruling-pointer")).toHaveCount(0);
    await expect(ruling(page, "asphalt").getByTestId("ruling-text")).toBeVisible();
  });

  test("\"Both\" gives each language its own source line and never calls one a translation of the other", async ({ page, context }) => {
    await follow(context, "sistani", "both");
    await openTopic(page, "foundations", "taqlid");
    const r = ruling(page, "taqlidoptions");
    await expect(r.getByTestId("ruling-en")).toBeVisible();
    await expect(r.getByTestId("ruling-ur")).toBeVisible();
    await expect(r.getByTestId("ruling-en").getByTestId("fiqh-source")).toContainText("Islamic Laws");
    await expect(r.getByTestId("ruling-ur").getByTestId("fiqh-source")).toContainText("توضیح المسائل");
    expect(await r.innerText()).not.toMatch(/translat/i);
  });

  test("an Urdu reader gets the English where there is no official Urdu, with a notice that says so", async ({ page, context }) => {
    await follow(context, "sistani", "ur");
    await openTopic(page, "foundations", "taqlid");
    const missing = page.getByTestId("notice-no-urdu").first();
    await expect(missing).toContainText("No official Urdu text for this ruling yet, so the English is shown.");
    await expect(missing).not.toContainText(/decision/i);
  });

  test("a ruling whose only official text is Urdu says there is no official English, and the app does not translate", async ({ page, context }) => {
    await follow(context, "khamenei", "en");
    await openTopic(page, "taharat", "wudu");
    const r = ruling(page, "wududoubtperformed");
    await expect(r.getByTestId("notice-urdu-only")).toContainText("no official English translation");
    await expect(r.getByTestId("ruling-text-ur")).toBeVisible();
    await expect(r.getByTestId("ruling-text")).toHaveCount(0);
  });

  test("a Q&A entry shows its question and answer; the working references of the legacy author are never on the page", async ({ page, context }) => {
    await follow(context, "khamenei", "en");
    await openTopic(page, "taharat", "wudu");
    const r = ruling(page, "wuduwashingcount");
    await expect(r.getByTestId("ruling-en")).toContainText("Question");
    await expect(r.getByTestId("ruling-en")).toContainText("Answer");
    expect(await page.locator("main").innerText()).not.toMatch(/decision P\d|rule R\d|Data note|not shown in the UI|\(P\d+\)/);
  });

  test("women's rulings and 'purity of persons' are collapsed by default and open on a tap", async ({ page, context }) => {
    await follow(context, "sistani");
    await openTopic(page, "taharat", "haydistihadanifas");
    await expect(page.getByTestId("fiqh-sensitive")).toBeVisible();
    await expect(page.getByTestId("fiqh-sensitive").getByTestId("ruling").first()).toBeHidden();
    await page.getByTestId("fiqh-sensitive").getByRole("button").click();
    await expect(page.getByTestId("fiqh-sensitive").getByTestId("ruling").first()).toBeVisible();
    await openTopic(page, "taharat", "najasat");
    await expect(page.getByTestId("fiqh-panel")).toContainText("Purity of persons");
    await expect(page.getByTestId("fiqh-panel").getByTestId("ruling").first()).toBeHidden();
  });

  test("the Qur'anic basis shows the ayah from the reader's text; the topics that pay point only to his official site", async ({ page, context }) => {
    await follow(context, "sistani");
    await openTopic(page, "taharat", "wudu");
    await expect(page.getByTestId("fiqh-quran").getByTestId("k-ayah").first().locator(".ar")).toContainText("TEST ARABIC 5:6");
    await openTopic(page, "zakat", "zakatrecipients");
    await expect(page.getByTestId("fiqh-pay")).toContainText("does not collect or hold payments");
    await expect(page.getByTestId("fiqh-pay").getByRole("link")).toHaveAttribute("href", "https://www.sistani.org");
  });

  test("a topic with many rulings shows the first ten and 'Show all N'; the button shows the rest", async ({ page, context }) => {
    await follow(context, "sistani");
    await page.goto("/fiqh/taharat/wudu");
    await expect(page.getByTestId("fiqh-ruling-count")).toBeVisible();
    expect(await page.getByTestId("ruling").count()).toBe(10);
    const n = await page.getByTestId("fiqh-ruling-count").innerText();
    expect(Number(n)).toBeGreaterThan(10);
    await page.getByTestId("fiqh-show-all").click();
    expect(await page.getByTestId("ruling").count()).toBeGreaterThan(10);
  });

  test("Save stars the topic under the legacy key (fiqh:<topic>), with Undo", async ({ page, context }) => {
    await follow(context, "sistani");
    await openTopic(page, "foundations", "taqlid");
    await page.getByTestId("fiqh-save").click();
    expect(JSON.parse((await readStorage(page))["quran:bookmarks:v1"] ?? "[]")).toEqual(["fiqh:taqlid"]);
    await page.getByRole("button", { name: "Undo" }).click();
    expect(JSON.parse((await readStorage(page))["quran:bookmarks:v1"] ?? "[]")).toEqual([]);
  });

  test("no marja' chosen: the topic still shows its overview and asks for a marja', with no ruling", async ({ page }) => {
    await page.goto("/fiqh/foundations/taqlid");
    await expect(page.getByTestId("fiqh-overview")).toBeVisible();
    await expect(page.locator('[data-testid="fiqh-rulings"] [data-testid="fiqh-gate"]')).toBeVisible();
    await expect(page.getByTestId("ruling")).toHaveCount(0);
  });

  test("a topic or section that does not exist says so instead of a blank page", async ({ page }) => {
    await page.goto("/fiqh/salat/nothing");
    await expect(page.getByTestId("fiqh-topic-missing")).toContainText("No such topic");
  });
});

test.describe("glossary, Library and Search", () => {
  test("the glossary lists the 94 terms with their sources, filters in any script and opens a term by its link", async ({ page }) => {
    await page.goto("/fiqh/glossary");
    await expect(page.getByTestId("fiqh-term")).toHaveCount(94);
    await expect(page.getByTestId("fiqh-glossary-count")).toHaveText("94 terms");
    await page.getByTestId("fiqh-glossary-filter").fill("ihtiyat");
    expect(await page.getByTestId("fiqh-term").count()).toBeGreaterThan(0);
    await page.getByTestId("fiqh-glossary-filter").fill("qqzzxx");
    await expect(page.getByTestId("fiqh-glossary-empty")).toBeVisible();
  });

  test("a legacy fiqh bookmark opens its topic from the Library", async ({ page, context }) => {
    await seed(context, { "quran:bookmarks:v1": JSON.stringify(["fiqh:taqlid", "fiqh:wudu"]) });
    await page.goto("/bookmarks");
    const row = page.locator('[data-testid="library-row"][data-key="fiqh:taqlid"]');
    await expect(row.getByTestId("row-open")).toHaveAttribute("href", "/fiqh/foundations/taqlid");
    await row.getByTestId("row-open").click();
    await expect(page.getByTestId("fiqh-topic-title")).toContainText("Taqlid");
  });

  test("Search has a Daily Fiqh group, with its own chip, that opens the topic", async ({ page, context }) => {
    await follow(context, "sistani");
    await page.route(/api\.alquran\.cloud\/v1\/search\//, (route) => route.fulfill({ status: 404, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ code: 404, status: "Not Found", data: "No matches" }) }));
    await page.goto("/search");
    await page.getByTestId("search-input").fill("wudu");
    const group = page.getByTestId("search-page").getByTestId("group-fiqh");
    await expect(group).toBeVisible();
    await expect(group.locator('a[href="/fiqh/taharat/wudu"]')).toBeVisible();
    await page.locator('[data-testid="scope-chip"][data-scope="fiqh"]').click();
    await expect(page).toHaveURL(/t=fiqh/);
    await group.locator("a").first().click();
    await expect(page.getByTestId("fiqh-topic")).toBeVisible();
  });

  test("the Search chip order puts Daily Fiqh before Notes and after the Knowledge base", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByTestId("scope-chip")).toHaveText(["All", "Ayahs", "Surahs", "People", "Stories", "Duas", "Knowledge base", "Daily Fiqh", "Notes"]);
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test("375 px: no sideways scroll on the hub, a category, a topic, the glossary and the picker; the controls are 44 px", async ({ page, context }) => {
    await follow(context, "sistani", "both");
    for (const path of ["/fiqh", "/fiqh/foundations", "/fiqh/choose-marja", "/fiqh/glossary"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await noOverflow(page), path).toBeLessThanOrEqual(0);
    }
    await openTopic(page, "foundations", "taqlid");
    expect(await noOverflow(page)).toBeLessThanOrEqual(0);
    for (const id of ["fiqh-save", "marja-change"]) expect(((await page.getByTestId(id).boundingBox()) as NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>).height, id).toBeGreaterThanOrEqual(43.5);
    expect((await page.getByTestId("fiqh-topic-title").boundingBox())!.y).toBeGreaterThan((await page.locator(".ar").first().boundingBox())!.y); // the Arabic term first on a phone
  });
});

test.describe("offline (level B): the data is saved when a category is opened, or by 'Save all for offline'", () => {
  test.use({ serviceWorkers: "allow" });
  const cached = (page: Page) =>
    page.evaluate(async () => {
      const names = await caches.keys();
      const keys: string[] = [];
      if (names.includes("wajibat-data-cache")) for (const r of await (await caches.open("wajibat-data-cache")).keys()) keys.push(r.url);
      const precache: string[] = [];
      for (const n of names.filter((x) => x.includes("precache"))) for (const r of await (await caches.open(n)).keys()) precache.push(r.url);
      return { data: keys.filter((k) => /wajibat-data-/.test(k)), precacheHasData: precache.some((u) => /wajibat-data-/.test(u)), precacheSize: precache.length };
    });

  test("the data chunks are not in the install-time precache", async ({ page, context }) => {
    await follow(context, "sistani");
    await loadAndControl(page, "/about");
    const c = await cached(page);
    expect(c.precacheSize).toBeGreaterThan(10);
    expect(c.precacheHasData).toBe(false);
    expect(c.data).toEqual([]); // nothing is saved until Daily Fiqh is opened
  });

  test("a category you opened works offline, including after a reload; a category you did not open says it is not on the device and offers Try again", async ({ page, context }) => {
    await follow(context, "sistani");
    await loadAndControl(page, "/about");
    await page.goto("/fiqh/foundations/taqlid");
    await expect(ruling(page, "obtainingfatwa").getByTestId("ruling-text")).toContainText("There are four ways to obtain a fatwa");
    await expect.poll(async () => (await cached(page)).data.some((u) => /wajibat-data-foundations/.test(u)) && (await cached(page)).data.some((u) => /wajibat-data-core/.test(u))).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await expect(ruling(page, "obtainingfatwa").getByTestId("ruling-text")).toContainText("There are four ways to obtain a fatwa");
    // in the app, to a category that was never opened
    await page.evaluate(() => (document.querySelector("#__nuxt") as unknown as { __vue_app__: { config: { globalProperties: { $router: { push(p: string): void } } } } }).__vue_app__.config.globalProperties.$router.push("/fiqh/salat/clothing"));
    await expect(page.getByTestId("fiqh-topic-unavailable")).toContainText("aren’t on your device yet");
    await expect(page.getByTestId("fiqh-overview")).toBeVisible(); // the overview is in the part that is on the device
    await context.setOffline(false);
    await page.getByTestId("fiqh-topic-unavailable").getByRole("button", { name: "Try again" }).click();
    await expect(ruling(page, "goldmen").or(page.getByTestId("fiqh-show-all"))).toBeVisible();
  });

  test("'Save all for offline' saves every category and the core; the whole module then works offline", async ({ page, context }) => {
    await follow(context, "sistani");
    await loadAndControl(page, "/fiqh");
    await expect(page.getByTestId("fiqh-save-all")).toHaveText("Save all");
    await page.getByTestId("fiqh-save-all").click();
    await expect(page.getByTestId("fiqh-save-all")).toHaveText("Saved for offline");
    const c = await cached(page);
    for (const name of ["core", "foundations", "taharat", "salat", "sawm", "khums", "zakat"]) expect(c.data.some((u) => new RegExp(`wajibat-data-${name}-`).test(u)), name).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByTestId("fiqh-save-all")).toHaveText("Saved for offline");
    await page.goto("/fiqh/zakat/zakatcrops");
    await expect(page.getByTestId("ruling-text").first()).toBeVisible();
  });

  test("a brand-new tab opened offline at /fiqh, on a device that never opened Daily Fiqh online, says so instead of showing a blank page", async ({ page, context }) => {
    await loadAndControl(page, "/about");
    await context.setOffline(true);
    const tab = await context.newPage();
    await tab.goto("/fiqh");
    await expect(tab.getByTestId("fiqh-unavailable")).toContainText("Daily Fiqh isn’t on this device yet");
    await expect(tab.getByRole("button", { name: "Try again" })).toBeVisible();
  });
});

test.describe("13b: guided steps, recitations, the live panel, and the helpers", () => {
  const push = (page: Page, to: string) =>
    page.evaluate((p) => (document.querySelector("#__nuxt") as unknown as { __vue_app__: { config: { globalProperties: { $router: { push(p: string): void } } } } }).__vue_app__.config.globalProperties.$router.push(p), to);

  test("a guided procedure shows one step at a time with the ruling it quotes, its book and number; Next, Previous and Show all steps work; the titles say they are written by the app", async ({ page, context }) => {
    await follow(context, "sistani");
    await openTopic(page, "taharat", "wudu");
    const proc = page.locator('[data-testid="fiqh-procedure"][data-procedure="wudusistani"]');
    await expect(proc).toContainText("Step titles are written by the app");
    await expect(proc.getByTestId("step-counter")).toHaveText("Step 1 of 7");
    await expect(proc.getByTestId("step-quote")).toContainText("It is not necessary for one to actually utter the intention");
    await expect(proc.getByTestId("fiqh-source")).toContainText("Islamic Laws");
    await expect(proc.getByTestId("step-prev")).toBeDisabled();
    await proc.getByTestId("step-next").click();
    await expect(proc.getByTestId("step-counter")).toHaveText("Step 2 of 7");
    await proc.getByTestId("step-prev").click();
    await expect(proc.getByTestId("step-counter")).toHaveText("Step 1 of 7");
    await proc.getByTestId("step-all").click();
    await expect(proc.getByTestId("fiqh-step")).toHaveCount(7);
    await proc.getByTestId("step-one").click();
    await expect(proc.getByTestId("step-counter")).toBeVisible();
    expect(await proc.innerText()).not.toMatch(/decision P\d|rule R\d|\(P\d+\)/);
  });

  test("a marja with no guide for the topic says Not added yet; Khamenei has his own tayammum guide; another marja's steps are never shown", async ({ page, context }) => {
    await follow(context, "khamenei");
    await openTopic(page, "taharat", "wudu");
    await expect(page.getByTestId("fiqh-steps-none")).toContainText("Not added yet for Khamenei. Refer to his risala.");
    await expect(page.getByTestId("fiqh-procedure")).toHaveCount(0);
    await openTopic(page, "taharat", "tayammum");
    await expect(page.locator('[data-testid="fiqh-procedure"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="fiqh-procedure"]')).toHaveAttribute("data-procedure", "tayammumkhamenei");
    await follow(context, "makarem");
    await openTopic(page, "taharat", "wudu");
    await expect(page.getByTestId("fiqh-steps-none")).toContainText("Not added yet for Makarem Shirazi. Refer to his risala.");
  });

  test("a step that quotes a ruling whose English is withheld shows the pointer, not the quote, and no Urdu in its place", async ({ page, context }) => {
    await follow(context, "khamenei");
    await openTopic(page, "salat", "guidedprayers");
    const proc = page.locator('[data-testid="fiqh-procedure"][data-procedure="zuhrkhamenei"]');
    await proc.getByTestId("step-all").click();
    const step = proc.locator('[data-testid="fiqh-step"][data-step="s19"]');
    await expect(step.getByTestId("ruling-pointer")).toHaveAttribute("data-reason", "english-differs");
    await expect(step.getByTestId("step-quote")).toHaveCount(0);
    await expect(proc.locator('[data-testid="fiqh-step"][data-step="s1"]').getByTestId("step-quote")).toBeVisible(); // the others are quoted
  });

  test("a recitation is shown beside the ruling and the step that carry it, from its own source, for his followers only", async ({ page, context }) => {
    await follow(context, "sistani");
    await openTopic(page, "salat", "rukusujud");
    const dhikr = ruling(page, "rukudhikr");
    await expect(dhikr.getByTestId("ruling-recitation")).toBeVisible();
    await expect(dhikr.getByTestId("ruling-recitation").getByTestId("fiqh-source")).toBeVisible();
    expect(await dhikr.getByTestId("ruling-recitation").locator(".ar").innerText()).toMatch(/\S/);
    await openTopic(page, "salat", "guidedprayers");
    const proc = page.locator('[data-testid="fiqh-procedure"][data-procedure="fajrsistani"]');
    await proc.getByTestId("step-all").click();
    await expect(proc.getByTestId("ruling-recitation")).toHaveCount(4);
    await follow(context, "khamenei");
    await openTopic(page, "salat", "rukusujud");
    await expect(page.getByTestId("ruling-recitation")).toHaveCount(0);
  });

  test("the four helpers are shown in the production build to the marja' who has them (Sistani and Khamenei: wuḍūʾ and doubts; Makarem Shirazi none), each saying Not scholar-reviewed; their walks are in e2e/fiqhHelpers.spec.ts", async ({ page, context }) => {
    for (const [marja, count] of [["sistani", 1], ["khamenei", 1], ["makarem", 0]] as const) {
      await follow(context, marja);
      for (const [category, topic] of [["taharat", "wudu"], ["salat", "doubts"]] as const) {
        await openTopic(page, category, topic);
        await expect(page.getByTestId("fiqh-helper"), `${marja} ${topic}`).toHaveCount(count);
        if (count) {
          await expect(page.getByText("Find your answer")).toBeVisible();
          await expect(page.getByTestId("fiqh-helper")).toContainText("Not scholar-reviewed");
        } else await expect(page.getByText("Find your answer")).toHaveCount(0);
      }
    }
  });

  test("the live panel on the prayer-times topic makes no request; it says to open Prayer Times when nothing is loaded, and shows the Prayer Times feature's times as they are once it has loaded them", async ({ page, context }) => {
    const aladhan = await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY, prayerFiqh: "jafari", [PREFS]: JSON.stringify({ marjaId: "sistani", lang: "en", updatedAt: 1 }) });
    await openTopic(page, "salat", "prayertimes");
    await expect(page.locator('[data-testid="fiqh-live"][data-tool="prayertimes"]')).toBeVisible();
    await expect(page.getByTestId("live-none")).toContainText("Open Prayer Times to load today's times for your location.");
    expect(aladhan.calls).toEqual([]); // the panel asked for nothing
    await page.goto("/prayerTime");
    await expect(page.getByTestId("next-card")).toBeVisible();
    await push(page, "/fiqh/salat/prayertimes");
    await expect(page.getByTestId("live-times")).toBeVisible();
    await expect(page.getByTestId("live-times").locator("li")).toHaveCount(7);
    await expect(page.getByTestId("live-sunni")).toHaveCount(0); // a Ja'fari setting: no note
  });

  test("on the fasting-times topic the panel shows dawn and maghrib and links to the Ramadan page; on the qibla topic it links to the Qibla tool; a Sunni setting says the times use the Sunni method", async ({ page, context }) => {
    await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY, [PREFS]: JSON.stringify({ marjaId: "sistani", lang: "en", updatedAt: 1 }) });
    await page.goto("/prayerTime");
    await expect(page.getByTestId("next-card")).toBeVisible();
    await push(page, "/fiqh/sawm/sawmtimes");
    const panel = page.locator('[data-testid="fiqh-live"][data-tool="sawm"]');
    await expect(panel).toContainText("Today's dawn and maghrib");
    await expect(panel.getByTestId("live-times").locator("li")).toHaveCount(2);
    await expect(panel.getByRole("link", { name: "Ramadan fasting log" })).toHaveAttribute("href", "/ramadan");
    await expect(panel.getByTestId("live-sunni")).toContainText("Sunni");
    await push(page, "/fiqh/salat/qibla");
    await expect(page.locator('[data-testid="fiqh-live"][data-tool="qibla"]').getByRole("link", { name: "Qibla tool" })).toHaveAttribute("href", "/qibla-direction");
  });

  test("375 px: a guided procedure and the live panel fit the screen and their controls are 44 px", async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await follow(context, "sistani", "both");
    await openTopic(page, "taharat", "wudu");
    expect(await noOverflow(page)).toBeLessThanOrEqual(0);
    for (const id of ["step-next", "step-all"]) expect((await page.getByTestId(id).first().boundingBox())!.height, id).toBeGreaterThanOrEqual(43.5);
    await openTopic(page, "salat", "prayertimes");
    expect(await noOverflow(page)).toBeLessThanOrEqual(0);
  });
});
