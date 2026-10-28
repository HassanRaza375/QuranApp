// Prints the rows of a startup.mjs result as lines: node scripts/measure/summary.mjs <result.json>
import { readFileSync } from "node:fs";
const o = JSON.parse(readFileSync(process.argv[2], "utf8").replace(/^\uFEFF/, ""));
console.log(`${o.label} (${o.runs} runs, median)`);
for (const r of o.rows) {
  console.log(`${r.route.padEnd(12)} ${r.saved ? "saved" : "none "} ${r.slow ? "4x" : "1x"}  fcp ${String(r.fcpMs).padStart(5)}  load ${String(r.loadMs).padStart(5)}  js ${r.jsFiles}/${r.jsKB}KB | hifz: ${r.hifzChunks.join(" , ") || "-"} | external: ${r.external.join(", ") || "-"}`);
}
