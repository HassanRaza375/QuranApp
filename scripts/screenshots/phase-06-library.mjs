// Phase 6 screenshots: prototype Library next to the revamp (Saved x4, Collections and Notes) and revamp-only state shots.
import { createRequire } from "node:module";
import fs from "node:fs";
import { spawn } from "node:child_process";

import { fileURLToPath } from "node:url";
const ROOT = decodeURIComponent(new URL("../../", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
const require = createRequire(ROOT + "/package.json");
const { chromium } = require("@playwright/test");
const OUT = ROOT + "/docs/design/library-compare";
fs.mkdirSync(OUT, { recursive: true });
const PORT = 3012;
const BASE = `http://localhost:${PORT}`;
const server = spawn("node", [".output/server/index.mjs"], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NITRO_PORT: String(PORT) }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 3000));
const browser = await chromium.launch();

const NOW = "2026-10-15T09:14:00+05:00";
const NOWMS = Date.parse(NOW);
const DAY = 86400000;
const C1 = "0b6d3a0e-7a54-4c1c-9d5b-1f3c1b2a0001", C2 = "0b6d3a0e-7a54-4c1c-9d5b-1f3c1b2a0002";
const KEYS = ["surah:18", "ayah:2:255", "ayah:12:92", "juz:30", "page:49", "sajda:7:206", "name:1", "person:adam", "audio:36", "fiqh:taqlid", "story:adamandiblis"];
const LEGACY = {
  "quran:bookmarks:v1": JSON.stringify(KEYS),
  "quran:bookmarks:added-at:v1": JSON.stringify({ "surah:18": NOWMS - 12 * DAY, "ayah:2:255": NOWMS - 2 * DAY, "ayah:12:92": NOWMS - DAY, "juz:30": NOWMS - 20 * DAY, "sajda:7:206": NOWMS - 5 * DAY }),
  "quran:library:v1": JSON.stringify({
    collections: [{ id: C1, name: "Daily adhkar", description: "", createdAt: NOWMS - 30 * DAY }, { id: C2, name: "Forgiveness", description: "", createdAt: NOWMS - 20 * DAY }],
    itemMeta: {
      "ayah:2:255": { note: "Read before sleeping.", tags: ["night"], collectionIds: [C1], updatedAt: NOWMS - DAY },
      "ayah:12:92": { note: "Forgiveness without conditions.", tags: ["forgiveness"], collectionIds: [C2], updatedAt: NOWMS },
      "ayah:7:23": { note: "A note on an ayah that was never saved.", tags: [], collectionIds: [C2], updatedAt: NOWMS - 3 * DAY },
    },
  }),
};
const PINS = { "quran:pins:v1": JSON.stringify({ v: 1, reading: { surahNo: 2, ayahNo: 255, pinnedAt: NOWMS - DAY }, page: { pageNo: 49, pinnedAt: NOWMS - 2 * DAY } }) };

async function revamp(device, theme, { seeds = LEGACY, verse = "ok" } = {}) {
  const ctx = await browser.newContext({ viewport: device === "desktop" ? { width: 1280, height: 800 } : { width: 375, height: 812 }, hasTouch: device === "mobile", serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB" });
  await ctx.clock.setFixedTime(new Date(NOW));
  await ctx.addInitScript(({ theme, seeds }) => {
    if (!sessionStorage.getItem("__s")) {
      sessionStorage.setItem("__s", "1");
      localStorage.setItem("themeMode", theme);
      for (const [k, v] of Object.entries(seeds)) localStorage.setItem(k, v);
    }
  }, { theme, seeds });
  await ctx.route(/quranapi\.pages\.dev\/api\/\d+\/\d+\.json/, (r) => {
    const m = /api\/(\d+)\/(\d+)\.json/.exec(r.request().url());
    if (verse === "fail") return r.fulfill({ status: 500, body: "{}" });
    return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ arabic1: `TEST ARABIC ${m[1]}:${m[2]} (synthetic text)` }) });
  });
  return { ctx, page: await ctx.newPage() };
}
const settle = async (p) => { await p.waitForLoadState("networkidle"); await p.waitForTimeout(900); };

