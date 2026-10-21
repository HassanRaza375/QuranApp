// Phase 9B: Tasbeeh in a real browser, on the production build. The dhikr are the legacy data (bundled, offline level A); counts are written to
// `quran:tasbeeh:v1` in the legacy shape. Every unmocked request to a real API fails the test; the clock is fixed.
// See docs/phases/phase-09b-asma-sajda-tasbeeh.md.
import { expect, test, type Page } from "@playwright/test";
import { forbidRealApis, freezeClock, idbNames, mockQuranText, readStorage, seed } from "./mocks";

test.use({ serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });
let leaks: string[] = [];
test.beforeEach(async ({ context }) => {
  leaks = await forbidRealApis(context);
  await freezeClock(context);
  await mockQuranText(context);
  // record every vibration the page asks for
  await context.addInitScript(() => {
    (window as unknown as { __vib: unknown[] }).__vib = [];
    Object.defineProperty(navigator, "vibrate", { configurable: true, value: (p: unknown) => ((window as unknown as { __vib: unknown[] }).__vib.push(p), true) });
  });
});
test.afterEach(() => {
  expect(leaks, "a test reached a real upstream API").toEqual([]);
});

const toast = (page: Page, text: string) => page.locator("[data-sonner-toast]").filter({ hasText: text });
const record = async (page: Page) => JSON.parse((await readStorage(page))["quran:tasbeeh:v1"] ?? "{}") as Record<string, Record<string, unknown>>;
const vib = (page: Page) => page.evaluate(() => (window as unknown as { __vib: unknown[] }).__vib);
async function open(page: Page, id = "subhanallah") {
  await page.goto(`/tasbeeh/${id}`);
  await expect(page.getByTestId("tap")).toBeVisible();
}
const noScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const LEGACY = {
  "quran:tasbeeh:v1": JSON.stringify({
    subhanallah: { count: 5, target: 33, cycles: 2, lifetime: 71 },
    alhamdulillah: { count: 12, target: 99, cycles: 0, lifetime: 12, note: "kept" },
    "name-12": { count: 3, target: 33, cycles: 0, lifetime: 3 },
    futureCounter: { count: 1, target: 100, cycles: 4, lifetime: 401 },
  }),
};
const push = (page: Page, to: string) => page.evaluate((p) => (document.querySelector("#__nuxt") as unknown as { __vue_app__: { config: { globalProperties: { $router: { push(p: string): void } } } } }).__vue_app__.config.globalProperties.$router.push(p), to);

test.describe("the counters", () => {
  test("six counters from the legacy data, with count / goal from storage; no After prayer, no external request, quran-app-db never opened", async ({ page, context }) => {
    await seed(context, LEGACY);
    await page.goto("/tasbeeh");
    await expect(page.getByRole("heading", { level: 1, name: "Tasbeeh" })).toBeVisible();
    await expect(page.getByTestId("counter-name")).toHaveText(["SubhanAllah", "Alhamdulillah", "Allahu Akbar", "La ilaha illallah", "Astaghfirullah", "Custom Dhikr"]);
    await expect(page.getByTestId("counter-subhanallah").getByTestId("counter-progress")).toHaveText("5 / 33");
    await expect(page.getByTestId("counter-alhamdulillah").getByTestId("counter-progress")).toHaveText("12 / 99");
    await expect(page.getByTestId("counter-allahuakbar").getByTestId("counter-progress")).toHaveText("0 / 33");
    await expect(page.getByTestId("tasbeeh-index")).not.toContainText(/after prayer|fatima|sunni|ja.?fari/i);
    await expect(page.getByTestId("counter-subhanallah")).toHaveAttribute("href", "/tasbeeh/subhanallah");
    expect(await idbNames(page)).not.toContain("quran-app-db");
    // reading the page writes nothing
    expect((await readStorage(page))["quran:tasbeeh:v1"]).toBe(LEGACY["quran:tasbeeh:v1"]);
  });
});

