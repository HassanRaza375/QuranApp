// Phase 4C: one ayah's audio in the reader, the playing-ayah highlight, "Follow audio", and the Asma-ul-Husna name clips, in a real browser on the
// production build. The audio element is a stand-in; the per-ayah endpoint is mocked with synthetic recording urls on a test host. Every unmocked
// request to a real API fails the test; the clock is fixed. See docs/phases/phase-04c-ayah-audio.md.
import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { AYAH_RECITERS, forbidRealApis, freezeClock, mockQuranText, mockVerse, readStorage, seed, stubAudio, type VerseMock } from "./mocks";

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

type Hooks = { srcs: string[]; rates: number[]; fail: boolean; playError: string | null; stall: boolean; duration: number; tick(t: number): void; end(): void | Promise<void>; emit(n: string): void };
const A = (page: Page) => page.evaluate(() => ({ ...(window as unknown as { __audio: Hooks }).__audio }));
const hook = <K extends keyof Hooks>(page: Page, k: K, v: Hooks[K]) => page.evaluate(([key, val]) => (((window as unknown as { __audio: Record<string, unknown> }).__audio[key as string]) = val), [k, v] as const);
const tick = (page: Page, t: number) => page.evaluate((x) => (window as unknown as { __audio: Hooks }).__audio.tick(x), t);
const end = (page: Page) => page.evaluate(() => (window as unknown as { __audio: Hooks }).__audio.end());
const store = async (page: Page, key: string) => {
  const v = (await readStorage(page))[key];
  return v ? (JSON.parse(v) as Record<string, unknown>) : null;
};
const noScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const url = (reciter: number, s: number, a: number) => `https://audio.test/Data/${reciter}/${s}_${a}.mp3`;
const row = (page: Page, n: number) => page.getByTestId(`ayah-${n}`);
const playBtn = (page: Page, n: number) => row(page, n).getByTestId("ayah-play");
async function open(page: Page, p = "/surah/2") {
  await page.goto(p);
  await expect(page.getByTestId("reader-title")).toBeVisible();
  await expect(row(page, 1)).toBeAttached();
}
async function openSheet(page: Page) {
  await page.getByTestId("mini-open").click();
  await expect(page.getByTestId("player-sheet")).toBeVisible();
}
const inView = (page: Page, n: number) => page.evaluate((id) => { const r = document.getElementById(`ayah-${id}`)!.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; }, n);

