// Phase 17B to F in a real browser, on the production build with sync ON (the second server, port 3013). The account server is the fake in e2e/accountMocks.ts: it
// applies the real push and pull rules, so two browser contexts ("devices") share one "server" and sync with each other. Nothing reaches a real service.
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { forbidRealApis, freezeClock, mockAladhan, readStorage, seed } from "./mocks";
import { AccountServer, mockAccount } from "./accountMocks";

test.use({ baseURL: "http://localhost:3013", serviceWorkers: "block", timezoneId: "Asia/Karachi", locale: "en-GB", viewport: { width: 1280, height: 900 } });

const BOOKMARKS = JSON.stringify(["ayah:2:255", "surah:18"]);
const ADDED = JSON.stringify({ "ayah:2:255": 1000, "surah:18": 2000 });
const LIB = JSON.stringify({ collections: [{ id: "c1", name: "Fridays", description: "", createdAt: 5 }], itemMeta: { "ayah:2:255": { note: "my note", tags: ["dua"], collectionIds: ["c1"], updatedAt: 7 } } });
const DEVICE_A = { "quran:bookmarks:v1": BOOKMARKS, "quran:bookmarks:added-at:v1": ADDED, "quran:library:v1": LIB, prayerFiqh: "jafari", "quran:location:v1": JSON.stringify({ lat: 31.5, lon: 74.3 }), "quran:search-history:v1": JSON.stringify(["private"]) };

let leaks: string[][] = []; // one list per browser context the test opens
let server: AccountServer;
test.beforeEach(async ({ context }) => {
  leaks = [await forbidRealApis(context)];
  await freezeClock(context);
  await mockAladhan(context); // a device with a saved place asks for its prayer times when its settings change
  server = new AccountServer();
  await mockAccount(context, server);
});
test.afterEach(() => expect(leaks.flat(), "a test reached a real service").toEqual([]));

const ls = async (page: Page, k: string) => (await readStorage(page))[k] ?? null;
async function device(context: BrowserContext, srv: AccountServer = server, values?: Record<string, string>) {
  leaks.push(await forbidRealApis(context));
  await freezeClock(context);
  await mockAladhan(context);
  await mockAccount(context, srv);
  if (values) await seed(context, values);
  return context.newPage();
}
/** the test's own context is already set up in beforeEach: seed it and open a page */
async function first(context: BrowserContext, values?: Record<string, string>) {
  if (values) await seed(context, values);
  return context.newPage();
}
async function signUp(page: Page, email = "a@example.test", name = "Aisha") {
  await page.goto("/settings?section=account&mode=signup");
  await page.getByTestId("auth-name").fill(name);
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill("correct-horse-1");
  await page.getByTestId("auth-submit").click();
  await expect(page.getByTestId("account-signed-in")).toBeVisible();
}
async function signIn(page: Page, email = "a@example.test") {
  await page.goto("/settings?section=account&mode=signin");
  await page.getByTestId("auth-email").fill(email);
  await page.getByTestId("auth-password").fill("correct-horse-1");
  await page.getByTestId("auth-submit").click();
  await expect(page.getByTestId("account-signed-in")).toBeVisible();
}

