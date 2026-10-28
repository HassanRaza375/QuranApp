// Phase 15: Reading goals in a real browser, on the production build. The clock is fixed (Thursday 15 Oct 2026, Karachi); the calendar service is a
// recorded real answer (Ramadan 1448 starts 8 Feb 2027); an unmocked request to a real API fails the test. Goals are stored in the legacy shape
// (`quran:reading-goals:v1`), so these tests read the stored record. See docs/pages/goals.md.
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { SURAH_ROWS } from "../app/data/quranMeta.generated";
import { juzLine, positionOf, type Goal } from "../app/lib/goals/model";
import { absolute } from "../app/lib/quranMeta";
import { forbidRealApis, freezeClock, LAHORE_LEGACY, mockAladhan, mockHijri, mockVerse, readStorage, seed } from "./mocks";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });

const NOW = "2026-10-15T09:14:00+05:00";
const TODAY = "2026-10-15";
const KEY = "quran:reading-goals:v1";
const PROGRESS = "quran:reading-progress:v1";

let leaks: string[] = [];
async function setup(context: BrowserContext, seeds: Record<string, string> = {}, now = NOW, hijri: "ok" | "network" = "ok") {
  leaks = await forbidRealApis(context);
  await freezeClock(context, now);
  await mockAladhan(context);
  await mockHijri(context, hijri);
  await mockVerse(context);
  await seed(context, { last_location: LAHORE_LEGACY, ...seeds });
}
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

const goal = (over: Partial<Goal> & { id: string }): Goal => ({ type: "ayahs-per-day", label: "10 ayahs/day", startDate: "2026-10-01", targetDate: null, dailyAyahTarget: 10, startAbsoluteAyah: 0, preferredDays: [0, 1, 2, 3, 4, 5, 6], status: "active", createdAt: 1, ...over });
const record = (goals: Goal[], activeGoalId: string | null, dailyLog: Record<string, string[]> = {}, extra: Record<string, unknown> = {}) => JSON.stringify({ goals, activeGoalId, dailyLog, ...extra });
const place = (surah: number, ayah: number) => JSON.stringify({ surahNo: surah, ayahNo: ayah, surahName: "x", surahNameArabic: "x", totalAyah: 1, updatedAt: 1 });
const stored = async (page: Page) => JSON.parse((await readStorage(page))[KEY] ?? "null") as { goals: Goal[]; activeGoalId: string | null; dailyLog: Record<string, string[]>; [k: string]: unknown } | null;
const toast = (page: Page, text: string) => page.locator("[data-sonner-toast]").filter({ hasText: text });
const noScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const errors = (page: Page) => {
  const out: string[] = [];
  page.on("console", (m) => m.type() === "error" && out.push(m.text()));
  page.on("pageerror", (e) => out.push(String(e)));
  return out;
};
async function open(page: Page) {
  await page.goto("/goals");
  await expect(page.getByTestId("goals-page")).toBeVisible();
  await expect(page.getByTestId("goals-today").or(page.getByTestId("goals-empty"))).toBeVisible();
}
const sheet = (page: Page) => page.getByTestId("goals-new-sheet");

