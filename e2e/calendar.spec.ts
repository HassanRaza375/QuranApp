// Phase 15: the Calendar in a real browser, on the production build. The Gregorian months with their Hijri dates are RECORDED REAL responses from the
// calendar service (Sep 2026 to Sep 2027); August 2026 is deliberately not mocked (a 404), to test a month that cannot be had. An unmocked request to a
// real API fails the test; the clock is fixed (Thursday 15 Oct 2026 = 4 Jumada al-ula 1448, Karachi). See docs/pages/calendar.md.
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { forbidRealApis, freezeClock, LAHORE_LEGACY, mockAladhan, mockHijri, mockVerse, readStorage, seed, type HijriMock } from "./mocks";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });

const NOW = "2026-10-15T09:14:00+05:00";
const DAY12 = "2027-02-19T09:14:00+05:00"; // day 12 of Ramadan 1448
const REMINDERS = "quran:reminders:v1";
const PREFS = "quran:calendar-prefs:v1";

let leaks: string[] = [];
let hijri: HijriMock;
async function setup(context: BrowserContext, now = NOW, seeds: Record<string, string> = {}, mode: HijriMock["mode"] = "ok") {
  leaks = await forbidRealApis(context);
  await freezeClock(context, now);
  await mockAladhan(context);
  hijri = await mockHijri(context, mode);
  await mockVerse(context);
  await seed(context, { last_location: LAHORE_LEGACY, ...seeds });
}
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

const day = (page: Page, date: string) => page.locator(`[data-testid="cal-day"][data-date="${date}"]`);
const hday = (page: Page, n: number) => page.locator(`[data-testid="cal-day"][data-hday="${n}"]`);
const toast = (page: Page, text: string) => page.locator("[data-sonner-toast]").filter({ hasText: text });
const reminders = async (page: Page) => JSON.parse((await readStorage(page))[REMINDERS] ?? "[]") as Array<Record<string, unknown>>;
const noScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const errors = (page: Page) => {
  const out: string[] = [];
  page.on("console", (m) => m.type() === "error" && out.push(m.text()));
  page.on("pageerror", (e) => out.push(String(e)));
  return out;
};
async function open(page: Page) {
  await page.goto("/calender");
  await expect(page.getByTestId("cal-title")).toBeVisible();
}

