// Phase 7A screenshots: prototype Prophets & People (Browse, Timeline, Person) next to the revamp (12 pairs) and revamp-only state shots.
import { createRequire } from "node:module";
import fs from "node:fs";
import { spawn } from "node:child_process";

import { fileURLToPath } from "node:url";
const ROOT = decodeURIComponent(new URL("../../", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
const require = createRequire(ROOT + "/package.json");
const { chromium } = require("@playwright/test");
const OUT = ROOT + "/docs/design/people-compare";
fs.mkdirSync(OUT, { recursive: true });
const PORT = 3012;
const BASE = `http://localhost:${PORT}`;
const server = spawn("node", [".output/server/index.mjs"], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NITRO_PORT: String(PORT) }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 3000));
const browser = await chromium.launch();
const NOW = "2026-10-15T09:14:00+05:00";

async function revamp(device, theme, seeds = {}) {
  const ctx = await browser.newContext({ viewport: device === "desktop" ? { width: 1280, height: 800 } : { width: 375, height: 812 }, hasTouch: device === "mobile", serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB" });
  await ctx.clock.setFixedTime(new Date(NOW));
  await ctx.addInitScript(({ theme, seeds }) => {
    if (!sessionStorage.getItem("__s")) {
      sessionStorage.setItem("__s", "1");
      localStorage.setItem("themeMode", theme);
      for (const [k, v] of Object.entries(seeds)) localStorage.setItem(k, v);
    }
  }, { theme, seeds });
  return { ctx, page: await ctx.newPage() };
}
const settle = async (p) => { await p.waitForLoadState("networkidle"); await p.waitForTimeout(800); };

async function protoShot(device, theme, view) {
  const ctx = await browser.newContext({ viewport: device === "desktop" ? { width: 1500, height: 900 } : { width: 700, height: 950 } });
  const page = await ctx.newPage();
  await page.goto("file:///" + ROOT + "/docs/design/prototype.html");
  await page.click('#deviceCtrl [data-device="' + device + '"]');
  await page.click('#themeCtrl [data-theme-choice="' + theme + '"]');
  await page.click('.ctrl-btn[data-page="people"]');
  const d = device === "desktop" ? "d" : "m";
  if (view === "timeline") await page.evaluate((d) => document.querySelector(`#${d}-pview [data-v="timeline"]`)?.click(), d);
  if (view === "person") await page.evaluate((d) => document.querySelector(`#${d}-people-body [data-act="person"][data-v="yusuf"]`)?.click(), d);
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

const PATHS = { browse: "/persons", timeline: "/persons/timeline", person: "/persons/yusuf" };
for (const device of ["desktop", "mobile"]) for (const theme of ["light", "dark"]) for (const view of ["browse", "timeline", "person"]) {
  const { ctx, page } = await revamp(device, theme);
  await page.goto(BASE + PATHS[view]);
  await settle(page);
  const right = await page.screenshot({ type: "jpeg", quality: 80 });
  await ctx.close();
  await compose(await protoShot(device, theme, view), right, `${OUT}/${device}-${theme}-${view}.jpg`);
  console.log("pair", device, theme, view);
}

async function state(name, device, theme, path, fn, seeds) {
  const { ctx, page } = await revamp(device, theme, seeds);
  await page.goto(BASE + path);
  await settle(page);
  if (fn) await fn(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/state-${name}-${device}-${theme}.jpg`, type: "jpeg", quality: 82 });
  await ctx.close();
  console.log("state", name, device);
}
const STUDY = { "quran:bookmarks:v1": JSON.stringify(["person:musa"]), "quran:persons-study:v1": JSON.stringify({ musa: { personId: "musa", lastSection: "direct-mentions", passageView: "surah", lastSurahNo: 20, lastAyahNo: 9, updatedAt: 1 } }) };
for (const [device, theme] of [["desktop", "light"], ["mobile", "dark"]]) {
  await state("no-match", device, theme, "/persons?q=xylophone", null);
  await state("saved-empty", device, theme, "/persons?saved=1", null);
  await state("category-menu", device, theme, "/persons", async (p) => { await p.getByRole("button", { name: /^Category/ }).click(); });
  await state("timeline-branches-open", device, theme, "/persons/timeline", async (p) => { await p.getByTestId("branch-toggle").first().click(); await p.getByTestId("branch-toggle").first().scrollIntoViewIfNeeded(); });
  await state("person-more-detail", device, theme, "/persons/nuh", async (p) => { await p.getByTestId("more-detail").click(); });
  await state("person-no-story", device, theme, "/persons/idris", null);
  await state("person-group", device, theme, "/persons/gardenmen?tab=passages", null);
  await state("person-passages", device, theme, "/persons/yusuf?tab=passages", null);
  await state("person-story-view", device, theme, "/persons/yusuf?tab=passages", async (p) => { await p.getByTestId("view-story").click(); });
  await state("person-family-traditional", device, theme, "/persons/ibrahim?tab=family", null);
  await state("person-family-reversed-entries", device, theme, "/persons/maryam?tab=family", null);
  await state("person-resume-banner", device, theme, "/persons/musa", null, STUDY);
  await state("person-stories-notice", device, theme, "/persons/yusuf", async (p) => { await p.getByTestId("stories-section").scrollIntoViewIfNeeded(); });
  await state("person-not-found", device, theme, "/persons/nobody", null);
}
await browser.close();
server.kill();
console.log("done");