test.describe("counting", () => {
  test("the count button is a real button; tapping counts, writes the legacy shape, and the ring and totals follow", async ({ page }) => {
    await open(page);
    const tap = page.getByTestId("tap");
    expect(await tap.evaluate((el) => el.tagName)).toBe("BUTTON");
    await expect(tap).toHaveAttribute("aria-label", "Count. 0 of 33");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("SubhanAllah");
    expect(await record(page)).toEqual({}); // viewing writes nothing
    for (let i = 0; i < 3; i++) await tap.click();
    await expect(page.getByTestId("count-value")).toHaveText("3");
    await expect(page.getByTestId("count-target")).toHaveText("of 33");
    await expect(page.getByTestId("lifetime")).toHaveText("3");
    await expect(page.getByTestId("cycles")).toHaveText("0");
    await expect(tap).toHaveAttribute("aria-label", "Count. 3 of 33");
    expect(await record(page)).toEqual({ subhanallah: { count: 3, target: 33, cycles: 0, lifetime: 3 } });
    const offset = Number(await page.locator(".ring-bar").getAttribute("stroke-dashoffset"));
    const full = Number(await page.locator(".ring-bar").getAttribute("stroke-dasharray"));
    expect(offset).toBeCloseTo(full * (1 - 3 / 33), 0);
  });

  test("Space and Enter count; holding a key down does not run the count up", async ({ page }) => {
    await open(page);
    await page.getByTestId("tap").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("count-value")).toHaveText("1");
    await page.keyboard.press("Space");
    await expect(page.getByTestId("count-value")).toHaveText("2");
    await page.keyboard.down("Enter");
    await page.keyboard.down("Enter"); // auto-repeat
    await page.keyboard.down("Enter");
    await page.keyboard.up("Enter");
    await expect(page.getByTestId("count-value")).toHaveText("3"); // one count for one press
  });

  test("the count is announced politely on every tap; reaching the goal is announced, adds a cycle and starts again from 0", async ({ page, context }) => {
    await seed(context, { "quran:tasbeeh:v1": JSON.stringify({ subhanallah: { count: 31, target: 33, cycles: 2, lifetime: 95 } }) });
    await open(page);
    const live = page.getByTestId("count-live");
    await expect(live).toHaveAttribute("aria-live", "polite");
    await expect(live).toHaveAttribute("role", "status");
    await page.getByTestId("tap").click();
    await expect(live).toHaveText("32 of 33");
    await page.getByTestId("tap").click();
    await expect(live).toHaveText("Goal of 33 reached. 3 cycles completed.");
    await expect(page.getByTestId("count-value")).toHaveText("0");
    await expect(page.getByTestId("cycles")).toHaveText("3");
    await expect(page.getByTestId("lifetime")).toHaveText("97");
    expect(await record(page)).toEqual({ subhanallah: { count: 0, target: 33, cycles: 3, lifetime: 97 } });
  });

  test("a counter that exists in the legacy record keeps its numbers; the other counters, unknown fields and name counters stay intact", async ({ page, context }) => {
    await seed(context, LEGACY);
    await open(page, "alhamdulillah");
    await expect(page.getByTestId("count-value")).toHaveText("12");
    await expect(page.getByTestId("count-target")).toHaveText("of 99");
    await page.getByTestId("tap").click();
    const r = await record(page);
    expect(r.alhamdulillah).toEqual({ count: 13, target: 99, cycles: 0, lifetime: 13, note: "kept" });
    expect(r.subhanallah).toEqual({ count: 5, target: 33, cycles: 2, lifetime: 71 });
    expect(r["name-12"]).toEqual({ count: 3, target: 33, cycles: 0, lifetime: 3 });
    expect(r.futureCounter).toEqual({ count: 1, target: 100, cycles: 4, lifetime: 401 });
  });

  test("the custom counter and an unknown id count too (a counter named by its id, as the legacy page does)", async ({ page }) => {
    await open(page, "custom");
    await expect(page.getByTestId("counter-title")).toHaveText("Custom Dhikr");
    await expect(page.getByTestId("counter-arabic")).toHaveCount(0);
    await page.getByTestId("tap").click();
    await page.goto("/tasbeeh/anything");
    await expect(page.getByTestId("counter-title")).toHaveText("anything");
    await page.getByTestId("tap").click();
    const r = await record(page);
    expect(r.custom!.lifetime).toBe(1);
    expect(r.anything!.lifetime).toBe(1);
  });
});

