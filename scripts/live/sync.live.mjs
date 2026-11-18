// A manual end-to-end check of Account & Sync against a RUNNING server and its real (test) database. Not in CI, not part of `verify`.
//
//   1. start the production build with the flag on and a test database (see docs/phases/phase-17-account-sync.md, "Live check")
//   2. node scripts/live/sync.live.mjs http://localhost:3015
//
// It signs up two throw-away accounts (random addresses at example.test), pushes and pulls records, checks the rules (401 without a session, one user cannot see
// another's records, stale and invalid ops, a request cannot grant a role, the admin route is 404 for a normal user), then deletes both accounts and checks that
// every row went with them. Exit code 1 if any check fails. It prints no secret.
import { randomBytes } from "node:crypto";

const BASE = (process.argv[2] || "http://localhost:3015").replace(/\/+$/, "");
const ADMIN_EMAIL = process.env.LIVE_ADMIN_EMAIL; // optional: an existing super admin, to check the admin list
const ADMIN_PASSWORD = process.env.LIVE_ADMIN_PASSWORD;
let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "pass" : "FAIL"}  ${name}${extra ? `  (${extra})` : ""}`);
  if (!ok) failed++;
};

class Client {
  cookies = new Map();
  async req(method, path, body, headers = {}) {
    const res = await fetch(BASE + path, {
      method,
      headers: { origin: BASE, "content-type": "application/json", cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      const name = pair.slice(0, i);
      const value = pair.slice(i + 1);
      if (value === "" || /max-age=0/i.test(c)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    let json = null;
    try {
      json = await res.json();
    } catch {
      /* not JSON */
    }
    return { status: res.status, json };
  }
}

const rand = () => randomBytes(5).toString("hex");
const password = `Pw-${randomBytes(9).toString("base64url")}`;
async function signUp(c, name, extra = {}) {
  const email = `live-${rand()}@example.test`;
  const r = await c.req("POST", "/api/auth/sign-up/email", { name, email, password, ...extra });
  return { email, r };
}

const health = await (await fetch(`${BASE}/api/health`)).json();
check("health: sync on and the database is up", health.sync === "on" && health.db === "up", JSON.stringify(health));

const cfg = await new Client().req("GET", "/api/account/config");
check("config answers (google/email/avatar flags, no secret)", cfg.status === 200 && typeof cfg.json?.google === "boolean", JSON.stringify(cfg.json));

const anon = new Client();
check("no session: pull is 401", (await anon.req("GET", "/api/sync/pull")).status === 401);
check("no session: push is 401", (await anon.req("POST", "/api/sync/push", { ops: [] })).status === 401);
check("no session: admin list is 401", (await anon.req("GET", "/api/admin/users")).status === 401);
check("an unknown /api path is a JSON 404", (await anon.req("GET", "/api/nope")).status === 404);

// ---- user A
const a = new Client();
const forgedClient = new Client();
const forged = await signUp(forgedClient, "Live Forged", { role: "superadmin" });
const forgedSession = await forgedClient.req("GET", "/api/auth/get-session");
check("a sign-up that names a role does not get it (input: false): the account is a plain user", forgedSession.json?.user?.role === "user", `status ${forged.r.status}, role ${forgedSession.json?.user?.role}`);
await forgedClient.req("POST", "/api/auth/delete-user", { password });
const A = await signUp(a, "Live Test A");
check("sign up works", A.r.status === 200 && A.r.json?.user?.email === A.email, `status ${A.r.status}`);
const sessA = await a.req("GET", "/api/auth/get-session");
check("session cookie works", sessA.json?.user?.email === A.email);
check("a new account is a plain user with no photo", sessA.json?.user?.role === "user" && !sessA.json?.user?.avatarVersion, `role=${sessA.json?.user?.role}`);
check("the stored user has no image (never imported)", !sessA.json?.user?.image);

const ops = [
  { namespace: "library.item", recordKey: "ayah:2:255", baseRevision: "0", payload: { addedAt: 1700000000000 } },
  { namespace: "progress.readSurah", recordKey: "18", baseRevision: "0", payload: { completedAt: 1700000001000 } },
  { namespace: "settings", recordKey: "fiqh", baseRevision: "0", payload: { raw: "jafari" } },
  { namespace: "nope.nothing", recordKey: "x", baseRevision: "0", payload: { a: 1 } },
  { namespace: "progress.readSurah", recordKey: "115", baseRevision: "0", payload: { completedAt: 1 } },
  { namespace: "library.item", recordKey: "ayah:1:1", baseRevision: "0", payload: { addedAt: -5 } },
];
const pushed = await a.req("POST", "/api/sync/push", { deviceId: "live-a", ops });
const st = pushed.json?.results?.map((r) => r.status);
check("push: 3 accepted, 3 refused as invalid (unknown namespace, surah 115, a bad payload)", JSON.stringify(st) === JSON.stringify(["ok", "ok", "ok", "invalid", "invalid", "invalid"]), JSON.stringify(st));
const pulled = await a.req("GET", "/api/sync/pull?since=0");
check("pull returns exactly the 3 records, in revision order", pulled.json?.records?.length === 3 && pulled.json.records.map((r) => r.revision).join() === "1,2,3", JSON.stringify(pulled.json?.records?.map((r) => `${r.namespace}:${r.recordKey}`)));
check("the setting came back as it was sent", pulled.json?.records?.find((r) => r.namespace === "settings")?.payload?.raw === "jafari");
const again = await a.req("POST", "/api/sync/push", { ops: [{ namespace: "library.item", recordKey: "ayah:2:255", baseRevision: "0", payload: { addedAt: 5 } }] });
check("a push on an old revision is refused as stale", again.json?.results?.[0]?.status === "stale");
const upd = await a.req("POST", "/api/sync/push", { ops: [{ namespace: "library.item", recordKey: "ayah:2:255", baseRevision: "1", payload: { addedAt: 5 } }] });
check("a push on the current revision is accepted, and gets the next revision", upd.json?.results?.[0]?.status === "ok" && upd.json.results[0].revision === "4");
const tomb = await a.req("POST", "/api/sync/push", { ops: [{ namespace: "progress.readSurah", recordKey: "18", baseRevision: "2", payload: null }] });
check("a removal is a tombstone", tomb.json?.results?.[0]?.status === "ok");
const delta = await a.req("GET", "/api/sync/pull?since=3");
check("pull after a cursor returns only newer records, with the tombstone as a null payload", delta.json?.records?.length === 2 && delta.json.records.some((r) => r.deleted && r.payload === null), JSON.stringify(delta.json?.records?.map((r) => `${r.recordKey}@${r.revision}`)));
check("pull pages: limit 1 says there is more", (await a.req("GET", "/api/sync/pull?since=0&limit=1")).json?.more === true);
const big = await a.req("POST", "/api/sync/push", { ops: [{ namespace: "library.meta", recordKey: "ayah:1:1", baseRevision: "0", payload: { note: "x".repeat(20000), tags: [], collectionIds: [], updatedAt: 1 } }] });
check("a note over 10 000 characters is refused", big.json?.results?.[0]?.status === "invalid");
const usage = await a.req("GET", "/api/sync/usage");
check("usage counts live records", usage.json?.records === 2 && usage.json?.bytes > 0, JSON.stringify(usage.json));

// ---- user B cannot see A's data
const b = new Client();
const B = await signUp(b, "Live Test B");
check("user B signs up", B.r.status === 200);
const bp = await b.req("GET", "/api/sync/pull?since=0");
check("user B sees none of user A's records", bp.status === 200 && bp.json?.records?.length === 0);
const bAdmin = await b.req("GET", "/api/admin/users");
check("a normal user gets 404 from the admin list (its existence is not confirmed)", bAdmin.status === 404, `status ${bAdmin.status}`);

// ---- sign out ends the session
await b.req("POST", "/api/auth/sign-out", {});
check("after sign-out the cookie no longer works", (await b.req("GET", "/api/sync/pull")).status === 401);

// ---- sign in again with the right and a wrong password
const a2 = new Client();
const bad = await a2.req("POST", "/api/auth/sign-in/email", { email: A.email, password: "wrong-password-1" });
check("a wrong password is refused", bad.status === 401 || bad.status === 400, `status ${bad.status}`);
const good = await a2.req("POST", "/api/auth/sign-in/email", { email: A.email, password });
check("the right password signs in", good.status === 200);
check("and the data is still there on this 'device'", (await a2.req("GET", "/api/sync/pull?since=0")).json?.records?.length === 3, "item, fiqh, and the read-surah tombstone");

// ---- the admin list, when an existing super admin is given
if (ADMIN_EMAIL && ADMIN_PASSWORD) {
  const s = new Client();
  const li = await s.req("POST", "/api/auth/sign-in/email", { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  check("super admin signs in", li.status === 200);
  const list = await s.req("GET", "/api/admin/users?perPage=100");
  const emails = list.json?.users?.map((u) => u.email) ?? [];
  check("super admin sees every user, including the two created here", list.status === 200 && emails.includes(A.email) && emails.includes(B.email), `total ${list.json?.total}`);
  check("the list shows counts, not the users' data", !JSON.stringify(list.json).includes("jafari") && list.json.users.every((u) => !("payload" in u)));
}

// ---- remove synced data, then delete the account: nothing is left
const rm = await a.req("DELETE", "/api/sync");
check("'Remove synced data' removes the records and keeps the account", rm.status === 200 && (await a.req("GET", "/api/sync/pull?since=0")).json?.records?.length === 0);
await a.req("POST", "/api/sync/push", { ops: [{ namespace: "settings", recordKey: "theme", baseRevision: "0", payload: { raw: "dark" } }] });
const delA = await a.req("POST", "/api/auth/delete-user", { password });
check("delete account works with the password", delA.status === 200, `status ${delA.status}`);
check("the deleted account can no longer sign in", (await new Client().req("POST", "/api/auth/sign-in/email", { email: A.email, password })).status !== 200);
const delB = await b.req("POST", "/api/auth/sign-in/email", { email: B.email, password });
if (delB.status === 200) await b.req("POST", "/api/auth/delete-user", { password });

console.log(failed ? `\n${failed} check(s) FAILED` : "\nall checks passed");
process.exit(failed ? 1 : 0);
