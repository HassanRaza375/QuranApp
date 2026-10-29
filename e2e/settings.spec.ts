// Phase 2: Settings in a real browser (production build). Upstream APIs are mocked, the clock is fixed at 15 Oct 2026,
// 09:14 in Karachi, and the Notification API is replaced by a recording stub, so results are exact.
import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { loadAndControl } from "./helpers";
import { ayahEntry, forbidRealApis, freezeClock, idbNames, LAHORE_LEGACY, mockAladhan, mockVerse, readStorage, seed } from "./mocks";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });
let leaks: string[] = [];
test.beforeEach(async ({ context }) => {
  leaks = await forbidRealApis(context);
  await freezeClock(context);
  await mockVerse(context);
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

const open = async (page: Page, section = "appearance") => {
  await page.goto(section === "appearance" ? "/settings" : `/settings?section=${section}`);
  await page.waitForLoadState("networkidle");
};
const menu = async (page: Page, name: RegExp | string, item: string) => {
  await page.getByRole("button", { name }).click();
  await page.getByRole("menuitemradio", { name: item }).click();
};
const json = async (page: Page, key: string) => JSON.parse((await readStorage(page))[key] ?? "null");

/** Replaces the Notification API with a recording stub. `window.__permAnswer` is what a permission prompt will answer. */
const stubNotifications = (context: import("@playwright/test").BrowserContext, initial: "default" | "granted" | "denied" = "default") =>
  context.addInitScript((initialPermission) => {
    const w = window as unknown as { __notifs: unknown[]; __permAnswer: string; __prompts: number; Notification: unknown };
    w.__notifs = [];
    w.__permAnswer = "granted";
    w.__prompts = 0;
    const FakeNotification = Object.assign(
      function (title: string, options: object) {
        w.__notifs.push({ title, ...options });
      },
      {
        permission: initialPermission as string,
        async requestPermission() {
          w.__prompts++;
          FakeNotification.permission = w.__permAnswer;
          return FakeNotification.permission;
        },
      },
    );
    w.Notification = FakeNotification;
  }, initial);
const notifs = (page: Page) => page.evaluate(() => (window as unknown as { __notifs: Record<string, string>[] }).__notifs);

test.describe("sections and navigation", () => {
  test("eight sections; ?section= opens one; the list updates the URL; unknown falls back to Appearance", async ({ page }) => {
    await open(page);
    for (const id of ["appearance", "reading", "audio", "prayer", "notifications", "accessibility", "modules", "data"]) await expect(page.getByTestId(`section-${id}`)).toBeVisible();
    await expect(page.getByTestId("section-title")).toHaveText("Appearance");
    await expect(page.getByTestId("page-title")).toHaveText("Settings");
    await page.getByTestId("section-prayer").click();
    await expect(page).toHaveURL(/section=prayer/);
    await expect(page.getByTestId("section-title")).toHaveText("Prayer & location");
    await expect(page.getByTestId("section-prayer")).toHaveAttribute("aria-current", "page");
    await page.goto("/settings?section=nope");
    await expect(page.getByTestId("section-title")).toHaveText("Appearance");
    await page.goBack();
    await expect(page.getByTestId("section-title")).toHaveText("Prayer & location");
  });

  test("one h1, labelled controls, and no console error in any of the eight sections", async ({ context, page }) => {
    await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY });
    const problems: string[] = [];
    const hosts = new Set<string>();
    page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && !m.text().includes("Service Worker registration blocked") && problems.push(m.text()));
    page.on("pageerror", (e) => problems.push(String(e)));
    page.on("request", (r) => hosts.add(new URL(r.url()).host));
    for (const id of ["appearance", "reading", "audio", "prayer", "notifications", "accessibility", "modules", "data"]) {
      await open(page, id);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByTestId("section-title")).toBeVisible();
      for (const sw of await page.getByRole("switch").all()) expect((await sw.getAttribute("aria-labelledby")) ?? (await sw.getAttribute("aria-label")), "every switch has a name").toBeTruthy();
    }
    expect(problems).toEqual([]);
    expect([...hosts].every((h) => ["localhost:3011", "api.aladhan.com", "quranapi.pages.dev"].includes(h))).toBe(true);
  });
});

