// Phase 8B: the Events tab in a real browser, on the production build. The calendar months are RECORDED REAL responses from the service
// (`gToHCalendar`, Sep 2026 to Sep 2027). Every unmocked request to a real API fails the test; the clock is fixed. See docs/phases/phase-08b-events.md.
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { forbidRealApis, freezeClock, idbNames, LAHORE_LEGACY, mockAladhan, mockHijri, mockVerse, readStorage, seed, type HijriMock } from "./mocks";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });

const BEFORE = "2026-10-15T09:14:00+05:00"; // the first event in the list is 82 days away
const DAY12 = "2027-02-19T09:14:00+05:00";

let leaks: string[] = [];
let hijri: HijriMock;
async function setup(context: BrowserContext, now: string, seeds: Record<string, string> = {}) {
  leaks = await forbidRealApis(context);
  await freezeClock(context, now);
  await mockAladhan(context);
  hijri = await mockHijri(context);
  await mockVerse(context);
  await seed(context, { last_location: LAHORE_LEGACY, ...seeds });
}
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

const rows = (page: Page) => page.getByTestId("event-row");
const row = (page: Page, name: string, date?: string) => page.locator(`[data-testid="event-row"]${date ? `[data-date="${date}"]` : ""}`).filter({ hasText: name }).first();
const toast = (page: Page, text: string) => page.locator("[data-sonner-toast]").filter({ hasText: text });
async function open(page: Page, q = "") {
  await page.goto(`/ramadan?tab=events${q}`);
  await expect(page.getByRole("heading", { level: 1, name: "Ramadan" })).toBeVisible();
  await expect(page.getByTestId("events-panel")).toBeVisible();
}
const reminders = async (page: Page) => JSON.parse((await readStorage(page))["quran:reminders:v1"] ?? "[]") as Array<Record<string, unknown>>;
async function show(page: Page, label: string) {
  await page.getByRole("button", { name: /^Show: / }).click();
  await page.getByRole("menuitemradio", { name: label, exact: true }).or(page.getByRole("option", { name: label, exact: true })).click();
}

