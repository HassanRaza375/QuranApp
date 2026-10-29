# Page: /juz/[id] (a redirect)

- Routes: `/juz/[id]` (legacy, kept)
- Phase: 15
- Prototype section: none (decided in `DECISIONS.md`: there is no separate full-juz reader).
- Offline level: **A.** The starts of the 30 juz are bundled; nothing is requested.
- Indexable: no.

## What it does

`/juz/<n>` for 1 to 30 opens the surah reader at that juz's first ayah (`/surah/<s>#ayah-<a>`, the same place the Juz tab sends you) and **replaces** the address, so Back does not come back to a page that only redirects. Anything else (`0`, `31`, `abc`, `1.5`) goes to the Juz tab (`/juz`). A route middleware does it (`app/pages/juz/[id].vue`); the target is `lib/juzRedirect.ts`, from the same table as the listing (`lib/quranMeta.ts`).

The legacy page was a full-juz reader (a whole juz's text on one page, fetched from `alquran.cloud`); it is not rebuilt.

## Tests

`tests/juzRedirect.test.ts` (4: all 30 juz, a juz that starts partway down a page, invalid ids, a repeated parameter), `e2e/smallpages.spec.ts` (the reader opens at the ayah and Back goes to `/juz`; juz 1, 2 and 30; invalid numbers).
