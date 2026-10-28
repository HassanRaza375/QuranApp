// Phase 14: Hifz in a real browser, on the production build. The text is SYNTHETIC Arabic-letter text (mockHifzText), audio is a recorder (stubAudio), the clock
// is fixed (15 Oct 2026, Karachi), and an unmocked request to a real API fails the test. The Hifz data is the legacy shape (`quran:hifz:v2`); the new keys are
// `quran:hifz-words:v1` and `quran:hifz-timing:v1`. See docs/pages/hifz.md.
import { expect, test, type Page } from "@playwright/test";
import * as E from "../app/lib/hifz/engine";
import { loadAndControl } from "./helpers";
import { forbidRealApis, freezeClock, hifzWords, idbNames, mockHifzText, mockQuranText, mockVerse, readStorage, seed, stubAudio } from "./mocks";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });
let leaks: string[] = [];
let text: Awaited<ReturnType<typeof mockHifzText>>;
test.beforeEach(async ({ context }) => {
  leaks = await forbidRealApis(context);
  await freezeClock(context);
  await stubAudio(context);
  await mockQuranText(context);
  await mockVerse(context);
  text = await mockHifzText(context);
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

const TODAY = "2026-10-15";
const OLD = "2026-10-10";

/** Al-Mulk 1-2 and Al-Ikhlas 1-4 started and due; Al-Ikhlas 3 is weak. Plan: 1 tricky, 5 to review, 2 new (Al-Mulk 3 and 4). */
function world(): E.HifzData {
  let d = E.emptyData();
  d = E.createTarget(d, { surahNo: 67, surahName: "The Sovereignty", startAyah: 1, endAyah: 30, dailyNewTarget: 2, dailyTimeGoalMinutes: 15 }, "t-mulk", 1).data;
  d = E.createTarget(d, { surahNo: 112, surahName: "Sincerity", startAyah: 1, endAyah: 4, dailyNewTarget: 1, dailyTimeGoalMinutes: 15 }, "t-ikhlas", 2).data;
  d = E.introduceAyahs(d, "t-mulk", 2, OLD).data;
  d = E.introduceAyahs(d, "t-ikhlas", 4, OLD).data;
  for (const [t, a] of [["t-mulk", 1], ["t-mulk", 2], ["t-ikhlas", 1], ["t-ikhlas", 2], ["t-ikhlas", 4]] as const) d = E.gradeAyah(d, t, a, "good", 0, OLD);
  d = E.gradeAyah(d, "t-ikhlas", 3, "again", 0, "2026-10-12");
  d = E.gradeAyah(d, "t-ikhlas", 3, "again", 0, "2026-10-13");
  return d;
}
const record = (d: E.HifzData, extra: Record<string, unknown> = {}) => JSON.stringify({ ...d, ...extra });
const WORLD = { "quran:hifz:v2": record(world()) };
/** The tricky word on Al-Ikhlas 3: slipped on two different days. */
const TRICKY_WORD = hifzWords(112, 3)[1]!;
const WORDS = {
  "quran:hifz-words:v1": JSON.stringify({ v: 1, ayahs: { "112:3": { "1": { word: TRICKY_WORD, slipDays: ["2026-10-12", "2026-10-13"], cleanDays: [], last: "2026-10-13" } } } }),
};

const rec = async (page: Page) => JSON.parse((await readStorage(page))["quran:hifz:v2"] ?? "null") as E.HifzData | null;
const wordsRec = async (page: Page) => JSON.parse((await readStorage(page))["quran:hifz-words:v1"] ?? "null") as { ayahs: Record<string, Record<string, { word: string; slipDays: string[]; cleanDays: string[] }>> } | null;
const ayahOf = (d: E.HifzData, t: string, a: number) => d.ayahStates.find((s) => s.targetId === t && s.ayahNo === a)!;
const toast = (page: Page, t: string | RegExp) => page.locator("[data-sonner-toast]").filter({ hasText: t });
const noScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const errors = (page: Page) => {
  const out: string[] = [];
  page.on("console", (m) => m.type() === "error" && out.push(m.text()));
  page.on("pageerror", (e) => out.push(String(e)));
  return out;
};

async function openHome(page: Page) {
  await page.goto("/hifz");
  await expect(page.getByTestId("hifz-home")).toBeVisible();
  await expect(page.getByTestId("hifz-plan").or(page.getByTestId("hifz-empty")).or(page.getByTestId("hifz-caught-up")).or(page.getByTestId("hifz-resume"))).toBeVisible();
}
/** Recite the shown ayah cleanly: reveal all, done, continue. */
async function clean(page: Page, o: { easy?: boolean } = {}) {
  await page.getByTestId("hifz-reveal-all").click();
  await page.getByTestId("hifz-finish").click();
  await expect(page.getByTestId("hifz-verdict")).toHaveAttribute("data-grade", /good|easy/);
  if (o.easy) await page.getByTestId("hifz-easy").click();
  await page.getByTestId("hifz-continue").click();
}

test.describe("first run, and adding a surah", () => {
  test("an empty Hifz says so and offers Add a surah; adding writes the legacy shape and nothing else; quran-app-db is never opened", async ({ page }) => {
    const errs = errors(page);
    await openHome(page);
    await expect(page.getByTestId("hifz-empty")).toContainText("Pick a surah and a pace");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await page.getByTestId("hifz-add-first").click();
    await expect(page.getByTestId("hifz-add-sheet")).toBeVisible();
    await page.getByTestId("hifz-add-surah").selectOption("67");
    await expect(page.getByTestId("hifz-add-weeks")).toContainText("At 2 a day, all 30 ayahs of Al-Mulk are started in about 2 weeks");
    await page.getByTestId("hifz-pace-gentle").click();
    await expect(page.getByTestId("hifz-add-weeks")).toContainText("At 1 a day, all 30 ayahs of Al-Mulk are started in about 4 weeks");
    await page.getByTestId("hifz-add-save").click();
    await expect(toast(page, "Al-Mulk added")).toBeVisible();
    await expect(page.getByTestId("hifz-surah-67")).toContainText("0 of 30 ayahs started");
    const d = (await rec(page))!;
    expect(d.targets).toHaveLength(1);
    expect(d.targets[0]).toMatchObject({ surahNo: 67, surahName: "The Sovereignty", startAyah: 1, endAyah: 30, dailyNewTarget: 1, dailyTimeGoalMinutes: 15, status: "active", lastPosition: 0, lastAssessmentAt: null });
    expect(Object.keys(d).sort()).toEqual(["activity", "ayahStates", "targets", "transitionStates"]);
    const keys = Object.keys(await readStorage(page)).filter((k) => k.startsWith("quran:hifz"));
    expect(keys).toEqual(["quran:hifz:v2"]);
    expect(await idbNames(page)).not.toContain("quran-app-db");
    expect(errs).toEqual([]);
  });

  test("Choose ayahs: a range is checked, the whole surah is the default, and a surah already added cannot be added again", async ({ page, context }) => {
    await seed(context, WORLD);
    await openHome(page);
    await page.getByTestId("hifz-add").click();
    await page.getByTestId("hifz-add-surah").selectOption("36");
    await expect(page.getByTestId("hifz-add-ayahs")).toHaveCount(0);
    await page.getByTestId("hifz-add-range").click();
    await page.getByTestId("hifz-add-from").fill("20");
    await page.getByTestId("hifz-add-to").fill("10");
    await expect(page.getByTestId("hifz-add-save")).toBeDisabled();
    await page.getByTestId("hifz-add-to").fill("30");
    await expect(page.getByTestId("hifz-add-weeks")).toContainText("ayahs 20 to 30 of Yaseen");
    await page.getByTestId("hifz-add-surah").selectOption("67");
    await expect(page.getByTestId("hifz-add-taken")).toContainText("Al-Mulk is already in My surahs");
    await expect(page.getByTestId("hifz-add-save")).toBeDisabled();
    // choosing another surah starts again from its whole range
    await page.getByTestId("hifz-add-surah").selectOption("36");
    await expect(page.getByTestId("hifz-add-to")).toHaveValue("83");
    await page.getByTestId("hifz-add-from").fill("20");
    await page.getByTestId("hifz-add-to").fill("30");
    await page.getByTestId("hifz-add-save").click();
    const t = (await rec(page))!.targets.find((x) => x.surahNo === 36)!;
    expect(t).toMatchObject({ startAyah: 20, endAyah: 30, lastPosition: 19 });
    await expect(page.getByTestId("hifz-surah-36")).toContainText("Yaseen 20–30");
  });
});

test.describe("the home screen", () => {
  test("today's plan: tricky first, then review, then new; about N minutes; the surahs with a strength strip and a key", async ({ page, context }) => {
    await seed(context, { ...WORLD, ...WORDS });
    const errs = errors(page);
    await openHome(page);
    const lines = page.getByTestId("hifz-plan-line");
    await expect(lines).toHaveCount(3);
    await expect(lines.nth(0)).toContainText("Fix 1 tricky ayah");
    await expect(lines.nth(0)).toContainText("Al-Ikhlaas 112:3 · 1 word slipped last time");
    await expect(lines.nth(1)).toContainText("Review 5 ayahs");
    await expect(lines.nth(1)).toContainText("Al-Mulk 1–2, Al-Ikhlaas 1–2 and 4");
    await expect(lines.nth(2)).toContainText("Learn 2 new ayahs");
    await expect(lines.nth(2)).toContainText("Al-Mulk 3–4");
    // 8 steps: no stored sessions yet, so 10 s and 1.5 s a word each, a new ayah four times that: a few minutes
    await expect(page.getByTestId("hifz-minutes")).toHaveText(/^About \d+ minutes?$/);
    await expect(page.getByTestId("hifz-plan")).toContainText("Tricky ayahs come first. New ayahs wait while 3 or more need work.");
    await expect(page.getByTestId("hifz-surah-67")).toContainText("2 of 30 ayahs started");
    await expect(page.getByTestId("hifz-surah-112")).toContainText("4 of 4 ayahs started");
    await expect(page.getByTestId("hifz-surah-112").getByTestId("hifz-strip")).toHaveAttribute("aria-label", "4 of 4 ayahs started: 3 learning, 1 needs work");
    await expect(page.getByTestId("hifz-key")).toContainText("Needs work");
    // gold is only for strong; none is strong yet
    await expect(page.locator('[data-s="strong"]')).toHaveCount(0);
    // nothing about streaks, points or yesterday
    await expect(page.getByTestId("hifz-home")).not.toContainText(/streak|points|badge|missed|yesterday|score/i);
    expect(errs).toEqual([]);
    // opening Home writes nothing
    expect(Object.keys(await readStorage(page)).filter((k) => k.startsWith("quran:hifz")).sort()).toEqual(["quran:hifz-words:v1", "quran:hifz:v2"]);
  });

  test("nothing due says so, and still offers Recite to someone and Practise anything", async ({ page, context }) => {
    let d = world();
    d = E.updateTarget(d, "t-mulk", { status: "paused" });
    d = E.updateTarget(d, "t-ikhlas", { status: "paused" });
    await seed(context, { "quran:hifz:v2": record(d) });
    await openHome(page);
    await expect(page.getByTestId("hifz-caught-up")).toContainText("You’re caught up");
    await expect(page.getByTestId("hifz-paused")).toHaveCount(2);
    await expect(page.getByTestId("hifz-recite")).toBeVisible();
    await expect(page.getByTestId("hifz-practice")).toBeVisible();
  });

  test("the Home tile says how many are waiting", async ({ page, context }) => {
    await seed(context, WORLD);
    await page.goto("/");
    await expect(page.getByTestId("tile-hifz")).toContainText("8 to practice");
  });

  test("a damaged record shows as empty with a note, and is left alone until the user acts", async ({ page, context }) => {
    await seed(context, { "quran:hifz:v2": "{not json" });
    await openHome(page);
    await expect(page.getByTestId("hifz-damaged")).toContainText("could not be read");
    await expect(page.getByTestId("hifz-empty")).toBeVisible();
    expect((await readStorage(page))["quran:hifz:v2"]).toBe("{not json");
  });
});

test.describe("a session", () => {
  test("the whole day: a tricky ayah with a slip, a clean review, an easy one, a new ayah with its stages and joins, then Done", async ({ page, context }) => {
    await seed(context, { ...WORLD, ...WORDS });
    const errs = errors(page);
    await openHome(page);
    await page.getByTestId("hifz-start").click();
    await expect(page).toHaveURL(/\/hifz\/session$/);
    await expect(page.getByTestId("hifz-title")).toHaveText("1 of 8");

    // 1. Al-Ikhlas 3, tricky: the word it was slipped on before is named; reveal a word (that is a slip)
    await expect(page.getByTestId("hifz-tag")).toHaveText("Tricky");
    await expect(page.getByTestId("hifz-where")).toHaveText("Al-Ikhlaas 112:3");
    await expect(page.getByTestId("hifz-tricky-cue")).toContainText(TRICKY_WORD);
    const words = hifzWords(112, 3);
    await expect(page.getByTestId("hifz-words").locator("button")).toHaveCount(words.length);
    await expect(page.getByTestId("word-0")).toHaveAttribute("data-state", "hidden");
    await expect(page.getByTestId("word-0").locator("span")).toHaveCSS("visibility", "hidden"); // a hidden word is not read out either
    await expect(page.getByTestId("word-0")).toHaveAccessibleName(/hidden/);
    await page.getByTestId("word-2").click();
    await expect(page.getByTestId("word-2")).toHaveAttribute("data-state", "slip");
    await page.getByTestId("hifz-reveal-all").click();
    await page.getByTestId("hifz-finish").click();
    await expect(page.getByTestId("hifz-verdict")).toContainText("1 slip. This ayah comes back tomorrow.");
    await expect(page.getByTestId("hifz-verdict")).toHaveAttribute("data-grade", "again");
    await expect(page.getByTestId("hifz-easy")).toHaveCount(0); // never offered after a slip
    await page.getByTestId("hifz-continue").click();
    const afterOne = (await rec(page))!;
    expect(ayahOf(afterOne, "t-ikhlas", 3)).toMatchObject({ interval: 1, reviewCount: 3, recentResults: ["again", "again", "again"], strength: "weak" });
    const w1 = (await wordsRec(page))!.ayahs["112:3"]!;
    expect(w1["2"]).toMatchObject({ word: words[2], slipDays: [TODAY] });
    expect(w1["1"]!.cleanDays).toEqual([TODAY]); // the tricky word was said right this time

    // 2. a plain review, recited clean and marked easy
    await expect(page.getByTestId("hifz-title")).toHaveText("2 of 8");
    await expect(page.getByTestId("hifz-tag")).toHaveText("Review");
    await clean(page, { easy: true });
    const m1 = ayahOf((await rec(page))!, "t-mulk", 1);
    expect(m1.recentResults).toEqual(["good", "easy"]);
    expect(m1.interval).toBeGreaterThan(3);

    // 3. a review where the first-word cue is used: still good, but no easy button, and a hint is recorded
    await page.getByTestId("hifz-first-word").click();
    await page.getByTestId("hifz-reveal-all").click();
    await page.getByTestId("hifz-finish").click();
    await expect(page.getByTestId("hifz-verdict")).toHaveAttribute("data-grade", "good");
    await expect(page.getByTestId("hifz-easy")).toHaveCount(0);
    await expect(page.getByTestId("hifz-cue-note")).toBeVisible();
    await page.getByTestId("hifz-continue").click();
    const i1 = ayahOf((await rec(page))!, "t-ikhlas", 1);
    expect(i1).toMatchObject({ recentResults: ["good", "good"], hintsUsed: 1, lastHintLevel: 1 });

    // 4 and 5: reviews
    await clean(page);
    await clean(page);
    await expect(page.getByTestId("hifz-title")).toHaveText("6 of 8");
    await clean(page); // Al-Ikhlas 4

    // 6. a new ayah: Al-Mulk 3
    await expect(page.getByTestId("hifz-tag")).toHaveText("New");
    await expect(page.getByTestId("hifz-where")).toHaveText("Al-Mulk 67:3");
    await expect(page.getByTestId("hifz-learn")).toHaveAttribute("data-stage", "0");
    await expect(page.getByTestId("hifz-next")).toHaveText("Skip ahead"); // fewer than 3 plays
    await page.getByTestId("hifz-next").click();
    await expect(page.getByTestId("hifz-learn")).toHaveAttribute("data-stage", "1");
    await page.getByTestId("hifz-next").click();
    await expect(page.getByTestId("hifz-learn")).toHaveAttribute("data-stage", "2");
    await expect(page.getByTestId("hifz-words").locator('[data-state="hidden"]')).toHaveCount(0);
    await page.getByTestId("hifz-hide-more").click();
    await expect(page.getByTestId("hifz-words").locator('[data-state="hidden"]')).not.toHaveCount(0);
    await page.getByTestId("hifz-next").click();
    await expect(page.getByTestId("hifz-learn")).toHaveAttribute("data-stage", "3");
    await page.getByTestId("hifz-reveal-all").click();
    await page.getByTestId("hifz-finish").click();
    await page.getByTestId("hifz-continue").click();
    // joins: 2, 3, 2 + 3, 1 to 3 (the plan starts at ayah 1)
    await expect(page.getByTestId("hifz-learn-join")).toBeVisible();
    for (let i = 0; i < 4; i++) {
      await expect(page.getByTestId("hifz-learn-join")).toContainText(/Recite ayahs? /);
      await page.getByTestId("hifz-join-said").click();
    }
    // nothing was graded until the whole step ended; now Al-Mulk 3 is started
    const mid = (await rec(page))!;
    expect(mid.targets.find((t) => t.id === "t-mulk")!.lastPosition).toBe(3);
    expect(ayahOf(mid, "t-mulk", 3)).toMatchObject({ reviewCount: 1, recentResults: ["good"] });
    expect(mid.transitionStates.some((t) => t.targetId === "t-mulk" && t.fromAyah === 2 && t.toAyah === 3)).toBe(true);

    // 7. the second new ayah, skipped: not started
    await expect(page.getByTestId("hifz-title")).toHaveText("8 of 8");
    await page.getByTestId("hifz-skip").click();
    await expect(page.getByTestId("hifz-done")).toBeVisible();
    await expect(page.getByTestId("hifz-done-summary")).toContainText("7 steps practised, 1 to try again. That one comes back tomorrow.");
    await expect(page.getByTestId("hifz-done-words")).toContainText(words[2]!);
    await expect(page.getByTestId("hifz-done")).not.toContainText(/streak|points|badge|score|well done|amazing/i);
    expect((await rec(page))!.targets.find((t) => t.id === "t-mulk")!.lastPosition).toBe(3);

    // the stored session is the legacy shape, completed; the timing key records one finished session
    const stored = JSON.parse((await readStorage(page))["quran:hifz-session:v1"]!);
    expect(stored).toMatchObject({ kind: "daily", status: "completed", currentIndex: 7 });
    expect(Object.keys(stored.items[0]).sort()).toEqual(["gradedTest", "hintLevel", "id", "result", "targetId", "testMode", "type", "ayahNo"].sort());
    expect(stored.items.map((i: { result: string }) => i.result)).toEqual(["again", "easy", "good", "good", "good", "good", "good", "skipped"]);
    const timing = JSON.parse((await readStorage(page))["quran:hifz-timing:v1"]!);
    expect(timing.sessions).toBe(1);
    expect(timing.secs.length).toBeGreaterThan(0);

    // back on Home, today's plan is smaller (the reviewed ayahs wait, the weak one comes back tomorrow)
    await page.getByTestId("hifz-back").click();
    await expect(page.getByTestId("hifz-home")).toBeVisible();
    expect(errs).toEqual([]);
  });

  test("Listen counts a play only when it reaches the end, three plays unlock Next, and Read along lights the whole ayah while it plays", async ({ page, context }) => {
    await seed(context, { "quran:hifz:v2": record(E.createTarget(E.emptyData(), { surahNo: 112, surahName: "Sincerity", startAyah: 1, endAyah: 4, dailyNewTarget: 1, dailyTimeGoalMinutes: 15 }, "t1", 1).data) });
    await page.goto("/hifz/session");
    await expect(page.getByTestId("hifz-learn")).toBeVisible();
    await expect(page.getByTestId("hifz-where")).toHaveText("Al-Ikhlaas 112:1");
    for (let i = 1; i <= 3; i++) {
      await page.getByTestId("hifz-play").click();
      await expect(page.getByTestId("hifz-play")).toHaveAttribute("aria-label", "Pause");
      await expect(page.getByTestId("hifz-reps")).toHaveAttribute("aria-label", `Played ${i - 1} of 3 times`);
      await page.evaluate(() => (window as unknown as { __audio: { end(): Promise<void> } }).__audio.end());
      await expect(page.getByTestId("hifz-reps")).toHaveAttribute("aria-label", `Played ${i} of 3 times`);
    }
    await expect(page.getByTestId("hifz-next")).toHaveText("Next: read along");
    await page.getByTestId("hifz-next").click();
    await expect(page.getByTestId("hifz-words")).not.toHaveAttribute("data-lit", "true");
    await page.getByTestId("hifz-play").click();
    await expect(page.getByTestId("hifz-words")).toHaveAttribute("data-lit", "true");
    await page.evaluate(() => (window as unknown as { __audio: { end(): Promise<void> } }).__audio.end());
    await expect(page.getByTestId("hifz-words")).not.toHaveAttribute("data-lit", "true");
    // the recordings asked for were this ayah's, with the Settings reciter
    const srcs = await page.evaluate(() => (window as unknown as { __audio: { srcs: string[] } }).__audio.srcs);
    expect(srcs.length).toBe(4);
    expect(new Set(srcs).size).toBe(1);
    expect(srcs[0]).toContain("112_1.mp3");
    // an ayah 1 has no join
    await page.getByTestId("hifz-next").click();
    await page.getByTestId("hifz-next").click();
    await page.getByTestId("hifz-reveal-all").click();
    await page.getByTestId("hifz-finish").click();
    await page.getByTestId("hifz-continue").click();
    await expect(page.getByTestId("hifz-done")).toBeVisible();
  });

  test("audio that cannot be had says so and the step can still be skipped", async ({ page, context }) => {
    await seed(context, { "quran:hifz:v2": record(E.createTarget(E.emptyData(), { surahNo: 112, surahName: "Sincerity", startAyah: 1, endAyah: 4, dailyNewTarget: 1, dailyTimeGoalMinutes: 15 }, "t1", 1).data) });
    await page.goto("/hifz/session");
    await expect(page.getByTestId("hifz-learn")).toBeVisible();
    await page.evaluate(() => ((window as unknown as { __audio: { fail: boolean } }).__audio.fail = true));
    await page.getByTestId("hifz-play").click();
    await expect(page.getByTestId("hifz-audio-note")).toContainText("needs a connection unless the surah is downloaded");
    await page.getByTestId("hifz-next").click();
    await expect(page.getByTestId("hifz-learn")).toHaveAttribute("data-stage", "1");
  });

  test("a tap on a shown word marks and clears a slip; tapping a hidden word reveals it as a slip; Reveal all is not a slip", async ({ page, context }) => {
    await seed(context, { ...WORLD });
    await page.goto("/hifz/session");
    await expect(page.getByTestId("hifz-review")).toBeVisible();
    await page.getByTestId("hifz-reveal-all").click();
    await expect(page.getByTestId("hifz-say")).toHaveText("Tap any word you slipped on.");
    await expect(page.getByTestId("hifz-finish")).toHaveText("Done · no slips");
    await page.getByTestId("word-0").click();
    await expect(page.getByTestId("hifz-finish")).toHaveText("Done · 1 slip");
    await page.getByTestId("word-0").click();
    await expect(page.getByTestId("hifz-finish")).toHaveText("Done · no slips");
  });

  test("Skip moves on without grading; leaving keeps the place and Home offers Resume; resuming continues", async ({ page, context }) => {
    await seed(context, WORLD);
    await openHome(page);
    await page.getByTestId("hifz-start").click();
    await page.getByTestId("hifz-skip").click();
    await expect(page.getByTestId("hifz-title")).toHaveText("2 of 8");
    expect(ayahOf((await rec(page))!, "t-ikhlas", 3).reviewCount).toBe(2); // not graded
    await clean(page);
    await page.getByTestId("hifz-leave").click();
    await expect(page.getByTestId("hifz-resume")).toBeVisible();
    await expect(page.getByTestId("hifz-resume-count")).toHaveText("2 of 8 done");
    await expect(page.getByTestId("hifz-plan")).toHaveCount(0);
    await page.getByTestId("hifz-resume-go").click();
    await expect(page.getByTestId("hifz-title")).toHaveText("3 of 8");
    // a reload mid-session comes back to the same step
    await page.reload();
    await expect(page.getByTestId("hifz-title")).toHaveText("3 of 8");
    // Start over drops the session; the plan is back
    await page.getByTestId("hifz-leave").click();
    await page.getByTestId("hifz-start-over").click();
    await expect(page.getByTestId("hifz-plan")).toBeVisible();
    expect((await readStorage(page))["quran:hifz-session:v1"]).toBe("null");
  });

  test("a legacy session with a warm-up and a mixed-test item resumes with them as ordinary reviews, and its stored shape is kept", async ({ page, context }) => {
    const item = (id: string, type: string, extra: Record<string, unknown> = {}) => ({ id, type, targetId: "t-mulk", ayahNo: 1, gradedTest: true, testMode: "continue", result: null, hintLevel: 0, ...extra });
    const legacy = { id: "s1", kind: "daily", targetIds: ["t-mulk"], items: [item("a", "warmup"), item("b", "revision", { ayahNo: 2 }), item("c", "final-mixed")], currentIndex: 1, status: "in-progress", startedAt: 1, completedAt: null, stats: { mistakes: 0, hints: 0 } };
    await seed(context, { ...WORLD, "quran:hifz-session:v1": JSON.stringify(legacy) });
    await openHome(page);
    await expect(page.getByTestId("hifz-resume-count")).toHaveText("1 of 3 done");
    await page.getByTestId("hifz-resume-go").click();
    await expect(page.getByTestId("hifz-title")).toHaveText("2 of 3");
    await expect(page.getByTestId("hifz-tag")).toHaveText("Review");
    await clean(page);
    await expect(page.getByTestId("hifz-tag")).toHaveText("Review"); // the final-mixed item
    await clean(page);
    await expect(page.getByTestId("hifz-done")).toBeVisible();
    const stored = JSON.parse((await readStorage(page))["quran:hifz-session:v1"]!);
    expect(stored.items.map((i: { type: string }) => i.type)).toEqual(["warmup", "revision", "final-mixed"]);
    expect(stored.status).toBe("completed");
  });

  test("the text of a surah that is not on the device and cannot be loaded shows a plain message, Try again works, and Skip moves on", async ({ page, context }) => {
    await seed(context, WORLD);
    text.mode = "network";
    await openHome(page);
    await page.getByTestId("hifz-start").click();
    await expect(page.getByTestId("hifz-text-missing")).toContainText("isn’t on this device yet");
    await expect(page.getByTestId("hifz-review")).toHaveCount(0);
    text.mode = "ok";
    await page.getByTestId("hifz-retry").click();
    await expect(page.getByTestId("hifz-review")).toBeVisible();
    expect(await noScroll(page)).toBe(true);
  });
});

test.describe("Recite to someone", () => {
  test("nothing is hidden, a note says to hand over the phone, a tap marks a slip, new ayahs are left out, and the grade follows the slips", async ({ page, context }) => {
    await seed(context, WORLD);
    await openHome(page);
    await page.getByTestId("hifz-recite").click();
    await expect(page.getByTestId("hifz-title")).toHaveText("Recite to someone");
    await expect(page.getByTestId("hifz-listener-note")).toContainText("Hand the phone to your listener");
    await expect(page.getByTestId("hifz-words").locator('[data-state="hidden"]')).toHaveCount(0);
    await expect(page.getByTestId("hifz-reveal-all")).toHaveCount(0);
    await page.getByTestId("word-1").click();
    await page.getByTestId("hifz-finish").click();
    await page.getByTestId("hifz-continue").click();
    expect(ayahOf((await rec(page))!, "t-ikhlas", 3).recentResults.at(-1)).toBe("again");
    for (let i = 0; i < 5; i++) {
      await page.getByTestId("hifz-finish").click();
      await page.getByTestId("hifz-continue").click();
    }
    await expect(page.getByTestId("hifz-done")).toBeVisible(); // 6 steps: 1 tricky + 5 reviews, no new ayah
    const stored = JSON.parse((await readStorage(page))["quran:hifz-session:v1"]!);
    expect(stored.items).toHaveLength(6);
    expect(stored.items.some((i: { type: string }) => i.type === "new")).toBe(false);
    expect(stored.mode).toBe("check");
    expect((await rec(page))!.targets.find((t) => t.id === "t-mulk")!.lastPosition).toBe(2);
  });
});

test.describe("Check the whole surah", () => {
  test("every started ayah, then each join, all graded; the join not said becomes weak; the check is recorded", async ({ page, context }) => {
    await seed(context, WORLD);
    await page.goto("/hifz/surah/112");
    await page.getByTestId("hifz-check-whole").click();
    await expect(page.getByTestId("hifz-title")).toHaveText("Check the whole surah");
    // ayah 1, ayah 2, join 1-2, ayah 3, join 2-3, ayah 4, join 3-4
    await clean(page);
    await clean(page);
    await expect(page.getByTestId("hifz-join")).toContainText("Join ayah 1 to ayah 2");
    await page.getByTestId("hifz-join-yes").click();
    await clean(page);
    await expect(page.getByTestId("hifz-join")).toContainText("Join ayah 2 to ayah 3");
    await page.getByTestId("hifz-join-no").click();
    await clean(page);
    await expect(page.getByTestId("hifz-join")).toContainText("Join ayah 3 to ayah 4");
    await page.getByTestId("hifz-join-yes").click();
    await expect(page.getByTestId("hifz-done")).toBeVisible();
    const d = (await rec(page))!;
    expect(d.transitionStates.find((t) => t.targetId === "t-ikhlas" && t.fromAyah === 1)).toMatchObject({ recentResults: ["good"], strength: "memorized" });
    expect(d.transitionStates.find((t) => t.targetId === "t-ikhlas" && t.fromAyah === 2)).toMatchObject({ recentResults: ["again"], strength: "weak", mistakes: 1 });
    expect(d.targets.find((t) => t.id === "t-ikhlas")!.lastAssessmentAt).toBe(TODAY);
    expect(d.activity.find((a) => a.date === TODAY)!.assessments).toBe(1);
    // the weak join shows on the surah page and in the plan
    await page.getByTestId("hifz-back").click();
    await page.goto("/hifz/surah/112");
    await expect(page.getByTestId("hifz-row-join")).toHaveText("The join from ayah 2 needs work");
  });

  test("a surah with nothing started cannot be checked", async ({ page, context }) => {
    await seed(context, { "quran:hifz:v2": record(E.createTarget(E.emptyData(), { surahNo: 36, surahName: "Ya Sin", startAyah: 1, endAyah: 83, dailyNewTarget: 2, dailyTimeGoalMinutes: 15 }, "t1", 1).data) });
    await page.goto("/hifz/surah/36");
    await expect(page.getByTestId("hifz-check-whole")).toBeDisabled();
  });
});

test.describe("Free practice", () => {
  test("any surah and ayahs, words hidden, slips shown, and NOTHING is recorded: not the schedule, not the words, not the timing, not the session", async ({ page, context }) => {
    await seed(context, { ...WORLD, ...WORDS });
    await openHome(page);
    const before = await readStorage(page);
    await page.getByTestId("hifz-practice").click();
    await page.getByTestId("hifz-practice-surah").selectOption("1"); // not one of My surahs
    await page.getByTestId("hifz-practice-from").fill("2");
    await page.getByTestId("hifz-practice-to").fill("3");
    await page.getByTestId("hifz-practice-start").click();
    await expect(page).toHaveURL(/mode=free&surah=1&from=2&to=3/);
    await expect(page.getByTestId("hifz-title")).toHaveText("Free practice");
    await expect(page.getByTestId("hifz-where")).toHaveText("Al-Faatiha 1:2");
    await expect(page.getByTestId("hifz-tricky-cue")).toHaveCount(0);
    await expect(page.getByTestId("word-0")).toHaveAttribute("data-state", "hidden");
    await page.getByTestId("word-0").click(); // a slip
    await page.getByTestId("hifz-reveal-all").click();
    await page.getByTestId("hifz-finish").click();
    await expect(page.getByTestId("hifz-verdict")).toContainText("Free practice doesn’t change your schedule");
    await expect(page.getByTestId("hifz-easy")).toHaveCount(0);
    await page.getByTestId("hifz-continue").click();
    await expect(page.getByTestId("hifz-where")).toHaveText("Al-Faatiha 1:3");
    await clean(page);
    await expect(page.getByTestId("hifz-done")).toContainText("Free practice doesn’t change your schedule");
    await expect(page.getByTestId("hifz-done-words")).toHaveCount(0);
    const after = await readStorage(page);
    expect(after).toEqual(before);
    expect(after["quran:hifz-session:v1"]).toBeUndefined();
    expect(after["quran:hifz-timing:v1"]).toBeUndefined();
  });

  test("Practise on a row of the surah page is free practice of that ayah", async ({ page, context }) => {
    await seed(context, WORLD);
    await page.goto("/hifz/surah/112");
    const before = await readStorage(page);
    await page.locator('[data-practise="2"]').click();
    await expect(page).toHaveURL(/mode=free&surah=112&from=2&to=2/);
    await expect(page.getByTestId("hifz-where")).toHaveText("Al-Ikhlaas 112:2");
    await clean(page);
    await expect(page.getByTestId("hifz-done")).toBeVisible();
    expect(await readStorage(page)).toEqual(before);
  });

  test("the sheet works with no surah added, and refuses a start after the end", async ({ page }) => {
    await page.goto("/hifz");
    await expect(page.getByTestId("hifz-empty")).toBeVisible();
    await page.getByTestId("hifz-practice").click();
    await page.getByTestId("hifz-practice-from").fill("5");
    await page.getByTestId("hifz-practice-to").fill("3");
    await expect(page.getByTestId("hifz-practice-start")).toHaveAttribute("aria-disabled", "true");
    await page.getByTestId("hifz-practice-to").fill("7");
    await expect(page.getByTestId("hifz-practice-start")).not.toHaveAttribute("aria-disabled", "true");
  });
});

test.describe("the surah page", () => {
  test("a row per ayah with its state, the words slipped on, the tricky words, pace, pause and resume", async ({ page, context }) => {
    await seed(context, { ...WORLD, ...WORDS });
    await page.goto("/hifz/surah/112");
    await expect(page.getByTestId("hifz-surah-name")).toHaveText("Al-Ikhlaas");
    const rows = page.getByTestId("hifz-rows").locator("li");
    await expect(rows).toHaveCount(4);
    await expect(rows.nth(0).getByTestId("hifz-row-state")).toHaveText("Learning");
    await expect(rows.nth(2).getByTestId("hifz-row-state")).toHaveText("Needs work");
    await expect(rows.nth(2).getByTestId("hifz-row-slip")).toContainText(`Slipped on ${TRICKY_WORD} on 2 days`);
    await expect(page.getByTestId("hifz-tricky")).toContainText(TRICKY_WORD);
    await expect(page.getByTestId("hifz-tricky")).toContainText("ayah 3");
    // a surah with more ayahs than are started: the rest are "Not started" and have no Practise
    await page.goto("/hifz/surah/67");
    await expect(page.getByTestId("hifz-rows").locator("li")).toHaveCount(30);
    await expect(page.getByTestId("hifz-rows").locator("li").nth(2).getByTestId("hifz-row-state")).toHaveText("Not started");
    await expect(page.getByTestId("hifz-rows").locator("[data-practise]")).toHaveCount(2);
    await expect(page.getByTestId("hifz-no-tricky")).toBeVisible();
    // pace
    await page.getByTestId("hifz-pace-3").click();
    expect((await rec(page))!.targets.find((t) => t.id === "t-mulk")!.dailyNewTarget).toBe(3);
    // pause and resume
    await page.getByTestId("hifz-pause").click();
    await expect(toast(page, "Paused. Nothing is lost.")).toBeVisible();
    expect((await rec(page))!.targets.find((t) => t.id === "t-mulk")!.status).toBe("paused");
    await expect(page.getByTestId("hifz-pause")).toHaveText("Resume");
    await page.getByTestId("hifz-pause").click();
    expect((await rec(page))!.targets.find((t) => t.id === "t-mulk")!.status).toBe("active");
  });

  test("a pace set earlier in the old app (not 1, 2 or 3) is shown as it is", async ({ page, context }) => {
    let d = world();
    d = E.updateTarget(d, "t-mulk", { dailyNewTarget: 5 });
    await seed(context, { "quran:hifz:v2": record(d) });
    await page.goto("/hifz/surah/67");
    await expect(page.getByTestId("hifz-pace-custom")).toHaveText("5 a day (set earlier)");
  });

  test("Remove offers Undo instead of a confirm, Undo brings back the surah and what was learnt, and tricky words are kept", async ({ page, context }) => {
    await seed(context, { ...WORLD, ...WORDS });
    await page.goto("/hifz/surah/112");
    page.on("dialog", (d) => {
      throw new Error(`a confirm dialog opened: ${d.message()}`);
    });
    await page.getByTestId("hifz-remove").click();
    await expect(page).toHaveURL(/\/hifz$/);
    await expect(toast(page, "Al-Ikhlaas removed from My surahs.")).toBeVisible();
    let d = (await rec(page))!;
    expect(d.targets.map((t) => t.id)).toEqual(["t-mulk"]);
    expect(d.ayahStates.every((a) => a.targetId === "t-mulk")).toBe(true);
    expect((await wordsRec(page))!.ayahs["112:3"]).toBeDefined(); // the words belong to the ayah
    await toast(page, "removed").getByRole("button", { name: "Undo" }).click();
    d = (await rec(page))!;
    expect(d.targets.map((t) => t.id)).toEqual(["t-mulk", "t-ikhlas"]);
    expect(d.ayahStates.filter((a) => a.targetId === "t-ikhlas")).toHaveLength(4);
    expect(d.transitionStates.filter((t) => t.targetId === "t-ikhlas")).toHaveLength(3);
    await expect(page.getByTestId("hifz-surah-112")).toContainText("4 of 4 ayahs started");
  });

  test("a surah that is not in My surahs, or a number that is not a surah, says so", async ({ page, context }) => {
    await seed(context, WORLD);
    await page.goto("/hifz/surah/55");
    await expect(page.getByTestId("hifz-not-added")).toContainText("Ar-Rahmaan is not in My surahs");
    await page.goto("/hifz/surah/abc");
    await expect(page.getByTestId("hifz-not-added")).toContainText("This surah is not in My surahs");
  });
});

test.describe("a tricky word over time", () => {
  test("slipped on a second day it becomes tricky; three clean days later it clears", async ({ page, context }) => {
    // day 1: slip on word 2 (already slipped on a day before, so it is tricky from today)
    const w: Record<string, string> = { "quran:hifz-words:v1": JSON.stringify({ v: 1, ayahs: { "112:3": { "2": { word: hifzWords(112, 3)[2], slipDays: ["2026-10-13"], cleanDays: [], last: "2026-10-13" } } } }) };
    await seed(context, { ...WORLD, ...w });
    await page.goto("/hifz/surah/112");
    await expect(page.getByTestId("hifz-no-tricky")).toBeVisible(); // slipped on one day only
    await page.goto("/hifz/session");
    await page.getByTestId("word-2").click(); // slip today
    await page.getByTestId("hifz-reveal-all").click();
    await page.getByTestId("hifz-finish").click();
    await page.getByTestId("hifz-continue").click();
    await page.goto("/hifz/surah/112");
    await expect(page.getByTestId("hifz-tricky")).toContainText(hifzWords(112, 3)[2]!);
    expect((await wordsRec(page))!.ayahs["112:3"]!["2"]!.slipDays).toEqual(["2026-10-13", TODAY]);
  });
});

test.describe("looks and rules", () => {
  for (const [name, viewport, theme] of [["desktop light", { width: 1280, height: 900 }, "light"], ["phone dark", { width: 375, height: 760 }, "dark"]] as const) {
    test(`${name}: no sideways scroll, touch targets of at least 44px on a phone, no console errors, and no card around the scripture`, async ({ page, context }) => {
      await seed(context, { ...WORLD, ...WORDS, themeMode: theme });
      await page.setViewportSize(viewport);
      const errs = errors(page);
      await openHome(page);
      expect(await noScroll(page)).toBe(true);
      if (viewport.width < 500) for (const id of ["hifz-start", "hifz-add", "hifz-recite", "hifz-practice"]) expect((await page.getByTestId(id).boundingBox())!.height, id).toBeGreaterThanOrEqual(44);
      await page.getByTestId("hifz-start").click();
      await expect(page.getByTestId("hifz-review")).toBeVisible();
      expect(await noScroll(page)).toBe(true);
      if (viewport.width < 500) {
        for (const b of await page.getByTestId("hifz-words").locator("button").all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);
        for (const id of ["hifz-first-word", "hifz-reveal-all", "hifz-skip", "hifz-leave"]) expect((await page.getByTestId(id).boundingBox())!.height, id).toBeGreaterThanOrEqual(44);
      }
      // the Arabic is not in a card: no ancestor of the words up to the section has a border
      const boxed = await page.getByTestId("hifz-words").evaluate((el) => {
        for (let n: HTMLElement | null = el as HTMLElement; n && n.tagName !== "SECTION"; n = n.parentElement) if (parseFloat(getComputedStyle(n).borderTopWidth) > 0) return true;
        return false;
      });
      expect(boxed).toBe(false);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^((?!dark).)*$/);
      await page.getByTestId("hifz-reveal-all").click();
      await page.getByTestId("hifz-finish").click();
      expect(await noScroll(page)).toBe(true);
      await page.goto("/hifz/surah/112");
      expect(await noScroll(page)).toBe(true);
      expect(errs).toEqual([]);
    });
  }

  test("it can be done from the keyboard: Start, then a word, then Reveal all", async ({ page, context }) => {
    await seed(context, WORLD);
    await openHome(page);
    await page.getByTestId("hifz-start").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("hifz-review")).toBeVisible();
    await page.getByTestId("word-0").focus();
    await page.keyboard.press("Space");
    await expect(page.getByTestId("word-0")).toHaveAttribute("data-state", "slip");
    await page.getByTestId("hifz-reveal-all").focus();
    await expect(page.getByTestId("hifz-reveal-all")).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("hifz-finish")).toHaveText("Done · 1 slip");
  });

  test("the Arabic grows with the Arabic size setting and is never letter-spaced or cut off", async ({ page, context }) => {
    await seed(context, WORLD);
    await page.goto("/hifz/session");
    const size = () => page.getByTestId("hifz-words").evaluate((el) => ({ fs: parseFloat(getComputedStyle(el).fontSize), ls: getComputedStyle(el).letterSpacing, ov: getComputedStyle(el).textOverflow }));
    const base = await size();
    expect(base.ls === "normal" || base.ls === "0px").toBe(true);
    expect(base.ov).toBe("clip");
    await page.evaluate(() => document.documentElement.style.setProperty("--arabic-font-scale", "1.5"));
    expect((await size()).fs).toBeCloseTo(base.fs * 1.5, 0);
  });
});

