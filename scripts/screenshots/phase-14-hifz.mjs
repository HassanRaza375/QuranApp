// Phase 14 (Hifz) screenshots: the prototype (docs/design/prototype-hifz.html) next to the revamp, and the states that matter (first run, the plan, the add sheet, every
// step of a session, the surah page, dark, a phone). Run against a production build:
//   npm run build && node scripts/screenshots/phase-14-hifz.mjs [name]
// The Arabic on screen is the reader's REAL text from quranapi.pages.dev (the machine needs the internet); the progress is a seeded sample (Al-Mulk with 2 ayahs started,
// Al-Ikhlaas with 4: strong, strong, needs work, memorized), the same sample the prototype shows. Nothing but the images is stored.
import { createRequire } from "node:module";
import fs from "node:fs";
import { spawn } from "node:child_process";

const ROOT = decodeURIComponent(new URL("../../", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
const require = createRequire(ROOT + "/package.json");
const { chromium } = require("@playwright/test");
const OUT = ROOT + "/docs/design/hifz-compare";
fs.mkdirSync(OUT, { recursive: true });
const PORT = 3012;
const BASE = `http://localhost:${PORT}`;
const server = spawn("node", [".output/server/index.mjs"], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NITRO_PORT: String(PORT) }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 3000));
const ONLY = process.argv[2];
const browser = await chromium.launch();
const SIZE = { desktop: { width: 1280, height: 900 }, mobile: { width: 375, height: 812 } };
const NOW = "2026-10-15T09:14:00+05:00";
const TODAY = "2026-10-15";

const ayah = (target, n, strength, o = {}) => ({ key: `${target}:${n}`, targetId: target, ayahNo: n, strength, interval: 1, ease: 2, nextReviewAt: TODAY, reviewCount: 3, historicalMistakes: 0, recentResults: ["good", "good", "good"], hintsUsed: 0, lastHintLevel: 0, lastReviewedAt: "2026-10-08", ...o });
const join = (target, from, strength = "memorized", o = {}) => ({ key: `${target}:${from}`, targetId: target, fromAyah: from, toAyah: from + 1, strength, mistakes: 0, recentResults: ["good"], lastReviewedAt: "2026-10-08", ...o });
const SAMPLE = {
  targets: [
    { id: "t-mulk", surahNo: 67, surahName: "The Sovereignty", startAyah: 1, endAyah: 30, dailyNewTarget: 1, dailyTimeGoalMinutes: 15, status: "active", lastPosition: 2, lastAssessmentAt: null, createdAt: 1 },
    { id: "t-ikhlas", surahNo: 112, surahName: "Sincerity", startAyah: 1, endAyah: 4, dailyNewTarget: 1, dailyTimeGoalMinutes: 15, status: "active", lastPosition: 4, lastAssessmentAt: null, createdAt: 2 },
  ],
  ayahStates: [
    ayah("t-mulk", 1, "memorized", { interval: 4 }),
    ayah("t-mulk", 2, "learning", { interval: 2 }),
    ayah("t-ikhlas", 1, "strong", { interval: 30, nextReviewAt: TODAY }),
    ayah("t-ikhlas", 2, "strong", { interval: 40, nextReviewAt: "2026-11-20" }),
    ayah("t-ikhlas", 3, "weak", { recentResults: ["good", "again", "again"], historicalMistakes: 2 }),
    ayah("t-ikhlas", 4, "memorized", { interval: 6, nextReviewAt: TODAY }),
  ],
  transitionStates: [join("t-mulk", 1), join("t-ikhlas", 1, "strong", { recentResults: ["good", "good", "good"] }), join("t-ikhlas", 2, "weak", { recentResults: ["again"], mistakes: 1 }), join("t-ikhlas", 3)],
  activity: [],
};
// the words slipped on in Al-Ikhlaas 112:3 (the word's own text is filled in from the page by the first session; here a placeholder letter group)
const WORDS = (w) => JSON.stringify({ v: 1, ayahs: { "112:3": { 1: { word: w, slipDays: ["2026-10-12", "2026-10-13"], cleanDays: [], last: "2026-10-13" } } } });

async function revamp(device, theme, { seeds = {} } = {}) {
  const ctx = await browser.newContext({ viewport: SIZE[device], hasTouch: device !== "desktop", serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB" });
  await ctx.clock.setFixedTime(new Date(NOW));
  const all = { themeMode: theme, ...seeds };
  await ctx.addInitScript((all) => {
    if (!sessionStorage.getItem("__s")) {
      sessionStorage.setItem("__s", "1");
      for (const [k, v] of Object.entries(all)) localStorage.setItem(k, v);
    }
  }, all);
  return { ctx, page: await ctx.newPage() };
}
const settle = async (p, ms = 600) => { await p.waitForLoadState("networkidle"); await p.waitForTimeout(ms); };
const shot = (page, name, full = false) => page.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 82, fullPage: full });
const t = (page, id) => page.getByTestId(id);

