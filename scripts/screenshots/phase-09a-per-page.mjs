// Phase 9A screenshots: the prototype's Per page screen next to the revamp (4 pairs) and revamp-only state shots.
// The revamp shows REAL Qur'an data: the surah text is fetched from quranapi.pages.dev (the same source the app uses), so the Arabic is real,
// not synthetic. Nothing is stored in the repo except the images.
import { createRequire } from "node:module";
import fs from "node:fs";
import { spawn } from "node:child_process";

const ROOT = decodeURIComponent(new URL("../../", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
const require = createRequire(ROOT + "/package.json");
const { chromium } = require("@playwright/test");
const OUT = ROOT + "/docs/design/per-page-compare";
fs.mkdirSync(OUT, { recursive: true });
const PORT = 3012;
const BASE = `http://localhost:${PORT}`;
const server = spawn("node", [".output/server/index.mjs"], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NITRO_PORT: String(PORT) }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 3000));
const browser = await chromium.launch();

// pages worth showing, found from the recorded real page responses
const ranges = JSON.parse(fs.readFileSync(`${ROOT}/tests/fixtures/alquran-page-ranges.json`, "utf8")).pages;
const TWO = Object.keys(ranges).map(Number).find((p) => ranges[p].segs.length === 2 && ranges[p].segs[0][1] !== 1 && ranges[p].segs[1][1] === 1);
console.log("two-surah page", TWO);

async function revamp(device, theme, { seeds = {}, chapters = "real", delay = 0 } = {}) {
  const ctx = await browser.newContext({ viewport: device === "desktop" ? { width: 1280, height: 800 } : { width: 375, height: 812 }, hasTouch: device === "mobile", serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB" });
  await ctx.addInitScript(({ theme, seeds }) => {
    if (!sessionStorage.getItem("__s")) {
      sessionStorage.setItem("__s", "1");
      localStorage.setItem("themeMode", theme);
      for (const [k, v] of Object.entries(seeds)) localStorage.setItem(k, v);
    }
  }, { theme, seeds });
  await ctx.route(/quranapi\.pages\.dev\/api\/\d+\.json/, async (r) => {
    if (chapters === "fail") return r.abort("internetdisconnected");
    if (delay) await new Promise((res) => setTimeout(res, delay));
    return r.continue();
  });
  return { ctx, page: await ctx.newPage() };
}
const settle = async (p) => { await p.waitForLoadState("networkidle"); await p.waitForTimeout(900); };

async function protoShot(device, theme) {
  const ctx = await browser.newContext({ viewport: device === "desktop" ? { width: 1500, height: 900 } : { width: 700, height: 950 } });
  const page = await ctx.newPage();
  await page.goto("file:///" + ROOT + "/docs/design/prototype.html");
  await page.click('#deviceCtrl [data-device="' + device + '"]');
  await page.click('#themeCtrl [data-theme-choice="' + theme + '"]');
  await page.click('.ctrl-btn[data-page="mushaf"]');
  await page.evaluate(() => window.setPage(1)); // the only page the prototype has text for
  await page.waitForTimeout(500);
  const buf = await page.locator(device === "desktop" ? "#frame-desktop" : "#frame-mobile").screenshot({ type: "jpeg", quality: 80 });
  await ctx.close();
  return buf;
}
async function compose(left, right, file) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  const page = await ctx.newPage();
  const b64 = (b) => "data:image/jpeg;base64," + b.toString("base64");
  await page.setContent(`<body style="margin:0;background:#888;display:flex;gap:12px;align-items:flex-start;padding:12px;font:12px sans-serif"><div><div style="color:#fff;margin-bottom:4px">Prototype (page 1)</div><img src="${b64(left)}"></div><div><div style="color:#fff;margin-bottom:4px">Revamp (page 1)</div><img src="${b64(right)}"></div></body>`);
  await page.waitForTimeout(200);
  const w = await page.evaluate(() => document.body.scrollWidth), h = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: w, height: h });
  await page.screenshot({ path: file, type: "jpeg", quality: 82, fullPage: true });
  await ctx.close();
}

for (const device of ["desktop", "mobile"]) for (const theme of ["light", "dark"]) {
  const { ctx, page } = await revamp(device, theme);
  await page.goto(BASE + "/per-page-read?page=1");
  await page.getByTestId("page-frame").waitFor();
  await settle(page);
  const right = await page.screenshot({ type: "jpeg", quality: 80 });
  await ctx.close();
  await compose(await protoShot(device, theme), right, `${OUT}/${device}-${theme}-page.jpg`);
  console.log("pair", device, theme);
}

async function state(name, device, theme, path, fn, opts = {}) {
  const { ctx, page } = await revamp(device, theme, opts);
  await page.goto(BASE + path);
  if (!opts.skipWait) { await page.getByTestId("page-frame").or(page.getByTestId("page-error")).waitFor(); await settle(page); }
  if (fn) await fn(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/state-${name}-${device}-${theme}.jpg`, type: "jpeg", quality: 82 });
  await ctx.close();
  console.log("state", name, device);
}
const BIG = { "quran:accessibility:v1": JSON.stringify({ arabicFontScale: 1.6 }) };
for (const [device, theme] of [["desktop", "light"], ["mobile", "dark"]]) {
  await state("mid-surah", device, theme, "/per-page-read?page=3", null);
  await state("surah-start", device, theme, "/per-page-read?page=2", null);
  await state("two-surahs", device, theme, `/per-page-read?page=${TWO}`, null);
  await state("last-page", device, theme, "/per-page-read?page=604", null);
  await state("largest-scale", device, theme, "/per-page-read?page=3", null, { seeds: BIG });
  await state("largest-scale-two-surahs", device, theme, `/per-page-read?page=${TWO}`, null, { seeds: BIG });
  await state("loading", device, theme, "/per-page-read?page=3", null, { delay: 4000, skipWait: true });
  await state("not-saved-offline", device, theme, "/per-page-read?page=1", async (p) => {
    await p.context().setOffline(true);
    await p.getByTestId("go-input").fill("300");
    await p.getByTestId("go-button").click();
    await p.getByTestId("page-error").waitFor();
  });
  await state("load-failed", device, theme, "/per-page-read?page=3", null, { chapters: "fail" });
  await state("bad-go-to", device, theme, "/per-page-read?page=3", async (p) => {
    await p.getByTestId("go-input").fill("700");
    await p.getByTestId("go-button").click();
    await p.getByTestId("page-nav").scrollIntoViewIfNeeded();
  });
  await state("invalid-address", device, theme, "/per-page-read?page=700", null);
  await state("pinned-and-saved", device, theme, "/per-page-read?page=49", async (p) => {
    await p.getByTestId("pin-page").click();
    await p.getByTestId("save-page").click();
  });
}
await browser.close();
server.kill();
console.log("done");
