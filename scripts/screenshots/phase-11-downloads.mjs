// Phase 11 screenshots: the prototype's Downloads (docs/design/prototype-remaining-pages.html, #/downloads) next to the revamp (pairs), and revamp-only
// states. Run against a production build (npm run build). The revamp's text and audio answers are SYNTHETIC (right counts, exact byte sizes, obviously
// fake content): this page shows names, counts and sizes, never verses. The prototype shows its own sample content, so the pairs compare layout and
// behaviour, not figures. Nothing but the images is stored.
import { createRequire } from "node:module";
import fs from "node:fs";
import { spawn } from "node:child_process";

const ROOT = decodeURIComponent(new URL("../../", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
const require = createRequire(ROOT + "/package.json");
const { chromium } = require("@playwright/test");
const OUT = ROOT + "/docs/design/downloads-compare";
fs.mkdirSync(OUT, { recursive: true });
const PORT = 3012;
const BASE = `http://localhost:${PORT}`;
const surahs = JSON.parse(fs.readFileSync(ROOT + "/legacy/app/assets/data/surah.json", "utf8"));
const COUNT = Object.fromEntries(surahs.map((s) => [s.surahNo, s.totalAyah]));
const SIZES = Object.fromEntries([...fs.readFileSync(ROOT + "/app/data/audioSizes.generated.ts", "utf8").matchAll(/"(\d)": \[([\d,]+)\]/g)].map((m) => [m[1], m[2].split(",").map(Number)]));
const chapter = (n) => {
  const mk = (l) => Array.from({ length: COUNT[n] }, (_, i) => `${l} ${n}:${i + 1}`);
  return { surahName: `Test${n}`, surahNameArabic: "TEST", surahNameArabicLong: `TEST ${n}`, surahNameTranslation: "Test", revelationPlace: "Mecca", totalAyah: COUNT[n], surahNo: n, audio: {}, english: mk("E"), arabic1: mk("A"), arabic2: mk("B"), bengali: mk("G"), urdu: mk("U") };
};
const tafsir = (s, a) => ({ tafsirs: [{ author: "A", groupVerse: null, content: `t ${s}:${a}` }, { author: "B", groupVerse: null, content: "t" }, { author: "C", groupVerse: null, content: "t" }] });
const mp3 = (n) => {
  const b = Buffer.alloc(n, 0x41);
  b.set([0x49, 0x44, 0x33, 0x03]);
  return b;
};

const server = spawn("node", [".output/server/index.mjs"], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NITRO_PORT: String(PORT) }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 3000));
const ONLY = process.argv[2];
const browser = await chromium.launch();
const SIZE = { desktop: { width: 1280, height: 900 }, mobile: { width: 375, height: 812 }, m390: { width: 390, height: 844 } };

async function revamp(device, theme, { seeds = {}, wifi = false, slow = 0, bad = false, quota = null } = {}) {
  const ctx = await browser.newContext({ viewport: SIZE[device], hasTouch: device !== "desktop", serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB" });
  await ctx.addInitScript(({ theme, seeds, wifi, quota }) => {
    if (!sessionStorage.getItem("__s")) {
      sessionStorage.setItem("__s", "1");
      localStorage.setItem("themeMode", theme);
      for (const [k, v] of Object.entries(seeds)) localStorage.setItem(k, v);
    }
    if (wifi) Object.defineProperty(navigator, "connection", { value: Object.assign(new EventTarget(), { type: "cellular" }), configurable: true });
    if (quota) Object.defineProperty(navigator.storage, "estimate", { value: () => Promise.resolve(quota), configurable: true });
  }, { theme, seeds, wifi, quota });
  await ctx.route(/https:\/\/quranapi\.pages\.dev\/api\/tafsir\/\d+_\d+\.json/, (route) => {
    const m = /tafsir\/(\d+)_(\d+)/.exec(route.request().url());
    return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(tafsir(+m[1], +m[2])) });
  });
  await ctx.route(/https:\/\/quranapi\.pages\.dev\/api\/\d+\.json/, (route) => route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(chapter(+/api\/(\d+)\.json/.exec(route.request().url())[1])) }));
  await ctx.route(/https:\/\/(raw|media)\.githubusercontent\.com\//, async (route) => {
    const m = /Data\/(\d+)\/(\d+)\.mp3/.exec(route.request().url());
    if (slow) await new Promise((r) => setTimeout(r, slow));
    if (bad) return route.fulfill({ status: 200, headers: { "access-control-allow-origin": "*", "content-type": "text/html" }, body: "<html>x</html>" });
    return route.fulfill({ status: 200, headers: { "access-control-allow-origin": "*", "content-type": "application/octet-stream" }, body: mp3(SIZES[m[1]][+m[2] - 1]) });
  });
  return { ctx, page: await ctx.newPage() };
}
const settle = async (p, ms = 700) => { await p.waitForLoadState("networkidle"); await p.waitForTimeout(ms); };
const shot = async (page, name) => page.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 82 });