async function protoShot(device, theme, hash, name, act) {
  const ctx = await browser.newContext({ viewport: SIZE[device] });
  const page = await ctx.newPage();
  await page.goto("file:///" + ROOT + "/docs/design/prototype-hifz.html" + hash);
  await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
  await page.waitForTimeout(500);
  if (act) await act(page);
  await page.screenshot({ path: `${OUT}/proto-${name}.jpg`, type: "jpeg", quality: 78 });
  await ctx.close();
}

const scenes = {
  async home() {
    for (const device of ["desktop", "mobile"]) for (const theme of ["light", "dark"]) {
      const { ctx, page } = await revamp(device, theme, { seeds: { "quran:hifz:v2": JSON.stringify(SAMPLE) } });
      await page.goto(BASE + "/hifz");
      await t(page, "hifz-plan").waitFor();
      await settle(page);
      await shot(page, `home-${device}-${theme}`, true);
      await ctx.close();
    }
    await protoShot("desktop", "light", "#/", "home-desktop-light");
    await protoShot("mobile", "light", "#/", "home-mobile-light");
  },
  async empty() {
    const { ctx, page } = await revamp("desktop", "light");
    await page.goto(BASE + "/hifz");
    await t(page, "hifz-empty").waitFor();
    await shot(page, "empty-desktop-light");
    await t(page, "hifz-add-first").click();
    await t(page, "hifz-add-sheet").waitFor();
    await settle(page, 500);
    await shot(page, "add-desktop-light");
    await ctx.close();
    const m = await revamp("mobile", "light");
    await m.page.goto(BASE + "/hifz");
    await t(m.page, "hifz-add-first").click();
    await t(m.page, "hifz-add-sheet").waitFor();
    await settle(m.page, 500);
    await t(m.page, "hifz-add-surah").selectOption("36");
    await shot(m.page, "add-mobile-light");
    await t(m.page, "hifz-add-range").click();
    await shot(m.page, "add-range-mobile-light");
    await m.ctx.close();
    await protoShot("desktop", "light", "#/", "add-desktop-light", (p) => p.click('[data-a="add"]'));
  },
  async session() {
    for (const [device, theme] of [["desktop", "light"], ["mobile", "light"], ["mobile", "dark"]]) {
      const { ctx, page } = await revamp(device, theme, { seeds: { "quran:hifz:v2": JSON.stringify(SAMPLE) } });
      await page.goto(BASE + "/hifz");
      await t(page, "hifz-start").click();
      await t(page, "hifz-review").waitFor();
      await settle(page, 400);
      // the tricky ayah, all hidden
      await shot(page, `review-hidden-${device}-${theme}`);
      // one word revealed (a slip), the first-word cue, then everything shown with one slip marked
      await t(page, "word-2").click();
      await shot(page, `review-slip-${device}-${theme}`);
      await t(page, "hifz-reveal-all").click();
      await t(page, "word-3").click().catch(() => {});
      await shot(page, `review-revealed-${device}-${theme}`);
      await t(page, "hifz-finish").click();
      await shot(page, `review-verdict-${device}-${theme}`);
      await t(page, "hifz-continue").click();
      // the next step is the weak join (Al-Ikhlaas 2 to 3); skip it for a clean review
      await t(page, "hifz-join").waitFor();
      if (device === "mobile" && theme === "light") await shot(page, "join-weak-mobile-light");
      await t(page, "hifz-skip").click();
      await t(page, "hifz-review").waitFor();
      await t(page, "hifz-reveal-all").click();
      await t(page, "hifz-finish").click();
      if (device === "desktop" && theme === "light") await shot(page, "review-verdict-clean-desktop-light");
      await ctx.close();
    }
    await protoShot("desktop", "light", "#/session", "review-hidden-desktop-light");
    await protoShot("mobile", "light", "#/session", "review-hidden-mobile-light");
    await protoShot("desktop", "light", "#/session", "review-slip-desktop-light", async (p) => { await p.click('[data-a="word"][data-i="2"]'); });
  },
  async learn() {
    for (const [device, theme] of [["desktop", "light"], ["mobile", "dark"]]) {
      const { ctx, page } = await revamp(device, theme, { seeds: { "quran:hifz:v2": JSON.stringify(SAMPLE) } });
      // go straight to the new ayah: skip the review steps
      await page.goto(BASE + "/hifz");
      await t(page, "hifz-start").click();
      await t(page, "hifz-review").waitFor();
      for (let i = 0; i < 6; i++) {
        if (await t(page, "hifz-learn").count()) break;
        await t(page, "hifz-skip").click();
        await page.waitForTimeout(250);
      }
      await t(page, "hifz-learn").waitFor();
      await settle(page, 400);
      await shot(page, `learn-1-listen-${device}-${theme}`);
      await t(page, "hifz-next").click();
      await shot(page, `learn-2-readalong-${device}-${theme}`);
      await t(page, "hifz-next").click();
      await t(page, "hifz-hide-more").click();
      await t(page, "hifz-hide-more").click();
      await shot(page, `learn-3-fade-${device}-${theme}`);
      await t(page, "hifz-next").click();
      await shot(page, `learn-4-recite-${device}-${theme}`);
      await t(page, "hifz-reveal-all").click();
      await t(page, "hifz-finish").click();
      await t(page, "hifz-continue").click();
      await t(page, "hifz-learn-join").waitFor();
      await shot(page, `learn-5-join-${device}-${theme}`);
      await ctx.close();
    }
    await protoShot("desktop", "light", "#/session", "learn-1-desktop-light", async (p) => { /* eslint-disable no-undef */ await p.evaluate(() => { S.flow = newSession("daily"); S.flow.i = 3; render(); }); /* eslint-enable no-undef */ });
  },
  async check() {
    const { ctx, page } = await revamp("mobile", "light", { seeds: { "quran:hifz:v2": JSON.stringify(SAMPLE) } });
    await page.goto(BASE + "/hifz/session?mode=check");
    await t(page, "hifz-review").waitFor();
    await settle(page, 400);
    await t(page, "word-1").click();
    await shot(page, "check-mobile-light");
    await page.goto(BASE + "/hifz/session?mode=full&target=t-ikhlas");
    await t(page, "hifz-review").waitFor();
    await t(page, "hifz-skip").click();
    await t(page, "hifz-skip").click();
    await t(page, "hifz-join").waitFor();
    await shot(page, "join-mobile-light");
    await ctx.close();
  },
  async surah() {
    for (const [device, theme] of [["desktop", "light"], ["mobile", "light"], ["mobile", "dark"]]) {
      const { ctx, page } = await revamp(device, theme, { seeds: { "quran:hifz:v2": JSON.stringify(SAMPLE) } });
      // the word text is the reader's: open the surah once so the tricky word can be named from the real text
      await page.goto(BASE + "/hifz/session");
      await t(page, "hifz-review").waitFor();
      const w = await t(page, "hifz-words").locator("button span").nth(1).textContent();
      await ctx.close();
      const c2 = await revamp(device, theme, { seeds: { "quran:hifz:v2": JSON.stringify(SAMPLE), "quran:hifz-words:v1": WORDS(w?.trim() ?? "") } });
      await c2.page.goto(BASE + "/hifz/surah/112");
      await t(c2.page, "hifz-surah-page").waitFor();
      await settle(c2.page);
      await shot(c2.page, `surah-${device}-${theme}`, true);
      if (device === "desktop") {
        await c2.page.goto(BASE + "/hifz/surah/67");
        await t(c2.page, "hifz-surah-page").waitFor();
        await settle(c2.page);
        await shot(c2.page, "surah-long-desktop-light");
      }
      await c2.ctx.close();
    }
    await protoShot("desktop", "light", "#/surah/112", "surah-desktop-light");
    await protoShot("mobile", "light", "#/surah/112", "surah-mobile-light");
  },
  async done() {
    const { ctx, page } = await revamp("desktop", "light", { seeds: { "quran:hifz:v2": JSON.stringify({ ...SAMPLE, targets: SAMPLE.targets.filter((x) => x.id === "t-ikhlas"), ayahStates: SAMPLE.ayahStates.filter((a) => a.targetId === "t-ikhlas" && a.ayahNo === 3), transitionStates: [] }) } });
    await page.goto(BASE + "/hifz/session");
    await t(page, "hifz-review").waitFor();
    await t(page, "word-2").click();
    await t(page, "hifz-reveal-all").click();
    await t(page, "hifz-finish").click();
    await t(page, "hifz-continue").click();
    await t(page, "hifz-done").waitFor();
    await settle(page, 300);
    await shot(page, "done-desktop-light");
    await ctx.close();
  },
};

try {
  for (const [name, fn] of Object.entries(scenes)) if (!ONLY || ONLY === name) { console.log("scene", name); await fn(); }
} finally {
  await browser.close();
  server.kill();
}
