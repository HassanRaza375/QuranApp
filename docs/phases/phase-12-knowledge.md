# Phase 12: Knowledge modules (Peoples & Nations, Places, Themes, Duas, Events in the Qur'an, Signs & Miracles, Commands & Prohibitions)

- Branch: `phase-12-knowledge` (off `phase-11-downloads`)
- Date: 2026-10-26
- Status: **Built, awaiting your review.** Stage 1 (shared list, detail, graph, Peoples) was approved at the screenshot checkpoint; stage 2 (the other six modules, the Search groups, the Library kinds) is built. Verify result below.

## Goal

Rebuild the seven knowledge modules of the legacy app as one shared list page and one shared detail page over seven adapters, using the legacy data, search utilities and graph engine as they are, and add what links to them: the Library item types, the Duas and Knowledge base groups of Search, and the story and person links.

## Scope

- Pages and components built: 14 routes (`app/pages/<module>/index.vue` and `[id].vue`, each one line over `KnowledgeListPage` or `KnowledgeDetailPage`); `app/components/knowledge/` (`KnowledgeListPage`, `KnowledgeCard`, `KnowledgeTabs`, `KnowledgeDetailPage`, `KnowledgePassage`, `KnowledgeLinkGroups`, `KnowledgeTransliteration`).
- Prototype sections used: `prototype-remaining-pages.html`, `#/k/<module>` and `#/k/<module>/<id>`.
- Legacy code reused: all seven datasets, the seven `*Search.ts` and `*Validate.ts` utils and `graphIndex.ts`, vendored by `scripts/sync-legacy.mjs` (new in stage 2: Places, Themes, Duas, Events and Signs search and validators, Commands' validator). Nothing copied or edited.

## What was built

- **One shape, seven adapters** (`lib/knowledge/`): `KEntry` and `KAdapter` (`types.ts`); `makeAdapter` (`adapter.ts`) reads a typed reference first (`7:65`, `7.65`, `7 65`, `7:65-72`, validated against the real ayah counts) and otherwise hands the text and the kind chip to the module's legacy search; `peoples.ts`, `places.ts`, `themes.ts`, `duas.ts`, `events.ts`, `signs.ts`, `commands.ts`; `modules.ts` (titles, questions, bookmark prefixes, `KNOWLEDGE_READY`, now all true); `graph.ts` ("Connected", "Referenced by"); `queue.ts` (Play all); `searchProviders.ts` (Search).
- **Detail page:** head (Arabic first on a phone), basis tag only when the entry is not explicit, Save with Undo under the legacy key, Play all; Where it appears (`QuranThread` and direct mentions); The ayahs (the reader's Arabic and translation, passages over six ayahs collapsed); Also occurs at; module sections; Themes; Connected; Referenced by; Sources. Nothing says "verified" or "reviewed", and the data's `statusNotes` are not shown.
- **Duas:** the Arabic is the reader's text; "The full ayah is shown." with the data's own `segmentNote` when `isPartialAyah`; parallel passages as "Also occurs at"; **Transliteration** live from `api.alquran.cloud` (`en.transliteration`) through `TransliterationService`, online only, nothing stored, never generated (an ayah the source cannot answer says so), an offline note, and a passage of more than six ayahs behind a button.
- **Events:** a Chronology section from `chronologyStatus` in the legacy page's sentences, with "During the lifetime of …", "After: …", "Before: …" resolved to names. **Commands:** an Audience section. **Signs:** only the classifications the data uses are offered as chips (3 of the legacy's 5).
- **Library:** the seven legacy bookmark kinds (`community:`, `place:`, `theme:`, `dua:`, `event:`, `sign:`, `command:`) open their pages with the entry's name; all `OPENS_TODAY` flags true.
- **Search:** two new groups, **Duas** and **Knowledge base**, and their chips (`t=duas`, `t=knowledge`), loaded after the page opens (`loadKnowledgeGroups`); stable keys (`<module>:<id>`); the URL-sync guard is untouched.
- **Links in:** story place and event chips and the entity sheet open pages (the "arrives in a later phase" lines are gone); the person page's Family tab lists Connected and Referenced by from the graph.
- **A new additive queue kind** `knowledge` in `quran:audio-queue:v1` (`{module,id}`), rebuilt from the data.

## Decisions and why

| Decision | Alternatives considered | Reason |
| --- | --- | --- |
| One list and one detail for seven modules, an adapter each | Seven page pairs | The data is the same shape; the 14 routes stay one-liners; a fix lands once |
| Basis label in the legacy's words per module, only when not explicit | The prototype's three tags | The data has more values than three; nothing is mapped (decision 3) |
| The data's `statusNotes` are not shown | Show them under "Notes" | They are working notes (they mention code, phases and "manually-verified"). 36 carry a real caveat; app-written plain-words drafts are in `CONTENT_TO_VERIFY.md` and shown nowhere until approved |
| Dua transliteration live, online only, collapsed, nothing stored | Cache it; leave it out | Third-party text; the legacy page fetched it live (decision 2) |
| Signs offer only the classifications in use | All five of the legacy list | Two chips would always show nothing |
| Search groups load their data after the page opens | Import it with Search | The seven datasets are their own chunk; Search's first groups stay instant |
| "Events in the Qur’an" | "Events" | The Ramadan page already has Events |

## Files

- Added: `app/lib/knowledge/*` (see above), `app/components/knowledge/*`, `app/pages/{peoples,places,themes,duas,events,signs,commands}/`, `app/services/transliteration.service.ts`, `tests/knowledge.test.ts`, `tests/knowledgeModules.test.ts`, `tests/fixtures/alquran-translit-2-127.json` (a real answer), `e2e/knowledge.spec.ts`, `e2e/knowledgeModules.spec.ts`, `scripts/live/translit.live.ts`, `scripts/screenshots/phase-12-knowledge.mjs`, `docs/pages/knowledge-list.md`, `docs/pages/knowledge-detail.md`, `docs/design/knowledge-compare/`.
- Changed: `app/lib/libraryItems.ts`, `app/stores/library.ts`, `app/lib/audio*.ts`, `app/stores/player.ts` (the queue kind), `app/lib/stories.ts`, `app/components/stories/*`, `app/components/people/FamilyTab.vue`, `app/lib/searchLocal.ts`, `app/lib/searchQuery.ts`, `app/composables/useSearchPage.ts`, `app/components/search/*`, `e2e/mocks.ts` (`mockTransliteration`), `e2e/stories.spec.ts`, `e2e/search.spec.ts`, `tests/stories.test.ts`, `tests/library.test.ts`.
- Changes to `legacy/` (only by the sync script): the datasets for Themes, Duas and Signs; `graphIndex.ts`; the search utils and validators of all seven modules (`manifest.json` and `README.md` follow).

## Data and storage

- Services: `TransliterationService` (new; `api.alquran.cloud` `/ayah/<s>:<a>/en.transliteration`, kept in memory for the page only); the reader's text through `useQuranText`.
- Storage keys: `quran:bookmarks:v1` (read and written, the legacy keys); `quran:audio-queue:v1` (additive kind). No new key, no new IndexedDB object store, `quran-app-db` is never opened (tests scan for it).
- Migrations: none.

## Offline

- Lists and the entry itself: **A** (bundled; no request). The ayah text: **B** (the reader's cache, with a plain "not on your device yet" line and Try again). The transliteration: **C** (online only, offline note). Tested in the browser with the offline switch (the text and the transliteration, reached in the app because route interception disables the cache); a device check of reopening an entry offline from the installed app is not part of this phase's open list but is the same mechanism as the reader's.

## Verification

- [x] `npm run build`, `npx eslint .`, unit tests: see the result below.
- [x] 1280px and 375px, light and dark: screenshots (`docs/design/knowledge-compare/`), listed there with what was and was not looked at.
- [x] Offline: text and transliteration states, in `e2e/knowledgeModules.spec.ts`.
- [ ] Keyboard and screen-reader pass: card, star and menu are real links and buttons (a keyboard test covers the card link); a screen-reader pass is **not done**.
- [x] Compared against the prototype: `docs/design/knowledge-compare/README.md`.
- [x] Real reader text: six pages captured against the live services, two looked at.
- [x] Live checks of the services by hand: `scripts/live/translit.live.ts` (run once for the fixture's shape).

**Verify result:** **clean, one run, Node 22.23.4 (`.nvmrc`), 2026-10-26, exit 0:** `npm run verify` = build, `eslint .`, **805 unit tests in 47 files**, the dev smoke, and **627 browser tests, all passed, none skipped or retried (18.2 min)**. It was run after the last code change (the Search page description); only documentation, screenshots and the notes in `CONTENT_TO_VERIFY.md` changed after it began. Before it: the knowledge, stories, search, library and people specs (123) and the new module spec (47) had passed on their own, which is where the Library bug was found.

## Review fixes (2026-10-26, after acceptance)

- **Kind popover:** `ResponsiveMenu` takes an `align` prop (default `end`, so no other menu changes); the knowledge list uses `start`, so the menu opens under the button and stays inside the content area at 1280 and 1920 px.
- **Tab strip:** smooth sideways scroll (`scroll-behavior: smooth`, off under reduced motion), a fade at the edge that has more tabs, and the current tab centred on arrival (placed again while the icons and fonts settle). `e2e/knowledgeModules.spec.ts` has four tests for it (1280 and 390 px, the menu at 1280 and 1920 px); screenshots `fix-*.jpg` in `docs/design/knowledge-compare/`.
- **Caveat drafts** rewritten under your rule (only what the Qur'an text states or does not state; never a ruling or a penalty; a pointer to Daily Fiqh or a scholar for rulings): 35 kept or reworded, 1 cut (`ahlalkitab`); the status column says what changed in each. They are still hidden. Two summaries that are the data's own sentences (Theft, Riba) state a penalty or a prohibition and are on the pages today: a question for you in `CONTENT_TO_VERIFY.md`.
- Checked with the knowledge, library and stories browser specs (not a full verify).

## Differences from the prototype

In `docs/design/knowledge-compare/README.md` (both stages).

## Content placeholders replaced

None of the prototype's placeholders were copied: every name, Arabic string, summary and passage is the real legacy data, and the ayah text is the reader's. `docs/CONTENT_TO_VERIFY.md` now holds: the **review list** (17 entries whose basis is not "the Qur'an states it"), the **wording of ours**, and **36 draft reader-facing caveats** (app-written, not shown).

## Open issues and risks

1. **Review of 182 entries of religious content** that carry the legacy author's own "verified" label. Nothing in the app says that; the pages show only the basis label. The review list is the subset the data itself marks weaker.
2. **The 36 caveat drafts** wait for your approval (and wording), and so does whether they appear at all.
3. **The Referenced-by sentence** ("Entries whose own data names X. X’s data does not name them back.") is ours; read it once.
4. **A bug the new tests found in my own stage 1:** the Library's lookup for knowledge entries called itself without end as soon as two modules had loaded (a Library with a saved entry of two kinds went blank, a stack overflow in the console). Fixed (`app/stores/library.ts`, the previous lookup is captured once); `e2e/knowledgeModules.spec.ts` ("the Library") covers all seven kinds together.
5. ~~The kind popover overlapped the sidebar edge on a wide desktop~~ and ~~the tab strip was cut at 1280 px~~: both fixed after review (see "Review fixes").
6. Search with 8 chips wraps to three rows on a phone.
7. Open device checks stay in `docs/DEVICE_CHECKS.md` (Phase 11's).

## Next phase needs

Phase 13 (Daily Fiqh) registers its group in `lib/searchLocal.ts` the same way (`loadKnowledgeGroups` is the model) and uses the `fiqh` Library kind (still `OPENS_TODAY: false`).
