# Phase 17: Account & Sync, 17B to 17F and the admin panel

- Branch: `phase-17-complete` (a commit per sub-phase; see DECISIONS.md for why one branch)
- Date: 2026-11-18
- Status: Built and verified against the test database. **Off in Production** until you set `NUXT_PUBLIC_SYNC_ENABLED=1` (DEPLOY.md, section 8).

## Goal

Optional accounts, sync of the Library, Progress and Settings across devices, a profile photo, and a read-only admin panel for a super admin.

## What was built

- **17B Auth.** Better Auth 1.7.16 on Prisma (`User`, `Session`, `Account`, `Verification`, `RateLimit`), email and password, Google when keyed, rate limiting stored in the database, httpOnly SameSite=Lax cookies, delete account, an optional mailer (Resend or SMTP). The Account section in Settings (`/settings?section=account`) and a quiet header entry, both only with the flag on.
- **17C Sync engine.** Pure and tested: `app/lib/sync/` (`namespaces` with Zod schemas and caps, `merge` three-way rules, `adapters` for every key, `engine`, `categories`, `runtime`), `quran-sync-db` for the state and the first-merge snapshot, `/api/sync/pull|push|usage` and `DELETE /api/sync`, over a repository interface so the rules run in unit tests with no database. The merge is done on the device; the server refuses a stale write and the device pulls, merges and pushes again.
- **17D, 17E Library, Progress, Settings.** Every one of the 46 localStorage keys is classified in `app/lib/sync/inventory.ts` (a category or `never` with a reason) and `tests/syncInventory.test.ts` fails if a key is added without a classification.
- **17F Avatar.** `/api/avatar/sign` (signed upload, public id `avatars/<userId>`, jpg/png/webp, 256 px square), a photo sheet with zoom and move, removal, cleanup on account deletion. The Google photo is never imported.
- **Admin panel.** `/admin`, one read-only page ("All users"), super admin only. `scripts/make-super-admin.mjs` grants the role.

## Verified

- **Against the real test database (Aiven `quran_preview`, production build, 2026-11-18):** `scripts/live/sync.live.mjs` (accounts; push and pull with revisions; stale, invalid and oversize refusals; tombstones; paging; isolation between users; 401 and 404 rules; sign out; wrong password; remove synced data; delete account leaves **no row in any table**), `scripts/live/sync-browser.live.mjs` (two real browsers: sign up and sign in through the page, data arrives in the same legacy shapes, never-synced keys stay put, a theme change on one device reaches the other, sign out keeps data, typed-word delete) and `scripts/live/admin.live.mjs` (promotion, the list, paging, revocation, 404 for everyone else).
- **Unit tests** (no network): merge rules incl. random histories, adapters round trip with unknown fields kept, two-device conversations, server rules, Better Auth options, Cloudinary signature, route guard scan, inventory guard.
- **Browser tests** with a fake account server that runs the real sync rules (`e2e/account.spec.ts`, 21 tests): the Account area, sign up and in, two devices, first merge and Undo, server down, sign out, remove synced data, delete account, Clear all data, photo, admin, phone width and dark.
- **Vercel preset:** `NITRO_PRESET=vercel` builds (one 13 MB Node 22 function).

## Not verified against the real service (no keys were available)

- **Google sign-in:** only the configuration (the button appears with keys; the profile maps no image) and the redirect request are tested. Try it once on localhost and on Production with your keys.
- **Cloudinary:** the signature equals Cloudinary's own helper's, and the browser flow is tested with a mock. A real upload, replace, removal and cleanup on account deletion must be tried once with your keys, including your signed preset's size limit.
- **Email (Resend or SMTP):** the message text and the provider selection are tested; no mail was sent.
- **Vercel itself:** the app was not deployed. TLS to Aiven from a Vercel function needs `DATABASE_CA_CERT` (17A found this); locally the CA was read from the server's own TLS chain for the test only (trust on first use), so please give the CA from the Aiven console to Vercel.
- **Aiven power-off:** the "can't reach the server" state is tested with a fake 503, not with a powered-off service.

## Deviations from the plan

See DECISIONS.md, "Phase 17 … built 2026-11-18". The main ones: one branch and one verify for 17B to 17F; Hifz activity and Tasbeeh lifetime merge by maximum; an `admin` role below super admin was not built.

## Files

- Added: `server/utils/{auth,authConfig,avatar,mailer,rateLimit,session,syncHandlers,syncRepo}.ts`, `server/api/{auth,account,sync,avatar,admin}/`, `app/lib/sync/*`, `app/db/syncDb.ts`, `app/components/{account,admin}/`, `app/pages/admin.vue`, `prisma/migrations/20261118000000_auth`, `scripts/make-super-admin.mjs`, `scripts/live/{sync,sync-browser,admin}.live.mjs`, `public/google-g.svg`, tests and fakes.
- Changed: `prisma/schema.prisma`, `app/lib/storage.ts` (one listener slot, silent writes), Settings, the header, About, Data & privacy, `package.json` (better-auth, zod, cloudinary, nodemailer, pinned).
- Changes to `legacy/` or `docs/legacy-reference/`: none.

## Storage

- New localStorage key: `quran:sync-prefs:v1` (the three toggles). New IndexedDB: `quran-sync-db` v1 (`quran-revamp-db` stays at 5; `quran-app-db` is never opened). No existing key changed shape.

## Open issues

- The items under "Not verified" above, and CONTENT_TO_VERIFY.md (wording, and a privacy statement before the public can sign up).
- Aiven free plan: 1 GB disk, 20 connections, idle power-off. Each account is capped at 5 MB.
- No type-check step in the repo (`vue-tsc` is not installed); build and ESLint are the gate.