test.describe("making a goal", () => {
  test("first run: a plain start, then each kind shows the ayahs a day it would be, from where you are", async ({ context, page }) => {
    await setup(context);
    await open(page);
    await expect(page.getByTestId("goals-empty")).toContainText("Plan your reading");
    await expect(page.getByTestId("goals-read")).toHaveAttribute("href", "/surah/1");
    await page.getByTestId("goals-new-first").click();
    await expect(sheet(page)).toBeVisible();
    await expect(page.getByTestId("goals-preview-n")).toHaveText(String(Math.ceil(6236 / 30))); // finish by a date: the default is in 30 days
    await expect(page.getByTestId("goals-preview-finish")).toContainText("14 November 2026");
    await page.getByTestId("goals-type-pages-per-day").check({ force: true });
    await expect(page.getByTestId("goals-amount")).toHaveValue("2");
    await expect(page.getByTestId("goals-preview-n")).toHaveText(String(Math.ceil(2 * (6236 / 604))));
    await page.getByTestId("goals-type-juz-per-week").check({ force: true });
    await expect(page.getByTestId("goals-preview-n")).toHaveText(String(Math.ceil(6236 / 30 / 7)));
    await page.getByTestId("goals-type-ayahs-per-day").check({ force: true });
    await expect(page.getByTestId("goals-preview-n")).toHaveText("20");
    await page.getByTestId("goals-more").click();
    await expect(page.getByTestId("goals-preview-n")).toHaveText("21");
    await expect(sheet(page)).not.toContainText(/minutes/i); // the prototype's reading time was invented
  });

  test("Finish by a date: the Ramadan chip comes from the calendar service, and the goal is stored in the legacy shape", async ({ context, page }) => {
    await setup(context);
    await open(page);
    await page.getByTestId("goals-new-first").click();
    await expect(page.getByTestId("goals-chip-ramadan")).toBeVisible();
    await page.getByTestId("goals-chip-ramadan").click(); // the day before 1 Ramadan 1448 (8 Feb 2027)
    await expect(page.getByTestId("goals-date")).toHaveValue("2027-02-07");
    await expect(page.getByTestId("goals-preview-n")).toHaveText(String(Math.ceil(6236 / 115)));
    await page.getByTestId("goals-start").click();
    await expect(toast(page, "Goal started.")).toBeVisible();
    await expect(page.getByTestId("goals-of")).toHaveText("of 55 ayahs");
    await expect(page.getByTestId("goals-lede")).toContainText("finish by Sun 7 Feb");
    const s = (await stored(page))!;
    expect(s.goals).toHaveLength(1);
    expect(s.goals[0]).toMatchObject({ type: "finish-by-date", targetDate: "2027-02-07", dailyAyahTarget: 55, startAbsoluteAyah: 0, startDate: TODAY, status: "active", preferredDays: [0, 1, 2, 3, 4, 5, 6] });
    expect(s.activeGoalId).toBe(s.goals[0]!.id);
  });

  test("starting a goal where you are: the amount counts only what is left", async ({ context, page }) => {
    await setup(context, { [PROGRESS]: place(18, 10) });
    await open(page);
    await page.getByTestId("goals-new-first").click();
    await page.getByTestId("goals-chip-30").click();
    const left = 6236 - absolute(18, 10);
    await expect(page.getByTestId("goals-preview-n")).toHaveText(String(Math.ceil(left / 30)));
    await page.getByTestId("goals-start").click();
    await expect.poll(async () => (await stored(page))?.goals[0]?.startAbsoluteAyah).toBe(absolute(18, 10));
  });

  test("a date that is not after today is refused, offline the Ramadan chip is simply not offered, and the earliest date is tomorrow by the local clock, not UTC", async ({ context, page }) => {
    await setup(context, {}, "2026-10-16T01:30:00+05:00", "network"); // 1:30 am on the 16th in Karachi is still the 15th in UTC
    await open(page);
    await page.getByTestId("goals-new-first").click();
    await expect(page.getByTestId("goals-date")).toHaveAttribute("min", "2026-10-17");
    await expect(page.getByTestId("goals-chip-year")).toBeVisible();
    await expect(page.getByTestId("goals-chip-ramadan")).toHaveCount(0);
    await page.getByTestId("goals-date").fill("2026-10-16");
    await expect(page.getByTestId("goals-problem")).toHaveText("Choose a day after today.");
    await expect(page.getByTestId("goals-start")).toBeDisabled();
  });

  test("a new goal pauses the main goal, says so, and Undo puts both back", async ({ context, page }) => {
    await setup(context, { [KEY]: record([goal({ id: "a", label: "Read each day" })], "a") });
    await open(page);
    await page.getByTestId("goals-new").click();
    await expect(page.getByTestId("goals-pause-note")).toContainText("Read each day");
    await page.getByTestId("goals-type-ayahs-per-day").check({ force: true });
    await page.getByTestId("goals-start").click();
    await expect(toast(page, "Goal started. Your previous goal is paused.")).toBeVisible();
    let s = (await stored(page))!;
    expect(s.goals.map((g) => [g.id === "a" ? "a" : "new", g.status])).toEqual([["a", "paused"], ["new", "active"]]);
    expect(s.activeGoalId).toBe(s.goals[1]!.id);
    await expect(page.getByTestId("goals-other-row")).toContainText("Paused");
    await toast(page, "Goal started.").getByRole("button", { name: "Undo" }).click();
    s = (await stored(page))!;
    expect(s.goals.map((g) => [g.id, g.status])).toEqual([["a", "active"]]);
    expect(s.activeGoalId).toBe("a");
    await expect(page.getByTestId("goals-lede")).toContainText("Read each day");
  });
});