test.describe("the month", () => {
  test("opens on today's Hijri month with today selected; the names and the calendar are the service's", async ({ context, page }) => {
    await setup(context);
    await open(page);
    await expect(page.getByTestId("cal-title")).toContainText(/Jum/);
    await expect(page.getByTestId("cal-year")).toHaveText("1448");
    await expect(page.getByTestId("cal-title-ar")).toHaveAttribute("lang", "ar");
    await expect(page.getByTestId("cal-range")).toContainText("12 Oct");
    await expect(page.getByTestId("cal-range")).toContainText("Hijri Calendar of Saudi Arabia (HJCoSA)");
    const n = await page.getByTestId("cal-day").count();
    expect([29, 30]).toContain(n);
    await expect(day(page, "2026-10-12")).toHaveAttribute("data-hday", "1");
    await expect(day(page, "2026-10-15")).toHaveAttribute("data-today", "true");
    await expect(day(page, "2026-10-15")).toHaveAttribute("data-hday", "4");
    await expect(day(page, "2026-10-15")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("cal-day-kicker")).toHaveText("Today");
    await expect(page.getByTestId("cal-day-hijri")).toHaveText(/^4 .+ 1448$/);
    await expect(page.getByTestId("cal-day-greg")).toHaveText("Thursday 15 October 2026");
    await expect(page.getByTestId("cal-day-empty")).toHaveText("Nothing on this day.");
    await expect(page.getByTestId("cal-today")).toBeDisabled(); // already on today
    await expect(page.locator("body")).not.toContainText(/suhoor|iftar/i); // the Ramadan page has the timetable
  });

  test("the Hijri date adjustment moves the Gregorian dates shown, never the service's days", async ({ context, page }) => {
    await setup(context, NOW, { "quran:hijri-adjust:v1": JSON.stringify({ days: 1 }) });
    await open(page);
    await expect(page.getByTestId("cal-range")).toContainText("11 Oct");
    await expect(page.getByTestId("cal-range")).toContainText("Adjusted by +1 day");
    await expect(page.locator('[data-testid="cal-day"][data-today="true"]')).toHaveAttribute("data-hday", "5"); // 15 Oct is one Hijri day later
    await expect(page.getByTestId("cal-day-hijri")).toHaveText(/^5 /);
  });

  test("a day can be chosen with a click or the arrow keys; Home and End go to the ends", async ({ context, page }) => {
    await setup(context);
    await open(page);
    await day(page, "2026-10-20").click();
    await expect(page.getByTestId("cal-day-greg")).toHaveText("Tuesday 20 October 2026");
    await expect(page.getByTestId("cal-day-kicker")).toHaveText("Tuesday");
    await day(page, "2026-10-20").focus();
    await page.keyboard.press("ArrowRight");
    await expect(day(page, "2026-10-21")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(day(page, "2026-10-28")).toBeFocused();
    await page.keyboard.press("Home");
    await expect(day(page, "2026-10-12")).toBeFocused();
    await expect(day(page, "2026-10-12")).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("ArrowLeft"); // already the first day
    await expect(day(page, "2026-10-12")).toBeFocused();
    await page.keyboard.press("End");
    await expect(page.getByTestId("cal-day").last()).toBeFocused();
  });

  test("Hijri first or Gregorian first: the choice is kept (one small additive key)", async ({ context, page }) => {
    await setup(context);
    await open(page);
    await expect(day(page, "2026-10-15").locator("span").first()).toHaveText("4");
    await page.getByRole("radio", { name: "Gregorian" }).click();
    await expect(day(page, "2026-10-15").locator("span").first()).toHaveText("15");
    expect(JSON.parse((await readStorage(page))[PREFS]!)).toEqual({ first: "gregorian" });
    await page.reload();
    await expect(page.getByTestId("cal-title")).toBeVisible();
    await expect(day(page, "2026-10-15").locator("span").first()).toHaveText("15");
    await expect(page.getByRole("radio", { name: "Gregorian" })).toBeChecked();
  });

  test("Next and Previous step a Hijri month at a time; Today comes back; a month that cannot be had stays put and says so", async ({ context, page }) => {
    await setup(context);
    await open(page);
    const first = await page.getByTestId("cal-title").innerText();
    await page.getByTestId("cal-next").click();
    await expect(page.getByTestId("cal-title")).not.toHaveText(first);
    await expect(page.getByTestId("cal-day").first()).toHaveAttribute("data-date", /^2026-11-/);
    await expect(page.getByTestId("cal-today")).toBeEnabled();
    await page.getByTestId("cal-today").click();
    await expect(page.getByTestId("cal-title")).toHaveText(first);
    await expect(day(page, "2026-10-15")).toHaveAttribute("aria-pressed", "true");

    await page.getByTestId("cal-prev").click(); // the month before: September 2026 is saved
    await expect(page.getByTestId("cal-year")).toHaveText("1448");
    await expect(page.getByTestId("cal-nav-problem")).toHaveCount(0);
    const prior = await page.getByTestId("cal-title").innerText();
    await page.getByTestId("cal-prev").click(); // and the one before that needs August 2026, which the service does not answer
    await expect(page.getByTestId("cal-nav-problem")).toContainText("could not be loaded");
    await expect(page.getByTestId("cal-title")).toHaveText(prior); // it stays where it was
    await expect(page.getByTestId("cal-nav-retry")).toBeVisible();
  });

  test("no connection and nothing saved: a clear message and Try again, never a blank page; with the connection back it loads", async ({ context, page }) => {
    await setup(context, NOW, {}, "network");
    await page.goto("/calender");
    await expect(page.getByTestId("cal-unavailable")).toContainText("needs a connection once");
    await expect(page.getByTestId("cal-loading")).toHaveCount(0); // no spinner for ever
    hijri.mode = "ok";
    await page.getByTestId("cal-retry").click();
    await expect(page.getByTestId("cal-title")).toBeVisible();
  });

  test("a month seen before is there with no connection; one never seen says it needs a connection once", async ({ context, page }) => {
    await setup(context);
    await open(page);
    await expect.poll(() => hijri.gcalls.length).toBeGreaterThanOrEqual(8); // the rest of the window (8 months) is fetched after the first paint
    await page.waitForLoadState("networkidle");
    hijri.mode = "network";
    await page.getByTestId("cal-next").click(); // saved a moment ago
    await expect(page.getByTestId("cal-nav-problem")).toHaveCount(0);
    await page.getByTestId("cal-today").click();
    await page.getByTestId("cal-prev").click();
    await page.getByTestId("cal-prev").click(); // needs August 2026, never saved
    await expect(page.getByTestId("cal-nav-problem")).toContainText("not saved on this device");
  });
});

test.describe("events", () => {
  test("Ramadan 1448: the shared events show for everyone, the Ja'fari ones only in their view, Both shows all", async ({ context, page }) => {
    await setup(context, DAY12);
    await open(page); // no fiqh chosen: Both
    await expect(page.getByTestId("cal-title")).toContainText(/Rama/);
    await expect(page.getByTestId("cal-title-ar")).toBeVisible();
    await hday(page, 1).click();
    await expect(page.getByTestId("cal-event-name")).toHaveText("Start of Ramadan");
    await expect(hday(page, 1).getByTestId("cal-dot-event")).toBeVisible();
    await hday(page, 15).click();
    await expect(page.getByTestId("cal-event-name")).toHaveText("Birth of Imam Hasan al-Mujtaba");
    await expect(page.getByTestId("cal-event").getByText("Ja’fari")).toBeVisible();
    await expect(page.getByTestId("cal-event-name")).toHaveCount(1);
    await hday(page, 21).click();
    await expect(page.getByTestId("cal-event-name")).toHaveText(["Martyrdom of Imam Ali", "Laylat al-Qadr (possible night)"]);
  });

  test("following the Sunni view hides the Ja'fari events; following Ja'fari shows them", async ({ context, page }) => {
    await setup(context, DAY12, { prayerFiqh: "sunni" });
    await open(page);
    await hday(page, 15).click();
    await expect(page.getByTestId("cal-day-empty")).toBeVisible();
    await expect(hday(page, 15).getByTestId("cal-dot-event")).toHaveCount(0);
    await hday(page, 21).click();
    await expect(page.getByTestId("cal-event-name")).toHaveText(["Laylat al-Qadr (possible night)"]);
  });

  test("following the Ja'fari view shows its events on their days", async ({ context, page }) => {
    await setup(context, DAY12, { prayerFiqh: "jafari" });
    await open(page);
    await hday(page, 15).click();
    await expect(page.getByTestId("cal-event-name")).toHaveText("Birth of Imam Hasan al-Mujtaba");
    await hday(page, 12).click();
    await expect(page.getByTestId("cal-day-kicker")).toHaveText("Today");
  });

  test("Coming up: at most five, nearest first, events from the saved months and your reminders", async ({ context, page }) => {
    await setup(context, NOW, { [REMINDERS]: JSON.stringify([{ id: "r1", title: "Visit family", date: "2026-10-25", note: "", recurringYearly: false, done: false, createdAt: 1 }]) });
    await open(page);
    await expect(page.getByTestId("cal-up-row").first()).toBeVisible();
    const rows = page.getByTestId("cal-up-row");
    expect(await rows.count()).toBeLessThanOrEqual(5);
    const dates = await rows.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.date!));
    expect([...dates].sort()).toEqual(dates);
    await expect(rows.first()).toContainText("Visit family");
    await expect(rows.first()).toContainText("Your reminder · in 10 days");
    await expect(rows.nth(1)).toHaveAttribute("data-kind", "event");
  });
});

