// Dev-only (not part of verify): how long from a click on Play to the audio element being asked for its file, with the recorded audio element of the browser
// tests (`stubAudio`). Run on the production build (`npm run build`), once per commit being compared:
//   OUT=<result.json> LABEL=<name> npx playwright test --config scripts/measure/playwright.config.ts
// Surfaces: the listing row, the reader's ayah button, Per page's "Play page". Conditions: normal speed and 4x CPU slowdown; the click right after the page is
// up ("soon") and after 3 s of idle ("settled", when idle link prefetching has run). With NO_HIFZ=1 the chunks that hold Hifz code are blocked, to test the
// one hypothesis for the changed timing after Phase 14 (idle prefetch of those chunks).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { forbidRealApis, freezeClock, mockQuranText, mockVerse, stubAudio } from "../../e2e/mocks";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RUNS = Number(process.env.RUNS ?? 10);
const OUT = process.env.OUT ?? path.resolve(HERE, "play-result.json");
const LABEL = process.env.LABEL ?? "run";
const HIFZ_BLOCK = process.env.NO_HIFZ === "1";

const chunkDir = path.resolve(HERE, "../../.output/public/_nuxt");
const hifzChunks = HIFZ_BLOCK
  ? fs.readdirSync(chunkDir).filter((f) => f.endsWith(".js") && /recentResults|Tricky ayahs come first/.test(fs.readFileSync(path.join(chunkDir, f), "utf8")))
  : [];

type Cond = { name: string; slow: boolean; settled: boolean };
const CONDS: Cond[] = [
  { name: "1x soon", slow: false, settled: false },
  { name: "4x soon", slow: true, settled: false },
  { name: "4x settled", slow: true, settled: true },
];

/** Records, inside the page, the time from the next click to the first new file asked of the audio element. */
const arm = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __audio: { srcs: string[] }; __dt?: number };
    w.__dt = undefined;
    document.addEventListener(
      "click",
      () => {
        const t0 = performance.now();
        const n0 = w.__audio.srcs.length;
        const ch = new MessageChannel();
        ch.port1.onmessage = () => {
          if (w.__audio.srcs.length > n0) w.__dt = performance.now() - t0;
          else ch.port2.postMessage(0);
        };
        ch.port2.postMessage(0);
      },
      { capture: true, once: true },
    );
  });
const read = (page: Page) => page.waitForFunction(() => (window as unknown as { __dt?: number }).__dt !== undefined, undefined, { timeout: 20_000 }).then(() => page.evaluate(() => (window as unknown as { __dt: number }).__dt));

const SURFACES: Record<string, { open: (p: Page) => Promise<void>; click: (p: Page) => Promise<void> }> = {
  listing: {
    open: async (p) => {
      await p.goto("/surah-listing");
      await expect(p.getByTestId("surah-row-1")).toBeVisible();
    },
    click: (p) => p.getByTestId("surah-row-1").getByTestId("row-play").click(),
  },
  "reader ayah": {
    open: async (p) => {
      await p.goto("/surah/2");
      await expect(p.getByTestId("ayah-1")).toBeAttached();
    },
    click: (p) => p.getByTestId("ayah-1").getByTestId("ayah-play").click(),
  },
  "play page": {
    open: async (p) => {
      await p.goto("/per-page-read?page=3");
      await expect(p.getByTestId("page-frame")).toBeVisible();
    },
    click: (p) => p.getByTestId("play-page").click(),
  },
};

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
const results: Record<string, { median: number; min: number; max: number; runs: number[] }> = {};

test.describe.configure({ mode: "serial" });
test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });

for (const [sname, s] of Object.entries(SURFACES)) {
  for (const c of CONDS) {
    test(`${LABEL}: ${sname}, ${c.name}`, async ({ browser }) => {
      test.setTimeout(240_000);
      const runs: number[] = [];
      for (let i = 0; i < RUNS; i++) {
        const context = await browser.newContext({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });
        await forbidRealApis(context);
        await freezeClock(context);
        await stubAudio(context);
        await mockQuranText(context);
        await mockVerse(context);
        for (const f of hifzChunks) await context.route(`**/_nuxt/${f}`, (r) => r.abort());
        const page = await context.newPage();
        if (c.slow) await (await context.newCDPSession(page)).send("Emulation.setCPUThrottlingRate", { rate: 4 });
        await s.open(page);
        if (c.settled) await page.waitForTimeout(3000);
        else await page.waitForTimeout(300);
        await arm(page);
        await s.click(page);
        runs.push(Math.round((await read(page)) as number));
        await context.close();
      }
      results[`${sname} | ${c.name}`] = { median: median(runs), min: Math.min(...runs), max: Math.max(...runs), runs };
      fs.writeFileSync(OUT, JSON.stringify({ label: LABEL, noHifz: HIFZ_BLOCK, blocked: hifzChunks, runs: RUNS, results }, null, 1));
    });
  }
}