test.describe("today", () => {
  test("a finish-by-date goal is worked out from where you are and the days left; Next up is the ayah after your place", async ({ context, page }) => {
    const g = goal({ id: "f", type: "finish-by-date", label: "Finish by 7 Feb", targetDate: "2027-02-07", dailyAyahTarget: 55 });
    await setup(context, { [KEY]: record([g], "f", { [TODAY]: ["18:1", "18:2", "18:3"] }), [PROGRESS]: place(18, 10) });
    await open(page);
    const pos = absolute(18, 10);
    const ask = Math.ceil((6236 - pos) / 115);
    await expect(page.getByTestId("goals-count")).toContainText("3");
    await expect(page.getByTestId("goals-of")).toHaveText(`of ${ask} ayahs`);
    await expect(page.getByTestId("goals-keeps")).toHaveText(`${ask} ayahs a day from here keeps your date.`);
    await expect(page.getByTestId("goals-next")).toHaveText(`${SURAH_ROWS[17]!.name} 18:11`);
    await expect(page.getByTestId("goals-next")).toHaveAttribute("href", "/surah/18#ayah-11");
    await expect(page.getByTestId("goals-bar")).toHaveAttribute("aria-valuenow", String(Math.round((3 / ask) * 100)));
    await expect(page.getByTestId("goals-place")).toHaveText(`${pos.toLocaleString("en-GB")} of 6,236 ayahs · ${juzLine(pos).done} juz complete`);
  });

  test("after the date: a plain sentence, never 'behind'; Home shows the count alone", async ({ context, page }) => {
    await setup(context, { [KEY]: record([goal({ id: "f", type: "finish-by-date", label: "Finish soon", targetDate: "2026-10-10" })], "f", { [TODAY]: ["2:1", "2:2"] }), [PROGRESS]: place(2, 5) });
    await open(page);
    await expect(page.getByTestId("goals-passed")).toHaveText("Your date has passed. Choose a new date or keep reading.");
    await expect(page.getByTestId("goals-of")).toHaveText("ayahs read");
    await expect(page.getByTestId("goals-bar")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(/behind|catch.?up|streak/i);
    await page.getByTestId("goals-new-date").click();
    await expect(sheet(page)).toBeVisible();
    await page.keyboard.press("Escape");
    await page.goto("/");
    await expect(page.getByTestId("tile-goal")).toContainText("2 ayahs");
    await expect(page.getByTestId("tile-goal")).not.toContainText("/");
  });

  test("Home and Goals agree on the amount for a finish-by-date goal", async ({ context, page }) => {
    const g = goal({ id: "f", type: "finish-by-date", label: "F", targetDate: "2027-02-07", dailyAyahTarget: 55 });
    await setup(context, { [KEY]: record([g], "f", { [TODAY]: ["2:1"] }), [PROGRESS]: place(2, 5) });
    await open(page);
    const ask = Math.ceil((6236 - positionOf({ surahNo: 2, ayahNo: 5 })!) / 115);
    await expect(page.getByTestId("goals-of")).toHaveText(`of ${ask} ayahs`);
    await page.goto("/");
    await expect(page.getByTestId("tile-goal")).toContainText(`1 / ${ask} ayahs`);
  });

  test("a pace goal keeps the amount it was made with, however many days have gone by; there is no streak, no catch-up and no points", async ({ context, page }) => {
    const log: Record<string, string[]> = { "2026-10-02": ["1:1"], "2026-10-03": ["1:2"], "2026-10-04": ["1:3"], "2026-10-05": ["1:4"] };
    await setup(context, { [KEY]: record([goal({ id: "p", dailyAyahTarget: 22, label: "22 ayahs/day", startDate: "2026-10-01" })], "p", log) });
    await open(page);
    await expect(page.getByTestId("goals-of")).toHaveText("of 22 ayahs");
    await expect(page.locator("body")).not.toContainText(/streak|behind|catch.?up|points|badge|keep it up|don.t break/i);
  });

  test("Log reading from a mushaf adds to today; Undo takes exactly those back", async ({ context, page }) => {
    await setup(context, { [KEY]: record([goal({ id: "a" })], "a", { [TODAY]: ["2:1"] }) });
    await open(page);
    await page.getByTestId("goals-log").click();
    await page.getByTestId("goals-log-n").fill("7");
    await page.getByTestId("goals-log-add").click();
    await expect(toast(page, "Added 7 ayahs to today.")).toBeVisible();
    await expect(page.getByTestId("goals-count")).toContainText("8");
    const log = (await stored(page))!.dailyLog[TODAY]!;
    expect(log).toHaveLength(8);
    expect(log.filter((k) => /^manual:\d+:\d$/.test(k))).toHaveLength(7);
    await toast(page, "Added 7 ayahs").getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("goals-count")).toContainText("1");
    expect((await stored(page))!.dailyLog[TODAY]).toEqual(["2:1"]);
  });
});

