// Phase 4B: the full whole-surah player in a real browser, on the production build. The audio element is a stand-in that records what the page
// asked it to do and can be told to tick, end, stall, fail or refuse (no real sound is played here: real playback and the lock screen are
// device checks). Every unmocked request to a real API fails the test; the clock is fixed. See docs/phases/phase-04b-player.md.
import { expect, test, type Page } from "@playwright/test";
import { forbidRealApis, freezeClock, idbNames, mockQuranText, readStorage, seed, stubAudio } from "./mocks";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });
let leaks: string[] = [];
test.beforeEach(async ({ context }) => {
  leaks = await forbidRealApis(context);
  await freezeClock(context);
  await stubAudio(context);
  await mockQuranText(context);
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

type Hooks = { srcs: string[]; rates: number[]; fail: boolean; playError: string | null; stall: boolean; duration: number; tick(t: number): void | Promise<void>; end(): void | Promise<void>; emit(n: string): void };
const A = (page: Page) => page.evaluate(() => ({ ...(window as unknown as { __audio: Hooks }).__audio }));
const hook = <K extends keyof Hooks>(page: Page, k: K, v: Hooks[K]) => page.evaluate(([key, val]) => (((window as unknown as { __audio: Record<string, unknown> }).__audio[key as string]) = val), [k, v] as const);
const tick = (page: Page, t: number) => page.evaluate((x) => (window as unknown as { __audio: Hooks }).__audio.tick(x), t);
const end = (page: Page) => page.evaluate(() => (window as unknown as { __audio: Hooks }).__audio.end());
const emit = (page: Page, n: string) => page.evaluate((x) => (window as unknown as { __audio: Hooks }).__audio.emit(x), n);
const store = async (page: Page, key: string) => {
  const v = (await readStorage(page))[key];
  return v ? (JSON.parse(v) as Record<string, unknown>) : null;
};
const noScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const R = ["Mishary Rashid Al Afasy", "Abu Bakr Al Shatri", "Nasser Al Qatami", "Yasser Al Dosari", "Hani Ar Rifai"];
const RESUME = { "quran:audio-resume:v1": JSON.stringify({ url: "https://audio.test/old.mp3", position: 754, nowPlaying: { type: "surah", surahNo: 18, title: "Al-Kahf", subtitle: R[1], reciter: R[1] } }) };

async function openListing(page: Page) {
  await page.goto("/surah-listing");
  await expect(page.getByTestId("surah-row-1")).toBeVisible();
}
/** Starts surah n from the listing's own Play button, then lets the file say how long it is. */
async function start(page: Page, n = 1) {
  await page.getByTestId(`surah-row-${n}`).getByTestId("row-play").click();
  await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Pause");
}
async function openSheet(page: Page) {
  await page.getByTestId("mini-open").click();
  await expect(page.getByTestId("player-sheet")).toBeVisible();
}

test.describe("nothing plays by itself", () => {
  test("with a saved place, the mini player shows it PAUSED after a load and a reload; no file is requested and nothing plays", async ({ page, context }) => {
    await seed(context, RESUME);
    await openListing(page);
    await expect(page.getByTestId("mini-player")).toBeVisible();
    await expect(page.getByTestId("mini-title")).toHaveText("Al-Kahf");
    await expect(page.getByTestId("mini-status")).toHaveText("Paused at 12:34");
    await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Play");
    expect((await A(page)).srcs).toEqual([]);
    await page.reload();
    await expect(page.getByTestId("mini-status")).toHaveText("Paused at 12:34");
    expect((await A(page)).srcs).toEqual([]);
    // also on other pages
    await page.goto("/surah/2");
    await expect(page.getByTestId("reader-title")).toBeVisible();
    await expect(page.getByTestId("mini-status")).toHaveText("Paused at 12:34");
    expect((await A(page)).srcs).toEqual([]);
  });

  test("with nothing saved there is no mini player", async ({ page }) => {
    await openListing(page);
    await expect(page.getByTestId("mini-player")).toHaveCount(0);
  });

  test("a damaged or non-surah record is ignored (no mini player)", async ({ page, context }) => {
    await seed(context, { "quran:audio-resume:v1": JSON.stringify({ url: "x", position: 5, nowPlaying: { type: "ayah", surahNo: 2, title: "Al-Baqara", subtitle: "x" } }) });
    await openListing(page);
    await expect(page.getByTestId("mini-player")).toHaveCount(0);
  });

  test("Play on the restored item plays that surah by that reciter from the saved place, found by name (not the stored url)", async ({ page, context }) => {
    await seed(context, RESUME);
    await openListing(page);
    await page.getByTestId("mini-toggle").click();
    await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Pause");
    // the button turns to Pause while the file is still being looked up; the element is asked to play a moment later, so wait for it (a one-shot read failed once in a full run)
    await expect.poll(async () => (await A(page)).srcs).toHaveLength(1);
    const a = await A(page);
    expect(a.srcs[0]).toMatch(/\/2\/18\.mp3$/); // reciter 2 (Abu Bakr Al Shatri), surah 18
    expect(a.srcs[0]).not.toContain("audio.test");
  });
});

test.describe("the mini player and the sheet", () => {
  test("Play from the listing shows the mini player with a position line; tapping the title opens the sheet; Escape closes it and focus returns", async ({ page }) => {
    await openListing(page);
    await start(page, 1);
    await tick(page, 30);
    const open = page.getByTestId("mini-open");
    await open.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("player-sheet")).toBeVisible();
    await expect(page.getByTestId("player-title")).toHaveText("Al-Faatiha");
    await expect(page.getByTestId("player-sub")).toHaveText("Recited by Mishary Rashid Al Afasy");
    await expect(page.getByTestId("player-status")).toHaveText("Playing");
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("player-sheet")).toHaveCount(0);
    await expect(open).toBeFocused();
    expect(await noScroll(page)).toBe(true);
  });

  test("the thin progress line in the mini player follows the position", async ({ page }) => {
    await openListing(page);
    await start(page, 1);
    await tick(page, 900); // a quarter of 3600
    await expect.poll(() => page.getByTestId("mini-progress").evaluate((el) => (el as HTMLElement).style.width)).toBe("25%");
  });

  test("buffering is a visible state, and playing returns", async ({ page }) => {
    await openListing(page);
    await start(page, 1);
    await emit(page, "waiting");
    await expect(page.getByTestId("mini-status")).toHaveText("Buffering…");
    await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Pause");
    await emit(page, "playing");
    await expect(page.getByTestId("mini-status")).toHaveText("Recited by Mishary Rashid Al Afasy");
  });

  test("the sheet shows the resume line for a restored item and it plays from the saved place; the line goes away once playing", async ({ page, context }) => {
    await seed(context, RESUME);
    await openListing(page);
    await openSheet(page);
    const line = page.getByTestId("resume-line");
    await expect(line).toHaveText("Resume where you stopped · Al-Kahf · 12:34");
    await expect(page.getByTestId("player-slider")).toBeDisabled(); // nothing is loaded yet
    await line.click();
    await expect(page.getByTestId("player-status")).toHaveText("Playing");
    await expect(page.getByTestId("resume-line")).toHaveCount(0);
    expect((await A(page)).srcs[0]).toMatch(/\/2\/18\.mp3$/);
  });

  test("Save audio is a real, enabled button for a surah (with the size); it says what a saved surah covers, and does nothing until pressed", async ({ page }) => {
    await openListing(page);
    await start(page, 1);
    await openSheet(page);
    const save = page.getByTestId("player-save");
    expect(await save.evaluate((el) => el.tagName)).toBe("BUTTON");
    await expect(save).toBeEnabled();
    await expect(save).not.toHaveAttribute("aria-disabled", "true");
    await expect(save).toContainText("Save audio to listen offline · ");
    await expect(page.getByTestId("save-note")).toContainText("plays the whole recitation");
    expect((await A(page)).srcs).toHaveLength(1); // nothing was requested by showing it
  });
});

