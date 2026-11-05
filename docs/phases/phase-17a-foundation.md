# Phase 17A: Account & Sync foundation

- Branch: `phase-17a-foundation` (from `main` at 1be8834, the docs-only landing of the Phase 17 plan)
- Date: 2026-11-04
- Status: **Done. Merged into `main` as 029e21d on 2026-11-05** after the owner's preview check (`db: "up"` on `quran_preview`). Production: sync off.
  Merged-head verify: 1016 unit, browser 777 of 778 (one sub-pixel flake in `e2e/goals.spec.ts`, 43.99997 px against 44; passed 3 of 3 alone, spec 20 of 20).

## Goal

Lay the server foundation for optional sign-in and sync without changing anything a user sees: Prisma 7.10.1 against Aiven PostgreSQL through the `pg`
driver adapter, a health route, the `NUXT_PUBLIC_SYNC_ENABLED` flag (off in Production), and tests proving the service worker never touches `/api/*` and
that with the flag off the app makes no account request. Plan: `phase-17-plan.md`; decisions: `DECISIONS.md`, Phase 17.

## What was built

- **Prisma 7.10.1, pinned exactly** (`prisma` dev, `@prisma/client`, `@prisma/adapter-pg`, `pg` 8.23.1, `@types/pg`). npm's `latest` for `prisma` is
  an 8.0 release candidate, so the pins are exact and tested (`tests/syncFoundation.test.ts`).
- `prisma/schema.prisma`: generator `prisma-client` with `output = "../server/generated/prisma"` (gitignored), no URL in the schema; models `SyncRecord` and
  `SyncCursor` (plan section e). The link to Better Auth's `User` (`onDelete: Cascade`) comes in 17B with that table.
- `prisma.config.ts`: schema, migrations path, `datasource.url = process.env.DATABASE_URL ?? ""`; it loads `.env` with Node's own `process.loadEnvFile()`
  for the developer's CLI commands (Prisma 7 does not), without overriding variables already set.
- `prisma/migrations/20261104000000_sync_foundation/migration.sql`: written offline (`prisma migrate diff --from-empty --to-schema`), applied by the owner
  with `prisma migrate deploy`. Creates the two tables and the `(userId, revision)` index; nothing else.
- `server/utils/db.ts`: one client per server instance, made on first use; pool `max: 1`, `connectionTimeoutMillis: 5000`, `idleTimeoutMillis: 10000`;
  `DATABASE_URL` read from `process.env` at request time (a value put into `runtimeConfig` at build time lands in the build output).
- `GET /api/health` (`server/api/health.get.ts`, logic in `server/utils/health.ts`): flag off, `{ ok: true, sync: "off" }` with no database touched;
  flag on, a `SELECT 1` with a 6 s limit, **its result (up or down) kept for 30 s per server instance and shared by requests that arrive while it runs** (follow-up a: repeated requests open no extra connections on the 20-connection free plan): `{ ok: true, sync: "on", db: "up" }` or 503 `db: "down"` / `"unconfigured"`. No host, user or error text in the answer.
