// Phase 1: Home, in a real browser (production build). Every upstream API is mocked and the clock is fixed at
// 15 Oct 2026, 09:14 in Karachi, so the results are exact. Service workers are blocked here so the mocks see every
// request; the offline suite further down allows them.
import { expect, test, type Page } from "@playwright/test";
import { AYAH_LENGTHS } from "../app/data/ayahLengths.generated";
import { buildPool, pickAyahForDate } from "../app/lib/ayahOfDay";
import { qiblaBearing } from "../app/lib/qibla";
import { loadAndControl } from "./helpers";
import { ayahEntry, forbidRealApis, freezeClock, idbNames, LAHORE_LEGACY, mockAladhan, mockVerse, readStorage, seed } from "./mocks";

const POOL = buildPool(AYAH_LENGTHS);
const pick = (date: string) => {
  const r = pickAyahForDate(date, AYAH_LENGTHS, POOL);
  return `${r.surah}:${r.ayah}`;
};

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });
let leaks: string[] = [];
test.beforeEach(async ({ context }) => {
  leaks = await forbidRealApis(context);
  await freezeClock(context);
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

const RETURNING = {
  "quran:reading-progress:v1": JSON.stringify({ surahNo: 2, ayahNo: 285, surahName: "Al-Baqarah", surahNameArabic: "x", totalAyah: 286, updatedAt: 1 }),
  "quran:persons-study:v1": JSON.stringify({ nuh: { personId: "nuh", lastSection: "key-lessons", passageView: "surah", updatedAt: 5 } }),
  "quran:reading-goals:v1": JSON.stringify({
    goals: [{ id: "g1", type: "ayahs-per-day", label: "x", startDate: "2026-10-01", targetDate: null, dailyAyahTarget: 20, startAbsoluteAyah: 1, preferredDays: [0, 1, 2, 3, 4, 5, 6], status: "active", createdAt: 1 }],
    activeGoalId: "g1",
    dailyLog: { "2026-10-15": ["2:1", "2:2", "2:3"], "2026-10-14": ["1:1"] },
  }),
  "quran:hifz:v2": JSON.stringify({ targets: [{ id: "t1" }], ayahStates: [], transitionStates: [], activity: [] }),
};

async function open(page: Page, path = "/") {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

test.describe("returning and new user", () => {
  test.beforeEach(async ({ context }) => {
    await mockAladhan(context);
    await mockVerse(context);
  });

  test("returning user: both resume rows from the legacy keys, the goal as a count, the Hifz tile", async ({ context, page }) => {
    await seed(context, { ...RETURNING, "last_location": LAHORE_LEGACY });
    await open(page);
    await expect(page.getByTestId("resume-title")).toHaveText("Pick up where you left off");
    const reading = page.getByTestId("resume-reading");
    await expect(reading).toContainText("Al-Baqarah · ayah 285 of 286");
    await expect(reading).toContainText("5% of the Qur’an completed");
    await expect(reading.getByRole("link", { name: "Continue reading" })).toHaveAttribute("href", "/surah/2#ayah-285");
    const study = page.getByTestId("resume-study");
    await expect(study).toContainText("You were reading: Key Lessons");
    await expect(study).toContainText("Nuh");
    await expect(study.getByRole("link", { name: "Continue" })).toHaveAttribute("href", "/persons/nuh");
    await expect(page.getByTestId("tile-goal")).toContainText("3 / 20 ayahs");
    await expect(page.getByTestId("tile-hifz")).toContainText("Open Hifz");
    await expect(page.getByTestId("tile-hifz")).not.toContainText(/\d/); // nothing is due in this record (its one target has no ayahs), so no count
  });

  test("the goal tile shows an ayah count only: no streak, no pace, no 'behind'", async ({ context, page }) => {
    await seed(context, RETURNING);
    await open(page);
    const text = (await page.getByTestId("util-strip").innerText()).toLowerCase();
    for (const word of ["streak", "behind", "pace", "catch up", "minutes"]) expect(text).not.toContain(word);
  });

  test("new user: Get started rows, goal Not set, Hifz Not started", async ({ page }) => {
    await open(page);
    await expect(page.getByTestId("resume-title")).toHaveText("Get started");
    await expect(page.getByTestId("resume-start")).toContainText("Start reading");
    await expect(page.getByTestId("resume-start").getByRole("link", { name: "Start reading" })).toHaveAttribute("href", "/surah/1");
    await expect(page.getByTestId("resume-explore")).toContainText("Explore Prophets & People");
    await expect(page.getByTestId("resume-explore").getByRole("link", { name: "Explore" })).toHaveAttribute("href", "/persons");
    await expect(page.getByTestId("tile-goal")).toContainText("Not set");
    await expect(page.getByTestId("tile-hifz")).toContainText("Not started");
  });

  test("mixed: reading progress only gives the reading row and the Explore row", async ({ context, page }) => {
    await seed(context, { "quran:reading-progress:v1": RETURNING["quran:reading-progress:v1"] });
    await open(page);
    await expect(page.getByTestId("resume-title")).toHaveText("Pick up where you left off");
    await expect(page.getByTestId("resume-reading")).toBeVisible();
    await expect(page.getByTestId("resume-explore")).toBeVisible();
    await expect(page.getByTestId("resume-study")).toHaveCount(0);
  });

  test("a corrupt progress record is treated as no history, not a crash", async ({ context, page }) => {
    await seed(context, { "quran:reading-progress:v1": "{not json", "quran:persons-study:v1": "[1,2]" });
    await open(page);
    await expect(page.getByTestId("resume-title")).toHaveText("Get started");
  });

  test("Home reads these keys but never writes them", async ({ context, page }) => {
    await seed(context, RETURNING);
    await open(page);
    const after = await readStorage(page);
    for (const [k, v] of Object.entries(RETURNING)) expect(after[k], k).toBe(v);
  });
});

test.describe("ayah of the day", () => {
  test("fetches the ayah picked for the local date, stores the legacy-shaped entry, and does not fetch again", async ({ context, page }) => {
    const verse = await mockVerse(context);
    await mockAladhan(context);
    await open(page);
    const expected = pick("2026-10-15");
    expect(verse.calls).toEqual([expected]);
    const [s, a] = expected.split(":");
    await expect(page.getByTestId("ayah-arabic")).toHaveText(`TEST ARABIC ${s}:${a}`);
    await expect(page.getByTestId("ayah-translation")).toHaveText(`Test English ${s}:${a}`); // English by default
    await expect(page.getByTestId("ayah-ref")).toHaveText(`TestSurah${s} ${s}:${a}`);
    const stored = JSON.parse((await readStorage(page))["ayah-of-day"]!);
    expect(stored.date).toBe("2026-10-15");
    expect(stored.localDate).toBe("2026-10-15");
    expect(stored.data).toMatchObject({ arabic: `TEST ARABIC ${s}:${a}`, translation: `Test English ${s}:${a}`, urdu: `Test Urdu ${s}:${a}`, surah_name: "TEST LONG", surah_number: Number(s), ayah_number: Number(a) });
    await page.reload();
    await page.waitForLoadState("networkidle");
    expect(verse.calls).toHaveLength(1); // same day: from the stored entry
    await expect(page.getByTestId("ayah-arabic")).toHaveText(`TEST ARABIC ${s}:${a}`);
  });

  test("uses translationDefaultLang (raw legacy key), English when unset", async ({ context, page }) => {
    await mockVerse(context);
    await mockAladhan(context);
    await seed(context, { translationDefaultLang: "urdu" });
    await open(page);
    const [s, a] = pick("2026-10-15").split(":");
    await expect(page.getByTestId("ayah-translation")).toHaveText(`Test Urdu ${s}:${a}`);
    await expect(page.getByTestId("ayah-translation")).toHaveAttribute("dir", "rtl");
    await expect(page.getByTestId("ayah-translation")).toHaveAttribute("lang", "ur");
  });

  test("the ayah changes at LOCAL midnight (east of UTC), not at the UTC date change", async ({ context, page }) => {
    await freezeClock(context, "2026-10-15T20:30:00Z"); // 01:30 on the 16th in Karachi; the UTC date is still the 15th
    const verse = await mockVerse(context);
    await mockAladhan(context);
    await seed(context, { "ayah-of-day": ayahEntry("2026-10-15", "2026-10-15") }); // yesterday's entry (legacy UTC date is "today" in UTC)
    await open(page);
    expect(verse.calls).toEqual([pick("2026-10-16")]); // the local day is the 16th, so a new ayah is fetched
    const stored = JSON.parse((await readStorage(page))["ayah-of-day"]!);
    expect(stored.localDate).toBe("2026-10-16");
    expect(stored.date).toBe("2026-10-15"); // the legacy app still compares equal to its own UTC "today"
  });

  test("an entry written by the legacy app (UTC date only) is used when it equals the local date, and replaced when not", async ({ context, page }) => {
    const verse = await mockVerse(context);
    await mockAladhan(context);
    const legacy = JSON.stringify({ date: "2026-10-15", data: JSON.parse(ayahEntry("x")).data });
    await seed(context, { "ayah-of-day": legacy });
    await open(page);
    expect(verse.calls).toHaveLength(0);
    await expect(page.getByTestId("ayah-arabic")).toContainText("SEEDED ARABIC");

    const ctx2 = await page.context().browser()!.newContext({ timezoneId: "Asia/Karachi", serviceWorkers: "block" });
    await freezeClock(ctx2);
    const verse2 = await mockVerse(ctx2);
    await mockAladhan(ctx2);
    await seed(ctx2, { "ayah-of-day": JSON.stringify({ date: "2026-10-14", data: JSON.parse(ayahEntry("x")).data }) });
    const p2 = await ctx2.newPage();
    await open(p2);
    expect(verse2.calls).toEqual([pick("2026-10-15")]);
    await ctx2.close();
  });

  test("offline or failing with nothing stored: a clear message and Try again, never a blank card", async ({ context, page }) => {
    const verse = await mockVerse(context, "network");
    await mockAladhan(context);
    await open(page);
    await expect(page.getByTestId("ayah-unavailable")).toContainText("Today’s ayah needs a connection once.");
    verse.mode = "ok";
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByTestId("ayah-arabic")).toBeVisible();
  });

  test("failing with an older ayah stored: that ayah is shown, clearly marked as saved", async ({ context, page }) => {
    await mockVerse(context, "http500");
    await mockAladhan(context);
    await seed(context, { "ayah-of-day": ayahEntry("2026-10-12") });
    await open(page);
    await expect(page.getByTestId("ayah-stale")).toContainText("last saved ayah (12 Oct)");
    await expect(page.getByTestId("ayah-arabic")).toContainText("SEEDED ARABIC");
  });

  test("Save writes the legacy bookmark keys, with an Undo toast, and keeps other bookmarks", async ({ context, page }) => {
    await mockVerse(context);
    await mockAladhan(context);
    await seed(context, { "quran:bookmarks:v1": '["surah:2"]', "quran:bookmarks:added-at:v1": '{"surah:2":1}' });
    await open(page);
    const [s, a] = pick("2026-10-15").split(":");
    const key = `ayah:${s}:${a}`;
    const save = page.getByRole("button", { name: "Save this ayah to your Library" });
    await save.click();
    let st = await readStorage(page);
    expect(JSON.parse(st["quran:bookmarks:v1"]!)).toEqual(["surah:2", key]);
    expect(Object.keys(JSON.parse(st["quran:bookmarks:added-at:v1"]!))).toEqual(["surah:2", key]);
    const toast = page.locator("[data-sonner-toast]").filter({ hasText: "Saved to your Library" });
    await expect(toast).toBeVisible();
    await toast.getByRole("button", { name: "Undo" }).click();
    st = await readStorage(page);
    expect(JSON.parse(st["quran:bookmarks:v1"]!)).toEqual(["surah:2"]);
    expect(JSON.parse(st["quran:bookmarks:added-at:v1"]!)).toEqual({ "surah:2": 1 });
    // saved, then removed with Undo to bring it back
    await save.click();
    await page.getByRole("button", { name: "Remove this ayah from your Library" }).click();
    const removed = page.locator("[data-sonner-toast]").filter({ hasText: "Removed from your Library" });
    await removed.getByRole("button", { name: "Undo" }).click();
    expect(JSON.parse((await readStorage(page))["quran:bookmarks:v1"]!)).toContain(key);
    await expect(page.getByRole("button", { name: "Remove this ayah from your Library" })).toHaveAttribute("aria-pressed", "true");
  });

  test("Share uses navigator.share with the text and link", async ({ context, page }) => {
    await mockVerse(context);
    await mockAladhan(context);
    await context.addInitScript(() => {
      (navigator as unknown as { share: (d: unknown) => Promise<void> }).share = async (d) => {
        (window as unknown as { __shared: unknown }).__shared = d;
      };
    });
    await open(page);
    await page.getByRole("button", { name: "Share this ayah" }).click();
    const shared = (await page.evaluate(() => (window as unknown as { __shared: { text: string; url: string } }).__shared))!;
    const [s, a] = pick("2026-10-15").split(":");
    expect(shared.text).toContain(`TEST ARABIC ${s}:${a}`);
    expect(shared.text).toContain(`Test English ${s}:${a}`);
    expect(shared.url).toMatch(new RegExp(`/surah/${s}#ayah-${a}$`));
  });

  test("Share falls back to the clipboard where navigator.share is missing", async ({ context, page }) => {
    await mockVerse(context);
    await mockAladhan(context);
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await context.addInitScript(() => Object.defineProperty(navigator, "share", { value: undefined, configurable: true }));
    await open(page);
    await page.getByRole("button", { name: "Share this ayah" }).click();
    await expect(page.locator("[data-sonner-toast]").filter({ hasText: "Copied to the clipboard" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("TEST ARABIC");
  });
});

test.describe("prayer times", () => {
  test.beforeEach(async ({ context }) => {
    await mockVerse(context);
  });

  test("Sunni: fetches the month for the saved place, shows the next prayer and the five times, and caches", async ({ context, page }) => {
    const aladhan = await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY, "ayah-of-day": ayahEntry("2026-10-15") });
    await open(page);
    expect(aladhan.calls).toHaveLength(1);
    expect(aladhan.calls[0]).toContain("/v1/calendar/2026/10?latitude=31.52&longitude=74.36&method=2&school=0&midnightMode=0");
    await expect(page.getByTestId("tile-prayer")).toContainText("Dhuhr · 2h 34m"); // 09:14 now, Dhuhr 11:48
    await page.getByTestId("schedule-toggle").click();
    const times: Record<string, string> = { Fajr: "4:59 AM", Dhuhr: "11:48 AM", Asr: "3:05 PM", Maghrib: "5:31 PM", Isha: "6:38 PM" };
    for (const [p, t] of Object.entries(times)) await expect(page.getByTestId(`chip-${p}`)).toContainText(t);
    await expect(page.getByTestId("chip-Dhuhr")).toHaveAttribute("aria-current", "true");
    await expect(page.getByTestId("chip-Fajr")).not.toHaveAttribute("aria-current", "true");
    await expect(page.getByTestId("schedule-method")).toContainText("ISNA");
    await expect(page.getByTestId("schedule-note")).toHaveText("Last updated today at 9:14 AM.");

    await page.reload();
    await page.waitForLoadState("networkidle");
    expect(aladhan.calls).toHaveLength(1); // the cached month, no second request
    await expect(page.getByTestId("tile-prayer")).toContainText("Dhuhr");
  });

  test("Ja'fari: asks for method 0 with the Ja'fari midnight, and shows the Ja'fari times", async ({ context, page }) => {
    const aladhan = await mockAladhan(context);
    await seed(context, { prayerFiqh: "jafari", last_location: LAHORE_LEGACY, "ayah-of-day": ayahEntry("2026-10-15") });
    await open(page);
    expect(aladhan.calls[0]).toContain("method=0&school=0&midnightMode=1");
    await page.getByTestId("schedule-toggle").click();
    await expect(page.getByTestId("chip-Fajr")).toContainText("4:54 AM");
    await expect(page.getByTestId("chip-Maghrib")).toContainText("5:46 PM"); // Sunni is 5:31 PM
    await expect(page.getByTestId("schedule-method")).toContainText("Leva Institute");
  });

  test("after Isha the next prayer is tomorrow's real Fajr (05:00 on the 17th, not the 16th's 04:59)", async ({ context, page }) => {
    await freezeClock(context, "2026-10-16T21:00:00+05:00");
    await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY, "ayah-of-day": ayahEntry("2026-10-16") });
    await open(page);
    await expect(page.getByTestId("tile-prayer")).toContainText("Fajr · 8h 0m"); // 21:00 to 05:00; today's Fajr time would give 7h 59m
    await page.getByTestId("schedule-toggle").click();
    await expect(page.getByTestId("chip-Isha")).not.toHaveAttribute("aria-current", "true"); // nothing is highlighted for today
  });

  test("at the end of the month with next month unavailable: Fajr tomorrow, no countdown and no guessed time", async ({ context, page }) => {
    await freezeClock(context, "2026-10-31T21:00:00+05:00");
    const aladhan = await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY, "ayah-of-day": ayahEntry("2026-10-31") });
    await open(page);
    expect(aladhan.calls.some((u) => u.includes("/calendar/2026/11?"))).toBe(true); // fewer than 7 days left: next month is requested in the background
    await expect(page.getByTestId("tile-prayer")).toContainText("Fajr · tomorrow");
    await expect(page.getByTestId("tile-prayer")).not.toContainText(/\dh|\dm/);
  });

  test("the legacy prayer_* keys are never written, and only quran-revamp-db is created", async ({ context, page }) => {
    await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY, prayerFiqh: "sunni", "ayah-of-day": ayahEntry("2026-10-15") });
    await open(page);
    await expect(page.getByTestId("tile-prayer")).toContainText("Dhuhr");
    const keys = Object.keys(await readStorage(page));
    expect(keys.filter((k) => k.startsWith("prayer_") || k.startsWith("calendar_v2_"))).toEqual([]);
    expect((await readStorage(page)).last_location).toBe(LAHORE_LEGACY); // read, never rewritten
    const names = await idbNames(page);
    expect(names).toContain("quran-revamp-db");
    expect(names).not.toContain("quran-app-db");
  });

  test("the Qibla tile is the bearing for the saved place", async ({ context, page }) => {
    await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY, "ayah-of-day": ayahEntry("2026-10-15") });
    await open(page);
    await expect(page.getByTestId("tile-qibla")).toContainText(`${Math.round(qiblaBearing(31.5204, 74.3587))}°`);
    await expect(page.getByTestId("tile-qibla")).toHaveAttribute("href", "/qibla-direction");
    await expect(page.getByTestId("tile-prayer")).toHaveAttribute("href", "/prayerTime");
  });

  test("no saved place: both tiles say Set location, nothing is fetched, no permission prompt on load", async ({ context, page }) => {
    const aladhan = await mockAladhan(context);
    await seed(context, { "ayah-of-day": ayahEntry("2026-10-15") });
    await context.addInitScript(() => {
      const real = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
      navigator.geolocation.getCurrentPosition = (...args) => ((window as unknown as { __geoAsked: boolean }).__geoAsked = true, real(...args));
    });
    await open(page);
    await expect(page.getByTestId("tile-prayer")).toContainText("Set location");
    await expect(page.getByTestId("tile-qibla")).toContainText("Set location");
    expect(aladhan.calls).toHaveLength(0);
    expect(await page.evaluate(() => !!(window as unknown as { __geoAsked?: boolean }).__geoAsked)).toBe(false);
  });

  test("tapping Set location asks the device, saves the place in the new key only, and loads the times", async ({ context, page }) => {
    const aladhan = await mockAladhan(context);
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 31.5204, longitude: 74.3587 });
    await seed(context, { "ayah-of-day": ayahEntry("2026-10-15") });
    await open(page);
    await page.getByTestId("tile-prayer").click();
    await expect(page.getByTestId("tile-prayer")).toContainText("Dhuhr · 2h 34m");
    expect(aladhan.calls).toHaveLength(1);
    const st = await readStorage(page);
    expect(JSON.parse(st["quran:location:v1"]!)).toMatchObject({ lat: 31.5204, lon: 74.3587, source: "device" });
    expect(st.last_location).toBeUndefined(); // the legacy key is never created
    await expect(page.getByTestId("tile-qibla")).toContainText("°");
  });

  test("a declined location shows a plain message and keeps the Set location button", async ({ context, page }) => {
    await mockAladhan(context);
    await seed(context, { "ayah-of-day": ayahEntry("2026-10-15") });
    await open(page);
    await page.getByTestId("tile-prayer").click(); // no permission granted: the browser denies it
    await expect(page.getByTestId("location-error")).toBeVisible();
    await expect(page.getByTestId("tile-prayer")).toContainText("Set location");
  });

  test("the service failing with nothing cached: a clear message, then Try again works", async ({ context, page }) => {
    const aladhan = await mockAladhan(context, "http500");
    await seed(context, { last_location: LAHORE_LEGACY, "ayah-of-day": ayahEntry("2026-10-15") });
    await open(page);
    await expect(page.getByTestId("tile-prayer")).toContainText("Unavailable");
    await page.getByTestId("schedule-toggle").click();
    await expect(page.getByTestId("schedule-failed")).toContainText("Couldn’t load prayer times (HTTP 500)");
    aladhan.mode = "ok";
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page.getByTestId("chip-Dhuhr")).toBeVisible();
    await expect(page.getByTestId("tile-prayer")).toContainText("Dhuhr");
  });

  test("there is no Update now on Home (Prayer page and Settings only)", async ({ context, page }) => {
    await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY, "ayah-of-day": ayahEntry("2026-10-15") });
    await open(page);
    await page.getByTestId("schedule-toggle").click();
    await expect(page.getByRole("button", { name: /update now/i })).toHaveCount(0);
  });
});