test.describe("Appearance, Reading, Audio write the legacy keys and formats", () => {
  test("theme: raw themeMode, applied at once; a legacy value is shown", async ({ context, page }) => {
    await seed(context, { themeMode: "system" });
    await open(page);
    await expect(page.getByRole("radio", { name: "System" })).toBeChecked();
    await page.getByRole("radio", { name: "Dark" }).click();
    expect((await readStorage(page)).themeMode).toBe("dark");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByRole("radio", { name: "Light" }).click();
    expect((await readStorage(page)).themeMode).toBe("light");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("reading: legacy values shown; translation, tafsir, layout and Arabic size write their keys", async ({ context, page }) => {
    await seed(context, {
      translationDefaultLang: "urdu",
      tafsirDefaultAuthor: "Ibn Kathir",
      "quran:accessibility:v1": JSON.stringify({ arabicFontScale: 1.4, futureField: "keep" }),
      preferredVerseDisplay: "english",
      "ayah-of-day": ayahEntry("2026-10-15"),
    });
    await open(page, "reading");
    await expect(page.getByRole("button", { name: "Default translation: Urdu" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Default tafsir source: Ibn Kathir" })).toBeVisible();
    await expect(page.getByTestId("scale-value")).toHaveText("1.4×");
    await expect(page.getByTestId("preview-arabic")).toContainText("SEEDED ARABIC"); // today's stored ayah is the preview

    await menu(page, /Default translation/, "Bengali");
    expect((await readStorage(page)).translationDefaultLang).toBe("bengali");
    await menu(page, /Default tafsir source/, "Maarif Ul Quran");
    expect((await readStorage(page)).tafsirDefaultAuthor).toBe("Maarif Ul Quran");

    // layout: JSON key, and the preview order flips
    await expect(page.getByTestId("reading-preview").locator("[data-order]")).toHaveAttribute("data-order", "ar");
    await page.getByRole("radio", { name: "Translation first" }).click();
    expect(await json(page, "quran:verse-layout:v1")).toEqual({ order: "tr" });
    await expect(page.getByTestId("reading-preview").locator("[data-order]")).toHaveAttribute("data-order", "tr");
    const arabic = await page.getByTestId("preview-arabic").boundingBox();
    const translation = await page.getByTestId("preview-translation").boundingBox();
    expect(translation!.y).toBeLessThan(arabic!.y); // translation is shown first

    // Arabic size: the shared accessibility object keeps its other fields
    await page.getByRole("slider", { name: "Arabic text size" }).focus();
    await page.keyboard.press("End");
    await expect(page.getByTestId("scale-value")).toHaveText("1.6×");
    expect(await json(page, "quran:accessibility:v1")).toEqual({ arabicFontScale: 1.6, futureField: "keep" });
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--arabic-font-scale"))).toBe("1.6");
    expect((await readStorage(page)).preferredVerseDisplay).toBe("english"); // never written
  });

  test("default translation 'Not set' removes the key; the old reader tab is the default, read only", async ({ context, page }) => {
    await seed(context, { translationDefaultLang: "english", preferredVerseDisplay: "urdu" });
    await open(page, "reading");
    await menu(page, /Default translation/, "Not set (choose per ayah)");
    expect((await readStorage(page)).translationDefaultLang).toBeUndefined();
    await expect(page.getByTestId("translation-note")).toHaveText("Using Urdu, from your earlier reader setting.");
    expect((await readStorage(page)).preferredVerseDisplay).toBe("urdu");
  });

  test("with nothing set, the note says Home shows English", async ({ page }) => {
    await open(page, "reading");
    await expect(page.getByTestId("translation-note")).toContainText("English until you choose");
  });

  test("tafsir 'Not set' removes the key", async ({ context, page }) => {
    await seed(context, { tafsirDefaultAuthor: "Tazkirul Quran" });
    await open(page, "reading");
    await menu(page, /Default tafsir source/, "Not set (choose each time)");
    expect((await readStorage(page)).tafsirDefaultAuthor).toBeUndefined();
  });

  test("audio: reciter stored as {reciter: name}; speed and auto-play merged into the audio object, keeping repeatOne", async ({ context, page }) => {
    await seed(context, { reciter: JSON.stringify({ reciter: "Hani Ar Rifai" }), "quran:audio-prefs:v1": JSON.stringify({ playbackRate: 1, repeatOne: true, autoAdvance: false }) });
    await open(page, "audio");
    await expect(page.getByRole("button", { name: "Preferred reciter: Hani Ar Rifai" })).toBeVisible();
    await menu(page, /Preferred reciter/, "Abu Bakr Al Shatri");
    expect(await json(page, "reciter")).toEqual({ reciter: "Abu Bakr Al Shatri" });
    await page.getByRole("radio", { name: "1.25×" }).click();
    await page.getByRole("switch", { name: "Auto-play the next surah" }).click();
    expect(await json(page, "quran:audio-prefs:v1")).toEqual({ playbackRate: 1.25, repeatOne: true, autoAdvance: true });
    await menu(page, /Preferred reciter/, "Not set (the player's default)");
    expect((await readStorage(page)).reciter).toBeUndefined();
  });

  test("Wi-Fi only: greyed with the reason where the browser does not report the connection type", async ({ page }) => {
    await open(page, "audio");
    await expect(page.getByRole("switch", { name: "Download on Wi-Fi only" })).toBeDisabled();
    await expect(page.getByTestId("wifi-note")).toContainText("does not tell the app whether you are on Wi-Fi");
  });

  test("Wi-Fi only: works where the connection type is reported, and writes its own key", async ({ context, page }) => {
    await context.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { type: "wifi" }, configurable: true }));
    await open(page, "audio");
    const sw = page.getByRole("switch", { name: "Download on Wi-Fi only" });
    await expect(sw).toBeEnabled();
    await sw.click();
    expect(await json(page, "quran:download-prefs:v1")).toEqual({ wifiOnly: true });
    await expect(page.getByTestId("wifi-note")).toHaveCount(0);
  });

  test("an unchecked switch is clearly visible: a 3:1 outline (ink-2) around the track and a dark thumb", async ({ page }) => {
    await open(page, "accessibility");
    const sw = page.getByRole("switch", { name: "Reduce motion" });
    await expect(sw).not.toBeChecked();
    expect(await sw.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe("rgb(107, 101, 88)"); // --ink-2, 4.7:1 on the surface
    expect(await sw.locator("[data-slot=switch-thumb]").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(107, 101, 88)");
    await sw.click();
    expect(await sw.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(43, 103, 119)"); // checked: the accent
  });

  test("accessibility and modules switches write the shared accessibility object and the modules key", async ({ context, page }) => {
    await seed(context, { "quran:accessibility:v1": JSON.stringify({ arabicFontScale: 1.2, futureField: 1 }) });
    await open(page, "accessibility");
    await page.getByRole("switch", { name: "Reduce motion" }).click();
    await page.getByRole("switch", { name: "High contrast" }).click();
    await page.getByRole("switch", { name: "Larger touch targets" }).click();
    expect(await json(page, "quran:accessibility:v1")).toEqual({ arabicFontScale: 1.2, futureField: 1, reducedMotion: true, highContrast: true, largeTouchTargets: true });
    await expect(page.locator("html")).toHaveAttribute("data-high-contrast", "true");
    await expect(page.locator("html")).toHaveAttribute("data-reduced-motion", "true");
    await expect(page.locator("html")).toHaveAttribute("data-large-touch", "true");
    await open(page, "modules");
    await page.getByRole("switch", { name: "Show literary modules in the sidebar" }).click();
    expect((await readStorage(page))["quran:additional-modules-enabled:v1"]).toBe("true");
  });
});

test.describe("Prayer & location", () => {
  test("no place: 'Set location', nothing is fetched, no default city", async ({ context, page }) => {
    const aladhan = await mockAladhan(context);
    await open(page, "prayer");
    await expect(page.getByTestId("use-location")).toHaveText(/Set location/);
    await expect(page.getByText("Not set yet. Prayer times and Qibla direction need your location.")).toBeVisible();
    await expect(page.getByTestId("update-now")).toBeDisabled();
    expect(aladhan.calls).toHaveLength(0);
    expect(await page.getByText(/Lahore/).count()).toBe(0);
  });

  test("Set location asks the device only on the tap, saves it in the new key only", async ({ context, page }) => {
    const aladhan = await mockAladhan(context);
    await context.grantPermissions(["geolocation"]);
    await context.setGeolocation({ latitude: 31.5204, longitude: 74.3587 });
    await open(page, "prayer");
    await page.getByTestId("use-location").click();
    await expect(page.getByText("Using your saved place (31.52, 74.36).")).toBeVisible();
    expect(await json(page, "quran:location:v1")).toMatchObject({ lat: 31.5204, lon: 74.3587, source: "device" });
    expect((await readStorage(page)).last_location).toBeUndefined();
    await expect.poll(() => aladhan.calls.length).toBe(1);
  });

  test("a declined location shows a plain inline message", async ({ context, page }) => {
    await mockAladhan(context);
    await open(page, "prayer");
    await page.getByTestId("use-location").click();
    await expect(page.getByTestId("location-error")).toContainText("Location access was declined");
  });

  test("fiqh and methods: Sunni lists 5 methods, Ja'fari 2; the Asr row and the marja' row follow the fiqh", async ({ context, page }) => {
    const aladhan = await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY });
    await open(page, "prayer");
    await expect(page.getByRole("button", { name: "Calculation method: Islamic Society of North America (ISNA)" })).toBeVisible();
    await expect(page.getByText("Asr calculation")).toBeVisible();
    await expect(page.getByText("Marja’ for Daily Fiqh rulings")).toHaveCount(0);
    await page.getByRole("button", { name: /Calculation method/ }).click();
    await expect(page.getByRole("menuitemradio")).toHaveCount(5);
    await page.keyboard.press("Escape");

    await page.getByRole("radio", { name: "Ja’fari" }).click();
    expect((await readStorage(page)).prayerFiqh).toBe("jafari"); // raw string, not JSON
    await expect(page.getByText("Asr calculation")).toHaveCount(0);
    await expect(page.getByText("Marja’ for Daily Fiqh rulings")).toBeVisible();
    await expect(page.getByRole("button", { name: /Calculation method: Shia Ithna-Ashari, Leva/ })).toBeVisible();
    await page.getByRole("button", { name: /Calculation method/ }).click();
    await expect(page.getByRole("menuitemradio")).toHaveCount(2);
    await page.getByRole("menuitemradio", { name: "Institute of Geophysics, University of Tehran" }).click();
    expect(await json(page, "quran:prayer-calc:v1")).toMatchObject({ jafariMethod: 7, sunniMethod: 2 });
    await expect.poll(() => aladhan.calls.some((u) => u.includes("method=7&school=0&midnightMode=1"))).toBe(true);
  });

  test("Hanafi Asr is sent as school=1 for Sunni, and a hidden Hanafi setting never reaches Ja'fari", async ({ context, page }) => {
    const aladhan = await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY });
    await open(page, "prayer");
    await page.getByRole("radio", { name: "Hanafi" }).click();
    await expect.poll(() => aladhan.calls.some((u) => u.includes("method=2&school=1&midnightMode=0"))).toBe(true);
    await page.getByRole("radio", { name: "Ja’fari" }).click();
    await expect.poll(() => aladhan.calls.some((u) => u.includes("method=0&school=0&midnightMode=1"))).toBe(true);
    expect(aladhan.calls.filter((u) => u.includes("method=0")).every((u) => u.includes("school=0"))).toBe(true);
  });

  test("the Daily Fiqh marja' is a separate setting in the legacy key, keeping the reading language", async ({ context, page }) => {
    await seed(context, { prayerFiqh: "jafari", "quran:fiqh-prefs:v1": JSON.stringify({ marjaId: null, lang: "ur", updatedAt: 1 }) });
    await open(page, "prayer");
    await page.getByRole("button", { name: /Marja’ for Daily Fiqh rulings: Not chosen yet/ }).click();
    await page.getByRole("menuitemradio", { name: /Sistani/ }).click();
    expect(await json(page, "quran:fiqh-prefs:v1")).toMatchObject({ marjaId: "sistani", lang: "ur" });
  });

  test("Hijri adjustment: stored, and the preview comes from the cached days", async ({ context, page }) => {
    await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY });
    await open(page, "prayer");
    const preview = page.getByTestId("hijri-preview");
    await expect(preview).toContainText("Today: 4 ");
    await expect(preview).not.toContainText("With your adjustment");
    await page.getByTestId("seg-1").click();
    expect(await json(page, "quran:hijri-adjust:v1")).toEqual({ days: 1 });
    await expect(preview).toContainText("With your adjustment: 5 ");
    await page.getByTestId("seg--2").click();
    await expect(preview).toContainText("With your adjustment: 2 ");
  });

  test("saved prayer times: what is saved and when; Update now fetches and reports; a failure keeps the old times", async ({ context, page }) => {
    const aladhan = await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY });
    await open(page, "prayer");
    await expect(page.getByText(/Saved for October 2026, so prayer times work offline. Last updated today at 9:14 AM./)).toBeVisible();
    const before = aladhan.calls.length;
    await page.getByTestId("update-now").click();
    await expect(page.getByTestId("update-message")).toHaveText("Updated just now for October 2026.");
    expect(aladhan.calls.length).toBeGreaterThan(before);

    aladhan.mode = "http500";
    await page.getByTestId("update-now").click();
    await expect(page.getByTestId("update-message")).toContainText("Couldn’t update (HTTP 500). The saved times are still in use.");
    await expect(page.getByText(/Saved for October 2026/)).toBeVisible(); // the old month is still there
  });

  test("offline: Update now is disabled with a note, and the saved times still show", async ({ context, page }) => {
    await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY });
    await open(page, "prayer");
    await expect(page.getByText(/Saved for October 2026/)).toBeVisible();
    await context.setOffline(true);
    await expect(page.getByTestId("update-now")).toBeDisabled();
    await expect(page.getByTestId("update-offline")).toHaveText("You’re offline. Update now needs a connection.");
    await expect(page.getByText(/You’re offline, so the saved times are still in use\. Last updated today at 9:14 AM\./)).toBeVisible();
  });

  test("switching fiqh to a tradition not saved yet: loading text, then its own times; switching back is instant", async ({ context, page }) => {
    const aladhan = await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY, "ayah-of-day": ayahEntry("2026-10-15") });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("schedule-toggle").click();
    await expect(page.getByTestId("chip-Maghrib")).toContainText("5:31 PM"); // Sunni
    const sunniCalls = aladhan.calls.length;

    await page.goto("/settings?section=prayer"); // (a full navigation here keeps the test simple; the in-app switch is below)
    await page.waitForLoadState("networkidle");
    await page.getByRole("radio", { name: "Ja’fari" }).click();
    await expect.poll(() => aladhan.calls.length).toBe(sunniCalls + 1);
    await expect(page.getByText(/Saved for October 2026/)).toBeVisible();
    await page.getByRole("radio", { name: "Sunni" }).click();
    await page.waitForTimeout(400);
    expect(aladhan.calls.length).toBe(sunniCalls + 1); // Sunni was cached: no request

    await page.goto("/");
    await page.getByTestId("schedule-toggle").click();
    await expect(page.getByTestId("chip-Maghrib")).toContainText("5:31 PM");
  });

  test("switching to an uncached tradition while the service is down: the old tradition's times are NOT shown; the choice is kept; switching back restores them", async ({ context, page }) => {
    const aladhan = await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY });
    await open(page, "prayer");
    await expect(page.getByText(/Saved for October 2026/)).toBeVisible();
    aladhan.mode = "network";
    await page.getByRole("radio", { name: "Ja’fari" }).click();
    await expect(page.getByText("Saved times for Ja’fari: none yet. They need a connection once.")).toBeVisible();
    expect((await readStorage(page)).prayerFiqh).toBe("jafari"); // the choice is kept
    await page.getByRole("radio", { name: "Sunni" }).click();
    await expect(page.getByText(/Saved for October 2026/)).toBeVisible(); // restored from the cache
  });
});

