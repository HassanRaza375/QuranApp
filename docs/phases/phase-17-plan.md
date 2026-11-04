# Phase 17: Account & Sync — plan

Status: **plan, waiting for the owner's approval.** No code, no packages, no `.env` change. Input: `phase-17-account-sync-brief.md` (committed with this plan,
unchanged). Where the brief conflicts with `CLAUDE.md` or `docs/DECISIONS.md`, those win; every conflict is listed in section 8.

Written 2026-11-04 from `main` at ae1e830 (the Phase 16 cutover). Read first: `CLAUDE.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md`, `docs/README.md`
(there is no root `README.md`, `ROADMAP.md` or `DECISIONS.md`; all three are in `docs/`), `docs/LEGACY_INVENTORY.md`.

**A security note first.** On 2026-11-04 the Aiven service URI (with the `avnadmin` password) and the Cloudinary API key were pasted into the chat that
produced this plan. They are not repeated here, were not used, and nothing was read from `.env`. Under the brief's own rule (section 9) both must be
**rotated before 17A uses them**: reset the Aiven `avnadmin` password (or create a separate app user, recommended in 17A), and regenerate the Cloudinary
API secret. Also check in your editor that `.env` puts the database URI after `DATABASE_URL=`: the pasted text looked like a bare URI with no name.

---

## a. Storage inventory and merge strategy

Found by scanning `app/` for every key literal and every call of the storage wrapper (`app/lib/storage.ts`, the only code that touches localStorage)
and of `app/db/revampDb.ts`. 46 localStorage keys (plus two legacy-only key families) and 5 IndexedDB stores.

**How to read the table.**
- **Record**: the unit that syncs. It is the server's `recordKey` within its namespace. A key is split into records so that two devices editing
  different things never collide.
- **Merge**: one of three strategies, plus `never`.
  - **union + tombstone**: a set. An add on any device wins over nothing. A removal is a tombstone that wins only over the adds it has seen.
  - **LWW**: last write wins, in the server's order (its `revision`), never by a client clock.
  - **monotone**: never lets an older value lower a newer one (a union of days, or a sum of per-device counts).