test.describe("the reader's play button", () => {
  test("every row has Play ayah N; opening the reader plays nothing and asks the endpoint for nothing", async ({ page }) => {
    await open(page);
    await expect(playBtn(page, 5)).toHaveAccessibleName("Play ayah 5");
    await expect(playBtn(page, 286)).toHaveAccessibleName("Play ayah 286");
    expect(await page.getByTestId("ayah-play").count()).toBe(286);
    expect((await A(page)).srcs).toEqual([]);
    expect(verse.calls).toEqual([]);
    await expect(page.getByTestId("mini-player")).toHaveCount(0);
  });

  test("pressing it plays that ayah's file (from the per-ayah endpoint, by the preferred reciter), highlights the row, and the mini player says what it is; pressing again pauses", async ({ page }) => {
    await open(page);
    await playBtn(page, 5).click();
    await expect(playBtn(page, 5)).toHaveAccessibleName("Pause ayah 5");
    await expect(playBtn(page, 5)).toHaveAttribute("aria-pressed", "true");
    expect((await A(page)).srcs).toEqual([url(1, 2, 5)]);
    expect(verse.calls).toEqual(["2:5"]);
    await expect(row(page, 5)).toHaveAttribute("aria-current", "true");
    await expect(row(page, 5)).toHaveClass(/ayah-playing/);
    await expect(row(page, 6)).not.toHaveAttribute("aria-current", "true");
    await expect(page.getByTestId("mini-title")).toHaveText("Al-Baqara 2:5");
    await expect(page.getByTestId("mini-status")).toHaveText(`Recited by ${AYAH_RECITERS[0]}`);
    await playBtn(page, 5).click(); // pause
    await expect(playBtn(page, 5)).toHaveAccessibleName("Play ayah 5");
    await expect(row(page, 5)).toHaveAttribute("aria-current", "true"); // still the current ayah
    await playBtn(page, 5).click(); // play on (the same file: no new request for the url)
    await expect(playBtn(page, 5)).toHaveAccessibleName("Pause ayah 5");
    expect(verse.calls).toEqual(["2:5"]);
    await playBtn(page, 9).click(); // another ayah: the highlight moves
    await expect(row(page, 9)).toHaveAttribute("aria-current", "true");
    await expect(row(page, 5)).not.toHaveAttribute("aria-current", "true");
    await expect(playBtn(page, 5)).toHaveAccessibleName("Play ayah 5");
    expect((await A(page)).srcs.at(-1)).toBe(url(1, 2, 9));
  });

  test("the reciter chosen in Settings (or the listing) is the one that recites", async ({ page, context }) => {
    await seed(context, { reciter: JSON.stringify({ reciter: AYAH_RECITERS[4] }) });
    await open(page);
    await playBtn(page, 3).click();
    await expect.poll(async () => (await A(page)).srcs.at(-1)).toBe(url(5, 2, 3));
    await expect(page.getByTestId("mini-status")).toHaveText(`Recited by ${AYAH_RECITERS[4]}`);
  });

  test("a surah playing as a whole file highlights no ayah (there is no per-ayah timing in that file); another surah's ayah highlights nothing here", async ({ page }) => {
    await open(page, "/surah/2");
    await page.getByTestId("play-surah").click();
    await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Pause");
    expect(await page.locator('[aria-current="true"]').count()).toBe(0);
    await page.goto("/surah/3");
    await expect(row(page, 1)).toBeAttached();
    await playBtn(page, 4).click();
    await expect(row(page, 4)).toHaveAttribute("aria-current", "true");
    await page.goto("/surah/2");
    await expect(row(page, 1)).toBeAttached();
    expect(await page.locator('[aria-current="true"]').count()).toBe(0); // ayah 4 of surah 3 is not an ayah of this page
  });

  test("an ayah writes no saved place: not the legacy resume record, not the queue record", async ({ page }) => {
    await open(page);
    await playBtn(page, 5).click();
    await tick(page, 3);
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    await playBtn(page, 5).click(); // pause
    expect(await store(page, "quran:audio-resume:v1")).toBeNull();
    expect(await store(page, "quran:audio-queue:v1")).toBeNull();
  });

  test("a failed ayah is asked for once more, then says which ayah with Try again (and no Skip: there is no queue); Try again plays it", async ({ page }) => {
    await open(page);
    await hook(page, "fail", true);
    await playBtn(page, 5).click();
    await expect(page.getByTestId("mini-status")).toHaveText("Couldn’t play ayah 2:5. Audio needs a connection unless it was downloaded.");
    expect((await A(page)).srcs.length).toBe(2); // the first try and the automatic second try
    await expect(page.getByTestId("mini-retry")).toBeVisible();
    await expect(page.getByTestId("mini-skip")).toHaveCount(0);
    await hook(page, "fail", false);
    await page.getByTestId("mini-retry").click();
    await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Pause");
    await expect(row(page, 5)).toHaveAttribute("aria-current", "true");
  });
});

