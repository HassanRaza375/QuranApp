// Spike (a): SPA by default, with three prerendered public pages carrying their own <head> tags.
import { expect, test } from "@playwright/test";

const PAGES: Record<string, { title: string; description: RegExp }> = {
  "/": { title: "Quran App", description: /local-first Quran companion/ },
  "/about": { title: "About · Quran App", description: /About the Quran App/ },
  "/surah-listing": { title: "Surahs · Quran App", description: /114 surahs/ },
};

for (const [path, want] of Object.entries(PAGES)) {
  test(`${path} is prerendered with its own title and description (no JavaScript needed)`, async ({ request }) => {
    const html = await (await request.get(path)).text();
    expect(html).toContain(`<title>${want.title}</title>`);
    expect(html).toMatch(new RegExp(`<meta name="description" content="[^"]*${want.description.source}`));
    expect(html).toContain(`<meta property="og:title" content="${want.title}">`);
  });
}

test("other routes are served as the SPA shell (200, no per-page prerender)", async ({ request }) => {
  const res = await request.get("/settings");
  expect(res.status()).toBe(200);
  expect(await res.text()).toContain('<div id="__nuxt">');
});