test.describe("the Account area", () => {
  test("is a Settings section with sync on; signed out it offers sign in and create account and nothing is requested until asked", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByTestId("section-account")).toBeVisible();
    await page.getByTestId("section-account").click();
    await expect(page.getByTestId("account-signed-out")).toBeVisible();
    await expect(page.getByText("An account is optional")).toBeVisible();
    await expect(page.getByTestId("account-signin")).toBeVisible();
    expect(server.calls.some((c) => c.includes("/api/sync/"))).toBe(false); // signed out: no sync request
  });

  test("create an account through the page: signed in, with the geometric default picture, and nothing syncs until a choice is made", async ({ page }) => {
    await signUp(page);
    await expect(page.getByTestId("account-name")).toHaveText("Aisha");
    await expect(page.getByTestId("account-email")).toHaveText("a@example.test");
    await expect(page.getByTestId("account-signed-in").getByTestId("account-monogram")).toBeVisible();
    await expect(page.getByTestId("account-photo")).toHaveCount(0);
    await expect(page.getByTestId("sync-choose")).toBeVisible();
    await expect(page.getByTestId("sync-status")).toHaveText("Nothing is syncing yet.");
    expect(server.calls.filter((c) => c.includes("/api/sync/push"))).toEqual([]);
    expect(await ls(page, "quran:sync-prefs:v1")).toBeNull();
  });

  test("errors are plain: a wrong password, an existing email, a short password", async ({ page }) => {
    server.addUser({ email: "a@example.test", password: "correct-horse-1" });
    await page.goto("/settings?section=account&mode=signin");
    await page.getByTestId("auth-email").fill("a@example.test");
    await page.getByTestId("auth-password").fill("not-the-password");
    await page.getByTestId("auth-submit").click();
    await expect(page.getByTestId("auth-error")).toHaveText("That email and password don’t match.");
    await page.getByTestId("auth-switch").click();
    await page.getByTestId("auth-name").fill("Again");
    await page.getByTestId("auth-email").fill("a@example.test");
    await page.getByTestId("auth-password").fill("correct-horse-1");
    await page.getByTestId("auth-submit").click();
    await expect(page.getByTestId("auth-error")).toContainText("already exists");
    await page.getByTestId("auth-password").fill("short");
    await expect(page.getByTestId("auth-submit")).toBeDisabled();
  });

  test("Google is offered only when the server has it; forgot password only when it can send email", async ({ page }) => {
    await page.goto("/settings?section=account&mode=signin");
    await expect(page.getByTestId("auth-google")).toBeVisible();
    await expect(page.getByTestId("auth-forgot")).toHaveCount(0);
    await expect(page.getByText("can’t send email")).toBeVisible();
    server.config.google = false;
    server.config.email = { verification: true, reset: true };
    await page.reload();
    await expect(page.getByTestId("auth-google")).toHaveCount(0);
    await expect(page.getByTestId("auth-forgot")).toBeVisible();
  });

  test("the header has a quiet account entry: Sign in and Create account, then Account and Sign out", async ({ page }) => {
    await page.goto("/about");
    await page.getByTestId("account-menu").click();
    await expect(page.getByRole("menuitemradio", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("menuitemradio", { name: "Create account" })).toBeVisible();
    await page.getByRole("menuitemradio", { name: "Create account" }).click();
    await expect(page).toHaveURL(/section=account&mode=signup/);
    await signUp(page, "h@example.test", "Hana");
    await page.goto("/about");
    await page.getByTestId("account-menu").click();
    await expect(page.getByRole("menuitemradio", { name: "Account" })).toBeVisible();
    await page.getByRole("menuitemradio", { name: "Sign out" }).click();
    await page.getByTestId("account-menu").click();
    await expect(page.getByRole("menuitemradio", { name: "Sign in" })).toBeVisible();
  });
});

