// Smoke test of a real deployment (Phase 16; dev-only, not part of verify). Usage:
//   node scripts/smoke-prod.mjs <baseUrl> [--production] [--out <file>]
// Without --production the address is treated as a PREVIEW: it must send `X-Robots-Tag: noindex`. With --production it must not, and robots.txt must allow crawling.
// Writes a dated report (default docs/phases/smoke-<date>-<host>.md) and exits 1 if anything failed.
import fs from "node:fs";
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:\/\//.test(a)) ?? "").replace(/\/+$/, "");
if (!base) {
  console.error("usage: node scripts/smoke-prod.mjs <baseUrl> [--production] [--out <file>]");
  process.exit(2);
}
const production = args.includes("--production");
const host = new URL(base).host;
const date = new Date().toISOString().slice(0, 10);
const out = args.includes("--out") ? args[args.indexOf("--out") + 1] : `docs/phases/smoke-${date}-${host.replace(/[^a-z0-9.-]/gi, "_")}.md`;

const rows = [];
const check = async (name, fn) => {
  try {
    const detail = await fn();
    rows.push({ name, ok: true, detail: detail ?? "" });
  } catch (e) {
    rows.push({ name, ok: false, detail: String(e?.message ?? e).split("\n")[0] });
  }
};
const must = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
// A preview behind Vercel login needs the project's automation bypass secret (env VERCEL_AUTOMATION_BYPASS_SECRET). It is sent as a header and never printed or written.
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET ? { "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET } : {};
const get = (path, init) => fetch(base + path, { redirect: "manual", ...init, headers: { ...bypass, ...(init?.headers ?? {}) } });
const head = async (path) => {
  const r = await get(path);
  return { r, text: await r.text() };
};

// ---- plain HTTP ----
await check("/sw.js: 200, JavaScript, not immutable", async () => {
  const r = await get("/sw.js");
  const cc = r.headers.get("cache-control") ?? "";
  must(r.status === 200, `status ${r.status}`);
  must(/javascript/.test(r.headers.get("content-type") ?? ""), `content-type ${r.headers.get("content-type")}`);
  must(!/immutable/.test(cc) && !/max-age=[1-9]\d{4,}/.test(cc), `cache-control ${cc}`);
  return cc;
});
await check("manifest.webmanifest: name, scope, start_url, icons", async () => {
  const r = await get("/manifest.webmanifest");
  must(r.status === 200, `status ${r.status}`);
  const m = await r.json();
  must(m.name === "Quran App" && m.scope === "/" && m.start_url === "/" && !m.id, "manifest identity changed");
  must((m.icons ?? []).length >= 3, "icons missing");
});
for (const [path, re] of [
  ["/", /<title>Quran App/],
  ["/about", /<title>About/],
  ["/surah-listing", /<title>[^<]*Surah/i],
]) {
  await check(`${path}: own <title>, description, canonical`, async () => {
    const { r, text } = await head(path);
    must(r.status === 200, `status ${r.status}`);
    must(re.test(text), `title not as expected: ${(text.match(/<title>[^<]*/) ?? ["none"])[0]}`);
    must(/<meta name="description" content="[^"]+"/.test(text) || path === "/", "no description");
    const canon = (text.match(/<link rel="canonical" href="([^"]+)"/) ?? [])[1];
    must(canon, "no canonical link");
    must(canon.endsWith(path === "/" ? "/" : path), `canonical ${canon}`);
    return canon;
  });
}
await check("/api/surahs is JSON, not the app shell", async () => {
  const r = await get("/api/surahs");
  must(r.status === 200, `status ${r.status}`);
  must(/json/.test(r.headers.get("content-type") ?? ""), `content-type ${r.headers.get("content-type")}`);
});
await check(production ? "production: no X-Robots-Tag, no robots meta" : "preview: X-Robots-Tag noindex on pages, robots.txt and sitemap.xml", async () => {
  for (const path of ["/", "/about", "/robots.txt", "/sitemap.xml", "/sw.js"]) {
    const r = await get(path);
    const tag = r.headers.get("x-robots-tag") ?? "";
    if (production) must(!/noindex/i.test(tag), `${path} sends X-Robots-Tag: ${tag}`);
    else must(/noindex/i.test(tag), `${path} has no noindex header (got "${tag}")`);
  }
  const { text } = await head("/about");
  const meta = /<meta name="robots" content="[^"]*noindex/.test(text);
  must(production ? !meta : meta, production ? "robots meta present in production" : "robots meta missing on a preview");
});
await check("robots.txt", async () => {
  const { r, text } = await head("/robots.txt");
  must(r.status === 200 && !/<html/i.test(text), "not a plain robots.txt");
  if (production) {
    must(/Allow: \//.test(text) && !/^Disallow: \/\s*$/m.test(text), "production must allow crawling");
    must(text.includes(`Sitemap: ${base}/sitemap.xml`) || /Sitemap: https?:\/\/\S+\/sitemap\.xml/.test(text), "no sitemap line");
  } else must(/^Disallow: \/\s*$/m.test(text), "a preview must disallow everything");
});
await check("sitemap.xml: 136 routes at one host, none of Poets, /foundation or a personal page", async () => {
  const { r, text } = await head("/sitemap.xml");
  must(r.status === 200 && /xml/.test(r.headers.get("content-type") ?? ""), `status ${r.status}, ${r.headers.get("content-type")}`);
  const locs = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  must(locs.length === 136, `${locs.length} routes`);
  const hosts = new Set(locs.map((l) => new URL(l).host));
  must(hosts.size === 1, `hosts ${[...hosts]}`);
  must(!locs.some((l) => /poets|foundation|\/(bookmarks|downloads|hifz|goals|settings|tasbeeh|calender|per-page-read|surah-vedios)$/.test(l)), "a route that must not be listed is listed");
  if (production) must(!hosts.has("localhost"), "localhost in the sitemap");
  return [...hosts][0];
});

// ---- in a browser ----
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "allow", extraHTTPHeaders: bypass });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const open = async (path) => {
    await page.goto(base + path, { waitUntil: "domcontentloaded" }).catch((e) => {
      if (!/ERR_ABORTED|frame was detached/.test(e.message)) throw e;
    });
    await page.locator("#__nuxt").waitFor();
    await page.waitForTimeout(700);
  };
  for (const path of ["/settings", "/surah/18", "/prayerTime", "/fiqh", "/hifz"]) {
    await check(`deep link ${path} renders the app`, async () => {
      await open(path);
      must((await page.getByTestId("not-found-page").count()) === 0, "shows Page not found");
      must((await page.locator("main, [role=main], h1").count()) > 0, "nothing rendered");
    });
  }
  await check("an unknown address shows Page not found", async () => {
    await open("/this-page-does-not-exist");
    must((await page.getByTestId("not-found-page").count()) === 1, "no Page not found");
  });
  await check("/poets shows Page not found (deferred, no stub)", async () => {
    await open("/poets");
    must((await page.getByTestId("not-found-page").count()) === 1, "no Page not found");
  });
  await check("/foundation shows Page not found (test page is not shipped)", async () => {
    await open("/foundation");
    must((await page.getByTestId("not-found-page").count()) === 1, "the test page is live");
  });
  await check("/juz/7 redirects into the reader", async () => {
    await open("/juz/7");
    must(/\/surah\/\d+/.test(page.url()), `landed on ${page.url()}`);
  });
  await check("the service worker registers, and a reload works offline", async () => {
    await open("/about");
    const ready = await page.evaluate(async () => {
      const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 20000))]);
      return Boolean(reg && reg.active);
    });
    must(ready, "no active service worker within 20 s");
    await page.waitForTimeout(3000); // let the precache finish
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator("#__nuxt").waitFor();
    must((await page.getByTestId("not-found-page").count()) === 0, "Page not found while offline");
    must((await page.locator("h1").count()) > 0, "blank page while offline");
    await context.setOffline(false);
  });
  await check("no uncaught page error on any page above", async () => {
    must(errors.length === 0, errors.slice(0, 2).join(" | "));
  });
  await context.close();

  // a clean first run: no storage, no worker
  const fresh = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: "block", extraHTTPHeaders: bypass });
  const p2 = await fresh.newPage();
  const errs2 = [];
  p2.on("pageerror", (e) => errs2.push(e.message));
  await check("a clean-profile first run opens Home with no error", async () => {
    await p2.goto(base + "/", { waitUntil: "domcontentloaded" });
    await p2.locator("#__nuxt").waitFor();
    await p2.waitForTimeout(1500);
    must((await p2.locator("h1, h2").count()) > 0, "Home is blank");
    must(errs2.length === 0, errs2[0]);
  });
  await fresh.close();
} finally {
  await browser.close();
}

const failed = rows.filter((r) => !r.ok);
const report = [
  `# Smoke test of ${base}`,
  "",
  `- Date: ${new Date().toISOString()}. Kind: ${production ? "production" : "preview"}. Result: ${failed.length ? `**${failed.length} of ${rows.length} FAILED**` : `all ${rows.length} passed`}.`,
  "- Not covered: installing the PWA, a real phone, audio, and every item in docs/phases/phase-16-checks.md.",
  "",
  "| Check | Result | Detail |",
  "| --- | --- | --- |",
  ...rows.map((r) => `| ${r.name} | ${r.ok ? "pass" : "**FAIL**"} | ${r.detail.replace(/\|/g, "\\|")} |`),
  "",
].join("\n");
fs.writeFileSync(out, report);
console.log(report);
console.log(`report: ${out}`);
process.exit(failed.length ? 1 : 0);
