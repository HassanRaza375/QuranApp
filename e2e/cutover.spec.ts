// Cutover rehearsal: a browser that already has the LEGACY service worker (the vendored legacy/dist/sw.js, see legacy/README.md)
// loads the rebuilt app from the same origin. The new sw.js must replace the old one (same file name and scope), keep the
// runtime caches, and the "update available" toast (registerType "prompt") must appear and work.
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AddressInfo } from "node:net";
import { expect, test } from "@playwright/test";
import { localDateKey } from "../app/lib/dates";
import { ayahEntry, seed } from "./mocks";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LEGACY_SW_DIR = path.resolve(HERE, "../legacy/dist");
const REVAMP_PUBLIC = path.resolve(HERE, "../.output/public");
let LEGACY_DIST = ""; // the stand-in legacy site, built per run by buildLegacyDist()
const TYPES: Record<string, string> = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png",
  ".ico": "image/x-icon", ".webmanifest": "application/manifest+json", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".svg": "image/svg+xml",
};

// The legacy site, rebuilt from the vendored worker: the real sw.js and Workbox runtime, plus an empty placeholder for every file the worker
// precaches (it only fetches and stores them, so their contents do not matter to the swap). The legacy app's own build is not in this repo.
function buildLegacyDist(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "legacy-dist-"));
  const sw = fs.readFileSync(path.join(LEGACY_SW_DIR, "sw.js"), "utf8");
  fs.writeFileSync(path.join(dir, "sw.js"), sw);
  const workbox = /["']\.\/(workbox-[\w-]+)["']/.exec(sw)?.[1];
  if (!workbox) throw new Error("the vendored legacy sw.js does not import a workbox runtime");
  fs.copyFileSync(path.join(LEGACY_SW_DIR, `${workbox}.js`), path.join(dir, `${workbox}.js`));
  const precached = [...sw.matchAll(/\{url:"([^"]+)",revision:/g)].map((m) => m[1]!);
  expect(precached.length).toBeGreaterThan(100);
  for (const rel of precached) {
    const file = path.join(dir, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, rel.endsWith(".webmanifest") ? "{}" : "");
  }
  return dir;
}

// A tiny static server whose root can be switched, like a deployment being replaced.
function createSite(initialRoot: string) {
  let root = initialRoot;
  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://x");
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith("/")) rel += "index.html";
    let file = path.join(root, rel);
    if (!file.startsWith(root)) return void res.writeHead(403).end();
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      // the legacy build has no index.html: serve a stub that registers the legacy sw.js
      if (root === LEGACY_DIST && rel === "/index.html") {
        res.writeHead(200, { "content-type": "text/html" });
        return void res.end("<!doctype html><title>legacy</title><script>navigator.serviceWorker.register('/sw.js')</script>");
      }
      // SPA: any other route is the shell
      file = path.join(root, "index.html");
      if (!fs.existsSync(file)) return void res.writeHead(404).end();
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream", "cache-control": "no-cache" });
    fs.createReadStream(file).pipe(res);
  });
  return {
    listen: () => new Promise<string>((r) => server.listen(0, () => r(`http://localhost:${(server.address() as AddressInfo).port}`))),
    close: () => server.close(),
    setRoot: (r: string) => (root = r),
  };
}

test.skip(!fs.existsSync(REVAMP_PUBLIC), "needs a revamp build (npm run build)");

test("the new service worker replaces the legacy one, keeps runtime caches, and the update toast works", async ({ page, context }) => {
  await seed(context, { "ayah-of-day": ayahEntry(localDateKey(new Date())) }); // Home shows an ayah; no real API call
  LEGACY_DIST = buildLegacyDist();
  const site = createSite(LEGACY_DIST);
  const origin = await site.listen();
  try {
    // 1. A user who has the legacy app installed.
    await page.goto(origin + "/");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    const legacy = await page.evaluate(async () => {
      const r = (await navigator.serviceWorker.getRegistration())!;
      return { scope: r.scope, script: r.active!.scriptURL };
    });
    expect(legacy.script).toMatch(/\/sw\.js$/);
    // a runtime-cache entry the legacy app would have written (same cache name the rebuild keeps)
    await page.evaluate(async () => {
      const c = await caches.open("quran-api-cache");
      await c.put("/fake-api/1.json", new Response('{"kept":true}'));
    });
    const legacyCaches = await page.evaluate(() => caches.keys());
    expect(legacyCaches.some((n) => n.startsWith("workbox-precache"))).toBe(true);

    // 2. The site is replaced by the rebuild (same origin, same sw.js path).
    site.setRoot(REVAMP_PUBLIC);
    await page.goto(origin + "/");
    // the legacy worker answers until the user accepts the update ("prompt"), then the new one takes over
    const toast = page.locator("[data-sonner-toast]").filter({ hasText: "A new version of Quran App is available." });
    await expect(toast).toBeVisible({ timeout: 20_000 });
    await toast.getByRole("button", { name: "Reload" }).click();
    // Reload activates the waiting worker and then reloads the page. Wait for the swap itself (the legacy-only
    // precache entries disappearing), not for "the page loaded", which can be true before the swap happens.
    const rebuildFiles = new Set(fs.readdirSync(path.join(REVAMP_PUBLIC, "_nuxt")).map((f) => "/_nuxt/" + f));
    const legacyOnly = fs.readdirSync(path.join(LEGACY_DIST, "_nuxt")).map((f) => "/_nuxt/" + f).filter((f) => !rebuildFiles.has(f));
    expect(legacyOnly.length).toBeGreaterThan(100);
    const staleCount = () =>
      page
        .evaluate(async (stale) => {
          const name = (await caches.keys()).find((n) => n.startsWith("workbox-precache"));
          if (!name) return -1;
          const keys = (await (await caches.open(name)).keys()).map((k) => new URL(k.url).pathname);
          return keys.filter((k) => stale.includes(k)).length;
        }, legacyOnly)
        .catch(() => -1); // the page is reloading
    await expect.poll(staleCount, { timeout: 30_000, intervals: [250, 500, 1000] }).toBe(0);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 20_000 });

    // 3. Same file name and scope; legacy precache entries are gone; the runtime cache survived.
    const after = await page.evaluate(async () => {
      const r = (await navigator.serviceWorker.getRegistration())!;
      const names = await caches.keys();
      const precacheName = names.find((n) => n.startsWith("workbox-precache"))!;
      const precached = (await (await caches.open(precacheName)).keys()).map((k) => new URL(k.url).pathname);
      const kept = await (await caches.open("quran-api-cache")).match("/fake-api/1.json");
      return { scope: r.scope, script: r.active!.scriptURL, names, precached, kept: kept ? await kept.text() : null };
    });
    expect(after.script).toBe(legacy.script);
    expect(after.scope).toBe(legacy.scope);
    expect(after.kept).toBe('{"kept":true}');
    expect(after.precached.some((p) => p.startsWith("/_nuxt/") && /\.(woff2)$/.test(p))).toBe(true); // new assets
    // nothing that only the legacy build had is left in the precache (files both builds share, such as a font from
    // the same package, legitimately stay)
    expect(after.precached.filter((p) => legacyOnly.includes(p))).toEqual([]);

    // 4. The rebuilt app works offline under the replaced worker.
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Home", level: 1 })).toBeAttached();
  } finally {
    site.close();
    fs.rmSync(LEGACY_DIST, { recursive: true, force: true });
  }
});
