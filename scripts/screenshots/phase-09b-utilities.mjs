// Phase 9B screenshots: the prototype's Tasbeeh, Sajda and Asma-ul-Husna screens next to the revamp (12 pairs) and revamp-only state shots.
// The Sajda Arabic is REAL data fetched from quranapi.pages.dev (the source the app uses), not synthetic text; nothing but the images is stored.
import { createRequire } from "node:module";
import fs from "node:fs";
import { spawn } from "node:child_process";

const ROOT = decodeURIComponent(new URL("../../", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
const require = createRequire(ROOT + "/package.json");
const { chromium } = require("@playwright/test");
const OUT = ROOT + "/docs/design/utilities-compare";
fs.mkdirSync(OUT, { recursive: true });
const PORT = 3012;
const BASE = `http://localhost:${PORT}`;
const server = spawn("node", [".output/server/index.mjs"], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NITRO_PORT: String(PORT) }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 3000));
// optional: `node scripts/screenshots/phase-09b-utilities.mjs <state-name>` regenerates one state only
const ONLY = process.argv[2];
const browser = await chromium.launch();

async function revamp(device, theme, { seeds = {}, textFails = false } = {}) {
  const ctx = await browser.newContext({ viewport: device === "desktop" ? { width: 1280, height: 800 } : { width: 375, height: 812 }, hasTouch: device === "mobile", serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB" });
  await ctx.addInitScript(({ theme, seeds }) => {
    if (!sessionStorage.getItem("__s")) {
      sessionStorage.setItem("__s", "1");
      localStorage.setItem("themeMode", theme);
      for (const [k, v] of Object.entries(seeds)) localStorage.setItem(k, v);
    }
  }, { theme, seeds });
  if (textFails) await ctx.route(/quranapi\.pages\.dev\/api\/\d+\/\d+\.json/, (r) => r.abort("internetdisconnected"));
  return { ctx, page: await ctx.newPage() };
}
const settle = async (p) => { await p.waitForLoadState("networkidle"); await p.waitForTimeout(1000); };

async function protoShot(device, theme, protoPage) {
  const ctx = await browser.newContext({ viewport: device === "desktop" ? { width: 1500, height: 900 } : { width: 700, height: 950 } });
  const page = await ctx.newPage();
  await page.goto("file:///" + ROOT + "/docs/design/prototype.html");
  await page.click('#deviceCtrl [data-device="' + device + '"]');
  await page.click('#themeCtrl [data-theme-choice="' + theme + '"]');
  await page.click(`.ctrl-btn[data-page="${protoPage}"]`);
  await page.waitForTimeout(500);
  const buf = await page.locator(device === "desktop" ? "#frame-desktop" : "#frame-mobile").screenshot({ type: "jpeg", quality: 80 });
  await ctx.close();
  return buf;
}
async function compose(left, right, file, label) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  const page = await ctx.newPage();
  const b64 = (b) => "data:image/jpeg;base64," + b.toString("base64");
  await page.setContent(`<body style="margin:0;background:#888;display:flex;gap:12px;align-items:flex-start;padding:12px;font:12px sans-serif"><div><div style="color:#fff;margin-bottom:4px">Prototype (${label})</div><img src="${b64(left)}"></div><div><div style="color:#fff;margin-bottom:4px">Revamp (${label})</div><img src="${b64(right)}"></div></body>`);
  await page.waitForTimeout(200);
  const w = await page.evaluate(() => document.body.scrollWidth), h = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: w, height: h });
  await page.screenshot({ path: file, type: "jpeg", quality: 82, fullPage: true });
  await ctx.close();
}