test.describe("the list", () => {
  test("the first six months: 18 events grouped by month, 'Next' on the first, every date 'Expected', Both as the default when no fiqh has been set", async ({ context, page }) => {
    await setup(context, BEFORE);
    await open(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByTestId("tab-events")).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("events-month")).toHaveText(["January 2027", "February 2027", "March 2027"]);
    await expect(rows(page)).toHaveCount(18);
    const first = row(page, "Isra and Mi'raj");
    await expect(first.getByTestId("event-marker")).toHaveText("Next");
    await expect(first.getByTestId("event-date")).toHaveText("Expected Tuesday 5 January 2027 · 27 Rajab 1448 · in 82 days");
    for (const d of await page.getByTestId("event-date").allTextContents()) expect(d).toMatch(/^Expected \w+day \d+ \w+ 2027 · /);
    await expect(page.getByRole("button", { name: /^Show: / })).toContainText("Both"); // no fiqh set: Both
    await expect(page.getByTestId("events-footer")).toHaveText("Dates and this list follow this app’s data. They are not a ruling.");
    await expect(page.getByTestId("events-basis")).toContainText("Dates follow the Hijri Calendar of Saudi Arabia (HJCoSA). Local sighting can differ by a day.");
    expect(await idbNames(page)).not.toContain("quran-app-db");
  });

  test("a Hijri day with two entries gives two rows, each with its own tag; the data's own note shows verbatim", async ({ context, page }) => {
    await setup(context, BEFORE);
    await open(page);
    await expect(page.locator('[data-testid="event-row"][data-date="2027-01-05"]')).toHaveCount(2);
    await expect(row(page, "Isra and Mi'raj").getByTestId("event-tradition")).toHaveText("Sunni");
    await expect(row(page, "Mab'ath").getByTestId("event-tradition")).toHaveText("Ja’fari");
    await expect(row(page, "Mab'ath").getByTestId("event-note")).toHaveText("Commemorates the Prophet's first revelation and commissioning as Messenger.");
    await expect(row(page, "Laylat al-Bara'at").getByTestId("event-note")).toHaveText("The night of the middle of Sha'ban, widely observed as a night of forgiveness.");
    await expect(row(page, "Laylat al-Bara'at").getByTestId("event-tradition")).toHaveText("Both");
    await expect(row(page, "Isra and Mi'raj").getByTestId("event-note")).toHaveCount(0); // no description is invented
    await expect(row(page, "Eid al-Fitr").getByTestId("event-category")).toHaveText("Major");
    await expect(row(page, "Martyrdom of Imam Ali").getByTestId("event-category")).toHaveText("Martyrdom");
  });

  test("the five Laylat al-Qadr entries stay five rows, as the data has them", async ({ context, page }) => {
    await setup(context, BEFORE);
    await open(page);
    await expect(page.getByTestId("event-name").filter({ hasText: "Laylat al-Qadr (possible night)" })).toHaveCount(5);
  });

  test("the Both / Sunni / Ja'fari view: Following by default once a fiqh is set; Sunni gets the plain few-events line; nothing is invented to fill it", async ({ context, page }) => {
    await setup(context, BEFORE, { prayerFiqh: "sunni" });
    await open(page);
    await expect(page.getByRole("button", { name: /^Show: / })).toContainText("Following (Sunni)");
    await expect(rows(page)).toHaveCount(10); // 9 shared and 1 Sunni
    await expect(page.getByTestId("event-tradition").filter({ hasText: "Ja’fari" })).toHaveCount(0);
    await expect(page.getByTestId("events-few")).toHaveText("Only a few events are recorded for this tradition so far.");
    await show(page, "Both");
    await expect(page).toHaveURL(/show=both/);
    await expect(rows(page)).toHaveCount(18);
    await expect(page.getByTestId("events-few")).toHaveCount(0);
    await show(page, "Ja’fari");
    await expect(rows(page)).toHaveCount(17);
    await expect(page.getByTestId("events-few")).toHaveCount(0); // 13 events of its own
    await expect(page.getByTestId("event-tradition").filter({ hasText: "Sunni" })).toHaveCount(0);
    await page.goto("/ramadan?tab=events&show=sunni");
    await expect(rows(page)).toHaveCount(10);
  });

  test("Following the Ja'fari fiqh: 17 rows and no few-events line", async ({ context, page }) => {
    await setup(context, BEFORE, { prayerFiqh: "jafari" });
    await open(page);
    await expect(page.getByRole("button", { name: /^Show: / })).toContainText("Following (Ja’fari)");
    await expect(rows(page)).toHaveCount(17);
    await expect(page.getByTestId("events-few")).toHaveCount(0);
  });

  test("the Following control at the top changes the global fiqh, and the events view follows it", async ({ context, page }) => {
    await setup(context, BEFORE, { prayerFiqh: "sunni" });
    await open(page);
    await expect(rows(page)).toHaveCount(10);
    await page.getByRole("radio", { name: "Ja’fari" }).click();
    expect(await page.evaluate(() => localStorage.getItem("prayerFiqh"))).toBe("jafari");
    await expect(rows(page)).toHaveCount(17);
  });
});