test.describe("offline", () => {
  test.use({ serviceWorkers: "allow" });

  test("warm: the cached month and the stored ayah show offline, with the offline note", async ({ context, page }) => {
    await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY, ...RETURNING, "ayah-of-day": ayahEntry("2026-10-15") });
    await loadAndControl(page, "/");
    await expect(page.getByTestId("tile-prayer")).toContainText("Dhuhr");
    await context.setOffline(true);
    leaks.length = 0; // from here on, requests are offline attempts that fail on purpose
    await page.reload();
    await expect(page.getByTestId("tile-prayer")).toContainText("Dhuhr · 2h 34m");
    await expect(page.getByTestId("ayah-arabic")).toContainText("SEEDED ARABIC");
    await expect(page.getByTestId("resume-reading")).toContainText("Al-Baqarah");
    await expect(page.getByTestId("tile-goal")).toContainText("3 / 20 ayahs");
    await expect(page.getByTestId("tile-qibla")).toContainText("°");
    await page.getByTestId("schedule-toggle").click();
    await expect(page.getByTestId("schedule-note")).toHaveText("You’re offline, so the saved times are still in use. Last updated today at 9:14 AM.");
    await expect(page.getByTestId("chip-Maghrib")).toContainText("5:31 PM");
  });

  test("cold: never cached and offline gives clear messages, not a blank page or an endless spinner", async ({ context, page }) => {
    await seed(context, { last_location: LAHORE_LEGACY });
    await loadAndControl(page, "/foundation"); // installs the worker while online, without caching any prayer times or ayah
    expect(leaks).toEqual([]); // nothing reached an API while online
    await context.setOffline(true);
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Home", level: 1 })).toBeAttached();
    await expect(page.getByTestId("ayah-unavailable")).toContainText("Today’s ayah needs a connection once.");
    await expect(page.getByTestId("tile-prayer")).toContainText("Needs a connection");
    await page.getByTestId("schedule-toggle").click();
    await expect(page.getByTestId("schedule-failed")).toContainText("Needs a connection once to load prayer times.");
    await expect(page.locator("[aria-busy='true']")).toHaveCount(0); // nothing is left loading
    await expect(page.getByTestId("resume-title")).toHaveText("Get started"); // the local parts still work
    leaks.length = 0; // the requests made while offline were attempts that failed on purpose
  });
});