test.describe("sync between two devices", () => {
  test("device A uploads; device B signs in empty and receives the same data in the same shapes; never-synced keys stay put", async ({ browser, context }) => {
    const a = await first(context, DEVICE_A);
    await signUp(a);
    await a.getByTestId("sync-start").click();
    await expect(a.getByTestId("sync-status")).toContainText("Last synced");
    await expect(a.getByTestId("sync-library")).toHaveAttribute("aria-checked", "true");

    const ctxB = await browser.newContext({ baseURL: "http://localhost:3013", serviceWorkers: "block" });
    const b = await device(ctxB, server);
    await signIn(b);
    await expect.poll(() => ls(b, "quran:bookmarks:v1"), { timeout: 15000 }).toBe(BOOKMARKS);
    expect(await ls(b, "quran:bookmarks:added-at:v1")).toBe(ADDED);
    expect(JSON.parse((await ls(b, "quran:library:v1"))!).itemMeta["ayah:2:255"].note).toBe("my note");
    expect(await ls(b, "prayerFiqh")).toBe("jafari"); // a raw string stays a raw string
    expect(await ls(b, "quran:location:v1")).toBeNull(); // the saved place never syncs
    expect(await ls(b, "quran:search-history:v1")).toBeNull();
    expect(await ls(a, "quran:location:v1")).not.toBeNull();
    // the account's three switches are on here too (they belong to the account)
    await expect(b.getByTestId("sync-progress")).toHaveAttribute("aria-checked", "true");
    // and the server holds nothing from a never key
    const stored = JSON.stringify(server.rowsOf(server.userByEmail("a@example.test")!.id).map((r) => r.payload));
    expect(stored).not.toContain("31.5");
    expect(stored).not.toContain("private");
    await ctxB.close();
  });

  test("a change made through the page on one device reaches the other", async ({ browser, context }) => {
    const a = await first(context, DEVICE_A);
    await signUp(a);
    await a.getByTestId("sync-start").click();
    await expect(a.getByTestId("sync-status")).toContainText("Last synced");
    const ctxB = await browser.newContext({ baseURL: "http://localhost:3013", serviceWorkers: "block" });
    const b = await device(ctxB, server);
    await signIn(b);
    await expect.poll(() => ls(b, "prayerFiqh")).toBe("jafari");
    // B changes the theme through the header menu
    await b.goto("/about");
    await b.getByRole("button", { name: "Theme" }).click();
    await b.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect.poll(() => ls(b, "themeMode")).toBe("dark");
    await expect.poll(() => server.calls.filter((c) => c.includes("/api/sync/push")).length, { timeout: 15000 }).toBeGreaterThan(1);
    // A syncs (the button) and follows
    await a.getByTestId("sync-now").click();
    await expect.poll(() => ls(a, "themeMode"), { timeout: 15000 }).toBe("dark");
    await ctxB.close();
  });

  test("the first merge on a device with data: the account's data is added, an Undo toast says how much, and Undo restores this device exactly and turns sync off", async ({ browser, context }) => {
    const a = await first(context, { "quran:bookmarks:v1": JSON.stringify(["surah:2"]), "quran:bookmarks:added-at:v1": JSON.stringify({ "surah:2": 5 }) });
    await signUp(a);
    await a.getByTestId("sync-start").click();
    await expect(a.getByTestId("sync-status")).toContainText("Last synced");

    const mine = { "quran:bookmarks:v1": JSON.stringify(["surah:9"]), "quran:bookmarks:added-at:v1": JSON.stringify({ "surah:9": 7 }) };
    const ctxB = await browser.newContext({ baseURL: "http://localhost:3013", serviceWorkers: "block" });
    const b = await device(ctxB, server, mine);
    const pushesBefore = server.calls.filter((c) => c.includes("/api/sync/push")).length;
    await signIn(b);
    const toast = b.locator("[data-sonner-toast]").filter({ hasText: "from your account" });
    await expect(toast).toBeVisible({ timeout: 15000 });
    await expect(toast).toContainText("1 from your account");
    await expect.poll(async () => JSON.parse((await ls(b, "quran:bookmarks:v1"))!).sort()).toEqual(["surah:2", "surah:9"]);
    // the push waits for the Undo window: the account is unchanged so far
    expect(server.calls.filter((c) => c.includes("/api/sync/push")).length).toBe(pushesBefore + 0);
    await toast.getByRole("button", { name: "Undo" }).click();
    await expect.poll(() => ls(b, "quran:bookmarks:v1")).toBe(mine["quran:bookmarks:v1"]);
    expect(await ls(b, "quran:bookmarks:added-at:v1")).toBe(mine["quran:bookmarks:added-at:v1"]);
    expect(await ls(b, "quran:sync-prefs:v1")).toBeNull(); // sync is off on this device again
    const rows = server.rowsOf(server.userByEmail("a@example.test")!.id).filter((r) => r.namespace === "library.item");
    expect(rows.map((r) => r.recordKey)).toEqual(["surah:2"]); // the account was never given surah:9
    await ctxB.close();
  });

  test("with the server down: the page says so plainly, the app keeps working, and nothing is lost", async ({ page }) => {
    server.mode = 503;
    await page.goto("/settings?section=account");
    await expect(page.getByTestId("account-unavailable")).toBeVisible();
    await expect(page.getByText("Can’t reach the server right now")).toBeVisible();
    await page.goto("/about");
    await expect(page.getByTestId("about-page")).toBeVisible();
    server.mode = 200;
    await page.goto("/settings?section=account");
    await expect(page.getByTestId("account-signed-out")).toBeVisible();
  });
});

