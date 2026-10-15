// Spike (b): offline navigation from the one precached app shell. Production build + preview only.
import { expect, test } from "@playwright/test";
import { loadAndControl } from "./helpers";

test.describe("offline shell", () => {
  test("service worker is sw.js at scope / and the manifest identity is the legacy one", async ({ page, request }) => {
    await loadAndControl(page);
    const reg = await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      return { scope: r?.scope, script: r?.active?.scriptURL };
    });
    expect(reg.scope).toMatch(/\/$/);
    expect(reg.script).toMatch(/\/sw\.js$/);
    const manifest = await (await request.get("/manifest.webmanifest")).json();
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.id).toBeUndefined();
    expect(manifest.name).toBe("Quran App");
  });

  test("reload and in-app navigation work offline", async ({ page, context }) => {
    await loadAndControl(page);
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Quran App", level: 1 })).toBeVisible();
    await page.getByRole("link", { name: "Surahs" }).first().click();
    await expect(page.getByRole("heading", { name: "Surahs", level: 1 })).toBeVisible();
    await page.getByRole("link", { name: "About" }).first().click();
    await expect(page.getByRole("heading", { name: "About", level: 1 })).toBeVisible();
  });

  test("a brand-new tab opened offline at a deep route renders (the legacy G6 bug)", async ({ page, context }) => {
    await loadAndControl(page);
    await context.setOffline(true);
    const tab = await context.newPage();
    await tab.goto("/foundation");
    await expect(tab.getByRole("heading", { name: "Foundation check" })).toBeVisible();
    const tab2 = await context.newPage();
    await tab2.goto("/some/route/that/does/not/exist");
    await expect(tab2.getByRole("heading", { name: "This page is not rebuilt yet" })).toBeVisible();
  });

  test("API routes are not answered with the shell", async ({ page, context }) => {
    await loadAndControl(page);
    await context.setOffline(true);
    const status = await page.evaluate(async () => {
      try {
        const r = await fetch("/api/surahs");
        return r.headers.get("content-type")?.includes("text/html") ? "html-shell" : `status-${r.status}`;
      } catch {
        return "network-error";
      }
    });
    expect(status).not.toBe("html-shell");
  });

  test("cache names and precache are in place", async ({ page }) => {
    await loadAndControl(page);
    const names = await page.evaluate(() => caches.keys());
    expect(names.some((n) => n.startsWith("workbox-precache"))).toBe(true);
  });
});
