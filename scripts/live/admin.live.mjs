// A manual check of the admin panel and the super admin role against a RUNNING server and its real (test) database. Not in CI.
//
//   DATABASE_CA_FILE=<ca.pem> node scripts/live/admin.live.mjs http://localhost:3015
//
// It signs up a throw-away "admin" and two throw-away users (example.test), promotes the admin with scripts/make-super-admin.mjs (the only way to grant the role),
// then, in a real browser, signs in at /admin and checks that the table lists all three, that a normal user sees only "Page not found", that revoking the role takes
// the access away at once, and that it works through the API too. All three accounts are deleted at the end. Exit code 1 if a check fails. Prints no secret.
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { chromium } from "@playwright/test";

const BASE = (process.argv[2] || "http://localhost:3015").replace(/\/+$/, "");
const id = randomBytes(4).toString("hex");
const PASSWORD = `Pw-${randomBytes(9).toString("base64url")}`;
const ADMIN = `live-admin-${id}@example.test`;
const USER1 = `live-user1-${id}@example.test`;
const USER2 = `live-user2-${id}@example.test`;
let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "pass" : "FAIL"}  ${name}${extra ? `  (${extra})` : ""}`);
  if (!ok) failed++;
};

async function api(method, path, body, cookie = "") {
  const res = await fetch(BASE + path, { method, headers: { origin: BASE, "content-type": "application/json", cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  const setCookie = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  let json = null;
  try {
    json = await res.json();
  } catch {
    /* none */
  }
  return { status: res.status, json, cookie: setCookie };
}
const role = (email, flag) => spawnSync(process.execPath, ["scripts/make-super-admin.mjs", email, ...(flag ? [flag] : [])], { encoding: "utf8" });

const sessions = {};
for (const [email, name] of [[ADMIN, "Live Admin"], [USER1, "Live User One"], [USER2, "Live User Two"]]) {
  const r = await api("POST", "/api/auth/sign-up/email", { name, email, password: PASSWORD });
  sessions[email] = r.cookie;
  check(`signed up ${name}`, r.status === 200);
}
// give user one some synced data, so the list has a usage column to show
await api("POST", "/api/sync/push", { ops: [{ namespace: "settings", recordKey: "theme", baseRevision: "0", payload: { raw: "dark" } }, { namespace: "library.item", recordKey: "surah:18", baseRevision: "0", payload: { addedAt: 5 } }] }, sessions[USER1]);

check("before promotion the admin account is refused with 404", (await api("GET", "/api/admin/users", undefined, sessions[ADMIN])).status === 404);
const promoted = role(ADMIN);
check("make-super-admin promotes the account", promoted.status === 0 && /superadmin/.test(promoted.stdout), (promoted.stdout + promoted.stderr).trim().slice(0, 100));
check("make-super-admin refuses an address with no account", role(`nobody-${id}@example.test`).status === 1);

const listed = await api("GET", "/api/admin/users?perPage=100", undefined, sessions[ADMIN]);
const emails = listed.json?.users?.map((u) => u.email) ?? [];
check("the API lists every user to the super admin", listed.status === 200 && [ADMIN, USER1, USER2].every((e) => emails.includes(e)), `total ${listed.json?.total}`);
const u1 = listed.json?.users?.find((u) => u.email === USER1);
check("the list shows usage (records and bytes), the role and the sign-in method, and nothing the user synced", u1?.syncRecords === 2 && u1.syncBytes > 0 && u1.role === "user" && u1.providers.includes("credential") && !JSON.stringify(listed.json).includes("surah:18") && !("payload" in u1), JSON.stringify(u1));
check("the list is paged", (await api("GET", "/api/admin/users?perPage=1&page=1", undefined, sessions[ADMIN])).json?.users?.length === 1);
check("a normal user still gets 404", (await api("GET", "/api/admin/users", undefined, sessions[USER1])).status === 404);

// ---- in a real browser
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ baseURL: BASE });
  const page = await ctx.newPage();
  await page.goto("/admin");
  check("a visitor who is signed out sees a sign-in form", await page.getByTestId("auth-form").waitFor({ timeout: 10000 }).then(() => true, () => false));
  await page.getByTestId("auth-email").fill(ADMIN);
  await page.getByTestId("auth-password").fill(PASSWORD);
  await page.getByTestId("auth-submit").click();
  await page.getByTestId("admin-table").waitFor({ timeout: 15000 });
  const rows = await page.getByTestId("admin-row").allInnerTexts();
  check("the super admin signs in at /admin and the table lists all three accounts", [ADMIN, USER1, USER2].every((e) => rows.some((r) => r.includes(e))), `${rows.length} rows`);
  check("the table says who is a super admin", rows.some((r) => r.includes(ADMIN) && r.includes("Super admin")));
  check("view only: the page's only button is Sign out", (await page.getByTestId("admin-page").getByRole("button").count()) === 1);
  // revoke: access ends at once
  role(ADMIN, "--revoke");
  await page.reload();
  check("after the role is revoked the page shows only Page not found", await page.getByTestId("admin-denied").waitFor({ timeout: 10000 }).then(() => true, () => false));
  await ctx.close();
  const ctx2 = await browser.newContext({ baseURL: BASE });
  const p2 = await ctx2.newPage();
  await p2.goto("/admin");
  await p2.getByTestId("auth-email").fill(USER2);
  await p2.getByTestId("auth-password").fill(PASSWORD);
  await p2.getByTestId("auth-submit").click();
  check("a normal user who signs in at /admin sees only Page not found", await p2.getByTestId("admin-denied").waitFor({ timeout: 10000 }).then(() => true, () => false));
  check("...and no heading that confirms the page exists", (await p2.getByText("All users").count()) === 0);
  await ctx2.close();
} finally {
  await browser.close();
}

// ---- clean up: delete the three accounts, and check nothing is left
for (const e of [ADMIN, USER1, USER2]) {
  const s = await api("POST", "/api/auth/sign-in/email", { email: e, password: PASSWORD });
  await api("POST", "/api/auth/delete-user", { password: PASSWORD }, s.cookie);
}
const after = await api("POST", "/api/auth/sign-in/email", { email: USER1, password: PASSWORD });
check("the accounts are deleted", after.status !== 200);
console.log(failed ? `\n${failed} check(s) FAILED` : "\nall checks passed");
process.exit(failed ? 1 : 0);
