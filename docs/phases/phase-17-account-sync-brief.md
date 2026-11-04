# Phase 17 — Account & Sync (brief)

Status: **brief for planning, not an approved plan.** Claude Code reads this, writes
`docs/phases/phase-17-plan.md`, and stops for approval. No code before approval.

## 1. Goal

Optional sign-in so a user's personal data follows them across devices. The app must work exactly as
today without an account. Signed-out behaviour must not change at all.

**Non-goals:** background push, end-to-end encryption, live multi-device updates, social features,
admin tools, any change to Qur'an content, translations, tafsir, audio or prayer data.

## 2. Decisions already made

| Topic | Decision |
|---|---|
| What syncs in v1 | Library (bookmarks, notes, tags, collections) + progress (last read, goals, Hifz, tasbeeh, read-surahs, story progress) + settings |
| Sign-in | Google, plus email and password (simple sign up and login) |
| Cloudinary | Only for the signed-in user's own profile avatar |
| Server DB | Aiven PostgreSQL (free tier), accessed through Prisma 7 |
| Hosting | Vercel (the app stays SPA, `ssr: false`; Nitro `server/api` routes hold the backend) |
| Local data | Stays local-first. localStorage and `quran-revamp-db` remain the source of truth |

## 3. Constraints from the existing project (these win over this brief)

Read `CLAUDE.md`, `DECISIONS.md`, `ROADMAP.md`, `README.md` first. In particular:

- Works without an account; sign-in is never required or nagged. No banners, popups or "sign in to
  save" interruptions.
- No streaks, badges, points or guilt wording. Sync status wording must be neutral.
- Undo instead of confirm for removals. Only "Clear all data" and delete-account may ask first.
- Storage keys follow `quran:<feature>:v1`, are additive, and legacy keys must stay readable (rollback
  safety). Several legacy keys are raw strings, not JSON (`prayerFiqh`, `themeMode`, etc.).
- Library rule (Phase 6): removing an item keeps its note, tags and collections. Metadata therefore
  syncs independently of whether the bookmark still exists.
- New user-facing wording we write ourselves goes into `CONTENT_TO_VERIFY.md`.
- Every phase: plan, approval, build, full `npm run verify` on its own branch, preview, approval,
  merge. Never report a result that was not witnessed.
- Windows: open the shell with an uppercase drive letter (`C:\...`).

### Design-rule conflict to resolve (avatar)

`DECISIONS.md` section 1 says no depictions of any person, avatars included. The owner wants the
user's own optional profile photo. Proposed amendment, to be written into `DECISIONS.md` once
approved:

> A signed-in user may upload an optional photo of their own, shown only to them in their account area
> and header menu. It never appears inside Qur'an, story, person or knowledge content. The default
> is a geometric or Arabic-letter monogram, never a silhouette. Photos from Google are not imported
> automatically.

Claude Code must flag this in the plan and not build 17F until it is approved.

## 4. Architecture

- **ORM/DB:** Prisma 7 with `@prisma/adapter-pg` and `pg`. Prisma 7 needs: generator
  `provider = "prisma-client"` with an explicit `output`, the datasource URL in `prisma.config.ts`
  (not in `schema.prisma`), and a driver adapter. Do **not** use the `@prisma/nuxt` module (not
  supported with Prisma 7). Verify against the current Prisma Nuxt guide before writing code.
- **Client singleton:** `server/utils/db.ts` (Nuxt auto-imports `server/utils`). Pool `max: 1` per
  serverless instance.
- **Build:** the generated client must exist on Vercel. Add `prisma generate` to `postinstall`
  (alongside `nuxt prepare`) and confirm the production build works from a clean checkout.
- **Migrations:** `prisma migrate deploy` run by the developer or CI, never at app runtime.
- **TLS:** Aiven requires SSL. Use the service URI with `sslmode=require`; add the Aiven CA
  certificate only if certificate errors appear.
- **Aiven free plan:** Claude Code verifies the current terms (storage, connection limit, idle
  power-off, region) and reports them. If the service can power off from inactivity, sync must degrade
  quietly (the app is unaffected; Settings shows "Can't reach the server right now").
- **Region:** pick the Vercel function region closest to the Aiven region.
- **Databases:** one Aiven service, **two databases**: production (`defaultdb` or a new `quran_prod`)
  and `quran_preview`. Vercel Production env uses the first; Preview and Development use the second.
  Preview deployments must never touch production data.
- **Service worker gotcha:** the Workbox navigation fallback must **not** serve the app shell for
  `/api/*` (add a denylist), and `/api/auth/*` must bypass the service worker entirely. Add a test.
- **Feature flag:** `NUXT_PUBLIC_SYNC_ENABLED`. With it off, the app makes zero requests to `/api/sync`
  or `/api/auth` and behaves as today. Test this.

### Environment variable names (values never in chat, never in git)

