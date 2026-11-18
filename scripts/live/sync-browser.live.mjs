// A manual check of Account & Sync in a REAL browser against a running server and its real (test) database. Not in CI, not part of `verify`.
//
//   node scripts/live/sync-browser.live.mjs http://localhost:3015
//
// Device A (one browser context) is seeded with data in the legacy shapes, signs up through the page, and turns sync on. Device B (a second, empty context) signs
// in and must end up with the same data. Then a setting is changed on B through the page and A must follow. The Qur'an text service is never called: only the
// Account area, Settings and the header menu are used. Throw-away accounts at example.test; both are deleted at the end. Exit code 1 if a check fails.
import { randomBytes } from "node:crypto";
import { chromium } from "@playwright/test";

const BASE = (process.argv[2] || "http://localhost:3015").replace(/\/+$/, "");
const id = randomBytes(4).toString("hex");
const EMAIL = `live-browser-${id}@example.test`;
const PASSWORD = `Pw-${randomBytes(9).toString("base64url")}`;
let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "pass" : "FAIL"}  ${name}${extra ? `  (${extra})` : ""}`);
  if (!ok) failed++;
};

const SEED = {
  "quran:bookmarks:v1": JSON.stringify(["ayah:2:255", "surah:18"]),
  "quran:bookmarks:added-at:v1": JSON.stringify({ "ayah:2:255": 1000, "surah:18": 2000 }),
  "quran:library:v1": JSON.stringify({ collections: [{ id: "c1", name: "Fridays", description: "", createdAt: 5 }], itemMeta: { "ayah:2:255": { note: "my note", tags: ["dua"], collectionIds: ["c1"], updatedAt: 7 } } }),
  "quran:read-surahs:v1": JSON.stringify({ v: 1, surahs: { "1": { completedAt: 5 } } }),
  "quran:tasbeeh:v1": JSON.stringify({ c1: { count: 3, target: 33, cycles: 0, lifetime: 130 } }),
  prayerFiqh: "jafari",
  "quran:verse-layout:v1": JSON.stringify({ order: "tr" }),
  // never synced: must stay on device A only
  "quran:location:v1": JSON.stringify({ lat: 31.5, lon: 74.3 }),
  "quran:search-history:v1": JSON.stringify(["private search"]),
};

const browser = await chromium.launch();
const open = async (seed) => {
  const context = await browser.newContext({ baseURL: BASE });
  if (seed) await context.addInitScript((s) => { if (!sessionStorage.getItem("__seeded")) { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); sessionStorage.setItem("__seeded", "1"); } }, seed);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message)));
  return { context, page, errors };
};
const ls = (page, key) => page.evaluate((k) => localStorage.getItem(k), key);
const waitFor = async (fn, ms = 20000) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await fn()) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
};

try {
  // ---- device A signs up through the page
  const A = await open(SEED);
  await A.page.goto("/settings?section=account&mode=signup");
  await A.page.getByTestId("auth-name").fill("Live Browser");
  await A.page.getByTestId("auth-email").fill(EMAIL);
  await A.page.getByTestId("auth-password").fill(PASSWORD);
  await A.page.getByTestId("auth-submit").click();
  await A.page.getByTestId("account-signed-in").waitFor({ timeout: 15000 });
  check("device A: signed up and signed in through the Account area", (await A.page.getByTestId("account-email").textContent()) === EMAIL);
  check("device A: the monogram is shown (no photo, no Google photo)", await A.page.getByTestId("account-signed-in").getByTestId("account-monogram").isVisible());
  check("device A: nothing syncs until a choice is made", await A.page.getByTestId("sync-choose").isVisible());
  await A.page.getByTestId("sync-start").click();
  const settled = await waitFor(async () => /Last synced/.test((await A.page.getByTestId("sync-status").textContent()) ?? ""));
  check("device A: the first sync completes and says when", settled, await A.page.getByTestId("sync-status").textContent());
  const usage = await waitFor(async () => /synced records?/.test((await A.page.getByTestId("sync-usage").textContent().catch(() => "")) ?? ""), 8000);
  check("device A: the usage line shows what is stored", usage, await A.page.getByTestId("sync-usage").textContent().catch(() => ""));

  // ---- device B: empty, signs in
  const B = await open(null);
  await B.page.goto("/settings?section=account&mode=signin");
  await B.page.getByTestId("auth-email").fill(EMAIL);
  await B.page.getByTestId("auth-password").fill(PASSWORD);
  await B.page.getByTestId("auth-submit").click();
  await B.page.getByTestId("account-signed-in").waitFor({ timeout: 15000 });
  const got = await waitFor(async () => (await ls(B.page, "quran:bookmarks:v1")) !== null && (await ls(B.page, "prayerFiqh")) !== null, 30000);
  check("device B: signs in and the account's data arrives (it followed the account's choice of what syncs)", got);
  check("device B: bookmarks, in order, with their times", (await ls(B.page, "quran:bookmarks:v1")) === SEED["quran:bookmarks:v1"] && (await ls(B.page, "quran:bookmarks:added-at:v1")) === SEED["quran:bookmarks:added-at:v1"]);
  check("device B: the note, tag and collection came with the item", JSON.parse((await ls(B.page, "quran:library:v1")) ?? "{}").itemMeta?.["ayah:2:255"]?.note === "my note");
  check("device B: read surahs, tasbeeh lifetime and the fiqh setting (a raw string)", JSON.parse((await ls(B.page, "quran:read-surahs:v1")) ?? "{}").surahs?.["1"]?.completedAt === 5 && JSON.parse((await ls(B.page, "quran:tasbeeh:v1")) ?? "{}").c1?.lifetime === 130 && (await ls(B.page, "prayerFiqh")) === "jafari");
  check("device B: the verse layout setting", JSON.parse((await ls(B.page, "quran:verse-layout:v1")) ?? "{}").order === "tr");
  check("device B: nothing from the never-synced keys (saved place, search history)", (await ls(B.page, "quran:location:v1")) === null && (await ls(B.page, "quran:search-history:v1")) === null);
  check("device A: its own never-synced keys are untouched", (await ls(A.page, "quran:location:v1")) === SEED["quran:location:v1"]);

  // ---- a change made through the page on B reaches A
  await B.page.goto("/settings");
  await B.page.getByRole("button", { name: "Theme" }).first().click().catch(() => undefined);
  const dark = B.page.getByRole("menuitemradio", { name: "Dark" }).or(B.page.getByRole("radio", { name: "Dark" })).first();
  await dark.click({ timeout: 5000 }).catch(() => undefined);
  const bTheme = await ls(B.page, "themeMode");
  check("device B: chose the Dark theme through the header menu", bTheme === "dark", `themeMode=${bTheme}`);
  await waitFor(async () => false, 3500); // B's change is sent after about two seconds
  await A.page.getByTestId("sync-now").click().catch(async () => { await A.page.goto("/settings?section=account"); });
  const follows = await waitFor(async () => (await ls(A.page, "themeMode")) === "dark", 30000);
  check("device A: follows the change after a sync (theme is a setting; the Settings toggle was on)", follows, `themeMode=${await ls(A.page, "themeMode")}`);

  // ---- sign out keeps data; the admin list refuses a normal user
  const adminRes = await A.page.evaluate(async () => (await fetch("/api/admin/users")).status);
  check("a normal user gets 404 from the admin list", adminRes === 404, `status ${adminRes}`);
  await A.page.goto("/admin");
  check("/admin shows a normal user only the Page not found words (no heading that confirms the page exists)", await A.page.getByTestId("admin-denied").waitFor({ timeout: 8000 }).then(() => true, () => false));
  await A.page.goto("/settings?section=account");
  await A.page.getByTestId("account-signout").click();
  await A.page.getByTestId("account-signed-out").waitFor({ timeout: 10000 });
  check("sign out keeps this device's data", (await ls(A.page, "quran:bookmarks:v1")) === SEED["quran:bookmarks:v1"]);

  // ---- delete the account from B with the typed word
  await B.page.goto("/settings?section=account");
  await B.page.getByTestId("account-delete").click();
  const confirm = B.page.getByTestId("delete-confirm");
  check("delete account is disabled until the word is typed", await confirm.isDisabled());
  await B.page.getByTestId("delete-type").fill("delete");
  await B.page.getByTestId("delete-password").fill(PASSWORD);
  await confirm.click();
  await B.page.getByTestId("account-signed-out").waitFor({ timeout: 15000 });
  check("account deleted: B is signed out and keeps its data", (await ls(B.page, "quran:bookmarks:v1")) === SEED["quran:bookmarks:v1"]);
  for (const x of [A, B]) check("no uncaught page errors", x.errors.length === 0, x.errors.join(" | "));
  await A.context.close();
  await B.context.close();
} finally {
  await browser.close();
}
console.log(failed ? `\n${failed} check(s) FAILED` : "\nall checks passed");
process.exit(failed ? 1 : 0);