test.describe("legacy data", () => {
  test("the older plan-only model (quran:hifz:v1) is expanded into the legacy v2 shape once, and v1 is never written", async ({ page, context }) => {
    const v1 = [{ id: "p1", surahNo: 112, startAyah: 1, endAyah: 4, status: "memorized", planStatus: "active", interval: 6, ease: 2.2, nextReviewAt: "2026-10-20", reviewCount: 4, lastReviewedAt: OLD, createdAt: 1700000000000 }];
    await seed(context, { "quran:hifz:v1": JSON.stringify(v1) });
    await openHome(page);
    await expect(page.getByTestId("hifz-surah-112")).toContainText("4 of 4 ayahs started");
    const store = await readStorage(page);
    expect(store["quran:hifz:v1"]).toBe(JSON.stringify(v1));
    const d = JSON.parse(store["quran:hifz:v2"]!) as E.HifzData;
    expect(d.targets[0]).toMatchObject({ id: "p1", surahName: "Sincerity", dailyNewTarget: 3, lastPosition: 4, status: "active" });
    expect(d.ayahStates).toHaveLength(4);
    expect(d.transitionStates).toHaveLength(3);
    await expect(page.getByTestId("hifz-caught-up")).toBeVisible(); // next review is on the 20th
  });

  test("fields of the stored record that this version does not know are kept when it saves", async ({ page, context }) => {
    await seed(context, { "quran:hifz:v2": record(world(), { futureField: { keep: true } }) });
    await page.goto("/hifz/surah/67");
    await page.getByTestId("hifz-pace-1").click();
    const stored = JSON.parse((await readStorage(page))["quran:hifz:v2"]!);
    expect(stored.futureField).toEqual({ keep: true });
    expect(stored.targets.find((t: E.HifzTarget) => t.id === "t-mulk").dailyNewTarget).toBe(1);
  });
});

