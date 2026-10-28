# Decisions log

Every decision made while designing and building the revamp, with the reason. Phase docs hold the detail of each build; this file is the one place to see what was decided and why. When a decision changes, edit it here and say why.

## 1. Product and design principles

- **Direction: "Night Study".** An ink-and-paper look, dark mode fully designed, **light by default** on first launch. Both modes share one personality; dark is not an inversion.
- **Scripture is never boxed in a card.** Ayahs sit on the page with hairline dividers. Cards are for widgets, progress and reference items.
- **One accent does the interactive work** (`#2B6777` light, `#5CA0AF` dark; chosen to stay close to the legacy brand blue `#13547A` and to avoid a generic green). **Gold is reserved for verse-end markers** (and later Hifz mastery). The sidebar's active marker uses the accent, not gold.
- **Borders over shadows.** Shadows only on floating layers (menus, sheets).
- **Arabic is the most cared-for text:** larger, generous line height, never letter-spaced, follows the user's Arabic size setting.
- **Navigation is grouped by intent:** Read, Study (Library, Downloads, goals, Hifz), Knowledge base, Worship, optional Literary modules; Settings and About pinned at the bottom. One row per real destination, with 16px Lucide icons.
- **Responsive menus:** popover on desktop, bottom sheet on mobile. **Undo instead of confirm** for removals; only "Clear all data" asks first.
- **Quiet progress.** No streaks, badges, points, flames or guilt wording anywhere.
- **No depictions of any person** (prophets, companions, angels, family, silhouettes, avatars). Calligraphy, places, objects and geometry only.
- **Both traditions, honestly.** Sunni and Ja'fari are a user setting. Where practice differs, show both and say which one the user follows. Never state a ruling as app advice; say "follow your own marja' or local scholar".
- **Content integrity.** Qur'an text, translations, tafsir, audio and prayer data come only from the legacy services and data files. Anything we wrote ourselves (labels, notices, summaries) is flagged in `CONTENT_TO_VERIFY.md`.

## 2. Technical decisions