test.describe("dates: the service's days, the adjustment, offline", () => {
  test("the first load fetches the months once (Sep 2026 to Apr 2027: the window and one month each side) and saves them; a reload makes no request", async ({ context, page }) => {
    await setup(context, BEFORE);
    await open(page);
    await expect(rows(page)).toHaveCount(18);
    const months = hijri.gcalls.map((u) => u.replace(/.*gToHCalendar\//, "")).sort();
    expect(months).toEqual(["10/2026", "11/2026", "12/2026", "1/2027", "2/2027", "3/2027", "4/2027", "9/2026"].sort());
    hijri.gcalls.length = 0;
    hijri.mode = "network";
    await page.reload();
    await expect(rows(page)).toHaveCount(18); // from the saved months, with no network
    expect(hijri.gcalls).toEqual([]);
  });

  test("the Hijri adjustment moves the displayed dates only: +1 a day earlier, -1 a day later, and the saved month is untouched", async ({ context, page }) => {
    await setup(context, BEFORE, { "quran:hijri-adjust:v1": JSON.stringify({ days: 1 }) });
    await open(page);
    await expect(row(page, "Isra and Mi'raj").getByTestId("event-date")).toContainText("Expected Monday 4 January 2027 · 27 Rajab 1448 · in 81 days");
    await expect(page.getByTestId("events-basis")).toContainText("Adjusted by +1 day");
    const saved = await page.evaluate(
      () =>
        new Promise<{ days: { date: string; hDay: number; hMonth: number }[] }>((res) => {
          const r = indexedDB.open("quran-revamp-db");
          r.onsuccess = () => {
            const q = r.result.transaction("hijri-months").objectStore("hijri-months").get("g:2027-01");
            q.onsuccess = () => res(q.result);
          };
        }),
    );
    const d = saved.days.find((x) => x.hMonth === 7 && x.hDay === 27)!;
    expect(d.date).toBe("2027-01-05"); // the service's own day, never shifted
  });

  test("-1 shows the events a day later", async ({ context, page }) => {
    await setup(context, BEFORE, { "quran:hijri-adjust:v1": JSON.stringify({ days: -1 }) });
    await open(page);
    await expect(row(page, "Eid al-Fitr").getByTestId("event-date")).toContainText("Expected Wednesday 10 March 2027");
  });

  test("no connection and nothing saved: 'Dates need a connection once.' with Try again, and it recovers", async ({ context, page }) => {
    await setup(context, BEFORE);
    hijri.mode = "network";
    await open(page);
    await expect(page.getByTestId("events-no-dates")).toContainText("Dates need a connection once.");
    await expect(rows(page)).toHaveCount(0);
    hijri.mode = "ok";
    await page.getByTestId("events-retry").click();
    await expect(rows(page)).toHaveCount(18);
  });

  test("a service error is reported (not a guess)", async ({ context, page }) => {
    await setup(context, BEFORE);
    hijri.mode = "http500";
    await open(page);
    await expect(page.getByTestId("events-no-dates")).toContainText("Couldn’t load the calendar");
  });

  test("some months saved and one not: the list has what is saved and says later months need a connection once", async ({ context, page }) => {
    await setup(context, BEFORE);
    await context.route(/gToHCalendar\/3\/2027/, (r) => r.abort("internetdisconnected"));
    await open(page);
    await expect(page.getByTestId("events-partial")).toHaveText("Dates for later months need a connection once.");
    await expect(page.getByTestId("events-month")).toHaveText(["January 2027", "February 2027"]);
    await expect(rows(page)).toHaveCount(13); // March's events are not guessed (7 in January, 6 in February)
  });

  test("Show later events adds six months (the service's later months), and keeps the button until the maximum", async ({ context, page }) => {
    await setup(context, BEFORE);
    await open(page);
    await expect(rows(page)).toHaveCount(18);
    await page.getByTestId("events-later").click();
    await expect.poll(async () => (await page.getByTestId("events-month").allTextContents()).length).toBeGreaterThan(3);
    const headings = await page.getByTestId("events-month").allTextContents();
    expect(headings).toEqual(expect.arrayContaining(["March 2027", "May 2027"]));
    expect(await rows(page).count()).toBeGreaterThan(18);
    await expect(row(page, "Day of Arafah")).toBeVisible();
    await expect(page.getByTestId("events-later")).toBeVisible();
    expect(hijri.gcalls.some((u) => /gToHCalendar\/9\/2027/.test(u))).toBe(true);
  });

  test("an event on today's date is marked Today, and past events are not listed", async ({ context, page }) => {
    await setup(context, "2027-01-05T09:14:00+05:00");
    await open(page);
    await expect(row(page, "Isra and Mi'raj").getByTestId("event-marker")).toHaveText("Today");
    await expect(row(page, "Isra and Mi'raj").getByTestId("event-date")).toContainText("today");
    for (const d of await rows(page).evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.date!))) expect(d >= "2027-01-05", d).toBe(true); // nothing before today is listed
  });
});

