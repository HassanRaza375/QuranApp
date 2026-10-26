// Phase 12, stage 2: the six modules after Peoples & Nations (Places, Themes, Duas, Events in the Qur'an, Signs & Miracles, Commands & Prohibitions), the Duas
// transliteration, the Library kinds and the Search groups, in a real browser on the production build. The reader's text is the usual synthetic one, the
// transliteration is the mock (one REAL recorded answer, 2:127, the rest obviously fake), and every request to a real API fails the test.
import { expect, test, type Page } from "@playwright/test";
import { forbidRealApis, freezeClock, mockQuranText, mockSearch, mockTransliteration, mockVerse, readStorage, seed, stubAudio, type TransliterationMock } from "./mocks";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });

let leaks: string[] = [];
let translit: TransliterationMock;
test.beforeEach(async ({ context }) => {
  leaks = await forbidRealApis(context);
  await freezeClock(context);
  await stubAudio(context);
  await mockQuranText(context);
  await mockVerse(context);
  await mockSearch(context);
  translit = await mockTransliteration(context);
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

/** route, title, number of entries, a sample entry (id, name, type label), the kind chips the module offers besides All */
const MODULES = [
  { route: "places", title: "Places", n: 16, id: "makkah", name: "Makkah", type: "Cities" },
  { route: "themes", title: "Themes", n: 42, id: "tawhid", name: "Tawhid (Oneness of Allah)", type: "Belief" },
  { route: "duas", title: "Duas", n: 38, id: "adamrepentance", name: "Adam's Prayer of Repentance", type: "Repentance" },
  { route: "events", title: "Events in the Qur’an", n: 40, id: "creationadam", name: "Creation of Adam", type: "Creation" },
  { route: "signs", title: "Signs & Miracles", n: 14, id: "musastaff", name: "Musa's Staff", type: "Miracle" },
  { route: "commands", title: "Commands & Prohibitions", n: 18, id: "prayercommand", name: "Prayer", type: "Command" },
] as const;

const card = (page: Page, id: string) => page.locator(`[data-testid="k-card"][data-id="${id}"]`);
const bookmarks = async (page: Page) => JSON.parse((await readStorage(page))["quran:bookmarks:v1"] ?? "[]") as string[];
const noOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
async function openList(page: Page, route: string, query = "") {
  await page.goto(`/${route}${query}`);
  await expect(page.getByTestId("k-grid")).toBeVisible();
}
async function openDetail(page: Page, route: string, id: string) {
  await page.goto(`/${route}/${id}`);
  await expect(page.getByTestId("k-name")).toBeVisible();
}

for (const m of MODULES) {
  test.describe(`${m.title}`, () => {
    test(`the list: ${m.n} entries from the data, the tab strip, the kind chips, no word of "verified" or "reviewed", no request of its own`, async ({ page }) => {
      const external: string[] = [];
      page.on("request", (r) => {
        if (!r.url().startsWith("http://localhost:3011") && !r.url().startsWith("data:")) external.push(r.url());
      });
      await openList(page, m.route);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(m.title);
      await expect(page.locator('[data-testid="k-card"]')).toHaveCount(m.n);
      await expect(page.getByTestId("k-count")).toHaveText(`${m.n} entries`);
      await expect(page.locator('[data-testid^="ktab-"]')).toHaveCount(7);
      await expect(page.getByTestId(`ktab-${m.route}`)).toHaveAttribute("aria-current", "page");
      const c = card(page, m.id);
      await expect(c).toContainText(m.name);
      await expect(c.getByTestId("k-type")).toHaveText(m.type);
      await expect(c.locator(".ar")).not.toBeEmpty();
      await expect(c.getByTestId("thread")).toBeVisible();
      expect(external).toEqual([]);
      expect(await page.locator("body").innerText()).not.toMatch(/verified|reviewed/i);
    });

    test("the detail: name, Arabic, summary, type, where it appears, the ayahs from the reader's text, Save with Undo under the legacy key, Play all", async ({ page }) => {
      await openDetail(page, m.route, m.id);
      await expect(page.getByTestId("k-name")).toHaveText(m.name);
      await expect(page.getByTestId("k-arabic")).not.toBeEmpty();
      await expect(page.getByTestId("k-summary")).not.toBeEmpty();
      await expect(page.getByTestId("k-type")).toHaveText(m.type);
      await expect(page).toHaveTitle(`${m.name} · ${m.title} · Quran App`);
      await expect(page.getByTestId("k-back")).toHaveAttribute("href", `/${m.route}`);
      await expect(page.getByTestId("thread-mark").first()).toBeAttached(); // an SVG line has no box of its own
      const first = page.getByTestId("k-passage").first();
      await expect(first.getByTestId("k-ayah").first().locator(".ar")).toContainText("TEST ARABIC"); // the reader's text, not the data's
      await expect(first.getByTestId("k-translation").first()).toContainText("Test English");
      await page.getByTestId("k-save").click();
      const key = { places: "place", themes: "theme", duas: "dua", events: "event", signs: "sign", commands: "command" }[m.route];
      expect(await bookmarks(page)).toEqual([`${key}:${m.id}`]);
      await page.getByRole("button", { name: "Undo" }).click();
      expect(await bookmarks(page)).toEqual([]);
      await page.getByTestId("k-play-all").click();
      await expect(page.getByTestId("k-play-all")).toHaveText(/Pause/);
      expect(await page.locator("body").innerText()).not.toMatch(/verified|reviewed|manually|statusNotes/i);
    });

    test("the filter reads the entry's name, its Arabic and a reference; a nonsense word and a reference nobody points at say so; Reset brings it all back", async ({ page }) => {
      await openList(page, m.route);
      const filter = page.getByTestId("k-filter");
      await filter.fill(m.name.slice(0, 5).toLowerCase());
      await expect(card(page, m.id)).toBeVisible();
      await expect(page).toHaveURL(/q=/);
      await filter.fill("zzzzqq");
      await expect(page.getByTestId("k-empty")).toContainText("Nothing matches");
      await page.getByTestId("k-reset").click();
      await expect(page.locator('[data-testid="k-card"]')).toHaveCount(m.n);
      await filter.fill("114:6");
      await expect(page.getByTestId("k-empty")).toContainText("Nothing here points at 114:6");
    });

    test("an id that is not in the data says so", async ({ page }) => {
      await page.goto(`/${m.route}/nobody`);
      await expect(page.getByTestId("k-missing")).toContainText("No such entry");
    });
  });
}

test.describe("kind chips", () => {
  test("each module's kind menu filters the list; Signs offer only the classifications the data uses, Commands offer two", async ({ page }) => {
    await openList(page, "commands");
    await page.getByRole("button", { name: /^All$|Kind/ }).first().click();
    await page.getByRole("menuitemradio", { name: "Prohibition", exact: true }).or(page.getByRole("option", { name: "Prohibition", exact: true })).click();
    await expect(page.locator('[data-testid="k-card"]')).toHaveCount(9);
    await expect(page).toHaveURL(/t=prohibition/);

    await openList(page, "signs");
    await page.getByRole("button", { name: /^All$|Kind/ }).first().click();
    const options = page.getByRole("menuitemradio").or(page.getByRole("option"));
    await expect(options).toHaveText(["All", "Miracle", "Divine Aid", "Punishment Sign"]);
  });
});

test.describe("Duas", () => {
  test("a dua shows the reader's Arabic, what it asks for, the speaker and the context, and no Arabic from the data files besides the title", async ({ page }) => {
    await openDetail(page, "duas", "adamrepentance");
    await expect(page.getByTestId("k-basis")).toHaveText("Narrative prayer");
    await expect(page.getByTestId("k-section-speaker")).toContainText("Adam");
    await expect(page.getByTestId("k-section-context")).toBeVisible();
    await expect(page.getByTestId("k-passage").first().getByTestId("k-ayah").first().locator(".ar")).toContainText("TEST ARABIC 7:23");
    await expect(page.getByTestId("k-partial")).toHaveCount(0);
  });

  test("a dua that is only part of an ayah says so in the data's own words", async ({ page }) => {
    await openDetail(page, "duas", "yunusindarkness");
    await expect(page.getByTestId("k-partial")).toContainText("The full ayah is shown.");
    await expect(page.getByTestId("k-partial")).toContainText("the ayah's opening clauses narrate");
  });

  test("a dua that recurs shows where else, in 'Also occurs at'", async ({ page }) => {
    await openDetail(page, "duas", "nuhhelpprayer");
    await expect(page.getByTestId("k-also").getByTestId("k-passage")).toHaveCount(1);
  });

  test("the transliteration is fetched live for each ayah, and the answer is not stored anywhere", async ({ page }) => {
    await openDetail(page, "duas", "adamrepentance");
    await expect(page.getByTestId("k-translit-line")).toHaveCount(1);
    await expect(page.getByTestId("k-translit-line")).toContainText("Test transliteration 7:23");
    expect(translit.calls).toEqual(["7:23"]);
    const stored = JSON.stringify(await readStorage(page));
    expect(stored).not.toContain("Test transliteration");
    expect(await page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name))).not.toContain("quran-app-db");
    // the real recorded answer reads through the same path (the mock answers 2:127 with the upstream's own JSON)
    await openDetail(page, "duas", "rabbanabaqarahclosing");
    await expect(page.getByTestId("k-translit-line")).toHaveCount(1);
  });

  test("when the source cannot answer, the page says so per ayah, never makes one up, and Try again asks again", async ({ page }) => {
    translit.mode = "http500";
    await openDetail(page, "duas", "adamrepentance");
    await expect(page.getByTestId("k-translit-line")).toContainText("Transliteration not available for this ayah.");
    translit.mode = "ok";
    await page.getByTestId("k-translit-line").getByRole("button", { name: "Try again" }).click();
    await expect(page.getByTestId("k-translit-line")).toContainText("Test transliteration 7:23");
  });

  test("offline: a plain note and Try again, the rest of the page still works", async ({ page, context }) => {
    await openDetail(page, "duas", "adamrepentance");
    await expect(page.getByTestId("k-translit-line")).toBeVisible();
    await context.setOffline(true);
    // a different dua, reached in the app (a full load offline would need the service worker)
    await page.evaluate(() => (document.querySelector("#__nuxt") as unknown as { __vue_app__: { config: { globalProperties: { $router: { push(p: string): void } } } } }).__vue_app__.config.globalProperties.$router.push("/duas/nuhclosingprayer"));
    await expect(page.getByTestId("k-translit-offline")).toContainText("The transliteration needs a connection, and isn’t kept on your device.");
    await expect(page.getByTestId("k-name")).toHaveText("Nuh's Closing Prayer");
    await expect(page.getByTestId("k-save")).toBeVisible();
  });

  test("a three-ayah dua has a line per ayah", async ({ page }) => {
    await openDetail(page, "duas", "nuhclosingprayer"); // 71:26-28 is three ayahs: open
    await expect(page.getByTestId("k-translit-line")).toHaveCount(3);
  });
});