test.describe("the line, the week and the other goals", () => {
  test("the 30 juz and the last seven days", async ({ context, page }) => {
    const log: Record<string, string[]> = { [TODAY]: ["2:1", "2:2"], "2026-10-14": ["2:3"], "2026-10-09": ["1:1", "1:2", "1:3"] };
    await setup(context, { [KEY]: record([goal({ id: "a" })], "a", log), [PROGRESS]: place(2, 286) });
    await open(page);
    const done = juzLine(absolute(2, 286)).done;
    await expect(page.getByTestId("goals-juz")).toHaveAttribute("aria-label", new RegExp(`^${done} of 30 juz complete, juz ${done + 1} in progress$`));
    await expect(page.getByTestId("goals-juz").locator('[data-state="done"]')).toHaveCount(done);
    const bars = page.getByTestId("goals-week").getByRole("listitem");
    await expect(bars).toHaveCount(7);
    await expect(bars.last()).toHaveAttribute("aria-label", "Thursday (today): 2 ayahs");
    await expect(bars.first()).toHaveAttribute("aria-label", "Friday: 3 ayahs");
    await expect(page.getByTestId("goals-week").locator('[data-date="2026-10-14"]')).toHaveAttribute("aria-label", "Wednesday: 1 ayahs");
  });

  test("Pause, Resume and Remove each offer Undo, and the main goal moves the way the stored record says", async ({ context, page }) => {
    await setup(context, { [KEY]: record([goal({ id: "a", label: "Goal A" }), goal({ id: "b", label: "Goal B", status: "paused", createdAt: 2 })], "a") });
    await open(page);
    await page.getByTestId("goals-pause").click();
    await expect(toast(page, "Paused “Goal A”.")).toBeVisible();
    let s = (await stored(page))!;
    expect(s.goals.map((g) => [g.id, g.status])).toEqual([["a", "paused"], ["b", "paused"]]);
    expect(s.activeGoalId).toBeNull();
    await expect(page.getByTestId("goals-empty")).toBeVisible();
    await toast(page, "Paused").getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("goals-lede")).toContainText("Goal A");
    expect((await stored(page))!.activeGoalId).toBe("a");

    await page.getByTestId("goals-resume-b").click();
    await expect(toast(page, "Goal resumed. It’s now your main goal.")).toBeVisible();
    s = (await stored(page))!;
    expect(s.goals.map((g) => [g.id, g.status])).toEqual([["a", "paused"], ["b", "active"]]);
    expect(s.activeGoalId).toBe("b");
    await toast(page, "Goal resumed").getByRole("button", { name: "Undo" }).click();
    s = (await stored(page))!;
    expect(s.goals.map((g) => [g.id, g.status])).toEqual([["a", "active"], ["b", "paused"]]);
    expect(s.activeGoalId).toBe("a");

    await page.getByTestId("goals-other-remove").click();
    await expect(toast(page, "Removed “Goal B”.")).toBeVisible();
    expect((await stored(page))!.goals.map((g) => g.id)).toEqual(["a"]);
    await toast(page, "Removed").getByRole("button", { name: "Undo" }).click();
    expect((await stored(page))!.goals.map((g) => g.id)).toEqual(["a", "b"]);
  });

  test("a goal made in the old app (custom kind, fields this version does not know) is shown, and kept when something changes", async ({ context, page }) => {
    const legacy = { ...goal({ id: "c", type: "custom", label: "My own", dailyAyahTarget: 7 }), color: "teal" };
    await setup(context, { [KEY]: record([legacy as Goal], "c", { "2026-10-14": ["1:1"], "2026-10-13": ["1:2"] }, { future: { keep: true } }) });
    await open(page);
    await expect(page.getByTestId("goals-lede")).toContainText("My own");
    await expect(page.getByTestId("goals-of")).toHaveText("of 7 ayahs");
    await page.getByTestId("goals-pause").click();
    const s = (await stored(page))!;
    expect(s.future).toEqual({ keep: true });
    expect(s.goals[0]).toMatchObject({ id: "c", type: "custom", color: "teal", status: "paused" });
    expect(s.dailyLog).toEqual({ "2026-10-14": ["1:1"], "2026-10-13": ["1:2"] });
  });

  test("only a finish-by-date goal can be complete: at the last ayah it moves to Other goals as Complete; a pace goal just goes on", async ({ context, page }) => {
    await setup(context, { [KEY]: record([goal({ id: "f", type: "finish-by-date", label: "Khatmah", targetDate: "2027-01-01" })], "f"), [PROGRESS]: place(114, 6) });
    await open(page);
    await expect(page.getByTestId("goals-empty")).toBeVisible();
    await expect(page.getByTestId("goals-other-row")).toContainText("Complete");
    expect((await stored(page))!.goals[0]!.status).toBe("completed");
    await expect(page.getByTestId("goals-resume-f")).toHaveCount(0); // a finished goal has nothing to resume
  });

  test("a pace goal at the last ayah stays active", async ({ context, page }) => {
    await setup(context, { [KEY]: record([goal({ id: "p" })], "p"), [PROGRESS]: place(114, 6) });
    await open(page);
    await expect(page.getByTestId("goals-today")).toBeVisible();
    expect((await stored(page))!.goals[0]!.status).toBe("active");
  });

  test("a damaged record shows the empty start and is not written over", async ({ context, page }) => {
    await setup(context, { [KEY]: "{not json" });
    await open(page);
    await expect(page.getByTestId("goals-empty")).toBeVisible();
    expect((await readStorage(page))[KEY]).toBe("{not json");
  });
});