- **`server/api/[...].ts`: an `/api/` path no route serves is a JSON 404.** Found while writing the service-worker test: with `ssr: false` the page
  renderer answered every unmatched `/api/` path (for example `/api/auth/get-session`) with the SPA shell and status 200. Named routes still win (the four
  legacy proxies, `/api/health`, and Better Auth's `/api/auth/[...all]` in 17B).
- `nuxt.config.ts`: `runtimeConfig.public.syncEnabled` from `NUXT_PUBLIC_SYNC_ENABLED` (`app/lib/sync/flag.ts`: only `1` or `true` is on);
  `Cache-Control: no-store` on `/api/**`; a comment on why the navigation denylist is load-bearing. No Workbox behaviour changed: the denylist
  `/^\/api\//` has been there since Phase 0 and no runtime rule matches a same-origin `/api/` URL.
- `postinstall` is now `nuxt prepare && prisma generate`; `tests/independence.test.ts` was changed **on purpose** to pin exactly that.
- **No test can reach a real service.** `forbidRealApis` blocks `*.aivencloud.com`, `api|res.cloudinary.com`, `accounts.google.com`,
  `oauth2.googleapis.com`, `api.resend.com`; the Playwright servers get `DATABASE_URL=postgres://blocked.invalid:5432/none` and blank keys; Vitest clears
  the credentials before every file (`tests/setup/noServices.ts`). Playwright now starts a second server from the same build on port 3013 with the
  server's sync flag on (Nuxt reads the flag at request time on the server).

## Follow-up: the preview could not reach Aiven (2026-11-05)

The owner's preview check showed `{"ok":false,"sync":"on","db":"down"}` although the flag, the Vercel variables and the migration (run from the owner's
machine) were all right. **Cause, confirmed in the installed code** (pg 8.23.1, pg-connection-string 2.14.1, pg-pool 3.14.0):
- `sslmode=require` is an alias of **verify-full** (`pg-connection-string/index.js`, the default branch: `prefer`, `require` and `verify-ca` all
  fall through to verify-full, with a deprecation warning). The URL gives `ssl = {}`, so Node's TLS checks the certificate against its own roots,
  and Aiven's is signed by a per-project CA it does not have. `prisma migrate deploy` does not verify, which is why the migration worked.
- pg lays the parsed URL **over** the options it is given (`pg/lib/connection-parameters.js`: `Object.assign({}, config, parse(config.connectionString))`),
  so an `ssl` option next to an `sslmode` in the URL is silently replaced. A test shows both with pg's own `ConnectionParameters`.

**Fix:** `server/utils/dbConfig.ts` `poolConfig(url, ca)`. With `DATABASE_CA_CERT` (PEM text; `
` escapes and Windows line ends accepted) it passes
`ssl: { ca, rejectUnauthorized: true }` and removes `ssl`, `sslmode`, `sslrootcert`, `sslcert`, `sslkey` and `uselibpqcompat` from the URL, keeping
everything else. Without it, today's behaviour. A value that is not PEM is refused with `DB_CA_INVALID`. Certificate checks are never turned off (a test
scans the server code). **The health route logs why it is down** to the server log only, once per 30-second window: `[health] database unreachable:
code=… message=…`, codes from the error and from the driver error Prisma wraps, the message with the URI, host, user and password (as written,
decoded and encoded) removed. The answer is still only `{ ok, sync, db }`. DEPLOY.md section 7 says how to get the CA from Aiven and set it (Preview
now, Production later). Tests: `tests/dbConfig.test.ts` (19).

## Decisions and why

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| The flag is read at build time and by the server at request time | Runtime only | The three prerendered pages carry the build-time config in their HTML; Vercel has the same variable at build and run time, so both agree. A change needs a redeploy (DEPLOY.md). |
| A JSON 404 catch-all for `/api/` | Leave it | An unknown `/api/` path answered 200 with HTML; a sync client would read that as a reply. |
| `DATABASE_URL` from `process.env`, not `runtimeConfig` | Private `runtimeConfig` (as the brief says) | Nuxt serializes build-time `runtimeConfig` values into the server bundle. Request-time `process.env` keeps the secret out of the build. Checked: the build output contains no Aiven host. |
| A second Playwright server (3013) from the same build | A second build | The server routes only need the server's flag; no extra build minutes. The client with the flag on gets its own build only when there is client code (17C), measured then. |
| Migration written offline | `prisma migrate dev` against a database | No test or build may reach Aiven; the owner applies migrations. |
| `.env` loaded by `process.loadEnvFile()` in `prisma.config.ts` | `dotenv` | No new dependency; Node 22 has it. |

## Files