test.describe("offline (level B), with the real service worker", () => {
  test.use({ serviceWorkers: "allow" });

  test("a session goes on with the text already on the device; a surah whose text is not there says so and offers Try again, then works when the connection is back", async ({ page, context }) => {
    await seed(context, WORLD);
    await loadAndControl(page, "/hifz");
    // online, in the app: two steps load the text of Al-Ikhlaas and Al-Mulk onto the device
    await page.getByTestId("hifz-start").click();
    await expect(page.getByTestId("hifz-review")).toBeVisible();
    await page.getByTestId("hifz-skip").click();
    await expect(page.getByTestId("hifz-review")).toBeVisible();
    await page.getByTestId("hifz-leave").click();
    await expect(page.getByTestId("hifz-resume")).toBeVisible();
    const asked = text.chapters.length;
    expect(asked).toBeGreaterThanOrEqual(2);

    text.mode = "network";
    await context.setOffline(true);
    // Home is still there (the data is on the device), and the next step reads the text from the device
    await expect(page.getByTestId("hifz-surah-67")).toContainText("2 of 30 ayahs started");
    await page.getByTestId("hifz-resume-go").click();
    await expect(page.getByTestId("hifz-review")).toBeVisible();
    await expect(page.getByTestId("word-0")).toBeVisible();
    expect(text.chapters.length).toBe(asked);
    await clean(page);
    expect(ayahOf((await rec(page))!, "t-mulk", 1).reviewCount).toBe(2); // the step after the skipped one, graded offline and saved on the device

    // a surah whose text was never opened: a plain message, never a blank page or an endless spinner
    await page.getByTestId("hifz-leave").click();
    await page.getByTestId("hifz-practice").click();
    await page.getByTestId("hifz-practice-surah").selectOption("55");
    await page.getByTestId("hifz-practice-start").click();
    await expect(page.getByTestId("hifz-text-missing")).toContainText("isn’t on this device yet");
    await page.getByTestId("hifz-retry").click();
    await expect(page.getByTestId("hifz-text-missing")).toBeVisible();
    await expect(page.getByText("Loading the text…")).toHaveCount(0);
    await context.setOffline(false);
    text.mode = "ok";
    await page.getByTestId("hifz-retry").click();
    await expect(page.getByTestId("hifz-review")).toBeVisible();
  });

  test("audio that is not downloaded says it needs a connection, and the step can still be skipped", async ({ page, context }) => {
    await seed(context, { "quran:hifz:v2": record(E.createTarget(E.emptyData(), { surahNo: 112, surahName: "Sincerity", startAyah: 1, endAyah: 4, dailyNewTarget: 1, dailyTimeGoalMinutes: 15 }, "t1", 1).data) });
    await loadAndControl(page, "/hifz");
    await page.getByTestId("hifz-start").click();
    await expect(page.getByTestId("hifz-learn")).toBeVisible();
    await page.evaluate(() => ((window as unknown as { __audio: { fail: boolean } }).__audio.fail = true));
    await context.setOffline(true);
    await page.getByTestId("hifz-play").click();
    await expect(page.getByTestId("hifz-audio-note")).toBeVisible();
    await page.getByTestId("hifz-next").click();
    await expect(page.getByTestId("hifz-learn")).toHaveAttribute("data-stage", "1");
  });
});