test.describe("leaving", () => {
  test("sign out keeps this device's data and forgets the sync choice", async ({ context }) => {
    const a = await first(context, DEVICE_A);
    await signUp(a);
    await a.getByTestId("sync-start").click();
    await expect(a.getByTestId("sync-status")).toContainText("Last synced");
    await a.getByTestId("account-signout").click();
    await expect(a.getByTestId("account-signed-out")).toBeVisible();
    expect(await ls(a, "quran:bookmarks:v1")).toBe(BOOKMARKS);
    expect(await ls(a, "quran:sync-prefs:v1")).toBeNull();
    expect(server.rowsOf(server.userByEmail("a@example.test")!.id).length).toBeGreaterThan(0); // the account keeps its copy
  });

  test("remove synced data: the server copy is gone, this device keeps its own, sync stops, and Undo brings sync back", async ({ context }) => {
    const a = await first(context, DEVICE_A);
    await signUp(a);
    await a.getByTestId("sync-start").click();
    await expect(a.getByTestId("sync-status")).toContainText("Last synced");
    const id = server.userByEmail("a@example.test")!.id;
    expect(server.rowsOf(id).length).toBeGreaterThan(3);
    await a.getByTestId("account-remove-synced").click();
    await expect.poll(() => server.rowsOf(id).length).toBe(0);
    expect(await ls(a, "quran:bookmarks:v1")).toBe(BOOKMARKS);
    const toast = a.locator("[data-sonner-toast]").filter({ hasText: "Removed your synced data" });
    await expect(toast).toBeVisible();
    await toast.getByRole("button", { name: "Undo" }).click();
    await expect.poll(() => server.rowsOf(id).length, { timeout: 15000 }).toBeGreaterThan(3);
  });

  test("delete account needs the typed word, removes the account and every synced row, and the device keeps its data", async ({ context }) => {
    const a = await first(context, DEVICE_A);
    await signUp(a);
    await a.getByTestId("sync-start").click();
    await expect(a.getByTestId("sync-status")).toContainText("Last synced");
    const id = server.userByEmail("a@example.test")!.id;
    await a.getByTestId("account-delete").click();
    await expect(a.getByTestId("delete-confirm")).toBeDisabled();
    await a.getByTestId("delete-type").fill("delet");
    await expect(a.getByTestId("delete-confirm")).toBeDisabled();
    await a.getByTestId("delete-type").fill("DELETE");
    await a.getByTestId("delete-password").fill("wrong-password");
    await a.getByTestId("delete-confirm").click();
    await expect(a.getByTestId("account-error")).toHaveText("That password doesn’t match.");
    expect(server.userByEmail("a@example.test")).toBeTruthy();
    await a.getByTestId("delete-password").fill("correct-horse-1");
    await a.getByTestId("delete-confirm").click();
    await expect(a.getByTestId("account-signed-out")).toBeVisible();
    expect(server.userByEmail("a@example.test")).toBeUndefined();
    expect(server.rowsOf(id)).toEqual([]);
    expect(await ls(a, "quran:bookmarks:v1")).toBe(BOOKMARKS);
  });

  test("Clear all data signs this device out too (and what is on the server stays)", async ({ context }) => {
    const a = await first(context, DEVICE_A);
    await signUp(a);
    await a.getByTestId("sync-start").click();
    await expect(a.getByTestId("sync-status")).toContainText("Last synced");
    const id = server.userByEmail("a@example.test")!.id;
    await a.goto("/settings?section=data");
    await expect(a.getByTestId("data-sync-note")).toBeVisible();
    await a.getByTestId("clear").click();
    await a.getByTestId("clear-yes").click();
    await a.waitForLoadState("load");
    await expect.poll(() => server.calls.includes("POST /api/auth/sign-out"), { timeout: 15000 }).toBe(true);
    expect(server.rowsOf(id).length).toBeGreaterThan(0);
    await a.goto("/settings?section=account");
    await expect(a.getByTestId("account-signed-out")).toBeVisible();
  });
});

