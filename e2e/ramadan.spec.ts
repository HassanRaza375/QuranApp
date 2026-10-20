// Phase 8A: Ramadan (Today and Timetable) in a real browser, on the production build. The calendar service and the prayer months are
// RECORDED REAL responses (Ramadan 1448 is 8 Feb to 8 Mar 2027 by the Hijri Calendar of Saudi Arabia; Lahore, Sunni and Ja'fari). Every
// unmocked request to a real API fails the test; the clock is fixed in each state. See docs/phases/phase-08a-ramadan.md.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { forbidRealApis, freezeClock, idbNames, LAHORE_LEGACY, mockAladhan, mockHijri, mockVerse, readStorage, seed, type AladhanMock, type HijriMock } from "./mocks";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });
const HERE = path.dirname(fileURLToPath(import.meta.url));

const BEFORE = "2026-10-15T09:14:00+05:00"; // 116 days before 8 Feb 2027
const SHABAN = "2027-01-20T09:14:00+05:00"; // 12 Sha'ban 1448
const DAY12 = "2027-02-19T09:14:00+05:00"; // Friday, Ramadan day 12
const DAY12_NIGHT = "2027-02-19T19:30:00+05:00";
const DAY21 = "2027-02-28T09:14:00+05:00"; // a Laylat al-Qadr night in the legacy data
const AFTER = "2027-03-20T09:14:00+05:00";

let leaks: string[] = [];
let aladhan: AladhanMock;
let hijri: HijriMock;
async function setup(context: BrowserContext, now: string, seeds: Record<string, string> = {}, { verse = true } = {}) {
  leaks = await forbidRealApis(context);
  await freezeClock(context, now);
  aladhan = await mockAladhan(context);
  hijri = await mockHijri(context);
  if (verse) await mockVerse(context);
  await seed(context, { last_location: LAHORE_LEGACY, ...seeds });
}
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

const open = async (page: Page, p = "/ramadan") => {
  await page.goto(p);
  await expect(page.getByRole("heading", { level: 1, name: "Ramadan" })).toBeVisible();
};
const clock12 = (hhmm: string) => {
  const h = Number(hhmm.slice(0, 2));
  return `${h % 12 === 0 ? 12 : h % 12}:${hhmm.slice(3, 5)} ${h >= 12 ? "PM" : "AM"}`;
};
/** A day's recorded times from the fixture, formatted as the page formats them. */
function timesOf(file: string, gregorian: string) {
  const data = (JSON.parse(fs.readFileSync(path.resolve(HERE, "../tests/fixtures", file), "utf8")) as { data: Array<{ date: { gregorian: { date: string } }; timings: Record<string, string> }> }).data;
  const t = data.find((d) => d.date.gregorian.date === gregorian)!.timings;
  const hm = (s: string) => s.slice(0, 5);
  return { fajr: clock12(hm(t.Fajr!)), maghrib: clock12(hm(t.Maghrib!)), imsak: clock12(hm(t.Imsak!)) };
}
const ramadanRecord = async (page: Page) => JSON.parse((await readStorage(page))["quran:ramadan:v1"] ?? "{}") as { startOverride?: string | null; fastingLog?: Record<string, string> };