- **Stack:** Nuxt 4, Vue 3, strict TypeScript; shadcn-vue (`shadcn-nuxt`, Reka UI); Tailwind CSS v4 via `@tailwindcss/vite`; Pinia; `@nuxt/icon` with Lucide bundled locally; self-hosted fonts; `@vite-pwa/nuxt` (Workbox); Vitest and Playwright; npm; Node 22.
- **Rendering:** SPA (`ssr: false`) by default, because offline then works from one precached app shell. Basic SEO only: a title and description per page, a default share image, `robots.txt` with noindex on personal pages, a small sitemap. The attempt to prerender Home, About and the Surah listing under global SPA mode only produced per-page head tags (no per-route SSR), which is enough for link previews.
- **Offline model:** level A (works offline by nature: Tasbeeh, Sajda, Asma-ul-Husna, Settings, Library, bundled knowledge data), level B (after first use or download: Qur'an text and tafsir, prayer times, audio), level C (online only: search, un-downloaded audio, live corrections). Each page declares its level and its offline state.
- **Storage:** same keys and formats as the legacy app, so users keep their data at cutover. Several keys are raw strings, not JSON (`prayerFiqh`, `themeMode`, `preferredVerseDisplay`, `translationDefaultLang`, `tafsirDefaultAuthor`). The fiqh key is `prayerFiqh`, values `sunni` and `jafari`; the prototype's `shia` is never stored. New keys follow `quran:<feature>:v1`, are additive and tolerated by the legacy parser.
- **IndexedDB:** all new data lives in a separate database, `quran-revamp-db`. `quran-app-db` is never opened or version-bumped, so rolling back to the legacy app stays safe.
- **Prayer times:** monthly AlAdhan calendar cached in `quran-revamp-db`, keyed by rounded latitude and longitude, method, school and month. Fetch first, replace only on success. An **Update now** action exists on the Prayer page and in Settings. Hijri adjustment is applied in the app and never enters a cache key. Local calculation is a later fallback only.
- **Hosting:** a separate GitHub repository and a separate Vercel project, then moving the production domain at cutover. The legacy project stays as rollback for a few weeks. The new service worker keeps the same file name and scope (`sw.js`, `/`), `clientsClaim` and `cleanupOutdatedCaches`.
- **Server proxies** copied from the legacy app are unused; drop them at cutover.
- **Legacy code:** vendored into `legacy/` as a read-only snapshot, synced only by `scripts/sync-legacy.mjs`. The build never calls it.

## 3. Phase-by-phase decisions

**Phase 0 (foundation).** Hand-rolled no-flash theme script (reads the raw `themeMode`); `--ink-3` is non-text only (all readable text uses `--ink-2`); keep the manifest identity and cache names; match the legacy `registerType: prompt` with an update toast; Node 22; `/surah-vedios` and `/sitemap` deferred to Phase 15 with unchanged routes.

**Phase 1 (Home).** Dropped the Islamic event card, Ramadan card, goal streak and pace, Hifz minutes and quick-link grid. Today's goal is an ayah count only. Resume rows read legacy reading progress and the persons-study record. Ayah of the day: all ayahs of 15 to 250 Arabic characters, chosen deterministically from the local date (fixes the legacy UTC-date bug and invalid-ayah picks), no topic-based exclusions. No default city; location is read from `last_location` or requested on tap. Save writes the legacy bookmark keys; Share uses the Web Share API with a copy fallback.

**Phase 2 (Settings).** Eight sections. Clear all = legacy parity plus deleting `quran-revamp-db` only. Marja' picker under Prayer & location when Ja'fari is selected. Default translation "Not set" removes the key. `preferredVerseDisplay` is read-only. ISNA and Leva stay the default methods. Reset restores settings only, with Undo. Reminders only fire while the app is open, and the page says so in one fixed sentence. No `alert()`.

**Phase 3 (Surah listing).** Revelation-order sort left out (no data). Juz names left out. One "Last read" marker (legacy progress cannot express Completed). Name sort ignores the article ("Al-", "An-") and says so. Search ignores Arabic marks. A small real player store for per-row play.

**Phase 4A (reader).** The reader's own cache is in `quran-revamp-db`. Translation "Off" lives in `quran:reader-prefs:v1`. Pin uses `quran:pins:v1`. Completed marker uses `quran:read-surahs:v1` (explicit Mark as read with Undo; automatic only when the last ayah is reached and 90% were on screen for about 1.5 s). Goals log counts an ayah that was on screen for about 1.5 s (counts read higher than in the legacy app; do not merge counts across cutover; recalibrate pace in Phase 15). Bismillah is read from surah 1's data, never typed. One Share button with copy fallback.

**Phase 4B/4C (player).** No autoplay anywhere. Resume is a new feature (the legacy one never ran) and is never automatic. Reciter switch restarts the surah. "Save audio" stays disabled until Downloads (Phase 11); no offline-play claim. Per-ayah audio exists for all five reciters; queues (Play page, Stories Listen) preload one ayah ahead, retry a failed ayah once, then stop with Try again and Skip. Queue place uses `quran:audio-queue:v1`. Asma-ul-Husna clips exist for 96 of 99 names (#53, #93 and #97 return 404).

**Phase 5 (Prayer & Qibla).** One page, both routes kept. City search uses Open-Meteo geocoding (non-commercial terms; attribution shown), with a coordinates entry as fallback. Magnetic declination corrected with NOAA's World Magnetic Model (valid to 2030). Tag "Latest" for the most recent start time, never "Now". Compass aligned within 5 degrees, one vibration on entering alignment. Countdown in minutes. Arabic prayer names left out until a verified list exists.

**Phase 6 (Library).** Replaces Bookmarks on the same route. Removing an item keeps its note, tags and collections. All item types in the data are shown. Snippets come from cached text plus a small per-ayah request. Collections: delete with Undo, no rename. Library-only export; one Clear all in Settings.

**Phase 7A/7B (Prophets & People, Stories).** Stories own the journey; person, event and theme pages open into it. Chapters come only from real story data (episodes, else primary passages). "Arranged for study" notice for stories not fully told. Compare tellings lists only descriptions that exist. Lessons are per story and go on the end page. Story progress uses `quran:story-progress:v1`. The three relationship entries that follow the opposite convention stay as they are until cutover, when the whole dataset is normalised. `nuhflood` is shown with the "Arranged for study" notice until its status is decided.

**Phase 8A/8B (Ramadan, events).** Dates from the Hijri calendar service with the in-app adjustment. Only the 29 legacy events are shipped; a reviewed events file can be added later as data. No compare table, no fiqh-difference sentences, no Ja'fari Qadr nights until a reviewed source is supplied. Tracker labels are Fasted, Didn't fast, Planned. Reminders are list items only ("Saved to your list").

**Phase 9A/9B (Per page, Tasbeeh, Sajda, Asma).** Page text is built from the cached surah text, as flowing text (not line-for-line). No Hizb label. No obligatory/recommended labels or per-tradition text on Sajda. "After prayer" left out. Counts for "Count this name" live in `quran:tasbeeh:v1` under `name-<n>`.

**Phases 10 to 15 (prototyped 2026-10-22).** Two prototypes were agreed: `docs/design/prototype-remaining-pages.html` (Search, Downloads, the seven knowledge modules with list and detail pages, the five Daily Fiqh routes, Goals, Calendar) and `docs/design/prototype-hifz.html` (Hifz). They hold sample content only; every item is listed in `CONTENT_TO_VERIFY.md` and none of it ships. Still without a prototype: `/about`, `/sitemap`, `/surah-vedios`, `/poets`.
- **`/juz/[id]` redirects to the reader at the juz's first ayah.** There is no separate full-juz reader. Why: the Juz tab already opens the reader at the juz's first ayah (`app/lib/readerLinks.ts`), so an old link to `/juz/<n>` should land in the same place.
- **Hifz is redesigned** as a new simple mode (home with one plan and one Start button, a session of one-screen steps, a surah page), replacing the legacy dashboard design. **Grading comes from tapped word slips**, not from the legacy Missed / Got it / Easy buttons. Slipped words are stored in a new additive key, `quran:hifz-words:v1`. Kept from the legacy engine (`docs/legacy-reference/MODULE_BLUEPRINT.md`, Module 10): weak items come first; new ayahs pause when 3 or more are weak; free practice never touches the schedule; no scheduling internals (interval, ease, next review) are shown; no streaks. **Legacy Hifz data must keep working** (same keys and formats; the new key is ignored by the legacy app). **Slips map onto the legacy grade (decided 2026-10-22):** zero slips with no hints is `good`; one or more slips is `again`; `easy` is never set automatically, only by a small optional "This was easy" button shown after a clean recitation. **Read along highlights the whole ayah while it plays** (the app has per-ayah audio only); word-by-word highlighting waits until a source of word timings exists. The Hifz screens inside `prototype-remaining-pages.html` are the older design and are superseded; do not build them.
- **`/surah-audios/[id]` is open.** It is in neither prototype. Decide it in Phase 11 (Downloads and audio).
- **Real data wins over the prototypes.** Surah spellings, reciter names, Hijri dates, Daily Fiqh ids and counts, and every Arabic string come from the services and data files. The prototypes' versions were samples (`CONTENT_TO_VERIFY.md`).

**Phase 10, Search (plan approved 2026-10-22, with changes).** Plan: `docs/phases/phase-10-search-plan.md`.
- **Keep every legacy filter** (the 10 editions, one-surah and one-juz scope, bookmarked only, shareable URLs) behind one **Filters** control, so the search screen stays simple. The type chips (Ayahs, Surahs, People, Stories, Notes) stay visible.
- **History stays `string[]`, 15 at most, under `quran:search-history:v1`.** Rollback safety comes before the prototype's object format. It is saved only after a search succeeds (a request that returns results), never for a failed or empty one.
- **The three legacy bugs are fixed:** older requests are cancelled so they cannot overwrite newer ones (`AbortController`); history is saved only on success; a failure of the Juz scope is shown to the user. (The plan removes the Juz request altogether by computing the juz from the app's own tables, so it can no longer fail silently; any failure that remains is shown.)
- **Thresholds:** the local groups (Surahs, People, Stories, Notes) match from 1 character, instantly. The ayah search starts at 2 characters, after a pause of about 300 ms, with a loading state, at most 60 results shown with the true total, and a session cache keyed by query, scope and edition.
- **Result labels name the edition the search actually used.** The default English edition would be the reader's translation if the search API had it; it does not (checked 2026-10-22: the reader's English matches none of the API's 17 English editions on 32:10), so the default stays the legacy one (Pickthall) and the reader's translator is never shown next to other text. The reader's Urdu is identical to the API's Jalandhry edition, so that is the Urdu default.
- **Groups shipped now:** Ayahs, Surahs, People, Stories, Notes. Duas, the knowledge modules and Daily Fiqh join in Phases 12 and 13.
- **The "where your results fall" strip stays** if it costs little; it uses only the ayah positions already in the results. It was cheap, so it shipped, as the shared `QuranThread` component.
- **Defaults used for the questions that were not answered (2026-10-22), to change if you disagree:** a note opens the item it is on; the box shows the legacy page's eight suggested searches; the box is focused on desktop only (a phone keyboard would cover the page); history is saved after a successful search has settled for about 1.5 s, or at once on Enter or when a result is opened; the mapped fold is a twin of `normalize`, not a replacement (speed).
- **Decided after review (2026-10-22):** the Ayahs group is headed by the edition searched ("English: Pickthall", "Urdu: Jalandhry"), each result opens the reader at that ayah, and **no reader text is shown beside results** (this closes the question of result English differing from the reader's). The notes-open-their-item, legacy-eight-suggestions and desktop-only-focus defaults are approved. **Teh marbuta and heh are one letter in Search's device groups and in highlighting only** (not in the app's normaliser, not in the upstream's ayah search).

## 4. Deliberate content gaps

Ja'fari Laylat al-Qadr nights (19, 21, 23); the Sunni versus Ja'fari compare table and iftar/suhoor explanations; the Arabic of hadith duas; "After prayer" dhikr sequences; Arabic prayer names; revelation order; Juz names; translator and tafsir-school attribution; per-tradition event wording. Each becomes a data file once wording and a source are supplied.

## 5. Cutover checklist

- All legacy routes exist in the revamp (including `/surah-vedios`, `/sitemap`, `/about`, `/poets`), or the domain does not move.
- Remove `/foundation` and any placeholder pages.
- Compare the Ja'fari prayer times with an independent source.
- Normalise the relationship convention; decide `nuhflood`; review the status chips.
- Replace the vendored `sw.js` with the production one; keep the same name and scope. Add `robots.txt`, `favicon.png` and `favicon3.png`.
- Re-check the Open-Meteo terms (non-commercial only) if the app gains subscriptions or ads.
- Replace the World Magnetic Model before 2030.
- Drop the unused server proxies.
- Real-device checks (`DEVICE_CHECKS.md`) and a screen-reader pass.
- Manually test rollback: install the new app, then open the legacy site and confirm it still works.
- Move the domain, keep the legacy project untouched for a few weeks.