- **Shape stays legacy.** Sync reads and writes every key in its existing shape, through the existing write functions or the same shape. Unknown
  fields are kept (each key's `rest`). A rollback to the legacy app therefore reads every key as before (CLAUDE.md rule 4).

### Library (toggle 1)

| Key | Owner file | Format | Record (namespace / recordKey) | Merge |
|---|---|---|---|---|
| `quran:bookmarks:v1` | `lib/bookmarks.ts`, `lib/libraryStorage.ts` | JSON `string[]` of item keys (`ayah:2:255`, `surah:2`, `person:<id>`, the 7 knowledge kinds…) | `library.item` / the item key | union + tombstone. The list order is rebuilt from `addedAt` (oldest first, as now). |
| `quran:bookmarks:added-at:v1` | same | JSON map item key → ms | a field of the `library.item` record | travels with its item; on a merge the earlier time is kept (monotone min) |
| `quran:library:v1` `.collections[]` | `lib/libraryStorage.ts`, `lib/library.ts` | JSON `{id, name, description, createdAt}` | `library.collection` / the collection id | LWW + tombstone. A deleted collection, after its Undo window, is a tombstone; `retiredCollectionIds` maps onto tombstones. |
| `quran:library:v1` `.itemMeta{}` | same | JSON `{note, tags[], collectionIds[], updatedAt}` per item key | `library.meta` / the item key | LWW per item, **independent of `library.item`** (Phase 6: removing an item keeps its note, tags and collections). An id of a deleted collection is dropped when read, as now. |
| `quran:library:v1` other top-level fields | same | JSON | `library.rest` / `singleton` | LWW (kept so that nothing is lost) |
| `quran:favorites:surah:v1` | `lib/libraryStorage.ts` | JSON (old legacy key, migrated once and removed) | — | never |

**Choice to note:** a note edited on one phone and the tags of the same item on another phone, both offline, keep only the later one (record-level
LWW). Field-level LWW would keep both, at the price of one record per field. I recommend record-level for v1, because conflicts on the same item are rare.

### Progress (toggle 2)

| Key | Owner file | Format | Record | Merge |
|---|---|---|---|---|
| `quran:reading-progress:v1` | `lib/readingProgress.ts` | JSON singleton `{surahNo, ayahNo, surahName, surahNameArabic, totalAyah, updatedAt}` | `progress.lastRead` / `singleton` | LWW |
| `quran:read-surahs:v1` | `lib/readSurahs.ts` | JSON `{v:1, surahs:{"<n>":{completedAt}}}` | `progress.readSurah` / `<n>` | union + tombstone (the Undo of Mark as read is a tombstone) |
| `quran:pins:v1` | `lib/pins.ts` | JSON `{v:1, reading?, page?}` | `progress.pin` / `reading`, `page` | LWW; an unpin is a tombstone |
| `quran:reading-goals:v1` `.goals[]` | `lib/goals/store.ts` | JSON, legacy goal objects (the Ramadan Khatmah is one) | `progress.goal` / goal id | LWW + tombstone |
| `quran:reading-goals:v1` `.activeGoalId` | same | JSON string or null | `progress.goalActive` / `singleton` | LWW |
| `quran:reading-goals:v1` `.dailyLog{}` | `lib/goalLog.ts` | JSON day → `"s:a"[]` | `progress.goalLog` / `YYYY-MM-DD` | monotone: union of the ayah keys of that day (a day's log never shrinks) |
| `quran:hifz:v2` `.targets[]` | `lib/hifz/store.ts` | JSON, legacy `HifzTarget` | `progress.hifzTarget` / target id | LWW + tombstone |
| `quran:hifz:v2` `.ayahStates[]` | same | JSON, legacy `HifzAyahState` (`key` = `<targetId>:<ayah>`) | `progress.hifzAyah` / its `key` | LWW of the whole state. The spaced-repetition fields cannot be merged field by field without changing the engine, and `tests/hifzParity.test.ts` forbids that. |
| `quran:hifz:v2` `.transitionStates[]` | same | JSON, legacy `HifzTransitionState` | `progress.hifzJoin` / its `key` | LWW of the whole state |
| `quran:hifz:v2` `.activity[]` | same | JSON, one entry per day of counts | `progress.hifzActivity` / `<date>@<deviceId>` | monotone: each device writes only its own bucket, and the local day is the sum of the buckets |
| `quran:hifz-words:v1` | `lib/hifz/slips.ts` | JSON `{v:1, ayahs:{"s:a":{"<i>":{word, slipDays[], cleanDays[], last}}}}` | `progress.hifzWords` / `s:a` | monotone: union of `slipDays` and of `cleanDays` per word, `last` = the later day |
| `quran:tasbeeh:v1` | `lib/tasbeeh.ts` | JSON `{<id>:{count, target, cycles, lifetime}}`, which includes Asma `name-<n>` | `progress.tasbeeh` / `<id>` for `{count, target, cycles}`; `progress.tasbeehTotal` / `<id>@<deviceId>` for this device's share of `lifetime` | the bead state is LWW; `lifetime` is monotone, the sum of the per-device shares |
| `quran:story-progress:v1` | `lib/storyProgress.ts` | JSON `{v:1, stories:{<id>:{chapter, read[], updatedAt}}}` | `progress.story` / story id | `read[]` is a union, `chapter` is LWW |
| `quran:persons-study:v1` | `lib/peopleStudy.ts` | JSON `{<personId>:{lastSection, passageView, lastSurahNo, lastAyahNo, updatedAt}}` | `progress.personStudy` / person id | LWW |
| `quran:ramadan:v1` | `lib/ramadan.ts` | JSON `{startOverride, fastingLog:{day:status}, …}` | `progress.ramadanStart` / `singleton`; `progress.fast` / `YYYY-MM-DD` | LWW per day. A fasting record is personal religious data, and the toggle's text says so. |
| `quran:reminders:v1` | `lib/reminders.ts` | JSON array `{id, title, date, note, recurringYearly, done, createdAt, repeat?}` | `progress.reminder` / id | LWW + tombstone. **Not in the brief's list**: the owner decides (recommended: Progress). |
| `quran:search-history:v1` | `lib/searchHistory.ts` | JSON `string[]` (≤ 15) | — | **recommended never in v1**: what someone searched for is sensitive and of little use on another device. If synced: LWW `singleton`. |
| `quran:hifz-session:v1` | `lib/hifz/store.ts` | JSON, an unfinished session | — | never (a session in progress on this device; merging two would grade items twice) |
| `quran:hifz-timing:v1` | `lib/hifz/timing.ts` | JSON `{v:1, sessions, secs[]}` | — | **recommended never**: it is this device's own speed for the time estimate. LWW would be harmless too. |
| `quran:hifz:v1` | `lib/hifz/store.ts` | JSON, read once to migrate | — | never |

### Settings (toggle 3)

Each setting is its own record (`settings` / `<name>`), LWW. A setting that is removed locally (for example a translation set back to "Not set", or a
setting cleared by Reset) is a tombstone. Raw keys are synced as strings and written back raw: they are never put through JSON.

| Key | Owner file | Format | Records | Notes |
|---|---|---|---|---|
| `prayerFiqh` | `lib/preferences.ts` | **raw** `sunni` / `jafari` | `fiqh` | religious (open item 3) |
| `quran:fiqh-prefs:v1` | `lib/preferences.ts` | JSON `{marjaId, lang, updatedAt}` | `marja`, `fiqhLang` | religious (open item 3) |
| `themeMode` | `lib/preferences.ts`, `lib/noFlashScript.ts` | **raw** `light` / `dark` / `system` | `theme` | the no-flash script reads it at start, so a pulled change shows on the next load |
| `translationDefaultLang` | `lib/preferences.ts` | **raw** | `translationLang` | when absent, a tombstone |
| `tafsirDefaultAuthor` | `lib/preferences.ts` | **raw** | `tafsirAuthor` | when absent, a tombstone |
| `reciter` | `lib/preferences.ts` | JSON object | `reciter` | |
| `quran:accessibility:v1` | `lib/preferences.ts` | JSON, 4 fields | `reducedMotion`, `highContrast`, `largeTouchTargets`, `arabicFontScale` | per field; unknown fields kept |
| `quran:audio-prefs:v1` | `lib/audioState.ts`, `lib/preferences.ts` | JSON `{playbackRate, repeatOne, autoAdvance}` | one record per field | |
| `quran:player-prefs:v1` | `lib/audioState.ts` | JSON `{followAyah}` | `followAyah` | |
| `quran:reader-prefs:v1` | `lib/readerPrefs.ts` | JSON `{translation?: "off"}` | `readerTranslation` | |
| `quran:verse-layout:v1` | `lib/preferences.ts` | JSON `{order}` | `verseLayout` | |
| `quran:hijri-adjust:v1` | `lib/preferences.ts` | JSON `{days}` | `hijriAdjust` | It depends on where the moon was sighted. It is synced as a preference; say so if you would rather keep it per device. |
| `quran:prayer-calc:v1` | `lib/calcMethods.ts` | JSON `{sunniMethod, jafariMethod, asr}` | one record per field | |
| `quran:calendar-prefs:v1` | `lib/calendar/prefs.ts` | JSON `{first}` | `calendarFirst` | |
| `prayerSettings` | `lib/preferences.ts` | JSON `{notificationsEnabled, enabledPrayers, reminderOffset}` (shared with the legacy app) | `enabledPrayers`, `reminderOffset` | **`notificationsEnabled` never syncs**: notification permission belongs to each device's browser |

### Never synced

| Key or store | Owner | Why |
|---|---|---|
| `quran:downloads:v1` | `lib/downloadsManifest.ts` | It describes this device's files. |
| `quran:download-prefs:v1` (`wifiOnly`) | `lib/preferences.ts` | It depends on the device's connection. |
| `quran:audio-resume:v1`, `quran:audio-queue:v1` | `lib/audioState.ts` | The place in the audio (brief, section 6). |
| `quran:location:v1`, `last_location` (legacy, read-only) | `lib/location.ts` | Coordinates (brief section 6, open item 4). |
| `ayah-of-day` | `lib/ayahOfDay.ts` | Derived from the date. |
| `quran:nav-open:v1` | `lib/navState.ts` | The sidebar state on this screen. |
| `quran:tasbeeh-prefs:v1` (`vibrate`) | `lib/tasbeeh.ts` | Vibration depends on the device. |
| `preferredVerseDisplay` | `lib/preferences.ts` | The revamp only reads it and never writes it. |
| `quran:additional-modules-enabled:v1` | — | Never read or written since Phase 15. |
| `prayer_<lat>_<lon>_<fiqh>_<day>`, `calendar_v2_…`, cookie `theme-resolved` | legacy app only | The revamp never reads or writes them. |
| IndexedDB `quran-revamp-db` **version 4** (not 2, as CLAUDE.md says): `prayer-months`, `chapters`, `tafsirs`, `ayah-text`, `hijri-months` | `app/db/revampDb.ts` | Caches of service data. |
| IndexedDB `quran-app-db` | legacy | Never opened (rule 9). |
| Cache Storage: `workbox-precache-*`, `quran-api-cache`, `quran-audio-cache`, `quran-downloads-audio-cache`, `wajibat-data-cache` | `nuxt.config.ts`, `lib/savedAudio.ts`, `lib/fiqh/offline.ts` | Device files. |

### New storage that sync itself needs (proposed)

- **IndexedDB `quran-sync-db`, version 1, a new database.** Its stores:
  - `outbox`: the queued operations.
  - `state`: the cursor, the `deviceId`, the last-synced hash and revision of each record, and the last synced time.
  - `snapshot`: the local snapshot taken before a first-sign-in merge, used by Undo.
- **Why a new database and not new stores in `quran-revamp-db` (the brief proposes the latter).** Adding stores means version 5. A build rolled
  back with Instant Rollback (version 4) then cannot open the database, and the prayer, text and Hijri caches stop working until the data is cleared.
  `docs/DEPLOY.md` section 6 forbids exactly that without telling you. A separate database leaves `quran-revamp-db` untouched.
- **One localStorage key, `quran:sync-prefs:v1`**: `{categories:{library, progress, settings}, lastSyncedAt}`. Settings reads it straight away. It
  also holds no secret: the session is an httpOnly cookie, never in storage.
- **A guard test (17E).** The inventory becomes data: `app/lib/sync/inventory.ts` maps each key to its category or `never`. A test scans `app/` for
  storage-key literals and fails if any key is missing from the inventory. A future phase cannot then add a key that silently syncs, or one that silently
  doesn't.

## b. Supabase leftovers

**None in code or configuration.**
- Searched the whole repo, excluding `node_modules`, `.nuxt`, `.output` and `test-results`, for `supabase` in any case. It appears only in docs:
  `docs/PLAN.md:30`, `docs/LEGACY_INVENTORY.md:22`, `docs/DEPLOY.md:39` and the read-only copies in `docs/legacy-reference/`.
- No Supabase package is in `package.json` or `node_modules`, there is no plugin, and no `useAuth`.
- `.env.example` (the only tracked env file) holds only `QURAN_API_BASE` and `QURAN_API_BASE2`.
- **`.env` is gitignored and not tracked.** `git check-ignore -v .env` reports `.gitignore:10:.env`, and `.env.*` is also ignored, except `.env.example`.
- I did not open `.env`, so I cannot say whether it still holds `NUXT_PUBLIC_SUPABASE_*` lines. Nothing reads them. Delete them yourself if they are
  there.
- **Open item 8 therefore needs no code change.** 17A only updates the two doc lines that still mention Supabase.

## c. Current facts, checked 2026-11-04

| Item | Version checked | Source |
|---|---|---|
| `prisma` (CLI) | **dist-tag `latest` = `8.0.0-rc.30` (published 2026-11-03); `prev` = `7.10.1`** | npm registry |
| `@prisma/client`, `@prisma/adapter-pg` | `7.10.1` (2026-10-15) | npm registry |
| `pg` | `8.23.1` | npm registry |
| `better-auth`, `@better-auth/prisma-adapter` | `1.7.16` (2026-11-03); peer `prisma ^5 \|\| ^6 \|\| ^7`, `vue ^3` | npm registry |
| `zod` | `4.6.7` | npm registry |
| `cloudinary` (Node SDK) | `2.11.0` | npm registry |
| `nuxt` | `4.6.4` latest (the repo has `^4.6.1`) | npm registry |

### Prisma 7 with Nuxt 4

From the Prisma "Upgrade to v7" guide (Prisma ORM 7.x docs) and the Better Auth Prisma adapter page.

- **Pin the version.** `npm install prisma` today installs the **8.0 release candidate**, because Prisma moved the CLI's `latest` tag to 8.0 RCs.
  Prisma's Nuxt guide now shows only the 8.x scaffold (`create-prisma`, a `contract.prisma`, Prisma Compute). It is not the Prisma 7 setup the brief
  describes. Install exact versions: `prisma@7.10.1 @prisma/client@7.10.1 @prisma/adapter-pg@7.10.1 pg`. Better Auth's peer range stops at
  `^7`. `package-lock.json` keeps the pins.
- **Generator.** `provider = "prisma-client"`. `output` is required (for example `output = "../server/generated/prisma"`), the client is no longer
  generated into `node_modules`, and it is imported from `<output>/client`.
- **`prisma.config.ts`** at the root, with `defineConfig` (and `env`) from `prisma/config`: `schema`, `migrations.path`, `datasource.url`. The URL in
  `schema.prisma` is deprecated.
- **`.env` is not loaded automatically in Prisma 7.** The config must `import "dotenv/config"` for the CLI (`dotenv` becomes a dev dependency).
  Nitro loads `.env` itself in `nuxt dev`, and on Vercel the variables are real environment variables.
- **A driver adapter is required.** `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`. Pool settings now come from `pg`, which **has
  no connection timeout by default**. Set `connectionTimeoutMillis`, or a powered-off Aiven service makes every request hang until the function times
  out (section on Aiven below).
- **ESM.** The repo already has `"type": "module"`. Node 22 and TypeScript 5.4 or later meet the minimums (Node 20.19+, 22 recommended).
- **TLS.** `node-pg` checks certificates, where the old Rust engine did not; an invalid chain fails with P1010. Aiven's chain should pass with
  `sslmode=require`. If it does not, use `NODE_EXTRA_CA_CERTS` with Aiven's CA, **never** `rejectUnauthorized: false`.
- **`@prisma/nuxt` is not used** (as the brief says). The client is created in `server/utils/db.ts` (auto-imported by Nitro, server only), lazily on
  the first request, with `max: 1` in the pool.
- **To verify in 17A, not assumed:**
  - **`prisma generate` without `DATABASE_URL`.** `env()` from `prisma/config` throws when the variable is missing, and `npm ci` on a machine or in a
    test without it would then fail at `postinstall`. Plan: read `process.env.DATABASE_URL ?? ""` in the config for `generate`. Checked from a clean
    checkout with no `.env`.
  - **Nitro bundling the generated client for the `vercel` preset.** A clean-checkout `npm ci && npm run build`, then the function runs `/api/health`
    on a preview.

### Better Auth with Nuxt 4 and Prisma 7: it fits

- **Nuxt.** A catch-all Nitro route, `server/api/auth/[...all].ts`, runs `auth.handler(toWebRequest(event))`. The client is `createAuthClient` from
  `better-auth/vue`.
- **This app is an SPA.** The docs' SSR advice (`useSession(useFetch)`) does not apply. Only the client form `authClient.useSession()` is used, after
  the page is up. Server routes read the session with `auth.api.getSession({ headers: event.headers })`.
- **Prisma 7.** `prismaAdapter(prisma, { provider: "postgresql" })` from `better-auth/adapters/prisma` (package `@better-auth/prisma-adapter`), with a
  client built with the `PrismaPg` adapter. The CLI (`npx auth@1.7.16 generate`, pinned) writes the auth models into `schema.prisma`, and the
  migration is then made with `prisma migrate dev`.
- **Email and password.** Off unless `emailAndPassword.enabled`. Passwords are 8 to 128 characters by default and hashed with Node's built-in `scrypt`.
  Verification and reset need `sendVerificationEmail` and `sendResetPassword`, which need an email sender (open item 1).
- **Rate limiting.** On in production, off in development. The defaults are 100 requests per 10 s, and `/sign-in/email` is limited to 3 per 10 s. The
  default store is **memory, which the docs say does not suit serverless**. Use `storage: "database"` (a `rateLimit` table) and turn it on in tests
  with `enabled: true`.
- **Preview addresses.** `baseURL` can be `{ allowedHosts, protocol, fallback }`. Use the **team-scoped** pattern
  `quran-app-znfc-*-syed-hassan-razas-projects-dab4300e.vercel.app`, not `*.vercel.app`. A `*.vercel.app` pattern would trust every Vercel site on the
  internet as an origin.
- **Account deletion.** `user.deleteUser.enabled` with a `beforeDelete` hook (it removes the Cloudinary image) and `afterDelete`. Sync rows go by a
  cascade.
- **Google photo.** Google sign-in fills `user.image` by default. To meet "no automatic import of the Google photo", the Google provider maps the
  profile with no `image`. A unit test proves the stored user has none.
- **Secret.** `BETTER_AUTH_SECRET` is required in production (`openssl rand -base64 32`). Rotation with `secrets[]` is supported.
- **An alternative, not proposed.** `nuxt-auth-utils` (sealed cookie sessions, OAuth helpers) has no built-in email verification, reset, database rate
  limit or account linking. We would write those ourselves, which the brief forbids ("no custom crypto").

### Aiven PostgreSQL free plan: terms on aiven.io, 2026-11-04

From the "pg free tier" docs page:
- **Resources.** 1 CPU, 1 GB RAM, **1 GB disk**.
- **Connections.** `max_connections` = **20**, and there is **no connection pooling** (no PgBouncer).
- **Backups and services.** Backups are included, with no frequency stated. Only **one service of each type** per organisation.
- **Region.** **You cannot rely on choosing it.** Aiven "may change the cloud provider, region, or configuration at any time".
- **Idle power-off.** Aiven powers off a service with no use in the first few hours, and later one with "no continuative activity". **No number of days
  is given.** A notification comes first, and you can power it back on at any time. The paid Developer tier is not powered off for inactivity (Aiven
  blog; I did not verify its price).

What follows for the design:
- **Connections.** 20 connections and pool `max: 1` allow about 20 warm function instances at once, auth included, which is ample for this app. Set
  `idleTimeoutMillis` low, so idle instances release their connections.
- **Storage.** 1 GB holds both databases: preview and production share the disk. Per-user caps (section e) keep one account from filling it.
- **Power-off.** While the service is off, **nobody can sign in or sync until you power it on by hand.** The app itself is unaffected (sign-in is
  optional).
  - The API answers 503 within about 5 s (`connectionTimeoutMillis`), and Settings shows "Can't reach the server right now".
  - Recommendation: accept this for v1. Watch for Aiven's notice, and move to a paid tier if it becomes a nuisance.
  - I do not recommend a keep-alive cron to dodge the rule.
- **Two databases.** `defaultdb` (production) and a new `quran_preview`, in one service. In 17A, create a separate application role per database
  rather than using `avnadmin` (smaller exposure, and it limits the damage of the leaked password).
- **Region.** Read the service's cloud and region in the Aiven console and set Vercel → Settings → Functions → Region to the closest one. Vercel's
  default for new projects is Washington, D.C. (`iad1`).

### Cloudinary signed uploads (the "Generating signatures" docs)

- **The server signs.** It signs every upload parameter sent except `file`, `cloud_name`, `resource_type` and `api_key`.
- **How the signature is built.** The `name=value` pairs are sorted by name and joined with `&`, then the API secret is appended and the result hashed.
  SHA-1 is the SDK default, and SHA-256 is supported: set `signature_algorithm: "sha256"`, and ask Cloudinary to accept SHA-256 only.
- **Lifetime.** **A signature is valid for one hour from its `timestamp`.**
- **SDK helper.** `cloudinary.utils.api_sign_request(params, secret)`.
- **The browser's part.** It POSTs `file`, `api_key`, `timestamp`, `signature` and the same signed fields to `https://api.cloudinary.com/v1_1/<cloud>/image/upload`.
- **Parameters we sign.**
  - `public_id=avatars/<userId>`, `overwrite=true` and `invalidate=true`.
  - `allowed_formats=jpg,png,webp`.
  - An incoming transformation that crops to a 256 px square.
  - Size cannot be signed. The page checks the file is under about 2 MB, and a **signed upload preset with a size limit in the console** is the
    second layer the brief asks for. There is no unsigned preset.
- **Environment variables.** Your local `.env` appears to use the SDK's single `CLOUDINARY_URL`, while the brief names three variables.
  - I recommend the brief's three names: they are explicit in private `runtimeConfig`, and none is public.
  - `CLOUDINARY_URL` would also work. Pick one in 17F.

### Email for verification and reset (open item 1): the main new finding

- **Resend's free tier.** It sends 100 emails a day and 3,000 a month. **Without a domain you have verified, it sends only to your own account
  address** (`onboarding@resend.dev`).
- **No usable domain.** The app has no domain of its own, and a `*.vercel.app` address cannot be verified as a sending domain.
- **What that means.** Resend with no custom domain gives real users **no** verification or reset mail. Section 8 lists the options.

## d. Service worker: `/api/*` and `/api/auth/*`

**What is there now (`nuxt.config.ts`, the `pwa.workbox` block).**
- `navigateFallbackDenylist: [/^\/api\//, /^\/robots\.txt$/, /^\/sitemap\.xml$/]` has been there since Phase 0. A navigation to `/api/...` is not
  answered with the shell. That includes Google's redirect back to `/api/auth/callback/google?...`.
- **No runtime rule matches a same-origin `/api/` request.** The rules match `wajibat-data-*.js`, `?offline` audio, `quranapi.pages.dev` and audio. A
  request that no route matches is not answered by Workbox, so it goes to the network as if there were no worker. So `/api/auth/*` already bypasses
  the worker, and **no change in behaviour is needed**.
- Users on an older worker (`registerType: "prompt"`) have had the same denylist since Phase 0.

**Changes (17A).** These lock the behaviour in place.
1. **Keep the denylist and comment it.** It is load-bearing for OAuth callbacks and for every JSON route.
2. **No runtime rule may ever match `/api/`.** A unit test imports the workbox block and checks two things.
   - Each `urlPattern` is run on `https://<origin>/api/sync/pull`, `/api/auth/get-session` and `/api/auth/callback/google?code=x&state=y`. None may
     match.
   - The denylist matches all three paths.
3. **`routeRules: { "/api/**": { headers: { "cache-control": "no-store" } } }`.** No HTTP cache, and no worker added later, may keep a session or sync
   answer.
4. **A browser test with the real worker.** It runs in the existing "worker allowed" style (`e2e/offline.spec.ts`), with a controlled page.
   - `page.goto("/api/health")` returns JSON, never the shell. `response.fromServiceWorker()` is false, and the body is not HTML.
   - `fetch("/api/auth/get-session")` from the page also returns false for `fromServiceWorker`.
   - Offline, `/api/health` fails as a network error. It does not show the app shell.
5. **17F only.** A `CacheFirst` rule for `res.cloudinary.com/<cloud>/image/upload/*/avatars/*` (cache `quran-avatar-cache`, 2 entries). The image URL
   carries Cloudinary's version (`v<n>`), so a new photo is a new URL. Nothing is added to the precache.

## e. Prisma schema and payload schemas

```prisma
// prisma/schema.prisma (generated client goes to server/generated/prisma, gitignored; prisma generate runs in postinstall)
generator client {
  provider = "prisma-client"
  output   = "../server/generated/prisma"
}
datasource db {
  provider = "postgresql" // URL in prisma.config.ts
}

// ---- Better Auth's models: written by its CLI (npx auth@1.7.16 generate), shown here in outline only ----
// User { id, name, email @unique, emailVerified, image?, createdAt, updatedAt, sessions[], accounts[] }
// Session { id, token @unique, userId, expiresAt, ipAddress?, userAgent?, ... }   (onDelete: Cascade)
// Account { id, userId, providerId, accountId, password? (scrypt hash), ... }       (onDelete: Cascade)
// Verification { id, identifier, value, expiresAt, ... }
// RateLimit { id, key @unique, count, lastRequest }                                  (storage: "database")
// Added to User through user.additionalFields (17F): avatarPublicId String?, avatarVersion Int?

model SyncRecord {
  userId    String
  namespace String   // allowlisted (app/lib/sync/namespaces.ts), e.g. "library.item"
  recordKey String   // e.g. "ayah:2:255", "2026-11-04@<deviceId>", "singleton"; at most 128 chars
  payload   Json?    // null when deleted
  schemaVer Int      @default(1)
  revision  BigInt   // from SyncCursor, unique per user
  updatedAt DateTime @default(now()) @updatedAt // server time
  deletedAt DateTime?                            // tombstone
  bytes     Int      // payload size, for the per-user cap
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, namespace, recordKey])
  @@index([userId, revision])
}

model SyncCursor {            // one row per user: the revision counter and usage
  userId   String @id
  revision BigInt @default(0)
  bytes    Int    @default(0)
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Why there are two changes to the brief's model.**
- **`SyncCursor`.** It gives a per-user counter that is safe under concurrency: `UPDATE … SET revision = revision + n RETURNING revision` inside the push
  transaction. The row lock orders two devices' pushes. A global sequence would also work, but it exposes activity across users. The row also tracks
  bytes for the cap.
- **`onDelete: Cascade` from `User`.** Deleting the user removes every sync row in the same statement. Account deletion then cannot leave orphans.

**The API (all routes require a session).**
- **Scope.** Every query is scoped by `userId` from `auth.api.getSession`, never from the body.
- **Flag off.** All routes answer 404 when the server's sync flag is off.
- **Routes.**
  - `GET /api/health`: `{ ok, db: "up" | "down" }`. It runs `SELECT 1` with a short timeout and returns no personal data.
  - `GET /api/sync/pull?since=<rev>&limit=500`: the records after the cursor, in revision order, and `{ next, more }`. `BigInt` values go out as
    strings.
  - `POST /api/sync/push` with `{ deviceId, ops: [{ namespace, recordKey, baseRevision, payload | null }] }`.
    - **Optimistic per-record check.** An op whose record has moved past its `baseRevision` is refused as `stale`, and the rest are applied.
    - **What the client then does.** It pulls, merges by the namespace's rule, and retries. The server never needs to understand a payload to merge
      safely: union and monotone merges happen on a client that has seen the latest value.
    - **LWW ops** may send `baseRevision: "*"` (no check).
  - `DELETE /api/sync`: removes every synced record. It is used by "Remove synced data" and by account deletion.
- **Caps (proposed).**
  - Per request: 256 KB and 500 ops.
  - Per record: 16 KB. A `library.meta` record that holds a long note is the largest normal case.
  - Per user: 5 MB in total. That is about 200 full accounts in the 1 GB disk; real accounts are far smaller.
  - The routes are rate-limited: 30 pushes and 60 pulls a minute per user, in the database rate-limit table.

**Payload schemas.** Zod 4, `.strict()` (unknown fields refused), one schema per namespace, in `app/lib/sync/namespaces.ts`. The server and client
share them, and the file has no Nuxt imports, so Vitest runs it. `payload` is the record's value; a tombstone has `payload: null`.

| Namespace | Payload |
|---|---|
| `library.item` | `{ addedAt: int ≥ 0 }`, with the item key validated by the Library's own key parser (`lib/libraryItems.ts`) |
| `library.meta` | `{ note: string ≤ 10 000, tags: string[] ≤ 50 (each ≤ 50), collectionIds: string[] ≤ 100, updatedAt: int }` |
| `library.collection` | `{ name: 1–80, description: ≤ 500, createdAt: int }` |
| `library.rest` | `record<string, json>`, ≤ 4 KB (fields we do not know: kept, not interpreted) |
| `progress.lastRead` | `{ surahNo: 1–114, ayahNo: ≥ 1, surahName, surahNameArabic, totalAyah, updatedAt }`, ayah within that surah's count |
| `progress.readSurah` | `{ completedAt: int }`, key 1–114 |
| `progress.pin` | key `reading`: `{ surahNo, ayahNo, pinnedAt }`; key `page`: `{ pageNo: 1–604, pinnedAt }` |
| `progress.goal` | the legacy goal object (`id, type` ∈ 5 types, `label, startDate, targetDate, dailyAyahTarget, startAbsoluteAyah, preferredDays, status` ∈ 4, `createdAt`), plus a `rest` passthrough ≤ 2 KB |
| `progress.goalActive` | `{ id: string \| null }` |
| `progress.goalLog` | `{ ayahs: "s:a"[] ≤ 6236 }`, key `YYYY-MM-DD` |
| `progress.hifzTarget` / `.hifzAyah` / `.hifzJoin` | the legacy `HifzTarget` / `HifzAyahState` / `HifzTransitionState` field by field (grades ∈ `again, good, easy`, strengths ∈ 5), plus `rest` |
| `progress.hifzActivity` | `{ newAyahs, revisions, recoveredAyahs, recoveredTransitions, assessments }`, ints ≥ 0, key `<date>@<deviceId>` |
| `progress.hifzWords` | `{ words: record<"<i>", { word, slipDays: date[], cleanDays: date[], last: date \| null }> }` |
| `progress.tasbeeh` | `{ count, target, cycles }` ints ≥ 0; `progress.tasbeehTotal`: `{ lifetime: int ≥ 0 }` |
| `progress.story` | `{ chapter: int ≥ 0, read: int[], updatedAt }` |
| `progress.personStudy` | `{ lastSection, passageView, lastSurahNo, lastAyahNo, updatedAt }`, as the legacy helpers write it |
| `progress.ramadanStart` | `{ startOverride: date \| null }`; `progress.fast`: `{ status: "fasted" \| "missed" \| "planned" }` |
| `progress.reminder` | the legacy reminder, with `repeat?` as Phase 15 defines it |
| `settings` | per record name: an enum or a number range taken from `lib/preferences.ts` (for example `fiqh` ∈ `sunni, jafari`; `arabicFontScale` in its clamp range; `marja` ∈ `MARJA_IDS` or null). Raw keys are carried as `{ raw: string }`. |
| `account.categories` | `{ library: bool, progress: bool, settings: bool }`: the toggles belong to the account, so each device follows them; always synced |

**How the client fits in (17C).**
- **One hook.** `setRaw` and `remove` in `lib/storage.ts` call one listener slot with the key. With the flag off the slot is empty, and no sync code is
  even loaded (dynamic import).
- **Turning a change into ops.** The engine projects a changed key into records, compares them with the last-synced hashes in `quran-sync-db`, and
  queues ops. After a 2 s debounce, or on sign-in, focus or `online`, it pulls, merges, applies through the owner file's write function, and pushes.
- **One tab at a time.** Only one tab flushes (`navigator.locks`).
- **Open pages.** Stores holding state in memory get a `reloadFromStorage()` after a pull. This also fixes changes from a second tab, which today are
  not picked up either.
- **Client clocks.** They are never compared across devices.
- **First sign-in on a device with data.**
  1. Take a snapshot of every key in an enabled category.
  2. Pull everything, merge by the rules above, and write locally.
  3. Show "Added 12 bookmarks from this device, 5 from your account" with **Undo**. The push waits until the Undo window closes.
  4. Undo restores the snapshot, turns sync off on this device and leaves the account as it was.
- **Sign-out** keeps local data and clears the queue.

## f. Test plan

**Rule: no test touches Aiven, Cloudinary, Google or Resend.** Three layers make sure of it.
1. `forbidRealApis` (`e2e/mocks.ts`) adds `*.aivencloud.com`, `api.cloudinary.com`, `res.cloudinary.com`, `accounts.google.com`,
   `oauth2.googleapis.com` and `api.resend.com` to its blocked hosts.
2. **Playwright's `webServer.env` sets `DATABASE_URL=postgres://blocked.invalid:5432/none`** and blank Cloudinary and Google values. The Nitro server
   under test can then reach no real service, even if your `.env` has real values. Nitro loads `.env` in `nuxt dev`, and the build may have read it,
   so the test server's own environment overrides it.
3. A unit test fails if any test file imports `server/utils/db.ts` without the fake repository, or if `.env` values could leak into a test (the Vitest
   setup clears `DATABASE_URL`, `BETTER_AUTH_SECRET`, `CLOUDINARY_*`, `GOOGLE_*` and `RESEND_*`).

**Unit tests (Vitest), in `tests/`.**
- **Merges** (`app/lib/sync/merge.ts`, pure). For every namespace:
  - The merge is commutative and idempotent, and order-independent on random histories (the same style as `tests/hifzParity.test.ts`).
  - A tombstone beats only the adds it saw.
  - Monotone values never go down.
  - Clock skew: one device's clock is 3 days wrong, and the result is unchanged.
  - An offline edit conflicts with a newer server value.
  - First sign-in: empty device or empty account, both non-empty, and Undo restoring the exact snapshot (byte-identical raw values).
- **Adapters.** For each key: project then apply round-trips the exact legacy shape and keeps unknown fields. Raw keys stay raw.
  `tests/legacyStorage*`-style fixtures from the vendored legacy composables prove the legacy app still reads the result.
- **"Never" keys.** A generated op stream from a fully populated storage contains no record from a `never` key. `notificationsEnabled`, coordinates and
  the downloads manifest are checked by name.
- **The inventory guard** (section a). Every key literal in `app/` is classified.
- **Zod schemas.** Unknown fields are refused, size caps hold, and the edges are tested (surah 0 or 115, a bad date, too many tags).
- **Server routes.** The handlers are written over a small repository interface (`server/utils/syncRepo.ts`). Tests use an in-memory fake of it and a
  fake `getSession`. No Prisma client, Docker or Postgres is needed.
  - 401 without a session. `userId` from the body is ignored.
  - Revisions keep rising under interleaved pushes. A stale op is refused while the rest apply.
  - The caps, the namespace allowlist, and 404 with the flag off.
  - Deleting removes everything.
- **One thin Prisma check.** The Prisma repository's queries are checked with a mocked client to confirm each one is scoped by `userId`.
- **Better Auth configuration.** Rate limiting is in the database. Cookies are httpOnly, Secure and SameSite=Lax. The Google profile is mapped with no
  image. `trustedOrigins` contains no bare `*.vercel.app`. Password lengths are the defaults. Each of these is checked from the exported options object.
- **The service-worker unit test** (section d, item 2).

**Browser tests (Playwright).**
- **The flag-off test.** This is the main e2e build, the same as production today. It walks Home, the reader, Library, Settings and Hifz, records every
  request, and expects **zero** to `/api/sync`, `/api/auth` or `/api/avatar`. No Account section appears, and no auth code chunk is loaded.
- **The flag-on build.** The flag is read at **build time**, because the prerendered pages (`/`, `/about`, `/surah-listing`) carry the runtime config
  in their HTML, so the sync tests need a second build.
  - Proposal: `npm run build:sync` writes `.output-sync`, served on port 3012. Only the sync spec files run against it, as `npm run test:sync`, which is
    added to `verify` after the main e2e.
  - Its cost is measured in 17A. If it adds more than about 4 minutes, I will report that before deciding.
- **Mocking the API.** `mockSyncServer(context)` in `e2e/mocks.ts` answers `/api/sync/**` with an in-memory server that follows the same rules (cursor,
  stale ops, tombstones). `mockAuth(context)` answers Better Auth's endpoints with recorded response shapes: `get-session`, `sign-in/email`,
  `sign-up/email` and `sign-out`.
- **Two "devices".** Two browser contexts share one `mockSyncServer`.
- **What the browser tests cover.**
  - Signing in and up with email (mocked).
  - The category sheet shown once.
  - The first-sign-in summary and Undo.
  - An offline edit, then `online`, then a flush.
  - Two contexts converging on bookmarks, notes, read surahs and tasbeeh totals.
  - A failed server (503) giving "Can't reach the server right now" with the app unaffected.
  - Delete account with a typed confirmation.
  - The keyboard pass and axe on the Account section (`test:a11y`).
- **The service-worker test** (section d, item 4).
- **Google sign-in** is not run in the browser tests. Only the redirect URL it builds is checked. It is tested by hand on localhost and production.

**Manual checks.** On a Vercel preview with `quran_preview`, written as a checklist in each sub-phase doc and reported only when witnessed:
- Sign up, sign in and sign out.
- Two browsers syncing.
- An offline edit.
- An Aiven power-off: shown honestly.
- Delete account: the rows are gone, checked with a count query in the Aiven console.
- 17F: the avatar uploaded, replaced and deleted in the Cloudinary console.

**Counts.** 972 unit and 772 browser tests must not go down. Every sub-phase reports the new counts from its own verify.

## g. Sub-phases

Every sub-phase follows one cycle: its own branch, a short plan note, build, a full `npm run verify` on Node 22 (shell opened at `C:\…`), a preview,
your acceptance and then the merge. **Every sub-phase ends with a stop for you.** **(you)** marks the ones that also need you to act on an outside
service.

| Phase | Delivers | Exit criteria | Your part |
|---|---|---|---|
| **17A** Foundation | Exact pins (`prisma@7.10.1` and the rest); `prisma.config.ts`; the schema with `SyncRecord`/`SyncCursor`; `server/utils/db.ts` (lazy, `max: 1`, timeouts); `postinstall: nuxt prepare && prisma generate`, with `tests/independence.test.ts` updated; `/api/health`; `NUXT_PUBLIC_SYNC_ENABLED` (build time) plus a server flag; the SW tests (section d); `no-store` on `/api/**`; `forbidRealApis` and the Playwright env guard; `build:sync` and `test:sync` measured; DEPLOY.md env and DB sections; fix the stale CLAUDE.md line (`quran-revamp-db` is at version 4) | Clean-checkout `npm ci && npm run build` with **no** `DATABASE_URL` passes; `/api/health` says `db: "up"` on a preview against `quran_preview`; the flag-off test passes; the production deployment (flag off) behaves exactly as today (smoke test, 21 of 21) | **(you)** Rotate the leaked secrets; create `quran_preview` and two app roles; set `DATABASE_URL` per Vercel environment; set the function region; run `prisma migrate deploy` against each database (or approve me running it with the preview URL in my shell, never printed) |
| **17B** Auth | Better Auth (email and password, Google), its tables and a migration, database rate limiting, the Account section in Settings plus a quiet header-menu entry (sign in, sign up, sign out, delete account with a typed confirmation), the email provider if approved | Sign-up, sign-in and sign-out on localhost and a preview (email) and production (Google, flag still off for users: see item 9); the rate-limit test; the Google profile stores no image; the Account section passes the keyboard and axe checks | **(you)** Create the Google OAuth client (redirects: `http://localhost:3001/api/auth/callback/google` and `https://quran-app-znfc.vercel.app/api/auth/callback/google`); set `BETTER_AUTH_SECRET` and the Google keys; the email decision |
| **17C** Sync engine | `quran-sync-db`, the outbox, the cursor pull and batch push with stale retry, `navigator.locks`, the storage hook, `reloadFromStorage`, the namespace allowlist and zod schemas, the first-sign-in merge with Undo, the category toggles and the sheet shown once | All merge and adapter unit tests; the mocked two-context browser tests show no data loss; flag-off still makes zero requests | stop only |
| **17D** Library sync | `library.*` namespaces wired | A two-browser manual check on a preview; the Phase 6 "keeps the note" rule holds across devices (a test removes the item on A, edits the note on B, and both converge with the note kept) | **(you)** The two-browser check |
| **17E** Progress and Settings sync | The remaining namespaces; the inventory guard; the "never" proof | Every key in section a has a test; no `never` key appears in any payload; Hifz parity unchanged; the full manual checklist on a preview | **(you)** The checklist; the decision to turn the flag on in Production |
| **17F** Avatar | Only after the `DECISIONS.md` amendment: `POST /api/avatar/sign`, the upload from the Account area, the monogram default, the SW cache rule, removal, cleanup on account deletion | A signed upload works; no unsigned preset exists; the monogram shows offline and when there is no photo; deleting the account removes the image (checked in the console) | **(you)** Approve the amendment; create the signed upload preset with its limits; set the Cloudinary variables (rotated) |

## h. Conflicts and open items

### Conflicts with `CLAUDE.md` and `DECISIONS.md` (which win until you change them)

1. **The avatar.** `DECISIONS.md` §1: "No depictions of any person (… silhouettes, **avatars**)". CLAUDE.md rule 7 says the same. A user's own photo
   contradicts both, so 17F is blocked until §1 is amended. The amendment in brief §3 fits. **Recommendation: approve it with one tightening.** The
   default monogram is **geometric** (an 8-point star tinted from the account id). A monogram drawn from Arabic letters would need a rule for Latin and
   other names, and app code holds no typed Arabic script (it builds the few Arabic labels it needs from code points, as Daily Fiqh does).
   **Also amend CLAUDE.md rule 7.**
2. **"Only 'Clear all data' asks first"** (`DECISIONS.md` §1, CLAUDE.md rule 7, "except for wiping all data"). Delete account also asks, with a typed
   confirmation. **Recommendation: amend both to "Clear all data and Delete account".** It is a wipe of the same kind.
3. **Clear all data** (`DECISIONS.md` Phase 2: "legacy parity plus deleting `quran-revamp-db` only").
   - With sync on, clearing only local data while staying signed in would pull everything back on the next sync.
   - **Recommendation (open item 5): Clear all also signs this device out and deletes `quran-sync-db`.** The account's data stays on the server, and the
     dialog says so in one sentence. Deleting it is the separate action in the Account section.
   - This changes the Phase 2 decision, so it needs your approval.
4. **The outbox in `quran-revamp-db`** (brief §7.2) against the rollback release rule (`DEPLOY.md` §6, `DECISIONS.md` storage rules). Recommendation:
   **a separate `quran-sync-db`** (section a).
5. **"Pure logic in `app/utils/`"** (brief §10). The revamp keeps pure code in `app/lib/` (`app/utils` would be auto-imported by Nuxt and confused with
   `@legacy/utils`). Recommendation: **`app/lib/sync/`**.
6. **The install hook.** `tests/independence.test.ts` pins `postinstall` to exactly `nuxt prepare`, and `DEPLOY.md` §1 says so. 17A changes both to
   `nuxt prepare && prisma generate`, deliberately.
7. **Icons.** CLAUDE.md rule 2: Lucide only, bundled. Google's sign-in button guidelines require Google's own "G" mark. **Recommendation: allow that
   one mark as a local SVG** (bundled, not from a CDN) on the Google button only. Otherwise the button would be text-only, which Google's branding rules
   may not accept.
8. **The phase merge rule.** `DECISIONS.md` (2026-10-28) says to merge into `chore/standalone-repo` and leave `main` untouched until cutover. Cutover
   has happened, and `main` is production (every push deploys). This needs a new rule (open item 9).
9. **Stale documentation, not real conflicts, fixed in 17A's docs.**
   - `DECISIONS.md` §2 "Hosting … moving the production domain": Phase 16 chose a new project with no domain move.
   - CLAUDE.md says `quran-revamp-db` is at version 2: it is 4.
   - `DEPLOY.md` §2 lists `NUXT_PUBLIC_SUPABASE_*` as not to copy, which is still correct.
10. **Brief §3 "storage keys follow `quran:<feature>:v1`".** `quran-sync-db` is an IndexedDB name, following the `quran-revamp-db` pattern, and the one
    new localStorage key follows the rule. No conflict, noted for completeness.

### The eight open items from brief §12, with recommendations

1. **The email provider.** Resend's free tier sends only to your own address unless you verify a domain you own, and a `vercel.app` address cannot be
   verified. The options:
   - **(a) Buy a domain** (it can also become the app's address later) and use Resend: 100 a day and 3,000 a month free.
   - **(b) Send from a Gmail account** over SMTP with an app password: no domain, low volume, plainer delivery. It needs `nodemailer` and two
     variables instead of `RESEND_API_KEY`.
   - **(c) No reset flow.** A forgotten password then means a lost account, unless the user also used Google.
   - **Recommendation: (a)** if you are willing to buy a domain, otherwise (b). **Not (c).** Without email verification, someone could sign up with a
     victim's address before the victim uses Google, and account linking would then join the two. That risk is why, with (c), automatic account linking
     must stay **off**.
2. **Google sign-in on previews.** **Accept localhost and production only.** Previews test email sign-in. Production keeps the user flag off until
   17E, and Google sign-in is tested there through a direct URL by you.
3. **Marja' and fiqh sync.** **Part of the Settings toggle** (as proposed). The toggle's description names "your Sunni or Ja'fari choice and marja'"
   in plain words. A separate toggle would add a choice few people want.
4. **Prayer city and coordinates.** **Never sync, including the city name.**
   - The city name alone is not enough: the prayer times need coordinates, so another device would have to geocode it again and could pick a
     different place.
   - The saved place is the most sensitive item in storage.
5. **"Clear all data" once synced.** It stays **local**, and it also signs this device out and deletes the sync queue (conflict 3). "Delete account and
   synced data" is separate, in Account, with a typed confirmation.
6. **The avatar amendment.** Approve it with the geometric default (conflict 1), and **no** automatic import of the Google photo: the provider maps no
   image, and a test proves it.
7. **The Aiven free plan.**
   - Its terms are listed in section c: 1 GB disk, 20 connections, no pooling, power-off when idle with no number of days, and Aiven may move the region.
   - **Recommendation:** accept for v1, with the honest "Can't reach the server right now" state and a 5 s connect timeout. Set the Vercel function
     region to match the region shown in the Aiven console. Reconsider a paid tier if power-offs annoy users.
8. **Supabase leftovers.** There is no code or configuration to remove (section b). 17A only updates two doc lines. Check your `.env` for old
   `NUXT_PUBLIC_SUPABASE_*` lines yourself.

### New items this plan adds

9. **How sub-phases reach `main` now that `main` is production.** **Recommendation:** each accepted sub-phase merges into `main` with `--no-ff`, with
   `NUXT_PUBLIC_SYNC_ENABLED` **off in the Production environment** and on in Preview. Each step is small and can be rolled back with Instant Rollback,
   and production users see nothing until you turn the flag on after 17E (a redeploy). The alternative, one long-lived `phase-17-account-sync` branch
   merged once, drifts from `main`.
10. **Rotate the two secrets** pasted on 2026-11-04 before 17A (see the top of this plan).
11. **Reminders and search history.** Recommendation: reminders in Progress, search history never (section a).
12. **Field-level or record-level LWW for Library notes and tags.** Recommendation: record-level for v1.
13. **The second build for the sync browser tests** (`.output-sync`, port 3012). Recommendation: yes, if 17A measures it at about 4 minutes or less.

### New wording

Every user-facing sentence written for this phase goes into `docs/CONTENT_TO_VERIFY.md` before it ships:
- the Account section;
- the category descriptions;
- the first-sign-in summary;
- "Can't reach the server right now";
- the delete-account confirmation;
- the one sentence on what is stored.

The wording stays neutral: no streak, nag or guilt.

### Rollback

- **The flag.** Turning `NUXT_PUBLIC_SYNC_ENABLED` off and redeploying removes every request and the Account section. Local data is never deleted by
  sync.
- **Migrations.** They are additive. A destructive one needs its own approval.
- **Instant Rollback** to a pre-17 deployment is safe: `quran-revamp-db` is untouched, and the unused `quran-sync-db` is simply ignored.

---

Sources: [npm registry](https://registry.npmjs.org/) (versions above);
[Prisma: Upgrade to v7](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7);
[Prisma: Nuxt guide](https://www.prisma.io/docs/guides/nuxt) (now the 8.x scaffold);
[Better Auth: Nuxt](https://www.better-auth.com/docs/integrations/nuxt), [Prisma adapter](https://www.better-auth.com/docs/adapters/prisma),
[Rate limit](https://www.better-auth.com/docs/concepts/rate-limit), [Email & password](https://www.better-auth.com/docs/authentication/email-password),
[Options](https://www.better-auth.com/docs/reference/options);
[Aiven: PostgreSQL free tier](https://aiven.io/docs/products/postgresql/concepts/pg-free-tier),
[Aiven blog: free plans](https://aiven.io/blog/free-plans-postgresql-mysql-redis);
[Cloudinary: authentication signatures](https://cloudinary.com/documentation/authentication_signatures);
[Resend: sending limits](https://resend.com/docs/knowledge-base/resend-sending-limits),
[Resend: account quotas and limits](https://resend.com/docs/knowledge-base/account-quotas-and-limits).
