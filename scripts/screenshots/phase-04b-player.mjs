// Phase 4B screenshots: the prototype's player overlay next to the revamp's sheet (4 pairs) and revamp-only state shots.
// No real audio is played: the audio element is a stand-in (as in the browser tests) so the images show the real UI in each state.
// Real playback, the lock screen and the large generic-type files are device checks.
import { createRequire } from "node:module";
import fs from "node:fs";
import { spawn } from "node:child_process";

const ROOT = decodeURIComponent(new URL("../../", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
const require = createRequire(ROOT + "/package.json");
const { chromium } = require("@playwright/test");
const OUT = ROOT + "/docs/design/player-compare";
fs.mkdirSync(OUT, { recursive: true });
const PORT = 3012;
const BASE = `http://localhost:${PORT}`;
const server = spawn("node", [".output/server/index.mjs"], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NITRO_PORT: String(PORT) }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 3000));
const browser = await chromium.launch();

const RESUME = { "quran:audio-resume:v1": JSON.stringify({ url: "x", position: 754, nowPlaying: { type: "surah", surahNo: 18, title: "Al-Kahf", subtitle: "Abu Bakr Al Shatri", reciter: "Abu Bakr Al Shatri" } }) };

async function revamp(device, theme, { seeds = {}, fail = false, stall = false } = {}) {
  const ctx = await browser.newContext({ viewport: device === "desktop" ? { width: 1280, height: 800 } : { width: 375, height: 812 }, hasTouch: device === "mobile", serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB" });
  await ctx.addInitScript(({ theme, seeds, fail, stall }) => {
    if (!sessionStorage.getItem("__s")) {
      sessionStorage.setItem("__s", "1");
      localStorage.setItem("themeMode", theme);
      for (const [k, v] of Object.entries(seeds)) localStorage.setItem(k, v);
    }
    const els = [];
    class FakeAudio {
      constructor() { this.src = ""; this.currentTime = 0; this.duration = 2400; this.playbackRate = 1; this.paused = true; this.h = {}; els.push(this); }
      addEventListener(n, f) { (this.h[n] ??= []).push(f); }
      emit(n) { (this.h[n] ?? []).forEach((f) => f()); }
      async play() {
        if (fail) { setTimeout(() => this.emit("error")); throw new DOMException("no file", "NotSupportedError"); }
        if (stall) return;
        this.paused = false;
        this.emit("loadedmetadata");
        this.emit("playing");
      }
      pause() { this.paused = true; this.emit("pause"); }
    }
    window.Audio = FakeAudio;
    window.__tick = (t) => { const e = els[els.length - 1]; e.currentTime = t; e.emit("timeupdate"); };
    window.__emit = (n) => els[els.length - 1].emit(n);
  }, { theme, seeds, fail, stall });
  // the listing needs no network; the text of a surah is not used on these pages
  await ctx.route(/quranapi\.pages\.dev\//, (r) => r.abort("internetdisconnected"));
  return { ctx, page: await ctx.newPage() };
}
const settle = async (p) => { await p.waitForLoadState("networkidle"); await p.waitForTimeout(800); };

async function protoShot(device, theme) {
  const ctx = await browser.newContext({ viewport: device === "desktop" ? { width: 1500, height: 900 } : { width: 700, height: 950 } });
  const page = await ctx.newPage();
  await page.goto("file:///" + ROOT + "/docs/design/prototype.html");
  await page.click('#deviceCtrl [data-device="' + device + '"]');
  await page.click('#themeCtrl [data-theme-choice="' + theme + '"]');
  await page.click('.ctrl-btn[data-page="surah"]');
  await page.click(device === "desktop" ? "#d-player-track" : "#m-player-track");
  await page.waitForTimeout(600);
  const buf = await page.locator(device === "desktop" ? "#frame-desktop" : "#frame-mobile").screenshot({ type: "jpeg", quality: 80 });
  await ctx.close();
  return buf;
}
async function compose(left, right, file) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  const page = await ctx.newPage();
  const b64 = (b) => "data:image/jpeg;base64," + b.toString("base64");
  await page.setContent(`<body style="margin:0;background:#888;display:flex;gap:12px;align-items:flex-start;padding:12px;font:12px sans-serif"><div><div style="color:#fff;margin-bottom:4px">Prototype (player overlay)</div><img src="${b64(left)}"></div><div><div style="color:#fff;margin-bottom:4px">Revamp (player sheet)</div><img src="${b64(right)}"></div></body>`);
  await page.waitForTimeout(200);
  const w = await page.evaluate(() => document.body.scrollWidth), h = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: w, height: h });
  await page.screenshot({ path: file, type: "jpeg", quality: 82, fullPage: true });
  await ctx.close();
}