test.describe("the sheet while an ayah plays", () => {
  test("Previous and Next are ayahs (named so), disabled at ayah 1; Repeat is 'Repeat this ayah' and replays it; there is no 'next surah' switch", async ({ page }) => {
    await open(page);
    await playBtn(page, 1).click();
    await openSheet(page);
    await expect(page.getByTestId("player-title")).toHaveText("Al-Baqara 2:1");
    await expect(page.getByTestId("player-prev")).toHaveAccessibleName("Previous ayah");
    await expect(page.getByTestId("player-next")).toHaveAccessibleName("Next ayah");
    await expect(page.getByTestId("player-prev")).toHaveAttribute("aria-disabled", "true");
    await page.getByTestId("player-next").click();
    await expect(page.getByTestId("player-title")).toHaveText("Al-Baqara 2:2");
    await page.getByTestId("player-prev").click();
    await expect(page.getByTestId("player-title")).toHaveText("Al-Baqara 2:1");
    await expect(page.getByTestId("player-auto")).toHaveCount(0);
    await expect(page.getByText("Repeat this ayah")).toBeVisible();
    await page.getByTestId("player-repeat").click();
    const before = (await A(page)).srcs.length;
    await end(page);
    await expect.poll(async () => (await A(page)).srcs.length).toBe(before + 1); // the same ayah again
    expect((await A(page)).srcs.at(-1)).toBe(url(1, 2, 1));
    expect((await store(page, "quran:audio-prefs:v1"))!.repeatOne).toBe(true);
  });

  test("the reciter note says what a switch does BEFORE it happens ('plays this ayah again'); switching plays this ayah by the new reciter", async ({ page }) => {
    await open(page);
    await playBtn(page, 7).click();
    await openSheet(page);
    await expect(page.getByTestId("reciter-note")).toHaveText("Switching reciter plays this ayah again.");
    await page.getByTestId("reciter-chip").filter({ hasText: AYAH_RECITERS[3] }).click();
    await expect.poll(async () => (await A(page)).srcs.at(-1)).toBe(url(4, 2, 7));
    await expect(page.getByTestId("player-sub")).toHaveText(`Recited by ${AYAH_RECITERS[3]}`);
  });

  test("the surah-only switch comes back for a surah: 'Play the next surah automatically' and 'Repeat this recitation'", async ({ page }) => {
    await open(page);
    await page.getByTestId("play-surah").click();
    await openSheet(page);
    await expect(page.getByTestId("player-auto")).toBeVisible();
    await expect(page.getByText("Repeat this recitation")).toBeVisible();
    await expect(page.getByTestId("player-follow")).toHaveCount(0); // "Follow audio" is for ayahs and queues
  });

  test("Media Session: the ayah's reference is the title and the reciter the artist (where the browser has the API)", async ({ page }) => {
    await open(page);
    const has = await page.evaluate(() => "mediaSession" in navigator);
    test.skip(!has, "this browser has no Media Session");
    await playBtn(page, 255).click();
    const read = () => page.evaluate(() => ({ t: navigator.mediaSession.metadata?.title, a: navigator.mediaSession.metadata?.artist, al: navigator.mediaSession.metadata?.album, s: navigator.mediaSession.playbackState }));
    expect(await read()).toEqual({ t: "Al-Baqara 2:255", a: AYAH_RECITERS[0], al: "Quran App", s: "playing" });
  });
});

test.describe("Follow audio", () => {
  async function scrollAwayThenNext(page: Page) {
    await playBtn(page, 1).click();
    await expect(row(page, 1)).toHaveAttribute("aria-current", "true");
    await page.evaluate(() => window.scrollTo(0, 30000));
    await openSheet(page);
    await page.getByTestId("player-next").click();
    await expect(page.getByTestId("player-title")).toHaveText("Al-Baqara 2:2");
    await page.keyboard.press("Escape");
  }

  test("it is off by default: the switch reads off and the page stays where you scrolled to when the ayah changes", async ({ page }) => {
    await open(page);
    await playBtn(page, 1).click();
    await openSheet(page);
    await expect(page.getByTestId("player-follow")).toHaveAttribute("aria-checked", "false");
    await page.keyboard.press("Escape");
    await scrollAwayThenNext(page);
    expect(await inView(page, 2)).toBe(false);
  });

  test("when it is on, the playing ayah is brought into view only when it is not already fully visible; the switch writes its own additive key", async ({ page }) => {
    await open(page);
    await playBtn(page, 1).click();
    await openSheet(page);
    await page.getByTestId("player-follow").click();
    await expect(page.getByTestId("player-follow")).toHaveAttribute("aria-checked", "true");
    expect(await store(page, "quran:player-prefs:v1")).toEqual({ followAyah: true });
    expect(await store(page, "quran:audio-prefs:v1")).toBeNull(); // the legacy record is not touched
    await page.keyboard.press("Escape");
    await scrollAwayThenNext(page);
    await expect.poll(() => inView(page, 2)).toBe(true);
    // already in view: the page does not move
    const y = await page.evaluate(() => window.scrollY);
    await openSheet(page);
    await page.getByTestId("player-next").click();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("player-title")).toHaveCount(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(y);
  });

  test("while Reduce motion is on it never follows: the switch is off and disabled, says why, and the page does not move", async ({ page, context }) => {
    await seed(context, { "quran:player-prefs:v1": JSON.stringify({ followAyah: true }), "quran:accessibility:v1": JSON.stringify({ reducedMotion: true }) });
    await open(page);
    await playBtn(page, 1).click();
    await openSheet(page);
    await expect(page.getByTestId("player-follow")).toHaveAttribute("aria-checked", "false");
    await expect(page.getByTestId("player-follow")).toBeDisabled();
    await expect(page.getByTestId("follow-note")).toHaveText("Off while Reduce motion is on in Settings.");
    await page.keyboard.press("Escape");
    await scrollAwayThenNext(page);
    expect(await inView(page, 2)).toBe(false);
  });
});

