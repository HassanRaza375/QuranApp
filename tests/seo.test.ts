// Phase 16: the production address, who may be indexed, canonical addresses, robots.txt and sitemap.xml.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { canonicalPath, canonicalUrl, isIndexable, NOINDEX, robotsTxt, seoHeadTags, siteUrl, sitemapRoutes, sitemapXml, STATIC_ROUTES } from "../app/lib/seo";
import { PAGES, pageFor } from "./pageFor";

describe("the production address", () => {
  it("is the one Vercel names for the project, with a scheme and no trailing slash", () => {
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "quran-app.vercel.app" })).toBe("https://quran-app.vercel.app");
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "https://quran-app.vercel.app/" })).toBe("https://quran-app.vercel.app");
  });
  it("can be set by hand, and that wins", () => {
    expect(siteUrl({ NUXT_PUBLIC_SITE_URL: "https://example.org/", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" })).toBe("https://example.org");
  });
  it("is empty when the build does not know it (a local build): no canonical, no absolute address anywhere", () => {
    expect(siteUrl({})).toBe("");
    expect(canonicalUrl("", "/about")).toBe("");
    expect(seoHeadTags({ site: "", path: "/about", indexable: false })).toBe(`<meta name="robots" content="${NOINDEX}">`);
  });
  it("a preview deployment uses the same canonical address (VERCEL_PROJECT_PRODUCTION_URL is the project's, not the preview's)", () => {
    const env = { VERCEL_ENV: "preview", VERCEL_PROJECT_PRODUCTION_URL: "quran-app.vercel.app", VERCEL_URL: "quran-app-git-x.vercel.app" };
    expect(siteUrl(env)).toBe("https://quran-app.vercel.app");
  });
});

describe("who may be indexed", () => {
  it("only a Vercel production build (or an explicit rehearsal)", () => {
    expect(isIndexable({ VERCEL_ENV: "production" })).toBe(true);
    expect(isIndexable({ VERCEL_ENV: "preview" })).toBe(false);
    expect(isIndexable({ VERCEL_ENV: "development" })).toBe(false);
    expect(isIndexable({})).toBe(false);
    expect(isIndexable({ ALLOW_INDEXING: "1" })).toBe(true);
  });
  it("a build that is not indexable disallows everything and names no sitemap; production allows, hides /api and names the sitemap", () => {
    expect(robotsTxt("https://a.example", false)).toBe("User-agent: *\nDisallow: /\n");
    const prod = robotsTxt("https://a.example", true);
    expect(prod).toContain("Allow: /");
    expect(prod).toContain("Disallow: /api/");
    expect(prod).toContain("Sitemap: https://a.example/sitemap.xml");
    expect(prod).not.toContain("Disallow: /\n");
  });
  it("the head tags: canonical always, robots only when not indexable, the Search Console key only in production", () => {
    const base = { site: "https://a.example", path: "/about" };
    expect(seoHeadTags({ ...base, indexable: true })).toBe(`<link rel="canonical" href="https://a.example/about">`);
    expect(seoHeadTags({ ...base, indexable: false })).toBe(`<link rel="canonical" href="https://a.example/about"><meta name="robots" content="${NOINDEX}">`);
    expect(seoHeadTags({ ...base, indexable: true, verification: "abc" })).toContain(`<meta name="google-site-verification" content="abc">`);
    expect(seoHeadTags({ ...base, indexable: false, verification: "abc" })).not.toContain("google-site-verification");
  });
});

describe("canonical addresses", () => {
  it("have no query, no hash and no trailing slash (but the home page keeps its slash)", () => {
    expect(canonicalPath("/surah/18?x=1#ayah-10")).toBe("/surah/18");
    expect(canonicalPath("/about/")).toBe("/about");
    expect(canonicalPath("/")).toBe("/");
    expect(canonicalUrl("https://a.example", "/")).toBe("https://a.example/");
    expect(canonicalUrl("https://a.example", "/surah/18#ayah-10")).toBe("https://a.example/surah/18");
  });
});

const pattern = (r: string) => r.replace(/^\/surah\/\d+$/, "/surah/[id]");

describe("sitemap.xml", () => {
  const xml = sitemapXml("https://quran-app.vercel.app");
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);

  it("lists the static routes and the 114 surah pages, all at the production address", () => {
    expect(locs).toHaveLength(STATIC_ROUTES.length + 114);
    for (const l of locs) expect(l).toMatch(/^https:\/\/quran-app\.vercel\.app\//);
    expect(locs).toContain("https://quran-app.vercel.app/");
    expect(locs).toContain("https://quran-app.vercel.app/surah/114");
    expect(new Set(locs).size).toBe(locs.length);
  });
  it("lists only real routes: each has a page", () => {
    for (const r of sitemapRoutes()) expect(pageFor(pattern(r)), r).not.toBeNull();
  });
  it("lists no Poets, no test page, no personal page and no page that is noindex", () => {
    for (const r of sitemapRoutes()) {
      expect(r, r).not.toMatch(/poets|foundation/);
      const file = pageFor(pattern(r))!;
      expect(fs.readFileSync(path.join(PAGES, file), "utf8"), `${r} (${file})`).not.toMatch(/robots: "noindex/);
    }
    for (const personal of ["/bookmarks", "/downloads", "/hifz", "/goals", "/calender", "/settings", "/tasbeeh", "/per-page-read", "/surah-vedios"]) expect(sitemapRoutes()).not.toContain(personal);
  });
  it("is empty of addresses when the build does not know its address (never a relative <loc>)", () => {
    expect(sitemapXml("")).not.toContain("<url>");
  });
});