test.describe("reminders", () => {
  test("Add reminder: the day is filled in, it is saved to your list in the legacy shape, shows on its day and in Coming up; Undo and Remove both work", async ({ context, page }) => {
    await setup(context);
    await open(page);
    await day(page, "2026-10-25").click();
    await page.getByTestId("cal-add").click();
    await expect(page.getByTestId("cal-rem-date")).toHaveValue("2026-10-25");
    await expect(page.getByTestId("cal-rem-save")).toBeDisabled(); // a title is needed
    await page.getByTestId("cal-rem-title").fill("Visit family");
    await page.getByTestId("cal-rem-save").click();
    await expect(toast(page, "Saved to your list: Visit family. No alert is sent.")).toBeVisible();
    const list = await reminders(page);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ title: "Visit family", date: "2026-10-25", note: "", recurringYearly: false, done: false });
    expect(list[0]!.repeat).toBeUndefined();
    await expect(page.getByTestId("cal-reminder-title")).toHaveText("Visit family");
    await expect(day(page, "2026-10-25").getByTestId("cal-dot-reminder")).toBeVisible();
    await expect(page.getByTestId("cal-up-row").first()).toContainText("Visit family");

    await toast(page, "Saved to your list").getByRole("button", { name: "Undo" }).click(); // Undo takes it back
    expect(await reminders(page)).toHaveLength(0);
    await expect(day(page, "2026-10-25").getByTestId("cal-dot-reminder")).toHaveCount(0);

    await page.getByTestId("cal-add").click();
    await page.getByTestId("cal-rem-title").fill("Visit family");
    await page.getByTestId("cal-rem-title").press("Enter");
    await page.getByTestId("cal-reminder-remove").click();
    await expect(toast(page, "Removed “Visit family”.")).toBeVisible();
    expect(await reminders(page)).toHaveLength(0);
    await toast(page, "Removed").getByRole("button", { name: "Undo" }).click();
    expect(await reminders(page)).toHaveLength(1);
    await expect(page.getByTestId("cal-reminder-title")).toHaveText("Visit family");
  });

  test("Repeat every year: by Hijri date is the default, by Gregorian date is the other; the legacy recurringYearly is left alone", async ({ context, page }) => {
    await setup(context);
    await open(page);
    await day(page, "2026-10-25").click(); // 14 Jumada al-ula 1448
    await page.getByTestId("cal-add").click();
    await page.getByTestId("cal-rem-title").fill("Fast");
    await expect(page.getByTestId("cal-rem-by")).toHaveCount(0); // only when repeating
    await page.getByTestId("cal-rem-repeat").click();
    await expect(page.getByTestId("cal-rem-by-hijri")).toBeChecked();
    await page.getByTestId("cal-rem-save").click();
    await day(page, "2026-10-26").click();
    await page.getByTestId("cal-add").click();
    await page.getByTestId("cal-rem-title").fill("Visit");
    await page.getByTestId("cal-rem-repeat").click();
    await page.getByTestId("cal-rem-by-gregorian").check();
    await page.getByTestId("cal-rem-save").click();
    const list = await reminders(page);
    expect(list.find((r) => r.title === "Fast")).toMatchObject({ date: "2026-10-25", recurringYearly: false, repeat: { by: "hijri", month: 5, day: 14 } });
    expect(list.find((r) => r.title === "Visit")).toMatchObject({ date: "2026-10-26", recurringYearly: false, repeat: { by: "gregorian" } });
    await day(page, "2026-10-26").click();
    await expect(page.getByTestId("cal-reminder-repeat")).toHaveText("Every year · by Gregorian date");
  });

  test("by Hijri date, a day whose Hijri date is not saved offers only the Gregorian choice and says why", async ({ context, page }) => {
    await setup(context);
    await open(page);
    await page.getByTestId("cal-add").click();
    await page.getByTestId("cal-rem-title").fill("Far away");
    await page.getByTestId("cal-rem-date").fill("2031-03-04");
    await page.getByTestId("cal-rem-repeat").click();
    await expect(page.getByTestId("cal-rem-by-hijri")).toBeDisabled();
    await expect(page.getByTestId("cal-rem-by-hijri-note")).toHaveText("The Hijri date of that day is not saved on this device yet.");
    await expect(page.getByTestId("cal-rem-by-gregorian")).toBeChecked();
    await page.getByTestId("cal-rem-save").click();
    expect((await reminders(page))[0]).toMatchObject({ date: "2031-03-04", repeat: { by: "gregorian" } });
  });

  test("a repeating reminder shows on each day it falls on; the old app's reminders and their fields are kept", async ({ context, page }) => {
    const old = { id: "old", title: "Old reminder", date: "2026-10-20", note: "n", recurringYearly: true, done: false, createdAt: 5, colour: "red" };
    const hij = { id: "h", title: "Every 14th", date: "2026-10-25", note: "", recurringYearly: false, done: false, createdAt: 6, repeat: { by: "hijri", month: 5, day: 14 } };
    const greg = { id: "g", title: "Every 3 Nov", date: "2025-11-03", note: "", recurringYearly: false, done: false, createdAt: 7, repeat: { by: "gregorian" } };
    await setup(context, NOW, { [REMINDERS]: JSON.stringify([old, hij, greg]) });
    await open(page);
    await day(page, "2026-10-25").click();
    await expect(page.getByTestId("cal-reminder-title")).toHaveText("Every 14th");
    await day(page, "2026-10-20").click();
    await expect(page.getByTestId("cal-reminder-title")).toHaveText("Old reminder");
    await day(page, "2026-11-03").click(); // the 3rd of November, from 2025 on (still in this Hijri month)
    await expect(page.getByTestId("cal-reminder-title")).toHaveText("Every 3 Nov");
    await day(page, "2026-10-21").click();
    await page.getByTestId("cal-add").click();
    await page.getByTestId("cal-rem-title").fill("New one");
    await page.getByTestId("cal-rem-save").click();
    const list = await reminders(page);
    expect(list.slice(0, 3)).toEqual([old, hij, greg]);
    expect(list).toHaveLength(4);
  });
});

