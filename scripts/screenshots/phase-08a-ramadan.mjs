// Phase 8A screenshots: prototype Ramadan (before, Day 12, last ten nights; Today and Timetable) next to the revamp, and revamp-only state shots.
// The revamp uses RECORDED REAL AlAdhan responses (tests/fixtures): Ramadan 1448 is 8 Feb to 8 Mar 2027; prayer months for Lahore, Sunni and Ja'fari.
import { createRequire } from "node:module";
import fs from "node:fs";
import { spawn } from "node:child_process";

const ROOT = decodeURIComponent(new URL("../../", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
const require = createRequire(ROOT + "/package.json");
const { chromium } = require("@playwright/test");
const OUT = ROOT + "/docs/design/ramadan-compare";
fs.mkdirSync(OUT, { recursive: true });
const PORT = 3012;
const BASE = `http://localhost:${PORT}`;
const server = spawn("node", [".output/server/index.mjs"], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NITRO_PORT: String(PORT) }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 3000));
const browser = await chromium.launch();

const fx = (n) => fs.readFileSync(`${ROOT}/tests/fixtures/${n}`, "utf8");
const MONTHS = {
  "2026/10": ["aladhan-lahore-2026-10-sunni.json", "aladhan-lahore-2026-10-jafari.json"],
  "2027/1": ["aladhan-lahore-2027-01-sunni.json", "aladhan-lahore-2027-01-jafari.json"],
  "2027/2": ["aladhan-lahore-2027-02-sunni.json", "aladhan-lahore-2027-02-jafari.json"],
  "2027/3": ["aladhan-lahore-2027-03-sunni.json", "aladhan-lahore-2027-03-jafari.json"],
};
const LAHORE = JSON.stringify({ lat: 31.5204, lng: 74.3587 });
const BEFORE = "2026-10-15T09:14:00+05:00";
const DAY12 = "2027-02-19T09:14:00+05:00";
const DAY21 = "2027-02-28T09:14:00+05:00";

async function revamp(device, theme, { now = BEFORE, seeds = {}, hijri = "ok", month = "ok", verse = true } = {}) {
  const ctx = await browser.newContext({ viewport: device === "desktop" ? { width: 1280, height: 800 } : { width: 375, height: 812 }, hasTouch: device === "mobile", serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB" });
  await ctx.clock.setFixedTime(new Date(now));
  await ctx.addInitScript(({ theme, seeds }) => {
    if (!sessionStorage.getItem("__s")) {
      sessionStorage.setItem("__s", "1");
      localStorage.setItem("themeMode", theme);
      for (const [k, v] of Object.entries(seeds)) localStorage.setItem(k, v);
    }
  }, { theme, seeds: { last_location: LAHORE, ...seeds } });
  await ctx.route(/api\.aladhan\.com\/v1\/calendar\//, (r) => {
    if (month === "network") return r.abort("internetdisconnected");
    const u = new URL(r.request().url());
    const m = /\/calendar\/(\d{4}\/\d{1,2})$/.exec(u.pathname);
    const files = m && MONTHS[m[1]];
    if (!files) return r.fulfill({ status: 404, body: "{}" });
    return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: fx(u.searchParams.get("method") === "0" ? files[1] : files[0]) });
  });
  await ctx.route(/api\.aladhan\.com\/v1\/hToGCalendar\//, (r) => {
    if (hijri === "network") return r.abort("internetdisconnected");
    if (!/\/9\/1448$/.test(r.request().url())) return r.fulfill({ status: 404, body: "{}" });
    return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: fx("aladhan-htog-1448-09.json") });
  });
  await ctx.route(/quranapi\.pages\.dev\/api\/\d+\/\d+\.json/, (r) => {
    if (!verse) return r.abort("internetdisconnected");
    const m = /api\/(\d+)\/(\d+)\.json/.exec(r.request().url());
    return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ arabic1: `TEST ARABIC ${m[1]}:${m[2]} (synthetic text)`, english: `Test English ${m[1]}:${m[2]}`, urdu: "t", bengali: "t", arabic2: "t", surahNo: Number(m[1]) }) });
  });
  return { ctx, page: await ctx.newPage() };
}
const settle = async (p) => { await p.waitForLoadState("networkidle"); await p.waitForTimeout(1200); };

