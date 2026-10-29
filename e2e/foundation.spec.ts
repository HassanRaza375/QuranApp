// Phase 0 foundation checks in a real browser (production build): theme, preferences wired to the legacy keys,
// responsive menu, undo toast, shell navigation, touch targets, legacy bridge.
import { expect, test, type Page } from "@playwright/test";

const seed = (page: Page, values: Record<string, string>) =>
  page.addInitScript((v) => {
    // Seed once per test: init scripts re-run on reload, so only set keys that are not there yet.
    if (sessionStorage.getItem("__seeded")) return;
    for (const [k, val] of Object.entries(v)) localStorage.setItem(k, val);
    sessionStorage.setItem("__seeded", "1");
  }, values);

const ls = (page: Page, key: string) => page.evaluate((k) => localStorage.getItem(k), key);

test.describe("theme", () => {
  test("light by default on a first run, even if the OS prefers dark", async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: "dark" });
    const page = await ctx.newPage();
    await page.goto("/foundation");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await ctx.close();
  });

  test("the saved legacy themeMode is applied before JavaScript runs (no flash)", async ({ page }) => {
    await page.route("**/_nuxt/**/*.js", (r) => r.abort()); // the app never starts; only the inline script runs
    await seed(page, { themeMode: "dark" });
    await page.goto("/foundation");
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(20, 22, 28)"); // --bg dark #14161C
  });

  test("system mode follows the OS", async ({ browser }) => {
    const ctx = await browser.newContext({ colorScheme: "dark" });
    const page = await ctx.newPage();
    await seed(page, { themeMode: "system" });
    await page.goto("/foundation");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await ctx.close();
  });

  test("choosing a theme writes the raw legacy themeMode value and switches at once", async ({ page }) => {
    await page.goto("/foundation");
    await page.getByRole("button", { name: "Theme" }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(await ls(page, "themeMode")).toBe("dark");
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("tokens: light and dark page colours match the design system", async ({ page }) => {
    await page.goto("/foundation");
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(243, 241, 234)"); // #F3F1EA
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim())).toBe("#2b6777");
  });
});