test.describe("before Ramadan", () => {
  test("when it begins, from the calendar service: days until, the date, the basis; one request, no prayer-month fetch yet", async ({ context, page }) => {
    await setup(context, BEFORE);
    await open(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByTestId("until")).toHaveText("Ramadan begins in 116 days");
    await expect(page.getByTestId("expected")).toHaveText("Expected Monday 8 February 2027");
    await expect(page.getByTestId("basis")).toContainText("Dates follow the Hijri Calendar of Saudi Arabia (HJCoSA). Local sighting can differ by a day.");
    await expect(page.getByTestId("before")).toContainText("Ramadan 1448");
    expect(hijri.calls).toEqual(["https://api.aladhan.com/v1/hToGCalendar/9/1448"]);
    expect(aladhan.calls.some((u) => /\/2027\//.test(u))).toBe(false); // more than a month away: Ramadan's prayer months are not fetched yet
    await expect(page.getByTestId("fasting")).toHaveCount(0);
    expect(await idbNames(page)).not.toContain("quran-app-db");
  });

  test("Get ready shows the real settings with links; Following is the global fiqh setting", async ({ context, page }) => {
    await setup(context, BEFORE);
    await open(page);
    await expect(page.getByTestId("ready-method")).toContainText("Sunni");
    await expect(page.getByTestId("ready-hijri")).toContainText("None (0 days)");
    await expect(page.getByTestId("ready-alerts")).toContainText("Off");
    await expect(page.getByTestId("ready-method").getByTestId("ready-link")).toHaveAttribute("href", "/settings?section=prayer");
    await page.getByRole("radio", { name: "Ja’fari" }).click();
    expect(await page.evaluate(() => localStorage.getItem("prayerFiqh"))).toBe("jafari"); // the same legacy raw key Settings writes
    await expect(page.getByTestId("ready-method")).toContainText("Ja’fari");
  });

  test("the Hijri adjustment is applied in the app: +1 makes the date a day earlier, and the saved month is untouched", async ({ context, page }) => {
    await setup(context, BEFORE, { "quran:hijri-adjust:v1": JSON.stringify({ days: 1 }) });
    await open(page);
    await expect(page.getByTestId("expected")).toHaveText("Expected Sunday 7 February 2027");
    await expect(page.getByTestId("until")).toHaveText("Ramadan begins in 115 days");
    await expect(page.getByTestId("basis")).toContainText("Adjusted by +1 day");
    const saved = await page.evaluate(
      () =>
        new Promise<{ days: { date: string }[] }>((res) => {
          const r = indexedDB.open("quran-revamp-db");
          r.onsuccess = () => {
            const q = r.result.transaction("hijri-months").objectStore("hijri-months").get("1448-9");
            q.onsuccess = () => res(q.result);
          };
        }),
    );
    expect(saved.days[0]!.date).toBe("2027-02-08"); // the service's own date, never shifted
  });

  test("the legacy start-date override stands: a set date shows 'Set by you', and Use calculated date clears it", async ({ context, page }) => {
    await setup(context, BEFORE);
    await open(page);
    await page.getByTestId("start-toggle").click();
    await page.getByTestId("override-input").fill("2027-02-09");
    await page.getByTestId("override-set").click();
    await expect(page.getByTestId("expected")).toHaveText("Expected Tuesday 9 February 2027");
    await expect(page.getByTestId("basis")).toHaveText("The start date was set by you.");
    expect((await ramadanRecord(page)).startOverride).toBe("2027-02-09");
    await page.getByTestId("override-clear").click();
    await expect(page.getByTestId("expected")).toHaveText("Expected Monday 8 February 2027");
    expect((await ramadanRecord(page)).startOverride).toBeNull();
  });

  test("no invented dates: with no connection and nothing saved, it says dates need a connection once; Try again recovers", async ({ context, page }) => {
    await setup(context, BEFORE);
    hijri.mode = "network";
    await open(page);
    await expect(page.getByTestId("no-dates")).toContainText("Dates need a connection once.");
    await expect(page.getByTestId("until")).toHaveCount(0);
    hijri.mode = "ok";
    await page.getByTestId("dates-retry").click();
    await expect(page.getByTestId("until")).toHaveText("Ramadan begins in 116 days");
  });

  test("after it is saved, the date shows offline with no request", async ({ context, page }) => {
    await setup(context, BEFORE);
    await open(page);
    await expect(page.getByTestId("until")).toBeVisible();
    hijri.calls.length = 0;
    hijri.mode = "network";
    await page.reload();
    await expect(page.getByTestId("until")).toHaveText("Ramadan begins in 116 days");
    expect(hijri.calls).toEqual([]); // a month saved less than 30 days ago is used as it is
  });

  test("a failed service answer shows an error with Try again (not a guess)", async ({ context, page }) => {
    await setup(context, BEFORE);
    hijri.mode = "http500";
    await open(page);
    await expect(page.getByTestId("no-dates")).toContainText("Couldn’t load the calendar");
  });
});

test.describe("during Ramadan (day 12)", () => {
  test("the day, the date, Suhoor ends and Iftar for the chosen method; the method name; Imsak as the service gives it", async ({ context, page }) => {
    await setup(context, DAY12);
    await open(page);
    const t = timesOf("aladhan-lahore-2027-02-sunni.json", "19-02-2027");
    await expect(page.getByTestId("day-count")).toHaveText("Day 12 of 29");
    await expect(page.getByTestId("today-date")).toHaveText("Friday 19 February 2027");
    await expect(page.getByTestId("suhoor-time")).toHaveText(t.fajr);
    await expect(page.getByTestId("iftar-time")).toHaveText(t.maghrib);
    await expect(page.getByTestId("times")).toContainText("Suhoor ends");
    await expect(page.getByTestId("times-method")).toContainText("Islamic Society of North America (ISNA)");
    await expect(page.getByTestId("times-method")).toContainText(`Imsak, as the service gives it: ${t.imsak}`);
    await expect(page.getByTestId("iftar-countdown")).toContainText(/Iftar in \d+h \d+m/);
  });

  test("Ja'fari: the same neutral labels with that method's times and name, and no sentence about fiqh differences", async ({ context, page }) => {
    await setup(context, DAY12, { prayerFiqh: "jafari" });
    await open(page);
    const t = timesOf("aladhan-lahore-2027-02-jafari.json", "19-02-2027");
    await expect(page.getByTestId("suhoor-time")).toHaveText(t.fajr);
    await expect(page.getByTestId("iftar-time")).toHaveText(t.maghrib);
    await expect(page.getByTestId("times-method")).toContainText("Shia Ithna-Ashari, Leva Institute, Qum");
    const text = (await page.locator("main").innerText()).toLowerCase();
    for (const banned of ["redness", "saudi calculation", "south asia", "how it differs", "taraweeh"]) expect(text, banned).not.toContain(banned);
  });

  test("after iftar the countdown says the time has passed", async ({ context, page }) => {
    await setup(context, DAY12_NIGHT);
    await open(page);
    await expect(page.getByTestId("iftar-countdown")).toHaveText("Iftar time has passed");
  });

  test("the fasting tracker: the last 7 days, the legacy cycle, the legacy record, Plan tomorrow, no streak, no flame", async ({ context, page }) => {
    await setup(context, DAY12);
    await open(page);
    const days = page.getByTestId("fast-day");
    await expect(days).toHaveCount(7);
    await expect(days.first()).toContainText("6");
    await expect(days.last()).toContainText("12");
    const d12 = days.last();
    await d12.click();
    await expect(d12).toHaveAttribute("data-status", "fasted");
    await expect(d12.getByTestId("fast-status")).toHaveText("Fasted");
    await d12.click();
    await expect(d12).toHaveAttribute("data-status", "missed");
    await expect(d12.getByTestId("fast-status")).toHaveText("Didn’t fast");
    expect((await ramadanRecord(page)).fastingLog).toEqual({ "2027-02-19": "missed" }); // the legacy value stays "missed"
    await d12.click();
    await expect(d12).toHaveAttribute("data-status", "none");
    expect((await ramadanRecord(page)).fastingLog).toEqual({});
    await days.nth(4).click();
    await expect(page.getByTestId("fast-counts")).toHaveText("Fasted 1 · Didn’t fast 0 · Planned 0");
    await page.getByTestId("plan-tomorrow").click();
    expect((await ramadanRecord(page)).fastingLog).toMatchObject({ "2027-02-20": "planned" });
    await expect(page.getByTestId("plan-tomorrow")).toHaveText("Tomorrow: planned");
    await expect(page.getByTestId("fast-counts")).toContainText("Planned 1");
    const text = (await page.locator("main").innerText()).toLowerCase();
    for (const banned of ["streak", "flame", "you missed", "keep it up"]) expect(text, banned).not.toContain(banned);
    await expect(page.locator("svg[class*='flame'], [data-icon*='flame'], [class*='flame']")).toHaveCount(0);
  });

  test("the tracker works from the keyboard and names each day", async ({ context, page }) => {
    await setup(context, DAY12);
    await open(page);
    const last = page.getByTestId("fast-day").last();
    await expect(last).toHaveAccessibleName(/^Day 12, Fri 19 Feb: not marked\. Press to change\.$/);
    await last.focus();
    await page.keyboard.press("Enter");
    await expect(last).toHaveAccessibleName(/Day 12, Fri 19 Feb: Fasted/);
    await expect(page.getByTestId("fast-announce")).toHaveText("Day 12: Fasted");
  });

  test("the legacy record is kept: other fields survive and an existing log shows", async ({ context, page }) => {
    await setup(context, DAY12, { "quran:ramadan:v1": JSON.stringify({ startOverride: null, fastingLog: { "2027-02-15": "fasted", "2027-02-16": "missed" }, future: { keep: true } }) });
    await open(page);
    await expect(page.getByTestId("fast-day").filter({ hasText: "8" }).first()).toBeVisible();
    await expect(page.locator('[data-testid="fast-day"][data-status="fasted"]')).toHaveCount(1);
    await page.getByTestId("fast-day").last().click();
    const rec = JSON.parse((await readStorage(page))["quran:ramadan:v1"]!);
    expect(rec.future).toEqual({ keep: true });
    expect(rec.fastingLog["2027-02-15"]).toBe("fasted");
  });

  test("Khatmah is read-only: with no goal it says so and links to reading; with a Ramadan Khatmah goal it shows today's count and the target", async ({ context, page }) => {
    await setup(context, DAY12);
    await open(page);
    await expect(page.getByTestId("khatmah-none")).toContainText("Reading goals in a later phase");
    await expect(page.getByTestId("khatmah-read")).toHaveAttribute("href", "/surah/1");
    await expect(page.getByTestId("khatmah").getByRole("button")).toHaveCount(0); // no way to create a goal here
  });

  test("with a stored Ramadan Khatmah goal and a reading place", async ({ context, page }) => {
    const goals = { goals: [{ id: "g1", label: "Ramadan Khatmah", status: "active", dailyAyahTarget: 216, targetDate: "2027-03-08" }], activeGoalId: "g1", dailyLog: { "2027-02-19": ["1:1", "1:2", "1:3"] } };
    await setup(context, DAY12, { "quran:reading-goals:v1": JSON.stringify(goals), "quran:reading-progress:v1": JSON.stringify({ surahNo: 18, ayahNo: 10 }) });
    await open(page);
    await expect(page.getByTestId("khatmah-today")).toHaveText("3 of 216 ayahs today");
    await expect(page.getByTestId("khatmah-target")).toContainText("Aiming to finish by Mon 8 Mar");
    await expect(page.getByTestId("khatmah-read")).toHaveAttribute("href", "/surah/18#ayah-10");
    expect(JSON.parse((await readStorage(page))["quran:reading-goals:v1"]!)).toEqual(goals); // read only
  });

  test("Laylat al-Qadr: the legacy nights for both fiqhs, labelled as the app's data; today is marked only on one of them", async ({ context, page }) => {
    await setup(context, DAY12);
    await open(page);
    await expect(page.getByTestId("qadr-night")).toHaveText(["Night 21", "Night 23", "Night 25", "Night 27", "Night 29"]);
    await expect(page.getByTestId("qadr-source")).toHaveText("From this app’s data, the same for both fiqhs.");
    await expect(page.getByTestId("qadr-note")).toContainText("Laylat al-Qadr is traditionally sought");
    await expect(page.getByTestId("qadr-tonight")).toHaveCount(0);
    await page.getByRole("radio", { name: "Ja’fari" }).click();
    await expect(page.getByTestId("qadr-night")).toHaveText(["Night 21", "Night 23", "Night 25", "Night 27", "Night 29"]); // the same set for the other fiqh
  });

  test("day 21 is one of the nights and is marked", async ({ context, page }) => {
    await setup(context, DAY21);
    await open(page);
    await expect(page.getByTestId("day-count")).toHaveText("Day 21 of 29");
    await expect(page.getByTestId("qadr-tonight")).toHaveText("Today is one of the nights");
    await expect(page.getByTestId("qadr-night").first()).toHaveAttribute("aria-current", "date");
  });

  test("the Qur'anic dua is read from the surah text (never typed) and the hadith duas are references only", async ({ context, page }) => {
    await setup(context, DAY12);
    await open(page);
    await expect(page.getByTestId("dua-arabic")).toHaveText("TEST ARABIC 2:201");
    await expect(page.getByTestId("dua-read")).toHaveAttribute("href", "/surah/2#ayah-201");
    const refs = page.getByTestId("dua-references").locator("li");
    expect(await refs.count()).toBeGreaterThanOrEqual(3);
    await expect(page.getByTestId("dua-references")).toContainText("Abu Dawud");
    expect(await page.getByTestId("dua").locator("[lang=ar]").count()).toBe(1); // only the Qur'an's own dua has Arabic
  });

  test("with no connection and nothing cached the dua says so", async ({ context, page }) => {
    await setup(context, DAY12, {}, { verse: false });
    await context.route(/quranapi\.pages\.dev/, (r) => r.abort("internetdisconnected"));
    await open(page);
    await expect(page.getByTestId("dua-unavailable")).toContainText("Text appears once you are online or have opened this surah.");
    await expect(page.getByTestId("dua-read")).toBeVisible();
  });
});

test.describe("the Timetable", () => {
  test("29 real rows: Day, Date, Suhoor ends, Iftar; Friday and today marked; times match the saved month for the method", async ({ context, page }) => {
    await setup(context, DAY12);
    await open(page, "/ramadan?tab=timetable");
    const rows = page.getByTestId("tt-row");
    await expect(rows).toHaveCount(29);
    await expect(page.getByTestId("timetable").locator("thead th")).toHaveText(["Day", "Date", "Suhoor ends", "Iftar"]);
    await expect(rows.first()).toContainText("Mon 8 Feb");
    const t12 = timesOf("aladhan-lahore-2027-02-sunni.json", "19-02-2027");
    await expect(page.locator('[data-testid="tt-row"][data-day="12"]')).toHaveAttribute("aria-current", "date");
    await expect(page.locator('[data-testid="tt-row"][data-day="12"] [data-testid="tt-suhoor"]')).toHaveText(t12.fajr);
    await expect(page.locator('[data-testid="tt-row"][data-day="12"] [data-testid="tt-iftar"]')).toHaveText(t12.maghrib);
    await expect(page.locator('[data-testid="tt-row"][data-day="12"]')).toContainText("Friday");
    const t29 = timesOf("aladhan-lahore-2027-03-sunni.json", "08-03-2027"); // day 29 is in March: the second month
    await expect(page.locator('[data-testid="tt-row"][data-day="29"] [data-testid="tt-iftar"]')).toHaveText(t29.maghrib);
    await expect(page.getByTestId("tt-method")).toContainText("Islamic Society of North America (ISNA)");
    await expect(page.getByTestId("tt-note")).toContainText("Ramadan lasts 29 days this year by the calendar");
    await expect(page.getByTestId("tab-timetable")).toHaveAttribute("aria-current", "page");
  });

  test("Ja'fari rows use that method's times", async ({ context, page }) => {
    await setup(context, DAY12, { prayerFiqh: "jafari" });
    await open(page, "/ramadan?tab=timetable");
    const t = timesOf("aladhan-lahore-2027-02-jafari.json", "19-02-2027");
    await expect(page.locator('[data-testid="tt-row"][data-day="12"] [data-testid="tt-iftar"]')).toHaveText(t.maghrib);
    await expect(page.getByTestId("tt-method")).toContainText("Leva Institute, Qum");
  });

  test("opened before Ramadan it fetches Ramadan's months on demand (the calendar, then Feb and Mar), and the rows are real", async ({ context, page }) => {
    await setup(context, BEFORE);
    await open(page, "/ramadan?tab=timetable");
    await expect(page.getByTestId("tt-row")).toHaveCount(29);
    expect(aladhan.calls.some((u) => /\/calendar\/2027\/2\?/.test(u))).toBe(true);
    expect(aladhan.calls.some((u) => /\/calendar\/2027\/3\?/.test(u))).toBe(true);
    await expect(page.locator('[data-testid="tt-row"]:not([aria-current])').first()).toBeVisible(); // today is not in Ramadan
  });

  test("not saved and offline: it says so with Try again, and recovers; nothing is estimated", async ({ context, page }) => {
    await setup(context, BEFORE);
    aladhan.mode = "network";
    await open(page, "/ramadan?tab=timetable");
    await expect(page.getByTestId("tt-not-saved")).toContainText("Ramadan’s times are not saved on this device yet. Connect once to get them.");
    await expect(page.getByTestId("tt-row")).toHaveCount(0);
    aladhan.mode = "ok";
    await page.getByTestId("tt-retry").click();
    await expect(page.getByTestId("tt-row")).toHaveCount(29);
  });

  test("only one of the two months saved: the rows have what is saved and the others say Not saved", async ({ context, page }) => {
    await setup(context, DAY12);
    await context.route(/api\.aladhan\.com\/v1\/calendar\/2027\/3/, (r) => r.abort("internetdisconnected"));
    await open(page, "/ramadan?tab=timetable");
    await expect(page.getByTestId("tt-row")).toHaveCount(29);
    await expect(page.locator('[data-testid="tt-row"][data-day="29"] [data-testid="tt-iftar"]')).toHaveText("Not saved");
    await expect(page.getByTestId("tt-partial")).toContainText("days are not saved on this device yet");
    await expect(page.locator('[data-testid="tt-row"][data-day="12"] [data-testid="tt-iftar"]')).not.toHaveText("Not saved");
  });

  test("no location: it asks for one, and fetches nothing", async ({ context, page }) => {
    await setup(context, DAY12, { last_location: "" });
    await page.addInitScript(() => localStorage.removeItem("last_location"));
    await open(page, "/ramadan?tab=timetable");
    await expect(page.getByTestId("tt-no-location")).toContainText("Set your location to see Ramadan’s times.");
    expect(aladhan.calls).toEqual([]);
  });

  test("the tabs are buttons with aria-current and the URL follows (Back works)", async ({ context, page }) => {
    await setup(context, DAY12);
    await open(page);
    await expect(page.getByTestId("tab-today")).toHaveAttribute("aria-current", "page");
    await page.getByTestId("tab-timetable").click();
    await expect(page).toHaveURL(/tab=timetable/);
    await expect(page.getByTestId("timetable")).toBeVisible();
    await page.getByTestId("tab-today").click();
    await expect(page.getByTestId("today-panel")).toBeVisible();
    await expect(page.getByRole("tab")).toHaveCount(0); // plain buttons, no Events tab until 8B
  });
});

test.describe("Home", () => {
  test("during Ramadan a quiet banner shows the day and Iftar and links to /ramadan; no event card", async ({ context, page }) => {
    await setup(context, DAY12);
    await page.goto("/");
    const banner = page.getByTestId("ramadan-banner");
    await expect(banner).toBeVisible();
    const t = timesOf("aladhan-lahore-2027-02-sunni.json", "19-02-2027");
    await expect(banner).toContainText(`Ramadan · Day 12 · Iftar ${t.maghrib}`);
    await expect(banner).toHaveAttribute("href", "/ramadan");
    await expect(page.getByText(/next event|upcoming event/i)).toHaveCount(0);
    expect(hijri.calls).toEqual([]); // in Ramadan the prayer data is enough: no extra request from Home
  });

  test("before Ramadan there is no banner and Home makes no calendar request", async ({ context, page }) => {
    await setup(context, BEFORE);
    await page.goto("/");
    await expect(page.getByTestId("resume-card")).toBeVisible();
    await expect(page.getByTestId("ramadan-banner")).toHaveCount(0);
    expect(hijri.calls).toEqual([]);
  });

  test("in Sha'ban Home fetches Ramadan ahead (the calendar, then Ramadan's prayer months) so it works offline later", async ({ context, page }) => {
    await setup(context, SHABAN);
    await page.goto("/");
    await expect(page.getByTestId("resume-card")).toBeVisible();
    await expect.poll(() => hijri.calls.length).toBe(1);
    await expect.poll(() => aladhan.calls.some((u) => /\/calendar\/2027\/2\?/.test(u))).toBe(true);
    await expect(page.getByTestId("ramadan-banner")).toHaveCount(0);
    aladhan.mode = "network";
    hijri.mode = "network";
    await page.goto("/ramadan?tab=timetable");
    await expect(page.getByTestId("tt-row")).toHaveCount(29); // saved ahead: works with no network
  });
});

test.describe("other states", () => {
  test("after Ramadan the next one is shown (the calendar for the following year is asked for)", async ({ context, page }) => {
    await setup(context, AFTER);
    await open(page);
    // the recorded service only knows 1448; for 1449 it answers 404, so no date is guessed
    await expect(page.getByTestId("no-dates")).toBeVisible();
    await expect.poll(() => hijri.calls.some((u) => /\/9\/1449$/.test(u))).toBe(true);
  });

  test("Reset settings keeps the Ramadan record; Clear all removes it", async ({ context, page }) => {
    await setup(context, DAY12, { "quran:ramadan:v1": JSON.stringify({ startOverride: null, fastingLog: { "2027-02-15": "fasted" } }) });
    await page.goto("/settings?section=data");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("reset").click();
    expect((await ramadanRecord(page)).fastingLog).toEqual({ "2027-02-15": "fasted" });
    await page.getByTestId("clear").click();
    await Promise.all([page.waitForEvent("load"), page.getByTestId("clear-yes").click()]);
    await page.waitForLoadState("networkidle");
    expect((await readStorage(page))["quran:ramadan:v1"]).toBeUndefined();
  });

  test("dark mode uses the dark theme", async ({ context, page }) => {
    await setup(context, DAY12, { themeMode: "dark" });
    await open(page);
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
  });

  test.describe("375px", () => {
    test.use({ viewport: { width: 375, height: 800 } });
    test("one h1, no horizontal scroll, 44px targets (tabs, tracker days, Plan tomorrow, links), on Today and Timetable", async ({ context, page }) => {
      await setup(context, DAY12);
      await open(page);
      const noScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      expect(await noScroll()).toBe(true);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      for (const id of ["tab-today", "tab-timetable", "plan-tomorrow", "start-toggle"]) expect((await page.getByTestId(id).boundingBox())!.height, id).toBeGreaterThanOrEqual(43.5);
      for (const d of await page.getByTestId("fast-day").all()) expect((await d.boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      await page.getByTestId("tab-timetable").click();
      await expect(page.getByTestId("timetable")).toBeVisible();
      expect(await noScroll()).toBe(true);
    });
  });
});
