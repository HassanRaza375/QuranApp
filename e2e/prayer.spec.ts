// Phase 5: Prayer times and Qibla in a real browser (production build). AlAdhan, Open-Meteo, the device position and the
// orientation sensors are all stand-ins; the clock is fixed at Thursday 15 Oct 2026, 09:14 in Karachi. The AlAdhan month is a
// REAL recorded response (Lahore, Oct 2026), and the place search answers with real recorded Open-Meteo responses.
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { declination } from "../app/lib/declination";
import { forbidRealApis, freezeClock, LAHORE_LEGACY, mockAladhan, mockGeocode, mockVerse, NOW_KARACHI, readStorage, seed, stubGeolocation, stubSensors, type AladhanMock } from "./mocks";

const IPHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });
let leaks: string[] = [];
let aladhan: AladhanMock;
test.beforeEach(async ({ context }) => {
  leaks = await forbidRealApis(context);
  await freezeClock(context);
  aladhan = await mockAladhan(context);
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

const LAHORE = { "last_location": LAHORE_LEGACY };
const json = async (page: Page, key: string) => JSON.parse((await readStorage(page))[key] ?? "null");
async function open(page: Page, path = "/prayerTime") {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}
const status = (page: Page, key: string) => page.getByTestId(`row-${key}`).getAttribute("data-status");

/** Replaces the Notification API with a stub. `window.__prompts` counts permission prompts. */
const stubNotifications = (context: BrowserContext, initial: "default" | "granted" | "denied") =>
  context.addInitScript((p) => {
    const w = window as unknown as { __prompts: number; Notification: unknown };
    w.__prompts = 0;
    w.Notification = Object.assign(function () {}, {
      permission: p,
      requestPermission: async () => {
        w.__prompts++;
        return "granted";
      },
    });
  }, initial);

test.describe("the two routes and the tabs", () => {
  test("both legacy routes render the one page; the tabs are links with aria-current; switching fetches nothing new", async ({ context, page }) => {
    await seed(context, LAHORE);
    await open(page, "/prayerTime");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Prayer & Qibla");
    await expect(page.getByTestId("tab-times")).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("next-card")).toBeVisible();
    const calls = aladhan.calls.length;
    await page.evaluate(() => ((window as unknown as { __marker: number }).__marker = 1));
    await page.getByTestId("tab-qibla").click();
    await expect(page).toHaveURL(/\/qibla-direction$/);
    await expect(page.getByTestId("tab-qibla")).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("bearing")).toBeVisible();
    await page.getByTestId("tab-times").click();
    await expect(page.getByTestId("next-card")).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __marker?: number }).__marker)).toBe(1); // no full reload
    expect(aladhan.calls.length).toBe(calls);
    await page.goto("/qibla-direction");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Prayer & Qibla");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });

  test("Home's two tiles reach the two routes", async ({ context, page }) => {
    await mockVerse(context);
    await seed(context, LAHORE);
    await open(page, "/");
    await expect(page.getByTestId("tile-prayer")).toHaveAttribute("href", "/prayerTime");
    await expect(page.getByTestId("tile-qibla")).toHaveAttribute("href", "/qibla-direction");
  });
});

