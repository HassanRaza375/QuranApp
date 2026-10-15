// Dev-server smoke test (part of `npm run verify`).
// `npm run build` and `npm run preview` can work while `npm run dev` is broken (it uses a different Vite code path;
// see docs/phases/phase-00-foundation.md, "Dev server"). This starts the real dev server and checks that:
//   1. it answers `/` with 200 and the SPA shell,
//   2. the page renders in a real browser with no page error or console error,
//   3. the server printed no error while doing so.
// Exit code 0 = pass, 1 = fail. Always stops the dev server, including its child processes.
import { spawn, spawnSync } from "node:child_process";
import { chromium } from "@playwright/test";

const PORT = Number(process.env.DEV_SMOKE_PORT ?? 3012);
const BASE = `http://localhost:${PORT}`;
const STARTUP_MS = 120_000;
const ERROR_LINE = /(^|\s)(ERROR|FATAL)\b|\[error\]|Unhandled|UnhandledRejection|Cannot find module|failed to resolve/i;

const lines = [];
const server = spawn("npx", ["nuxt", "dev", "--port", String(PORT)], {
  shell: true,
  env: { ...process.env, NO_COLOR: "1", NUXT_TELEMETRY_DISABLED: "1" },
  stdio: ["ignore", "pipe", "pipe"],
});
for (const stream of [server.stdout, server.stderr]) {
  stream.on("data", (chunk) => {
    for (const l of String(chunk).replace(/\0/g, "").split(/\r?\n/)) if (l.trim()) lines.push(l);
  });
}
let exited = false;
server.on("exit", () => (exited = true));

function stopServer() {
  if (exited || !server.pid) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  else {
    try {
      process.kill(-server.pid);
    } catch {
      server.kill("SIGKILL");
    }
  }
}

const failures = [];
const fail = (msg) => failures.push(msg);
const serverErrors = () => lines.filter((l) => ERROR_LINE.test(l));

async function waitForShell() {
  const start = Date.now();
  while (Date.now() - start < STARTUP_MS) {
    if (exited) throw new Error("the dev server exited before answering");
    if (serverErrors().length) throw new Error("the dev server printed an error while starting");
    try {
      const res = await fetch(`${BASE}/`);
      if (res.status === 200) return res;
    } catch {
      /* not listening yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no 200 from ${BASE}/ within ${STARTUP_MS / 1000}s`);
}

try {
  const res = await waitForShell();
  const html = await res.text();
  if (!html.includes('<div id="__nuxt">')) fail('GET / is 200 but is not the app shell (no <div id="__nuxt">)');
  if (!/\/_nuxt\/[^"']+/.test(html)) fail("GET / does not reference the Nuxt client entry");

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    page.on("pageerror", (e) => fail(`page error: ${e.message}`));
    page.on("console", (m) => m.type() === "error" && fail(`console error: ${m.text()}`));
    page.on("response", (r) => r.status() >= 500 && fail(`HTTP ${r.status()} for ${r.url()}`));
    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 90_000 });
    await page.getByRole("heading", { name: "Quran App", level: 1 }).waitFor({ timeout: 30_000 });
    // a second route, so a broken route transform shows up too
    await page.goto(`${BASE}/foundation`, { waitUntil: "networkidle", timeout: 90_000 });
    await page.getByRole("heading", { name: "Foundation check" }).waitFor({ timeout: 30_000 });
  } finally {
    await browser.close();
  }
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
}

await new Promise((r) => setTimeout(r, 500)); // let late server lines arrive
for (const l of serverErrors()) fail(`server output: ${l.trim()}`);
stopServer();

if (failures.length) {
  console.error(`\ndev-smoke FAILED (${failures.length}):`);
  for (const f of [...new Set(failures)]) console.error(`  - ${f}`);
  console.error("\nlast server output:");
  for (const l of lines.slice(-25)) console.error(`  | ${l}`);
  process.exit(1);
}
console.log(`dev-smoke passed: ${BASE}/ answered 200 with the app shell, rendered in a browser, and the server printed no errors.`);
process.exit(0);