test.describe("looks and rules", () => {
  for (const [name, viewport, theme] of [["desktop light", { width: 1280, height: 900 }, "light"], ["phone dark", { width: 375, height: 760 }, "dark"]] as const) {
    test(`${name}: no sideways scroll, touch targets of at least 44px on a phone, no console errors, nothing that counts or scolds`, async ({ context, page }) => {
      await setup(context, NOW, { themeMode: theme, [REMINDERS]: JSON.stringify([{ id: "r1", title: "A reminder with quite a long title that goes on and on", date: "2026-10-25", note: "", recurringYearly: false, done: false, createdAt: 1 }]) });
      await page.setViewportSize(viewport);
      const errs = errors(page);
      await open(page);
      await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^((?!dark).)*$/);
      expect(await noScroll(page)).toBe(true);
      if (viewport.width < 500) {
        for (const id of ["cal-prev", "cal-next", "cal-today", "cal-add"]) expect((await page.getByTestId(id).boundingBox())!.height, id).toBeGreaterThanOrEqual(44);
        for (const b of await page.getByTestId("cal-day").all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);
        for (const b of await page.getByRole("radio").all()) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      await day(page, "2026-10-25").click();
      expect(await noScroll(page)).toBe(true);
      await page.getByTestId("cal-add").click();
      await expect(page.getByTestId("cal-reminder-sheet")).toBeVisible();
      expect(await noScroll(page)).toBe(true);
      if (viewport.width < 500) for (const id of ["cal-rem-save", "cal-rem-title", "cal-rem-date"]) expect((await page.getByTestId(id).boundingBox())!.height, id).toBeGreaterThanOrEqual(44);
      await expect(page.locator("body")).not.toContainText(/streak|points|badge|behind|missed/i);
      expect(errs).toEqual([]);
    });
  }

  test("the month name is never letter-spaced or cut off, and the Arabic name follows the Arabic size setting", async ({ context, page }) => {
    await setup(context);
    await open(page);
    const css = () => page.getByTestId("cal-title-ar").evaluate((el) => ({ ls: getComputedStyle(el).letterSpacing, ov: getComputedStyle(el).textOverflow, fs: parseFloat(getComputedStyle(el).fontSize) }));
    const base = await css();
    expect(base.ls === "normal" || base.ls === "0px").toBe(true);
    expect(base.ov).toBe("clip");
    await page.evaluate(() => document.documentElement.style.setProperty("--arabic-font-scale", "1.5"));
    expect((await css()).fs).toBeCloseTo(base.fs * 1.5, 0);
  });
});