test.describe("seeking", () => {
  test("the position is a real slider with a spoken value; keys move it and the file follows; the labels show the time", async ({ page }) => {
    await openListing(page);
    await hook(page, "duration", 360);
    await start(page, 1);
    await openSheet(page);
    await tick(page, 80);
    const slider = page.getByTestId("player-slider");
    await expect(slider).toHaveAttribute("aria-label", "Position");
    await expect(slider).toHaveAttribute("aria-valuetext", "1 minute 20 seconds of 6 minutes");
    await expect(page.getByTestId("player-time")).toHaveText("1:20");
    await expect(page.getByTestId("player-duration")).toHaveText("6:00");
    await slider.focus();
    await page.keyboard.press("End");
    await expect.poll(() => page.evaluate(() => (window as unknown as { __audio: { srcs: string[] } }).__audio.srcs.length)).toBe(1);
    await expect(slider).toHaveAttribute("aria-valuetext", "6 minutes of 6 minutes");
    await page.keyboard.press("Home");
    await expect(slider).toHaveAttribute("aria-valuetext", "0 seconds of 6 minutes");
  });

  test("back 10 and forward 10 seconds; they wait until the length is known", async ({ page }) => {
    await openListing(page);
    await hook(page, "duration", 360);
    await start(page, 1);
    await openSheet(page);
    await tick(page, 100);
    await page.getByTestId("player-forward").click();
    await expect(page.getByTestId("player-time")).toHaveText("1:50");
    await page.getByTestId("player-back").click();
    await page.getByTestId("player-back").click();
    await expect(page.getByTestId("player-time")).toHaveText("1:30");
    await expect(page.getByTestId("player-back")).toHaveAttribute("aria-disabled", "false");
  });

  test("before the length is known the slider and the skip buttons are inert (a stalled load)", async ({ page }) => {
    await openListing(page);
    await hook(page, "stall", true);
    await page.getByTestId("surah-row-1").getByTestId("row-play").click();
    await openSheet(page);
    await expect(page.getByTestId("player-status")).toHaveText("Loading…");
    await expect(page.getByTestId("player-slider")).toBeDisabled();
    await expect(page.getByTestId("player-back")).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByTestId("player-forward")).toHaveAttribute("aria-disabled", "true");
  });
});