test.describe("location", () => {
  test("with no place: no times, no request, no position prompt, and two ways to set one", async ({ context, page }) => {
    await stubGeolocation(context, "ok");
    await open(page);
    await expect(page.getByTestId("times-no-location")).toBeVisible();
    await expect(page.getByTestId("use-location")).toHaveText(/Set location/);
    await expect(page.getByTestId("enter-city")).toBeVisible();
    expect(aladhan.calls).toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { __geoCalls: number }).__geoCalls)).toBe(0);
  });

  test("Set location (granted) saves the device place and shows the times", async ({ context, page }) => {
    await stubGeolocation(context, "ok");
    await open(page);
    await page.getByTestId("use-location").click();
    await expect(page.getByTestId("next-card")).toBeVisible();
    const loc = await json(page, "quran:location:v1");
    expect(loc).toMatchObject({ lat: 31.5204, lon: 74.3587, source: "device" });
    expect(await page.evaluate(() => (window as unknown as { __geoCalls: number }).__geoCalls)).toBe(1);
  });

  test("Set location (refused or timed out) says why and points to Enter a city; nothing is saved", async ({ context, page }) => {
    await stubGeolocation(context, "denied");
    await open(page);
    await page.getByTestId("use-location").click();
    await expect(page.getByTestId("location-error")).toContainText("Location access was declined");
    await expect(page.getByTestId("location-error")).toContainText("enter a city");
    expect(await json(page, "quran:location:v1")).toBeNull();
    await expect(page.getByTestId("times-no-location")).toBeVisible(); // no silent default city
  });

  test("a city search sends only the typed name, shows what was sent and the place and country returned, and saves the pick", async ({ context, page }) => {
    const geo = await mockGeocode(context);
    await open(page);
    await page.getByTestId("enter-city").click();
    await page.getByTestId("city-input").fill("Leicester");
    await page.getByTestId("city-search").click();
    await expect(page.getByTestId("city-sent")).toHaveText("Sent to the place search: “Leicester”");
    await expect(page.getByTestId("city-result-0")).toContainText("Leicester, England, United Kingdom");
    await expect(page.getByTestId("city-results")).toContainText("Leicester, Massachusetts, United States"); // a same-named place elsewhere
    expect(geo.calls).toHaveLength(1);
    const sent = new URL(geo.calls[0]!);
    expect(sent.searchParams.get("name")).toBe("Leicester");
    expect([...sent.searchParams.keys()].sort()).toEqual(["count", "format", "language", "name"]); // nothing else
    await expect(page.getByTestId("city-privacy")).toContainText("only the city you type");
    await expect(page.getByTestId("city-attribution")).toHaveAttribute("href", "https://open-meteo.com/");
    await expect(page.getByTestId("city-attribution")).toContainText("Place search by Open-Meteo.com");

    await page.getByTestId("city-result-0").click();
    await expect(page.getByTestId("next-card")).toBeVisible();
    const loc = await json(page, "quran:location:v1");
    expect(loc).toMatchObject({ source: "manual", label: "Leicester, England, United Kingdom" });
    expect(loc.lat).toBeCloseTo(52.64, 1);
    await expect(page.getByText("Using the place you chose: Leicester, England, United Kingdom.")).toBeVisible();
    expect(aladhan.calls[0]).toContain("latitude=52.64"); // the times are requested for the chosen place
  });

  test("a country typed after the city narrows the list", async ({ context, page }) => {
    await mockGeocode(context);
    await open(page);
    await page.getByTestId("enter-city").click();
    await page.getByTestId("city-input").fill("Leicester");
    await page.getByTestId("country-input").fill("United Kingdom");
    await page.getByTestId("city-search").click();
    await expect(page.getByTestId("city-result-0")).toContainText("United Kingdom");
    await expect(page.getByTestId("city-results")).not.toContainText("Massachusetts");
  });

  test("no match, offline and a failing service each say so, and coordinates still work", async ({ context, page }) => {
    const geo = await mockGeocode(context);
    await open(page);
    await page.getByTestId("enter-city").click();
    await page.getByTestId("city-input").fill("Zzzzqqq");
    await page.getByTestId("city-search").click();
    await expect(page.getByTestId("city-none")).toHaveText("No place found for “Zzzzqqq”. Check the spelling, or add the country.");

    geo.mode = "http500";
    await page.getByTestId("city-input").fill("Qom");
    await page.getByTestId("city-search").click();
    await expect(page.getByTestId("city-error")).toContainText("The place search is not available right now.");
    await expect(page.getByTestId("city-error")).toContainText("enter coordinates");

    const before = geo.calls.length;
    await context.setOffline(true);
    await page.getByTestId("city-search").click();
    await expect(page.getByTestId("city-offline")).toContainText("You’re offline");
    expect(geo.calls.length).toBe(before); // offline: no request is even attempted
    await context.setOffline(false);

    await page.getByTestId("coords-input").fill("31.5204, 74.3587");
    await page.getByTestId("coords-save").click();
    await expect(page.getByTestId("next-card")).toBeVisible();
    const loc = await json(page, "quran:location:v1");
    expect(loc).toMatchObject({ lat: 31.5204, lon: 74.3587, source: "manual" });
    expect(loc.label).toBeUndefined();
    await expect(page.getByText("Using the place you chose: 31.52, 74.36.")).toBeVisible();
  });

  test("typed coordinates that are not a place are refused with an example", async ({ page }) => {
    await open(page);
    await page.getByTestId("enter-city").click();
    for (const bad of ["abc", "95, 10", "10, 200", "31.5"]) {
      await page.getByTestId("coords-input").fill(bad);
      await page.getByTestId("coords-save").click();
      await expect(page.getByTestId("coords-error")).toContainText("for example 31.5204, 74.3587");
    }
    expect(await json(page, "quran:location:v1")).toBeNull();
  });

  test("a manual save leaves the legacy last_location exactly as it was", async ({ context, page }) => {
    await seed(context, LAHORE);
    await mockGeocode(context);
    await open(page);
    await page.getByTestId("enter-city").click();
    await page.getByTestId("coords-input").fill("52.6386, -1.13169");
    await page.getByTestId("coords-save").click();
    await expect(page.getByText("Using the place you chose")).toBeVisible();
    expect((await readStorage(page))["last_location"]).toBe(LAHORE_LEGACY);
  });
});

