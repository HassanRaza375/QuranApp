# Page: Account (Settings, Account)

Only with sync on (`NUXT_PUBLIC_SYNC_ENABLED`); otherwise the section does not exist and no account request is made. Offline level: **C** (online only; the app itself is unaffected). Address: `/settings?section=account` (`&mode=signup` or `signin` opens a form).

- **Signed out:** a short explanation that an account is optional, then Sign in and Create account (Google only when the server has its keys; Forgot password only when it can send email).
- **Signed in:** who you are and the default picture (a pointed arch with your initial), the photo controls (only when Cloudinary is set), "What syncs" with three switches (Library, Progress, Settings) that start unchosen, the last sync time and usage, Sync now, Sign out, Remove synced data (Undo), Delete account (typed word).
- **States:** loading, "Can't reach the server right now" (with Try again), accounts not available on this server.
- **Storage:** reads `quran:sync-prefs:v1`; writes it, and (through sync) the keys in `app/lib/sync/inventory.ts`. IndexedDB `quran-sync-db`.
- **Tests:** `e2e/account.spec.ts`, `tests/sync*.test.ts`, `scripts/live/*.live.mjs`.