async function playOne(page, n = 1, at = 754) {
  await page.getByTestId(`surah-row-${n}`).getByTestId("row-play").click();
  await page.getByTestId("mini-toggle").waitFor();
  await page.evaluate((t) => window.__tick(t), at);
  await page.waitForTimeout(300);
}
const ONLY = process.argv[2];

if (!ONLY) {
  for (const device of ["desktop", "mobile"]) for (const theme of ["light", "dark"]) {
    const { ctx, page } = await revamp(device, theme);
    await page.goto(BASE + "/surah-listing");
    await settle(page);
    await playOne(page, 2);
    await page.getByTestId("mini-open").click();
    await page.getByTestId("player-sheet").waitFor();
    await page.waitForTimeout(500);
    const right = await page.screenshot({ type: "jpeg", quality: 80 });
    await ctx.close();
    await compose(await protoShot(device, theme), right, `${OUT}/${device}-${theme}-player.jpg`);
    console.log("pair", device, theme);
  }
}

async function state(name, device, theme, fn, opts = {}, path = "/surah-listing") {
  if (ONLY && name !== ONLY) return;
  const { ctx, page } = await revamp(device, theme, opts);
  await page.goto(BASE + path);
  await settle(page);
  await fn(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/state-${name}-${device}-${theme}.jpg`, type: "jpeg", quality: 82 });
  await ctx.close();
  console.log("state", name, device);
}
const sheet = async (p) => { await p.getByTestId("mini-open").click(); await p.getByTestId("player-sheet").waitFor(); };
for (const [device, theme] of [["desktop", "light"], ["mobile", "dark"]]) {
  await state("mini-playing", device, theme, async (p) => { await playOne(p, 2); });
  await state("mini-paused-restored", device, theme, async () => {}, { seeds: RESUME });
  await state("mini-loading", device, theme, async (p) => { await p.getByTestId("surah-row-2").getByTestId("row-play").click(); await p.waitForTimeout(400); }, { stall: true });
  await state("mini-error", device, theme, async (p) => { await p.getByTestId("surah-row-2").getByTestId("row-play").click(); await p.getByTestId("mini-retry").waitFor(); }, { fail: true });
  await state("mini-buffering", device, theme, async (p) => { await playOne(p, 2); await p.evaluate(() => window.__emit("waiting")); }, {});
  await state("sheet-playing", device, theme, async (p) => { await playOne(p, 2); await sheet(p); });
  await state("sheet-resume-line", device, theme, async (p) => { await sheet(p); }, { seeds: RESUME });
  await state("sheet-first-surah-prev-disabled", device, theme, async (p) => { await playOne(p, 1, 90); await sheet(p); });
  await state("sheet-custom-speed", device, theme, async (p) => { await sheet(p); }, { seeds: { ...RESUME, "quran:audio-prefs:v1": JSON.stringify({ playbackRate: 0.5, repeatOne: true, autoAdvance: true }) } });
  await state("sheet-error", device, theme, async (p) => { await p.getByTestId("surah-row-2").getByTestId("row-play").click(); await p.getByTestId("mini-retry").waitFor(); await sheet(p); }, { fail: true });
  await state("sheet-reciter-note", device, theme, async (p) => { await playOne(p, 2); await sheet(p); await p.getByTestId("reciter-note").scrollIntoViewIfNeeded(); });
}
await browser.close();
server.kill();
console.log("done");
