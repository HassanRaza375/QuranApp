// Phase 10 screenshots: the prototype's Search (docs/design/prototype-remaining-pages.html, #/search) next to the revamp (pairs), and revamp-only states.
// The revamp's answers come from the REAL recorded responses in tests/fixtures (no network); the prototype shows its own sample content, so the
// pairs compare layout and behaviour, not text. Nothing but the images is stored.
import { createRequire } from "node:module";
import fs from "node:fs";
import { spawn } from "node:child_process";

const ROOT = decodeURIComponent(new URL("../../", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
const require = createRequire(ROOT + "/package.json");
const { chromium } = require("@playwright/test");
const OUT = ROOT + "/docs/design/search-compare";
fs.mkdirSync(OUT, { recursive: true });
const PORT = 3012;
const BASE = `http://localhost:${PORT}`;
const fx = (n) => fs.readFileSync(`${ROOT}/tests/fixtures/${n}`, "utf8");
const RABBI = String.fromCodePoint(0x631, 0x628, 0x64a);
const RAHMAT = String.fromCodePoint(0x631, 0x62d, 0x645, 0x62a);
const server = spawn("node", [".output/server/index.mjs"], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NITRO_PORT: String(PORT) }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 3000));
const ONLY = process.argv[2]; // regenerate one state only
const browser = await chromium.launch();

const SIZE = { desktop: { width: 1280, height: 900 }, mobile: { width: 375, height: 812 }, m390: { width: 390, height: 844 } };
const HISTORY = JSON.stringify(["patience", "yusuf", RABBI]);