test.describe("prayer times", () => {
  test.beforeEach(async ({ context }) => {
    await seed(context, LAHORE);
  });

  test("the next prayer card, the Latest and Next tags (never Now), the Sunrise row, and the Gregorian and Hijri date", async ({ page }) => {
    await open(page);
    await expect(page.getByTestId("next-name")).toHaveText(/^Dhuhr/);
    await expect(page.getByTestId("next-countdown")).toHaveText(/^in \d+h \d+m$/);
    await expect(page.getByTestId("gregorian")).toHaveText("Thursday, 15 Oct 2026");
    expect(await status(page, "Fajr")).toBe("latest");
    expect(await status(page, "Sunrise")).toBe("past");
    expect(await status(page, "Dhuhr")).toBe("next");
    await expect(page.getByTestId("tag-latest")).toHaveCount(1);
    await expect(page.getByTestId("tag-next")).toHaveCount(1);
    await expect(page.getByTestId("row-Sunrise").getByTestId("bell")).toHaveCount(0); // information row: no bell
    await expect(page.getByTestId("row-Sunrise").getByTestId("bell-settings")).toHaveCount(0);
    expect(await page.locator("body").innerText()).not.toMatch(/\bNow\b/);
    await expect(page.getByTestId("row-Fajr").getByTestId("row-time")).toHaveText(/^\d{1,2}:\d{2} (AM|PM)$/);
    await expect(page.getByTestId("hijri")).toContainText("1448");
  });

  test("Jumu'ah is shown under Dhuhr on a Friday and not on a Thursday", async ({ context, page }) => {
    await open(page);
    await expect(page.getByTestId("jumuah")).toHaveCount(0);
    const ctx2 = await context.browser()!.newContext({ timezoneId: "Asia/Karachi", locale: "en-GB", serviceWorkers: "block" });
    await freezeClock(ctx2, "2026-10-16T09:14:00+05:00");
    await mockAladhan(ctx2);
    await seed(ctx2, LAHORE);
    const p2 = await ctx2.newPage();
    await open(p2);
    await expect(p2.getByTestId("jumuah")).toHaveText("Jumu’ah");
    await expect(p2.getByTestId("gregorian")).toHaveText("Friday, 16 Oct 2026");
    await ctx2.close();
  });

  test("'today' is the location's day, not the device's: a device eleven hours behind still shows 15 Oct", async ({ browser }) => {
    const ctx = await browser.newContext({ timezoneId: "Pacific/Pago_Pago", locale: "en-GB", serviceWorkers: "block" }); // UTC-11: 14 Oct on the device
    await forbidRealApis(ctx);
    await freezeClock(ctx);
    await mockAladhan(ctx);
    await seed(ctx, LAHORE);
    const p = await ctx.newPage();
    await open(p);
    await expect(p.getByTestId("gregorian")).toHaveText("Thursday, 15 Oct 2026");
    await ctx.close();
  });

  test("Ja'fari times come from the Ja'fari method and the Calculation row names what is shown", async ({ context, page }) => {
    await seed(context, { prayerFiqh: "jafari" });
    await open(page);
    expect(aladhan.calls[0]).toContain("method=0");
    expect(aladhan.calls[0]).toContain("school=0");
    await expect(page.getByText(/Leva Institute, Qum/)).toBeVisible();
    await expect(page.getByText(/· Ja’fari/)).toBeVisible();
    await expect(page.getByTestId("calc-change")).toHaveAttribute("href", "/settings?section=prayer");
  });

  test("the Hijri adjustment is applied in the app and never reaches the request or the cache key", async ({ context, page }) => {
    await open(page);
    const plain = await page.getByTestId("hijri").innerText();
    const requests = [...aladhan.calls];
    const idbBefore = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((r) => (indexedDB.open("quran-revamp-db").onsuccess = (e) => r((e.target as IDBOpenDBRequest).result)));
      return await new Promise<string[]>((r) => (db.transaction("prayer-months").objectStore("prayer-months").getAllKeys().onsuccess = (e) => r((e.target as IDBRequest).result as string[])));
    });
    await seed(context, { "quran:hijri-adjust:v1": JSON.stringify({ days: 1 }) });
    const p2 = await context.newPage();
    await open(p2);
    await expect(p2.getByTestId("hijri-note")).toHaveText("Adjusted by +1 day");
    expect(await p2.getByTestId("hijri").innerText()).not.toBe(plain);
    expect(aladhan.calls.slice(requests.length).every((u) => !/adjust/i.test(u))).toBe(true);
    const idbAfter = await p2.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((r) => (indexedDB.open("quran-revamp-db").onsuccess = (e) => r((e.target as IDBOpenDBRequest).result)));
      return await new Promise<string[]>((r) => (db.transaction("prayer-months").objectStore("prayer-months").getAllKeys().onsuccess = (e) => r((e.target as IDBRequest).result as string[])));
    });
    expect(idbAfter).toEqual(idbBefore); // the same keys: the adjustment is not part of the key
  });

  test("with notifications off the bell links to Settings and nothing asks for permission", async ({ context, page }) => {
    await stubNotifications(context, "default");
    await open(page);
    await expect(page.getByTestId("bell-settings")).toHaveCount(5);
    await expect(page.getByTestId("bell-hint")).toHaveText("Turn on prayer notifications in Settings.");
    await expect(page.getByTestId("row-Asr").getByTestId("bell-settings")).toHaveAttribute("href", "/settings?section=notifications");
    await expect(page.getByTestId("row-Asr").getByTestId("bell-settings")).toHaveAccessibleName(/Notification for Asr: off\. Turn on prayer notifications in Settings/);
    expect(await page.evaluate(() => (window as unknown as { __prompts: number }).__prompts)).toBe(0);
  });

  test("with notifications on and allowed, a bell toggles that prayer in the same record Settings writes", async ({ context, page }) => {
    await stubNotifications(context, "granted");
    await seed(context, { prayerSettings: JSON.stringify({ notificationsEnabled: true, enabledPrayers: { Fajr: true, Dhuhr: true, Asr: false, Maghrib: true, Isha: true }, reminderOffset: 10, keep: "me" }) });
    await open(page);
    const asr = page.getByTestId("row-Asr").getByTestId("bell");
    await expect(asr).toHaveAttribute("aria-pressed", "false");
    await expect(asr).toHaveAccessibleName("Notification for Asr: off");
    await asr.click();
    await expect(asr).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("reminder-note")).toHaveText("Reminders only appear while Quran App is open.");
    let saved = await json(page, "prayerSettings");
    expect(saved).toEqual({ notificationsEnabled: true, enabledPrayers: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true }, reminderOffset: 10, keep: "me" });
    await page.getByTestId("row-Fajr").getByTestId("bell").click();
    saved = await json(page, "prayerSettings");
    expect(saved.enabledPrayers.Fajr).toBe(false);
    expect(saved.keep).toBe("me"); // unknown fields stay
    expect(await page.evaluate(() => (window as unknown as { __prompts: number }).__prompts)).toBe(0);
  });

  test("the bell can be reached and pressed from the keyboard", async ({ context, page }) => {
    await stubNotifications(context, "granted");
    await seed(context, { prayerSettings: JSON.stringify({ notificationsEnabled: true, enabledPrayers: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true }, reminderOffset: 0 }) });
    await open(page);
    const dhuhr = page.getByTestId("row-Dhuhr").getByTestId("bell");
    await dhuhr.focus();
    await page.keyboard.press("Space");
    await expect(dhuhr).toHaveAttribute("aria-pressed", "false");
    await page.keyboard.press("Enter");
    await expect(dhuhr).toHaveAttribute("aria-pressed", "true");
  });

  test("Update now keeps the old times when it fails, and says so; offline it is disabled with a note", async ({ page, context }) => {
    await open(page);
    const before = await page.getByTestId("row-Fajr").getByTestId("row-time").innerText();
    aladhan.mode = "http500";
    await page.getByTestId("update-now").click();
    await expect(page.getByTestId("update-message")).toContainText("Couldn’t update");
    await expect(page.getByTestId("update-message")).toContainText("The saved times are still in use");
    expect(await page.getByTestId("row-Fajr").getByTestId("row-time").innerText()).toBe(before);
    aladhan.mode = "ok";
    await page.getByTestId("update-now").click();
    await expect(page.getByTestId("update-message")).toContainText("Updated just now for October 2026");
    await context.setOffline(true);
    await expect(page.getByTestId("update-now")).toBeDisabled();
    await expect(page.getByTestId("update-offline")).toBeVisible();
    await expect(page.getByTestId("times-note")).toHaveText("You’re offline, so the saved times are still in use.");
  });

  test("nothing saved and no connection: the times need a connection once, with Try again; then it works", async ({ page }) => {
    aladhan.mode = "network";
    await open(page);
    await expect(page.getByTestId("times-failed")).toContainText("Sunni prayer times need a connection once.");
    aladhan.mode = "ok";
    await page.getByTestId("times-retry").click();
    await expect(page.getByTestId("next-card")).toBeVisible();
  });

  test("the saved month reads without the network: offline, the times, the rows and the Qibla tab still work", async ({ context, page }) => {
    await open(page);
    await expect(page.getByTestId("next-card")).toBeVisible();
    aladhan.mode = "network";
    await context.setOffline(true);
    await page.getByTestId("tab-qibla").click();
    await expect(page.getByTestId("bearing")).toHaveText("260.4°");
    await page.getByTestId("tab-times").click();
    await expect(page.getByTestId("schedule-list")).toBeVisible();
    await expect(page.getByTestId("row-Dhuhr").getByTestId("row-time")).toBeVisible();
  });

  test("switching to Ja'fari with nothing saved for it, offline: says so and that the Sunni times are still saved", async ({ context, page }) => {
    await open(page);
    await expect(page.getByTestId("next-card")).toBeVisible();
    aladhan.mode = "network";
    await context.setOffline(true);
    await page.evaluate(() => localStorage.setItem("prayerFiqh", "jafari"));
    await page.getByTestId("tab-qibla").click();
    await page.evaluate(() => window.dispatchEvent(new StorageEvent("storage", { key: "prayerFiqh", newValue: "jafari" })));
    await page.getByTestId("tab-times").click();
    await expect(page.getByTestId("times-failed")).toContainText("Ja’fari prayer times need a connection once. Your Sunni times, if saved, are still on this device.");
  });

  test("one h1, labelled controls, the schedule rows are 56px or more on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await open(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const small = await page.evaluate(() => {
      const bad: string[] = [];
      document.querySelectorAll<HTMLElement>('[data-testid="schedule-list"] li').forEach((el) => {
        if (el.getBoundingClientRect().height < 55) bad.push(el.dataset.testid ?? "row");
      });
      document.querySelectorAll<HTMLElement>('main a, main button').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.height < 43.5 || r.width < 43.5) && !el.closest("nav[aria-label='Prayer and Qibla views']")) bad.push(`${el.getAttribute("data-testid") ?? el.textContent?.trim()} ${Math.round(r.width)}x${Math.round(r.height)}`);
      });
      return bad;
    });
    expect(small).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
});

