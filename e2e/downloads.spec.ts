// Phase 11, first slice: saving a surah's audio and playing it with no connection, on the production build WITH the service worker. The audio hosts
// are mocked (small synthetic files of the exact expected size); the app's own github.com URL must never be requested by a download; the player
// is the usual recorder. See docs/phases/phase-11-downloads-plan.md.
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { AUDIO_SIZES } from "../app/data/audioSizes.generated";
import { forbidRealApis, freezeClock, stubAudio } from "./mocks";

test.use({ serviceWorkers: "allow", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });

const R = "The-Quran-Project/Quran-Audio-Chapters";
const APP_URL = (r: number, s: number) => `https://github.com/${R}/raw/refs/heads/main/Data/${r}/${s}.mp3`;
const SIZE = AUDIO_SIZES["1"]![111]!; // Al-Ikhlaas by the default reciter, the smallest file in the first reciter's set
const mp3 = (n: number) => {
  const b = Buffer.alloc(n, 0x41);
  b.set([0x49, 0x44, 0x33, 0x03, 0, 0, 0, 0]);
  return b;
};
const CORS = { "access-control-allow-origin": "*" };

type Mode = "ok" | "html" | "short";
async function mockAudioHosts(context: BrowserContext, mode: { current: Mode }) {
  const seen: string[] = [];
  await context.route(/https:\/\/(raw|media)\.githubusercontent\.com\//, async (route) => {
    seen.push(route.request().url());
    const m = mode.current;
    if (m === "html") return route.fulfill({ status: 200, headers: { ...CORS, "content-type": "text/html" }, body: "<html>rate limited</html>" });
    return route.fulfill({ status: 200, headers: { ...CORS, "content-type": "application/octet-stream" }, body: mp3(m === "short" ? SIZE - 10 : SIZE) });
  });
  return seen;
}