test.describe("an Asma-ul-Husna name's recording", () => {
  const names = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "legacy/app/assets/data/names.json"), "utf8")) as Array<{ id: number; transliteration: string; audio: string }>;
  const nameOf = (id: number) => names.find((n) => n.id === id)!;

  test("Play in a name's sheet plays that name's own recording through the player (no reciter, no queue, nothing saved); a second press pauses", async ({ page }) => {
    await page.goto("/asma-ul-husna#name-12");
    await expect(page.getByTestId("name-sheet")).toBeVisible();
    const play = page.getByTestId("sheet-play");
    await expect(play).not.toHaveAttribute("aria-disabled", "true");
    await expect(page.getByTestId("sheet-play-reason")).toHaveCount(0);
    await play.click();
    await expect(play).toHaveText("Pause");
    expect((await A(page)).srcs).toEqual([nameOf(12).audio]);
    await expect(page.getByTestId("mini-title")).toHaveText(nameOf(12).transliteration);
    await expect(page.getByTestId("mini-status")).toHaveText("Asma-ul-Husna");
    await play.click();
    await expect(play).toHaveText("Play");
    expect(await store(page, "quran:audio-resume:v1")).toBeNull();
    expect(await store(page, "quran:audio-queue:v1")).toBeNull();
    await page.keyboard.press("Escape");
    await page.getByTestId("mini-open").click();
    await expect(page.getByTestId("reciter-note")).toHaveCount(0); // a clip has no reciter
    await expect(page.getByTestId("player-repeat")).toHaveCount(0);
    await expect(page.getByTestId("player-prev")).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByTestId("player-next")).toHaveAttribute("aria-disabled", "true");
  });

  test("the three names with no recording at the source (53, 93, 97) say so, with no fallback and nothing played", async ({ page }) => {
    for (const id of [53, 93, 97]) {
      await page.goto(`/asma-ul-husna#name-${id}`);
      await expect(page.getByTestId("name-sheet")).toBeVisible();
      const play = page.getByTestId("sheet-play");
      await expect(play).toHaveAttribute("aria-disabled", "true");
      await expect(page.getByTestId("sheet-play-reason")).toHaveText("No recording for this name");
      await expect(play).toHaveAccessibleDescription("No recording for this name");
      await play.click({ force: true });
      expect((await A(page)).srcs).toEqual([]);
      await expect(page.getByTestId("mini-player")).toHaveCount(0);
    }
  });

  test("every other name has a recording address, and these three ids are the ones the source does not have (404 on 2026-10-22)", async () => {
    expect(names.filter((n) => !n.audio).map((n) => n.id)).toEqual([]);
    const withAudio = names.filter((n) => ![53, 93, 97].includes(n.id));
    expect(withAudio).toHaveLength(96);
    for (const n of withAudio) expect(n.audio).toMatch(/^https:\/\/quranaudio\.myislam\.org\/audio\/99%20names%20of%20Allah\/audio\/\d+\./);
  });
});

test.describe("dark mode and a phone", () => {
  test("dark theme: the highlight is readable", async ({ page, context }) => {
    await seed(context, { themeMode: "dark" });
    await open(page);
    await playBtn(page, 5).click();
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
    await expect(row(page, 5)).toHaveClass(/ayah-playing/);
  });
  test.describe("375px", () => {
    test.use({ viewport: { width: 375, height: 800 }, hasTouch: true });
    test("every ayah's tools are still 44px with the new button, nothing scrolls sideways, and the sheet's new switch is 44px", async ({ page }) => {
      await open(page);
      expect(await noScroll(page)).toBe(true);
      for (const id of ["ayah-play", "ayah-save", "ayah-pin", "ayah-share"]) {
        const b = (await row(page, 1).getByTestId(id).boundingBox())!;
        expect(b.height, id).toBeGreaterThanOrEqual(43.5);
        expect(b.width, id).toBeGreaterThanOrEqual(43.5);
      }
      await playBtn(page, 1).click();
      await openSheet(page);
      await expect(page.getByTestId("player-sheet")).toHaveAttribute("data-side", "bottom");
      expect((await page.locator('label:has([data-testid="player-follow"])').boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      expect(await noScroll(page)).toBe(true);
    });
  });
});
