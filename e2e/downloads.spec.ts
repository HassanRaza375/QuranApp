// Phase 11: Downloads and /surah-audios/[id] in a real browser, on the production build. The audio hosts are mocked (small synthetic files of the
// exact expected size), the reader's text and tafsir are the usual synthetic ones, the player is the usual recorder; the app's own github.com URL
// must never be requested by a download. The first describes run without a service worker (everything except offline playback); the last runs
// WITH it and proves that a saved file is answered from the device with ranges. See docs/phases/phase-11-downloads-plan.md.
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { AUDIO_SIZES } from "../app/data/audioSizes.generated";
import { fakeChapter, forbidRealApis, freezeClock, mockQuranText, readStorage, seed, stubAudio, type QuranTextMock } from "./mocks";

test.use({ timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });

const R = "The-Quran-Project/Quran-Audio-Chapters";
const APP_URL = (r: number, s: number) => `https://github.com/${R}/raw/refs/heads/main/Data/${r}/${s}.mp3`;
const SIZE = (r: number, s: number) => AUDIO_SIZES[String(r)]![s - 1]!;
const MISHARY = "Mishary Rashid Al Afasy";
const mp3 = (n: number) => {
  const b = Buffer.alloc(n, 0x41);
  b.set([0x49, 0x44, 0x33, 0x03, 0, 0, 0, 0]);
  return b;
};
const CORS = { "access-control-allow-origin": "*" };

type Mode = "ok" | "html" | "short";
let leaks: string[] = [];
let mode: { current: Mode };
let hosts: string[];
let text: QuranTextMock;
const redirecting: string[] = [];

async function mockAudioHosts(context: BrowserContext) {
  const seen: string[] = [];
  await context.route(/https:\/\/(raw|media)\.githubusercontent\.com\//, async (route) => {
    const url = route.request().url();
    seen.push(url);
    const m = /Data\/(\d+)\/(\d+)\.mp3/.exec(url)!;
    const size = SIZE(Number(m[1]), Number(m[2]));
    if (mode.current === "html") return route.fulfill({ status: 200, headers: { ...CORS, "content-type": "text/html" }, body: "<html>rate limited</html>" });
    return route.fulfill({ status: 200, headers: { ...CORS, "content-type": "application/octet-stream" }, body: mp3(mode.current === "short" ? size - 10 : size) });
  });
  return seen;
}

