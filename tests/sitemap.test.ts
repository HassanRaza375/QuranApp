// Phase 15: the Sitemap lists the pages that exist, and the sidebar's pages are all in it.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HOME_ITEM, NAV, NAV_FOOTER } from "../app/lib/nav";
import { sitemapSections } from "../app/lib/sitemap";

const PAGES = path.resolve(__dirname, "../app/pages");

/** Whether a built page answers this path: a file, an index in a folder, or a dynamic file in the folder. */
function built(to: string): boolean {
  if (to === "/") return fs.existsSync(path.join(PAGES, "index.vue"));
  const p = to.replace(/^\//, "");
  if (fs.existsSync(path.join(PAGES, `${p}.vue`)) || fs.existsSync(path.join(PAGES, p, "index.vue"))) return true;
  const dir = path.join(PAGES, path.dirname(p));
  return fs.existsSync(dir) && fs.readdirSync(dir).some((f) => /^\[.+\]\.vue$/.test(f));
}

describe("the Sitemap", () => {
  const sections = sitemapSections();
  const links = sections.flatMap((s) => s.links);

  it("links only to pages that are built", () => {
    for (const l of links) expect(built(l.to), l.to).toBe(true);
  });
  it("has every sidebar row (Poets is deferred and has no row), the footer rows, Home, the Calendar and Reading goals", () => {
    const want = [HOME_ITEM, ...NAV.flatMap((g) => g.items), ...NAV_FOOTER].map((i) => i.to);
    for (const to of want) expect(links.map((l) => l.to), to).toContain(to);
    expect(links.map((l) => l.to)).toEqual(expect.arrayContaining(["/calender", "/goals", "/about", "/sitemap", "/surah-vedios", "/juz"]));
    expect(links.map((l) => l.to)).not.toContain("/poets");
  });
  it("lists a page once, labels it and draws no typed count", () => {
    const tos = links.map((l) => l.to);
    expect(new Set(tos).size).toBe(tos.length);
    for (const l of links) {
      expect(l.label.length).toBeGreaterThan(1);
      expect(l.label + (l.note ?? "")).not.toMatch(/\d+ entries|\(\d+\)/);
    }
  });
  it("says plainly that there are no surah videos", () => {
    expect(links.find((l) => l.to === "/surah-vedios")!.note).toMatch(/^No videos yet/);
  });
});
