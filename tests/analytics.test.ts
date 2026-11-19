// Vercel Web Analytics (app/lib/analytics.ts, app/plugins/vercel-analytics.client.ts): what may leave the device, and that it is off everywhere but the hosted build.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyticsAllowed, analyticsBeforeSend } from "../app/lib/analytics";
import { ABOUT } from "../app/lib/about";

const ROOT = path.resolve(__dirname, "..");
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");

describe("analyticsBeforeSend", () => {
  it("cuts an absolute address to origin and path: no query string, no fragment", () => {
    expect(analyticsBeforeSend({ type: "pageview", url: "https://quran-app-znfc.vercel.app/search?q=something+private&scope=all#top" })).toEqual({ type: "pageview", url: "https://quran-app-znfc.vercel.app/search" });
    expect(analyticsBeforeSend({ type: "pageview", url: "https://x.example/surah/18#ayah-5" })!.url).toBe("https://x.example/surah/18");
    expect(analyticsBeforeSend({ type: "pageview", url: "https://x.example/per-page-read?page=3" })!.url).toBe("https://x.example/per-page-read");
  });
  it("cuts a relative address the same way", () => {
    expect(analyticsBeforeSend({ type: "event", url: "/settings?section=account&mode=signup" })!.url).toBe("/settings");
  });
  it("never counts the admin page, with or without a query, or anything below it", () => {
    for (const url of ["/admin", "/admin?x=1", "/admin/users", "https://x.example/admin", "https://x.example/admin/"]) expect(analyticsBeforeSend({ type: "pageview", url }), url).toBeNull();
    expect(analyticsBeforeSend({ type: "pageview", url: "/administrators" })).not.toBeNull(); // only the real admin path
  });
  it("keeps the other fields of the event, and drops an address it cannot read", () => {
    expect(analyticsBeforeSend({ type: "pageview", url: "/about", extra: 1 } as never)).toEqual({ type: "pageview", url: "/about", extra: 1 });
    expect(analyticsBeforeSend({ type: "pageview", url: "http://[bad" })).toBeNull();
  });
});

describe("analyticsAllowed", () => {
  it("is off for Do Not Track, offline, and no browser", () => {
    expect(analyticsAllowed({ doNotTrack: "1", onLine: true })).toBe(false);
    expect(analyticsAllowed({ doNotTrack: "yes", onLine: true })).toBe(false);
    expect(analyticsAllowed({ doNotTrack: null, onLine: false })).toBe(false);
    expect(analyticsAllowed(undefined)).toBe(false);
  });
  it("is on for an ordinary online browser", () => {
    expect(analyticsAllowed({ doNotTrack: null, onLine: true })).toBe(true);
    expect(analyticsAllowed({ doNotTrack: "0", onLine: true })).toBe(true);
    expect(analyticsAllowed({ onLine: true })).toBe(true);
  });
});

describe("it is on only in a build made on Vercel", () => {
  it("nuxt.config sets the flag from the VERCEL build variable and from nothing else", () => {
    expect(read("nuxt.config.ts")).toMatch(/vercelAnalytics:\s*Boolean\(process\.env\.VERCEL\)/);
  });
  it("the plugin does nothing without the flag, and goes through the guarded helpers", () => {
    const src = read("app/plugins/vercel-analytics.client.ts");
    expect(src).toMatch(/if \(!useRuntimeConfig\(\)\.public\.vercelAnalytics\) return;/);
    expect(src).toContain("beforeSend: analyticsBeforeSend");
    expect(src).toContain("analyticsAllowed");
  });
  it("the package is pinned, and is not also loaded as a module (that would skip the guards)", () => {
    const pkg = JSON.parse(read("package.json")) as { dependencies: Record<string, string> };
    expect(pkg.dependencies["@vercel/analytics"]).toMatch(/^\d+\.\d+\.\d+$/);
    expect(read("nuxt.config.ts")).not.toMatch(/modules:[^\]]*@vercel\/analytics/);
  });
  it("the page that explains it is honest about what is and is not sent", () => {
    expect(ABOUT.analytics).toContain("never anything after a question mark");
    expect(ABOUT.analytics).toContain("not used on the admin page");
    expect(ABOUT.analytics).toContain("Do Not Track");
    expect(ABOUT.analytics).toContain("never part of it");
    expect(JSON.stringify(ABOUT)).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
