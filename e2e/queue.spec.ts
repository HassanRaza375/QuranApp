// Phase 4C: the two queues in a real browser, on the production build: Play page (Per page) and Listen to this chapter (Stories). The audio element is
// a stand-in and the per-ayah endpoint is mocked with synthetic recording urls; every unmocked request to a real API fails the test; the clock is
// fixed. See docs/phases/phase-04c-ayah-audio.md.
import { expect, test, type Page } from "@playwright/test";
import { SURAH_ROWS } from "../app/data/quranMeta.generated";
import { pageSegments } from "../app/lib/pageReader";
import { AYAH_RECITERS, forbidRealApis, freezeClock, idbNames, mockQuranText, mockVerse, readStorage, seed, stubAudio, type VerseMock } from "./mocks";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });
let leaks: string[] = [];
let verse: VerseMock;
test.beforeEach(async ({ context }) => {
  leaks = await forbidRealApis(context);
  await freezeClock(context);
  await stubAudio(context);
  await mockQuranText(context);
  verse = await mockVerse(context);
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

type Hooks = { srcs: string[]; rates: number[]; fail: boolean; playError: string | null; stall: boolean; duration: number; tick(t: number): void | Promise<void>; end(): void | Promise<void>; emit(n: string): void };
const A = (page: Page) => page.evaluate(() => ({ ...(window as unknown as { __audio: Hooks }).__audio }));
const hook = <K extends keyof Hooks>(page: Page, k: K, v: Hooks[K]) => page.evaluate(([key, val]) => (((window as unknown as { __audio: Record<string, unknown> }).__audio[key as string]) = val), [k, v] as const);
const tick = (page: Page, t: number) => page.evaluate((x) => (window as unknown as { __audio: Hooks }).__audio.tick(x), t);
const end = (page: Page) => page.evaluate(() => (window as unknown as { __audio: Hooks }).__audio.end());
const store = async (page: Page, key: string) => {
  const v = (await readStorage(page))[key];
  return v ? (JSON.parse(v) as Record<string, unknown>) : null;
};
const url = (reciter: number, s: number, a: number) => `https://audio.test/Data/${reciter}/${s}_${a}.mp3`;
const pageAyahs = (p: number) => pageSegments(p)!.flatMap((g) => Array.from({ length: g.to - g.from + 1 }, (_, i) => ({ s: g.surah, a: g.from + i })));
const name = (s: number) => SURAH_ROWS[s - 1]!.name;
const mark = (page: Page, s: number, a: number) => page.locator(`[data-testid="ayah-text"][data-surah="${s}"][data-ayah="${a}"]`);
const TWO = Array.from({ length: 604 }, (_, i) => i + 1).find((p) => pageSegments(p)!.length === 2 && !pageSegments(p)![0]!.starts && pageSegments(p)![1]!.starts)!;

async function openPage(page: Page, p: number) {
  await page.goto(`/per-page-read?page=${p}`);
  await expect(page.getByTestId("page-frame")).toBeVisible();
}
async function openSheet(page: Page) {
  await page.getByTestId("mini-open").click();
  await expect(page.getByTestId("player-sheet")).toBeVisible();
}

test.describe("Play page", () => {
  test("plays the page's ayahs in order as one queue: the first file, 'Pause page', the page's title and 'ayah 1 of N', the highlight; opening the page plays nothing", async ({ page }) => {
    await openPage(page, 3);
    expect((await A(page)).srcs).toEqual([]);
    await expect(page.getByTestId("mini-player")).toHaveCount(0);
    const list = pageAyahs(3);
    await page.getByTestId("play-page").click();
    await expect(page.getByTestId("play-page")).toHaveText("Pause page");
    await expect(page.getByTestId("play-page")).toHaveAttribute("aria-pressed", "true");
    // the button turns to "Pause page" while the first file is still being looked up; the element is asked to play a moment later
    await expect.poll(async () => (await A(page)).srcs).toEqual([url(1, list[0]!.s, list[0]!.a)]);
    await expect(page.getByTestId("mini-title")).toHaveText("Page 3");
    await expect(page.getByTestId("mini-status")).toHaveText(`${name(list[0]!.s)} ${list[0]!.s}:${list[0]!.a} · ayah 1 of ${list.length}`);
    await expect(mark(page, list[0]!.s, list[0]!.a)).toHaveAttribute("aria-current", "true");
    await expect(mark(page, list[0]!.s, list[0]!.a)).toHaveClass(/ayah-playing/);
    expect(await page.locator('[aria-current="true"]').count()).toBe(1);
  });

  test("when an ayah ends the next one starts at once (no pause between files), the highlight moves, and exactly one ayah ahead is fetched", async ({ page }) => {
    await openPage(page, 3);
    const list = pageAyahs(3);
    await page.getByTestId("play-page").click();
    await expect.poll(() => verse.audioFetches).toEqual([url(1, list[1]!.s, list[1]!.a)]); // one ahead, not two
    await end(page);
    await expect.poll(async () => (await A(page)).srcs.at(-1)).toBe(url(1, list[1]!.s, list[1]!.a));
    await expect(mark(page, list[1]!.s, list[1]!.a)).toHaveAttribute("aria-current", "true");
    await expect(mark(page, list[0]!.s, list[0]!.a)).not.toHaveAttribute("aria-current", "true");
    await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Pause"); // never paused in between
    await expect.poll(() => verse.audioFetches.length).toBe(2);
    expect(verse.audioFetches[1]).toBe(url(1, list[2]!.s, list[2]!.a));
  });

  test("it plays on through the whole page, stops after the last ayah (and does not carry on to the next page), and the place goes back to the first ayah", async ({ page }) => {
    await openPage(page, 3);
    const list = pageAyahs(3);
    await page.getByTestId("play-page").click();
    for (let i = 1; i < list.length; i++) {
      await end(page);
      await expect.poll(async () => (await A(page)).srcs.length).toBe(i + 1);
    }
    expect((await A(page)).srcs).toEqual(list.map((x) => url(1, x.s, x.a)));
    await end(page); // the last ayah ends
    await expect(page.getByTestId("play-page")).toHaveText("Play page");
    await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Play");
    expect((await A(page)).srcs).toHaveLength(list.length);
    expect(await store(page, "quran:audio-queue:v1")).toMatchObject({ v: 1, kind: "page", ref: { page: 3 }, index: 0, position: 0, reciter: AYAH_RECITERS[0] });
    expect(await store(page, "quran:audio-resume:v1")).toBeNull(); // the legacy record is not touched by a queue
  });

  test("a page that crosses into the next surah plays on into it, and says the new surah in the status line", async ({ page }) => {
    await openPage(page, TWO);
    const list = pageAyahs(TWO);
    const cross = list.findIndex((x, i) => i > 0 && x.s !== list[i - 1]!.s);
    await page.getByTestId("play-page").click();
    for (let i = 0; i < cross; i++) {
      await end(page);
      await expect.poll(async () => (await A(page)).srcs.length).toBe(i + 2);
    }
    expect((await A(page)).srcs.at(-1)).toBe(url(1, list[cross]!.s, list[cross]!.a));
    expect(list[cross]!.a).toBe(1);
    await expect(page.getByTestId("mini-status")).toHaveText(`${name(list[cross]!.s)} ${list[cross]!.s}:1 · ayah ${cross + 1} of ${list.length}`);
  });

  test("the sheet shows the queue: 'ayah 3 of N', Previous and Next ayah, no repeat switch, the reciter note says it carries on, and a Follow audio switch", async ({ page }) => {
    await openPage(page, 3);
    const list = pageAyahs(3);
    await page.getByTestId("play-page").click();
    await openSheet(page);
    await expect(page.getByTestId("player-title")).toHaveText("Page 3");
    await expect(page.getByTestId("player-queue-line")).toHaveText(`${name(list[0]!.s)} ${list[0]!.s}:${list[0]!.a} · ayah 1 of ${list.length}`);
    await expect(page.getByTestId("player-prev")).toHaveAccessibleName("Previous ayah");
    await expect(page.getByTestId("player-prev")).toHaveAttribute("aria-disabled", "true");
    await page.getByTestId("player-next").click();
    await expect(page.getByTestId("player-queue-line")).toContainText("ayah 2 of");
    await page.getByTestId("player-prev").click();
    await expect(page.getByTestId("player-queue-line")).toContainText("ayah 1 of");
    await expect(page.getByTestId("player-repeat")).toHaveCount(0);
    await expect(page.getByTestId("player-auto")).toHaveCount(0);
    await expect(page.getByTestId("reciter-note")).toHaveText("Switching reciter plays this ayah again and carries on.");
    await expect(page.getByTestId("player-follow")).toBeVisible();
    await page.getByTestId("reciter-chip").filter({ hasText: AYAH_RECITERS[2] }).click();
    await expect.poll(async () => (await A(page)).srcs.at(-1)).toBe(url(3, list[0]!.s, list[0]!.a));
    await expect(page.getByTestId("player-queue-line")).toContainText("ayah 1 of"); // the same ayah, by the new reciter, and it carries on
  });

  test("Media Session: the ayah's reference is the title, the reciter the artist and the page the album (where the browser has the API)", async ({ page }) => {
    await openPage(page, 3);
    const has = await page.evaluate(() => "mediaSession" in navigator);
    test.skip(!has, "this browser has no Media Session");
    const list = pageAyahs(3);
    await page.getByTestId("play-page").click();
    const read = () => page.evaluate(() => ({ t: navigator.mediaSession.metadata?.title, a: navigator.mediaSession.metadata?.artist, al: navigator.mediaSession.metadata?.album }));
    expect(await read()).toEqual({ t: `${name(list[0]!.s)} ${list[0]!.s}:${list[0]!.a}`, a: AYAH_RECITERS[0], al: "Page 3" });
    await end(page);
    await expect.poll(async () => (await read()).t).toBe(`${name(list[1]!.s)} ${list[1]!.s}:${list[1]!.a}`);
  });

  test("the queue keeps playing when you go to another page; that page's button says Play page, and pressing it replaces the queue", async ({ page }) => {
    await openPage(page, 3);
    await page.getByTestId("play-page").click();
    await page.getByTestId("next-page").click();
    await expect(page.getByTestId("per-page-title")).toHaveText("Page 4");
    await expect(page.getByTestId("play-page")).toHaveText("Play page");
    await expect(page.getByTestId("mini-title")).toHaveText("Page 3");
    await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Pause");
    await page.getByTestId("play-page").click();
    await expect(page.getByTestId("mini-title")).toHaveText("Page 4");
    const first = pageAyahs(4)[0]!;
    await expect.poll(async () => (await A(page)).srcs.at(-1)).toBe(url(1, first.s, first.a));
    await page.getByTestId("prev-page").click();
    await expect(page.getByTestId("play-page")).toHaveText("Play page"); // page 3's queue was replaced
  });
});

test.describe("a failed ayah in a queue", () => {
  test("is asked for once more, then the queue STOPS on it: the message names the ayah, with Try again and Skip, in the mini player and the sheet; Skip goes on to the next ayah and the failed one is never played", async ({ page }) => {
    await openPage(page, 3);
    const list = pageAyahs(3);
    await page.getByTestId("play-page").click();
    await hook(page, "fail", true);
    await end(page); // the second ayah is next, and it fails
    const msg = `Couldn’t play ayah ${list[1]!.s}:${list[1]!.a}. Audio needs a connection unless it was downloaded.`;
    await expect(page.getByTestId("mini-status")).toHaveText(msg);
    await expect(page.getByTestId("mini-retry")).toBeVisible();
    await expect(page.getByTestId("mini-skip")).toHaveText("Skip this ayah");
    await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Play"); // stopped, not spinning
    const srcsAfterFail = (await A(page)).srcs;
    expect(srcsAfterFail.filter((s) => s === url(1, list[1]!.s, list[1]!.a))).toHaveLength(2); // the try and the automatic second try
    await openSheet(page);
    await expect(page.getByTestId("player-status")).toHaveText(msg);
    await expect(page.getByTestId("player-skip")).toBeVisible();
    await hook(page, "fail", false);
    await page.getByTestId("player-skip").click();
    await expect.poll(async () => (await A(page)).srcs.at(-1)).toBe(url(1, list[2]!.s, list[2]!.a));
    await expect(page.getByTestId("player-queue-line")).toContainText("ayah 3 of");
    expect((await A(page)).srcs).not.toContain(url(1, list[1]!.s, list[1]!.a) + "played");
    await expect(page.getByTestId("player-skip")).toHaveCount(0);
  });

  test("Try again plays the failed ayah and the queue carries on from it", async ({ page }) => {
    await openPage(page, 3);
    const list = pageAyahs(3);
    await page.getByTestId("play-page").click();
    await hook(page, "fail", true);
    await end(page);
    await expect(page.getByTestId("mini-retry")).toBeVisible();
    await hook(page, "fail", false);
    await page.getByTestId("mini-retry").click();
    await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Pause");
    await expect(mark(page, list[1]!.s, list[1]!.a)).toHaveAttribute("aria-current", "true");
    await end(page);
    await expect.poll(async () => (await A(page)).srcs.at(-1)).toBe(url(1, list[2]!.s, list[2]!.a));
  });
});

test.describe("a queue's saved place", () => {
  test("is its own key in the documented shape (and the legacy resume record is not touched); after a reload the mini player shows the queue PAUSED and nothing plays until a tap; Play goes on from that ayah", async ({ page }) => {
    await openPage(page, 3);
    const list = pageAyahs(3);
    await page.getByTestId("play-page").click();
    await end(page);
    await expect.poll(async () => (await A(page)).srcs.length).toBe(2);
    await tick(page, 12);
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    const rec = (await store(page, "quran:audio-queue:v1"))!;
    expect(Object.keys(rec)).toEqual(["v", "kind", "ref", "index", "reciter", "position", "savedAt"]);
    expect(rec).toMatchObject({ v: 1, kind: "page", ref: { page: 3 }, index: 1, reciter: AYAH_RECITERS[0], position: 12 });
    expect(JSON.stringify(rec)).not.toContain("items");
    expect(await store(page, "quran:audio-resume:v1")).toBeNull();
    await page.reload();
    await expect(page.getByTestId("page-frame")).toBeVisible();
    await expect(page.getByTestId("mini-title")).toHaveText("Page 3");
    await expect(page.getByTestId("mini-status")).toHaveText("Paused at 0:12");
    await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Play");
    expect((await A(page)).srcs).toEqual([]); // nothing plays on its own
    await openSheet(page);
    await expect(page.getByTestId("resume-line")).toContainText("Resume where you stopped · Page 3 · ayah 2 of");
    await page.getByTestId("resume-line").click();
    await expect.poll(async () => (await A(page)).srcs).toEqual([url(1, list[1]!.s, list[1]!.a)]);
  });

  test("starting a surah afterwards clears the queue's record, so a reload shows the surah; a surah's legacy record and a queue's record never both drive the player", async ({ page }) => {
    await openPage(page, 3);
    await page.getByTestId("play-page").click();
    await tick(page, 5);
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    expect(await store(page, "quran:audio-queue:v1")).not.toBeNull();
    await page.goto("/surah-listing");
    await page.getByTestId("surah-row-1").getByTestId("row-play").click();
    await expect(page.getByTestId("mini-title")).toHaveText("Al-Faatiha");
    expect(await store(page, "quran:audio-queue:v1")).toBeNull();
    await tick(page, 7);
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    await page.reload();
    await expect(page.getByTestId("mini-title")).toHaveText("Al-Faatiha");
  });

  test("a saved queue that no longer exists (a bad page number) is ignored and the legacy record is used", async ({ page, context }) => {
    await seed(context, {
      "quran:audio-queue:v1": JSON.stringify({ v: 1, kind: "page", ref: { page: 9999 }, index: 0, reciter: AYAH_RECITERS[0], position: 3, savedAt: 1 }),
      "quran:audio-resume:v1": JSON.stringify({ url: "x", position: 20, nowPlaying: { type: "surah", surahNo: 18, title: "Al-Kahf", subtitle: AYAH_RECITERS[1], reciter: AYAH_RECITERS[1] } }),
    });
    await page.goto("/surah-listing");
    await expect(page.getByTestId("mini-title")).toHaveText("Al-Kahf");
    await expect(page.getByTestId("mini-status")).toHaveText("Paused at 0:20");
  });
});

test.describe("Listen to this chapter", () => {
  test("plays the chapter's passages in order as a queue: the first ayah, 'Pause', the chapter's title, 'ayah 1 of 17', the highlight; opening the story plays nothing", async ({ page }) => {
    await page.goto("/stories/yusufstory");
    await expect(page.getByTestId("chapter-title")).toBeVisible();
    expect((await A(page)).srcs).toEqual([]);
    await expect(page.getByTestId("mini-player")).toHaveCount(0);
    const title = (await page.getByTestId("chapter-title").textContent())!;
    const listen = page.getByTestId("listen");
    await expect(listen).toHaveText("Listen to this chapter");
    await listen.click();
    await expect(listen).toHaveText("Pause");
    await expect(listen).toHaveAttribute("aria-pressed", "true");
    expect((await A(page)).srcs).toEqual([url(1, 12, 4)]);
    await expect(page.getByTestId("mini-title")).toHaveText(title);
    await expect(page.getByTestId("mini-status")).toHaveText("Yusuf 12:4 · ayah 1 of 17");
    const first = page.locator('[data-testid="story-ayah"][data-surah="12"][data-n="4"]');
    await expect(first).toHaveAttribute("aria-current", "true");
    await expect(first).toHaveClass(/ayah-playing/);
    await end(page);
    await expect.poll(async () => (await A(page)).srcs.at(-1)).toBe(url(1, 12, 5));
    await expect(page.locator('[data-testid="story-ayah"][data-surah="12"][data-n="5"]')).toHaveAttribute("aria-current", "true");
    await expect(first).not.toHaveAttribute("aria-current", "true");
    await expect(page.getByTestId("mini-status")).toHaveText("Yusuf 12:5 · ayah 2 of 17");
  });

  test("it plays the WHOLE chapter even though the page shows the first eight ayahs, and stops after the last (12:20)", async ({ page }) => {
    await page.goto("/stories/yusufstory");
    await expect(page.getByTestId("chapter-title")).toBeVisible();
    await page.getByTestId("listen").click();
    for (let i = 1; i < 17; i++) {
      await end(page);
      await expect.poll(async () => (await A(page)).srcs.length).toBe(i + 1);
    }
    expect((await A(page)).srcs.at(-1)).toBe(url(1, 12, 20));
    await end(page);
    await expect(page.getByTestId("listen")).toHaveText("Listen to this chapter");
    expect((await A(page)).srcs).toHaveLength(17);
    expect(await store(page, "quran:audio-queue:v1")).toMatchObject({ kind: "story", ref: { storyId: "yusufstory", chapter: 0 }, index: 0, position: 0 });
  });

  test("the queue's saved place names the story and the chapter (never the ayahs); after a reload it is rebuilt from the data and shown paused", async ({ page }) => {
    await page.goto("/stories/yusufstory");
    await expect(page.getByTestId("chapter-title")).toBeVisible();
    const title = (await page.getByTestId("chapter-title").textContent())!;
    await page.getByTestId("listen").click();
    await end(page);
    await expect.poll(async () => (await A(page)).srcs.length).toBe(2);
    await tick(page, 9);
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    const rec = (await store(page, "quran:audio-queue:v1"))!;
    expect(rec).toMatchObject({ v: 1, kind: "story", ref: { storyId: "yusufstory", chapter: 0 }, index: 1, position: 9 });
    expect(JSON.stringify(rec)).not.toContain("items");
    await page.goto("/surah-listing");
    await expect(page.getByTestId("mini-title")).toHaveText(title);
    await expect(page.getByTestId("mini-status")).toHaveText("Paused at 0:09");
    expect((await A(page)).srcs).toEqual([]);
    await page.getByTestId("mini-toggle").click();
    await expect.poll(async () => (await A(page)).srcs).toEqual([url(1, 12, 5)]);
  });

  test("another chapter's Listen is its own queue; a queue for chapter 1 does not make chapter 2 look as if it were playing", async ({ page }) => {
    await page.goto("/stories/yusufstory");
    await expect(page.getByTestId("chapter-title")).toBeVisible();
    await page.getByTestId("listen").click();
    await page.getByTestId("next").click();
    await expect(page.getByTestId("chapter-eyebrow")).toHaveText("Chapter 2 of 4");
    await expect(page.getByTestId("listen")).toHaveText("Listen to this chapter");
    await expect(page.getByTestId("listen")).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Pause"); // chapter 1 is still playing
  });
});

test.describe("dark mode, a phone, and no storage of the player's work elsewhere", () => {
  test("dark theme: the playing ayah in the page frame is readable", async ({ page, context }) => {
    await seed(context, { themeMode: "dark" });
    await openPage(page, 3);
    await page.getByTestId("play-page").click();
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
    expect(await page.locator(".ayah-playing").count()).toBe(1);
    expect(await idbNames(page)).not.toContain("quran-app-db");
  });
  test.describe("375px", () => {
    test.use({ viewport: { width: 375, height: 800 }, hasTouch: true });
    test("Play page and Listen are 44px, nothing scrolls sideways, and the queue's mini player and sheet fit", async ({ page }) => {
      const noScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      await openPage(page, 3);
      expect((await page.getByTestId("play-page").boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      await page.getByTestId("play-page").click();
      expect(await noScroll()).toBe(true);
      await openSheet(page);
      await expect(page.getByTestId("player-sheet")).toHaveAttribute("data-side", "bottom");
      expect(await noScroll()).toBe(true);
      await page.keyboard.press("Escape");
      await page.goto("/stories/yusufstory");
      await expect(page.getByTestId("chapter-title")).toBeVisible();
      expect((await page.getByTestId("listen").boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      expect(await noScroll()).toBe(true);
    });
    test("the mini player's failed-ayah message wraps onto two lines and both buttons stay on screen", async ({ page }) => {
      await openPage(page, 3);
      await page.getByTestId("play-page").click();
      await hook(page, "fail", true);
      await end(page);
      const status = page.getByTestId("mini-status");
      await expect(status).toContainText("Couldn’t play ayah");
      const fits = await status.evaluate((el) => {
        const lh = parseFloat(getComputedStyle(el).lineHeight);
        return { whole: el.scrollHeight <= el.clientHeight + 1, lines: Math.round(el.getBoundingClientRect().height / lh) };
      });
      expect(fits.whole).toBe(true);
      expect(fits.lines).toBeLessThanOrEqual(2);
      for (const id of ["mini-retry", "mini-skip"]) {
        const b = (await page.getByTestId(id).boundingBox())!;
        expect(b.height, id).toBeGreaterThanOrEqual(43.5);
        expect(b.x, id).toBeGreaterThanOrEqual(0);
        expect(b.x + b.width, id).toBeLessThanOrEqual(375);
        expect(b.y + b.height, id).toBeLessThanOrEqual(800);
      }
    });
  });
});
