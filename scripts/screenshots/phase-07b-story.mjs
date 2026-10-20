// Phase 7B screenshots: prototype Story reader next to the revamp (12 pairs) and revamp-only state shots.
import { createRequire } from "node:module";
import fs from "node:fs";
import { spawn } from "node:child_process";

const ROOT = decodeURIComponent(new URL("../../", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
const require = createRequire(ROOT + "/package.json");
const { chromium } = require("@playwright/test");
const OUT = ROOT + "/docs/design/story-compare";
fs.mkdirSync(OUT, { recursive: true });
const PORT = 3012;
const BASE = `http://localhost:${PORT}`;
const server = spawn("node", [".output/server/index.mjs"], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NITRO_PORT: String(PORT) }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 3000));
const browser = await chromium.launch();
const NOW = "2026-10-15T09:14:00+05:00";

const SURAHS = JSON.parse(fs.readFileSync(ROOT + "/../app/assets/data/surah.json", "utf8"));
async function revamp(device, theme, seeds = {}, text = "ok") {
  const ctx = await browser.newContext({ viewport: device === "desktop" ? { width: 1280, height: 800 } : { width: 375, height: 812 }, hasTouch: device === "mobile", serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB" });
  await ctx.clock.setFixedTime(new Date(NOW));
  await ctx.addInitScript(({ theme, seeds }) => {
    if (!sessionStorage.getItem("__s")) {
      sessionStorage.setItem("__s", "1");
      localStorage.setItem("themeMode", theme);
      for (const [k, v] of Object.entries(seeds)) localStorage.setItem(k, v);
    }
  }, { theme, seeds });
  await ctx.route(/quranapi\.pages\.dev\/api\/\d+\.json/, (r) => {
    const n = Number(/api\/(\d+)\.json/.exec(r.request().url())[1]);
    if (text === "fail") return r.abort("internetdisconnected");
    if (text === "slow") return new Promise((res) => setTimeout(res, 60000));
    const total = SURAHS[n - 1].totalAyah;
    const mk = (l) => Array.from({ length: total }, (_, i) => `${l} ${n}:${i + 1}`);
    return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ surahName: `TestSurah${n}`, surahNameArabic: "TEST", surahNameArabicLong: `TEST LONG ${n}`, surahNameTranslation: `Test Meaning ${n}`, revelationPlace: "Mecca", totalAyah: total, surahNo: n, audio: {}, english: mk("Test English"), arabic1: mk("TEST ARABIC"), arabic2: mk("TEST ARABIC ALT"), bengali: mk("Test Bengali"), urdu: mk("Test Urdu") }) });
  });
  return { ctx, page: await ctx.newPage() };
}
const settle = async (p) => { await p.waitForLoadState("networkidle"); await p.waitForTimeout(800); };

async function protoShot(device, theme, view) {
  const ctx = await browser.newContext({ viewport: device === "desktop" ? { width: 1500, height: 900 } : { width: 700, height: 950 } });
  const page = await ctx.newPage();
  await page.goto("file:///" + ROOT + "/docs/design/prototype.html");
  await page.click('#deviceCtrl [data-device="' + device + '"]');
  await page.click('#themeCtrl [data-theme-choice="' + theme + '"]');
  await page.click('.ctrl-btn[data-page="story"]');
  const act = (act, v, c) => page.evaluate(({ act, v, c }) => { const el = document.createElement("span"); el.dataset.act = act; if (v) el.dataset.v = v; if (c !== undefined) el.dataset.c = String(c); document.body.appendChild(el); el.click(); el.remove(); }, { act, v, c });
  if (view === "pieced") await act("story-open", "adam", 0);
  if (view === "end") await act("story-go", undefined, 4);
  if (view === "chapter") await act("story-go", undefined, 1);
  await page.waitForTimeout(500);
  const buf = await page.locator(device === "desktop" ? "#frame-desktop" : "#frame-mobile").screenshot({ type: "jpeg", quality: 80 });
  await ctx.close();
  return buf;
}
async function compose(left, right, file) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  const page = await ctx.newPage();
  const b64 = (b) => "data:image/jpeg;base64," + b.toString("base64");
  await page.setContent(`<body style="margin:0;background:#888;display:flex;gap:12px;align-items:flex-start;padding:12px;font:12px sans-serif"><div><div style="color:#fff;margin-bottom:4px">Prototype</div><img src="${b64(left)}"></div><div><div style="color:#fff;margin-bottom:4px">Revamp</div><img src="${b64(right)}"></div></body>`);
  await page.waitForTimeout(200);
  const w = await page.evaluate(() => document.body.scrollWidth), h = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: w, height: h });
  await page.screenshot({ path: file, type: "jpeg", quality: 82, fullPage: true });
  await ctx.close();
}


