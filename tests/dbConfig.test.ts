// Phase 17A follow-up: the pg pool's TLS options (DATABASE_CA_CERT) and the sanitised failure line in the server log. Everything runs on
// fake URLs and a fake certificate: no connection is opened. pg's own ConnectionParameters is used to show what pg will actually use.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { dbFailureLine, describeDbError, normaliseCa, poolConfig, POOL } from "../server/utils/dbConfig";
import { cachedProbe } from "../server/utils/health";

const require = createRequire(import.meta.url);
const ConnectionParameters = require("pg/lib/connection-parameters") as new (c: unknown) => { ssl: unknown; host: string; database: string; user: string; password: string };

const PASS = "s3cr#t p@ss";
const URL_REQ = `postgres://app_user:${encodeURIComponent(PASS)}@pg-fake-123.aivencloud.com:12345/quran_preview?sslmode=require`;
const PEM = "-----BEGIN CERTIFICATE-----\nMIIBfakefakefake\nAAAA\n-----END CERTIFICATE-----\n";
const ROOT = path.resolve(__dirname, "..");

describe("the pg TLS option", () => {
  it("without DATABASE_CA_CERT the URL is used as it is (today's behaviour): sslmode=require is verify-full in pg 8.23", () => {
    const c = poolConfig(URL_REQ);
    expect(c).toEqual({ connectionString: URL_REQ, ...POOL });
    expect(c).not.toHaveProperty("ssl");
    // what pg makes of it: an ssl object with no CA and no relaxation, so Node checks the certificate against its own roots (the failure on Vercel)
    const params = new ConnectionParameters(c);
    expect(params.ssl).toEqual({});
  });

  it("why the URL's sslmode must go: pg lays the parsed URL over the options, so an ssl option next to sslmode is lost", () => {
    const params = new ConnectionParameters({ connectionString: URL_REQ, ssl: { ca: PEM, rejectUnauthorized: true } });
    expect(params.ssl).toEqual({}); // our CA was replaced
  });

  it("with DATABASE_CA_CERT: TLS trusts exactly that CA with rejectUnauthorized true, and the URL's SSL parameters are removed", () => {
    const c = poolConfig(URL_REQ, PEM);
    expect(c.ssl).toEqual({ ca: PEM, rejectUnauthorized: true });
    expect(c.connectionString).not.toMatch(/sslmode|sslrootcert|uselibpqcompat/);
    const params = new ConnectionParameters(c);
    expect(params.ssl).toEqual({ ca: PEM, rejectUnauthorized: true });
    // everything else in the URL is kept exactly
    expect(params.host).toBe("pg-fake-123.aivencloud.com");
    expect(params.database).toBe("quran_preview");
    expect(params.user).toBe("app_user");
    expect(params.password).toBe(PASS);
    expect(c.max).toBe(1);
  });

  it("every sslmode, ssl= and file-based SSL parameter is removed, other parameters stay", () => {
    for (const q of ["sslmode=verify-full", "sslmode=no-verify", "ssl=true", "sslmode=require&sslrootcert=/tmp/ca.pem", "uselibpqcompat=true&sslmode=require", "sslcert=/x&sslkey=/y"]) {
      const url = `postgres://u:p@h.example:5432/db?${q}&application_name=quran`;
      const c = poolConfig(url, PEM);
      expect(c.connectionString, q).toBe("postgres://u:p@h.example:5432/db?application_name=quran");
      expect(new ConnectionParameters(c).ssl, q).toEqual({ ca: PEM, rejectUnauthorized: true });
    }
  });

  it("a CA pasted on one line with \\n escapes, or with Windows line ends, is turned into real PEM", () => {
    expect(normaliseCa(PEM.replace(/\n/g, "\\n"))).toBe(PEM);
    expect(normaliseCa(PEM.replace(/\n/g, "\r\n"))).toBe(PEM);
    expect(poolConfig(URL_REQ, `  ${PEM.replace(/\n/g, "\\n")}  `).ssl?.ca).toBe(PEM);
  });

  it("a DATABASE_CA_CERT that is not a PEM certificate is refused with a code, and the error names no part of the URL", () => {
    let err: unknown;
    try {
      poolConfig(URL_REQ, "not a certificate");
    } catch (e) {
      err = e;
    }
    expect((err as { code?: string }).code).toBe("DB_CA_INVALID");
    expect(String((err as Error).message)).not.toMatch(/aivencloud|app_user|s3cr/);
  });

  it("no server code ever turns certificate checks off", () => {
    const files = ["server/utils/db.ts", "server/utils/dbConfig.ts", "server/utils/health.ts", "server/api/health.get.ts"];
    for (const f of files) expect(fs.readFileSync(path.join(ROOT, f), "utf8"), f).not.toMatch(/rejectUnauthorized:\s*false|NODE_TLS_REJECT_UNAUTHORIZED|no-verify/);
  });
});