test.describe("reminders: saved to your list, and visible", () => {
  test("the bell saves a reminder in the legacy shape with a toast that says no alert is sent; the list shows it; the row says Saved to your list", async ({ context, page }) => {
    await setup(context, BEFORE);
    await open(page);
    await expect(page.getByTestId("reminders-empty")).toContainText("No reminders yet.");
    const bell = row(page, "Eid al-Fitr").getByTestId("event-bell");
    await expect(bell).toHaveAttribute("aria-pressed", "false");
    await expect(bell).toHaveAccessibleName("Save a reminder for Eid al-Fitr");
    await bell.click();
    await expect(toast(page, "Saved to your list: Eid al-Fitr. No alert is sent.")).toBeVisible();
    await expect(bell).toHaveAttribute("aria-pressed", "true");
    await expect(bell).toHaveAccessibleName("Remove the reminder for Eid al-Fitr");
    await expect(row(page, "Eid al-Fitr").getByTestId("event-saved")).toHaveText("Saved to your list");
    const list = await reminders(page);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ title: "Eid al-Fitr", date: "2027-03-09", note: "", recurringYearly: false, done: false });
    expect(Object.keys(list[0]!).sort()).toEqual(["createdAt", "date", "done", "id", "note", "recurringYearly", "title"]);
    const item = page.getByTestId("reminders").locator("[data-reminder]");
    await expect(item).toHaveCount(1);
    await expect(item.getByTestId("reminder-title")).toHaveText("Eid al-Fitr");
    await expect(item.getByTestId("reminder-date")).toHaveText("Expected Tuesday 9 March 2027");
    await expect(page.getByTestId("reminders-note")).toContainText("Saved to your list. No alert is sent.");
    await page.reload();
    await expect(row(page, "Eid al-Fitr").getByTestId("event-bell")).toHaveAttribute("aria-pressed", "true"); // kept across a visit
  });

  test("Undo takes the reminder back; the bell again removes it (with Undo); the same event and day is never saved twice", async ({ context, page }) => {
    await setup(context, BEFORE);
    await open(page);
    const bell = row(page, "Eid al-Fitr").getByTestId("event-bell");
    await bell.click();
    await toast(page, "Saved to your list: Eid al-Fitr").getByRole("button", { name: "Undo" }).click();
    expect(await reminders(page)).toHaveLength(0);
    await bell.click({ force: true }); // a toast can sit over the row for a few seconds
    expect(await reminders(page)).toHaveLength(1);
    await bell.click({ force: true });
    await expect(toast(page, "Removed the reminder for Eid al-Fitr")).toBeVisible();
    expect(await reminders(page)).toHaveLength(0);
    await toast(page, "Removed the reminder for Eid al-Fitr").getByRole("button", { name: "Undo" }).click();
    expect(await reminders(page)).toHaveLength(1);
  });

  test("the list: done hides one, delete has Undo, a legacy reminder from the old app is listed (upcoming first, then past)", async ({ context, page }) => {
    const old = [
      { id: "old1", title: "From the old app", date: "2026-12-01", note: "", recurringYearly: false, done: false, createdAt: 1 },
      { id: "old2", title: "A past one", date: "2026-09-01", note: "", recurringYearly: false, done: false, createdAt: 2 },
    ];
    await setup(context, BEFORE, { "quran:reminders:v1": JSON.stringify(old) });
    await open(page);
    await expect(page.getByTestId("reminder-upcoming")).toHaveCount(1);
    await expect(page.getByTestId("reminder-overdue")).toHaveCount(1);
    await expect(page.getByTestId("reminder-overdue").getByTestId("reminder-date")).toContainText("· past");
    await page.getByTestId("reminder-upcoming").getByTestId("reminder-delete").click();
    await expect(toast(page, "Removed the reminder for From the old app")).toBeVisible();
    await toast(page, "Removed the reminder for From the old app").getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("reminder-upcoming")).toHaveCount(1);
    await page.getByTestId("reminder-overdue").getByTestId("reminder-done").click({ force: true }); // it leaves the list when done (so no check() verification); a toast can sit over the list
    await expect(page.getByTestId("reminder-overdue")).toHaveCount(0);
    const list = await reminders(page);
    expect(list.find((r) => r.id === "old2")!.done).toBe(true);
    expect(list.find((r) => r.id === "old1")).toMatchObject({ title: "From the old app" }); // untouched fields
  });

  test("the bell works from the keyboard", async ({ context, page }) => {
    await setup(context, BEFORE);
    await open(page);
    const bell = row(page, "Isra and Mi'raj").getByTestId("event-bell");
    await bell.focus();
    await page.keyboard.press("Enter");
    await expect(bell).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Space");
    await expect(bell).toHaveAttribute("aria-pressed", "false");
  });
});

