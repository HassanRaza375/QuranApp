// Phase 15 screenshots of the pages that have no prototype: About, Sitemap and Surah videos, light and dark, at 1280 and 375 px (full page).
// Run against a production build:  npm run build && node scripts/screenshots/phase-15-small-pages.mjs [about|sitemap|videos]
// Nothing is requested from any service by these pages; only the images are written (docs/design/phase15-small/).
import { createRequire } from "node:module";
import fs from "node:fs";
import { spawn } from "node:child_process";

const ROOT = decodeURIComponent(new URL("../../", import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1").replace(/\/$/, "");
const require = createRequire(ROOT + "/package.json");
const { chromium } = require("@playwright/test");
const OUT = ROOT + "/docs/design/phase15-small";
fs.mkdirSync(OUT, { recursive: true });
const PORT = 3012;
const BASE = `http://localhost:${PORT}`;
const server = spawn("node", [".output/server/index.mjs"], { cwd: ROOT, env: { ...process.env, PORT: String(PORT), NITRO_PORT: String(PORT) }, stdio: "ignore" });
await new Promise((r) => setTimeout(r, 3000));
const ONLY = process.argv[2];
const browser = await chromium.launch();
const SIZE = { desktop: { width: 1280, height: 900 }, mobile: { width: 375, height: 812 } };
const PAGES = { about: "/about", sitemap: "/sitemap", videos: "/surah-vedios" };

try {
  for (const [name, path] of Object.entries(PAGES)) {
    if (ONLY && ONLY !== name) continue;
    for (const device of ["desktop", "mobile"]) {
      for (const theme of ["light", "dark"]) {
        const ctx = await browser.newContext({ viewport: SIZE[device], hasTouch: device === "mobile", serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB" });
        await ctx.addInitScript((t) => localStorage.setItem("themeMode", t), theme);
        const page = await ctx.newPage();
        await page.goto(BASE + path);
        await page.getByRole("heading", { level: 1 }).waitFor();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${OUT}/${name}-${device}-${theme}.jpg`, type: "jpeg", quality: 82, fullPage: true });
        await ctx.close();
      }
    }
  }
} finally {
  await browser.close();
  server.kill();
}
console.log("done");
