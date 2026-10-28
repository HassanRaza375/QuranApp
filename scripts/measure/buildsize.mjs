// Dev-only: size of the build. node scripts/measure/buildsize.mjs  (reads .output/public)
// "home set" = every script the prerendered Home page (index.html) names: the entry and its preloads.
import { readdirSync, readFileSync, statSync } from "node:fs";
const dir = ".output/public/_nuxt";
const kb = (n) => Math.round(n / 1024);
const all = readdirSync(dir).filter((f) => f.endsWith(".js"));
const app = all.filter((f) => !f.startsWith("wajibat-data-"));
const html = readFileSync(".output/public/index.html", "utf8");
const home = [...new Set([...html.matchAll(/_nuxt\/([^"]+\.js)/g)].map((m) => m[1]))];
const sum = (fs) => fs.reduce((s, f) => s + statSync(`${dir}/${f}`).size, 0);
console.log(JSON.stringify({ jsFiles: all.length, appJsFiles: app.length, appJsKB: kb(sum(app)), homeSetFiles: home.length, homeSetKB: kb(sum(home)) }));
