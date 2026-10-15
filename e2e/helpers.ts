import type { BrowserContext, Page } from "@playwright/test";

/** Open `path` online and wait until the service worker is active and controlling the page. */
export async function loadAndControl(page: Page, path = "/") {
  await page.goto(path);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // clientsClaim is on, so the page becomes controlled without a reload; wait for it.
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15_000 });
  // The precache finishes before the worker activates, but give runtime requests a moment to settle.
  await page.waitForLoadState("networkidle");
}

export const offline = (context: BrowserContext) => context.setOffline(true);