test.describe("preferences use the legacy keys and formats", () => {
  test("values written by the legacy app are shown", async ({ page }) => {
    await seed(page, {
      prayerFiqh: "jafari",
      preferredVerseDisplay: "urdu",
      "quran:accessibility:v1": JSON.stringify({ highContrast: true, arabicFontScale: 1.4, futureField: "keep" }),
    });
    await page.goto("/foundation");
    await expect(page.getByRole("button", { name: "Fiqh: Ja'fari" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Verse text: Urdu" })).toBeVisible();
    await expect(page.getByRole("switch", { name: "High contrast" })).toBeChecked();
    await expect(page.locator("html")).toHaveAttribute("data-high-contrast", "true");
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--arabic-font-scale"))).toBe("1.4");
  });

  test("changing settings writes the same keys, keeps unknown fields, and survives a reload", async ({ page }) => {
    await seed(page, { "quran:accessibility:v1": JSON.stringify({ futureField: "keep" }) });
    await page.goto("/foundation");
    await page.getByRole("button", { name: "Fiqh: Sunni" }).click();
    await page.getByRole("menuitemradio", { name: "Ja'fari" }).click();
    expect(await ls(page, "prayerFiqh")).toBe("jafari"); // raw string, not JSON
    await page.getByRole("switch", { name: "Reduce motion" }).click();
    const acc = JSON.parse((await ls(page, "quran:accessibility:v1"))!);
    expect(acc).toMatchObject({ futureField: "keep", reducedMotion: true });
    await page.reload();
    await expect(page.getByRole("button", { name: "Fiqh: Ja'fari" })).toBeVisible();
    await expect(page.getByRole("switch", { name: "Reduce motion" })).toBeChecked();
  });

  test("the Arabic size slider changes the CSS variable and is stored in the legacy accessibility object", async ({ page }) => {
    await page.goto("/foundation");
    const slider = page.getByRole("slider");
    await slider.focus();
    await page.keyboard.press("End");
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--arabic-font-scale"))).toBe("1.6");
    expect(JSON.parse((await ls(page, "quran:accessibility:v1"))!).arabicFontScale).toBe(1.6);
    const size = await page.locator(".ar").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThan(40); // 32px x 1.6 on desktop
    expect(await page.locator(".ar").first().evaluate((el) => getComputedStyle(el).letterSpacing)).toMatch(/^(0px|normal)$/);
  });

  test("another tab's change is picked up", async ({ page, context }) => {
    await page.goto("/foundation");
    const other = await context.newPage();
    await other.goto("/foundation");
    await other.getByRole("button", { name: "Fiqh: Sunni" }).click();
    await other.getByRole("menuitemradio", { name: "Ja'fari" }).click();
    await expect(page.getByRole("button", { name: "Fiqh: Ja'fari" })).toBeVisible();
  });
});

test.describe("legacy bridge in the browser", () => {
  test("real legacy data and a real legacy util are used", async ({ page }) => {
    await page.goto("/foundation");
    await expect(page.getByTestId("surah-row")).toHaveCount(3);
    await expect(page.getByTestId("surah-row").first()).toContainText("Al-Faatiha");
    await expect(page.getByTestId("legacy-util")).toContainText("FIQH_PARAMS.jafari");
    await expect(page.getByTestId("legacy-util")).toContainText(/found \d+ entries/);
  });
});

test.describe("undo over confirm", () => {
  test("remove shows a toast with Undo, and Undo restores the item", async ({ page }) => {
    await page.goto("/foundation");
    await page.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByTestId("item-removed")).toBeVisible();
    const toast = page.locator("[data-sonner-toast]").filter({ hasText: "Item removed" });
    await expect(toast).toBeVisible();
    await toast.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByTestId("item")).toBeVisible();
  });
});

test.describe("desktop shell (1280px)", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("grouped sidebar, accent bar on the active item, no menu button", async ({ page }) => {
    await page.goto("/foundation");
    const nav = page.getByRole("navigation", { name: "Main" }).first();
    for (const g of ["Read", "Study", "Knowledge base", "Worship"]) await expect(nav.getByText(g, { exact: true })).toBeVisible();
    await expect(nav.getByText("Literary modules")).toHaveCount(0); // hidden until enabled in Settings
    await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
    await page.getByRole("link", { name: "Surahs" }).first().click();
    const active = page.getByRole("link", { name: "Surahs" }).first();
    await expect(active).toHaveAttribute("aria-current", "page");
  });

  test("the Literary modules group appears when the legacy flag is on", async ({ page }) => {
    await seed(page, { "quran:additional-modules-enabled:v1": "true" });
    await page.goto("/foundation");
    await expect(page.getByRole("navigation", { name: "Main" }).first().getByText("Literary modules")).toBeVisible();
  });

  test("the menu is a popover on desktop", async ({ page }) => {
    await page.goto("/foundation");
    await page.getByRole("button", { name: "Verse text: Arabic" }).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("skip link and keyboard focus are visible", async ({ page }) => {
    await page.goto("/foundation");
    await page.waitForLoadState("networkidle"); // let the app mount, or Tab lands before the shell exists
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeVisible();
  });
});

test.describe("mobile shell (375px)", () => {
  test.use({ viewport: { width: 375, height: 700 }, hasTouch: true });

  test("no horizontal scroll", async ({ page }) => {
    await page.goto("/foundation");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("the drawer opens from the menu button, links are at least 44px, and navigating closes it", async ({ page }) => {
    await page.goto("/foundation");
    await page.getByRole("button", { name: "Open menu" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const link = dialog.getByRole("link", { name: "Surahs" });
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await link.click();
    await expect(page.getByRole("heading", { name: "Surah listing", level: 1 })).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("the menu is a bottom sheet with 46px rows on mobile", async ({ page }) => {
    await page.goto("/foundation");
    await page.getByRole("button", { name: "Verse text: Arabic" }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    const row = sheet.getByRole("option", { name: "English" });
    expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(46);
    await row.getByRole("button").click();
    expect(await ls(page, "preferredVerseDisplay")).toBe("english");
    await expect(page.getByRole("button", { name: "Verse text: English" })).toBeVisible();
  });

  test("interactive controls are at least 44px tall", async ({ page }) => {
    await page.goto("/foundation");
    for (const name of ["Open menu", "Theme", "Remove", "Fiqh: Sunni"]) {
      const box = await page.getByRole("button", { name }).first().boundingBox();
      expect(box!.height, name).toBeGreaterThanOrEqual(44);
      expect(box!.width, name).toBeGreaterThanOrEqual(44);
    }
  });

  test("Arabic is not truncated and does not overflow at 375px", async ({ page }) => {
    await page.goto("/foundation");
    const ar = page.locator(".ar").first();
    expect(await ar.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    expect(await ar.evaluate((el) => getComputedStyle(el).textOverflow)).toBe("clip");
  });
});

test.describe("shell basics", () => {
  test("an unbuilt legacy route shows a clear message, not a blank page", async ({ page }) => {
    await page.goto("/poets"); // Poets is deferred (Phase 16 decides); /goals was the example until Phase 15, /hifz until Phase 14
    await expect(page.getByRole("heading", { name: "This page is not rebuilt yet" })).toBeVisible();
  });

  test("no console errors or hydration warnings on the public pages", async ({ page, context }) => {
    await context.addInitScript((e) => {
      if (!localStorage.getItem("ayah-of-day")) localStorage.setItem("ayah-of-day", e);
    }, JSON.stringify({ date: "2000-01-01", localDate: "2000-01-01", data: { arabic: "x", translation: "x", urdu: "x", surah_name: "x", ayah_number: 1, surah_number: 1 } }));
    await context.route(/quranapi\.pages\.dev/, (r) => r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ arabic1: "T", english: "T", urdu: "T", surahNameArabicLong: "T" }) }));
    const problems: string[] = [];
    page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && problems.push(m.text()));
    page.on("pageerror", (e) => problems.push(String(e)));
    for (const p of ["/", "/about", "/surah-listing", "/foundation"]) {
      await page.goto(p);
      await page.waitForLoadState("networkidle");
    }
    expect(problems).toEqual([]);
  });

  test("no request leaves the origin (fonts and icons are bundled, no CDN)", async ({ page }) => {
    const external: string[] = [];
    page.on("request", (r) => {
      const u = new URL(r.url());
      if (u.origin !== "http://localhost:3011" && !u.protocol.startsWith("data") && !u.protocol.startsWith("blob")) external.push(r.url());
    });
    await page.goto("/foundation");
    await page.waitForLoadState("networkidle");
    expect(external).toEqual([]);
  });
});

test.describe("keyboard only", () => {
  test("a nav link shows a visible focus ring", async ({ page }) => {
    await page.goto("/foundation");
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: "Home" }).first().focus();
    await page.keyboard.press("Tab");
    const style = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const s = getComputedStyle(el);
      return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth };
    });
    expect(style.outlineStyle).not.toBe("none");
    expect(parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
  });

  test("the theme menu works with keys only and Escape closes it", async ({ page }) => {
    await page.goto("/foundation");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Theme" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("ArrowDown"); // opening with the keyboard focuses "Light"; one step down is "Dark"
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(await ls(page, "themeMode")).toBe("dark");
    await page.getByRole("button", { name: "Theme" }).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Theme" })).toBeFocused();
  });
});

test.describe("keyboard only (mobile drawer)", () => {
  test.use({ viewport: { width: 375, height: 700 } });
  test("the nav drawer traps focus, closes with Escape and returns focus to the menu button", async ({ page }) => {
    await page.goto("/foundation");
    await page.waitForLoadState("networkidle");
    const button = page.getByRole("button", { name: "Open menu" });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    for (let i = 0; i < 40; i++) await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true); // focus stays inside
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(button).toBeFocused();
  });
});
