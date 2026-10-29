// Phase 15: About, Sitemap, Surah videos and the /juz/<n> redirect in a real browser, on the production build. None of them asks any service for
// anything (level A): an unmocked request to a real API fails the test. See docs/pages/about.md, sitemap.md, surah-videos.md.
import { expect, test, type Page } from "@playwright/test";
import { JUZ } from "../app/lib/quranMeta";
import { juzTarget } from "../app/lib/juzRedirect";
import { SOURCE_HOSTS } from "../app/lib/about";
import { loadAndControl } from "./helpers";
import { forbidRealApis, mockQuranText, mockVerse, seed } from "./mocks";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });

let leaks: string[] = [];
test.beforeEach(async ({ context }) => {
  leaks = await forbidRealApis(context);
  await mockQuranText(context);
  await mockVerse(context);
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

const noScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const errors = (page: Page) => {
  const out: string[] = [];
  page.on("console", (m) => m.type() === "error" && out.push(m.text()));
  page.on("pageerror", (e) => out.push(String(e)));
  return out;
};

test.describe("About", () => {
  test("says what it is, what stays on the device, where things come from (every service, with what is sent) and what it is not", async ({ page }) => {
    const errs = errors(page);
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1, name: "About" })).toBeVisible();
    await expect(page.getByTestId("about-device")).toContainText("saved in this browser, on this device, and are not uploaded anywhere");
    const rows = page.getByTestId("about-source");
    await expect(rows).toHaveCount(5);
    const hosts = await rows.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.host!));
    expect(hosts).toEqual(SOURCE_HOSTS.filter((h) => h !== "media.githubusercontent.com"));
    for (const a of await rows.locator("a").all()) {
      await expect(a).toHaveAttribute("target", "_blank");
      await expect(a).toHaveAttribute("rel", /noopener/);
    }
    await expect(page.getByTestId("about-source").filter({ hasText: "Open-Meteo" })).toContainText("Only the city you type, and only when you press Search.");
    await expect(page.getByTestId("about-grounding")).toContainText("points to the ayahs it comes from");
    await expect(page.getByTestId("about-limits")).toContainText("follow your own marja’ or a local scholar");
    await expect(page.locator("body")).not.toContainText(/vuetify|nuxt/i);
    expect(errs).toEqual([]);
  });

  test("links to the seven study pages, Settings and the Sitemap", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByTestId("about-modules").getByRole("link")).toHaveCount(7);
    await expect(page.getByTestId("about-module-duas")).toHaveAttribute("href", "/duas");
    await expect(page.getByTestId("about-module-commands")).toHaveAttribute("href", "/commands");
    await expect(page.getByTestId("about-settings")).toHaveAttribute("href", "/settings");
    await page.getByTestId("about-sitemap").click();
    await expect(page).toHaveURL(/\/sitemap$/);
    await expect(page.getByTestId("sitemap-page")).toBeVisible();
  });
});

test.describe("Sitemap", () => {
  test("groups every page as the sidebar does, and each link opens its page", async ({ page, context }) => {
    await seed(context, {});
    await page.goto("/sitemap");
    await expect(page.getByTestId("sitemap-section")).toHaveCount(5);
    const ids = await page.getByTestId("sitemap-section").evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.section!));
    expect(ids).toEqual(["read", "study", "knowledge", "worship", "app"]);
    const hrefs = await page.getByTestId("sitemap-link").evaluateAll((els) => els.map((e) => e.getAttribute("href")!));
    for (const h of ["/", "/surah-listing", "/juz", "/search", "/hifz", "/goals", "/bookmarks", "/downloads", "/calender", "/ramadan", "/fiqh", "/settings", "/about", "/sitemap", "/surah-vedios"]) expect(hrefs, h).toContain(h);
    expect(hrefs).not.toContain("/poets");
    await page.getByTestId("sitemap-section").locator('[href="/goals"]').click();
    await expect(page.getByTestId("goals-page")).toBeVisible();
    await page.goBack();
    await page.getByTestId("sitemap-section").locator('[href="/surah-vedios"]').click();
    await expect(page.getByTestId("videos-page")).toBeVisible();
    await page.goBack();
    await expect(page.getByTestId("sitemap-section").locator('[href="/surah-vedios"]').locator("xpath=..")).toContainText("No videos yet. Every surah has audio.");
  });
});