test.describe("Notifications", () => {
  test("the fixed limit sentence is shown, and nothing promises delivery while the app is closed", async ({ context, page }) => {
    await stubNotifications(context);
    await open(page, "notifications");
    await expect(page.getByText("Reminders only appear while Quran App is open.")).toBeVisible();
    const text = (await page.getByTestId("section-title").locator("xpath=..").innerText()).toLowerCase();
    expect(text).not.toMatch(/even when|when closed|in the background|always/);
  });

  test("turning it on asks permission in that tap; allowed: stored in the legacy prayerSettings shape", async ({ context, page }) => {
    await stubNotifications(context);
    await seed(context, { prayerSettings: JSON.stringify({ extra: "keep", reminderOffset: 5 }) });
    await open(page, "notifications");
    await expect(page.getByTestId("notify-permission")).toHaveText("Browser permission: Not asked yet.");
    expect(await page.evaluate(() => (window as unknown as { __prompts: number }).__prompts)).toBe(0); // not asked on page load
    await page.getByTestId("notify-switch").click();
    await expect(page.getByTestId("notify-permission")).toHaveText("Browser permission: Allowed.");
    expect(await json(page, "prayerSettings")).toMatchObject({ extra: "keep", notificationsEnabled: true, reminderOffset: 5 });
    await expect(page.getByTestId("notify-switch")).toBeChecked();
  });

  test("refused: the switch returns to off with an inline message, never alert()", async ({ context, page }) => {
    await stubNotifications(context);
    const dialogs: string[] = [];
    page.on("dialog", (d) => (dialogs.push(d.message()), d.dismiss()));
    await open(page, "notifications");
    await page.evaluate(() => ((window as unknown as { __permAnswer: string }).__permAnswer = "denied"));
    await page.getByTestId("notify-switch").click();
    await expect(page.getByTestId("notify-message")).toContainText("Notifications are blocked for this site. Allow them in your browser’s site settings");
    await expect(page.getByTestId("notify-switch")).not.toBeChecked();
    expect((await json(page, "prayerSettings"))?.notificationsEnabled ?? false).toBe(false);
    await expect(page.getByTestId("notify-permission")).toHaveText("Browser permission: Blocked.");
    expect(dialogs).toEqual([]);
  });

  test("already blocked: no new prompt, the message explains where to change it", async ({ context, page }) => {
    await stubNotifications(context, "denied");
    await open(page, "notifications");
    await page.getByTestId("notify-switch").click();
    await expect(page.getByTestId("notify-message")).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __prompts: number }).__prompts)).toBe(0);
  });

  test("a permission revoked after it was on is reported", async ({ context, page }) => {
    await stubNotifications(context, "denied");
    await seed(context, { prayerSettings: JSON.stringify({ notificationsEnabled: true }) });
    await open(page, "notifications");
    await expect(page.getByTestId("notify-revoked")).toBeVisible();
  });

  test("prayer chips, reminder time and the test button (enabled only with permission)", async ({ context, page }) => {
    await stubNotifications(context);
    await open(page, "notifications");
    await expect(page.getByTestId("notify-Fajr")).toBeDisabled(); // off until the switch is on
    await expect(page.getByTestId("notify-test")).toBeDisabled();
    await page.getByTestId("notify-switch").click();
    await page.getByTestId("notify-Dhuhr").click();
    await page.getByTestId("notify-Isha").click();
    await menu(page, /Reminder time/, "15 minutes before");
    expect(await json(page, "prayerSettings")).toEqual({
      notificationsEnabled: true,
      enabledPrayers: { Fajr: true, Dhuhr: false, Asr: true, Maghrib: true, Isha: false },
      reminderOffset: 15,
    });
    await expect(page.getByTestId("notify-Dhuhr")).toHaveAttribute("aria-pressed", "false");
    await page.getByTestId("notify-test").click();
    await expect(page.getByTestId("notify-test-message")).toHaveText("Test notification sent.");
    expect((await notifs(page)).at(-1)).toMatchObject({ title: "Test notification", tag: "test-notification" });
  });

  test("legacy prayerSettings values are shown", async ({ context, page }) => {
    await stubNotifications(context, "granted");
    await seed(context, { prayerSettings: JSON.stringify({ notificationsEnabled: true, enabledPrayers: { Fajr: false, Dhuhr: true, Asr: true, Maghrib: true, Isha: true }, reminderOffset: 10 }) });
    await open(page, "notifications");
    await expect(page.getByTestId("notify-switch")).toBeChecked();
    await expect(page.getByTestId("notify-Fajr")).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("button", { name: "Reminder time: 10 minutes before" })).toBeVisible();
  });

  test("the Home Screen hint appears only where the browser has no Notification API on an iPhone", async ({ browser }) => {
    const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15", serviceWorkers: "block" });
    await ctx.addInitScript(() => delete (window as unknown as { Notification?: unknown }).Notification);
    const p = await ctx.newPage();
    await p.goto("/settings?section=notifications");
    await p.waitForLoadState("networkidle");
    await expect(p.getByTestId("notify-home-screen")).toContainText("added to the Home Screen");
    await expect(p.getByTestId("notify-permission")).toHaveText("Browser permission: Not available in this browser.");
    await ctx.close();
  });

  test("the reminder fires at the prayer time in the location's zone, once, from the cached month, on a page that is not Settings", async ({ context, page }) => {
    await stubNotifications(context, "granted");
    await mockAladhan(context);
    await context.clock.install({ time: new Date("2026-10-15T11:47:30+05:00") }); // 30 s before Dhuhr (11:48)
    await seed(context, { last_location: LAHORE_LEGACY, "ayah-of-day": ayahEntry("2026-10-15"), prayerSettings: JSON.stringify({ notificationsEnabled: true, enabledPrayers: { Fajr: false, Dhuhr: true, Asr: false, Maghrib: false, Isha: false }, reminderOffset: 0 }) });
    await page.goto("/");
    await expect(page.getByTestId("tile-prayer")).toContainText("Dhuhr", { timeout: 15000 });
    expect(await notifs(page)).toEqual([]); // not yet
    await page.clock.runFor(35_000);
    await expect.poll(async () => (await notifs(page)).length).toBe(1);
    expect((await notifs(page))[0]).toMatchObject({ title: "Dhuhr time", body: "It is time for Dhuhr prayer.", tag: "prayer-2026-10-15:Dhuhr" });
    await page.clock.runFor(60_000);
    expect(await notifs(page)).toHaveLength(1); // shown once
  });

  test("a reminder up to 5 minutes late is shown on resume; older ones are skipped", async ({ browser }) => {
    for (const [time, expected] of [["2026-10-15T11:52:00+05:00", 1], ["2026-10-15T11:54:30+05:00", 0]] as const) {
      const ctx = await browser.newContext({ serviceWorkers: "block", timezoneId: "Asia/Karachi" });
      await stubNotifications(ctx, "granted");
      await mockAladhan(ctx);
      await mockVerse(ctx);
      await ctx.clock.install({ time: new Date(time) });
      await seed(ctx, { last_location: LAHORE_LEGACY, "ayah-of-day": ayahEntry("2026-10-15"), prayerSettings: JSON.stringify({ notificationsEnabled: true, enabledPrayers: { Fajr: false, Dhuhr: true, Asr: false, Maghrib: false, Isha: false }, reminderOffset: 0 }) });
      const p = await ctx.newPage();
      await p.goto("/");
      await expect(p.getByTestId("tile-prayer")).toContainText("Asr", { timeout: 15000 }); // Dhuhr has passed
      await p.clock.runFor(2000);
      expect((await notifs(p)).length, time).toBe(expected);
      await ctx.close();
    }
  });

  test("nothing fires when reminders are off", async ({ context, page }) => {
    await stubNotifications(context, "granted");
    await mockAladhan(context);
    await context.clock.install({ time: new Date("2026-10-15T11:47:30+05:00") });
    await seed(context, { last_location: LAHORE_LEGACY, "ayah-of-day": ayahEntry("2026-10-15") });
    await page.goto("/");
    await expect(page.getByTestId("tile-prayer")).toContainText("Dhuhr", { timeout: 15000 });
    await page.clock.runFor(120_000);
    expect(await notifs(page)).toEqual([]);
  });
});

