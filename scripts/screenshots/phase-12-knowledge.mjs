// Phase 12 screenshots (the Peoples & Nations checkpoint): the prototype's knowledge pages (docs/design/prototype-remaining-pages.html, #/k/peoples and
// #/k/peoples/ad) next to the revamp (pairs), and revamp-only states. Run against a production build. The revamp's ayah text is SYNTHETIC (right counts,
// obviously fake words) because the page shows the reader's text; every name, Arabic name, summary and link on these pages is the real legacy data. The
// prototype shows its own sample content, so the pairs compare layout and behaviour, not words. Nothing but the images is stored.
import { createRequire } from "node:module";
import fs from "node:fs";
import { spawn } from "node:child_process";

const ROOT = decodeURIComponent(new URL("../../", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
const require = createRequire(ROOT + "/package.json");
const { chromium } = require("@playwright/test");
const OUT = ROOT + "/docs/design/knowledge-compare";
fs.mkdirSync(OUT, { recursive: true });
const PORT = 3012;
const BASE = `http://localhost:${PORT}`;
const surahs = JSON.parse(fs.readFileSync(ROOT + "/legacy/app/assets/data/surah.json", "utf8"));
const COUNT = Object.fromEntries(surahs.map((s) => [s.surahNo, s.totalAyah]));
const chapter = (n) => {
  const mk = (l) => Array.from({ length: COUNT[n] }, (_, i) => `${l} ${n}:${i + 1}`);
  return { surahName: `Test${n}`, surahNameArabic: "TEST", surahNameArabicLong: `TEST ${n}`, surahNameTranslation: "Test", revelationPlace: "Mecca", totalAyah: COUNT[n], surahNo: n, audio: {}, english: mk("Test English"), arabic1: mk("TEST ARABIC"), arabic2: mk("B"), bengali: mk("G"), urdu: mk("U") };
};
const server = spawn("node", [".output/server/index.mjs"], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NITRO_PORT: String(PORT) }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 3000));
const ONLY = process.argv[2];
const browser = await chromium.launch();
const SIZE = { desktop: { width: 1280, height: 900 }, mobile: { width: 375, height: 812 } };

async function revamp(device, theme, { seeds = {}, textMode = "ok" } = {}) {
  const ctx = await browser.newContext({ viewport: SIZE[device], hasTouch: device !== "desktop", serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB" });
  await ctx.addInitScript(({ theme, seeds }) => {
    if (!sessionStorage.getItem("__s")) {
      sessionStorage.setItem("__s", "1");
      localStorage.setItem("themeMode", theme);
      for (const [k, v] of Object.entries(seeds)) localStorage.setItem(k, v);
    }
  }, { theme, seeds });
  await ctx.route(/https:\/\/quranapi\.pages\.dev\/api\/\d+\.json/, (route) => {
    if (textMode === "network") return route.abort("internetdisconnected");
    return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(chapter(+/api\/(\d+)\.json/.exec(route.request().url())[1])) });
  });
  return { ctx, page: await ctx.newPage() };
}
const settle = async (p, ms = 700) => { await p.waitForLoadState("networkidle"); await p.waitForTimeout(ms); };
const shot = (page, name, full = false) => page.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 80, fullPage: full });

async function protoShot(device, theme, hash, full = false) {
  const ctx = await browser.newContext({ viewport: SIZE[device] });
  const page = await ctx.newPage();
  await page.goto("file:///" + ROOT + "/docs/design/prototype-remaining-pages.html" + hash);
  await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
  await page.waitForTimeout(600);
  const buf = await page.screenshot({ type: "jpeg", quality: 78, fullPage: full });
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
  await page.screenshot({ path: file, type: "jpeg", quality: 80, fullPage: true });
  await ctx.close();
}