async function revamp(device, theme, { seeds = {}, mode = "ok" } = {}) {
  const ctx = await browser.newContext({ viewport: SIZE[device], hasTouch: device !== "desktop", serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB" });
  await ctx.addInitScript(({ theme, seeds }) => {
    if (!sessionStorage.getItem("__s")) {
      sessionStorage.setItem("__s", "1");
      localStorage.setItem("themeMode", theme);
      for (const [k, v] of Object.entries(seeds)) localStorage.setItem(k, v);
    }
  }, { theme, seeds });
  await ctx.route(/https:\/\/api\.alquran\.cloud\/v1\/search\//, (route) => {
    if (mode === "network") return route.abort("internetdisconnected");
    if (mode === "http500") return route.fulfill({ status: 500, body: "{}" });
    const parts = new URL(route.request().url()).pathname.split("/");
    const text = decodeURIComponent(parts[3] ?? "");
    const file = text === "mercy" ? "alquran-search-mercy-all-pickthall.json" : text === "ease" ? "alquran-search-ease-all-pickthall.json" : text === RABBI ? "alquran-search-rabbi-all-simple.json" : text === RAHMAT ? "alquran-search-rahmat-all-jalandhry.json" : null;
    const h = { "access-control-allow-origin": "*" };
    return file ? route.fulfill({ status: 200, contentType: "application/json", headers: h, body: fx(file) }) : route.fulfill({ status: 404, contentType: "application/json", headers: h, body: fx("alquran-search-none.json") });
  });
  return { ctx, page: await ctx.newPage() };
}
const settle = async (p) => { await p.waitForLoadState("networkidle"); await p.waitForTimeout(900); };

async function protoShot(device, theme, hash, { offline = false } = {}) {
  const ctx = await browser.newContext({ viewport: SIZE[device] });
  const page = await ctx.newPage();
  await page.goto("file:///" + ROOT + "/docs/design/prototype-remaining-pages.html" + hash);
  await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, theme);
  if (offline) await page.click('[data-a="offline"]');
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

// ---- pairs: the same moment in the prototype and the revamp
const PAIRS = [
  ["start", "#/search", "/search", "empty box, recent searches", { seeds: { "quran:search-history:v1": HISTORY } }, {}],
  ["results", "#/search?q=patience", "/search?q=mercy", "results grouped by type", {}, { waitFor: '[data-testid="ayah-row"]' }],
  ["jump", "#/search?q=2%3A255", "/search?q=2:255", "typing an ayah number", {}, { waitFor: '[data-testid="jump-card"]' }],
  ["offline", "#/search?q=mercy", "/search?q=yusuf", "ayah search offline", { mode: "network" }, { waitFor: '[data-testid="ayah-offline"]', protoOffline: true }],
];
for (const [name, protoHash, path, label, opts, extra] of ONLY ? [] : PAIRS) for (const device of ["desktop", "mobile"]) for (const theme of ["light", "dark"]) {
  const { ctx, page } = await revamp(device, theme, opts);
  await page.goto(BASE + path);
  if (extra.waitFor) await page.waitForSelector(extra.waitFor);
  await settle(page);
  const right = await page.screenshot({ type: "jpeg", quality: 80 });
  await ctx.close();
  await compose(await protoShot(device, theme, protoHash, { offline: !!extra.protoOffline }), right, `${OUT}/${name}-${device}-${theme}.jpg`, label);
  console.log("pair", name, device, theme);
}

// ---- states only the revamp has
async function state(name, device, theme, path, fn, opts = {}) {
  if (ONLY && name !== ONLY) return;
  const { ctx, page } = await revamp(device, theme, opts);
  await page.goto(BASE + path);
  await settle(page);
  if (fn) await fn(page);
  await settle(page);
  await page.screenshot({ path: `${OUT}/state-${name}-${device}-${theme}.jpg`, type: "jpeg", quality: 80 });
  await ctx.close();
  console.log("state", name, device, theme);
}
for (const [device, theme] of [["desktop", "light"], ["mobile", "dark"]]) {
  await state("filters-open", device, theme, "/search?q=mercy", async (p) => { await p.waitForSelector('[data-testid="ayah-row"]'); await p.click('[data-testid="filters-open"]'); await p.waitForSelector('[data-testid="filters-sheet"]'); });
  await state("filters-on", device, theme, "/search?q=mercy&j=30", async (p) => { await p.waitForSelector('[data-testid="ayah-row"]'); });
  await state("arabic", device, theme, `/search?q=${encodeURIComponent(RABBI)}&g=arabic&e=quran-simple`, async (p) => { await p.waitForSelector('[data-testid="ayah-row"]'); });
  await state("no-results", device, theme, "/search?q=zzzzqqq", async (p) => { await p.waitForSelector('[data-testid="search-empty"]'); });
  await state("failed", device, theme, "/search?q=mercy", async (p) => { await p.waitForSelector('[data-testid="ayah-failed"]'); }, { mode: "http500" });
  await state("scope-people", device, theme, "/search?q=yusuf&t=people", async (p) => { await p.waitForSelector('[data-testid="group-people"]'); });
  await state("short", device, theme, "/search?q=y&t=ayahs", async (p) => { await p.waitForSelector('[data-testid="ayah-short"]'); });
  await state("urdu", device, theme, `/search?q=${encodeURIComponent(RAHMAT)}&g=urdu&e=ur.jalandhry`, async (p) => { await p.waitForSelector('[data-testid="ayah-row"]'); });
}
// the 390 px phone (an iPhone 14), the sizes the owner asked to see again: start, results, Arabic and Urdu (an English reference line over right-to-left text),
// the offline state, and the Filters sheet, in light and dark
for (const theme of ["light", "dark"]) {
  const d = "m390";
  await state("start", d, theme, "/search", async (p) => { await p.waitForSelector('[data-testid="history"]'); }, { seeds: { "quran:search-history:v1": HISTORY } });
  await state("results", d, theme, "/search?q=mercy", async (p) => { await p.waitForSelector('[data-testid="ayah-row"]'); });
  await state("arabic", d, theme, `/search?q=${encodeURIComponent(RABBI)}&g=arabic&e=quran-simple`, async (p) => { await p.waitForSelector('[data-testid="ayah-row"]'); });
  await state("urdu", d, theme, `/search?q=${encodeURIComponent(RAHMAT)}&g=urdu&e=ur.jalandhry`, async (p) => { await p.waitForSelector('[data-testid="ayah-row"]'); });
  await state("offline", d, theme, "/search?q=yusuf", async (p) => { await p.waitForSelector('[data-testid="ayah-offline"]'); }, { mode: "network" });
  await state("filters-open", d, theme, "/search?q=mercy", async (p) => { await p.waitForSelector('[data-testid="ayah-row"]'); await p.click('[data-testid="filters-open"]'); await p.waitForSelector('[data-testid="filters-sheet"]'); });
  await state("people", d, theme, "/search?q=ibrahim&t=people", async (p) => { await p.waitForSelector('[data-testid="group-people"]'); });
}

await browser.close();
server.kill();
console.log("done");
