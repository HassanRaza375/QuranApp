// Phase 4C screenshots (revamp only: no prototype screen has per-ayah audio): the reader's play button and playing-ayah highlight, the Per-page frame and
// the Stories chapter while a queue plays, the mini player and sheet for an ayah and for a queue, a failed ayah with Try again and Skip, a restored
// queue, and the Asma-ul-Husna name sheet. The text and the per-ayah answers are REAL (fetched from the sources the app uses); no real audio is played:
// the audio element is a stand-in, and requests for the recordings themselves are blocked.
import { createRequire } from "node:module";
import fs from "node:fs";
import { spawn } from "node:child_process";

const ROOT = decodeURIComponent(new URL("../../", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
const require = createRequire(ROOT + "/package.json");
const { chromium } = require("@playwright/test");
const OUT = ROOT + "/docs/design/ayah-audio-compare";
fs.mkdirSync(OUT, { recursive: true });
const PORT = 3012;
const BASE = `http://localhost:${PORT}`;
const server = spawn("node", [".output/server/index.mjs"], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NITRO_PORT: String(PORT) }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 3000));
const browser = await chromium.launch();
const ONLY = process.argv[2];

async function ctxFor(device, theme, { seeds = {}, fail = false } = {}) {
  const ctx = await browser.newContext({ viewport: device === "desktop" ? { width: 1280, height: 800 } : { width: 375, height: 812 }, hasTouch: device === "mobile", serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB" });
  await ctx.addInitScript(({ theme, seeds, fail }) => {
    if (!sessionStorage.getItem("__s")) {
      sessionStorage.setItem("__s", "1");
      localStorage.setItem("themeMode", theme);
      for (const [k, v] of Object.entries(seeds)) localStorage.setItem(k, v);
    }
    const els = [];
    class FakeAudio {
      constructor() { this.src = ""; this.currentTime = 0; this.duration = 9; this.playbackRate = 1; this.paused = true; this.ended = false; this.h = {}; els.push(this); }
      addEventListener(n, f) { (this.h[n] ??= []).push(f); }
      emit(n) { (this.h[n] ?? []).forEach((f) => f()); }
      async play() {
        if (window.__failNow ?? fail) { setTimeout(() => this.emit("error")); throw new DOMException("no file", "NotSupportedError"); }
        this.paused = false; this.emit("loadedmetadata"); this.emit("playing");
      }
      pause() { this.paused = true; this.emit("pause"); }
    }
    window.Audio = FakeAudio;
    window.__tick = (t) => { const e = els[els.length - 1]; e.currentTime = t; e.emit("timeupdate"); };
    window.__end = () => { const e = els[els.length - 1]; e.ended = true; e.paused = true; e.currentTime = e.duration; e.emit("pause"); e.emit("ended"); };
  }, { theme, seeds, fail });
  await ctx.route(/the-quran-project\.github\.io|github\.com|githubusercontent\.com|quranaudio\.myislam\.org/, (r) => r.abort("blockedbyclient"));
  return ctx;
}
const settle = async (p) => { await p.waitForLoadState("networkidle"); await p.waitForTimeout(900); };
async function state(name, device, theme, path, fn, opts = {}) {
  if (ONLY && name !== ONLY) return;
  const ctx = await ctxFor(device, theme, opts);
  const page = await ctx.newPage();
  await page.goto(BASE + path);
  await settle(page);
  await fn(page);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/state-${name}-${device}-${theme}.jpg`, type: "jpeg", quality: 82 });
  await ctx.close();
  console.log("state", name, device);
}
const row = (p, n) => p.getByTestId(`ayah-${n}`);
const openSheet = async (p) => { await p.getByTestId("mini-open").click(); await p.getByTestId("player-sheet").waitFor(); };

for (const [device, theme] of [["desktop", "light"], ["mobile", "dark"]]) {
  await state("reader-row-idle", device, theme, "/surah/112", async (p) => { await row(p, 2).scrollIntoViewIfNeeded(); });
  await state("reader-ayah-playing", device, theme, "/surah/2", async (p) => { await row(p, 255).scrollIntoViewIfNeeded(); await row(p, 255).getByTestId("ayah-play").click(); await p.getByTestId("mini-player").waitFor(); await row(p, 255).scrollIntoViewIfNeeded(); });
  await state("sheet-ayah", device, theme, "/surah/2", async (p) => { await row(p, 255).scrollIntoViewIfNeeded(); await row(p, 255).getByTestId("ayah-play").click(); await openSheet(p); });
  await state("perpage-queue-playing", device, theme, "/per-page-read?page=3", async (p) => { await p.getByTestId("play-page").click(); await p.getByTestId("mini-player").waitFor(); await p.evaluate(() => window.__end()); await p.waitForTimeout(400); await p.getByTestId("page-frame").scrollIntoViewIfNeeded(); });
  await state("sheet-queue", device, theme, "/per-page-read?page=3", async (p) => { await p.getByTestId("play-page").click(); await p.evaluate(() => window.__end()); await p.waitForTimeout(300); await openSheet(p); });
  await state("stories-listen-playing", device, theme, "/stories/yusufstory", async (p) => { await p.getByTestId("listen").click(); await p.getByTestId("mini-player").waitFor(); await p.evaluate(() => window.__end()); await p.waitForTimeout(400); await p.getByTestId("chapter-text").scrollIntoViewIfNeeded(); });
  await state("queue-failed-ayah", device, theme, "/per-page-read?page=3", async (p) => { await p.getByTestId("play-page").click(); await p.getByTestId("mini-player").waitFor(); await p.evaluate(() => { window.__failNow = true; window.__end(); }); await p.getByTestId("mini-skip").waitFor(); });
  await state("queue-restored-paused", device, theme, "/per-page-read?page=3", async () => {}, { seeds: { "quran:audio-queue:v1": JSON.stringify({ v: 1, kind: "page", ref: { page: 3 }, index: 2, reciter: "Mishary Rashid Al Afasy", position: 4, savedAt: 1 }) } });
  await state("sheet-queue-restored", device, theme, "/per-page-read?page=3", async (p) => { await openSheet(p); }, { seeds: { "quran:audio-queue:v1": JSON.stringify({ v: 1, kind: "page", ref: { page: 3 }, index: 2, reciter: "Mishary Rashid Al Afasy", position: 4, savedAt: 1 }) } });
  await state("asma-name-play", device, theme, "/asma-ul-husna#name-12", async (p) => { await p.getByTestId("sheet-play").click(); await p.waitForTimeout(300); });
  await state("asma-name-no-recording", device, theme, "/asma-ul-husna#name-53", async () => {});
  await state("follow-audio-switch", device, theme, "/surah/2", async (p) => { await row(p, 5).getByTestId("ayah-play").click(); await openSheet(p); await p.getByTestId("player-follow").scrollIntoViewIfNeeded(); });
}
await browser.close();
server.kill();
console.log("done");
