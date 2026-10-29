// Phase 15 screenshots: Reading goals and the Calendar next to the prototype (docs/design/prototype-remaining-pages.html, `#/goals` and `#/calender`), and
// the states that matter (first run, the sheets, a passed date, dark, a phone, Gregorian first, an event day, a month that cannot be had).
// Run against a production build:  npm run build && node scripts/screenshots/phase-15-goals-calendar.mjs [goals|calendar]
// The build shows REAL data: the Calendar's Hijri dates are the calendar service's own (the machine needs the internet); the goals are a seeded sample
// (a finish-by-date goal for 7 Feb 2027, a place in Al-Kahf, a week of log). `proto-*` files are the prototype in the same state; pairs compare layout
// and behaviour, not words or numbers. Only the images are written (docs/design/goals-calendar-compare/).
import { createRequire } from "node:module";
import fs from "node:fs";
import { spawn } from "node:child_process";

const ROOT = decodeURIComponent(new URL("../../", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
const require = createRequire(ROOT + "/package.json");
const { chromium } = require("@playwright/test");
const OUT = ROOT + "/docs/design/goals-calendar-compare";
fs.mkdirSync(OUT, { recursive: true });
const PORT = 3012;
const BASE = `http://localhost:${PORT}`;
const server = spawn("node", [".output/server/index.mjs"], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NITRO_PORT: String(PORT) }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 3000));
const ONLY = process.argv[2];
const browser = await chromium.launch();
const SIZE = { desktop: { width: 1280, height: 900 }, mobile: { width: 375, height: 812 } };
const NOW = "2026-10-22T09:14:00+05:00"; // the prototype's own "today" (22 Oct 2026)
const TODAY = "2026-10-22";
const RAMADAN_DAY = "2027-02-19T09:14:00+05:00";

const day = (n) => {
  const d = new Date(Date.UTC(2026, 9, 22 + n, 12));
  return d.toISOString().slice(0, 10);
};
const goal = (o) => ({ type: "ayahs-per-day", label: "10 ayahs/day", startDate: "2026-10-01", targetDate: null, dailyAyahTarget: 10, startAbsoluteAyah: 0, preferredDays: [0, 1, 2, 3, 4, 5, 6], status: "active", createdAt: 1, ...o });
const LOG = { [day(-6)]: Array(18).fill("2:1"), [day(-4)]: Array(25).fill("2:2"), [day(-3)]: Array(30).fill("2:3"), [day(-2)]: Array(22).fill("2:4"), [day(-1)]: Array(28).fill("2:5"), [TODAY]: Array(9).fill("18:1") };
const GOALS = JSON.stringify({
  goals: [
    goal({ id: "a", type: "finish-by-date", label: "Khatmah before Ramadan", targetDate: "2027-02-07", dailyAyahTarget: 55 }),
    goal({ id: "b", label: "Ramadan Khatmah 1447", type: "finish-by-date", targetDate: "2026-03-20", status: "completed", createdAt: 0 }),
    goal({ id: "c", label: "5 pages/day", type: "pages-per-day", dailyAyahTarget: 52, status: "paused", createdAt: 2 }),
  ],
  activeGoalId: "a",
  dailyLog: LOG,
});
const PASSED = JSON.stringify({ goals: [goal({ id: "p", type: "finish-by-date", label: "Finish by 10 Oct", targetDate: "2026-10-10" })], activeGoalId: "p", dailyLog: { [TODAY]: ["2:1", "2:2"] } });
const PLACE = JSON.stringify({ surahNo: 18, ayahNo: 10, surahName: "x", surahNameArabic: "x", totalAyah: 110, updatedAt: 1 });
const REMS = JSON.stringify([
  { id: "r1", title: "Visit family", date: "2026-10-25", note: "", recurringYearly: false, done: false, createdAt: 1 },
  { id: "r2", title: "Fast on Monday", date: "2026-11-02", note: "", recurringYearly: false, done: false, createdAt: 2, repeat: { by: "hijri", month: 5, day: 21 } },
]);

async function revamp(device, theme, { seeds = {}, now = NOW } = {}) {
  const ctx = await browser.newContext({ viewport: SIZE[device], hasTouch: device !== "desktop", serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB" });
  await ctx.clock.setFixedTime(new Date(now));
  const all = { themeMode: theme, ...seeds };
  await ctx.addInitScript((all) => {
    if (!sessionStorage.getItem("__s")) {
      sessionStorage.setItem("__s", "1");
      for (const [k, v] of Object.entries(all)) localStorage.setItem(k, v);
    }
  }, all);
  return { ctx, page: await ctx.newPage() };
}
const settle = async (p, ms = 700) => {
  await p.waitForLoadState("networkidle");
  await p.waitForTimeout(ms);
};
const shot = (page, name, full = false) => page.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 82, fullPage: full });
const t = (page, id) => page.getByTestId(id);

async function protoShot(device, theme, hash, name, act, full = true) {
  const ctx = await browser.newContext({ viewport: SIZE[device] });
  const page = await ctx.newPage();
  await page.goto("file:///" + ROOT + "/docs/design/prototype-remaining-pages.html" + hash);
  await page.evaluate((th) => { document.documentElement.dataset.theme = th; }, theme);
  await page.waitForTimeout(500);
  if (act) await act(page);
  await page.screenshot({ path: `${OUT}/proto-${name}.jpg`, type: "jpeg", quality: 78, fullPage: full });
  await ctx.close();
}