test.describe("looks and rules", () => {
  for (const [name, viewport, theme] of [["desktop light", { width: 1280, height: 900 }, "light"], ["phone dark", { width: 375, height: 760 }, "dark"]] as const) {
    test(`${name}: no sideways scroll, touch targets of at least 44px on a phone, no console errors`, async ({ context, page }) => {
      const log: Record<string, string[]> = { [TODAY]: ["2:1", "2:2"] };
      await setup(context, { [KEY]: record([goal({ id: "a" }), goal({ id: "b", status: "paused", label: "A long goal name that goes on and on and on", createdAt: 2 })], "a", log), [PROGRESS]: place(2, 5), themeMode: theme });
      await page.setViewportSize(viewport);
      const errs = errors(page);
      await open(page);
      expect(await noScroll(page)).toBe(true);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^((?!dark).)*$/);
      if (viewport.width < 500) for (const id of ["goals-new", "goals-read", "goals-log", "goals-pause", "goals-remove", "goals-resume-b", "goals-other-remove", "goals-next"]) expect((await page.getByTestId(id).boundingBox())!.height, id).toBeGreaterThanOrEqual(44);
      await page.getByTestId("goals-new").click();
      await expect(sheet(page)).toBeVisible();
      expect(await noScroll(page)).toBe(true);
      if (viewport.width < 500) for (const id of ["goals-start", "goals-chip-30", "goals-date"]) expect((await page.getByTestId(id).boundingBox())!.height, id).toBeGreaterThanOrEqual(44);
      await page.keyboard.press("Escape");
      await page.getByTestId("goals-log").click();
      await expect(page.getByTestId("goals-log-sheet")).toBeVisible();
      expect(await noScroll(page)).toBe(true);
      expect(errs).toEqual([]);
    });
  }

  test("it can be done from the keyboard: the New goal sheet opens, a kind is chosen with the arrow keys, Start works", async ({ context, page }) => {
    await setup(context);
    await open(page);
    await page.getByTestId("goals-new-first").focus();
    await page.keyboard.press("Enter");
    await expect(sheet(page)).toBeVisible();
    await page.getByTestId("goals-type-finish-by-date").focus();
    await page.keyboard.press("ArrowDown"); // the next kind in the group
    await expect(page.getByTestId("goals-type-ayahs-per-day")).toBeChecked();
    await page.getByTestId("goals-start").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("goals-today")).toBeVisible();
    expect((await stored(page))!.goals[0]).toMatchObject({ type: "ayahs-per-day", dailyAyahTarget: 20 });
  });

  test("works with no connection: the page, a new goal and the log need nothing from the network", async ({ context, page }) => {
    await setup(context, { [KEY]: record([goal({ id: "a" })], "a", { [TODAY]: ["2:1"] }) }, NOW, "network");
    await open(page);
    await context.setOffline(true);
    await page.getByTestId("goals-log").click();
    await page.getByTestId("goals-log-add").click();
    await expect(page.getByTestId("goals-count")).toContainText("6");
    await page.getByTestId("goals-new").click();
    await page.getByTestId("goals-type-pages-per-day").check({ force: true });
    await page.getByTestId("goals-start").click();
    await expect(page.getByTestId("goals-lede")).toContainText("2 pages/day");
    await context.setOffline(false);
  });
});
