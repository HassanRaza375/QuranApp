// Phase 16: every legacy route has a page in the revamp (a page or a redirect; Poets is deferred), and the test-only page is not part of the build Vercel makes.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { shipsTestPages, TEST_ONLY_ROUTES } from "../build/testPages";
import { concrete, DEFERRED_ROUTES, LEGACY_ROUTES } from "./legacyRoutes";
import { PAGES as PAGES_DIR, pageFor } from "./pageFor";

const PAGES = PAGES_DIR;

describe("the legacy routes", () => {
  it("lists the 51 page files of the legacy app, once each", () => {
    expect(LEGACY_ROUTES).toHaveLength(51);
    expect(new Set(LEGACY_ROUTES).size).toBe(51);
  });
  it("each has a page in the revamp (a page or a redirect), except the deferred ones", () => {
    const missing = LEGACY_ROUTES.filter((r) => !(DEFERRED_ROUTES as readonly string[]).includes(r) && !pageFor(r));
    expect(missing).toEqual([]);
  });
  it("Poets is deferred with no page and no stub: its routes are not pages, so they show 'Page not found'", () => {
    for (const r of DEFERRED_ROUTES) expect(pageFor(r), r).toBeNull();
    expect(fs.existsSync(path.join(PAGES, "poets"))).toBe(false);
    expect(fs.existsSync(path.resolve(__dirname, "../app/components/poets"))).toBe(false);
  });
  it("a concrete address can be made for every pattern", () => {
    for (const r of LEGACY_ROUTES) expect(concrete(r)).not.toMatch(/[[\]]/);
  });
  it("the catch-all says the page was not found (it never says 'not rebuilt yet' again)", () => {
    const slug = fs.readFileSync(path.join(PAGES, "[...slug].vue"), "utf8");
    expect(slug).toContain("Page not found");
    expect(slug).toContain('robots: "noindex"');
    expect(slug).not.toContain("not rebuilt yet");
  });
});

describe("the test-only page", () => {
  it("is in a local build and left out of the build Vercel makes", () => {
    expect(TEST_ONLY_ROUTES).toEqual(["/foundation"]);
    expect(shipsTestPages({})).toBe(true);
    expect(shipsTestPages({ VERCEL: "1" })).toBe(false);
    expect(shipsTestPages({ VERCEL: "" })).toBe(true);
  });
});
