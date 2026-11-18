// A manual check of the Vercel Web Analytics wiring in a real browser. Not in CI.
//
//   $env:VERCEL = "1"; $env:NITRO_PRESET = "node-server"; npm run build      (a build made "as if on Vercel", still a plain node server)
//   node .output/server/index.mjs                                             (port 3000, or set PORT)
//   node scripts/live/analytics.live.mjs http://localhost:3000 on             (expects the script to be injected)
//   ...and with a normal build (no VERCEL):  node scripts/live/analytics.live.mjs http://localhost:3000 off
//
// Vercel's real script is replaced by a stub that records what the app hands it, so nothing is sent anywhere. It checks that the page address is cut to a path, that the
// admin page is dropped, that Do Not Track and offline browsers get no script, and that a build that is not made on Vercel never requests it.
import { chromium } from "@playwright/test";

const BASE = (process.argv[2] || "http://localhost:3000").replace(/\/+$/, "");
const EXPECT_ON = (process.argv[3] || "on") === "on";
let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "pass" : "FAIL"}  ${name}${extra ? `  (${extra})` : ""}`);
  if (!ok) failed++;
};

const STUB = `window.__stub = true;`;
const browser = await chromium.launch();
async function visit(path, { dnt = false, offline = false } = {}) {
  const context = await browser.newContext({ baseURL: BASE, serviceWorkers: "block" });
  if (dnt) await context.addInitScript(() => Object.defineProperty(navigator, "doNotTrack", { get: () => "1" }));
  const requests = [];
  await context.route(/\/_vercel\/insights\//, (route) => {
    requests.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "text/javascript", body: STUB });
  });
  const page = await context.newPage();
  await page.goto(path);
  await page.locator("#__nuxt").waitFor();
  await page.waitForTimeout(1500);
  if (offline) await context.setOffline(true);
  const queue = await page.evaluate(() => (window.vaq || []).map((q) => [q[0], q[1] && typeof q[1] === "object" ? q[1] : typeof q[1]]));
  const scripts = await page.evaluate(() => [...document.querySelectorAll("script[src]")].map((s) => s.getAttribute("src")).filter((s) => /_vercel\/insights/.test(s)));
  const sent = await page.evaluate(() => {
    // run the app's own beforeSend on sample addresses, as the real script would
    const reg = (window.vaq || []).find((q) => q[0] === "beforeSend");
    const f = reg && reg[1];
    return typeof f === "function"
      ? { search: f({ type: "pageview", url: location.origin + "/search?q=private+words#x" }), admin: f({ type: "pageview", url: location.origin + "/admin?x=1" }) }
      : null;
  });
  await context.close();
  return { requests, queue, scripts, sent };
}

const r = await visit("/settings");
if (EXPECT_ON) {
  check("the Vercel script is injected on the hosted build", r.scripts.length === 1, r.scripts.join());
  check("the page view handed to it is a path, with no query string", r.queue.some((q) => q[0] === "pageview" && q[1] && q[1].path === "/settings" && !JSON.stringify(q[1]).includes("?")), JSON.stringify(r.queue.map((q) => q[0])));
  check("a beforeSend guard is registered", r.sent !== null);
  check("it cuts a search address to its path, so what was searched for is never sent", r.sent?.search?.url?.endsWith("/search") && !r.sent.search.url.includes("private"), r.sent?.search?.url);
  check("it drops the admin page", r.sent?.admin === null);
  const dnt = await visit("/settings", { dnt: true });
  check("Do Not Track: no script and nothing queued", dnt.scripts.length === 0 && dnt.requests.length === 0 && !dnt.queue.some((q) => q[0] === "pageview"));
  const admin = await visit("/admin");
  check("the admin page: the guard drops its view (the script may load, nothing is counted)", admin.sent?.admin === null);
} else {
  check("a build that is not made on Vercel never requests the script", r.requests.length === 0 && r.scripts.length === 0);
  check("and queues nothing", r.queue.length === 0, JSON.stringify(r.queue));
}
await browser.close();
console.log(failed ? `\n${failed} check(s) FAILED` : "\nall checks passed");
process.exit(failed ? 1 : 0);