```
DATABASE_URL                      # Aiven service URI for the current environment
BETTER_AUTH_SECRET               # random 32+ characters (name per chosen auth library)
BETTER_AUTH_URL                  # site origin for the environment
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
RESEND_API_KEY                   # only if the email provider decision below is approved
NUXT_PUBLIC_SYNC_ENABLED
```

Rules: secrets live in a gitignored `.env` locally and in the Vercel dashboard (or `vercel env add`).
Server-only secrets go in private `runtimeConfig`, never `public`. Claude Code must never print, log
or commit values, and must confirm `.env` is gitignored.

## 5. Authentication

- **Library:** Better Auth with its Prisma adapter (email and password plus Google, cookie sessions,
  built-in rate limiting). Claude Code verifies it supports Nuxt 4 and Prisma 7 today and proposes an
  alternative if not. The auth library owns the user, session, account and verification tables.
- **Email and password:** minimum length per library guidance; hashing by the library; rate limiting
  on; no custom crypto.
- **Password reset and email verification need an email provider** (Aiven does not send email).
  Proposed: Resend free tier. This is a new service and needs the owner's approval; the plan must
  also describe the fallback (no reset flow, which is not recommended).
- **Google OAuth:** Google does not allow wildcard redirect URIs, and Vercel preview URLs change. Plan
  for Google sign-in to be tested on localhost and production only; previews use email login.
  Redirect URIs to register: localhost, `https://quran-app-znfc.vercel.app`, and any later custom
  domain.
- **UI:** an Account section in Settings (and a quiet entry in the header menu). Sign in, sign up,
  sign out, delete account and all synced data, sync toggles, last synced time. No forced flows.

## 6. What syncs

Three opt-in categories, shown once after first sign-in, each a toggle, all changeable later:

1. **Library:** bookmarks (all item types), item notes and tags, collections and assignments.
2. **Progress:** last read position, read surahs, pins, reading goals and Khatmah, Hifz progress and
   schedule, tasbeeh counts, story and persons study progress, search history (optional, plan decides).
