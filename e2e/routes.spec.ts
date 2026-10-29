// Phase 16: every legacy route answers with a page. One concrete address per legacy route is opened on the production build; none may land on "Page not found".
// Network requests that leave the app are aborted (this test is about routing, not about what a page loads), so a page may show its own offline state.
import { expect, test, type Page } from "@playwright/test";
import { concrete, LEGACY_ROUTES } from "../tests/legacyRoutes";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });

test.beforeEach(async ({ context, baseURL }) => {
  await context.route("**/*", (route) => (route.request().url().startsWith(baseURL!) ? route.continue() : route.abort("internetdisconnected")));
});

const settled = async (page: Page) => {
  await page.waitForLoadState("domcontentloaded");
  await page.locator("#__nuxt").waitFor();
  await page.waitForTimeout(400);
};

test("every legacy route opens a page, not 'Page not found'", async ({ page }) => {
  test.setTimeout(180_000); // 51 addresses
  const notFound: string[] = [];
  for (const route of LEGACY_ROUTES) {
    const path = concrete(route);
    // /juz/<n> redirects while it loads, which Chromium reports as an aborted first navigation
    await page.goto(path).catch((e: Error) => {
      if (!/ERR_ABORTED|frame was detached/.test(e.message)) throw e;
    });
    await settled(page);
    if ((await page.getByTestId("not-found-page").count()) > 0) notFound.push(path);
  }
  expect(notFound).toEqual([]);
});

test("/poets and every /poets/<slug> show the stub and nothing of the legacy module", async ({ page }) => {
  for (const path of ["/poets", "/poets/mir-anis", "/poets/anything-else"]) {
    await page.goto(path);
    await expect(page.getByTestId("poets-stub")).toBeVisible();
    await expect(page.getByTestId("poets-stub-text")).toHaveText("Literary modules are not in this version yet. Your setting is kept.");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
  await expect(page.locator("body")).not.toContainText(/Mir Anis|Karbala|marsiya/i);
});

test("an unknown address says Page not found, with noindex and a way out", async ({ page }) => {
  await page.goto("/definitely/not/a/page");
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  await expect(page.getByTestId("not-found-path")).toHaveText("/definitely/not/a/page");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.getByTestId("not-found-home").click();
  await expect(page).toHaveURL(/\/$/);
});

test("the old 'This page is not rebuilt yet' wording is gone everywhere", async ({ page }) => {
  for (const path of ["/definitely/not/a/page", "/poets"]) {
    await page.goto(path);
    await settled(page);
    await expect(page.locator("body")).not.toContainText("not rebuilt yet");
  }
});