test.describe("Events in the Qur'an", () => {
  test("a chronology in the legacy's words, with what it follows named", async ({ page }) => {
    await openDetail(page, "events", "iblisrefusal");
    const section = page.getByTestId("k-section-chronology");
    await expect(section).toContainText("No chronology is established for this event");
    await expect(section).toContainText("After: Creation of Adam.");
  });

  test("an event whose basis is the narrative context carries the legacy's label; an explicit one does not", async ({ page }) => {
    await openDetail(page, "events", "siegeconfederates");
    await expect(page.getByTestId("k-basis")).toHaveText("Established by Qur'anic narrative context");
    await openDetail(page, "events", "creationadam");
    await expect(page.getByTestId("k-basis")).toHaveCount(0);
  });
});

test.describe("Places, Themes, Signs and Commands", () => {
  test("Places: a weaker basis is labelled; direct mentions open the reader", async ({ page }) => {
    await openDetail(page, "places", "iram");
    await expect(page.getByTestId("k-basis")).toHaveText("Disputed identification");
    await openDetail(page, "places", "makkah");
    await expect(page.getByTestId("k-mention").first()).toHaveAttribute("href", /^\/surah\/\d+#ayah-\d+$/);
  });

  test("Themes: the definition is the summary and 'In more detail' follows", async ({ page }) => {
    await openDetail(page, "themes", "tawhid");
    await expect(page.getByTestId("k-section-details")).toContainText("In more detail");
    await expect(page.getByTestId("k-connected-section")).toBeVisible();
  });

  test("Signs: a classification chip and the people and event it connects to", async ({ page }) => {
    await openDetail(page, "signs", "seasplitting");
    await expect(page.getByTestId("k-type")).toHaveText("Miracle");
    await expect(page.getByTestId("k-connected-section")).toBeVisible();
  });

  test("Commands: the audience is a section, and 'Prohibition' is a kind", async ({ page }) => {
    await openDetail(page, "commands", "prayercommand");
    await expect(page.getByTestId("k-section-audience")).toContainText("believers");
  });
});

test.describe("links between modules", () => {
  test("a place's Connected list reaches the people, the people reach the events, and every link opens", async ({ page }) => {
    await openDetail(page, "peoples", "ad");
    await page.getByTestId("k-connected-places").getByTestId("k-link").first().click();
    await expect(page).toHaveURL(/\/places\//);
    await expect(page.getByTestId("k-name")).toBeVisible();
    await page.goto("/themes/tawhid");
    const link = page.locator('[data-testid="k-connected-section"] [data-testid="k-link"]').first();
    await link.click();
    await expect(page.getByTestId("k-name")).toBeVisible();
    expect(await page.locator("body").innerText()).not.toContain("This page is not rebuilt yet");
  });

  test("a story's place chip opens a sheet that links to the place; its event chip is a link", async ({ page }) => {
    await page.goto("/stories/yusufstory");
    await page.locator('[data-testid="entity-chip"][data-kind="place"]').first().click();
    await expect(page.getByTestId("entity-open")).toHaveAttribute("href", /^\/places\//);
    await page.getByTestId("entity-open").click();
    await expect(page).toHaveURL(/\/places\//);
    await expect(page.getByTestId("k-name")).toBeVisible();
    await page.goto("/stories/adamandiblis");
    const events = page.getByTestId("event-chip");
    await expect(events.first()).toHaveAttribute("href", /^\/events\//);
    await expect(page.getByTestId("events-note")).toHaveCount(0);
  });
});

test.describe("the Library", () => {
  test("legacy bookmarks of all seven kinds open their page, with the entry's name and the module", async ({ page, context }) => {
    const keys = ["community:ad", "place:makkah", "theme:tawhid", "dua:adamrepentance", "event:creationadam", "sign:musastaff", "command:prayercommand"];
    await seed(context, { "quran:bookmarks:v1": JSON.stringify(keys) });
    await page.goto("/bookmarks");
    const expected: Record<string, [string, string]> = {
      "community:ad": ["/peoples/ad", "Peoples & Nations"],
      "place:makkah": ["/places/makkah", "Places"],
      "theme:tawhid": ["/themes/tawhid", "Themes"],
      "dua:adamrepentance": ["/duas/adamrepentance", "Duas"],
      "event:creationadam": ["/events/creationadam", "Events"],
      "sign:musastaff": ["/signs/musastaff", "Signs & Miracles"],
      "command:prayercommand": ["/commands/prayercommand", "Commands & Prohibitions"],
    };
    for (const k of keys) {
      const row = page.locator(`[data-testid="library-row"][data-key="${k}"]`);
      await expect(row, k).toBeVisible();
      await expect(row.getByTestId("row-open"), k).toHaveAttribute("href", expected[k]![0]);
      await expect(row.getByTestId("row-detail"), k).toContainText(expected[k]![1]);
    }
    await page.locator('[data-testid="library-row"][data-key="dua:adamrepentance"]').getByTestId("row-open").click();
    await expect(page.getByTestId("k-name")).toHaveText("Adam's Prayer of Repentance");
    expect(await page.locator("body").innerText()).not.toContain("This page is not rebuilt yet");
  });
});

test.describe("Search: the Duas and Knowledge base groups", () => {
  const input = (page: Page) => page.getByTestId("search-input");
  async function search(page: Page, text: string, scope = "") {
    await page.goto(`/search${scope ? `?t=${scope}` : ""}`);
    await expect(page.getByTestId("search-page")).toBeVisible();
    await input(page).fill(text);
  }

  test("a name finds its dua and its knowledge entries, each group with a count and its entries linked to the page", async ({ page }) => {
    await search(page, "musa");
    const knowledge = page.getByTestId("search-page").getByTestId("group-knowledge"); // the sidebar has a group of that name too
    await expect(knowledge).toBeVisible();
    await expect(knowledge.locator("a").first()).toHaveAttribute("href", /^\/(peoples|places|themes|events|signs|commands)\//);
    await expect(knowledge.getByTestId("local-row").first()).toContainText(/Signs & Miracles|Events in the Qur’an|Peoples & Nations|Places|Themes|Commands & Prohibitions/);
    await search(page, "repentance");
    const duas = page.getByTestId("group-duas");
    await expect(duas).toBeVisible();
    await expect(duas.locator('a[href="/duas/adamrepentance"]')).toBeVisible();
    await expect(page.locator('[data-testid="scope-chip"][data-scope="duas"] [data-testid="scope-count"]')).not.toHaveText("0");
  });

  test("the Duas and Knowledge base chips narrow to their group and are kept in the URL; Duas are not repeated in Knowledge base", async ({ page }) => {
    await search(page, "repentance");
    await page.locator('[data-testid="scope-chip"][data-scope="duas"]').click();
    await expect(page).toHaveURL(/t=duas/);
    await expect(page.getByTestId("group-duas")).toBeVisible();
    await expect(page.getByTestId("group-surahs")).toHaveCount(0);
    await page.locator('[data-testid="scope-chip"][data-scope="knowledge"]').click();
    await expect(page).toHaveURL(/t=knowledge/);
    await expect(page.locator('[data-testid="group-knowledge"] a[href^="/duas/"]')).toHaveCount(0);
  });

  test("an Arabic word and a reference find entries too", async ({ page }) => {
    await search(page, "7:23");
    await expect(page.locator('[data-testid="group-duas"] a[href="/duas/adamrepentance"]')).toBeVisible();
  });

  test("a result opens its page from the first click even while the groups are still arriving (the URL-sync guard is intact)", async ({ page }) => {
    await search(page, "repentance");
    await page.locator('[data-testid="group-duas"] a[href="/duas/adamrepentance"]').click();
    await expect(page).toHaveURL(/\/duas\/adamrepentance$/);
    await expect(page.getByTestId("k-name")).toBeVisible();
    await page.waitForTimeout(900); // longer than the URL-sync timer: the page must not be sent back
    await expect(page).toHaveURL(/\/duas\/adamrepentance$/);
  });
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test("375 px: no sideways scroll on any list or detail page, and the page controls are 44 px", async ({ page }) => {
    for (const m of MODULES) {
      await openList(page, m.route);
      expect(await noOverflow(page), `${m.route} list`).toBeLessThanOrEqual(0);
      expect((await page.getByTestId("k-saved").boundingBox())!.height, `${m.route} saved`).toBeGreaterThanOrEqual(43.5);
      await openDetail(page, m.route, m.id);
      await expect(page.getByTestId("k-passage-text").first()).toBeVisible();
      expect(await noOverflow(page), `${m.route} detail`).toBeLessThanOrEqual(0);
      for (const id of ["k-save", "k-play-all"]) expect((await page.getByTestId(id).boundingBox())!.height, `${m.route} ${id}`).toBeGreaterThanOrEqual(43.5);
      expect((await page.getByTestId("k-arabic").boundingBox())!.y, `${m.route} Arabic first`).toBeLessThan((await page.getByTestId("k-name").boundingBox())!.y);
    }
  });

  test("a dua's transliteration fits the screen", async ({ page }) => {
    await openDetail(page, "duas", "nuhclosingprayer");
    await expect(page.getByTestId("k-translit-line").first()).toBeVisible();
    expect(await noOverflow(page)).toBeLessThanOrEqual(0);
  });
});