describe("the failure line in the server log never holds the URI or its parts", () => {
  const SECRETS = [URL_REQ, "pg-fake-123.aivencloud.com", "app_user", PASS, encodeURIComponent(PASS), "12345/quran_preview", "postgres://"];
  const errors: [string, unknown][] = [
    ["a TLS error", Object.assign(new Error("self-signed certificate in certificate chain"), { code: "SELF_SIGNED_CERT_IN_CHAIN" })],
    ["DNS", Object.assign(new Error("getaddrinfo ENOTFOUND pg-fake-123.aivencloud.com"), { code: "ENOTFOUND" })],
    ["auth", Object.assign(new Error(`password authentication failed for user "app_user"`), { code: "28P01" })],
    ["the URI in the message", new Error(`could not connect to ${URL_REQ}`)],
    ["the password, decoded, in the message", new Error(`bad password ${PASS} for app_user@pg-fake-123.aivencloud.com:12345`)],
    [
      "a Prisma driver-adapter error wrapping the pg error",
      Object.assign(new Error("Error in connector"), {
        code: "P1010",
        meta: { driverAdapterError: { cause: { kind: "postgres", originalCode: "SELF_SIGNED_CERT_IN_CHAIN", originalMessage: `self-signed certificate (connecting to pg-fake-123.aivencloud.com as app_user)` } } },
        cause: { message: `connect to ${URL_REQ} failed`, code: "ECONNRESET" },
      }),
    ],
    ["a timeout", new Error("timeout")],
    ["a non-Error value", URL_REQ],
  ];

  for (const [name, err] of errors) {
    it(name, () => {
      const line = dbFailureLine(err, URL_REQ);
      expect(line.startsWith("[health] database unreachable: code=")).toBe(true);
      for (const s of SECRETS) expect(line, `${name}: ${s}`).not.toContain(s);
      expect(line.length).toBeLessThan(400);
    });
  }

  it("keeps the error codes, which are what you need to tell the causes apart", () => {
    expect(describeDbError(errors[0]![1], URL_REQ)).toContain("code=SELF_SIGNED_CERT_IN_CHAIN");
    expect(describeDbError(errors[5]![1], URL_REQ)).toMatch(/code=P1010,.*SELF_SIGNED_CERT_IN_CHAIN/);
    expect(describeDbError(errors[2]![1], URL_REQ)).toContain("code=28P01");
    expect(describeDbError(errors[2]![1], URL_REQ)).toContain("password authentication failed");
  });

  it("the probe passes the failure to the log once per 30-second window, and the answer has no error text", async () => {
    const lines: string[] = [];
    let t = 0;
    const probe = cachedProbe(async () => Promise.reject(errors[3]![1]), { now: () => t, onError: (e) => lines.push(dbFailureLine(e, URL_REQ)) });
    expect(await probe()).toBe("down");
    t += 10_000;
    expect(await probe()).toBe("down");
    expect(lines).toHaveLength(1);
    t += 20_000;
    await probe();
    expect(lines).toHaveLength(2);
    for (const l of lines) for (const s of SECRETS) expect(l).not.toContain(s);
  });

  it("a failing logger does not change the answer", async () => {
    const probe = cachedProbe(async () => Promise.reject(new Error("x")), {
      onError: () => {
        throw new Error("log broke");
      },
    });
    expect(await probe()).toBe("down");
  });

  it("the route logs through dbFailureLine only, to the server log, and returns only { ok, sync, db }", () => {
    const route = fs.readFileSync(path.join(ROOT, "server/api/health.get.ts"), "utf8");
    expect(route).toMatch(/onError: \(err\) => console\.error\(dbFailureLine\(err, process\.env\.DATABASE_URL\)\)/);
    expect(route.match(/console\.\w+\(/g)).toHaveLength(1);
    expect(route).toMatch(/return body;/);
  });
});