3. **Settings:** reading and audio defaults, accessibility, theme, translation and reciter defaults,
   and the Sunni/Ja'fari choice with marja' (personal religious data: part of this toggle, stated
   clearly in the toggle's description).

**Never sync (device-specific or sensitive):** coordinates from `last_location` and any saved city
(see open item 4), the downloads manifest and everything in IndexedDB caches, audio queue place,
service worker state, any key tied to this device's storage.

**Claude Code's first task is an inventory:** list every localStorage key and IndexedDB store in the
revamp, and for each give: category (or "never"), JSON or raw string, record granularity, and the merge
strategy below. The owner approves the table.

## 7. Data model and sync semantics

### 7.1 Server model

The server never queries by content, so use one generic record store rather than a table per feature:

```prisma
model SyncRecord {
  userId     String
  namespace  String            // allowlist, e.g. "library.item", "library.meta", "progress.goals"
  recordKey  String            // e.g. "ayah:2:255", "collection:<id>", "singleton"
  payload    Json              // validated per namespace with zod, size capped
  schemaVer  Int      @default(1)
  revision   BigInt            // server-assigned, monotonic per user
  updatedAt  DateTime          // server time of last write
  deletedAt  DateTime?         // tombstone
  @@id([userId, namespace, recordKey])
  @@index([userId, revision])
}
```

Plus a small profile row (avatar public id and URL) if the auth library's user table cannot hold it.
Claude Code may propose a better shape in the plan, with reasons.

### 7.2 Rules

- **Local first.** Every write lands locally and instantly. Sync is a background replica; it never
  blocks reading or the UI.
- **Pull by cursor** (`since=<revision>`), **push by batch** with an outbound queue stored in
  `quran-revamp-db`; flush on sign-in, on `online`, on focus, and after a short debounce.
- **Do not trust client clocks.** The server stamps `updatedAt` and `revision`.
- **Merge strategy per namespace** (the plan fills the table; no one rule fits all):
  - set-like (bookmarks, read surahs, pins, collection items): union, with tombstones for removals;
  - last write wins (settings, notes, singletons);
  - monotone or additive (counters, progress): never let an older value reduce a newer one; decide
    max, sum of deltas, or per-device buckets per key.
- **First sign-in on a device with local data:** merge, never silently overwrite. Take a local
  snapshot first, show a plain summary ("Added 12 bookmarks from this device, 5 from your account"),
  and offer **Undo** that restores the snapshot.
- **Sign-out:** keeps local data; stops syncing.
- **Clear all data** (existing action): proposed to stay local-only, with a separate "Delete account
  and synced data" in the Account section (see open item 5).
- **Account deletion:** deletes all `SyncRecord` rows, the avatar from Cloudinary, and the user and
  sessions, in one server action, with a typed confirmation.
- **Validation:** namespace allowlist, per-record and per-request size caps, zod schema per
  namespace, reject unknown fields. Rate limit sync routes.

## 8. Avatar (Cloudinary)

- **Signed uploads only.** A server route `POST /api/avatar/sign` returns a short-lived signature for
  a fixed folder and `public_id` of `avatars/<userId>`; the API secret never reaches the browser. No
  unsigned upload preset.
- **Constraints:** jpg, png, webp; max about 2 MB; square crop to about 256 px; overwrite the same
  `public_id` so there is one image per user; restrict allowed formats and size in the Cloudinary
  console as a second layer.
- **Display:** account area and header menu only. Default is a geometric or Arabic-letter monogram.
- **Offline:** cache the avatar with a Workbox runtime rule for `res.cloudinary.com`; fall back to the
  monogram when it is unavailable.
- **Cleanup:** remove the image when the user removes it or deletes the account.
- Blocked until the `DECISIONS.md` amendment in section 3 is approved.

## 9. Security and privacy checklist

- Secrets only in `.env` (gitignored) and Vercel env. Any secret that has appeared in chat or a commit
  is rotated before use.
- Session cookies: httpOnly, secure, sameSite lax. CSRF protection as the auth library provides.
- All sync routes require a session and scope every query by `userId` taken from the session, never
  from the request body.
- No personal data in logs. No analytics events carrying note text or settings values.
- Notes and religious preferences are personal: only sync categories the user turned on. The Account
  section states in one plain sentence what is stored and that it can be deleted.
- Aiven and Vercel traffic over TLS. Preview and production data separated (section 4).

## 10. Testing and verification

- **Pure logic in `app/utils/`:** the merge functions, tombstone handling, snapshot and undo, and
  namespace schemas, with Vitest unit tests (including clock-skew, offline-edit-conflict, and
  first-sign-in cases).
- **Browser tests:** mock the API at the network layer. **No test may touch Aiven or Cloudinary.**
- **Server routes:** tested with a mocked Prisma client; no Docker or local Postgres required on the
  owner's Windows machine.
- **Flag-off test:** with `NUXT_PUBLIC_SYNC_ENABLED` off, zero `/api/sync` or `/api/auth` requests.
- **Service worker test:** `/api/*` is never answered with the app shell.
- **Real-database check:** a manual checklist against the `quran_preview` database on a Vercel
  preview deployment (sign up, sync two browsers, offline edit, delete account).
- Full `npm run verify` on the phase branch must pass on its own; prior counts were 972 unit and 772
  browser tests, which must not shrink.

## 11. Sub-phases (each is its own branch, plan note, verify and approval)

| Phase | Delivers | Exit criteria |
|---|---|---|
| 17A | Prisma 7 + Aiven foundation: schema, singleton, `prisma.config.ts`, `postinstall`, `/api/health`, env and Vercel setup, preview DB, SW denylist, feature flag | Health route returns OK on a preview deployment; flag-off test passes; clean-checkout build passes |
| 17B | Auth: Google + email/password, Account section, sign out, delete account (without synced data yet), email provider if approved | Sign up, login, logout work on localhost and preview (email) and production (Google); rate limit test |
| 17C | Sync engine: queue, cursor pull, merge functions, first-sign-in merge with Undo, namespace allowlist | Unit tests for all merge cases; mocked-API browser tests; no data loss in conflict tests |
| 17D | Library sync (bookmarks, notes, tags, collections) | Two-browser manual check on preview; Phase 6 "keeps metadata" rule holds |
| 17E | Progress and settings sync with per-category toggles and the key inventory applied | Every key in the inventory has a test; "never sync" keys proven absent from payloads |
| 17F | Cloudinary avatar (after the design-rule amendment) | Signed upload works; monogram fallback; cleanup on delete; offline fallback |

## 12. Open items needing the owner's decision (Claude Code lists these in the plan, does not decide)

1. **Email provider** for verification and password reset (proposed: Resend). Or accept no reset.
2. **Google sign-in on previews** is not possible (changing URLs); accept localhost and production only.
3. **Marja'/fiqh sync:** part of the Settings toggle (proposed) or its own toggle.
4. **Prayer city and coordinates:** never sync (proposed) or sync the city name only.
5. **"Clear all data" meaning** once synced: local only (proposed) plus a separate delete-account action.
6. **Avatar rule amendment** in `DECISIONS.md` and no auto-import of the Google photo.
7. **Aiven free-plan terms** (idle power-off, connection limit) and the region choice.
8. **Supabase leftovers:** if the revamp still contains the unused Supabase client or env keys, remove them
   in 17A with approval.

## 13. Rollback

Turning off `NUXT_PUBLIC_SYNC_ENABLED` and redeploying restores today's behaviour with no data change.
Local data is never deleted by sync. Database migrations are additive; destructive migrations need a
separate approval.