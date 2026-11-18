# Page: Admin (/admin)

Only with sync on. **One read-only view, "All users", for a super admin.** Not linked from anywhere, not in the sitemap, `noindex`. Offline level: **C**.

- A visitor who is not signed in sees a sign-in form (no "create account" link). A signed-in user who is not a super admin sees only "Page not found" (the API answers 404).
- A super admin sees a table: name, email (and "unconfirmed"), role, sign-in method, joined, and records and size synced. Paged by 50. Nothing a user synced is ever shown, and nothing on the page changes anything.
- The role is granted only by `node scripts/make-super-admin.mjs <email>` (DEPLOY.md, section 8).
- **Tests:** `e2e/account.spec.ts` (admin group), `scripts/live/admin.live.mjs` (real database).