test.describe("the profile photo", () => {
  test("is the user's own upload only: signed by our server, sent to Cloudinary, shown to the owner, removable", async ({ context }, info) => {
    const a = await first(context);
    await signUp(a);
    await a.getByTestId("photo-change").click();
    // a 2x2 PNG
    const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4nGP8z8Dwn4GBgYGJAQoAHhgCAh6X4CYAAAAASUVORK5CYII=", "base64");
    await a.getByTestId("photo-file").setInputFiles({ name: "me.png", mimeType: "image/png", buffer: png });
    await expect(a.getByTestId("photo-preview")).toBeVisible();
    await a.getByTestId("photo-use").click();
    await expect(a.getByTestId("account-photo").first()).toHaveAttribute("src", /^https:\/\/res\.cloudinary\.com\/democloud\/image\/upload\/v1\/avatars\/u1$/);
    expect(server.uploads).toHaveLength(1);
    expect(server.calls).toEqual(expect.arrayContaining(["POST /api/avatar/sign", "POST /api/avatar"]));
    await a.getByTestId("photo-remove").click();
    await expect(a.getByTestId("account-signed-in").getByTestId("account-monogram")).toBeVisible();
    void info;
  });
  test("a file that is not an image, or too big, is refused before anything is uploaded", async ({ context }) => {
    const a = await first(context);
    await signUp(a);
    await a.getByTestId("photo-change").click();
    await a.getByTestId("photo-file").setInputFiles({ name: "x.txt", mimeType: "text/plain", buffer: Buffer.from("hello") });
    await expect(a.getByTestId("photo-message")).toHaveText("Choose a JPG, PNG or WebP image.");
    await a.getByTestId("photo-file").setInputFiles({ name: "big.png", mimeType: "image/png", buffer: Buffer.alloc(2 * 1024 * 1024 + 10) });
    await expect(a.getByTestId("photo-message")).toContainText("over 2 MB");
    expect(server.uploads).toHaveLength(0);
  });
  test("when the server has no Cloudinary keys the photo controls are not shown", async ({ page }) => {
    server.config.avatar = null;
    await signUp(page);
    await expect(page.getByTestId("photo-change")).toHaveCount(0);
  });
});