test.describe("speed, repeat, auto-next", () => {
  test("speed chips write the same value Settings uses, apply it, and a Settings value outside the chips shows as custom", async ({ page, context }) => {
    await seed(context, { "quran:audio-prefs:v1": JSON.stringify({ autoAdvance: true, future: 1 }) });
    await openListing(page);
    await start(page, 1);
    await openSheet(page);
    await expect(page.getByTestId("speed-1")).toHaveAttribute("aria-pressed", "true");
    await page.getByTestId("speed-1.5").click();
    await expect(page.getByTestId("speed-1.5")).toHaveAttribute("aria-pressed", "true");
    expect(await store(page, "quran:audio-prefs:v1")).toMatchObject({ playbackRate: 1.5, autoAdvance: true, future: 1 });
    expect(await page.evaluate(() => (window as unknown as { __audio: { rates: number[] } }).__audio.rates)).toEqual([1]); // the next play uses it
    await page.getByTestId("player-next").click();
    await expect.poll(async () => (await A(page)).rates.at(-1)).toBe(1.5);
  });

  test("a stored speed outside the five chips is shown as a custom chip, selected", async ({ page, context }) => {
    await seed(context, { "quran:audio-prefs:v1": JSON.stringify({ playbackRate: 0.5 }), ...RESUME });
    await openListing(page);
    await openSheet(page);
    await expect(page.getByTestId("speed-custom")).toContainText("0.5×");
    for (const r of [0.75, 1, 1.25, 1.5, 2]) await expect(page.getByTestId(`speed-${r}`)).toHaveAttribute("aria-pressed", "false");
  });

  test("Repeat writes repeatOne in the legacy key (all three fields) and replays the surah when it ends", async ({ page }) => {
    await openListing(page);
    await start(page, 1);
    await openSheet(page);
    await page.getByTestId("player-repeat").click();
    await expect(page.getByTestId("player-repeat")).toHaveAttribute("aria-checked", "true");
    expect(await store(page, "quran:audio-prefs:v1")).toEqual({ playbackRate: 1, repeatOne: true, autoAdvance: false });
    await end(page);
    await expect.poll(async () => (await A(page)).srcs.length).toBe(2); // play() again on the same file
    const srcs = (await A(page)).srcs;
    expect(srcs[1]).toBe(srcs[0]); // not another file
    await expect(page.getByTestId("player-status")).toHaveText("Playing");
    await page.getByTestId("player-repeat").click();
    expect((await store(page, "quran:audio-prefs:v1"))!.repeatOne).toBe(false);
  });

  test("auto-next is the Settings switch: it plays the next surah by the same reciter when one ends, and stops after 114", async ({ page, context }) => {
    await seed(context, { "quran:audio-prefs:v1": JSON.stringify({ playbackRate: 1, repeatOne: false, autoAdvance: true }) });
    await openListing(page);
    await start(page, 1);
    await openSheet(page);
    await expect(page.getByTestId("player-auto")).toHaveAttribute("aria-checked", "true");
    await end(page);
    await expect(page.getByTestId("player-title")).toHaveText("Al-Baqara");
    expect((await A(page)).srcs.at(-1)).toMatch(/\/1\/2\.mp3$/);
    await page.getByTestId("player-auto").click();
    expect((await store(page, "quran:audio-prefs:v1"))!.autoAdvance).toBe(false);
    await end(page);
    await expect(page.getByTestId("player-title")).toHaveText("Al-Baqara"); // off: it stops
    await expect(page.getByTestId("player-status")).toHaveText("Paused");
  });
});

