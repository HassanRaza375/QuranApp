# Page: Page not found (the catch-all)

- Routes: any address that is not a page (`app/pages/[...slug].vue`)
- Phase: 16 (replaces "This page is not rebuilt yet", which existed while legacy routes were still being rebuilt)
- Offline level: **A.** Static.
- Indexable: no (`robots: noindex`). A single-page app answers 200 for any address, so the page says plainly that nothing is here and tells search engines not to index it.

## Layout

"Page not found", "There is no page at <the address>.", and three links: Home, Search, the Sitemap. Every legacy route has a page, a redirect (`/juz/<n>`) or a stub (`/poets`), so only a mistyped or old address lands here (`tests/legacyRoutes.test.ts` and `e2e/routes.spec.ts` open all 51 legacy routes and fail if one lands here).

## Tests

`e2e/routes.spec.ts`, `e2e/foundation.spec.ts` (an unknown address), `e2e/offline.spec.ts` (a new tab opened offline at an unknown address).