test.describe("Qibla", () => {
  test.beforeEach(async ({ context }) => {
    await seed(context, LAHORE);
  });

  test("the bearing and its cardinal point come from the saved place and need no network", async ({ context, page }) => {
    await open(page, "/prayerTime"); // load once so the app shell is in memory
    aladhan.mode = "network";
    await context.setOffline(true);
    await page.getByTestId("tab-qibla").click();
    await expect(page.getByTestId("bearing")).toHaveText("260.4°");
    await expect(page.getByTestId("cardinal")).toHaveText("West, measured from true north");
    expect(aladhan.calls.length).toBe(1); // only the first, online visit to the times tab
  });

  test("no place: the dial is not drawn and the two ways to set a place are offered", async ({ context, page }) => {
    await context.clearCookies();
    await page.addInitScript(() => localStorage.removeItem("last_location"));
    await open(page, "/qibla-direction");
    await expect(page.getByTestId("qibla-no-location")).toBeVisible();
    await expect(page.getByTestId("compass")).toHaveCount(0);
    await expect(page.getByTestId("enter-city")).toBeVisible();
  });

  test("no sensor (a desktop): a static dial with the bearing and cardinal point, no rotation and no turn instructions", async ({ page }) => {
    await open(page, "/qibla-direction");
    await expect(page.getByTestId("compass-none")).toBeVisible({ timeout: 6000 });
    await expect(page.getByTestId("compass-none")).toContainText("This device has no compass");
    await expect(page.getByTestId("compass-none")).toContainText("260° (West) from north");
    await expect(page.getByTestId("compass")).toHaveAttribute("data-live", "false");
    expect(await page.getByTestId("dial").getAttribute("transform")).toBe("rotate(0 150 150)");
    await expect(page.getByTestId("static-bearing")).toHaveText("260°");
    await expect(page.getByTestId("facing-status")).toHaveCount(0);
    expect(await page.locator("body").innerText()).not.toMatch(/Turn (left|right)/);
    await expect(page.getByTestId("interference-note")).toContainText("may be a few degrees off");
  });

  test.describe("an Android phone (deviceorientationabsolute)", () => {
    test.beforeEach(async ({ context }) => {
      await stubSensors(context);
    });
    const d = () => {
      const r = declination(31.5204, 74.3587, new Date(NOW_KARACHI));
      if (!r.ok) throw new Error("declination unavailable");
      return r.degrees;
    };
    /**
     * A flat phone whose top edge points `magnetic` degrees: sends events and waits until the dial shows the corrected (true)
     * heading. The heading is smoothed once per animation frame, so it takes a few frames to arrive.
     */
    const point = async (page: Page, magnetic: number) => {
      const want = (((magnetic + d()) % 360) + 360) % 360;
      await expect(async () => {
        // one event per animation frame, as a phone sends them, so the smoothing takes a step for each
        await page.evaluate(async (m) => {
          const w = window as unknown as { __orient: (t: string, p: object) => void };
          for (let i = 0; i < 20; i++) {
            w.__orient("deviceorientationabsolute", { alpha: (360 - m + 360) % 360, beta: 0, gamma: 0, absolute: true });
            await new Promise((r) => requestAnimationFrame(() => r(null)));
          }
        }, magnetic);
        const shown = Number((await page.getByTestId("heading-text").textContent())!.replace("°", ""));
        const diff = Math.abs(((shown - want + 540) % 360) - 180);
        expect(diff).toBeLessThanOrEqual(1);
      }).toPass({ timeout: 10_000 });
    };

    test("the heading is corrected for declination; facing the Qibla is announced once, with one vibration", async ({ page }) => {
      await open(page, "/qibla-direction");
      const bearing = 260.3658;
      await point(page, bearing - d()); // true heading = the Qibla
      await expect(page.getByTestId("compass")).toHaveAttribute("data-live", "true");
      await expect(page.getByTestId("compass")).toHaveAttribute("data-aligned", "true");
      await expect(page.getByTestId("facing-status")).toHaveText("Facing the Qibla");
      await expect(page.getByTestId("heading-text")).toHaveText("260°");
      await expect(page.getByTestId("declination-note")).toContainText(`Corrected for your location (${d().toFixed(1)}° east) using the World Magnetic Model, valid to 2030.`);
      await point(page, bearing - d() + 2); // still aligned
      await point(page, bearing - d() - 3); // still aligned
      expect(await page.evaluate(() => (window as unknown as { __vibrations: number }).__vibrations)).toBe(1); // never repeated while aligned
    });

    test("away from the Qibla it says which way to turn; moving back and aligning again vibrates once more", async ({ page }) => {
      await open(page, "/qibla-direction");
      await point(page, 200 - d()); // true heading 200: the Qibla is 60 degrees to the right
      await expect(page.getByTestId("facing-status")).toHaveText("Turn right 60°", { timeout: 4000 });
      await expect(page.getByTestId("compass")).toHaveAttribute("data-aligned", "false");
      await point(page, 300 - d());
      await expect(page.getByTestId("facing-status")).toHaveText("Turn left 40°", { timeout: 4000 });
      await point(page, 260.3658 - d());
      await expect(page.getByTestId("compass")).toHaveAttribute("data-aligned", "true");
      expect(await page.evaluate(() => (window as unknown as { __vibrations: number }).__vibrations)).toBe(1);
      await point(page, 100 - d());
      await point(page, 260.3658 - d());
      expect(await page.evaluate(() => (window as unknown as { __vibrations: number }).__vibrations)).toBe(2);
    });

    test("a plain relative deviceorientation is ignored (the legacy page used it and was wrong on Android)", async ({ page }) => {
      await open(page, "/qibla-direction");
      for (let i = 0; i < 10; i++) await page.evaluate(() => (window as unknown as { __orient: (t: string, p: object) => void }).__orient("deviceorientation", { alpha: 100, beta: 0, gamma: 0, absolute: false }));
      await expect(page.getByTestId("compass-none")).toBeVisible({ timeout: 6000 });
      await expect(page.getByTestId("compass")).toHaveAttribute("data-live", "false");
    });

    test("under Reduce motion the heading follows at once; otherwise it is smoothed", async ({ context, page }) => {
      await open(page, "/qibla-direction");
      await page.evaluate(() => (window as unknown as { __orient: (t: string, p: object) => void }).__orient("deviceorientationabsolute", { alpha: 360 - 10, beta: 0, gamma: 0, absolute: true }));
      await page.evaluate(() => (window as unknown as { __orient: (t: string, p: object) => void }).__orient("deviceorientationabsolute", { alpha: 360 - 100, beta: 0, gamma: 0, absolute: true }));
      await page.waitForTimeout(100);
      const smoothed = Number((await page.getByTestId("heading-text").textContent())!.replace("°", ""));
      expect(smoothed).toBeLessThan(100 + d()); // has not jumped all the way
      await seed(context, { "quran:accessibility:v1": JSON.stringify({ reducedMotion: true }) });
      const p2 = await context.newPage();
      await open(p2, "/qibla-direction");
      await p2.evaluate(() => (window as unknown as { __orient: (t: string, p: object) => void }).__orient("deviceorientationabsolute", { alpha: 360 - 10, beta: 0, gamma: 0, absolute: true }));
      await p2.evaluate(() => (window as unknown as { __orient: (t: string, p: object) => void }).__orient("deviceorientationabsolute", { alpha: 360 - 100, beta: 0, gamma: 0, absolute: true }));
      await p2.waitForTimeout(100);
      expect(Number((await p2.getByTestId("heading-text").textContent())!.replace("°", ""))).toBe(Math.round(100 + d()));
    });

    test("no compass listener is left behind after leaving the page (the legacy page leaked its listener)", async ({ page }) => {
      await open(page, "/qibla-direction");
      await point(page, 50);
      expect(await page.evaluate(() => (window as unknown as { __activeOrientationListeners: () => number }).__activeOrientationListeners())).toBe(2);
      await page.getByTestId("tab-times").click();
      await expect(page.getByTestId("next-card")).toBeVisible();
      expect(await page.evaluate(() => (window as unknown as { __activeOrientationListeners: () => number }).__activeOrientationListeners())).toBe(0);
    });
  });

  test.describe("an iPhone (permission from a tap)", () => {
    test.use({ userAgent: IPHONE_UA });
    test.beforeEach(async ({ context }) => {
      await stubSensors(context, { ios: true });
    });
    const ios = (page: Page, heading: number, accuracy: number) =>
      page.evaluate(([h, a]) => (window as unknown as { __orient: (t: string, p: object) => void }).__orient("deviceorientation", { webkitCompassHeading: h, webkitCompassAccuracy: a, alpha: null, beta: null, gamma: null }), [heading, accuracy]);

    test("nothing is requested until the tap; a short explanation comes first; granted starts the compass with the accuracy note", async ({ page }) => {
      await open(page, "/qibla-direction");
      await expect(page.getByTestId("compass-permission")).toContainText("asks for permission to read the phone’s motion and orientation sensors");
      await expect(page.getByTestId("compass-permission")).toContainText("nothing is sent anywhere");
      expect(await page.evaluate(() => (window as unknown as { __iosAsks: number }).__iosAsks)).toBe(0);
      await ios(page, 120, 10); // an event before the tap is not listened to
      await expect(page.getByTestId("compass")).toHaveAttribute("data-live", "false");
      await page.getByTestId("enable-compass").click();
      expect(await page.evaluate(() => (window as unknown as { __iosAsks: number }).__iosAsks)).toBe(1);
      for (let i = 0; i < 30; i++) await ios(page, 250, 30);
      await expect(page.getByTestId("compass")).toHaveAttribute("data-live", "true");
      await expect(page.getByTestId("compass-note")).toHaveText("The compass needs calibrating. Move your phone in a figure of eight.");
      for (let i = 0; i < 30; i++) await ios(page, 250, 8);
      await expect(page.getByTestId("compass-note")).toHaveText("Compass accuracy about ±8°.");
      await expect(page.getByTestId("declination-note")).toContainText("Corrected for your location");
    });

    test("denied: a clear message with the steps, the bearing to face, a fixed dial and no fake rotation; Try again asks once more", async ({ page }) => {
      await page.addInitScript(() => ((window as unknown as { __iosAnswer: string }).__iosAnswer = "denied"));
      await open(page, "/qibla-direction");
      await page.getByTestId("enable-compass").click();
      await expect(page.getByTestId("compass-denied")).toContainText("Compass access was declined, so the dial is fixed.");
      await expect(page.getByTestId("compass-denied")).toContainText("Motion & Orientation Access");
      await expect(page.getByTestId("compass-denied")).toContainText("face 260° (West) from north");
      await expect(page.getByTestId("compass")).toHaveAttribute("data-live", "false");
      expect(await page.locator("body").innerText()).not.toMatch(/Turn (left|right)/);
      await page.evaluate(() => ((window as unknown as { __iosAnswer: string }).__iosAnswer = "granted"));
      await page.getByTestId("enable-compass-again").click();
      for (let i = 0; i < 30; i++) await ios(page, 100, 5);
      await expect(page.getByTestId("compass")).toHaveAttribute("data-live", "true");
      expect(await page.evaluate(() => (window as unknown as { __iosAsks: number }).__iosAsks)).toBe(2);
    });

    test("a permission request that throws is treated as denied", async ({ page }) => {
      await page.addInitScript(() => {
        (window as unknown as { DeviceOrientationEvent: { requestPermission: () => Promise<string> } }).DeviceOrientationEvent.requestPermission = async () => {
          throw new Error("NotAllowedError");
        };
      });
      await open(page, "/qibla-direction");
      await page.getByTestId("enable-compass").click();
      await expect(page.getByTestId("compass-denied")).toBeVisible();
    });
  });

  test("light and dark themes render the dial and its marker", async ({ context, page }) => {
    for (const theme of ["light", "dark"]) {
      await seed(context, { themeMode: theme });
      const p = await context.newPage();
      await open(p, "/qibla-direction");
      await expect(p.getByTestId("marker")).toBeVisible();
      await expect(p.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^((?!dark).)*$/);
      await p.close();
    }
    void page;
  });

  test("on a phone: no horizontal scroll, the Enable compass and location buttons are 44px", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await open(page, "/qibla-direction");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const small = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("main button, main a")].filter((e) => e.getBoundingClientRect().height < 43.5 && e.getBoundingClientRect().width > 0 && !e.closest("nav[aria-label='Prayer and Qibla views']")).map((e) => e.textContent?.trim()));
    expect(small).toEqual([]);
  });
});

test.describe("Settings uses the same rows", () => {
  test("Enter a city is in Settings, Prayer & location, and the place search is described under Data & privacy", async ({ context, page }) => {
    const geo = await mockGeocode(context);
    await page.goto("/settings?section=prayer");
    await page.getByTestId("enter-city").click();
    await page.getByTestId("city-input").fill("Qom");
    await page.getByTestId("city-search").click();
    await expect(page.getByTestId("city-result-0")).toContainText("Qom, Qom Province, Iran");
    expect(geo.calls).toHaveLength(1);
    await page.getByTestId("city-result-0").click();
    await expect(page.getByText("Using the place you chose: Qom, Qom Province, Iran.")).toBeVisible();
    await page.goto("/settings?section=data");
    await expect(page.getByTestId("privacy-place-search")).toContainText("sends only the city you type");
    await expect(page.getByTestId("privacy-place-search").getByRole("link")).toHaveAttribute("href", "https://open-meteo.com/");
  });
});