test.describe("reset and goals, with Undo", () => {
  test("Reset count returns to 0 and keeps cycles and lifetime; Undo puts the count back; at 0 it does nothing", async ({ page, context }) => {
    await seed(context, LEGACY);
    await open(page);
    await page.getByTestId("reset").click();
    await expect(page.getByTestId("count-value")).toHaveText("0");
    await expect(page.getByTestId("cycles")).toHaveText("2");
    await expect(page.getByTestId("lifetime")).toHaveText("71");
    expect((await record(page)).subhanallah).toEqual({ count: 0, target: 33, cycles: 2, lifetime: 71 });
    await expect(page.getByTestId("count-live")).toHaveText("Count reset to 0.");
    await toast(page, "Count reset to 0").getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("count-value")).toHaveText("5");
    expect((await record(page)).subhanallah).toEqual({ count: 5, target: 33, cycles: 2, lifetime: 71 });
    // at 0 there is nothing to reset: no second toast
    await page.getByTestId("reset").click();
    await expect(toast(page, "Count reset to 0")).toHaveCount(1);
    await page.getByTestId("reset").click({ force: true });
    await expect(toast(page, "Count reset to 0")).toHaveCount(1);
    await expect(page.getByTestId("reset")).toHaveAttribute("aria-disabled", "true");
  });

  test("a new goal takes effect, the count goes back to 0 as in the legacy counter, and Undo restores both", async ({ page, context }) => {
    await seed(context, LEGACY);
    await open(page);
    await page.getByTestId("goal-99").click();
    await expect(page.getByTestId("goal-99")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("count-target")).toHaveText("of 99");
    await expect(page.getByTestId("count-value")).toHaveText("0");
    expect((await record(page)).subhanallah).toEqual({ count: 0, target: 99, cycles: 2, lifetime: 71 });
    await toast(page, "Goal set to 99").getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("count-target")).toHaveText("of 33");
    await expect(page.getByTestId("count-value")).toHaveText("5");
    expect((await record(page)).subhanallah).toEqual({ count: 5, target: 33, cycles: 2, lifetime: 71 });
    for (const g of [33, 99, 100]) await expect(page.getByTestId(`goal-${g}`)).toBeVisible();
  });
});

test.describe("vibration", () => {
  test("on by default where the browser can: 15 ms for a count, the legacy pattern for a finished cycle", async ({ page, context }) => {
    await seed(context, { "quran:tasbeeh:v1": JSON.stringify({ subhanallah: { count: 31, target: 33, cycles: 0, lifetime: 31 } }) });
    await open(page);
    await expect(page.getByTestId("vibrate")).toHaveAttribute("aria-checked", "true");
    await page.getByTestId("tap").click();
    await page.getByTestId("tap").click();
    expect(await vib(page)).toEqual([15, [120, 60, 120, 60, 120]]);
  });

  test("the switch next to the counter turns it off (and writes its own additive key, not Settings), and on again", async ({ page }) => {
    await open(page);
    await page.getByTestId("vibrate").click();
    await expect(page.getByTestId("vibrate")).toHaveAttribute("aria-checked", "false");
    expect(JSON.parse((await readStorage(page))["quran:tasbeeh-prefs:v1"]!)).toEqual({ vibrate: false });
    await page.getByTestId("tap").click();
    expect(await vib(page)).toEqual([]);
    await page.reload();
    await expect(page.getByTestId("vibrate")).toHaveAttribute("aria-checked", "false"); // remembered
    await page.getByTestId("vibrate").click();
    await expect(page.getByTestId("vibrate")).toHaveAttribute("aria-checked", "true");
    expect(JSON.parse((await readStorage(page))["quran:tasbeeh-prefs:v1"]!)).toEqual({ vibrate: true });
    expect((await readStorage(page))["quran:accessibility:v1"]).toBeUndefined(); // Settings is untouched
  });

  test("while Reduce motion is on there is no vibration, and the switch says why; the ring does not animate", async ({ page, context }) => {
    await seed(context, { "quran:accessibility:v1": JSON.stringify({ reducedMotion: true }) });
    await open(page);
    await expect(page.getByTestId("vibrate-note")).toHaveText("Off while Reduce motion is on in Settings.");
    await page.getByTestId("tap").click();
    await page.getByTestId("tap").click();
    expect(await vib(page)).toEqual([]);
    expect(await page.locator(".ring-bar").evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration))).toBeLessThan(0.001); // none (the app sets a near-zero duration)
    await expect(page.getByTestId("count-value")).toHaveText("2"); // counting itself is unaffected
  });

  test("where the browser cannot vibrate the switch is not shown", async ({ page, context }) => {
    await context.addInitScript(() => Object.defineProperty(navigator, "vibrate", { configurable: true, value: undefined }));
    await open(page);
    await expect(page.getByTestId("vibrate-row")).toHaveCount(0);
    await page.getByTestId("tap").click();
    await expect(page.getByTestId("count-value")).toHaveText("1");
  });
});