test.describe("the page around it", () => {
  test("Today shows the next event before Ramadan, linking to Events; during Ramadan it does not", async ({ context, page }) => {
    await setup(context, BEFORE);
    await page.goto("/ramadan");
    await expect(page.getByTestId("next-event-name")).toHaveText("Isra and Mi'raj");
    await expect(page.getByTestId("next-event-date")).toContainText("Expected Tuesday 5 January 2027 · 27 Rajab 1448 · in 82 days");
    await page.getByTestId("next-event-link").click();
    await expect(page.getByTestId("tab-events")).toHaveAttribute("aria-current", "page");
  });

  test("following the Ja'fari fiqh the next event is the first Ja'fari or shared one", async ({ context, page }) => {
    await setup(context, BEFORE, { prayerFiqh: "jafari" });
    await page.goto("/ramadan");
    await expect(page.getByTestId("next-event-name")).toHaveText("Mab'ath — Prophet's Commissioning");
  });

  test("during Ramadan the Today tab has no next-event card", async ({ context, page }) => {
    await setup(context, DAY12);
    await page.goto("/ramadan");
    await expect(page.getByTestId("day-count")).toBeVisible();
    await expect(page.getByTestId("next-event")).toHaveCount(0);
  });

  test("Home is unchanged: no event card and no calendar request for events", async ({ context, page }) => {
    await setup(context, BEFORE);
    await page.goto("/");
    await expect(page.getByTestId("resume-card")).toBeVisible();
    await expect(page.getByText(/Isra and Mi'raj|Next event/)).toHaveCount(0);
    expect(hijri.gcalls).toEqual([]);
  });

  test("Reset settings keeps the reminders; Clear all removes them", async ({ context, page }) => {
    await setup(context, BEFORE, { "quran:reminders:v1": JSON.stringify([{ id: "r1", title: "Keep me", date: "2027-01-01", note: "", recurringYearly: false, done: false, createdAt: 1 }]) });
    await page.goto("/settings?section=data");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("reset").click();
    expect((await reminders(page)).map((r) => r.id)).toEqual(["r1"]);
    await page.getByTestId("clear").click();
    await Promise.all([page.waitForEvent("load"), page.getByTestId("clear-yes").click()]);
    await page.waitForLoadState("networkidle");
    expect((await readStorage(page))["quran:reminders:v1"]).toBeUndefined();
  });

  test("dark mode uses the dark theme", async ({ context, page }) => {
    await setup(context, BEFORE, { themeMode: "dark" });
    await open(page);
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
  });

  test.describe("375px", () => {
    test.use({ viewport: { width: 375, height: 800 } });
    test("one h1, no horizontal scroll, 44px targets (tabs, the Show menu, the bell, Show later events, reminder controls)", async ({ context, page }) => {
      await setup(context, BEFORE, { "quran:reminders:v1": JSON.stringify([{ id: "r1", title: "A reminder", date: "2027-01-01", note: "", recurringYearly: false, done: false, createdAt: 1 }]) });
      await open(page);
      const noScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      await expect(rows(page)).toHaveCount(18);
      expect(await noScroll()).toBe(true);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      for (const id of ["tab-today", "tab-timetable", "tab-events", "events-later"]) expect((await page.getByTestId(id).boundingBox())!.height, id).toBeGreaterThanOrEqual(43.5);
      expect((await page.getByRole("button", { name: /^Show: / }).boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      for (const b of (await page.getByTestId("event-bell").all()).slice(0, 4)) expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      expect((await page.getByTestId("reminder-delete").boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      expect((await page.getByTestId("reminder-done").locator("xpath=..").boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    });
  });
});