test.describe("previous, next and the reciter", () => {
  test("Previous and Next move one surah; both are real buttons with aria-disabled at 1 and 114", async ({ page }) => {
    await openListing(page);
    await start(page, 1);
    await openSheet(page);
    await expect(page.getByTestId("player-prev")).toHaveAttribute("aria-disabled", "true");
    expect(await page.getByTestId("player-prev").evaluate((el) => el.tagName)).toBe("BUTTON");
    await page.getByTestId("player-prev").click({ force: true }); // aria-disabled: nothing happens
    await expect(page.getByTestId("player-title")).toHaveText("Al-Faatiha");
    await page.getByTestId("player-next").click();
    await expect(page.getByTestId("player-title")).toHaveText("Al-Baqara");
    await expect(page.getByTestId("player-prev")).toHaveAttribute("aria-disabled", "false");
    await page.getByTestId("player-prev").click();
    await expect(page.getByTestId("player-title")).toHaveText("Al-Faatiha");
  });

  test("at surah 114 Next is disabled (restored from a saved place)", async ({ page, context }) => {
    await seed(context, { "quran:audio-resume:v1": JSON.stringify({ url: "x", position: 5, nowPlaying: { type: "surah", surahNo: 114, title: "An-Nas", subtitle: R[0], reciter: R[0] } }) });
    await openListing(page);
    await openSheet(page);
    await expect(page.getByTestId("player-next")).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByTestId("player-prev")).toHaveAttribute("aria-disabled", "false");
    await page.getByTestId("player-next").click({ force: true });
    await expect(page.getByTestId("player-title")).toHaveText("An-Nas");
    expect((await A(page)).srcs).toEqual([]);
  });

  test("the sheet says that switching reciter restarts the surah BEFORE it happens; switching plays the new reciter's file from 0 and sets the preference", async ({ page }) => {
    await openListing(page);
    await start(page, 2);
    await tick(page, 300);
    await openSheet(page);
    await expect(page.getByTestId("reciter-note")).toHaveText("Switching reciter restarts this surah.");
    await expect(page.getByTestId("reciter-chip")).toHaveText(R);
    await page.getByTestId("reciter-chip").filter({ hasText: R[4] }).click();
    await expect.poll(async () => (await A(page)).srcs.at(-1)).toMatch(/\/5\/2\.mp3$/);
    await expect(page.getByTestId("player-sub")).toHaveText(`Recited by ${R[4]}`);
    await expect(page.getByTestId("player-time")).toHaveText("0:00");
    expect(JSON.parse((await readStorage(page))["reciter"]!)).toEqual({ reciter: R[4] });
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    await expect.poll(async () => (await store(page, "quran:audio-resume:v1"))?.nowPlaying).toMatchObject({ reciter: R[4], surahNo: 2 });
    expect(((await store(page, "quran:audio-resume:v1"))!.position as number)).toBeLessThan(5); // from the start of the new file, not 300
  });

  test("switching reciter while paused changes what Play will play and plays nothing", async ({ page, context }) => {
    await seed(context, RESUME);
    await openListing(page);
    await openSheet(page);
    await page.getByTestId("reciter-chip").filter({ hasText: R[3] }).click();
    await expect(page.getByTestId("player-sub")).toHaveText(`Recited by ${R[3]}`);
    expect((await A(page)).srcs).toEqual([]);
    expect((await store(page, "quran:audio-resume:v1"))).toMatchObject({ position: 0, nowPlaying: { reciter: R[3], surahNo: 18 } });
    await page.getByTestId("player-toggle").click();
    await expect.poll(async () => (await A(page)).srcs.at(-1)).toMatch(/\/4\/18\.mp3$/);
  });
});

