// Gives (or takes away) the super admin role. Dev and owner tool: it is never part of a build and never runs from the app.
//
//   node scripts/make-super-admin.mjs <email>            make that account a super admin
//   node scripts/make-super-admin.mjs <email> --revoke   back to a normal user
//
// The account must already exist (sign up in the app first, with your own email and a password only you know): the role is a column that no request can
// set (`input: false` in server/utils/authConfig.ts), so this script, run by whoever controls the database, is the only way to grant it. It reads
// DATABASE_URL (and DATABASE_CA_CERT, the Aiven project CA as PEM text, like the app) from the environment, prints no secret, and changes one row.
import fs from "node:fs";
import pg from "pg";

try {
  process.loadEnvFile();
} catch {
  /* no .env: the variables may already be set */
}

const [email, flag] = process.argv.slice(2);
if (!email || !/^[^@\s]+@[^@\s]+$/.test(email)) {
  console.error("usage: node scripts/make-super-admin.mjs <email> [--revoke]");
  process.exit(2);
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(2);
}
const u = new URL(url);
let ssl;
const caRaw = process.env.DATABASE_CA_CERT || (process.env.DATABASE_CA_FILE ? fs.readFileSync(process.env.DATABASE_CA_FILE, "utf8") : "");
if (caRaw) {
  for (const p of ["ssl", "sslmode", "sslrootcert", "sslcert", "sslkey", "uselibpqcompat"]) u.searchParams.delete(p);
  ssl = { ca: (caRaw.includes("\n") ? caRaw : caRaw.replace(/\\n/g, "\n")).trim() + "\n", rejectUnauthorized: true };
}
const role = flag === "--revoke" ? "user" : "superadmin";
const client = new pg.Client({ connectionString: u.toString(), ssl, connectionTimeoutMillis: 8000 });
try {
  await client.connect();
  const r = await client.query('UPDATE "User" SET "role" = $1, "updatedAt" = now() WHERE lower("email") = lower($2) RETURNING "id"', [role, email]);
  if (!r.rowCount) {
    console.error("no account with that email: sign up in the app first");
    process.exitCode = 1;
  } else console.log(`${email} is now "${role}"`);
} catch (e) {
  console.error("failed:", e.code || "", String(e.message).slice(0, 160));
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
