# Page: Literary modules (/poets, /poets/[slug]): a stub

- Routes: `/poets`, `/poets/[slug]` (legacy, kept; every slug shows the same stub)
- Phase: 16 (cutover; owner decision 2026-10-29)
- Prototype section: none.
- Offline level: **A.** Static.
- Indexable: no (`robots: noindex`).

## Purpose

The legacy module (Mir Anis) is 278 KB of Urdu verse that its own data labels "seed data, not yet fully verified", so it is not rebuilt for cutover. The routes stay alive and say so; **nothing from the legacy module is shown**. Building Poets is a later phase with a content review.

## Layout

"Literary modules", "Literary modules are not in this version yet. Your setting is kept.", links to Home and the Sitemap. The setting (`quran:additional-modules-enabled:v1`) and the sidebar row it turns on are unchanged; the Sitemap lists nothing for Poets.

## Tests

`tests/legacyRoutes.test.ts` (the stub shows nothing of the legacy module), `e2e/routes.spec.ts` (`/poets`, `/poets/mir-anis` and any slug show the stub with `noindex`; nothing of the legacy module on the page).