test.describe("Space and the keyboard", () => {
  test("Space plays and pauses when focus is on the sheet's slider or the sheet itself; on a button it keeps that button's own action", async ({ page }) => {
    await openListing(page);
    await start(page, 1);
    await openSheet(page);
    const slider = page.getByTestId("player-slider");
    await expect(page.getByTestId("player-status")).toHaveText("Playing"); // not while it still says Loading…: Space would land on a file that is not playing yet
    await slider.focus();
    await page.keyboard.press("Space");
    await expect(page.getByTestId("player-status")).toHaveText(/Paused/);
    await page.keyboard.press("Space");
    await expect(page.getByTestId("player-status")).toHaveText("Playing");
    // on the Forward button Space is that button's (a skip), not a play toggle
    await tick(page, 50);
    await page.getByTestId("player-forward").focus();
    await page.keyboard.press("Space");
    await expect(page.getByTestId("player-status")).toHaveText("Playing");
    await expect(page.getByTestId("player-time")).toHaveText("1:00");
  });

  test("every control is reachable by keyboard in a sensible order, and nothing outside the sheet plays on a key", async ({ page }) => {
    await openListing(page);
    await start(page, 1);
    await openSheet(page);
    const order: string[] = [];
    await page.getByTestId("player-slider").focus();
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      order.push((await page.evaluate(() => document.activeElement?.getAttribute("data-testid") ?? "")) as string);
    }
    expect(order).toEqual(["player-prev", "player-back", "player-toggle", "player-forward", "player-next", "speed-0.75"]);
  });
});

test.describe("the saved place", () => {
  test("it is written in the legacy shape while playing (every 5 s), on pause, at the end (0) and on pagehide", async ({ page }) => {
    test.setTimeout(60000);
    await openListing(page);
    await start(page, 3);
    await tick(page, 42);
    await expect.poll(async () => (await store(page, "quran:audio-resume:v1"))?.position, { timeout: 8000 }).toBe(42); // the 5-second timer
    const rec = (await store(page, "quran:audio-resume:v1"))!;
    expect(Object.keys(rec)).toEqual(["url", "position", "nowPlaying"]);
    expect(rec.url).toMatch(/\/1\/3\.mp3$/);
    expect(rec.nowPlaying).toEqual({ type: "surah", surahNo: 3, title: "Aal-i-Imraan", subtitle: R[0], reciter: R[0] });
    await tick(page, 77);
    await page.getByTestId("mini-toggle").click(); // pause
    await expect.poll(async () => (await store(page, "quran:audio-resume:v1"))?.position).toBe(77);
    await tick(page, 90);
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    await expect.poll(async () => (await store(page, "quran:audio-resume:v1"))?.position).toBe(90);
    await page.getByTestId("mini-toggle").click(); // play on
    await end(page);
    await expect.poll(async () => (await store(page, "quran:audio-resume:v1"))?.position).toBe(0); // a finished surah is not "where you stopped"
  });

  test("after a reload the saved place is shown and resumes from it; the legacy prefs and resume keys keep their shapes", async ({ page }) => {
    await openListing(page);
    await start(page, 3);
    await tick(page, 61);
    await page.getByTestId("mini-toggle").click();
    await expect.poll(async () => (await store(page, "quran:audio-resume:v1"))?.position).toBe(61);
    await page.reload();
    await expect(page.getByTestId("mini-status")).toHaveText("Paused at 1:01");
    await page.getByTestId("mini-toggle").click();
    await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Pause");
    expect(await page.evaluate(() => (window as unknown as { __audio: { srcs: string[] } }).__audio.srcs)).toHaveLength(1);
    expect(await store(page, "quran:audio-prefs:v1")).toBeNull(); // nothing was changed, nothing was invented
  });
});