async function addViaSheet(page, name, { tafsir: t = false, audio = true } = {}) {
  await page.getByTestId("dl-add").click();
  await page.getByTestId("dl-filter").fill(name);
  await page.locator('[data-testid^="dl-check-"]').first().check();
  if (t) await page.getByTestId("dl-include-tafsir").click();
  if (!audio) await page.getByTestId("dl-include-audio").click();
  await page.getByTestId("dl-start").click();
}
/** A populated page: a few surahs saved through the app itself. */
async function populate(page) {
  await page.goto(BASE + "/downloads");
  await page.getByTestId("dl-empty").waitFor();
  await page.getByTestId("dl-pick-67").click();
  await page.getByTestId("dl-row-67").waitFor({ timeout: 30000 });
  await addViaSheet(page, "ikhlas", { tafsir: true });
  await page.getByTestId("dl-row-112").getByTestId("dl-part-tafsir").waitFor();
  await page.waitForFunction(() => document.querySelector('[data-testid="dl-row-112"] span[data-testid="dl-part-tafsir"]'));
  await addViaSheet(page, "faatiha", { audio: false });
  await page.getByTestId("dl-row-1").waitFor();
  await page.waitForFunction(() => !document.querySelector('[data-testid="dl-queue"]'));
}

async function protoShot(device, theme, hash, click) {
  const ctx = await browser.newContext({ viewport: SIZE[device] });
  const page = await ctx.newPage();
  await page.goto("file:///" + ROOT + "/docs/design/prototype-remaining-pages.html" + hash);
  await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
  if (click) await page.click(click);
  await page.waitForTimeout(600);
  const buf = await page.screenshot({ type: "jpeg", quality: 80 });
  await ctx.close();
  return buf;
}
async function compose(left, right, file, label) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  const page = await ctx.newPage();
  const b64 = (b) => "data:image/jpeg;base64," + b.toString("base64");
  await page.setContent(`<body style="margin:0;background:#888;display:flex;gap:12px;align-items:flex-start;padding:12px;font:12px sans-serif"><div><div style="color:#fff;margin-bottom:4px">Prototype (${label})</div><img src="${b64(left)}"></div><div><div style="color:#fff;margin-bottom:4px">Revamp</div><img src="${b64(right)}"></div></body>`);
  await page.waitForTimeout(200);
  const w = await page.evaluate(() => document.body.scrollWidth), h = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: w, height: h });
  await page.screenshot({ path: file, type: "jpeg", quality: 82, fullPage: true });
  await ctx.close();
}