test.describe("Count this name", () => {
  test("the Asma-ul-Husna sheet opens a counter for that name; it counts under name-<n> in quran:tasbeeh:v1 beside the others", async ({ page, context }) => {
    await seed(context, LEGACY);
    await page.goto("/asma-ul-husna#name-12");
    await expect(page.getByTestId("name-sheet")).toBeVisible();
    const translit = (await page.getByTestId("sheet-name").textContent())!;
    const arabic = (await page.getByTestId("sheet-arabic").textContent())!;
    await page.getByTestId("sheet-count").click();
    await expect(page).toHaveURL(/\/tasbeeh\/name-12$/);
    await expect(page.getByTestId("counter-title")).toHaveText(translit);
    await expect(page.getByTestId("counter-arabic")).toHaveText(arabic);
    await expect(page.getByTestId("counter-meaning")).not.toBeEmpty();
    await expect(page.getByTestId("count-value")).toHaveText("3"); // the stored name-12 counter
    await page.getByTestId("tap").click();
    const r = await record(page);
    expect(r["name-12"]).toEqual({ count: 4, target: 33, cycles: 0, lifetime: 4 });
    expect(Object.keys(r).sort()).toEqual(["alhamdulillah", "futureCounter", "name-12", "subhanallah"]);
    await expect(page.getByTestId("open-name")).toHaveAttribute("href", "/asma-ul-husna#name-12");
  });
});

test.describe("offline, dark mode and a phone", () => {
  test("counting works offline (nothing is fetched)", async ({ page, context }) => {
    await open(page);
    await push(page, "/tasbeeh");
    await expect(page.getByTestId("tasbeeh-index")).toBeVisible();
    await context.setOffline(true);
    await push(page, "/tasbeeh/subhanallah");
    await expect(page.getByTestId("tap")).toBeVisible();
    await page.getByTestId("tap").click();
    await expect(page.getByTestId("count-value")).toHaveText("1");
    expect((await record(page)).subhanallah!.lifetime).toBe(1);
  });
  test("dark theme", async ({ page, context }) => {
    await seed(context, { themeMode: "dark" });
    await open(page);
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(true);
  });
  test.describe("375px", () => {
    test.use({ viewport: { width: 375, height: 800 } });
    test("one h1, no horizontal scroll, 44px targets, the count button fits", async ({ page }) => {
      await open(page);
      expect(await noScroll(page)).toBe(true);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      for (const id of ["tap", "goal-33", "goal-99", "goal-100", "reset", "back-link"]) expect((await page.getByTestId(id).boundingBox())!.height, id).toBeGreaterThanOrEqual(43.5);
      expect((await page.getByTestId("goal-33").boundingBox())!.width).toBeGreaterThanOrEqual(43.5);
      expect((await page.getByTestId("vibrate").boundingBox())!.height).toBeGreaterThanOrEqual(23); // the switch itself; its label row is 44px
      expect((await page.locator('label:has([data-testid="vibrate"])').boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
      const b = (await page.getByTestId("tap").boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(375);
      await page.goto("/tasbeeh");
      await expect(page.getByTestId("tasbeeh-index")).toBeVisible();
      expect(await noScroll(page)).toBe(true);
      expect((await page.getByTestId("counter-subhanallah").boundingBox())!.height).toBeGreaterThanOrEqual(43.5);
    });
  });
});