test.describe("errors never leave a spinner", () => {
  test("a file that cannot play shows the message and Try again in the mini player and the sheet; Try again plays", async ({ page }) => {
    await openListing(page);
    await hook(page, "fail", true);
    await page.getByTestId("surah-row-1").getByTestId("row-play").click();
    await expect(page.getByTestId("mini-status")).toHaveText("Couldn’t play. Audio needs a connection unless it was downloaded.");
    await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Play"); // not a spinner
    await expect(page.getByTestId("mini-retry")).toBeVisible();
    await openSheet(page);
    await expect(page.getByTestId("player-status")).toHaveText("Couldn’t play. Audio needs a connection unless it was downloaded.");
    await hook(page, "fail", false);
    await page.getByTestId("player-retry").click();
    await expect(page.getByTestId("player-status")).toHaveText("Playing");
    await expect(page.getByTestId("player-retry")).toHaveCount(0);
  });

  test("a browser that refuses to start playing says 'Tap Play to start.'", async ({ page }) => {
    await openListing(page);
    await hook(page, "playError", "NotAllowedError");
    await page.getByTestId("surah-row-1").getByTestId("row-play").click();
    await expect(page.getByTestId("mini-status")).toHaveText("Tap Play to start.");
    await hook(page, "playError", null);
    await page.getByTestId("mini-retry").click();
    await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Pause");
  });

  test("the error keeps its meaning without promising offline: it says audio needs a connection unless downloaded", async ({ page }) => {
    await openListing(page);
    await hook(page, "fail", true);
    await page.getByTestId("surah-row-1").getByTestId("row-play").click();
    // The status first reads "Loading…" and then the failure: wait for it (the assertion retries) instead of reading it once.
    const status = page.getByTestId("mini-status");
    await expect(status).toHaveText(/needs a connection/);
    await expect(status).not.toHaveText(/offline/i);
  });
});

test.describe("Media Session (where the browser has it)", () => {
  test("the surah and the reciter are the metadata and the state follows play and pause", async ({ page }) => {
    await openListing(page);
    const has = await page.evaluate(() => "mediaSession" in navigator);
    test.skip(!has, "this browser has no Media Session");
    await start(page, 2);
    const read = () => page.evaluate(() => ({ t: navigator.mediaSession.metadata?.title, a: navigator.mediaSession.metadata?.artist, al: navigator.mediaSession.metadata?.album, s: navigator.mediaSession.playbackState }));
    expect(await read()).toEqual({ t: "Al-Baqara", a: R[0], al: "Quran App", s: "playing" });
    await page.getByTestId("mini-toggle").click();
    await expect.poll(async () => (await read()).s).toBe("paused");
    await page.getByTestId("mini-toggle").click();
    await page.getByTestId("surah-row-5").getByTestId("row-play").click();
    await expect.poll(async () => (await read()).t).toBe("Al-Maaida");
  });
});

