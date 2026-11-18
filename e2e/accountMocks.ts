// Phase 17: a fake account server for the browser tests. It answers /api/account, /api/auth, /api/sync, /api/avatar and /api/admin with the REAL sync rules
// (server/utils/syncHandlers.ts over the in-memory repository) and a small in-memory user table, so two browser contexts can share one "server" and sync with
// each other with no database, no Google, no Cloudinary and no email. Every unmocked request to a real service still fails the test (`forbidRealApis`).
import type { BrowserContext, Route } from "@playwright/test";
import { pull, push } from "../server/utils/syncHandlers";
import { memoryRepo, type MemoryRepo } from "../tests/fakes/syncRepo";

export interface FakeUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "user" | "superadmin";
  emailVerified: boolean;
  createdAt: string;
  avatarPublicId: string | null;
  avatarVersion: number | null;
}

export class AccountServer {
  repo: MemoryRepo = memoryRepo();
  users = new Map<string, FakeUser>();
  sessions = new Map<string, string>();
  /** every request, "METHOD /path" */
  calls: string[] = [];
  /** 200 = fine; any other number answers every account request with it (503 = "can't reach the server") */
  mode = 200;
  config = { google: true, email: { verification: false, reset: false }, avatar: { cloudName: "democloud" } as { cloudName: string } | null };
  private n = 0;
  uploads: string[] = [];

  addUser(u: Partial<FakeUser> & { email: string; password: string }): FakeUser {
    const id = `u${++this.n}`;
    const user: FakeUser = { id, name: "Test User", role: "user", emailVerified: true, createdAt: new Date(1_790_000_000_000 + this.n * 1000).toISOString(), avatarPublicId: null, avatarVersion: null, ...u };
    this.users.set(user.email.toLowerCase(), user);
    return user;
  }
  userByEmail = (e: string) => this.users.get(e.toLowerCase());
  rowsOf = (userId: string) => [...this.repo.rows.entries()].filter(([k]) => k.startsWith(`${userId}\u0000`)).map(([, r]) => r);
}

const json = (route: Route, status: number, body: unknown, headers: Record<string, string> = {}) =>
  route.fulfill({ status, contentType: "application/json", headers: { "cache-control": "no-store", ...headers }, body: JSON.stringify(body) });

const publicUser = (u: FakeUser) => ({ id: u.id, name: u.name, email: u.email, emailVerified: u.emailVerified, role: u.role, image: null, avatarPublicId: u.avatarPublicId, avatarVersion: u.avatarVersion });