async function protoShot(device, theme, state, tab) {
  const ctx = await browser.newContext({ viewport: device === "desktop" ? { width: 1500, height: 900 } : { width: 700, height: 950 } });
  const page = await ctx.newPage();
  await page.goto("file:///" + ROOT + "/docs/design/prototype.html");
  await page.click('#deviceCtrl [data-device="' + device + '"]');
  await page.click('#themeCtrl [data-theme-choice="' + theme + '"]');
  await page.click('.ctrl-btn[data-page="ramadan"]');
  await page.click(`#ramCtrl [data-ram="${state}"]`);
  if (tab === "timetable") await page.evaluate(() => { const el = document.createElement("span"); el.dataset.ract = "rtab"; el.dataset.v = "timetable"; document.body.appendChild(el); el.click(); el.remove(); });
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

const STATE = { before: { now: BEFORE }, during: { now: DAY12 }, last10: { now: DAY21 } };
for (const device of ["desktop", "mobile"]) for (const theme of ["light", "dark"]) for (const state of ["before", "during", "last10"]) {
  const { ctx, page } = await revamp(device, theme, STATE[state]);
  await page.goto(BASE + "/ramadan");
  await settle(page);
  const right = await page.screenshot({ type: "jpeg", quality: 80 });
  await ctx.close();
  await compose(await protoShot(device, theme, state, "today"), right, `${OUT}/${device}-${theme}-${state}.jpg`);
  console.log("pair", device, theme, state);
}
for (const [device, theme] of [["desktop", "light"], ["mobile", "dark"]]) {
  const { ctx, page } = await revamp(device, theme, STATE.during);
  await page.goto(BASE + "/ramadan?tab=timetable");
  await settle(page);
  const right = await page.screenshot({ type: "jpeg", quality: 80 });
  await ctx.close();
  await compose(await protoShot(device, theme, "during", "timetable"), right, `${OUT}/${device}-${theme}-timetable.jpg`);
  console.log("pair", device, theme, "timetable");
}

async function state(name, device, theme, path, fn, opts) {
  const { ctx, page } = await revamp(device, theme, opts);
  await page.goto(BASE + path);
  await settle(page);
  if (fn) await fn(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/state-${name}-${device}-${theme}.jpg`, type: "jpeg", quality: 82 });
  await ctx.close();
  console.log("state", name, device);
}
const GOAL = { "quran:reading-goals:v1": JSON.stringify({ goals: [{ id: "g1", label: "Ramadan Khatmah", status: "active", dailyAyahTarget: 216, targetDate: "2027-03-08" }], activeGoalId: "g1", dailyLog: { "2027-02-19": ["1:1", "1:2", "1:3"] } }), "quran:reading-progress:v1": JSON.stringify({ surahNo: 18, ayahNo: 10 }) };
const LOG = { "quran:ramadan:v1": JSON.stringify({ startOverride: null, fastingLog: { "2027-02-13": "fasted", "2027-02-14": "fasted", "2027-02-15": "missed", "2027-02-16": "fasted", "2027-02-17": "fasted", "2027-02-18": "fasted", "2027-02-20": "planned" } }) };
for (const [device, theme] of [["desktop", "light"], ["mobile", "dark"]]) {
  await state("jafari-day12", device, theme, "/ramadan", null, { now: DAY12, seeds: { prayerFiqh: "jafari" } });
  await state("tracker-marked", device, theme, "/ramadan", async (p) => { await p.getByTestId("fasting").scrollIntoViewIfNeeded(); }, { now: DAY12, seeds: LOG });
  await state("khatmah-goal", device, theme, "/ramadan", async (p) => { await p.getByTestId("khatmah").scrollIntoViewIfNeeded(); }, { now: DAY12, seeds: GOAL });
  await state("qadr-night", device, theme, "/ramadan", async (p) => { await p.getByTestId("qadr").scrollIntoViewIfNeeded(); }, { now: DAY21 });
  await state("dua-and-references", device, theme, "/ramadan", async (p) => { await p.getByTestId("dua").scrollIntoViewIfNeeded(); }, { now: DAY12 });
  await state("dua-offline", device, theme, "/ramadan", async (p) => { await p.getByTestId("dua").scrollIntoViewIfNeeded(); }, { now: DAY12, verse: false });
  await state("start-date-set", device, theme, "/ramadan", async (p) => { await p.getByTestId("start-toggle").click(); await p.getByTestId("override-input").fill("2027-02-09"); await p.getByTestId("override-set").click(); await p.getByTestId("start-toggle").scrollIntoViewIfNeeded(); }, { now: BEFORE });
  await state("hijri-adjusted", device, theme, "/ramadan", null, { now: BEFORE, seeds: { "quran:hijri-adjust:v1": JSON.stringify({ days: 1 }) } });
  await state("dates-need-connection", device, theme, "/ramadan", null, { now: BEFORE, hijri: "network" });
  await state("timetable-before", device, theme, "/ramadan?tab=timetable", null, { now: BEFORE });
  await state("timetable-not-saved", device, theme, "/ramadan?tab=timetable", null, { now: BEFORE, month: "network" });
  await state("timetable-jafari", device, theme, "/ramadan?tab=timetable", null, { now: DAY12, seeds: { prayerFiqh: "jafari" } });
  await state("no-location", device, theme, "/ramadan?tab=timetable", null, { now: DAY12, seeds: { last_location: "" } });
  await state("home-banner", device, theme, "/", null, { now: DAY12 });
}
await browser.close();
server.kill();
console.log("done");
