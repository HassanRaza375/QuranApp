// Phase 16: every legacy route has a page in the revamp (a page or a redirect; Poets is deferred), and the test-only page is not part of the build Vercel makes.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { shipsTestPages, TEST_ONLY_ROUTES } from "../build/testPages";
import { concrete, DEFERRED_ROUTES, LEGACY_ROUTES } from "./legacyRoutes";

const PAGES = path.resolve(__dirname, "../app/pages");

/** The page file that answers a route pattern, or null. Vue Router: `[x].vue` is a parameter, `index.vue` is the folder's route; a catch-all does not count. */
function pageFor(route: string): string | null {
  if (route === "/") return fs.existsSync(path.join(PAGES, "index.vue")) ? "index.vue" : null;
  const segs = route.replace(/^\//, "").split("/");
  const walk = (dir: string, i: number): string | null => {
    if (!fs.existsSync(dir)) return null;
    const last = i === segs.length - 1;
    const names = fs.readdirSync(dir);
    const seg = segs[i]!;
    const param = /^\[.+\]$/.test(seg);
    // a file or a folder named exactly like the segment (or, for a parameter, any [x])
    const matches = (n: string) => (param ? /^\[.+\](\.vue)?$/.test(n) : n === seg || n === `${seg}.vue`);
    for (const n of names.filter(matches)) {
      const full = path.join(dir, n);
      if (last) {
        if (n.endsWith(".vue")) return path.relative(PAGES, full);
        if (fs.existsSync(path.join(full, "index.vue"))) return path.relative(PAGES, path.join(full, "index.vue"));
      } else if (fs.statSync(full).isDirectory()) {
        const r = walk(full, i + 1);
        if (r) return r;
      }
    }
    return null;
  };
  return walk(PAGES, 0);
}

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