/** Installs the fake server on a browser context. Several contexts can share one `AccountServer` (their sessions are cookies, so each is its own "device"). */
export async function mockAccount(context: BrowserContext, server: AccountServer): Promise<void> {
  const sid = (route: Route): string | null => /(?:^|;\s*)sid=([^;]+)/.exec(route.request().headers().cookie ?? "")?.[1] ?? null;
  const me = (route: Route): FakeUser | null => {
    const s = sid(route);
    const id = s ? server.sessions.get(s) : undefined;
    return id ? ([...server.users.values()].find((u) => u.id === id) ?? null) : null;
  };
  const login = (route: Route, u: FakeUser, status = 200) => {
    const token = `s${Math.random().toString(36).slice(2)}`;
    server.sessions.set(token, u.id);
    return json(route, status, { user: publicUser(u) }, { "set-cookie": `sid=${token}; Path=/; HttpOnly; SameSite=Lax` });
  };

  await context.route(/\/api\/(account|auth|sync|avatar|admin)(\/|\?|$)/, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const method = req.method();
    server.calls.push(`${method} ${path}`);
    if (server.mode !== 200) return json(route, server.mode, { error: "unavailable" });
    const body = (): Record<string, unknown> => {
      try {
        return req.postDataJSON() ?? {};
      } catch {
        return {};
      }
    };

    if (path === "/api/account/config") return json(route, 200, server.config);

    if (path === "/api/auth/get-session") {
      const u = me(route);
      return json(route, 200, u ? { user: publicUser(u), session: { id: "s" } } : null);
    }
    if (path === "/api/auth/sign-up/email") {
      const b = body();
      if (server.userByEmail(String(b.email))) return json(route, 422, { message: "User already exists" });
      if (String(b.password).length < 8) return json(route, 400, { message: "Password too short" });
      return login(route, server.addUser({ name: String(b.name), email: String(b.email), password: String(b.password) }));
    }
    if (path === "/api/auth/sign-in/email") {
      const b = body();
      const u = server.userByEmail(String(b.email));
      if (!u || u.password !== b.password) return json(route, 401, { message: "Invalid email or password" });
      return login(route, u);
    }
    if (path === "/api/auth/sign-out") {
      const s = sid(route);
      if (s) server.sessions.delete(s);
      return json(route, 200, { success: true }, { "set-cookie": "sid=; Path=/; Max-Age=0" });
    }
    if (path === "/api/auth/sign-in/social") return json(route, 200, { url: "https://accounts.google.com/o/oauth2/v2/auth?client_id=test", redirect: true });
    if (path === "/api/auth/delete-user") {
      const u = me(route);
      if (!u) return json(route, 401, { message: "Unauthorized" });
      const b = body();
      if (u.password && b.password !== u.password) return json(route, 400, { message: "Invalid password" });
      await server.repo.removeAll(u.id);
      server.users.delete(u.email.toLowerCase());
      return json(route, 200, { success: true }, { "set-cookie": "sid=; Path=/; Max-Age=0" });
    }

    const u = me(route);
    if (path.startsWith("/api/admin/")) {
      if (!u) return json(route, 401, { error: "unauthorized" });
      if (u.role !== "superadmin") return json(route, 404, { error: "not_found" });
      const all = [...server.users.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return json(route, 200, {
        total: all.length,
        page: 1,
        perPage: 50,
        users: all.map((x) => ({ id: x.id, name: x.name, email: x.email, emailVerified: x.emailVerified, role: x.role, hasPhoto: Boolean(x.avatarPublicId), createdAt: x.createdAt, providers: ["credential"], sessions: 1, syncRecords: server.rowsOf(x.id).length, syncBytes: 0 })),
      });
    }
    if (!u) return json(route, 401, { error: "unauthorized" });

    if (path === "/api/sync/pull") return json(route, 200, await pull(server.repo, u.id, BigInt(url.searchParams.get("since") ?? "0"), Number(url.searchParams.get("limit") ?? 500)));
    if (path === "/api/sync/push") return json(route, 200, await push(server.repo, u.id, (body().ops as never) ?? []));
    if (path === "/api/sync/usage") {
      const x = await server.repo.usage(u.id);
      return json(route, 200, { records: x.records, bytes: x.bytes, limitBytes: 5 * 1024 * 1024, revision: x.revision.toString() });
    }
    if (path === "/api/sync" && method === "DELETE") return json(route, 200, { ok: true, ...(await server.repo.removeAll(u.id)) });

    if (path === "/api/avatar/sign") return server.config.avatar ? json(route, 200, { cloudName: "democloud", apiKey: "k", timestamp: 1, signature: "sig", fields: { public_id: `avatars/${u.id}`, timestamp: "1" } }) : json(route, 503, { error: "not_configured" });
    if (path === "/api/avatar" && method === "POST") {
      u.avatarPublicId = `avatars/${u.id}`;
      u.avatarVersion = (u.avatarVersion ?? 0) + 1;
      return json(route, 200, { ok: true, version: u.avatarVersion });
    }
    if (path === "/api/avatar" && method === "DELETE") {
      u.avatarPublicId = null;
      u.avatarVersion = null;
      return json(route, 200, { ok: true });
    }
    return json(route, 404, { error: "not_found" });
  });

  // Cloudinary: the upload and the picture, answered locally (a 1x1 PNG)
  await context.route(/https:\/\/api\.cloudinary\.com\/v1_1\/democloud\/image\/upload/, (route) => {
    server.uploads.push(route.request().url());
    return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ public_id: "avatars/x", version: 1 }) });
  });
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  await context.route(/https:\/\/res\.cloudinary\.com\/democloud\//, (route) => route.fulfill({ status: 200, contentType: "image/png", body: png }));
}