const STEPS = {
  async pairs() {
    for (const device of ["desktop", "mobile"]) for (const theme of ["light", "dark"]) {
      const { ctx, page } = await revamp(device, theme);
      await populate(page);
      await settle(page);
      const right = await page.screenshot({ type: "jpeg", quality: 80 });
      await compose(await protoShot(device, theme, "#/downloads"), right, `${OUT}/pair-saved-${device}-${theme}.jpg`, "saved list");
      await page.getByTestId("dl-add").click();
      await page.getByTestId("dl-sheet").waitFor();
      await settle(page, 500);
      const sheet = await page.screenshot({ type: "jpeg", quality: 80 });
      await compose(await protoShot(device, theme, "#/downloads", '[data-a="dl-add"]'), sheet, `${OUT}/pair-add-${device}-${theme}.jpg`, "Add surahs");
      await ctx.close();
    }
  },
  async empty() {
    for (const [device, theme] of [["desktop", "light"], ["mobile", "dark"]]) {
      const { ctx, page } = await revamp(device, theme);
      await page.goto(BASE + "/downloads");
      await page.getByTestId("dl-empty").waitFor();
      await settle(page);
      await shot(page, `empty-${device}-${theme}`);
      await ctx.close();
    }
  },
  async states() {
    // waiting for Wi-Fi (queue), with progress bar and the audio parked
    let { ctx, page } = await revamp("m390", "light", { wifi: true, seeds: { "quran:download-prefs:v1": JSON.stringify({ wifiOnly: true }) } });
    await page.goto(BASE + "/downloads");
    await page.getByTestId("dl-empty").waitFor();
    await addViaSheet(page, "mulk");
    await page.getByTestId("dl-job-67").waitFor();
    await page.waitForFunction(() => document.querySelector('[data-testid="dl-job-67"]')?.getAttribute("data-status") === "wifi");
    await settle(page, 400);
    await shot(page, "state-waiting-wifi-m390");
    await ctx.close();
    // offline
    ({ ctx, page } = await revamp("m390", "dark"));
    await page.goto(BASE + "/downloads");
    await page.getByTestId("dl-empty").waitFor();
    await ctx.setOffline(true);
    await page.getByTestId("dl-offline-note").waitFor();
    await addViaSheet(page, "ikhlas", { audio: false });
    await page.getByTestId("dl-job-112").waitFor();
    await settle(page, 400);
    await shot(page, "state-offline-m390-dark");
    await ctx.close();
    // failed + Retry
    ({ ctx, page } = await revamp("m390", "light", { bad: true }));
    await page.goto(BASE + "/downloads");
    await page.getByTestId("dl-empty").waitFor();
    await addViaSheet(page, "ikhlas");
    await page.waitForFunction(() => document.querySelector('[data-testid="dl-job-112"]')?.getAttribute("data-status") === "failed");
    await shot(page, "state-failed-m390");
    await ctx.close();
    // not enough space
    ({ ctx, page } = await revamp("m390", "light", { quota: { usage: 9_990_000_000, quota: 10_000_000_000 } }));
    await page.goto(BASE + "/downloads");
    await page.getByTestId("dl-empty").waitFor();
    await addViaSheet(page, "mulk");
    await page.waitForFunction(() => document.querySelector('[data-testid="dl-job-67"]')?.getAttribute("data-status") === "space");
    await shot(page, "state-space-m390");
    await ctx.close();
    // Not saved + older app's audio (a manifest entry the device no longer holds; an opaque copy)
    ({ ctx, page } = await revamp("m390", "light", { seeds: { "quran:downloads:v1": JSON.stringify([{ surahNo: 36, surahName: "x", totalAyah: 83, hasTafsir: true, reciterKey: null, reciterName: null, audioUrl: null, sizeBytesEstimate: 5, downloadedAt: 1, revamp: 1 }]) } }));
    await page.goto(BASE + "/");
    await page.evaluate(async () => {
      const res = await fetch("https://raw.githubusercontent.com/The-Quran-Project/Quran-Audio-Chapters/refs/heads/main/Data/1/36.mp3", { mode: "no-cors" });
      await (await caches.open("quran-downloads-audio-cache")).put("https://github.com/The-Quran-Project/Quran-Audio-Chapters/raw/refs/heads/main/Data/1/36.mp3", res);
    });
    await page.goto(BASE + "/downloads");
    await page.getByTestId("dl-row-36").waitFor();
    await page.getByTestId("dl-row-36").scrollIntoViewIfNeeded();
    await settle(page, 500);
    await shot(page, "state-notsaved-older-m390");
    await ctx.close();
    // iPhone note
    ctx = await browser.newContext({ viewport: SIZE.m390, hasTouch: true, serviceWorkers: "block", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1" });
    page = await ctx.newPage();
    await page.goto(BASE + "/downloads");
    await page.getByTestId("dl-home-note").waitFor();
    await settle(page, 400);
    await shot(page, "state-iphone-note-m390");
    await ctx.close();
  },
  async surahAudios() {
    for (const [device, theme] of [["desktop", "light"], ["mobile", "dark"]]) {
      const { ctx, page } = await revamp(device, theme);
      await page.goto(BASE + "/surah-audios/36");
      await page.getByTestId("sa-list").waitFor();
      await page.getByTestId("sa-row-3").getByTestId("sa-download").click();
      await page.waitForFunction(() => document.querySelector('[data-testid="sa-row-3"]')?.getAttribute("data-state") === "saved");
      await settle(page, 500);
      await shot(page, `surah-audios-${device}-${theme}`);
      await ctx.close();
    }
    const { ctx, page } = await revamp("m390", "light");
    await page.goto(BASE + "/surah-audios/112");
    await page.getByTestId("sa-row-1").getByTestId("sa-play").click();
    await page.getByTestId("mini-open").click();
    await page.getByTestId("player-save").waitFor();
    await page.getByTestId("player-save").scrollIntoViewIfNeeded();
    await settle(page, 500);
    await shot(page, "player-save-m390");
    await page.getByTestId("player-save").click();
    await page.getByTestId("player-saved").waitFor();
    await page.getByTestId("player-saved").scrollIntoViewIfNeeded();
    await settle(page, 300);
    await shot(page, "player-saved-m390");
    await ctx.close();
  },
};

for (const [name, fn] of Object.entries(STEPS)) if (!ONLY || ONLY === name) await fn();
await browser.close();
server.kill();
console.log("done:", fs.readdirSync(OUT).length, "files in", OUT);