const STEPS = {
  async pairs() {
    for (const [device, theme] of [["desktop", "light"], ["mobile", "dark"], ["desktop", "dark"], ["mobile", "light"]]) {
      let { ctx, page } = await revamp(device, theme);
      await page.goto(BASE + "/peoples");
      await page.getByTestId("k-grid").waitFor();
      await settle(page);
      await compose(await protoShot(device, theme, "#/k/peoples"), await page.screenshot({ type: "jpeg", quality: 78 }), `${OUT}/pair-list-${device}-${theme}.jpg`, "list");
      await ctx.close();
      ({ ctx, page } = await revamp(device, theme));
      await page.goto(BASE + "/peoples/ad");
      await page.getByTestId("k-name").waitFor();
      await page.getByTestId("k-passage-text").first().waitFor();
      await settle(page);
      await compose(await protoShot(device, theme, "#/k/peoples/ad"), await page.screenshot({ type: "jpeg", quality: 78 }), `${OUT}/pair-detail-${device}-${theme}.jpg`, "detail");
      await ctx.close();
    }
  },
  async detail() {
    for (const [device, theme] of [["desktop", "light"], ["mobile", "dark"]]) {
      const { ctx, page } = await revamp(device, theme);
      await page.goto(BASE + "/peoples/ad");
      await page.getByTestId("k-name").waitFor();
      await page.getByTestId("k-passage-text").first().waitFor();
      await settle(page);
      await shot(page, `detail-full-${device}-${theme}`, true);
      const ref = page.getByTestId("k-referenced-section");
      if (await ref.count()) { await ref.scrollIntoViewIfNeeded(); await settle(page, 300); await shot(page, `detail-referenced-${device}-${theme}`); }
      await ctx.close();
    }
  },
  async states() {
    let { ctx, page } = await revamp("desktop", "light");
    await page.goto(BASE + "/peoples");
    await page.getByTestId("k-grid").waitFor();
    await page.getByTestId("k-filter").fill("7:65");
    await settle(page, 500);
    await shot(page, "state-filter-reference-desktop");
    await page.getByTestId("k-filter").fill("zzzz");
    await settle(page, 300);
    await shot(page, "state-empty-desktop");
    await ctx.close();
    ({ ctx, page } = await revamp("mobile", "light"));
    await page.goto(BASE + "/peoples");
    await page.getByTestId("k-grid").waitFor();
    await page.getByTestId("k-saved").click();
    await settle(page, 400);
    await shot(page, "state-saved-empty-mobile");
    await ctx.close();
    ({ ctx, page } = await revamp("mobile", "light"));
    await page.goto(BASE + "/peoples/sabbathbreakers");
    await page.getByTestId("k-name").waitFor();
    await settle(page);
    await shot(page, "state-basis-tag-mobile");
    await ctx.close();
    ({ ctx, page } = await revamp("desktop", "light", { textMode: "network" }));
    await page.goto(BASE + "/peoples/ad");
    await page.getByTestId("k-passage-unavailable").first().waitFor();
    await page.getByTestId("k-passage-unavailable").first().scrollIntoViewIfNeeded();
    await settle(page, 300);
    await shot(page, "state-text-unavailable-desktop");
    await ctx.close();
    ({ ctx, page } = await revamp("desktop", "light", { seeds: { "quran:bookmarks:v1": JSON.stringify(["community:ad", "community:thamud", "person:hud"]) } }));
    await page.goto(BASE + "/bookmarks");
    await page.waitForSelector("text=Peoples & Nations", { timeout: 15000 });
    await settle(page, 600);
    await shot(page, "library-legacy-community-keys-desktop");
    await ctx.close();
    ({ ctx, page } = await revamp("desktop", "light"));
    await page.goto(BASE + "/persons/hud?tab=family");
    await page.getByTestId("family-tab").waitFor();
    await page.getByTestId("referenced-section").waitFor({ timeout: 15000 });
    await page.getByTestId("referenced-section").scrollIntoViewIfNeeded();
    await settle(page, 300);
    await shot(page, "person-referenced-by-desktop");
    await ctx.close();
  },
};
for (const [name, fn] of Object.entries(STEPS)) if (!ONLY || ONLY === name) await fn();
await browser.close();
server.kill();
console.log("done:", fs.readdirSync(OUT).length, "files in", OUT);
