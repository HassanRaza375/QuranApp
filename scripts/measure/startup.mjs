// Dev-only: what loads at start, per route, on a production build (`node .output/server/index.mjs`). Not part of verify.
//   node scripts/measure/startup.mjs <label> <port> <fixture.json> [runs=7]
// For each route it opens a fresh page (service worker blocked, so every request is seen), with and without saved Hifz progress, and records:
//   - the JS files fetched, and which of them hold Hifz code (found by their content, so the same script runs on a build from before Phase 14)
//   - requests that left the app (text, prayer times, geocoding...): they are logged and aborted, never sent
//   - time to the first contentful paint and to the end of `load` (median of N runs), also at 4x CPU slowdown
// Make the fixture with: node_modules/.bin/jiti scripts/measure/startup-fixture.ts <out.json>
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const [label, port, fixturePath, runsArg] = process.argv.slice(2);
const RUNS = Number(runsArg ?? 7);
const BASE = `http://localhost:${port}`;
const { record } = JSON.parse(readFileSync(fixturePath, "utf8"));
const HIFZ_MARKERS = {
  "hifz engine, queue, store": "recentResults",
  "hifz words/timing keys": "quran:hifz-words:v1",
  "hifz screens": "Tricky ayahs come first",
};
const ROUTES = ["/", "/surah", "/reader", "/settings", "/prayerTime", "/hifz"];

const median = (xs) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : null);

async function once(browser, route, saved, slow) {
  const context = await browser.newContext({ serviceWorkers: "block", viewport: { width: 1280, height: 900 }, timezoneId: "Asia/Karachi", locale: "en-GB" });
  if (saved) {
    await context.addInitScript((v) => {
      if (!localStorage.getItem("quran:hifz:v2")) localStorage.setItem("quran:hifz:v2", v);
    }, JSON.stringify(record));
  }
  const js = new Map(); // url -> { bytes, markers }
  const external = [];
  const bodies = [];
  await context.route("**/*", (r) => {
    const u = new URL(r.request().url());
    if (u.origin !== BASE) {
      external.push(`${r.request().method()} ${u.host}${u.pathname}`);
      return r.abort();
    }
    return r.continue();
  });
  const page = await context.newPage();
  if (slow) {
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  }
  const t0 = Date.now();
  const asked = new Map(); // path -> { at (ms after the navigation began), prefetch (the browser says it is a prefetch) }
  page.on("request", (req) => {
    const u = new URL(req.url());
    if (u.origin === BASE && u.pathname.endsWith(".js")) asked.set(u.pathname, { at: Date.now() - t0, prefetch: /prefetch/.test(req.headers()["sec-purpose"] ?? "") });
  });
  page.on("response", (res) => {
    const u = new URL(res.url());
    if (u.origin === BASE && u.pathname.endsWith(".js")) bodies.push(res.text().then((t) => js.set(u.pathname, { bytes: Buffer.byteLength(t), text: t })).catch(() => {}));
  });
  await page.goto(BASE + route, { waitUntil: "load" });
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2500); // link prefetching runs when the browser is idle
  await Promise.all(bodies);
  const t = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const fcp = performance.getEntriesByName("first-contentful-paint")[0];
    return { fcp: fcp ? fcp.startTime : null, load: nav.loadEventEnd };
  });
  const files = [...js.entries()].map(([p, v]) => ({ p, bytes: v.bytes, marks: Object.entries(HIFZ_MARKERS).filter(([, m]) => v.text.includes(m)).map(([n]) => n), ...asked.get(p) }));
  await context.close();
  return { fcp: t.fcp, load: t.load, loadedAt: t.load, files, external };
}

const browser = await chromium.launch();
const out = { label, base: BASE, runs: RUNS, rows: [] };
for (const route of ROUTES) {
  for (const saved of [false, true]) {
    for (const slow of [false, true]) {
      const rs = [];
      for (let i = 0; i < RUNS; i++) rs.push(await once(browser, route, saved, slow));
      // the files seen in at least half of the runs, so one slow run does not change the list
      const count = new Map();
      for (const r of rs) for (const f of r.files) count.set(f.p, (count.get(f.p) ?? 0) + 1);
      const first = { files: rs.flatMap((r) => r.files).filter((f, i, all) => count.get(f.p) >= RUNS / 2 && all.findIndex((g) => g.p === f.p) === i) };
      out.rows.push({
        route,
        saved,
        slow,
        fcpMs: Math.round(median(rs.map((r) => r.fcp).filter((x) => x != null))),
        loadMs: Math.round(median(rs.map((r) => r.load))),
        jsFiles: first.files.length,
        jsKB: Math.round(first.files.reduce((s, f) => s + f.bytes, 0) / 1024),
        hifzChunks: first.files.filter((f) => f.marks.length).map((f) => `${f.p.split("/").pop()} ${Math.round(f.bytes / 1024)}KB ${f.at}ms${f.prefetch ? " prefetch" : ""} [${f.marks.join("; ")}]`),
        external: [...new Set(rs.flatMap((r) => r.external))].sort(),
      });
    }
  }
}
await browser.close();
console.log(JSON.stringify(out, null, 1));