let leaks: string[] = [];
let mode: { current: Mode };
let hosts: string[];
const redirecting: string[] = [];
test.beforeEach(async ({ context }) => {
  leaks = await forbidRealApis(context);
  await freezeClock(context);
  await stubAudio(context);
  mode = { current: "ok" };
  hosts = await mockAudioHosts(context, mode);
  redirecting.length = 0;
  await context.route(/https:\/\/github\.com\//, (route) => {
    redirecting.push(route.request().url()); // a download must never use the app's redirecting URL
    return route.abort();
  });
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

async function open(page: Page) {
  await page.goto("/downloads");
  await expect(page.getByTestId("downloads-page")).toBeVisible();
  await expect(page.getByTestId("dl-empty")).toBeVisible();
}
const inCache = (page: Page, name: string) =>
  page.evaluate(async (n) => {
    const c = await caches.open(n);
    return Promise.all((await c.keys()).map(async (r) => ({ url: r.url, type: (await c.match(r))!.headers.get("content-type"), len: (await c.match(r))!.headers.get("content-length") })));
  }, name);
const A = (page: Page) => page.evaluate(() => ({ ...(window as unknown as { __audio: { srcs: string[] } }).__audio }));

test("saves a surah: the file is checked, stored once under the app's own URL as audio/mpeg, listed, and the app's redirecting URL is never requested", async ({ page }) => {
  await open(page);
  await expect(page.getByTestId("dl-reciter")).toContainText("Reciter: Mishary Rashid Al Afasy");
  await expect(page.getByTestId("dl-reciter").getByRole("link", { name: "Change in Settings" })).toHaveAttribute("href", "/settings?section=audio");
  await page.getByTestId("dl-start").click();
  await expect(page.getByTestId("dl-saved-112")).toBeVisible();
  await expect(page.getByTestId("dl-start")).toHaveText(/Saved/);
  expect(hosts).toEqual(["https://raw.githubusercontent.com/" + R + "/refs/heads/main/Data/1/112.mp3"]);
  expect(redirecting).toEqual([]);
  expect(await inCache(page, "quran-downloads-audio-cache")).toEqual([{ url: APP_URL(1, 112), type: "audio/mpeg", len: String(SIZE) }]);
  expect(await inCache(page, "quran-audio-cache")).toEqual([]); // stored once: the streaming-audio rule skipped the download
});

test("a page that is not audio, or a file of the wrong length, is refused: 'Failed · Retry', nothing is kept, and Retry works", async ({ page }) => {
  await open(page);
  for (const bad of ["html", "short"] as const) {
    mode.current = bad;
    await page.getByTestId("dl-start").click();
    await expect(page.getByTestId("dl-job-112")).toHaveAttribute("data-status", "failed");
    await expect(page.getByTestId("dl-job-state")).toContainText("Failed ·");
    expect(await inCache(page, "quran-downloads-audio-cache")).toEqual([]);
    await page.getByTestId("dl-cancel").click(); // leave the failed row; the next round starts a fresh one
    await expect(page.getByTestId("dl-queue")).toHaveCount(0);
  }
  mode.current = "html";
  await page.getByTestId("dl-start").click();
  await expect(page.getByTestId("dl-retry")).toBeVisible();
  mode.current = "ok";
  await page.getByTestId("dl-retry").click();
  await expect(page.getByTestId("dl-saved-112")).toBeVisible();
});

test("a saved surah plays with no connection, through the service worker: the player asks for the marked URL, and ranges and seeking are answered from the device", async ({ page, context }) => {
  await open(page);
  await page.getByTestId("dl-start").click();
  await expect(page.getByTestId("dl-saved-112")).toBeVisible();
  await expect(page.getByTestId("dl-sw")).toContainText("Offline playback is ready"); // the worker controls the page
  await context.unroute(/https:\/\/(raw|media)\.githubusercontent\.com\//);
  await context.setOffline(true);

  // what the media element sends: a range request on the original URL with the marker
  const ranges = await page.evaluate(async (url) => {
    const get = async (range: string) => {
      const r = await fetch(url, { headers: { Range: range } });
      return { status: r.status, cr: r.headers.get("content-range"), len: (await r.arrayBuffer()).byteLength };
    };
    return [await get("bytes=0-99"), await get("bytes=100000-100999"), await get("bytes=-50")];
  }, `${APP_URL(1, 112)}?offline=1`);
  expect(ranges).toEqual([
    { status: 206, cr: `bytes 0-99/${SIZE}`, len: 100 },
    { status: 206, cr: `bytes 100000-100999/${SIZE}`, len: 1000 },
    { status: 206, cr: `bytes ${SIZE - 50}-${SIZE - 1}/${SIZE}`, len: 50 },
  ]);
  // without the marker nothing is served from the device
  expect(await page.evaluate((url) => fetch(url, { mode: "no-cors" }).then(() => "answered", () => "failed"), APP_URL(1, 112))).toBe("failed");
  expect(redirecting).toEqual([APP_URL(1, 112)]); // that probe (and only that) went to the network
  redirecting.length = 0;

  await page.getByTestId("dl-play").click();
  await expect.poll(async () => (await A(page)).srcs.at(-1)).toBe(`${APP_URL(1, 112)}?offline=1`);
  expect(redirecting).toEqual([]); // playing the marked URL never reached the network
});

test("Remove hides the file and offers Undo; it is deleted when the toast ends or the page is hidden", async ({ page }) => {
  await open(page);
  await page.getByTestId("dl-start").click();
  await expect(page.getByTestId("dl-saved-112")).toBeVisible();

  await page.getByTestId("dl-remove").click();
  await expect(page.getByTestId("dl-saved-112")).toHaveCount(0);
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByTestId("dl-saved-112")).toBeVisible();
  expect(await inCache(page, "quran-downloads-audio-cache")).toHaveLength(1);

  await page.getByTestId("dl-remove").click();
  await expect(page.getByTestId("dl-saved-112")).toHaveCount(0);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange")); // the page is leaving: the removal is carried out at once
  });
  await expect.poll(() => inCache(page, "quran-downloads-audio-cache")).toEqual([]);
  await expect(page.getByTestId("dl-empty")).toBeVisible();
});

test("saved audio is listed again after a reload, and after Clear all data (which keeps downloaded audio)", async ({ page }) => {
  await open(page);
  await page.getByTestId("dl-start").click();
  await expect(page.getByTestId("dl-saved-112")).toBeVisible();
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByTestId("dl-saved-112")).toBeVisible();
});

test("space: when the free quota is too small it says so before fetching anything, and goes on only when asked", async ({ page }) => {
  await page.addInitScript(() => {
    const est = () => Promise.resolve({ usage: 9_990_000_000, quota: 10_000_000_000 });
    Object.defineProperty(navigator.storage, "estimate", { value: est, configurable: true });
  });
  await open(page);
  await page.getByTestId("dl-start").click();
  await expect(page.getByTestId("dl-job-112")).toHaveAttribute("data-status", "space");
  await expect(page.getByTestId("dl-job-state")).toContainText("Needs about");
  expect(hosts).toEqual([]);
  await page.getByTestId("dl-proceed").click();
  await expect(page.getByTestId("dl-saved-112")).toBeVisible();
});

test("iPhone Safari outside the Home Screen shows one note about adding the app to the Home Screen; other browsers do not", async ({ browser }) => {
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1", viewport: { width: 390, height: 800 }, hasTouch: true, serviceWorkers: "block" });
  const p = await ctx.newPage();
  await p.goto("/downloads");
  await expect(p.getByTestId("dl-home-note")).toContainText("Add this app to your Home Screen");
  await ctx.close();
});

test("the page has no note on a desktop browser, and one heading", async ({ page }) => {
  await open(page);
  await expect(page.getByTestId("dl-home-note")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});
