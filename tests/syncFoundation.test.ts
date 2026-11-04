// Phase 17A: the sync feature flag, /api/health and the database client's settings. No test opens a database: health runs on fakes,
// and the Prisma client is never constructed here.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isSyncOn, syncEnabled } from "../app/lib/sync/flag";
import { healthReport } from "../server/utils/health";

const ROOT = path.resolve(__dirname, "..");
const read = (f: string) => fs.readFileSync(path.join(ROOT, f), "utf8");

describe("the sync flag", () => {
  it("is on only for an explicit 1 or true", () => {
    for (const on of ["1", "true", "TRUE", " true ", 1, true]) expect(isSyncOn(on), String(on)).toBe(true);
    for (const off of [undefined, null, "", "0", "false", "off", "yes", 0, false, 2, {}]) expect(isSyncOn(off), String(off)).toBe(false);
  });
  it("reads NUXT_PUBLIC_SYNC_ENABLED and is off when it is unset", () => {
    expect(syncEnabled({})).toBe(false);
    expect(syncEnabled({ NUXT_PUBLIC_SYNC_ENABLED: "1" })).toBe(true);
    expect(syncEnabled({ NUXT_PUBLIC_SYNC_ENABLED: "0" })).toBe(false);
  });
});

describe("/api/health", () => {
  const never = () => {
    throw new Error("the database was touched");
  };
  it("with sync off it reports off and never touches the database", async () => {
    expect(await healthReport({ enabled: false, configured: true, ping: never })).toEqual({ status: 200, body: { ok: true, sync: "off" } });
    expect(await healthReport({ enabled: false, configured: false, ping: never })).toEqual({ status: 200, body: { ok: true, sync: "off" } });
  });
  it("with sync on and no DATABASE_URL it says unconfigured without trying", async () => {
    expect(await healthReport({ enabled: true, configured: false, ping: never })).toEqual({ status: 503, body: { ok: false, sync: "on", db: "unconfigured" } });
  });
  it("up when the database answers, down when it fails, and down (not hanging) when it does not answer in time", async () => {
    expect(await healthReport({ enabled: true, configured: true, ping: async () => [{ "?column?": 1 }] })).toEqual({ status: 200, body: { ok: true, sync: "on", db: "up" } });
    expect(await healthReport({ enabled: true, configured: true, ping: async () => Promise.reject(new Error("password authentication failed for user x at host y")) })).toEqual({
      status: 503,
      body: { ok: false, sync: "on", db: "down" },
    });
    const t0 = Date.now();
    expect(await healthReport({ enabled: true, configured: true, ping: () => new Promise(() => {}), timeoutMs: 50 })).toEqual({ status: 503, body: { ok: false, sync: "on", db: "down" } });
    expect(Date.now() - t0).toBeLessThan(1000);
  });
  it("never puts the error text in the answer (it can carry connection details)", async () => {
    const r = await healthReport({ enabled: true, configured: true, ping: async () => Promise.reject(new Error("postgres://user:secret@host/db")) });
    expect(JSON.stringify(r)).not.toMatch(/secret|postgres:|host/);
  });
});

describe("the database client", () => {
  const db = read("server/utils/db.ts");
  it("uses the pg driver adapter with one connection per instance and timeouts", () => {
    expect(db).toMatch(/from "@prisma\/adapter-pg"/);
    expect(db).toMatch(/max: 1, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10_000/);
  });
  it("reads DATABASE_URL at request time, never through runtimeConfig (a build-time value lands in the build output)", () => {
    expect(db).toMatch(/process\.env\.DATABASE_URL/);
    expect(read("nuxt.config.ts")).not.toMatch(/DATABASE_URL|CLOUDINARY|BETTER_AUTH|GOOGLE_CLIENT/);
  });
  it("is created on first use, not when the module loads", () => {
    expect(db).not.toMatch(/^const client = new PrismaClient/m);
    expect(db).toMatch(/let client: PrismaClient \| null = null/);
  });
  it("the schema is Prisma 7's: prisma-client generator with an output, no URL in the schema", () => {
    const schema = read("prisma/schema.prisma");
    expect(schema).toMatch(/provider = "prisma-client"/);
    expect(schema).toMatch(/output\s+= "\.\.\/server\/generated\/prisma"/);
    expect(schema).not.toMatch(/url\s*=/);
    expect(read("prisma.config.ts")).toMatch(/process\.env\.DATABASE_URL \?\? ""/);
  });
  it("Prisma is pinned to 7.10.1 (npm's latest for the CLI is an 8.0 release candidate)", () => {
    const pkg = JSON.parse(read("package.json")) as { dependencies: Record<string, string>; devDependencies: Record<string, string> };
    expect(pkg.devDependencies.prisma).toBe("7.10.1");
    expect(pkg.dependencies["@prisma/client"]).toBe("7.10.1");
    expect(pkg.dependencies["@prisma/adapter-pg"]).toBe("7.10.1");
  });
  it("the generated client is not committed", () => {
    expect(read(".gitignore").split(/\r?\n/)).toContain("server/generated");
  });
});

describe("no test can reach a real service", () => {
  it("the browser tests' servers get a database URL that cannot resolve, and blank service keys", () => {
    const pw = read("playwright.config.ts");
    expect(pw).toMatch(/DATABASE_URL: "postgres:\/\/blocked\.invalid/);
    expect(pw).not.toMatch(/aivencloud|cloudinary:\/\//);
  });
  it("forbidRealApis also blocks Aiven, Cloudinary, Google sign-in and Resend", () => {
    const mocks = read("e2e/mocks.ts");
    // the hosts as they are written inside forbidRealApis' regular expression
    for (const host of ["\\.aivencloud\\.com", "(api|res)\\.cloudinary\\.com", "accounts\\.google\\.com", "oauth2\\.googleapis\\.com", "api\\.resend\\.com"]) expect(mocks.includes(host), host).toBe(true);
  });
  it("Vitest runs with the service credentials cleared", () => {
    for (const k of ["DATABASE_URL", "BETTER_AUTH_SECRET", "CLOUDINARY_URL", "CLOUDINARY_API_SECRET", "GOOGLE_CLIENT_SECRET", "RESEND_API_KEY"]) expect(process.env[k], k).toBeUndefined();
  });
});
