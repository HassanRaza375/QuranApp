// Phase 13 (Daily Fiqh) screenshots: the prototype's pages (docs/design/prototype-remaining-pages.html, #/fiqh ...) next to the revamp, and the states that matter most for what a
// reader may and may not see (held, withheld and on-hold rulings, "Not added yet", Both and Urdu, Makarem Shirazi, the Sunni note). Run against a production build.
// Everything on these pages is REAL: the rulings are the legacy data, and the Qur'anic basis ayah is the reader's real text from quranapi.pages.dev (the machine needs the internet).
// The prototype shows its own sample content (and slots instead of ruling text), so pairs compare layout and behaviour, not words. Nothing but the images is stored.
import { createRequire } from "node:module";
import fs from "node:fs";
import { spawn } from "node:child_process";

const ROOT = decodeURIComponent(new URL("../../", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
const require = createRequire(ROOT + "/package.json");
const { chromium } = require("@playwright/test");
const OUT = ROOT + "/docs/design/fiqh-compare";
fs.mkdirSync(OUT, { recursive: true });
const PORT = 3012;
const BASE = `http://localhost:${PORT}`;
const server = spawn("node", [".output/server/index.mjs"], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NITRO_PORT: String(PORT) }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 3000));
const ONLY = process.argv[2];
const browser = await chromium.launch();
const SIZE = { desktop: { width: 1280, height: 900 }, mobile: { width: 375, height: 812 } };

async function revamp(device, theme, { marja = "sistani", lang = "en", seeds = {} } = {}) {
  const ctx = await browser.newContext({ viewport: SIZE[device], hasTouch: device !== "desktop", serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB" });
  const all = { themeMode: theme, prayerFiqh: "jafari", ...(marja ? { "quran:fiqh-prefs:v1": JSON.stringify({ marjaId: marja, lang, updatedAt: 1 }) } : {}), ...seeds };
  await ctx.addInitScript((all) => {
    if (!sessionStorage.getItem("__s")) {
      sessionStorage.setItem("__s", "1");
      for (const [k, v] of Object.entries(all)) localStorage.setItem(k, v);
    }
  }, all);
  return { ctx, page: await ctx.newPage() };
}
const settle = async (p, ms = 700) => { await p.waitForLoadState("networkidle"); await p.waitForTimeout(ms); };
const shot = (page, name, full = false) => page.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 80, fullPage: full });
async function topic(page, path) {
  await page.goto(BASE + path);
  await page.getByTestId("fiqh-topic-title").waitFor();
  await page.getByText("Loading the rulings…").waitFor({ state: "detached", timeout: 15000 }).catch(() => {});
  const all = page.getByTestId("fiqh-show-all");
  if (await all.count()) await all.click();
  await settle(page, 500);
}
async function ruling(page, id, name) {
  const r = page.locator(`[data-testid="ruling"][data-ruling="${id}"]`);
  await r.scrollIntoViewIfNeeded();
  await settle(page, 200);
  await r.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 82 });
}