async function protoShot(device, theme, view) {
  const ctx = await browser.newContext({ viewport: device === "desktop" ? { width: 1500, height: 900 } : { width: 700, height: 950 } });
  const page = await ctx.newPage();
  await page.goto("file:///" + ROOT + "/docs/design/prototype.html");
  await page.click('#deviceCtrl [data-device="' + device + '"]');
  await page.click('#themeCtrl [data-theme-choice="' + theme + '"]');
  await page.click('.ctrl-btn[data-page="library"]');
  if (view !== "saved") await page.evaluate(({ device, view }) => document.querySelector(`#${device === "desktop" ? "d" : "m"}-page-library [data-act="lview"][data-v="${view}"]`)?.click(), { device, view: view === "collections" ? "colls" : view });
  await page.waitForTimeout(400);
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

const PATHS = { saved: "/bookmarks", collections: "/bookmarks?view=collections", notes: "/bookmarks?view=notes" };
const pairs = [["desktop", "light", "saved"], ["desktop", "dark", "saved"], ["mobile", "light", "saved"], ["mobile", "dark", "saved"], ["desktop", "light", "collections"], ["mobile", "dark", "collections"], ["desktop", "light", "notes"], ["mobile", "dark", "notes"]];
for (const [device, theme, view] of pairs) {
  const { ctx, page } = await revamp(device, theme, { seeds: { ...LEGACY, ...PINS } });
  await page.goto(BASE + PATHS[view]);
  await settle(page);
  const right = await page.screenshot({ type: "jpeg", quality: 80 });
  await ctx.close();
  await compose(await protoShot(device, theme, view), right, `${OUT}/${device}-${theme}-${view}.jpg`);
  console.log("pair", device, theme, view);
}

async function state(name, device, theme, path, fn, opts) {
  const { ctx, page } = await revamp(device, theme, opts);
  await page.goto(BASE + path);
  await settle(page);
  if (fn) await fn(page);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/state-${name}-${device}-${theme}.jpg`, type: "jpeg", quality: 82 });
  await ctx.close();
  console.log("state", name, device);
}
const row = (p, k) => p.locator(`[data-testid="library-row"][data-key="${k}"]`);
for (const [device, theme] of [["desktop", "light"], ["mobile", "dark"]]) {
  await state("first-run", device, theme, "/bookmarks", null, { seeds: {} });
  await state("pins-set", device, theme, "/bookmarks", null, { seeds: { ...LEGACY, ...PINS } });
  await state("pins-last-read", device, theme, "/bookmarks", null, { seeds: { ...LEGACY, "quran:reading-progress:v1": JSON.stringify({ surahNo: 18, ayahNo: 10, timestamp: NOWMS }) } });
  await state("pins-cleared-undo", device, theme, "/bookmarks", async (p) => { await p.getByRole("button", { name: "Clear the reading pin" }).click(); }, { seeds: { ...LEGACY, ...PINS } });
  await state("no-match", device, theme, "/bookmarks", async (p) => { await p.getByTestId("library-search").fill("xylophone"); }, {});
  await state("group-by-collection", device, theme, "/bookmarks", async (p) => { await p.getByRole("button", { name: /^Sort and group/ }).click(); await p.getByRole("menuitemradio", { name: "Group by collection" }).or(p.getByRole("option", { name: "Group by collection" })).click(); }, {});
  await state("show-menu", device, theme, "/bookmarks", async (p) => { await p.getByRole("button", { name: /^Show/ }).click(); }, {});
  await state("select-mode", device, theme, "/bookmarks", async (p) => { await p.getByTestId("select-toggle").click(); await p.getByRole("checkbox", { name: "Select Al-Kahf" }).check(); await p.getByRole("checkbox", { name: "Select Juz 30" }).check(); }, {});
  await state("edit-panel", device, theme, "/bookmarks", async (p) => { await row(p, "ayah:2:255").getByTestId("row-more").click(); await p.waitForTimeout(500); }, {});
  await state("undo-note-kept", device, theme, "/bookmarks", async (p) => { await row(p, "ayah:2:255").getByTestId("row-more").click(); await p.getByTestId("edit-remove").click(); await p.waitForTimeout(500); }, {});
  await state("new-note-error", device, theme, "/bookmarks", async (p) => { await p.getByTestId("new-note-open").click(); await p.getByTestId("new-note-ref").fill("2:999"); await p.getByTestId("new-note-text").fill("A note"); await p.getByTestId("new-note-save").click(); }, {});
  await state("collection-open", device, theme, "/bookmarks?collection=" + C2, null, {});
  await state("snippet-unavailable", device, theme, "/bookmarks", null, { verse: "fail" });
}
await browser.close();
server.kill();
console.log("done");