test.beforeEach(async ({ context }) => {
  leaks = await forbidRealApis(context);
  await freezeClock(context);
  await stubAudio(context);
  mode = { current: "ok" };
  text = await mockQuranText(context);
  hosts = await mockAudioHosts(context);
  redirecting.length = 0;
  await context.route(/https:\/\/github\.com\//, (route) => {
    redirecting.push(route.request().url()); // a download must never use the app's redirecting URL
    return route.abort();
  });
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

const A = (page: Page) => page.evaluate(() => ({ ...(window as unknown as { __audio: { srcs: string[] } }).__audio }));
const inCache = (page: Page, name: string) =>
  page.evaluate(async (n) => {
    if (!(await caches.has(n))) return [];
    const c = await caches.open(n);
    return Promise.all((await c.keys()).map(async (r) => ({ url: r.url, type: (await c.match(r))!.headers.get("content-type"), len: (await c.match(r))!.headers.get("content-length") })));
  }, name);
const manifest = async (page: Page) => JSON.parse((await readStorage(page))["quran:downloads:v1"] ?? "[]") as Record<string, unknown>[];
const row = (page: Page, n: number) => page.getByTestId(`dl-row-${n}`);
async function open(page: Page) {
  await page.goto("/downloads");
  await expect(page.getByTestId("downloads-page")).toBeVisible();
  await expect(page.getByTestId("dl-empty")).toBeVisible();
}
/** Adds one surah through the Add sheet. */
async function add(page: Page, name: string, opts: { tafsir?: boolean; audio?: boolean } = {}) {
  await page.getByTestId("dl-add").click();
  await expect(page.getByTestId("dl-sheet")).toBeVisible();
  await page.getByTestId("dl-filter").fill(name);
  const boxes = page.locator('[data-testid^="dl-check-"]');
  await expect(boxes).toHaveCount(1);
  await boxes.first().check();
  if (opts.tafsir) await page.getByTestId("dl-include-tafsir").click();
  if (opts.audio === false) await page.getByTestId("dl-include-audio").click();
  await page.getByTestId("dl-start").click();
}

test.describe("without a service worker", () => {
  test.use({ serviceWorkers: "block" });

  test("first run: the empty state, the quick picks (Juz 30 by number, surah names from the data), the whole-Qur'an button, and no request at all", async ({ page }) => {
    const external: string[] = [];
    page.on("request", (r) => {
      if (!r.url().startsWith("http://localhost:3011") && !r.url().startsWith("data:")) external.push(r.url());
    });
    await open(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Downloads");
    await expect(page.getByTestId("dl-picks")).toContainText("Juz 30");
    for (const n of ["Al-Kahf", "Yaseen", "Al-Mulk", "Al-Waaqia", "Ar-Rahmaan"]) await expect(page.getByTestId("dl-picks")).toContainText(n);
    await expect(page.getByTestId("dl-picks")).not.toContainText("Amma");
    await expect(page.getByTestId("dl-all-text")).toContainText("Save the text of the whole Qur’an · about 6.6 MB");
    await expect(page.getByTestId("dl-reciter")).toContainText(`Reciter: ${MISHARY}`);
    await expect(page.getByTestId("dl-reciter").getByRole("link", { name: "Change in Settings" })).toHaveAttribute("href", "/settings?section=audio");
    await expect(page.getByTestId("dl-count")).toHaveText("0 surahs");
    expect(external).toEqual([]);
    expect(text.chapters).toEqual([]);
  });

  test("Add surahs: text and your reciter's audio by default, tafsir only if asked; the size is shown before; the file is checked and stored once; the list is the legacy shape", async ({ page }) => {
    await open(page);
    await page.getByTestId("dl-add").click();
    await expect(page.getByTestId("dl-include-tafsir")).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("dl-include-audio")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("dl-sum")).toHaveText("Select surahs to download");
    await expect(page.getByTestId("dl-start")).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("dl-sheet")).toHaveCount(0);
    await add(page, "ikhlas");
    await expect(row(page, 112)).toBeVisible();
    await expect(row(page, 112).getByTestId("dl-part-text")).toContainText("Text");
    await expect(row(page, 112).getByTestId("dl-part-audio")).toContainText(MISHARY);
    await expect(row(page, 112).getByTestId("dl-part-tafsir")).toContainText("Tafsir"); // an Add button, not a check
    expect(text.chapters).toEqual([112]);
    expect(text.tafsirs).toEqual([]); // opt-in
    expect(hosts).toEqual([`https://raw.githubusercontent.com/${R}/refs/heads/main/Data/1/112.mp3`]);
    expect(redirecting).toEqual([]);
    expect(await inCache(page, "quran-downloads-audio-cache")).toEqual([{ url: APP_URL(1, 112), type: "audio/mpeg", len: String(SIZE(1, 112)) }]);
    expect(await inCache(page, "quran-audio-cache")).toEqual([]);
    const m = await manifest(page);
    expect(m).toHaveLength(1);
    expect(m[0]).toMatchObject({ surahNo: 112, totalAyah: 4, hasTafsir: false, reciterKey: "1", reciterName: MISHARY, audioUrl: APP_URL(1, 112), revamp: 1 });
    await expect(page.getByTestId("dl-count")).toHaveText("1 surah");
    await expect(page.getByTestId("thread-fill")).toHaveCount(1);
  });

  test("tafsir is opt-in: asking for it saves every ayah; a text-only row has a 'Tafsir' button that does the same", async ({ page }) => {
    await open(page);
    await add(page, "ikhlas", { tafsir: true, audio: false });
    await expect(row(page, 112).locator('span[data-testid="dl-part-tafsir"]')).toHaveCount(1);
    expect(text.tafsirs.sort()).toEqual(["112_1", "112_2", "112_3", "112_4"]);
    expect((await manifest(page))[0]).toMatchObject({ hasTafsir: true });
    await expect(row(page, 112).getByTestId("dl-part-audio-add")).toBeVisible();

    await add(page, "mankind", { audio: false });
    await expect(row(page, 114)).toBeVisible();
    expect(text.tafsirs.filter((k) => k.startsWith("114_"))).toEqual([]);
    await row(page, 114).getByTestId("dl-part-tafsir").click();
    await expect.poll(() => text.tafsirs.filter((k) => k.startsWith("114_")).length).toBe(6);
    await expect.poll(async () => ((await manifest(page)).find((e) => e.surahNo === 114) as { hasTafsir: boolean }).hasTafsir).toBe(true);
  });

  test("the whole Qur'an text is one button and one job: 114 surahs, each once", async ({ page }) => {
    await open(page);
    await page.getByTestId("dl-all-text").click();
    await expect(page.getByTestId("dl-job-all")).toBeVisible();
    await expect(page.getByTestId("dl-all-text")).toContainText("Text of the whole Qur’an saved", { timeout: 60000 });
    expect(text.chapters.sort((a, b) => a - b)).toEqual(Array.from({ length: 114 }, (_, i) => i + 1));
    await expect(page.getByTestId("dl-count")).toHaveText("114 surahs");
    await expect(page.getByTestId("dl-all-text")).toBeDisabled();
    expect(await manifest(page)).toHaveLength(114);
  });

  test("quick picks save text and audio; a picked surah shows as saved", async ({ page }) => {
    await open(page);
    await page.getByTestId("dl-pick-67").click(); // Al-Mulk
    await expect(row(page, 67)).toBeVisible({ timeout: 30000 });
    await expect(page.getByTestId("dl-pick-67")).toBeDisabled();
    await expect(page.getByTestId("dl-pick-67")).toContainText("saved");
  });

  test("a page that is not audio, or a file of the wrong length, is refused: 'Failed · …' and Retry; nothing is kept", async ({ page }) => {
    await open(page);
    mode.current = "html";
    await add(page, "ikhlas", { audio: true });
    await expect(page.getByTestId("dl-job-112")).toHaveAttribute("data-status", "failed");
    await expect(page.getByTestId("dl-job-state")).toContainText("Failed ·");
    expect(await inCache(page, "quran-downloads-audio-cache")).toEqual([]);
    mode.current = "short";
    await page.getByTestId("dl-retry").click();
    await expect(page.getByTestId("dl-job-112")).toHaveAttribute("data-status", "failed");
    expect(await inCache(page, "quran-downloads-audio-cache")).toEqual([]);
    mode.current = "ok";
    await page.getByTestId("dl-retry").click();
    await expect(row(page, 112).getByTestId("dl-part-audio")).toBeVisible();
    await expect(page.getByTestId("dl-queue")).toHaveCount(0);
  });

  test("offline: queued work waits for a connection, says so, and starts by itself when it returns", async ({ page, context }) => {
    await open(page);
    await context.setOffline(true);
    await expect(page.getByTestId("dl-offline-note")).toBeVisible();
    await add(page, "ikhlas", { audio: false }); // (the list of recordings is a lazily loaded file; the installed app has it from the precache)
    await expect(page.getByTestId("dl-job-state")).toHaveText("Waiting for a connection");
    expect(text.chapters).toEqual([]);
    await context.setOffline(false);
    await expect(row(page, 112)).toBeVisible();
    await expect(page.getByTestId("dl-offline-note")).toHaveCount(0);
  });

  test("space: when the free quota is too small it says so before fetching anything, and goes on only when asked", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator.storage, "estimate", { value: () => Promise.resolve({ usage: 9_990_000_000, quota: 10_000_000_000 }), configurable: true });
    });
    await open(page);
    await add(page, "ikhlas");
    await expect(page.getByTestId("dl-job-112")).toHaveAttribute("data-status", "space");
    await expect(page.getByTestId("dl-job-state")).toContainText("Needs about");
    expect(hosts).toEqual([]);
    expect(text.chapters).toEqual([]);
    await page.getByTestId("dl-proceed").click();
    await expect(row(page, 112)).toBeVisible();
  });

  test("Remove hides the surah and offers Undo; Undo brings it back whole; otherwise everything is deleted when the toast ends or the page is hidden", async ({ page }) => {
    await open(page);
    await add(page, "ikhlas", { tafsir: true });
    await expect(row(page, 112).getByTestId("dl-part-audio")).toBeVisible();
    await row(page, 112).getByTestId("dl-remove").click();
    await expect(row(page, 112)).toHaveCount(0);
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(row(page, 112)).toBeVisible();
    expect(await inCache(page, "quran-downloads-audio-cache")).toHaveLength(1);
    expect(await manifest(page)).toHaveLength(1);

    await row(page, 112).getByTestId("dl-remove").click();
    await expect(row(page, 112)).toHaveCount(0);
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
      document.dispatchEvent(new Event("visibilitychange")); // the page is leaving: the removal is carried out at once
    });
    await expect.poll(() => inCache(page, "quran-downloads-audio-cache")).toEqual([]);
    await expect.poll(async () => (await manifest(page)).length).toBe(0);
    await expect(page.getByTestId("dl-empty")).toBeVisible();
    // the reader's copy is gone too: reading the surah again asks the network
    const before = text.chapters.length;
    await page.goto("/surah/112");
    await expect.poll(() => text.chapters.length).toBeGreaterThan(before);
  });

  test("what the device lost shows as 'Not saved' with a one-tap repair (the list says it was saved, the reader's store does not have it)", async ({ page, context }) => {
    await seed(context, { "quran:downloads:v1": JSON.stringify([{ surahNo: 112, surahName: "x", totalAyah: 4, hasTafsir: true, reciterKey: null, reciterName: null, audioUrl: null, sizeBytesEstimate: 5, downloadedAt: 1, revamp: 1 }]) });
    await page.goto("/downloads");
    await expect(row(page, 112)).toBeVisible();
    await expect(row(page, 112).getByTestId("dl-part-text")).toContainText("Not saved");
    await expect(row(page, 112).getByTestId("dl-part-tafsir")).toContainText("Not saved");
    expect(text.chapters).toEqual([]); // starting asks nothing of the network
    await row(page, 112).getByTestId("dl-part-text").click();
    await expect(row(page, 112).getByTestId("dl-part-text")).not.toContainText("Not saved");
    await expect.poll(() => text.chapters).toEqual([112]);
  });

  test("a legacy download is adopted from the service worker's cache with no network: the text shows as saved, the rest as 'Not saved'", async ({ page, context }) => {
    await seed(context, { "quran:downloads:v1": JSON.stringify([{ surahNo: 112, surahName: "x", totalAyah: 4, hasTafsir: true, reciterKey: null, reciterName: null, audioUrl: null, sizeBytesEstimate: 5, downloadedAt: 1 }]) });
    await page.goto("/");
    await page.evaluate(async (chapter) => {
      const c = await caches.open("quran-api-cache");
      await c.put("https://quranapi.pages.dev/api/112.json", new Response(JSON.stringify(chapter), { headers: { "content-type": "application/json" } }));
    }, fakeChapter(112));
    await page.goto("/downloads");
    await expect(row(page, 112).locator('span[data-testid="dl-part-text"]')).toHaveCount(1);
    await expect(row(page, 112).getByTestId("dl-part-text")).not.toContainText("Not saved");
    await expect(row(page, 112).getByTestId("dl-part-tafsir")).toContainText("Not saved"); // not in that cache
    expect(text.chapters).toEqual([]); // adopted from the cache, nothing fetched
    expect((await manifest(page))[0]).toMatchObject({ surahNo: 112, revamp: 1 });
  });

  test("legacy audio (an opaque copy) is shown as saved by the older app and replaced by Download again", async ({ page }) => {
    await open(page);
    await page.evaluate(async (url) => {
      const res = await fetch(url, { mode: "no-cors" }); // what the legacy app did: an opaque response
      await (await caches.open("quran-downloads-audio-cache")).put("https://github.com/The-Quran-Project/Quran-Audio-Chapters/raw/refs/heads/main/Data/1/112.mp3", res);
    }, `https://raw.githubusercontent.com/${R}/refs/heads/main/Data/1/112.mp3`);
    await page.reload();
    await expect(row(page, 112).getByTestId("dl-part-older")).toContainText("saved by the older app, download again");
    await expect(row(page, 112).getByTestId("dl-play")).toHaveCount(0); // it cannot play from the device
    hosts.length = 0;
    await row(page, 112).getByTestId("dl-part-older").click();
    await expect(row(page, 112).getByTestId("dl-part-audio")).toBeVisible();
    await expect(row(page, 112).getByTestId("dl-part-older")).toHaveCount(0);
    expect(hosts).toHaveLength(1);
    expect(await inCache(page, "quran-downloads-audio-cache")).toEqual([{ url: APP_URL(1, 112), type: "audio/mpeg", len: String(SIZE(1, 112)) }]);
  });

  test("Clear all data keeps downloaded audio, and the page lists it again", async ({ page }) => {
    await open(page);
    await add(page, "ikhlas");
    await expect(row(page, 112).getByTestId("dl-part-audio")).toBeVisible();
    await page.evaluate(async () => {
      localStorage.clear();
      await new Promise<void>((resolve) => {
        const r = indexedDB.deleteDatabase("quran-revamp-db");
        r.onsuccess = r.onerror = r.onblocked = () => resolve();
      });
    });
    await page.reload();
    await expect(row(page, 112).getByTestId("dl-part-audio")).toBeVisible();
    await expect(row(page, 112).locator('button[data-testid="dl-part-text"]')).toHaveCount(1); // an Add button again
  });

  test("Wi-Fi only (where the browser reports the connection type): audio waits on mobile data, text does not; Wi-Fi starts it", async ({ page, context }) => {
    await seed(context, { "quran:download-prefs:v1": JSON.stringify({ wifiOnly: true }) });
    await page.addInitScript(() => {
      const target = new EventTarget();
      const conn = Object.assign(target, { type: "cellular" });
      Object.defineProperty(navigator, "connection", { value: conn, configurable: true });
      (window as unknown as { __wifi: () => void }).__wifi = () => {
        conn.type = "wifi";
        target.dispatchEvent(new Event("change"));
      };
    });
    await open(page);
    await expect(page.getByTestId("dl-wifi")).toBeEnabled();
    await expect(page.getByTestId("dl-wifi")).toBeChecked();
    await add(page, "ikhlas");
    await expect(page.getByTestId("dl-job-112")).toHaveAttribute("data-status", "wifi");
    await expect(page.getByTestId("dl-job-state")).toHaveText("Waiting for Wi-Fi");
    await expect(row(page, 112).locator('span[data-testid="dl-part-text"]')).toHaveCount(1); // text was saved meanwhile
    expect(hosts).toEqual([]);
    await page.evaluate(() => (window as unknown as { __wifi: () => void }).__wifi());
    await expect(row(page, 112).getByTestId("dl-part-audio")).toBeVisible();
    expect(hosts).toHaveLength(1);
  });

  test("Wi-Fi only is greyed with the reason where the browser does not report the connection type (same as Settings)", async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, "connection", { value: undefined, configurable: true }));
    await open(page);
    await expect(page.getByTestId("dl-wifi")).toBeDisabled();
    await expect(page.getByTestId("dl-wifi-note")).toContainText("This browser does not tell the app whether you are on Wi-Fi");
  });

  test("the meter shows the browser's real figures, and Clear browsing cache clears only the streaming caches", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator.storage, "estimate", { value: () => Promise.resolve({ usage: 500_000_000, quota: 10_000_000_000 }), configurable: true });
    });
    await open(page);
    await expect(page.getByTestId("dl-usage")).toContainText("about 9.5 GB free");
    await add(page, "ikhlas");
    await expect(row(page, 112).getByTestId("dl-part-audio")).toBeVisible();
    await page.evaluate(async () => {
      for (const n of ["quran-api-cache", "quran-audio-cache"]) await (await caches.open(n)).put(`https://x.test/${n}`, new Response("x"));
    });
    await page.getByTestId("dl-clear-cache").click();
    await expect.poll(() => page.evaluate(async () => (await caches.keys()).sort())).toEqual(["quran-downloads-audio-cache"]);
    await expect(row(page, 112).getByTestId("dl-part-audio")).toBeVisible();
  });

  test("iPhone Safari outside the Home Screen shows one note about adding the app to the Home Screen; desktop shows none", async ({ browser, page }) => {
    await open(page);
    await expect(page.getByTestId("dl-home-note")).toHaveCount(0);
    const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1", viewport: { width: 390, height: 800 }, hasTouch: true, serviceWorkers: "block" });
    const p = await ctx.newPage();
    await p.goto("/downloads");
    await expect(p.getByTestId("dl-home-note")).toContainText("Add this app to your Home Screen");
    await ctx.close();
  });

  test("375 px: a populated page has no sideways scroll, the controls are 44 px high, and the sheet works", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await open(page);
    await add(page, "ikhlas", { tafsir: true });
    await expect(row(page, 112).getByTestId("dl-part-audio")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    for (const id of ["dl-add", "dl-clear-cache"]) expect((await page.getByTestId(id).boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    expect((await row(page, 112).getByTestId("dl-remove").boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
  });
});

test.describe("/surah-audios/[id]", () => {
  test.use({ serviceWorkers: "block" });

  test("five reciters with sizes; your reciter is marked; Play plays that reciter's file without changing the Settings reciter; the bookmark toggles audio:36", async ({ page }) => {
    await page.goto("/surah-audios/36");
    await expect(page.getByTestId("sa-title")).toHaveText("Yaseen");
    await expect(page.getByTestId("sa-list").locator("li")).toHaveCount(5);
    await expect(page.getByTestId("sa-row-1")).toContainText(MISHARY);
    await expect(page.getByTestId("sa-row-1").getByTestId("sa-yours")).toHaveText("Your reciter");
    await expect(page.getByTestId("sa-row-2")).toContainText("12 MB");
    await page.getByTestId("sa-row-2").getByTestId("sa-play").click();
    await expect.poll(async () => (await A(page)).srcs.at(-1)).toBe(APP_URL(2, 36));
    expect((await readStorage(page)).reciter ?? null).toBeNull(); // the Settings reciter was not changed
    await expect(page.getByTestId("sa-bookmark")).toHaveAttribute("aria-pressed", "false");
    await page.getByTestId("sa-bookmark").click();
    await expect(page.getByTestId("sa-bookmark")).toHaveAttribute("aria-pressed", "true");
    expect(JSON.parse((await readStorage(page))["quran:bookmarks:v1"]!)).toContain("audio:36");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("sa-bookmark")).toHaveAttribute("aria-pressed", "false");
  });

  test("Download on a row saves that reciter's file (and only the audio); Saved shows with Remove and Undo; the Downloads page lists it", async ({ page }) => {
    await page.goto("/surah-audios/112");
    await page.getByTestId("sa-row-3").getByTestId("sa-download").click();
    await expect(page.getByTestId("sa-row-3")).toHaveAttribute("data-state", "saved");
    await expect(page.getByTestId("sa-row-3").getByTestId("sa-state")).toContainText("Saved on this device");
    expect(text.chapters).toEqual([]); // audio only
    expect(hosts).toEqual([`https://raw.githubusercontent.com/${R}/refs/heads/main/Data/3/112.mp3`]);
    await page.getByTestId("sa-row-3").getByTestId("sa-remove").click();
    await expect(page.getByTestId("sa-row-3")).toHaveAttribute("data-state", "none");
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("sa-row-3")).toHaveAttribute("data-state", "saved");
    await page.getByTestId("sa-manage").click();
    await expect(row(page, 112).getByTestId("dl-part-audio")).toContainText("Nasser Al Qatami");
  });

  test("a surah that does not exist says so instead of a blank page", async ({ page }) => {
    for (const bad of ["0", "115", "abc"]) {
      await page.goto(`/surah-audios/${bad}`);
      await expect(page.getByTestId("sa-missing")).toBeVisible();
    }
  });

  test("the player sheet saves the playing surah by the playing reciter, shows progress, then 'Saved on this device'", async ({ page }) => {
    await page.goto("/surah-audios/112");
    await page.getByTestId("sa-row-1").getByTestId("sa-play").click();
    await page.getByTestId("mini-open").click();
    await expect(page.getByTestId("player-sheet")).toBeVisible();
    await expect(page.getByTestId("player-save")).toContainText("Save audio to listen offline");
    await page.getByTestId("player-save").click();
    await expect(page.getByTestId("player-saved")).toBeVisible();
    expect(text.chapters).toEqual([]);
    expect(await inCache(page, "quran-downloads-audio-cache")).toHaveLength(1);
  });
});