test.describe("the Play controls that waited for per-ayah audio are real now", () => {
  test("Per page, Asma-ul-Husna and Stories no longer say a placeholder; opening them plays nothing (what each plays is in e2e/queue.spec.ts and e2e/ayahaudio.spec.ts)", async ({ page }) => {
    await page.goto("/per-page-read?page=3");
    await expect(page.getByTestId("play-page")).not.toHaveAttribute("aria-disabled", "true");
    await page.goto("/asma-ul-husna#name-5");
    await expect(page.getByTestId("sheet-play")).not.toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Escape");
    await page.goto("/stories/yusufstory");
    await expect(page.getByTestId("listen")).not.toHaveAttribute("aria-disabled", "true");
    expect(await page.getByText(/Coming with the player|arrives soon/).count()).toBe(0);
    expect((await A(page)).srcs).toEqual([]);
    await expect(page.getByTestId("mini-player")).toHaveCount(0);
  });
});

test.describe("dark mode and a phone", () => {
  test("dark theme", async ({ page, context }) => {
    await seed(context, { themeMode: "dark", ...RESUME });
    await openListing(page);
    await openSheet(page);
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
  });
  test("quran-app-db is never opened", async ({ page }) => {
    await openListing(page);
    await start(page, 1);
    expect(await idbNames(page)).not.toContain("quran-app-db");
  });
  test.describe("375px", () => {
    test.use({ viewport: { width: 375, height: 800 } });
    test("the sheet is a bottom sheet, nothing scrolls sideways, every control is 44px", async ({ page, context }) => {
      await seed(context, RESUME);
      await openListing(page);
      expect(await noScroll(page)).toBe(true);
      await openSheet(page);
      await expect(page.getByTestId("player-sheet")).toHaveAttribute("data-side", "bottom");
      expect(await noScroll(page)).toBe(true);
      for (const id of ["player-prev", "player-back", "player-toggle", "player-forward", "player-next", "speed-1", "player-save", "resume-line"]) {
        const b = (await page.getByTestId(id).first().boundingBox())!;
        expect(b.height, id).toBeGreaterThanOrEqual(43.5);
        expect(b.width, id).toBeGreaterThanOrEqual(43.5);
      }
      expect((await page.getByTestId("player-slider").boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      expect((await page.getByTestId("reciter-chip").first().boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      expect((await page.locator('label:has([data-testid="player-repeat"])').boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      await page.keyboard.press("Escape");
      expect((await page.getByTestId("mini-open").boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      expect((await page.getByTestId("mini-toggle").boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    });

    test("the mini player's error wraps onto two lines (nothing cut off) and Try again stays on screen and easy to hit", async ({ page }) => {
      await openListing(page);
      await hook(page, "fail", true);
      await page.getByTestId("surah-row-2").getByTestId("row-play").click();
      const status = page.getByTestId("mini-status");
      await expect(status).toHaveText("Couldn’t play. Audio needs a connection unless it was downloaded.");
      const fits = await status.evaluate((el) => {
        const lh = parseFloat(getComputedStyle(el).lineHeight);
        return { whole: el.scrollHeight <= el.clientHeight + 1, lines: Math.round(el.getBoundingClientRect().height / lh) };
      });
      expect(fits.whole).toBe(true); // all of the text is there, not clipped
      expect(fits.lines).toBeGreaterThanOrEqual(2); // it wrapped (it does not fit on one line at 375px)
      expect(fits.lines).toBeLessThanOrEqual(2);
      const retry = (await page.getByTestId("mini-retry").boundingBox())!;
      expect(retry.height).toBeGreaterThanOrEqual(43.5);
      expect(retry.x).toBeGreaterThanOrEqual(0);
      expect(retry.x + retry.width).toBeLessThanOrEqual(375);
      expect(retry.y + retry.height).toBeLessThanOrEqual(800);
      const toggle = (await page.getByTestId("mini-toggle").boundingBox())!;
      expect(toggle.x + toggle.width).toBeLessThanOrEqual(375);
      expect(await noScroll(page)).toBe(true);
      await hook(page, "fail", false);
      await page.getByTestId("mini-retry").click();
      await expect(page.getByTestId("mini-toggle")).toHaveAccessibleName("Pause");
    });
  });
});