const scenes = {
  async goals() {
    for (const [device, theme] of [["desktop", "light"], ["desktop", "dark"], ["mobile", "light"], ["mobile", "dark"]]) {
      const { ctx, page } = await revamp(device, theme, { seeds: { "quran:reading-goals:v1": GOALS, "quran:reading-progress:v1": PLACE } });
      await page.goto(BASE + "/goals");
      await t(page, "goals-today").waitFor();
      await settle(page);
      await shot(page, `goals-${device}-${theme}`, true);
      await ctx.close();
    }
    await protoShot("desktop", "light", "#/goals", "goals-desktop-light");
    await protoShot("mobile", "light", "#/goals", "goals-mobile-light");
    // first run
    {
      const { ctx, page } = await revamp("desktop", "light");
      await page.goto(BASE + "/goals");
      await t(page, "goals-empty").waitFor();
      await settle(page, 400);
      await shot(page, "goals-empty-desktop-light");
      await ctx.close();
    }
    // a date that has passed
    {
      const { ctx, page } = await revamp("mobile", "light", { seeds: { "quran:reading-goals:v1": PASSED, "quran:reading-progress:v1": PLACE } });
      await page.goto(BASE + "/goals");
      await t(page, "goals-passed").waitFor();
      await settle(page, 400);
      await shot(page, "goals-passed-mobile-light", true);
      await ctx.close();
    }
    // the New goal sheet (desktop side panel, phone bottom sheet) and the log sheet
    for (const [device, theme] of [["desktop", "light"], ["mobile", "light"], ["mobile", "dark"]]) {
      const { ctx, page } = await revamp(device, theme, { seeds: { "quran:reading-goals:v1": GOALS, "quran:reading-progress:v1": PLACE } });
      await page.goto(BASE + "/goals");
      await t(page, "goals-new").click();
      await t(page, "goals-new-sheet").waitFor();
      await t(page, "goals-chip-ramadan").waitFor({ timeout: 8000 }).catch(() => {});
      await settle(page, 500);
      await shot(page, `goals-new-${device}-${theme}`);
      await ctx.close();
    }
    {
      const { ctx, page } = await revamp("mobile", "light", { seeds: { "quran:reading-goals:v1": GOALS, "quran:reading-progress:v1": PLACE } });
      await page.goto(BASE + "/goals");
      await t(page, "goals-log").click();
      await t(page, "goals-log-sheet").waitFor();
      await settle(page, 500);
      await shot(page, "goals-log-mobile-light");
      await ctx.close();
    }
    await protoShot("desktop", "light", "#/goals", "goals-new-desktop-light", (p) => p.click('[data-a="goal-new"]'), false);
    await protoShot("mobile", "light", "#/goals", "goals-new-mobile-light", (p) => p.click('[data-a="goal-new"]'), false);
  },
  async calendar() {
    for (const [device, theme] of [["desktop", "light"], ["desktop", "dark"], ["mobile", "light"], ["mobile", "dark"]]) {
      const { ctx, page } = await revamp(device, theme, { seeds: { "quran:reminders:v1": REMS } });
      await page.goto(BASE + "/calender");
      await t(page, "cal-title").waitFor({ timeout: 20000 });
      await settle(page, 1200);
      await shot(page, `calendar-${device}-${theme}`, true);
      await ctx.close();
    }
    await protoShot("desktop", "light", "#/calender", "calendar-desktop-light");
    await protoShot("mobile", "light", "#/calender", "calendar-mobile-light");
    // Gregorian first
    {
      const { ctx, page } = await revamp("desktop", "light", { seeds: { "quran:calendar-prefs:v1": JSON.stringify({ first: "gregorian" }), "quran:reminders:v1": REMS } });
      await page.goto(BASE + "/calender");
      await t(page, "cal-title").waitFor({ timeout: 20000 });
      await settle(page, 1000);
      await shot(page, "calendar-gregorian-desktop-light");
      await ctx.close();
    }
    // Ramadan, an event day (both fiqhs shown: no fiqh chosen)
    for (const [device, theme] of [["desktop", "light"], ["mobile", "dark"]]) {
      const { ctx, page } = await revamp(device, theme, { now: RAMADAN_DAY, seeds: { "quran:reminders:v1": REMS } });
      await page.goto(BASE + "/calender");
      await t(page, "cal-title").waitFor({ timeout: 20000 });
      await page.locator('[data-testid="cal-day"][data-hday="21"]').click();
      await settle(page, 1000);
      await shot(page, `calendar-ramadan-${device}-${theme}`, true);
      await ctx.close();
    }
    // the Add reminder sheet, with Repeat every year on
    for (const device of ["desktop", "mobile"]) {
      const { ctx, page } = await revamp(device, "light", { seeds: { "quran:reminders:v1": REMS } });
      await page.goto(BASE + "/calender");
      await t(page, "cal-title").waitFor({ timeout: 20000 });
      await page.locator('[data-testid="cal-day"][data-date="2026-10-25"]').click();
      await t(page, "cal-add").click();
      await t(page, "cal-reminder-sheet").waitFor();
      await t(page, "cal-rem-title").fill("Visit family");
      await t(page, "cal-rem-repeat").click();
      await settle(page, 500);
      await shot(page, `calendar-reminder-${device}-light`);
      await ctx.close();
    }
    // a month that cannot be had (no connection, nothing saved)
    {
      const { ctx, page } = await revamp("mobile", "light");
      await ctx.route(/api\.aladhan\.com/, (r) => r.abort("internetdisconnected"));
      await page.goto(BASE + "/calender");
      await t(page, "cal-unavailable").waitFor({ timeout: 20000 });
      await shot(page, "calendar-unavailable-mobile-light");
      await ctx.close();
    }
    await protoShot("desktop", "light", "#/calender", "calendar-reminder-desktop-light", (p) => p.click('[data-a="rem-add"]'), false);
  },
};

try {
  for (const [name, fn] of Object.entries(scenes)) if (!ONLY || ONLY === name) await fn();
} finally {
  await browser.close();
  server.kill();
}
console.log("done");