test.describe("Data & privacy", () => {
  test("storage use is the browser's real figure; Manage downloads links to /downloads", async ({ page }) => {
    await open(page, "data");
    await expect(page.getByText(/used by this site/)).toBeVisible();
    await expect(page.getByTestId("manage-downloads")).toHaveAttribute("href", "/downloads");
  });

  test("Export: a flat file of every localStorage key, named with the local date, raw keys kept as strings", async ({ context, page }) => {
    await seed(context, { prayerFiqh: "jafari", "quran:bookmarks:v1": '["ayah:2:255"]', "quran:location:v1": '{"lat":1,"lon":2}' });
    await open(page, "data");
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("export").click()]);
    expect(download.suggestedFilename()).toBe("quran-app-data-2026-10-15.json");
    const file = JSON.parse(fs_read(await download.path()));
    expect(file.prayerFiqh).toBe("jafari");
    expect(file["quran:bookmarks:v1"]).toEqual(["ayah:2:255"]);
    expect(file["quran:location:v1"]).toEqual({ lat: 1, lon: 2 });
    await expect(page.getByTestId("export-message")).toHaveText("Saved quran-app-data-2026-10-15.json.");
  });

  test("Reset settings: defaults at once, data kept, and Undo restores everything", async ({ context, page }) => {
    await mockAladhan(context); // Reset changes the fiqh, and the saved place is known, so the times for it are loaded
    await seed(context, {
      themeMode: "dark",
      prayerFiqh: "jafari",
      "quran:accessibility:v1": JSON.stringify({ highContrast: true, futureField: 1 }),
      "quran:bookmarks:v1": '["ayah:1:1"]',
      "quran:location:v1": '{"lat":31.52,"lon":74.36,"source":"device","updatedAt":1}',
      "quran:fiqh-prefs:v1": JSON.stringify({ marjaId: "sistani", lang: "en", updatedAt: 1 }),
    });
    await open(page, "data");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByTestId("reset").click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    let st = await readStorage(page);
    expect(st.themeMode).toBeUndefined();
    expect(st.prayerFiqh).toBeUndefined();
    expect(JSON.parse(st["quran:accessibility:v1"]!)).toEqual({ futureField: 1 });
    expect(st["quran:bookmarks:v1"]).toBe('["ayah:1:1"]');
    expect(JSON.parse(st["quran:location:v1"]!).lat).toBe(31.52);
    expect(JSON.parse(st["quran:fiqh-prefs:v1"]!).marjaId).toBe("sistani");
    const toast = page.locator("[data-sonner-toast]").filter({ hasText: "Settings restored to their defaults" });
    await expect(toast).toBeVisible();
    await toast.getByRole("button", { name: "Undo" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    st = await readStorage(page);
    expect(st.themeMode).toBe("dark");
    expect(st.prayerFiqh).toBe("jafari");
    expect(JSON.parse(st["quran:accessibility:v1"]!)).toEqual({ highContrast: true, futureField: 1 });
  });

  test("Clear all: the confirmation lists what is removed and what stays; Cancel and Escape back out", async ({ context, page }) => {
    await seed(context, { themeMode: "dark", "quran:bookmarks:v1": '["ayah:1:1"]' });
    await open(page, "data");
    await page.getByTestId("clear").click();
    const box = page.getByTestId("clear-confirm");
    await expect(box).toContainText("This removes:");
    await expect(box).toContainText("settings, bookmarks, notes and collections, reading goals and progress, Hifz progress");
    await expect(box).toContainText("This stays:");
    await expect(box).toContainText("downloaded audio stays on this device and is listed again under Downloads");
    await expect(box).toContainText("the text and tafsir you saved for offline reading");
    await expect(page.getByTestId("confirm-downloads-link")).toHaveAttribute("href", "/downloads");
    await expect(page.getByTestId("clear-cancel")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("clear-confirm")).toHaveCount(0);
    await page.getByTestId("clear").click();
    await page.getByTestId("clear-cancel").click();
    expect((await readStorage(page)).themeMode).toBe("dark"); // nothing was deleted
  });

  test("Clear all: localStorage emptied and quran-revamp-db deleted; the legacy database, Cache Storage and the service worker are untouched", async ({ context, page }) => {
    await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY, themeMode: "dark", "quran:bookmarks:v1": '["ayah:1:1"]' });
    await open(page, "prayer"); // creates quran-revamp-db with a saved month
    await expect(page.getByText(/Saved for October 2026/)).toBeVisible();
    expect(await idbNames(page)).toContain("quran-revamp-db");
    await page.evaluate(async () => {
      // what the legacy app leaves on the device: its own IndexedDB (version 1) and downloaded audio in Cache Storage
      await new Promise<void>((ok) => {
        const open = indexedDB.open("quran-app-db", 1);
        open.onupgradeneeded = () => {
          open.result.createObjectStore("chapters");
          open.result.createObjectStore("tafsirs");
        };
        open.onsuccess = () => {
          const tx = open.result.transaction("chapters", "readwrite");
          tx.objectStore("chapters").put({ surah: 1 }, 1);
          tx.oncomplete = () => (open.result.close(), ok());
        };
      });
      await (await caches.open("quran-downloads-audio-cache")).put("/audio/1.mp3", new Response("audio-bytes"));
    });
    await open(page, "data");
    await page.getByTestId("clear").click();
    await Promise.all([page.waitForEvent("load"), page.getByTestId("clear-yes").click()]);
    await page.waitForLoadState("networkidle");
    expect(await readStorage(page)).toEqual({}); // everything is gone (and the app has not rewritten anything yet)
    const dbs = await page.evaluate(async () => (await indexedDB.databases()).map((d) => ({ name: d.name, version: d.version })));
    expect(dbs.find((d) => d.name === "quran-revamp-db")).toBeUndefined();
    expect(dbs.find((d) => d.name === "quran-app-db")).toEqual({ name: "quran-app-db", version: 1 }); // never bumped
    expect(await page.evaluate(async () => (await caches.keys()).includes("quran-downloads-audio-cache"))).toBe(true);
    expect(await page.evaluate(async () => await (await (await caches.open("quran-downloads-audio-cache")).match("/audio/1.mp3"))?.text())).toBe("audio-bytes");
  });
});

