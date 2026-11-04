// Phase 17A: with NUXT_PUBLIC_SYNC_ENABLED off (this build, and Production until 17E) the app makes no request to the account
// server at all, and its config says sync is off. Later sub-phases add their code behind the same flag; this test keeps it honest.
import { expect, test } from "@playwright/test";
import { localDateKey } from "../app/lib/dates";
import { ayahEntry, forbidRealApis, mockAladhan, mockQuranText, seed } from "./mocks";

test.use({ serviceWorkers: "block" });

const ACCOUNT_API = /\/api\/(sync|auth|avatar|health)(\/|\?|$)/;

test("sync off: no request to /api/sync, /api/auth, /api/avatar or /api/health on the main pages", async ({ page, context }) => {
  test.setTimeout(90_000);
  const leaks = await forbidRealApis(context);
  await mockAladhan(context);
  await mockQuranText(context);
  await seed(context, {
    "ayah-of-day": ayahEntry(localDateKey(new Date())),
    "quran:bookmarks:v1": JSON.stringify(["surah:2"]),
    "quran:reading-progress:v1": JSON.stringify({ surahNo: 18, ayahNo: 10, surahName: "The Cave", surahNameArabic: "x", totalAyah: 110, updatedAt: 1 }),
  });
  const hits: string[] = [];
  context.on("request", (r) => {
    if (ACCOUNT_API.test(new URL(r.url()).pathname + new URL(r.url()).search)) hits.push(r.url());
  });

  for (const route of ["/", "/surah-listing", "/surah/18", "/bookmarks", "/settings", "/hifz", "/goals", "/tasbeeh", "/search"]) {
    await page.goto(route);
    await page.locator("#__nuxt").waitFor();
    await page.waitForLoadState("networkidle");
  }
  // the in-app path too (a full load is not the only way pages start)
  await page.getByRole("link", { name: "Settings" }).first().click();
  await page.waitForLoadState("networkidle");

  expect(await page.evaluate(() => (window as unknown as { __NUXT__?: { config?: { public?: { syncEnabled?: unknown } } } }).__NUXT__?.config?.public?.syncEnabled)).toBe(false);
  expect(hits).toEqual([]);
  expect(leaks).toEqual([]);
});