const PAGES = [
  ["tasbeeh", "tasbeeh", "/tasbeeh/subhanallah", "counter", { "quran:tasbeeh:v1": JSON.stringify({ subhanallah: { count: 12, target: 33, cycles: 2, lifetime: 78 } }) }],
  ["sajda", "sajda", "/sajda", "list", {}],
  ["asma", "asma", "/asma-ul-husna", "grid", {}],
];
for (const [name, protoPage, path, label, seeds] of ONLY ? [] : PAGES) for (const device of ["desktop", "mobile"]) for (const theme of ["light", "dark"]) {
  const { ctx, page } = await revamp(device, theme, { seeds });
  await page.goto(BASE + path);
  await settle(page);
  const right = await page.screenshot({ type: "jpeg", quality: 80 });
  await ctx.close();
  await compose(await protoShot(device, theme, protoPage), right, `${OUT}/${name}-${device}-${theme}.jpg`, label);
  console.log("pair", name, device, theme);
}

async function state(name, device, theme, path, fn, opts = {}) {
  if (ONLY && name !== ONLY) return;
  const { ctx, page } = await revamp(device, theme, opts);
  await page.goto(BASE + path);
  await settle(page);
  if (fn) await fn(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/state-${name}-${device}-${theme}.jpg`, type: "jpeg", quality: 82 });
  await ctx.close();
  console.log("state", name, device);
}
const MID = { "quran:tasbeeh:v1": JSON.stringify({ subhanallah: { count: 12, target: 33, cycles: 2, lifetime: 78 }, alhamdulillah: { count: 40, target: 99, cycles: 1, lifetime: 139 } }) };
for (const [device, theme] of [["desktop", "light"], ["mobile", "dark"]]) {
  await state("tasbeeh-index", device, theme, "/tasbeeh", null, { seeds: MID });
  await state("tasbeeh-zero", device, theme, "/tasbeeh/allahuakbar", null);
  await state("tasbeeh-mid", device, theme, "/tasbeeh/subhanallah", null, { seeds: MID });
  await state("tasbeeh-cycle-complete", device, theme, "/tasbeeh/subhanallah", async (p) => { await p.getByTestId("tap").click(); }, { seeds: { "quran:tasbeeh:v1": JSON.stringify({ subhanallah: { count: 32, target: 33, cycles: 2, lifetime: 95 } }) } });
  await state("tasbeeh-reset-undo", device, theme, "/tasbeeh/subhanallah", async (p) => { await p.getByTestId("reset").click(); }, { seeds: MID });
  await state("tasbeeh-reduced-motion", device, theme, "/tasbeeh/subhanallah", null, { seeds: { ...MID, "quran:accessibility:v1": JSON.stringify({ reducedMotion: true }) } });
  await state("tasbeeh-name-counter", device, theme, "/tasbeeh/name-12", null, { seeds: { "quran:tasbeeh:v1": JSON.stringify({ "name-12": { count: 3, target: 33, cycles: 0, lifetime: 3 } }) } });
  await state("sajda-list-real-text", device, theme, "/sajda", null);
  await state("sajda-saved-row", device, theme, "/sajda", async (p) => { await p.locator('[data-testid="sajda-row"][data-surah="32"] [data-testid="sajda-star"]').click(); await p.locator('[data-testid="sajda-row"][data-surah="32"]').scrollIntoViewIfNeeded(); }, {});
  await state("sajda-text-failed", device, theme, "/sajda", null, { textFails: true });
  await state("asma-search-none", device, theme, "/asma-ul-husna", async (p) => { await p.getByTestId("asma-search").fill("zzzz"); });
  await state("asma-search-results", device, theme, "/asma-ul-husna", async (p) => { await p.getByTestId("asma-search").fill("merciful"); });
  await state("asma-saved-empty", device, theme, "/asma-ul-husna", async (p) => { await p.getByTestId("asma-saved").click(); });
  await state("asma-saved", device, theme, "/asma-ul-husna", async (p) => { await p.locator('[data-testid="name-card"][data-id="12"] [data-testid="name-star"]').click(); await p.getByTestId("asma-saved").click(); });
  await state("asma-name-sheet", device, theme, "/asma-ul-husna#name-12", null);
  await state("perpage-sajda-sign", device, theme, "/per-page-read?page=416", async (p) => { await p.locator('[data-testid="verse-mark"][data-ayah="15"]').scrollIntoViewIfNeeded(); });
}
await browser.close();
server.kill();
console.log("done");