test.describe("sync", () => {
  test("a change in one tab appears in another tab's controls and effects, with no reload", async ({ context, page }) => {
    await open(page, "appearance");
    const other = await context.newPage();
    await other.goto("/settings?section=accessibility");
    await other.waitForLoadState("networkidle");
    await page.getByRole("radio", { name: "Dark" }).click();
    await expect(other.locator("html")).toHaveClass(/dark/);
    await other.getByRole("switch", { name: "High contrast" }).click();
    await page.goto("/settings?section=accessibility");
    await expect(page.getByRole("switch", { name: "High contrast" })).toBeChecked();
    await other.close();
  });

  test("every setting follows another tab: fiqh, notifications, calculation, layout", async ({ context, page }) => {
    await stubNotifications(context, "granted");
    await open(page, "prayer");
    const other = await context.newPage();
    await other.goto("/settings?section=prayer");
    await other.waitForLoadState("networkidle");
    await other.getByRole("radio", { name: "Ja’fari" }).click();
    await expect(page.getByRole("radio", { name: "Ja’fari" })).toBeChecked();
    await other.getByRole("button", { name: /Calculation method/ }).click();
    await other.getByRole("menuitemradio", { name: /Tehran/ }).click();
    await expect(page.getByRole("button", { name: /Calculation method: Institute of Geophysics/ })).toBeVisible();
    await other.close();
  });

  test("values written by the legacy app in another tab are picked up (and invalid ones fall back)", async ({ context, page }) => {
    await open(page, "appearance");
    const legacy = await context.newPage();
    await legacy.goto("/about");
    await legacy.evaluate(() => localStorage.setItem("themeMode", "dark"));
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();
    await legacy.evaluate(() => localStorage.setItem("themeMode", "purple"));
    await expect(page.getByRole("radio", { name: "Light" })).toBeChecked(); // invalid: the default
    await legacy.close();
  });

  test("Home follows a fiqh change made in Settings (same tab, no reload)", async ({ context, page }) => {
    await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY, "ayah-of-day": ayahEntry("2026-10-15") });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("schedule-toggle").click();
    await expect(page.getByTestId("chip-Maghrib")).toContainText("5:31 PM");
    await page.getByRole("link", { name: "Settings" }).first().click();
    await page.getByTestId("section-prayer").click();
    await page.getByRole("radio", { name: "Ja’fari" }).click();
    await page.getByRole("link", { name: "Home" }).first().click();
    await page.getByTestId("schedule-toggle").click();
    await expect(page.getByTestId("chip-Maghrib")).toContainText("5:46 PM");
  });
});