const VIEWS = { chapter: "/stories/yusufstory?chapter=2", end: "/stories/yusufstory?chapter=end", pieced: "/stories/adamandiblis" };
for (const device of ["desktop", "mobile"]) for (const theme of ["light", "dark"]) for (const view of ["chapter", "end", "pieced"]) {
  const { ctx, page } = await revamp(device, theme);
  await page.goto(BASE + VIEWS[view]);
  await settle(page);
  const right = await page.screenshot({ type: "jpeg", quality: 80 });
  await ctx.close();
  await compose(await protoShot(device, theme, view), right, `${OUT}/${device}-${theme}-${view}.jpg`);
  console.log("pair", device, theme, view);
}

async function state(name, device, theme, path, fn, seeds, text) {
  const { ctx, page } = await revamp(device, theme, seeds, text);
  await page.goto(BASE + path);
  if (text === "slow") await page.waitForTimeout(1500);
  else await settle(page);
  if (fn) await fn(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/state-${name}-${device}-${theme}.jpg`, type: "jpeg", quality: 82 });
  await ctx.close();
  console.log("state", name, device);
}
const PROG = { "quran:story-progress:v1": JSON.stringify({ v: 1, stories: { yusufstory: { chapter: 2, read: [0, 1], updatedAt: 1 } } }), "quran:bookmarks:v1": JSON.stringify(["story:yusufstory"]) };
for (const [device, theme] of [["desktop", "light"], ["mobile", "dark"]]) {
  await state("directory", device, theme, "/stories", null);
  await state("directory-no-match", device, theme, "/stories?q=xylophone", null);
  await state("directory-progress", device, theme, "/stories", null, PROG);
  await state("chapter-top", device, theme, "/stories/yusufstory", null);
  await state("chapter-show-all", device, theme, "/stories/yusufstory", async (p) => { await p.getByTestId("show-all").click(); });
  await state("rail-read-chapters", device, theme, "/stories/yusufstory?chapter=3", null, PROG);
  await state("continue-banner", device, theme, "/stories/yusufstory", null, PROG);
  await state("compare-tellings", device, theme, "/stories/adamandiblis", async (p) => { await p.getByTestId("compare-open").click(); });
  await state("entity-person", device, theme, "/stories/yusufstory", async (p) => { await p.locator('[data-testid="entity-chip"][data-kind="person"]').first().click(); });
  await state("entity-place", device, theme, "/stories/yusufstory", async (p) => { await p.locator('[data-testid="entity-chip"][data-kind="place"]').first().click(); });
  await state("in-this-story-events", device, theme, "/stories/adamandiblis", async (p) => { await p.getByTestId("in-story").scrollIntoViewIfNeeded(); });
  await state("single-chapter", device, theme, "/stories/qarunstory", null);
  await state("loading", device, theme, "/stories/yusufstory", null, {}, "slow");
  await state("failed", device, theme, "/stories/yusufstory", null, {}, "fail");
  await state("end-of-story-lessons", device, theme, "/stories/yusufstory?chapter=end", async (p) => { await p.getByTestId("lessons").scrollIntoViewIfNeeded(); });
  await state("not-found", device, theme, "/stories/nobody", null);
  await state("person-story-tab", device, theme, "/persons/yusuf", async (p) => { await p.getByTestId("stories-section").scrollIntoViewIfNeeded(); }, PROG);
}
await browser.close();
server.kill();
console.log("done");