async function protoShot(device, theme, hash, full = false) {
  const ctx = await browser.newContext({ viewport: SIZE[device] });
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem("quran:fiqh-prefs:v1", JSON.stringify({ marjaId: "sistani", lang: "en", updatedAt: 1 })));
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
    const PAGES = [
      ["home", "#/fiqh", "/fiqh", "fiqh-home", [["desktop", "light"], ["mobile", "dark"]]],
      ["choose", "#/fiqh/choose-marja", "/fiqh/choose-marja", "fiqh-choose", [["desktop", "light"]]],
      ["category", "#/fiqh/salah", "/fiqh/salat", "fiqh-topics", [["desktop", "light"], ["mobile", "dark"]]],
      ["topic", "#/fiqh/taharah/wudu", "/fiqh/taharat/wudu", "fiqh-topic", [["desktop", "light"], ["mobile", "dark"], ["desktop", "dark"]]],
      ["glossary", "#/fiqh/glossary", "/fiqh/glossary", "fiqh-glossary", [["desktop", "light"]]],
    ];
    for (const [name, proto, path, ready, variants] of PAGES) {
      for (const [device, theme] of variants) {
        const { ctx, page } = await revamp(device, theme);
        await page.goto(BASE + path);
        await page.getByTestId(ready).waitFor();
        if (name === "topic") await page.getByTestId("fiqh-quran").getByTestId("k-ayah").first().waitFor({ timeout: 20000 }).catch(() => {});
        await settle(page, 900);
        await compose(await protoShot(device, theme, proto), await page.screenshot({ type: "jpeg", quality: 78 }), `${OUT}/pair-${name}-${device}-${theme}.jpg`, name);
        await ctx.close();
      }
    }
  },
  async states() {
    let { ctx, page } = await revamp("desktop", "light", { marja: null });
    await page.goto(BASE + "/fiqh");
    await page.getByTestId("fiqh-gate").waitFor();
    await settle(page, 400);
    await shot(page, "state-gate-desktop");
    await ctx.close();

    ({ ctx, page } = await revamp("mobile", "light", { seeds: { prayerFiqh: "sunni" } }));
    await page.goto(BASE + "/fiqh");
    await page.getByTestId("fiqh-sunni").waitFor();
    await settle(page, 400);
    await shot(page, "state-sunni-notice-mobile");
    await ctx.close();

    // what a reader sees of the rulings he must not be given text for
    ({ ctx, page } = await revamp("desktop", "light", { marja: "khamenei" }));
    await topic(page, "/fiqh/salat/prayertimes");
    await ruling(page, "zuhrasrtime", "ruling-held-khamenei");
    await topic(page, "/fiqh/salat/clothing");
    await ruling(page, "goldmen", "ruling-english-withheld-khamenei");
    await topic(page, "/fiqh/taharat/mutahhirat");
    await ruling(page, "asphalt", "ruling-on-hold-khamenei");
    await topic(page, "/fiqh/foundations/taqlid");
    await ruling(page, "obtainingfatwa", "ruling-not-added-khamenei");
    await topic(page, "/fiqh/taharat/wudu");
    await ruling(page, "wududoubtperformed", "ruling-urdu-only-khamenei");
    await ruling(page, "wuduwashingcount", "ruling-qa-khamenei");
    await ctx.close();

    ({ ctx, page } = await revamp("mobile", "dark", { marja: "khamenei" }));
    await topic(page, "/fiqh/zakat/zakatcrops");
    await page.getByTestId("fiqh-rulings").scrollIntoViewIfNeeded();
    await shot(page, "state-nothing-for-khamenei-zakat-mobile-dark");
    await page.goto(BASE + "/fiqh/zakat");
    await page.getByTestId("fiqh-topics").waitFor();
    await settle(page, 1500);
    await shot(page, "state-category-counts-khamenei-zakat-mobile-dark");
    await ctx.close();

    ({ ctx, page } = await revamp("desktop", "light", { marja: "makarem" }));
    await topic(page, "/fiqh/foundations/taqlid");
    await page.getByTestId("fiqh-rulings").scrollIntoViewIfNeeded();
    await shot(page, "state-makarem-topic-desktop");
    await ctx.close();

    ({ ctx, page } = await revamp("desktop", "light", { marja: "sistani", lang: "both" }));
    await topic(page, "/fiqh/foundations/taqlid");
    await ruling(page, "taqlidoptions", "ruling-both-sistani");
    await ctx.close();

    ({ ctx, page } = await revamp("desktop", "light", { marja: "sistani", lang: "ur" }));
    await topic(page, "/fiqh/foundations/taqlid");
    await ruling(page, "taqlidoptions", "ruling-urdu-sistani");
    await page.locator('[data-testid="notice-no-urdu"]').first().scrollIntoViewIfNeeded();
    await shot(page, "state-urdu-mode-no-urdu-desktop");
    await ctx.close();

    ({ ctx, page } = await revamp("mobile", "light", { marja: "sistani" }));
    await topic(page, "/fiqh/taharat/haydistihadanifas");
    await page.getByTestId("fiqh-sensitive").scrollIntoViewIfNeeded();
    await shot(page, "state-women-panel-collapsed-mobile");
    await page.getByTestId("fiqh-sensitive").getByRole("button").click();
    await settle(page, 300);
    await shot(page, "state-women-panel-open-mobile");
    await ctx.close();
  },
  // ---- 13b: guided procedures, recitations, the live panel (the production build; the live times are the real AlAdhan answer for Lahore)
  async guided() {
    const el = async (page, testid, name, nth = 0) => {
      const e = page.getByTestId(testid).nth(nth);
      await e.scrollIntoViewIfNeeded();
      await settle(page, 300);
      await e.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 82 });
    };
    let { ctx, page } = await revamp("desktop", "light", { marja: "sistani" });
    await topic(page, "/fiqh/taharat/wudu");
    await el(page, "fiqh-procedure", "guided-step-sistani-desktop");
    await page.getByTestId("step-next").first().click();
    await settle(page, 200);
    await el(page, "fiqh-procedure", "guided-step2-sistani-desktop");
    await ctx.close();
    ({ ctx, page } = await revamp("mobile", "dark", { marja: "sistani", lang: "both" }));
    await topic(page, "/fiqh/taharat/wudu");
    await el(page, "fiqh-procedure", "guided-step-sistani-mobile-dark");
    await ctx.close();
    ({ ctx, page } = await revamp("desktop", "light", { marja: "sistani" }));
    await topic(page, "/fiqh/salat/guidedprayers");
    const fajr = page.locator('[data-testid="fiqh-procedure"][data-procedure="fajrsistani"]');
    await fajr.getByTestId("step-all").click();
    await settle(page, 300);
    await fajr.locator('[data-testid="ruling-recitation"]').first().scrollIntoViewIfNeeded();
    await fajr.locator('[data-testid="ruling-recitation"]').first().locator("xpath=../..").screenshot({ path: `${OUT}/guided-recitation-step-sistani-desktop.jpg`, type: "jpeg", quality: 82 });
    await topic(page, "/fiqh/salat/rukusujud");
    await ruling(page, "rukudhikr", "ruling-recitation-sistani");
    await ctx.close();
    ({ ctx, page } = await revamp("desktop", "light", { marja: "khamenei" }));
    await topic(page, "/fiqh/salat/guidedprayers");
    const zuhr = page.locator('[data-testid="fiqh-procedure"][data-procedure="zuhrkhamenei"]');
    await zuhr.getByTestId("step-all").click();
    await settle(page, 300);
    const s19 = zuhr.locator('[data-testid="fiqh-step"][data-step="s19"]');
    await s19.scrollIntoViewIfNeeded();
    await s19.screenshot({ path: `${OUT}/guided-step-pointer-khamenei.jpg`, type: "jpeg", quality: 82 });
    await topic(page, "/fiqh/taharat/wudu");
    await page.getByTestId("fiqh-steps").scrollIntoViewIfNeeded();
    await shot(page, "state-no-guide-khamenei-desktop");
    await ctx.close();

    // the live panel: nothing loaded, then the Prayer Times feature's own times
    ({ ctx, page } = await revamp("desktop", "light", { marja: "sistani", seeds: { last_location: JSON.stringify({ lat: 31.5204, lng: 74.3587 }) } }));
    await topic(page, "/fiqh/salat/prayertimes");
    await el(page, "fiqh-live", "live-panel-nothing-loaded-desktop");
    await page.goto(BASE + "/prayerTime");
    await page.getByTestId("next-card").waitFor({ timeout: 30000 });
    await page.evaluate(() => document.querySelector("#__nuxt").__vue_app__.config.globalProperties.$router.push("/fiqh/salat/prayertimes"));
    await page.getByTestId("live-times").waitFor();
    await settle(page, 400);
    await el(page, "fiqh-live", "live-panel-times-desktop");
    await page.evaluate(() => document.querySelector("#__nuxt").__vue_app__.config.globalProperties.$router.push("/fiqh/sawm/sawmtimes"));
    await page.locator('[data-testid="fiqh-live"][data-tool="sawm"]').waitFor();
    await settle(page, 400);
    await el(page, "fiqh-live", "live-panel-sawm-desktop");
    await ctx.close();
    ({ ctx, page } = await revamp("mobile", "dark", { marja: "sistani", seeds: { last_location: JSON.stringify({ lat: 31.5204, lng: 74.3587 }) } }));
    await page.goto(BASE + "/prayerTime");
    await page.getByTestId("next-card").waitFor({ timeout: 30000 });
    await page.evaluate(() => document.querySelector("#__nuxt").__vue_app__.config.globalProperties.$router.push("/fiqh/salat/prayertimes"));
    await page.getByTestId("live-times").waitFor();
    await settle(page, 400);
    await el(page, "fiqh-live", "live-panel-times-mobile-dark");
    await ctx.close();
  },
  // ---- the helpers (shown to everyone; every result says "Not scholar-reviewed")
  async helpers() {
    const open = async (page, path) => {
      await page.goto(BASE + path);
      await page.getByTestId("fiqh-helper").first().waitFor({ timeout: 30000 });
      await settle(page, 600);
    };
    const hshot = async (page, name) => {
      const h = page.getByTestId("fiqh-helper").first();
      await h.scrollIntoViewIfNeeded();
      await h.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 82 });
    };
    const pick = async (page, label) => {
      await page.getByTestId("helper-question").locator("label", { hasText: label }).first().locator("input").check();
      await page.getByTestId("helper-next").click();
      await settle(page, 150);
    };
    let { ctx, page } = await revamp("desktop", "light", { marja: "sistani" });
    await open(page, "/fiqh/taharat/wudu");
    await hshot(page, "helper-start-sistani-desktop");
    await page.getByTestId("helper-start").click();
    await hshot(page, "helper-question-sistani-desktop");
    await pick(page, "I am not sure whether I performed wu\u1e0d\u016b\u02be at all");
    await pick(page, "Before the prayer");
    await hshot(page, "helper-answer-sistani-desktop");
    await ctx.close();
    ({ ctx, page } = await revamp("desktop", "light", { marja: "sistani" }));
    await open(page, "/fiqh/taharat/wudu");
    await page.getByTestId("helper-start").click();
    await page.getByTestId("helper-notsure").check();
    await page.getByTestId("helper-next").click();
    await hshot(page, "helper-not-sure-pointer-sistani-desktop");
    await ctx.close();
    ({ ctx, page } = await revamp("desktop", "light", { marja: "khamenei" }));
    await open(page, "/fiqh/taharat/wudu");
    await page.getByTestId("helper-start").click();
    await pick(page, "I want to know whether something invalidates wu\u1e0d\u016b\u02be");
    await pick(page, "Some fluid came out");
    await pick(page, "Fluid that came out after istibr\u0101\u02be, and I doubt whether it is urine");
    await hshot(page, "helper-answer-pointer-khamenei-desktop");
    await ctx.close();
    ({ ctx, page } = await revamp("mobile", "dark", { marja: "sistani" }));
    await open(page, "/fiqh/taharat/wudu");
    await page.getByTestId("helper-start").click();
    await hshot(page, "helper-question-sistani-mobile-dark");
    await ctx.close();
  },
  async other() {
    let { ctx, page } = await revamp("desktop", "light");
    await page.goto(BASE + "/search");
    await page.getByTestId("search-input").fill("wudu");
    await page.getByTestId("search-page").getByTestId("group-fiqh").waitFor();
    await settle(page, 600);
    await shot(page, "search-fiqh-group-desktop");
    await ctx.close();
    ({ ctx, page } = await revamp("desktop", "light", { seeds: { "quran:bookmarks:v1": JSON.stringify(["fiqh:taqlid", "fiqh:wudu", "fiqh:prayertimes"]) } }));
    await page.goto(BASE + "/bookmarks");
    await page.waitForSelector("text=Daily Fiqh", { timeout: 15000 });
    await settle(page, 600);
    await shot(page, "library-fiqh-rows-desktop");
    await ctx.close();
    ({ ctx, page } = await revamp("desktop", "light"));
    await page.goto(BASE + "/fiqh/glossary#ihtiyatwajib");
    await page.getByTestId("fiqh-term").first().waitFor();
    await settle(page, 600);
    await shot(page, "glossary-term-link-desktop");
    await ctx.close();
  },
};
for (const [name, fn] of Object.entries(STEPS)) if (!ONLY || ONLY === name) await fn();
await browser.close();
server.kill();
console.log("done:", fs.readdirSync(OUT).length, "files in", OUT);
