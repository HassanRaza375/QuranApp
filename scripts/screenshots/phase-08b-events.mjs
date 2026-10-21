// Phase 8B screenshots: prototype Ramadan Events tab next to the revamp (4 pairs) and revamp-only state shots.
// The revamp uses RECORDED REAL AlAdhan responses (tests/fixtures): Ramadan 1448 is 8 Feb to 8 Mar 2027; prayer months for Lahore, Sunni and Ja'fari.
import { createRequire } from "node:module";
import fs from "node:fs";
import { spawn } from "node:child_process";

const ROOT = decodeURIComponent(new URL("../../", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
const require = createRequire(ROOT + "/package.json");
const { chromium } = require("@playwright/test");
const OUT = ROOT + "/docs/design/events-compare";
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

async function revamp(device, theme, { now = BEFORE, seeds = {}, hijri = "ok", month = "ok", verse = true, gap = null } = {}) {
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
  await ctx.route(/api\.aladhan\.com\/v1\/gToHCalendar\//, (r) => {
    if (hijri === "network" || (gap && r.request().url().endsWith(gap))) return r.abort("internetdisconnected");
    const m = /\/gToHCalendar\/(\d{1,2})\/(\d{4})$/.exec(r.request().url());
    const file = m ? `aladhan-gtoh-${m[2]}-${m[1].padStart(2, "0")}.json` : "";
    if (!file || !fs.existsSync(`${ROOT}/tests/fixtures/${file}`)) return r.fulfill({ status: 404, body: "{}" });
    return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: fx(file) });
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
  await page.evaluate(() => { const el = document.createElement("span"); el.dataset.ract = "rtab"; el.dataset.v = "events"; document.body.appendChild(el); el.click(); el.remove(); });
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


for (const device of ["desktop", "mobile"]) for (const theme of ["light", "dark"]) {
  const { ctx, page } = await revamp(device, theme, { now: BEFORE });
  await page.goto(BASE + "/ramadan?tab=events");
  await settle(page);
  const right = await page.screenshot({ type: "jpeg", quality: 80 });
  await ctx.close();
  await compose(await protoShot(device, theme, "before", "events"), right, `${OUT}/${device}-${theme}-events.jpg`);
  console.log("pair", device, theme);
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
const RM = { "quran:reminders:v1": JSON.stringify([{ id: "r1", title: "Eid al-Fitr", date: "2027-03-09", note: "", recurringYearly: false, done: false, createdAt: 1 }, { id: "r2", title: "A past reminder", date: "2026-09-01", note: "", recurringYearly: false, done: false, createdAt: 2 }]) };
const showMenu = async (p, label) => { await p.getByRole("button", { name: /^Show: / }).click(); await p.getByRole("menuitemradio", { name: label, exact: true }).or(p.getByRole("option", { name: label, exact: true })).click(); await p.waitForTimeout(300); };
for (const [device, theme] of [["desktop", "light"], ["mobile", "dark"]]) {
  await state("both-default", device, theme, "/ramadan?tab=events", null, { now: BEFORE });
  await state("sunni-few-events", device, theme, "/ramadan?tab=events", null, { now: BEFORE, seeds: { prayerFiqh: "sunni" } });
  await state("jafari", device, theme, "/ramadan?tab=events", null, { now: BEFORE, seeds: { prayerFiqh: "jafari" } });
  await state("filter-menu", device, theme, "/ramadan?tab=events", async (p) => { await p.getByRole("button", { name: /^Show: / }).click(); }, { now: BEFORE });
  await state("same-day-two-rows", device, theme, "/ramadan?tab=events", async (p) => { await p.locator('[data-testid="event-row"][data-date="2027-01-05"]').first().scrollIntoViewIfNeeded(); }, { now: BEFORE });
  await state("note-shown", device, theme, "/ramadan?tab=events", async (p) => { await p.locator('[data-testid="event-row"]').filter({ hasText: "Laylat al-Bara" }).first().scrollIntoViewIfNeeded(); }, { now: BEFORE });
  await state("adjusted-plus-one", device, theme, "/ramadan?tab=events", null, { now: BEFORE, seeds: { "quran:hijri-adjust:v1": JSON.stringify({ days: 1 }) } });
  await state("reminder-set", device, theme, "/ramadan?tab=events", async (p) => { await p.locator('[data-testid="event-row"]').filter({ hasText: "Eid al-Fitr" }).getByTestId("event-bell").click(); await p.getByTestId("reminders").scrollIntoViewIfNeeded(); }, { now: BEFORE });
  await state("reminders-list", device, theme, "/ramadan?tab=events", async (p) => { await p.getByTestId("reminders").scrollIntoViewIfNeeded(); }, { now: BEFORE, seeds: RM });
  await state("partial-months-offline", device, theme, "/ramadan?tab=events", null, { now: BEFORE, gap: "/3/2027" });
  await state("no-months-saved", device, theme, "/ramadan?tab=events", null, { now: BEFORE, hijri: "network" });
  await state("show-later", device, theme, "/ramadan?tab=events", async (p) => { await p.getByTestId("events-later").click(); await p.waitForTimeout(1500); }, { now: BEFORE });
  await state("today-next-event", device, theme, "/ramadan", null, { now: BEFORE });
  await state("empty-filter", device, theme, "/ramadan?tab=events&show=sunni", async (p) => { await p.getByTestId("events-panel").scrollIntoViewIfNeeded(); }, { now: "2027-03-10T09:14:00+05:00" });
}
await browser.close();
server.kill();
console.log("done");