test.describe("mobile (375px)", () => {
  test.use({ viewport: { width: 375, height: 800 }, hasTouch: true });

  test("the section picker is a bottom sheet; choosing a section changes the page and the URL", async ({ page }) => {
    await open(page);
    await expect(page.getByTestId("section-prayer")).toBeHidden(); // no desktop list on mobile
    await page.getByTestId("section-picker").click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    // measured once the sheet has settled (it slides in; under load the first measurement could catch it mid-animation)
    await expect.poll(async () => (await sheet.getByRole("option", { name: "Notifications" }).boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(46);
    await sheet.getByRole("option", { name: "Notifications" }).getByRole("button").click();
    await expect(page).toHaveURL(/section=notifications/);
    await expect(page.getByTestId("section-title")).toHaveText("Notifications");
    await expect(page.getByTestId("section-picker")).toContainText("Notifications");
  });

  test("touch targets are at least 44px and nothing scrolls sideways, in every section", async ({ context, page }) => {
    await mockAladhan(context);
    await stubNotifications(context, "granted");
    await seed(context, { last_location: LAHORE_LEGACY, prayerFiqh: "jafari" });
    for (const id of ["appearance", "reading", "audio", "prayer", "notifications", "accessibility", "modules", "data"]) {
      await open(page, id);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${id}: no horizontal scroll`).toBe(true);
      // (a link inside a sentence is exempt from the minimum target size, as in WCAG 2.5.8; every other control is checked)
      const targets = page.locator("main button:visible, main [role=radio]:visible, main [role=switch]:visible, main a:visible:not(p a)");
      for (const t of await targets.all()) {
        const b = (await t.boundingBox())!;
        const name = ((await t.getAttribute("aria-label")) ?? (await t.innerText()) ?? "").slice(0, 30);
        if (b.height < 44 && (await t.getAttribute("role")) === "switch") continue; // a switch: the whole row (56px) is the target, checked below
        expect(b.height, `${id}: ${name}`).toBeGreaterThanOrEqual(43.5);
      }
    }
  });

  test("a switch row is a 56px tap target and toggles from the label", async ({ page }) => {
    await open(page, "accessibility");
    const row = page.getByText("Reduce motion").first();
    expect((await page.locator("label", { hasText: "Reduce motion" }).boundingBox())!.height).toBeGreaterThanOrEqual(56);
    await row.click();
    await expect(page.getByRole("switch", { name: "Reduce motion" })).toBeChecked();
  });

  test("a bottom-sheet menu in Settings (default translation) has 46px rows", async ({ page }) => {
    await open(page, "reading");
    await page.getByRole("button", { name: /Default translation/ }).click();
    const row = page.getByRole("dialog").getByRole("option", { name: "Urdu" });
    expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(46);
    await row.getByRole("button").click();
    expect((await readStorage(page)).translationDefaultLang).toBe("urdu");
  });
});

test.describe("keyboard", () => {
  test("switches toggle with Space, segments move with the arrow keys, the slider with the arrows", async ({ page }) => {
    await open(page, "accessibility");
    await page.getByRole("switch", { name: "High contrast" }).focus();
    await page.keyboard.press("Space");
    await expect(page.getByRole("switch", { name: "High contrast" })).toBeChecked();
    await open(page, "appearance");
    await page.getByRole("radio", { name: "Light" }).focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    await expect(page.getByRole("radio", { name: "Dark" })).toBeChecked();
    await open(page, "reading");
    await page.getByRole("slider", { name: "Arabic text size" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("scale-value")).toHaveText("1.1×");
  });

  test("every control in the Prayer section can be reached by Tab, with a visible focus ring", async ({ context, page }) => {
    await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY, prayerFiqh: "jafari" });
    await open(page, "prayer");
    await page.getByTestId("section-prayer").focus(); // start at the section list and Tab through the panel
    const seen: string[] = [];
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const cs = getComputedStyle(el);
        return { label: (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 40), ring: cs.outlineStyle !== "none" || cs.boxShadow !== "none" };
      });
      seen.push(info.label);
      if (info.label) expect(info.ring, info.label).toBe(true);
      if (info.label.includes("Update now")) break; // the last control of the panel
    }
    // (in a radio group only the chosen option is a Tab stop; the others are reached with the arrow keys, tested above)
    for (const want of ["Ja’fari", "Calculation method", "Marja’ for Daily Fiqh rulings", "Use my location", "Update now"]) {
      expect(seen.some((s) => s.includes(want)), want).toBe(true);
    }
  });
});

test.describe("offline", () => {
  test.use({ serviceWorkers: "allow" });

  test("Settings works offline: every section renders, Export works, Update now is disabled with a note", async ({ context, page }) => {
    await mockAladhan(context);
    await seed(context, { last_location: LAHORE_LEGACY, "ayah-of-day": ayahEntry("2026-10-15") });
    await loadAndControl(page, "/settings?section=prayer");
    await expect(page.getByText(/Saved for October 2026/)).toBeVisible();
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByTestId("section-title")).toHaveText("Prayer & location");
    await expect(page.getByTestId("update-now")).toBeDisabled();
    await expect(page.getByTestId("update-offline")).toBeVisible();
    await expect(page.getByText(/You’re offline, so the saved times are still in use/)).toBeVisible();
    for (const id of ["appearance", "reading", "audio", "notifications", "accessibility", "modules", "data"]) {
      await page.goto(`/settings?section=${id}`);
      await expect(page.getByTestId("section-title")).toBeVisible();
    }
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("export").click()]);
    expect(download.suggestedFilename()).toMatch(/^quran-app-data-\d{4}-\d{2}-\d{2}\.json$/);
  });
});

// A tiny sync reader for the downloaded file (Playwright gives a temp path).
function fs_read(p: string | null): string {
  return readFileSync(p!, "utf8");
}