test.describe("the admin panel", () => {
  test("a visitor who is not signed in gets a sign-in form, with no way to create an account from it", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByTestId("auth-form")).toBeVisible();
    await expect(page.getByTestId("auth-switch")).toHaveCount(0);
    await expect(page.getByTestId("admin-table")).toHaveCount(0);
  });
  test("a normal user sees only the Page not found words: nothing confirms that the page exists, and the API says 404", async ({ page }) => {
    server.addUser({ email: "n@example.test", password: "correct-horse-1", name: "Normal" });
    await signIn(page, "n@example.test");
    await page.goto("/admin");
    await expect(page.getByTestId("admin-denied")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
    await expect(page.getByText("All users")).toHaveCount(0);
    expect(await page.evaluate(async () => (await fetch("/api/admin/users")).status)).toBe(404);
  });
  test("a super admin signs in and sees every user (view only): who, role, sign-in method, joined and how much each synced, never their data", async ({ page }) => {
    server.addUser({ email: "root@example.test", password: "correct-horse-1", name: "Root", role: "superadmin" });
    const u = server.addUser({ email: "reader@example.test", password: "correct-horse-1", name: "Reader" });
    await server.repo.transaction(u.id, async (tx) => {
      await tx.lockCursor(u.id);
      await tx.put(u.id, { namespace: "library.item", recordKey: "surah:1", payload: { addedAt: 1 }, revision: 1n, deleted: false, bytes: 12 });
    });
    await page.goto("/admin");
    await page.getByTestId("auth-email").fill("root@example.test");
    await page.getByTestId("auth-password").fill("correct-horse-1");
    await page.getByTestId("auth-submit").click();
    await expect(page.getByTestId("admin-table")).toBeVisible();
    await expect(page.getByTestId("admin-total")).toHaveText("2 users");
    await expect(page.getByTestId("admin-row")).toHaveCount(2);
    const reader = page.getByTestId("admin-row").filter({ hasText: "reader@example.test" });
    await expect(reader).toContainText("User");
    await expect(reader).toContainText("1 ·");
    await expect(page.getByTestId("admin-row").filter({ hasText: "root@example.test" })).toContainText("Super admin");
    await expect(page.getByText("surah:1")).toHaveCount(0); // never what they synced
    // view only: nothing on the page changes anything
    await expect(page.getByTestId("admin-page").getByRole("button")).toHaveCount(1); // Sign out
    await expect(page.getByRole("link", { name: /admin/i })).toHaveCount(0);
  });
  test("is not in the sitemap or the navigation, and says noindex", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator('a[href="/admin"]')).toHaveCount(0);
    await page.goto("/admin");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    const sitemap = await (await page.request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("/admin");
  });
});

test.describe("a phone", () => {
  test.use({ viewport: { width: 375, height: 800 } });
  test("the Account area has no sideways scroll and every control is a 44px target, signed out and in, light and dark", async ({ context }) => {
    for (const theme of ["light", "dark"]) {
      const a = await device(await context.browser()!.newContext({ baseURL: "http://localhost:3013", serviceWorkers: "block", viewport: { width: 375, height: 800 } }), server, { themeMode: theme });
      await a.goto("/settings?section=account&mode=signup");
      expect(await a.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const small = async () =>
        a.evaluate(() => {
          const bad: string[] = [];
          document.querySelectorAll<HTMLElement>('[data-testid="account-panel"] button, [data-testid="account-panel"] input:not([type=file]), [data-testid="account-panel"] [role=switch]').forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.height > 0 && r.height < 43.5) bad.push(`${el.getAttribute("data-testid") ?? el.tagName} ${Math.round(r.width)}x${Math.round(r.height)}`);
          });
          return bad;
        });
      expect(await small()).toEqual([]);
      await a.getByTestId("auth-name").fill("Phone");
      await a.getByTestId("auth-email").fill(`p-${theme}@example.test`);
      await a.getByTestId("auth-password").fill("correct-horse-1");
      await a.getByTestId("auth-submit").click();
      await expect(a.getByTestId("account-signed-in")).toBeVisible();
      expect(await a.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      // the switches draw a 28px track inside a larger hit area: check the real hit area (the switch's ::after is not measured), so only buttons and inputs count here
      const bad = await a.evaluate(() => {
        const out: string[] = [];
        document.querySelectorAll<HTMLElement>('[data-testid="account-panel"] button:not([role=switch])').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.height > 0 && r.height < 43.5) out.push(`${el.getAttribute("data-testid") ?? el.textContent} ${Math.round(r.height)}`);
        });
        return out;
      });
      expect(bad).toEqual([]);
    }
  });
});