- Added: `prisma/schema.prisma`, `prisma.config.ts`, `prisma/migrations/…`, `server/utils/db.ts`, `server/utils/health.ts`, `server/api/health.get.ts`,
  `server/api/[...].ts`, `app/lib/sync/flag.ts`, `tests/syncFoundation.test.ts`, `tests/serviceWorkerApi.test.ts`, `tests/setup/noServices.ts`,
  `e2e/apiServiceWorker.spec.ts`, `e2e/syncFlag.spec.ts`, this file.
- Changed: `package.json`, `package-lock.json`, `nuxt.config.ts`, `playwright.config.ts`, `vitest.config.ts`, `eslint.config.mjs`, `.gitignore`,
  `.env.example` (names only), `e2e/mocks.ts`, `tests/independence.test.ts`, `CLAUDE.md`, `docs/DEPLOY.md`, `docs/PROGRESS.md`.
- `legacy/`, `docs/legacy-reference/`: none.

## Data and storage

- No localStorage key, IndexedDB database or cache is added or changed. `quran-revamp-db` stays at version 4. (`quran-sync-db` arrives in 17C.)
- Server: two new tables, created only when the owner runs the migration.

## Offline

No page changed. `/api/*` is online only by nature and is never answered by the worker: online it reaches the server, offline it is a network error,
never the shell (`e2e/apiServiceWorker.spec.ts`).

## Verification

- **Full `npm run verify` on this branch: exit 0** (2026-11-04, 15:30 to 15:59; Node 22.23.4; shell at `C:\Users\…`; CPU 25% at the start,
  VS Code and Chrome open): build 2 min 44 s; ESLint clean; **unit 991 passed in 61 files** (was 972 in 59: +19, all new in
  `syncFoundation.test.ts` and `serviceWorkerApi.test.ts`, plus the deliberate `independence.test.ts` change); dev smoke passed; **browser 778 passed**
  (was 772: +6, `apiServiceWorker.spec.ts` 5 and `syncFlag.spec.ts` 1) in 25.2 min, 0 failed, 0 retries (one worker). 25 minutes is a little over
  the quiet-machine 23, consistent with the load at the start.
- The first verify attempt stopped after 2 s without running a step: the portable Node 22's npm cannot run scripts. Re-run with npm shims (CLAUDE.md, "npm on this machine"); nothing in the repo changed between the two.

- Clean checkout (a fresh clone of 39ad198 in a temporary folder, no `.env`, no `DATABASE_URL`): `npm ci` with npm 10.9.4 (Vercel's line for Node 22)
  exit 0 in 263 s, `prisma generate` ran in `postinstall`; `nuxt build` exit 0 in 73 s.
- The build output was searched for the Aiven host name: 0 files.
- No UI changed, so there is no 1280/375 or prototype comparison in this sub-phase.

## Open issues and risks

- **The exit criterion "health OK on a preview" needs the owner** (Aiven database and Vercel variables): steps in the report and in DEPLOY.md section 7.
- **The lockfile** was written by npm 11.19 (the only working installer on this machine under Node 22). Besides the new packages it dropped 35 `"peer": true`
  markers and re-hoisted `@vercel/nft`; `npm ci` with npm 10.9.4 accepted it from a clean checkout and the build passed.
- **npm audit** (clean checkout): 69 findings (3 low, 57 moderate, 9 high), all in the existing toolchain (ESLint, Nuxt, Vite, Vitest, Workbox,
  shadcn-vue and their dependencies); none in `prisma`, `@prisma/*` or `pg`. Two to keep in mind: a `zod` memory issue with oversized constrained
  collections (17C will add `zod` directly and cap sizes before validating), and Nuxt skipping route rules for case-variant paths (the `/api/**` no-store
  header; the sync routes will also set it themselves in 17C).
- Prisma's CLI shows an "update available 7.10.1 → 8.0.0-rc.30" banner; ignore it (the pin is deliberate).

## Next phase needs

17B (auth): the email-provider decision, the Google OAuth client, `BETTER_AUTH_SECRET`, and Better Auth's tables (with the `SyncRecord` → `User` cascade).