test.describe("layout and accessibility", () => {
  test.beforeEach(async ({ context }) => {
    await mockAladhan(context);
    await mockVerse(context);
    await seed(context, { last_location: LAHORE_LEGACY, ...RETURNING });
  });

  test("375px: no horizontal scroll, tiles and controls at least 44px, the Arabic is not clipped", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await open(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    for (const id of ["tile-prayer", "tile-qibla", "tile-goal", "tile-hifz"]) expect((await page.getByTestId(id).boundingBox())!.height, id).toBeGreaterThanOrEqual(44);
    for (const name of ["Share this ayah", "Remove this ayah from your Library", "Save this ayah to your Library"]) {
      const b = page.getByRole("button", { name });
      if (await b.count()) {
        const box = (await b.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    }
    expect((await page.getByTestId("schedule-toggle").boundingBox())!.height).toBeGreaterThanOrEqual(44);
    for (const l of await page.getByTestId("resume-card").getByRole("link").all()) expect((await l.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    const ar = page.getByTestId("ayah-arabic");
    expect(await ar.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    expect(await ar.evaluate((el) => getComputedStyle(el).letterSpacing)).toMatch(/^(0px|normal)$/);
  });

  test("1280px: four tiles in a row", async ({ page }) => {
    await open(page);
    const boxes = await Promise.all(["tile-prayer", "tile-qibla", "tile-goal", "tile-hifz"].map((id) => page.getByTestId(id).boundingBox()));
    expect(new Set(boxes.map((b) => Math.round(b!.y))).size).toBe(1);
  });

  test("the Arabic follows the Arabic size setting", async ({ page, context }) => {
    await seed(context, { "quran:accessibility:v1": JSON.stringify({ arabicFontScale: 1.5 }) });
    await open(page);
    const size = await page.getByTestId("ayah-arabic").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThan(44); // 32px x 1.5 on desktop
  });

  test("dark mode: the page uses the dark tokens and the tiles stay readable", async ({ context, page }) => {
    await seed(context, { themeMode: "dark" });
    await open(page);
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(await page.getByTestId("tile-prayer").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(27, 42, 45)"); // --accent-soft #1B2A2D
  });

  test("keyboard: Share, Save, the resume links, the tiles and the schedule toggle are all reachable in order", async ({ page }) => {
    await open(page);
    const order: string[] = [];
    for (let i = 0; i < 60; i++) {
      await page.keyboard.press("Tab");
      const label = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el ? (el.getAttribute("aria-label") || el.getAttribute("data-testid") || el.textContent || "").trim().slice(0, 40) : "";
      });
      order.push(label);
    }
    const idx = (s: string) => order.findIndex((o) => o.includes(s));
    const want = ["Share this ayah", "Library", "Continue reading", "Continue", "tile-prayer", "tile-qibla", "tile-goal", "tile-hifz", "schedule-toggle"];
    const positions = want.map(idx);
    positions.forEach((p, i) => expect(p, want[i]).toBeGreaterThan(-1));
    // the content order follows the page order (the first "Library" match is the Save button)
    expect(positions[0]).toBeLessThan(positions[1]!);
    expect(positions[4]).toBeLessThan(positions[5]!);
    expect(positions[7]).toBeLessThan(positions[8]!);
  });

  test("one h1, no console errors, and no request leaves the allowed hosts", async ({ page }) => {
    const problems: string[] = [];
    // (the one message about blocked service workers comes from this suite's own setting, not from the app)
    page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && !m.text().includes("Service Worker registration blocked") && problems.push(m.text()));
    page.on("pageerror", (e) => problems.push(String(e)));
    const hosts = new Set<string>();
    page.on("request", (r) => hosts.add(new URL(r.url()).host));
    await open(page);
    await page.getByTestId("schedule-toggle").click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    expect(problems).toEqual([]);
    expect([...hosts].sort()).toEqual(["api.aladhan.com", "localhost:3011", "quranapi.pages.dev"].filter((h) => hosts.has(h)).sort());
    expect(hosts.has("api.iconify.design")).toBe(false);
  });
});

test.describe("shell (Phase 1)", () => {
  test.beforeEach(async ({ context }) => {
    await mockAladhan(context);
    await mockVerse(context);
    await seed(context, { "ayah-of-day": ayahEntry("2026-10-15") });
  });

  test("header: page title, search field linking to /search, gear linking to /settings, theme menu", async ({ page }) => {
    await open(page);
    await expect(page.getByTestId("page-title")).toHaveText("Home");
    await expect(page.getByRole("link", { name: "Search the Qur’an, people, places…" })).toHaveAttribute("href", "/search");
    await expect(page.getByRole("link", { name: "Settings" }).first()).toBeVisible();
    await page.getByRole("link", { name: "Settings" }).first().click();
    await expect(page.getByTestId("page-title")).toHaveText("Settings");
    await page.getByRole("button", { name: "Theme" }).click();
    await expect(page.getByRole("menuitemradio", { name: "System" })).toBeVisible();
  });

  test("groups collapse: Read is open, the others are closed; the choice is remembered; the current page's group opens", async ({ page }) => {
    await open(page);
    const nav = page.getByRole("navigation", { name: "Main" }).first();
    await expect(nav.getByRole("link", { name: "Surahs" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Library" })).toHaveCount(0);
    await expect(nav.getByTestId("group-study")).toHaveAttribute("aria-expanded", "false");
    await expect(nav.getByTestId("group-read")).toHaveAttribute("aria-expanded", "true");
    await nav.getByTestId("group-study").click();
    await expect(nav.getByRole("link", { name: "Library" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Downloads" })).toBeVisible();
    expect(JSON.parse((await readStorage(page))["quran:nav-open:v1"]!)).toMatchObject({ study: true, read: true });
    await nav.getByTestId("group-read").click();
    await page.reload();
    await page.waitForLoadState("networkidle");
    const nav2 = page.getByRole("navigation", { name: "Main" }).first();
    await expect(nav2.getByRole("link", { name: "Library" })).toBeVisible(); // remembered open
    await expect(nav2.getByRole("link", { name: "Surahs" })).toHaveCount(0); // remembered closed
    await page.goto("/persons");
    await expect(page.getByRole("navigation", { name: "Main" }).first().getByRole("link", { name: "Prophets & People" })).toHaveAttribute("aria-current", "page");
  });

  test("Continue reading appears only with reading progress, and links to the saved place", async ({ context, page }) => {
    await open(page);
    await expect(page.getByTestId("continue-reading")).toHaveCount(0);
    const ctx = await page.context().browser()!.newContext({ serviceWorkers: "block", timezoneId: "Asia/Karachi" });
    await freezeClock(ctx);
    await mockAladhan(ctx);
    await mockVerse(ctx);
    await seed(ctx, { "ayah-of-day": ayahEntry("2026-10-15"), "quran:reading-progress:v1": RETURNING["quran:reading-progress:v1"] });
    const p2 = await ctx.newPage();
    await open(p2);
    await expect(p2.getByTestId("continue-reading").first()).toHaveAttribute("href", "/surah/2#ayah-285");
    await ctx.close();
    void context;
  });

  test("nav icons are 16px and ink-2, accent when active", async ({ page }) => {
    await open(page);
    const nav = page.getByRole("navigation", { name: "Main" }).first();
    const icon = nav.getByRole("link", { name: "Surahs" }).locator("svg, span.iconify").first();
    const box = (await icon.boundingBox())!;
    expect(Math.round(box.width)).toBe(16);
    expect(await icon.evaluate((el) => getComputedStyle(el).color)).toBe("rgb(107, 101, 88)"); // --ink-2 #6B6558
    const home = nav.getByRole("link", { name: "Home" });
    expect(await home.locator("svg, span.iconify").first().evaluate((el) => getComputedStyle(el).color)).toBe("rgb(43, 103, 119)"); // --accent #2B6777
  });

  test("the mobile drawer's close icon is the accent colour and 44px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await open(page);
    await page.getByRole("button", { name: "Open menu" }).click();
    const close = page.getByRole("dialog").getByRole("button", { name: "Close" });
    expect(await close.evaluate((el) => getComputedStyle(el).color)).toBe("rgb(43, 103, 119)");
    expect((await close.boundingBox())!.width).toBeGreaterThanOrEqual(43.9); // 44px (sub-pixel layout rounding)
    await close.click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("mobile header: title, a search icon link, theme and settings, each at least 44px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await open(page);
    for (const name of ["Search", "Theme", "Settings"]) {
      const l = page.getByRole(name === "Theme" ? "button" : "link", { name }).first();
      const b = (await l.boundingBox())!;
      expect(b.width, name).toBeGreaterThanOrEqual(44);
      expect(b.height, name).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});
