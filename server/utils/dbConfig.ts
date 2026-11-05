// Phase 17A: the pg pool options and a safe description of a connection failure. Pure, so the unit tests check them with fake URLs and
// no database. Never log or return the URI, host, user or password.
//
// Why the CA option exists: pg 8.23 / pg-connection-string 2.14 treat `sslmode=require` (and prefer, verify-ca) as verify-full, so
// Node's TLS must trust the server's certificate. Aiven signs it with a per-project CA that Node does not ship, so a Vercel function
// failed to connect while `prisma migrate deploy` (which does not verify) worked. And pg merges the parsed connection string OVER the
// options it is given (connection-parameters.js: `Object.assign({}, config, parse(config.connectionString))`), so an `sslmode` left in
// the URL would replace our `ssl` option: with a CA set, the SSL parameters are removed from the URL.

export const POOL = { max: 1, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10_000 } as const;

/** URL parameters that make pg-connection-string build its own `ssl` value (which would override ours). */
const SSL_PARAMS = ["ssl", "sslmode", "sslrootcert", "sslcert", "sslkey", "uselibpqcompat"];

export interface PoolConfig {
  connectionString: string;
  ssl?: { ca: string; rejectUnauthorized: true };
  max: number;
  connectionTimeoutMillis: number;
  idleTimeoutMillis: number;
}

export class DbConfigError extends Error {
  code = "DB_CA_INVALID";
}

/** PEM text as pasted into an environment variable: real newlines, or `\n` escapes when the dashboard kept it on one line. */
export function normaliseCa(ca: string): string {
  const text = ca.includes("\n") ? ca : ca.replace(/\\n/g, "\n");
  return text.replace(/\r\n/g, "\n").trim() + "\n";
}

/**
 * The options for `new PrismaPg(...)` (they go to pg's Pool). Without DATABASE_CA_CERT: the URL as it is (today's behaviour). With it:
 * TLS that trusts exactly that CA and still checks the host name (`rejectUnauthorized: true`), and the URL's SSL parameters removed so
 * they cannot override it. Certificate checks are never turned off (tests/dbConfig.test.ts scans for it).
 */
export function poolConfig(url: string, ca?: string): PoolConfig {
  if (!ca) return { connectionString: url, ...POOL };
  const pem = normaliseCa(ca);
  if (!/-----BEGIN CERTIFICATE-----[\s\S]+-----END CERTIFICATE-----/.test(pem)) throw new DbConfigError("DATABASE_CA_CERT is not a PEM certificate");
  const u = new URL(url);
  for (const p of SSL_PARAMS) u.searchParams.delete(p);
  return { connectionString: u.toString(), ssl: { ca: pem, rejectUnauthorized: true }, ...POOL };
}

/** Every form of a secret part of the URL that could appear in a message: as written, decoded, and encoded. */
function secretsOf(url: string | undefined): string[] {
  if (!url) return [];
  const out = new Set<string>([url]);
  try {
    const u = new URL(url);
    for (const part of [u.hostname, u.username, u.password, u.host]) {
      if (!part) continue;
      out.add(part);
      try {
        out.add(decodeURIComponent(part));
      } catch {
        /* not encoded */
      }
      out.add(encodeURIComponent(part));
    }
  } catch {
    /* not a URL: the whole string is still removed */
  }
  return [...out].filter((s) => s.length >= 3).sort((a, b) => b.length - a.length);
}

/** The error codes worth logging, from the error and the driver error Prisma wraps (for example SELF_SIGNED_CERT_IN_CHAIN, ENOTFOUND, 28P01). */
function codesOf(err: unknown): string[] {
  const out: string[] = [];
  const seen = new Set<unknown>();
  const walk = (e: unknown, depth: number) => {
    if (!e || typeof e !== "object" || seen.has(e) || depth > 4) return;
    seen.add(e);
    const o = e as Record<string, unknown>;
    for (const k of ["code", "originalCode", "kind", "errno"]) if (typeof o[k] === "string" || typeof o[k] === "number") out.push(String(o[k]));
    walk(o.cause, depth + 1);
    walk((o.meta as Record<string, unknown> | undefined)?.driverAdapterError, depth + 1);
  };
  walk(err, 0);
  return [...new Set(out)];
}

function messagesOf(err: unknown): string[] {
  const out: string[] = [];
  let e: unknown = err;
  for (let i = 0; i < 4 && e; i++) {
    if (e instanceof Error || (typeof e === "object" && e && "message" in e)) out.push(String((e as { message: unknown }).message));
    const o = e as { cause?: unknown; originalMessage?: unknown };
    if (typeof o.originalMessage === "string") out.push(o.originalMessage);
    e = o.cause;
  }
  if (!out.length) out.push(String(err));
  return out;
}

/**
 * One line for the server log: the error codes and the messages with the URI, host, user and password removed (and any other
 * `postgres://…` URI, any `*.aivencloud.com` host and any `user@host` pair). Short.
 */
export function describeDbError(err: unknown, url: string | undefined): string {
  const codes = codesOf(err);
  let msg = [...new Set(messagesOf(err))].join(" | ");
  for (const s of secretsOf(url)) msg = msg.split(s).join("[redacted]");
  msg = msg
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[uri]")
    .replace(/[a-z0-9.-]+\.aivencloud\.com(?::\d+)?/gi, "[host]")
    .replace(/\b[\w.-]+@[\w.-]+\b/g, "[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
  return `code=${codes.length ? codes.join(",") : "unknown"} message=${msg || "none"}`;
}

/** The server-log line for a failed health check. */
export const dbFailureLine = (err: unknown, url: string | undefined): string => `[health] database unreachable: ${describeDbError(err, url)}`;