test.describe("offline playback, with the service worker", () => {
  test.use({ serviceWorkers: "allow" });

  test("a saved surah plays with no connection: the player asks for the marked URL, and ranges are answered from the device; never the network", async ({ page, context }) => {
    await open(page);
    await add(page, "ikhlas");
    await expect(row(page, 112).getByTestId("dl-part-audio")).toBeVisible();
    await expect(page.getByTestId("dl-sw")).toContainText("Offline playback is ready");
    await context.unroute(/https:\/\/(raw|media)\.githubusercontent\.com\//);
    await context.setOffline(true);
    const size = SIZE(1, 112);
    const ranges = await page.evaluate(async (url) => {
      const get = async (range: string) => {
        const r = await fetch(url, { headers: { Range: range } });
        return { status: r.status, cr: r.headers.get("content-range"), len: (await r.arrayBuffer()).byteLength };
      };
      return [await get("bytes=0-99"), await get("bytes=100000-100999"), await get("bytes=-50")];
    }, `${APP_URL(1, 112)}?offline=1`);
    expect(ranges).toEqual([
      { status: 206, cr: `bytes 0-99/${size}`, len: 100 },
      { status: 206, cr: `bytes 100000-100999/${size}`, len: 1000 },
      { status: 206, cr: `bytes ${size - 50}-${size - 1}/${size}`, len: 50 },
    ]);
    expect(await page.evaluate((url) => fetch(url, { mode: "no-cors" }).then(() => "answered", () => "failed"), APP_URL(1, 112))).toBe("failed"); // not marked: not served from the device
    redirecting.length = 0;
    await row(page, 112).getByTestId("dl-play").click();
    await expect.poll(async () => (await A(page)).srcs.at(-1)).toBe(`${APP_URL(1, 112)}?offline=1`);
    expect(redirecting).toEqual([]);
  });

  test("offline, moving around inside the app still shows what is saved", async ({ page, context }) => {
    await open(page);
    await add(page, "ikhlas");
    await expect(row(page, 112).getByTestId("dl-part-audio")).toBeVisible();
    await expect(page.getByTestId("dl-sw")).toContainText("Offline playback is ready");
    await context.setOffline(true);
    await page.getByRole("link", { name: "Surahs" }).first().click();
    await expect(page).toHaveURL(/surah-listing/);
    await page.getByRole("link", { name: "Downloads" }).first().click();
    await expect(row(page, 112)).toBeVisible();
    await expect(row(page, 112).locator('span[data-testid="dl-part-text"]')).toHaveCount(1);
  });
});
