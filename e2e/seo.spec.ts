// Phase 16: what a search engine is told. The local production build is not indexable (only a Vercel production build is, app/lib/seo.ts), so every
// response carries X-Robots-Tag and robots.txt disallows everything; the Vercel preview and production rules are checked on simulated Vercel builds
// (docs/phases/phase-16-cutover.md) and by scripts/smoke-prod.mjs on a real address.
import { expect, test } from "@playwright/test";
import { STATIC_ROUTES } from "../app/lib/seo";

test.use({ serviceWorkers: "block", locale: "en-GB", viewport: { width: 1280, height: 900 } });

test.beforeEach(async ({ context, baseURL }) => {
  await context.route("**/*", (route) => (route.request().url().startsWith(baseURL!) ? route.continue() : route.abort("internetdisconnected")));
});

test("a build that is not indexable says so in the header, the page and robots.txt, and lists no addresses", async ({ request, page }) => {
  for (const path of ["/", "/about", "/surah-listing", "/hifz", "/robots.txt", "/sitemap.xml"]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(res.headers()["x-robots-tag"], path).toBe("noindex, nofollow");
  }
  expect(await (await request.get("/robots.txt")).text()).toBe("User-agent: *\nDisallow: /\n");
  const xml = await (await request.get("/sitemap.xml")).text();
  expect((await request.get("/sitemap.xml")).headers()["content-type"]).toContain("xml");
  expect(xml).toContain("<urlset");
  expect(xml).not.toContain("<url>");
  await page.goto("/about");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
});

test("robots.txt and sitemap.xml are real files, not the app shell", async ({ request }) => {
  expect((await (await request.get("/robots.txt")).text()).toLowerCase()).not.toContain("<html");
  expect((await (await request.get("/sitemap.xml")).text()).toLowerCase()).not.toContain("<html");
});

test("each public page has its own title and description", async ({ page }) => {
  test.setTimeout(120_000);
  const seen = new Map<string, string>();
  const problems: string[] = [];
  for (const route of [...STATIC_ROUTES, "/surah/18"]) {
    await page.goto(route);
    await page.locator("#__nuxt").waitFor();
    await page.waitForTimeout(500);
    const title = await page.title();
    const description = (await page.locator('meta[name="description"]').first().getAttribute("content").catch(() => null)) ?? "";
    if (!title || title === "Quran App") {
      if (route !== "/") problems.push(`${route}: title is "${title}"`);
    }
    if (!description) problems.push(`${route}: no description`);
    const key = `${title}`;
    if (seen.has(key)) problems.push(`${route}: same title as ${seen.get(key)} ("${title}")`);
    seen.set(key, route);
  }
  expect(problems).toEqual([]);
});