test.describe("Surah videos", () => {
  test("says there are none, and lists the 114 surahs that each open their audio page", async ({ page }) => {
    await page.goto("/surah-vedios");
    await expect(page.getByTestId("videos-none")).toHaveText("There are no videos in the app yet.");
    await expect(page.getByTestId("videos-list").getByRole("link")).toHaveCount(114);
    await expect(page.getByTestId("videos-surah-1")).toHaveAttribute("href", "/surah-audios/1");
    await expect(page.getByTestId("videos-surah-114")).toHaveAttribute("href", "/surah-audios/114");
    await page.getByTestId("videos-surah-36").click();
    await expect(page).toHaveURL(/\/surah-audios\/36$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Ya|Yaseen|Yasin/i);
    await expect(page.locator("body")).not.toContainText(/coming soon/i);
  });
});

test.describe("/juz/<n>", () => {
  test("opens the reader at the juz's first ayah and replaces the URL, so Back does not bounce", async ({ page }) => {
    await page.goto("/juz");
    await page.goto("/juz/7");
    await expect(page).toHaveURL(new RegExp(juzTarget("7").replace("#", "#")));
    await expect(page.locator(`#ayah-${JUZ[6]!.startAyah}`)).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/\/juz$/);
  });
  test("every juz goes to its own first ayah; 1 is the Fatihah, 30 is An-Naba", async ({ page }) => {
    for (const n of [1, 2, 30]) {
      await page.goto(`/juz/${n}`);
      await expect(page).toHaveURL(new RegExp(`/surah/${JUZ[n - 1]!.startSurah}#ayah-${JUZ[n - 1]!.startAyah}$`));
    }
  });
  test("a number that is not a juz goes to the Juz tab", async ({ page }) => {
    for (const bad of ["0", "31", "abc"]) {
      await page.goto(`/juz/${bad}`);
      await expect(page).toHaveURL(/\/juz$/);
    }
  });
});

test.describe("looks and rules", () => {
  for (const [name, viewport, theme] of [["desktop light", { width: 1280, height: 900 }, "light"], ["phone dark", { width: 375, height: 760 }, "dark"]] as const) {
    test(`${name}: no sideways scroll, touch targets of at least 44px on a phone, no console errors`, async ({ page, context }) => {
      await seed(context, { themeMode: theme });
      await page.setViewportSize(viewport);
      const errs = errors(page);
      for (const path of ["/about", "/sitemap", "/surah-vedios"]) {
        await page.goto(path);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        expect(await noScroll(page), path).toBe(true);
        await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^((?!dark).)*$/);
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
        if (viewport.width < 500) {
          const links = path === "/about" ? page.getByTestId("about-page").getByRole("link") : path === "/sitemap" ? page.getByTestId("sitemap-link") : page.getByTestId("videos-page").getByRole("link");
          for (const l of await links.all()) if (await l.isVisible()) expect((await l.boundingBox())!.height, `${path} ${await l.innerText()}`).toBeGreaterThanOrEqual(44);
        }
      }
      expect(errs).toEqual([]);
    });
  }

  test("the links in lists are at least 44px tall on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 760 });
    await page.goto("/sitemap");
    for (const l of await page.getByTestId("sitemap-link").all()) expect((await l.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.goto("/surah-vedios");
    for (const l of (await page.getByTestId("videos-list").getByRole("link").all()).slice(0, 12)) expect((await l.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.goto("/about");
    for (const l of await page.getByTestId("about-modules").getByRole("link").all()) expect((await l.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  });
});

test.describe("offline (level A)", () => {
  test.use({ serviceWorkers: "allow" });
  test("About, Sitemap and Surah videos open with no connection, from the app shell", async ({ page, context }) => {
    await loadAndControl(page, "/");
    await context.setOffline(true);
    await page.getByRole("link", { name: "About" }).first().click();
    await expect(page.getByTestId("about-page")).toBeVisible();
    await page.getByTestId("about-sitemap").click();
    await expect(page.getByTestId("sitemap-page")).toBeVisible();
    await page.getByTestId("sitemap-section").locator('[href="/surah-vedios"]').click();
    await expect(page.getByTestId("videos-list").getByRole("link")).toHaveCount(114);
    await context.setOffline(false);
  });
});
